'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBackground, BackgroundTheme, ThemeOption } from '@/contexts/BackgroundContext'
import { Sparkles, Layers, Palette, Moon, Check, X, Info } from 'lucide-react'

interface BackgroundSwitcherProps {
  isOpen: boolean
  onClose: () => void
}

const themeIcons: Record<BackgroundTheme, React.ReactNode> = {
  cosmic: <Sparkles className="w-5 h-5 text-purple-400" />,
  glass: <Layers className="w-5 h-5 text-cyan-400" />,
  gradient: <Palette className="w-5 h-5 text-pink-400" />,
  ambient: <Moon className="w-5 h-5 text-emerald-400" />,
}

const themePreviewGradients: Record<BackgroundTheme, string> = {
  cosmic: 'from-purple-900/80 via-indigo-950 to-pink-900/60',
  glass: 'from-cyan-900/80 via-slate-900 to-blue-900/60',
  gradient: 'from-pink-900/80 via-purple-950 to-amber-900/60',
  ambient: 'from-emerald-950 via-slate-950 to-teal-900/60',
}

export function BackgroundSwitcher({ isOpen, onClose }: BackgroundSwitcherProps) {
  const { theme, setTheme, themeList } = useBackground()
  const [feedbackTheme, setFeedbackTheme] = useState<string | null>(null)

  const handleSelectTheme = (selectedId: BackgroundTheme) => {
    setTheme(selectedId)
    const selectedOption = themeList.find((t) => t.id === selectedId)
    setFeedbackTheme(selectedOption?.label || selectedId)
    setTimeout(() => {
      setFeedbackTheme(null)
    }, 2000)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          {/* Backdrop click */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-xl glass-panel p-6 rounded-3xl border border-slate-700/60 shadow-2xl space-y-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                  <Palette className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    Tùy Chỉnh Nền Giao Diện
                  </h3>
                  <p className="text-xs text-slate-400">
                    Chọn không gian không khí học tập phù hợp với tâm trạng của bạn
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notification Feedback Toast */}
            {feedbackTheme && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  Đã chuyển giao diện sang: <strong className="text-white">{feedbackTheme}</strong>
                </span>
                <span className="text-[10px] text-emerald-400/80">Tự động lưu</span>
              </motion.div>
            )}

            {/* Theme Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {themeList.map((item: ThemeOption) => {
                const isActive = theme === item.id
                return (
                  <motion.button
                    key={item.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectTheme(item.id)}
                    className={`relative p-4 rounded-2xl border text-left transition-all overflow-hidden flex flex-col justify-between h-36 ${
                      isActive
                        ? 'border-purple-500 bg-slate-900/90 shadow-xl shadow-purple-500/20 ring-2 ring-purple-500/50'
                        : 'border-slate-800 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-900/70'
                    }`}
                  >
                    {/* Live Gradient Preview Background Overlay */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${themePreviewGradients[item.id]} opacity-20 pointer-events-none transition-opacity duration-300 ${
                        isActive ? 'opacity-40' : ''
                      }`}
                    />

                    {/* Top Row: Icon & Active Pill */}
                    <div className="flex items-center justify-between z-10">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                          {themeIcons[item.id]}
                        </div>
                        <span className="text-sm font-bold text-white">{item.label}</span>
                      </div>

                      {isActive && (
                        <span className="px-2.5 py-1 rounded-full bg-purple-500 text-white text-[10px] font-extrabold flex items-center gap-1 shadow-md">
                          <Check className="w-3 h-3" />
                          Đang chọn
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-300 z-10 leading-relaxed line-clamp-2 mt-2">
                      {item.description}
                    </p>

                    {/* Color Swatch Dots */}
                    <div className="flex items-center gap-1.5 z-10 mt-auto pt-2">
                      <span
                        className="w-3 h-3 rounded-full border border-white/20 shadow-sm"
                        style={{ backgroundColor: item.colors.primary }}
                      />
                      <span
                        className="w-3 h-3 rounded-full border border-white/20 shadow-sm"
                        style={{ backgroundColor: item.colors.secondary }}
                      />
                      <span
                        className="w-3 h-3 rounded-full border border-white/20 shadow-sm"
                        style={{ backgroundColor: item.colors.accent }}
                      />
                    </div>
                  </motion.button>
                )
              })}
            </div>

            {/* Footer Tip */}
            <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
              <Info className="w-4 h-4 text-purple-400 shrink-0" />
              <span>Giao diện được tự động đồng bộ và lưu vào trình duyệt của bạn.</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
