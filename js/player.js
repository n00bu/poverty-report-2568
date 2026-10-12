"use strict";

const heroSprite = [
  ".....hhhhhh.....", "....hhHHHhhh....", "....hHHHHHhh....", "....hssssshh....",
  "....hsSksks.....", ".....sSsssn.....", ".....sssssn.....", "......nnn.......",
  "...rrhbcCbh.....", "..rRrhBBcbbb....", "..rRrhbBcbbS....", "..rRrhbbbbns....",
  "...rrhbbBbhns...", ".....hpppph.....", ".....pPpppp.....", ".....pP.ppp.....",
  ".....pp..pp.....", ".....pp..pp.....", ".....dd..dd.....", "....dDd..dDd...."
];
const heroPalette = {h:"#293538",H:"#5b6860",s:"#e8b783",S:"#ffdab0",n:"#b87957",k:"#26333a",b:"#00109E",B:"#344bc4",c:"#00096b",C:"#7588df",r:"#654331",R:"#aa7748",p:"#25282b",P:"#474c51",d:"#293538",D:"#957d56"};
function straightLegPose(stride){
  const rows=Array.from({length:5},()=>Array(16).fill("."));
  // Draw the far leg first so the near leg can pass in front of it.
  for(const near of [false,true]){
    const hip=near?8:7,reach=near?stride:-stride;
    for(let row=0;row<4;row++){
      const x=Math.round(hip+reach*row/3);
      rows[row][x]=row===3?"d":near?"P":"p";
      rows[row][x+1]=row===3?"d":near?"p":"h";
    }
    const foot=hip+reach;
    rows[4][foot]="d";rows[4][foot+1]=near?"D":"d";rows[4][foot+2]="d";
  }
  return rows.map(row=>row.join(""));
}
const heroLegFrames=[heroSprite.slice(15),...[3,2,0,-3,-2,0].map(straightLegPose)];
const secretSprite=[
  "................",".....hhhhhh.....","....hHHHHHhh....","....hssssssh....",
  "....ssSksks.....","....ssSsssss....",".....ssssss.....","......nnn.......",
  "....bbcCbbb.....","...bbbBcBbbbs...","...bbbBcBbbSs...","...sbbbbbbbns...",
  "...sbbbbbbbns...",...heroSprite.slice(13)
];
const secretPalette={...heroPalette,h:"#303332",H:"#666962",b:"#163d8b",B:"#3b66b0",c:"#0b285b",C:"#e5ddbd"};
const secretDashSprite=[
  "............................",
  "..................hhhhhh....",
  ".................hHHHHHhh...",
  ".................hssssssh...",
  "..................sSskss....",
  "...........bbbbbbnnsssss....",
  "..ddpppppppbbBBcBbbnnn......",
  ".dDdpppppppbbBBcBbbbbsssss..",
  "...........bbbbbbbbbbSSssns.",
  "..ddpppppppbbbbbbb..........",
  ".dDdpppppppbbbbbb...........",
  "............................"
].map(row=>row.padEnd(28,"."));
const characterSheets=new Map();
const characterKeys=new WeakMap();
const npcAppearances=[
  {
    sprite:[
      ".....hhhhhh.....","....hhHHHhhh....","....hHHHHHhh....","....HssssssH....",
      "....ssSksks.....",".....sSsssn.....",".....sssssn.....","......nnn.......",
      "....bbccCbb.....","...bbbBcBbbbs...","...bbbBkBbbbs...","...sbbBbbbbbs...",
      "...sbbbbbbbns...",".....pppppp.....",".....pPpppp.....",".....pP..pp.....",
      ".....pp..pp.....",".....pp..pp.....",".....dd..dd.....","....dDd..dDd...."
    ],
    palette:{...heroPalette,h:"#20292b",H:"#4b5150",b:"#427c77",B:"#6caaa0",c:"#295954",C:"#acd1bd",p:"#24272d",P:"#484b50"}
  },
  {
    sprite:[
      ".....hhhhhh.....","....hhHHHhhh....","....hHHHHHhh....","....hssssshh....",
      "....hsSssssh....","....hsksskhh....","....hsssssnh....","....hhnnnhhh....",
      "....hbbBbbh.....","....bbbBBbbbs...","....bbbBBbbbs...","....sbbBbbbss...",
      "....sbbBbbbs....",".....pppppp.....",".....pPpppp.....",".....pP..pp.....",
      ".....pp..pp.....",".....pp..pp.....",".....dd..dd.....","....dDd..dDd...."
    ],
    glasses:true,
    palette:{...heroPalette,h:"#1b2026",H:"#3d4148",g:"#8b8074",b:"#d5c7a7",B:"#fff0cf",p:"#654a35",P:"#9a7954",d:"#382d28"}
  },
  {
    sprite:[
      "......hhhhh.....",".....hhHHHhh....",".....hHHHHhh....",".....hsssshh....",
      "....hsSssssh....","....hsksskhh....","....hsssssnH....","....hhnnnnhH....",
      "....hbbBbbhH....","....hbbBBbhHs...","....hbbBBbhHs...","....sbbBbbss....",
      "....sbbBbbs.....","......pppp......","......pPpp......","......pp.pp.....",
      "......pp.pp.....","......pp.pp.....","......dd.dd.....",".....dDd.dDd...."
    ],
    glasses:true,
    palette:{...heroPalette,h:"#222630",H:"#4b4854",g:"#8b8191",b:"#617a9e",B:"#abc4db",p:"#404b64",P:"#73839b"}
  },
  {
    sprite:[
      "......hhhhh.....",".....hhHHHhh....",".....hHHHHhh....",".....hsssssh....",
      ".....sSssssh....",".....sksskhh....",".....sssssn.....","......nnnn......",
      ".....jwcwj......","....jjwcwjjss...","....jjwcwjjss...","....sjjwjjjss...",
      "....sjjjjjs.....","......pppp......","......pPpp......","......pp.pp.....",
      "......pp.pp.....","......pp.pp.....","......dd.dd.....",".....dDd.dDd...."
    ],
    glasses:true,
    palette:{...heroPalette,h:"#22282d",H:"#49535a",g:"#879297",j:"#343b46",w:"#f4f3e6",c:"#6b7785",p:"#36393f",P:"#595e66",d:"#20252c",D:"#697077"}
  }
];

function drawCharacter(context,x,y,time,direction=1,walking=false,palette=heroPalette,scale=2,sprite=heroSprite,glasses=false){
  let paletteKeys=characterKeys.get(palette);
  if(!paletteKeys){paletteKeys=new WeakMap();characterKeys.set(palette,paletteKeys);}
  let spriteKeys=paletteKeys.get(sprite);
  if(!spriteKeys){spriteKeys=new Map();paletteKeys.set(sprite,spriteKeys);}
  const variant=`${scale}:${glasses}`;
  let key=spriteKeys.get(variant);
  if(!key){key=JSON.stringify([palette,sprite,scale,glasses]);spriteKeys.set(variant,key);}
  let sheet=characterSheets.get(key);
  if(!sheet){
    const animated=sprite===heroSprite||sprite===secretSprite;
    const frameCount=animated?heroLegFrames.length:1;
    const frameWidth=(sprite[0].length+2)*scale;
    sheet=document.createElement("canvas");sheet.width=frameWidth*frameCount;sheet.height=sprite.length*scale;
    const pixels=sheet.getContext("2d");
    for(let frame=0;frame<frameCount;frame++){
      sprite.forEach((row,r)=>Array.from(animated&&r>=15?heroLegFrames[frame][r-15]:row).forEach((pixel,c)=>{
        if(pixel===".")return;
        pixels.fillStyle=palette[pixel];
        pixels.fillRect(frame*frameWidth+(c+1)*scale,r*scale,scale,scale);
      }));
      if(glasses){
        const offset=frame*18*scale+scale,thickness=Math.max(1,Math.round(scale*.25));
        pixels.fillStyle=palette.g;
        for(const lensX of [5,8]){
          const left=offset+lensX*scale,top=4*scale,width=2.5*scale,height=2*scale;
          pixels.fillRect(left,top,width,thickness);
          pixels.fillRect(left,top+height-thickness,width,thickness);
          pixels.fillRect(left,top,thickness,height);
          pixels.fillRect(left+width-thickness,top,thickness,height);
        }
        pixels.fillRect(offset+7.5*scale,4.75*scale,.5*scale,thickness);
      }
    }
    characterSheets.set(key,sheet);
  }
  const frame=walking&&(sprite===heroSprite||sprite===secretSprite)?1+Math.floor(time*12)%(heroLegFrames.length-1):0;
  const frameWidth=(sprite[0].length+2)*scale;
  context.save();
  context.translate(Math.round(x)+(direction<0?sprite[0].length*scale:0),Math.round(y));
  if(direction<0)context.scale(-1,1);
  context.drawImage(sheet,frame*frameWidth,0,frameWidth,sheet.height,-scale,0,frameWidth,sheet.height);
  context.restore();
}

class Player {
  constructor(){this.w=24;this.h=40;this.reset();}
  reset(x=GAME_CONFIG.startX){
    Object.assign(this,{x,y:GROUND-this.h,vx:0,vy:0,grounded:true,facing:1,coyote:.1,jumpBuffer:0,jumpHeld:false,superMode:false});
  }
  update(dt,controlled,platforms,rightLimit){
    const dir=Number(controlled("right"))-Number(controlled("left"));
    const multiplier=this.superMode?2.4:1;
    const target=dir*GAME_CONFIG.speed*multiplier;
    const difference=target-this.vx;
    this.vx+=Math.sign(difference)*Math.min(Math.abs(difference),GAME_CONFIG.acceleration*multiplier*dt);
    if(dir)this.facing=dir;
    const jump=controlled("jump");
    if(jump&&!this.jumpHeld)this.jumpBuffer=.12;
    this.jumpHeld=jump;
    this.jumpBuffer=Math.max(0,this.jumpBuffer-dt);
    this.coyote=this.grounded?.1:Math.max(0,this.coyote-dt);
    let jumped=false;
    if(this.jumpBuffer>0&&this.coyote>0){
      this.vy=GAME_CONFIG.jumpVelocity;this.grounded=false;this.coyote=0;this.jumpBuffer=0;jumped=true;
    }
    if(!jump&&this.vy< -330)this.vy=-330;
    const previousBottom=this.y+this.h;
    this.vy+=GAME_CONFIG.gravity*dt;
    this.x=Math.max(20,Math.min(rightLimit-this.w,this.x+this.vx*dt));
    this.y+=this.vy*dt;this.grounded=false;
    if(this.vy>=0){
      let surface=GROUND;
      for(const platform of platforms){
        if(this.x+this.w>platform.x&&this.x<platform.x+platform.w&&previousBottom<=platform.y+2&&this.y+this.h>=platform.y){
          surface=Math.min(surface,platform.y);
        }
      }
      if(this.y+this.h>=surface){this.y=surface-this.h;this.vy=0;this.grounded=true;}
    }
    return jumped;
  }
  draw(context,camera,time,invulnerable=false){
    if(invulnerable&&Math.floor(time*12)%2===0)return;
    if(this.superMode&&Math.abs(this.vx)>15){
      drawCharacter(context,this.x-camera-16,this.y+12,0,this.facing,false,secretPalette,2,secretDashSprite);
      return;
    }
    drawCharacter(context,this.x-camera-4,this.y,this.superMode?time*1.8:time,this.facing,Math.abs(this.vx)>15&&this.grounded,
      this.superMode?secretPalette:heroPalette,2,this.superMode?secretSprite:heroSprite);
  }
}
const player=new Player();
