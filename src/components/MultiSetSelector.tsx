import React, { useState, useRef, useEffect } from 'react'
import { VocabSet } from '@/types/database'
import { CheckSquare, Square, ChevronDown } from 'lucide-react'

interface MultiSetSelectorProps {
  sets: VocabSet[]
  selectedIds: string[]
  onChange: (newIds: string[]) => void
  disabled?: boolean
}

export default function MultiSetSelector({ sets, selectedIds, onChange, disabled }: MultiSetSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(i => i !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  const handleSelectAll = () => onChange(sets.map(s => s.id))
  const handleDeselectAll = () => onChange([])

  const totalWords = sets.filter(s => selectedIds.includes(s.id)).reduce((acc, curr) => acc + (curr.item_count || 0), 0)

  return (
    <div className="relative w-full md:w-64" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-800 border border-slate-700 hover:border-slate-500 text-white text-sm rounded-xl px-4 py-2 flex items-center justify-between outline-none focus:border-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="truncate pr-2">
          {selectedIds.length === 0 ? 'Chọn bộ từ vựng...' : `Đã chọn ${selectedIds.length} bộ`}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 top-full mt-2 w-full sm:w-80 right-0 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col">
          <div className="p-3 border-b border-slate-800 flex items-center justify-between gap-2 bg-slate-800/50">
            <div className="flex gap-2">
              <button onClick={handleSelectAll} className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded hover:bg-purple-500/30 transition-colors">
                Chọn Tất Cả
              </button>
              <button onClick={handleDeselectAll} className="text-xs px-2 py-1 bg-slate-700/50 text-slate-300 rounded hover:bg-slate-700 transition-colors">
                Bỏ Chọn
              </button>
            </div>
          </div>
          
          <div className="max-h-60 overflow-y-auto p-2 space-y-1">
            {sets.length === 0 && (
              <div className="p-3 text-center text-slate-500 text-xs">Không có bộ từ nào.</div>
            )}
            {sets.map(set => {
              const isSelected = selectedIds.includes(set.id)
              return (
                <button
                  key={set.id}
                  onClick={() => handleToggle(set.id)}
                  className={`w-full text-left p-2 rounded-lg flex items-start gap-3 transition-colors ${
                    isSelected ? 'bg-purple-500/10 hover:bg-purple-500/20' : 'hover:bg-slate-800'
                  }`}
                >
                  <div className="pt-0.5 shrink-0">
                    {isSelected ? <CheckSquare className="w-4 h-4 text-purple-400" /> : <Square className="w-4 h-4 text-slate-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm truncate font-medium ${isSelected ? 'text-purple-300' : 'text-slate-300'}`}>
                      {set.title}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{set.item_count || 0} từ vựng</div>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="p-3 border-t border-slate-800 bg-slate-800/50">
            <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
              <span>Tổng số từ vựng:</span>
              <span className="text-purple-400 font-bold">{totalWords} từ</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
