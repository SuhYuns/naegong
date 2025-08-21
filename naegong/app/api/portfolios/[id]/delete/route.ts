import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

// 쿠키/헤더에서 access token 구하기
async function getAccessToken() {
  const ck = (await cookies()).get('sb-access-token')?.value;
  if (ck) return ck;
  const auth = (await headers()).get('authorization') || (await headers()).get('Authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  return undefined;
}

export async function POST(
  _req: Request,
  ctx: { params: { id: string } }
) {
  const id = ctx.params.id;
  try {
    const accessToken = getAccessToken();
    if (!accessToken) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    // 1) 사용자 컨텍스트가 걸린 anon 클라이언트
    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      }
    );

    const { data: { user }, error: userErr } = await supabaseUser.auth.getUser();
    if (userErr || !user) {
      return NextResponse.json({ error: '세션이 만료되었거나 로그인되지 않았습니다.' }, { status: 401 });
    }

    // 2) 운영자인지 확인
    const { data: prof } = await supabaseUser
      .from('profiles')
      .select('is_manager')
      .eq('id', user.id)
      .maybeSingle();
    const isManager = !!prof?.is_manager;

    // 3) 작성자인지 확인 (포트폴리오 → 상점 owner_id 조인)
    const { data: row, error: rowErr } = await supabaseUser
      .from('portfolios')
      .select('store:stores!portfolios_store_id_fkey ( owner_id )')
      .eq('id', id)
      .single();

    if (rowErr || !row) {
      return NextResponse.json({ error: '대상을 찾을 수 없습니다.' }, { status: 404 });
    }
    const ownerId = (row as any).store?.owner_id as string | undefined;
    const isAuthor = !!ownerId && ownerId === user.id;

    if (!isAuthor && !isManager) {
      return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 });
    }

    // 4) 실제 삭제는 Service Role로 (RLS 우회)
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // 서버 전용, 공개 금지
      { auth: { persistSession: false } }
    );

    const { error: delErr } = await admin.from('portfolios').delete().eq('id', id);
    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message ?? '서버 오류' }, { status: 500 });
  }
}
