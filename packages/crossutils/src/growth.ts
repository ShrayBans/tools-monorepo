export function sinusoidalGrowth(base: number, growthRate: number): number {
  const now = new Date()
  const hour = now.getHours()
  const day = now.getDate()
  const month = now.getMonth()
  const year = now.getFullYear()

  // Create deterministic seeds based on the current hour and day
  const hourlySeed = hour + day * 24 + month * 24 * 31 + year * 24 * 31 * 12
  const dailySeed = day + month * 31 + year * 31 * 12

  const hourlyRandom = Math.sin(hourlySeed) * 10000
  const dailyRandom = Math.sin(dailySeed) * 10000

  const hourlyFactor = (hourlyRandom - Math.floor(hourlyRandom)) * 2 - 1 // Range: -1 to 1
  const dailyFactor = (dailyRandom - Math.floor(dailyRandom)) * 2 - 1 // Range: -1 to 1

  const hoursSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60))
  const daysSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24))

  const sineWave = Math.sin(daysSinceEpoch / 7) * 0.5 + 0.5 // Range: 0 to 1, full cycle every week
  return (
    base *
    (1 + growthRate * hoursSinceEpoch) *
    (1 + sineWave * 0.2) *
    (1 + hourlyFactor * 0.05) *
    (1 + dailyFactor * 0.1)
  )
}
