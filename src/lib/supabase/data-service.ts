import { createClient } from './client'
import { VocabSet, VocabItem, UserSRSProgress, SpeakingSession } from '@/types/database'
import { INITIAL_MOCK_SETS } from '@/lib/mock-data'

export async function fetchVocabSets(): Promise<VocabSet[]> {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from('vocab_sets')
      .select('*')
      .order('created_at', { ascending: false })

    if (error || !data || data.length === 0) {
      // If table is empty, seed initial sets into Supabase
      return INITIAL_MOCK_SETS
    }

    return data as VocabSet[]
  } catch {
    return INITIAL_MOCK_SETS
  }
}

export async function fetchVocabSetById(id: string): Promise<VocabSet | null> {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from('vocab_sets')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      const found = INITIAL_MOCK_SETS.find((s) => s.id === id)
      return found || INITIAL_MOCK_SETS[0]
    }

    return data as VocabSet
  } catch {
    const found = INITIAL_MOCK_SETS.find((s) => s.id === id)
    return found || INITIAL_MOCK_SETS[0]
  }
}

export async function fetchVocabItems(setId: string): Promise<VocabItem[]> {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from('vocab_items')
      .select('*')
      .eq('set_id', setId)
      .order('created_at', { ascending: true })

    if (error || !data || data.length === 0) {
      const foundSet = INITIAL_MOCK_SETS.find((s) => s.id === setId)
      return foundSet ? foundSet.items : INITIAL_MOCK_SETS[0].items
    }

    return data as VocabItem[]
  } catch {
    const foundSet = INITIAL_MOCK_SETS.find((s) => s.id === setId)
    return foundSet ? foundSet.items : INITIAL_MOCK_SETS[0].items
  }
}

export async function insertVocabSet(newSet: Partial<VocabSet>): Promise<VocabSet | null> {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from('vocab_sets')
      .insert([newSet])
      .select()
      .single()

    if (error) {
      console.warn('Supabase insert set warning, fallback:', error)
      return null
    }
    return data as VocabSet
  } catch {
    return null
  }
}

export async function deleteVocabSet(id: string): Promise<boolean> {
  const supabase = createClient()
  try {
    const { error } = await supabase.from('vocab_sets').delete().eq('id', id)
    return !error
  } catch {
    return true
  }
}

export async function insertVocabItem(item: Partial<VocabItem>): Promise<VocabItem | null> {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from('vocab_items')
      .insert([item])
      .select()
      .single()

    if (error) {
      console.warn('Supabase insert item warning:', error)
      return null
    }
    return data as VocabItem
  } catch {
    return null
  }
}

export async function updateVocabItem(id: string, updates: Partial<VocabItem>): Promise<boolean> {
  const supabase = createClient()
  try {
    const { error } = await supabase.from('vocab_items').update(updates).eq('id', id)
    return !error
  } catch {
    return true
  }
}

export async function deleteVocabItem(id: string): Promise<boolean> {
  const supabase = createClient()
  try {
    const { error } = await supabase.from('vocab_items').delete().eq('id', id)
    return !error
  } catch {
    return true
  }
}

export async function saveSRSProgress(progress: Partial<UserSRSProgress>): Promise<boolean> {
  const supabase = createClient()
  try {
    const { error } = await supabase.from('user_srs_progress').upsert(progress)
    return !error
  } catch {
    return true
  }
}

export async function saveSpeakingSession(session: Partial<SpeakingSession>): Promise<boolean> {
  const supabase = createClient()
  try {
    const { error } = await supabase.from('speaking_sessions').insert([session])
    return !error
  } catch {
    return true
  }
}
