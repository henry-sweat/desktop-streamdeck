require("dotenv").config();

// Pages of buttons for a 6-button Stream Deck Mini (2 rows x 3 columns)
//
// Main page:
//   [0: Red 80%]       [1: Warm White 60%]  [2: Denon folder]
//   [3: empty]         [4: empty]           [5: empty]
//
// Denon page:
//   [0: Back]          [1: Plugs On/Off]    [2: Denon Power]
//   [3: empty]         [4: Vol -]           [5: Vol +]

const pages = {
  main: [
    {
      label: "Red",
      action: "preset_toggle",
      type: "preset",
      entities: ["light.phillips_hue_bulb"],
      swatchColor: "#FF3333",
      serviceData: {
        hs_color: [0, 100],
        brightness_pct: 80,
      },
      colors: { off: "#2A2A3A", on: "#4A2020" },
    },
    {
      label: "Warm",
      action: "preset_toggle",
      type: "preset",
      entities: ["light.phillips_hue_bulb"],
      swatchColor: "#FFCC66",
      serviceData: {
        color_temp_kelvin: 2700,
        brightness_pct: 60,
      },
      colors: { off: "#2A2A3A", on: "#4A3A1A" },
    },
    {
      label: "Denon",
      action: "page",
      page: "denon",
      type: "folder",
      colors: { off: "#2A2A3A", on: "#2A3A4A" },
    },
    null,
    null,
    null,
  ],
  denon: [
    {
      label: "Back",
      action: "page",
      page: "main",
      type: "back",
      colors: { off: "#2A2A3A", on: "#2A2A3A" },
    },
    {
      label: "Plugs",
      action: "toggle",
      type: "plug",
      entities: [
        "switch.third_reality_smart_plug",
        "switch.third_reality_inc_3rsp02028bz",
      ],
      colors: { off: "#2A2A3A", on: "#2A4A3A" },
    },
    {
      label: "Denon",
      action: "denon_toggle",
      type: "speaker",
      colors: { off: "#2A2A3A", on: "#2A3A4A" },
    },
    null,
    {
      label: "Vol -",
      action: "denon_vol_down",
      type: "vol_down",
      colors: { off: "#2A2A3A", on: "#2A3A4A" },
    },
    {
      label: "Vol +",
      action: "denon_vol_up",
      type: "vol_up",
      colors: { off: "#2A2A3A", on: "#2A3A4A" },
    },
  ],
};

module.exports = {
  HA_URL: process.env.HA_URL,
  HA_TOKEN: process.env.HA_TOKEN,
  pages,
};
