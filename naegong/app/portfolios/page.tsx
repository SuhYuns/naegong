// app/portfolios/page.tsx
import { Suspense } from 'react';
import PortfolioListClient from './_list';

export const dynamic = 'force-dynamic'; // Supabase/세션 사용 시 정적화 방지(권장)
// 또는 export const revalidate = 0;

export default function PortfolioPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-10">로딩 중…</div>}>
      <PortfolioListClient />
    </Suspense>
  );
}
