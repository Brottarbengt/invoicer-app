import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, listPublicUsers } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('invoicer_session')?.value;
  const user = getSessionUser(token);
  const users = listPublicUsers();

  if (!user) {
    return NextResponse.json({
      authenticated: false,
      availableUsers: users,
    });
  }

  return NextResponse.json({
    authenticated: true,
    user,
    availableUsers: users,
  });
}
