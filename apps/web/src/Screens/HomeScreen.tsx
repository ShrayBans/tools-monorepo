import { useEffect, useState } from "react"

import { trpc } from "../lib/trpc"

/**
 * HomeScreen - Home Screen
 *
 * Demonstrates basic tRPC functionality:
 * - Query with parameters (info)
 * - Query without parameters (health)
 * - Mutation (echo)
 */
function HomeScreen() {
  const [name, setName] = useState("World")
  const [echoMessage, setEchoMessage] = useState("")
  const [lastRefreshed, setLastRefreshed] = useState(new Date().toLocaleTimeString())

  // tRPC Queries for health checks
  const health = trpc.info.health.useQuery()
  const dbHealth = trpc.info.dbHealth.useQuery()
  const redisHealth = trpc.info.redisHealth.useQuery()
  const systemHealth = trpc.info.healthCheck.useQuery()

  // Update timestamp when any health check completes
  useEffect(() => {
    if (!health.isLoading || !dbHealth.isLoading || !redisHealth.isLoading || !systemHealth.isLoading) {
      setLastRefreshed(new Date().toLocaleTimeString())
    }
  }, [health.isLoading, dbHealth.isLoading, redisHealth.isLoading, systemHealth.isLoading])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-4xl font-bold  mb-2">🏠 Home - Sway Internal</h1>
      </header>

      {/* System Health Overview */}
      <section className="mb-8 p-6 border border-border rounded-lg bg-foregroundx">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-semibold  mb-2">🏥 System Health</h2>
            <p className="">Overall system status and health checks</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Last refreshed</p>
            <p className="text-sm font-medium text-primary" data-testid="health-timestamp">
              {lastRefreshed}
            </p>
          </div>
        </div>

        {systemHealth.isLoading && <p className=" font-medium">Loading system health...</p>}

        {systemHealth.error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <p className="text-destructive">Error: {systemHealth.error.message}</p>
          </div>
        )}

        {systemHealth.data && (
          <div className="space-y-4">
            {/* Overall Status */}
            <div
              className={`border rounded-md p-4 ${
                systemHealth.data.overall === "ok"
                  ? "bg-primary border-border"
                  : systemHealth.data.overall === "degraded"
                    ? "bg-yellow-50 border-yellow-200"
                    : "bg-red-50 border-red-200"
              }`}
            >
              <h3
                className={`text-lg font-semibold mb-2 ${
                  systemHealth.data.overall === "ok"
                    ? "text-secondary"
                    : systemHealth.data.overall === "degraded"
                      ? "text-yellow-800"
                      : "text-destructive"
                }`}
              >
                Overall Status: {systemHealth.data.overall.toUpperCase()}
              </h3>
              <p className="text-sm ">Total Response Time: {systemHealth.data.totalResponseTime}</p>
            </div>

            {/* Individual Services */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* API Status */}
              <div
                className={`border rounded p-3 ${
                  systemHealth.data.services.api.status === "ok"
                    ? "bg-primary border-border"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <h4 className="font-semibold text-sm mb-1">🚀 API</h4>
                <p
                  className={`text-xs ${
                    systemHealth.data.services.api.status === "ok" ? "text-green-700" : "text-destructive"
                  }`}
                >
                  {systemHealth.data.services.api.status.toUpperCase()}
                </p>
                <p className="text-xs ">{systemHealth.data.services.api.responseTime}</p>
              </div>

              {/* Database Status */}
              <div
                className={`border rounded p-3 ${
                  systemHealth.data.services.database.status === "ok"
                    ? "bg-primary border-border"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <h4 className="font-semibold text-sm mb-1">🗄️ Database</h4>
                <p
                  className={`text-xs ${
                    systemHealth.data.services.database.status === "ok" ? "text-green-700" : "text-destructive"
                  }`}
                >
                  {systemHealth.data.services.database.status.toUpperCase()}
                </p>
                <p className="text-xs ">{systemHealth.data.services.database.responseTime}</p>
              </div>

              {/* Redis Status */}
              <div
                className={`border rounded p-3 ${
                  systemHealth.data.services.redis.status === "ok"
                    ? "bg-primary border-border"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <h4 className="font-semibold text-sm mb-1">⚡ Redis</h4>
                <p
                  className={`text-xs ${
                    systemHealth.data.services.redis.status === "ok" ? "text-green-700" : "text-destructive"
                  }`}
                >
                  {systemHealth.data.services.redis.status.toUpperCase()}
                </p>
                <p className="text-xs ">{systemHealth.data.services.redis.responseTime}</p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => {
            setLastRefreshed(new Date().toLocaleTimeString())
            systemHealth.refetch()
            health.refetch()
            dbHealth.refetch()
            redisHealth.refetch()
          }}
          className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium
                   rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500
                   focus:ring-offset-2 transition-colors duration-200"
          data-testid="refresh-health"
        >
          🔄 Refresh All Health Checks
        </button>
      </section>

      {/* Detailed Health Checks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Server Health */}
        <section className="p-6 border border-border rounded-lg bg-background">
          <h3 className="text-lg font-semibold  mb-2">⏰ Server Info</h3>
          <p className=" mb-4 text-sm">Basic server information</p>

          {health.isLoading && <p className=" text-sm">Loading...</p>}
          {health.error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p className="text-destructive text-sm">Error: {health.error.message}</p>
            </div>
          )}
          {health.data && (
            <div className="bg-foregroundx border rounded p-3">
              <pre className="text-xs text-gray-800 overflow-x-auto font-mono">
                {JSON.stringify(health.data, null, 2)}
              </pre>
            </div>
          )}
        </section>

        {/* Database Health */}
        <section className="p-6 border border-border rounded-lg bg-background">
          <h3 className="text-lg font-semibold  mb-2">🗄️ Database</h3>
          <p className=" mb-4 text-sm">PostgreSQL connection status</p>

          {dbHealth.isLoading && <p className=" text-sm">Loading...</p>}
          {dbHealth.error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p className="text-destructive text-sm">Error: {dbHealth.error.message}</p>
            </div>
          )}
          {dbHealth.data && (
            <div
              className={`border rounded p-3 ${
                dbHealth.data.status === "ok" ? "bg-primary border-border" : "bg-red-50 border-red-200"
              }`}
            >
              <div className="space-y-2">
                <p
                  className={`text-sm font-medium ${dbHealth.data.status === "ok" ? "text-secondary" : "text-destructive"}`}
                >
                  Status: {dbHealth.data.status.toUpperCase()}
                </p>
                <p className="text-sm ">Response: {dbHealth.data.responseTime}</p>
                <p className="text-sm ">Connected: {dbHealth.data.connected ? "✅" : "❌"}</p>
                {dbHealth.data.error && <p className="text-sm text-destructive">Error: {dbHealth.data.error}</p>}
              </div>
            </div>
          )}
        </section>

        {/* Redis Health */}
        <section className="p-6 border border-border rounded-lg bg-background">
          <h3 className="text-lg font-semibold  mb-2">⚡ Redis</h3>
          <p className=" mb-4 text-sm">Redis cache connection status</p>

          {redisHealth.isLoading && <p className=" text-sm">Loading...</p>}
          {redisHealth.error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p className="text-destructive text-sm">Error: {redisHealth.error.message}</p>
            </div>
          )}
          {redisHealth.data && (
            <div
              className={`border rounded p-3 ${
                redisHealth.data.status === "ok" ? "bg-primary border-border" : "bg-red-50 border-red-200"
              }`}
            >
              <div className="space-y-2">
                <p
                  className={`text-sm font-medium ${
                    redisHealth.data.status === "ok" ? "text-secondary" : "text-destructive"
                  }`}
                >
                  Status: {redisHealth.data.status.toUpperCase()}
                </p>
                <p className="text-sm ">Response: {redisHealth.data.responseTime}</p>
                <p className="text-sm ">Connected: {redisHealth.data.connected ? "✅" : "❌"}</p>
                {redisHealth.data.testPassed !== undefined && (
                  <p className="text-sm ">Test Passed: {redisHealth.data.testPassed ? "✅" : "❌"}</p>
                )}
                {redisHealth.data.error && <p className="text-sm text-destructive">Error: {redisHealth.data.error}</p>}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default HomeScreen
