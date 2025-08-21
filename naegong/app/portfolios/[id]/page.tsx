'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import useProfile from '@/hooks/useProfile';

type Portfolio = {
  id: string;
  store_id: string;
  project_title: string;
  type: string | null;
  area: number | null;
  location: string | null;
  style: string | null;
  duration: number | null;
  personnel: number | null;
  tags: string[] | null;
  content: string;         // HTML
  cover_url: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
  // joined
  store?: {
    name: string | null;
    owner_id: string;
  } | null;
};

export default function PortfolioViewerPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const session = useSession();
  const supabase = useSupabaseClient();
  const { profile } = useProfile();

  const [loading, setLoading] = useState(true);
  const [p, setP] = useState<Portfolio | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('portfolios')
        .select(
          `
          *,
          store:stores!portfolios_store_id_fkey ( name, owner_id )
        `
        )
        .eq('id', id)
        .single();

      if (error) {
        console.error(error);
        alert('포트폴리오를 불러오지 못했습니다.');
        router.replace('/portfolios');
        return;
      }
      setP(data as unknown as Portfolio);
      setLoading(false);
    })();
  }, [id, supabase, router]);

  const isAuthor = useMemo(
    () => !!(p?.store?.owner_id && session?.user?.id === p.store.owner_id),
    [p?.store?.owner_id, session?.user?.id]
  );

  const isManager = !!profile?.is_manager;
  const canEdit = isAuthor;                  // 작성자만 수정
  const canDelete = isAuthor || isManager;   // 작성자 또는 운영자 삭제 가능

  const onDelete = async () => {
    if (!p) return;
    if (!confirm('정말 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.')) return;
    try {
      const res = await fetch(`/api/portfolios/${p.id}/delete`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '삭제 실패');
      alert('삭제되었습니다.');
      router.replace('/portfolios'); // 원하는 목록 경로로 바꿔도 됨
    } catch (e: any) {
      console.error(e);
      alert(e.message);
    }
  };

  const onEdit = () => {
    if (!p) return;
    router.push(`/portfolios/${p.id}/edit`); // 편집 페이지(별도 구현)
  };

  if (loading) return <div className="container mx-auto px-4 py-10">불러오는 중…</div>;
  if (!p) return <div className="container mx-auto px-4 py-10">존재하지 않는 포트폴리오입니다.</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* 상단 헤더 */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{p.project_title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {p.store?.name ? `업체: ${p.store.name}` : '업체 정보 없음'} · 작성일:{' '}
            {new Date(p.created_at).toLocaleDateString()}
          </p>
        </div>
        {/* 권한별 액션버튼 */}
        <div className="flex gap-2 shrink-0">
          {canEdit && (
            <button
              onClick={onEdit}
              className="px-4 py-2 rounded bg-gray-100 text-gray-800 hover:bg-gray-200"
            >
              수정
            </button>
          )}
          {canDelete && (
            <button
              onClick={onDelete}
              className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
            >
              삭제
            </button>
          )}
        </div>
      </div>

      {p.cover_url && (
        <img
          src={p.cover_url}
          alt="cover"
          className="w-full aspect-[16/9] object-cover rounded mb-6"
        />
      )}

      {/* 메타 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <MetaItem label="유형" value={p.type} />
        <MetaItem label="면적" value={p.area ? `${p.area}` : ''} />
        <MetaItem label="지역" value={p.location} />
        <MetaItem label="스타일" value={p.style} />
        <MetaItem label="공사 기간(주)" value={p.duration ? `${p.duration}` : ''} />
        <MetaItem label="투입 인원(명)" value={p.personnel ? `${p.personnel}` : ''} />
        <div className="md:col-span-2">
          <MetaItem
            label="태그"
            value={p.tags?.length ? p.tags.map((t) => `#${t}`).join(' ') : ''}
          />
        </div>
      </div>

      {/* 본문 */}
      <article
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: p.content || '' }}
      />
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="rounded border p-3">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-gray-800">{value}</div>
    </div>
  );
}
