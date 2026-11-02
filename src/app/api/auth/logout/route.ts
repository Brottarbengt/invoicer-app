import { NextRequest, NextResponse } from 'next/server';
import { deleteSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('invoicer_session')?.value;
  if (token) {
    deleteSession(token);
  }

  const res = NextResponse.json({ success: true });
  res.cookies.delete('invoicer_session');
  return res;
}
