import { ellipse, noise, polygon, rect } from './print.js';

const crowns=[
  ['#625d46','#87734a','#aa8e52','#c4ab68'], ['#64614a','#91804e','#ad9857','#cdb575'],
  ['#795e46','#aa794c','#c69457','#ddb270'], ['#605c47','#836843','#aa7949','#bd8d52']
];
const circle=Math.PI*2, tileHeight=336;
function tree(c,kind,variant) {
  const [shade,mid,leaf,light]=crowns[variant];
  if(kind==='redwood'){
    polygon(c,'#5c604b',[15,4,25,14,33,24,32,29,25,28,17,24,9,17]);
    polygon(c,'#585d42',[14,2,19,9,18,9,23,15,20,15,26,21,21,22,16,25,8,22,4,20,8,15,6,15,11,9,9,9]);
    polygon(c,mid,[14,3,16,9,14,9,20,15,16,15,22,20,16,23,8,21,5,20,10,15,8,15,12,9,10,9]);
    polygon(c,leaf,[14,3,14,9,11,9,15,14,11,14,15,18,9,18,12,15,9,15,12,10,10,10]);
    rect(c,light,13,5,1,3);rect(c,leaf,7,20,4,1);
  } else {
    polygon(c,'rgba(73,69,51,.48)',[11,6,20,6,28,11,30,15,34,21,30,25,24,26,22,28,14,26,13,23,7,21]);
    const silhouette=[11,2,17,2,19,4,22,3,26,7,25,10,28,13,27,17,24,18,24,21,21,23,15,23,12,25,7,22,7,20,3,18,3,13,2,11,4,8,7,7,7,4];
    polygon(c,shade,silhouette);
    polygon(c,mid,[11,3,16,3,18,5,22,5,24,7,24,11,26,13,25,16,20,16,19,20,15,20,12,23,8,20,9,17,5,16,4,12,6,9,9,9,8,6]);
    polygon(c,leaf,[11,3,16,3,17,5,20,5,21,8,19,10,16,11,16,14,12,16,10,15,7,16,5,13,6,10,10,9,9,6]);
    polygon(c,light,[11,4,15,4,15,6,13,7,12,9,9,9,10,7]);
    rect(c,leaf,19,13,4,2);rect(c,mid,15,18,3,2);rect(c,light,6,11,2,1);
  }
}
function canopyTile(art) {
  return art.stamp('canopy-land',art.pixelWidth,tileHeight,(c,w,h)=>{
    const images=crowns.map((_,i)=>art.stamp('grove-'+i,35,30,ink=>tree(ink,i===3?'redwood':'oak',i)));
    const river=y=>w*(.32+.19*Math.sin(y*circle/h-.3)+.042*Math.sin(y*circle*2/h+.65));
    for(let y=0;y<h;y++){
      const bank=river(y), breadth=Math.max(7,w*.034)*(1.02+.19*Math.sin(y*circle/h));
      rect(c,'#9b8456',0,y,w,1);
      const ridge=bank+w*(.22+.035*Math.sin(y*circle/h));
      rect(c,'#a98f5b',ridge,y,w-ridge,1);rect(c,'#b59961',ridge+w*.10,y,w-ridge-w*.10,1);
      rect(c,'#857b55',bank-breadth-8,y,breadth*2+15,1);
      rect(c,'#b9a875',bank-breadth-2,y,breadth*2+5,1);
      rect(c,'#657f75',bank-breadth,y,breadth*2,1);rect(c,'#71938a',bank-breadth*.74,y,breadth*1.31,1);
      if(y%11<2)rect(c,'#a9b5a0',bank-breadth*.6,y,Math.max(2,breadth*.51),1);
    }
    const dots=Math.round(w*h/30);
    for(let i=0;i<dots;i++){
      const x=noise(i,18)*w,y=noise(i,22)*h;
      if(Math.abs(river(y)-x)<=w*.05)continue;
      rect(c,i%3?'#a89360':'#bda56c',x,y,1+noise(i,29)*3,1);
    }
    // Place the same stand on either side of the tile seam.
    const count=Math.round(w*h/250);
    for(let i=0;i<count;i++){
      const y=i*h/count,x=noise(i,75)*w;
      if(Math.abs(river(y)-x)<w*.07 || (Math.sin(x/24+y/31)>.64 && noise(i,2)>.4))continue;
      const size=Math.floor(9+noise(i,41)*14),image=images[Math.floor(noise(i,56)*images.length)];
      for(const shift of [-h,0,h]) if(y+shift>-size && y+shift<h+size)c.drawImage(image,x-size/2,y+shift-size/2,size,size*.85);
    }
    const bridgeY=Math.floor(h*.34), bridgeX=river(bridgeY), len=w*.096+7;
    rect(c,'#625d48',bridgeX-len/2,bridgeY+2,len,7);rect(c,'#c9aa76',bridgeX-len/2,bridgeY,len,5);
    for(let x=bridgeX-len/2+2;x<bridgeX+len/2-1;x+=3)rect(c,'#9d7b58',x,bridgeY+1,1,3);
    rect(c,'#e1c89a',bridgeX-len/2-2,bridgeY-1,len+4,1);rect(c,'#756247',bridgeX-len/2-2,bridgeY+4,len+4,1);
  });
}

function clearing(c) {
  const colors=['#ad9e63','#c2af74','#d9c58d'];
  for(let y=0;y<48;y++){
    const ny=(y-24)/23;if(Math.abs(ny)>1)continue;
    const span=Math.sqrt(1-ny*ny)*21,rag=noise(y,14)*2;
    rect(c,colors[0],24-span-rag,y,span*2+rag,1);
    if(span>4)rect(c,colors[1],25-span*.82,y,span*1.66,1);
  }
  for(let i=0;i<38;i++){
    const x=6+noise(i,71)*36,y=5+noise(i,79)*37;if(Math.hypot(x-24,y-24)>19)continue;
    rect(c,colors[2],x,y,1+noise(i,75)*2,1);
  }
}
function smoke(c, frame) {
  for(const [x,y,r,color] of [[13,32,10,'#786c5a'],[22,27,10,'#8b7663'],[27,21,9,'#847168'],[29,15,8,'#998679'],[32,9,6,'#b09b86']]){
    ellipse(c,color,x+Math.sin(frame+x),y,r,r-2);
  }
  polygon(c,'#845943',[4,37,7,33,12,35,16,30,22,35,26,37,24,40,9,40]);
  polygon(c,'#d38951',[8,36,12,28,12,34,16,31,16,26,20,34,22,36,18,38,11,38]);
  rect(c,'#f4bc6f',13,35,4,2);rect(c,'#e4ab68',18+frame,22,1,2);
}
const wing=[
 '.................................sss.', '..............................sssews.', '...........................ssseeewws.',
 '.......................sssseeewwwws..','...................sssseeeeeeewwws...','...............ssseeeeeeeeeewwwss....',
 '............ssseeeddddeeeewwwss......','.........ssseeddddeeeeeewwwws........','.......sseeddddeeeeeeewwwwss.........',
 '.....sseddddeeeeeeeewwwwss...........','...ssbbddeeeeeeeeeewwsss.............','..sbbbybddeeeeewwwsss................',
 '.sbbyyybbdwwwssss....................','sbbyhyybbsssss.......................','sbbyyybbss...........................',
 '.sbbbbbss............................','..sssss..............................'
];
export function paintCanopy(game,art) {
  const {ctx:c,width:w,height:h,unit,time}=art;
  const ground=canopyTile(art),length=tileHeight*unit;
  const offset=Math.floor(game.distance*.84/unit)*unit%length;
  for(let y=offset-length;y<h;y+=length)c.drawImage(ground,0,y,art.pixelWidth*unit,length);
  for(const t of game.canopyLayers){
    if(t.y< -80 || t.y>h+80)continue;
    const v=t.type==='redwood'?3:Math.floor(t.r)%3;
    const img=art.stamp('grove-'+v,35,30,ctx=>tree(ctx,t.type,v));
    c.drawImage(img,t.x-t.r*.6,t.y-t.r*.5,t.r*1.3,t.r*1.12);
  }
  const glade=art.stamp('thermal-clearing',48,48,clearing);
  for(const t of game.thermalUpdrafts){
    if(t.y < -65 || t.y>h+65)continue;
    c.drawImage(glade,t.x-t.r,t.y-t.r,t.r*2,t.r*2);
    // Two open coils show the direction and footprint of the rising air.
    for(let ring=0;ring<2;ring++){
      const radius=t.r*(.73-ring*.25), phase=time*1.30+ring*2.9;
      c.strokeStyle=ring?'#fff1bf':'#e9d9a0';c.lineWidth=2.5;c.beginPath();
      c.ellipse(t.x,t.y-ring*4,radius,radius*.78,-.35,phase,phase+3.6);c.stroke();
      rect(c,'#fff0b7',t.x+Math.cos(phase)*radius-1,t.y+Math.sin(phase)*radius*.78-ring*4,4,3);
    }
  }
  for(const p of game.wildfireSmokePlumes){
    if(p.y < -85 || p.y>h+85)continue;
    const frame=Math.floor(time*4)%3;
    const img=art.stamp('canopy-smoke-'+frame,44,45,ctx=>smoke(ctx,frame));
    c.drawImage(img,p.x-p.r,p.y-p.r,p.r*2,p.r*2);
  }
  const {x,y,tilt}=game.seed;
  const pod=art.sprite('canopy-samara',wing,{s:'#514a42',e:'#d6b982',w:'#f4e0a7',d:'#b78b5a',b:'#8e6548',y:'#bf9356',h:'#f0be6a'});
  c.save();c.translate(x+6,y+13);c.rotate(tilt-.2);
  polygon(c,'rgba(76,62,49,.35)',[-13,7,-7,-1,12,-7,28,-13,24,-7,2,4,-6,9]);c.restore();
  c.save();c.translate(x,y);c.rotate(tilt+Math.sin(time*2)*.13-.2);
  c.drawImage(pod,-13,-20,57,26);c.restore();
}
