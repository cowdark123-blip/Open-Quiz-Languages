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

export async function checkAndUpdateStreak(userId?: string, activityType: string = 'general'): Promise<number> {
  const supabase = createClient()
  try {
    let targetUserId = userId
    if (!targetUserId) {
      const { data: { user } } = await supabase.auth.getUser()
      targetUserId = user?.id
    }
    if (!targetUserId) return 0

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetUserId)
      .single()

    // Use local timezone (UTC+7) instead of UTC
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`

    let newStreak = 0
    const lastActive = profile?.last_active_date

    if (lastActive === todayStr) {
      // Đã học hôm nay, giữ streak hiện tại
      newStreak = profile?.streak_count || 0
    } else if (lastActive === yesterdayStr) {
      // Học hôm qua, tăng streak +1
      newStreak = (profile?.streak_count || 0) + 1
    } else if (!lastActive) {
      // Lần đầu học
      newStreak = 1
    } else {
      // Đứt streak, reset về 0
      newStreak = 0
    }

    const bestStreak = Math.max(newStreak, profile?.best_streak || 0)

    // Log activity vào activity_logs
    await supabase.from('activity_logs').upsert({
      user_id: targetUserId,
      activity_date: todayStr,
      activity_type: activityType,
    }, {
      onConflict: 'user_id,activity_date',
    })

    // Update profile
    await supabase.from('profiles').upsert({
      id: targetUserId,
      streak_count: newStreak,
      best_streak: bestStreak,
      last_active_date: todayStr,
    })

    return newStreak
  } catch (err) {
    console.error('Update streak error:', err)
    return 0
  }
}

export const updateUserStreak = checkAndUpdateStreak

export async function getActivityHistory(userId?: string, days: number = 28): Promise<string[]> {
  const supabase = createClient()
  try {
    let targetUserId = userId
    if (!targetUserId) {
      const { data: { user } } = await supabase.auth.getUser()
      targetUserId = user?.id
    }
    if (!targetUserId) return []

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days + 1)
    const startDateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`

    const { data, error } = await supabase
      .from('activity_logs')
      .select('activity_date')
      .eq('user_id', targetUserId)
      .gte('activity_date', startDateStr)
      .order('activity_date', { ascending: true })

    if (error || !data) return []
    return data.map(row => row.activity_date)
  } catch {
    return []
  }
}

export async function fetchUserVocabSets(userId?: string): Promise<VocabSet[]> {
  const supabase = createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    const targetUserId = userId || user?.id
    if (!targetUserId) return []

    const { data, error } = await supabase
      .from('vocab_sets')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })

    if (error || !data) return []

    const setIds = data.map(s => s.id)
    if (setIds.length === 0) return data as VocabSet[]

    const { data: countData } = await supabase
      .from('vocab_items')
      .select('set_id')
      .in('set_id', setIds)

    const countMap = new Map<string, number>()
    if (countData) {
      for (const row of countData as any[]) {
        countMap.set(row.set_id, (countMap.get(row.set_id) || 0) + 1)
      }
    }

    return data.map((set: any) => ({
      ...set,
      item_count: set.item_count || countMap.get(set.id) || 0
    })) as VocabSet[]
  } catch {
    return []
  }
}

export const fetchVocabSets = fetchUserVocabSets

export async function fetchUserVocabSetById(id: string): Promise<VocabSet | null> {
  const supabase = createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('vocab_sets')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
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
    if (!user) return []

    const { data: setCheck } = await supabase
      .from('vocab_sets')
      .select('id')
      .eq('id', setId)
      .eq('user_id', user.id)
      .single()

    if (!setCheck) return []

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

export async function fetchVocabItemsWithSRSProgress(setId: string): Promise<(VocabItem & { srsProgress?: UserSRSProgress })[]> {
  const supabase = createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: setCheck } = await supabase
      .from('vocab_sets')
      .select('id')
      .eq('id', setId)
      .eq('user_id', user.id)
      .single()

    if (!setCheck) return []

    const { data: items, error: itemsError } = await supabase
      .from('vocab_items')
      .select('*')
      .eq('set_id', setId)
      .order('created_at', { ascending: true })

    if (itemsError || !items) return []

    const itemIds = items.map(i => i.id)
    const { data: progressList } = await supabase
      .from('user_srs_progress')
      .select('*')
      .eq('user_id', user.id)
      .in('item_id', itemIds)

    const progressMap = new Map<string, UserSRSProgress>()
    if (progressList) {
      for (const p of progressList) {
        progressMap.set(p.item_id, p as UserSRSProgress)
      }
    }

    return items.map(item => ({
      ...item,
      srsProgress: progressMap.get(item.id),
    })) as (VocabItem & { srsProgress?: UserSRSProgress })[]
  } catch (err) {
    console.error('fetchVocabItemsWithSRSProgress error:', err)
    return []
  }
}

export async function fetchVocabItemsBySets(setIds: string[]): Promise<VocabItem[]> {
  if (!setIds || setIds.length === 0) return []
  const supabase = createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: userSets } = await supabase
      .from('vocab_sets')
      .select('id')
      .eq('user_id', user.id)
      .in('id', setIds)

    if (!userSets || userSets.length === 0) return []
    const allowedSetIds = userSets.map(s => s.id)

    const { data, error } = await supabase
      .from('vocab_items')
      .select('*')
      .in('set_id', allowedSetIds)

    if (error || !data) return []
    return data as VocabItem[]
  } catch {
    return []
  }
}

export async function fetchAllUserVocabItems(): Promise<VocabItem[]> {
  const supabase = createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Get all user sets (owned only)
    const { data: userSets } = await supabase
      .from('vocab_sets')
      .select('id')
      .eq('user_id', user.id)
      
    if (!userSets || userSets.length === 0) return []
    const setIds = userSets.map(s => s.id)

    const { data, error } = await supabase
      .from('vocab_items')
      .select('*')
      .in('set_id', setIds)

    if (error || !data) return []
    return data as VocabItem[]
  } catch {
    return []
  }
}

export async function fetchDueSRSItems(setId?: string): Promise<(VocabItem & { srsProgress?: UserSRSProgress })[]> {
  const supabase = createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id || '00000000-0000-0000-0000-000000000000'

    let itemsQuery = supabase.from('vocab_items').select('*')
    
    if (setId) {
      itemsQuery = itemsQuery.eq('set_id', setId)
    } else {
      const { data: userSets } = await supabase
        .from('vocab_sets')
        .select('id')
        .eq('user_id', userId)

      if (!userSets || userSets.length === 0) return []
      const setIds = userSets.map((s) => s.id)
      itemsQuery = itemsQuery.in('set_id', setIds)
    }

    const { data: items } = await itemsQuery
    if (!items) return []

    const itemIds = items.map(i => i.id)
    const { data: progressList } = await supabase
      .from('user_srs_progress')
      .select('*')
      .eq('user_id', userId)
      .in('item_id', itemIds)

    const progressMap = new Map<string, any>()
    if (progressList) {
      for (const p of progressList) {
        progressMap.set(p.item_id, p)
      }
    }

    const now = new Date().getTime()
    const dueItems: (VocabItem & { srsProgress?: UserSRSProgress })[] = []
    
    for (const item of items) {
      const progress = progressMap.get(item.id)

      if (!progress) {
        dueItems.push({ ...item, srsProgress: undefined })
      } else {
        const nextReviewTime = new Date(progress.next_review_date).getTime()
        if (nextReviewTime <= now) {
          dueItems.push({ ...item, srsProgress: progress })
        }
      }
    }

    return dueItems
  } catch (err) {
    console.error('Failed to fetch due SRS items', err)
    return []
  }
}

export async function fetchCustomSRSItems(setIds: string[], modes: string[]): Promise<(VocabItem & { srsProgress?: UserSRSProgress, setTitle?: string })[]> {
  const supabase = createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id || '00000000-0000-0000-0000-000000000000'

    if (!setIds || setIds.length === 0) return []

    const { data: setsData } = await supabase
      .from('vocab_sets')
      .select('id, title')
      .eq('user_id', userId)
      .in('id', setIds)

    if (!setsData || setsData.length === 0) return []
    const setMap = new Map(setsData.map(s => [s.id, s.title]))

    const { data: items } = await supabase
      .from('vocab_items')
      .select('*')
      .in('set_id', setsData.map(s => s.id))

    if (!items) return []

    const itemIds = items.map(i => i.id)
    const { data: progressList } = await supabase
      .from('user_srs_progress')
      .select('*')
      .eq('user_id', userId)
      .in('item_id', itemIds)

    const progressMap = new Map<string, any>()
    if (progressList) {
      for (const p of progressList) {
        progressMap.set(p.item_id, p)
      }
    }

    const now = new Date().getTime()
    const customItems: (VocabItem & { srsProgress?: UserSRSProgress, setTitle?: string })[] = []
    
    for (const item of items) {
      const progress = progressMap.get(item.id)

      const setTitle = setMap.get(item.set_id) || 'Bộ Từ Vựng'
      
      const isMastered = progress && progress.repetition >= 4
      const isLearning = progress && progress.repetition > 0 && progress.repetition < 4
      const isNew = !progress
      const isDue = progress && new Date(progress.next_review_date).getTime() <= now
      const isStarred = item.is_starred

      let include = false

      if (modes.includes('due') && isDue) include = true
      if (modes.includes('new') && isNew) include = true
      if (modes.includes('learning') && isLearning) include = true
      if (modes.includes('mastered') && isMastered) include = true
      if (modes.includes('starred') && isStarred) include = true

      if (modes.length === 0 && isDue) include = true

      if (include) {
        customItems.push({ ...item, srsProgress: progress, setTitle })
      }
    }

    return customItems
  } catch (err) {
    console.error('Failed to fetch custom SRS items', err)
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
    // Delete items first to avoid FK constraint if ON DELETE CASCADE is not set
    await supabase.from('vocab_items').delete().eq('set_id', id)
    const { error } = await supabase.from('vocab_sets').delete().eq('id', id)
    if (error) {
      console.error('Lỗi khi xóa bộ từ:', error)
      return false
    }
    return true
  } catch (err) {
    console.error('Lỗi ngoại lệ khi xóa:', err)
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

    // Update item_count in vocab_sets
    if (data && data.set_id) {
      const { count } = await supabase.from('vocab_items').select('*', { count: 'exact', head: true }).eq('set_id', data.set_id)
      if (count !== null) {
        await supabase.from('vocab_sets').update({ item_count: count }).eq('id', data.set_id)
      }
    }

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

    // Update item_count in vocab_sets
    if (items.length > 0 && items[0].set_id) {
      const setId = items[0].set_id
      const { count } = await supabase.from('vocab_items').select('*', { count: 'exact', head: true }).eq('set_id', setId)
      if (count !== null) {
        await supabase.from('vocab_sets').update({ item_count: count }).eq('id', setId)
      }
    }

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

export async function updateWordStatus(itemId: string, isMastered: boolean): Promise<boolean> {
  const supabase = createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { error } = await supabase
      .from('vocab_items')
      .update({
        is_mastered: isMastered,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)

    return !error
  } catch {
    return false
  }
}

export async function deleteVocabItem(id: string): Promise<boolean> {
  const supabase = createClient()
  try {
    // Get set_id before deleting
    const { data: item } = await supabase.from('vocab_items').select('set_id').eq('id', id).single()
    
    const { error } = await supabase.from('vocab_items').delete().eq('id', id)
    
    if (!error && item && item.set_id) {
      // Update item_count in vocab_sets
      const { count } = await supabase.from('vocab_items').select('*', { count: 'exact', head: true }).eq('set_id', item.set_id)
      if (count !== null) {
        await supabase.from('vocab_sets').update({ item_count: count }).eq('id', item.set_id)
      }
    }
    
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

    // 🔧 FIX: Auto-calculate status based on repetition count if not provided
    let status = progress.status
    if (!status) {
      const repetition = progress.repetition || 0
      if (repetition === 0) {
        status = 'new'
      } else if (repetition >= 4) {
        status = 'mastered'
      } else {
        status = 'learning'
      }
    }

    const payload = {
      user_id: userId,
      item_id: progress.item_id,
      interval: progress.interval ?? 1,
      repetition: progress.repetition ?? 0,
      ease_factor: progress.ease_factor ?? 2.5,
      next_review_date: progress.next_review_date ?? new Date().toISOString(),
      last_reviewed_at: new Date().toISOString(),
      status: status, // ✅ NOW EXPLICITLY INCLUDED
    }

    // Check if progress already exists to avoid onConflict composite key issues
    const { data: existing } = await supabase
      .from('user_srs_progress')
      .select('id')
      .eq('user_id', userId)
      .eq('item_id', progress.item_id)
      .single()

    let err;
    if (existing) {
      const { error: updateError } = await supabase
        .from('user_srs_progress')
        .update(payload)
        .eq('id', existing.id)
      err = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('user_srs_progress')
        .insert([payload])
      err = insertError;
    }

    if (err) {
      console.error('Supabase SRS Update/Insert Error:', err)
      throw new Error(err.message)
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

// CONVERSATION HISTORIES
export async function saveConversationHistory(scenario: string, messages: any[]): Promise<boolean> {
  const supabase = createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const payload = {
      user_id: user.id,
      scenario,
      messages,
      updated_at: new Date().toISOString()
    }

    const { data: existing } = await supabase
      .from('conversation_histories')
      .select('id')
      .eq('user_id', user.id)
      .eq('scenario', scenario)
      .single()

    let error;
    if (existing) {
      const { error: updateErr } = await supabase.from('conversation_histories').update(payload).eq('id', existing.id)
      error = updateErr
    } else {
      const { error: insertErr } = await supabase.from('conversation_histories').insert([payload])
      error = insertErr
    }

    if (error) {
      console.error('saveConversationHistory error:', error)
      return false
    }
    return true
  } catch (err) {
    console.error('saveConversationHistory exception:', err)
    return false
  }
}

export async function loadConversationHistory(scenario: string): Promise<any[]> {
  const supabase = createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data } = await supabase
      .from('conversation_histories')
      .select('messages')
      .eq('user_id', user.id)
      .eq('scenario', scenario)
      .single()

    return data?.messages || []
  } catch {
    return []
  }
}

export async function deleteConversationHistory(scenario: string): Promise<boolean> {
  const supabase = createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { error } = await supabase.from('conversation_histories').delete().eq('user_id', user.id).eq('scenario', scenario)
    return !error
  } catch {
    return false
  }
}

// ACTIVE SESSIONS
export async function saveActiveSession(moduleType: string, resourceId: string, sessionData: any): Promise<boolean> {
  if (typeof window === 'undefined') return false
  try {
    const { data: { user } } = await createClient().auth.getUser()
    const userId = user?.id || 'anon'
    const key = `active_session_${userId}_${moduleType}_${resourceId}`
    window.localStorage.setItem(key, JSON.stringify({
      session_data: sessionData,
      updated_at: new Date().toISOString()
    }))
    return true
  } catch (err) {
    console.error('saveActiveSession exception:', err)
    return false
  }
}

export async function loadActiveSession(moduleType: string, resourceId: string): Promise<any> {
  if (typeof window === 'undefined') return null
  try {
    const { data: { user } } = await createClient().auth.getUser()
    const userId = user?.id || 'anon'
    const key = `active_session_${userId}_${moduleType}_${resourceId}`
    const data = window.localStorage.getItem(key)
    if (!data) return null
    const parsed = JSON.parse(data)
    return parsed.session_data || null
  } catch {
    return null
  }
}

export async function deleteActiveSession(moduleType: string, resourceId: string): Promise<boolean> {
  if (typeof window === 'undefined') return false
  try {
    const { data: { user } } = await createClient().auth.getUser()
    const userId = user?.id || 'anon'
    const key = `active_session_${userId}_${moduleType}_${resourceId}`
    window.localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}
