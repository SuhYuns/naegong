// app/api/portfolios/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function POST(req: Request) {
  const body = await req.json();

  const {
    storeId,
    projectTitle,
    type,
    area,
    location,
    style,
    duration,
    personnel,
    tags,
    content,
    coverUrl,
    images = [],
  } = body || {};

  if (!storeId || !projectTitle || !content) {
    return NextResponse.json({ error: '필수 항목(storeId, projectTitle, content) 누락' }, { status: 400 });
  }

  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    // 소유 확인
    const { data: store, error: se } = await supabase
      .from('stores')
      .select('id, owner_id')
      .eq('id', storeId)
      .single();

    if (se) throw se;
    if (!store || store.owner_id !== user.id) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    // portfolios insert
    const { data: inserted, error: ie } = await supabase
      .from('portfolios')
      .insert({
        store_id: storeId,
        project_title: projectTitle,
        type,
        area,
        location,
        style,
        duration,
        personnel,
        tags,
        content,
        cover_url: coverUrl,
        published: true,
      })
      .select('id')
      .single();

    if (ie) throw ie;

    // images insert
    if (Array.isArray(images) && images.length) {
      const rows = images.map((url: string, idx: number) => ({
        portfolio_id: inserted.id,
        url,
        sort_order: idx,
      }));
      const { error: pie } = await supabase.from('portfolio_images').insert(rows);
      if (pie) throw pie;
    }

    return NextResponse.json({ id: inserted.id });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message || '저장 실패' }, { status: 500 });
  }
}
