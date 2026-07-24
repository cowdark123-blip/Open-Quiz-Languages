'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { fetchAllUserVocabItems, fetchUserVocabSets, insertVocabItem, insertVocabSet } from '@/lib/supabase/data-service'
import { createClient } from '@/lib/supabase/client'
import { VocabItem, VocabSet } from '@/types/database'

interface VocabContextProps {
  vocabItems: VocabItem[]
  vocabSets: VocabSet[]
  isLoading: boolean
  refreshVocab: (forceRefresh?: boolean) => Promise<void>
  addWordToSet: (setId: string, term: string, definition: string, ipa: string, vietnameseTranslation: string, exampleSentence: string) => Promise<boolean>
  createSetAndAddWord: (setTitle: string, term: string, definition: string, ipa: string, vietnameseTranslation: string, exampleSentence: string) => Promise<boolean>
  isWordSaved: (term: string) => boolean
}

const VocabContext = createContext<VocabContextProps | undefined>(undefined)

export function VocabProvider({ children }: { children: ReactNode }) {
  const [vocabItems, setVocabItems] = useState<VocabItem[]>([])
  const [vocabSets, setVocabSets] = useState<VocabSet[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const updateCache = (newSets: VocabSet[], newItems: VocabItem[]) => {
    try {
      const cached = localStorage.getItem('vocab_cache')
      if (cached) {
        const parsed = JSON.parse(cached)
        localStorage.setItem('vocab_cache', JSON.stringify({
          userId: parsed.userId,
          vocabSets: newSets,
          vocabItems: newItems
        }))
      }
    } catch (e) {}
  }

  const refreshVocab = async (forceRefresh = false) => {
    setIsLoading(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const userId = session?.user?.id

    if (!userId) {
      setIsLoading(false)
      return
    }

    const CACHE_KEY = 'vocab_cache'

    // Check cache first
    if (!forceRefresh) {
      try {
        const cached = localStorage.getItem(CACHE_KEY)
        if (cached) {
          const parsed = JSON.parse(cached)
          // If cache belongs to current user, use it
          if (parsed.userId === userId && parsed.vocabSets && parsed.vocabItems) {
            setVocabSets(parsed.vocabSets)
            setVocabItems(parsed.vocabItems)
            setIsLoading(false)
            return // Skip network request
          }
        }
      } catch (e) {}
    }

    // Cache missed or forced refresh or different user, fetch from DB
    const [sets, items] = await Promise.all([
      fetchUserVocabSets(),
      fetchAllUserVocabItems()
    ])

    const setsWithAccurateCount = sets.map(set => {
       const actualCount = items.filter(item => item.set_id === set.id).length;
       return {
         ...set,
         item_count: actualCount > 0 ? actualCount : set.item_count
       }
    });

    setVocabSets(setsWithAccurateCount)
    setVocabItems(items)

    // Save new data to cache
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        userId,
        vocabSets: setsWithAccurateCount,
        vocabItems: items
      }))
    } catch (e) {}

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
      setVocabItems(prev => {
        const newItems = [...prev, newItem]
        updateCache(vocabSets, newItems)
        return newItems
      })
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
      setVocabSets(prev => {
        const newSets = [newSet, ...prev]
        updateCache(newSets, vocabItems)
        return newSets
      })
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
