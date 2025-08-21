import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

const BUCKET = 'portfolio';

export async function POST(req: Request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const url = new URL(req.url);
  // folder 또는 type로 폴더 결정 (둘 중 뭐든 사용)
  const folder =
    url.searchParams.get('folder') ??
    url.searchParams.get('type') ??
    'portfolios/content';

  const form = await req.formData();

  // SunEditor는 'file-0' 등 다양한 키를 씁니다. 첫 번째 File을 잡아옵니다.
  let file: File | null = null;
  for (const [, v] of form) {
    if (v instanceof File) { file = v; break; }
  }
  if (!file) return NextResponse.json({ error: 'file is required' }, { status: 400 });

  const ext = file.name.split('.').pop() || 'bin';
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
