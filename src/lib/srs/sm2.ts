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

  switch (grade) {
    case 'again':
      interval = 1
      repetition = 0
      easeFactor = Math.max(1.3, currentEaseFactor - 0.2)
      break
    case 'hard':
      if (currentRepetition === 0) {
        interval = 2
      } else {
        interval = Math.max(currentInterval + 1, Math.round(currentInterval * 1.2))
      }
      repetition = currentRepetition + 1
      easeFactor = Math.max(1.3, currentEaseFactor - 0.15)
      break
    case 'good':
      if (currentRepetition === 0) {
        interval = 4
      } else {
        interval = Math.max(currentInterval + 2, Math.round(currentInterval * currentEaseFactor))
      }
      repetition = currentRepetition + 1
      easeFactor = currentEaseFactor
      break
    case 'easy':
      if (currentRepetition === 0) {
        interval = 7
      } else {
        interval = Math.max(currentInterval + 4, Math.round(currentInterval * currentEaseFactor * 1.3))
      }
      repetition = currentRepetition + 1
      easeFactor = currentEaseFactor + 0.15
      break
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

export function formatInterval(days: number): string {
  if (days === 1) return '1 ngày'
  if (days < 30) return `${days} ngày`
  const months = Math.round(days / 30)
  return `${months} tháng`
}
