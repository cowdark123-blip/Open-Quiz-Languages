'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { fetchAllUserVocabItems, fetchUserVocabSets, insertVocabItem, insertVocabSet } from '@/lib/supabase/data-service'
import { VocabItem, VocabSet } from '@/types/database'

interface VocabContextProps {
  vocabItems: VocabItem[]
  vocabSets: VocabSet[]
  isLoading: boolean
  refreshVocab: () => Promise<void>
  addWordToSet: (setId: string, term: string, definition: string, ipa: string, vietnameseTranslation: string, exampleSentence: string) => Promise<boolean>
  createSetAndAddWord: (setTitle: string, term: string, definition: string, ipa: string, vietnameseTranslation: string, exampleSentence: string) => Promise<boolean>
  isWordSaved: (term: string) => boolean
}

const VocabContext = createContext<VocabContextProps | undefined>(undefined)

export function VocabProvider({ children }: { children: ReactNode }) {
  const [vocabItems, setVocabItems] = useState<VocabItem[]>([])
  const [vocabSets, setVocabSets] = useState<VocabSet[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refreshVocab = async () => {
    setIsLoading(true)
    const [sets, items] = await Promise.all([
      fetchUserVocabSets(),
      fetchAllUserVocabItems()
    ])
    setVocabSets(sets)
    setVocabItems(items)
    setIsLoading(false)
  }

  useEffect(() => {
    refreshVocab()
  }, [])

  const addWordToSet = async (setId: string, term: string, definition: string, ipa: string, vietnameseTranslation: string, exampleSentence: string) => {
    const newItem = await insertVocabItem({
      set_id: setId,
      term,
      definition,
      ipa,
      vietnamese_translation: vietnameseTranslation,
      example_sentence: exampleSentence
    })
    
    if (newItem) {
      setVocabItems(prev => [...prev, newItem])
      return true
    }
    return false
  }

  const createSetAndAddWord = async (setTitle: string, term: string, definition: string, ipa: string, vietnameseTranslation: string, exampleSentence: string) => {
    const newSet = await insertVocabSet({
      title: setTitle,
      description: 'Được tạo nhanh từ tính năng tra từ',
      category: 'General',
      target_language: 'en',
      is_public: false
    })

    if (newSet) {
      setVocabSets(prev => [newSet, ...prev])
      return await addWordToSet(newSet.id, term, definition, ipa, vietnameseTranslation, exampleSentence)
    }
    return false
  }

  const isWordSaved = (term: string) => {
    const cleanTerm = term.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g,"").toLowerCase().trim()
    return vocabItems.some(item => item.term.toLowerCase().trim() === cleanTerm)
  }

  return (
    <VocabContext.Provider value={{
      vocabItems,
      vocabSets,
      isLoading,
      refreshVocab,
      addWordToSet,
      createSetAndAddWord,
      isWordSaved
    }}>
      {children}
    </VocabContext.Provider>
  )
}

export function useVocab() {
  const context = useContext(VocabContext)
  if (context === undefined) {
    throw new Error('useVocab must be used within a VocabProvider')
  }
  return context
}
