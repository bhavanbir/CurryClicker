// pixel-art helpers — eval'd inside run_script. Exposes P (palette) and mk(w,h).
P={ink:'#191c1e',cream:'#fffdf8',or:'#ff8c00',orD:'#c96a00',orL:'#ffb347',
red:'#e0492e',redD:'#a83220',yel:'#f6c453',yelD:'#d99a2b',yelL:'#ffe08a',
grn:'#5f9e42',grnD:'#3f7030',lime:'#9ec24f',teal:'#4fae9e',tealD:'#2f7f72',
brn:'#8a5a2b',brnD:'#5f3d1c',tan:'#d9a066',tanL:'#f0cfa0',
gry:'#b9b4a8',gryD:'#857f72',wht:'#fffdf8',crm:'#f5ead2',
pur:'#8e5aa8',purD:'#5f3a75',pnk:'#e88aa0',blu:'#6fa8c9',bluD:'#3f7291',
slv:'#cfd4d8',slvD:'#98a0a8',gold:'#f2b632',goldD:'#b57f18',
onyx:'#3a3f47',onyxL:'#5a6270',sky:'#bfe3ef',cop:'#c77b3f',copD:'#8f5426'};
mk=function(w,h){
  const c=createCanvas(w,h), x=c.getContext('2d');
  x.imageSmoothingEnabled=false;
  const S={c,x,w,h};
  S.px=(a,b,col)=>{x.fillStyle=col;x.fillRect(a,b,1,1);};
  S.r=(a,b,ww,hh,col)=>{x.fillStyle=col;x.fillRect(a,b,ww,hh);};
  S.disc=(cx,cy,rad,col)=>{x.fillStyle=col;for(let j=-rad;j<=rad;j++)for(let i=-rad;i<=rad;i++)if(i*i+j*j<=rad*rad+rad*0.6)x.fillRect(cx+i,cy+j,1,1);};
  S.ell=(cx,cy,rx,ry,col)=>{x.fillStyle=col;for(let j=-ry;j<=ry;j++)for(let i=-rx;i<=rx;i++)if((i*i)/(rx*rx+0.4)+(j*j)/(ry*ry+0.4)<=1.05)x.fillRect(cx+i,cy+j,1,1);};
  S.line=(x0,y0,x1,y1,col,th)=>{th=th||1;const dx=Math.abs(x1-x0),dy=Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1;let e=dx-dy;for(;;){S.r(x0,y0,th,th,col);if(x0===x1&&y0===y1)break;const e2=2*e;if(e2>-dy){e-=dy;x0+=sx;}if(e2<dx){e+=dx;y0+=sy;}}};
  S.tri=(x0,y0,x1,y1,x2,y2,col)=>{ // filled triangle via scanline
    const minY=Math.min(y0,y1,y2),maxY=Math.max(y0,y1,y2);
    const ix=(ax,ay,bx,by,y)=> by===ay? ax : ax+(bx-ax)*(y-ay)/(by-ay);
    x.fillStyle=col;
    for(let y=minY;y<=maxY;y++){const xs=[];
      if((y>=Math.min(y0,y1)&&y<=Math.max(y0,y1))&&y0!==y1)xs.push(ix(x0,y0,x1,y1,y));
      if((y>=Math.min(y1,y2)&&y<=Math.max(y1,y2))&&y1!==y2)xs.push(ix(x1,y1,x2,y2,y));
      if((y>=Math.min(y0,y2)&&y<=Math.max(y0,y2))&&y0!==y2)xs.push(ix(x0,y0,x2,y2,y));
      if(xs.length<2)continue;const a=Math.round(Math.min(...xs)),b=Math.round(Math.max(...xs));x.fillRect(a,y,b-a+1,1);}
  };
  S.outline=(col)=>{col=col||P.ink;const im=x.getImageData(0,0,w,h),d=im.data;
    const A=(i,j)=> (i>=0&&j>=0&&i<w&&j<h)? d[(j*w+i)*4+3] : 0;
    const m=[];for(let j=0;j<h;j++)for(let i=0;i<w;i++)if(A(i,j)===0&&(A(i+1,j)>0||A(i-1,j)>0||A(i,j+1)>0||A(i,j-1)>0))m.push([i,j]);
    x.fillStyle=col;for(const[i,j]of m)x.fillRect(i,j,1,1);};
  S.blit=(src,dx,dy,scale)=>{scale=scale||1;x.imageSmoothingEnabled=false;x.drawImage(src.c||src,dx,dy,(src.w||src.width)*scale,(src.h||src.height)*scale);};
  S.sparkle=(cx,cy,col)=>{col=col||P.wht;S.px(cx,cy,col);S.px(cx-1,cy,col);S.px(cx+1,cy,col);S.px(cx,cy-1,col);S.px(cx,cy+1,col);};
  return S;
};
// saveSprite: outline + save under folder
saveSprite=async function(folder,id,S,noOutline){ if(!noOutline)S.outline(); await saveFile('sprites/'+folder+'/'+id+'.png',S.c); };
