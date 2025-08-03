// components/Layout.tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import { Menu, X, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';

// 미확인 알람 임포트
import { useUnreadNotifications } from '@/lib/chat-realtime'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const supabase = useSupabaseClient();
  const session = useSession();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const highlight = 'block text-yellow-500 hover:text-yellow-700';

  const [unread, setUnread] = useState(0);
  useUnreadNotifications(setUnread);


  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-md sticky top-0 z-10">
        {/* 상단 네비게이션 */}
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img src="/logo.png" alt="Service Logo" className="h-8 w-auto" />
            <span className="ml-2 text-xl font-bold text-gray-800">내공</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/about" className={highlight}>소개</Link>
            <Link href="/contractors" className={highlight}>장인 찾기</Link>
            <Link href="/chat" className={highlight}>메세지</Link>

            

            {session?.user ? (
              <>
                {session.user.user_metadata?.avatar_url && (
                  <>
                  <Link href="/login">
                    <img
                      src={session.user.user_metadata.avatar_url}
                      alt="Profile"
                      className="ml-4 h-8 w-8 rounded-full object-cover"
                    />
                  </Link>
                  </>
                  
                )}
                {/* <button
                  onClick={handleLogout}
                  className="ml-4 px-3 py-1 bg-red-100 text-red-600 text-sm rounded hover:bg-red-200"
                >
                  로그아웃
                </button> */}
                {/* <button
                  onClick={handleLogout}
                  className="text-red-600 text-sm hover:text-red-200"
                >
                  로그아웃
                </button> */}
              </>
            ) : (
              // <Link href="/login" className="ml-4 px-4 py-1 border text-sm rounded text-gray-700 hover:bg-gray-100">
              //   로그인
              // </Link>
              <Link href="/login" className="block text-black hover:text-gray-700">로그인</Link>
            )}

            {session?.user && (
              <Link href="/chat" className="relative text-gray-600 hover:text-gray-900">
                <Bell size={20} />
                {unread > 0 && (
                  <span className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs rounded-full px-1">
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
              </Link>
            )}
          </nav>

          <button
            className={`md:hidden focus:outline-none ${highlight}`}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* 모바일 드로어 */}
        {mobileOpen && (
          <div className="md:hidden bg-white shadow-lg">
            <nav className="px-4 py-4 space-y-3">
              <Link href="/about" className={highlight}>소개</Link>
              <Link href="/contractors" className={highlight}>시공자 찾기</Link>
              
              <Link href="/login" className="block px-1 py-1 text-sm text-gray-700 hover:bg-gray-100">
                {session?.user ? "내 정보" : "로그인"}
              </Link>
            </nav>
          </div>
        )}

        {/* 추가된 두 번째 행: 장인 콘솔 */}
        <div className="bg-gray-50">
          <div className="container mx-auto px-4 py-3 flex justify-end items-center">
            <div className="relative inline-block group">
              <div className="absolute -left-42 top-1/2 transform -translate-y-1/2 bg-gray-100 px-3 py-1 rounded-lg shadow text-xs whitespace-nowrap group-hover:hidden">
                전문 시공자라면 함께 하세요!
              </div>
              <Link
                href="/provider"
                className="px-4 py-2 bg-yellow-500 text-white text-sm rounded-full hover:brightness-90"
              >
                장인 콘솔
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="bg-gray-50">
        <div className="container mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} 내공. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
