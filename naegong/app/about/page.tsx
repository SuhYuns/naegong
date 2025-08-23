// app/manage/page.tsx
import Link from 'next/link';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/database';

export default async function About() {

  return (
    <div className="container mx-auto px-4 py-8">
        <h1>내공 소개</h1>
    </div>
  );
}
