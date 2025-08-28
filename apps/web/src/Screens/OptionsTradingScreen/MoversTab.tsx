import { trpc } from "../../lib/trpc"

interface StockData {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap?: number
  lastUpdated: number
}

interface MoversTabProps {
  formatCurrency: (value: number) => string
  formatPercent: (value: number) => string
}

export default function MoversTab({ formatCurrency, formatPercent }: MoversTabProps) {
  const topMoversQuery = trpc.options.analysis.topMovers.useQuery({ limit: 10 })

  return (
    <div className="bg-background border border-border rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">🎯 Top Movers</h2>
      {topMoversQuery.isLoading ? (
        <div className="text-center py-8">Loading top movers...</div>
      ) : topMoversQuery.error ? (
        <div className="text-destructive text-center py-8">Error loading top movers</div>
      ) : (
        <div className="grid gap-4">
          {topMoversQuery.data?.data?.map((stock: StockData) => (
            <div key={stock.symbol} className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="font-semibold text-lg">{stock.symbol}</div>
                <div className="text-2xl font-bold">{formatCurrency(stock.price)}</div>
              </div>
              <div className="text-right">
                <div className={`text-lg font-semibold ${stock.change >= 0 ? "text-green-600" : "text-destructive"}`}>
                  {stock.change >= 0 ? "+" : ""}
                  {formatCurrency(stock.change)}
                </div>
                <div className={`text-sm ${stock.change >= 0 ? "text-green-600" : "text-destructive"}`}>
                  {stock.change >= 0 ? "+" : ""}
                  {formatPercent(stock.changePercent)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
