// app/portfolios/new/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';
import 'suneditor/dist/css/suneditor.min.css';

const SunEditor = dynamic(() => import('suneditor-react'), { ssr: false });

type Store = { id: string; name: string | null };

export default function NewPortfolioPage() {
  const session = useSession();
  const supabase = useSupabaseClient();
  const router = useRouter();

  // store
  const [stores, setStores] = useState<Store[]>([]);
  const [storeId, setStoreId] = useState<string>('');

  // form states
  const [projectTitle, setProjectTitle] = useState('');
  const [type, setType] = useState('');
  const [area, setArea] = useState<number | ''>('');
  const [location, setLocation] = useState('');
  const [style, setStyle] = useState('');
  const [duration, setDuration] = useState<number | ''>('');
  const [personnel, setPersonnel] = useState<number | ''>('');
  const [tags, setTags] = useState(''); // 쉼표로 구분 입력 → 서버에서 배열로 변환
  const [content, setContent] = useState('');

  // images
  const [coverUrl, setCoverUrl] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 로그인 체크 + 내 store 목록
  useEffect(() => {
    if (!session?.user) {
      router.replace('/login?next=/portfolios/new');
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('id,name')
        .eq('owner_id', session.user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error(error);
        alert('업체 목록을 불러오지 못했습니다.');
        return;
      }
      setStores(data || []);
      if ((data || []).length === 1) setStoreId(data![0].id);
    })();
  }, [session, supabase, router]);

  const canSubmit = useMemo(
    () =>
      !!session?.user &&
      !!storeId &&
      projectTitle.trim() &&
      content.trim(),
    [session, storeId, projectTitle, content]
  );

  // 공통 업로드 함수 (server route 사용)
  const uploadToApi = async (file: File, folder: string): Promise<string> => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`/api/portfolio/upload-image?folder=${folder}`, {
      method: 'POST',
      body: form,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || '업로드 실패');
    return json.url as string; // public URL
  };

  // 썸네일 업로드
  const onCoverChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToApi(file, 'thumbnails');
      setCoverUrl(url);
    } catch (err: any) {
      alert(err.message || '썸네일 업로드 실패');
    } finally {
      setUploading(false);
      e.currentTarget.value = '';
    }
  };

  // 갤러리 업로드 (다중)
  const onImagesChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of files) {
        const url = await uploadToApi(f, 'images');
        urls.push(url);
      }
      setImages((prev) => [...prev, ...urls]);
      if (!coverUrl && urls.length) setCoverUrl(urls[0]); // 썸네일 없으면 첫 이미지로
    } catch (err: any) {
      alert(err.message || '이미지 업로드 실패');
    } finally {
      setUploading(false);
      e.currentTarget.value = '';
    }
  };

  // SunEditor 내부 이미지 업로드 훅 (응답 포맷 신경 안써도 됨)
  const onImageUploadBefore = async (
    files: File[],
    _info: any,
    uploadHandler: (param: { result: Array<{ url: string; name: string; size: number }> }) => void
  ) => {
    try {
      const file = files[0];
      const url = await uploadToApi(file, 'content');
      uploadHandler({
        result: [{ url, name: file.name, size: file.size }],
      });
    } catch (e: any) {
      alert(e.message || '본문 이미지 업로드 실패');
    }
    // prevent default upload
    return undefined;
  };

  // 저장
  const onSubmit = async () => {
    if (!canSubmit) {
      alert('필수 항목을 입력하세요.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/portfolios', {
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
          coverUrl: coverUrl || null,
          images, // string[]
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '저장 실패');

      alert('포트폴리오가 등록되었습니다.');
      router.replace(`/contractors/${storeId}`); // 혹은 상세/목록
    } catch (err: any) {
      alert(err.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">포트폴리오 등록</h1>

      {/* Store 선택 */}
      <label className="block mb-1 font-medium">업체 선택</label>
      <select
        className="w-full border rounded p-2 mb-4"
        value={storeId}
        onChange={(e) => setStoreId(e.target.value)}
      >
        <option value="">업체를 선택하세요</option>
        {stores.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name || s.id}
          </option>
        ))}
      </select>

      {/* 제목 */}
      <label className="block mb-1 font-medium">프로젝트 제목</label>
      <input
        value={projectTitle}
        onChange={(e) => setProjectTitle(e.target.value)}
        placeholder="예: 신림동 20평 올리모델링"
        className="w-full border rounded p-2 mb-4"
        type="text"
      />

      {/* 기본 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block mb-1 font-medium">유형</label>
          <input
            value={type}
            onChange={(e) => setType(e.target.value)}
            placeholder="예: 거실+주방"
            className="w-full border rounded p-2"
            type="text"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">면적</label>
          <input
            value={area}
            onChange={(e) => setArea(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="예: 20"
            className="w-full border rounded p-2"
            type="number"
            min={0}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">지역</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="예: 서울 관악구"
            className="w-full border rounded p-2"
            type="text"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">스타일</label>
          <input
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            placeholder="예: 모던 내추럴"
            className="w-full border rounded p-2"
            type="text"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">기간</label>
          <input
            value={duration}
            onChange={(e) => setDuration(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="예: 5"
            className="w-full border rounded p-2"
            type="number"
            min={0}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">투입 인원</label>
          <input
            value={personnel}
            onChange={(e) => setPersonnel(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="예: 3"
            className="w-full border rounded p-2"
            type="number"
            min={0}
          />
        </div>
      </div>

      {/* 태그 */}
      <label className="block mb-1 font-medium">태그 (쉼표로 구분)</label>
      <input
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="예: 철거, 타일, 도장"
        className="w-full border rounded p-2 mb-4"
        type="text"
      />

      {/* 썸네일 */}
      <label className="block mb-1 font-medium">썸네일</label>
      <input className="w-full border rounded p-2 mb-2" type="file" accept="image/*" onChange={onCoverChange} disabled={uploading} />
      {coverUrl && <img src={coverUrl} alt="cover" className="w-full h-48 object-cover rounded mb-4" />}

      {/* 갤러리 */}
      <label className="block mb-1 font-medium">갤러리 이미지 (여러 장 가능)</label>
      <input className="w-full border rounded p-2 mb-2" type="file" accept="image/*" multiple onChange={onImagesChange} disabled={uploading} />
      {!!images.length && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          {images.map((u, i) => (
            <div key={u} className="relative">
              <img src={u} className="w-full h-32 object-cover rounded" />
              <button
                type="button"
                className="absolute top-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded"
                onClick={() => setImages((prev) => prev.filter((x) => x !== u))}
              >
                삭제
              </button>
              {coverUrl === u && (
                <span className="absolute bottom-1 left-1 bg-yellow-500 text-white text-[10px] px-1.5 py-0.5 rounded">
                  썸네일
                </span>
              )}
              {coverUrl !== u && (
                <button
                  type="button"
                  className="absolute bottom-1 left-1 bg-white/90 text-xs px-1.5 py-0.5 rounded"
                  onClick={() => setCoverUrl(u)}
                >
                  썸네일로
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 본문 */}
      <label className="block mb-1 font-medium">내용</label>
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
          imageResizing: true,
        }}
        onChange={(v: string) => setContent(v)}
        setContents={content}
        // onImageUploadBefore={onImageUploadBefore}
      />

      <button
        disabled={!canSubmit || uploading || saving}
        onClick={onSubmit}
        className="w-full mt-6 bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded disabled:opacity-50"
      >
        {saving ? '저장 중…' : '등록하기'}
      </button>
    </div>
  );
}
