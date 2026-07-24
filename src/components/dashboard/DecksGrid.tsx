'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Upload, BookOpen, Sparkles, Loader2, Filter, Search } from 'lucide-react'
import { useVocab } from '@/contexts/VocabContext'
import { WordSetCard } from './WordSetCard'
import { CreateDeckModal } from './CreateDeckModal'
import { seedSampleSetForUser } from '@/lib/supabase/data-service'

interface DecksGridProps {
  searchQuery?: string
  selectedCategory?: string
  onCategoryChange?: (category: string) => void
}

export function DecksGrid({
  searchQuery = '',
  selectedCategory = 'All',
  onCategoryChange,
}: DecksGridProps) {
  const { vocabSets, isLoading, refreshVocab } = useVocab()
  const [categoryFilter, setCategoryFilter] = useState(selectedCategory)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'import'>('create')
  const [seeding, setSeeding] = useState(false)

  const handleCategorySelect = (cat: string) => {
    setCategoryFilter(cat)
    if (onCategoryChange) onCategoryChange(cat)
  }

  const categories = ['All', 'IELTS', 'TOEIC', 'Business', 'General']

  const filteredSets = vocabSets.filter((set) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      set.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (set.description && set.description.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory =
      categoryFilter === 'All' ||
      (set.category && set.category.toLowerCase() === categoryFilter.toLowerCase())

    return matchesSearch && matchesCategory
  })

  const handleSeedSample = async () => {
    setSeeding(true)
    await seedSampleSetForUser()
    await refreshVocab()
    setSeeding(false)
  }

  const openCreateModal = (mode: 'create' | 'import') => {
    setModalMode(mode)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header Bar & Category Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-purple-400" />
            Lọc:
          </span>
          {categories.map((cat) => {
            const isActive = categoryFilter === cat
            return (
              <button
                key={cat}
                onClick={() => handleCategorySelect(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50 shadow-md'
                    : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                {cat === 'All' ? 'Tất Cả Bộ Từ' : cat}
              </button>
            )
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => openCreateModal('import')}
            className="px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-purple-950/40 text-purple-300 border border-purple-500/30 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Upload className="w-3.5 h-3.5 text-purple-400" />
            <span>Nhập File / AI</span>
          </button>

          <button
            onClick={() => openCreateModal('create')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-purple-500/25 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Tạo Bộ Từ Mới</span>
          </button>
        </div>
      </div>

      {/* Main Grid or Empty States */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          <span className="text-xs">Đang tải bộ từ vựng thực tế...</span>
        </div>
      ) : filteredSets.length === 0 ? (
        <div className="p-8 rounded-3xl glass-panel border border-slate-800 text-center space-y-6 max-w-xl mx-auto shadow-2xl my-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center mx-auto shadow-xl shadow-purple-500/20">
            <BookOpen className="w-8 h-8 text-white" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-extrabold text-white">
              {searchQuery ? 'Không Tìm Thấy Bộ Từ Phù Hợp' : 'Bạn Chưa Có Bộ Từ Vựng Nào'}
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md mx-auto">
              {searchQuery
                ? `Không có kết quả nào cho "${searchQuery}". Hãy thử tìm kiếm với từ khóa khác.`
                : 'Bắt đầu tạo bộ từ vựng cá nhân đầu tiên hoặc nạp nhanh bộ từ vựng mẫu IELTS chuẩn vào tài khoản của bạn!'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={handleSeedSample}
              disabled={seeding}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
            >
              {seeding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-emerald-200" />
              )}
              <span>Nạp Mẫu Bộ Từ IELTS Academic</span>
            </button>

            <button
              onClick={() => openCreateModal('create')}
              className="w-full sm:w-auto px-5 py-3 rounded-xl glass-card text-purple-300 border border-purple-500/30 hover:bg-slate-800 font-bold text-xs transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Thủ Công</span>
            </button>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredSets.map((set) => (
            <WordSetCard key={set.id} set={set} />
          ))}
        </motion.div>
      )}

      {/* Create / Import Deck Modal */}
      <CreateDeckModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialMode={modalMode}
      />
    </div>
  )
}
