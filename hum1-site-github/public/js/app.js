/* Hum1 front-end. Runtime config (prices, contacts) arrives from /js/config.js as window.H1. */
window.H1=window.H1||{};
var H1=window.H1;
H1.prices=H1.prices||{card:450,portal:1100,custom:700};
H1.prices.logo=H1.prices.logo||{start:150,standard:290,brand:490,bundle:15};

(function(){
  var reduce=false;
  var chips=[].slice.call(document.querySelectorAll('.chip')),
      views=[].slice.call(document.querySelectorAll('.v')),
      url=document.getElementById('url'),idx=0,timer;
  function show(i){
    idx=i;
    chips.forEach(function(c,j){c.setAttribute('aria-pressed',j===i?'true':'false')});
    views.forEach(function(v,j){var on=j===i;v.classList.toggle('on',on);if(on)url.textContent=v.dataset.url});
  }
  chips.forEach(function(c,i){c.addEventListener('click',function(){clearInterval(timer);show(i)})});
  if(!reduce)timer=setInterval(function(){show((idx+1)%views.length)},3200);

  function count(el){
    var to=+el.dataset.count,t0=null;
    function f(t){
      if(!t0)t0=t;
      var p=Math.min((t-t0)/1200,1),e=1-Math.pow(1-p,3);
      el.textContent=Math.round(to*e).toLocaleString('en-US');
      if(p<1)requestAnimationFrame(f);
    }
    requestAnimationFrame(f);
  }
  var rv=[].slice.call(document.querySelectorAll('.rv'));
  if(reduce||!('IntersectionObserver' in window)){
    rv.forEach(function(e){e.classList.add('in')});
  }else{
    document.documentElement.classList.add('js');
    var io=new IntersectionObserver(function(es){
      es.forEach(function(en){
        if(!en.isIntersecting)return;
        en.target.classList.add('in');
        var c=en.target.querySelector('[data-count]');
        if(c)count(c);
        io.unobserve(en.target);
      });
    },{threshold:.15});
    rv.forEach(function(e){io.observe(e)});
  }

  [].forEach.call(document.querySelectorAll('.card'),function(c){
    c.addEventListener('pointermove',function(e){
      var r=c.getBoundingClientRect();
      c.style.setProperty('--mx',(e.clientX-r.left)+'px');
      c.style.setProperty('--my',(e.clientY-r.top)+'px');
    });
  });
})();

(function(){
var d=document,root=d.documentElement;
var pg=d.getElementById('prog');
function sc(){var h=root.scrollHeight-innerHeight;pg.style.transform='scaleX('+(h>0?scrollY/h:0)+')'}
addEventListener('scroll',sc,{passive:true});sc();



var ts=d.getElementById('toast'),tt;
function ok(){ts.classList.add('on');clearTimeout(tt);tt=setTimeout(function(){ts.classList.remove('on')},1600)}
function fb(t){var a=d.createElement('textarea');a.value=t;d.body.appendChild(a);a.select();try{d.execCommand('copy');ok()}catch(e){/* copy not available */}a.remove()}
[].forEach.call(d.querySelectorAll('.cp'),function(c){
  function go(){var t=c.querySelector('b').textContent;try{navigator.clipboard.writeText(t).then(ok,function(){fb(t)})}catch(e){fb(t)}}
  c.addEventListener('click',go);
  c.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}});
});
})();
(function(){
var d=document;
[].forEach.call(d.querySelectorAll('.site'),function(s){
  var sh=s.querySelector('.shot');
  s.addEventListener('pointermove',function(e){var r=s.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;sh.style.setProperty('--ry',(x*14)+'deg');sh.style.setProperty('--rx',(-y*14)+'deg')});
  s.addEventListener('pointerleave',function(){sh.style.setProperty('--ry','0deg');sh.style.setProperty('--rx','0deg')});
});
var bgc=d.getElementById('bg'),bx=bgc.getContext('2d'),pc=d.getElementById('planet');
if(!bx)return; /* canvas unsupported: the CSS starfield stays */
var W,H,CX,CY,L,S=[],SH=[],mo={x:0,y:0},tm={x:0,y:0},w0=-1e9,last=0;
function rnd(a,b){return a+Math.random()*(b-a)}
function gs(){return(Math.random()+Math.random()+Math.random()+Math.random()-2)/2}
function size(){
  var dp=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;CX=W/2;CY=H/2;
  bgc.width=W*dp;bgc.height=H*dp;bx.setTransform(dp,0,0,dp,0,0);build();if(GL)psize();
}
function build(){
  var lw=Math.ceil(W*1.14),lh=Math.ceil(H*1.14),ox=(lw-W)/2,oy=(lh-H)/2,i,p,rr,g,w;
  L=d.createElement('canvas');L.width=lw;L.height=lh;var c=L.getContext('2d');
  c.fillStyle='#01030A';c.fillRect(0,0,lw,lh);
  [[.16,.2,.55,'40,75,115',.06],[.8,.28,.5,'55,48,95',.045],[.45,.9,.6,'30,60,100',.05]].forEach(function(n){
    var g=c.createRadialGradient(n[0]*lw,n[1]*lh,0,n[0]*lw,n[1]*lh,n[2]*Math.max(lw,lh));
    g.addColorStop(0,'rgba('+n[3]+','+n[4]+')');g.addColorStop(1,'rgba('+n[3]+',0)');c.fillStyle=g;c.fillRect(0,0,lw,lh);
  });
  var ang=-Math.atan2(lh*.85,lw),ca=Math.cos(ang),sa=Math.sin(ang),len=Math.hypot(lw,lh),bw=Math.min(lw,lh)*.2;
  function bp(k){var u=(Math.random()-.5)*len*1.15,v=gs()*bw*k;return[lw/2+u*ca-v*sa,lh/2+u*sa+v*ca]}
  c.globalCompositeOperation='lighter';
  for(i=0;i<70;i++){
    p=bp(.8);rr=bw*rnd(.5,1.3);w=Math.random()<.6?'205,220,255':'255,225,190';
    g=c.createRadialGradient(p[0],p[1],0,p[0],p[1],rr);g.addColorStop(0,'rgba('+w+',.055)');g.addColorStop(1,'rgba('+w+',0)');
    c.fillStyle=g;c.fillRect(p[0]-rr,p[1]-rr,rr*2,rr*2);
  }
  c.globalCompositeOperation='source-over';
  for(i=0;i<34;i++){
    p=bp(.28);rr=bw*rnd(.18,.4);g=c.createRadialGradient(p[0],p[1],0,p[0],p[1],rr);
    g.addColorStop(0,'rgba(2,6,13,.5)');g.addColorStop(1,'rgba(2,6,13,0)');c.fillStyle=g;c.fillRect(p[0]-rr,p[1]-rr,rr*2,rr*2);
  }
  c.globalCompositeOperation='lighter';
  var pal=['200,215,255','255,245,235','255,225,190','170,200,255'],dn=Math.min(7000,lw*lh/260);
  for(i=0;i<dn;i++){p=bp(.75);c.fillStyle='rgba('+pal[(Math.random()*4)|0]+','+rnd(.12,.55)+')';c.fillRect(p[0],p[1],1,1)}
  S=[];
  var n=Math.min(Math.max(Math.round(W*H/1700),600),1900),cols=[[200,215,255],[255,255,255],[255,250,240],[255,238,205],[255,215,175]],cw=[.22,.55,.75,.9,1];
  for(i=0;i<n;i++){
    var q=Math.random()<.35?bp(.9):[rnd(0,lw),rnd(0,lh)],r=.3+Math.pow(Math.random(),6)*1.6,t=Math.random(),ci=0;
    while(t>cw[ci])ci++;
    S.push({x:q[0]-ox,y:q[1]-oy,r:r,c:cols[ci],a:Math.min(1,.4+r*.35+Math.random()*.2),d:.25+Math.random()*.75,ph:Math.random()*6.283,sp:.6+Math.random()*2.4});
  }
}
function jump(){var n=performance.now();if(n-w0<1500)return;w0=n}
function frame(t){
  var dt=Math.min(.05,(t-last)/1000||0),ts=t/1000,i,s,g,m;last=t;
  tm.x+=(mo.x-tm.x)*.05;tm.y+=(mo.y-tm.y)*.05;
  var k=(t-w0)/1400,wp=k>=0&&k<1?Math.pow(Math.sin(Math.PI*k),1.4):0,sy=scrollY;
  var oy=(L.height-H)/2,xs=-(L.width-W)/2-tm.x*12,ys=-oy-Math.min(sy*.03,oy-10)-tm.y*12;
  bx.globalCompositeOperation='source-over';bx.drawImage(L,xs,ys);
  for(i=0;i<S.length;i++){
    s=S[i];
    var x=s.x-tm.x*s.d*18,y=(((s.y-tm.y*s.d*18-sy*s.d*.08)%H)+H)%H,al=s.a*(.84+.16*Math.sin(ts*s.sp+s.ph));
    if(wp>.02){
      var dx=x-CX,dy=y-CY,f=wp*s.d*.85;
      bx.strokeStyle='rgba('+s.c+','+al+')';bx.lineWidth=s.r*1.1+.3;bx.beginPath();bx.moveTo(x+dx*f*.15,y+dy*f*.15);bx.lineTo(x+dx*f,y+dy*f);bx.stroke();continue;
    }
    bx.fillStyle='rgba('+s.c+','+al+')';bx.beginPath();bx.arc(x,y,s.r,0,6.283);bx.fill();
    if(s.r>1.15){
      var R=s.r*7;g=bx.createRadialGradient(x,y,0,x,y,R);g.addColorStop(0,'rgba('+s.c+','+al*.2+')');g.addColorStop(1,'rgba('+s.c+',0)');
      bx.fillStyle=g;bx.fillRect(x-R,y-R,R*2,R*2);
      
    }
  }
  {
    if(Math.random()<.004&&SH.length<2)SH.push({x:rnd(W*.1,W*.9),y:rnd(0,H*.4),vx:rnd(800,1100),vy:rnd(260,480),l:0,m:rnd(.55,.95)});
    for(i=SH.length-1;i>=0;i--){
      m=SH[i];m.l+=dt;m.x+=m.vx*dt;m.y+=m.vy*dt;
      var a=Math.sin(Math.PI*Math.min(m.l/m.m,1)),tl=.14;
      g=bx.createLinearGradient(m.x,m.y,m.x-m.vx*tl,m.y-m.vy*tl);g.addColorStop(0,'rgba(255,255,255,'+a+')');g.addColorStop(1,'rgba(160,220,255,0)');
      bx.strokeStyle=g;bx.lineWidth=1.6;bx.beginPath();bx.moveTo(m.x,m.y);bx.lineTo(m.x-m.vx*tl,m.y-m.vy*tl);bx.stroke();
      if(m.l>m.m)SH.splice(i,1);
    }
  }
  if(wp>.01){
    bx.globalCompositeOperation='lighter';
    g=bx.createRadialGradient(CX,CY,0,CX,CY,Math.max(W,H)*.6);g.addColorStop(0,'rgba(120,230,235,'+wp*.4+')');g.addColorStop(1,'rgba(120,230,235,0)');
    bx.fillStyle=g;bx.fillRect(0,0,W,H);bx.globalCompositeOperation='source-over';
  }
  if(GL)drawPlanet(ts);
  requestAnimationFrame(frame);
}
addEventListener('pointermove',function(e){mo.x=e.clientX/W-.5;mo.y=e.clientY/H-.5},{passive:true});
var rz;addEventListener('resize',function(){clearTimeout(rz);rz=setTimeout(size,150)});
size();requestAnimationFrame(frame);
[].forEach.call(d.querySelectorAll('a[href^="#"]'),function(a){a.addEventListener('click',jump)});
d.getElementById('theme').addEventListener('click',jump);
setTimeout(jump,950);

/* planet: WebGL */
var gl,GL=false,PP,PU={},TW=2048,TH=1024;
function src(f){var t=f.toString();return t.slice(t.indexOf('/*')+2,t.lastIndexOf('*/'))}
var NZ=src(function(){/*
precision highp float;
vec3 h33(vec3 p){p=vec3(dot(p,vec3(127.1,311.7,74.7)),dot(p,vec3(269.5,183.3,246.1)),dot(p,vec3(113.5,271.9,124.6)));return -1.+2.*fract(sin(p)*43758.5453123);}
float gn(vec3 p){vec3 i=floor(p),f=fract(p),u=f*f*f*(f*(f*6.-15.)+10.);
 return mix(mix(mix(dot(h33(i),f),dot(h33(i+vec3(1.,0.,0.)),f-vec3(1.,0.,0.)),u.x),mix(dot(h33(i+vec3(0.,1.,0.)),f-vec3(0.,1.,0.)),dot(h33(i+vec3(1.,1.,0.)),f-vec3(1.,1.,0.)),u.x),u.y),
  mix(mix(dot(h33(i+vec3(0.,0.,1.)),f-vec3(0.,0.,1.)),dot(h33(i+vec3(1.,0.,1.)),f-vec3(1.,0.,1.)),u.x),mix(dot(h33(i+vec3(0.,1.,1.)),f-vec3(0.,1.,1.)),dot(h33(i+vec3(1.,1.,1.)),f-vec3(1.,1.,1.)),u.x),u.y),u.z);}
float fbmN(vec3 p,int n){float s=0.,a=.5,t=0.;for(int i=0;i<6;i++){if(i>=n)break;s+=a*gn(p);t+=a;p=p*2.03+vec3(1.7,9.2,3.1);a*=.5;}return s/t;}
*/});
var BAKE=NZ+src(function(){/*
uniform vec2 r;
void main(){
 vec2 uv=gl_FragCoord.xy/r;float lon=(uv.x-.5)*6.2831853,lat=(uv.y-.5)*3.1415927;
 vec3 p=vec3(cos(lat)*sin(lon),sin(lat),cos(lat)*cos(lon));
 vec3 w=vec3(fbmN(p*2.1+1.7,4),fbmN(p*2.1+8.3,4),fbmN(p*2.1+4.1,4));
 float b=fbmN(p*1.25+w*.6+3.,6)*1.4+.5;
 float rg=1.-abs(gn(p*5.5+w)*2.8);
 float h=clamp(b+rg*.1*smoothstep(.5,.75,b)-.03,0.,1.);
 float c=clamp(fbmN(p*vec3(2.2,3.4,2.2)+w*.9+9.,6)*1.5+.5,0.,1.);
 float ci=clamp(fbmN(p*11.+5.,4)*1.5+.5,0.,1.);
 float m=clamp(fbmN(p*2.6+7.,4)*1.5+.5,0.,1.);
 gl_FragColor=vec4(h,c,ci,m);
}
*/});
var PLAN=NZ+src(function(){/*
uniform sampler2D T;uniform vec2 res,ctr;uniform float R,sea,cth,dr;uniform vec3 L;uniform mat3 M,Mi;
float hv(vec3 id){return fract(sin(dot(id,vec3(12.9898,78.233,45.164)))*43758.5453);}
void main(){
 vec2 d=(gl_FragCoord.xy-ctr)/R;float r=length(d),tt=max(r-1.,0.);vec2 e=d/max(r,1e-4);
 float se=dot(e,normalize(L.xy)),lit=smoothstep(-.5,.6,se);
 vec3 hc=vec3(.2,.48,1.)*exp(-tt/.016)*(.06+1.1*lit);
 hc+=vec3(.75,.88,1.)*exp(-tt/.0035)*lit*.7;
 float k1=se/.22;hc+=vec3(1.,.42,.14)*exp(-tt/.009)*exp(-k1*k1)*.85;
 hc+=vec3(.08,.5,.3)*exp(-tt/.03)*.07*(1.-lit);
 hc+=vec3(.1,.25,.6)*exp(-tt/.07)*.1*lit;
 float ha=min(1.,max(hc.r,max(hc.g,hc.b)));
 if(r>1.){gl_FragColor=vec4(hc,ha);return;}
 float nz=sqrt(1.-r*r);vec3 n=vec3(d,nz);float dif=dot(n,L);
 vec3 q=M*n;float lat=asin(clamp(q.y,-1.,1.));
 vec2 uv=vec2(atan(q.x,q.z)/6.2831853+.5,lat/3.1415927+.5);
 vec4 s=texture2D(T,uv);
 float md=texture2D(T,uv*7.+vec2(.13,.71)).r-.5;
 float h=s.r+md*.06,isL=smoothstep(sea-.004,sea+.004,h);
 float du=1./2048.,dv=1./1024.;
 float gx=texture2D(T,uv+vec2(du,0.)).r-texture2D(T,uv-vec2(du,0.)).r;
 float gy=texture2D(T,uv+vec2(0.,dv)).r-texture2D(T,uv-vec2(0.,dv)).r;
 vec3 east=normalize(vec3(q.z,0.,-q.x)),north=cross(q,east);
 vec3 nb=Mi*normalize(q-isL*45.*(gx*east+gy*north));
 vec2 uc=uv+vec2(dr,0.);
 float cv=texture2D(T,uc).g+(texture2D(T,uc*5.+vec2(.4,.2)).g-.5)*.2;
 float cover=smoothstep(cth-.02,cth+.2,cv);
 vec3 Lo=M*L;
 float sc=smoothstep(cth-.02,cth+.2,texture2D(T,uc+vec2(dot(Lo,east),dot(Lo,north))*.004).g);
 float temp=1.-abs(q.y)*1.3-max(h-sea,0.)*1.1,mo=s.a+md*.25;
 vec3 land=mix(vec3(.05,.14,.06),vec3(.17,.29,.1),smoothstep(.4,.62,1.-mo));
 land=mix(land,vec3(.6,.5,.34),smoothstep(.55,.78,1.-mo)*smoothstep(.15,.45,temp));
 land=mix(land,vec3(.32,.29,.26),smoothstep(.1,.28,h-sea));
 land=mix(land,vec3(.9,.93,.96),1.-smoothstep(0.,.14,temp));
 land*=1.+md*.5;
 float dep=clamp((sea-h)*7.,0.,1.);
 vec3 oc=mix(vec3(.02,.2,.27),vec3(.004,.03,.085),dep);
 vec3 alb=mix(oc,land,isL)*(1.-.4*sc);
 float dayM=smoothstep(-.03,.14,dif);
 vec3 sunC=mix(vec3(1.,.5,.26),vec3(1.,.97,.92),smoothstep(0.,.32,dif));
 float sun=clamp(dot(nb,L)*1.15,0.,1.)*dayM,csun=clamp(dif*1.15,0.,1.)*dayM;
 vec3 g=alb*(sun*sunC*1.35+.0015);
 vec3 hh=normalize(L+vec3(0.,0.,1.));float sd=max(dot(n,hh),0.);
 g+=vec3(1.,.92,.8)*pow(sd,160.)*(1.-isL)*(1.-cover)*dayM*2.2+vec3(.5,.7,1.)*pow(sd,10.)*.05*(1.-isL)*dayM;
 vec3 cc=vec3(.95,.96,1.)*(csun*sunC*1.2+.012);
 vec3 col=mix(g,cc,cover*.93);
 float night=1.-smoothstep(-.14,.05,dif);
 float cityM=smoothstep(.6,.84,s.b+md*.15)*isL*(1.-smoothstep(.15,.35,h-sea))*(1.-smoothstep(.55,.8,abs(q.y)));
 vec3 gq=q*210.,id=floor(gq),fr=fract(gq)-.5,jc=h33(id)*.28;
 float dd=dot(fr-jc,fr-jc),rn=hv(id);
 float lights=step(rn,cityM*.9)*exp(-dd*70.)*(.5+fract(rn*7.31));
 col+=vec3(1.,.68,.33)*(lights*1.7+cityM*cityM*.06)*night*(1.-cover*.8);
 col+=vec3(.9,.5,.2)*cover*cityM*.04*night;
 col+=vec3(.0003,.0006,.0016);
 float rim=pow(1.-nz,2.8),sl=smoothstep(-.3,.5,dif);
 col+=vec3(.2,.48,1.)*rim*(.1+1.3*sl);
 float k2=dif/.16;col+=vec3(1.,.4,.12)*rim*exp(-k2*k2)*.9;
 col+=vec3(.05,.3,.2)*pow(1.-nz,6.)*.12*(1.-sl);
 col=mix(col,vec3(.3,.55,1.)*sl*.9,pow(1.-nz,5.)*.45*sl);
 col=pow(1.-exp(-col*1.25),vec3(.4545));
 float ed=clamp((1.-r)*R,0.,1.);
 gl_FragColor=vec4(col*ed+hc*(1.-ed),ed+ha*(1.-ed));
}
*/});
function mm(A,B){var C=new Float32Array(9);for(var c=0;c<3;c++)for(var q=0;q<3;q++){var v=0;for(var k=0;k<3;k++)v+=A[k*3+q]*B[c*3+k];C[c*3+q]=v}return C}
function RY(a){var c=Math.cos(a),s=Math.sin(a);return[c,0,-s,0,1,0,s,0,c]}
function RZ(a){var c=Math.cos(a),s=Math.sin(a);return[c,s,0,-s,c,0,0,0,1]}
function quant(buf,ch,q){
  var hist=new Float64Array(256),tot=0,u,v,w,acc=0,i;
  for(v=0;v<TH;v+=2){w=Math.cos(((v+.5)/TH-.5)*Math.PI);for(u=0;u<TW;u+=2){hist[buf[(v*TW+u)*4+ch]]+=w;tot+=w}}
  for(i=0;i<256;i++){acc+=hist[i];if(acc>=tot*q)return i/255}
  return .5;
}
function psize(){
  var Hc=Math.round(Math.min(H*.56,640)),dp=Math.min(devicePixelRatio||1,1.5,Math.sqrt(2.4e6/(W*Hc))),cw=Math.round(W*dp),ch=Math.round(Hc*dp);
  pc.style.height=Hc+'px';pc.width=cw;pc.height=ch;gl.viewport(0,0,cw,ch);
  var R=Math.max(W*.95,Hc*.95)*dp,top=Hc*.2*dp;
  gl.useProgram(PP);gl.uniform2f(PU.res,cw,ch);gl.uniform2f(PU.ctr,cw/2,ch-(top+R));gl.uniform1f(PU.R,R);
}
function drawPlanet(t){
  var th=t*.0105+1.2,ph=.41;
  gl.useProgram(PP);
  gl.uniformMatrix3fv(PU.M,false,mm(RY(-th),RZ(-ph)));
  gl.uniformMatrix3fv(PU.Mi,false,mm(RZ(ph),RY(th)));
  gl.uniform1f(PU.dr,t*.00002);
  gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
}
function initGL(){
  gl=pc.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:false});
  if(!gl)return;
  function sh(t,c){var o=gl.createShader(t);gl.shaderSource(o,c);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(o));return o}
  function pr(f){var o=gl.createProgram();gl.attachShader(o,sh(gl.VERTEX_SHADER,'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}'));gl.attachShader(o,sh(gl.FRAGMENT_SHADER,f));gl.bindAttribLocation(o,0,'a');gl.linkProgram(o);if(!gl.getProgramParameter(o,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(o));return o}
  var bf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,bf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
  var tx=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tx);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,TW,TH,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT);
  var fb=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fb);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,tx,0);
  var bp=pr(BAKE);gl.useProgram(bp);gl.viewport(0,0,TW,TH);gl.uniform2f(gl.getUniformLocation(bp,'r'),TW,TH);
  gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  var buf=new Uint8Array(TW*TH*4);gl.readPixels(0,0,TW,TH,gl.RGBA,gl.UNSIGNED_BYTE,buf);
  var sea=quant(buf,0,.69),cth=quant(buf,1,.5);
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  PP=pr(PLAN);gl.useProgram(PP);
  ['T','res','ctr','R','sea','cth','dr','L','M','Mi'].forEach(function(k){PU[k]=gl.getUniformLocation(PP,k)});
  var Lx=-.75,Ly=.1,Lz=-.62,ll=Math.sqrt(Lx*Lx+Ly*Ly+Lz*Lz);
  gl.uniform1i(PU.T,0);gl.uniform1f(PU.sea,sea);gl.uniform1f(PU.cth,cth);gl.uniform3f(PU.L,Lx/ll,Ly/ll,Lz/ll);
  GL=true;psize();pc.style.opacity='1';
}
setTimeout(function(){try{initGL()}catch(e){GL=false;console.warn(e)}},60);
})();
(function(){
var d=document,btns=[].slice.call(d.querySelectorAll('.ft')),cards=[].slice.call(d.querySelectorAll('.card'));
if(!btns.length)return;
var bn=d.getElementById('bn'),bp=d.getElementById('bp'),bs=d.getElementById('bs'),rc=d.getElementById('rc'),cm=d.getElementById('cmp'),bh=d.getElementById('bh'),bt=d.getElementById('bt'),shown=0,pre='',raf;
var order=['card','portal','custom'],NAME={card:'Card Website',portal:'Full Web Portal',custom:'Custom Constructor'},TIME={card:'1-2 weeks',portal:'3-4 weeks',custom:'2-3 weeks'},ALLN=btns.filter(function(b){return b.dataset.g!=='x'&&b.dataset.g!=='l'}).length;
function fmt(v){return '$'+v.toLocaleString('en-US')}
function put(v){bp.textContent=pre+fmt(v)}
function tween(to){cancelAnimationFrame(raf);put(shown);var from=shown,t0=null;function f(t){if(!t0)t0=t;var k=Math.min((t-t0)/650,1),e=1-Math.pow(1-k,3);shown=Math.round(from+(to-from)*e);put(shown);if(k<1)raf=requestAnimationFrame(f)}raf=requestAnimationFrame(f)}
function calc(){
  var all=btns.filter(function(b){return b.getAttribute('aria-pressed')==='true'}),
      logo=all.filter(function(b){return b.dataset.g==='l'})[0],
      S=all.filter(function(b){return b.dataset.g!=='l'}),T=0,hx=false,hp=false,hc=0,disc=H1.prices.logo.bundle,
      lp=logo?+logo.dataset.p:0,ln=logo?logo.querySelector('span').textContent:'';
  S.forEach(function(b){T+=+b.dataset.p;if(b.dataset.g==='x')hx=true;if(b.dataset.g==='p')hp=true;if(b.dataset.g==='c')hc++});
  cards.forEach(function(c){c.classList.remove('pick')});
  if(!S.length){
    pre='';cm.innerHTML='';bh.style.display='none';
    if(!logo){bn.textContent='Pick features to start';shown=0;put(0);bs.textContent='';rc.innerHTML='';bt.textContent='Pick the services you need. We will show an estimate and the best way to get them.';return}
    bn.textContent=ln;pre='from ';tween(lp);
    bs.innerHTML='Add a website and your logo becomes <b>'+disc+'% cheaper</b>.';
    rc.innerHTML='<li><span>'+ln+'</span></li><li class="tot hl"><span>Estimated total</span><i>from '+fmt(lp)+'</i></li>';
    bt.textContent='The price is approximate and is finalized after we discuss all the details of your logo. Crypto accepted.';
    return;
  }
  var o={card:(!hx&&!hp)?H1.prices.card:null,portal:!hx?H1.prices.portal:null,custom:Math.max(H1.prices.custom,T)},best=null;
  order.forEach(function(k){if(o[k]!==null&&(best===null||o[k]<o[best]))best=k});
  var P=o[best],isC=best==='custom',ld=logo?Math.round(lp*disc/100):0,total=P+lp-ld;
  cards[order.indexOf(best)].classList.add('pick');
  bn.textContent=NAME[best]+(logo?' + '+ln:'');pre='from ';tween(total);
  var inc=best==='card'?4-hc:ALLN-S.length,line;
  if(isC)line='Built around your exact requirements. The final price is calculated after we discuss every detail of your site.';
  else if(T>P)line='Everything you picked fits into this package, so it costs less than adding features one by one.';
  else if(inc>0)line='Plus <b>'+inc+' more feature'+(inc===1?'':'s')+'</b> included at no extra cost.';
  else line='Everything you picked is included.';
  bs.innerHTML=line+(logo?' Your logo gets a <b>'+disc+'% bundle discount</b>.':'');
  var h='';
  S.concat(logo?[logo]:[]).forEach(function(b){h+='<li><span>'+b.querySelector('span').textContent+'</span></li>'});
  h+='<li class="tot hl"><span>Estimated total</span><i>from '+fmt(total)+'</i></li>';
  rc.innerHTML=h;
  var scale=Math.max(1400,o.custom);
  cm.innerHTML=order.map(function(k){var v=o[k],ok=v!==null;return '<div class="cr'+(k===best?' b':'')+(ok?'':' x')+'"><span>'+NAME[k]+'</span><div class="bar2"><u style="width:'+(ok?Math.min(100,v/scale*100):0)+'%"></u></div><em>'+(ok?'from '+fmt(v):'not suitable')+'</em></div>'}).join('');
  function has(id){return S.some(function(b){return b.dataset.id===id})}
  var hint='';
  if(isC&&o.portal!==null&&S.length>=3&&o.portal-P>0&&o.portal-P<=300)hint='For just '+fmt(o.portal-P)+' more you could get the Full Web Portal with all '+ALLN+' features included.';
  else if(best!=='portal'&&has('cat')&&!has('adm'))hint='Tip: add the admin panel so you can update your catalog and prices yourself.';
  else if(best!=='portal'&&has('tg')&&!has('soc'))hint='Tip: pair the Telegram bot with lead buttons so every click ends up on your phone.';
  bh.textContent=hint;bh.style.display=hint?'block':'none';
  bt.textContent='Estimated timeline: '+TIME[best]+'. The price is approximate and is finalized after we discuss all the details of your site. Crypto accepted.';
}
function setLogo(b){btns.forEach(function(x){if(x.dataset.g==='l')x.setAttribute('aria-pressed','false')});if(b)b.setAttribute('aria-pressed','true')}
btns.forEach(function(b){b.addEventListener('click',function(){
  var on=b.getAttribute('aria-pressed')==='true';
  if(b.dataset.g==='l')setLogo(on?null:b);else b.setAttribute('aria-pressed',on?'false':'true');
  calc();
})});
d.addEventListener('click',function(e){
  var a=e.target.closest('[data-pick]');
  if(!a)return;
  var b=btns.filter(function(x){return x.dataset.id===a.dataset.pick})[0];
  if(b){setLogo(b);calc()}
});
d.getElementById('rz').addEventListener('click',function(){btns.forEach(function(b){b.setAttribute('aria-pressed','false')});calc()});
calc();
})();

(function(){
var d=document,R=d.getElementById('bf');if(!R)return;
/* ===== SETTINGS: where finished briefs are delivered. Fill in your own details. ===== */
var CFG={endpoint:'/api/brief'},t0=Date.now();
var T=['Your business','Goals and idea','Features','Look and feel','Content and timing','Contacts'],
H=['Let us start with the basics.','What do you want from your website?','Tap everything you like. Not sure? Choose "Advise me".','How should your site look and feel?','A few practical details.','How can we reach you?'],
sts=[].slice.call(R.querySelectorAll('.bf-st')),N=sts.length,cur=0,touched=false;
function $(q){return R.querySelector(q)}
var nodes=[].slice.call(R.querySelectorAll('.bf-nodes i')),prog=$('.bf-prog'),back=$('.bf-back'),next=$('.bf-next'),er=$('.bf-err'),preEl=$('#bf-pre');
function grp(k){return $('.bf-grp[data-k="'+k+'"]')}
function sel(k){return [].slice.call(R.querySelectorAll('.bf-grp[data-k="'+k+'"] .bf-op[aria-pressed="true"]'))}
function sv(k){return sel(k).map(function(b){return b.dataset.v})}
function val(n){var e=$('[name="'+n+'"]');return e?e.value.trim():''}
function fmt(v){return '$'+v.toLocaleString('en-US')}
function est(){
  var S=sel('feat'),tt=0,hx=false,hp=false;
  if(!S.length)return null;
  S.forEach(function(b){tt+=+b.dataset.p;if(b.dataset.g==='x')hx=true;if(b.dataset.g==='p')hp=true});
  var o={card:(!hx&&!hp)?H1.prices.card:null,portal:!hx?H1.prices.portal:null,custom:Math.max(H1.prices.custom,tt)},best=null;
  ['card','portal','custom'].forEach(function(k){if(o[k]!==null&&(best===null||o[k]<o[best]))best=k});
  return{name:{card:'Card Website',portal:'Full Web Portal',custom:'Custom Constructor'}[best],price:o[best],from:true};
}
function upEst(){
  var e=est();
  $('#bf-en').textContent=e?e.name:(sel('adv').length?'We will advise you':'Pick features above');
  $('#bf-ep').textContent=e?((e.from?'from ':'approx. ')+fmt(e.price)):'';
}
function prefill(){
  if(touched)return;
  var on=[].slice.call(d.querySelectorAll('.ft[aria-pressed="true"]')).map(function(b){return b.dataset.id});
  if(!on.length)return;
  [].forEach.call(R.querySelectorAll('.bf-op[data-id]'),function(b){b.setAttribute('aria-pressed',on.indexOf(b.dataset.id)>-1?'true':'false')});
  preEl.hidden=false;upEst();
}
function prefillLogo(){
  var bl=d.querySelector('.ft[data-g="l"][aria-pressed="true"]');
  if(!bl||sel('logo').length)return;
  var name=bl.querySelector('span').textContent;
  [].forEach.call(R.querySelectorAll('.bf-grp[data-k="logo"] .bf-op, .bf-logot .bf-op'),function(x){x.setAttribute('aria-pressed',x.dataset.v==='I want a unique logo from you'||x.dataset.v===name?'true':'false')});
  logoTiers();
  [].forEach.call(R.querySelectorAll('.bf-logot .bf-op'),function(x){x.setAttribute('aria-pressed',x.dataset.v===name?'true':'false')});
}
function logoTiers(){
  var on=sv('logo')[0]==='I want a unique logo from you',w=$('.bf-logot');
  w.hidden=!on;
  if(!on)[].forEach.call(w.querySelectorAll('.bf-op'),function(x){x.setAttribute('aria-pressed','false')});
}
function chan(){
  var c=sv('ch')[0],i=$('[name="cval"]'),m={'WhatsApp':['+00 000 000 000','tel'],'Phone call':['+00 000 000 000','tel'],'Telegram':['@username','text'],'Email':['name@email.com','email']}[c]||['Phone, @username or email','text'];
  i.placeholder=m[0];i.setAttribute('inputmode',m[1]);
}
function rows(){
  var e=est(),f=sel('feat').map(function(b){return b.dataset.v}).join(', '),lt=sel('logot')[0],lp=lt?+lt.dataset.p:0,
      ld=e&&lp?Math.round(lp*H1.prices.logo.bundle/100):0,money='';
  if(e){money=e.name+', '+(e.from?'from ':'')+fmt(e.price);if(lp)money+=' + '+lt.dataset.v+' '+fmt(lp-ld)+(ld?' (after '+H1.prices.logo.bundle+'% bundle discount)':'')+' = '+(e.from?'from ':'')+fmt(e.price+lp-ld)+' in total'}
  else if(lp)money=lt.dataset.v+', '+fmt(lp);
  if(sel('adv').length)f+=(f?'. ':'')+'Please advise me';
  var oth=val('other'),type=sv('type').join(', ')+(oth?' ('+oth+')':'');
  var R2=[['Business',val('biz'),0],['Type',type,0],['Online today',sv('now').join(', '),0],['Goals',sv('goal').join(', '),1],['Dream website',val('idea'),1],
  ['Features',f,2],['Estimate (approx.)',money,2],
  ['Style',sv('style').join(', '),3],['Colors',sv('col').join(', '),3],['Logo',sv('logo').join(', ')+(lt?': '+lt.dataset.v:''),3],['Sites they like',val('links'),3],
  ['Languages',sv('lang').join(', '),4],['Pages',sv('pages').join(', '),4],['Content',sv('cont').join(', '),4],['Launch',sv('when').join(', '),4],['After launch',sv('care').join(', '),4],
  ['Name',val('name'),5],['Contact',(sv('ch')[0]||'')+(val('cval')?': '+val('cval'):''),5],['Best time',sv('time').join(', '),5]];
  return R2.filter(function(x){return x[1]});
}
function msg(){var L=['New website brief',''];rows().forEach(function(x){L.push(x[0]+': '+x[1])});return L.join('\n')}
function need(i){
  var b=[];
  if(i===0){var a=$('[name="biz"]');if(!a.value.trim())b.push(a);if(!sel('type').length)b.push(grp('type'))}
  if(i===5){var n=$('[name="name"]'),c=$('[name="cval"]');if(!n.value.trim())b.push(n);if(!sel('ch').length)b.push(grp('ch'));if(!c.value.trim())b.push(c)}
  return b;
}
function flag(b){
  [].forEach.call(R.querySelectorAll('.err'),function(x){x.classList.remove('err')});
  b.forEach(function(x){x.classList.add('err')});
  er.textContent=b.length?'Please fill in the highlighted fields.':'';
  if(b.length&&b[0].tagName==='INPUT')b[0].focus();
}
function go(i,sc){
  cur=i;
  sts.forEach(function(s,j){s.classList.toggle('on',j===i)});
  $('#bf-n').textContent=i+1;$('#bf-t').textContent=T[i];$('#bf-h').textContent=H[i];
  prog.style.setProperty('--p',i/(N-1));
  nodes.forEach(function(n,j){n.classList.toggle('d',j<=i)});
  back.style.visibility=i?'visible':'hidden';next.textContent=i===N-1?'Finish':'Next';er.textContent='';cp.hidden=true;
  if(i===2)prefill();
  if(i===3)prefillLogo();
  if(sc)R.scrollIntoView({behavior:'smooth',block:'start'});
}
var ts=d.getElementById('toast'),tt;
function toast(m){if(!ts)return;ts.textContent=m;ts.classList.add('on');clearTimeout(tt);tt=setTimeout(function(){ts.classList.remove('on')},2200)}
function copy(t,cb){
  function fb(){var a=d.createElement('textarea');a.value=t;d.body.appendChild(a);a.select();try{d.execCommand('copy')}catch(e){/* copy not available */}a.remove();cb&&cb()}
  try{navigator.clipboard.writeText(t).then(function(){cb&&cb()},fb)}catch(e){fb()}
}
var ty=d.getElementById('bf-ty'),cp=$('#bf-copy');
function showThanks(){ty.hidden=false;d.body.classList.add('ty-open');d.getElementById('bf-tyc').focus()}
function closeThanks(){
  ty.hidden=true;d.body.classList.remove('ty-open');
  [].forEach.call(R.querySelectorAll('.bf-in'),function(x){x.value=''});
  [].forEach.call(R.querySelectorAll('.bf-op'),function(x){x.setAttribute('aria-pressed','false')});
  $('[name="other"]').hidden=true;$('.bf-logot').hidden=true;touched=false;preEl.hidden=true;upEst();chan();t0=Date.now();go(0,true);
}
function send(){
  var e=est(),payload={rows:rows().map(function(x){return[x[0],x[1]]}),estimate:e?{name:e.name,price:e.price,from:e.from}:null,hp:val('company_site'),elapsed:Date.now()-t0};
  next.disabled=true;next.textContent='Sending...';er.textContent='';cp.hidden=true;
  fetch(CFG.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
    .then(function(res){return res.json().catch(function(){return{}}).then(function(j){if(!res.ok||!j.ok)throw new Error(j.error||'failed')})})
    .then(function(){next.disabled=false;next.textContent='Finish';showThanks()})
    .catch(function(){next.disabled=false;next.textContent='Try again';er.textContent='We could not send your brief. Please try again.';cp.hidden=false});
}
R.addEventListener('click',function(e){
  var b=e.target.closest('.bf-op');
  if(b){
    var g=b.parentNode,k=g.dataset.k,on=b.getAttribute('aria-pressed')==='true';
    if(g.dataset.m==='single'){[].forEach.call(g.querySelectorAll('.bf-op'),function(x){x.setAttribute('aria-pressed','false')});if(!on)b.setAttribute('aria-pressed','true')}
    else b.setAttribute('aria-pressed',on?'false':'true');
    g.classList.remove('err');
    if(k==='feat'){touched=true;preEl.hidden=true}
    if(k==='feat'||k==='adv')upEst();
    if(k==='type')$('[name="other"]').hidden=sv('type')[0]!=='Other';
    if(k==='ch')chan();
    if(k==='logo')logoTiers();
    return;
  }
});
R.addEventListener('input',function(e){e.target.classList.remove('err');if(e.target.name==='cval'||e.target.name==='name')er.textContent=''});
R.addEventListener('keydown',function(e){if(e.key==='Enter'&&e.target.tagName==='INPUT'){e.preventDefault();next.click()}});
next.addEventListener('click',function(){var b=need(cur);flag(b);if(!b.length){if(cur===N-1)send();else go(cur+1,true)}});
back.addEventListener('click',function(){go(cur-1,true)});
d.getElementById('bf-tyc').addEventListener('click',closeThanks);
ty.addEventListener('click',function(e){if(e.target===ty)closeThanks()});
d.addEventListener('keydown',function(e){if(e.key==='Escape'&&!ty.hidden)closeThanks()});
cp.addEventListener('click',function(){copy(msg(),function(){toast('Answers copied')})});
go(0);chan();upEst();
})();

/* ---- smooth in-page navigation, active section indicator, glass header, gallery lightbox ---- */
(function(){
'use strict';
var d=document,hd=d.querySelector('header'),nav=d.querySelector('nav'),OFFSET=72,raf=0,cur=-1;
if(!hd||!nav)return;
var ind=d.createElement('span');ind.className='nv-ind';nav.appendChild(ind);
var links=[].slice.call(nav.querySelectorAll('a')),secs=links.map(function(a){return d.querySelector(a.getAttribute('href'))});
function ease(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2}
function stop(){cancelAnimationFrame(raf)}
function scrollToY(y){
  stop();
  var s=window.scrollY,dy=Math.max(0,y)-s,dur=Math.min(1500,Math.max(700,Math.abs(dy)*.5)),t0=0;
  function f(t){if(!t0)t0=t;var k=Math.min((t-t0)/dur,1);window.scrollTo(0,s+dy*ease(k));if(k<1)raf=requestAnimationFrame(f)}
  raf=requestAnimationFrame(f);
}
['wheel','touchstart','keydown'].forEach(function(ev){addEventListener(ev,stop,{passive:true})});
d.addEventListener('click',function(e){
  var a=e.target.closest('a[href^="#"]');
  if(!a||a.getAttribute('href').length<2)return;
  var id=a.getAttribute('href'),t=d.querySelector(id);
  if(!t)return;
  e.preventDefault();
  scrollToY(id==='#top'?0:t.getBoundingClientRect().top+window.scrollY-OFFSET);
  history.pushState(null,'',id);
});
function mark(){
  var a=links[cur];
  if(!a){ind.style.opacity='0';return}
  ind.style.opacity='1';ind.style.width=a.offsetWidth+'px';ind.style.transform='translateX('+a.offsetLeft+'px)';
}
function spy(){
  var y=window.scrollY+innerHeight*.35,k=-1;
  secs.forEach(function(s,i){if(s&&s.getBoundingClientRect().top+window.scrollY<=y)k=i});
  if(k!==cur){cur=k;links.forEach(function(a,i){a.classList.toggle('on',i===k)});mark()}
  hd.classList.toggle('scrolled',window.scrollY>24);
}
addEventListener('scroll',spy,{passive:true});addEventListener('resize',mark);spy();
var lb=d.createElement('div');
lb.className='lb';lb.hidden=true;lb.innerHTML='<img alt=""><button type="button" aria-label="Close">&times;</button>';
d.body.appendChild(lb);
d.addEventListener('click',function(e){
  var im=e.target.closest('.site img');
  if(im){var big=lb.querySelector('img');big.src=im.currentSrc||im.src;big.alt=im.alt;lb.hidden=false;return}
  if(!lb.hidden&&(e.target===lb||e.target.closest('.lb button')))lb.hidden=true;
});
d.addEventListener('keydown',function(e){if(e.key==='Escape')lb.hidden=true});
})();
