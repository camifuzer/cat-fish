const $ = (id) => document.getElementById(id);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const cv = $('c');
const ctx = cv.getContext('2d');
const bg = document.createElement('canvas');
const bx = bg.getContext('2d');
const wood = document.createElement('canvas');
const wx = wood.getContext('2d');

let W = 800;
let D = 1;
let R = 300;
let cx = 400;
let cy = 400;
let fish = null;
let down = false;
let waterY = 0;

const mouse = { x: 400, y: 400, tx: 400, ty: 400 };
const paw = { e: 0, t: 0, x: 0, y: 0 };
const ripples = [];
const bubbles = [];
const pebbles = [];
const plants = [];
const drops = [];

/* ---------- Audio ---------- */
let audioOn = true;
let ac = null;
function initAudio() {
  if (!ac) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) ac = new AudioContextClass();
  }
  if (ac && ac.state === 'suspended') ac.resume();
}
function tone(f0, f1, duration, volume) {
  if (!audioOn) return;
  initAudio();
  if (!ac) return;
  try {
    const oscillator = ac.createOscillator();
    const gain = ac.createGain();
    const time = ac.currentTime;
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(f0, time);
    oscillator.frequency.exponentialRampToValueAtTime(f1, time + duration);
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    oscillator.connect(gain);
    gain.connect(ac.destination);
    oscillator.start();
    oscillator.stop(time + duration);
  } catch (error) {
    // Audio is optional; unsupported browsers should still run the aquarium.
  }
}

$('snd').addEventListener('click', () => {
  audioOn = !audioOn;
  $('snd').textContent = audioOn ? '🔊 Som: Ativado' : '🔇 Som: Mudo';
  $('snd').setAttribute('aria-pressed', String(audioOn));
  if (audioOn) initAudio();
});

/* ---------- Wood texture ---------- */
(function createWoodTexture() {
  wood.width = 1200;
  wood.height = 400;
  const gradient = wx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, '#B0693A');
  gradient.addColorStop(0.35, '#8B4F25');
  gradient.addColorStop(1, '#4A2A12');
  wx.fillStyle = gradient;
  wx.fillRect(0, 0, 1200, 400);
  wx.lineWidth = 2;
  for (let i = 0; i < 45; i++) {
    wx.strokeStyle = `rgba(${40 + Math.random() * 30 | 0},${20 + Math.random() * 15 | 0},5,${0.1 + Math.random() * 0.14})`;
    wx.beginPath();
    const y = Math.random() * 400;
    wx.moveTo(0, y);
    for (let x = 0; x <= 1200; x += 40) wx.lineTo(x, y + Math.sin(x * 0.01 + i) * 6);
    wx.stroke();
  }
})();

const fur = Array.from({ length: 130 }, (_, i) => ({
  a: i / 130 * 6.283 + Math.random() * 0.04,
  l: 0.03 + Math.random() * 0.05,
  j: (Math.random() - 0.5) * 0.3
}));

/* ---------- Cat ---------- */
function drawCat(g, lx, ly, blink) {
  const hr = R * 0.78;
  const hx = cx + lx * R * 0.03;
  const hy = cy + R * 0.12 + ly * R * 0.02;

  let gradient = g.createRadialGradient(cx, cy + R * 0.55, R * 0.1, cx, cy + R * 0.7, R);
  gradient.addColorStop(0, '#ffffff');
  gradient.addColorStop(0.7, '#f1f3f6');
  gradient.addColorStop(1, '#d3dae3');
  g.fillStyle = gradient;
  g.beginPath();
  g.ellipse(cx, cy + R * 0.85, R * 1.05, R * 0.85, 0, 0, 7);
  g.fill();
  g.fillStyle = 'rgba(150,165,185,.28)';
  g.beginPath();
  g.ellipse(hx, hy + hr * 0.85, hr * 0.85, hr * 0.3, 0, 0, 7);
  g.fill();

  [-1, 1].forEach((side) => {
    const point = (a, b) => [hx + side * hr * a, hy + b * hr];
    g.fillStyle = '#fdfdfe';
    g.strokeStyle = '#dde3ea';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(...point(0.86, -0.15));
    g.quadraticCurveTo(...point(1.1, -0.75), ...point(0.98, -1.12));
    g.quadraticCurveTo(...point(0.55, -0.95), ...point(0.2, -0.85));
    g.closePath();
    g.fill();
    g.stroke();
    const innerGradient = g.createLinearGradient(...point(0.5, -0.3), ...point(0.9, -1));
    innerGradient.addColorStop(0, '#ffd3dc');
    innerGradient.addColorStop(1, '#ffb3c4');
    g.fillStyle = innerGradient;
    g.beginPath();
    g.moveTo(...point(0.74, -0.3));
    g.quadraticCurveTo(...point(0.93, -0.72), ...point(0.88, -0.97));
    g.quadraticCurveTo(...point(0.6, -0.84), ...point(0.38, -0.72));
    g.closePath();
    g.fill();
    g.strokeStyle = 'rgba(255,255,255,.95)';
    g.lineWidth = 2.2;
    g.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      g.beginPath();
      g.moveTo(...point(0.5 + i * 0.06, -0.62));
      g.lineTo(...point(0.56 + i * 0.08, -0.78 - i * 0.04));
      g.stroke();
    }
  });

  gradient = g.createRadialGradient(hx - hr * 0.2, hy - hr * 0.3, hr * 0.1, hx, hy, hr);
  gradient.addColorStop(0, '#ffffff');
  gradient.addColorStop(0.75, '#f6f8fa');
  gradient.addColorStop(1, '#d9e0e8');
  g.fillStyle = gradient;
  g.beginPath();
  g.ellipse(hx, hy, hr, hr * 0.9, 0, 0, 7);
  g.fill();
  g.lineCap = 'round';
  [['#dfe5ec', 2.2], ['#ffffff', 1.8]].forEach(([color, width]) => {
    g.strokeStyle = color;
    g.lineWidth = width;
    fur.forEach((hair, i) => {
      if ((color === '#ffffff') !== (i % 2 === 0)) return;
      const x1 = hx + Math.cos(hair.a) * hr * 0.97;
      const y1 = hy + Math.sin(hair.a) * hr * 0.87;
      const length = hr * hair.l * (hair.a > 0.3 && hair.a < 2.8 ? 1.7 : 1);
      g.beginPath();
      g.moveTo(x1, y1);
      g.lineTo(x1 + Math.cos(hair.a + hair.j) * length, y1 + Math.sin(hair.a + hair.j) * length);
      g.stroke();
    });
  });

  [-1, 1].forEach((side) => {
    const cheek = g.createRadialGradient(hx + side * hr * 0.6, hy + hr * 0.3, 2, hx + side * hr * 0.6, hy + hr * 0.3, hr * 0.2);
    cheek.addColorStop(0, 'rgba(255,140,175,.3)');
    cheek.addColorStop(1, 'rgba(255,140,175,0)');
    g.fillStyle = cheek;
    g.beginPath();
    g.arc(hx + side * hr * 0.6, hy + hr * 0.3, hr * 0.2, 0, 7);
    g.fill();
  });

  [-1, 1].forEach((side) => {
    const ex = hx + side * hr * 0.4 + lx * hr * 0.03;
    const ey = hy - hr * 0.03 + ly * hr * 0.02;
    const er = hr * 0.19;
    const shadow = g.createRadialGradient(ex, ey, er * 0.6, ex, ey, er * 2.1);
    shadow.addColorStop(0, 'rgba(165,182,205,.4)');
    shadow.addColorStop(1, 'rgba(165,182,205,0)');
    g.fillStyle = shadow;
    g.beginPath();
    g.arc(ex, ey, er * 2.1, 0, 7);
    g.fill();
    g.save();
    g.beginPath();
    g.ellipse(ex, ey, er * 1.12, er * 0.95, side * -0.12, 0, 7);
    g.clip();
    g.fillStyle = '#f4f9ff';
    g.fillRect(ex - er * 2, ey - er * 2, er * 4, er * 4);
    const ix = ex + lx * er * 0.22;
    const iy = ey + ly * er * 0.2;
    const ir = er * 0.92;
    const iris = g.createRadialGradient(ix, iy + ir * 0.3, ir * 0.1, ix, iy, ir);
    iris.addColorStop(0, '#c9e9ff');
    iris.addColorStop(0.45, '#4aa8f0');
    iris.addColorStop(0.85, '#1E88E5');
    iris.addColorStop(1, '#0b3d91');
    g.fillStyle = iris;
    g.beginPath();
    g.arc(ix, iy, ir, 0, 7);
    g.fill();
    g.strokeStyle = 'rgba(10,60,140,.3)';
    g.lineWidth = 1;
    for (let angle = 0; angle < 6.28; angle += 0.45) {
      g.beginPath();
      g.moveTo(ix + Math.cos(angle) * ir * 0.4, iy + Math.sin(angle) * ir * 0.4);
      g.lineTo(ix + Math.cos(angle) * ir * 0.92, iy + Math.sin(angle) * ir * 0.92);
      g.stroke();
    }
    g.fillStyle = '#050b16';
    g.beginPath();
    g.ellipse(ix, iy, ir * 0.3, ir * 0.64, 0, 0, 7);
    g.fill();
    g.fillStyle = '#fff';
    g.beginPath();
    g.arc(ix - ir * 0.3, iy - ir * 0.32, ir * 0.26, 0, 7);
    g.fill();
    g.beginPath();
    g.arc(ix + ir * 0.3, iy + ir * 0.3, ir * 0.11, 0, 7);
    g.fill();
    const lid = g.createLinearGradient(0, ey - er, 0, ey);
    lid.addColorStop(0, 'rgba(20,40,90,.4)');
    lid.addColorStop(1, 'rgba(20,40,90,0)');
    g.fillStyle = lid;
    g.fillRect(ex - er * 2, ey - er * 1.2, er * 4, er * 1.2);
    if (blink > 0) {
      g.fillStyle = '#f3f5f8';
      g.fillRect(ex - er * 2, ey - er * 2, er * 4, er * (1 + 2 * blink));
    }
    g.restore();
    g.strokeStyle = '#8b98ab';
    g.lineWidth = 2.4;
    g.beginPath();
    g.ellipse(ex, ey, er * 1.14, er * 0.97, side * -0.12, Math.PI * 1.05, Math.PI * 1.95);
    g.stroke();
  });

  const nx = hx + lx * hr * 0.03;
  const ny = hy + hr * 0.3;
  const nose = g.createLinearGradient(0, ny - hr * 0.08, 0, ny + hr * 0.08);
  nose.addColorStop(0, '#ffa3bd');
  nose.addColorStop(1, '#ff6f98');
  g.fillStyle = nose;
  g.beginPath();
  g.moveTo(nx - hr * 0.09, ny - hr * 0.04);
  g.quadraticCurveTo(nx, ny - hr * 0.1, nx + hr * 0.09, ny - hr * 0.04);
  g.quadraticCurveTo(nx + hr * 0.07, ny + hr * 0.04, nx, ny + hr * 0.08);
  g.quadraticCurveTo(nx - hr * 0.07, ny + hr * 0.04, nx - hr * 0.09, ny - hr * 0.04);
  g.fill();
  g.fillStyle = 'rgba(255,255,255,.6)';
  g.beginPath();
  g.ellipse(nx - hr * 0.03, ny - hr * 0.05, hr * 0.025, hr * 0.012, 0, 0, 7);
  g.fill();
  g.strokeStyle = '#a9a4b6';
  g.lineWidth = 2.2;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(nx, ny + hr * 0.08);
  g.lineTo(nx, ny + hr * 0.15);
  g.moveTo(nx, ny + hr * 0.15);
  g.quadraticCurveTo(nx - hr * 0.06, ny + hr * 0.24, nx - hr * 0.14, ny + hr * 0.17);
  g.moveTo(nx, ny + hr * 0.15);
  g.quadraticCurveTo(nx + hr * 0.06, ny + hr * 0.24, nx + hr * 0.14, ny + hr * 0.17);
  g.stroke();
  g.strokeStyle = 'rgba(110,124,145,.7)';
  g.lineWidth = 1.6;
  [-0.1, 0.05, 0.2].forEach((offset) => [-1, 1].forEach((side) => {
    g.beginPath();
    g.moveTo(nx + side * hr * 0.22, ny + hr * 0.08);
    g.quadraticCurveTo(nx + side * hr * 0.6, ny + (offset - 0.05) * hr, nx + side * hr * 1.1, ny + (offset + 0.08) * hr);
    g.stroke();
  }));
}

function drawBg(lx, ly, blink) {
  const gradient = bx.createRadialGradient(cx, cy * 0.6, R * 0.2, cx, cy, W * 0.8);
  gradient.addColorStop(0, '#FBF8F2');
  gradient.addColorStop(1, '#E9E0D0');
  bx.fillStyle = gradient;
  bx.fillRect(0, 0, W, W);
  drawCat(bx, lx, ly, blink);
  const tableY = cy + R * 0.8;
  bx.drawImage(wood, 0, tableY, W, W - tableY);
  bx.fillStyle = 'rgba(255,255,255,.4)';
  bx.fillRect(0, tableY, W, 3);
}

/* ---------- Water refraction ---------- */
const OA = Math.asin(0.6);
function clipWater() {
  ctx.beginPath();
  ctx.arc(cx, cy, R - 3, 0, 7);
  ctx.clip();
  ctx.beginPath();
  ctx.rect(0, waterY, W, W);
  ctx.clip();
}
function refract(time) {
  ctx.save();
  clipWater();
  const count = 56;
  const sliceHeight = (cy + R - waterY) / count;
  for (let i = 0; i < count; i++) {
    const y = waterY + i * sliceHeight;
    const ratio = (y + sliceHeight / 2 - cy) / R;
    const magnification = 1.1 + 0.14 * (1 - ratio * ratio);
    const wave = Math.sin(time * 0.0016 + i * 0.3) * 5 + Math.cos(time * 0.001 + i * 0.2) * 3;
    ctx.drawImage(bg, (cx - cx / magnification + wave / magnification) * D, (cy + (y - cy) / magnification) * D, (W / magnification) * D, (sliceHeight / magnification) * D, 0, y, W, sliceHeight + 0.6);
  }
  const waterGradient = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.2, R * 0.1, cx, cy, R);
  waterGradient.addColorStop(0, 'rgba(224,247,250,.2)');
  waterGradient.addColorStop(0.6, 'rgba(79,195,247,.26)');
  waterGradient.addColorStop(1, 'rgba(30,136,229,.55)');
  ctx.fillStyle = waterGradient;
  ctx.fillRect(0, 0, W, W);
  ctx.restore();
}

/* ---------- Plants, pebbles, and bubbles ---------- */
class Plant {
  constructor(x, y, height, leaves) {
    this.x = x;
    this.y = y;
    this.h = height;
    this.n = leaves;
    this.ph = Math.random() * 6.28;
  }
  draw(time) {
    const sway = Math.sin(time * 0.002 + this.ph) * R * 0.06;
    const scale = R / 380;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.strokeStyle = '#0277BD';
    ctx.lineWidth = 4.5 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(sway * 0.5, -this.h * 0.5, sway, -this.h);
    ctx.stroke();
    for (let i = 1; i <= this.n; i++) {
      const u = i / (this.n + 1);
      const leafX = 2 * (1 - u) * u * sway * 0.5 + u * u * sway;
      const leafY = 2 * (1 - u) * u * (-this.h * 0.5) + u * u * (-this.h);
      const side = i % 2 ? -1 : 1;
      const leafSize = 17 * scale * (1 - u * 0.25);
      ctx.save();
      ctx.translate(leafX, leafY);
      ctx.rotate(sway * 0.0072 + side * 0.65);
      ctx.fillStyle = i % 2 ? '#0288D1' : '#4FC3F7';
      ctx.beginPath();
      ctx.ellipse(side * leafSize * 0.5, 0, leafSize, leafSize * 0.42, 0, 0, 7);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }
}
function baseY(x) {
  return cy + Math.sqrt(Math.max(0, (R - 14) ** 2 - (x - cx) ** 2));
}

class Fish {
  constructor() {
    this.x = cx;
    this.y = cy + R * 0.1;
    this.vx = 1;
    this.vy = 0;
    this.a = 0;
    this.tw = 0;
    this.tx = cx;
    this.ty = this.y;
    this.tm = 0;
    this.flee = 0;
    this.air = false;
  }
  hit(px, py) {
    this.flee = 280;
    const dx = this.x - px;
    const dy = this.y - py;
    const distance = Math.hypot(dx, dy) || 1;
    const scale = R / 380;
    this.vx = dx / distance * 7 * scale;
    this.vy = dy / distance * 7 * scale;
  }
  update() {
    const scale = R / 380;
    const bound = R * 0.66;
    const top = waterY + 26 * scale;
    if (this.air) {
      this.vy += 0.32 * scale;
      this.x += this.vx;
      this.y += this.vy;
      this.tw += 0.3;
      if (Math.abs(this.x - cx) > R * 0.62) {
        this.x = cx + Math.sign(this.x - cx) * R * 0.62;
        this.vx *= -0.5;
      }
      this.a = Math.atan2(this.vy, this.vx);
      if (this.vy > 0 && this.y >= waterY) {
        this.air = false;
        splash(this.x, 1);
        this.vy *= 0.4;
        this.vx *= 0.5;
      }
      return;
    }
    if (this.flee > 0) {
      this.flee--;
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const distance = Math.hypot(dx, dy) || 1;
      this.tx = this.x + dx / distance * R;
      this.ty = this.y + dy / distance * R;
    } else if (++this.tm > 140 || Math.hypot(this.x - this.tx, this.y - this.ty) < 40 * scale) {
      const angle = Math.random() * 6.283;
      const distance = Math.random() * (bound - 30 * scale);
      this.tx = cx + Math.cos(angle) * distance;
      this.ty = Math.max(cy + Math.sin(angle) * distance, top + 10 * scale);
      this.tm = 0;
    }
    const fleeing = this.flee > 0;
    const acceleration = fleeing ? 0.012 : 0.003;
    const maxSpeed = (fleeing ? 5 : 2.2) * scale;
    this.vx += (this.tx - this.x) * acceleration;
    this.vy += (this.ty - this.y) * acceleration;
    this.vx *= 0.94;
    this.vy *= 0.94;
    const speed = Math.hypot(this.vx, this.vy);
    if (speed > maxSpeed) {
      this.vx *= maxSpeed / speed;
      this.vy *= maxSpeed / speed;
    }
    this.x += this.vx;
    this.y += this.vy;
    const distance = Math.hypot(this.x - cx, this.y - cy);
    if (distance > bound) {
      const angle = Math.atan2(this.y - cy, this.x - cx);
      this.x = cx + Math.cos(angle) * bound;
      this.y = cy + Math.sin(angle) * bound;
      this.vx *= -0.6;
      this.vy *= -0.6;
    }
    if (fleeing && this.y < top + 20 * scale && this.vy < 0 && Math.abs(this.x - cx) < R * 0.55 && Math.random() < 0.05) {
      this.air = true;
      this.vy = -(9.5 + Math.random() * 2) * scale;
      this.vx = clamp(this.vx, -2.5 * scale, 2.5 * scale);
      splash(this.x, 0.6);
      return;
    }
    if (this.y < top) {
      this.y = top;
      this.vy = Math.abs(this.vy) * 0.3;
    }
    if (speed > 0.08) {
      let difference = Math.atan2(this.vy, this.vx) - this.a;
      while (difference < -Math.PI) difference += 6.283;
      while (difference > Math.PI) difference -= 6.283;
      this.a += difference * 0.1;
    }
    this.tw += 0.16 * (1 + speed * 0.6 / scale);
  }
  draw() {
    const size = 36;
    const tailWave = Math.sin(this.tw) * 0.45;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.a);
    if (Math.cos(this.a) < 0) ctx.scale(1, -1);
    ctx.scale(R / 380, R / 380);
    ctx.save();
    ctx.translate(-size * 0.65, 0);
    ctx.rotate(tailWave);
    const tailGradient = ctx.createLinearGradient(0, 0, -size, 0);
    tailGradient.addColorStop(0, '#FF5722');
    tailGradient.addColorStop(1, 'rgba(255,171,145,.85)');
    ctx.fillStyle = tailGradient;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-size * 0.6, -size * 0.65, -size, -size * 0.55);
    ctx.quadraticCurveTo(-size * 0.7, 0, -size, size * 0.55);
    ctx.quadraticCurveTo(-size * 0.6, size * 0.65, 0, 0);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.55)';
    ctx.lineWidth = 1.1;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-size * 0.9, i * size * 0.13);
      ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = '#FF7043';
    ctx.beginPath();
    ctx.moveTo(-size * 0.2, -size * 0.45);
    ctx.quadraticCurveTo(0, -size * 0.95, size * 0.25, -size * 0.42);
    ctx.quadraticCurveTo(-size * 0.1, -size * 0.4, -size * 0.2, -size * 0.45);
    ctx.fill();
    const bodyGradient = ctx.createRadialGradient(size * 0.2, -size * 0.2, 2, 0, 0, size);
    bodyGradient.addColorStop(0, '#FFE0B2');
    bodyGradient.addColorStop(0.35, '#FF7043');
    bodyGradient.addColorStop(0.85, '#E64A19');
    bodyGradient.addColorStop(1, '#BF360C');
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, size, size * 0.56, 0, 0, 7);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.25)';
    ctx.lineWidth = 1;
    for (let x = -size * 0.4; x < size * 0.3; x += 8) {
      ctx.beginPath();
      ctx.arc(x, 0, 6, -1.25, 1.25);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,138,101,.9)';
    ctx.beginPath();
    ctx.ellipse(-size * 0.05, size * 0.36, size * 0.35, size * 0.16, 0.98, 0, 7);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(size * 0.48, -size * 0.15, size * 0.23, 0, 7);
    ctx.fill();
    ctx.fillStyle = '#1A1A1A';
    ctx.beginPath();
    ctx.arc(size * 0.54, -size * 0.15, size * 0.14, 0, 7);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(size * 0.58, -size * 0.21, size * 0.06, 0, 7);
    ctx.fill();
    ctx.restore();
  }
}

/* ---------- Paw ---------- */
const armFur = Array.from({ length: 150 }, () => ({
  x: (Math.random() - 0.5) * 80,
  y: 30 + Math.random() * 430,
  l: 7 + Math.random() * 10,
  a: (Math.random() - 0.5) * 0.5,
  s: Math.random() < 0.45
}));
const tuft = Array.from({ length: 30 }, (_, i) => ({
  a: i / 30 * 6.283 + Math.random() * 0.1,
  l: 6 + Math.random() * 7,
  j: (Math.random() - 0.5) * 0.4
}));
function drawPaw() {
  if (paw.e < 0.01) return;
  const baseX = cx + R * 0.95;
  const baseYPosition = W + 80;
  const x = baseX + (paw.x - baseX) * paw.e;
  const y = baseYPosition + (paw.y - baseYPosition) * paw.e;
  const angle = Math.atan2(paw.y - baseYPosition, paw.x - baseX);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle + Math.PI / 2);
  ctx.scale(R / 380 * 1.1, R / 380 * 1.1);
  ctx.lineCap = 'round';
  ctx.save();
  ctx.shadowColor = 'rgba(25,40,70,.35)';
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 10;
  const armGradient = ctx.createLinearGradient(-42, 0, 42, 0);
  armGradient.addColorStop(0, '#c9d2de');
  armGradient.addColorStop(0.3, '#f7f9fb');
  armGradient.addColorStop(0.55, '#ffffff');
  armGradient.addColorStop(0.85, '#e4e9f0');
  armGradient.addColorStop(1, '#bcc6d3');
  ctx.fillStyle = armGradient;
  ctx.beginPath();
  ctx.moveTo(-31, 4);
  ctx.bezierCurveTo(-33, 70, -39, 160, -46, 900);
  ctx.lineTo(46, 900);
  ctx.bezierCurveTo(39, 160, 33, 70, 31, 4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  armFur.forEach((hair) => {
    const width = 31 + hair.y / 900 * 15;
    const hairX = clamp(hair.x, -width + 4, width - 4);
    ctx.strokeStyle = hair.s ? 'rgba(170,184,202,.55)' : 'rgba(255,255,255,.9)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(hairX, hair.y);
    ctx.lineTo(hairX + Math.sin(hair.a) * hair.l, hair.y - Math.cos(hair.a) * hair.l);
    ctx.stroke();
  });
  const pawGradient = ctx.createRadialGradient(-9, -14, 3, 0, 0, 44);
  pawGradient.addColorStop(0, '#fff');
  pawGradient.addColorStop(0.7, '#f6f8fa');
  pawGradient.addColorStop(1, '#d5dce6');
  ctx.fillStyle = pawGradient;
  ctx.strokeStyle = 'rgba(165,180,200,.6)';
  ctx.lineWidth = 1.3;
  const toes = [[-24, -25, 12.5, 15, -0.35], [-8.5, -35, 12, 15, -0.1], [8.5, -35, 12, 15, 0.1], [24, -25, 12.5, 15, 0.35]];
  toes.forEach(([toeX, toeY, rx, ry, rotation]) => {
    ctx.beginPath();
    ctx.ellipse(toeX, toeY, rx, ry, rotation, 0, 7);
    ctx.fill();
    ctx.stroke();
  });
  ctx.beginPath();
  ctx.ellipse(0, 0, 35, 33, 0, 0, 7);
  ctx.fill();
  ctx.strokeStyle = 'rgba(140,156,180,.45)';
  ctx.lineWidth = 1.6;
  [[-16, -14, -16, -28], [0, -20, 0, -36], [16, -14, 16, -28]].forEach(([x1, y1, x2, y2]) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  });
  const drawPad = (x, y, rx, ry, rotation = 0) => {
    const gradient = ctx.createRadialGradient(x - rx * 0.3, y - ry * 0.4, 1, x, y, Math.max(rx, ry) * 1.1);
    gradient.addColorStop(0, '#ffc2d2');
    gradient.addColorStop(0.6, '#f98aaa');
    gradient.addColorStop(1, '#e0638b');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rotation, 0, 7);
    ctx.fill();
    ctx.strokeStyle = 'rgba(180,60,100,.35)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.6)';
    ctx.beginPath();
    ctx.ellipse(x - rx * 0.28, y - ry * 0.42, rx * 0.3, ry * 0.16, -0.3, 0, 7);
    ctx.fill();
  };
  drawPad(0, 10, 17, 11);
  drawPad(-11, 1, 8, 7.5, -0.3);
  drawPad(11, 1, 8, 7.5, 0.3);
  drawPad(0, -3, 7, 6);
  toes.forEach(([toeX, toeY, rx, ry, rotation]) => drawPad(toeX * 0.9, toeY + 3, rx * 0.52, ry * 0.46, rotation));
  ctx.strokeStyle = 'rgba(255,255,255,.95)';
  ctx.lineWidth = 2.2;
  tuft.forEach((hair) => {
    if (Math.sin(hair.a) < -0.75) return;
    const x1 = Math.cos(hair.a) * 31;
    const y1 = Math.sin(hair.a) * 29;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + Math.cos(hair.a + hair.j) * hair.l, y1 + Math.sin(hair.a + hair.j) * hair.l);
    ctx.stroke();
  });
  ctx.restore();
}

/* ---------- Aquarium setup ---------- */
function splash(x, power) {
  const scale = R / 380;
  ripples.push({ x, y: waterY, r: 6, a: 0.9, flat: 1 }, { x, y: waterY, r: -16, a: 0.65, flat: 1 });
  tone(520, 140, 0.25, 0.08 + 0.2 * power);
  for (let i = 0; i < 4 + 12 * power; i++) {
    drops.push({
      x: x + (Math.random() - 0.5) * 20 * scale,
      y: waterY - 4,
      vx: (Math.random() - 0.5) * 5 * scale,
      vy: -(2 + Math.random() * 5) * scale,
      r: (1.5 + Math.random() * 2.5) * scale,
      a: 1
    });
  }
}
function build() {
  pebbles.length = 0;
  bubbles.length = 0;
  plants.length = 0;
  const colors = ['#0D47A1', '#1565C0', '#0288D1', '#E0F7FA', '#FF8A65', '#D7CCC8'];
  for (let i = 0; i < 46; i++) {
    const x = cx + (Math.random() - 0.5) * R * 1.15;
    const rx = (Math.random() * 9 + 7) * R / 380;
    pebbles.push({ x, y: baseY(x) - Math.random() * R * 0.06 - 6, rx, ry: rx * (Math.random() * 0.35 + 0.5), c: colors[Math.random() * colors.length | 0] });
  }
  [[-0.42, 0.68, 6], [0.4, 0.72, 7]].forEach(([offset, height, leaves]) => {
    const x = cx + offset * R;
    plants.push(new Plant(x, baseY(x) - 4, R * height, leaves));
  });
  for (let i = 0; i < 28; i++) {
    bubbles.push({
      x: cx + (Math.random() - 0.5) * R * 1.2,
      y: cy + Math.random() * R * 0.8,
      r: (Math.random() * 5 + 2) * R / 380,
      sp: Math.random() * 1.3 + 0.6,
      w: Math.random() * 6.28,
      ws: Math.random() * 0.05 + 0.02,
      o: Math.random() * 0.5 + 0.35
    });
  }
  fish = new Fish();
}
function resize() {
  const wrapper = $('wrap');
  W = Math.max(280, Math.floor(Math.min(wrapper.clientWidth - 8, wrapper.clientHeight - 8, 960)));
  D = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = cv.height = bg.width = bg.height = Math.round(W * D);
  cv.style.width = cv.style.height = `${W}px`;
  ctx.setTransform(D, 0, 0, D, 0, 0);
  bx.setTransform(D, 0, 0, D, 0, 0);
  cx = W / 2;
  cy = W * 0.52;
  R = W * 0.42;
  waterY = cy - 0.48 * R;
  mouse.x = mouse.tx = cx;
  mouse.y = mouse.ty = cy;
  build();
}
window.addEventListener('resize', resize);
resize();

/* ---------- Pointer interaction ---------- */
function updatePointer(event) {
  const bounds = cv.getBoundingClientRect();
  mouse.tx = (event.clientX - bounds.left) * W / bounds.width;
  mouse.ty = (event.clientY - bounds.top) * W / bounds.height;
}
window.addEventListener('pointermove', (event) => {
  updatePointer(event);
  if (down) {
    paw.x = mouse.tx;
    paw.y = mouse.ty;
  }
});
cv.addEventListener('pointerdown', (event) => {
  initAudio();
  updatePointer(event);
  if (Math.hypot(mouse.tx - cx, mouse.ty - cy) <= R * 1.15) {
    down = true;
    paw.t = 1;
    paw.x = mouse.tx;
    paw.y = mouse.ty;
    if (paw.y > waterY && Math.hypot(paw.x - cx, paw.y - cy) < R - 6) {
      ripples.push({ x: paw.x, y: paw.y, r: 8, a: 0.9 });
      tone(480, 120, 0.22, 0.25);
    }
  }
});
window.addEventListener('pointerup', () => {
  down = false;
  paw.t = 0;
});
window.addEventListener('pointercancel', () => {
  down = false;
  paw.t = 0;
});

/* ---------- Animation loop ---------- */
function frame(time) {
  const scale = R / 380;
  const halfWaterWidth = Math.sqrt(R * R - (waterY - cy) ** 2);
  mouse.x += (mouse.tx - mouse.x) * 0.1;
  mouse.y += (mouse.ty - mouse.y) * 0.1;
  paw.e += (paw.t - paw.e) * 0.2;
  const lx = clamp((mouse.x - cx) / R, -1, 1);
  const ly = clamp((mouse.y - cy) / R, -1, 1);
  const phase = time % 4300;
  const blink = phase < 170 ? Math.sin(phase / 170 * Math.PI) : 0;

  drawBg(lx, ly, blink);
  ctx.clearRect(0, 0, W, W);
  ctx.drawImage(bg, 0, 0, W, W);
  ctx.fillStyle = 'rgba(30,20,10,.32)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + R * 0.97, R * 0.82, R * 0.12, 0, 0, 7);
  ctx.fill();
  ctx.fillStyle = 'rgba(190,230,255,.22)';
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.ellipse(cx + i * R * 0.2 + Math.sin(time * 0.002 + i) * 8, cy + R * 0.98, R * 0.08, R * 0.025, 0, 0, 7);
    ctx.fill();
  }

  refract(time);
  pebbles.forEach((pebble) => {
    ctx.fillStyle = pebble.c;
    ctx.beginPath();
    ctx.ellipse(pebble.x, pebble.y, pebble.rx, pebble.ry, 0, 0, 7);
    ctx.fill();
  });
  plants.forEach((plant) => plant.draw(time));

  if (paw.t && paw.e > 0.75 && !fish.air && Math.hypot(paw.x - fish.x, paw.y - fish.y) < R * 0.11 && fish.flee < 200) {
    fish.hit(paw.x, paw.y);
    ripples.push({ x: fish.x, y: fish.y, r: 8, a: 0.9 });
    tone(300, 90, 0.18, 0.2);
  }
  fish.update();
  fish.draw();

  ctx.strokeStyle = 'rgba(255,255,255,.85)';
  ctx.lineWidth = 1;
  bubbles.forEach((bubble) => {
    bubble.y -= bubble.sp;
    bubble.w += bubble.ws;
    bubble.x += Math.sin(bubble.w) * 0.5;
    if (bubble.y < waterY + 6 || Math.hypot(bubble.x - cx, bubble.y - cy) > R - 14) {
      bubble.y = cy + R * 0.65 + Math.random() * 20;
      bubble.x = cx + (Math.random() - 0.5) * R * 1.1;
      if (Math.random() < 0.08) tone(700 + Math.random() * 300, 1050, 0.08, 0.04);
    }
    ctx.fillStyle = `rgba(224,247,250,${bubble.o})`;
    ctx.beginPath();
    ctx.arc(bubble.x, bubble.y, bubble.r, 0, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.95)';
    ctx.beginPath();
    ctx.arc(bubble.x - bubble.r * 0.3, bubble.y - bubble.r * 0.3, bubble.r * 0.25, 0, 7);
    ctx.fill();
  });

  ctx.fillStyle = 'rgba(190,230,255,.26)';
  ctx.beginPath();
  ctx.ellipse(cx, waterY, halfWaterWidth - 3, R * 0.045, 0, 0, 7);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.65)';
  ctx.lineWidth = 2;
  ctx.stroke();

  for (let i = ripples.length - 1; i >= 0; i--) {
    const ripple = ripples[i];
    ripple.r += ripple.flat ? 2.6 : 3.2;
    ripple.a -= ripple.flat ? 0.013 : 0.022;
    if (ripple.a <= 0) {
      ripples.splice(i, 1);
      continue;
    }
    if (ripple.r <= 0) continue;
    ctx.save();
    if (ripple.flat) {
      ctx.beginPath();
      ctx.ellipse(cx, waterY, halfWaterWidth - 3, R * 0.05, 0, 0, 7);
      ctx.clip();
    } else {
      clipWater();
    }
    ctx.strokeStyle = `rgba(255,255,255,${ripple.a})`;
    ctx.lineWidth = ripple.flat ? 3 : 4;
    ctx.beginPath();
    if (ripple.flat) ctx.ellipse(ripple.x, waterY, ripple.r, ripple.r * 0.2, 0, 0, 7);
    else ctx.arc(ripple.x, ripple.y, ripple.r, 0, 7);
    ctx.stroke();
    ctx.restore();
  }

  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(13,71,161,.22)';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.arc(cx, cy, R - 9, -OA, Math.PI + OA);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.88)';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(cx, cy, R, -OA, Math.PI + OA);
  ctx.stroke();
  [[0.6, 0.92, 14, 0.6], [0.08, 0.3, 10, 0.4], [-0.95, -0.82, 10, 0.5]].forEach(([start, end, width, opacity]) => {
    ctx.strokeStyle = `rgba(255,255,255,${opacity})`;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.arc(cx, cy, R - 18, start * Math.PI, end * Math.PI);
    ctx.stroke();
  });
  ctx.strokeStyle = 'rgba(255,255,255,.92)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.ellipse(cx, cy - 0.6 * R, R * 0.8, R * 0.07, 0, 0, 7);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(120,170,220,.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy - 0.6 * R, R * 0.8 - 5, R * 0.07 - 3, 0, 0, 7);
  ctx.stroke();

  for (let i = drops.length - 1; i >= 0; i--) {
    const drop = drops[i];
    drop.x += drop.vx;
    drop.y += drop.vy;
    drop.vy += 0.28 * scale;
    drop.a -= 0.012;
    if (drop.y > waterY + 4 || drop.a <= 0) {
      drops.splice(i, 1);
      continue;
    }
    ctx.fillStyle = `rgba(225,245,255,${drop.a})`;
    ctx.strokeStyle = `rgba(120,190,240,${drop.a})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(drop.x, drop.y, drop.r, 0, 7);
    ctx.fill();
    ctx.stroke();
  }

  drawPaw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
