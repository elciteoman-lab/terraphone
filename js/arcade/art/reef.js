import { arcadeTokens } from '../arcade-tokens.js';
import { rect, ellipse, polygon, noise, wear } from './print.js';

const water = ['#75bdb7','#65b0af','#55a5a7','#49989f','#3d8c96','#347f8c','#306f81','#2d6477','#28586b','#254f62','#244858'];
const shellRows = [
  '.........ooo..........','......ooogggggo.......','....oogggayygaggo.....','...oggyyayyyggyggo....',
  '..ogyyggayggayyyggo...','.ogaggaggyyaagygggo...','ogggyygaygyygggygo....',
  'ogggyyaggyygaggggo....','.ogggggaggggyyggo.....','..oobbbbbbbbbbbo......','....oobeeeeebbo.......'
];
const turtleHead=['...ooo....','..ommmmo..','.ommmhmooo','omhhmmdwoo','ommhhmmmoo','.occmmmoo.','..occmo...'];
const shellInk = {o:'#254b4c',g:'#70844f',y:'#c49c5f',a:'#dfba78',b:'#8a7954',e:'#ddc591'};
const skinInk = {o:'#275456',m:'#84ac77',h:'#b2cb8e',c:'#68957a',d:'#23484a',w:'#fff3cd'};
const sponge = ['..........bb....','...bb....bhhb...','..bhhb...bwbb...','..bwwb...bggb.bb','..bggb..bgggbbhb','b.bggbb.bgggbbwb',
  'wbbggbhbbgggbgbb','ggbggbwbgggbggb.','.gggggbgggggggb.','..gggggggggggb..','...bggggggggb...','....bbbbbbbb....'];
const shark = ['...................k........................','..................kkk......................','.................kppk.................k....',
  '...............kkpppkk...............kk....','..........kkkkkpppppppkkk...........kpk....','.......kkkpppppppppppppppkkkkk.....kpk.....',
  '....kkkpppppppppppppppppppppppkkkkppk.....','..kkpppphdkppppphhhhhhhhpppppppppppk......','kkphhhhhhphhhhhhhhhhhhhhhhhpppppppk.......',
  'khlwwwhhhhhhhhhhhhbbbhhhhhhppppppppk......','.kkllwwwwwllhhhhhhbbbbppppkkkkkkkpppk.....','...kkkkllllllwwwwhhbbppkkk.......kpppk....',
  '.......kkkkklllhhhpppkk...........kkppk...','............kkkkpppkk...............kkkk..','...............kppk....................kk.','................kk........................'];
const barracuda = ['....................kk...............k...','...................kpk.............kkk...','.......kkkkkkkkkkkkppkkkkkk.......kpk....',
  '...kkkkppppppppppppppppppppkkkkkkkpk....','kkkphdklhphphphphphphphpppppppppppk.....','kwwwlllhhhhhhhhhhhhhhhhllllpppppppk.....',
  '.kkllwwwwwwwwwwwwwwwwwwwwllkkkkkkppk....','...kkkkkkkkkkkkkkhhpkkkkkkk......kppk...','.................kpk..............kkpk..','..................k.................kk..'];
const fishInk={k:'#293f50',p:'#526a77',h:'#92abad',b:'#677e83',l:'#b4b9a6',w:'#eee0b8',d:'#faba78'};

function reefscape(c,w,h) {
  const band=c.createLinearGradient(0,0,0,h);
  water.forEach((color,i)=>band.addColorStop(i/(water.length-1),color));
  c.fillStyle=band;c.fillRect(0,0,w,h);
  for(let i=0;i<7;i++) {
    const x=w*(i/6-.1), width=w*(.05+noise(i,4)*.07);
    polygon(c,'rgba(213,226,180,.07)',[x,0,x+width,0,x-width*.5,h*.73,x-width*1.25,h*.95]);
  }
  for(let i=0;i<Math.ceil(w*.48);i++) {
    const x=noise(i,5)*w,y=Math.pow(noise(i,13),2)*h*.92;
    rect(c,i%4?'rgba(211,226,192,.25)':'#b6d7b7',x,y,y<h*.08?5+noise(i,2)*13:1+noise(i,6)*3,1);
  }
  for(let band=0;band<2;band++){
    const skyline=[0,h];
    for(let x=0;x<=w+3;x+=3) {
      const y=h*(.79+band*.13-.055*Math.sin(x/43+band*3)-.05*Math.sin(x/18+1)-.02*noise(~~(x/3),band));
      skyline.push(x,Math.floor(y));
    }
    skyline.push(w,h);polygon(c,['#477d82','#386668'][band],skyline);
  }
  // Faraway shoals share a bearing; scattered single dots would read as pickups.
  for(let school=0;school<3;school++) for(let i=0;i<9;i++){
    const x=(.19+school*.34)*w+(noise(i,school)*42-21);
    const y=(.35+school%2*.2)*h+(noise(i+9,school)*16-8);
    rect(c,'#5d9593',x,y,4,1);rect(c,'#609795',x-1,y-1,1,1);
  }
  // Distant table corals and grazing fish give the reef a silhouette below the swim lane.
  for (let n=0;n<Math.ceil(w/70);n++) {
    const x=n*72+noise(n,37)*24,y=h*(.85+noise(n,44)*.1),trunk=8+noise(n,19)*13;
    const ox=x+4,oy=y-trunk,frond='#557e7f';
    polygon(c,frond,[x-3,y+4,x+4,y+4,ox+2,oy,ox-1,oy]);
    for(let j=0;j<3;j++){
      const bx=ox+(j-1)*7,by=oy+j*2;
      polygon(c,frond,[ox,by+5,bx-3,by,bx-1,by-2,ox+2,by+2]);
      ellipse(c,'#658b85',bx,by-1,8-j,2);
      rect(c,'#75978b',bx-5,by-3,7,1);
    }
  }
  for(let i=0;i<w/12;i++){
    const x=i*14, y=h*(.9+.06*Math.sin(i*.53));
    const height=5+noise(i,91)*14;
    for(let j=0;j<3;j++)polygon(c,'#38676b',[x+j*2,y,x+j*3-2,y-height*(.6+j*.18),x+j*2+2,y-1]);
  }
  const sand=[0,h];
  for(let x=0;x<=w+3;x+=3)sand.push(x,h-9-Math.round(2*Math.sin(x/19)+1.5*Math.sin(x/8)));
  sand.push(w,h);polygon(c,'#a99871',sand);
  for(let i=0;i<w/2;i++)rect(c,i%3?'#bbac84':'#8b896c',noise(i,52)*w,h-7+noise(i,51)*7,2+noise(i,64)*4,1);
}

const pigments=[
  ['#663f50','#a65f64','#d48473','#eeb194'],
  ['#735849','#b28354','#d5a269','#edc88c'],
  ['#6b4f63','#94647b','#c18191','#dda9a7']
];
const calcite=['#747d72','#a7b0a1','#ced1b7','#eee4c5'];
const recovered=['#446869','#5f9690','#85b9a6','#b6d7af'];
function branch(c,p,x,y,tx,ty,width) {
  const lean=tx-x;
  polygon(c,p[0],[x-width,y,x+width+1,y,tx+2,ty+1,tx+1,ty-1,tx-1,ty-1]);
  polygon(c,p[1],[x-width+1,y,x+1,y,tx+1,ty+1,tx-1,ty+1]);
  rect(c,p[3],tx-1,ty,2,2);
  if(Math.abs(lean)>2)rect(c,p[2],x+lean*.62-1,y+(ty-y)*.62,2,2);
}

function coral(c,type,p) {
  if(type === 1) {
    // Lobes and nested channels of a brain coral, on its upright limestone plinth.
    polygon(c,p[0],[9,58,10,42,13,33,12,21,17,17,24,19,27,33,28,49,32,60,6,60]);
    polygon(c,p[1],[10,57,13,37,16,31,18,20,22,23,22,43,26,56]);
    for(const [x,y,rx,ry] of [[13,32,8,10],[24,30,9,13],[17,15,10,14],[27,17,6,8]]){
      ellipse(c,p[1],x,y,rx,ry);ellipse(c,p[2],x-1,y-2,Math.max(2,rx-2),ry-3);
      for(let j=0;j<3;j++){
        const px=x-rx/2+j*3, py=y-ry/2+(j%2)*3;
        rect(c,p[1],px,py,2,6);rect(c,p[1],px+1,py+5,3,1);rect(c,p[3],px-1,py,1,4);
      }
    }
  } else {
    const arms=type===0?[[16,57,15,6,4],[16,46,5,26,3],[10,36,4,15,2],[15,31,26,18,3],[23,23,28,7,2],[14,23,8,12,2],[17,51,31,38,3],[28,39,34,25,2],[28,37,25,26,1],[15,15,19,2,2]]
      :[[17,58,18,13,3],[17,49,5,32,2],[15,40,7,16,2],[16,37,27,19,2],[17,28,14,6,2],[12,32,2,22,1],[11,25,5,8,1],[18,22,23,4,1],[23,28,31,12,1],[24,32,33,22,1],[17,45,31,37,2],[18,16,18,2,1],[28,23,34,9,1]];
    for(const [x,y,tx,ty,d] of arms)branch(c,p,x,y,tx,ty,d);
    if(type===2) for(let i=0;i<14;i++) {
      const x=6+noise(i,26)*24,y=10+noise(i,4)*27;
      rect(c,p[2],x,y,1,2);
    }
  }
  polygon(c,p[0],[1,59,5,54,10,53,12,49,20,51,24,48,29,53,35,54,37,59]);
  polygon(c,p[1],[1,58,6,54,11,55,15,52,21,53,26,51,30,56,35,56,33,58]);
  rect(c,p[3],6,55,4,1);rect(c,p[2],17,53,5,1);
}

function drawTurtle(game,art) {
  const {ctx:c,time}=art,t=game.turtle;
  const shell=art.sprite('reef-shell',shellRows,shellInk),head=art.sprite('reef-head',turtleHead,skinInk);
  c.save();c.translate(t.x,t.y);c.rotate(Math.max(-.28,Math.min(.30,t.vy/800)));
  if(t.invulnTimer>0 && Math.floor(t.invulnTimer*10)%2)c.globalAlpha=.62;
  const glow=arcadeTokens.getEquippedItem('spiritGlow');
  const stroke=glow?.id && glow.id!=='verdant'?glow.hex:'#b2d5be';
  if(t.isDashing || (glow && glow.id!=='verdant')) {
    for(let i=0;i<3;i++)rect(c,stroke,-31-i*6,-6+i*5,t.isDashing?16+i*5:5,2);
  }
  const beat=Math.sin(t.flipperAngle || time*5);
  polygon(c,'#45776a',[-12,-3,-20,-10,-22,-9,-20,-4,-13,2]);
  polygon(c,'#759b74',[-15,0,-26,2,-24,5,-14,5]);
  c.drawImage(shell,-23,-12,42,22);
  c.drawImage(head,12,-8,18,13);
  polygon(c,'#345e5c',[3,1,12,0,15,5+beat*4,10,14+beat*4,5,15+beat*4,6,8]);
  polygon(c,'#83a77d',[5,1,11,2,12,6+beat*4,7,12+beat*4,8,6]);
  wear(art,arcadeTokens.getEquippedItem('crown')?.id,17,-8,16);
  c.restore();
}

export function paintReef(game,art) {
  const {ctx:c,width:w,height:h}=art;
  c.drawImage(art.stamp('reef-water',art.pixelWidth,art.pixelHeight,reefscape),0,0,w,h);
  for(const reef of game.corals) {
    if(reef.x+reef.width < 0 || reef.x-reef.width >w)continue;
    const state=reef.bleached?'bleached':reef.revived?'revived':'alive';
    const p=reef.bleached?calcite:reef.revived?recovered:pigments[reef.type];
    const sprite=art.stamp('reef-coral-'+reef.type+state,38,60,ctx=>coral(ctx,reef.type,p));
    c.save();c.translate(reef.x,reef.y);if(reef.isCeiling)c.scale(1,-1);
    c.drawImage(sprite,-reef.width/2,-reef.height,reef.width,reef.height+2);c.restore();
    if(reef.bleached && !reef.isCeiling) {
      for(let i=0;i<4;i++) {
        const rise=(art.time*22+i*13)%52;
        rect(c,'#b7dcc5',reef.x+Math.sin(i*2+rise*.08)*7,reef.y-reef.height-rise,2,3);
      }
    }
  }
  const healing=art.sprite('reef-sponge',sponge,{b:'#3a6267',g:'#6aaba0',h:'#b4d9ba',w:'#f0e8bf'});
  for(const s of game.seaSponges) if(!s.collected&&s.x>-18&&s.x<w+18)c.drawImage(healing,s.x-13,s.y-14,27,27);
  for(const b of game.bubbles) {
    const size=b.r>4?4:2;
    rect(c,'#90c3b6',b.x,b.y,size,1);rect(c,'#75a9a4',b.x-1,b.y+1,1,size/2);
  }
  for(const p of game.predators) {
    if(p.x+p.w<0 || p.x-p.w>w)continue;
    const fish=art.sprite('reef-'+p.type,p.type==='shark'?shark:barracuda,fishInk);
    c.drawImage(fish,p.x-p.w*.3,p.y-p.h*.61,p.w*1.2,p.h*1.22);
    if(p.state==='hunting' || p.state==='lunging'){
      const x=p.x-p.w*.35;polygon(c,'#f1af7a',[x-6,p.y,x,p.y-4,x,p.y+4]);
      if(p.state==='lunging')rect(c,'#f1af7a',x-14,p.y-1,5,2);
    }
  }
  for(const p of game.particles)rect(c,'#d0caa6',p.x,p.y,3,2);
  drawTurtle(game,art);
}
