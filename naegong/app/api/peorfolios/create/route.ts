// app/api/portfolios/create/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const body = await req.json();

    const {
      storeId,
      projectTitle,
      type,
      area,
      location,
      style,
      images,
      duration,
      personnel,
      tags,
      content,
      coverUrl,
      published = true,
    } = body;

    if (!storeId || !projectTitle) {
      return NextResponse.json({ error: 'storeId, projectTitle는 필수입니다.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('portfolios')
      .insert({
        store_id: storeId,
        project_title: projectTitle,
        type,
        area,
        location,
        style,
        images,
        duration,
        personnel,
        tags,
        content_html: content,
        cover_url: coverUrl,
        published,
      })
      .select('id')
      .single();

    if (error) throw error;

    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch (e: any) {
    console.error('create portfolio error:', e);
    return NextResponse.json({ error: e.message ?? 'Server error' }, { status: 500 });
  }
}
