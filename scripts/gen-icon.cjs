// Generates build/icon.png (1024x1024) for electron-builder — no dependencies.
// Renders a vinyl-record "Angkor Key" icon with a gradient backdrop + play glyph.
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const SIZE = 1024
const SS = 2 // supersample factor for anti-aliasing
const W = SIZE * SS

// ---- CRC32 for PNG chunks ----
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const body = Buffer.concat([typeBuf, data])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([len, body, crc])
}

// ---- helpers ----
const lerp = (a, b, t) => a + (b - a) * t
function mix(c1, c2, t) {
  return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)]
}

const BLUE = [59, 108, 246]
const CYAN = [34, 211, 238]
const DARK = [16, 20, 29]
const DARK2 = [30, 37, 51]

// color at a hi-res pixel (returns [r,g,b,a])
function sample(x, y) {
  const cx = W / 2, cy = W / 2
  const dx = x - cx, dy = y - cy
  const d = Math.sqrt(dx * dx + dy * dy)

  // Rounded-square background mask
  const margin = W * 0.06
  const r = W * 0.22 // corner radius
  const inX = x - margin, inY = y - margin
  const innerW = W - margin * 2
  // distance to rounded rect (negative inside)
  const qx = Math.abs(inX - innerW / 2) - (innerW / 2 - r)
  const qy = Math.abs(inY - innerW / 2) - (innerW / 2 - r)
  const outside = Math.sqrt(Math.max(qx, 0) ** 2 + Math.max(qy, 0) ** 2) + Math.min(Math.max(qx, qy), 0) - r
  if (outside > 0) return [0, 0, 0, 0]

  // Background gradient (diagonal)
  const t = (x + y) / (2 * W)
  let col = mix(BLUE, CYAN, t)

  const Router = W * 0.34
  const Rlabel = W * 0.135
  const Rhole = W * 0.022

  if (d <= Router) {
    // vinyl record
    col = d < Rlabel ? null : DARK.slice()
    if (d >= Rlabel) {
      // subtle grooves
      const groove = 0.5 + 0.5 * Math.sin(d / (W * 0.012))
      col = mix(DARK, DARK2, groove * 0.6)
      // outer rim highlight
      const rim = 1 - Math.min(1, Math.abs(d - Router) / (W * 0.02))
      col = mix(col, [70, 80, 100], rim * 0.5)
    }
    if (d < Rlabel) {
      // label: gradient brand disc
      const lt = (x + y) / (2 * W)
      col = mix([74, 130, 255], [34, 211, 238], lt)
      // play triangle glyph
      const tx = dx, ty = dy
      const triR = Rlabel * 0.62
      // point-in-triangle pointing right, centered, slightly left-shifted
      const ox = -triR * 0.18
      const ax = ox - triR * 0.5, ay = -triR * 0.62
      const bx = ox - triR * 0.5, by = triR * 0.62
      const ex = ox + triR * 0.72, ey = 0
      if (pointInTri(tx, ty, ax, ay, bx, by, ex, ey)) col = [255, 255, 255]
    }
    if (d < Rhole) {
      // center hole shows background gradient
      col = mix(BLUE, CYAN, t)
    }
  }
  return [col[0], col[1], col[2], 255]
}

function sign(px, py, ax, ay, bx, by) {
  return (px - bx) * (ay - by) - (ax - bx) * (py - by)
}
function pointInTri(px, py, ax, ay, bx, by, cx, cy) {
  const d1 = sign(px, py, ax, ay, bx, by)
  const d2 = sign(px, py, bx, by, cx, cy)
  const d3 = sign(px, py, cx, cy, ax, ay)
  const neg = d1 < 0 || d2 < 0 || d3 < 0
  const pos = d1 > 0 || d2 > 0 || d3 > 0
  return !(neg && pos)
}

// ---- render with supersampling down to SIZE ----
const raw = Buffer.alloc(SIZE * (1 + SIZE * 4)) // each row: filter byte + RGBA
for (let y = 0; y < SIZE; y++) {
  const rowStart = y * (1 + SIZE * 4)
  raw[rowStart] = 0 // filter: none
  for (let x = 0; x < SIZE; x++) {
    let r = 0, g = 0, b = 0, a = 0
    for (let sy = 0; sy < SS; sy++) {
      for (let sx = 0; sx < SS; sx++) {
        const px = sample(x * SS + sx + 0.5, y * SS + sy + 0.5)
        r += px[0] * px[3]; g += px[1] * px[3]; b += px[2] * px[3]; a += px[3]
      }
    }
    const n = SS * SS
    const off = rowStart + 1 + x * 4
    if (a === 0) {
      raw[off] = raw[off + 1] = raw[off + 2] = raw[off + 3] = 0
    } else {
      raw[off] = Math.round(r / a)
      raw[off + 1] = Math.round(g / a)
      raw[off + 2] = Math.round(b / a)
      raw[off + 3] = Math.round(a / n)
    }
  }
}

const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(SIZE, 0); ihdr.writeUInt32BE(SIZE, 4)
ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0
const idat = zlib.deflateSync(raw, { level: 9 })
const png = Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])

const outDir = path.join(__dirname, '..', 'build')
fs.mkdirSync(outDir, { recursive: true })
const outPath = path.join(outDir, 'icon.png')
fs.writeFileSync(outPath, png)
console.log('Wrote', outPath, `(${png.length} bytes)`)
