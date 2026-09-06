import React, { useEffect, useRef } from 'react';
import { useThemeStore } from '../../store/themeStore';

export const Ambient3DBackground: React.FC = () => {
  const { palette } = useThemeStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isShaderActive = palette === 'sentinel' || palette === 'google-secops';

  useEffect(() => {
    if (!isShaderActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl') || (canvas.getContext('experimental-webgl') as WebGLRenderingContext);
    if (!gl) return;

    let animId: number;

    function syncSize() {
      if (!canvas) return;
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }
    syncSize();

    const vsSource = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

    const fsSourceGoogleSecops = `precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
varying vec2 v_texCoord;

vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    vec2 mouse = u_mouse / u_resolution.xy;
    float aspect = u_resolution.x / u_resolution.y;
    vec2 p = st * vec2(aspect, 1.0);

    float t = u_time * 0.16;

    float n1 = snoise(p * 1.8 + vec2(t * 0.25, t * 0.15));
    float n2 = snoise(p * 3.2 - vec2(t * 0.2, n1 * 0.6));
    float liquid = snoise(p * 1.2 + vec2(n2 * 0.4, t * 0.22));

    vec2 mPos = mouse * vec2(aspect, 1.0);
    float mDist = length(p - mPos);
    float mouseWave = sin(mDist * 16.0 - u_time * 2.8) * exp(-mDist * 3.8);

    vec3 googleDarkSurface = vec3(0.075, 0.078, 0.094);
    vec3 surfaceContainer = vec3(0.122, 0.129, 0.153);
    
    vec3 gBlue   = vec3(0.259, 0.522, 0.957);
    vec3 gRed    = vec3(0.918, 0.263, 0.208);
    vec3 gYellow = vec3(0.984, 0.737, 0.020);
    vec3 gGreen  = vec3(0.204, 0.659, 0.325);

    vec3 col = mix(googleDarkSurface, surfaceContainer, smoothstep(-0.6, 0.8, n1 + liquid * 0.5));

    float blueWeight = smoothstep(0.1, 0.9, n1 + mouseWave * 0.3);
    float greenWeight = smoothstep(0.2, 0.85, n2);
    float redWeight = smoothstep(0.4, 0.95, -n1 + liquid * 0.3);
    float yellowWeight = smoothstep(0.5, 0.9, -n2);

    col += gBlue * (blueWeight * 0.32);
    col += gGreen * (greenWeight * 0.22);
    col += gRed * (redWeight * 0.16);
    col += gYellow * (yellowWeight * 0.14);

    float caustics = pow(abs(liquid + mouseWave * 0.25), 2.5) * 0.3;
    col += vec3(0.85, 0.92, 1.0) * caustics;

    gl_FragColor = vec4(col, 1.0);
}`;

    const fsSourceSentinel = `precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
varying vec2 v_texCoord;

vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    vec2 mouse = u_mouse / u_resolution.xy;
    float aspect = u_resolution.x / u_resolution.y;
    vec2 p = st * vec2(aspect, 1.0);

    float t = u_time * 0.12;
    
    float n1 = snoise(p * 2.2 + vec2(t * 0.35, t * 0.18));
    float n2 = snoise(p * 3.8 - vec2(t * 0.25, n1 * 0.8));
    float liquid = snoise(p * 1.5 + vec2(n2 * 0.5, t * 0.2));

    vec2 mPos = mouse * vec2(aspect, 1.0);
    float mDist = length(p - mPos);
    float mouseWave = sin(mDist * 16.0 - u_time * 2.5) * exp(-mDist * 3.5);

    float caustics = pow(abs(liquid + mouseWave * 0.25), 3.0) * 2.0;
    
    vec3 bgBase = vec3(0.024, 0.043, 0.098);
    vec3 deepBlue = vec3(0.043, 0.114, 0.255);
    vec3 sentinelCyan = vec3(0.0, 0.96, 0.83);
    vec3 azureElectric = vec3(0.0, 0.47, 0.83);
    vec3 glassGlow = vec3(0.45, 0.85, 1.0);

    vec3 col = mix(bgBase, deepBlue, smoothstep(-0.6, 0.8, n1 + liquid * 0.5));
    col += azureElectric * (pow(max(0.0, n2), 2.5) * 0.45);
    col += sentinelCyan * (caustics * 0.28);
    col += glassGlow * (smoothstep(0.7, 0.98, liquid + caustics * 0.4) * 0.35);

    float grid = sin(st.y * u_resolution.y * 0.7) * 0.03;
    col -= grid;

    gl_FragColor = vec4(col, 1.0);
}`;

    const fsSource = palette === 'google-secops' ? fsSourceGoogleSecops : fsSourceSentinel;

    const vs = gl.createShader(gl.VERTEX_SHADER);
    if (!vs) return;
    gl.shaderSource(vs, vsSource);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    if (!fs) return;
    gl.shaderSource(fs, fsSource);
    gl.compileShader(fs);

    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');

    let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = window.innerHeight - e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      syncSize();
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, 0);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        gl.deleteProgram(prog);
      };
    }

    const render = (t: number) => {
      syncSize();
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      gl.deleteProgram(prog);
    };
  }, [palette, isShaderActive]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {isShaderActive && (
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-35" />
      )}
      {/* Primary Glowing Ambient Orb */}
      <div
        className="absolute w-[600px] h-[600px] -top-[180px] -left-[180px] rounded-full blur-[140px] opacity-30 pointer-events-none transition-colors duration-700"
        style={{ background: 'var(--color-primary-glow)' }}
      />
      {/* Secondary Accent Orb */}
      <div
        className="absolute w-[650px] h-[650px] top-[35%] -right-[200px] rounded-full blur-[160px] opacity-25 pointer-events-none transition-colors duration-700"
        style={{ background: 'var(--color-secondary-glow)' }}
      />
      {/* Subtle Grid Perspective Overlay */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(var(--color-text-primary) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
    </div>
  );
};

export default Ambient3DBackground;