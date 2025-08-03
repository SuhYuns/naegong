// app/chat/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession, useSupabaseClient, useSessionContext } from '@supabase/auth-helpers-react';
import Link from 'next/link';
import { fetchMyRooms } from '@/lib/chat';
import { useRouter } from 'next/navigation';

export default function ChatListPage() {
  const { isLoading } = useSessionContext();
  const session = useSession();
  const supabase = useSupabaseClient<any>();
  const router = useRouter();
  const [items, setItems] = useState<
    { room_id: string; other_id: string | null; last_content?: string | null; last_at?: string | null; unread_count: number }[]
  >([]);

  useEffect(() => {
  if (isLoading) return;

  if (!session) {
    router.replace('/login?next=/chat');
    return;
  }

  const me = session.user.id;

  const load = async () => {
    try {
      const data = await fetchMyRooms(supabase, me);
      setItems(data);
    } catch (e) {
      console.error(e);
    }
  };

  // 리턴값을 사용하지 않는 비동기 호출은 명시적으로 무시
  void load();

  // 핸들러는 Promise를 반환하지 않도록 래핑
  const ch = supabase
    .channel('chat-list')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'chat_messages' },
      async () => {
        await load();
      }
    )
    .subscribe();

  // cleanup
  return () => {
    supabase.removeChannel(ch);
  };
}, [isLoading, session, supabase, router]);

  if (isLoading) return <div className="p-6">로딩 중…</div>;
  if (!session) return null;

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-4">내 채팅함</h1>
      <div className="space-y-3">
        {items.map((it) => (
          <Link
            key={it.room_id}
            href={`/chat/${it.room_id}`}
            className="flex items-center justify-between rounded border p-3 hover:bg-gray-50"
          >
            <div>
              <div className="font-medium">
                상대: {it.other_id ? it.other_id.slice(0, 8) : '알 수 없음'}
              </div>
              <div className="text-sm text-gray-500 line-clamp-1">
                {it.last_content || '메시지가 없습니다'}
              </div>
            </div>
            {it.unread_count > 0 && (
              <span className="ml-2 inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-yellow-500 px-2 text-xs text-white">
                {it.unread_count}
              </span>
            )}
          </Link>
        ))}
        {items.length === 0 && <p className="text-gray-500">진행 중인 채팅이 없어요.</p>}
      </div>
    </div>
  );
}
