const { useState, useEffect, useRef, useCallback } = React;
// THREE loaded via CDN

// ─── Data ────────────────────────────────────────────────────────────────────

const GENRES = [
  "Power Ballad","Surf","New Wave","Metal",
  "Punk / Hardcore","Grunge","Funk","Slow Jams",
  "Folk / Acoustic","Prog Rock","Ska / Reggae","Power Rock"
];

const WORD_POOL = [
  "toaster","umbrella","parking","stapler","pudding","helmet","lampshade","thermos",
  "zipper","doorknob","muffin","blanket","garden","socket","notebook","fender",
  "mailbox","kettle","curtain","gravel","cactus","cabinet","pitcher","lever",
  "mattress","ladder","napkin","turnip","wrapper","faucet","closet","pebble",
  "highway","rooftop","basement","airport","hallway","courthouse","harbor",
  "laundromat","storage","overpass","meadow","suburb","scaffold","alleyway","crater",
  "stubborn","nervous","furious","lonesome","bewildered","reckless","restless","content",
  "bored","jealous","grateful","hopeless","frantic","hollow","tender","gloomy",
  "dizzy","bitter","cheerful","weary","startled","cautious","smug",
  "stumble","wrestle","shuffle","whistle","collapse","wander","borrow","convince",
  "surrender","mumble","haunt","ignore","pretend","escape","inherit","confuse",
  "interrupt","vanish","demand","recycle","apologize","migrate","argue","celebrate",
  "pigeon","badger","lobster","seagull","wombat","iguana","platypus","ostrich",
  "cockroach","pelican","hamster","ferret","walrus","mongoose","vulture","tapir",
  "waffle","burrito","ketchup","pretzel","spaghetti","pickle","mustard","nacho",
  "biscuit","noodle","lemon","gravy","cracker","syrup","cookie","radish",
  "crimson","beige","turquoise","maroon","lavender","chartreuse","khaki","taupe",
  "rusty","slimy","fuzzy","glossy","chalky","matte","wrinkled","crooked",
  "deadline","warranty","alibi","franchise","committee","loophole","detour","surplus",
  "shortage","revenue","friction","momentum","static","voltage","signal","feedback",
  "elbow","kneecap","eyelid","nostril","knuckle","eardrum","thumbnail","jawbone",
  "shoulder","temple","forehead","ribcage","toenail","eyelash","tongue","freckle",
  "thousand","quarter","halfway","double","triple","fraction","remainder","average",
  "oxygen","nitrogen","molecule","gravity","bandwidth","database","algorithm",
  "frequency","latitude","compass","asteroid","satellite","proton","antenna",
  "coupon","invoice","receipt","category","reference",
  "Tuesday","October","cardboard","plywood","concrete","velcro","plastic","rubber",
  "lawsuit","username","barcode","clearance","checkout","inventory","overtime"
];

// ─── Audio Engine (Web Audio API — no CDN, fully offline) ────────────────────

function createAudio() {
  let ctx = null;
  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function playDiceRoll() {
    const ac = getCtx();
    const duration = 3.2;
    const scheduleHit = (when) => {
      if (when > ac.currentTime + duration) return;
      const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.04), ac.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++)
        data[i] = (Math.random()*2-1) * Math.pow(1 - i/data.length, 2);
      const src = ac.createBufferSource(); src.buffer = buf;
      const filt = ac.createBiquadFilter();
      filt.type = "bandpass";
      filt.frequency.value = 800 + Math.random()*1200;
      filt.Q.value = 2;
      const gain = ac.createGain(); gain.gain.value = 0.3;
      src.connect(filt); filt.connect(gain); gain.connect(ac.destination);
      src.start(when);
      const progress = (when - ac.currentTime) / duration;
      const interval = 0.04 + progress * 0.22 + Math.random()*0.03;
      scheduleHit(when + interval);
    };
    scheduleHit(ac.currentTime);
  }

  function playWordShimmer(delay = 0) {
    const ac = getCtx();
    const t = ac.currentTime + delay;

    // Soft fairy dust: random high notes, gentle attack, long airy decay
    // Uses triangle waves (softer than sine) with reverb-like delays
    const sparkleNotes = [
      1568, 1760, 2093, 2349, 2637, 1976, 2093, 1760, 2637, 1568, 2349, 1976
    ];

    // Pick 8 random notes scattered over ~0.6 seconds
    for (let i = 0; i < 8; i++) {
      const freq  = sparkleNotes[Math.floor(Math.random() * sparkleNotes.length)];
      const when  = t + Math.random() * 0.55;
      const vol   = 0.04 + Math.random() * 0.07; // very soft

      const osc  = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = "triangle"; // triangle = much softer, flutey tone
      osc.frequency.value = freq;

      // Gentle swell in, long gentle fade out — airy and floaty
      gain.gain.setValueAtTime(0, when);
      gain.gain.linearRampToValueAtTime(vol, when + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, when + 0.7 + Math.random() * 0.4);

      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(when);
      osc.stop(when + 1.2);
    }
  }

  function playTada() {
    const ac = getCtx();
    const t = ac.currentTime;

    // Brass-style tada fanfare: two quick grace notes then a triumphant chord
    const notes = [
      { freq: 392, start: 0,    dur: 0.12, vol: 0.28 }, // G4 grace
      { freq: 523, start: 0.11, dur: 0.12, vol: 0.28 }, // C5 grace
      { freq: 659, start: 0.22, dur: 0.55, vol: 0.35 }, // E5 main
      { freq: 523, start: 0.22, dur: 0.55, vol: 0.32 }, // C5 main
      { freq: 784, start: 0.22, dur: 0.55, vol: 0.30 }, // G5 main
      { freq: 1047,start: 0.22, dur: 0.55, vol: 0.22 }, // C6 top
    ];

    notes.forEach(({ freq, start, dur, vol }) => {
      const osc  = ac.createOscillator();
      const gain = ac.createGain();
      // Sawtooth for brass-like tone
      osc.type = "sawtooth";
      osc.frequency.value = freq;

      // Bright attack, slight swell, then fade
      gain.gain.setValueAtTime(0, t + start);
      gain.gain.linearRampToValueAtTime(vol, t + start + 0.02);
      gain.gain.setValueAtTime(vol, t + start + dur * 0.6);
      gain.gain.exponentialRampToValueAtTime(0.001, t + start + dur + 0.15);

      // Gentle low-pass to soften the sawtooth harshness
      const filt = ac.createBiquadFilter();
      filt.type = "lowpass";
      filt.frequency.value = 2400;
      filt.Q.value = 0.8;

      osc.connect(filt); filt.connect(gain); gain.connect(ac.destination);
      osc.start(t + start); osc.stop(t + start + dur + 0.2);
    });
  }

  function playBell() {
    const ac = getCtx();
    const t = ac.currentTime;
    [[440,1],[554,0.6],[659,0.4],[880,0.25],[1108,0.15]].forEach(([freq,amp]) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = "sine"; osc.frequency.value = freq;
      gain.gain.setValueAtTime(amp*0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t+3.5);
      osc.connect(gain); gain.connect(ac.destination);
      osc.start(t); osc.stop(t+3.6);
    });
    const buf = ac.createBuffer(1, 512, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i=0;i<512;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/512,4);
    const src = ac.createBufferSource(); src.buffer = buf;
    const g = ac.createGain(); g.gain.value = 0.3;
    src.connect(g); g.connect(ac.destination); src.start(t);
  }

  return { playDiceRoll, playWordShimmer, playBell, playTada };
}

const audio = createAudio();
const IMG_TOME = "assets/tome.png";
const IMG_DIE = "assets/die.png";
const IMG_HOURGLASS = "assets/hourglass.jpg";





// ─── Three.js D12 Die ────────────────────────────────────────────────────────
// Text is baked into per-face canvas textures — it sits ON the geometry,
// rotates with it, foreshortens with perspective. No floating sprites.

function D12Die({ onRollComplete, triggerRoll, pickedFace }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    const W = el.clientWidth, H = el.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W/H, 0.1, 100);
    camera.position.set(0, 0, 4.2);

    scene.add(new THREE.AmbientLight(0xff9999, 0.5));
    const key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(-2, 3, 4); scene.add(key);
    const fill = new THREE.DirectionalLight(0xaa2200, 0.55);
    fill.position.set(3, -2, 2); scene.add(fill);
    const rim = new THREE.DirectionalLight(0x660000, 0.35);
    rim.position.set(0, -4, -3); scene.add(rim);

    // ── Build face textures ──────────────────────────────────────────────────
    // Each canvas is 512×512, filled with the die's purple body colour,
    // then the genre name is drawn in white with an engraved/recessed effect.
    function makeFaceTex(text) {
      const SIZE = 512;
      const c = document.createElement("canvas");
      c.width = SIZE; c.height = SIZE;
      const g = c.getContext("2d");

      // Body colour — deep red to match die theme
      g.fillStyle = "#8b0000";
      g.fillRect(0, 0, SIZE, SIZE);

      // Split into lines
      const tokens = text.split(/[\s/]+/);
      const lines = tokens.length <= 2 ? tokens : [tokens[0], tokens.slice(1).join(" ")];
      const fsize = lines.length > 1 ? 72 : 88;
      const lineH = fsize * 1.35;
      const midY = SIZE / 2;

      g.textAlign = "center";
      g.textBaseline = "middle";
      g.font = `700 ${fsize}px Oswald, Arial Black, sans-serif`;

      lines.forEach((line, i) => {
        const yy = midY + (i - (lines.length - 1) / 2) * lineH;

        // ── Engraved effect ──
        // 1. Deep shadow pressed into the surface (offset down-right, dark)
        g.fillStyle = "rgba(0,0,0,0.75)";
        g.fillText(line, SIZE/2 + 4, yy + 5);

        // 2. Slightly lighter inner shadow (makes it look recessed)
        g.fillStyle = "rgba(0,0,20,0.5)";
        g.fillText(line, SIZE/2 + 2, yy + 2);

        // 3. Top highlight — thin bright rim (simulates light catching the rim of the engraving)
        g.fillStyle = "rgba(160,130,255,0.55)";
        g.fillText(line, SIZE/2 - 1, yy - 2);

        // 4. Main white fill
        g.fillStyle = "#f0eeff";
        g.fillText(line, SIZE/2, yy);
      });

      return new THREE.CanvasTexture(c);
    }

    // ── Build geometry with per-face UV groups ───────────────────────────────
    // DodecahedronGeometry triangles: 36 total, 3 per pentagonal face.
    // Three.js assigns them in face order 0-2 = face0, 3-5 = face1, etc.
    // We add a materialIndex group per face so each gets its own texture.
    const dodGeo = new THREE.DodecahedronGeometry(1.28, 0);

    // Each group: start tri index, tri count, material index
    // 36 triangles / 12 faces = 3 tris per face, each tri = 3 indices
    const faceMaterials = GENRES.map((genre) => {
      return new THREE.MeshPhongMaterial({
        map: makeFaceTex(genre),
        specular: 0xff4444,
        shininess: 90,
        flatShading: true,
      });
    });

    // Clear auto-generated groups and add one per face
    dodGeo.clearGroups();
    for (let f = 0; f < 12; f++) {
      dodGeo.addGroup(f * 9, 9, f); // 3 tris × 3 indices = 9 indices per face
    }

    // Fix UVs so each face fills its texture fully.
    // DodecahedronGeometry UVs map the whole sphere — we remap per face
    // so each face's 9 vertices map into [0,1]² centered on the face.
    const pos = dodGeo.attributes.position;
    const uvAttr = dodGeo.attributes.uv;

    // For each face (group of 3 triangles = 9 vertices), compute face centroid
    // and local 2D axes, then project each vertex into face UV space.
    for (let f = 0; f < 12; f++) {
      const base = f * 9;

      // Gather the 9 position vectors for this face
      const verts = [];
      for (let k = 0; k < 9; k++) {
        verts.push(new THREE.Vector3().fromBufferAttribute(pos, base + k));
      }

      // Face normal = average of all vertex positions (dodecahedron is convex)
      const faceNorm = new THREE.Vector3();
      verts.forEach(v => faceNorm.add(v));
      faceNorm.normalize();

      // Face centroid
      const centroid = new THREE.Vector3();
      verts.forEach(v => centroid.add(v));
      centroid.divideScalar(9);

      // Build local 2D axes on the face plane
      const uAxis = new THREE.Vector3();
      uAxis.crossVectors(faceNorm, new THREE.Vector3(0, 1, 0)).normalize();
      if (uAxis.lengthSq() < 0.001)
        uAxis.crossVectors(faceNorm, new THREE.Vector3(1, 0, 0)).normalize();
      const vAxis = new THREE.Vector3().crossVectors(faceNorm, uAxis).normalize();

      // Project each vertex onto the local axes
      const localPts = verts.map(v => {
        const d = v.clone().sub(centroid);
        return { u: d.dot(uAxis), v: d.dot(vAxis) };
      });

      // Find bounding box to normalise into [0.05, 0.95]
      const us = localPts.map(p => p.u), vs = localPts.map(p => p.v);
      const minU = Math.min(...us), maxU = Math.max(...us);
      const minV = Math.min(...vs), maxV = Math.max(...vs);
      const rangeU = maxU - minU || 1, rangeV = maxV - minV || 1;
      const margin = 0.08;

      localPts.forEach((p, k) => {
        const nu = margin + ((p.u - minU) / rangeU) * (1 - 2*margin);
        const nv = margin + ((p.v - minV) / rangeV) * (1 - 2*margin);
        uvAttr.setXY(base + k, 1 - nu, 1 - nv); // flip U (mirror) + flip V for canvas coords
      });
    }
    uvAttr.needsUpdate = true;

    const dieMesh = new THREE.Mesh(dodGeo, faceMaterials);
    scene.add(dieMesh);

    // Edges
    dieMesh.add(new THREE.LineSegments(
      new THREE.EdgesGeometry(dodGeo, 10),
      new THREE.LineBasicMaterial({ color: 0xff4444, linewidth: 1 })
    ));

    // ── Face centres (for targeting the winning face) ────────────────────────
    const faceCentres = [];
    for (let f = 0; f < 12; f++) {
      const cx = new THREE.Vector3();
      for (let k = 0; k < 9; k++)
        cx.add(new THREE.Vector3().fromBufferAttribute(pos, f*9 + k));
      cx.divideScalar(9);
      faceCentres.push(cx.clone());
    }

    // ── Animation ────────────────────────────────────────────────────────────
    let animId = null, rolling = false;

    sceneRef.current = {
      startRoll: (faceIdx, onDone) => {
        if (rolling) return;
        rolling = true;

        const spinAxis = new THREE.Vector3(
          0.3 + Math.random()*0.6,
          0.5 + Math.random()*0.7,
          (Math.random()-0.5)*0.4
        ).normalize();
        const totalAngle = (9 + Math.random()*5) * Math.PI * 2;
        const duration = 3400, phase2Start = 0.68;
        const startQuat = dieMesh.quaternion.clone();
        const fc = faceCentres[faceIdx].clone().normalize();
        const targetQuat = new THREE.Quaternion().setFromUnitVectors(
          fc, new THREE.Vector3(0, 0, 1)
        );
        let phase2Quat = null;
        const t0 = performance.now();

        const frame = (now) => {
          const t = Math.min(1, (now - t0) / duration);
          if (t < phase2Start) {
            const ease = 1 - Math.pow(1 - (t/phase2Start), 2.0);
            dieMesh.quaternion.copy(startQuat).premultiply(
              new THREE.Quaternion().setFromAxisAngle(spinAxis, ease * totalAngle)
            );
            phase2Quat = null;
          } else {
            if (!phase2Quat) phase2Quat = dieMesh.quaternion.clone();
            const tp2 = (t - phase2Start) / (1 - phase2Start);
            const ease2 = tp2 < 0.5 ? 4*tp2**3 : 1 - Math.pow(-2*tp2+2, 3)/2;
            dieMesh.quaternion.slerpQuaternions(phase2Quat, targetQuat, ease2);
          }
          renderer.render(scene, camera);
          if (t < 1) {
            animId = requestAnimationFrame(frame);
          } else {
            dieMesh.quaternion.copy(targetQuat);
            renderer.render(scene, camera);
            rolling = false;
            onDone();
          }
        };
        cancelAnimationFrame(animId);
        animId = requestAnimationFrame(frame);
      }
    };

    renderer.render(scene, camera);
    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      faceMaterials.forEach(m => { m.map && m.map.dispose(); m.dispose(); });
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    if (triggerRoll && sceneRef.current && pickedFace !== null)
      sceneRef.current.startRoll(pickedFace, onRollComplete);
  }, [triggerRoll]);

  return <div ref={mountRef} style={{ width:"260px", height:"260px", cursor:"pointer" }}/>;
}

// ─── Genre Explosion Overlay ──────────────────────────────────────────────────

function GenreExplosion({ genre, onDone }) {
  const [phase, setPhase] = useState("burst");
  const [particles] = useState(() => {
    const colors = ["#f0a500","#ff4444","#ff8800","#ffdd00","#ffffff","#ff66aa","#44ffff","#ff44ff"];
    return Array.from({length:60},(_,i)=>({
      id:i,
      angle:(i/60)*Math.PI*2+Math.random()*0.3,
      dist:100+Math.random()*220,
      size:4+Math.random()*14,
      color:colors[i%colors.length],
      delay:Math.random()*0.12,
    }));
  });

  useEffect(()=>{
    const t1=setTimeout(()=>setPhase("text"),500);
    const t2=setTimeout(()=>setPhase("fade"),2100);
    const t3=setTimeout(()=>{ setPhase("burst"); onDone(); },2600);
    return ()=>{clearTimeout(t1);clearTimeout(t2);clearTimeout(t3);};
  },[]);

  return (
    <div style={{
      position:"fixed",inset:0,zIndex:1000,overflow:"hidden",
      display:"flex",alignItems:"center",justifyContent:"center",
      background: phase==="burst"
        ? "radial-gradient(circle at 50% 50%,#ffaa00 0%,#cc2200 35%,#110000 100%)"
        : phase==="text"
        ? "radial-gradient(circle,#1a0000 0%,#000 100%)"
        : "rgba(0,0,0,0)",
      transition: phase==="fade" ? "opacity 0.5s" : "background 0.25s",
      opacity: phase==="fade" ? 0 : 1,
      pointerEvents: phase==="fade" ? "none" : "all",
    }}>
      {phase==="burst" && particles.map(p=>(
        <div key={p.id} style={{
          position:"absolute",left:"50%",top:"50%",
          width:p.size,height:p.size,borderRadius:"50%",
          background:p.color,
          boxShadow:`0 0 ${p.size*2}px ${p.color}`,
          animation:`pOut 0.55s ease-out ${p.delay}s both`,
          "--tx":`${Math.cos(p.angle)*p.dist}px`,
          "--ty":`${Math.sin(p.angle)*p.dist}px`,
        }}/>
      ))}
      {(phase==="text"||phase==="fade") && (
        <div style={{textAlign:"center",animation:"slamIn 0.28s cubic-bezier(0.175,0.885,0.32,1.275) both",padding:"0 24px"}}>
          <div style={{fontFamily:"Oswald,sans-serif",fontSize:14,color:"#f0a500",
            letterSpacing:6,textTransform:"uppercase",marginBottom:10,opacity:0.8}}>
            Sacred Genre Revealed
          </div>
          <div style={{fontFamily:"serif",fontSize:60,fontWeight:700,color:"#f0a500",lineHeight:1.1,
            textShadow:"0 0 40px rgba(240,165,0,1),0 0 80px rgba(240,165,0,0.5)"}}>
            {genre}
          </div>
          <div style={{fontFamily:"Oswald,sans-serif",fontSize:20,color:"rgba(240,165,0,0.5)",
            letterSpacing:6,marginTop:14}}>✦ ✦ ✦</div>
        </div>
      )}
      <style>{`
        @keyframes pOut {
          0%   { opacity:1; transform:translate(-50%,-50%) translate(0px,0px) scale(1.5); }
          100% { opacity:0; transform:translate(-50%,-50%) translate(var(--tx),var(--ty)) scale(0.3); }
        }
        @keyframes slamIn {
          0%   { transform:scale(2.8); opacity:0; }
          65%  { transform:scale(0.93); opacity:1; }
          100% { transform:scale(1); opacity:1; }
        }
      `}</style>
    </div>
  );
}

// ─── Bell Flash Overlay ───────────────────────────────────────────────────────

function BellFlash({ time, onDone }) {
  const [phase, setPhase] = useState("flash");
  useEffect(()=>{
    const t1=setTimeout(()=>setPhase("time"),160);
    const t2=setTimeout(()=>setPhase("fade"),2300);
    const t3=setTimeout(()=>{ setPhase("flash"); onDone(); },2800);
    return ()=>{clearTimeout(t1);clearTimeout(t2);clearTimeout(t3);};
  },[]);

  return (
    <div style={{
      position:"fixed",inset:0,zIndex:1000,
      display:"flex",alignItems:"center",justifyContent:"center",
      background: phase==="flash"?"white":phase==="time"?"rgba(0,0,0,0.93)":"rgba(0,0,0,0)",
      transition: phase==="flash"?"none":"background 0.35s, opacity 0.5s",
      opacity: phase==="fade"?0:1,
      pointerEvents: phase==="fade" ? "none" : "all",
    }}>
      {(phase==="time"||phase==="fade") && (
        <div style={{textAlign:"center",animation:"slamIn 0.22s cubic-bezier(0.175,0.885,0.32,1.275) both"}}>
          <div style={{fontFamily:"Oswald,sans-serif",fontSize:14,color:"#f0a500",
            letterSpacing:6,textTransform:"uppercase",marginBottom:14,opacity:0.7}}>
            🔔 Song Written In
          </div>
          <div style={{fontFamily:"Oswald,sans-serif",fontSize:100,fontWeight:700,
            color:"#f0a500",textShadow:"0 0 60px rgba(240,165,0,1)",letterSpacing:4,lineHeight:1}}>
            {time}
          </div>
        </div>
      )}
      <style>{`
        @keyframes slamIn {
          0%   { transform:scale(3.2); opacity:0; }
          65%  { transform:scale(0.94); opacity:1; }
          100% { transform:scale(1); opacity:1; }
        }
      `}</style>
    </div>
  );
}

// ─── Word Card (handwriting reveal) ──────────────────────────────────────────

function WordCard({ word, numeral, delay }) {
  const [chars, setChars] = useState([]);
  const [visible, setVisible] = useState(false);

  useEffect(()=>{
    setChars([]); setVisible(false);
    const t = setTimeout(()=>{
      setVisible(true);
      let i=0;
      const iv = setInterval(()=>{
        i++;
        setChars(word.slice(0,i).split(""));
        if (i>=word.length) clearInterval(iv);
      }, 60);
      return ()=>clearInterval(iv);
    }, delay);
    return ()=>clearTimeout(t);
  },[word,delay]);

  return (
    <div style={{
      background:"linear-gradient(135deg,#001a00,#001a0a)",
      border:`2px solid ${visible?"#2d7a2d":"#0a2a0a"}`,
      borderRadius:6,padding:"15px 24px",
      display:"flex",alignItems:"center",gap:18,
      boxShadow:visible?"0 0 16px rgba(45,122,45,0.5)":"none",
      width:"100%",maxWidth:360,minHeight:68,
      transition:"border-color 0.4s, box-shadow 0.4s",
    }}>
      <span style={{fontFamily:"Oswald,sans-serif",fontSize:13,color:"#2d7a2d",
        letterSpacing:2,fontWeight:700,minWidth:30,
        opacity:visible?1:0,transition:"opacity 0.3s"}}>
        {numeral}
      </span>
      <span style={{fontFamily:"serif",fontSize:32,color:"#7fff7f",
        textShadow:"0 0 12px rgba(127,255,127,0.7)",letterSpacing:2}}>
        {chars.join("")}
        {visible && chars.length<word.length && (
          <span style={{animation:"blink 0.5s infinite"}}>|</span>
        )}
      </span>
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const S = {
  app:{
    background:"#0a0a0a",minHeight:"100vh",color:"#e8e0d0",fontFamily:"Oswald,sans-serif",
    backgroundImage:
      "repeating-linear-gradient(0deg,transparent,transparent 40px,rgba(255,255,255,0.015) 40px,rgba(255,255,255,0.015) 41px),"+
      "repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(255,255,255,0.015) 40px,rgba(255,255,255,0.015) 41px)",
  },
  header:{textAlign:"center",padding:"16px 16px 10px",borderBottom:"2px solid #c0392b",
    background:"linear-gradient(180deg,#1a0000 0%,#0a0a0a 100%)"},
  headerImg:{width:"100%",maxWidth:440,filter:"drop-shadow(0 4px 12px rgba(192,57,43,0.5))"},
  headerFallback:{fontFamily:"serif",fontSize:28,color:"#f0a500",textShadow:"0 0 20px rgba(240,165,0,0.8)",letterSpacing:2},
  tagline:{fontFamily:"serif",fontSize:12,color:"#f0a500",letterSpacing:3,textTransform:"uppercase",marginTop:4,opacity:0.8},
  tabs:{display:"flex",background:"#1a1a1a",borderBottom:"2px solid #c0392b"},
  tab:(a)=>({flex:1,padding:"12px 4px",textAlign:"center",fontFamily:"Oswald,sans-serif",
    fontSize:11,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",
    color:a?"#f0a500":"#888",borderBottom:a?"3px solid #f0a500":"3px solid transparent",
    background:a?"rgba(240,165,0,0.05)":"none",cursor:"pointer",border:"none",position:"relative",top:2}),
  screen:{padding:"22px 18px 36px"},
  lbl:{fontFamily:"serif",fontSize:26,color:"#f0a500",textAlign:"center",
    textShadow:"0 0 20px rgba(240,165,0,0.8)",marginBottom:5,letterSpacing:1},
  sub:{fontFamily:"serif",fontSize:12,color:"#888",textAlign:"center",
    letterSpacing:2,textTransform:"uppercase",marginBottom:20},
  col:{display:"flex",flexDirection:"column",alignItems:"center",gap:20},
  rollBtn:(dis)=>({
    background:dis?"#2a2a2a":"linear-gradient(135deg,#c0392b 0%,#8b0000 100%)",
    color:dis?"#555":"white",border:"1px solid rgba(255,255,255,0.1)",padding:"18px 0",
    fontFamily:"serif",fontSize:24,letterSpacing:2,borderRadius:4,
    cursor:dis?"not-allowed":"pointer",
    boxShadow:dis?"none":"0 0 22px rgba(192,57,43,0.8),inset 0 1px 0 rgba(255,255,255,0.15)",
    width:"100%",maxWidth:360,textTransform:"uppercase",transition:"all 0.2s",
  }),
  genreResult:{background:"linear-gradient(135deg,#1a0000,#2a0a00)",border:"2px solid #f0a500",
    borderRadius:6,padding:"18px 28px",textAlign:"center",width:"100%",maxWidth:360,
    boxShadow:"0 0 22px rgba(240,165,0,0.8)"},
  genreLabel:{fontFamily:"serif",fontSize:12,color:"#888",letterSpacing:3,textTransform:"uppercase",marginBottom:6},
  genreName:{fontFamily:"serif",fontSize:36,color:"#f0a500",textShadow:"0 0 22px rgba(240,165,0,0.8)",lineHeight:1.2},
  genreNum:{fontFamily:"Oswald,sans-serif",fontSize:12,color:"#666",marginTop:4,letterSpacing:2},
  usedWrap:{width:"100%",maxWidth:360},
  usedLabel:{fontFamily:"Oswald,sans-serif",fontSize:11,color:"#555",letterSpacing:2,textTransform:"uppercase",marginBottom:7,textAlign:"center"},
  genreGrid:{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6},
  pill:(u,c)=>({
    background:c?"rgba(240,165,0,0.15)":u?"rgba(192,57,43,0.15)":"#2a2a2a",
    border:`1px solid ${c?"#f0a500":u?"#c0392b":"#333"}`,
    borderRadius:3,padding:"6px 4px",fontFamily:"Oswald,sans-serif",fontSize:10,
    letterSpacing:0.5,textAlign:"center",textTransform:"uppercase",
    color:c?"#f0a500":u?"#c0392b":"#666",
    textDecoration:u&&!c?"line-through":"none",opacity:u&&!c?0.6:1,
  }),
  resetBtn:{marginTop:8,width:"100%",background:"none",border:"1px solid #333",color:"#555",
    padding:9,fontFamily:"Oswald,sans-serif",fontSize:11,letterSpacing:2,textTransform:"uppercase",
    borderRadius:3,cursor:"pointer"},
  wordsBtn:{background:"linear-gradient(135deg,#1a3a1a 0%,#0a1f0a 100%)",color:"#7fff7f",
    border:"2px solid #2d7a2d",padding:"18px 0",fontFamily:"serif",fontSize:22,letterSpacing:2,
    borderRadius:4,cursor:"pointer",boxShadow:"0 0 20px rgba(45,122,45,0.6)",
    width:"100%",maxWidth:360,textTransform:"uppercase"},
  redrawBtn:{width:"100%",maxWidth:360,background:"none",border:"1px solid #2d7a2d",
    color:"#2d7a2d",padding:11,fontFamily:"Oswald,sans-serif",fontSize:12,letterSpacing:2,
    textTransform:"uppercase",borderRadius:3,cursor:"pointer"},
  timerFace:(r)=>({width:250,height:250,borderRadius:"50%",
    background:"radial-gradient(circle at 35% 35%,#2a2a2a,#0a0a0a)",
    border:`4px solid ${r?"#ff4444":"#f0a500"}`,
    boxShadow:`0 0 ${r?34:22}px rgba(${r?"255,68,68":"240,165,0"},0.9),inset 0 0 30px rgba(0,0,0,0.8)`,
    display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
    transition:"border-color 0.4s,box-shadow 0.4s"}),
  timerDigits:(r)=>({fontFamily:"Oswald,sans-serif",fontSize:68,fontWeight:700,
    color:r?"#ff6666":"#f0a500",
    textShadow:`0 0 26px rgba(${r?"255,100,100":"240,165,0"},0.9)`,letterSpacing:2}),
  timerLbl:{fontFamily:"serif",fontSize:12,color:"#666",letterSpacing:3,textTransform:"uppercase",marginTop:5},
  timerControls:{display:"flex",gap:14,width:"100%",maxWidth:360},
  startBtn:{flex:1,padding:"18px 10px",fontFamily:"serif",fontSize:20,letterSpacing:1,borderRadius:4,
    cursor:"pointer",border:"2px solid #3a8a1a",background:"linear-gradient(135deg,#1a4a00,#0a2500)",
    color:"#7fff7f",boxShadow:"0 0 18px rgba(58,138,26,0.5)",textTransform:"uppercase"},
  stopBtn:{flex:1,padding:"18px 10px",fontFamily:"serif",fontSize:20,letterSpacing:1,borderRadius:4,
    cursor:"pointer",border:"2px solid #c0392b",background:"linear-gradient(135deg,#c0392b,#8b0000)",
    color:"white",boxShadow:"0 0 20px rgba(192,57,43,0.8)",textTransform:"uppercase"},
  resetTimerBtn:{flex:"0 0 80px",padding:"18px 10px",fontFamily:"serif",fontSize:14,borderRadius:4,
    cursor:"pointer",border:"2px solid #444",background:"#1a1a1a",color:"#888",textTransform:"uppercase"},
  bellBtn:{background:"linear-gradient(135deg,#4a3800,#2a1f00)",border:"2px solid #f0a500",
    color:"#f0a500",padding:"18px 0",borderRadius:4,fontFamily:"serif",fontSize:22,
    cursor:"pointer",boxShadow:"0 0 22px rgba(240,165,0,0.8)",width:"100%",maxWidth:360,
    textAlign:"center",letterSpacing:2,display:"flex",alignItems:"center",justifyContent:"center",gap:12},
  summaryCard:{background:"#1a1a1a",borderRadius:6,padding:"16px 20px",border:"1px solid #333",width:"100%",maxWidth:360},
  summaryCardLabel:{fontFamily:"Oswald,sans-serif",fontSize:11,color:"#555",letterSpacing:3,textTransform:"uppercase",marginBottom:7},
  newSongBtn:{background:"linear-gradient(135deg,#c0392b,#8b0000)",color:"white",border:"none",
    padding:20,fontFamily:"serif",fontSize:22,letterSpacing:2,borderRadius:4,cursor:"pointer",
    boxShadow:"0 0 20px rgba(192,57,43,0.8)",width:"100%",maxWidth:360,textTransform:"uppercase",marginTop:10},
};

// ─── App ─────────────────────────────────────────────────────────────────────

function App() {
  const [tab,setTab]                     = useState("die");
  const [usedGenres,setUsedGenres]       = useState([]);
  const [currentGenre,setCurrentGenre]   = useState(null);
  const [words,setWords]                 = useState([]);
  const [seconds,setSeconds]             = useState(0);
  const [running,setRunning]             = useState(false);
  const [finalSecs,setFinalSecs]         = useState(null);
  const [rolling,setRolling]             = useState(false);
  const [triggerRoll,setTriggerRoll]     = useState(0);
  const [pickedFace,setPickedFace]       = useState(null);
  const [imgError,setImgError]           = useState(false);
  const [showExplosion,setShowExplosion] = useState(false);
  const [pendingGenre,setPendingGenre]   = useState(null);
  const [showBellFlash,setShowBellFlash] = useState(false);
  const timerRef = useRef(null);

  const fmt = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;

  useEffect(()=>{
    if (running) {
      timerRef.current = setInterval(()=>setSeconds(s=>s+1),1000);
    } else { clearInterval(timerRef.current); }
    return ()=>clearInterval(timerRef.current);
  },[running]);

  const startTimer = () => { setRunning(true); setFinalSecs(null); setTab("timer"); };
  const stopTimer  = () => { setRunning(false); setFinalSecs(seconds); };
  const resetTimer = () => { setRunning(false); setSeconds(0); setFinalSecs(null); };

  const ringBell = () => {
    const s = running ? seconds : (finalSecs??seconds);
    if (running) { setRunning(false); setFinalSecs(seconds); }
    if (s>0) { audio.playBell(); setShowBellFlash(true); }
  };

  const drawWords = () => {
    const w = [...WORD_POOL].sort(()=>Math.random()-0.5).slice(0,3);
    setWords(w);
    w.forEach((_,i)=>audio.playWordShimmer(i*0.95));
  };

  const handleRoll = () => {
    const avail = GENRES.map((_,i)=>i).filter(i=>!usedGenres.includes(i));
    if (!avail.length) { alert("All 12 genres played! Reset to continue."); return; }
    const picked = avail[Math.floor(Math.random()*avail.length)];
    setPickedFace(picked); setRolling(true);
    setTriggerRoll(t=>t+1);
    audio.playDiceRoll(3.2);
  };

  const handleRollComplete = useCallback(()=>{
    setCurrentGenre(pickedFace);
    setUsedGenres(u=>[...u,pickedFace]);
    setRolling(false);
    audio.playTada();
    setPendingGenre(pickedFace);
    setTimeout(()=>setShowExplosion(true),150);
  },[pickedFace]);

  const resetGenres = () => {
    setUsedGenres([]); setCurrentGenre(null);
  };

  const newSong = () => {
    setWords([]); setSeconds(0); setRunning(false); setFinalSecs(null);
    setPickedFace(null); setTriggerRoll(0);
    setTab("die");
  };

  const finalTime = finalSecs??seconds;
  const finalDesc = finalTime===0?"":
    Math.floor(finalTime/60)===0?`${finalTime} seconds — lightning fast!`:
    Math.floor(finalTime/60)===1?"Under 2 minutes — legendary!":
    `${Math.floor(finalTime/60)}m ${finalTime%60}s — a masterpiece!`;

  return (
    <div style={S.app}>

      {showExplosion && pendingGenre!==null && (
        <GenreExplosion genre={GENRES[pendingGenre]} onDone={()=>setShowExplosion(false)}/>
      )}
      {showBellFlash && (
        <BellFlash time={fmt(finalSecs??seconds)} onDone={()=>setShowBellFlash(false)}/>
      )}

      {/* Header */}
      <div style={S.header}>
        {!imgError?(
          <img src="assets/header.jpg"
            alt="Rock Improv-a-Ganza" style={S.headerImg}/>
        ):(
          <div style={S.headerFallback}>Rock Improv-a-Ganza</div>
        )}
      
      </div>

      {/* Tabs */}
      <div style={S.tabs}>
        {[["die","🎲","Die"],["words","📖","Words"],["timer","⏱️","Timer"],["summary","🎵","Song"]].map(([id,icon,lbl])=>(
          <button key={id} style={S.tab(tab===id)} onClick={()=>setTab(id)}>
            <span style={{fontSize:16,display:"block",marginBottom:2}}>{icon}</span>{lbl}
          </button>
        ))}
      </div>

      {/* ── DIE ── */}
      {tab==="die"&&(
        <div style={S.screen}>
          <div style={S.lbl}>Die of Destiny</div>
          <div style={S.sub}>Roll to reveal your genre</div>
          <div style={S.col}>
            {/* Die of Destiny artwork */}
            <img src={IMG_DIE} alt="Die of Destiny"
              style={{width:220, height:"auto", filter:"drop-shadow(0 4px 16px rgba(0,0,0,0.7))"}}
            />
            <D12Die triggerRoll={triggerRoll} pickedFace={pickedFace} onRollComplete={handleRollComplete}/>
            <button style={S.rollBtn(rolling)} onClick={handleRoll} disabled={rolling}>
              {rolling?"Rolling…":"🎲 Roll the Die!"}
            </button>
            {currentGenre!==null&&(
              <div style={S.genreResult}>
                <div style={S.genreLabel}>Sacred Genre Revealed</div>
                <div style={S.genreName}>{GENRES[currentGenre]}</div>
                <div style={S.genreNum}>Die Face {currentGenre+1} of 12</div>
              </div>
            )}
            <div style={S.usedWrap}>
              <div style={S.usedLabel}>Genre Board — 12 Sides</div>
              <div style={S.genreGrid}>
                {GENRES.map((g,i)=>(
                  <div key={i} style={S.pill(usedGenres.includes(i),currentGenre===i)}>{g}</div>
                ))}
              </div>
              <button style={S.resetBtn} onClick={resetGenres}>↺ Reset All Genres</button>
            </div>
          </div>
        </div>
      )}

      {/* ── WORDS ── */}
      {tab==="words"&&(
        <div style={S.screen}>
          <div style={S.lbl}>Lyrical Tome</div>
          <div style={S.sub}>Summon three sacred words</div>
          <div style={S.col}>

            {/* Lyrical Tome artwork */}
            <img src={IMG_TOME} alt="The Lyrical Tome"
              style={{width:220, height:"auto", filter:"drop-shadow(0 4px 16px rgba(0,0,0,0.7))"}}
            />

            <button style={S.wordsBtn} onClick={drawWords}>📖 Summon Three Words</button>
            {words.length>0&&(
              <>
                {words.map((w,i)=>(
                  <WordCard key={`${w}-${i}`} word={w} numeral={["I","II","III"][i]} delay={i*950}/>
                ))}
                <button style={S.redrawBtn} onClick={drawWords}>✦ Draw New Words</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── TIMER ── */}
      {tab==="timer"&&(
        <div style={S.screen}>
          <div style={S.lbl}>The Clock</div>
          <div style={S.sub}>Write it before time devours you</div>
          <div style={S.col}>

            {/* Sands of Time artwork */}
            <img src={IMG_HOURGLASS} alt="The Sands of Time"
              style={{width:176, height:"auto", filter:"drop-shadow(0 4px 16px rgba(0,0,0,0.8))"}}
            />
            <div style={S.timerFace(running)}>
              <div style={S.timerDigits(running)}>{fmt(seconds)}</div>
              <div style={S.timerLbl}>{running?"Composing…":finalSecs!==null?"Stopped":"Ready"}</div>
            </div>
            <div style={S.timerControls}>
              {!running
                ?<button style={S.startBtn} onClick={startTimer}>▶ Start</button>
                :<button style={S.stopBtn} onClick={stopTimer}>■ Stop</button>
              }
              <button style={S.resetTimerBtn} onClick={resetTimer}>↺</button>
            </div>
            <button style={S.bellBtn} onClick={ringBell}>
              <span style={{fontSize:26}}>🔔</span>
              <span>Ring the Bell!</span>
            </button>
            {finalSecs!==null&&finalSecs>0&&(
              <div style={{background:"linear-gradient(135deg,#1a1000,#0a0800)",border:"2px solid #f0a500",
                borderRadius:6,padding:"18px 28px",textAlign:"center",width:"100%",maxWidth:360,
                boxShadow:"0 0 22px rgba(240,165,0,0.8)"}}>
                <div style={{fontFamily:"serif",fontSize:12,color:"#888",letterSpacing:3,textTransform:"uppercase",marginBottom:8}}>Song Written In</div>
                <div style={{fontFamily:"Oswald,sans-serif",fontSize:52,fontWeight:700,color:"#f0a500",textShadow:"0 0 26px rgba(240,165,0,0.9)"}}>{fmt(finalSecs)}</div>
                <div style={{fontFamily:"serif",fontSize:16,color:"#aaa",marginTop:8}}>{finalDesc}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SUMMARY ── */}
      {tab==="summary"&&(
        <div style={S.screen}>
          <div style={S.lbl}>Tonight's Song</div>
          <div style={S.sub}>The sacred elements revealed</div>
          <div style={S.col}>
            <div style={S.summaryCard}>
              <div style={S.summaryCardLabel}>🎲 Genre</div>
              <div style={{fontFamily:"serif",fontSize:28,color:"#f0a500",textShadow:"0 0 20px rgba(240,165,0,0.8)"}}>
                {currentGenre!==null?GENRES[currentGenre]:<span style={{color:"#444",fontStyle:"italic",fontSize:15}}>Not yet rolled</span>}
              </div>
            </div>
            <div style={S.summaryCard}>
              <div style={S.summaryCardLabel}>📖 Sacred Words</div>
              <div style={{fontFamily:"serif",fontSize:24,color:"#7fff7f",lineHeight:1.6}}>
                {words.length?words.join(" · "):<span style={{color:"#444",fontStyle:"italic",fontSize:15}}>Not yet drawn</span>}
              </div>
            </div>
            <div style={S.summaryCard}>
              <div style={S.summaryCardLabel}>⏱️ Composition Time</div>
              <div style={{fontFamily:"Oswald,sans-serif",fontSize:40,color:"#ff9999",fontWeight:700}}>
                {finalSecs?fmt(finalSecs):<span style={{color:"#444",fontStyle:"italic",fontSize:15,fontFamily:"serif",fontWeight:400}}>Timer not stopped</span>}
              </div>
            </div>
            <div style={{color:"#c0392b",fontSize:16,opacity:0.5,letterSpacing:5}}>🔥 · · 🔥 · · 🔥</div>
            <button style={S.newSongBtn} onClick={newSong}>🎸 Next Song</button>
          </div>
        </div>
      )}

    </div>
  );
}

window.App = App;
