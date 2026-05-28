import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('payment_status'); // MP also sends payment_status
    const externalReference = searchParams.get('external_reference');
    const email = searchParams.get('email') || '';

    const isSuccess = status === 'success' || status === 'approved' || paymentStatus === 'approved';

    if (!supabase) {
      return NextResponse.redirect(new URL('/login?registered=error&reason=db', req.url));
    }

    if (isSuccess && externalReference) {
      // Activate the tenant subscription
      const { error } = await supabase
        .from('tenants')
        .update({ subscription_status: 'active' })
        .eq('id', externalReference);

      if (error) {
        console.error("Error activating subscription in callback:", error);
        return NextResponse.redirect(new URL('/login?registered=error&reason=activation', req.url));
      }

      // Redirect to login page with success state
      return NextResponse.redirect(
        new URL(`/login?registered=success&email=${encodeURIComponent(email)}`, req.url)
      );
    }

    // Payment failed or cancelled
    return NextResponse.redirect(
      new URL('/login?registered=error&reason=payment_failed', req.url)
    );

  } catch (err) {
    console.error("Callback error:", err);
    return NextResponse.redirect(new URL('/login?registered=error', req.url));
  }
}
