'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, CheckCircle, Clock, Brain, Sparkles } from 'lucide-react'
import { useVocab } from '@/contexts/VocabContext'
import { fetchDueSRSItems, fetchAllUserSRSProgress } from '@/lib/supabase/data-service'

export function LearnedWordsWidget() {
  const { vocabItems, vocabSets, isLoading: vocabLoading } = useVocab()
  const [dueItemsList, setDueItemsList] = useState<any[]>([])
  const [srsProgressList, setSrsProgressList] = useState<any[]>([])
  const [trashIds, setTrashIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    async function loadStats() {
      setLoading(true)
      const [dueItems, progressList] = await Promise.all([
        fetchDueSRSItems(),
        fetchAllUserSRSProgress(),
      ])
      setDueItemsList(dueItems)
      setSrsProgressList(progressList)
      setLoading(false)
    }

    loadStats()
    const interval = setInterval(loadStats, 30_000)
    
    const updateTrash = () => {
      setTrashIds(JSON.parse(typeof window !== 'undefined' ? localStorage.getItem('openquiz_trash_ids') || '[]' : '[]'))
    }
    updateTrash()

    // Refresh when user navigates back to dashboard tab
    const onVisible = () => { if (document.visibilityState === 'visible') loadStats() }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('trash_updated', updateTrash)
    window.addEventListener('srs_updated', loadStats)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('trash_updated', updateTrash)
      window.removeEventListener('srs_updated', loadStats)
    }
  }, [vocabItems])

  // Filter out deleted sets
  const activeSetIds = new Set(vocabSets.filter(s => !trashIds.includes(s.id) && !s.category?.endsWith('__DELETED__')).map(s => s.id))
  const activeVocabItems = vocabItems.filter(item => activeSetIds.has(item.set_id))

  const totalWords = activeVocabItems.length
  const activeItemIds = new Set(activeVocabItems.map(i => i.id))
  // Use user_srs_progress as source of truth (vocab_items.is_mastered column doesn't exist in DB)
  const masteredCount = srsProgressList.filter(p => activeItemIds.has(p.item_id) && p.status === 'mastered').length
  const newCount = totalWords - masteredCount
  const activeDueCount = dueItemsList.filter(item => activeSetIds.has(item.set_id)).length

  const masteryPercentage = totalWords > 0 ? Math.round((masteredCount / totalWords) * 100) : 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* KPI 1: Total Learned Words */}
      <motion.div
        whileHover={{ y: -3 }}
        className="glass-card p-5 rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-950/20 via-slate-900/60 to-slate-900/40 relative overflow-hidden flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400">Số Từ Đã Học</span>
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="my-3 flex items-baseline justify-between">
          <div className="text-3xl font-black text-white tracking-tight">
            {loading || vocabLoading ? (
              <span className="animate-pulse text-slate-500">...</span>
            ) : (
              totalWords
            )}
          </div>
          <div className="text-xs text-purple-300 font-semibold flex items-center gap-1">
            <span>Tổng số từ</span>
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
            <span>Tiến độ lưu trữ</span>
            <span>{totalWords > 0 ? `${totalWords} từ` : '0 từ'}</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (totalWords / 50) * 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
            />
          </div>
        </div>
      </motion.div>

      {/* KPI 2: Mastered Words */}
      <motion.div
        whileHover={{ y: -3 }}
        className="glass-card p-5 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-slate-900/60 to-slate-900/40 relative overflow-hidden flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400">Đã Thành Thạo</span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="my-3 flex items-baseline justify-between">
          <div className="text-3xl font-black text-emerald-400 tracking-tight">
            {loading ? <span className="animate-pulse text-slate-500">...</span> : masteredCount}
          </div>
          <div className="text-xs text-emerald-300 font-semibold flex items-center gap-1">
            <span>{masteryPercentage}% tổng số</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
            <span>Tỷ lệ nhớ lâu</span>
            <span>{masteryPercentage}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${masteryPercentage}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
            />
          </div>
        </div>
      </motion.div>

      {/* KPI 3: New Words */}
      <motion.div
        whileHover={{ y: -3 }}
        className="glass-card p-5 rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-950/20 via-slate-900/60 to-slate-900/40 relative overflow-hidden flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400">Chưa Học</span>
          <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="my-3 flex items-baseline justify-between">
          <div className="text-3xl font-black text-red-400 tracking-tight">
            {loading ? <span className="animate-pulse text-slate-500">...</span> : newCount}
          </div>
          <div className="text-xs text-red-300 font-semibold">Cần ôn tập</div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
            <span>Chưa thành thạo</span>
            <span>{totalWords > 0 ? `${Math.round((newCount / totalWords) * 100)}%` : '0%'}</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${totalWords > 0 ? (newCount / totalWords) * 100 : 0}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
            />
          </div>
        </div>
      </motion.div>

      {/* KPI 4: SRS Review Due Count */}
      <motion.div
        whileHover={{ y: -3 }}
        className="glass-card p-5 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/20 via-slate-900/60 to-slate-900/40 relative overflow-hidden flex flex-col justify-between"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400">Cần Ôn Tập Ngay</span>
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-5 h-5 animate-spin-slow" />
          </div>
        </div>

        <div className="my-3 flex items-baseline justify-between">
          <div className="text-3xl font-black text-amber-400 tracking-tight">
            {loading ? <span className="animate-pulse text-slate-500">...</span> : activeDueCount}
          </div>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
            Hôm nay
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
            <span>Lịch thuật toán SM-2</span>
            <span className={activeDueCount > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
              {activeDueCount > 0 ? 'Cần xử lý' : 'Đã hoàn thành'}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: activeDueCount > 0 ? '100%' : '0%' }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
            />
          </div>
        </div>
      </motion.div>
    </div>
  )
}
