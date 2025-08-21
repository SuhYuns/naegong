// app/api/uploadImage/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 서버 전용 키 필요 (env 설정 필수)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // server only
const BUCKET = 'portfolio';

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const folder = url.searchParams.get('folder') || 'misc';

    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    const ext = file.name.split('.').pop();
    const key = `${folder}/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext || 'bin'}`;

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(key, file, { contentType: file.type });

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(key);
    const publicUrl = pub.publicUrl;

    // SunEditor 기본 업로더는 result 배열을 선호 → 둘 다 내려줌
    return NextResponse.json({
      url: publicUrl,
      result: [{ url: publicUrl, name: file.name, size: (file as any).size ?? 0 }],
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'upload failed' }, { status: 500 });
  }
}
