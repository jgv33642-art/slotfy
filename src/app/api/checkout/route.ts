import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

const MP_ACCESS_TOKEN = 'APP_USR-5493793433155421-052814-0bf808957f5222cf0920e14d72d99507-3432268245';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      password,
      tenantName,
      whatsappNumber,
      address,
      niche,
      plan,
      billingCycle,
      paymentMethod,
      cardToken,
      paymentMethodId,
      pixFirstName,
      pixLastName,
      pixCpf,
      isLocalStorageFallback
    } = body;

    const planType = plan === 'enterprise' ? 'enterprise' : 'personal';
    const isYearly = billingCycle === 'yearly';
    const durationDays = isYearly ? 365 : 30;
    
    let price = planType === 'enterprise' ? 94.90 : 29.90;
    if (isYearly) {
      price = planType === 'enterprise' ? 1081.86 : 340.86;
    }
    
    const planName = planType === 'enterprise' 
      ? `Slotfy - Plano Empresarial (${isYearly ? 'Anual' : 'Mensal'})` 
      : `Slotfy - Plano Pessoal (${isYearly ? 'Anual' : 'Mensal'})`;

    let paymentStatus = 'pending';
    let subscriptionExpiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
    let pixData = null;

    // 1. Process Payment with Mercado Pago
    if (paymentMethod === 'credit_card') {
      const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': `cc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        },
        body: JSON.stringify({
          transaction_amount: price,
          token: cardToken,
          description: planName,
          installments: 1,
          payment_method_id: paymentMethodId || 'visa',
          payer: {
            email: email,
            identification: {
              type: 'CPF',
              number: (pixCpf || '12345678909').replace(/\D/g, '')
            }
          }
        })
      });

      if (!mpResponse.ok) {
        const errText = await mpResponse.text();
        console.error("Mercado Pago CC payment error response:", errText);
        throw new Error("Falha ao processar pagamento com cartão de crédito no Mercado Pago.");
      }

      const paymentResult = await mpResponse.json();
      if (paymentResult.status === 'approved') {
        paymentStatus = 'active';
      } else {
        paymentStatus = 'past_due';
        throw new Error(`Pagamento não aprovado. Status: ${paymentResult.status_detail || paymentResult.status}`);
      }
    } else if (paymentMethod === 'pix') {
      const cleanCpf = (pixCpf || '12345678909').replace(/\D/g, '');
      const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': `pix-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        },
        body: JSON.stringify({
          transaction_amount: price,
          payment_method_id: 'pix',
          description: planName,
          payer: {
            email: email,
            first_name: pixFirstName || name.split(' ')[0] || 'Cliente',
            last_name: pixLastName || name.split(' ').slice(1).join(' ') || 'Slotfy',
            identification: {
              type: 'CPF',
              number: cleanCpf
            }
          }
        })
      });

      if (!mpResponse.ok) {
        const errText = await mpResponse.text();
        console.error("Mercado Pago Pix payment error response:", errText);
        throw new Error("Falha ao gerar Pix de pagamento no Mercado Pago.");
      }

      const paymentResult = await mpResponse.json();
      pixData = {
        qr_code: paymentResult.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: paymentResult.point_of_interaction?.transaction_data?.qr_code_base64,
        ticket_url: paymentResult.point_of_interaction?.transaction_data?.ticket_url,
        payment_id: paymentResult.id
      };
      paymentStatus = 'inactive'; // remains inactive until paid
    }

    // 2. If it is LocalStorage Fallback, we return success here (saving client-side is handled by frontend)
    if (isLocalStorageFallback) {
      return NextResponse.json({
        success: true,
        paymentRequired: paymentMethod === 'pix',
        subscription_status: paymentStatus,
        subscription_expires_at: subscriptionExpiresAt,
        pixData
      });
    }

    // 3. Register in Supabase (Production DB mode)
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase não está configurado no servidor.' },
        { status: 500 }
      );
    }

    // Generate unique slug
    let slug = tenantName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const { data: existingTenant } = await supabase
      .from('tenants')
      .select('slug')
      .eq('slug', slug)
      .maybeSingle();

    if (existingTenant) {
      slug = `${slug}-${Math.random().toString(36).substr(2, 4)}`;
    }

    const { data: tenantData, error: tenantErr } = await supabase
      .from('tenants')
      .insert({
        name: tenantName,
        slug,
        niche,
        whatsapp_number: whatsappNumber,
        address,
        subscription_status: paymentStatus,
        plan_type: planType,
        subscription_expires_at: subscriptionExpiresAt
      })
      .select()
      .single();

    if (tenantErr) {
      return NextResponse.json({ error: tenantErr.message }, { status: 400 });
    }

    // Create Admin Auth User and Profile
    if (password) {
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      });

      if (authErr) {
        // Rollback tenant creation
        await supabase.from('tenants').delete().eq('id', tenantData.id);
        return NextResponse.json({ error: authErr.message }, { status: 400 });
      }

      if (authData.user) {
        await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            tenant_id: tenantData.id,
            name,
            email,
            role: 'admin'
          });
      }
    }

    return NextResponse.json({
      success: true,
      paymentRequired: paymentMethod === 'pix',
      subscription_status: paymentStatus,
      subscription_expires_at: subscriptionExpiresAt,
      pixData
    });

  } catch (err: any) {
    console.error("API checkout error:", err);
    return NextResponse.json({ error: err.message || 'Erro interno do servidor' }, { status: 500 });
  }
}
