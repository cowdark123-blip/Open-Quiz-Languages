'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { playTTS } from '@/lib/tts'
import { Volume2, BookOpen, Star, X } from 'lucide-react'

interface DictionaryProps {
  word: string
  ipa?: string
  definition?: string
  vietnamese_translation?: string
  example_sentence?: string
  is_starred?: boolean
  onStarToggle: () => Promise<void>
  isOpen: boolean
  onClose: () => void
}

export function DictionaryBottomSheet({ word, ipa, definition, vietnamese_translation, example_sentence, is_starred, onStarToggle, isOpen, onClose }: DictionaryProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setMounted(true)
    } else {
      const timer = setTimeout(() => setMounted(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!mounted && !isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:px-4 pb-0 sm:pb-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%', opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: '100%', opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-slate-900 border border-slate-800 shadow-2xl rounded-t-[2rem] sm:rounded-3xl overflow-hidden"
          >
            {/* Header background glow */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-purple-500/20 to-transparent pointer-events-none" />

            {/* Drag Handle */}
            <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-12 h-1.5 rounded-full bg-slate-700/50" />
            </div>

            <div className="px-6 pb-6 pt-2 sm:pt-6 space-y-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
              
              {/* Header */}
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h3 className="text-3xl font-black text-white tracking-tight mb-2">{word}</h3>
                  {ipa && (
                    <button 
                      onClick={() => playTTS(word)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-300 transition-colors group"
                    >
                      <Volume2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-mono tracking-wide">{ipa}</span>
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onStarToggle}
                    className={`p-3 rounded-2xl transition-all ${
                      is_starred
                        ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                        : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    <Star className={`w-6 h-6 ${is_starred ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={onClose}
                    className="p-3 rounded-2xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-4 pt-2">
                {vietnamese_translation && (
                  <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 space-y-2">
                    <div className="flex items-center gap-2 text-purple-400">
                      <BookOpen className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Nghĩa Tiếng Việt</span>
                    </div>
                    <p className="text-lg font-bold text-white">{vietnamese_translation}</p>
                  </div>
                )}

                {definition && (
                  <div className="p-4 rounded-2xl bg-slate-800/30 border border-slate-700/30 space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Định nghĩa (Anh - Anh)</span>
                    <p className="text-base text-slate-300 leading-relaxed">{definition}</p>
                  </div>
                )}

                {example_sentence && (
                  <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Ví dụ</span>
                    <p className="text-base text-indigo-200/90 italic leading-relaxed">
                      &quot;{example_sentence}&quot;
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
