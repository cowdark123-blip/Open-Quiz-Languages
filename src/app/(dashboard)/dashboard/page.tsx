'use client'

import Link from 'next/link'
import { Flame, Brain, BookOpen, Mic, ArrowRight, Sparkles, CheckCircle2, Clock, Play, Plus, Award } from 'lucide-react'

export default function DashboardPage() {
  const sampleSets = [
    {
      id: 'ielts-core-01',
      title: 'IELTS Academic Vocab 7.5+',
      description: 'Các từ vựng ăn điểm cho Speaking & Writing Task 2',
      item_count: 24,
      mastered_count: 18,
      category: 'IELTS',
      color: 'from-purple-600/20 to-indigo-600/20',
      borderColor: 'border-purple-500/30',
    },
    {
      id: 'toeic-business-02',
      title: 'Tiếng Anh Giao Tiếp Công Sở',
      description: 'Từ vựng & cụm từ hội họp, báo cáo dự án chuyên nghiệp',
      item_count: 30,
      mastered_count: 12,
      category: 'Business',
      color: 'from-cyan-600/20 to-blue-600/20',
      borderColor: 'border-cyan-500/30',
    },
    {
      id: 'speaking-reflex-03',
      title: 'Từ Vựng Luyện Phản Xạ Nhanh',
      description: 'Tập trung luyện phản xạ nói với các câu phức ngắn',
      item_count: 15,
      mastered_count: 15,
      category: 'Speaking',
      color: 'from-emerald-600/20 to-teal-600/20',
      borderColor: 'border-emerald-500/30',
    },
  ]

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner: Daily Review Alert */}
      <div className="glass-panel p-6 rounded-3xl border border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-slate-900/80 to-indigo-950/40 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2 text-left z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            <span>Thuật toán Lặp lại Ngắt quãng SRS SM-2</span>
          </div>
          <h2 className="text-2xl font-black text-white">Bạn có 10 từ vựng cần ôn tập hôm nay!</h2>
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
              <span>5 Ngày</span>
              <Flame className="w-6 h-6 text-amber-500 fill-amber-500/30" />
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Đã học hôm nay: 25 phút</div>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400">Tổng Số Từ Đã Học</div>
            <div className="text-3xl font-black text-white mt-1">69 Từ</div>
            <div className="text-[11px] text-emerald-400 mt-1 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> 45 từ thành thạo
            </div>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400">Điểm Luyện Nói Trung Bình</div>
            <div className="text-3xl font-black text-cyan-400 mt-1">91.5</div>
            <div className="text-[11px] text-slate-500 mt-1">Xếp loại: Xuất sắc</div>
          </div>
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Mic className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400">Bộ Từ Vựng Đã Tạo</div>
            <div className="text-3xl font-black text-purple-400 mt-1">3 Bộ</div>
            <div className="text-[11px] text-slate-500 mt-1">Tự động điền AI</div>
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
          <p className="text-xs text-slate-400">Chọn bộ từ vựng để bắt đầu học thẻ 3D, ôn SRS hoặc luyện nói AI</p>
        </div>

        <Link
          href="/sets"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Bộ Từ Vựng Mới</span>
        </Link>
      </div>

      {/* Vocab Sets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sampleSets.map((set) => (
          <div
            key={set.id}
            className={`glass-card p-6 rounded-2xl border ${set.borderColor} bg-gradient-to-b ${set.color} flex flex-col justify-between space-y-6 hover:-translate-y-1 transition-all group`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-slate-900/80 text-purple-300 border border-slate-700/60">
                  {set.category}
                </span>
                <span className="text-xs text-slate-400 font-medium">{set.item_count} từ vựng</span>
              </div>

              <h4 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                {set.title}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">{set.description}</p>
            </div>

            {/* Mastery Progress Bar */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Độ thành thạo</span>
                <span className="font-semibold text-purple-300">
                  {Math.round((set.mastered_count / set.item_count) * 100)}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full"
                  style={{ width: `${(set.mastered_count / set.item_count) * 100}%` }}
                />
              </div>
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
    </div>
  )
}
