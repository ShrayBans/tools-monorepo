interface StockData {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap?: number
  lastUpdated: number
}

interface WatchlistTabProps {
  watchlistQuery: any
  formatCurrency: (value: number) => string
  formatPercent: (value: number) => string
  setSelectedSymbol: (symbol: string) => void
}

export default function WatchlistTab({
  watchlistQuery,
  formatCurrency,
  formatPercent,
  setSelectedSymbol,
}: WatchlistTabProps) {
  return (
    <div className="grid gap-6">
      <div className="bg-background border border-border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Watchlist Overview</h2>
        {watchlistQuery.isLoading ? (
          <div className="text-center py-8">Loading watchlist...</div>
        ) : watchlistQuery.error ? (
          <div className="text-destructive text-center py-8">Error loading watchlist</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {watchlistQuery.data?.data?.map((stock: StockData) => (
              <div
                key={stock.symbol}
                className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedSymbol(stock.symbol)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{stock.symbol}</h3>
                  <span
                    className={`text-sm px-2 py-1 rounded ${
                      stock.change >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-destructive"
                    }`}
                  >
                    {stock.change >= 0 ? "+" : ""}
                    {formatPercent(stock.changePercent)}
                  </span>
                </div>
                <div className="text-2xl font-bold mb-1">{formatCurrency(stock.price)}</div>
                <div className={`text-sm ${stock.change >= 0 ? "text-green-600" : "text-destructive"}`}>
                  {stock.change >= 0 ? "+" : ""}
                  {formatCurrency(stock.change)}
                </div>
                <div className="text-xs text-gray-500 mt-2">Vol: {stock.volume.toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
