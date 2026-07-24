'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  BookOpen,
  MessageSquare,
  PenTool,
  BookText,
  Headphones,
  Trophy,
  Sparkles,
  Layers,
  Brain,
  CheckCircle2,
  Clock,
  Plus,
} from 'lucide-react'
import { OptionsBar } from '@/components/dashboard/OptionsBar'
import { SRSNotificationBanner } from '@/components/dashboard/SRSNotificationBanner'
import { LearnedWordsWidget } from '@/components/dashboard/LearnedWordsWidget'
import { DecksGrid } from '@/components/dashboard/DecksGrid'
import SRSForecastChart from '@/components/SRSForecastChart'
import { getCurrentUserProfile } from '@/lib/supabase/data-service'

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [displayName, setDisplayName] = useState('Học Viên')

  useEffect(() => {
    async function loadUser() {
      const { user } = await getCurrentUserProfile()
      if (user) {
        setDisplayName(
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split('@')[0] ||
          'Học Viên'
        )
      }
    }
    loadUser()
  }, [])

  return (
    <div className="min-w-[300px] min-h-[350px] w-full h-full max-w-7xl mx-auto space-y-8 pb-12">
      {/* 1. Header Options Bar with Search & Switches */}
      <OptionsBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      {/* 2. Welcome Banner & Spaced Repetition Notification */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Xin chào, {displayName}!</span>
              <Sparkles className="w-6 h-6 text-purple-400" />
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Chào mừng quay trở lại hệ thống học tập thông minh OpenQuiz AI.
            </p>
          </div>
        </div>

        <SRSNotificationBanner />
      </div>

      {/* 3. Learned Words Counter & SRS Statistics KPI Row */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-400" />
          <span>Thống Kê Tiến Độ Học Từ Vựng</span>
        </h3>
        <LearnedWordsWidget />
      </div>

      {/* 4. Ecosystem Navigation Grid */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
          <Brain className="w-4 h-4 text-cyan-400" />
          <span>Hệ Sinh Thái Học Tập AI</span>
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Link
            href="/sets"
            className="glass-card p-4 rounded-2xl border border-slate-800 hover:border-purple-500/50 hover:bg-purple-900/10 flex flex-col items-center justify-center text-center gap-2.5 transition-all group shadow-md"
          >
            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-purple-300">
                Bộ Từ Vựng & SRS
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Flashcard & SM-2</div>
            </div>
          </Link>

          <Link
            href="/conversation"
            className="glass-card p-4 rounded-2xl border border-slate-800 hover:border-blue-500/50 hover:bg-blue-900/10 flex flex-col items-center justify-center text-center gap-2.5 transition-all group shadow-md"
          >
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-blue-300">
                Hội Thoại AI
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Roleplay thực tế</div>
            </div>
          </Link>

          <Link
            href="/grammar"
            className="glass-card p-4 rounded-2xl border border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-900/10 flex flex-col items-center justify-center text-center gap-2.5 transition-all group shadow-md"
          >
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <PenTool className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-emerald-300">
                Trợ Lý Ngữ Pháp
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Sửa lỗi bài viết</div>
            </div>
          </Link>

          <Link
            href="/reading"
            className="glass-card p-4 rounded-2xl border border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-900/10 flex flex-col items-center justify-center text-center gap-2.5 transition-all group shadow-md"
          >
            <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
              <BookText className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-cyan-300">
                Đọc Hiểu AI
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Tạo bài đọc tự động</div>
            </div>
          </Link>

          <Link
            href="/dictation"
            className="glass-card p-4 rounded-2xl border border-slate-800 hover:border-amber-500/50 hover:bg-amber-900/10 flex flex-col items-center justify-center text-center gap-2.5 transition-all group shadow-md"
          >
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-amber-300">
                Nghe Chép
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Luyện nghe sâu</div>
            </div>
          </Link>

          <Link
            href="/quiz"
            className="glass-card p-4 rounded-2xl border border-slate-800 hover:border-rose-500/50 hover:bg-rose-900/10 flex flex-col items-center justify-center text-center gap-2.5 transition-all group shadow-md"
          >
            <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400 group-hover:scale-110 transition-transform">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-rose-300">
                Bài Kiểm Tra
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Trắc nghiệm chọn từ</div>
            </div>
          </Link>
        </div>
      </div>

      {/* 5. SRS Forecast Chart */}
      <SRSForecastChart />

      {/* 6. Decks / Word Sets Grid Section */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-extrabold text-white">Bộ Từ Vựng Của Bạn</h3>
            <p className="text-xs text-slate-400">
              Danh sách các bộ từ vựng cá nhân & cộng đồng với thuật toán SM-2
            </p>
          </div>
        </div>

        <DecksGrid searchQuery={searchQuery} />
      </div>
    </div>
  )
}
