// app/api/portfolios/[id]/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service Role 클라이언트
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 토큰에서 유저 ID 얻기
async function userIdFrom(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  return error ? null : data.user?.id ?? null;
}

async function isOwner(userId: string, portfolioId: string) {
  const { data: p } = await admin.from('portfolios')
    .select('store_id').eq('id', portfolioId).single();
  if (!p?.store_id) return false;

  const { data: s } = await admin.from('stores')
    .select('owner_id').eq('id', p.store_id).single();

  return s?.owner_id === userId;
}

async function isManager(userId: string) {
  const { data } = await admin.from('profiles')
    .select('is_manager').eq('id', userId).single();
  return !!data?.is_manager;
}

function bad(msg: string, code = 400) {
  return NextResponse.json({ error: msg }, { status: code });
}

// ⬇️ Next 15 대응: 두 번째 인자는 any(혹은 RouteContext)로 받고,
//    id는 `await ctx.params`에서 꺼냅니다.

// 수정
export async function PATCH(req: NextRequest, ctx: any) {
  const { id } = await ctx.params as { id: string };

  const uid = await userIdFrom(req);
  if (!uid) return bad('세션이 만료되었거나 로그인되지 않았습니다.', 401);

  const allowed = (await isOwner(uid, id)) || (await isManager(uid));
  if (!allowed) return bad('권한이 없습니다.', 403);

  const body = await req.json();
  const payload = {
    project_title: body.project_title ?? null,
    type: body.type ?? null,
    area: body.area ?? null,
    location: body.location ?? null,
    style: body.style ?? null,
    duration: body.duration ?? null,
    personnel: body.personnel ?? null,
    tags: body.tags ?? null,
    content: body.content ?? '',
    cover_url: body.cover_url ?? null,
    published: body.published ?? true,
    updated_at: new Date().toISOString(),
  };

  const { error } = await admin.from('portfolios').update(payload).eq('id', id);
  if (error) return bad(error.message, 500);

  return NextResponse.json({ ok: true });
}

// 삭제
export async function DELETE(req: NextRequest, ctx: any) {
  const { id } = await ctx.params as { id: string };

  const uid = await userIdFrom(req);
  if (!uid) return bad('세션이 만료되었거나 로그인되지 않았습니다.', 401);

  const allowed = (await isOwner(uid, id)) || (await isManager(uid));
  if (!allowed) return bad('권한이 없습니다.', 403);

  const { error } = await admin.from('portfolios').delete().eq('id', id);
  if (error) return bad(error.message, 500);

  return NextResponse.json({ ok: true });
}
