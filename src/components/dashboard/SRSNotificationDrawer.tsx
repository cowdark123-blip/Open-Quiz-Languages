'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, Clock, Brain, Check, ChevronRight, Sparkles, BookOpen } from 'lucide-react'
import { fetchDueSRSItems, fetchAllUserVocabItems } from '@/lib/supabase/data-service'
import { VocabItem } from '@/types/database'

interface SRSNotificationDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function SRSNotificationDrawer({ isOpen, onClose }: SRSNotificationDrawerProps) {
  const [dueItems, setDueItems] = useState<VocabItem[]>([])
  const [allItems, setAllItems] = useState<VocabItem[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    const [due, items] = await Promise.all([
      fetchDueSRSItems(),
      fetchAllUserVocabItems(),
    ])
    setDueItems(due)
    setAllItems(items)
    setLoading(false)
  }

  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm">
          {/* Backdrop click to close */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0"
          />

          {/* Drawer Content */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative z-10 w-full max-w-md h-full glass-panel rounded-none border-l border-slate-700/60 shadow-2xl flex flex-col justify-between p-6 space-y-6 overflow-y-auto bg-slate-950/90"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Thông Báo Lịch Ôn SRS
                  </h3>
                  <p className="text-xs text-slate-400">Theo dõi tiến độ lặp lại ngắt quãng SM-2</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notification Items Content */}
            <div className="flex-1 space-y-4 overflow-y-auto pr-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-purple-400" />
                  Danh sách từ đến lịch ({dueItems.length})
                </span>
                <span className="text-[10px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                  Cập nhật trực tiếp
                </span>
              </div>

              {loading ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Đang tải thông báo lịch ôn...
                </div>
              ) : dueItems.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Không Có Lịch Ôn Nào Đang Chờ</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Bạn đã hoàn thành tất cả từ vựng cần ôn hôm nay. Thuật toán SM-2 sẽ thông báo khi đến chu kỳ ôn tập tiếp theo!
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {dueItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 transition-all flex items-center justify-between group"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                            {item.term}
                          </span>
                          {item.ipa && (
                            <span className="text-[11px] text-slate-500 font-mono">{item.ipa}</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-1">
                          {item.vietnamese_translation || item.definition}
                        </p>
                      </div>

                      <Link
                        href={`/sets/${item.set_id}/srs`}
                        onClick={onClose}
                        className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-bold transition-all flex items-center gap-1 shrink-0"
                      >
                        <span>Ôn ngay</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer CTA */}
            {dueItems.length > 0 && (
              <div className="pt-4 border-t border-slate-800">
                <Link
                  href={dueItems[0]?.set_id ? `/sets/${dueItems[0].set_id}/srs` : '/sets'}
                  onClick={onClose}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-xl shadow-purple-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <Brain className="w-4 h-4" />
                  <span>Mở Trình Ôn Tập Thuật Toán SM-2</span>
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
