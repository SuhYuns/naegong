// app/contractors/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import type { Database } from '@/lib/database';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

import { ensureDmRoom } from '@/lib/chat';
import { useSession } from '@supabase/auth-helpers-react';

import StorePortfolioGrid from '@/components/StorePortfolioGrid';

type Store = {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  address: string | null;
  logo_url: string | null;
  cover_url: string | null;
  service_areas: string[] | null;
  categories: string[] | null;
  phone: string | null;
  is_published: boolean;
  updated_at: string;
};

export default function ContractorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = useSupabaseClient<Database>(); // ← 제네릭 지정
  const router = useRouter();

  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', id)
        .maybeSingle<Store>();

      if (error) {
        console.error(error);
        alert('업체 정보를 불러오는 중 오류가 발생했습니다.');
        setLoading(false);
        return;
      }
      if (!data || !data.is_published) {
        alert('존재하지 않거나 비공개인 업체입니다.');
        router.replace('/contractors');
        return;
      }
      setStore(data);
      setLoading(false);
    };
    load();
  }, [id, supabase, router]);
  
  const session = useSession();

  const handleInquiry = async (ownerId: string) => {
  if (!session?.user) return router.push('/login?next=' + encodeURIComponent(location.pathname));
  if (!ownerId) return alert('상대 사용자 정보가 없습니다.');

  try {
    const roomId = await ensureDmRoom(supabase, session.user.id, ownerId);
    router.push(`/chat/${roomId}`);
  } catch (e: any) {
    console.error('ensureDmRoom error:', e);
    alert(e?.message || '채팅 시작 실패');
  }
};


  if (loading) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <div className="text-center text-gray-500">불러오는 중…</div>
      </div>
    );
  }

  if (!store) return null;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      {/* 상단: 뒤로가기 & 제목 */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/contractors"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← 목록으로
        </Link>
      </div>

      {/* 큰 제목 */}
      <h1 className="text-3xl font-semibold mb-2">{store.name}</h1>

      {/* 태그 */}
      {store.categories?.length ? (
        <div className="mb-6 flex flex-wrap gap-2">
          {store.categories.map((c) => (
            <span
              key={c}
              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
            >
              #{c}
            </span>
          ))}
        </div>
      ) : null}

      {/* 2열 그리드: 좌 5, 우 7 → 각 열 안에서 상/하로 나눔 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 좌측(5칸): 상(업체 정보) / 하(포트폴리오 자리) */}
        <div className="lg:col-span-5 space-y-8">
          {/* 좌상: 업체 정보 */}
          <section className="bg-white border rounded-lg overflow-hidden">
            {/* 커버 이미지가 있으면 상단 배경처럼 */}
            {store.cover_url && (
              <div className="relative h-40 w-full bg-gray-100">
                <Image
                  src={store.cover_url}
                  alt="cover"
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="h-20 w-20 rounded-full overflow-hidden bg-gray-100 border shrink-0">
                  {store.logo_url ? (
                    <Image
                      src={store.logo_url}
                      alt={`${store.name} 로고`}
                      width={80}
                      height={80}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs">
                      NO LOGO
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {store.description && (
                    <p className="text-gray-700 leading-relaxed">
                      {store.description}
                    </p>
                  )}
                  <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-gray-700">
                    <div>
                      <span className="text-gray-500">주소: </span>
                      <span className="font-medium">{store.address || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">서비스 지역: </span>
                      <span className="font-medium">
                        {store.service_areas?.length
                          ? store.service_areas.join(', ')
                          : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">연락처: </span>
                      <span className="font-medium">{store.phone || '-'}</span>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button
                        type="button"
                        onClick={() => handleInquiry(store.owner_id)} // owner_id는 uuid 문자열이어야 함
                        className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                    >
                        문의하기
                    </button>

                    <a
                      href="#calendar"
                      className="px-4 py-2 border rounded hover:bg-gray-50"
                    >
                      예약하기
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 좌하: 포트폴리오(미구현 자리) */}
          <section className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">포트폴리오</h2>
            {/* (선택) 더보기 버튼: 전체 목록 페이지가 있다면 */}
            {/* <Link href={`/portfolios?store=${store.id}`} className="text-sm text-gray-500 hover:text-gray-700">더보기</Link> */}
          </div>

          <StorePortfolioGrid storeId={store.id} limit={6} />
        </section>
        </div>

        {/* 우측(7칸): 상(캘린더 자리) / 하(리뷰 자리) */}
        <div className="lg:col-span-7 space-y-8">
          {/* 우상: 예약 캘린더(미구현 자리) */}
          <section id="calendar" className="bg-white border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">예약 캘린더</h2>
            <div className="h-64 flex items-center justify-center text-sm text-gray-400">
              (캘린더 영역 – 추후 구현)
            </div>
          </section>

          {/* 우하: 시공 리뷰(미구현 자리) */}
          <section className="bg-white border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">시공 리뷰</h2>
            <div className="h-64 flex items-center justify-center text-sm text-gray-400">
              (리뷰 영역 – 추후 구현)
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
