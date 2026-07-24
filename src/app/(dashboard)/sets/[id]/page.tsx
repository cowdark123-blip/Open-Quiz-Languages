'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  fetchVocabSetById,
  fetchVocabItems,
  insertVocabItem,
  insertVocabItemsBatch,
  updateVocabItem as apiUpdateVocabItem,
  deleteVocabItem as apiDeleteVocabItem,
  updateVocabSet as apiUpdateVocabSet,
  getCurrentUserProfile,
} from '@/lib/supabase/data-service'
import { VocabSet, VocabItem } from '@/types/database'
import { Plus, BookOpen, Brain, Mic, Trash2, Edit2, Volume2, ArrowLeft, Sparkles, X, Check, Loader2, FolderPlus, FileInput, Star, Filter } from 'lucide-react'
import BulkImportModal from '@/components/BulkImportModal'

export default function SetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const setId = resolvedParams.id
  const router = useRouter()

  const [currentSet, setCurrentSet] = useState<VocabSet | null>(null)
  const [items, setItems] = useState<VocabItem[]>([])
  const [loading, setLoading] = useState(true)
  
  // Set Edit State
  const [isEditSetModalOpen, setIsEditSetModalOpen] = useState(false)
  const [setSaving, setSetSaving] = useState(false)
  const [editSetTitle, setEditSetTitle] = useState('')
  const [editSetDesc, setEditSetDesc] = useState('')
  const [editSetCategory, setEditSetCategory] = useState('')
  const [editSetLang, setEditSetLang] = useState('')

  // Item Form State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<VocabItem | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiErrorMsg, setAiErrorMsg] = useState('')

  // Item Form state
  const [term, setTerm] = useState('')
  const [definition, setDefinition] = useState('')
  const [ipa, setIpa] = useState('')
  const [example, setExample] = useState('')
  const [translation, setTranslation] = useState('')
  const [synonymsInput, setSynonymsInput] = useState('')

  // Sorting
  const [sortOption, setSortOption] = useState('original')

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const setObj = await fetchVocabSetById(setId)
      if (!setObj) {
        router.push('/sets')
        return
      }

      const { user } = await getCurrentUserProfile()
      if (setObj.user_id && user?.id && setObj.user_id !== user.id && !setObj.is_public) {
        router.push('/dashboard')
        return
      }

      const itemsList = await fetchVocabItems(setId)
      setCurrentSet(setObj)
      setItems(itemsList)
      setLoading(false)
    }
    loadData()
  }, [setId, router])

  const handleOpenAddModal = () => {
    setEditingItem(null)
    setTerm('')
    setDefinition('')
    setIpa('')
    setExample('')
    setTranslation('')
    setSynonymsInput('')
    setAiErrorMsg('')
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (item: VocabItem) => {
    setEditingItem(item)
    setTerm(item.term)
    setDefinition(item.definition)
    setIpa(item.ipa || '')
    setExample(item.example_sentence || '')
    setTranslation(item.vietnamese_translation || '')
    setSynonymsInput(item.synonyms ? item.synonyms.join(', ') : '')
    setAiErrorMsg('')
    setIsModalOpen(true)
  }

  const handleOpenEditSetModal = () => {
    if (!currentSet) return
    setEditSetTitle(currentSet.title)
    setEditSetDesc(currentSet.description || '')
    setEditSetCategory(currentSet.category)
    setEditSetLang(currentSet.target_language)
    setIsEditSetModalOpen(true)
  }

  const handleSaveSetInfo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editSetTitle.trim() || !currentSet) return
    setSetSaving(true)

    const updated = await apiUpdateVocabSet(currentSet.id, {
      title: editSetTitle,
      description: editSetDesc,
      category: editSetCategory,
      target_language: editSetLang,
    })

    if (updated) {
      setCurrentSet({ ...currentSet, title: editSetTitle, description: editSetDesc, category: editSetCategory, target_language: editSetLang })
    }
    setSetSaving(false)
    setIsEditSetModalOpen(false)
  }

  // AI Auto-Fill Handler
  const handleAIAutoFill = async () => {
    if (!term.trim()) return
    setAiLoading(true)
    setAiErrorMsg('')

    try {
      const res = await fetch('/api/ai/generate-vocab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term }),
      })
      const result = await res.json()

      if (res.ok && result.success && result.data) {
        const d = result.data
        if (d.term) setTerm(d.term)
        if (d.definition) setDefinition(d.definition)
        if (d.ipa) setIpa(d.ipa)
        if (d.example_sentence) setExample(d.example_sentence)
        if (d.vietnamese_translation) setTranslation(d.vietnamese_translation)
        if (d.synonyms) setSynonymsInput(Array.isArray(d.synonyms) ? d.synonyms.join(', ') : d.synonyms)
      } else {
        setAiErrorMsg(result.error || 'Lỗi không xác định khi gọi AI Gemini API')
      }
    } catch (err: any) {
      setAiErrorMsg(err.message || 'Lỗi kết nối tới máy chủ AI')
    } finally {
      setAiLoading(false)
    }
  }

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!term.trim() || !definition.trim()) return

    const synonyms = synonymsInput
      ? synonymsInput.split(',').map((s) => s.trim()).filter(Boolean)
      : []

    if (editingItem) {
      // Update item in local state & Supabase Cloud
      const updatedPayload: Partial<VocabItem> = {
        term,
        definition,
        ipa,
        example_sentence: example,
        vietnamese_translation: translation,
        synonyms,
      }

      setItems(
        items.map((i) => (i.id === editingItem.id ? { ...i, ...updatedPayload } : i))
      )
      await apiUpdateVocabItem(editingItem.id, updatedPayload)
    } else {
      // Insert item into local state & Supabase Cloud
      const newPayload: Partial<VocabItem> = {
        set_id: setId,
        term,
        definition,
        ipa,
        example_sentence: example,
        vietnamese_translation: translation,
        synonyms,
      }

      const inserted = await insertVocabItem(newPayload)

      const newItem: VocabItem = inserted || {
        id: `item-${Date.now()}`,
        set_id: setId,
        term,
        definition,
        ipa,
        example_sentence: example,
        vietnamese_translation: translation,
        synonyms,
        created_at: new Date().toISOString(),
      }
      setItems([...items, newItem])
    }

    setIsModalOpen(false)
  }

  const handleBulkImport = async (importedItems: Partial<VocabItem>[], overwrite?: boolean) => {
    if (overwrite) {
      const toUpdate: { id: string; payload: Partial<VocabItem> }[] = []
      const toInsert: Partial<VocabItem>[] = []

      for (const item of importedItems) {
        const termLower = (item.term || '').trim().toLowerCase()
        const defLower = (item.definition || item.vietnamese_translation || '').trim().toLowerCase()

        const existing = items.find(
          (e) =>
            (termLower && e.term.trim().toLowerCase() === termLower) ||
            (defLower && e.definition.trim().toLowerCase() === defLower) ||
            (defLower && e.vietnamese_translation && e.vietnamese_translation.trim().toLowerCase() === defLower)
        )

        if (existing) {
          toUpdate.push({ id: existing.id, payload: item })
        } else {
          toInsert.push({ ...item, set_id: setId })
        }
      }

      for (const u of toUpdate) {
        await apiUpdateVocabItem(u.id, u.payload)
      }

      if (toInsert.length > 0) {
        await insertVocabItemsBatch(toInsert)
      }

      const freshItems = await fetchVocabItems(setId)
      setItems(freshItems)
      return true
    } else {
      const itemsWithSetId = importedItems.map((item) => ({
        ...item,
        set_id: setId,
      }))
      const inserted = await insertVocabItemsBatch(itemsWithSetId)
      if (inserted && inserted.length > 0) {
        setItems((prev) => [...prev, ...inserted])
        return true
      }
      return false
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    setItems(items.filter((i) => i.id !== itemId))
    await apiDeleteVocabItem(itemId)
  }

  // Audio Playback using Web Speech API
  const playAudio = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      utterance.rate = 0.9
      window.speechSynthesis.speak(utterance)
    }
  }

  const handleToggleStar = async (item: VocabItem) => {
    const newStatus = !item.is_starred
    setItems(items.map(i => i.id === item.id ? { ...i, is_starred: newStatus } : i))
    await apiUpdateVocabItem(item.id, { is_starred: newStatus })
  }

  const getLearningStatus = (item: VocabItem) => {
    const srs = item.srsProgress
    if (!srs || srs.repetition === 0) return 'Unlearned'
    if (srs.repetition >= 4 || srs.interval >= 21) return 'Mastered'
    return 'Learning'
  }

  const sortedItems = [...items].sort((a, b) => {
    if (sortOption === 'starred') {
      if (a.is_starred && !b.is_starred) return -1
      if (!a.is_starred && b.is_starred) return 1
    } else if (sortOption === 'unlearned') {
      const order: Record<string, number> = { 'Unlearned': 0, 'Learning': 1, 'Mastered': 2 }
      const aWeight = order[getLearningStatus(a)] ?? 3
      const bWeight = order[getLearningStatus(b)] ?? 3
      if (aWeight !== bWeight) return aWeight - bWeight
    } else if (sortOption === 'learning') {
      const order: Record<string, number> = { 'Learning': 0, 'Unlearned': 1, 'Mastered': 2 }
      const aWeight = order[getLearningStatus(a)] ?? 3
      const bWeight = order[getLearningStatus(b)] ?? 3
      if (aWeight !== bWeight) return aWeight - bWeight
    } else if (sortOption === 'mastered') {
      const order: Record<string, number> = { 'Mastered': 0, 'Learning': 1, 'Unlearned': 2 }
      const aWeight = order[getLearningStatus(a)] ?? 3
      const bWeight = order[getLearningStatus(b)] ?? 3
      if (aWeight !== bWeight) return aWeight - bWeight
    }
    return 0
  })

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        <span className="text-xs">Đang tải dữ liệu từ vựng từ Supabase...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Header Navigation */}
      <div className="flex items-center gap-3">
        <Link
          href="/sets"
          className="p-2 rounded-xl glass-card text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
            {currentSet?.category || 'IELTS'}
          </span>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-extrabold text-white">{currentSet?.title}</h2>
            <button
              onClick={handleOpenEditSetModal}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Chỉnh sửa thông tin bộ từ"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Set Summary & Action Launchers */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <p className="text-xs text-slate-300 max-w-xl">{currentSet?.description}</p>
          <div className="text-xs text-slate-400 font-medium">
            Tổng cộng: <span className="text-purple-300 font-bold">{items.length} từ vựng</span>
          </div>
        </div>

        {/* Study Mode Buttons */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            href={`/sets/${setId}/flashcards`}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-500/25 transition-all flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            <span>Học Thẻ 3D</span>
          </Link>
          <Link
            href="/srs"
            className="px-4 py-2.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 font-semibold text-xs transition-all flex items-center gap-2"
          >
            <Brain className="w-4 h-4 text-cyan-400" />
            <span>Ôn SRS</span>
          </Link>
          <Link
            href="/speaking"
            className="px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-semibold text-xs transition-all flex items-center gap-2"
          >
            <Mic className="w-4 h-4 text-emerald-400" />
            <span>Luyện Nói AI</span>
          </Link>
        </div>
      </div>

      {/* Items Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pt-2 gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <h3 className="text-lg font-bold text-white">Danh Sách Từ Vựng ({items.length})</h3>
          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-1.5">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-300 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="original">Mặc định (Original)</option>
              <option value="starred">Ưu tiên sao (Starred First)</option>
              <option value="unlearned">Ưu tiên chưa học (Unlearned First)</option>
              <option value="learning">Ưu tiên đang học (Learning First)</option>
              <option value="mastered">Ưu tiên đã thành thạo (Mastered First)</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-xs transition-all flex items-center gap-2"
          >
            <FileInput className="w-4 h-4 text-purple-400" />
            <span>Nhập hàng loạt 📥</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all flex items-center gap-2 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Từ Mới</span>
          </button>
        </div>
      </div>

      {/* Vocab Items Grid */}
      <div className="space-y-4">
        {sortedItems.map((item, idx) => {
          const termLower = item.term.trim().toLowerCase()
          const defLower = (item.definition || item.vietnamese_translation || '').trim().toLowerCase()

          const isTermDup =
            termLower !== '' &&
            items.some((other) => other.id !== item.id && other.term.trim().toLowerCase() === termLower)
          const isDefDup =
            defLower !== '' &&
            items.some(
              (other) =>
                other.id !== item.id &&
                ((other.definition || '').trim().toLowerCase() === defLower ||
                  (other.vietnamese_translation && other.vietnamese_translation.trim().toLowerCase() === defLower))
            )
          const isDup = isTermDup || isDefDup

          return (
            <div
              key={item.id}
              className={`glass-card p-5 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all group ${
                isDup
                  ? 'border-2 border-amber-500 bg-amber-500/10 shadow-md'
                  : 'border-slate-800/90 hover:border-purple-500/30'
              }`}
            >
              <div className="flex items-start gap-4 flex-1">
                <span className="w-7 h-7 rounded-lg bg-slate-900 text-slate-500 text-xs font-mono font-bold flex items-center justify-center shrink-0 border border-slate-800">
                  {idx + 1}
                </span>
                <div className="space-y-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      onClick={() => handleToggleStar(item)}
                      className={`p-1 rounded-lg transition-colors ${item.is_starred ? 'text-amber-400 hover:text-amber-300' : 'text-slate-500 hover:text-amber-400 hover:bg-slate-800'}`}
                      title={item.is_starred ? 'Bỏ yêu thích' : 'Đánh dấu yêu thích'}
                    >
                      <Star className={`w-5 h-5 ${item.is_starred ? 'fill-current' : ''}`} />
                    </button>
                    <h4 className="text-lg font-extrabold text-white tracking-wide">{item.term}</h4>
                    {isTermDup && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        ⚠️ Trùng từ
                      </span>
                    )}
                    {isDefDup && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30">
                        ⚠️ Trùng nghĩa
                      </span>
                    )}
                    {item.ipa && (
                      <span className="text-xs font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                        {item.ipa}
                      </span>
                    )}
                    {(() => {
                      const status = getLearningStatus(item)
                      if (status === 'Mastered') {
                        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Thành thạo</span>
                      } else if (status === 'Learning') {
                        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">Đang học</span>
                      } else {
                        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">Chưa học</span>
                      }
                    })()}
                    <button
                      onClick={() => playAudio(item.term)}
                      className="p-1 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
                      title="Nghe phát âm chuẩn"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                <p className="text-sm text-slate-300 font-medium">{item.definition}</p>

                {item.vietnamese_translation && (
                  <p className="text-xs text-purple-300 italic">
                    <strong>Nghĩa Việt:</strong> {item.vietnamese_translation}
                  </p>
                )}

                {item.example_sentence && (
                  <p className="text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 mt-2">
                    &quot;{item.example_sentence}&quot;
                  </p>
                )}

                {item.synonyms && item.synonyms.length > 0 && (
                  <div className="flex items-center gap-1.5 pt-1 text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-500">Đồng nghĩa:</span>
                    {item.synonyms.map((s, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-center">
              <button
                onClick={() => handleOpenEditModal(item)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Sửa từ vựng"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteItem(item.id)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                title="Xóa từ vựng"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )})}
      </div>

      {/* Modal: Add/Edit Vocab Item with AI Auto-Fill */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg glass-panel p-6 rounded-3xl border border-slate-800 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <span>{editingItem ? 'Chỉnh Sửa Từ Vựng' : 'Thêm Từ Vựng Mới'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              {aiErrorMsg && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2">
                  <span className="font-bold">⚠️</span>
                  <span>{aiErrorMsg}</span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-300">Từ / Cụm từ tiếng Anh *</label>
                    {term.trim() && items.some(e => e.id !== editingItem?.id && e.term.trim().toLowerCase() === term.trim().toLowerCase()) && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        ⚠️ Trùng từ
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleAIAutoFill}
                    disabled={!term.trim() || aiLoading}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white text-xs font-bold shadow-sm disabled:opacity-50 transition-all"
                  >
                    {aiLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>AI đang xử lý...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                        <span>AI Auto-Fill ✨</span>
                      </>
                    )}
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Nhập 1 từ (Ví dụ: Resilience, Sustainability...)"
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Phiên âm IPA</label>
                <input
                  type="text"
                  placeholder="/rɪˈzɪl.jəns/"
                  value={ipa}
                  onChange={(e) => setIpa(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Định nghĩa tiếng Anh *</label>
                <input
                  type="text"
                  required
                  placeholder="The capacity to recover quickly from difficulties..."
                  value={definition}
                  onChange={(e) => setDefinition(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Dịch nghĩa Tiếng Việt</label>
                <input
                  type="text"
                  placeholder="Khả năng phục hồi, sự kiên cường"
                  value={translation}
                  onChange={(e) => setTranslation(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Câu ví dụ ngữ cảnh</label>
                <textarea
                  rows={2}
                  placeholder="Her resilience helped her overcome severe challenges..."
                  value={example}
                  onChange={(e) => setExample(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Từ đồng nghĩa (phân cách bằng dấu phẩy)</label>
                <input
                  type="text"
                  placeholder="adaptability, toughness, flexibility"
                  value={synonymsInput}
                  onChange={(e) => setSynonymsInput(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
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
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-500/25 transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingItem ? 'Lưu Thay Đổi' : 'Thêm Từ Vựng'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Set Metadata */}
      {isEditSetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg glass-panel p-6 rounded-3xl border border-slate-800 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-purple-400" />
                <span>Chỉnh Sửa Bộ Từ Vựng</span>
              </h3>
              <button
                onClick={() => setIsEditSetModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSetInfo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tên bộ từ vựng *</label>
                <input
                  type="text"
                  required
                  value={editSetTitle}
                  onChange={(e) => setEditSetTitle(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Mô tả chi tiết</label>
                <textarea
                  rows={3}
                  value={editSetDesc}
                  onChange={(e) => setEditSetDesc(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Danh mục</label>
                  <select
                    value={editSetCategory}
                    onChange={(e) => setEditSetCategory(e.target.value)}
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
                    value={editSetLang}
                    onChange={(e) => setEditSetLang(e.target.value)}
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
                  onClick={() => setIsEditSetModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={setSaving}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-500/25 transition-all flex items-center gap-1.5"
                >
                  {setSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Lưu Thay Đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal: Bulk Import */}
      <BulkImportModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onImport={handleBulkImport}
        existingItems={items}
      />
    </div>
  )
}
