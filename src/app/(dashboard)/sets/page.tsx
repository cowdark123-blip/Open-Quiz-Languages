'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  fetchVocabSets,
  insertVocabSet,
  deleteVocabSet as apiDeleteVocabSet,
  updateVocabSet as apiUpdateVocabSet,
  seedInitialDatabase,
} from '@/lib/supabase/data-service'
import { VocabSet } from '@/types/database'
import { Plus, BookOpen, Trash2, Edit2, Search, FolderPlus, ArrowRight, X, Loader2, Sparkles } from 'lucide-react'

export default function SetsPage() {
  const [sets, setSets] = useState<VocabSet[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Form State for Create/Edit Set Modal
  const [editingSet, setEditingSet] = useState<VocabSet | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newCategory, setNewCategory] = useState('IELTS')
  const [newLang, setNewLang] = useState('en')
  const [creating, setCreating] = useState(false)

  const handleOpenCreateSet = () => {
    setEditingSet(null)
    setNewTitle('')
    setNewDesc('')
    setNewCategory('IELTS')
    setNewLang('en')
    setIsModalOpen(true)
  }

  const handleOpenEditSet = (set: VocabSet) => {
    setEditingSet(set)
    setNewTitle(set.title)
    setNewDesc(set.description || '')
    setNewCategory(set.category)
    setNewLang(set.target_language)
    setIsModalOpen(true)
  }

  const loadData = async () => {
    setLoading(true)
    const data = await fetchVocabSets()
    setSets(data)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSeedDatabase = async () => {
    setSeeding(true)
    await seedInitialDatabase()
    await loadData()
    setSeeding(false)
  }

  const handleSaveSet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    setCreating(true)

    if (editingSet) {
      const updated = await apiUpdateVocabSet(editingSet.id, {
        title: newTitle,
        description: newDesc,
        category: newCategory,
        target_language: newLang,
      })
      if (updated) {
        setSets(sets.map((s) => (s.id === editingSet.id ? { ...s, title: newTitle, description: newDesc, category: newCategory, target_language: newLang } : s)))
      } else {
        await loadData()
      }
    } else {
      const created = await insertVocabSet({
        title: newTitle,
        description: newDesc,
        category: newCategory,
        target_language: newLang,
        is_public: true,
      })

      if (created) {
        setSets([created, ...sets])
      } else {
        await loadData()
      }
    }

    setNewTitle('')
    setNewDesc('')
    setCreating(false)
    setIsModalOpen(false)
  }

  const handleDeleteSet = async (id: string) => {
    setSets(sets.filter((s) => s.id !== id))
    await apiDeleteVocabSet(id)
  }

  const filteredSets = sets.filter((set) => {
    const matchesSearch =
      set.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (set.description && set.description.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = selectedCategory === 'All' || set.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Quản Lý Bộ Từ Vựng</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {sets.length} Bộ
            </span>
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Tạo bộ từ vựng cá nhân hoặc chọn từ các lộ trình học biên soạn sẵn.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {sets.length === 0 && !loading && (
            <button
              onClick={handleSeedDatabase}
              disabled={seeding}
              className="px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs transition-all flex items-center gap-2"
            >
              {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-emerald-400" />}
              <span>Nạp Từ Vựng Mẫu</span>
            </button>
          )}

          <button
            onClick={handleOpenCreateSet}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Bộ Từ Vựng Mới</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Tìm kiếm bộ từ vựng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['All', 'IELTS', 'Business', 'Speaking', 'General'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {cat === 'All' ? 'Tất cả' : cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          <span className="text-xs">Đang tải danh sách bộ từ vựng...</span>
        </div>
      ) : sets.length === 0 ? (
        <div className="py-16 glass-panel rounded-3xl border border-slate-800 text-center space-y-4 max-w-lg mx-auto">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">Chưa Có Bộ Từ Vựng Nào</h3>
          <p className="text-xs text-slate-400">
            Hãy tạo bộ từ vựng đầu tiên của bạn hoặc nạp bộ từ vựng mẫu để bắt đầu học ngay!
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={handleSeedDatabase}
              disabled={seeding}
              className="px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs transition-all flex items-center gap-2"
            >
              {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Nạp Từ Vựng Mẫu</span>
            </button>
            <button
              onClick={handleOpenCreateSet}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md"
            >
              Tạo Bộ Từ Mới
            </button>
          </div>
        </div>
      ) : (
        /* Vocab Sets List Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSets.map((set) => (
            <div
              key={set.id}
              className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-5 group relative"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                    {set.category}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditSet(set)}
                      title="Sửa bộ từ"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSet(set.id)}
                      title="Xóa bộ từ"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <Link href={`/sets/${set.id}`} className="block">
                  <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                    {set.title}
                  </h3>
                </Link>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {set.description || 'Chưa có mô tả chi tiết.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">
                  {set.item_count || 0} từ vựng
                </span>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/sets/${set.id}/flashcards`}
                    className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-all flex items-center gap-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Học Thẻ 3D</span>
                  </Link>
                  <Link
                    href={`/sets/${set.id}`}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Chi tiết bộ từ"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create New Set */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg glass-panel p-6 rounded-3xl border border-slate-800 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {editingSet ? <Edit2 className="w-5 h-5 text-purple-400" /> : <FolderPlus className="w-5 h-5 text-purple-400" />}
                <span>{editingSet ? 'Chỉnh Sửa Bộ Từ Vựng' : 'Tạo Bộ Từ Vựng Mới'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSet} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tên bộ từ vựng *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Từ Vựng IELTS Task 2 chủ đề Environment"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Mô tả chi tiết</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả mục tiêu học tập của bộ từ này..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Danh mục</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="IELTS">IELTS</option>
                    <option value="TOEIC">TOEIC</option>
                    <option value="Business">Business</option>
                    <option value="Speaking">Speaking</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Ngôn ngữ mục tiêu</label>
                  <select
                    value={newLang}
                    onChange={(e) => setNewLang(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="en">Tiếng Anh (EN)</option>
                    <option value="ja">Tiếng Nhật (JLPT)</option>
                    <option value="zh">Tiếng Trung (HSK)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-500/25 transition-all flex items-center gap-2"
                >
                  {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingSet ? 'Lưu Thay Đổi' : 'Tạo Bộ Từ Vựng'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
