import { createClient } from './client'
import { VocabSet, VocabItem, UserSRSProgress, SpeakingSession, Profile } from '@/types/database'

export async function getCurrentUserProfile(): Promise<{ user: any; profile: Profile | null }> {
  const supabase = createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { user: null, profile: null }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return {
      user,
      profile: profile as Profile | null,
    }
  } catch {
    return { user: null, profile: null }
  }
}

export async function fetchUserVocabSets(userId?: string): Promise<VocabSet[]> {
  const supabase = createClient()
  try {
    let query = supabase.from('vocab_sets').select('*').order('created_at', { ascending: false })
    
    if (userId) {
      query = query.or(`user_id.eq.${userId},is_public.eq.true`)
    }

    const { data, error } = await query

    if (error || !data) return []
    return data as VocabSet[]
  } catch {
    return []
  }
}

export const fetchVocabSets = fetchUserVocabSets

export async function fetchUserVocabSetById(id: string): Promise<VocabSet | null> {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from('vocab_sets')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return null
    return data as VocabSet
  } catch {
    return null
  }
}

export const fetchVocabSetById = fetchUserVocabSetById

export async function fetchVocabItems(setId: string): Promise<VocabItem[]> {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from('vocab_items')
      .select('*')
      .eq('set_id', setId)
      .order('created_at', { ascending: true })

    if (error || !data) return []
    return data as VocabItem[]
  } catch {
    return []
  }
}

export async function insertVocabSet(newSet: Partial<VocabSet>): Promise<VocabSet | null> {
  const supabase = createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    const payload = {
      ...newSet,
      user_id: user?.id || '00000000-0000-0000-0000-000000000000',
    }

    const { data, error } = await supabase
      .from('vocab_sets')
      .insert([payload])
      .select()
      .single()

    if (error) return null
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

    if (error) return null
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
    const { data: { user } } = await supabase.auth.getUser()
    const payload = {
      ...progress,
      user_id: user?.id || '00000000-0000-0000-0000-000000000000',
    }

    const { error } = await supabase.from('user_srs_progress').insert([payload])
    return !error
  } catch {
    return false
  }
}

export async function saveSpeakingSession(session: Partial<SpeakingSession>): Promise<boolean> {
  const supabase = createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    const payload = {
      ...session,
      user_id: user?.id || '00000000-0000-0000-0000-000000000000',
    }

    const { error } = await supabase.from('speaking_sessions').insert([payload])
    return !error
  } catch {
    return false
  }
}

/**
 * Seeds IELTS Sample Set directly into current user's Supabase account
 */
export async function seedSampleSetForUser(): Promise<VocabSet | null> {
  const supabase = createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id || '00000000-0000-0000-0000-000000000000'

    const { data: setObj, error: setErr } = await supabase
      .from('vocab_sets')
      .insert([
        {
          user_id: userId,
          title: 'IELTS Core Vocabulary (Band 7.5+)',
          description: 'Bộ từ vựng học thuật quan trọng cho kỳ thi IELTS Speaking & Writing Task 2.',
          category: 'IELTS',
          target_language: 'en',
          is_public: true,
        },
      ])
      .select()
      .single()

    if (setObj && !setErr) {
      await supabase.from('vocab_items').insert([
        {
          set_id: setObj.id,
          term: 'Resilience',
          definition: 'The capacity to recover quickly from difficulties; toughness.',
          ipa: '/rɪˈzɪl.jəns/',
          example_sentence: 'Her resilience helped her overcome severe challenges in her career.',
          vietnamese_translation: 'Khả năng phục hồi, sự kiên cường',
          synonyms: ['adaptability', 'toughness', 'flexibility'],
        },
        {
          set_id: setObj.id,
          term: 'Ubiquitous',
          definition: 'Present, appearing, or found everywhere.',
          ipa: '/juːˈbɪk.wə.təs/',
          example_sentence: 'Smartphones have become ubiquitous in modern human society.',
          vietnamese_translation: 'Phổ biến ở khắp mọi nơi',
          synonyms: ['omnipresent', 'pervasive', 'universal'],
        },
        {
          set_id: setObj.id,
          term: 'Meticulous',
          definition: 'Showing great attention to detail; very careful and precise.',
          ipa: '/məˈtɪk.jə.ləs/',
          example_sentence: 'The architect was meticulous in designing every single room of the building.',
          vietnamese_translation: 'Tỉ mỉ, cẩn thận từng chi tiết nhỏ',
          synonyms: ['thorough', 'diligent', 'precise'],
        },
      ])

      return setObj as VocabSet
    }

    return null
  } catch {
    return null
  }
}

export const seedInitialDatabase = seedSampleSetForUser
