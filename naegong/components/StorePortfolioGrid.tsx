'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

type PortfolioCard = {
  id: string;
  project_title: string;
  cover_url: string | null;
  tags: string[] | null;
};

export default function StorePortfolioGrid({
  storeId,
  limit = 6,
}: {
  storeId: string;
  limit?: number;
}) {
  const supabase = useSupabaseClient();
  const [items, setItems] = useState<PortfolioCard[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('portfolios')
        .select('id, project_title, cover_url, tags')
        .eq('store_id', storeId)
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error) setItems((data as PortfolioCard[]) ?? []);
      setLoading(false);
    })();
  }, [storeId, limit, supabase]);

  return (
    <div>
      {/* 로딩 스켈레톤 */}
      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="aspect-[4/3] w-full animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      )}

      {/* 비어있음 */}
      {!loading && (!items || items.length === 0) && (
        <div className="h-40 flex items-center justify-center text-sm text-gray-400">
          아직 등록된 포트폴리오가 없습니다.
        </div>
      )}

      {/* 리스트 */}
      {!loading && items && items.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((p) => (
            <Link
              key={p.id}
              href={`/portfolios/${p.id}`}
              className="group relative block overflow-hidden rounded-lg"
            >
              {/* 썸네일 */}
              <img
                src={
                  p.cover_url ||
                  'https://placehold.co/800x600/eeeeee/999999?text=No+Image'
                }
                alt={p.project_title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 aspect-[4/3]"
              />

              {/* 그라데이션 + 텍스트 오버레이 */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                <h3 className="text-white text-sm md:text-base font-semibold line-clamp-1">
                  {p.project_title}
                </h3>

                {p.tags && p.tags.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {p.tags.slice(0, 3).map((t, i) => (
                      <span
                        key={i}
                        className="text-[10px] md:text-xs bg-white/90 text-gray-800 rounded px-1.5 py-0.5"
                      >
                        #{t}
                      </span>
                    ))}
                    {p.tags.length > 3 && (
                      <span className="text-[10px] md:text-xs text-white/90">
                        +{p.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
