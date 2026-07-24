'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bug, X, Check, AlertTriangle, Send, Loader2, Link2, Tag } from 'lucide-react'

interface BugReportModalProps {
  isOpen: boolean
  onClose: () => void
}

type BugCategory = 'UI/Layout' | 'AI Generation' | 'SRS/Study' | 'Other'
type SeverityLevel = 'Low' | 'Medium' | 'High' | 'Critical'

export function BugReportModal({ isOpen, onClose }: BugReportModalProps) {
  const [category, setCategory] = useState<BugCategory>('UI/Layout')
  const [severity, setSeverity] = useState<SeverityLevel>('Medium')
  const [description, setDescription] = useState('')
  const [urlTag, setUrlTag] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const categories: { id: BugCategory; label: string; desc: string }[] = [
    { id: 'UI/Layout', label: 'Giao diện & Bố cục', desc: 'Lỗi hiển thị, vỡ khung, màu sắc' },
    { id: 'AI Generation', label: 'Tạo bởi AI', desc: 'AI trả lời sai, phản hồi chậm, lỗi prompt' },
    { id: 'SRS/Study', label: 'Học tập & SRS', desc: 'Thẻ flashcard, tính toán lịch lặp, bài tập' },
    { id: 'Other', label: 'Lỗi khác', desc: 'Đăng nhập, đồng bộ dữ liệu hoặc lỗi hệ thống' },
  ]

  const severities: { id: SeverityLevel; label: string; color: string }[] = [
    { id: 'Low', label: 'Thấp', color: 'bg-slate-800 text-slate-300 border-slate-700' },
    { id: 'Medium', label: 'Trung Bình', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
    { id: 'High', label: 'Cao', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
    { id: 'Critical', label: 'Nghiêm Trọng', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim()) return

    setSubmitting(true)

    // Simulate sending report payload to server/log
    await new Promise((resolve) => setTimeout(resolve, 800))

    setSubmitting(false)
    setToastMessage('Báo cáo sự cố đã được gửi thành công! Cảm ơn sự đóng góp của bạn.')

    // Reset form
    setDescription('')
    setUrlTag('')
    setCategory('UI/Layout')
    setSeverity('Medium')

    setTimeout(() => {
      setToastMessage(null)
      onClose()
    }, 2000)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-lg glass-panel p-6 rounded-3xl border border-slate-700/60 shadow-2xl space-y-5"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
                  <Bug className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    Báo Cáo Sự Cố (Report Bug)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Phát hiện lỗi? Hãy thông báo cho chúng tôi để cải thiện sản phẩm.
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

            {/* Success Toast Banner */}
            {toastMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2"
              >
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{toastMessage}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-purple-400" />
                  Danh mục sự cố
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        category === cat.id
                          ? 'border-rose-500 bg-rose-950/20 text-white font-bold'
                          : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-xs">{cat.label}</div>
                      <div className="text-[10px] text-slate-500 truncate">{cat.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Severity Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Mức độ nghiêm trọng
                </label>
                <div className="flex items-center gap-2">
                  {severities.map((sev) => (
                    <button
                      key={sev.id}
                      type="button"
                      onClick={() => setSeverity(sev.id)}
                      className={`flex-1 py-2 px-1 rounded-xl border text-center text-xs transition-all ${
                        severity === sev.id
                          ? `${sev.color} font-bold ring-1 ring-slate-400`
                          : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {sev.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Mô tả chi tiết sự cố <span className="text-rose-400">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                  placeholder="Vui lòng mô tả các bước xảy ra lỗi, hành vi dự kiến và lỗi thực tế..."
                  className="w-full p-3 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all resize-none"
                />
              </div>

              {/* URL / Tag / Image attachment reference */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-cyan-400" />
                  Đường dẫn (URL) hoặc ghi chú ảnh chụp màn hình
                </label>
                <input
                  type="text"
                  value={urlTag}
                  onChange={(e) => setUrlTag(e.target.value)}
                  placeholder="e.g. /dashboard, https://imgur.com/screenshot..."
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 font-semibold text-xs transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting || !description.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-rose-500/20 transition-all flex items-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Send className="w-4 h-4 text-white" />
                  )}
                  <span>{submitting ? 'Đang gửi...' : 'Gửi Báo Cáo'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
