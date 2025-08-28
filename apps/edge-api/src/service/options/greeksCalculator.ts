/**
 * Black-Scholes Options Greeks Calculator
 * Calculates delta, gamma, theta, vega, and rho for options
 */

export interface GreeksCalculator {
  delta: number
  gamma: number
  theta: number
  vega: number
  rho: number
}

export interface MarginSecuredPut {
  symbol: string
  currentPrice: number
  strike: number
  premium: number
  delta: number
  daysToExpiration: number
  impliedVolatility: number
  marginRequired: number
  returnOnMargin: number
  premiumYield: number
  annualizedReturn: number
  volume: number
  openInterest: number
  bid: number
  ask: number
}

export class BlackScholes {
  /**
   * Calculate cumulative normal distribution
   */
  private static normalCDF(x: number): number {
    const a1 = 0.254829592
    const a2 = -0.284496736
    const a3 = 1.421413741
    const a4 = -1.453152027
    const a5 = 1.061405429
    const p = 0.3275911

    const sign = x < 0 ? -1 : 1
    x = Math.abs(x) / Math.sqrt(2.0)

    const t = 1.0 / (1.0 + p * x)
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)

    return 0.5 * (1.0 + sign * y)
  }

  /**
   * Calculate d1 for Black-Scholes
   */
  private static d1(S: number, K: number, r: number, sigma: number, t: number): number {
    return (Math.log(S / K) + (r + 0.5 * sigma * sigma) * t) / (sigma * Math.sqrt(t))
  }

  /**
   * Calculate d2 for Black-Scholes
   */
  private static d2(S: number, K: number, r: number, sigma: number, t: number): number {
    return this.d1(S, K, r, sigma, t) - sigma * Math.sqrt(t)
  }

  /**
   * Calculate Put Delta
   * @param S Current stock price
   * @param K Strike price
   * @param r Risk-free rate (annual)
   * @param sigma Implied volatility (annual)
   * @param t Time to expiration (in years)
   * @returns Delta for put option (negative value)
   */
  static putDelta(S: number, K: number, r: number, sigma: number, t: number): number {
    if (t <= 0) return K > S ? -1 : 0
    const d1Val = this.d1(S, K, r, sigma, t)
    return this.normalCDF(d1Val) - 1
  }

  /**
   * Calculate Call Delta
   */
  static callDelta(S: number, K: number, r: number, sigma: number, t: number): number {
    if (t <= 0) return S > K ? 1 : 0
    const d1Val = this.d1(S, K, r, sigma, t)
    return this.normalCDF(d1Val)
  }

  /**
   * Calculate all Greeks
   */
  static calculateGreeks(
    S: number, // Current stock price
    K: number, // Strike price
    r: number, // Risk-free rate
    sigma: number, // Implied volatility
    t: number, // Time to expiration (years)
    optionType: "call" | "put" = "put",
  ): GreeksCalculator {
    if (t <= 0) {
      return {
        delta: optionType === "put" ? (K > S ? -1 : 0) : S > K ? 1 : 0,
        gamma: 0,
        theta: 0,
        vega: 0,
        rho: 0,
      }
    }

    const sqrtT = Math.sqrt(t)
    const d1Val = this.d1(S, K, r, sigma, t)
    const d2Val = this.d2(S, K, r, sigma, t)

    // Probability density function
    const pdf = (x: number) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI)

    // Delta
    const delta = optionType === "put" ? this.normalCDF(d1Val) - 1 : this.normalCDF(d1Val)

    // Gamma (same for calls and puts)
    const gamma = pdf(d1Val) / (S * sigma * sqrtT)

    // Theta
    const theta =
      optionType === "put"
        ? (-S * pdf(d1Val) * sigma) / (2 * sqrtT) + r * K * Math.exp(-r * t) * this.normalCDF(-d2Val)
        : (-S * pdf(d1Val) * sigma) / (2 * sqrtT) - r * K * Math.exp(-r * t) * this.normalCDF(d2Val)

    // Convert theta to per-day
    const thetaPerDay = theta / 365

    // Vega (same for calls and puts)
    const vega = (S * pdf(d1Val) * sqrtT) / 100

    // Rho
    const rho =
      optionType === "put"
        ? (-K * t * Math.exp(-r * t) * this.normalCDF(-d2Val)) / 100
        : (K * t * Math.exp(-r * t) * this.normalCDF(d2Val)) / 100

    return { delta, gamma, theta: thetaPerDay, vega, rho }
  }
}

/**
 * Margin requirements calculator for margin-secured puts
 */
export class MarginCalculator {
  /**
   * Calculate margin requirement for a short put
   * Based on typical broker requirements (may vary)
   */
  static calculatePutMargin(
    currentPrice: number,
    strikePrice: number,
    premium: number,
    multiplier: number = 100,
  ): {
    initialMargin: number
    maintenanceMargin: number
    cashRequired: number
    returnOnMargin: number
  } {
    // Typical margin formula: 20% of underlying - OTM amount + premium
    // But not less than 10% of strike price
    const otmAmount = Math.max(0, currentPrice - strikePrice)
    const margin1 = (0.2 * currentPrice - otmAmount + premium) * multiplier
    const margin2 = 0.1 * strikePrice * multiplier

    const initialMargin = Math.max(margin1, margin2)
    const maintenanceMargin = initialMargin * 0.75 // Typically 75% of initial

    const premiumReceived = premium * multiplier
    const cashRequired = initialMargin - premiumReceived
    const returnOnMargin = cashRequired > 0 ? (premiumReceived / cashRequired) * 100 : 0

    return {
      initialMargin,
      maintenanceMargin,
      cashRequired,
      returnOnMargin,
    }
  }
}

/**
 * Options enhancer to add Greeks to Yahoo Finance data
 */
export class OptionsEnhancer {
  private riskFreeRate: number

  constructor(riskFreeRate: number = 0.05) {
    this.riskFreeRate = riskFreeRate
  }

  /**
   * Add Greeks to a single option
   */
  enhanceOption(
    option: any,
    currentPrice: number,
    optionType: "call" | "put" = "put",
  ): any {
    // Calculate time to expiration in years (using trading days)
    const now = new Date()
    const expiration = new Date(option.expirationDate || option.expiration)
    const daysToExpiration = Math.max(1, (expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const timeToExpiration = daysToExpiration / 252 // Use trading days instead of calendar days

    // Use default IV if missing or invalid
    let impliedVolatility = option.impliedVolatility || 0.3
    let usingDefaultIV = false
    
    if (impliedVolatility <= 0 || impliedVolatility > 5) {
      impliedVolatility = 0.3 // Default 30% IV
      usingDefaultIV = true
      console.log(`⚠️ Using default IV (30%) for ${optionType} strike ${option.strike}, original IV: ${option.impliedVolatility}`)
    } else if (!option.impliedVolatility) {
      usingDefaultIV = true
      console.log(`⚠️ Using default IV (30%) for ${optionType} strike ${option.strike}, no IV provided`)
    }

    // Calculate Greeks
    const greeks = BlackScholes.calculateGreeks(
      currentPrice,
      option.strike,
      this.riskFreeRate,
      impliedVolatility,
      timeToExpiration,
      optionType,
    )

    return {
      ...option,
      ...greeks,
      daysToExpiration: Math.ceil(daysToExpiration),
      timeToExpiration,
    }
  }

  /**
   * Find options near target delta
   */
  findTargetDeltaOptions(enhancedOptions: any[], targetDelta: number, tolerance: number = 0.05): any[] {
    return enhancedOptions
      .filter((opt) => Math.abs(Math.abs(opt.delta) - targetDelta) <= tolerance)
      .sort(
        (a, b) => Math.abs(Math.abs(a.delta) - targetDelta) - Math.abs(Math.abs(b.delta) - targetDelta),
      )
  }
}