import toast from "react-hot-toast"

import { trpc } from "../../lib/trpc"

interface DebugTabProps {
  debugSymbol: string
  setDebugSymbol: (symbol: string) => void
  watchlistQuery: any
  formatDateTime: (timestamp: number) => string
  formatCurrency: (value: number) => string
  formatPercent: (value: number) => string
}

export default function DebugTab({
  debugSymbol,
  setDebugSymbol,
  watchlistQuery,
  formatDateTime,
  formatCurrency,
  formatPercent,
}: DebugTabProps) {
  // Debug queries
  const debugWatchlistQuery = trpc.options.debug.debugWatchlist.useQuery()
  const debugOptionsChainQuery = trpc.options.debug.rawOptionsChain.useQuery({
    symbol: debugSymbol,
  })
  const debugPutOpportunitiesQuery = trpc.options.debug.rawPutOpportunities.useQuery({
    symbol: debugSymbol,
    maxDaysToExpiration: 45,
  })
  const testYahooApiQuery = trpc.options.debug.testYahooApi.useQuery({
    symbol: debugSymbol,
  })

  const debugGreeksQuery = trpc.options.debug.debugGreeks.useQuery({
    symbol: debugSymbol,
  })

  return (
    <div className="space-y-6">
      {/* Symbol Selector */}
      <div className="bg-background border border-border rounded-lg p-6">
        <div className="flex items-center space-x-4 mb-4">
          <h2 className="text-xl font-semibold">🔍 Debug Data Explorer</h2>
          <select
            value={debugSymbol}
            onChange={(e) => setDebugSymbol(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            {watchlistQuery.data?.symbols?.map((symbol: string) => (
              <option key={symbol} value={symbol}>
                {symbol}
              </option>
            ))}
          </select>
          <span className="text-sm text-primary">Select a symbol to see raw API data</span>
        </div>
      </div>

      {/* Watchlist Debug */}
      <div className="bg-background border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">📊 Watchlist Debug Data</h3>
        {debugWatchlistQuery.isLoading ? (
          <div className="text-center py-4">Loading debug data...</div>
        ) : debugWatchlistQuery.error ? (
          <div className="text-destructive">Error: {debugWatchlistQuery.error.message}</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-blue-50 p-3 rounded">
                <div className="font-semibold">Total Symbols</div>
                <div className="text-xl">{debugWatchlistQuery.data?.metadata?.totalSymbols}</div>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <div className="font-semibold">Successful Fetches</div>
                <div className="text-xl">{debugWatchlistQuery.data?.metadata?.successfulFetches}</div>
              </div>
              <div className="bg-red-50 p-3 rounded">
                <div className="font-semibold">Failed Fetches</div>
                <div className="text-xl">{debugWatchlistQuery.data?.metadata?.failedFetches}</div>
              </div>
              <div className="bg-yellow-50 p-3 rounded">
                <div className="font-semibold">Missing Quotes</div>
                <div className="text-xl">{debugWatchlistQuery.data?.missingQuotes?.length || 0}</div>
              </div>
            </div>

            {debugWatchlistQuery.data?.missingQuotes && debugWatchlistQuery.data.missingQuotes.length > 0 && (
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-semibold text-destructive mb-2">Missing Quotes:</h4>
                <div className="text-destructive">{debugWatchlistQuery.data.missingQuotes.join(", ")}</div>
              </div>
            )}

            <details className="mt-4">
              <summary className="cursor-pointer font-semibold text-blue-600 hover:text-blue-800">
                View Raw Watchlist JSON Data
              </summary>
              <div className="mt-2 relative">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(debugWatchlistQuery.data, null, 2))
                    toast.success("Watchlist data copied to clipboard!")
                  }}
                  className="absolute top-2 right-2 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                >
                  Copy
                </button>
                <pre className="p-4 bg-foregroundx rounded-lg text-xs overflow-auto max-h-96 pr-16">
                  {JSON.stringify(debugWatchlistQuery.data, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        )}
      </div>

      {/* Options Chain Debug */}
      <div className="bg-background border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">⛓️ Options Chain Debug - {debugSymbol}</h3>
        {debugOptionsChainQuery.isLoading ? (
          <div className="text-center py-4">Loading options chain...</div>
        ) : debugOptionsChainQuery.error ? (
          <div className="text-destructive">Error: {debugOptionsChainQuery.error.message}</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-green-50 p-3 rounded">
                <div className="font-semibold">Total Calls</div>
                <div className="text-xl">{debugOptionsChainQuery.data?.metadata?.totalCalls}</div>
              </div>
              <div className="bg-red-50 p-3 rounded">
                <div className="font-semibold">Total Puts</div>
                <div className="text-xl">{debugOptionsChainQuery.data?.metadata?.totalPuts}</div>
              </div>
              <div className="bg-blue-50 p-3 rounded">
                <div className="font-semibold">Expirations</div>
                <div className="text-xl">{debugOptionsChainQuery.data?.metadata?.expirations}</div>
              </div>
              <div className="bg-purple-50 p-3 rounded">
                <div className="font-semibold">Last Updated</div>
                <div className="text-sm">
                  {debugOptionsChainQuery.data?.metadata?.lastUpdated
                    ? formatDateTime(debugOptionsChainQuery.data.metadata.lastUpdated)
                    : "N/A"}
                </div>
              </div>
            </div>

            <details className="mt-4">
              <summary className="cursor-pointer font-semibold text-blue-600 hover:text-blue-800">
                View Raw Options Chain JSON Data
              </summary>
              <div className="mt-2 relative">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(debugOptionsChainQuery.data, null, 2))
                    toast.success("Options chain data copied to clipboard!")
                  }}
                  className="absolute top-2 right-2 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                >
                  Copy
                </button>
                <pre className="p-4 bg-foregroundx rounded-lg text-xs overflow-auto max-h-96 pr-16">
                  {JSON.stringify(debugOptionsChainQuery.data, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        )}
      </div>

      {/* Put Opportunities Debug */}
      <div className="bg-background border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">📉 Put Opportunities Debug - {debugSymbol}</h3>
        {debugPutOpportunitiesQuery.isLoading ? (
          <div className="text-center py-4">Loading put opportunities debug...</div>
        ) : debugPutOpportunitiesQuery.error ? (
          <div className="text-destructive">Error: {debugPutOpportunitiesQuery.error.message}</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-blue-50 p-3 rounded">
                <div className="font-semibold">Stock Price</div>
                <div className="text-xl">
                  {debugPutOpportunitiesQuery.data?.debug?.stockPrice
                    ? formatCurrency(debugPutOpportunitiesQuery.data.debug.stockPrice)
                    : "N/A"}
                </div>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <div className="font-semibold">Total Puts</div>
                <div className="text-xl">{debugPutOpportunitiesQuery.data?.debug?.totalPuts || 0}</div>
              </div>
              <div className="bg-yellow-50 p-3 rounded">
                <div className="font-semibold">Puts with Volume</div>
                <div className="text-xl">{debugPutOpportunitiesQuery.data?.debug?.putsWithVolume || 0}</div>
              </div>
              <div className="bg-purple-50 p-3 rounded">
                <div className="font-semibold">Puts OTM</div>
                <div className="text-xl">{debugPutOpportunitiesQuery.data?.debug?.putsOTM || 0}</div>
              </div>
            </div>

            <div className="bg-foregroundx p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Filter Criteria Used:</h4>
              <ul className="text-sm space-y-1">
                <li>
                  • Max Days to Expiration:{" "}
                  {debugPutOpportunitiesQuery.data?.debug?.filterCriteria?.maxDaysToExpiration}
                </li>
                <li>• Min Volume: {debugPutOpportunitiesQuery.data?.debug?.filterCriteria?.minVolume}</li>
                <li>• Min Open Interest: {debugPutOpportunitiesQuery.data?.debug?.filterCriteria?.minOpenInterest}</li>
                <li>• Min Premium: ${debugPutOpportunitiesQuery.data?.debug?.filterCriteria?.minPremium}</li>
              </ul>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">
                Opportunities Found: {debugPutOpportunitiesQuery.data?.opportunities?.length || 0}
              </h4>
              {debugPutOpportunitiesQuery.data?.opportunities &&
              debugPutOpportunitiesQuery.data.opportunities.length > 0 ? (
                <div className="text-sm">
                  Best opportunity: ${debugPutOpportunitiesQuery.data.opportunities[0].strike} strike,
                  {formatPercent(debugPutOpportunitiesQuery.data.opportunities[0].annualizedReturn)} annual return
                </div>
              ) : (
                <div className="text-destructive text-sm">
                  <div className="font-semibold mb-1">No opportunities found with these criteria:</div>
                  <ul className="text-xs space-y-1 ml-4">
                    <li>
                      • Days to expiration: 7-
                      {debugPutOpportunitiesQuery.data?.debug?.filterCriteria?.maxDaysToExpiration || 45} days
                    </li>
                    <li>
                      • Strike must be below current stock price ($
                      {debugPutOpportunitiesQuery.data?.debug?.stockPrice?.toFixed(2) || "N/A"})
                    </li>
                    <li>
                      • Volume {">"} {debugPutOpportunitiesQuery.data?.debug?.filterCriteria?.minVolume || 10}
                    </li>
                    <li>
                      • Open Interest {">"}{" "}
                      {debugPutOpportunitiesQuery.data?.debug?.filterCriteria?.minOpenInterest || 50}
                    </li>
                    <li>
                      • Premium {">"} ${debugPutOpportunitiesQuery.data?.debug?.filterCriteria?.minPremium || 0.1}
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <details className="mt-4">
              <summary className="cursor-pointer font-semibold text-blue-600 hover:text-blue-800">
                View First 10 Raw Puts Data
              </summary>
              <div className="mt-2 relative">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      JSON.stringify(debugPutOpportunitiesQuery.data?.debug?.rawPutsData, null, 2),
                    )
                    toast.success("Raw puts data copied to clipboard!")
                  }}
                  className="absolute top-2 right-2 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                >
                  Copy
                </button>
                <pre className="p-4 bg-foregroundx rounded-lg text-xs overflow-auto max-h-96 pr-16">
                  {JSON.stringify(debugPutOpportunitiesQuery.data?.debug?.rawPutsData, null, 2)}
                </pre>
              </div>
            </details>

            <details className="mt-4">
              <summary className="cursor-pointer font-semibold text-blue-600 hover:text-blue-800">
                View Full Put Opportunities Debug JSON
              </summary>
              <div className="mt-2 relative">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(debugPutOpportunitiesQuery.data, null, 2))
                    toast.success("Put opportunities debug data copied to clipboard!")
                  }}
                  className="absolute top-2 right-2 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                >
                  Copy
                </button>
                <pre className="p-4 bg-foregroundx rounded-lg text-xs overflow-auto max-h-96 pr-16">
                  {JSON.stringify(debugPutOpportunitiesQuery.data, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        )}
      </div>

      {/* Greeks Calculation Debug */}
      <div className="bg-background border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">🔢 Greeks Calculation Debug - {debugSymbol}</h3>
        {debugGreeksQuery.isLoading ? (
          <div className="text-center py-4">Loading Greeks debug data...</div>
        ) : debugGreeksQuery.error ? (
          <div className="text-destructive">Error: {debugGreeksQuery.error.message}</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div className="bg-blue-50 p-3 rounded">
                <div className="font-semibold">Stock Price</div>
                <div className="text-xl">
                  {debugGreeksQuery.data?.stockPrice ? formatCurrency(debugGreeksQuery.data.stockPrice) : "N/A"}
                </div>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <div className="font-semibold">Total Puts</div>
                <div className="text-xl">{debugGreeksQuery.data?.totalPuts || 0}</div>
              </div>
              <div className="bg-yellow-50 p-3 rounded">
                <div className="font-semibold">Puts with Δ</div>
                <div className="text-xl">{debugGreeksQuery.data?.greeksStats?.putsWithDelta || 0}</div>
              </div>
              <div className="bg-purple-50 p-3 rounded">
                <div className="font-semibold">Puts with Γ</div>
                <div className="text-xl">{debugGreeksQuery.data?.greeksStats?.putsWithGamma || 0}</div>
              </div>
              <div className="bg-red-50 p-3 rounded">
                <div className="font-semibold">Puts with Θ</div>
                <div className="text-xl">{debugGreeksQuery.data?.greeksStats?.putsWithTheta || 0}</div>
              </div>
            </div>

            {/* Sample Puts with Greeks */}
            {debugGreeksQuery.data?.samplePutsWithGreeks && debugGreeksQuery.data.samplePutsWithGreeks.length > 0 && (
              <div className="bg-foregroundx p-4 rounded-lg">
                <h4 className="font-semibold mb-3">📊 Sample Puts with Greeks (First 5):</h4>
                <div className="space-y-2">
                  {debugGreeksQuery.data.samplePutsWithGreeks.map((put: any, index: number) => (
                    <div key={index} className="bg-background p-3 rounded border text-sm">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div>
                          <span className="font-semibold">Strike:</span> {formatCurrency(put.strike)}
                        </div>
                        <div>
                          <span className="font-semibold">Bid/Ask:</span> {formatCurrency(put.bid)}/
                          {formatCurrency(put.ask)}
                        </div>
                        <div>
                          <span className="font-semibold">IV:</span> {formatPercent(put.impliedVolatility * 100)}
                        </div>
                        <div>
                          <span className="font-semibold">Days:</span> {put.daysToExpiration || "N/A"}
                        </div>
                      </div>
                      <div className="mt-2 grid grid-cols-2 md:grid-cols-5 gap-2 font-mono text-xs">
                        <div className={put.delta ? "text-green-700" : "text-destructive"}>
                          <span className="font-semibold">Δ:</span> {put.delta?.toFixed(4) || "N/A"}
                        </div>
                        <div className={put.gamma ? "text-green-700" : "text-destructive"}>
                          <span className="font-semibold">Γ:</span> {put.gamma?.toFixed(4) || "N/A"}
                        </div>
                        <div className={put.theta ? "text-green-700" : "text-destructive"}>
                          <span className="font-semibold">Θ:</span> {put.theta?.toFixed(4) || "N/A"}
                        </div>
                        <div className={put.vega ? "text-green-700" : "text-destructive"}>
                          <span className="font-semibold">ν:</span> {put.vega?.toFixed(4) || "N/A"}
                        </div>
                        <div className={put.hasGreeks ? "text-green-700 font-semibold" : "text-destructive"}>
                          {put.hasGreeks ? "✅ Has Greeks" : "❌ No Greeks"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <details className="mt-4">
              <summary className="cursor-pointer font-semibold text-blue-600 hover:text-blue-800">
                View Full Greeks Debug JSON Data
              </summary>
              <div className="mt-2 relative">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(debugGreeksQuery.data, null, 2))
                    toast.success("Greeks debug data copied to clipboard!")
                  }}
                  className="absolute top-2 right-2 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                >
                  Copy
                </button>
                <pre className="p-4 bg-foregroundx rounded-lg text-xs overflow-auto max-h-96 pr-16">
                  {JSON.stringify(debugGreeksQuery.data, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        )}
      </div>

      {/* Yahoo Finance API Test */}
      <div className="bg-background border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">🧪 Yahoo Finance API Test - {debugSymbol}</h3>
        {testYahooApiQuery.isLoading ? (
          <div className="text-center py-4">Testing Yahoo Finance API...</div>
        ) : testYahooApiQuery.error ? (
          <div className="text-destructive">Error: {testYahooApiQuery.error.message}</div>
        ) : testYahooApiQuery.data?.success ? (
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">✅ API Test Successful!</h4>
              <div className="text-sm space-y-2">
                <div>
                  <strong>Test 1 (No params):</strong> {testYahooApiQuery.data.test1Result.optionsLength} options chains
                </div>
                <div>
                  <strong>Test 2 (Empty object):</strong> {testYahooApiQuery.data.test2Result.optionsLength} options
                  chains
                </div>
              </div>
            </div>

            {testYahooApiQuery.data.test1Result.optionsLength > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">📊 Test 1 Results Structure:</h4>
                <div className="text-sm space-y-1">
                  <div>• Top level keys: {testYahooApiQuery.data.test1Result.topLevelKeys.join(", ")}</div>
                  <div>• Has options array: {testYahooApiQuery.data.test1Result.hasOptions ? "Yes" : "No"}</div>
                  <div>• Options count: {testYahooApiQuery.data.test1Result.optionsLength}</div>
                  <div>
                    • Has expiration dates: {testYahooApiQuery.data.test1Result.hasExpirationDates ? "Yes" : "No"}
                  </div>
                  <div>• Expiration dates count: {testYahooApiQuery.data.test1Result.expirationDatesLength}</div>
                </div>
              </div>
            )}

            <details className="mt-4">
              <summary className="cursor-pointer font-semibold text-blue-600 hover:text-blue-800">
                View Raw Yahoo Finance API Response (Test 1)
              </summary>
              <div className="mt-2 relative">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      JSON.stringify(testYahooApiQuery.data?.test1Result.fullResponse, null, 2),
                    )
                    toast.success("Yahoo Finance API Test 1 data copied to clipboard!")
                  }}
                  className="absolute top-2 right-2 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                >
                  Copy
                </button>
                <pre className="p-4 bg-foregroundx rounded-lg text-xs overflow-auto max-h-96 pr-16">
                  {JSON.stringify(testYahooApiQuery.data.test1Result.fullResponse, null, 2)}
                </pre>
              </div>
            </details>

            <details className="mt-4">
              <summary className="cursor-pointer font-semibold text-blue-600 hover:text-blue-800">
                View Raw Yahoo Finance API Response (Test 2)
              </summary>
              <div className="mt-2 relative">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      JSON.stringify(testYahooApiQuery.data?.test2Result.fullResponse, null, 2),
                    )
                    toast.success("Yahoo Finance API Test 2 data copied to clipboard!")
                  }}
                  className="absolute top-2 right-2 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                >
                  Copy
                </button>
                <pre className="p-4 bg-foregroundx rounded-lg text-xs overflow-auto max-h-96 pr-16">
                  {JSON.stringify(testYahooApiQuery.data.test2Result.fullResponse, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        ) : (
          <div className="bg-red-50 p-4 rounded-lg">
            <h4 className="font-semibold text-destructive mb-2">❌ API Test Failed</h4>
            <div className="text-destructive text-sm">Error: {testYahooApiQuery.data?.error || "Unknown error"}</div>
          </div>
        )}
      </div>
    </div>
  )
}
