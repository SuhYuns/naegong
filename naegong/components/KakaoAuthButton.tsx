// components/KakaoAuthButton.tsx
'use client';

import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';

export default function KakaoAuthButton() {
  const supabase = useSupabaseClient();
  const router = useRouter();

  const handleLogin = async () => {
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/login`,
        scopes: 'profile_nickname,profile_image,account_email', 
      },
    });
    if (error) console.error('Kakao 로그인 오류:', error.message);
  };

  return (
    <button
      onClick={handleLogin}
      className="px-6 py-3 bg-yellow-400 text-white rounded-md hover:bg-yellow-500"
    >
        <p className="inline-flex items-center space-x-3">
            <img src="/kakaotalk.png" alt="Service Logo" className="h-3" />
            <span className='text-sm'>카카오로 로그인</span>
        </p>
    </button>
  );
}
