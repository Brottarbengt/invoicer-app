import { NextRequest, NextResponse } from 'next/server';
import { createNewUser } from '@/lib/auth';
import { getDatabase } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { name, pin, companyName, personNumber } = await req.json();

    if (!name || !pin) {
      return NextResponse.json({ success: false, error: 'Namn och PIN krävs' }, { status: 400 });
    }

    const cleanId = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || `user-${Date.now()}`;

    const db = getDatabase();
    const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(cleanId);
    const userId = existing ? `${cleanId}-${Date.now()}` : cleanId;

    createNewUser(userId, name, String(pin), companyName, personNumber);

    return NextResponse.json({ success: true, userId });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
