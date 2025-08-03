// app/provider/register/page.tsx
'use client';

import { useEffect, useState, ChangeEvent } from 'react';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';
import useProfile from '@/hooks/useProfile';

import ToggleMulti from '@/components/ToggleMulti';
import { CATEGORY_OPTIONS, REGION_OPTIONS } from '@/constants/options';

type StorePayload = {
  name: string;
  description?: string;
  phone?: string;
  address?: string;
  service_areas?: []; // 콤마 입력 → 배열 변환
  categories?: [];    // 콤마 입력 → 배열 변환
  logo_url?: string;
  cover_url?: string;
  is_published?: boolean;
};

export default function ProviderRegisterStorePage() {
  const session = useSession();
  const supabase = useSupabaseClient();
  const router = useRouter();
  const { profile, loading } = useProfile();

  const [form, setForm] = useState<StorePayload>({
    name: '',
    description: '',
    phone: '',
    address: '',
    service_areas: [],
    categories: [],
    logo_url: '',
    cover_url: '',
    is_published: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(true);

  // 접근 제어 + 기존 상점 존재 여부 확인
  useEffect(() => {
    (async () => {
      if (loading) return;
      if (!session?.user) {
        router.push('/login');
        return;
      }
      if (profile?.is_provider !== 1) {
        router.push('/provider');
        return;
      }
      // 이미 상점이 있으면 /provider 로
      const { data } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', session.user.id)
        .maybeSingle();
      if (data?.id) {
        router.push('/provider'); // 또는 /provider/store
        return;
      }
      setChecking(false);
    })();
  }, [session, profile, loading, supabase, router]);

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const upload = async (file: File, key: 'logo_url' | 'cover_url') => {
    const path = `store/${session!.user!.id}/${key}-${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage.from('store').upload(path, file);
    if (error) throw error;
    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/store/${data.path}`;
    setForm(prev => ({ ...prev, [key]: publicUrl }));
  };

  const onFile = (key: 'logo_url' | 'cover_url') => async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      await upload(f, key);
    } catch (err: any) {
      alert(err.message || '파일 업로드 실패');
    }
  };

  const onSubmit = async () => {
    if (!form.name.trim()) {
        alert('상호명을 입력해 주세요.');
        return;
    }
    setSubmitting(true);
    try {
        const payload: StorePayload = {
        ...form, // service_areas / categories 그대로 배열
        };
        const { error } = await supabase
        .from('stores')
        .upsert({ ...payload, owner_id: session!.user!.id }, { onConflict: 'owner_id' });
        if (error) throw error;

        alert('상점이 등록되었습니다.');
        router.push('/provider');
    } catch (err: any) {
        alert(err.message || '등록 실패');
    } finally {
        setSubmitting(false);
    }
    };


  if (checking || loading) {
    return <div className="container mx-auto p-4">확인 중…</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-4">업체 등록</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <div className="text-sm text-gray-600">상호명*</div>
          <input
            name="name"
            value={form.name}
            onChange={onChange}
            className="mt-1 w-full border rounded px-3 py-2"
            placeholder="예) 내공 인테리어"
          />
        </label>

        <label className="block">
          <div className="text-sm text-gray-600">전화번호</div>
          <input
            name="phone"
            value={form.phone || ''}
            onChange={onChange}
            className="mt-1 w-full border rounded px-3 py-2"
            placeholder="010-0000-0000"
          />
        </label>

        <label className="block md:col-span-2">
          <div className="text-sm text-gray-600">주소</div>
          <input
            name="address"
            value={form.address || ''}
            onChange={onChange}
            className="mt-1 w-full border rounded px-3 py-2"
            placeholder="시/군/구까지 입력 권장"
          />
        </label>

        <label className="block md:col-span-2">
          <div className="text-sm text-gray-600">소개</div>
          <textarea
            name="description"
            value={form.description || ''}
            onChange={onChange}
            rows={4}
            className="mt-1 w-full border rounded px-3 py-2"
            placeholder="업체 소개를 간단히 적어주세요"
          />
        </label>

        {/* 서비스 지역 선택 */}
        <div className="md:col-span-2">
        <div className="mb-2 text-sm text-gray-600">서비스 가능 지역(광역단위)</div>
        <ToggleMulti
            options={REGION_OPTIONS}
            value={form.service_areas as string[]}
            onChange={(next) => setForm(prev => ({ ...prev, service_areas: next }))}
            columns={3} // 화면 넓으면 3열
        />
        </div>

        {/* 카테고리 선택 */}
        <div className="md:col-span-2">
        <div className="mb-2 text-sm text-gray-600">작업 카테고리</div>
        <ToggleMulti
            options={CATEGORY_OPTIONS}
            value={form.categories as string[]}
            onChange={(next) => setForm(prev => ({ ...prev, categories: next }))}
            columns={2}
        />
        </div>


        <label className="block">
          <div className="text-sm text-gray-600">로고</div>
          <input type="file" accept="image/*" onChange={onFile('logo_url')} className="mt-1 w-full" />
          {form.logo_url && <img src={form.logo_url} className="mt-2 h-16 object-contain" />}
        </label>

        <label className="block">
          <div className="text-sm text-gray-600">커버 이미지</div>
          <input type="file" accept="image/*" onChange={onFile('cover_url')} className="mt-1 w-full" />
          {form.cover_url && <img src={form.cover_url} className="mt-2 h-16 object-cover" />}
        </label>

        <label className="flex items-center gap-2 md:col-span-2">
          <input type="checkbox" name="is_published" checked={!!form.is_published} onChange={onChange} />
          <span>공개하기</span>
        </label>
      </div>

      <div className="mt-6">
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
        >
          {submitting ? '등록 중…' : '등록하기'}
        </button>
      </div>
    </div>
  );
}
