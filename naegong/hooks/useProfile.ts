// hooks/useProfile.ts
import { useEffect, useState } from 'react';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import type { Database } from '@/lib/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
// Insert 타입에서 id만 빼고 나머지를 사용
type ProfileUpsert = Omit<Database['public']['Tables']['profiles']['Insert'], 'id'>;

export default function useProfile() {
  const session = useSession();
  const supabase = useSupabaseClient<Database>();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      setProfile(data);
      setLoading(false);
    };
    fetch();
  }, [session, supabase]);

  const upsertProfile = async (updates: ProfileUpsert) => {
    if (!session?.user) return;
    const { error } = await supabase
      .from('profiles')
      .upsert({
        // updates에는 id가 없으므로 충돌 없이 id를 마지막에 지정
        ...updates,
        id: session.user.id,
      });
    if (error) console.error(error);
  };

  return { profile, loading, upsertProfile };
}
