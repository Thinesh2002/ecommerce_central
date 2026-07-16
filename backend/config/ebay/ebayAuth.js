const axios = require("axios");

let cached = { token: null, expiresAt: 0, scopeKey: "" };

function scopeString(scopes) {
  if (!scopes) return "https://api.ebay.com/oauth/api_scope";
  const list = Array.isArray(scopes) ? scopes : String(scopes).split(/\s+/);
  return [...new Set(list.filter(Boolean))].join(" ");
}

const getEbayToken = async (scopes) => {
  const scope = scopeString(scopes);
  if (cached.token && cached.expiresAt > Date.now() && cached.scopeKey === scope) {
    return cached.token;
  }

  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("EBAY_CLIENT_ID and EBAY_CLIENT_SECRET are required.");
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope,
  });

  const res = await axios.post(
    "https://api.ebay.com/identity/v1/oauth2/token",
    body.toString(),
    {
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      timeout: 30000,
    }
  );

  const expiresIn = Number(res.data.expires_in || 7200);
  cached = {
    token: res.data.access_token,
    expiresAt: Date.now() + Math.max(60, expiresIn - 120) * 1000,
    scopeKey: scope,
  };

  return cached.token;
};

module.exports = getEbayToken;
