'use client';

import { useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const supabase = useSupabaseClient();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    if (!email || !pw) return alert('이메일과 비밀번호를 입력하세요.');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    setLoading(false);
    if (error) {
      console.error(error);
      alert('로그인 실패: ' + error.message);
      return;
    }
    router.replace('/manage');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white border rounded-lg p-6 space-y-4">
        <h1 className="text-xl font-semibold">관리자 로그인</h1>
        <input
          type="email"
          placeholder="admin@naegong.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
        <button
          onClick={onLogin}
          disabled={loading}
          className="w-full px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
        >
          {loading ? '로그인 중…' : '로그인'}
        </button>
      </div>
    </div>
  );
}
