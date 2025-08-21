// app/api/portfolios/upload/route.ts
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'; // <- 여기!
import { cookies } from 'next/headers';
// import type { Database } from '@/lib/database.types'; // 있다면 제네릭에 넣어도 좋음

export const runtime = 'nodejs'; // Edge가 아니면 그대로

export async function POST(req: Request) {
  try {
    // 로그인 세션 쿠키 포함된 서버 클라이언트
    const supabase = createRouteHandlerClient({ cookies }); // <Database> 제네릭 가능

    const { searchParams } = new URL(req.url);
    const folder = searchParams.get('folder') ?? 'portfolios/content'; // ex) portfolios/cover

    const form = await req.formData();

    // 어떤 키(file, image, files[])로 오든 첫 번째 파일만 집어온다
    let file: File | null = null;
    for (const v of form.values()) {
      if (v instanceof File) {
        file = v;
        break;
      }
    }
    if (!file) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }

    const bucket = 'portfolio'; // 실제 사용 중인 버킷명으로
    const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
    const objectPath = `${folder}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from(bucket)
      .upload(objectPath, file, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });

    if (uploadErr) {
      return NextResponse.json({ error: uploadErr.message }, { status: 400 });
    }

    // 공개 URL
    const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
    const url = data.publicUrl;

    // SunEditor 규격 + 기존 썸네일 코드 호환
    return NextResponse.json({
      url,
      result: [{ url, name: file.name, size: file.size }],
    });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
