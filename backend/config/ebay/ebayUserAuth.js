const axios = require("axios");

const DEFAULT_USER_SCOPES = [
  "https://api.ebay.com/oauth/api_scope",
  "https://api.ebay.com/oauth/api_scope/sell.fulfillment.readonly",
  "https://api.ebay.com/oauth/api_scope/sell.inventory.readonly",
  "https://api.ebay.com/oauth/api_scope/sell.analytics.readonly",
  "https://api.ebay.com/oauth/api_scope/sell.marketing.readonly",
  "https://api.ebay.com/oauth/api_scope/sell.account.readonly",
  "https://api.ebay.com/oauth/api_scope/sell.finances.readonly",
];

let cached = {
  token: null,
  expiresAt: 0,
  scopeKey: "",
};

function base64Credentials() {
  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("EBAY_CLIENT_ID and EBAY_CLIENT_SECRET are required.");
  }
  return Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
}

function getConfiguredUserAccessToken() {
  return process.env.EBAY_USER_ACCESS_TOKEN || process.env.EBAY_ACCESS_TOKEN || "";
}

function getConfiguredRefreshToken() {
  return process.env.EBAY_REFRESH_TOKEN || "";
}

function scopeString(scopes = DEFAULT_USER_SCOPES) {
  const list = Array.isArray(scopes) ? scopes : String(scopes || "").split(/\s+/);
  return [...new Set(list.filter(Boolean))].join(" ");
}

async function refreshUserToken(scopes = DEFAULT_USER_SCOPES) {
  const refreshToken = getConfiguredRefreshToken();
  if (!refreshToken) return null;

  const scope = scopeString(scopes);
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    scope,
  });

  const response = await axios.post(
    "https://api.ebay.com/identity/v1/oauth2/token",
    body.toString(),
    {
      headers: {
        Authorization: `Basic ${base64Credentials()}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      timeout: 30000,
    }
  );

  const expiresIn = Number(response.data.expires_in || 7200);
  cached = {
    token: response.data.access_token,
    expiresAt: Date.now() + Math.max(60, expiresIn - 120) * 1000,
    scopeKey: scope,
  };
  return cached.token;
}

async function getEbayUserToken(scopes = DEFAULT_USER_SCOPES) {
  const scope = scopeString(scopes);
  if (cached.token && cached.expiresAt > Date.now() && cached.scopeKey === scope) {
    return cached.token;
  }

  const refreshed = await refreshUserToken(scopes);
  if (refreshed) return refreshed;

  const directToken = getConfiguredUserAccessToken();
  if (directToken) return directToken;

  throw new Error(
    "Missing eBay user token. Add EBAY_REFRESH_TOKEN for auto-refresh or EBAY_USER_ACCESS_TOKEN for manual testing. User OAuth is required for orders, analytics, marketing, inventory and account data."
  );
}

module.exports = {
  DEFAULT_USER_SCOPES,
  getEbayUserToken,
  refreshUserToken,
};
