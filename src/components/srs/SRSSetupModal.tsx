'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Layers, Clock, Sparkles, BookOpen, Star, CheckCircle2, Check, ArrowRight, X } from 'lucide-react'
import { useVocab } from '@/contexts/VocabContext'
import { useRouter } from 'next/navigation'

type ModeKey = 'due' | 'new' | 'learning' | 'mastered' | 'starred'

interface SRSSetupModalProps {
  isOpen: boolean
  onClose: () => void
  preselectId?: string | null
}

export function SRSSetupModal({ isOpen, onClose, preselectId }: SRSSetupModalProps) {
  const { vocabSets, isLoading, refreshVocab } = useVocab()
  const router = useRouter()

  const [selectedSets, setSelectedSets] = useState<Set<string>>(new Set())
  const [selectedModes, setSelectedModes] = useState<Set<ModeKey>>(new Set(['due', 'new', 'learning']))

  useEffect(() => {
    if (isOpen) {
      if (preselectId && vocabSets.length > 0) {
        const isValid = vocabSets.some(s => s.id === preselectId)
        if (isValid) {
          setSelectedSets(new Set([preselectId]))
        }
      } else if (vocabSets.length > 0) {
        setSelectedSets(new Set(vocabSets.map(s => s.id)))
      }
    }
  }, [isOpen, preselectId, vocabSets])

  if (!isOpen) return null

  const toggleSet = (id: string) => {
    const newSets = new Set(selectedSets)
    if (newSets.has(id)) newSets.delete(id)
    else newSets.add(id)
    setSelectedSets(newSets)
  }

  const toggleMode = (mode: ModeKey) => {
    const newModes = new Set(selectedModes)
    if (newModes.has(mode)) newModes.delete(mode)
    else newModes.add(mode)
    setSelectedModes(newModes)
  }

  const modes: { key: ModeKey; label: string; icon: any; color: string; bg: string; border: string }[] = [
    { key: 'due', label: 'Đến Hạn Ôn', icon: Clock, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
    { key: 'new', label: 'Chưa Học', icon: Sparkles, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
    { key: 'learning', label: 'Đang Học', icon: Brain, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
    { key: 'mastered', label: 'Đã Thuộc', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
    { key: 'starred', label: 'Đã Gắn Sao', icon: Star, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  ]

  const studyUrl = `/srs/study?sets=${Array.from(selectedSets).join(',')}&modes=${Array.from(selectedModes).join(',')}`

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-sm overflow-y-auto pb-safe pt-4 animate-fade-in">
        <div className="w-full sm:max-w-4xl glass-panel p-6 rounded-t-3xl sm:rounded-3xl border border-slate-800 shadow-2xl relative mt-auto sm:mt-0 mb-0 pb-12 sm:pb-6 flex flex-col max-h-[90vh]">
          
          <button onClick={onClose} className="absolute right-4 top-4 p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-300 transition-colors z-10">
            <X className="w-5 h-5" />
          </button>

          <div className="mb-6 pr-10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5 mb-2">
              <Brain className="w-3.5 h-3.5" /> Thuật Toán Giãn Cách SM-2
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Thiết Lập Ôn Tập
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              Tùy chỉnh phiên ôn tập SRS.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Modes Selection */}
              <div className="space-y-4 lg:col-span-1">
                <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  Chọn Chế Độ Lọc
                </h3>
                <div className="flex flex-col gap-3">
                  {modes.map((mode) => {
                    const isSelected = selectedModes.has(mode.key)
                    const Icon = mode.icon
                    return (
                      <button
                        key={mode.key}
                        onClick={() => toggleMode(mode.key)}
                        className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between group touch-manipulation ${
                          isSelected
                            ? `bg-slate-900/80 ${mode.border} shadow-md`
                            : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${isSelected ? mode.bg : 'bg-slate-800'} transition-colors`}>
                            <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isSelected ? mode.color : 'text-slate-500'}`} />
                          </div>
                          <span className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`}>
                            {mode.label}
                          </span>
                        </div>
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                          isSelected ? 'bg-purple-500 border-purple-500 text-white' : 'border-slate-700 text-transparent'
                        }`}>
                          <Check className="w-3 h-3" />
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Right Column: Sets Selection */}
              <div className="space-y-4 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-cyan-400" />
                    Chọn Bộ Từ Vựng
                  </h3>
                  <button
                    onClick={() => setSelectedSets(selectedSets.size === vocabSets.length ? new Set() : new Set(vocabSets.map(s => s.id)))}
                    className="text-xs font-semibold text-purple-400 hover:text-purple-300 touch-manipulation p-2 -mr-2"
                  >
                    {selectedSets.size === vocabSets.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {isLoading ? (
                    <div className="col-span-2 py-12 text-center text-slate-500 text-xs">Đang tải danh sách bộ từ...</div>
                  ) : vocabSets.length === 0 ? (
                    <div className="col-span-2 py-12 text-center text-slate-500 text-xs bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed">
                      Chưa có bộ từ vựng nào. Hãy tạo bộ từ mới trước khi học.
                    </div>
                  ) : (
                    vocabSets.map((set) => {
                      const isSelected = selectedSets.has(set.id)
                      return (
                        <button
                          key={set.id}
                          onClick={() => toggleSet(set.id)}
                          className={`p-3 rounded-2xl border text-left transition-all touch-manipulation ${
                            isSelected
                              ? 'bg-slate-900/80 border-cyan-500/40 shadow-md'
                              : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <h4 className={`font-bold text-sm line-clamp-1 ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                                {set.title}
                              </h4>
                              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                                {set.category || 'General'}
                              </span>
                            </div>
                            <div className={`w-5 h-5 rounded-md border shrink-0 flex items-center justify-center transition-all mt-0.5 ${
                              isSelected ? 'bg-cyan-500 border-cyan-500 text-white' : 'border-slate-700 text-transparent'
                            }`}>
                              <Check className="w-3 h-3" />
                            </div>
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-4 border-t border-slate-800">
            <button
              onClick={() => {
                if (selectedSets.size > 0 && selectedModes.size > 0) {
                  onClose()
                  router.push(studyUrl)
                }
              }}
              disabled={selectedSets.size === 0 || selectedModes.size === 0}
              className={`w-full py-4 rounded-2xl font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-2 ${
                selectedSets.size === 0 || selectedModes.size === 0
                  ? 'bg-slate-800 text-slate-500 pointer-events-none opacity-50'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-500/25 active:scale-95'
              }`}
            >
              <span>Bắt Đầu Ôn Tập</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </AnimatePresence>
  )
}
