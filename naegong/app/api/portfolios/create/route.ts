import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function POST(req: Request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const body = await req.json();

  const payload = {
    store_id: body.storeId,
    project_title: body.projectTitle,
    type: body.type || null,
    area: body.area ?? null,
    location: body.location || null,
    style: body.style || null,
    duration: body.duration ?? null,
    personnel: body.personnel ?? null,
    tags: body.tags ?? [],
    content: body.content || '',         // <-- content_html 아님!
    cover_url: body.coverUrl || null,
    published: !!body.published,
  };

  const { data, error } = await supabase
    .from('portfolios')
    .insert(payload)
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ id: data.id });
}
