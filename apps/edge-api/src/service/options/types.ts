export interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  lastUpdated: number; // timestamp
}

export interface OptionData {
  strike: number;
  lastPrice: number;
  bid: number;
  ask: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  inTheMoney: boolean;
  expirationDate: number; // timestamp
  
  // Greek values (option sensitivities) - now calculated
  delta: number; // Price sensitivity to underlying asset
  gamma: number; // Delta sensitivity to underlying price
  theta: number; // Time decay (per day)
  vega: number; // Volatility sensitivity
  rho: number; // Interest rate sensitivity
  
  // Additional calculated fields
  daysToExpiration: number;
  timeToExpiration: number; // In years
  
  // Additional pricing data
  intrinsicValue?: number; // ITM amount
  timeValue?: number; // Extrinsic value
  percentChange?: number; // Daily percentage change
  change?: number; // Daily dollar change
  
  // Contract details
  contractSymbol?: string; // Full option contract symbol
  contractSize?: number; // Usually 100 shares
  currency?: string; // USD, etc.
  lastTradeDate?: number; // When last traded
}

export interface OptionsChainData {
  symbol: string;
  calls: OptionData[];
  puts: OptionData[];
  expirations: number[];
  lastUpdated: number; // timestamp
}

export interface UnusualActivity {
  symbol: string;
  optionType: 'call' | 'put';
  strike: number;
  expirationDate: number;
  volume: number;
  openInterest: number;
  volumeOIRatio: number;
  lastPrice: number;
  impliedVolatility: number;
}

export interface PutSellingOpportunity {
  symbol: string;
  strike: number;
  expirationDate: number;
  premium: number;
  impliedVolatility: number;
  distanceFromStrike: number; // percentage
  annualizedReturn: number; // percentage
  probabilityOTM: number; // rough estimate
  delta: number; // Option delta
  daysToExpiration: number;
  volume: number;
  openInterest: number;
  bid: number;
  ask: number;
}

export interface MarginSecuredPut {
  symbol: string;
  currentPrice: number;
  strike: number;
  premium: number;
  delta: number;
  daysToExpiration: number;
  impliedVolatility: number;
  marginRequired: number;
  returnOnMargin: number;
  premiumYield: number;
  annualizedReturn: number;
  volume: number;
  openInterest: number;
  bid: number;
  ask: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}