// app/portfolio/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useRouter, useSearchParams } from 'next/navigation';

type Store = { id: string; name: string | null };
type PortfolioCard = {
  id: string;
  project_title: string | null;
  cover_url: string | null;
  created_at: string;
  published: boolean | null;
};

export default function PortfolioListPage() {
  const session = useSession();
  const supabase = useSupabaseClient();
  const router = useRouter();
  const params = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [items, setItems] = useState<PortfolioCard[]>([]);
  const [fetching, setFetching] = useState(false);

  // 1) 로그인 확인 + 내 상점 불러오기
  useEffect(() => {
    if (!session?.user) {
      router.replace('/login?next=/portfolio');
      return;
    }

    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('stores')
        .select('id, name')
        .eq('owner_id', session.user.id)
        .order('created_at');

      if (error) {
        console.error(error);
        alert('상점 정보를 불러오지 못했습니다.');
        setLoading(false);
        return;
      }

      const list = data || [];
      setStores(list);

      // URL 쿼리로 storeId가 왔다면 우선 적용
      const qs = params?.get('storeId') || '';
      if (qs && list.some(s => s.id === qs)) {
        setSelectedStoreId(qs);
      } else if (list.length === 1) {
        setSelectedStoreId(list[0].id);
      } else {
        setSelectedStoreId('');
      }

      setLoading(false);
    })();
  }, [session, supabase, router, params]);

  // 2) 선택된 상점의 포트폴리오 목록
  useEffect(() => {
    if (!session?.user || !selectedStoreId) {
      setItems([]);
      return;
    }
    (async () => {
      setFetching(true);
      const { data, error } = await supabase
        .from('portfolios')
        .select('id, project_title, cover_url, created_at, published')
        .eq('store_id', selectedStoreId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error(error);
        alert('포트폴리오를 불러오지 못했습니다.');
      }
      setItems(data || []);
      setFetching(false);
    })();
  }, [session, selectedStoreId, supabase]);

  const canWrite = useMemo(() => !!selectedStoreId, [selectedStoreId]);

  const onWrite = () => {
    if (!canWrite) return;
    // 새 글 쓰기로 이동 (선택된 상점 id를 쿼리에 전달해 미리 선택되도록)
    router.push(`/portfolios/new?storeId=${selectedStoreId}`);
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-10">로딩 중…</div>;
  }

  if (!stores.length) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-2xl font-semibold mb-4">포트폴리오</h1>
        <p className="text-gray-600">등록된 상점이 없습니다. 먼저 상점을 등록해 주세요.</p>
        <button
          className="mt-6 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          onClick={() => router.push('/provider/register')}
        >
          상점 등록하기
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-semibold">포트폴리오</h1>

        <div className="flex items-center gap-3">
          {/* 상점 선택 */}
          <select
            className="border rounded p-2"
            value={selectedStoreId}
            onChange={(e) => setSelectedStoreId(e.target.value)}
          >
            <option value="">상점을 선택하세요</option>
            {stores.map(s => (
              <option key={s.id} value={s.id}>
                {s.name || s.id}
              </option>
            ))}
          </select>

          {/* 작성 버튼 */}
          <button
            onClick={onWrite}
            disabled={!canWrite}
            className="px-4 py-2 bg-yellow-500 text-white rounded disabled:opacity-50 hover:bg-yellow-600"
          >
            포트폴리오 작성하기
          </button>
        </div>
      </div>

      {/* 목록 */}
      {!selectedStoreId ? (
        <p className="text-gray-600">목록을 보려면 상점을 선택하세요.</p>
      ) : fetching ? (
        <p>불러오는 중…</p>
      ) : items.length === 0 ? (
        <div className="border rounded p-10 text-center text-gray-600">
          등록된 포트폴리오가 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((p) => (
            <div
              key={p.id}
              className="border rounded-lg overflow-hidden hover:shadow transition cursor-pointer"
              onClick={() => router.push(`/portfolios/${p.id}`)} // 상세 페이지가 있으면 연결
            >
              <div className="aspect-video bg-gray-100">
                {p.cover_url ? (
                  <img
                    src={p.cover_url}
                    alt={p.project_title ?? 'portfolio cover'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-medium truncate">{p.project_title || '제목 없음'}</h3>
                  {p.published ? (
                    <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">공개</span>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">비공개</span>
                  )}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {new Date(p.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
