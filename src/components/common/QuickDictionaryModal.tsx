'use client'

import { useState } from 'react'
import { Search, Loader2, X } from 'lucide-react'
import { DictionaryBottomSheet } from './DictionaryBottomSheet'

export function QuickDictionaryModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchTerm.trim()) return

    setIsLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/ai/dictionary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: searchTerm,
          contextSentence: 'Người dùng tra cứu từ vựng độc lập.'
        })
      })

      if (!res.ok) throw new Error('Không thể tra từ')

      const data = await res.json()
      setResult(data)
    } catch (err: any) {
      setError(err.message || 'Lỗi tra cứu')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  // If we have a result, show the bottom sheet instead of the search modal
  if (result) {
    return (
      <DictionaryBottomSheet
        word={result.word}
        ipa={result.ipa}
        definition={result.definition}
        vietnamese_translation={result.vietnamese_translation}
        example_sentence={result.example_sentence}
        is_starred={false}
        onStarToggle={async () => {}}
        isOpen={true}
        onClose={() => {
          setResult(null)
          onClose()
        }}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm glass-panel p-6 rounded-3xl border border-slate-800 shadow-2xl relative">
        <button onClick={onClose} className="absolute right-4 top-4 p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-300 transition-colors">
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-cyan-400" />
          Tra Từ Nhanh
        </h3>

        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <input
              type="text"
              autoFocus
              placeholder="Nhập từ cần tra..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>
          
          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={isLoading || !searchTerm.trim()}
            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            {isLoading ? 'Đang tra cứu...' : 'Tra cứu'}
          </button>
        </form>
      </div>
    </div>
  )
}
