'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Palette, Bug, Bell, Search, Filter, Sparkles, SlidersHorizontal } from 'lucide-react'
import { BackgroundSwitcher } from './BackgroundSwitcher'
import { BugReportModal } from './BugReportModal'
import { SRSNotificationDrawer } from './SRSNotificationDrawer'
import { StreakTracker } from './StreakTracker'
import { fetchDueSRSItems } from '@/lib/supabase/data-service'

interface OptionsBarProps {
  searchQuery?: string
  onSearchChange?: (query: string) => void
}

export function OptionsBar({ searchQuery = '', onSearchChange }: OptionsBarProps) {
  const [isThemeOpen, setIsThemeOpen] = useState(false)
  const [isBugOpen, setIsBugOpen] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [dueCount, setDueCount] = useState<number>(0)

  const loadDueCount = async () => {
    const dueItems = await fetchDueSRSItems()
    setDueCount(dueItems.length)
  }

  useEffect(() => {
    loadDueCount()
    const handleFocus = () => loadDueCount()
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  return (
    <>
      <div className="glass-panel p-3 md:p-4 rounded-3xl border border-slate-800 bg-slate-950/70 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 sticky top-4 z-20">
        {/* Search Bar Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder="Tìm kiếm bộ từ vựng, chủ đề..."
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/50 transition-all"
          />
        </div>

        {/* Options Toolbar Action Buttons */}
        <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-2.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {/* Streak Tracker Pill */}
          <StreakTracker />

          {/* Background Switcher Trigger Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsThemeOpen(true)}
            className="p-2.5 rounded-2xl bg-slate-900/80 hover:bg-purple-950/50 text-slate-300 hover:text-purple-300 border border-slate-800 hover:border-purple-500/40 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            title="Tùy chỉnh nền giao diện"
          >
            <Palette className="w-4 h-4 text-purple-400" />
            <span className="hidden lg:inline text-xs">Đổi Nền</span>
          </motion.button>

          {/* SRS Notification Bell with Unread Badge */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsNotificationOpen(true)}
            className="relative p-2.5 rounded-2xl bg-slate-900/80 hover:bg-cyan-950/50 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            title="Lịch ôn tập SRS"
          >
            <Bell className="w-4 h-4 text-cyan-400" />
            <span className="hidden lg:inline text-xs">Thông Báo SRS</span>

            {dueCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-extrabold text-[10px] shadow-lg animate-pulse min-w-[18px] text-center">
                {dueCount}
              </span>
            )}
          </motion.button>

          {/* Bug Report Trigger Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsBugOpen(true)}
            className="p-2.5 rounded-2xl bg-slate-900/80 hover:bg-rose-950/50 text-slate-300 hover:text-rose-300 border border-slate-800 hover:border-rose-500/40 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            title="Báo cáo sự cố (Report Bug)"
          >
            <Bug className="w-4 h-4 text-rose-400" />
            <span className="hidden lg:inline text-xs">Báo Lỗi</span>
          </motion.button>
        </div>
      </div>

      {/* Modals & Drawers */}
      <BackgroundSwitcher isOpen={isThemeOpen} onClose={() => setIsThemeOpen(false)} />
      <BugReportModal isOpen={isBugOpen} onClose={() => setIsBugOpen(false)} />
      <SRSNotificationDrawer isOpen={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} />
    </>
  )
}
