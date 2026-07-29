'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, RefreshCcw, X, AlertTriangle, AlertCircle } from 'lucide-react'
import { useVocab } from '@/contexts/VocabContext'
import { updateVocabSet, deleteVocabSet } from '@/lib/supabase/data-service'

interface TrashModalProps {
  isOpen: boolean
  onClose: () => void
}

export function TrashModal({ isOpen, onClose }: TrashModalProps) {
  const { allVocabSets, refreshVocab } = useVocab()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [clearing, setClearing] = useState(false)
  const [trashIds, setTrashIds] = useState<string[]>([])

  useEffect(() => {
    const updateTrash = () => {
      setTrashIds(JSON.parse(typeof window !== 'undefined' ? localStorage.getItem('openquiz_trash_ids') || '[]' : '[]'))
    }
    if (isOpen) {
      updateTrash()
      window.addEventListener('trash_updated', updateTrash)
    }
    return () => window.removeEventListener('trash_updated', updateTrash)
  }, [isOpen])

  const deletedSets = allVocabSets.filter(set => trashIds.includes(set.id) || set.category?.endsWith('__DELETED__'))

  const handleRestore = async (id: string, category: string) => {
    setLoadingId(id)
    
    // Remove from local storage
    const newTrashIds = trashIds.filter(tId => tId !== id)
    localStorage.setItem('openquiz_trash_ids', JSON.stringify(newTrashIds))
    window.dispatchEvent(new Event('trash_updated'))
    setTrashIds(newTrashIds)

    // Also remove __DELETED__ if legacy
    if (category?.endsWith('__DELETED__')) {
      const newCat = category.replace('__DELETED__', '')
      await updateVocabSet(id, { category: newCat })
    }
    
    // We only refresh vocab if we actually called the DB or we want the dashboard to re-render
    // Instead of forcing a full DB refresh, triggering a context refresh isn't bad
    await refreshVocab(true)
    setLoadingId(null)
  }

  const handleHardDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa vĩnh viễn bộ từ này? Hành động này không thể hoàn tác.')) {
      setLoadingId(id)
      await deleteVocabSet(id)
      
      const newTrashIds = trashIds.filter(tId => tId !== id)
      localStorage.setItem('openquiz_trash_ids', JSON.stringify(newTrashIds))
      window.dispatchEvent(new Event('trash_updated'))
      setTrashIds(newTrashIds)
      
      await refreshVocab(true)
      setLoadingId(null)
    }
  }

  const handleEmptyTrash = async () => {
    if (deletedSets.length === 0) return
    if (window.confirm('Xóa vĩnh viễn TẤT CẢ bộ từ trong thùng rác? Dữ liệu không thể khôi phục.')) {
      setClearing(true)
      // Delete all from Supabase
      for (const set of deletedSets) {
        await deleteVocabSet(set.id)
      }
      
      // Clear local storage
      localStorage.removeItem('openquiz_trash_ids')
      window.dispatchEvent(new Event('trash_updated'))
      setTrashIds([])
      
      await refreshVocab(true)
      setClearing(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg glass-panel p-6 rounded-3xl border border-slate-800 shadow-2xl relative flex flex-col max-h-[90vh]">
            
            <button onClick={onClose} className="absolute right-4 top-4 p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-300 transition-colors z-10">
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6 pr-10">
              <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <Trash2 className="w-6 h-6 text-red-400" />
                Thùng Rác
              </h2>
              <p className="text-slate-400 text-sm mt-2">
                Các bộ từ vựng đã xóa được lưu trữ tạm thời tại đây.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 mb-4">
              {deletedSets.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
                  <AlertTriangle className="w-8 h-8 opacity-50" />
                  Thùng rác trống.
                </div>
              ) : (
                deletedSets.map((set) => (
                  <div key={set.id} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-white truncate text-sm">{set.title}</h4>
                      <p className="text-xs text-slate-400 truncate">{set.category?.replace('__DELETED__', '')}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleRestore(set.id, set.category)}
                        disabled={loadingId === set.id || clearing}
                        title="Khôi phục"
                        className="p-2 rounded-xl bg-slate-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 transition-colors disabled:opacity-50"
                      >
                        <RefreshCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleHardDelete(set.id)}
                        disabled={loadingId === set.id || clearing}
                        title="Xóa vĩnh viễn"
                        className="p-2 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {deletedSets.length > 0 && (
              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  onClick={handleEmptyTrash}
                  disabled={clearing}
                  className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-colors flex items-center gap-2 border border-red-500/20 disabled:opacity-50"
                >
                  <AlertCircle className="w-4 h-4" />
                  {clearing ? 'Đang dọn dẹp...' : 'Dọn dẹp tất cả'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}
