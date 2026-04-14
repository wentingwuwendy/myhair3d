'use strict';
// ═══════════════════════════════════════════════════════════════
//  MyHair 3D – Three.js Hair Studio
//  Head: procedural SphereGeometry + face cutout tinting
//  Hair: parametric CatmullRomCurve3 → TubeGeometry strands
// ═══════════════════════════════════════════════════════════════

// ── Color palette ─────────────────────────────────────────────
const HAIR_COLORS = [
  { name: '黑色',   hex: '#0a0a0a' },
  { name: '深棕',   hex: '#2c1a0e' },
  { name: '栗棕',   hex: '#5c3300' },
  { name: '暖棕',   hex: '#8b5e3c' },
  { name: '金棕',   hex: '#b8860b' },
  { name: '金色',   hex: '#d4a017' },
  { name: '亚麻',   hex: '#d2b48c' },
  { name: '浅金',   hex: '#f0d080' },
  { name: '玫瑰棕', hex: '#a0604a' },
  { name: '红棕',   hex: '#7b2d00' },
  { name: '紫棕',   hex: '#4a2060' },
  { name: '蓝黑',   hex: '#0d1020' },
];

// ── Presets ───────────────────────────────────────────────────
const PRESETS = [
  { id:'pixie',    label:'超短发',  icon:'✂',  params:{ length:8,  curl:5,  volume:40, bangs:10 } },
  { id:'bob',      label:'波波头',  icon:'💁', params:{ length:28, curl:8,  volume:55, bangs:25 } },
  { id:'shoulder', label:'肩长发',  icon:'💆', params:{ length:48, curl:15, volume:60, bangs:20 } },
  { id:'long',     label:'长直发',  icon:'👱', params:{ length:80, curl:5,  volume:50, bangs:10 } },
  { id:'wave',     label:'波浪卷',  icon:'〰', params:{ length:65, curl:55, volume:65, bangs:15 } },
  { id:'curly',    label:'大卷发',  icon:'🌀', params:{ length:55, curl:85, volume:80, bangs:20 } },
  { id:'bang',     label:'厚刘海',  icon:'💫', params:{ length:50, curl:20, volume:60, bangs:80 } },
  { id:'updo',     label:'丸子头',  icon:'🎀', params:{ length:15, curl:30, volume:90, bangs:5  } },
];

// ── Params state ──────────────────────────────────────────────
const params = {
  length: 60,
  curl: 30,
  volume: 60,
  bangs: 20,
  shine: 50,
  colorHex: '#5c3300',
};

// ═══════════════════════════════════════════════════════════════
//  THREE.JS SETUP
// ═══════════════════════════════════════════════════════════════
const canvas = document.getElementById('three-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x0d0d1a, 6, 14);

const camera3d = new THREE.PerspectiveCamera(45, 1, 0.01, 20);
camera3d.position.set(0, 0.15, 2.8);

const controls = new THREE.OrbitControls(camera3d, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 1.2;
controls.maxDistance = 5;
controls.maxPolarAngle = Math.PI * 0.85;
controls.target.set(0, 0.1, 0);

// ── Lights ────────────────────────────────────────────────────
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xfff5e0, 1.8);
keyLight.position.set(1.5, 2.5, 2);
keyLight.castShadow = true;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xe0e8ff, 0.6);
fillLight.position.set(-2, 1, -1);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xc084fc, 0.9);
rimLight.position.set(0, 2, -2.5);
scene.add(rimLight);

// ── Environment sphere (subtle) ───────────────────────────────
const envGeo = new THREE.SphereGeometry(8, 16, 8);
const envMat = new THREE.MeshBasicMaterial({ color: 0x0d0d1a, side: THREE.BackSide });
scene.add(new THREE.Mesh(envGeo, envMat));

// ═══════════════════════════════════════════════════════════════
//  HEAD MODEL
// ═══════════════════════════════════════════════════════════════
const headGroup = new THREE.Group();
scene.add(headGroup);

// Skull (slightly oval – taller than wide)
const skullGeo = new THREE.SphereGeometry(0.52, 64, 48);
// Elongate vertically
skullGeo.applyMatrix4(new THREE.Matrix4().makeScale(1.0, 1.12, 0.95));

const skullMat = new THREE.MeshStandardMaterial({
  color: 0xf0d5b8,
  roughness: 0.65,
  metalness: 0.0,
});
const skull = new THREE.Mesh(skullGeo, skullMat);
skull.castShadow = true;
headGroup.add(skull);

// ── Face features (simple geometry) ──────────────────────────
function addFaceFeatures() {
  // Eyes
  const eyeGeo = new THREE.SphereGeometry(0.055, 16, 16);
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x1a0a00, roughness: 0.3 });
  [-0.17, 0.17].forEach(x => {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(x, 0.08, 0.46);
    headGroup.add(eye);
    // Iris
    const irisMat = new THREE.MeshStandardMaterial({ color: 0x3d2000, roughness: 0.4 });
    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.038, 16, 16), irisMat);
    iris.position.set(x, 0.08, 0.495);
    headGroup.add(iris);
  });

  // Eyebrows
  const browGeo = new THREE.BoxGeometry(0.12, 0.018, 0.01);
  const browMat = new THREE.MeshStandardMaterial({ color: 0x1a0800, roughness: 0.9 });
  [-0.17, 0.17].forEach(x => {
    const brow = new THREE.Mesh(browGeo, browMat);
    brow.position.set(x, 0.185, 0.465);
    brow.rotation.z = x < 0 ? 0.08 : -0.08;
    headGroup.add(brow);
  });

  // Nose
  const noseGeo = new THREE.ConeGeometry(0.038, 0.1, 8);
  const noseMat = new THREE.MeshStandardMaterial({ color: 0xe8c8a0, roughness: 0.7 });
  const nose = new THREE.Mesh(noseGeo, noseMat);
  nose.rotation.x = -Math.PI / 2;
  nose.position.set(0, -0.06, 0.5);
  headGroup.add(nose);

  // Lips
  const lipGeo = new THREE.EllipseCurve ? null : null;
  const upperLipGeo = new THREE.SphereGeometry(0.075, 16, 8);
  upperLipGeo.applyMatrix4(new THREE.Matrix4().makeScale(1, 0.38, 0.5));
  const lipMat = new THREE.MeshStandardMaterial({ color: 0xc47060, roughness: 0.5 });
  const upperLip = new THREE.Mesh(upperLipGeo, lipMat);
  upperLip.position.set(0, -0.195, 0.475);
  headGroup.add(upperLip);

  const lowerLipGeo = new THREE.SphereGeometry(0.075, 16, 8);
  lowerLipGeo.applyMatrix4(new THREE.Matrix4().makeScale(1, 0.32, 0.48));
  const lowerLip = new THREE.Mesh(lowerLipGeo, lipMat);
  lowerLip.position.set(0, -0.235, 0.475);
  headGroup.add(lowerLip);

  // Ears
  const earGeo = new THREE.SphereGeometry(0.09, 16, 12);
  earGeo.applyMatrix4(new THREE.Matrix4().makeScale(0.45, 0.75, 0.4));
  const earMat = new THREE.MeshStandardMaterial({ color: 0xecc8a0, roughness: 0.7 });
  [-1, 1].forEach(side => {
    const ear = new THREE.Mesh(earGeo, earMat);
    ear.position.set(side * 0.545, 0.02, 0);
    headGroup.add(ear);
  });

  // Neck
  const neckGeo = new THREE.CylinderGeometry(0.22, 0.26, 0.35, 32);
  const neckMat = new THREE.MeshStandardMaterial({ color: 0xecc8a0, roughness: 0.65 });
  const neck = new THREE.Mesh(neckGeo, neckMat);
  neck.position.set(0, -0.72, 0);
  headGroup.add(neck);
}
addFaceFeatures();

// ═══════════════════════════════════════════════════════════════
//  HAIR SYSTEM
// ═══════════════════════════════════════════════════════════════
let hairGroup = new THREE.Group();
headGroup.add(hairGroup);

// ── Hair scalp anchor points ──────────────────────────────────
// We sample points on the upper hemisphere of the skull
// theta: polar angle from top (0=crown), phi: azimuth
function skullPoint(theta, phi, scale = 1.0) {
  // Skull is scaled: y*1.12, z*0.95
  const r = 0.52 * scale;
  return new THREE.Vector3(
    r * Math.sin(theta) * Math.sin(phi),
    r * 1.12 * Math.cos(theta),
    r * 0.95 * Math.sin(theta) * Math.cos(phi)
  );
}

// ── Hair material (physically based) ─────────────────────────
function makeHairMaterial(colorHex, shininess) {
  const col = new THREE.Color(colorHex);
  return new THREE.MeshStandardMaterial({
    color: col,
    roughness: 1.0 - shininess * 0.6,
    metalness: 0.0,
    transparent: true,
    opacity: 0.92,
    side: THREE.DoubleSide,
  });
}

// ── Build a single hair strand as TubeGeometry ───────────────
function buildStrand(origin, dir, length, curl, curlFreq, curlAxis, segments) {
  const points = [];
  let pos = origin.clone();
  let tangent = dir.clone().normalize();

  const stepLen = length / segments;
  const gravity = new THREE.Vector3(0, -0.012, 0);

  for (let i = 0; i <= segments; i++) {
    points.push(pos.clone());
    const t = i / segments;

    // Curl: oscillate perpendicular to tangent
    const curlStrength = curl * Math.sin(t * Math.PI * curlFreq) * stepLen;
    const perp = curlAxis.clone().multiplyScalar(curlStrength);

    // Gravity sag increases along strand
    const sag = gravity.clone().multiplyScalar(t * t * stepLen * 8);

    pos.add(tangent.clone().multiplyScalar(stepLen)).add(perp).add(sag);
  }

  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
  const tubeRadius = 0.003 + Math.random() * 0.002;
  return new THREE.TubeGeometry(curve, Math.max(segments, 6), tubeRadius, 4, false);
}

// ── Main hair rebuild function ────────────────────────────────
function rebuildHair() {
  // Remove old hair
  while (hairGroup.children.length) {
    const m = hairGroup.children[0];
    m.geometry.dispose();
    m.material.dispose();
    hairGroup.remove(m);
  }

  const shininess = params.shine / 100;
  const mat = makeHairMaterial(params.colorHex, shininess);

  const lengthFactor = params.length / 100;       // 0–1
  const curlFactor   = params.curl / 100;         // 0–1
  const volumeFactor = params.volume / 100;       // 0–1
  const bangsFactor  = params.bangs / 100;        // 0–1

  const hairLen = 0.05 + lengthFactor * 1.3;      // world units
  const curl    = curlFactor * 0.08;
  const curlFreq = 1.5 + curlFactor * 2.5;
  const strandCount = Math.floor(180 + volumeFactor * 320);
  const segments = Math.max(8, Math.floor(hairLen * 14));

  const geometries = [];

  // ── Zone 1: Crown + sides (upper hemisphere, theta 0→PI*0.7) ──
  const mainCount = Math.floor(strandCount * 0.85);
  for (let i = 0; i < mainCount; i++) {
    const t = i / mainCount;

    // Distribute: more on sides/back, less on front face
    // phi: spread full 360°, but weight toward back
    const phi = (t * Math.PI * 2) + (Math.random() - 0.5) * 0.4;
    // theta: from crown (0) to below-ear level
    const thetaMax = Math.PI * (0.45 + volumeFactor * 0.18);
    const theta = Math.pow(Math.random(), 0.6) * thetaMax;

    // Skip front-center zone (face area): phi ≈ 0 & theta > 0.3
    const isFront = (Math.abs(phi % (Math.PI * 2)) < Math.PI * 0.38 ||
                     Math.abs(phi % (Math.PI * 2)) > Math.PI * 1.62);
    if (isFront && theta > 0.28 && bangsFactor < 0.3) continue;
    if (isFront && theta > 0.45) continue; // always skip deep front

    const origin = skullPoint(theta, phi, 1.01);
    // Direction: radially outward from skull center, slightly downward
    const dir = origin.clone().normalize();
    dir.y -= 0.1 * (1 - Math.pow(theta / thetaMax, 0.5)); // gravity bias

    const curlAxis = new THREE.Vector3(-Math.sin(phi), 0, Math.cos(phi))
                       .multiplyScalar((Math.random() > 0.5 ? 1 : -1));

    const geo = buildStrand(origin, dir, hairLen, curl, curlFreq, curlAxis, segments);
    geometries.push(geo);
  }

  // ── Zone 2: Bangs (front top, theta 0.05→0.25, phi near 0) ──
  if (bangsFactor > 0.05) {
    const bangCount = Math.floor(bangsFactor * 80 + 20);
    for (let i = 0; i < bangCount; i++) {
      const phi = (Math.random() - 0.5) * Math.PI * 0.55; // front arc
      const theta = 0.05 + Math.random() * 0.22;
      const origin = skullPoint(theta, phi, 1.01);
      const dir = new THREE.Vector3(
        (Math.random() - 0.5) * 0.3,
        -0.3 - Math.random() * 0.2,
        0.8
      ).normalize();
      const bangLen = 0.08 + bangsFactor * 0.35;
      const curlAxis = new THREE.Vector3(1, 0, 0);
      const geo = buildStrand(origin, dir, bangLen, curl * 0.6, curlFreq, curlAxis, 8);
      geometries.push(geo);
    }
  }

  // ── Merge all geometries into one mesh (performance) ─────────
  if (geometries.length === 0) return;

  const merged = mergeGeometries(geometries);
  geometries.forEach(g => g.dispose());

  const mesh = new THREE.Mesh(merged, mat);
  mesh.castShadow = true;
  hairGroup.add(mesh);
}

// Simple geometry merge (THREE.BufferGeometryUtils not available via CDN easily)
function mergeGeometries(geos) {
  let totalPos = 0, totalIdx = 0;
  for (const g of geos) {
    totalPos += g.attributes.position.count;
    if (g.index) totalIdx += g.index.count;
  }

  const positions = new Float32Array(totalPos * 3);
  const normals   = new Float32Array(totalPos * 3);
  const indices   = totalIdx > 0 ? new Uint32Array(totalIdx) : null;

  let posOff = 0, idxOff = 0, vtxBase = 0;
  for (const g of geos) {
    const pos = g.attributes.position.array;
    const nor = g.attributes.normal ? g.attributes.normal.array : null;
    positions.set(pos, posOff * 3);
    if (nor) normals.set(nor, posOff * 3);
    if (indices && g.index) {
      const src = g.index.array;
      for (let j = 0; j < src.length; j++) indices[idxOff + j] = src[j] + vtxBase;
      idxOff += src.length;
    }
    vtxBase += g.attributes.position.count;
    posOff  += g.attributes.position.count;
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  merged.setAttribute('normal',   new THREE.BufferAttribute(normals, 3));
  if (indices) merged.setIndex(new THREE.BufferAttribute(indices, 1));
  merged.computeVertexNormals();
  return merged;
}

// ═══════════════════════════════════════════════════════════════
//  RESIZE HANDLER
// ═══════════════════════════════════════════════════════════════
function onResize() {
  const vp = document.getElementById('viewport');
  const w = vp.clientWidth, h = vp.clientHeight;
  renderer.setSize(w, h, false);
  camera3d.aspect = w / h;
  camera3d.updateProjectionMatrix();
}
window.addEventListener('resize', onResize);
onResize();

// ═══════════════════════════════════════════════════════════════
//  RENDER LOOP
// ═══════════════════════════════════════════════════════════════
let rebuildPending = false;
let rebuildTimer = null;

function scheduleRebuild() {
  if (rebuildTimer) clearTimeout(rebuildTimer);
  rebuildTimer = setTimeout(() => {
    rebuildHair();
    rebuildTimer = null;
  }, 80); // debounce 80ms
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  // Slow auto-rotate when idle
  if (!controls.autoRotate) headGroup.rotation.y += 0.003;
  renderer.render(scene, camera3d);
}

// ── Stop auto-rotate when user interacts ─────────────────────
canvas.addEventListener('pointerdown', () => { headGroup.rotation.y = 0; });

// ═══════════════════════════════════════════════════════════════
//  UI BINDINGS
// ═══════════════════════════════════════════════════════════════
function bindSlider(id, key) {
  const sl = document.getElementById(`sl-${id}`);
  const val = document.getElementById(`v-${id}`);
  sl.value = params[key];
  val.textContent = params[key];
  sl.addEventListener('input', () => {
    params[key] = parseInt(sl.value);
    val.textContent = sl.value;
    scheduleRebuild();
  });
}

function buildColorRow() {
  const row = document.getElementById('color-row');
  HAIR_COLORS.forEach(c => {
    const chip = document.createElement('div');
    chip.className = 'color-chip' + (c.hex === params.colorHex ? ' active' : '');
    chip.style.background = c.hex;
    chip.title = c.name;
    chip.addEventListener('click', () => {
      document.querySelectorAll('.color-chip').forEach(el => el.classList.remove('active'));
      chip.classList.add('active');
      params.colorHex = c.hex;
      scheduleRebuild();
    });
    row.appendChild(chip);
  });
}

function buildPresetGrid() {
  const grid = document.getElementById('preset-grid');
  PRESETS.forEach(preset => {
    const btn = document.createElement('button');
    btn.className = 'preset-btn';
    btn.innerHTML = `<span class="preset-icon">${preset.icon}</span>${preset.label}`;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      Object.assign(params, preset.params);
      // Sync sliders
      ['length','curl','volume','bangs'].forEach(k => {
        const sl = document.getElementById(`sl-${k}`);
        const vl = document.getElementById(`v-${k}`);
        if (sl) { sl.value = params[k]; vl.textContent = params[k]; }
      });
      scheduleRebuild();
    });
    grid.appendChild(btn);
  });
}

function bindDownload() {
  document.getElementById('btn-download').addEventListener('click', () => {
    renderer.render(scene, camera3d); // force fresh frame
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'myhair3d.png'; a.click();
      URL.revokeObjectURL(url);
    });
  });
}

// ═══════════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════════
bindSlider('length', 'length');
bindSlider('curl',   'curl');
bindSlider('volume', 'volume');
bindSlider('bangs',  'bangs');
bindSlider('shine',  'shine');
buildColorRow();
buildPresetGrid();
bindDownload();

// Build initial hair & hide loading overlay
rebuildHair();
document.getElementById('loading-overlay').style.display = 'none';

animate();
