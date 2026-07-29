'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Play, CheckCircle2, Sparkles, X, ChevronRight, Brain } from 'lucide-react'
import { fetchDueSRSItems } from '@/lib/supabase/data-service'
import { VocabItem } from '@/types/database'

export function SRSNotificationBanner() {
  const [dueItems, setDueItems] = useState<VocabItem[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  const loadDueItems = async () => {
    setLoading(true)
    const items = await fetchDueSRSItems()
    setDueItems(items)
    setLoading(false)
  }

  useEffect(() => {
    loadDueItems()

    const handleFocus = () => loadDueItems()
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  if (dismissed || loading) return null

  const dueCount = dueItems.length

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="glass-panel p-5 md:p-6 rounded-3xl border border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-slate-900/90 to-indigo-950/40 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-2xl"
      >
        {/* Dynamic Glow background ornament */}
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        <div className="flex items-start gap-4 z-10 flex-1">
          <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 shrink-0">
            <Brain className="w-6 h-6 animate-pulse" />
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[11px] font-bold">
              <Clock className="w-3 h-3 text-purple-400" />
              <span>Lịch Ôn Lặp Ngắt Quãng Hôm Nay</span>
            </div>

            {dueCount > 0 ? (
              <>
                <h3 className="text-xl font-extrabold text-white tracking-tight">
                  Bạn có <span className="text-purple-300 underline decoration-purple-500">{dueCount} từ vựng</span> đến lịch lặp ngắt quãng hôm nay!
                </h3>
                <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                  Thuật toán SM-2 tính toán chính xác thời điểm não bộ sắp quên để giúp bạn ghi nhớ từ lâu bền nhất.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                  <span>Tuyệt vời! Bạn đã hoàn thành toàn bộ thẻ ôn tập hôm nay 🎉</span>
                </h3>
                <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                  Tất cả từ vựng đã được tối ưu hóa. Hãy dành thời gian học thêm từ vựng mới hoặc rèn luyện kỹ năng Nói!
                </p>
              </>
            )}
          </div>
        </div>

        {/* Action Button & Dismiss */}
        <div className="flex items-center gap-3 z-10 w-full md:w-auto justify-end">
          {dueCount > 0 ? (
            <Link
              href="/srs"
              className="w-full md:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-xl shadow-purple-500/25 transition-all transform hover:scale-105 flex items-center justify-center gap-2 shrink-0"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Bắt Đầu Ôn Tập Ngay ({dueCount})</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              href="/sets"
              className="w-full md:w-auto px-5 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-bold text-xs transition-all flex items-center justify-center gap-2 shrink-0"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Xem Danh Sách Từ Vựng</span>
            </Link>
          )}

          <button
            onClick={() => setDismissed(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all shrink-0"
            aria-label="Ẩn thông báo"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
