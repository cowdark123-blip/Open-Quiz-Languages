'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { playTTS } from '@/lib/tts'
import { Volume2, BookOpen, CheckCircle, Star } from 'lucide-react'

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

  // Mount/unmount with animation
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
    <div className={`fixed inset-0 z-50 flex items-end justify-center px-4 pb-8`}>
      <motion.div
        initial={{ y: '100%' }}
        animate={isOpen ? { y: 0 } : { y: '100%' }}
        exit={{ y: '100%' }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className={`w-full max-w-md bg-slate-900/95 backdrop-blur-lg border-t border-slate-800/50 shadow-2xl rounded-t-3xl`}
      >
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold text-white">{word}</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-hover text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <div className="space-y-4">
            {ipa && (
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-mono text-purple-300 italic">{ipa}</span>
              </div>
            )}
            {definition && (
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">Định nghĩa</span>
                <p className="text-base font-bold text-white">{definition}</p>
              </div>
            )}
            {vietnamese_translation && (
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-purple-400">Dịch tiếng Việt</span>
                <p className="text-sm font-semibold text-purple-200">{vietnamese_translation}</p>
              </div>
            )}
            {example_sentence && (
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">Ví dụ</span>
                <p className="text-base font-semibold text-white mt-0.5">"{example_sentence}"</p>
              </div>
            )}
          </div>
          <div className="flex items-start justify-center mt-6">
            <button
              onClick={onStarToggle}
              className={`w-32 py-2 rounded-xl font-medium transition-all ${
                is_starred
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30'
                  : 'bg-slate-800/20 text-slate-400 border-slate-700/30 hover:bg-slate-800/30'
              }`}
            >
              {is_starred ? (
                <>
                  <Star className="w-5 h-5 text-amber-400 mr-2" />
                  Đã gắn sao
                </>
              ) : (
                <>
                  <Star className="w-5 h-5 text-slate-400 mr-2" />
                  Gắn sao
                </>
              )}
            </button>
          </div>
          <div className="pt-4">
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all shadow-lg shadow-purple-500/20"
            >
              Đóng
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}