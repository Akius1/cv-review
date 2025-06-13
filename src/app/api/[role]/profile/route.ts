/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/[role]/profile/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient }           from '@supabase/supabase-js';
import { verifyToken }            from '@/lib/auth/utils';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest, { params }: { params: { role: string } }) {
  // verify JWT, extract user_id & user_type
  const cookie = req.cookies.get('auth_token')?.value;
  const payload = await verifyToken(cookie || '');
  if (!payload || payload.user_type !== params.role) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const table = params.role === 'expert' ? 'expert_profiles' : 'applicant_profiles';
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('user_id', payload.id)
    .single();

  if (error && error.code === 'PGRST116') {
    // no profile yet
    return NextResponse.json({}, { status: 200 });
  }
  if (error) return NextResponse.json({ error }, { status: 500 });

  return NextResponse.json(data, { status: 200 });
}

export async function PUT(req: NextRequest, { params }: { params: { role: string } }) {
  const body: any = await req.json();
  const cookie = req.cookies.get('auth_token')?.value;
  const payload = await verifyToken(cookie || '');
  if (!payload || payload.user_type !== params.role) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const table = params.role === 'expert' ? 'expert_profiles' : 'applicant_profiles';
  // upsert on user_id
  const { data, error } = await supabase
    .from(table)
    .upsert({ user_id: payload.id, ...body })
    .select()
    .single();

  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json(data, { status: 200 });
}
