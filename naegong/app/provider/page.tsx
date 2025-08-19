// app/provider/page.tsx
'use client';

import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useProfile from '@/hooks/useProfile';
import KakaoAuthButton from '@/components/KakaoAuthButton';

type Store = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  phone: string | null;
  address: string | null;
  service_areas: string[] | null;
  categories: string[] | null;
  logo_url: string | null;
  cover_url: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export default function ProviderPage() {
  const session = useSession();
  const { profile, loading } = useProfile();
  const router = useRouter();
  const supabase = useSupabaseClient();

  const [store, setStore] = useState<Store | null>(null);
  const [storeLoading, setStoreLoading] = useState(false);

  // 인증 체크
  useEffect(() => {
    if (!session) return;
    if (!session.user) router.push('/login');
  }, [session, router]);

  // 승인된 시공자일 때 내 상점 조회
  useEffect(() => {
    const fetchStore = async () => {
      if (!session?.user || !profile) return;
      if (profile.is_provider !== 1) return;
      setStoreLoading(true);
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', session.user.id)
        .maybeSingle<Store>();
      if (!error) setStore(data ?? null);
      setStoreLoading(false);
    };
    fetchStore();
  }, [session?.user?.id, profile?.is_provider, supabase, profile]);

  if (loading) {
    return <p className="flex items-center justify-center min-h-screen">로딩 중…</p>;
  }

  // 로그인 전
  if (!session?.user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="mb-4">장인 콘솔에 접근하려면 로그인이 필요합니다.</p>
        <KakaoAuthButton />
      </div>
    );
  }

  // 로그인 후 프로필 없음
  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="mb-4">상세 프로필을 먼저 입력해 주세요.</p>
        <button
          onClick={() => router.push('/profile')}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          프로필 입력하기
        </button>
      </div>
    );
  }

  const { is_provider } = profile;

  // 고객
  if (is_provider === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <p className="text-lg">내공과 함께할 장인들을 모집합니다</p>
        <button
          onClick={() => router.push('/provider/apply')}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          신청하기
        </button>
      </div>
    );
  }

  // 심사중
  if (is_provider === 2) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">심사중입니다.. 잠시만 기다려주세요.</p>
      </div>
    );
  }

  // 승인된 시공자
  if (is_provider === 1) {
    if (storeLoading) {
      return <div className="flex items-center justify-center min-h-screen">상점 정보 불러오는 중…</div>;
    }

    // 상점이 없는 경우
    if (!store) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
          <p className="text-lg">아직 등록된 상점이 없습니다.</p>
          <button
            onClick={() => router.push('/provider/register')}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            업체 등록하기
          </button>
        </div>
      );
    }

    // 상점이 있는 경우: 요약 정보 + 관리로 이동
    return (
      <div className="container mx-auto max-w-3xl py-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {store.cover_url && (
            <div className="h-40 w-full bg-gray-100 overflow-hidden">
              <img src={store.cover_url} alt="cover" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="p-6">
            <div className="flex items-center gap-4">
              {store.logo_url && (
                <img
                  src={store.logo_url}
                  alt="logo"
                  className="h-16 w-16 rounded object-cover border"
                />
              )}
              <div>
                <h2 className="text-2xl font-semibold">{store.name}</h2>
                <div className="text-sm text-gray-500">
                  {store.is_published ? '공개됨' : '비공개'}
                </div>
              </div>
            </div>

            {store.description && (
              <p className="mt-4 text-gray-800 leading-relaxed">{store.description}</p>
            )}

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-gray-500">연락처</div>
                <div className="font-medium">{store.phone || '-'}</div>
              </div>
              <div>
                <div className="text-gray-500">주소</div>
                <div className="font-medium">{store.address || '-'}</div>
              </div>
              <div>
                <div className="text-gray-500">서비스 지역</div>
                <div className="font-medium">
                  {store.service_areas?.length ? store.service_areas.join(', ') : '-'}
                </div>
              </div>
              <div>
                <div className="text-gray-500">카테고리</div>
                <div className="font-medium">
                  {store.categories?.length ? store.categories.join(', ') : '-'}
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => router.push('/provider/store')}
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                상점 관리
              </button>
              <button
                onClick={() => router.push('/portfolios')}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                포트폴리오 보러가기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
