// Five shader fragments — each a self-contained WebGL fragment shader string.
// Common uniforms:
//   u_res (vec2), u_time (float), u_mouse (vec2 0..1), u_mouseSmooth (vec2), u_click (float sec since click), u_clickPos (vec2)

const SHADER_HEADER = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_mouse;
uniform vec2 u_mouseSmooth;
uniform float u_click;
uniform vec2 u_clickPos;

// hash / noise
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  float a = hash(i), b = hash(i + vec2(1,0)), c = hash(i + vec2(0,1)), d = hash(i + vec2(1,1));
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
}
float fbm(vec2 p) {
  float v=0.0, a=0.5;
  for (int i=0;i<5;i++) { v += a*noise(p); p *= 2.02; a *= 0.5; }
  return v;
}
vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) { return a + b*cos(6.2831*(c*t+d)); }
`;

// 1. CITRUS FLOW — liquid orange pulp field, mouse pushes the flow
const SHADER_CITRUS_FLOW = SHADER_HEADER + `
void main() {
  vec2 uv = gl_FragCoord.xy / u_res.xy;
  float asp = u_res.x / u_res.y;
  vec2 p = uv; p.x *= asp;
  vec2 m = u_mouseSmooth; m.x *= asp;

  vec2 d = p - m;
  float dist = length(d);
  // flow field warped by mouse
  float t = u_time * 0.15;
  vec2 q = p + vec2(fbm(p*2.5 + t), fbm(p*2.5 - t + 3.14)) * 0.6;
  q -= d * 0.4 * exp(-dist * 1.8);
  float n = fbm(q * 2.2 + t * 0.8);
  float n2 = fbm(q * 4.0 - t * 0.5);

  // click shock
  float shock = exp(-u_click * 1.5) * smoothstep(0.35, 0.0, length(p - vec2(u_clickPos.x * asp, u_clickPos.y)) - u_click * 0.6);

  vec3 bg = vec3(0.04, 0.03, 0.035);
  vec3 orange = vec3(1.0, 0.48, 0.12);
  vec3 glow   = vec3(1.0, 0.72, 0.32);
  float v = smoothstep(0.35, 0.9, n) * 0.6 + smoothstep(0.55, 0.85, n2) * 0.4;
  vec3 col = mix(bg, orange, v);
  col += glow * smoothstep(0.75, 1.0, n) * 0.7;
  col += orange * exp(-dist * 2.5) * 0.35;
  col += vec3(1.0, 0.85, 0.5) * shock;

  // grain
  col += (hash(gl_FragCoord.xy + u_time) - 0.5) * 0.025;
  gl_FragColor = vec4(col, 1.0);
}
`;

// 2. PULP GRID — grid cells pulse/ripple from cursor; clicks send shockwave
const SHADER_PULP_GRID = SHADER_HEADER + `
void main() {
  vec2 uv = gl_FragCoord.xy / u_res.xy;
  float asp = u_res.x / u_res.y;
  vec2 p = uv; p.x *= asp;
  vec2 m = u_mouseSmooth; m.x *= asp;

  float cells = 28.0;
  vec2 gp = p * cells;
  vec2 id = floor(gp);
  vec2 fp = fract(gp) - 0.5;

  vec2 cellCenter = (id + 0.5) / cells;
  float dm = length(cellCenter - m);

  // ripple from mouse
  float ripple = sin(dm * 25.0 - u_time * 3.0) * exp(-dm * 2.5);
  // click shockwave
  vec2 cp = u_clickPos; cp.x *= asp;
  float cd = length(cellCenter - cp);
  float shock = sin(cd * 30.0 - u_click * 8.0) * exp(-max(0.0, u_click) * 1.2) * smoothstep(0.0, 0.2, u_click);

  float amp = 0.25 + ripple * 0.25 + shock * 0.35;
  float dot = length(fp);
  float cell = smoothstep(amp, amp - 0.04, dot);

  // color grade
  float hue = 0.5 + 0.5 * sin(dm * 6.0 - u_time * 0.5);
  vec3 orange = vec3(1.0, 0.50, 0.14);
  vec3 warm   = vec3(1.0, 0.78, 0.35);
  vec3 col = mix(vec3(0.035, 0.03, 0.04), mix(orange, warm, hue), cell);

  // cursor halo
  float halo = exp(-length(p - m) * 3.5) * 0.4;
  col += orange * halo;

  gl_FragColor = vec4(col, 1.0);
}
`;

// 3. VORONOI CELLS — juicy bubbles; clicks burst them outward
const SHADER_VORONOI = SHADER_HEADER + `
vec2 voronoi(vec2 p, float time, vec2 attractor, float attractStrength) {
  vec2 i = floor(p), f = fract(p);
  float minD = 10.0; vec2 minOffset = vec2(0);
  for (int y=-1;y<=1;y++) for (int x=-1;x<=1;x++) {
    vec2 g = vec2(float(x), float(y));
    vec2 o = vec2(hash(i+g), hash(i+g+17.0));
    o = 0.5 + 0.5 * sin(time + 6.2831 * o);
    // attract toward mouse
    vec2 cellPos = (i+g+o);
    vec2 toMouse = attractor - cellPos;
    cellPos += toMouse * attractStrength * 0.15;
    o = cellPos - i - g;
    vec2 r = g + o - f;
    float d = dot(r,r);
    if (d < minD) { minD = d; minOffset = g + o; }
  }
  return vec2(sqrt(minD), hash(i + minOffset));
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res.xy;
  float asp = u_res.x / u_res.y;
  vec2 p = uv; p.x *= asp;
  vec2 m = u_mouseSmooth; m.x *= asp;

  float scale = 6.0;
  vec2 sp = p * scale;
  vec2 sm = m * scale;
  // click burst — push cells outward from click
  vec2 cp = vec2(u_clickPos.x * asp, u_clickPos.y) * scale;
  float burst = exp(-u_click * 2.2) * smoothstep(0.0, 0.1, u_click);
  vec2 toC = sp - cp;
  sp += normalize(toC + 0.0001) * burst * 0.6;

  vec2 v = voronoi(sp, u_time * 0.25, sm, 0.6);
  float edge = smoothstep(0.02, 0.0, v.x - 0.0) + smoothstep(0.08, 0.0, v.x * 0.5);
  float cellFill = 1.0 - smoothstep(0.0, 0.5, v.x);

  vec3 orange = vec3(1.0, 0.50, 0.14);
  vec3 peach  = vec3(1.0, 0.82, 0.55);
  vec3 deep   = vec3(0.05, 0.03, 0.04);
  vec3 col = mix(deep, mix(orange, peach, v.y), cellFill * 0.9);
  // rim light on edges
  col += orange * smoothstep(0.05, 0.0, v.x) * 0.9;

  // cursor proximity glow
  float md = length(p - m);
  col += vec3(1.0, 0.7, 0.3) * exp(-md * 3.0) * 0.2;

  gl_FragColor = vec4(col, 1.0);
}
`;

// 4. LEDGER WAVES — iridescent horizontal bands, mouse bends them
const SHADER_LEDGER = SHADER_HEADER + `
void main() {
  vec2 uv = gl_FragCoord.xy / u_res.xy;
  float asp = u_res.x / u_res.y;
  vec2 p = uv; p.x *= asp;
  vec2 m = u_mouseSmooth; m.x *= asp;

  // bend field — each point bent toward mouse
  vec2 d = p - m;
  float bend = exp(-length(d) * 1.2);
  float y = p.y + bend * sin(p.x * 3.0 - u_time * 0.8) * 0.12;
  // flowing stripes
  float t = u_time * 0.25;
  float lanes = 14.0;
  float stripe = sin(y * lanes * 3.14159 + sin(p.x * 2.0 + t) * 1.2 + t);
  float bandMask = smoothstep(0.0, 0.02, abs(stripe));

  // click pulse travels along lanes
  float clickPulse = 0.0;
  if (u_click < 3.0 && u_click > 0.0) {
    float front = u_click * 0.9;
    float laneY = u_clickPos.y;
    float dy = abs(y - laneY);
    clickPulse = exp(-dy * 25.0) * smoothstep(front + 0.1, front, abs(p.x - u_clickPos.x * asp)) * (1.0 - u_click/3.0);
  }

  // iridescent hue along x
  float hue = fract(p.x * 0.35 + p.y * 0.1 + t * 0.15);
  vec3 c1 = palette(hue, vec3(0.5), vec3(0.5), vec3(1.0, 0.8, 0.6), vec3(0.0, 0.15, 0.30));
  // warm bias toward orange
  c1 = mix(c1, vec3(1.0, 0.55, 0.18), 0.55);

  vec3 bg = vec3(0.02, 0.02, 0.03);
  vec3 col = mix(bg, c1, (1.0 - bandMask) * 0.85);
  col += vec3(1.0, 0.7, 0.3) * clickPulse * 1.4;

  // cursor glow
  col += vec3(1.0, 0.6, 0.25) * exp(-length(d) * 3.5) * 0.25;

  // subtle scanline
  col *= 0.92 + 0.08 * sin(gl_FragCoord.y * 2.0);
  gl_FragColor = vec4(col, 1.0);
}
`;

// 5. SEGMENT RINGS — orange-slice segments radiating from cursor
const SHADER_SEGMENTS = SHADER_HEADER + `
void main() {
  vec2 uv = gl_FragCoord.xy / u_res.xy;
  float asp = u_res.x / u_res.y;
  vec2 p = (uv - 0.5); p.x *= asp;
  vec2 m = (u_mouseSmooth - 0.5); m.x *= asp;

  vec2 d = p - m;
  float r = length(d);
  float a = atan(d.y, d.x);

  // click ripple on radius
  float click = exp(-u_click * 2.0) * smoothstep(0.0, 0.05, u_click);

  // radial bands — slice segments
  float segments = 18.0;
  float seg = sin(a * segments + u_time * 0.15) * 0.5 + 0.5;

  // rings that breathe with time and pulse on click
  float ringFreq = 14.0;
  float ring = sin(r * ringFreq - u_time * 0.9 + click * 12.0);
  float ringMask = smoothstep(0.02, 0.0, abs(ring));

  // wedge edges (slice dividers)
  float wedgeEdge = smoothstep(0.02, 0.0, abs(fract(a * segments / 6.2831 + 0.5) - 0.5));

  // falloff from cursor
  float falloff = exp(-r * 1.8);

  vec3 bg = vec3(0.03, 0.025, 0.03);
  vec3 orange = vec3(1.0, 0.52, 0.15);
  vec3 pith   = vec3(1.0, 0.88, 0.62);

  vec3 col = bg;
  col = mix(col, orange, seg * falloff * 0.85);
  col += pith * ringMask * falloff * 0.6;
  col += orange * wedgeEdge * falloff * 0.35;
  // click flash
  col += vec3(1.0, 0.8, 0.4) * click * exp(-r * 3.0) * 1.5;
  // center dot
  col += pith * smoothstep(0.015, 0.0, r) * 1.5;

  gl_FragColor = vec4(col, 1.0);
}
`;

// Component factory — each wallpaper wraps a canvas + frame
function Wallpaper({ frag, title, subtitle, light = true }) {
  const ref = React.useRef(null);
  useShader(ref, frag);
  return (
    <WallpaperFrame title={title} subtitle={subtitle} light={light}>
      <canvas ref={ref} style={{ width: '100%', height: '100%', display: 'block', cursor: 'crosshair' }} />
    </WallpaperFrame>
  );
}

function CitrusFlow()  { return <Wallpaper frag={SHADER_CITRUS_FLOW} title="01 · Citrus Flow" subtitle="Liquid pulp field — flows toward the cursor, shocks on click" />; }
function PulpGrid()    { return <Wallpaper frag={SHADER_PULP_GRID}  title="02 · Pulp Grid"   subtitle="Ripple lattice — click sends a shockwave across the field" />; }
function VoronoiCells(){ return <Wallpaper frag={SHADER_VORONOI}    title="03 · Segments"   subtitle="Voronoi cells attracted to cursor — click bursts them open" />; }
function LedgerWaves() { return <Wallpaper frag={SHADER_LEDGER}     title="04 · Ledger"     subtitle="Iridescent data bands — bend under the cursor, ping on click" />; }
function SliceRings()  { return <Wallpaper frag={SHADER_SEGMENTS}   title="05 · Slice"      subtitle="Orange-slice segments radiate from the cursor; click to pulse" />; }

Object.assign(window, { CitrusFlow, PulpGrid, VoronoiCells, LedgerWaves, SliceRings });
