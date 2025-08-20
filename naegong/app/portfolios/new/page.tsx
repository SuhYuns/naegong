// app/portfolios/new/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import 'suneditor/dist/css/suneditor.min.css';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';

const SunEditor = dynamic(() => import('suneditor-react'), { ssr: false });

type MyStore = { id: string; name: string };

export default function NewPortfolioPage() {
  const router = useRouter();
  const session = useSession();
  const supabase = useSupabaseClient();

  // form state
  const [storeId, setStoreId] = useState<string>('');
  const [stores, setStores] = useState<MyStore[]>([]);
  const [projectTitle, setProjectTitle] = useState('');
  const [type, setType] = useState('');
  const [area, setArea] = useState<number | ''>('');
  const [location, setLocation] = useState('');
  const [style, setStyle] = useState('');
  const [duration, setDuration] = useState<number | ''>('');
  const [personnel, setPersonnel] = useState<number | ''>('');
  const [tags, setTags] = useState<string>(''); // 쉼표로 입력 → 배열 변환
  const [content, setContent] = useState<string>('');

  const [coverUrl, setCoverUrl] = useState('');
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);

  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 로그인 검사
  useEffect(() => {
    if (session === null) router.replace('/login?next=/portfolios/new');
  }, [session, router]);

  // 내 상점 로드
  useEffect(() => {
    const loadStores = async () => {
      if (!session?.user) return;

      const { data, error } = await supabase
        .from('stores')
        .select('id, name')
        .eq('owner_id', session.user.id); // 내 상점들

      if (!error && data) {
        setStores(data as MyStore[]);
        if (data.length === 1) {
          setStoreId(data[0].id);
        }
      }
    };
    loadStores();
  }, [session, supabase]);

  const uploadFile = async (file: File, type: 'cover' | 'gallery') => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`/api/portfolios/upload?type=${type}`, {
      method: 'POST',
      body: form,
    });
    const text = await res.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Non-JSON response: ${text.slice(0, 120)}...`);
    }
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data.url as string;
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploadingCover(true);
    try {
      const url = await uploadFile(f, 'cover');
      setCoverUrl(url);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploadingCover(false);
    }
  };

  const handleGalleryChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (!files.length) return;
    setUploadingGallery(true);
    try {
      const uploaded: string[] = [];
      for (const f of files) {
        const url = await uploadFile(f, 'gallery');
        uploaded.push(url);
      }
      setGalleryUrls(prev => [...prev, ...uploaded]);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploadingGallery(false);
    }
  };

  const onSubmit = async () => {
    if (!session?.user) return alert('로그인이 필요합니다.');
    if (!storeId) return alert('상점을 선택/생성해 주세요.');
    if (!projectTitle) return alert('프로젝트 제목은 필수입니다.');

    setSubmitting(true);
    try {
      const res = await fetch('/api/portfolios/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          storeId,
          projectTitle,
          type,
          area: area === '' ? null : Number(area),
          location,
          style,
          duration: duration === '' ? null : Number(duration),
          personnel: personnel === '' ? null : Number(personnel),
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          content,
          coverUrl,
          images: galleryUrls,
          published: true,
        }),
      });

      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Non-JSON response: ${text.slice(0, 120)}...`);
      }
      if (!res.ok) throw new Error(data.error || '등록 실패');

      alert('포트폴리오가 등록되었습니다.');
      router.replace('/provider/portfolio'); // 목록 페이지로 이동(원하는 경로로 변경)
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = useMemo(
    () => !!storeId && !!projectTitle && !!content,
    [storeId, projectTitle, content]
  );

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">포트폴리오 작성</h1>

      {/* 상점 선택 */}
      <label className="block font-medium">상점</label>
      {stores.length <= 1 ? (
        <p className="mb-4 text-sm text-gray-600">
          {stores.length === 1 ? `선택된 상점: ${stores[0].name}` : '상점이 없습니다. 먼저 상점을 등록해 주세요.'}
        </p>
      ) : (
        <select
          className="w-full border p-2 rounded mb-4"
          value={storeId}
          onChange={e => setStoreId(e.target.value)}
        >
          <option value="">상점을 선택하세요</option>
          {stores.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      )}

      <label className="block font-medium">프로젝트 제목</label>
      <input
        className="w-full border p-2 rounded mb-4"
        value={projectTitle}
        onChange={e => setProjectTitle(e.target.value)}
        placeholder="예) 신림동 20평 올리모델링"
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-medium">유형</label>
          <input
            className="w-full border p-2 rounded mb-4"
            value={type}
            onChange={e => setType(e.target.value)}
            placeholder="거실+주방 등"
          />
        </div>
        <div>
          <label className="block font-medium">면적(평/㎡)</label>
          <input
            type="number"
            className="w-full border p-2 rounded mb-4"
            value={area}
            onChange={e => setArea(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="20"
          />
        </div>
        <div>
          <label className="block font-medium">지역</label>
          <input
            className="w-full border p-2 rounded mb-4"
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="서울 관악구"
          />
        </div>
        <div>
          <label className="block font-medium">스타일</label>
          <input
            className="w-full border p-2 rounded mb-4"
            value={style}
            onChange={e => setStyle(e.target.value)}
            placeholder="모던 내추럴"
          />
        </div>
        <div>
          <label className="block font-medium">공사 기간(주)</label>
          <input
            type="number"
            className="w-full border p-2 rounded mb-4"
            value={duration}
            onChange={e => setDuration(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="5"
          />
        </div>
        <div>
          <label className="block font-medium">투입 인원(명)</label>
          <input
            type="number"
            className="w-full border p-2 rounded mb-4"
            value={personnel}
            onChange={e => setPersonnel(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="3"
          />
        </div>
      </div>

      <label className="block font-medium">태그 (쉼표로 구분)</label>
      <input
        className="w-full border p-2 rounded mb-4"
        value={tags}
        onChange={e => setTags(e.target.value)}
        placeholder="철거, 타일, 도장"
      />

      <label className="block font-medium">썸네일</label>
      <input type="file" accept="image/*" onChange={handleCoverChange} disabled={uploadingCover} />
      {coverUrl && <img src={coverUrl} alt="cover" className="w-full h-40 object-cover rounded my-3" />}

      <label className="block font-medium">갤러리 이미지(여러 장)</label>
      <input type="file" multiple accept="image/*" onChange={handleGalleryChange} disabled={uploadingGallery} />
      {!!galleryUrls.length && (
        <div className="grid grid-cols-3 gap-3 my-3">
          {galleryUrls.map((u, i) => (
            <img key={i} src={u} className="w-full h-24 object-cover rounded" />
          ))}
        </div>
      )}

      <label className="block font-medium">내용</label>
      <SunEditor
        setOptions={{
          height: '500px',
          buttonList: [
            ['undo', 'redo'],
            ['font', 'fontSize', 'formatBlock'],
            ['bold', 'italic', 'underline', 'strike'],
            ['fontColor', 'hiliteColor'],
            ['align', 'horizontalRule', 'list', 'table'],
            ['link', 'image', 'video'],
            ['codeView'],
          ],
          imageUploadUrl: '', // 에디터 자체 업로드는 끄고, 위 업로드 버튼 사용
          imageResizing: true,
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
