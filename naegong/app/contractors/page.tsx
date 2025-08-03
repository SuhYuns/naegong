// app/contractors/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { CATEGORY_OPTIONS } from '@/constants/options';

type Store = {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  logo_url: string | null;
  service_areas: string[] | null;
  categories: string[] | null;
  is_published: boolean;
  updated_at: string;
};

const PAGE_SIZE = 10;

export default function ContractorsListPage() {
  const supabase = createClientComponentClient();

  const [items, setItems] = useState<Store[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // UI 상태
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // 페이지네이션 계산
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / PAGE_SIZE)),
    [total]
  );
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      // base query
      let q = supabase
        .from('stores')
        .select('*', { count: 'exact' })
        .eq('is_published', true);

      if (category) {
        // 배열 컬럼(categories) 포함 확인
        q = q.contains('categories', [category]);
      }

      if (query.trim()) {
        const kw = query.trim();
        // name, description, address 중 하나라도 부분일치
        q = q.or(
          `name.ilike.%${kw}%,description.ilike.%${kw}%,address.ilike.%${kw}%`
        );
      }

      const { data, error, count } = await q
        .order('updated_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error(error);
        alert('목록을 불러오는 중 오류가 발생했습니다.');
        setLoading(false);
        return;
      }
      setItems((data as Store[]) || []);
      setTotal(count || 0);
      setLoading(false);
    };

    fetch();
  }, [supabase, category, query, page, from, to]);

  // 필터/검색 변경 시 페이지 첫 페이지로
  useEffect(() => {
    setPage(1);
  }, [category, query]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-3xl font-semibold text-center mb-8">시공자 찾기</h1>

      {/* 필터 / 검색 바 */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        {/* 카테고리 필터: 칩 */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setCategory(null)}
            className={`px-3 py-1.5 rounded-full border text-sm whitespace-nowrap ${
              !category
                ? 'bg-yellow-500 border-yellow-500 text-white'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            전체
          </button>
          {CATEGORY_OPTIONS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c === category ? null : c)}
              className={`px-3 py-1.5 rounded-full border text-sm whitespace-nowrap ${
                c === category
                  ? 'bg-yellow-500 border-yellow-500 text-white'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* 검색 */}
        <div className="w-full md:w-80">
          <input
            type="search"
            placeholder="업체명 / 소개 / 주소 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>
      </div>

      {/* 결과 개수 */}
      <div className="text-sm text-gray-500 mb-3">
        총 <span className="font-medium text-gray-700">{total}</span>개 업체
      </div>

      {/* 리스트 */}
      <div className="divide-y">
        {loading ? (
          <div className="py-20 text-center text-gray-500">불러오는 중…</div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center text-gray-500">검색 결과가 없습니다.</div>
        ) : (
          items.map((s) => <StoreRow key={s.id} s={s} />)
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 border rounded disabled:opacity-50"
          >
            이전
          </button>
          <span className="text-sm text-gray-600">
            {page} / {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1.5 border rounded disabled:opacity-50"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}

function StoreRow({ s }: { s: Store }) {
  return (
    <div className="py-6 flex gap-6 items-start">
      {/* 썸네일 */}
      <div className="shrink-0">
        <div className="h-24 w-24 rounded-full bg-gray-100 overflow-hidden border">
          {s.logo_url ? (
            // Next/Image 사용. 외부호스트면 next.config에 domains 등록 필요
            <Image
              src={s.logo_url}
              alt={`${s.name} 로고`}
              width={96}
              height={96}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs">
              NO LOGO
            </div>
          )}
        </div>
      </div>

      {/* 본문 */}
      <div className="flex-1 min-w-0">
        <h2 className="text-lg font-semibold">{s.name}</h2>
        {s.categories?.length ? (
          <div className="mt-1 flex flex-wrap gap-1">
            {s.categories.map((c) => (
              <span
                key={c}
                className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full"
              >
                #{c}
              </span>
            ))}
          </div>
        ) : null}

        {s.description && (
          <p className="mt-2 text-sm text-gray-700 line-clamp-2">{s.description}</p>
        )}

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
          <div>
            <span className="text-gray-500">시공 가능 지역: </span>
            <span className="font-medium">
              {s.service_areas?.length ? s.service_areas.join(', ') : '-'}
            </span>
          </div>
          <div>
            <span className="text-gray-500">주소: </span>
            <span className="font-medium">{s.address || '-'}</span>
          </div>
        </div>
      </div>

      {/* 액션 */}
      <div className="shrink-0">
        <Link
          href={`/contractors/${s.id}`} // 상세 페이지 준비되면 이 경로 사용
          className="px-4 py-2 border rounded hover:bg-gray-50 text-sm"
        >
          상세보기
        </Link>
      </div>
    </div>
  );
}
