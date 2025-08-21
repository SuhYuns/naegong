// app/portfolios/new/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import 'suneditor/dist/css/suneditor.min.css';
import { useRouter } from 'next/navigation';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';

// SunEditor는 SSR 불가 → 클라이언트 전용 로드
const SunEditor = dynamic(() => import('suneditor-react'), { ssr: false });

type MyStore = { id: string; name: string };

// ───────────────────────────────────────────────────────────────
// 선택 옵션(원하면 언제든 추가/수정 가능)
// ───────────────────────────────────────────────────────────────
const TYPES = [
  '철거/설비',
  '창호',
  '전기',
  '목공',
  '타일/도기',
  '필름',
  '마루',
  '도장',
  '도배',
  '가구/싱크대',
];

const AREAS = [8, 10, 12, 15, 18, 20, 22, 24, 25, 28, 30, 32, 35, 40, 45, 50];

const STYLES = [
  '모던',
  '내추럴',
  '북유럽',
  '미니멀',
  '빈티지',
  '인더스트리얼',
  '클래식',
  '기타',
];

const LOCATIONS = [
  '서울특별시',
  '부산광역시',
  '대구광역시',
  '인천광역시',
  '광주광역시',
  '대전광역시',
  '울산광역시',
  '세종특별자치시',
  '경기도',
  '강원특별자치도',
  '충청북도',
  '충청남도',
  '전북특별자치도',
  '전라남도',
  '경상북도',
  '경상남도',
  '제주특별자치도',
];

const DURATIONS = Array.from({ length: 12 }, (_, i) => i + 1); // 1~12 주
const PERSONNEL = Array.from({ length: 20 }, (_, i) => i + 1); // 1~20 명

export default function NewPortfolioPage() {
  const router = useRouter();
  const session = useSession();
  const supabase = useSupabaseClient();

  // ───────────────────────────── state ─────────────────────────────
  const [stores, setStores] = useState<MyStore[]>([]);
  const [storeId, setStoreId] = useState<string>('');

  const [projectTitle, setProjectTitle] = useState('');
  const [type, setType] = useState('');
  const [area, setArea] = useState<number | ''>('');
  const [location, setLocation] = useState('');
  const [style, setStyle] = useState('');
  const [duration, setDuration] = useState<number | ''>('');
  const [personnel, setPersonnel] = useState<number | ''>('');
  const [tags, setTags] = useState(''); // 쉼표 구분 입력
  const [content, setContent] = useState('');

  // 썸네일
  const [coverUrl, setCoverUrl] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // ───────────────────────── 로그인 체크 ─────────────────────────
  useEffect(() => {
    // 초기엔 undefined → 세션 확정되면 null(비로그인) 또는 Session
    if (session === null) router.replace('/login?next=/portfolios/new');
  }, [session, router]);

  // ─────────────────────── 내 상점 목록 로드 ───────────────────────
  useEffect(() => {
    const loadStores = async () => {
      if (!session?.user) return;
      const { data, error } = await supabase
        .from('stores')
        .select('id, name')
        .eq('owner_id', session.user.id);

      if (!error && data) {
        setStores(data as MyStore[]);
        // 상점이 1개뿐이면 자동 선택
        if (!storeId && data.length === 1) setStoreId(data[0].id);
      }
    };
    loadStores();
  }, [session, supabase, storeId]);

  // ───────────────────── 썸네일 업로드 (Storage) ────────────────────
  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    setUploadingCover(true);
    try {
      const form = new FormData();
      form.append('file', f);

      const res = await fetch('/api/portfolios/upload?folder=portfolios/cover', {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'thumbnail upload failed');

      setCoverUrl(data.url);
    } catch (err: any) {
      alert(err.message || '썸네일 업로드 실패');
    } finally {
      setUploadingCover(false);
    }
  };

  // ───────────────────────── 포트폴리오 등록 ────────────────────────
  const onSubmit = async () => {
    if (!session?.user) return alert('로그인이 필요합니다.');
    if (!storeId) return alert('상점을 선택해 주세요.');
    if (!projectTitle) return alert('프로젝트 제목을 입력해 주세요.');
    if (!content) return alert('내용을 입력해 주세요.');

    setSubmitting(true);
    try {
      const res = await fetch('/api/portfolios/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          projectTitle,
          type,
          area: area === '' ? null : Number(area),
          location,
          style,
          duration: duration === '' ? null : Number(duration),
          personnel: personnel === '' ? null : Number(personnel),
          tags: tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
          content,
          coverUrl,
          published: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '등록 실패');

      alert('포트폴리오가 등록되었습니다.');
      router.replace('/provider/portfolio'); // 원하는 경로로 변경
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = useMemo(
    () => !!session?.user && !!storeId && !!projectTitle && !!content,
    [session?.user, storeId, projectTitle, content]
  );

  // ───────────────────────────── UI ─────────────────────────────
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">포트폴리오 작성</h1>

      {/* 상점 선택 */}
      <label className="block font-medium mb-1">상점</label>
      {stores.length <= 1 ? (
        <p className="mb-4 text-sm text-gray-600">
          {stores.length === 1
            ? `선택된 상점: ${stores[0].name}`
            : '상점이 없습니다. 먼저 상점을 등록해 주세요.'}
        </p>
      ) : (
        <select
          className="w-full border p-2 rounded mb-4"
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
        >
          <option value="">상점을 선택하세요</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      )}

      {/* 제목 */}
      <label className="block font-medium mb-1">프로젝트 제목</label>
      <input
        className="w-full border p-2 rounded mb-4"
        value={projectTitle}
        onChange={(e) => setProjectTitle(e.target.value)}
        placeholder="예) 신림동 20평 올리모델링"
      />

      {/* 셀렉트 6종 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-medium mb-1">유형</label>
          <select
            className="w-full border p-2 rounded"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">선택</option>
            {TYPES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium mb-1">면적(평/㎡)</label>
          <select
            className="w-full border p-2 rounded"
            value={area === '' ? '' : String(area)}
            onChange={(e) =>
              setArea(e.target.value === '' ? '' : Number(e.target.value))
            }
          >
            <option value="">선택</option>
            {AREAS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium mb-1">지역(광역)</label>
          <select
            className="w-full border p-2 rounded"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          >
            <option value="">선택</option>
            {LOCATIONS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium mb-1">스타일</label>
          <select
            className="w-full border p-2 rounded"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
          >
            <option value="">선택</option>
            {STYLES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium mb-1">공사 기간(주)</label>
          <select
            className="w-full border p-2 rounded"
            value={duration === '' ? '' : String(duration)}
            onChange={(e) =>
              setDuration(e.target.value === '' ? '' : Number(e.target.value))
            }
          >
            <option value="">선택</option>
            {DURATIONS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium mb-1">투입 인원(명)</label>
          <select
            className="w-full border p-2 rounded"
            value={personnel === '' ? '' : String(personnel)}
            onChange={(e) =>
              setPersonnel(e.target.value === '' ? '' : Number(e.target.value))
            }
          >
            <option value="">선택</option>
            {PERSONNEL.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 태그 */}
      <label className="block font-medium mt-4 mb-1">태그 (쉼표로 구분)</label>
      <input
        className="w-full border p-2 rounded mb-4"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="철거, 타일, 도장"
      />

      {/* 썸네일 */}
      <label className="block font-medium mb-1">썸네일</label>
      <input
        type="file"
        accept="image/*"
        onChange={handleCoverChange}
        disabled={uploadingCover}
        className="mb-2"
      />
      {uploadingCover && (
        <p className="text-sm text-gray-500 mb-2">업로드 중…</p>
      )}
      {!!coverUrl && (
        <img
          src={coverUrl}
          alt="thumbnail"
          className="w-full h-40 object-cover rounded mb-4"
        />
      )}

      {/* 본문(에디터 내부 이미지 업로드 사용) */}
      <label className="block font-medium mb-1">내용</label>
      <SunEditor
        setOptions={{
          height: '600px',
          buttonList: [
            ['undo', 'redo'],
            ['font', 'fontSize', 'formatBlock'],
            ['bold', 'italic', 'underline', 'strike'],
            ['fontColor', 'hiliteColor'],
            ['align', 'horizontalRule', 'list', 'table'],
            ['link', 'image', 'video'],
            ['codeView'],
          ],
          // 에디터 내부 이미지 업로드 라우트 (Storage 정책 필요)
          imageUploadUrl: '/api/portfolios/upload?folder=portfolios/content',
          imageResizing: true,
          imageWidth: '100%',
        }}
        setContents={content}
        onChange={(html: string) => setContent(html)}
      />

      <button
        onClick={onSubmit}
        disabled={!canSubmit || submitting}
        className="w-full mt-6 bg-yellow-500 text-white py-3 rounded hover:brightness-95 disabled:opacity-50"
      >
        {submitting ? '등록 중…' : '등록하기'}
      </button>
    </div>
  );
}
