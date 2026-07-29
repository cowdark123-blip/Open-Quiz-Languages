'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Loader2, Sparkles, FolderPlus } from 'lucide-react'
import { insertVocabSet } from '@/lib/supabase/data-service'
import { useVocab } from '@/contexts/VocabContext'

interface CreateDeckModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'create' | 'import'
}

export function CreateDeckModal({ isOpen, onClose, initialMode = 'create' }: CreateDeckModalProps) {
  const { refreshVocab } = useVocab()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('IELTS')
  const [loading, setLoading] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    const newSet = await insertVocabSet({
      title: title.trim(),
      description: description.trim() || 'Bộ từ vựng cá nhân mới',
      category: category || 'General',
      target_language: 'en',
      is_public: false,
    })

    if (newSet) {
      await refreshVocab(true)
      setTitle('')
      setDescription('')
      onClose()
    }
    setLoading(false)
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
            className="relative z-10 w-full max-w-lg glass-panel p-6 rounded-3xl border border-slate-700/60 shadow-2xl space-y-5 bg-slate-950/90"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                  <FolderPlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    Tạo Bộ Từ Vựng Mới
                  </h3>
                  <p className="text-xs text-slate-400">Tạo bộ thẻ flashcard hoặc nhập nhanh dữ liệu từ vựng</p>
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

            {/* Mode Switch Tabs Removed */}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Tên Bộ Từ Vựng <span className="text-purple-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. Từ vựng IELTS Writing Task 2..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Danh mục / Chủ đề
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="IELTS">IELTS</option>
                    <option value="TOEIC">TOEIC</option>
                    <option value="Business">Kinh Doanh (Business)</option>
                    <option value="General">Chung (General)</option>
                    <option value="CEFR">CEFR (A1-C2)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Ngôn ngữ đích
                  </label>
                  <input
                    type="text"
                    value="English (Tiếng Anh)"
                    disabled
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Mô tả bộ từ vựng
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Ghi chú mục tiêu học tập hoặc nguồn tham khảo..."
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              {/* Import tab removed */}

              {/* Action buttons */}
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
                  disabled={loading || !title.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-purple-200" />
                  )}
                  <span>{loading ? 'Đang tạo...' : 'Tạo Bộ Từ Vựng'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
