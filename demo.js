/* Local presentation only. No shell, network, storage or telemetry. */
(() => {
  "use strict";
  const demo = document.getElementById("workspace-demo");
  if (!demo) return;
  const output = document.getElementById("terminal-output");
  const controls = demo.querySelector(".demo-controls");
  const toggle = document.getElementById("demo-toggle");
  const replay = document.getElementById("demo-replay");
  const palette = document.getElementById("demo-palette");
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const steps = [
    {cmd:"uptime", out:"  up 12 days, 04:32\n  load average: 0.12, 0.08, 0.05"},
    {cmd:"df -h", out:"Filesystem    Size   Used\n/dev/vda1      80G    24G"},
    {cmd:"systemctl is-active ssh", out:"active"},
    {cmd:"ip -br addr", out:"lo      UNKNOWN  127.0.0.1/8\neth0    UP       192.0.2.10/24"}
  ];
  let timer = null, running = false, step = 0, pos = 0, phase = "typing", remaining = 120, transcript = [];
  let inView = true;
  function paint() {
    output.replaceChildren();
    function prompt(cmd) {
      const span = document.createElement("span");
      span.className = "prompt"; span.textContent = "admin@lab-node-01";
      output.append(span, document.createTextNode(":~$ " + cmd));
    }
    for (const item of transcript) {
      prompt(item.cmd);
      output.append(document.createTextNode("\n" + item.out + "\n\n"));
    }
    prompt(step < steps.length ? steps[step].cmd.slice(0,pos) : "");
    const cursor = document.createElement("span");
    cursor.className="cursor"; cursor.setAttribute("aria-hidden","true"); cursor.textContent="▌";
    output.append(cursor);
    output.scrollTop = output.scrollHeight;
  }
  function stopTimer() { if (timer !== null) clearTimeout(timer); timer = null; }
  function schedule(ms) {
    stopTimer(); remaining=ms;
    if (running && inView && !document.hidden) timer=setTimeout(tick, ms);
  }
  function tick() {
    timer=null;
    if (!running || !inView || document.hidden) return;
    if (phase==="done") { reset(); return; }
    const current=steps[step];
    if (phase==="typing") {
      pos++;
      paint();
      if (pos>=current.cmd.length) {phase="output";schedule(380);}
      else schedule(48+(pos%5)*13);
    } else {
      transcript.push(current); step++; pos=0; paint();
      if (step>=steps.length) {phase="done";schedule(5000);}
      else {phase="typing";schedule(1050);}
    }
  }
  function reset() {step=0;pos=0;phase="typing";transcript=[];paint();schedule(650);}
  function setRunning(value) {
    running=value;demo.dataset.playing=String(value);toggle.textContent=value?"Pause":"Play";
    if(value)schedule(remaining);else stopTimer();
  }
  function showStatic() {transcript=steps.slice(0,2);step=steps.length;pos=0;phase="done";paint();}
  controls.hidden=false;
  toggle.addEventListener("click",()=>{if(!running && phase==="done"){reset();}setRunning(!running);});
  replay.addEventListener("click",()=>{reset();setRunning(true);});
  palette.addEventListener("change",()=>{demo.dataset.palette=palette.value;});
  document.addEventListener("visibilitychange",()=>{if(document.hidden)stopTimer();else if(running)schedule(remaining);});
  if("IntersectionObserver" in window){
    new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;if(!inView)stopTimer();else if(running)schedule(remaining);},{threshold:0.1}).observe(demo);
  }
  if(motion.addEventListener)motion.addEventListener("change",()=>{if(motion.matches){setRunning(false);showStatic();}});
  if(motion.matches){showStatic();setRunning(false);}else{reset();setRunning(true);}
})();
