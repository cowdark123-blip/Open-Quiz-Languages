import React from 'react'
import { VocabItem } from '@/types/database'
import { CheckSquare, Square } from 'lucide-react'

interface WordSelectorProps {
  items: VocabItem[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  disabled?: boolean
}

export default function WordSelector({ items, selectedIds, onChange, disabled }: WordSelectorProps) {
  const handleToggleAll = () => {
    if (selectedIds.length === items.length) {
      onChange([])
    } else {
      onChange(items.map(i => i.id))
    }
  }

  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(i => i !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  if (items.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-slate-300">Chọn từ vựng tham gia bài tập ({selectedIds.length}/{items.length}):</label>
        <button
          type="button"
          disabled={disabled}
          onClick={handleToggleAll}
          className="text-xs text-purple-400 hover:text-purple-300 font-semibold disabled:opacity-50"
        >
          {selectedIds.length === items.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
        </button>
      </div>
      <div className="max-h-48 overflow-y-auto bg-slate-900/50 border border-slate-700 rounded-xl p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
        {items.map(item => {
          const isSelected = selectedIds.includes(item.id)
          return (
            <label
              key={item.id}
              className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                isSelected ? 'bg-purple-600/20 border-purple-500/50 text-purple-200' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                disabled={disabled}
                onChange={() => handleToggle(item.id)}
                className="hidden"
              />
              {isSelected ? <CheckSquare className="w-4 h-4 text-purple-400 shrink-0" /> : <Square className="w-4 h-4 text-slate-500 shrink-0" />}
              <span className="text-sm truncate font-medium">{item.term}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
