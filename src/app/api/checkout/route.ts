import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, tenantName, whatsappNumber, address, niche, plan } = body;

    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase não está configurado no servidor.' },
        { status: 500 }
      );
    }

    // 1. Generate slug
    let slug = tenantName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    // Check if slug already exists
    const { data: existingTenant } = await supabase
      .from('tenants')
      .select('slug')
      .eq('slug', slug)
      .maybeSingle();

    if (existingTenant) {
      slug = `${slug}-${Math.random().toString(36).substr(2, 4)}`;
    }

    // 2. Check if Mercado Pago is active
    const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const isMpActive = !!mpAccessToken && mpAccessToken !== 'YOUR_MERCADOPAGO_ACCESS_TOKEN_HERE';

    // 3. Create Tenant (inactive if MP active, else active for simulation)
    const subscriptionStatus = isMpActive ? 'inactive' : 'active';
    const planType = plan === 'enterprise' ? 'enterprise' : 'personal';

    const { data: tenantData, error: tenantErr } = await supabase
      .from('tenants')
      .insert({
        name: tenantName,
        slug,
        niche,
        whatsapp_number: whatsappNumber,
        address,
        subscription_status: subscriptionStatus,
        plan_type: planType
      })
      .select()
      .single();

    if (tenantErr) {
      return NextResponse.json({ error: tenantErr.message }, { status: 400 });
    }

    // 4. Create Admin Auth Account
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
        const { error: profileErr } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            tenant_id: tenantData.id,
            name,
            email,
            role: 'admin'
          });

        if (profileErr) {
          console.error("Error creating profile in API:", profileErr);
        }
      }
    }

    // 5. Generate Mercado Pago preference if active
    if (isMpActive) {
      const price = planType === 'enterprise' ? 94.90 : 29.90;
      const planName = planType === 'enterprise' ? 'Slotfy - Plano Empresarial' : 'Slotfy - Plano Pessoal';

      const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mpAccessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: [
            {
              title: planName,
              quantity: 1,
              unit_price: price,
              currency_id: 'BRL'
            }
          ],
          back_urls: {
            success: `${siteUrl}/api/checkout/callback?status=success&email=${encodeURIComponent(email)}`,
            failure: `${siteUrl}/api/checkout/callback?status=failure`,
            pending: `${siteUrl}/api/checkout/callback?status=pending`
          },
          auto_return: 'approved',
          external_reference: tenantData.id
        })
      });

      if (!mpResponse.ok) {
        const mpErrorText = await mpResponse.text();
        console.error("Mercado Pago Preference API error:", mpErrorText);
        // Fallback: activate subscription since payment gateway call failed
        await supabase
          .from('tenants')
          .update({ subscription_status: 'active' })
          .eq('id', tenantData.id);
          
        return NextResponse.json({
          url: '/dashboard',
          paymentRequired: false,
          warning: 'Falha ao conectar com Mercado Pago. Conta ativada automaticamente.'
        });
      }

      const mpData = await mpResponse.json();
      return NextResponse.json({
        url: mpData.init_point,
        paymentRequired: true
      });
    }

    // 6. Simulation mode success
    return NextResponse.json({
      url: '/dashboard',
      paymentRequired: false
    });

  } catch (err: any) {
    console.error("Api checkout error:", err);
    return NextResponse.json({ error: err.message || 'Erro interno do servidor' }, { status: 500 });
  }
}
