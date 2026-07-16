const axios = require("axios");
const getEbayAppToken = require("./ebayAuth");
const { getEbayUserToken } = require("./ebayUserAuth");

const API_ROOT = process.env.EBAY_API_ROOT || "https://api.ebay.com";

async function getToken(tokenType = "app", scopes) {
  if (tokenType === "user") return getEbayUserToken(scopes);
  return getEbayAppToken(scopes);
}

async function ebayGet(path, { tokenType = "app", scopes, marketplace, params, headers, responseType } = {}) {
  const token = await getToken(tokenType, scopes);
  const response = await axios.get(`${API_ROOT}${path}`, {
    params,
    responseType,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(marketplace ? { "X-EBAY-C-MARKETPLACE-ID": marketplace } : {}),
      ...(headers || {}),
    },
    timeout: 45000,
  });
  return response;
}

async function ebayPost(path, body = {}, { tokenType = "user", scopes, marketplace, params, headers } = {}) {
  const token = await getToken(tokenType, scopes);
  const response = await axios.post(`${API_ROOT}${path}`, body, {
    params,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(marketplace ? { "X-EBAY-C-MARKETPLACE-ID": marketplace } : {}),
      ...(headers || {}),
    },
    timeout: 45000,
  });
  return response;
}

module.exports = {
  ebayGet,
  ebayPost,
  API_ROOT,
};
