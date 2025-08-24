'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import 'suneditor/dist/css/suneditor.min.css';
import { useParams, useRouter } from 'next/navigation';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';

// SunEditor는 SSR 불가 → 클라이언트 전용 로드
const SunEditor = dynamic(() => import('suneditor-react'), { ssr: false });

// ───────────────────────────────────────────────────────────────
// new 페이지와 동일한 선택 옵션
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
  content: string;
  cover_url: string | null;
  published: boolean;
};

export default function EditPortfolioPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const session = useSession();
  const supabase = useSupabaseClient();

  // ───────────────────────────── state ─────────────────────────────
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

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // ───────────────────────── 로그인 체크 ─────────────────────────
  useEffect(() => {
    if (session === null) router.replace(`/login?next=/portfolios/${id}/edit`);
  }, [session, router, id]);

  // ───────────────────── 기존 데이터 로드 ─────────────────────
  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from('portfolios').select('*').eq('id', id).single();
      if (error || !data) {
        alert('포트폴리오를 불러오지 못했습니다.');
        router.replace('/portfolios');
        return;
      }
      const p = data as Portfolio;
      setProjectTitle(p.project_title || '');
      setType(p.type || '');
      setArea(p.area ?? '');
      setLocation(p.location || '');
      setStyle(p.style || '');
      setDuration(p.duration ?? '');
      setPersonnel(p.personnel ?? '');
      setTags(Array.isArray(p.tags) ? p.tags.join(', ') : '');
      setContent(p.content || '');
      setCoverUrl(p.cover_url || '');
      setLoading(false);
    })();
  }, [id, supabase, router]);

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

  // ───────────────────────── 포트폴리오 수정 ────────────────────────
  const onSave = async () => {
    if (!session?.user) return alert('로그인이 필요합니다.');
    if (!projectTitle) return alert('프로젝트 제목을 입력해 주세요.');
    if (!content) return alert('내용을 입력해 주세요.');

    setSaving(true);
    try {
      // 서버 쪽 권한검증용 토큰 전달
      const { data: s } = await supabase.auth.getSession();
      const token = s.session?.access_token;
      if (!token) throw new Error('세션이 만료되었습니다.');

      const res = await fetch(`/api/portfolios/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          project_title: projectTitle,
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
          cover_url: coverUrl,
          published: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '수정 실패');

      alert('수정되었습니다.');
      router.replace(`/portfolios/${id}`);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const canSave = useMemo(() => !!session?.user && !!projectTitle && !!content, [session?.user, projectTitle, content]);

  if (loading) return <div className="max-w-3xl mx-auto p-6">불러오는 중…</div>;

  // ───────────────────────────── UI ─────────────────────────────
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">포트폴리오 편집</h1>

      {/* 제목 */}
      <label className="block font-medium mb-1">프로젝트 제목</label>
      <input
        className="w-full border p-2 rounded mb-4"
        value={projectTitle}
        onChange={(e) => setProjectTitle(e.target.value)}
        placeholder="예) 신림동 20평 올리모델링"
      />

      {/* 셀렉트 6종 (new와 동일) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-medium mb-1">유형</label>
          <select className="w-full border p-2 rounded" value={type} onChange={(e) => setType(e.target.value)}>
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
            onChange={(e) => setArea(e.target.value === '' ? '' : Number(e.target.value))}
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
          <select className="w-full border p-2 rounded" value={location} onChange={(e) => setLocation(e.target.value)}>
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
          <select className="w-full border p-2 rounded" value={style} onChange={(e) => setStyle(e.target.value)}>
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
            onChange={(e) => setDuration(e.target.value === '' ? '' : Number(e.target.value))}
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
            onChange={(e) => setPersonnel(e.target.value === '' ? '' : Number(e.target.value))}
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
      {uploadingCover && <p className="text-sm text-gray-500 mb-2">업로드 중…</p>}
      {!!coverUrl && <img src={coverUrl} alt="thumbnail" className="w-full h-40 object-cover rounded mb-4" />}

      {/* 본문 (에디터 내부 이미지 업로드는 new와 동일) */}
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
          imageUploadUrl: '/api/portfolios/upload?folder=portfolios/content',
          imageResizing: true,
          imageWidth: '100%',
        }}
        setContents={content}
        onChange={(html: string) => setContent(html)}
      />

      <button
        onClick={onSave}
        disabled={!canSave || saving}
        className="w-full mt-6 bg-yellow-500 text-white py-3 rounded hover:brightness-95 disabled:opacity-50"
      >
        {saving ? '저장 중…' : '수정하기'}
      </button>
    </div>
  );
}
