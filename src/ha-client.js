const dns = require("dns").promises;
const { HA_URL, HA_TOKEN } = require("./config");

const REQUEST_TIMEOUT_MS = 5000;
const DNS_CACHE_MS = 60_000;

const headers = {
  Authorization: `Bearer ${HA_TOKEN}`,
  "Content-Type": "application/json",
};

// On macOS, a default lookup of a `.local` mDNS name (e.g. homeassistant.local)
// stalls ~5s waiting for an IPv6 answer that never arrives. Doing that on every
// request made the deck unusable, so resolve over IPv4 and cache the result.
// Only done for plain http — https needs the real hostname for TLS.
let cachedBase = null;
let cachedAt = 0;

async function baseUrl() {
  const url = new URL(HA_URL);
  if (url.protocol !== "http:") return HA_URL;
  if (cachedBase && Date.now() - cachedAt < DNS_CACHE_MS) return cachedBase;
  try {
    const { address } = await dns.lookup(url.hostname, { family: 4 });
    url.hostname = address;
    cachedBase = url.origin;
    cachedAt = Date.now();
    return cachedBase;
  } catch {
    return HA_URL; // fall back to letting fetch resolve it
  }
}

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${await baseUrl()}${path}`, {
      ...options,
      headers,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    cachedBase = null; // HA may have moved; re-resolve next time
    // undici hides the real reason (ENOTFOUND, ECONNREFUSED, timeout...) in err.cause
    const cause = err.cause ? ` (${err.cause.code || err.cause.message})` : "";
    throw new Error(`${err.message}${cause}`);
  }
  if (!res.ok) throw new Error(`HA API error: ${res.status} ${await res.text()}`);
  return res.json();
}

function getState(entityId) {
  return request(`/api/states/${entityId}`);
}

function domainOf(entityId) {
  return entityId.split(".")[0];
}

function toggleEntity(entityId) {
  return callService(domainOf(entityId), "toggle", { entity_id: entityId });
}

function callService(domain, service, data) {
  return request(`/api/services/${domain}/${service}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

module.exports = { getState, toggleEntity, callService };
