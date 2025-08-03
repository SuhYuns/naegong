// app/provider/apply/page.tsx
'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';
import useProfile from '@/hooks/useProfile';

export default function ProviderApplicationForm() {
  const session = useSession();
  const supabase = useSupabaseClient();
  const router = useRouter();
  const { profile, loading } = useProfile();

  // form state
  const [businessRegFile, setBusinessRegFile] = useState<File | null>(null);
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [memo, setMemo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!session?.user) {
      router.push('/login');
    }
  }, [session, router]);

  if (loading) return <p>로딩 중...</p>;
  if (!session?.user || !profile) return null;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setBusinessRegFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!businessRegFile) return alert('사업자등록증 파일을 업로드 해주세요.');
    setSubmitting(true);
    // 1) 업로드: Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('documents')
      .upload(`business_reg/${session.user.id}/${businessRegFile.name}`, businessRegFile);
    if (uploadError) {
      console.error(uploadError);
      alert('파일 업로드 실패');
      setSubmitting(false);
      return;
    }
    const businessRegUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/documents/${uploadData.path}`;

    // 2) 레코드 삽입
    const { error: insertError } = await supabase
      .from('provider_applications')
      .insert({
        applicant_id: session.user.id,
        business_reg: businessRegUrl,
        portfolio: portfolioUrl,
        memo: memo,
      });
    if (insertError) {
      console.error(insertError);
      alert('신청 제출 실패');
      setSubmitting(false);
      return;
    }

    alert('신청이 제출되었습니다. 심사 후 안내드리겠습니다.');
    router.push('/provider');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <h1 className="text-2xl font-semibold mb-6">장인 신청하기</h1>

      <div className="space-y-4 mb-6">
        {/* read-only profile fields */}
        <div>
          <label className="block text-sm font-medium text-gray-700">이름</label>
          <p className="mt-1">{session.user.user_metadata?.nickname || session.user.email}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">지역</label>
          <p className="mt-1">{profile.address || '-'}</p>
        </div>
        <div className="flex space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">성별</label>
            <p className="mt-1">{profile.gender || '-'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">출생연도</label>
            <p className="mt-1">{profile.birth_year || '-'}</p>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">휴대폰 번호</label>
          <p className="mt-1">{profile.phone_number || '-'}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">사업자등록증 (PDF/JPG)</label>
          <input
            type="file"
            accept=".pdf,image/*"
            onChange={handleFileChange}
            className="mt-1 block w-full text-sm text-gray-700"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">포트폴리오 URL</label>
          <input
            type="url"
            value={portfolioUrl}
            onChange={e => setPortfolioUrl(e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            placeholder="https://portfolio.example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">추가 메모</label>
          <textarea
            value={memo}
            onChange={e => setMemo(e.target.value)}
            rows={4}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="mt-6 w-full px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
      >
        {submitting ? '제출 중...' : '신청 제출'}
      </button>
    </div>
  );
}
