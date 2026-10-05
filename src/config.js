require("dotenv").config();

// Pages of buttons for a 6-button Stream Deck Mini (2 rows x 3 columns)
//
// Main page:
//   [0: Red 80%]       [1: Warm White 60%]  [2: Plugs On/Off]
//   [3: empty]         [4: empty]           [5: empty]

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
      label: "Plugs",
      action: "toggle",
      type: "plug",
      entities: [
        "switch.third_reality_smart_plug",
        "switch.third_reality_inc_3rsp02028bz",
      ],
      colors: { off: "#2A2A3A", on: "#2A4A3A" },
    },
    null,
    null,
    null,
  ],
};

module.exports = {
  HA_URL: process.env.HA_URL,
  HA_TOKEN: process.env.HA_TOKEN,
  pages,
};
