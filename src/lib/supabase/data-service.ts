import { createClient } from './client'
import { VocabSet, VocabItem, UserSRSProgress, SpeakingSession } from '@/types/database'

export async function fetchVocabSets(): Promise<VocabSet[]> {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from('vocab_sets')
      .select('*')
      .order('created_at', { ascending: false })

    if (error || !data) {
      console.warn('Supabase fetch error:', error)
      return []
    }

    return data as VocabSet[]
  } catch (err) {
    console.error('Fetch sets error:', err)
    return []
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
      return null
    }

    return data as VocabSet
  } catch {
    return null
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

    if (error || !data) {
      return []
    }

    return data as VocabItem[]
  } catch {
    return []
  }
}

export async function fetchAllVocabItems(): Promise<(VocabItem & { setTitle?: string })[]> {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from('vocab_items')
      .select('*, vocab_sets(title)')
      .order('created_at', { ascending: true })

    if (error || !data) {
      return []
    }

    return data.map((item: any) => ({
      ...item,
      setTitle: item.vocab_sets?.title || 'Bộ Từ Vựng',
    }))
  } catch {
    return []
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
      console.error('Supabase insert set error:', error)
      return null
    }
    return data as VocabSet
  } catch (err) {
    console.error('Insert set catch error:', err)
    return null
  }
}

export async function deleteVocabSet(id: string): Promise<boolean> {
  const supabase = createClient()
  try {
    const { error } = await supabase.from('vocab_sets').delete().eq('id', id)
    return !error
  } catch {
    return false
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
      console.error('Supabase insert item error:', error)
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
    return false
  }
}

export async function deleteVocabItem(id: string): Promise<boolean> {
  const supabase = createClient()
  try {
    const { error } = await supabase.from('vocab_items').delete().eq('id', id)
    return !error
  } catch {
    return false
  }
}

export async function saveSRSProgress(progress: Partial<UserSRSProgress>): Promise<boolean> {
  const supabase = createClient()
  try {
    const { error } = await supabase.from('user_srs_progress').insert([progress])
    return !error
  } catch {
    return false
  }
}

export async function saveSpeakingSession(session: Partial<SpeakingSession>): Promise<boolean> {
  const supabase = createClient()
  try {
    const { error } = await supabase.from('speaking_sessions').insert([session])
    return !error
  } catch {
    return false
  }
}

/**
 * Seeds initial database data directly into Supabase Cloud PostgreSQL
 */
export async function seedInitialDatabase(): Promise<boolean> {
  const supabase = createClient()
  try {
    // 1. Create IELTS Set
    const { data: set1, error: e1 } = await supabase
      .from('vocab_sets')
      .insert([
        {
          title: 'IELTS Core Vocabulary (Band 7.5+)',
          description: 'Bộ từ vựng học thuật quan trọng lưu trực tiếp trên Supabase PostgreSQL.',
          category: 'IELTS',
          target_language: 'en',
          is_public: true,
        },
      ])
      .select()
      .single()

    if (set1 && !e1) {
      await supabase.from('vocab_items').insert([
        {
          set_id: set1.id,
          term: 'Resilience',
          definition: 'The capacity to recover quickly from difficulties; toughness.',
          ipa: '/rɪˈzɪl.jəns/',
          example_sentence: 'Her resilience helped her overcome severe challenges in her career.',
          vietnamese_translation: 'Khả năng phục hồi, sự kiên cường',
          synonyms: ['adaptability', 'toughness', 'flexibility'],
        },
        {
          set_id: set1.id,
          term: 'Ubiquitous',
          definition: 'Present, appearing, or found everywhere.',
          ipa: '/juːˈbɪk.wə.təs/',
          example_sentence: 'Smartphones have become ubiquitous in modern human society.',
          vietnamese_translation: 'Phổ biến ở khắp mọi nơi',
          synonyms: ['omnipresent', 'pervasive', 'universal'],
        },
        {
          set_id: set1.id,
          term: 'Meticulous',
          definition: 'Showing great attention to detail; very careful and precise.',
          ipa: '/məˈtɪk.jə.ləs/',
          example_sentence: 'The architect was meticulous in designing every single room of the building.',
          vietnamese_translation: 'Tỉ mỉ, cẩn thận từng chi tiết nhỏ',
          synonyms: ['thorough', 'diligent', 'precise'],
        },
      ])
    }

    return true
  } catch (err) {
    console.error('Seed database error:', err)
    return false
  }
}
