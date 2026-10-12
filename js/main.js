"use strict";

const $=id=>document.getElementById(id);
const canvas=$("game");
let ctx=canvas.getContext("2d");
$("journal").append(document.querySelector(".guide"));
const hazardGuide=document.createElement("p");
hazardGuide.textContent=`อุปสรรค ${hazardSpecs.length} จุด ด่านละ 4 จุด กระจายตามเส้นทางและเว้นพื้นที่ปลอดภัยหน้าแคมป์ ภาพแสดงตามประเภท เช่น พื้นแห้ง น้ำท่วม แผงอาหาร จุดรอรถ ท่อน้ำ และโต๊ะเงินกู้ แถบเหลืองแดงที่พื้นแสดงเขตอันตราย ต้องกระโดดให้เท้าพ้นเขตนี้ ไม่ใช่แค่พ้นยอดภาพตกแต่ง แบ่งผลกระทบต่อจุดให้เบาลง โดยยอดรวมต่อด่านก่อนใช้นโยบายยังเท่าเดิม มีผลทุกครั้งที่เข้าไปสัมผัสใหม่ ยืนค้างจะไม่หักซ้ำ ต้องออกจากจุดนั้นหรือกระโดดพ้นแล้วกลับมาสัมผัสจึงจะมีผลอีกครั้ง นโยบายที่เก็บไว้ยังช่วยป้องกันหรือลดผลกระทบตามประเภทอุปสรรค`;
document.querySelector(".guide").append(hazardGuide);
const secretGuide=document.createElement("p");
secretGuide.textContent="โหมดลับ: กด ↑ ↑ ↓ ↓ ← → ← → B A ในหน้าเริ่มหรือระหว่างเล่น ใช้ตำแหน่งปุ่ม B A ได้ทั้งแป้นไทยและอังกฤษ เปิดตัวละครพิกเซลอนุทิน ชาญวีรกูลในบริบทล้อเลียนของเกม ไม่ใช่คำพูดจริงหรือการรับรองจากบุคคลดังกล่าว เงินและคุณภาพชีวิตไม่จำกัด ภารกิจครบทันที และวิ่งเร็วพร้อมออร่าสีทองต้นฉบับ โหมดนี้ไม่บันทึกทับเซฟปกติ เริ่มเกมใหม่หรือรีเฟรชเพื่อกลับโหมดปกติ";
document.querySelector(".guide").append(secretGuide);
const renderingGuide=document.createElement("p");
renderingGuide.textContent="ระบบภาพเก็บแคชฉากหลังเฉพาะพื้นที่เหนือพื้นดิน รวมภาพและป้ายอุปสรรคไว้ในแคชพื้นฉาก เหลือเฉพาะเอฟเฟกต์เคลื่อนไหวที่วาดทุกเฟรม เพดานแคชปรับตามความกว้างพื้นที่เล่นเพื่อไม่ให้ภาพที่ยังอยู่บนจอถูกลบและสร้างซ้ำ และเตรียมส่วนถัดไปช่วงเบราว์เซอร์ว่างเมื่อมีพื้นที่แคชเหลือ สไปรต์ใช้คีย์ที่เตรียมไว้แทนการแปลงข้อมูลทุกเฟรม";
document.querySelector(".guide").append(renderingGuide);
const transitionGuide=document.createElement("p");
transitionGuide.textContent="เมื่อข้ามด่าน ฉากหลังค่อย ๆ เปลี่ยนภายใน 0.65 วินาทีโดยไม่หยุดการเดิน หากตั้งค่าลดการเคลื่อนไหวในอุปกรณ์ จะเปลี่ยนฉากทันที";
document.querySelector(".guide").append(transitionGuide);
const reducedMotion=matchMedia("(prefers-reduced-motion: reduce)").matches;
const keys=new Set(),pointers=new Map();
const keyboardInputs=new Map();
const hazardContacts=new Set();
const format=n=>Math.round(n).toLocaleString("th-TH");
const beep=(frequency,duration)=>gameAudio.beep(frequency,duration);
let camera=0,viewW=W,time=0,last=0,hudTime=0,toastTimer=0,nearby=null,conversationZone=-1;
let mode="title",hasSession=false,loadedSave=null;
let backgroundZone=null,backgroundTransition=null;
let state;
let hudSignature="",bagSignature=null,interactionLabel="";
let accumulator=0,previousPose=null,lastRenderedMode="";
const FIXED_STEP=1/60;
const konamiCode=["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","KeyB","KeyA"];
let konamiInputs=[];
let secretMode=false;

function activateSecretMode(){
  if(secretMode)return;
  if(mode==="title")startNew();
  secretMode=true;player.superMode=true;state.invulnerable=0;
  for(let zone=0;zone<4;zone++){state.accepted.add(zone);state.completed.add(zone);state.visited.add(zone);}
  itemSpecs.forEach(item=>state.policies.add(item.id));
  resources.forEach(item=>state.resources.add(item.id));
  state.quality=100;clearControls();hudSignature="";updateHUD();renderJournal();
  $("save-indicator").textContent="โหมดลับ · ไม่บันทึกทับเซฟปกติ";
  notify("รวยไม่ไหวแล้วโว๊ยยยยยยยย");beep(880,.3);
}

function initialState(){
  return {balance:REPORT_STATS.povertyLine,quality:GAME_CONFIG.initialQuality,
    policies:new Set(),resources:new Set(),accepted:new Set(),completed:new Set(),
    visited:new Set(),resolved:new Set(),respawnX:GAME_CONFIG.startX,invulnerable:0,finished:false};
}
function clearControls(){
  keys.clear();pointers.clear();keyboardInputs.clear();
  player.jumpBuffer=0;player.jumpHeld=false;
  document.querySelectorAll("[data-control]").forEach(button=>button.classList.remove("held"));
}
function controlled(control){return keys.has(control)||Array.from(pointers.values()).includes(control);}
function notify(message){
  $("toast").textContent=message;clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>{$("toast").textContent="";},5000);
}
function currentZone(){return Math.min(3,Math.floor((player.x+player.w/2)/ZONE_WIDTH));}
function resourceCount(zone){return resources.filter(item=>item.zone===zone&&state.resources.has(item.id)).length;}
function ready(zone){return state.accepted.has(zone)&&resourceCount(zone)===3&&adventures[zone].required.every(id=>state.policies.has(id));}
function reset(){
  pendingChunks.clear();
  backgroundZone=null;backgroundTransition=null;
  secretMode=false;konamiInputs=[];
  hazardContacts.clear();
  state=initialState();player.reset();time=0;camera=0;conversationZone=-1;particles=[];
  accumulator=0;previousPose=null;last=0;hudSignature="";bagSignature=null;
  $("conversation").hidden=true;$("ending").hidden=true;$("journal").hidden=true;
  $("journal-toggle").setAttribute("aria-expanded","false");clearControls();updateHUD();renderJournal();
  $("scene-journal").setAttribute("aria-expanded","false");
  clearTimeout(toastTimer);$("toast").textContent="";$("save-indicator").textContent="จุดเซฟ: แคมป์ท้ายแต่ละด่าน";
}
function startNew(){
  reset();hasSession=true;mode="playing";$("title-screen").hidden=true;$("pause-screen").hidden=true;
  notify(`เริ่มที่${adventures[0].npc} กด E เพื่อคุยและรับภารกิจ`);canvas.focus();
}
function pauseGame(){
  if(mode!=="playing")return;
  mode="paused";clearControls();$("pause-screen").hidden=false;$("unpause").focus();
}
function unpause(){
  mode="playing";$("pause-screen").hidden=true;clearControls();canvas.focus();
}
function title(){
  mode="title";clearControls();$("pause-screen").hidden=true;$("title-screen").hidden=false;
  $("conversation").hidden=true;$("journal").hidden=true;$("ending").hidden=true;
  $("journal-toggle").setAttribute("aria-expanded","false");$("scene-journal").setAttribute("aria-expanded","false");
  $("resume").hidden=!hasSession&&!loadedSave;
  $("resume").textContent=hasSession?"เดินทางต่อจากที่พัก":"เดินทางต่อจากจุดเซฟ";
  $("new-game").focus();
}
function snapshot(){
  return {version:GAME_CONFIG.saveVersion,balance:state.balance,quality:state.quality,
    policies:[...state.policies],resources:[...state.resources],accepted:[...state.accepted],
    completed:[...state.completed],visited:[...state.visited],resolved:[...state.resolved],
    respawnX:state.respawnX,finished:state.finished};
}
function validateSave(data){
  if(!data||data.version!==GAME_CONFIG.saveVersion)throw new Error("รูปแบบจุดเซฟไม่รองรับ");
  for(const key of ["balance","quality","respawnX"]){
    if(!Number.isFinite(data[key]))throw new Error("ข้อมูลจุดเซฟไม่สมบูรณ์");
  }
  if(data.balance<0||data.balance>100000||data.quality<0||data.quality>100||
    ![GAME_CONFIG.startX,...camps.map(camp=>camp.x)].includes(data.respawnX)||typeof data.finished!=="boolean"){
    throw new Error("ค่าจุดเซฟอยู่นอกขอบเขต");
  }
  const allowed={policies:itemSpecs.map(item=>item.id),resources:resources.map(item=>item.id),
    accepted:[0,1,2,3],completed:[0,1,2,3],visited:[0,1,2,3],resolved:hazardSpecs.map((_,i)=>i)};
  for(const [key,values] of Object.entries(allowed)){
    if(!Array.isArray(data[key])||data[key].length>values.length||
      new Set(data[key]).size!==data[key].length||data[key].some(value=>!values.includes(value))){
      throw new Error("รายการในจุดเซฟไม่ถูกต้อง");
    }
  }
  for(const zone of data.completed){
    if(!data.accepted.includes(zone)||!data.visited.includes(zone)||
      !adventures[zone].required.every(id=>data.policies.includes(id))||
      resources.some(item=>item.zone===zone&&!data.resources.includes(item.id))||
      (zone>0&&!data.completed.includes(zone-1)))throw new Error("ลำดับภารกิจในจุดเซฟไม่ถูกต้อง");
  }
  if(data.finished&&data.completed.length!==4)throw new Error("จุดเซฟฉากจบไม่ครบภารกิจ");
  const unlocked=data.completed.length;
  if(data.respawnX>Math.min(END,unlocked*ZONE_WIDTH+ZONE_WIDTH))throw new Error("ตำแหน่งจุดเซฟยังไม่ปลดล็อก");
  return data;
}
function readSave(){
  try{
    const raw=localStorage.getItem(GAME_CONFIG.saveKey);
    if(raw)loadedSave=validateSave(JSON.parse(raw));
    $("resume").hidden=!loadedSave;
    $("save-status").textContent=loadedSave?`พบจุดเซฟ · สำเร็จ ${loadedSave.completed.length}/4 ภารกิจ`:"บันทึกอัตโนมัติที่แคมป์ · เก็บในเบราว์เซอร์นี้";
  }catch(error){
    console.error("Unable to read checkpoint",error);loadedSave=null;$("resume").hidden=true;
    $("save-status").textContent="อ่านจุดเซฟไม่ได้: "+error.message+" · เริ่มเกมใหม่ได้";
  }
}
function saveGame(){
  if(secretMode){
    $("save-indicator").textContent="โหมดลับ · ไม่บันทึกทับเซฟปกติ";
    notify("โหมดลับใช้เฉพาะรอบนี้ · เซฟปกติยังอยู่เหมือนเดิม");
    return false;
  }
  try{
    const data=snapshot();validateSave(data);
    localStorage.setItem(GAME_CONFIG.saveKey,JSON.stringify(data));loadedSave=data;
    $("save-indicator").textContent=`บันทึกแล้ว · แคมป์ ${Math.floor(state.respawnX/ZONE_WIDTH)+1}`;
    return true;
  }catch(error){
    console.error("Unable to save checkpoint",error);
    $("save-indicator").textContent="บันทึกไม่ได้ · ความคืบหน้ายังอยู่ในรอบนี้";
    notify("บันทึกไม่ได้: "+error.message+" (ยังเล่นต่อได้ แต่ปิดหน้าแล้วข้อมูลอาจหาย)");
    return false;
  }
}
function resumeGame(){
  const loadingCheckpoint=!hasSession;
  if(!hasSession){
    if(!loadedSave){notify("ไม่มีจุดเซฟที่ใช้งานได้");return;}
    const data=validateSave(loadedSave);reset();
    state.balance=data.balance;state.quality=Math.max(1,data.quality);state.respawnX=data.respawnX;state.finished=data.finished;
    for(const key of ["policies","resources","accepted","completed","visited","resolved"])state[key]=new Set(data[key]);
    player.reset(state.respawnX);hasSession=true;renderJournal();updateHUD();
  }
  $("title-screen").hidden=true;$("pause-screen").hidden=true;mode=state.finished?"ended":"playing";
  if(state.finished)showEnding();
  if(loadingCheckpoint)$("save-indicator").textContent=`โหลดจุดเซฟ · แคมป์ ${Math.floor(state.respawnX/ZONE_WIDTH)+1}`;
  clearControls();canvas.focus();
}
function updateHUD(){
  const zone=currentZone(),adventure=adventures[zone];
  const signature=[zone,state.balance,state.quality,state.completed.size,state.accepted.has(zone),
    resourceCount(zone),...state.policies].join("|");
  if(signature===hudSignature)return;
  hudSignature=signature;
  $("balance").textContent=secretMode?"ไม่จำกัด":format(state.balance);
  $("quality-text").textContent=secretMode?"ไม่จำกัด":`${Math.round(state.quality)} / 100`;
  $("quality-fill").style.width=state.quality+"%";$("quality-meter").setAttribute("aria-valuenow",Math.round(state.quality));
  if(secretMode){$("quality-meter").removeAttribute("aria-valuenow");$("quality-meter").setAttribute("aria-valuetext","ไม่จำกัด");}
  else $("quality-meter").removeAttribute("aria-valuetext");
  $("progress-text").textContent=`${state.completed.size} / 4`;
  $("zone-number").textContent=`CHAPTER 0${zone+1} / 04`;$("zone-name").textContent=zones[zone].name;
  $("mission-name").textContent=adventure.quest;
  const policies=adventure.required.filter(id=>state.policies.has(id)).length;
  $("mission-progress").textContent=state.completed.has(zone)?"สำเร็จแล้ว · เดินทางต่อ →":
    !state.accepted.has(zone)?`แวะคุยกับ ${adventure.npc} [E] เพื่อรับภารกิจ`:
      `${adventure.resource} ${resourceCount(zone)}/3 · นโยบาย ${policies}/2 · ส่งที่แคมป์ →`;
  $("quest-stage").textContent=state.completed.has(zone)?"✦ ชุมชนนี้พร้อมแล้ว":ready(zone)?"✦ พร้อมส่งภารกิจที่แคมป์":"✦ "+adventure.verb;
  const nextBag=[...state.policies].join("|");
  if(nextBag===bagSignature)return;
  bagSignature=nextBag;
  const bag=$("policies");bag.replaceChildren();
  if(!state.policies.size)bag.textContent="ยังไม่มีนโยบาย";
  for(const item of itemSpecs){
    if(state.policies.has(item.id)){const badge=document.createElement("span");badge.className="buff";badge.textContent=item.name;bag.append(badge);}
  }
}
function renderJournal(){
  const pages=$("journal-pages");pages.replaceChildren();
  if(!state.visited.size){const p=document.createElement("p");p.textContent="คุยกับชาวบ้านเพื่อบันทึกข้อมูลบทแรก";pages.append(p);}
  for(const zone of [...state.visited].sort()){
    const lesson=lessons[zone],article=document.createElement("article");
    article.innerHTML=`<p class="eyebrow">${lesson.tag}</p><h3>${lesson.title}</h3><div class="big">${lesson.big}</div><p>${lesson.caption}</p>${lesson.body}`;
    pages.append(article);
  }
}
function toggleJournal(){
  $("journal").hidden=!$("journal").hidden;
  $("journal-toggle").setAttribute("aria-expanded",String(!$("journal").hidden));
  $("scene-journal").setAttribute("aria-expanded",String(!$("journal").hidden));
  clearControls();
  if(!$("journal").hidden){
    $("journal").scrollTop=0;$("close-journal").focus({preventScroll:true});
  }
  else canvas.focus();
}
function updateNearby(){
  nearby=null;
  for(const npc of npcs)if(Math.abs(player.x-npc.x)<85&&player.y>GROUND-95)nearby={kind:"npc",...npc};
  for(const camp of camps)if(Math.abs(player.x-camp.x)<85&&player.y>GROUND-95)nearby={kind:"camp",...camp};
  const unavailable=!nearby||mode!=="playing";
  if($("interaction").hidden!==unavailable)$("interaction").hidden=unavailable;
  if($("touch-interact").disabled!==unavailable)$("touch-interact").disabled=unavailable;
  if(nearby){
    const label=!$("conversation").hidden?"[E] ปิดข้อความ":nearby.kind==="npc"?`[E] คุยกับ ${adventures[nearby.zone].npc}`:
      state.completed.has(nearby.zone)?"[E] บันทึกที่แคมป์":ready(nearby.zone)?"[E] ส่งภารกิจ / บันทึก":"[E] ดูของที่ต้องส่ง";
    if(label!==interactionLabel){interactionLabel=label;$("interact").textContent=label;}
  }
  if(conversationZone>=0&&Math.abs(player.x-npcs[conversationZone].x)>190){$("conversation").hidden=true;conversationZone=-1;}
}
function interact(){
  if(mode!=="playing")return;
  if(!$("conversation").hidden){
    $("conversation").hidden=true;conversationZone=-1;canvas.focus();return;
  }
  updateNearby();
  if(!nearby){notify("เข้าใกล้ NPC หรือแคมป์ก่อน แล้วกด E");return;}
  const zone=nearby.zone,adventure=adventures[zone];
  if(nearby.kind==="npc"){
    state.accepted.add(zone);state.visited.add(zone);conversationZone=zone;
    $("npc-name").textContent=adventure.npc;
    $("npc-role").textContent=adventure.role+" · "+adventure.quest;
    const portrait=$("npc-portrait"),portraitContext=portrait.getContext("2d"),appearance=npcAppearances[zone];
    portraitContext.clearRect(0,0,portrait.width,portrait.height);portraitContext.imageSmoothingEnabled=false;
    drawCharacter(portraitContext,0,0,0,1,false,appearance.palette,2,appearance.sprite,appearance.glasses);
    $("npc-body").innerHTML=`<p>${state.completed.has(zone)?adventure.ending:adventure.greeting}</p><div class="big">${lessons[zone].big}</div><p>${lessons[zone].caption}</p>${lessons[zone].body}`;
    $("conversation").hidden=false;beep(550,.1);renderJournal();updateHUD();
  }else if(state.completed.has(zone)){
    state.respawnX=nearby.x;state.quality=Math.max(70,state.quality);updateHUD();
    if(saveGame())notify("แคมป์: ฟื้นพลังและบันทึกความคืบหน้าแล้ว");
  }else if(ready(zone)){
    state.completed.add(zone);state.balance+=120;state.quality=Math.min(100,state.quality+15);
    state.respawnX=nearby.x;spawnParticles(nearby.x,GROUND-50,adventure.color,24);
    updateHUD();beep(880,.22);
    if(saveGame())notify(adventure.ending+" · เปิดทางและบันทึกแล้ว");
  }else{
    notify(!state.accepted.has(zone)?`กลับไปคุยกับ ${adventure.npc} เพื่อรับภารกิจก่อน`:
      `ยังต้องเก็บ ${adventure.resource} ${3-resourceCount(zone)} ชิ้น และนโยบายอีก ${adventure.required.filter(id=>!state.policies.has(id)).length} อย่าง`);
  }
}
function impact(hazard,index){
  state.resolved.add(index);
  if(secretMode)return;
  let factor=1;
  if(hazard.type==="drought"&&state.policies.has("irrigation"))factor=0;
  if(hazard.type==="dependency"&&state.policies.has("elderly"))factor=.3;
  if(hazard.type==="transport"){
    if(state.policies.has("education"))factor*=.3;
    if(state.policies.has("scholarship"))factor*=.5;
  }
  if(hazard.type==="debt"&&state.policies.has("finance"))factor=.25;
  const cost=Math.round(hazard.cost*factor),harm=Math.round(hazard.harm*factor);
  state.balance=Math.max(0,state.balance-cost);state.quality=Math.max(0,state.quality-harm);
  notify(factor===0?hazard.label+": ชลประทานช่วยป้องกัน":
    `${hazard.label}: เงิน −${cost} / คุณภาพชีวิต −${harm}${factor<1?" (นโยบายช่วยลดผลกระทบ)":""}`);
  if(harm){state.invulnerable=.8;spawnParticles(player.x,player.y+20,"#f2ab8d",10);}
  beep(harm?180:700,.1);
}
function showEnding(){
  mode="ended";state.finished=true;clearControls();$("interaction").hidden=true;$("ending").hidden=false;
  $("ending-result").textContent=`ช่วยครบ 4 ชุมชน · นโยบาย ${state.policies.size}/8 · ทรัพยากร ${state.resources.size}/12 · เงิน ${secretMode?"ไม่จำกัด":format(state.balance)+" บาท"} · คุณภาพชีวิต ${secretMode?"ไม่จำกัด":Math.round(state.quality)+"/100"}`;
  const cards=[
    [`${REPORT_DISPLAY.povertyLine} บาท`,"เส้นความยากจน / คน / เดือน",`คนจน ${REPORT_DISPLAY.povertyRate}% · ${REPORT_DISPLAY.povertyPopulationMillions} ล้านคน`],
    [`${REPORT_DISPLAY.householdIncome} / ${REPORT_DISPLAY.householdExpenses}`,"รายได้ / รายจ่ายครัวเรือน",`บาทต่อเดือน · ค่าอาหาร ${REPORT_DISPLAY.foodShare}%`],
    [`${REPORT_DISPLAY.dependencyRatio}%`,"อัตราการพึ่งพิง",`1 แรงงาน : ${REPORT_DISPLAY.dependentsPerWorker} ผู้พึ่งพิง`],
    [REPORT_DISPLAY.mpi,"ดัชนี MPI",`${REPORT_DISPLAY.multidimensionalPovertyRate}% · ${REPORT_DISPLAY.multidimensionalPopulationMillions} ล้านคน`],
    [`${REPORT_DISPLAY.livingConditionsContribution}%`,"ส่วนต่อ MPI: ความเป็นอยู่","มิติที่ส่งผลสูงสุด"],
    [`${REPORT_DISPLAY.educationTransportShare}%`,"ค่าเดินทางไปเรียน","ของค่าใช้จ่ายที่นักเรียนยากจนจ่ายเอง"],
    [`${REPORT_DISPLAY.healthCoverage}%`,"ความครอบคลุมบัตรทอง","บริการสุขภาพช่วยลดความเปราะบาง"],
    [`${REPORT_DISPLAY.elderlyCoverage}%`,"ความครอบคลุมเบี้ยยังชีพ",`ค่าจ้างเกษตรเพิ่ม ${REPORT_DISPLAY.agriculturalWageGrowth}%`]
  ];
  $("summary-cards").innerHTML=cards.map(card=>`<article><strong>${card[0]}</strong>${card[1]}<small>${card[2]}</small></article>`).join("");
  $("journal").hidden=true;$("conversation").hidden=true;
  $("journal-toggle").setAttribute("aria-expanded","false");$("scene-journal").setAttribute("aria-expanded","false");
  $("ending").scrollTop=0;$("ending").focus({preventScroll:true});
  $("mission-name").textContent="การเดินทางที่เราเดินไปด้วยกัน";$("mission-progress").textContent="ครบ 4 ภารกิจ · บทสรุปการเดินทาง";
}
function update(dt){
  if(mode!=="playing")return;
  time+=dt;state.invulnerable=Math.max(0,state.invulnerable-dt);
  let limit=END+player.w;
  for(let zone=0;zone<4;zone++)if(!state.completed.has(zone)){limit=(zone+1)*ZONE_WIDTH-32;break;}
  if(player.update(dt,controlled,platforms,limit))beep(330,.07);
  camera=Math.max(0,Math.min(ZONE_WIDTH*4-viewW,player.x-viewW*.34));
  for(const item of itemSpecs){
    const y=GROUND-45;
    if(!state.policies.has(item.id)&&player.x+player.w>item.x-10&&player.x<item.x+25&&player.y+player.h>y-10&&player.y<y+22){
      state.policies.add(item.id);state.balance+=item.amount;state.quality=Math.min(100,state.quality+item.quality);
      spawnParticles(item.x,y,"#b6f0a4",15);notify(item.message);beep(760,.12);updateHUD();
    }
  }
  for(const item of resources){
    if(!state.resources.has(item.id)&&player.x+player.w>item.x-10&&player.x<item.x+16&&player.y+player.h>item.y-12&&player.y<item.y+16){
      state.resources.add(item.id);spawnParticles(item.x,item.y,adventures[item.zone].color,12);
      notify(`${adventures[item.zone].resource} ${resourceCount(item.zone)}/3`);beep(900,.08);updateHUD();
    }
  }
  hazardSpecs.forEach((hazard,index)=>{
    const touching=player.x+player.w>hazard.x&&player.x<hazard.x+hazard.w&&player.y+player.h>GROUND-24;
    if(touching){
      if(!hazardContacts.has(index)){hazardContacts.add(index);impact(hazard,index);}
    }else hazardContacts.delete(index);
  });
  if(state.quality<=0){
    hazardContacts.clear();
    player.reset(state.respawnX);state.quality=55;state.balance=Math.max(0,state.balance-100);state.invulnerable=2;
    camera=Math.max(0,player.x-viewW*.34);notify("พักฟื้นที่แคมป์ · เก็บของไว้ครบ · ค่าเดินทาง 100 บาท");updateHUD();
  }
  updateNearby();
  for(const particle of particles){particle.x+=particle.vx*dt;particle.y+=particle.vy*dt;particle.vy+=260*dt;particle.life-=dt;}
  particles=particles.filter(particle=>particle.life>0);
  if(player.x>=END-2&&state.completed.size===4){beep(1000,.25);showEnding();saveGame();}
  hudTime+=dt;if(hudTime>.15){hudTime=0;updateHUD();}
}

let particles=[];
const imageCache=new Map();
// Bound decoded pixel storage; least-recently-used images are regenerated when revisited.
const CHUNK_WIDTH=512,CHUNK_PADDING=220,CACHE_PIXEL_LIMIT=8000000;
let cachedPixels=0;
function cachePixelLimit(){
  // Keep the visible five-layer working set resident, including chunk overlap and small sprites.
  return Math.max(CACHE_PIXEL_LIMIT,
    (backgroundTransition?7:5)*(Math.ceil(viewW/CHUNK_WIDTH)+1)*CHUNK_WIDTH*H+viewW*H+2000000);
}
const pendingChunks=new Map();
let warmingScheduled=false;
function warmChunks(){
  if(warmingScheduled||!pendingChunks.size)return;
  warmingScheduled=true;
  const schedule=window.requestIdleCallback?
    callback=>window.requestIdleCallback(callback):
    callback=>setTimeout(()=>callback({timeRemaining:()=>4}),50);
  schedule(deadline=>{
    warmingScheduled=false;
    if(document.hidden){pendingChunks.clear();return;}
    if(deadline.timeRemaining()>3){
      const [key,paint]=pendingChunks.entries().next().value||[];
      if(key){pendingChunks.delete(key);if(!imageCache.has(key))paint();}
    }
    warmChunks();
  });
}
function cachedImage(key,width,height,paint){
  if(imageCache.has(key)){
    const image=imageCache.get(key);imageCache.delete(key);imageCache.set(key,image);return image;
  }
  const image=document.createElement("canvas");image.width=width;image.height=height;
  const previousContext=ctx;
  ctx=image.getContext("2d");ctx.imageSmoothingEnabled=false;
  try{paint();}finally{ctx=previousContext;}
  imageCache.set(key,image);cachedPixels+=width*height;
  trimImageCache();
  return image;
}
function trimImageCache(){
  while(cachedPixels>cachePixelLimit()&&imageCache.size>1){
    const oldest=imageCache.keys().next().value,entry=imageCache.get(oldest);
    cachedPixels-=entry.width*entry.height;imageCache.delete(oldest);
  }
}
function cachedChunks(prefix,offset,paint){
  const first=Math.floor(offset/CHUNK_WIDTH),lastChunk=Math.floor((offset+viewW)/CHUNK_WIDTH);
  const height=prefix==="world"?H:GROUND;
  const makeChunk=index=>cachedImage(`${prefix}:${index}`,CHUNK_WIDTH,height,()=>{
    const previousCamera=camera,previousWidth=viewW;
    camera=index*CHUNK_WIDTH-CHUNK_PADDING;viewW=CHUNK_WIDTH+CHUNK_PADDING*2;
    ctx.translate(-CHUNK_PADDING,0);
    try{paint(camera,viewW);}finally{camera=previousCamera;viewW=previousWidth;}
  });
  for(let index=first;index<=lastChunk;index++){
    const image=makeChunk(index);
    ctx.drawImage(image,Math.round(index*CHUNK_WIDTH-offset),0);
  }
  const next=player.facing<0?first-1:lastChunk+1,key=`${prefix}:${next}`;
  if(!imageCache.has(key)&&!pendingChunks.has(key)&&cachedPixels+CHUNK_WIDTH*height<=cachePixelLimit()){
    pendingChunks.set(key,()=>{
      if(cachedPixels+CHUNK_WIDTH*height<=cachePixelLimit())makeChunk(next);
    });
    while(pendingChunks.size>10)pendingChunks.delete(pendingChunks.keys().next().value);
    warmChunks();
  }
}
function spawnParticles(x,y,color,count){
  if(reducedMotion)return;
  for(let i=0;i<count;i++)particles.push({x,y,vx:Math.cos(i*2.4)*70,vy:-30-Math.sin(i*1.7)*65,life:.5+i%3*.12,color});
}
function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),w,h);}
function text(value,x,y,color="#f0e7c9",size=12,align="left"){
  ctx.font=`${size}px Tahoma, sans-serif`;ctx.textAlign=align;ctx.fillStyle=color;ctx.fillText(value,Math.round(x),Math.round(y));ctx.textAlign="left";
}
function noise(n){const value=Math.sin(n*12.9898+78.233)*43758.5453;return value-Math.floor(value);}
function pixelOval(x,y,rx,ry,color,step=2){
  for(let row=-ry;row<=ry;row+=step){
    const half=Math.floor(rx*Math.sqrt(Math.max(0,1-row*row/(ry*ry)))/step)*step;
    if(half>0)rect(x-half,y+row,half*2,step,color);
  }
}
function glow(x,y,r,color){
  if(reducedMotion)return;
  const image=cachedImage(`glow:${r}:${color}`,r*2,r*2,()=>{
    const gradient=ctx.createRadialGradient(r,r,1,r,r,r);gradient.addColorStop(0,color);gradient.addColorStop(1,"#00000000");
    ctx.fillStyle=gradient;ctx.fillRect(0,0,r*2,r*2);
  });
  ctx.drawImage(image,Math.round(x-r),Math.round(y-r));
}
function mountain(x,y,width,height,color){
  for(let i=0;i<width;i+=4){
    const shape=Math.pow(Math.sin(i/width*Math.PI),1.3);
    const peak=height*shape+Math.sin(i*.035)*9*shape;
    const top=Math.round((y-peak)/4)*4;
    rect(x+i,top,4,H-top,color);
    if(i>width*.48)rect(x+i,top+12,4,H-top-12,"#254f6420");
    if(peak>height*.64)rect(x+i,top,4,4,"#d5efd122");
  }
}
function tree(x,base,seed,scale=1,distant=false){
  const height=(112+noise(seed)*66)*scale,top=base-height;
  const bark=distant?"#4f8d83":"#493b2e";
  rect(x-4*scale,top,10*scale,height,bark);
  if(!distant){
    rect(x-2*scale,top,3*scale,height,"#a47a49");
    rect(x+1*scale,top,2*scale,height,"#785634");
    for(let i=0;i<height;i+=14*scale)rect(x+noise(seed+i)*4*scale,top+i,2*scale,6*scale,"#392f29");
    for(let side=-1;side<=1;side+=2){
      for(let j=0;j<6;j++)rect(x+side*j*3*scale,top+48*scale-j*4*scale,5*scale,5*scale,bark);
      rect(x+side*7*scale,base-5*scale,12*scale,5*scale,bark);
    }
  }
  for(let lobe=0;lobe<11;lobe++){
    const angle=lobe*2.4,cx=x+Math.cos(angle)*(lobe<3?14:32)*scale;
    const cy=top+16*scale+Math.sin(angle)*27*scale;
    const rx=(24+noise(seed+lobe*13)*15)*scale,ry=(18+noise(seed+lobe*7)*10)*scale;
    pixelOval(cx,cy,rx,ry,distant?"#58998b":"#214d36",4);
    pixelOval(cx-2*scale,cy-5*scale,rx-3*scale,ry-4*scale,distant?"#65a38e":"#397444",4);
    if(!distant){
      pixelOval(cx-7*scale,cy-9*scale,rx*.68,ry*.48,"#589746",2);
      for(let j=0;j<14;j++){
        const px=cx+(noise(seed+lobe*17+j)*2-1)*rx*.7;
        const py=cy+(noise(seed+lobe*23+j*3)*2-1)*ry*.6;
        rect(px,py,4,2,j%3===0?"#b4ca65":j%2?"#7caf51":"#2c613a");
      }
    }
  }
  if(!distant){
    pixelOval(x+3*scale,base-2,22*scale,4,"#294c35",2);
    for(let i=0;i<7;i++)rect(x-15*scale+i*5*scale,base-5-noise(seed+i)*7,2,7,"#78a34c");
  }
}
function cabin(x,y,width=135,roof="#8a6962",label=""){
  rect(x-5,y-8,width+10,102,"#273544");
  rect(x,y,width,94,"#886b54");
  for(let row=0;row<12;row++){rect(x+2,y+row*8,width-4,2,"#574e4a");rect(x+4,y+row*8+2,width-8,1,"#ac8c63");}
  for(let i=0;i<width+20;i+=6){
    const roofHeight=16+Math.min(i,width+20-i)*.38;
    rect(x-10+i,y-roofHeight,6,roofHeight,roof);
    rect(x-10+i,y-roofHeight,6,3,"#c29c76");
    for(let row=6;row<roofHeight;row+=6)rect(x-10+i,y-roofHeight+row,5,1,"#573c37");
  }
  rect(x+18,y+20,32,31,"#283746");rect(x+21,y+23,26,25,"#e7bb71");
  rect(x+32,y+23,3,25,"#514b48");rect(x+21,y+34,26,3,"#514b48");
  rect(x+width-48,y+36,28,58,"#3a3c44");rect(x+width-43,y+40,18,47,"#62584d");rect(x+width-27,y+64,3,3,"#f1cd83");
  rect(x-7,y+94,width+14,6,"#454746");
  rect(x+5,y+2,5,90,"#c2a16c");rect(x+width-10,y+2,5,90,"#584535");
  for(let i=0;i<3;i++){rect(x+15+i*13,y+79,11,5,"#725039");rect(x+18+i*13,y+72,2,7,"#416e40");rect(x+15+i*13,y+71,7,3,"#89ad59");}
  if(label){rect(x+18,y+58,width-74,17,"#273c48");text(label,x+24,y+71,"#ffe1a4",10);}
  glow(x+34,y+37,70,"#efb76420");
}
function urbanBuilding(x,base,width,height,label,color="#677483"){
  rect(x-4,base-height-4,width+8,height+4,"#273342");
  rect(x,base-height,width,height,color);
  rect(x+3,base-height+3,5,height-3,"#c6cbbb");rect(x+width-10,base-height+3,10,height-3,"#3e566477");
  for(let row=0;row<height;row+=28)rect(x,base-height+row,width,2,"#e1d8b444");
  rect(x-7,base-height-6,width+14,4,"#d2d7c8");
  for(let row=0;row<Math.floor(height/28)-1;row++)for(let col=0;col<Math.floor(width/27);col++){
    const wx=x+8+col*27,wy=base-height+13+row*28;
    rect(wx,wy,17,20,"#263847");rect(wx+2,wy+2,13,15,(row+col)%3===0?"#e5b57a":"#84bec1");rect(wx+8,wy+2,2,15,"#46606c");
  }
  rect(x+width/2-14,base-40,28,40,"#253746");rect(x+width/2-10,base-35,20,31,"#92acac");
  rect(x+8,base-height-27,width-16,22,"#243f50");text(label,x+width/2,base-height-12,"#f1d69e",11,"center");
  rect(x-6,base,width+12,6,"#b0ac95");
}
function background(zone){
  const skies=[["#428dc0","#d4e9b1"],["#529cce","#f2dfb1"],["#488fc5","#cde8d1"],["#647eaf","#ecd4be"]];
  const sky=cachedImage(`sky:${zone}:${viewW}`,viewW,H,()=>{
    const [top,bottom]=skies[zone],gradient=ctx.createLinearGradient(0,0,0,GROUND);
    gradient.addColorStop(0,top);gradient.addColorStop(1,bottom);ctx.fillStyle=gradient;ctx.fillRect(0,0,viewW,H);
    const sunX=viewW*.8;
    pixelOval(sunX,86,44,44,"#fff0b41c",4);
    pixelOval(sunX,86,30,30,"#fff0b435",2);
    pixelOval(sunX,86,19,19,"#fff2bc",2);
    pixelOval(sunX-4,81,12,12,"#fff8d8",2);
  });
  ctx.drawImage(sky,0,0);
  cachedChunks(`clouds:${zone}`,camera*(reducedMotion?0:.07),(start,width)=>{
    for(let i=Math.floor(start/260)-1;i<(start+width)/260+1;i++){
      const x=i*260-start+noise(i)*60,y=75+noise(i+31)*85;
      for(let j=0;j<5;j++){
        pixelOval(x+j*23,y+noise(i*7+j)*12,27,12+noise(j+i)*9,"#c0d9dc",2);
        pixelOval(x+j*23-3,y-4+noise(i*7+j)*12,25,11+noise(j+i)*8,"#f4f5dd",2);
      }
    }
  });
  for(let layer=0;layer<2;layer++){
    const factor=reducedMotion?0:.12+layer*.16,offset=camera*factor;
    cachedChunks(`mountains:${layer}`,offset,(start,width)=>{
      for(let i=Math.floor(start/220)-1;i<Math.ceil((start+width)/220)+1;i++){
        mountain(i*220-start,342+layer*30,330,80+noise(i+layer*17)*85,["#83b3b4","#639d97"][layer]);
      }
    });
  }
  const offset=camera*(reducedMotion?0:zone===3?.5:.55);
  cachedChunks(zone===3?"city-background":"forest-background",offset,(start,width)=>{
    if(zone===3){
      for(let i=Math.floor(start/90)-1;i<(start+width)/90+1;i++){
        const height=80+noise(i)*130,x=i*90-start;
        rect(x,GROUND-height,76,height,"#708f9b");
        rect(x+5,GROUND-height+4,3,height-4,"#acc0bc");
        for(let row=0;row<height/25;row++)for(let col=0;col<4;col++)rect(x+10+col*15,GROUND-height+12+row*25,4,7,"#a4bfbd55");
      }
    }else{
      for(let i=Math.floor(start/130)-1;i<(start+width)/130+1;i++)tree(i*130-start,GROUND,100+i,1.25,true);
    }
  });
  for(let i=0;i<12;i++){
    const dx=(i*97+Math.sin(reducedMotion?i:time*.3+i)*12+camera*.05)%(viewW+40);
    rect(dx,170+noise(i)*200,2,2,"#fff2bf90");
  }
}
function terrain(){
  const start=Math.floor(camera/24)*24;
  for(let wx=start;wx<camera+viewW+24;wx+=24){
    const zone=Math.max(0,Math.min(3,Math.floor(wx/ZONE_WIDTH))),x=wx-camera;
    const dirt=["#795139","#80563c","#725342","#52606b"][zone];
    rect(x,GROUND,24,H-GROUND,dirt);
    rect(x,GROUND+12,24,8,zone===3?"#384954":"#523d2e");
    rect(x,GROUND+68,24,H-GROUND-68,zone===3?"#3c4857":"#554536");
    for(let row=0;row<14;row++){
      for(let col=0;col<3;col++){
        const seed=wx*3+row*41+col*17,shade=noise(seed);
        const px=x+col*8+Math.floor(noise(seed+4)*3),py=GROUND+18+row*8;
        if(shade>.56){
          const stone=row>6&&shade>.76;
          rect(px,py,stone?7:4,stone?5:2,stone?"#898377":shade>.8?"#bf8d58":"#392e27");
          if(stone){rect(px,py,5,1,"#b7a38a");rect(px+5,py+2,2,3,"#3d3a35");}
        }
      }
    }
    if(zone!==3){
      rect(x,GROUND,24,3,"#bdd578");rect(x,GROUND+3,24,4,"#609347");
      rect(x,GROUND+7,24,3,"#365b36");
      for(let blade=0;blade<6;blade++){
        const height=3+Math.floor(noise(wx+blade)*5)*2;
        rect(x+blade*4,GROUND-height,2,height,blade%2?"#91bc59":"#58873f");
        rect(x+blade*4,GROUND+8,2,noise(wx+blade*5)*8,"#426b36");
      }
      if(noise(wx)>.76){
        const flower=zone===1?"#f0b6bb":zone===2?"#c3b9f5":"#ffe39a";
        rect(x+18,GROUND-12,2,12,"#548a46");rect(x+16,GROUND-15,6,4,flower);rect(x+18,GROUND-15,2,2,"#fff0ce");
      }
    }else{
      rect(x,GROUND,24,3,"#c4d2cf");rect(x,GROUND+3,24,7,"#849b9f");
      rect(x,GROUND+10,24,2,"#354b57");rect(x+22,GROUND,2,10,"#536974");
    }
  }
}
function undergrowth(x,seed,zone){
  if(zone===3){
    rect(x-17,GROUND-8,34,8,"#687b7b");rect(x-19,GROUND-10,38,3,"#abb4a0");
  }
  for(let clump=0;clump<4;clump++){
    const bx=x-19+clump*12,by=GROUND-9-noise(seed+clump)*9;
    pixelOval(bx,by,12,9,"#2e5b38",2);
    pixelOval(bx-2,by-3,10,6,"#629446",2);
    rect(bx-6,by-5,4,2,"#a4bd65");
    if(zone===1&&clump%2===0){rect(bx,by-4,4,4,"#ea9c9c");rect(bx+1,by-4,2,2,"#ffe5bd");}
  }
  if(zone===0||zone===2){
    const rx=x+36;
    pixelOval(rx,GROUND-5,12,8,"#686f61",2);
    pixelOval(rx-3,GROUND-8,8,4,"#a3aa8a",2);
    rect(rx+3,GROUND-6,4,3,"#485448");
    rect(x-31,GROUND-9,3,9,"#e6cba1");
    pixelOval(x-30,GROUND-10,7,4,"#b5664b",2);rect(x-33,GROUND-13,3,2,"#f1c69a");
  }
}
function worldDecor(){
  for(let zone=0;zone<4;zone++){
    const base=zone*ZONE_WIDTH;
    for(let i=0;i<8;i++){
      const wx=base+70+i*215,x=wx-camera;if(x< -210||x>viewW+100)continue;
      if(i%2===0)undergrowth(x+85,wx,zone);
      if(zone===0){
        if(i===1)cabin(x,GROUND-99,130,"#85644e","นาข้าว");
        else if(i%3===0)tree(x,GROUND,wx,.9);
        for(let j=0;j<9;j++){
          const rx=x+35+j*10,height=20+noise(wx+j)*12;
          rect(rx,GROUND-height,2,height,"#739143");
          for(let grain=0;grain<4;grain++){rect(rx-3+grain%2*5,GROUND-height+grain*3,3,2,"#e3c675");}
          rect(rx-4,GROUND-11,4,2,"#a4b65b");rect(rx+2,GROUND-15,4,2,"#a4b65b");
        }
      }else if(zone===1){if(i%2===0)cabin(x,GROUND-99,142,i%4?"#705d69":"#967562","ชุมชน");else tree(x+10,GROUND,wx,.8);}
      else if(zone===2){if(i===4)urbanBuilding(x,GROUND,174,170,"โรงเรียน","#aa9d82");else if(i%2===0)tree(x,GROUND,wx,1);else{
        rect(x,GROUND-76,4,76,"#636671");rect(x-15,GROUND-76,42,20,"#c5b889");text("BUS",x-9,GROUND-62,"#314453",10);
      }}else{
        if(i%2===0)urbanBuilding(x,GROUND,135,140+i%3*30,["บริการชุมชน","โรงพยาบาล","สวัสดิการ","ธนาคาร"][i/2]);
        else{rect(x,GROUND-92,4,92,"#526378");rect(x-13,GROUND-95,25,6,"#354b65");rect(x-10,GROUND-89,19,5,"#e8c488");glow(x,GROUND-85,50,"#f1d59430");}
      }
    }
  }
}
function drawPlatform(platform){
  const x=platform.x-camera;if(x< -platform.w||x>viewW)return;
  rect(x-2,platform.y,platform.w+4,3,"#efd092");rect(x,platform.y+3,platform.w,7,"#a07849");
  rect(x,platform.y+10,platform.w,3,"#443b2c");
  for(let j=0;j<platform.w;j+=16){
    rect(x+j,platform.y+3,2,7,"#57442f");rect(x+j+4,platform.y+5,9,1,"#d4ad6c");
    rect(x+j+4,platform.y+8,6,1,"#6a502e");rect(x+j+3,platform.y+3,1,1,"#3e4134");
    if(noise(platform.x+j)>.65){rect(x+j,platform.y-2,8,2,"#759348");rect(x+j+2,platform.y+2,2,5,"#4c703c");}
  }
  for(const post of [x+8,x+platform.w-13]){
    rect(post,platform.y+13,5,GROUND-platform.y-13,"#62472f");
    rect(post,platform.y+13,2,GROUND-platform.y-13,"#b18b55");
    rect(post-2,platform.y+15,9,2,"#d5b780");rect(post-2,platform.y+19,9,2,"#d5b780");
  }
  for(let vine=0;vine<3;vine++){
    const vx=x+22+vine*39,length=8+noise(platform.x+vine)*19;
    rect(vx,platform.y+12,2,length,"#527941");
    for(let leaf=0;leaf<length;leaf+=6)rect(vx+(leaf%12?2:-3),platform.y+14+leaf,4,2,"#79a553");
  }
}
function drawSign(sign){
  const x=sign.x-camera,y=sign.y;if(x< -100||x>viewW+100)return;
  rect(x-62,y+6,7,GROUND-y-6,"#695144");rect(x+54,y+6,7,GROUND-y-6,"#695144");
  rect(x-90,y,180,74,"#352f35");rect(x-88,y+2,176,70,"#a47d50");rect(x-83,y+7,166,60,"#293d48");
  rect(x-83,y+7,166,2,"#7b9e98");text(sign.title,x,y+24,"#dce6d0",11,"center");
  text(sign.value,x,y+43,"#f6d28a",17,"center");text(sign.detail,x,y+59,"#a7c7c0",10,"center");
}
function drawNPC(npc){
  const x=npc.x-camera;if(x< -100||x>viewW+100)return;
  const adventure=adventures[npc.zone],appearance=npcAppearances[npc.zone];
  pixelOval(x+15,GROUND-1,17,3,"#294d3938",2);
  drawCharacter(ctx,x,GROUND-40,time,-1,false,appearance.palette,2,appearance.sprite,appearance.glasses);
  text(adventure.npc,x+12,GROUND-51,"#f1e4c4",11,"center");
  if(!state.accepted.has(npc.zone))text("!",x+12,GROUND-70,"#ffe098",22,"center");
}
function drawCamp(camp){
  const x=camp.x-camera;if(x< -150||x>viewW+150)return;
  const done=state.completed.has(camp.zone),color=adventures[camp.zone].color;
  for(let y=0;y<65;y+=5){
    const width=8+y*1.5,left=x-9-width/2;
    rect(left,GROUND-69+y,width,5,done?"#5c896c":"#688192");
    rect(left,GROUND-69+y,3,5,done?"#abc593":"#adc5be");
    rect(left+width-3,GROUND-69+y,3,5,done?"#395841":"#3e566a");
  }
  rect(x-13,GROUND-72,8,3,"#f4cd8a");
  for(let y=0;y<40;y+=4){
    const width=4+y*.65;
    rect(x-9-width/2,GROUND-44+y,width,4,"#1c2d3d");
  }
  rect(x-10,GROUND-66,2,21,"#c3c7a0");
  rect(x-59,GROUND-6,100,6,"#bf9a6b");
  rect(x+56,GROUND-100,4,100,"#b69a72");rect(x+60,GROUND-100,28,23,done?color:"#a89a80");
  rect(x+60,GROUND-96,20,3,"#e7e4c1");
  text(done?"แคมป์ · เซฟ":"แคมป์ · ส่งของ",x,GROUND-87,"#f3dcaa",12,"center");
  glow(x+98,GROUND-22,45,"#ffbe6b40");
  rect(x+95,GROUND-14,17,5,"#675044");rect(x+97,GROUND-12,13,2,"#bd8555");
  const flicker=reducedMotion?0:Math.floor(time*7)%3;
  rect(x+99,GROUND-24-flicker,9,12+flicker,"#d7773e");
  rect(x+101,GROUND-28+flicker,5,15-flicker,"#f6bf61");rect(x+102,GROUND-21,3,8,"#ffe9a5");
}
function drawItem(item){
  if(state.policies.has(item.id))return;
  const x=item.x-camera,y=GROUND-45;if(x< -50||x>viewW+50)return;
  glow(x+8,y,25,"#96efb325");
  rect(x-6,y+15,28,2,"#43664955");
  if(item.kind==="coin"){
    pixelOval(x+8,y+2,10,12,"#9c6b36",2);pixelOval(x+7,y,9,11,"#f0c55e",2);
    pixelOval(x+7,y,6,8,"#c5903f",2);rect(x+5,y-6,3,12,"#ffe7a1");rect(x+2,y-9,4,2,"#fff0bd");
  }else if(item.kind==="cross"){
    rect(x-4,y-9,24,21,"#345467");rect(x-2,y-7,20,16,"#ebead2");rect(x+2,y-12,12,4,"#789392");
    rect(x+6,y-5,4,12,"#d46a59");rect(x+2,y-1,12,4,"#d46a59");rect(x-2,y+9,20,3,"#a9bda7");
  }else if(item.kind==="water"){
    for(let row=0;row<9;row++){
      const half=row<5?row:8-row+3;
      rect(x+8-half,y-12+row*3,half*2+2,3,row>6?"#367799":"#65c5d4");
    }
    rect(x+5,y-3,2,7,"#c0edf0");rect(x+7,y+5,6,2,"#3993b0");
  }else if(item.kind==="book"){
    rect(x-4,y-10,24,24,"#34465d");rect(x-2,y-8,20,20,"#91acc5");
    rect(x+1,y-8,3,20,"#eee0ae");rect(x+7,y-4,8,2,"#fff0c5");rect(x+7,y+1,6,2,"#d5e5dc");
  }else{
    rect(x-3,y-8,22,21,"#876448");rect(x-1,y-6,18,16,"#d6b780");
    rect(x+5,y-6,5,16,"#f7e5ac");rect(x-1,y,18,4,"#f7e5ac");
    rect(x+1,y-11,6,4,"#e49c87");rect(x+9,y-11,6,4,"#e49c87");
  }
  text(item.short,x+9,y-22,"#e2edc0",10,"center");
}
function drawResource(item){
  if(state.resources.has(item.id))return;
  const x=item.x-camera,y=item.y+(reducedMotion?0:Math.sin(time*3+item.x)*2);
  if(x< -30||x>viewW+30)return;
  const color=adventures[item.zone].color;
  glow(x,y,24,color+"25");rect(x-9,y-9,18,18,"#263746");rect(x-7,y-7,14,14,color);
  rect(x-7,y+6,14,2,"#4b5970");rect(x-7,y-7,14,2,"#f7efd0");
  if(item.zone===0){
    rect(x-4,y-3,8,5,"#3c7776");rect(x-5,y-3,2,8,"#e5ead0");rect(x-5,y+3,9,2,"#e5ead0");
    rect(x+3,y-5,2,10,"#e5ead0");
  }else if(item.zone===2){
    rect(x-5,y-4,10,8,"#f0e5c0");rect(x,y-4,1,8,"#7b8193");
    rect(x-4,y-2,3,1,"#9aabaf");rect(x+2,y,2,1,"#9aabaf");
  }else{
    rect(x-2,y-4,4,10,"#f0e5c0");rect(x-5,y-1,10,4,"#f0e5c0");
  }
}
function hazardArtwork(hazard,index){
  const x=0,w=hazard.w,variant=index>=9;
  rect(x,GROUND-3,w,3,"#b7664b");
  for(let j=0;j<w;j+=12)rect(x+j,GROUND-3,6,2,"#f5cf86");
  if(hazard.type==="flood"){
    rect(x,GROUND-20,w,17,"#326b93");
    rect(x,GROUND-17,w,5,"#489aba");rect(x,GROUND-8,w,3,"#235d85");
    for(let j=0;j<w;j+=18){rect(x+j,GROUND-14,9,2,"#9eddd5");rect(x+j+6,GROUND-6,5,1,"#64b5c6");}
    if(variant){
      rect(x+8,GROUND-27,27,8,"#70523b");rect(x+10,GROUND-27,23,2,"#b88b56");
      rect(x+w-24,GROUND-33,3,17,"#586257");rect(x+w-29,GROUND-33,13,9,"#e8bf72");
    }else{
      rect(x+8,GROUND-29,14,12,"#937a58");rect(x+10,GROUND-27,10,3,"#d4c099");
      rect(x+w-24,GROUND-25,17,8,"#bca079");rect(x+w-22,GROUND-25,13,2,"#edcf9b");
    }
  }else if(hazard.type==="drought"){
    rect(x,GROUND-8,w,5,"#c99762");
    for(let j=5;j<w-10;j+=17){
      rect(x+j,GROUND-8,2,9,"#684431");rect(x+j+2,GROUND-6,7,2,"#684431");
      rect(x+j+7,GROUND-6,2,5,"#684431");rect(x+j+2,GROUND-8,5,1,"#f0c58b");
      rect(x+j+4,GROUND-19,2,11,"#94764c");rect(x+j,GROUND-16,5,2,"#ac8d4f");
    }
    if(variant){
      rect(x+w-25,GROUND-30,18,22,"#6d756a");rect(x+w-22,GROUND-28,12,3,"#adb39a");
      rect(x+w-21,GROUND-19,15,5,"#929b8a");rect(x+w-10,GROUND-16,4,7,"#434e47");
    }else{
      rect(x+w-27,GROUND-18,18,10,"#9e6b47");rect(x+w-25,GROUND-20,14,3,"#e4bb80");
      rect(x+w-21,GROUND-29,2,10,"#7b7246");rect(x+w-24,GROUND-25,7,2,"#b28c48");
    }
  }else if(hazard.type==="food"){
    rect(x+4,GROUND-18,w-8,5,"#ba8653");
    rect(x+7,GROUND-13,4,10,"#664732");rect(x+w-12,GROUND-13,4,10,"#664732");
    if(index===2){
      rect(x+4,GROUND-42,3,24,"#826041");rect(x+w-7,GROUND-42,3,24,"#826041");
      for(let j=2;j<w-2;j+=8)rect(x+j,GROUND-44,8,8,j%16===2?"#d37958":"#f2ddaa");
      for(let j=13;j<w-12;j+=12){rect(x+j,GROUND-24,9,6,"#53804a");rect(x+j+2,GROUND-27,5,4,"#d8b86b");}
    }else{
      rect(x+11,GROUND-30,17,12,"#b99865");rect(x+13,GROUND-28,13,2,"#e9cf94");
      rect(x+33,GROUND-35,18,17,"#667c85");rect(x+36,GROUND-32,12,5,"#cee2d2");
      rect(x+38,GROUND-25,3,3,"#edb871");rect(x+44,GROUND-25,3,3,"#edb871");
    }
  }else if(hazard.type==="dependency"){
    rect(x+8,GROUND-27,20,24,"#b38659");rect(x+10,GROUND-25,16,3,"#e3bb82");
    rect(x+15,GROUND-27,5,24,"#72543d");
    rect(x+32,GROUND-20,23,17,"#99856a");rect(x+34,GROUND-18,19,2,"#d8bea0");
    if(variant){
      rect(x+36,GROUND-34,4,14,"#ece4c2");rect(x+31,GROUND-31,14,4,"#ece4c2");
      rect(x+47,GROUND-39,3,19,"#6b6151");rect(x+44,GROUND-39,9,3,"#bead87");
    }else{
      rect(x+35,GROUND-34,17,13,"#cfab84");rect(x+37,GROUND-32,13,9,"#f5d9b2");
      rect(x+38,GROUND-31,3,3,"#cb876d");rect(x+44,GROUND-27,5,1,"#bc9974");
    }
  }else if(hazard.type==="transport"){
    rect(x+8,GROUND-48,3,45,"#687c80");
    rect(x+3,GROUND-48,25,16,"#36576b");rect(x+5,GROUND-46,21,12,"#cadbd0");
    rect(x+7,GROUND-43,16,6,"#4b7b99");rect(x+9,GROUND-36,3,2,"#304959");rect(x+20,GROUND-36,3,2,"#304959");
    rect(x+31,GROUND-17,w-35,4,"#bf995e");rect(x+34,GROUND-13,3,10,"#67583f");
    rect(x+w-8,GROUND-13,3,10,"#67583f");
    if(variant){
      rect(x+35,GROUND-32,18,15,"#698ba4");rect(x+39,GROUND-36,10,4,"#435e73");
      rect(x+39,GROUND-28,10,7,"#d1c194");
    }else{
      rect(x+36,GROUND-28,17,11,"#eee1b9");
      rect(x+39,GROUND-25,11,2,"#a78964");rect(x+39,GROUND-21,7,2,"#a78964");
    }
  }else if(hazard.type==="utilities"){
    if(variant){
      rect(x+9,GROUND-29,45,5,"#758795");rect(x+13,GROUND-24,4,21,"#4c5e6b");
      rect(x+29,GROUND-44,5,15,"#788d91");rect(x+23,GROUND-44,17,3,"#b7c3b5");
      rect(x+32,GROUND-40,11,3,"#b7c3b5");rect(x+44,GROUND-43,3,12,"#a6534c");
      rect(x+41,GROUND-39,9,3,"#a6534c");
      rect(x+34,GROUND-22,19,16,"#304450");rect(x+37,GROUND-19,13,6,"#93a99b");
      rect(x+38,GROUND-9,3,2,"#d66f51");
    }else{
      rect(x+4,GROUND-13,24,10,"#799698");rect(x+7,GROUND-11,20,2,"#aec6b8");
      rect(x+24,GROUND-29,9,26,"#547d82");rect(x+24,GROUND-29,25,8,"#82a2a1");
      rect(x+44,GROUND-23,5,9,"#405e6c");rect(x+46,GROUND-13,2,5,"#70c7d5");
      rect(x+31,GROUND-30,3,11,"#cc7960");
    }
  }else if(hazard.type==="debt"){
    rect(x+6,GROUND-20,w-12,5,"#76533d");rect(x+9,GROUND-15,4,12,"#4d3e36");
    rect(x+w-13,GROUND-15,4,12,"#4d3e36");
    rect(x+11,GROUND-33,19,13,"#e4d5ad");rect(x+14,GROUND-29,12,2,"#a78a67");
    rect(x+14,GROUND-25,8,2,"#a78a67");
    rect(x+36,GROUND-27,18,7,"#b48d4a");rect(x+37,GROUND-27,16,2,"#f4d78b");
    if(variant){
      rect(x+39,GROUND-36,15,9,"#c29b50");rect(x+40,GROUND-36,13,2,"#ffe1a0");
      rect(x+17,GROUND-43,3,10,"#af6556");rect(x+15,GROUND-43,7,3,"#e6a47a");
    }else{
      rect(x+36,GROUND-40,16,12,"#3b4857");rect(x+39,GROUND-37,10,5,"#88aa9b");
      rect(x+39,GROUND-30,2,2,"#e3bf7e");
    }
  }
}
function drawHazard(hazard,index){
  const x=hazard.x-camera;if(x< -hazard.w||x>viewW)return;
  if(!reducedMotion){
    if(hazard.type==="flood"){
      for(let j=0;j<hazard.w-10;j+=22)rect(x+j,GROUND-18+Math.round(Math.sin(time*3+j)*2),10,2,"#dcf1d8");
    }else if(hazard.type==="drought"){
      const drift=(time*12+index*9)%(hazard.w-12);
      rect(x+drift,GROUND-12,6,1,"#f3d29a");rect(x+drift+5,GROUND-16,3,1,"#dcb67a");
    }else if(hazard.type==="utilities"){
      if(index>=9){
        const phase=Math.floor(time*2)%2;
        rect(x+39,GROUND-10,3,2,phase?"#ed8764":"#8c5148");
      }else rect(x+46,GROUND-13+(time*7%8),2,3,"#b5e5e0");
    }
  }
}
function drawStaticHazard(hazard,index){
  const x=hazard.x-camera;if(x< -hazard.w-120||x>viewW+120)return;
  ctx.save();ctx.beginPath();ctx.rect(Math.round(x),GROUND-60,hazard.w,70);ctx.clip();
  ctx.translate(Math.round(x),0);
  try{hazardArtwork(hazard,index);}finally{ctx.restore();}
  text(hazard.label,x+hazard.w/2,GROUND-57,"#ffe0ad",10,"center");
}
function drawGate(zone){
  const x=(zone+1)*ZONE_WIDTH-32-camera;if(x< -100||x>viewW+100)return;
  const open=state.completed.has(zone);
  rect(x-8,GROUND-121,8,121,"#736f65");rect(x+56,GROUND-121,8,121,"#736f65");rect(x-12,GROUND-126,80,8,"#c1a779");
  if(!open){for(let i=0;i<4;i++)rect(x+i*14,GROUND-116,4,116,"#d1b77d");rect(x,GROUND-70,60,4,"#706451");}
  text(open?"ทางเปิดแล้ว →":"ส่งภารกิจเพื่อเปิดทาง",x+24,GROUND-138,open?"#b5e7bc":"#ffdc9e",11,"center");
}
function draw(){
  ctx.imageSmoothingEnabled=false;const zone=currentZone();
  if(backgroundZone!==null&&zone!==backgroundZone&&!reducedMotion){
    const image=document.createElement("canvas");image.width=viewW;image.height=GROUND;
    backgroundTransition={image,start:time};
    const liveContext=ctx;
    ctx=image.getContext("2d");ctx.imageSmoothingEnabled=false;
    try{background(backgroundZone);}finally{ctx=liveContext;}
  }
  backgroundZone=zone;
  background(zone);
  if(backgroundTransition){
    const progress=Math.min(1,Math.max(0,(time-backgroundTransition.start)/.65));
    if(progress>=1){backgroundTransition=null;trimImageCache();}
    else{
      ctx.save();ctx.globalAlpha=1-progress*progress*(3-2*progress);
      ctx.drawImage(backgroundTransition.image,0,0);ctx.restore();
    }
  }
  cachedChunks("world",camera,()=>{
    worldDecor();terrain();platforms.forEach(drawPlatform);worldSigns.forEach(drawSign);
    hazardSpecs.forEach(drawStaticHazard);
  });
  npcs.forEach(drawNPC);camps.forEach(drawCamp);
  hazardSpecs.forEach(drawHazard);itemSpecs.forEach(drawItem);resources.forEach(drawResource);
  for(let i=0;i<4;i++)drawGate(i);
  if(secretMode){
    const x=player.x-camera+12,y=player.y+24,dashing=Math.abs(player.vx)>15;
    pixelOval(x,y,dashing?38:25,dashing?22:32,"#ffce4935",2);
    pixelOval(x,y,dashing?28:18,dashing?15:27,"#fff09645",2);
    if(dashing){
      for(let band=0;band<5;band++){
        const length=90-band*14,left=player.facing>0?x-length:x;
        rect(left,y-10+band*5,length,3,band%2?"#ffdc6a50":"#fff0a430");
      }
    }
    if(!reducedMotion&&dashing){
      for(let streak=0;streak<6;streak++){
        const length=25+streak*7,offset=(time*220+streak*11)%60;
        const left=player.facing>0?x-offset-length:x+offset;
        rect(left,y-14+streak*5,length,2,streak%2?"#fff0a4":"#e5ae49");
      }
    }
  }
  player.draw(ctx,camera,time,state.invulnerable>0);
  for(const particle of particles)rect(particle.x-camera,particle.y,3,3,particle.color);
  if(mode==="ended"){
    glow(player.x-camera,GROUND-80,150,"#e8d5a140");
    text("ทุกก้าวเชื่อมเราเข้าด้วยกัน",viewW/2,150,"#fff0bc",24,"center");
    text("ครบ 4 ชุมชน · บทสรุปการเดินทาง",viewW/2,179,"#d4e5d4",14,"center");
  }
}
function resize(){
  pendingChunks.clear();
  backgroundZone=null;backgroundTransition=null;
  const bounds=document.querySelector(".game-frame").getBoundingClientRect();
  viewW=Math.max(160,Math.round(H*bounds.width/Math.max(1,bounds.height)));
  canvas.width=viewW;canvas.height=H;previousPose=null;
  camera=Math.max(0,Math.min(ZONE_WIDTH*4-viewW,player.x-viewW*.34));draw();
}
function advanceFrame(timestamp){
  const elapsed=last?Math.min(Math.max(0,(timestamp-last)/1000),.1):0;last=timestamp;
  if(mode==="playing"){
    accumulator+=elapsed;
    while(accumulator>=FIXED_STEP-1e-9){
      const before={x:player.x,y:player.y,camera};
      update(FIXED_STEP);previousPose=before;accumulator=Math.max(0,accumulator-FIXED_STEP);
      if(Math.abs(player.x-before.x)>GAME_CONFIG.speed*(secretMode?2.4:1)*FIXED_STEP+1)previousPose=null;
      if(mode!=="playing"){accumulator=0;previousPose=null;break;}
    }
    const actual={x:player.x,y:player.y,camera};
    // Interpolation is visual only; collision and checkpoint state stay on fixed steps.
    if(previousPose){
      const alpha=accumulator/FIXED_STEP;
      player.x=previousPose.x+(actual.x-previousPose.x)*alpha;
      player.y=previousPose.y+(actual.y-previousPose.y)*alpha;
      camera=previousPose.camera+(actual.camera-previousPose.camera)*alpha;
    }
    try{draw();}finally{player.x=actual.x;player.y=actual.y;camera=actual.camera;}
  }else{
    accumulator=0;previousPose=null;
    if(mode!==lastRenderedMode)draw();
  }
  lastRenderedMode=mode;
}
function frame(timestamp){
  advanceFrame(timestamp);requestAnimationFrame(frame);
}
const keyMap={ArrowLeft:"left",ArrowRight:"right",ArrowUp:"jump"," ":"jump",a:"left",d:"right",w:"jump"};
const codeMap={ArrowLeft:"left",ArrowRight:"right",ArrowUp:"jump",Space:"jump",KeyA:"left",KeyD:"right",KeyW:"jump"};
function editableTarget(target){
  return target instanceof HTMLElement&&(target.isContentEditable||!!target.closest("input,textarea,select"));
}
document.addEventListener("keydown",event=>{
  if(editableTarget(event.target)||event.ctrlKey||event.altKey||event.metaKey)return;
  if(!event.repeat&&(mode==="playing"||mode==="title")&&$("journal").hidden&&$("conversation").hidden){
    konamiInputs.push(event.code||event.key);
    if(konamiInputs.length>konamiCode.length)konamiInputs.shift();
    if(konamiInputs.length===konamiCode.length&&konamiInputs.every((code,index)=>code===konamiCode[index])){
      event.preventDefault();konamiInputs=[];activateSecretMode();return;
    }
  }
  if(event.key==="Escape"&&!event.repeat){
    event.preventDefault();
    if(!$("journal").hidden){toggleJournal();return;}
    if(!$("conversation").hidden){$("close-conversation").click();return;}
    if(mode==="paused")unpause();else if(mode==="playing")pauseGame();
    return;
  }
  if(mode!=="playing")return;
  if((event.code==="KeyJ"||event.key.toLowerCase()==="j")&&!event.repeat){event.preventDefault();toggleJournal();return;}
  const key=event.key.length===1?event.key.toLowerCase():event.key;
  const control=codeMap[event.code]||keyMap[key];
  if(control){
    event.preventDefault();keyboardInputs.set(event.code||key,control);keys.add(control);
    if(control==="jump"&&!event.repeat)player.jumpBuffer=.12;
  }
  if((event.code==="KeyE"||key==="e")&&!event.repeat){event.preventDefault();interact();}
});
document.addEventListener("keyup",event=>{
  const key=event.key.length===1?event.key.toLowerCase():event.key;
  const identity=event.code||key,control=keyboardInputs.get(identity);
  keyboardInputs.delete(identity);
  if(control&&!Array.from(keyboardInputs.values()).includes(control))keys.delete(control);
});
document.querySelectorAll("[data-control]").forEach(button=>{
  button.addEventListener("pointerdown",event=>{
    if(mode!=="playing")return;
    event.preventDefault();canvas.focus();button.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId,button.dataset.control);button.classList.add("held");
    if(button.dataset.control==="jump")player.jumpBuffer=.12;
  });
  const release=event=>{
    pointers.delete(event.pointerId);button.classList.toggle("held",Array.from(pointers.values()).includes(button.dataset.control));
  };
  button.addEventListener("pointerup",release);button.addEventListener("pointercancel",release);button.addEventListener("lostpointercapture",release);
});
canvas.addEventListener("pointerdown",()=>{if(mode==="playing")canvas.focus();});
window.addEventListener("blur",()=>{clearControls();pauseGame();});
document.addEventListener("visibilitychange",()=>{if(document.hidden){clearControls();pauseGame();}});
window.addEventListener("resize",resize);
$("new-game").addEventListener("click",startNew);
$("resume").addEventListener("click",resumeGame);
$("pause").addEventListener("click",()=>{if(mode==="paused")unpause();else pauseGame();});
$("unpause").addEventListener("click",unpause);
$("return-title").addEventListener("click",title);
$("play-again").addEventListener("click",startNew);
$("journal-toggle").addEventListener("click",toggleJournal);
$("scene-journal").addEventListener("click",toggleJournal);
$("scene-pause").addEventListener("click",()=>{if(mode==="paused")unpause();else pauseGame();});
$("close-journal").addEventListener("click",toggleJournal);
$("close-conversation").addEventListener("click",()=>{$("conversation").hidden=true;conversationZone=-1;canvas.focus();});
for(const id of ["interact","touch-interact"])$(id).addEventListener("click",()=>{interact();canvas.focus();});
for(const [id,label] of [["music","เพลง"],["effects","เอฟเฟกต์"]]){
  $(id).addEventListener("click",async()=>{
    $(id).disabled=true;
    try{
      const enabled=await gameAudio.toggle(id);
      $(id).textContent=`${label}: ${enabled?"เปิด":"ปิด"}`;
      $(id).setAttribute("aria-pressed",String(enabled));
      if(id==="effects"&&enabled)beep(660);
    }catch(error){console.error("Unable to toggle audio",error);notify(error.message);}
    finally{$(id).disabled=false;}
  });
}
$("fullscreen").addEventListener("click",async()=>{
  try{
    if(document.fullscreenElement)await document.exitFullscreen();
    else if($("game-layout").requestFullscreen)await $("game-layout").requestFullscreen();
    else throw new Error("เบราว์เซอร์นี้ไม่รองรับเต็มจอ");
  }catch(error){console.error("Fullscreen failed",error);notify("เปิดเต็มจอไม่ได้: "+error.message);}
});
$("exit-fullscreen").addEventListener("click",async()=>{
  try{if(document.fullscreenElement)await document.exitFullscreen();}
  catch(error){console.error("Unable to exit fullscreen",error);notify("ออกจากเต็มจอไม่ได้: "+error.message);}
});
document.addEventListener("fullscreenchange",()=>{$("exit-fullscreen").hidden=!document.fullscreenElement;resize();});
reset();readSave();resize();requestAnimationFrame(frame);
