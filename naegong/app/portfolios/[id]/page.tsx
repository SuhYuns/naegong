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
  content: string;        // HTML
  cover_url: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
  store?: { name: string | null; owner_id: string } | null; // join
};

type Sibling = { id: string; project_title: string } | null;

function SpecCard({
  emoji,
  label,
  value,
  suffix,
}: {
  emoji: string;
  label: string;
  value?: string | number | null;
  suffix?: string;
}) {
  const display =
    value === null || value === undefined || value === '' ? '—' : `${value}${suffix ?? ''}`;

  return (
    <div className="
      flex items-start gap-4 p-4
      rounded-2xl border border-gray-200/70 bg-white/70
      shadow-sm hover:shadow-md transition
    ">
      <div className="
        shrink-0 size-10 rounded-xl
        flex items-center justify-center
        bg-gradient-to-br from-amber-50 to-amber-100 text-amber-700
      ">
        <span className="text-lg">{emoji}</span>
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium text-gray-500 mb-1">{label}</div>
        <div className="text-lg font-semibold text-gray-900 truncate">{display}</div>
      </div>
    </div>
  );
}

export default function PortfolioViewerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const session = useSession();
  const supabase = useSupabaseClient();
  const { profile } = useProfile();

  const [loading, setLoading] = useState(true);
  const [p, setP] = useState<Portfolio | null>(null);
  const [prevP, setPrevP] = useState<Sibling>(null);
  const [nextP, setNextP] = useState<Sibling>(null);

  // ───────────────────────── Load portfolio + prev/next ─────────────────────────
  useEffect(() => {
    if (!id) return;

    (async () => {
      setLoading(true);

      // 본문
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

      if (error || !data) {
        console.error(error);
        alert('포트폴리오를 불러오지 못했습니다.');
        router.replace('/portfolios');
        return;
      }

      const cur = data as unknown as Portfolio;
      setP(cur);

      // 메타 태그(제목/설명/키워드) 업데이트
      try {
        document.title = `${cur.project_title} | 내공`;
        // description: 본문 텍스트를 간단 추출
        const plain = (cur.content || '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, '')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 120);

        const ensureMeta = (name: string, content: string) => {
          if (!content) return;
          const el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
          if (el) el.setAttribute('content', content);
          else {
            const m = document.createElement('meta');
            m.setAttribute('name', name);
            m.setAttribute('content', content);
            document.head.appendChild(m);
          }
        };
        ensureMeta('description', plain);
        if (cur.tags?.length) ensureMeta('keywords', cur.tags.join(', '));
      } catch {}

      // 이전/다음(같은 store, 공개글 기준) — created_at 기준
      const createdAt = cur.created_at;

      const [{ data: nextData }, { data: prevData }] = await Promise.all([
        supabase
          .from('portfolios')
          .select('id, project_title')
          .eq('store_id', cur.store_id)
          .eq('published', true)
          .gt('created_at', createdAt)
          .order('created_at', { ascending: true })
          .limit(1),
        supabase
          .from('portfolios')
          .select('id, project_title')
          .eq('store_id', cur.store_id)
          .eq('published', true)
          .lt('created_at', createdAt)
          .order('created_at', { ascending: false })
          .limit(1),
      ]);

      setNextP(nextData && nextData.length ? (nextData[0] as Sibling) : null);
      setPrevP(prevData && prevData.length ? (prevData[0] as Sibling) : null);

      setLoading(false);
    })();
  }, [id, supabase, router]);

  // 권한
  const isAuthor = useMemo(
    () => !!(p?.store?.owner_id && session?.user?.id === p.store.owner_id),
    [p?.store?.owner_id, session?.user?.id]
  );
  const isManager = !!profile?.is_manager;
  const canEdit = isAuthor;
  const canDelete = isAuthor || isManager;

  const handleDelete = async () => {
    if (!p) return;
    if (!confirm('정말 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.')) return;

    try {
      const res = await fetch(`/api/portfolios/${p.id}/delete`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '삭제 실패');
      alert('삭제되었습니다.');
      router.replace('/portfolios');
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleEdit = () => {
    if (!p) return;
    router.push(`/portfolios/${p.id}/edit`);
  };

  if (loading) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-500" />
      </main>
    );
  }
  if (!p) {
    return <main className="container mx-auto px-4 py-16">존재하지 않는 포트폴리오입니다.</main>;
  }

  // (옵션) 상단 헤더 숨김이 필요하면 주석 해제
  // useEffect(() => {
  //   document.querySelectorAll('.site-header').forEach((el) => el.classList.add('hidden'));
  // }, []);

  return (
    <div className="bg-white">
      {/* ───── Hero (썸네일 배경 + 오버레이) ───── */}
      {p.cover_url && (
        <div className="relative w-full h-80 overflow-hidden">
          <img
            src={p.cover_url}
            alt="cover"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="
              absolute inset-x-0 bottom-0 z-10
              max-w-3xl mx-auto px-6 pb-6 mb-3
              text-white flex flex-col justify-end
            "
          >
            <p className="mb-1 text-sm">
              {/* 유형/지역 조합(원하면 수정) */}
              {[p.type, p.location].filter(Boolean).join(' · ')}
            </p>
            <h1 className="text-3xl font-bold leading-snug mb-2">{p.project_title}</h1>
            <p className="text-xs">
              {new Date(p.created_at).toLocaleDateString('ko-KR')}
              {p.store?.name ? ` · ${p.store.name}` : ''}
            </p>
          </div>
        </div>
      )}

      {/* 구분선 */}
      <div className="bg-gray-100 py-0.5 mb-5" />

      {/* ───── 본문 ───── */}
      <div className="p-6 max-w-3xl mx-auto sm:text-sm">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
            <SpecCard emoji="🏷️" label="유형" value={p.type} />
            <SpecCard emoji="📐" label="면적" value={p.area} suffix="평" />
            <SpecCard emoji="📍" label="지역" value={p.location} />
            <SpecCard emoji="🎨" label="스타일" value={p.style} />
            <SpecCard emoji="🗓️" label="공사 기간" value={p.duration} suffix="주" />
            <SpecCard emoji="👷" label="투입 인원" value={p.personnel} suffix="명" />
            </div>

            {/* 태그 칩 */}
            {p.tags?.length ? (
            <div className="mb-10 rounded-2xl border border-gray-200/70 bg-white/70 p-4 shadow-sm">
                <div className="text-xs font-medium text-gray-500 mb-2">태그</div>
                <div className="flex flex-wrap gap-2">
                {p.tags.map((t) => (
                    <span
                    key={t}
                    className="px-2.5 py-1 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                    >
                    #{t}
                    </span>
                ))}
                </div>
            </div>
            ) : null}

        {/* SunEditor HTML 그대로 출력 */}
        <div
          className="prose max-w-none prose-img:rounded-md prose-img:border prose-img:border-gray-100"
          dangerouslySetInnerHTML={{ __html: p.content || '' }}
        />

        {/* 하단 구분선 */}
        <div className="bg-gray-100 py-0.5 mb-5 mt-10" />

        {/* 이전/다음 */}
        <nav className="flex flex-col gap-2 text-sm">
          {nextP ? (
            <a href={`/portfolios/${nextP.id}`} className="hover:underline">
              🔺 [다음 글] {nextP.project_title}
            </a>
          ) : (
            <span className="text-gray-500">🔺 [다음 글] 없습니다.</span>
          )}
          {prevP ? (
            <a href={`/portfolios/${prevP.id}`} className="hover:underline">
              🔻 [이전 글] {prevP.project_title}
            </a>
          ) : (
            <span className="text-gray-500">🔻 [이전 글] 없습니다.</span>
          )}
        </nav>

        {/* 액션 버튼들 */}
        {(canEdit || canDelete) && (
          <div className="mt-8 flex gap-2">
            {canEdit && (
              <button
                onClick={handleEdit}
                className="px-4 py-2 rounded bg-gray-100 text-gray-800 hover:bg-gray-200"
              >
                수정
              </button>
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
              >
                삭제
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="rounded border p-3">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-gray-800">{value}</div>
    </div>
  );
}
