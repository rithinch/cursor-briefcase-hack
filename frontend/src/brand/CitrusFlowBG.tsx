import { useEffect, useRef, useCallback, useMemo } from 'react';

const VERT = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const getDarkModeFrag = () => `
precision highp float;
uniform float u_time;
uniform vec2 u_res;
uniform vec2 u_mouse;

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float gnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(dot(hash2(i),              f),
        dot(hash2(i + vec2(1.,0.)), f - vec2(1.,0.)), u.x),
    mix(dot(hash2(i + vec2(0.,1.)), f - vec2(0.,1.)),
        dot(hash2(i + vec2(1.,1.)), f - vec2(1.,1.)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 m = mat2(0.8775, 0.4794, -0.4794, 0.8775);
  for (int i = 0; i < 5; i++) {
    v += a * gnoise(p);
    p = m * p * 2.01 + vec2(31.41, 27.18);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv    = gl_FragCoord.xy / u_res;
  float ar   = u_res.x / u_res.y;
  vec2 st    = vec2(uv.x * ar, uv.y) * 2.5;
  float t    = u_time * 0.12;

  vec2 mn   = vec2(u_mouse.x / u_res.x, 1.0 - u_mouse.y / u_res.y);
  float d   = length(uv - mn);
  vec2 mo   = (mn - uv) * 0.4 * exp(-d * 1.8) * 0.28;

  vec2 q = vec2(
    fbm(st + t         + mo * 2.0),
    fbm(st + vec2(5.2, 1.3) + t  + mo * 2.0)
  );

  vec2 r = vec2(
    fbm(st + 4.0 * q + vec2(1.7, 9.2)  + 0.150 * t),
    fbm(st + 4.0 * q + vec2(8.3, 2.8)  + 0.126 * t)
  );

  float f = clamp(fbm(st + 4.0 * r + mo * 3.0) * 0.5 + 0.5, 0.0, 1.0);

  vec3 ink   = vec3(0.043, 0.043, 0.059);
  vec3 deep  = vec3(0.027, 0.027, 0.039);
  vec3 rind  = vec3(1.000, 0.478, 0.102);
  vec3 rind6 = vec3(0.910, 0.396, 0.039);
  vec3 flesh = vec3(1.000, 0.690, 0.439);

  float lum  = smoothstep(0.0, 0.5, f);
  float mask = smoothstep(0.46, 0.78, f);
  float hi   = smoothstep(0.75, 0.96, f);

  vec3 warm  = mix(rind6, rind,  smoothstep(0.5, 0.80, f));
  warm       = mix(warm,  flesh, hi * 0.45);

  vec3 col   = mix(deep, ink, lum);
  col        = mix(col,  warm, mask * 0.62);

  gl_FragColor = vec4(col, 1.0);
}
`;

const getLightModeFrag = () => `
precision highp float;
uniform float u_time;
uniform vec2 u_res;
uniform vec2 u_mouse;

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float gnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(dot(hash2(i),              f),
        dot(hash2(i + vec2(1.,0.)), f - vec2(1.,0.)), u.x),
    mix(dot(hash2(i + vec2(0.,1.)), f - vec2(0.,1.)),
        dot(hash2(i + vec2(1.,1.)), f - vec2(1.,1.)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 m = mat2(0.8775, 0.4794, -0.4794, 0.8775);
  for (int i = 0; i < 5; i++) {
    v += a * gnoise(p);
    p = m * p * 2.01 + vec2(31.41, 27.18);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv    = gl_FragCoord.xy / u_res;
  float ar   = u_res.x / u_res.y;
  vec2 st    = vec2(uv.x * ar, uv.y) * 2.5;
  float t    = u_time * 0.12;

  vec2 mn   = vec2(u_mouse.x / u_res.x, 1.0 - u_mouse.y / u_res.y);
  float d   = length(uv - mn);
  vec2 mo   = (mn - uv) * 0.4 * exp(-d * 1.8) * 0.28;

  vec2 q = vec2(
    fbm(st + t         + mo * 2.0),
    fbm(st + vec2(5.2, 1.3) + t  + mo * 2.0)
  );

  vec2 r = vec2(
    fbm(st + 4.0 * q + vec2(1.7, 9.2)  + 0.150 * t),
    fbm(st + 4.0 * q + vec2(8.3, 2.8)  + 0.126 * t)
  );

  float f = clamp(fbm(st + 4.0 * r + mo * 3.0) * 0.5 + 0.5, 0.0, 1.0);

  // Food/Citrus theme palette - warm, appetizing colors
  vec3 cream     = vec3(1.000, 0.973, 0.941);  // creamy white
  vec3 peach     = vec3(1.000, 0.910, 0.800);  // soft peach
  vec3 tangerine = vec3(1.000, 0.647, 0.200);  // bright tangerine
  vec3 orange    = vec3(1.000, 0.478, 0.102);  // vibrant orange
  vec3 mango     = vec3(1.000, 0.769, 0.259);  // mango yellow-orange
  vec3 papaya    = vec3(1.000, 0.596, 0.278);  // papaya orange

  float lum  = smoothstep(0.0, 0.6, f);
  float mid  = smoothstep(0.35, 0.65, f);
  float warm = smoothstep(0.55, 0.85, f);
  float glow = smoothstep(0.78, 0.96, f);

  // Build layers: cream base -> peach -> tangerine/mango -> orange highlights
  vec3 col = mix(peach, cream, lum * 0.7);
  col = mix(col, mix(tangerine, mango, mid * 0.6), mid * 0.75);
  col = mix(col, mix(orange, papaya, warm * 0.5), warm * 0.65);
  col = mix(col, vec3(1.0, 0.85, 0.5), glow * 0.5);  // peachy glow

  gl_FragColor = vec4(col, 1.0);
}
`;

interface Props {
  interactive?: boolean;
  style?: React.CSSProperties;
  theme?: 'dark' | 'light';
}

export default function CitrusFlowBG({ interactive = true, style, theme = 'dark' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef  = useRef({ x: 0.5, y: 0.5 });
  const rafRef    = useRef<number>(0);
  const t0Ref     = useRef<number>(0);
  
  const FRAG = useMemo(() => 
    theme === 'light' ? getLightModeFrag() : getDarkModeFrag(), 
    [theme]
  );

  const buildGL = useCallback((canvas: HTMLCanvasElement) => {
    const gl = canvas.getContext('webgl');
    if (!gl) return null;

    const mkShader = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src.trim());
      gl.compileShader(s);
      return s;
    };

    const prog = gl.createProgram()!;
    gl.attachShader(prog, mkShader(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, mkShader(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    const loc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    return {
      gl,
      uTime:  gl.getUniformLocation(prog, 'u_time'),
      uRes:   gl.getUniformLocation(prog, 'u_res'),
      uMouse: gl.getUniformLocation(prog, 'u_mouse'),
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = buildGL(canvas);
    if (!ctx) return;

    const { gl, uTime, uRes, uMouse } = ctx;
    const dpr = devicePixelRatio;

    const resize = () => {
      canvas.width  = canvas.offsetWidth  * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) * dpr,
        y: (e.clientY - rect.top)  * dpr,
      };
    };

    if (interactive) window.addEventListener('mousemove', onMove);

    const render = (ts: number) => {
      if (!t0Ref.current) t0Ref.current = ts;
      const t = (ts - t0Ref.current) / 1000;
      gl.uniform1f(uTime, t);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform2f(uMouse, mouseRef.current.x, mouseRef.current.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      if (interactive) window.removeEventListener('mousemove', onMove);
    };
  }, [buildGL, interactive]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        ...style,
      }}
    />
  );
}
