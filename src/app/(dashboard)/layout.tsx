'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { VocabProvider } from '@/contexts/VocabContext'
import { FloatingNav } from '@/components/navigation/FloatingNav'
import { FloatingActionTools } from '@/components/navigation/FloatingActionTools'
import { LogOut } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
    streak: 0,
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
          streak: profile?.streak_count || 0,
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

  return (
    <VocabProvider>
      <div className="min-h-screen bg-transparent text-slate-100 flex flex-col relative overflow-x-clip">
        {/* Universal Floating Pill Navigation (Top on Desktop, Bottom on Mobile) */}
        <FloatingNav />
        <FloatingActionTools />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 md:pt-24 pb-28 md:pb-8">
          {/* Top Header Bar for Profile & Actions (optional, kept minimal since nav is floating) */}
          <header className="h-16 glass-panel border-b border-slate-800/80 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 md:hidden">
            <div className="flex items-center gap-3">
              <h1 className="text-base md:text-lg font-bold text-white">Bảng Điều Khiển Học Tập</h1>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={handleSignOut} className="text-slate-400 hover:text-red-400">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Main Content Viewport */}
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto relative safe-area-pb">
            {children}
          </main>
        </div>

        {/* Desktop user profile indicator - since we removed sidebar, we can put it top right */}
        <div className="hidden md:flex absolute top-6 right-8 z-40 items-center gap-4">
          <div className="flex items-center gap-3 p-1.5 pr-4 rounded-full bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 shadow-lg cursor-pointer hover:bg-slate-800/80 transition-colors">
            {userInfo.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={userInfo.avatarUrl}
                alt="Avatar"
                className="w-8 h-8 rounded-full border border-slate-700"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-inner">
                {userInfo.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white leading-tight">{userInfo.displayName}</span>
              <span className="text-[10px] text-slate-400 font-medium">
                {userInfo.streak > 0 ? `🔥 ${userInfo.streak} ngày streak` : 'Bắt đầu học ngay'}
              </span>
            </div>
          </div>
          <button onClick={handleSignOut} className="p-2 rounded-xl bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 text-slate-400 hover:text-red-400 hover:bg-slate-800/80 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </VocabProvider>
  )
}

