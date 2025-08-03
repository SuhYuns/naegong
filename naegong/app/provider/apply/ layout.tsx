// app/provider/apply/layout.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/database';

export const revalidate = 0; // 매 요청마다 실행

export default async function ApplyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1) Supabase 서버 클라이언트 생성 (SSR)
  const supabase = createServerComponentClient<Database>({
    cookies,
  });

  // 2) 세션 가져오기
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // 3) 로그인 안 되어 있으면 /login 으로
  if (!session) {
    redirect('/login');
  }

  // 4) 프로필 조회
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_provider')
    .eq('id', session.user.id)
    .single();

  // 5) 이미 시공자(1) 또는 심사중(2) 이면 /provider 로 보내버림
  if (profile?.is_provider !== 0) {
    redirect('/provider');
  }

  // 6) 기존 신청 내역이 있으면 /provider 로
  const { data: apps } = await supabase
    .from('provider_applications')
    .select('id,status')
    .eq('applicant_id', session.user.id)
    .limit(1);

  if (apps && apps.length > 0) {
    redirect('/provider');
  }

  // 여기까지 통과한 사용자만 children(render form) 보기
  return <>{children}</>;
}
