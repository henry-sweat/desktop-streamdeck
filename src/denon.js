const DENON_IP = process.env.DENON_IP;

const BASE_URL = `http://${DENON_IP}/goform/formiPhoneAppDirect.xml`;

async function sendCommand(cmd) {
  const res = await fetch(`${BASE_URL}?${cmd}`);
  if (!res.ok) throw new Error(`Denon error: ${res.status}`);
}

async function getPowerState() {
  const res = await fetch(`http://${DENON_IP}/goform/formMainZone_MainZoneXmlStatusLite.xml`);
  if (!res.ok) throw new Error(`Denon error: ${res.status}`);
  const text = await res.text();
  return text.includes("<Power><value>ON</value></Power>");
}

async function togglePower() {
  const isOn = await getPowerState();
  await sendCommand(isOn ? "PWSTANDBY" : "PWON");
}

async function volumeUp() {
  for (let i = 0; i < 5; i++) await sendCommand("MVUP");
}

async function volumeDown() {
  for (let i = 0; i < 5; i++) await sendCommand("MVDOWN");
}

module.exports = { getPowerState, togglePower, volumeUp, volumeDown };
