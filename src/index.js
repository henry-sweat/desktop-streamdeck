const { openStreamDeck, listStreamDecks } = require("@elgato-stream-deck/node");
const { pages } = require("./config");
const { getState, toggleEntity, callService } = require("./ha-client");
const { renderButton } = require("./render");

let deck;
let currentPage = "main";

// Track on/off state per page+index
const buttonStates = {};
// Track which preset_toggle button was last activated (by entity key)
const activePreset = {};

function getButtons() {
  return pages[currentPage] || [];
}

function stateKey(page, index) {
  return `${page}:${index}`;
}

const POLL_INTERVAL_MS = 5000;
let refreshing = false;
let lastRefreshError = null;

async function refreshState() {
  // Never let refreshes overlap — if HA is slow they would pile up and
  // starve button presses.
  if (refreshing) return;
  refreshing = true;
  try {
    // Refresh state for ALL pages so folder switches are instant
    const jobs = [];
    for (const [pageName, btns] of Object.entries(pages)) {
      btns.forEach((btn, i) => {
        if (!btn || !btn.entities) return;
        jobs.push(
          getState(btn.entities[0]).then((state) => {
            buttonStates[stateKey(pageName, i)] = state.state === "on";
          })
        );
      });
    }
    await Promise.all(jobs);
    await drawAllButtons();
    if (lastRefreshError) {
      console.log(`${new Date().toISOString()} State refresh recovered`);
      lastRefreshError = null;
    }
  } catch (err) {
    // Only log when the error changes, so an outage doesn't flood the log
    if (err.message !== lastRefreshError) {
      console.error(`${new Date().toISOString()} Failed to fetch state: ${err.message}`);
      lastRefreshError = err.message;
    }
  } finally {
    refreshing = false;
  }
}

function pollState() {
  refreshState().finally(() => setTimeout(pollState, POLL_INTERVAL_MS));
}

async function drawAllButtons() {
  const btns = getButtons();
  for (const control of deck.CONTROLS) {
    const { width, height } = control.pixelSize;
    const i = control.index;
    const btn = btns[i];

    let buf;
    if (!btn) {
      buf = renderButton(width, height, "", "#111111");
    } else {
      const isOn = buttonStates[stateKey(currentPage, i)] || false;
      const color = isOn ? btn.colors.on : btn.colors.off;
      buf = renderButton(width, height, btn.label, color, {
        type: btn.type,
        isOn,
        swatchColor: btn.swatchColor,
      });
    }

    await deck.fillKeyBuffer(i, buf, { format: "rgba" });
  }
}

async function handleKeyPress(keyIndex) {
  const btns = getButtons();
  const btn = btns[keyIndex];
  if (!btn) return;

  console.log(`[${currentPage}] Button ${keyIndex} pressed: ${btn.label}`);

  try {
    if (btn.action === "page") {
      currentPage = btn.page;
      await drawAllButtons();
      return;
    } else if (btn.action === "toggle") {
      await Promise.all(btn.entities.map((id) => toggleEntity(id)));
    } else if (btn.action === "preset_toggle") {
      const entityKey = btn.entities[0];
      const isOn = buttonStates[stateKey(currentPage, keyIndex)] || false;
      const thisIsActive = activePreset[entityKey] === `${currentPage}:${keyIndex}`;
      const domain = entityKey.split(".")[0];

      if (isOn && thisIsActive) {
        await Promise.all(
          btn.entities.map((id) => callService(domain, "turn_off", { entity_id: id }))
        );
        activePreset[entityKey] = null;
      } else {
        await Promise.all(
          btn.entities.map((id) =>
            callService(domain, "turn_on", { entity_id: id, ...btn.serviceData })
          )
        );
        activePreset[entityKey] = `${currentPage}:${keyIndex}`;
      }
    }

    setTimeout(refreshState, 500);
  } catch (err) {
    console.error(`${new Date().toISOString()} Error handling button ${keyIndex}: ${err.message}`);
  }
}

async function main() {
  console.log("Scanning for Stream Decks...");
  const devices = await listStreamDecks();
  if (devices.length === 0) {
    throw new Error("No Stream Deck found. Is it plugged in? Is the Elgato app closed?");
  }
  console.log(`Found ${devices.length} device(s), opening: ${devices[0].model} (${devices[0].path})`);
  deck = await openStreamDeck(devices[0].path);

  const numKeys = deck.CONTROLS.length;
  const iconSize = deck.CONTROLS[0].pixelSize.width;
  console.log(`Connected: ${deck.PRODUCT_NAME}, ${numKeys} keys, ${iconSize}x${iconSize}px`);

  await deck.setBrightness(20);
  pollState();

  deck.on("down", (control) => {
    handleKeyPress(control.index);
  });

  deck.on("error", (err) => {
    console.error("Stream Deck error:", err);
  });

  process.on("SIGINT", async () => {
    console.log("\nShutting down...");
    await deck.resetToLogo();
    await deck.close();
    process.exit(0);
  });

  console.log("Ready! Press Ctrl+C to exit.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
