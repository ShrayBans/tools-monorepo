import OAuthServer from "oauth2-server"
const _Request = OAuthServer.Request
const _Response = OAuthServer.Response

// Define your OAuth2 models
const oauthModel = {
  getClient: async (clientId, clientSecret) => {
    // Fetch the client from your database
    return {
      clientId,
      clientSecret,
      grants: ["authorization_code", "refresh_token"],
      redirectUris: ["http://localhost/callback"],
    }
  },
  getUser: async (username, _password) => {
    // Authenticate the user against your database
    return { id: "user123", username: username }
  },
  saveToken: async (token, client, user) => {
    // Save the token information into your database
    return { accessToken: token.accessToken, accessTokenExpiresAt: token.accessTokenExpiresAt, client, user }
  },
  getAccessToken: async (accessToken) => {
    // Retrieve the access token from your database
    return {
      accessToken,
      accessTokenExpiresAt: new Date(Date.now() + 1000 * 60 * 60),
      client: { id: "client123" },
      user: { id: "user123" },
    }
  },
  // Define other necessary model functions...
}

export const oauth = new OAuthServer({
  model: oauthModel,
  accessTokenLifetime: 60 * 60, // 1 hour
  allowBearerTokensInQueryString: true,
})
