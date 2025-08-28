/**
 * Meta Ads Service
 * Handles campaign, ad set, and ad operations for Meta Ads API
 */

import { axiosGet } from "../axios"
import { blg } from "../logging"

// Meta API configuration
const META_BASE_URL = "https://graph.facebook.com"
const META_API_VERSION = "v19.0"

export interface MetaCampaign {
  id: string
  name: string
  objective: string
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED'
  effective_status: string
  configured_status: string
  created_time: string
  updated_time: string
  start_time?: string
  stop_time?: string
  budget_rebalance_flag?: boolean
  buying_type?: string
  can_create_brand_lift_study?: boolean
  daily_budget?: string
  lifetime_budget?: string
  bid_strategy?: string
  promoted_object?: {
    page_id?: string
    instagram_actor_id?: string
    pixel_id?: string
    custom_event_type?: string
  }
}

export interface MetaAdSet {
  id: string
  name: string
  campaign_id: string
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED'
  effective_status: string
  configured_status: string
  created_time: string
  updated_time: string
  start_time?: string
  end_time?: string
  daily_budget?: string
  lifetime_budget?: string
  budget_remaining?: string
  billing_event: string
  bid_amount?: number
  bid_strategy?: string
  optimization_goal: string
  targeting?: Record<string, any>
  promoted_object?: Record<string, any>
}

export interface MetaAd {
  id: string
  name: string
  adset_id: string
  campaign_id: string
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED'
  effective_status: string
  configured_status: string
  created_time: string
  updated_time: string
  creative?: {
    id: string
    name: string
    title?: string
    body?: string
    image_hash?: string
    video_id?: string
    thumbnail_url?: string
    object_story_spec?: Record<string, any>
  }
  tracking_specs?: Record<string, any>[]
}

export interface MetaInsights {
  date_start: string
  date_stop: string
  impressions?: string
  clicks?: string
  spend?: string
  reach?: string
  frequency?: string
  ctr?: string
  cpc?: string
  cpm?: string
  cpp?: string
  conversions?: string
  conversion_rate_ranking?: string
  quality_ranking?: string
  engagement_rate_ranking?: string
  video_play_actions?: string
  video_view_content_time?: string
  actions?: Array<{
    action_type: string
    value: string
  }>
  cost_per_action_type?: Array<{
    action_type: string
    value: string
  }>
  // Add more insight fields as needed
  [key: string]: any
}

export interface InsightsParams {
  level: 'account' | 'campaign' | 'adset' | 'ad'
  fields: string[]
  time_range: {
    since: string // YYYY-MM-DD
    until: string // YYYY-MM-DD
  }
  breakdowns?: string[]
  limit?: number
  filtering?: Array<{
    field: string
    operator: string
    value: any
  }>
}

/**
 * Get campaigns for an ad account
 */
export async function getCampaigns(
  accessToken: string,
  accountId: string,
  params?: {
    fields?: string[]
    effective_status?: string[]
    limit?: number
  }
): Promise<MetaCampaign[]> {
  try {
    blg.info("Fetching campaigns", { accountId, params })

    const fields = params?.fields || [
      'id', 'name', 'objective', 'status', 'effective_status', 'configured_status',
      'created_time', 'updated_time', 'start_time', 'stop_time',
      'daily_budget', 'lifetime_budget', 'bid_strategy', 'buying_type'
    ]

    const queryParams: Record<string, any> = {
      fields: fields.join(','),
      limit: params?.limit || 25
    }

    if (params?.effective_status?.length) {
      queryParams.filtering = JSON.stringify([{
        field: 'effective_status',
        operator: 'IN',
        value: params.effective_status
      }])
    }

    const response = await axiosGet<{data: MetaCampaign[]}>(
      `${META_BASE_URL}/${META_API_VERSION}/act_${accountId}/campaigns`,
      {
        Authorization: `Bearer ${accessToken}`,
      },
      "meta-campaigns",
      {
        params: queryParams,
        timeout: 30000
      }
    )

    blg.info("Successfully fetched campaigns", { 
      accountId,
      campaignCount: response.data.length 
    })

    return response.data
  } catch (error: any) {
    blg.error("Error fetching campaigns", { accountId, error: error.message })
    throw new Error(`Failed to fetch campaigns: ${error.message}`)
  }
}

/**
 * Get ad sets for a campaign
 */
export async function getAdSets(
  accessToken: string,
  campaignId: string,
  params?: {
    fields?: string[]
    effective_status?: string[]
    limit?: number
  }
): Promise<MetaAdSet[]> {
  try {
    blg.info("Fetching ad sets", { campaignId, params })

    const fields = params?.fields || [
      'id', 'name', 'campaign_id', 'status', 'effective_status', 'configured_status',
      'created_time', 'updated_time', 'start_time', 'end_time',
      'daily_budget', 'lifetime_budget', 'budget_remaining',
      'billing_event', 'bid_amount', 'bid_strategy', 'optimization_goal'
    ]

    const queryParams: Record<string, any> = {
      fields: fields.join(','),
      limit: params?.limit || 25
    }

    if (params?.effective_status?.length) {
      queryParams.filtering = JSON.stringify([{
        field: 'effective_status',
        operator: 'IN',
        value: params.effective_status
      }])
    }

    const response = await axiosGet<{data: MetaAdSet[]}>(
      `${META_BASE_URL}/${META_API_VERSION}/${campaignId}/adsets`,
      {
        Authorization: `Bearer ${accessToken}`,
      },
      "meta-adsets",
      {
        params: queryParams,
        timeout: 30000
      }
    )

    blg.info("Successfully fetched ad sets", { 
      campaignId,
      adSetCount: response.data.length 
    })

    return response.data
  } catch (error: any) {
    blg.error("Error fetching ad sets", { campaignId, error: error.message })
    throw new Error(`Failed to fetch ad sets: ${error.message}`)
  }
}

/**
 * Get ads for an ad set
 */
export async function getAds(
  accessToken: string,
  adSetId: string,
  params?: {
    fields?: string[]
    effective_status?: string[]
    limit?: number
  }
): Promise<MetaAd[]> {
  try {
    blg.info("Fetching ads", { adSetId, params })

    const fields = params?.fields || [
      'id', 'name', 'adset_id', 'campaign_id', 'status', 'effective_status', 'configured_status',
      'created_time', 'updated_time', 'creative'
    ]

    const queryParams: Record<string, any> = {
      fields: fields.join(','),
      limit: params?.limit || 25
    }

    if (params?.effective_status?.length) {
      queryParams.filtering = JSON.stringify([{
        field: 'effective_status',
        operator: 'IN',
        value: params.effective_status
      }])
    }

    const response = await axiosGet<{data: MetaAd[]}>(
      `${META_BASE_URL}/${META_API_VERSION}/${adSetId}/ads`,
      {
        Authorization: `Bearer ${accessToken}`,
      },
      "meta-ads",
      {
        params: queryParams,
        timeout: 30000
      }
    )

    blg.info("Successfully fetched ads", { 
      adSetId,
      adCount: response.data.length 
    })

    return response.data
  } catch (error: any) {
    blg.error("Error fetching ads", { adSetId, error: error.message })
    throw new Error(`Failed to fetch ads: ${error.message}`)
  }
}

/**
 * Get insights/metrics for account, campaigns, ad sets, or ads
 */
export async function getInsights(
  accessToken: string,
  entityId: string,
  params: InsightsParams
): Promise<{data: MetaInsights[], paging?: any}> {
  try {
    blg.info("Fetching insights", { entityId, level: params.level, timeRange: params.time_range })

    let endpoint: string
    if (params.level === 'account') {
      endpoint = `${META_BASE_URL}/${META_API_VERSION}/act_${entityId}/insights`
    } else {
      endpoint = `${META_BASE_URL}/${META_API_VERSION}/${entityId}/insights`
    }

    const queryParams: Record<string, any> = {
      fields: params.fields.join(','),
      time_range: JSON.stringify(params.time_range),
      limit: params.limit || 25
    }

    if (params.breakdowns?.length) {
      queryParams.breakdowns = params.breakdowns.join(',')
    }

    if (params.filtering?.length) {
      queryParams.filtering = JSON.stringify(params.filtering)
    }

    const response = await axiosGet<{data: MetaInsights[], paging?: any}>(
      endpoint,
      {
        Authorization: `Bearer ${accessToken}`,
      },
      "meta-insights",
      {
        params: queryParams,
        timeout: 30000
      }
    )

    blg.info("Successfully fetched insights", { 
      entityId,
      level: params.level,
      insightCount: response.data.length 
    })

    return response
  } catch (error: any) {
    blg.error("Error fetching insights", { entityId, level: params.level, error: error.message })
    throw new Error(`Failed to fetch insights: ${error.message}`)
  }
}

/**
 * Get account-level insights for an ad account
 */
export async function getAccountInsights(
  accessToken: string,
  accountId: string,
  timeRange: {since: string, until: string},
  fields?: string[]
): Promise<MetaInsights[]> {
  const defaultFields = [
    'impressions', 'clicks', 'spend', 'reach', 'frequency',
    'ctr', 'cpc', 'cpm', 'conversions'
  ]

  const insights = await getInsights(accessToken, accountId, {
    level: 'account',
    fields: fields || defaultFields,
    time_range: timeRange
  })

  return insights.data
}

/**
 * Get campaign-level insights for an ad account
 */
export async function getCampaignInsights(
  accessToken: string,
  accountId: string,
  timeRange: {since: string, until: string},
  fields?: string[]
): Promise<MetaInsights[]> {
  const defaultFields = [
    'campaign_id', 'campaign_name', 'impressions', 'clicks', 'spend',
    'reach', 'frequency', 'ctr', 'cpc', 'cpm', 'conversions'
  ]

  const insights = await getInsights(accessToken, accountId, {
    level: 'campaign',
    fields: fields || defaultFields,
    time_range: timeRange
  })

  return insights.data
}

/**
 * Get daily insights for a date range
 */
export async function getDailyInsights(
  accessToken: string,
  accountId: string,
  timeRange: {since: string, until: string},
  level: 'account' | 'campaign' | 'adset' | 'ad' = 'campaign'
): Promise<MetaInsights[]> {
  const fields = [
    'date_start', 'date_stop', 'impressions', 'clicks', 'spend',
    'reach', 'frequency', 'ctr', 'cpc', 'cpm', 'conversions'
  ]

  if (level !== 'account') {
    fields.push(`${level}_id`, `${level}_name`)
  }

  const insights = await getInsights(accessToken, accountId, {
    level,
    fields,
    time_range: timeRange,
    breakdowns: ['day']
  })

  return insights.data
}