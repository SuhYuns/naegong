// app/login/page.tsx
'use client';

import KakaoAuthButton from '@/components/KakaoAuthButton';
import useProfile from '@/hooks/useProfile';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const session = useSession();
  const supabase = useSupabaseClient();
  const router = useRouter();
  const { profile, loading } = useProfile();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return <p className="flex items-center justify-center min-h-screen">로딩 중…</p>;
  }

  if (session?.user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        {/* OAuth 프로필 */}
        {session.user.user_metadata.avatar_url && (
          <img
            src={session.user.user_metadata.avatar_url}
            alt="Profile"
            className="h-24 w-24 rounded-full object-cover"
          />
        )}
        <p className="text-lg">내공과 함께해요, {session.user.user_metadata.nickname || session.user.email}님!</p>

        {/* 추가 입력된 상세 프로필 */}
        {profile ? (
          <div className="space-y-1 text-center">
            <p>성별: {profile.gender ?? '미정'}</p>
            <p>주소: {profile.address ?? '미입력'}</p>
            <p>출생연도: {profile.birth_year ?? '미입력'}</p>
            <p>전화번호: {profile.phone_number ?? '미입력'}</p>
            <p>매니저: {profile.is_manager ? '예' : '아니오'}</p>
            <p>
              시공자 상태:{' '}
              {profile.is_provider === 0
                ? '고객'
                : profile.is_provider === 1
                ? '시공자'
                : '심사중'}
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">상세 프로필을 입력해 주세요.</p>
        )}

        <button
          onClick={handleLogout}
          className="px-4 py-2 mt-6 bg-red-500 text-white rounded hover:bg-red-600"
        >
          로그아웃
        </button>
      </div>
    );
  }

  // 로그인 전
  return (
    <div className="flex items-center justify-center min-h-screen">
      <KakaoAuthButton />
    </div>
  );
}
