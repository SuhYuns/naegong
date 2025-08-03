import './globals.css';
import ClientLayout from '@/components/Layout';
import SupabaseProvider from '@/components/SupabaseProvider';

export const metadata = {
  title: '내공',
  description: '셀프 인테리어 중개 플랫폼',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <SupabaseProvider>
          <ClientLayout>{children}</ClientLayout>
        </SupabaseProvider>
      </body>
    </html>
  );
}
