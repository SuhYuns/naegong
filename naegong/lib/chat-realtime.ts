// lib/chat-realtime.ts
'use client';

import { useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

/** 특정 대화방의 새 메시지 실시간 구독 */
export function useRealtimeConversation(
  conversationId: string,
  onNew: (row: any) => void
) {
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`conv-${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => onNew(payload.new)
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);
}

/** 알림(미확인) 카운트 실시간 */
export function useUnreadNotifications(onChange: (count: number) => void) {
  const supabase = createClientComponentClient();

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 최초 카운트
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      onChange(count || 0);

      // 실시간 반영
      const ch = supabase
        .channel(`noti-${user.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          async () => {
            const { count } = await supabase
              .from('notifications')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id)
              .eq('is_read', false);
            onChange(count || 0);
          }
        )
        .subscribe();

      cleanup = () => supabase.removeChannel(ch);
    })();

    return () => { cleanup?.(); };
  }, []);
}
