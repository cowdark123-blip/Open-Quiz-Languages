'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { BookOpen, Brain, Trophy, Calendar, Layers } from 'lucide-react'
import { VocabSet } from '@/types/database'

interface WordSetCardProps {
  set: VocabSet
  learnedCount?: number
}

// Helper to determine CEFR level badge from category or title
const getLevelBadge = (set: VocabSet) => {
  const cat = (set.category || '').toLowerCase()
  const title = (set.title || '').toLowerCase()

  if (cat.includes('c2') || title.includes('c2') || title.includes('master')) return { level: 'C2', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' }
  if (cat.includes('c1') || title.includes('c1') || title.includes('advanced')) return { level: 'C1', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' }
  if (cat.includes('b2') || title.includes('b2') || title.includes('ielts')) return { level: 'B2', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' }
  if (cat.includes('b1') || title.includes('b1') || title.includes('intermediate')) return { level: 'B1', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' }
  if (cat.includes('a2') || title.includes('a2')) return { level: 'A2', color: 'bg-teal-500/20 text-teal-300 border-teal-500/40' }
  return { level: 'A1-C2', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' }
}

export function WordSetCard({ set, learnedCount = 0 }: WordSetCardProps) {
  const badge = getLevelBadge(set)
  const totalItems = set.item_count || 0
  const progressPercent = totalItems > 0 ? Math.min(100, Math.round((learnedCount / totalItems) * 100)) : 0

  const formattedDate = set.created_at
    ? new Date(set.created_at).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : 'Gần đây'

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="glass-card p-6 rounded-3xl border border-slate-800 hover:border-purple-500/40 bg-gradient-to-b from-slate-900/60 via-slate-900/40 to-slate-950/80 flex flex-col justify-between space-y-5 shadow-xl group"
    >
      {/* Top Header info */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className={`text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-1 rounded-full border ${badge.color}`}>
            {badge.level} • {set.category || 'Chung'}
          </span>
          <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>{totalItems} từ</span>
          </span>
        </div>

        <h4 className="text-lg font-extrabold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
          {set.title}
        </h4>
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 min-h-[36px]">
          {set.description || 'Chưa có mô tả chi tiết cho bộ từ vựng này.'}
        </p>
      </div>

      {/* Completion Progress Bar */}
      <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
          <span>Tiến độ ghi nhớ</span>
          <span className="text-purple-300 font-bold">{progressPercent}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 rounded-full"
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-500" />
            Tạo ngày: {formattedDate}
          </span>
          <span>{set.is_public ? 'Cộng đồng' : 'Cá nhân'}</span>
        </div>
      </div>

      {/* Quick Action Mode Launcher */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80">
        <Link
          href={`/sets/${set.id}/flashcards`}
          className="py-2.5 px-2 rounded-xl bg-slate-900/90 hover:bg-purple-600/30 text-slate-300 hover:text-purple-200 border border-slate-800 hover:border-purple-500/40 text-[11px] font-bold text-center transition-all flex flex-col items-center gap-1 shadow-sm"
        >
          <BookOpen className="w-4 h-4 text-purple-400" />
          <span>Thẻ 3D</span>
        </Link>

        <Link
          href={`/srs?preselect=${set.id}`}
          className="flex-1 py-3 px-4 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-bold transition-colors flex justify-center items-center gap-2 group/btn"
        >
          <Brain className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
          <span>Ôn SRS</span>
        </Link>

        <Link
          href={`/quiz?preselect=${set.id}`}
          className="py-2.5 px-2 rounded-xl bg-slate-900/90 hover:bg-rose-600/30 text-slate-300 hover:text-rose-200 border border-slate-800 hover:border-rose-500/40 text-[11px] font-bold text-center transition-all flex flex-col items-center gap-1 shadow-sm"
        >
          <Trophy className="w-4 h-4 text-rose-400" />
          <span>Kiểm Tra</span>
        </Link>
      </div>
    </motion.div>
  )
}
