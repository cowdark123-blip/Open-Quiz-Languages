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

export async function updateUserProfile(updates: Partial<Profile>): Promise<boolean> {
  const supabase = createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id)
    return !error
  } catch {
    return false
  }
}

export async function checkAndUpdateStreak(userId?: string): Promise<number> {
  const supabase = createClient()
  try {
    let targetUserId = userId
    if (!targetUserId) {
      const { data: { user } } = await supabase.auth.getUser()
      targetUserId = user?.id
    }
    if (!targetUserId) return 1

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetUserId)
      .single()

    const todayStr = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    let newStreak = 1
    const lastActive = profile?.last_active_date

    if (lastActive === todayStr) {
      newStreak = profile?.streak_count || 1
    } else if (lastActive === yesterdayStr) {
      newStreak = (profile?.streak_count || 0) + 1
    } else {
      newStreak = 1
    }

    await supabase.from('profiles').upsert({
      id: targetUserId,
      streak_count: newStreak,
      last_active_date: todayStr,
    })

    return newStreak
  } catch (err) {
    console.error('Update streak error:', err)
    return 1
  }
}

export const updateUserStreak = checkAndUpdateStreak

export async function fetchUserVocabSets(userId?: string): Promise<VocabSet[]> {
  const supabase = createClient()
  try {
    let query = supabase.from('vocab_sets').select('*, vocab_items(count)').order('created_at', { ascending: false })
    
    if (userId) {
      query = query.or(`user_id.eq.${userId},is_public.eq.true`)
    }

    const { data, error } = await query

    if (error || !data) return []
    
    return data.map((set: any) => ({
      ...set,
      item_count: set.vocab_items?.[0]?.count || 0,
      vocab_items: undefined
    })) as VocabSet[]
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
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('vocab_items')
      .select('*, user_srs_progress(*)')
      .eq('set_id', setId)
      .order('created_at', { ascending: true })

    if (error || !data) {
      const { data: fallbackData } = await supabase
        .from('vocab_items')
        .select('*')
        .eq('set_id', setId)
        .order('created_at', { ascending: true })
      return (fallbackData as VocabItem[]) || []
    }
    
    return data.map((item: any) => {
      const progress = item.user_srs_progress?.find((p: any) => p.user_id === user?.id) || item.user_srs_progress?.[0]
      return {
        ...item,
        srsProgress: progress,
        user_srs_progress: undefined
      }
    }) as VocabItem[]
  } catch {
    return []
  }
}

export async function fetchDueSRSItems(setId?: string): Promise<(VocabItem & { srsProgress?: UserSRSProgress })[]> {
  const supabase = createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id || '00000000-0000-0000-0000-000000000000'

    let itemsQuery = supabase.from('vocab_items').select('*, user_srs_progress(*)')
    
    if (setId) {
      itemsQuery = itemsQuery.eq('set_id', setId)
    } else {
      const { data: userSets } = await supabase
        .from('vocab_sets')
        .select('id')
        .or(`user_id.eq.${userId},is_public.eq.true`)

      if (!userSets || userSets.length === 0) return []
      const setIds = userSets.map((s) => s.id)
      itemsQuery = itemsQuery.in('set_id', setIds)
    }

    const { data: items } = await itemsQuery
    if (!items) return []

    const now = new Date().getTime()
    const dueItems: (VocabItem & { srsProgress?: UserSRSProgress })[] = []
    
    for (const item of items) {
      const progress = item.user_srs_progress?.find((p: any) => p.user_id === userId) || item.user_srs_progress?.[0]
      if (!progress) {
        dueItems.push({ ...item, srsProgress: undefined, user_srs_progress: undefined })
      } else {
        const nextReviewTime = new Date(progress.next_review_date).getTime()
        if (nextReviewTime <= now) {
          dueItems.push({ ...item, srsProgress: progress, user_srs_progress: undefined })
        }
      }
    }

    return dueItems
  } catch (err) {
    console.error('Failed to fetch due SRS items', err)
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

export async function updateVocabSet(id: string, updates: Partial<VocabSet>): Promise<boolean> {
  const supabase = createClient()
  try {
    const { error } = await supabase.from('vocab_sets').update(updates).eq('id', id)
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

export async function insertVocabItemsBatch(items: Partial<VocabItem>[]): Promise<VocabItem[]> {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from('vocab_items')
      .insert(items)
      .select()

    if (error || !data) return []
    return data as VocabItem[]
  } catch {
    return []
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
    const userId = user?.id || '00000000-0000-0000-0000-000000000000'

    const payload = {
      ...progress,
      user_id: userId,
      last_reviewed_at: new Date().toISOString(),
    }

    // Upsert into user_srs_progress
    const { error } = await supabase.from('user_srs_progress').upsert(payload, {
      onConflict: 'user_id,item_id',
    })

    if (error) {
      console.error('Supabase SRS Upsert Error:', error)
      throw new Error(error.message)
    }

    // Update streak for active learning activity
    await checkAndUpdateStreak(userId)
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('streak-updated'))

    return true
  } catch (err: any) {
    console.error('Save SRS Progress exception:', err)
    throw err
  }
}

export async function saveQuizResult(setId: string, score: number, total: number): Promise<boolean> {
  const supabase = createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id || '00000000-0000-0000-0000-000000000000'

    const payload = {
      user_id: userId,
      set_id: setId,
      score: score,
      total_questions: total,
    }

    const { error } = await supabase.from('quiz_results').insert([payload])
    
    // Update streak for active learning activity
    await checkAndUpdateStreak(userId)
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('streak-updated'))

    return !error
  } catch {
    return false
  }
}

export async function saveSpeakingSession(session: Partial<SpeakingSession>): Promise<boolean> {
  const supabase = createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id || '00000000-0000-0000-0000-000000000000'

    const payload = {
      ...session,
      user_id: userId,
    }

    const { error } = await supabase.from('speaking_sessions').insert([payload])
    
    // Update streak for active speaking activity
    await checkAndUpdateStreak(userId)
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('streak-updated'))

    return !error
  } catch {
    return false
  }
}

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

export async function fetchAllUserSRSProgress(): Promise<UserSRSProgress[]> {
  const supabase = createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('user_srs_progress')
      .select('*')
      .eq('user_id', user.id)

    if (error || !data) return []
    return data as UserSRSProgress[]
  } catch {
    return []
  }
}
