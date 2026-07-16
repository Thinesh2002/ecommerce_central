const axios = require("axios");
const { endpoint, authToken } = require("./tradingAuth");

function escapeXml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getTradingToken() {
  const token = process.env.EBAY_TRADING_TOKEN || authToken;
  if (!token) throw new Error("EBAY_TRADING_TOKEN is required for Trading API calls.");
  return token;
}

function siteIdFromMarketplace(marketplace = "EBAY_GB") {
  const map = {
    EBAY_US: "0",
    EBAY_GB: "3",
    EBAY_AU: "15",
    EBAY_DE: "77",
    EBAY_FR: "71",
    EBAY_IT: "101",
    EBAY_ES: "186",
  };
  return map[String(marketplace || "EBAY_GB").toUpperCase()] || "3";
}

function xmlValue(xml = "", tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = String(xml).match(re);
  if (!match) return null;
  return match[1]
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function xmlValues(xml = "", tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const values = [];
  let match;
  while ((match = re.exec(String(xml)))) values.push(match[1]);
  return values;
}

async function callTradingApi(callName, bodyXml, { marketplace = "EBAY_GB", compatibilityLevel = "1423" } = {}) {
  const response = await axios.post(endpoint, bodyXml, {
    headers: {
      "X-EBAY-API-CALL-NAME": callName,
      "X-EBAY-API-SITEID": siteIdFromMarketplace(marketplace),
      "X-EBAY-API-COMPATIBILITY-LEVEL": compatibilityLevel,
      "X-EBAY-API-IAF-TOKEN": getTradingToken(),
      "Content-Type": "text/xml",
    },
    timeout: 45000,
  });
  return response.data;
}

function authRequesterCredentialsXml() {
  return `<RequesterCredentials><eBayAuthToken>${escapeXml(getTradingToken())}</eBayAuthToken></RequesterCredentials>`;
}

module.exports = {
  escapeXml,
  xmlValue,
  xmlValues,
  callTradingApi,
  authRequesterCredentialsXml,
  siteIdFromMarketplace,
};
