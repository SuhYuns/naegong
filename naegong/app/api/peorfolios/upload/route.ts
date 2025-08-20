// app/api/portfolios/upload/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const url = new URL(req.url);
    const type = (url.searchParams.get('type') || 'gallery').toLowerCase(); // cover | gallery
    const form = await req.formData();
    const file = form.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }

    const folder = type === 'cover' ? 'cover' : 'gallery';
    const fileName = `${Date.now()}-${file.name}`;
    const path = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase
      .storage
      .from('portfolio')
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) throw uploadError;

    const { data: pub } = supabase
      .storage
      .from('portfolio')
      .getPublicUrl(path);

    return NextResponse.json({ url: pub.publicUrl, path }, { status: 200 });
  } catch (e: any) {
    console.error('upload error:', e);
    return NextResponse.json({ error: e.message ?? 'Upload failed' }, { status: 500 });
  }
}
