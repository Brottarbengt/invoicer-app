import { NextRequest, NextResponse } from 'next/server';
import { createSession, getSessionUser, verifyPin } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { userId, pin } = await req.json();

    if (!userId || !pin) {
      return NextResponse.json({ success: false, error: 'Ange användare och PIN-kod' }, { status: 400 });
    }

    const isValid = verifyPin(userId, String(pin));
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Fel PIN-kod. Försök igen.' }, { status: 401 });
    }

    const session = createSession(userId);
    const user = getSessionUser(session.token);

    const res = NextResponse.json({
      success: true,
      user,
    });

    // Set HTTP-only cookie, 30 days expiry
    res.cookies.set('invoicer_session', session.token, {
      httpOnly: true,
      secure: false, // allow http on local IP network
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return res;
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Inloggningsfel' }, { status: 500 });
  }
}
