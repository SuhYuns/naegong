// app/manage/applicants/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import { useSession } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';

export default function ManageApplicantsPage() {
  const supabase = createPagesBrowserClient();
  const session = useSession();
  const router = useRouter();

  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [total, setTotal] = useState(0);
  const [activeApp, setActiveApp] = useState<any | null>(null);

  const fetchApps = async () => {
    if (!session) {
      router.push('/login');
      return;
    }
    setLoading(true);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error: fetchError } = await supabase
      .from('provider_applications')
      .select(
        `id, applicant_id, business_reg, portfolio, memo, created_at,
         profiles(address, gender, birth_year, phone_number)`,
        { count: 'exact' }
      )
      .eq('status', 0)
      .ilike('memo', `%${search}%`)
      .range(from, to);

    if (fetchError) {
      // 에러 메시지를 직접 찍어 봅니다
      console.error(fetchError.message);
      alert(`신청자 조회 중 오류가 발생했습니다:\n${fetchError.message}`);
    } else {
      setApps(data || []);
      setTotal(count || 0);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchApps();
  }, [page, search]);

  const handleAction = async (id: number, userId: string, approve: boolean) => {
    const newStatus = approve ? 1 : 2;
    const providerStatus = approve ? 1 : 3;

    const { error: actionError } = await supabase
      .from('provider_applications')
      .update({ status: newStatus })
      .eq('id', id);

    if (actionError) {
      console.error(actionError.message);
      alert(`처리 중 오류가 발생했습니다:\n${actionError.message}`);
      return;
    }

    // profiles 테이블 상태 업데이트
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ is_provider: providerStatus })
      .eq('id', userId);

    if (profileError) {
      console.error(profileError.message);
      alert(`프로필 업데이트 중 오류가 발생했습니다:\n${profileError.message}`);
    }

    fetchApps();
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">장인 신청자 관리</h1>

      {/* 검색 및 페이징 */}
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="메모 검색..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="border px-3 py-2 rounded w-1/3 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPage(p => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            이전
          </button>
          <span>{page} / {Math.ceil(total / pageSize)}</span>
          <button
            onClick={() => setPage(p => (p * pageSize < total ? p + 1 : p))}
            disabled={page * pageSize >= total}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            다음
          </button>
        </div>
      </div>

      {/* 로딩 상태 */}
      {loading && <p>로딩 중…</p>}

      {/* 신청자 테이블 */}
      {!loading && (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                {['ID','신청자','사업자증','포트폴리오','메모','신청일','처리'].map(h => (
                  <th key={h} className="p-2 text-left text-sm font-medium border">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {apps.map(app => {
                const meta = app.profiles?.user_metadata || {};
                const name = meta.nickname || '이름 없음';
                return (
                  <tr key={app.id} className="odd:bg-white even:bg-gray-50 hover:bg-gray-100">
                    <td className="p-2 border">{app.id}</td>
                    <td className="p-2 border">
                      <button
                        onClick={() => setActiveApp(app)}
                        className="text-blue-600 hover:underline"
                      >
                        {name}
                      </button>
                    </td>
                    <td className="p-2 border">
                      <a href={app.business_reg} target="_blank" className="text-blue-600 hover:underline">보기</a>
                    </td>
                    <td className="p-2 border">
                      {app.portfolio
                        ? <a href={app.portfolio} target="_blank" className="text-blue-600 hover:underline">링크</a>
                        : '-'}
                    </td>
                    <td className="p-2 border truncate max-w-xs">{app.memo}</td>
                    <td className="p-2 border">{new Date(app.created_at).toLocaleString()}</td>
                    <td className="p-2 border space-x-2">
                      <button
                        onClick={() => handleAction(app.id, app.applicant_id, true)}
                        className="px-2 py-1 bg-green-600 text-white text-sm rounded"
                      >
                        승인
                      </button>
                      <button
                        onClick={() => handleAction(app.id, app.applicant_id, false)}
                        className="px-2 py-1 bg-red-600 text-white text-sm rounded"
                      >
                        거절
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 상세 모달 */}
      {activeApp && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10"
          onClick={() => setActiveApp(null)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {activeApp.profiles?.user_metadata?.nickname || '이름 없음'}님의 정보
              </h2>
              <button
                onClick={() => setActiveApp(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-sm text-gray-800">
              {/* <p><strong>UUID:</strong> {activeApp.applicant_id}</p> */}
              <p><strong>주소:</strong> {activeApp.profiles?.address}</p>
              <p><strong>성별:</strong> {activeApp.profiles?.gender}</p>
              <p><strong>출생연도:</strong> {activeApp.profiles?.birth_year}</p>
              <p><strong>연락처:</strong> {activeApp.profiles?.phone_number}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
