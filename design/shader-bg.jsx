// Compact Citrus Flow shader — used as brand background
function CitrusFlowBG({ style, interactive = true }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const gl = canvas.getContext('webgl', { premultipliedAlpha: false, antialias: true });
    if (!gl) return;
    const vs = `attribute vec2 a_pos; void main(){ gl_Position=vec4(a_pos,0.0,1.0);}`;
    const fs = `precision highp float;
      uniform vec2 u_res; uniform float u_time; uniform vec2 u_mouse;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);float a=hash(i),b=hash(i+vec2(1,0)),c=hash(i+vec2(0,1)),d=hash(i+vec2(1,1));vec2 u=f*f*(3.0-2.0*f);return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);}
      float fbm(vec2 p){float v=0.0,a=0.5;for(int i=0;i<5;i++){v+=a*noise(p);p*=2.02;a*=0.5;}return v;}
      void main(){
        vec2 uv=gl_FragCoord.xy/u_res.xy; float asp=u_res.x/u_res.y;
        vec2 p=uv; p.x*=asp; vec2 m=u_mouse; m.x*=asp;
        vec2 d=p-m; float dist=length(d);
        float t=u_time*0.15;
        vec2 q=p+vec2(fbm(p*2.5+t),fbm(p*2.5-t+3.14))*0.6;
        q-=d*0.4*exp(-dist*1.8);
        float n=fbm(q*2.2+t*0.8); float n2=fbm(q*4.0-t*0.5);
        vec3 bg=vec3(0.04,0.03,0.035);
        vec3 orange=vec3(1.0,0.48,0.12);
        vec3 glow=vec3(1.0,0.72,0.32);
        float v=smoothstep(0.35,0.9,n)*0.6+smoothstep(0.55,0.85,n2)*0.4;
        vec3 col=mix(bg,orange,v);
        col+=glow*smoothstep(0.75,1.0,n)*0.7;
        col+=orange*exp(-dist*2.5)*0.35;
        col+=(hash(gl_FragCoord.xy+u_time)-0.5)*0.025;
        gl_FragColor=vec4(col,1.0);
      }`;
    const mk=(t,s)=>{const x=gl.createShader(t);gl.shaderSource(x,s);gl.compileShader(x);return x;};
    const p=gl.createProgram();gl.attachShader(p,mk(gl.VERTEX_SHADER,vs));gl.attachShader(p,mk(gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);gl.useProgram(p);
    const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    const a=gl.getAttribLocation(p,'a_pos');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
    const uRes=gl.getUniformLocation(p,'u_res'),uTime=gl.getUniformLocation(p,'u_time'),uMouse=gl.getUniformLocation(p,'u_mouse');
    const state={m:[0.5,0.5],s:[0.5,0.5]};
    const resize=()=>{const dpr=Math.min(devicePixelRatio||1,2);canvas.width=canvas.clientWidth*dpr;canvas.height=canvas.clientHeight*dpr;gl.viewport(0,0,canvas.width,canvas.height);};
    resize(); const ro=new ResizeObserver(resize);ro.observe(canvas);
    const onMove=(e)=>{const r=canvas.getBoundingClientRect();state.m[0]=(e.clientX-r.left)/r.width;state.m[1]=1-(e.clientY-r.top)/r.height;};
    if(interactive)canvas.addEventListener('mousemove',onMove);
    let raf,t0=performance.now();
    const render=()=>{const t=(performance.now()-t0)/1000;state.s[0]+=(state.m[0]-state.s[0])*0.06;state.s[1]+=(state.m[1]-state.s[1])*0.06;gl.uniform2f(uRes,canvas.width,canvas.height);gl.uniform1f(uTime,t);gl.uniform2f(uMouse,state.s[0],state.s[1]);gl.drawArrays(gl.TRIANGLES,0,6);raf=requestAnimationFrame(render);};
    render();
    return()=>{cancelAnimationFrame(raf);ro.disconnect();canvas.removeEventListener('mousemove',onMove);};
  },[]);
  return <canvas ref={ref} style={{ width:'100%', height:'100%', display:'block', ...style }}/>;
}
Object.assign(window, { CitrusFlowBG });
