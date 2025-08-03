// app/chat/[roomId]/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession, useSupabaseClient, useSessionContext } from '@supabase/auth-helpers-react';
import { fetchRoomMessages, subscribeRoomMessages, sendMessage, markRoomRead, ChatMessage } from '@/lib/chat';

export default function ChatRoomPage() {
  const { roomId } = useParams() as { roomId: string };
  const { isLoading } = useSessionContext();
  const session = useSession();
  const supabase = useSupabaseClient<any>();
  const router = useRouter();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!session) {
      router.replace('/login?next=' + encodeURIComponent(`/chat/${roomId}`));
    }
  }, [isLoading, session, roomId, router]);

  useEffect(() => {
    if (!session?.user || !roomId) return;

    let unsub = () => {};
    (async () => {
      try {
        // 내가 참가자인지 확인(내 참가자 row만 보이는 정책이므로 아래 쿼리로 충분)
        const { data: meRow, error: meErr } = await supabase
          .from('chat_room_participants')
          .select('room_id')
          .eq('room_id', roomId)
          .eq('user_id', session.user.id)
          .maybeSingle();
        if (meErr || !meRow) {
          alert('접근 권한이 없습니다.');
          router.replace('/chat');
          return;
        }

        const initial = await fetchRoomMessages(supabase, roomId);
        setMessages(initial);
        await markRoomRead(supabase, roomId, session.user.id);

        unsub = subscribeRoomMessages(supabase, roomId, async (m) => {
          setMessages((prev) => [...prev, m]);
          await markRoomRead(supabase, roomId, session.user!.id).catch(() => {});
        });
      } catch (e) {
        console.error(e);
      }
    })();

    return () => {
      unsub();
    };
  }, [session?.user, roomId, supabase, router]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  if (isLoading || !session) return <div className="p-6">로딩 중…</div>;

  const me = session.user.id;

  const onSend = async () => {
    const t = text.trim();
    if (!t) return;
    setText('');

    // 낙관적 append
    const temp: ChatMessage = {
      id: `temp-${Date.now()}`,
      room_id: roomId,
      sender_id: me,
      content: t,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, temp]);

    try {
      await sendMessage(supabase, roomId, me, t);
    } catch (e) {
      console.error(e);
      alert('전송 실패');
      // 실패 시 롤백(선택)
      setMessages((prev) => prev.filter((m) => m.id !== temp.id));
      setText(t);
    }
  };

  const keyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onSend();
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <div className="mb-3 flex items-center justify-between">
        <button onClick={() => router.back()} className="text-sm text-gray-600 hover:text-gray-800">← 뒤로</button>
        <h1 className="text-lg font-semibold">채팅</h1>
        <div />
      </div>

      <div ref={listRef} className="border rounded bg-white h-[60vh] overflow-y-auto p-3">
        {messages.map((m) => {
          const mine = m.sender_id === me;
          return (
            <div key={m.id} className={`my-1 flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm shadow ${mine ? 'bg-yellow-100' : 'bg-gray-100'}`}>
                <div className="whitespace-pre-wrap break-words">{m.content}</div>
                <div className="mt-1 text-[11px] text-gray-400 text-right">
                  {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={keyDown}
          className="flex-1 border rounded px-3 py-2"
          placeholder="메시지를 입력하세요…"
        />
        <button onClick={onSend} className="px-4 py-2 rounded bg-yellow-500 text-white hover:bg-yellow-600">
          전송
        </button>
      </div>
    </div>
  );
}
