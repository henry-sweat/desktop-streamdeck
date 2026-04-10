const { HA_URL, HA_TOKEN } = require("./config");

const headers = {
  Authorization: `Bearer ${HA_TOKEN}`,
  "Content-Type": "application/json",
};

async function getState(entityId) {
  const res = await fetch(`${HA_URL}/api/states/${entityId}`, { headers });
  if (!res.ok) throw new Error(`HA API error: ${res.status} ${await res.text()}`);
  return res.json();
}

function domainOf(entityId) {
  return entityId.split(".")[0];
}

async function toggleEntity(entityId) {
  const domain = domainOf(entityId);
  const res = await fetch(`${HA_URL}/api/services/${domain}/toggle`, {
    method: "POST",
    headers,
    body: JSON.stringify({ entity_id: entityId }),
  });
  if (!res.ok) throw new Error(`HA API error: ${res.status}`);
  return res.json();
}

async function callService(domain, service, data) {
  const res = await fetch(`${HA_URL}/api/services/${domain}/${service}`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`HA API error: ${res.status}`);
  return res.json();
}

module.exports = { getState, toggleEntity, callService };
