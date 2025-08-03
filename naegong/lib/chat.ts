// lib/chat.ts
import type { SupabaseClient } from '@supabase/supabase-js';

export type ChatMessage = {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export type ChatRoomListItem = {
  room_id: string;
  other_id: string | null;
  last_content?: string | null;
  last_at?: string | null;
  unread_count: number;
};

/** DM 방 보장: 있으면 재사용, 없으면 RPC로 생성(두 참가자 동시 등록) */
export async function ensureDmRoom(
  supabase: SupabaseClient,
  me: string,
  other: string
): Promise<string> {
  if (!me || !other) throw new Error('Invalid user ids');
  if (me === other) throw new Error('본인과의 DM은 허용되지 않습니다.');

  // 먼저 RPC로 시도 (RLS 우회 및 원샷 생성)
  const { data: rid, error: rpcErr } = await supabase.rpc('create_or_get_dm_room', {
    u1: me,
    u2: other,
  });

  if (rpcErr) throw rpcErr;
  if (!rid) throw new Error('Failed to create or get DM room');
  return rid as unknown as string;
}

/** 메시지 보내기 */
export async function sendMessage(
  supabase: SupabaseClient,
  roomId: string,
  senderId: string,
  content: string
) {
  const text = content.trim();
  if (!text) return;
  const { error } = await supabase
    .from('chat_messages')
    .insert({ room_id: roomId, sender_id: senderId, content: text });
  if (error) throw error;
}

/** 읽음 표시 */
export async function markRoomRead(
  supabase: SupabaseClient,
  roomId: string,
  userId: string
) {
  const { error } = await supabase
    .from('chat_room_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('room_id', roomId)
    .eq('user_id', userId);
  if (error) throw error;
}

/** 방의 메시지 로드(기본 50개, 오래된 것 더 불러오기 지원) */
export async function fetchRoomMessages(
  supabase: SupabaseClient,
  roomId: string,
  opts?: { before?: string; limit?: number }
): Promise<ChatMessage[]> {
  const limit = opts?.limit ?? 50;

  let q = supabase
    .from('chat_messages')
    .select('id, room_id, sender_id, content, created_at')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (opts?.before) q = q.lt('created_at', opts.before);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).slice().reverse() as ChatMessage[];
}

/** 실시간 구독 (INSERT) */
export function subscribeRoomMessages(
  supabase: SupabaseClient,
  roomId: string,
  onInsert: (m: ChatMessage) => void
) {
  const ch = supabase
    .channel(`room-${roomId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` },
      (payload) => onInsert(payload.new as ChatMessage)
    )
    .subscribe();
  return () => supabase.removeChannel(ch);
}

/** 내 채팅함: RPC 있으면 RPC, 없으면 폴백 조합 */
export async function fetchMyRooms(
  supabase: SupabaseClient,
  me: string
): Promise<ChatRoomListItem[]> {
  const { data: list, error: rpcErr } = await supabase.rpc('my_chat_list', { u: me });
  if (!rpcErr && list) {
    const rows = list as any[];
    return rows
      .map((r) => ({
        room_id: r.room_id,
        other_id: r.other_id ?? null,
        last_content: r.last_content ?? null,
        last_at: r.last_at ?? null,
        unread_count: r.unread_count ?? 0,
      }))
      .sort((a, b) => {
        const ta = a.last_at ? +new Date(a.last_at) : 0;
        const tb = b.last_at ? +new Date(b.last_at) : 0;
        return tb - ta;
      });
  }

  // 폴백: participants + messages 조합
  const { data: myParts, error } = await supabase
    .from('chat_room_participants')
    .select('room_id, last_read_at')
    .eq('user_id', me);
  if (error) throw error;
  const roomIds = (myParts ?? []).map((p) => p.room_id);
  if (!roomIds.length) return [];

  const { data: others, error: othersErr } = await supabase
    .from('chat_room_participants')
    .select('room_id, user_id')
    .in('room_id', roomIds)
    .neq('user_id', me);
  if (othersErr) throw othersErr;

  const out: ChatRoomListItem[] = [];
  for (const roomId of roomIds) {
    const other = (others ?? []).find((o: any) => o.room_id === roomId) ?? null;

    const { data: last } = await supabase
      .from('chat_messages')
      .select('content, created_at')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const lastRead = (myParts ?? []).find((p) => p.room_id === roomId)?.last_read_at ?? null;

    const { count } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomId)
      .neq('sender_id', me)
      .gt('created_at', lastRead ?? '1970-01-01');

    out.push({
      room_id: roomId,
      other_id: other?.user_id ?? null,
      last_content: last?.content ?? null,
      last_at: last?.created_at ?? null,
      unread_count: count ?? 0,
    });
  }

  return out.sort((a, b) => {
    const ta = a.last_at ? +new Date(a.last_at) : 0;
    const tb = b.last_at ? +new Date(b.last_at) : 0;
    return tb - ta;
  });
}
