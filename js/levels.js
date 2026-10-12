"use strict";

const zones = [
  {name:"นาข้าวและความผันผวน",sky:"#b2dbd3",far:"#7db6a1",land:"#6e9c62"},
  {name:"ครอบครัวและค่าครองชีพ",sky:"#ecdcb3",far:"#b7bd92",land:"#8a9c66"},
  {name:"เส้นทางไปโรงเรียน",sky:"#c0dce0",far:"#8eb4ad",land:"#839e75"},
  {name:"เมืองและสวัสดิการ",sky:"#cad7e0",far:"#9aafb9",land:"#8caaa0"}
];
const lessons = [
  {x:390,tag:"01 / AGRICULTURE & SHOCKS",title:"เมื่อรายได้ขึ้นอยู่กับฟ้าและฝน",big:`${REPORT_DISPLAY.povertyLine} บาท`,caption:"เส้นความยากจนต่อคนต่อเดือน",
    body:`<p>คนจนคิดเป็น <b>${REPORT_DISPLAY.povertyRate}% หรือ ${REPORT_DISPLAY.povertyPopulationMillions} ล้านคน</b> ภัยแล้งและน้ำท่วมทำให้รายได้เกษตรไม่แน่นอน ขณะที่ค่าจ้างแรงงานเกษตรปรับเพิ่ม <b>${REPORT_DISPLAY.agriculturalWageGrowth}%</b> ตามข้อมูลที่ให้มา</p><div class='fact'>เก็บระบบชลประทานเพื่อป้องกันผลกระทบภัยแล้งในเกม และกระโดดข้ามบริเวณน้ำท่วม</div>`},
  {x:1910,tag:"02 / DEPENDENCY & LIVING COSTS",title:"หนึ่งแรงงาน หลายชีวิตที่ต้องดูแล",big:`${REPORT_DISPLAY.dependencyRatio}%`,caption:`อัตราการพึ่งพิง · แรงงาน 1 คนดูแลสมาชิกประมาณ ${REPORT_DISPLAY.dependentsPerWorker} คน`,
    body:`<p>ครัวเรือนยากจนมีรายได้เฉลี่ย <b>${REPORT_DISPLAY.householdIncome} บาท/เดือน</b> และรายจ่าย <b>${REPORT_DISPLAY.householdExpenses} บาท/เดือน</b> โดยค่าอาหารคิดเป็น <b>${REPORT_DISPLAY.foodShare}%</b> ของรายจ่าย</p><div class='fact'>เบี้ยยังชีพผู้สูงอายุครอบคลุม <b>${REPORT_DISPLAY.elderlyCoverage}%</b> เก็บเบี้ยยังชีพและเงินอุดหนุนเด็กแรกเกิด เพื่อช่วยแบ่งเบาภาระในเกม</div><p class='note'>รายได้/รายจ่ายข้างต้นเป็นระดับครัวเรือน ไม่ใช่ระดับบุคคล จึงไม่ควรนำไปเทียบกับเส้นความยากจนโดยตรง</p>`},
  {x:3610,tag:"03 / EDUCATION BARRIER",title:"ค่าเรียนไม่ได้จบแค่ในห้องเรียน",big:`${REPORT_DISPLAY.educationTransportShare}%`,caption:"สัดส่วนค่าเดินทางของค่าใช้จ่ายที่นักเรียนยากจนต้องจ่ายเอง",
    body:`<p>เส้นทางไปโรงเรียนมีต้นทุนแฝง ทั้งการเดินทางและอุปกรณ์ การยุบรวมโรงเรียนขนาดเล็กอาจทำให้การเดินทางไกลขึ้น</p><div class='fact'>เก็บกองทุนการศึกษาและทุนลดค่าใช้จ่ายแฝง เพื่อลดผลกระทบอุปสรรคค่าเดินทางในเกม</div><p>ตัวเลข ${REPORT_DISPLAY.educationTransportShare}% ไม่ใช่สัดส่วนของรายได้ครัวเรือน แต่เป็นสัดส่วนของค่าใช้จ่ายการศึกษาที่ต้องจ่ายเอง</p>`},
  {x:5310,tag:"04 / MULTIDIMENSION & FINANCE",title:"ความยากจนไม่ใช่แค่เงินในกระเป๋า",big:`MPI ${REPORT_DISPLAY.mpi}`,caption:"ดัชนีความยากจนหลายมิติ",
    body:`<p>คนจนหลายมิติ <b>${REPORT_DISPLAY.multidimensionalPovertyRate}% หรือ ${REPORT_DISPLAY.multidimensionalPopulationMillions} ล้านคน</b> มิติความเป็นอยู่มีส่วนต่อดัชนีสูงสุด <b>${REPORT_DISPLAY.livingConditionsContribution}%</b> การขาดน้ำประปาและอินเทอร์เน็ตจึงเป็นอุปสรรคสำคัญเช่นกัน</p><div class='fact'>สิทธิบัตรทองครอบคลุม <b>${REPORT_DISPLAY.healthCoverage}%</b> เก็บบัตรทองเพื่อฟื้นคุณภาพชีวิต และแหล่งเงินกู้ในระบบเพื่อลดผลกระทบหนี้นอกระบบ</div><p class='note'>คะแนนคุณภาพชีวิตในเกมอยู่ในช่วง 0–100 ไม่ใช่ค่า MPI และไม่คำนวณแปลงจาก MPI</p>`}
];
const itemSpecs = [
  {x:660,id:"irrigation",name:"ระบบชลประทาน",short:"ชลประทาน",kind:"water",amount:0,quality:8,message:"ระบบชลประทาน: ป้องกันภัยแล้งตลอดเส้นทาง"},
  {x:1370,id:"wage",name:`ค่าจ้างเกษตร +${REPORT_DISPLAY.agriculturalWageGrowth}%`,short:`ค่าจ้าง +${REPORT_DISPLAY.agriculturalWageGrowth}%`,kind:"coin",amount:Math.round(REPORT_STATS.povertyLine*REPORT_STATS.agriculturalWageGrowth/100),quality:3,message:`ค่าจ้างเกษตร +${REPORT_DISPLAY.agriculturalWageGrowth}%: รับเงิน ${Math.round(REPORT_STATS.povertyLine*REPORT_STATS.agriculturalWageGrowth/100)} บาท (ปัดจาก ${REPORT_DISPLAY.povertyLine} × ${REPORT_DISPLAY.agriculturalWageGrowth}%)`},
  {x:2170,id:"child",name:"เงินอุดหนุนเด็กแรกเกิด",short:"เงินอุดหนุนเด็ก",kind:"heart",amount:160,quality:7,message:"เงินอุดหนุนเด็กแรกเกิด: เติมเงินและคุณภาพชีวิต"},
  {x:2590,id:"elderly",name:"เบี้ยยังชีพผู้สูงอายุ",short:"เบี้ยยังชีพ",kind:"heart",amount:180,quality:8,message:"เบี้ยยังชีพผู้สูงอายุ: ลดผลกระทบภาระพึ่งพิง 70% ในเกม"},
  {x:3890,id:"education",name:"กองทุนการศึกษา",short:"กองทุนการศึกษา",kind:"book",amount:150,quality:7,message:"กองทุนการศึกษา: ลดผลกระทบค่าเดินทาง 70% ในเกม"},
  {x:4520,id:"scholarship",name:"ทุนลดค่าใช้จ่ายแฝง",short:"ทุนค่าใช้จ่ายแฝง",kind:"book",amount:130,quality:6,message:"ทุนลดค่าใช้จ่ายแฝง: ช่วยลดผลกระทบค่าเดินทางเพิ่มเติม"},
  {x:5600,id:"health",name:"บัตรทอง",short:"บัตรทอง",kind:"cross",amount:0,quality:28,message:"บัตรทอง: ฟื้นคุณภาพชีวิต 28 คะแนน"},
  {x:6000,id:"finance",name:"แหล่งเงินกู้ในระบบ",short:"เงินกู้ในระบบ",kind:"coin",amount:0,quality:8,message:"แหล่งเงินกู้ในระบบ: ลดผลกระทบหนี้นอกระบบ 75% ในเกม (ไม่เพิ่มเงินหรือหนี้อัตโนมัติ)"}
];
const hazardSpecs = [
  {x:690,w:80,type:"drought",label:"ภัยแล้ง",cost:65,harm:4},
  {x:920,w:80,type:"flood",label:"น้ำท่วม",cost:70,harm:4},
  {x:2390,w:65,type:"food",label:`ค่าอาหาร ${REPORT_DISPLAY.foodShare}%`,cost:115,harm:5},
  {x:2620,w:65,type:"dependency",label:"ภาระพึ่งพิง",cost:120,harm:5},
  {x:2840,w:65,type:"food",label:"ค่าครองชีพ",cost:115,harm:5},
  {x:4090,w:65,type:"transport",label:`ค่าเดินทาง ${REPORT_DISPLAY.educationTransportShare}%`,cost:95,harm:4},
  {x:4320,w:65,type:"transport",label:"โรงเรียนไกลขึ้น",cost:95,harm:4},
  {x:5790,w:65,type:"utilities",label:"ขาดน้ำประปา",cost:90,harm:5},
  {x:6020,w:65,type:"debt",label:"หนี้นอกระบบ",cost:100,harm:6},
  // Append new hazards to preserve the indices recorded in existing checkpoints.
  {x:1140,w:80,type:"drought",label:"คลองแห้ง",cost:65,harm:4},
  {x:1320,w:80,type:"flood",label:"น้ำหลาก",cost:70,harm:4},
  {x:3020,w:65,type:"dependency",label:"ภาระดูแลสมาชิก",cost:120,harm:6},
  {x:4540,w:65,type:"transport",label:"ค่ารถต่อเที่ยว",cost:95,harm:4},
  {x:4720,w:65,type:"transport",label:"เส้นทางเรียนไกล",cost:95,harm:4},
  {x:6240,w:65,type:"utilities",label:"ขาดอินเทอร์เน็ต",cost:90,harm:5},
  {x:6420,w:65,type:"debt",label:"ภาระดอกเบี้ย",cost:100,harm:6}
];

const adventures = [
  {npc:"น้าหนุ่ม",role:"เกษตรกร",quest:"ฟื้นสายน้ำให้ท้องนา",verb:"รวบรวมชิ้นส่วนระบบน้ำ",
    resource:"ชิ้นส่วนระบบน้ำ",color:"#6fe2c1",required:["irrigation","wage"],
    greeting:"ภัยแล้งทำให้รายได้ไม่แน่นอน ช่วยหาชิ้นส่วน 3 ชิ้นบนทางไม้ และเก็บนโยบายทั้งสองอย่าง แล้วนำไปส่งที่แคมป์ปลายด่านนะ",
    ending:"สายน้ำกลับมาแล้ว! ชุมชนพร้อมรับมือความผันผวนมากขึ้น"},
  {npc:"พี่ทราย",role:"ผู้ดูแลครอบครัว",quest:"ส่งต่อความช่วยเหลือ",verb:"รวบรวมชุดดูแลครอบครัว",
    resource:"ชุดดูแลครอบครัว",color:"#f4ba87",required:["child","elderly"],
    greeting:"หนึ่งคนทำงาน แต่มีหลายชีวิตต้องดูแล ช่วยเก็บชุดดูแล 3 ชิ้น พร้อมเงินอุดหนุนเด็กและเบี้ยยังชีพ แล้วส่งที่แคมป์",
    ending:"ความช่วยเหลือถึงบ้านแล้ว! ภาระไม่ต้องอยู่บนบ่าของคนเดียว"},
  {npc:"พี่โบลิ่ง",role:"ครูชุมชน",quest:"เปิดทางไปโรงเรียน",verb:"รวบรวมชุดการเรียน",
    resource:"ชุดการเรียน",color:"#9bbcff",required:["education","scholarship"],
    greeting:"เด็กบางคนจ่ายค่าเดินทางมากกว่าที่คิด ช่วยเก็บชุดการเรียน 3 ชิ้นและทุนทั้งสองแบบ ก่อนส่งที่แคมป์โรงเรียน",
    ending:"เส้นทางเรียนรู้เปิดแล้ว! โอกาสไม่ควรจบเพราะค่ารถ"},
  {npc:"พี่อาร์ท",role:"เจ้าหน้าที่ชุมชน",quest:"เชื่อมเมืองให้ทุกคน",verb:"รวบรวมชุดบริการชุมชน",
    resource:"ชุดบริการชุมชน",color:"#dab5ff",required:["health","finance"],
    greeting:"บริการพื้นฐานสำคัญไม่แพ้รายได้ ช่วยเก็บชุดบริการ 3 ชิ้น พร้อมบัตรทองและแหล่งเงินกู้ในระบบ แล้วส่งที่ศูนย์ชุมชน",
    ending:"ชุมชนเชื่อมถึงกันแล้ว! สุขภาพและบริการพื้นฐานเข้าถึงได้มากขึ้น"}
];
const platforms=[];
const resources=[];
for(let zone=0;zone<4;zone++){
  const base=zone*ZONE_WIDTH;
  platforms.push(
    {x:base+520,y:GROUND-60,w:150},
    {x:base+760,y:GROUND-120,w:150},
    {x:base+1030,y:GROUND-75,w:170},
    {x:base+1260,y:GROUND-125,w:135}
  );
  resources.push(
    {id:`${zone}-0`,zone,x:base+580,y:GROUND-83},
    {id:`${zone}-1`,zone,x:base+815,y:GROUND-143},
    {id:`${zone}-2`,zone,x:base+1100,y:GROUND-98}
  );
}
const camps=adventures.map((adventure,zone)=>({zone,x:zone*ZONE_WIDTH+1530}));
const npcs=adventures.map((adventure,zone)=>({zone,x:zone*ZONE_WIDTH+285}));
const worldSigns=lessons.map((lesson,zone)=>({
  x:zone*ZONE_WIDTH+400,y:GROUND-140,
  title:zone===0?"เส้นความยากจน":zone===1?"ภาระพึ่งพิง":zone===2?"ค่าเดินทางเรียน":"ความยากจนหลายมิติ",
  value:lesson.big,detail:zone===0?`คนจน ${REPORT_DISPLAY.povertyRate}%`:zone===1?`ค่าอาหาร ${REPORT_DISPLAY.foodShare}%`:zone===2?"ของค่าใช้จ่ายที่จ่ายเอง":`คนจนหลายมิติ ${REPORT_DISPLAY.multidimensionalPovertyRate}%`
}));
itemSpecs.forEach((item,index)=>{
  item.x=Math.floor(index/2)*ZONE_WIDTH+(index%2===0?440:1430);
});
