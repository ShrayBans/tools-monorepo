/**
 * Meta Ads Authentication Service
 * Handles OAuth flow and token management for Meta Ads API
 */

import { axiosGet, axiosPost } from "../axios"
import { blg } from "../logging"

// Meta API configuration
const META_BASE_URL = "https://graph.facebook.com"
const META_API_VERSION = "v19.0"

// Required permissions for Meta Ads API
const REQUIRED_PERMISSIONS = [
  'ads_management', // Full access to manage ads
  'ads_read',       // Read access to ad insights
  'business_management' // Access to business accounts (optional)
]

export interface MetaAccount {
  id: string
  name: string
  account_id: string
  account_status: number
  currency: string
  timezone_name: string
  business?: {
    id: string
    name: string
  }
}

export interface MetaTokenResponse {
  access_token: string
  token_type: string
  expires_in?: number
}

export interface MetaUserInfo {
  id: string
  name: string
  email?: string
}

/**
 * Generate OAuth URL for Meta authorization
 */
export function generateMetaOAuthUrl(
  appId: string,
  redirectUri: string,
  state?: string
): string {
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: REQUIRED_PERMISSIONS.join(','),
    response_type: 'code',
    state: state || '',
  })

  return `https://www.facebook.com/v${META_API_VERSION.replace('v', '')}/dialog/oauth?${params.toString()}`
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  code: string,
  appId: string,
  appSecret: string,
  redirectUri: string
): Promise<MetaTokenResponse> {
  try {
    blg.info("Exchanging authorization code for access token", { 
      hasCode: !!code,
      redirectUri 
    })

    const response = await axiosGet<MetaTokenResponse>(
      `${META_BASE_URL}/${META_API_VERSION}/oauth/access_token`,
      {},
      "meta-oauth-token-exchange",
      {
        params: {
          client_id: appId,
          client_secret: appSecret,
          redirect_uri: redirectUri,
          code: code,
        },
        timeout: 30000
      }
    )

    blg.info("Successfully exchanged code for token", {
      hasAccessToken: !!response.access_token,
      tokenType: response.token_type,
      expiresIn: response.expires_in
    })

    return response
  } catch (error: any) {
    blg.error("Error exchanging authorization code", { error: error.message })
    throw new Error(`Failed to exchange authorization code: ${error.message}`)
  }
}

/**
 * Get user information from access token
 */
export async function getMetaUserInfo(accessToken: string): Promise<MetaUserInfo> {
  try {
    const response = await axiosGet<MetaUserInfo>(
      `${META_BASE_URL}/${META_API_VERSION}/me`,
      {
        Authorization: `Bearer ${accessToken}`,
      },
      "meta-user-info",
      {
        params: {
          fields: 'id,name,email'
        },
        timeout: 30000
      }
    )

    return response
  } catch (error: any) {
    blg.error("Error getting user info", { error: error.message })
    throw new Error(`Failed to get user info: ${error.message}`)
  }
}

/**
 * Get user's ad accounts
 */
export async function getUserAdAccounts(accessToken: string): Promise<MetaAccount[]> {
  try {
    blg.info("Fetching user's ad accounts")

    const response = await axiosGet<{data: MetaAccount[]}>(
      `${META_BASE_URL}/${META_API_VERSION}/me/adaccounts`,
      {
        Authorization: `Bearer ${accessToken}`,
      },
      "meta-ad-accounts",
      {
        params: {
          fields: 'id,name,account_id,account_status,currency,timezone_name,business'
        },
        timeout: 30000
      }
    )

    blg.info("Successfully fetched ad accounts", { 
      accountCount: response.data.length 
    })

    return response.data
  } catch (error: any) {
    blg.error("Error fetching ad accounts", { error: error.message })
    throw new Error(`Failed to fetch ad accounts: ${error.message}`)
  }
}

/**
 * Validate access token by making a test API call
 */
export async function validateAccessToken(accessToken: string): Promise<boolean> {
  try {
    await getMetaUserInfo(accessToken)
    return true
  } catch (error) {
    blg.error("Access token validation failed", { error })
    return false
  }
}

/**
 * Get long-lived access token (if supported by Meta)
 * Note: Meta may not always provide refresh tokens or long-lived tokens
 */
export async function getLongLivedToken(
  shortLivedToken: string,
  appId: string,
  appSecret: string
): Promise<MetaTokenResponse> {
  try {
    blg.info("Attempting to get long-lived token")

    const response = await axiosGet<MetaTokenResponse>(
      `${META_BASE_URL}/${META_API_VERSION}/oauth/access_token`,
      {},
      "meta-long-lived-token",
      {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: appId,
          client_secret: appSecret,
          fb_exchange_token: shortLivedToken,
        },
        timeout: 30000
      }
    )

    blg.info("Successfully obtained long-lived token", {
      hasAccessToken: !!response.access_token,
      expiresIn: response.expires_in
    })

    return response
  } catch (error: any) {
    blg.error("Error getting long-lived token", { error: error.message })
    // Don't throw here - this is optional
    return { access_token: shortLivedToken, token_type: 'bearer' }
  }
}

/**
 * Revoke access token (disconnect account)
 */
export async function revokeAccessToken(accessToken: string): Promise<boolean> {
  try {
    blg.info("Revoking access token")

    await axiosPost(
      `${META_BASE_URL}/${META_API_VERSION}/me/permissions`,
      {},
      {
        Authorization: `Bearer ${accessToken}`,
      },
      "meta-revoke-token",
      { timeout: 30000 }
    )

    blg.info("Successfully revoked access token")
    return true
  } catch (error: any) {
    blg.error("Error revoking access token", { error: error.message })
    return false
  }
}

/**
 * Test connection to Meta API
 */
export async function testMetaConnection(accessToken: string): Promise<{
  isValid: boolean
  userInfo?: MetaUserInfo
  adAccountCount?: number
  error?: string
}> {
  try {
    // Test basic API access
    const userInfo = await getMetaUserInfo(accessToken)
    
    // Test ad account access
    const adAccounts = await getUserAdAccounts(accessToken)

    return {
      isValid: true,
      userInfo,
      adAccountCount: adAccounts.length
    }
  } catch (error: any) {
    return {
      isValid: false,
      error: error.message
    }
  }
}