const { createCanvas } = require("canvas");

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function lighten(hex, amount) {
  const [r, g, b] = hexToRgb(hex);
  const l = (c) => Math.min(255, Math.round(c + (255 - c) * amount));
  return `rgb(${l(r)},${l(g)},${l(b)})`;
}

function darken(hex, amount) {
  const [r, g, b] = hexToRgb(hex);
  const d = (c) => Math.round(c * (1 - amount));
  return `rgb(${d(r)},${d(g)},${d(b)})`;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawBulbIcon(ctx, cx, cy, size, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const r = size * 0.45;

  // Bulb glass — full circle top, narrowing at bottom
  ctx.beginPath();
  ctx.arc(cx, cy - r * 0.2, r, Math.PI * 0.85, Math.PI * 0.15);
  // Curve down to the base
  ctx.quadraticCurveTo(cx + r * 0.45, cy + r * 0.6, cx + r * 0.3, cy + r * 0.9);
  ctx.lineTo(cx - r * 0.3, cy + r * 0.9);
  ctx.quadraticCurveTo(cx - r * 0.45, cy + r * 0.6, cx - r * Math.cos(Math.PI * 0.85), cy - r * 0.2 - r * Math.sin(Math.PI * 0.85));
  ctx.stroke();

  // Base lines (screw part)
  const baseY = cy + r * 0.9;
  for (let i = 0; i < 2; i++) {
    const y = baseY + 4 + i * 4;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.25, y);
    ctx.lineTo(cx + r * 0.25, y);
    ctx.stroke();
  }

  // Bottom tip
  ctx.beginPath();
  ctx.arc(cx, baseY + 14, r * 0.12, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawPlugIcon(ctx, cx, cy, size, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const s = size * 0.4;

  // Two prongs
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.35, cy - s);
  ctx.lineTo(cx - s * 0.35, cy - s * 0.15);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx + s * 0.35, cy - s);
  ctx.lineTo(cx + s * 0.35, cy - s * 0.15);
  ctx.stroke();

  // Plug body (rounded rect)
  roundRect(ctx, cx - s * 0.55, cy - s * 0.15, s * 1.1, s * 0.8, 3);
  ctx.stroke();

  // Cord coming down
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.65);
  ctx.lineTo(cx, cy + s * 1.2);
  ctx.stroke();

  ctx.restore();
}

function drawSpeakerIcon(ctx, cx, cy, size, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const s = size * 0.4;

  // Speaker body — trapezoid shape
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.6, cy - s * 0.3);
  ctx.lineTo(cx - s * 0.2, cy - s * 0.3);
  ctx.lineTo(cx + s * 0.3, cy - s * 0.8);
  ctx.lineTo(cx + s * 0.3, cy + s * 0.8);
  ctx.lineTo(cx - s * 0.2, cy + s * 0.3);
  ctx.lineTo(cx - s * 0.6, cy + s * 0.3);
  ctx.closePath();
  ctx.stroke();

  // Sound waves
  for (let i = 1; i <= 2; i++) {
    const r = s * 0.35 * i;
    ctx.beginPath();
    ctx.arc(cx + s * 0.3, cy, r, -Math.PI * 0.35, Math.PI * 0.35);
    ctx.stroke();
  }

  ctx.restore();
}

function drawVolIcon(ctx, cx, cy, size, color, direction) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const s = size * 0.35;

  // Small speaker shape
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.8, cy - s * 0.25);
  ctx.lineTo(cx - s * 0.4, cy - s * 0.25);
  ctx.lineTo(cx, cy - s * 0.65);
  ctx.lineTo(cx, cy + s * 0.65);
  ctx.lineTo(cx - s * 0.4, cy + s * 0.25);
  ctx.lineTo(cx - s * 0.8, cy + s * 0.25);
  ctx.closePath();
  ctx.stroke();

  // Plus or minus sign
  const signX = cx + s * 0.7;
  const signSize = s * 0.35;
  // Horizontal bar (both + and -)
  ctx.beginPath();
  ctx.moveTo(signX - signSize, cy);
  ctx.lineTo(signX + signSize, cy);
  ctx.stroke();

  if (direction === "up") {
    // Vertical bar for +
    ctx.beginPath();
    ctx.moveTo(signX, cy - signSize);
    ctx.lineTo(signX, cy + signSize);
    ctx.stroke();
  }

  ctx.restore();
}

function drawFolderIcon(ctx, cx, cy, size, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const s = size * 0.4;

  // Folder shape
  ctx.beginPath();
  ctx.moveTo(cx - s, cy - s * 0.4);
  ctx.lineTo(cx - s, cy - s * 0.8);
  ctx.lineTo(cx - s * 0.3, cy - s * 0.8);
  ctx.lineTo(cx - s * 0.1, cy - s * 0.4);
  ctx.lineTo(cx + s, cy - s * 0.4);
  ctx.lineTo(cx + s, cy + s * 0.7);
  ctx.lineTo(cx - s, cy + s * 0.7);
  ctx.closePath();
  ctx.stroke();

  ctx.restore();
}

function drawBackIcon(ctx, cx, cy, size, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const s = size * 0.35;

  // Arrow pointing left
  ctx.beginPath();
  ctx.moveTo(cx + s * 0.5, cy - s * 0.6);
  ctx.lineTo(cx - s * 0.5, cy);
  ctx.lineTo(cx + s * 0.5, cy + s * 0.6);
  ctx.stroke();

  // Horizontal line
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.5, cy);
  ctx.lineTo(cx + s, cy);
  ctx.stroke();

  ctx.restore();
}

function drawCircleIcon(ctx, cx, cy, radius, fillColor) {
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = fillColor;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

// canvas.toBuffer("raw") is BGRA on most platforms — swap R and B channels
function bgraToRgba(buf) {
  const out = Buffer.from(buf);
  for (let i = 0; i < out.length; i += 4) {
    const b = out[i];
    out[i] = out[i + 2];
    out[i + 2] = b;
  }
  return out;
}

function renderButton(width, height, label, bgColor, opts = {}) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  const pad = 4;
  const rad = 10;

  // Dark background
  ctx.fillStyle = "#111111";
  ctx.fillRect(0, 0, width, height);

  // Main rounded rect with gradient
  const grad = ctx.createLinearGradient(0, pad, 0, height - pad);
  grad.addColorStop(0, lighten(bgColor, 0.2));
  grad.addColorStop(1, darken(bgColor, 0.3));
  roundRect(ctx, pad, pad, width - pad * 2, height - pad * 2, rad);
  ctx.fillStyle = grad;
  ctx.fill();

  // Subtle inner highlight
  const highlight = ctx.createLinearGradient(0, pad, 0, height * 0.4);
  highlight.addColorStop(0, "rgba(255,255,255,0.15)");
  highlight.addColorStop(1, "rgba(255,255,255,0)");
  roundRect(ctx, pad, pad, width - pad * 2, height - pad * 2, rad);
  ctx.fillStyle = highlight;
  ctx.fill();

  const isOn = opts.isOn;
  const iconColor = isOn ? "#FFFFFF" : "rgba(255,255,255,0.6)";

  if (opts.type === "toggle") {
    drawBulbIcon(ctx, width / 2, height * 0.3, 28, iconColor);
    ctx.fillStyle = iconColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(label, width / 2, height * 0.82);
  } else if (opts.type === "plug") {
    drawPlugIcon(ctx, width / 2, height * 0.34, 30, iconColor);
    ctx.fillStyle = iconColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(label, width / 2, height * 0.82);
  } else if (opts.type === "speaker") {
    drawSpeakerIcon(ctx, width / 2, height * 0.34, 30, iconColor);
    ctx.fillStyle = iconColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(label, width / 2, height * 0.82);
  } else if (opts.type === "vol_up" || opts.type === "vol_down") {
    const dir = opts.type === "vol_up" ? "up" : "down";
    drawVolIcon(ctx, width / 2, height * 0.34, 30, iconColor, dir);
    ctx.fillStyle = iconColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(label, width / 2, height * 0.82);
  } else if (opts.type === "folder") {
    drawFolderIcon(ctx, width / 2, height * 0.34, 30, iconColor);
    ctx.fillStyle = iconColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(label, width / 2, height * 0.82);
  } else if (opts.type === "back") {
    drawBackIcon(ctx, width / 2, height * 0.34, 30, iconColor);
    ctx.fillStyle = iconColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(label, width / 2, height * 0.82);
  } else if (opts.type === "preset") {
    // Color swatch circle above label
    drawCircleIcon(ctx, width / 2, height * 0.36, 14, opts.swatchColor || "#FFFFFF");
    // Label below
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(label, width / 2, height * 0.72);
  } else if (label) {
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `bold ${Math.floor(height / 5)}px sans-serif`;
    ctx.fillText(label, width / 2, height / 2);
  }

  return bgraToRgba(canvas.toBuffer("raw"));
}

module.exports = { renderButton };
