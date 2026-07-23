export type SRSGrade = 'again' | 'hard' | 'good' | 'easy'

export interface SM2State {
  interval: number // days
  repetition: number
  easeFactor: number // default 2.5
  nextReviewDate: string // ISO date string
}

export interface SM2Result extends SM2State {
  grade: SRSGrade
  calculatedIntervalDays: number
}

/**
 * SuperMemo-2 (SM-2) Spaced Repetition Algorithm Implementation
 * @param grade User feedback ('again', 'hard', 'good', 'easy')
 * @param currentInterval Current interval in days
 * @param currentRepetition Number of consecutive successful repetitions
 * @param currentEaseFactor Current ease factor (minimum 1.3)
 */
export function calculateSM2(
  grade: SRSGrade,
  currentInterval: number = 1,
  currentRepetition: number = 0,
  currentEaseFactor: number = 2.5
): SM2Result {
  let interval: number
  let repetition: number
  let easeFactor: number
  let quality: number // SM-2 score from 0 to 5

  switch (grade) {
    case 'again':
      quality = 1
      break
    case 'hard':
      quality = 3
      break
    case 'good':
      quality = 4
      break
    case 'easy':
      quality = 5
      break
  }

  // 1. Calculate New Ease Factor
  easeFactor = currentEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  if (easeFactor < 1.3) easeFactor = 1.3

  // 2. Calculate New Repetition and Interval
  if (quality < 3) {
    // Failed recall: reset repetitions
    repetition = 0
    interval = 1
  } else {
    // Successful recall
    if (currentRepetition === 0) {
      interval = 1
    } else if (currentRepetition === 1) {
      interval = 6
    } else {
      interval = Math.round(currentInterval * easeFactor)
    }
    repetition = currentRepetition + 1
  }

  // Additional modifier for 'easy' or 'hard'
  if (grade === 'easy') {
    interval = Math.round(interval * 1.3)
  } else if (grade === 'hard') {
    interval = Math.max(1, Math.round(interval * 0.8))
  }

  // 3. Calculate Next Review Date
  const nextDate = new Date()
  nextDate.setDate(nextDate.getDate() + interval)

  return {
    grade,
    interval,
    repetition,
    easeFactor: Number(easeFactor.toFixed(2)),
    calculatedIntervalDays: interval,
    nextReviewDate: nextDate.toISOString(),
  }
}

/**
 * Predict next intervals for UI button labels (Again, Hard, Good, Easy)
 */
export function getSM2IntervalPreviews(
  currentInterval: number = 1,
  currentRepetition: number = 0,
  currentEaseFactor: number = 2.5
) {
  return {
    again: calculateSM2('again', currentInterval, currentRepetition, currentEaseFactor).calculatedIntervalDays,
    hard: calculateSM2('hard', currentInterval, currentRepetition, currentEaseFactor).calculatedIntervalDays,
    good: calculateSM2('good', currentInterval, currentRepetition, currentEaseFactor).calculatedIntervalDays,
    easy: calculateSM2('easy', currentInterval, currentRepetition, currentEaseFactor).calculatedIntervalDays,
  }
}
