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

async function refreshState() {
  try {
    // Refresh state for ALL pages so folder switches are instant
    for (const [pageName, btns] of Object.entries(pages)) {
      for (let i = 0; i < btns.length; i++) {
        const btn = btns[i];
        if (!btn) continue;

        const key = stateKey(pageName, i);
        if (btn.entities) {
          const state = await getState(btn.entities[0]);
          buttonStates[key] = state.state === "on";
        }
      }
    }
    await drawAllButtons();
  } catch (err) {
    console.error("Failed to fetch state:", err.message);
  }
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
    console.error(`Error handling button ${keyIndex}:`, err.message);
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
  await refreshState();

  setInterval(refreshState, 5000);

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
