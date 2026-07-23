'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Brain, LayoutDashboard, Layers, Mic, Flame, Sparkles, LogOut, Bell, BookOpen, User as UserIcon } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  const [userInfo, setUserInfo] = useState<{
    displayName: string
    avatarUrl?: string | null
    email?: string | null
    streak: number
  }>({
    displayName: 'Học Viên OpenQuiz',
    avatarUrl: null,
    email: null,
    streak: 1,
  })

  useEffect(() => {
    async function loadUserData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const fullName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split('@')[0] ||
          'Học Viên OpenQuiz'

        const avatar = user.user_metadata?.avatar_url || null

        // Query profiles table for streak count
        const { data: profile } = await supabase
          .from('profiles')
          .select('streak_count')
          .eq('id', user.id)
          .single()

        setUserInfo({
          displayName: fullName,
          avatarUrl: avatar,
          email: user.email,
          streak: profile?.streak_count || 1,
        })
      }
    }

    loadUserData()
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navItems = [
    { name: 'Bảng Điều Khiển', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Bộ Từ Vựng', href: '/sets', icon: Layers },
    { name: 'Luyện Nói AI', href: '/speaking', icon: Mic },
    { name: 'Bài Học SRS', href: '/srs', icon: BookOpen },
  ]

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 glass-panel border-r border-slate-800/80 p-6 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo Header */}
          <Link href="/" className="flex items-center gap-3 mb-8 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                OpenQuiz <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">AI</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Active Speaking SRS</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                    isActive
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 font-semibold shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-purple-400' : 'text-slate-500'}`} />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* User Profile Card & Sign Out */}
        <div className="pt-6 border-t border-slate-800/80 space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            {userInfo.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={userInfo.avatarUrl}
                alt="Avatar"
                className="w-10 h-10 rounded-full border border-purple-500/40 object-cover shadow-md"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                {userInfo.displayName.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate">{userInfo.displayName}</div>
              <div className="text-[10px] text-slate-400 truncate">
                {userInfo.email || 'Tài khoản thành viên'}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <button
              onClick={handleSignOut}
              className="hover:text-red-400 flex items-center gap-1.5 transition-colors text-slate-400"
            >
              <LogOut className="w-4 h-4 text-slate-500" />
              <span>Đăng xuất</span>
            </button>
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live DB
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 glass-panel border-b border-slate-800/80 px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-white hidden sm:block">Bảng Điều Khiển Học Tập</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Streak Counter Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold shadow-sm">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400/20 animate-bounce" />
              <span>Chuỗi {userInfo.streak} Ngày 🔥</span>
            </div>

            {/* AI Generator Quick Button */}
            <Link
              href="/sets"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-bold transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Tạo Từ Vựng AI</span>
            </Link>
          </div>
        </header>

        {/* Main Content Viewport */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
