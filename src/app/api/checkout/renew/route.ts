import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

const MP_ACCESS_TOKEN = 'APP_USR-5493793433155421-052814-0bf808957f5222cf0920e14d72d99507-3432268245';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tenantId,
      email,
      plan,
      paymentMethod,
      cardToken,
      paymentMethodId,
      pixFirstName,
      pixLastName,
      pixCpf,
      isLocalStorageFallback
    } = body;

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID não informado' }, { status: 400 });
    }

    const planType = plan === 'enterprise' ? 'enterprise' : 'personal';
    const price = planType === 'enterprise' ? 94.90 : 29.90;
    const planName = planType === 'enterprise' ? 'Renovação Slotfy - Plano Empresarial' : 'Renovação Slotfy - Plano Pessoal';

    let paymentStatus = 'pending';
    let subscriptionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    let pixData = null;

    // 1. Process payment via Mercado Pago
    if (paymentMethod === 'credit_card') {
      const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': `cc-renew-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        },
        body: JSON.stringify({
          transaction_amount: price,
          token: cardToken,
          description: planName,
          installments: 1,
          payment_method_id: paymentMethodId || 'visa',
          payer: {
            email: email || 'financeiro@slotfy.com',
            identification: {
              type: 'CPF',
              number: (pixCpf || '12345678909').replace(/\D/g, '')
            }
          }
        })
      });

      if (!mpResponse.ok) {
        const errText = await mpResponse.text();
        console.error("Mercado Pago CC renewal error:", errText);
        throw new Error("Falha ao processar pagamento com cartão de crédito.");
      }

      const paymentResult = await mpResponse.json();
      if (paymentResult.status === 'approved') {
        paymentStatus = 'active';
      } else {
        throw new Error(`Pagamento não aprovado. Status: ${paymentResult.status}`);
      }
    } else if (paymentMethod === 'pix') {
      const cleanCpf = (pixCpf || '12345678909').replace(/\D/g, '');
      const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': `pix-renew-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        },
        body: JSON.stringify({
          transaction_amount: price,
          payment_method_id: 'pix',
          description: planName,
          payer: {
            email: email || 'financeiro@slotfy.com',
            first_name: pixFirstName || 'Cliente',
            last_name: pixLastName || 'Slotfy',
            identification: {
              type: 'CPF',
              number: cleanCpf
            }
          }
        })
      });

      if (!mpResponse.ok) {
        const errText = await mpResponse.text();
        console.error("Mercado Pago Pix renewal error:", errText);
        throw new Error("Falha ao gerar Pix de pagamento.");
      }

      const paymentResult = await mpResponse.json();
      pixData = {
        qr_code: paymentResult.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: paymentResult.point_of_interaction?.transaction_data?.qr_code_base64,
        ticket_url: paymentResult.point_of_interaction?.transaction_data?.ticket_url,
        payment_id: paymentResult.id
      };
      paymentStatus = 'inactive';
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

    // 3. Update Supabase
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase não está configurado no servidor.' },
        { status: 500 }
      );
    }

    const { error: updateErr } = await supabase
      .from('tenants')
      .update({
        subscription_status: paymentStatus,
        subscription_expires_at: subscriptionExpiresAt,
        plan_type: planType
      })
      .eq('id', tenantId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      paymentRequired: paymentMethod === 'pix',
      subscription_status: paymentStatus,
      subscription_expires_at: subscriptionExpiresAt,
      pixData
    });

  } catch (err: any) {
    console.error("API renewal error:", err);
    return NextResponse.json({ error: err.message || 'Erro interno do servidor' }, { status: 500 });
  }
}
