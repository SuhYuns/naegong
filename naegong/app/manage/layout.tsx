// app/manage/layout.tsx
import { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/database';

export const revalidate = 0; // 항상 최신 인증 상태 확인

export default async function ManageLayout({ children }: { children: ReactNode }) {
  // 1) Supabase 서버 클라이언트 생성
  const supabase = createServerComponentClient<Database>({ cookies });

  // 2) 세션 확인
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    // 로그인되지 않은 경우 로그인 페이지로
    redirect('/login');
  }

  // 3) 매니저 여부 조회
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_manager')
    .eq('id', session.user.id)
    .single();

  if (error || !profile || !profile.is_manager) {
    // 권한 없으면 홈으로
    redirect('/');
  }

  // 4) 관리 페이지 레이아웃 렌더
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-semibold">관리자 대시보드</h1>
        </div>
      </header>
      <main className="container mx-auto p-4">{children}</main>
    </div>
  );
}
