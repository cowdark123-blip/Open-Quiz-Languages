'use client'

import React, { useState } from 'react'
import DictionaryPopover from './DictionaryPopover'
import { useVocab } from '@/contexts/VocabContext'

interface InteractiveTextProps {
  text: string
  className?: string
  containerContext?: string 
}

export default function InteractiveText({ text, className = '', containerContext }: InteractiveTextProps) {
  const { isWordSaved } = useVocab()
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  
  // Basic tokenization: split by spaces/newlines
  const chunks = text.split(/(\s+)/)

  return (
    <span className={`relative ${className}`}>
      {chunks.map((chunk, i) => {
        if (/^\s+$/.test(chunk)) {
          return <span key={i}>{chunk}</span>
        }
        
        // Clean word for checking if saved and sending to API
        const cleanWord = chunk.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g,"").toLowerCase().trim()
        const saved = cleanWord.length > 0 && isWordSaved(cleanWord)
        
        return (
          <span key={i} className="relative inline-block">
            <span
              onClick={() => setSelectedIndex(i)}
              className={`cursor-pointer transition-colors duration-200 hover:bg-purple-500/20 hover:text-purple-300 rounded px-0.5 ${
                saved ? 'border-b-2 border-dashed border-purple-500 text-purple-200 font-medium' : ''
              }`}
            >
              {chunk}
            </span>
            {selectedIndex === i && (
              <DictionaryPopover 
                word={cleanWord}
                contextSentence={containerContext || text}
                onClose={() => setSelectedIndex(null)}
              />
            )}
          </span>
        )
      })}
    </span>
  )
}
