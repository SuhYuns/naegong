// app/manage/page.tsx
import Link from 'next/link';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/database';

export default async function ManagePage() {
  // Supabase 서버 클라이언트 생성
  const supabase = createServerComponentClient<Database>({ cookies });

  // status = 0(신청)인 앱 개수 조회
  const { data, error } = await supabase
    .from('provider_applications')
    .select('id', { count: 'exact' })
    .eq('status', 0);

  const pendingCount = data && !error ? data.length : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/manage/applicants"
        className="relative inline-block px-6 py-3 bg-yellow-500 text-white rounded-md hover:brightness-90"
      >
        장인 신청자
        {pendingCount > 0 && (
          <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 rounded-full">
            {pendingCount}
          </span>
        )}
      </Link>
    </div>
  );
}
