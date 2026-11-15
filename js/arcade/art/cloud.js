import { arcadeTokens } from '../arcade-tokens.js';
import { rect, polygon, ellipse, noise, wear } from './print.js';

const silk = ['#566888','#647893','#75869b','#88939e','#a39fa6','#c0aaa5','#d7b6a8','#e9c8ad','#f1d7b5'];
const ridge = [
  [.60, .11, .009, '#a49ba5'], [.70, .080, .017, '#7c8492'],
  [.79, .064, .026, '#586f7b'], [.88, .045, .038, '#435f69']
];

function valley(c, w, h) {
  const sky=c.createLinearGradient(0,0,0,h*.79);
  silk.forEach((color,i)=>sky.addColorStop(i/(silk.length-1),color));
  c.fillStyle=sky;c.fillRect(0,0,w,h);
  const sunX = Math.round(w * .66), sunY = Math.round(h * .34), r = Math.round(Math.min(w, h) * .10);
  ellipse(c, '#e9bc9e', sunX, sunY, r + 2, r + 2);
  ellipse(c, '#f6d5a9', sunX, sunY, r, r);
  const haze = ['#c6b3b1','#d6beb6','#e3c8b9'];
  for (let i = 0; i < 35; i++) {
    const x = noise(i, 2) * w, y = h * (.24 + noise(i, 3) * .33);
    const len = (4 + noise(i, 4) * 34) * w / 450;
    rect(c, haze[i % 3], x, y, len, i % 8 === 0 ? 2 : 1);
  }
  // Faint lenticular clouds sit behind the flight corridor.
  for (const [at,alt,scale] of [[.10,.36,.84],[.43,.30,.50],[.84,.44,1.0]]) {
    const x=Math.round(at*w),y=Math.round(alt*h),length=Math.round(Math.min(w*.13,h*.20)*scale);
    const bank='#d3bbaf';
    ellipse(c,bank,x,y,length,3);
    ellipse(c,bank,x-length*.33,y-2,Math.max(2,Math.round(length*.43)),4);
    ellipse(c,'#e2c9b5',x-length*.14,y-5,Math.max(2,Math.round(length*.36)),3);
    rect(c,'#ead1b9',x-length*.36,y-7,length*.40,1);
    rect(c,'#b5a7a6',x-length*.56,y+3,length*.95,1);
  }
  for (const [base, height, f, color] of ridge) {
    const points = [0,h];
    for (let x = 0; x <= w + 2; x += 2) {
      const line = .54 * Math.sin(x * f + base * 14) + .31 * Math.cos(x * f * 2.64) + .15 * Math.sin(x * f * 5.84);
      points.push(x, Math.round(h * (base + line * height)));
    }
    points.push(w,h);
    polygon(c, color, points);
  }
  const quay = Math.round(h * .92);
  for (let i = 0; i * 19 < w + 40; i++) {
    const x = i * 19 - 4, height = 3 + Math.floor(noise(i,5) * 14);
    rect(c, '#3e555e', x, quay - height, 16, height + 2);
    polygon(c, '#53636a',[x-1,quay-height,x+5,quay-height-4,x+14,quay-height-1,x+18,quay-height+1]);
    for (let j=2;j<15;j+=4) if (noise(i,j)>.33) rect(c, '#aa9b81',x+j,quay-height+2,2,1);
    if (i % 4 === 1) {
      const top = quay - height - 12;
      rect(c, '#58646a', x+13,top,3,15); rect(c,'#948983',x+12,top,5,2);
      for(let n=0;n<5;n++) rect(c,'#96949c',x+14+n*2,top-3-n*2,3+n,1);
    }
  }
  // The rail viaduct crosses the mill basin low in the valley.
  const mill=Math.round(w*.70), deck=quay-8;
  for (let i=0;i<3;i++){
    const x=mill+i*7, chimney=quay-(20+i%2*8);
    rect(c,'#52616b',x,chimney,4,quay-chimney);
    rect(c,'#9a827a',x,chimney+4,4,2);rect(c,'#a68f83',x-1,chimney,6,1);
    for(let k=0;k<4;k++)rect(c,'#a19a9d',x+1+k*3,chimney-2-k*2,4+k*2,2);
  }
  for (let x=mill-44;x<mill+20;x+=9){
    polygon(c,'#47575f',[x,quay-6,x+8,quay-13,x+8,quay-6]);rect(c,'#887b71',x+6,quay-9,2,2);
  }
  for(let x=0;x<w*.37;x+=16) {
    rect(c,'#4c5c63',x,deck,17,2);rect(c,'#465963',x+7,deck+2,3,8);
    rect(c,'#9c9080',x,deck-1,16,1);
  }
  rect(c, '#456776',0,quay,w,h-quay);
  for(let i=0;i<Math.ceil(w*.18);i++) rect(c, i%3?'#688187':'#9c9890',noise(i,16)*w,quay+1+noise(i,8)*(h-quay),2+noise(i,9)*9,1);
}

// Iron banding and different masonry courses meet the exact top and bottom of each gate.
function masonry(c, iron) {
  rect(c, iron ? '#42565b' : '#584e50',0,0,32,24);
  for (let row=0;row<4;row++) for(let x=-8+(row%2)*6;x<33;x+=12) {
    const v=noise(row,x);
    const slab=iron ? (v>.5?'#7c8a83':'#748480') : (v>.6?'#aa7c6b':v>.3?'#a27869':'#966f64');
    rect(c,slab,x+1,row*6,11,5);
    rect(c,iron?'#a6aaa0':'#c7997e',x+1,row*6,10,1);
  }
  rect(c,'#dbc09c',0,0,2,24);
  rect(c,iron?'#4d6467':'#806261',24,0,5,24);
  rect(c,'#39484d',29,0,3,24);
  rect(c,'#5f605c',4,0,3,24);rect(c,'#b5a78d',4,0,1,24);
  rect(c,'#535956',3,15,5,2);rect(c,'#d0b194',3,15,3,1);
}
function mouth(c,iron) {
  rect(c,'#34454b',0,0,38,14);rect(c,'#d3af8b',1,0,36,2);
  rect(c,'#7f8076',1,2,36,4);rect(c,'#c6ac88',2,3,23,1);
  for (let x=3;x<35;x+=7) {
    rect(c,'#435552',x,3,3,2);rect(c,'#e4cf9e',x,3,1,1);
  }
  rect(c,'#ad805d',1,7,36,4);
  for (let x=2;x<34;x+=7) {
    polygon(c,iron?'#adbfae':'#e7b76e',[x,7,x+5,7,x+2,11,x-1,11]);
  }
  rect(c,'#8d9585',3,12,32,1);
}
function tower(art,x,edge,width,fromTop,iron) {
  const c=art.ctx,tile=art.stamp('cloud-bricks-'+iron,32,24,ctx=>masonry(ctx,iron));
  const lip=art.stamp('cloud-lip-'+iron,38,14,ctx=>mouth(ctx,iron));
  const bottom=fromTop?edge:art.height,top=fromTop?0:edge,course=width*.75;
  c.save();
  c.beginPath();c.rect(x,top,width,bottom-top);c.clip();
  for(let y=fromTop?edge-course:edge;fromTop?y>-course:y<bottom;y+=fromTop?-course:course) {
    c.drawImage(tile,x,y,width,course+.5);
  }
  // Alternating iron collars follow the shaft as it scrolls through the frame.
  for(let y=fromTop?edge-width:edge+width;y>=top && y<bottom;y+=fromTop?-width*1.8:width*1.8) {
    rect(c,'#475454',x,y,width,4);rect(c,'#b4a691',x+1,y,width-4,1);
  }
  c.restore();
  c.save();
  c.translate(x-3,edge);if(fromTop)c.scale(1,-1);
  c.drawImage(lip,0,0,width+6,width*.30);
  c.restore();
}

const billow = [
  '...........oooooo...........', '.........oohhhhwwo..........','........ohhwwwwwwwo.........',
  '.....oooohwwwwwwwwwooo......','....ohhhwwwwwwwwwllhhho.....','...ohwwwwwwwwwlllhhwwhho....',
  '..ohwwwwwwwwwwhwwwwwwwwho...','.ohwwllwwwwwwwwwwwwwwwwwho..','ohwwwhwwwwwwwwwwwwwwwwwllho.',
  'ohllhwwwwwhwwwwwwwlwwllhhhh.','ohhllwwwwlhwwwwwwhlhhhhhhlo.','.ohhhlllhhlllhhllhhhhhlllo..',
  '..ooollllllllllllllllooo....','.....oooooooooooooooo.......'
];
const palettes = {white:['#fff1d2','#e6d6bc','#a4afb4'],aurora:['#ddf2dd','#b5d8d9','#9189b1'],
  nebula:['#edc5dd','#b59bc9','#867fac'],golden_cloud:['#ffe292','#e4b771','#bd8670'],stellar_supernova:['#ffddad','#f2a884','#bc8198']};
const parcel=['..b....b..','..b....b..','.bbbbbbbb.','.gghaaggh.','.ghhaaghh.','.ghhaaghd.','.dddddddd.'];
const dew=['...a...','..aha..','..aha..','.ahhda.','ahhwwda','adhhhda','.addda.','..aaa..'];
export function paintCloud(game, art) {
  const {ctx:c,width:w,height:h}=art;
  c.drawImage(art.stamp('cloud-valley',art.pixelWidth,art.pixelHeight,valley),0,0,w,h);
  const rail=art.stamp('cloud-overhead',48,7,ctx=>{
    rect(ctx,'#465660',0,0,48,2);rect(ctx,'#8c887d',0,6,48,1);
    for(let x=0;x<48;x+=12)polygon(ctx,'#6f7275',[x,1,x+2,1,x+8,6,x+5,6]);
  });
  for(let x=-(Math.round(game.cloud.distance*.3)%96);x<w;x+=96)c.drawImage(rail,x,0,96,14);
  for(const gate of game.smokestackGates) {
    if(gate.x+gate.w < -4 || gate.x>w+4)continue;
    const iron=gate.pollutant.startsWith('NO');
    tower(art,gate.x,gate.topH,gate.w,true,iron);tower(art,gate.x,gate.bottomY,gate.w,false,iron);
    const lamp=Math.floor(art.time*2)%2?'#ffd699':'#dc9369';
    rect(c,lamp,gate.x+8,gate.topH-7,4,3);rect(c,lamp,gate.x+gate.w-12,gate.bottomY+4,4,3);
  }
  const drop=art.sprite('cloud-dew',dew,{a:'#477782',h:'#a2e3d6',w:'#f8eed5',d:'#68b7bb'});
  for(const vapour of game.vaporDrops) if(!vapour.collected && vapour.x>-10 && vapour.x<w+10)
    c.drawImage(drop,vapour.x-8,vapour.y-10,16,20);
  for(const p of game.particles) rect(c,p.vy<0?'#d8c3a5':'#7b7883',p.x,p.y,3,3);
  const cloud=game.cloud, skin=arcadeTokens.getEquippedItem('gliderSkin')?.id || 'white';
  const sick=cloud.purity<30, [white,half,shade]=sick?['#d4cba6','#bbba96','#969d91']:(palettes[skin] || palettes.white);
  const puff=art.sprite('cloud-player-'+(sick?'acid':skin),billow,{o:'#56616a',h:half,w:white,l:shade});
  const bag=art.sprite('cloud-post',parcel,{b:'#6b5b55',g:'#d78c54',h:'#c57651',a:'#f2cf91',d:'#92634e'});
  c.save();c.translate(cloud.x,cloud.y);c.rotate(Math.max(-.13,Math.min(.14,cloud.vy/1800)));
  c.drawImage(bag,-10,5,20,15);c.drawImage(puff,-28,-15,56,28);
  const crown=arcadeTokens.getEquippedItem('crown')?.id;
  wear(art,skin==='golden_cloud' && crown==='none'?'golden_crown':crown,1,-11,20);
  c.restore();
}
