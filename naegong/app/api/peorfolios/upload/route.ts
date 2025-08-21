// app/api/portfolios/upload/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const url = new URL(req.url);
    const type = (url.searchParams.get('type') || 'editor').toLowerCase(); // cover | editor
    const form = await req.formData();
    const file = form.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }

    const folder = type === 'cover' ? 'cover' : 'editor';
    const fileName = `${Date.now()}-${file.name}`;
    const path = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase
      .storage
      .from('portfolio')
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) throw uploadError;

    const { data: pub } = supabase.storage.from('portfolio').getPublicUrl(path);

    // 페이지에서는 { url } 사용, SunEditor는 onImageUploadBefore의 uploadHandler로 바로 삽입
    return NextResponse.json({ url: pub.publicUrl, path }, { status: 200 });
  } catch (e: any) {
    console.error('[upload] error', e);
    return NextResponse.json({ error: e.message ?? 'Upload failed' }, { status: 500 });
  }
}
