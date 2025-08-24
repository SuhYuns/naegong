import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ───────────────────────────────────────────────────────────────
// Supabase Admin (Service Role)
// ───────────────────────────────────────────────────────────────
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // SERVER ONLY
);

// Authorization: Bearer <jwt>
async function getUserIdFromRequest(req: Request) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.toLowerCase().startsWith('bearer ')
    ? auth.slice(7)
    : null;
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

async function isManager(userId: string) {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('is_manager')
    .eq('id', userId)
    .single();
  return !!data?.is_manager;
}

async function isOwner(userId: string, portfolioId: string) {
  // 1) 포트폴리오의 store_id 조회
  const { data: p, error: e1 } = await supabaseAdmin
    .from('portfolios')
    .select('store_id')
    .eq('id', portfolioId)
    .single();
  if (e1 || !p) return false;

  // 2) stores.owner_id 비교
  const { data: s, error: e2 } = await supabaseAdmin
    .from('stores')
    .select('owner_id')
    .eq('id', p.store_id)
    .single();
  if (e2 || !s) return false;

  return s.owner_id === userId;
}

function bad(msg: string, code = 400) {
  return NextResponse.json({ error: msg }, { status: code });
}

// ───────────────────────────────────────────────────────────────
// PATCH /api/portfolios/[id]   (수정)
// body:{
//   project_title, type, area, location, style,
//   duration, personnel, tags(string[]), content, cover_url, published
// }
// ───────────────────────────────────────────────────────────────
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const uid = await getUserIdFromRequest(req);
    if (!uid) return bad('세션이 만료되었거나 로그인되지 않았습니다.', 401);

    const allowed = (await isOwner(uid, params.id)) || (await isManager(uid));
    if (!allowed) return bad('권한이 없습니다.', 403);

    const body = await req.json();

    const updatePayload = {
      project_title: body.project_title ?? null,
      type: body.type ?? null,
      area: body.area ?? null,
      location: body.location ?? null,
      style: body.style ?? null,
      duration: body.duration ?? null,
      personnel: body.personnel ?? null,
      tags: body.tags ?? null, // string[]
      content: body.content ?? '',
      cover_url: body.cover_url ?? null,
      published: body.published ?? true,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('portfolios')
      .update(updatePayload)
      .eq('id', params.id)
      .select('id')
      .single();

    if (error) return bad(error.message, 500);

    return NextResponse.json({ ok: true, id: data.id });
  } catch (e: any) {
    return bad(e.message ?? 'unknown error', 500);
  }
}

// ───────────────────────────────────────────────────────────────
// DELETE /api/portfolios/[id]  (삭제)
// ───────────────────────────────────────────────────────────────
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const uid = await getUserIdFromRequest(req);
    if (!uid) return bad('세션이 만료되었거나 로그인되지 않았습니다.', 401);

    const allowed = (await isOwner(uid, params.id)) || (await isManager(uid));
    if (!allowed) return bad('권한이 없습니다.', 403);

    const { error } = await supabaseAdmin
      .from('portfolios')
      .delete()
      .eq('id', params.id);

    if (error) return bad(error.message, 500);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return bad(e.message ?? 'unknown error', 500);
  }
}

// (선택) 필요하면 GET으로 한건 조회도 추가 가능
// export async function GET(req: Request, { params }: { params: { id: string } }) { ... }
