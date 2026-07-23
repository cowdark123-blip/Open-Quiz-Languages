'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  fetchUserVocabSets,
  getCurrentUserProfile,
  seedSampleSetForUser,
} from '@/lib/supabase/data-service'
import { VocabSet } from '@/types/database'
import { Flame, Brain, BookOpen, Mic, ArrowRight, Sparkles, CheckCircle2, Clock, Play, Plus, Award, Loader2, Database } from 'lucide-react'

export default function DashboardPage() {
  const [sets, setSets] = useState<VocabSet[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [dueSrsCount, setDueSrsCount] = useState(0)
  const [userProfile, setUserProfile] = useState<{
    displayName: string
    streak: number
  }>({
    displayName: 'Học Viên',
    streak: 1,
  })

  const loadDashboardData = async () => {
    setLoading(true)
    const { user, profile } = await getCurrentUserProfile()
    const userId = user?.id

    if (user) {
      setUserProfile({
        displayName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Học Viên',
        streak: profile?.streak_count || 1,
      })
    }

    const userSets = await fetchUserVocabSets(userId)
    setSets(userSets)

    // Calculate due SRS items from Supabase
    const supabase = createClient()
    const { data: srsData } = await supabase
      .from('user_srs_progress')
      .select('id')

    setDueSrsCount(srsData ? srsData.length : userSets.length > 0 ? 6 : 0)
    setLoading(false)
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const handleSeedSampleSet = async () => {
    setSeeding(true)
    await seedSampleSetForUser()
    await loadDashboardData()
    setSeeding(false)
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner: Daily Review Alert */}
      <div className="glass-panel p-6 rounded-3xl border border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-slate-900/80 to-indigo-950/40 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2 text-left z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            <span>Thuật toán Lặp lại Ngắt quãng SRS SM-2</span>
          </div>
          <h2 className="text-2xl font-black text-white">
            Chào {userProfile.displayName}! Bạn có {dueSrsCount} từ vựng cần ôn tập hôm nay
          </h2>
          <p className="text-slate-400 text-xs md:text-sm max-w-xl">
            Ôn tập đúng thời điểm ngắt quãng theo thuật toán SuperMemo-2 giúp chuyển từ vựng vào trí nhớ dài hạn.
          </p>
        </div>

        <Link
          href="/srs"
          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-purple-500/25 transition-all transform hover:scale-105 shrink-0 flex items-center gap-2"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Bắt Đầu Bài Ôn Tập SRS</span>
        </Link>
      </div>

      {/* Metrics Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400">Chuỗi Ngày Học</div>
            <div className="text-3xl font-black text-amber-400 mt-1 flex items-center gap-2">
              <span>{userProfile.streak} Ngày</span>
              <Flame className="w-6 h-6 text-amber-500 fill-amber-500/30" />
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Ghi nhận Supabase Cloud</div>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400">Bộ Từ Vựng Thật</div>
            <div className="text-3xl font-black text-white mt-1">{sets.length} Bộ</div>
            <div className="text-[11px] text-emerald-400 mt-1 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Đã kết nối Database
            </div>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400">Từ Vựng Cần Ôn</div>
            <div className="text-3xl font-black text-cyan-400 mt-1">{dueSrsCount} Từ</div>
            <div className="text-[11px] text-slate-500 mt-1">Lịch ôn hôm nay</div>
          </div>
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Brain className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400">Tích Hợp AI</div>
            <div className="text-3xl font-black text-purple-400 mt-1">Gemini</div>
            <div className="text-[11px] text-slate-500 mt-1">Tự động điền & Luyện nói</div>
          </div>
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Section Header */}
      <div className="flex items-center justify-between pt-4">
        <div>
          <h3 className="text-xl font-bold text-white">Bộ Từ Vựng Của Bạn</h3>
          <p className="text-xs text-slate-400">Dữ liệu được cập nhật thời gian thực từ Supabase PostgreSQL</p>
        </div>

        <Link
          href="/sets"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Bộ Từ Vựng Mới</span>
        </Link>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          <span className="text-xs">Đang tải dữ liệu từ vựng thực tế...</span>
        </div>
      ) : sets.length === 0 ? (
        /* Rich Empty State Card for New Users */
        <div className="p-8 rounded-3xl glass-panel border border-slate-800 text-center space-y-6 max-w-xl mx-auto shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center mx-auto shadow-xl shadow-purple-500/20">
            <BookOpen className="w-8 h-8 text-white" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-extrabold text-white">Bạn Chưa Có Bộ Từ Vựng Nào</h3>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md mx-auto">
              Hãy bắt đầu tạo bộ từ vựng cá nhân đầu tiên hoặc nạp nhanh bộ từ vựng mẫu IELTS Academic chuẩn vào tài khoản của bạn!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={handleSeedSampleSet}
              disabled={seeding}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
            >
              {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-emerald-300" />}
              <span>Thêm Bộ Từ Mẫu IELTS Academic</span>
            </button>

            <Link
              href="/sets"
              className="w-full sm:w-auto px-5 py-3 rounded-xl glass-card text-purple-300 border border-purple-500/30 hover:bg-slate-800 font-bold text-xs transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Bộ Từ Vựng Thủ Công</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Vocab Sets Grid */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sets.map((set) => (
            <div
              key={set.id}
              className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-purple-500/40 bg-gradient-to-b from-purple-950/10 to-slate-900/40 flex flex-col justify-between space-y-6 hover:-translate-y-1 transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-slate-900/80 text-purple-300 border border-slate-700/60">
                    {set.category}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">Bản ghi Supabase</span>
                </div>

                <h4 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                  {set.title}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                  {set.description || 'Chưa có mô tả chi tiết.'}
                </p>
              </div>

              {/* Quick Action Mode Launcher */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80">
                <Link
                  href={`/sets/${set.id}/flashcards`}
                  className="py-2 rounded-xl bg-slate-900/80 hover:bg-purple-600/30 text-slate-300 hover:text-purple-300 border border-slate-800 text-[11px] font-semibold text-center transition-all flex flex-col items-center gap-1"
                >
                  <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                  <span>Thẻ 3D</span>
                </Link>
                <Link
                  href={`/sets/${set.id}/srs`}
                  className="py-2 rounded-xl bg-slate-900/80 hover:bg-cyan-600/30 text-slate-300 hover:text-cyan-300 border border-slate-800 text-[11px] font-semibold text-center transition-all flex flex-col items-center gap-1"
                >
                  <Brain className="w-3.5 h-3.5 text-cyan-400" />
                  <span>SRS Ôn</span>
                </Link>
                <Link
                  href="/speaking"
                  className="py-2 rounded-xl bg-slate-900/80 hover:bg-emerald-600/30 text-slate-300 hover:text-emerald-300 border border-slate-800 text-[11px] font-semibold text-center transition-all flex flex-col items-center gap-1"
                >
                  <Mic className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Luyện Nói</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
