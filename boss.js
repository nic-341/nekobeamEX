'use strict';
// 16 body frames + 8 arm frames. Fixed-step gameplay is independent of render FPS.
let boss=null,bossReached=false;
const BOSS_TIMES={intro:1.8,idle:1.5,gunTell:.9,gunFire:2.1,eyeTell:1.25,eyeFire:.85,stagger:.65,hatchOpen:.6,hatchDeploy:3.1,hatchClose:.6,defeat:2.4};
function initBoss(){
 boss={x:8380,y:90,w:360,h:350,hp:24,maxHp:24,active:false,dead:false,time:0,phase:'intro',phaseTime:0,turn:0,hatch:0,flash:0,bullets:[],bots:[],debris:[],spawned:0,gunClock:0,nextArm:0,eyeTarget:null,pendingEye:false,
 arms:[{hp:8,maxHp:8,recoil:0,flash:0},{hp:8,maxHp:8,recoil:0,flash:0}],message:'',messageTime:0};
 for(const [x,y,w] of [[7860,385,150],[8030,325,145],[8200,265,155]])platforms.push({x,y,w,h:18,oneWay:true});
 if(bossReached){player.x=7890;player.y=GROUND-player.h;checkpoint=7890;player.inv=2;midpointUnlocked=true;}
}
function bossHead(){return {x:boss.x+110,y:boss.y+18,w:128,h:85};}
function bossArmRect(i){return i===0?{x:boss.x-54,y:boss.y+165,w:145,h:115}:{x:boss.x+186,y:boss.y+161,w:146,h:126};}
function bossMuzzle(i){const r=bossArmRect(i);return {x:r.x+15,y:r.y+r.h*.78};}
function bossEyes(){return [{x:boss.x+105,y:boss.y+122},{x:boss.x+190,y:boss.y+123}];}
function enterBossPhase(phase){
 const b=boss;b.phase=phase;b.phaseTime=0;
 if(phase==='gunFire')b.gunClock=0;
 if(phase==='eyeTell'){b.eyeTarget={x:Math.min(b.x-45,player.x+player.w/2),y:player.y+player.h/2};b.pendingEye=false;}
 if(phase==='eyeFire')playSE('beam');
 if(phase==='hatchDeploy')b.spawned=0;
}
function nextBossPhase(){
 const b=boss;
 switch(b.phase){
 case 'intro':enterBossPhase('idle');break;
 case 'idle':{
 const lost=b.arms.some(a=>a.hp===0),alive=b.arms.some(a=>a.hp>0);
 if(b.pendingEye)enterBossPhase('eyeTell');
 else if(b.turn%3===1)enterBossPhase('hatchOpen');
 else if(lost&&(!alive||b.turn%3===2))enterBossPhase('eyeTell');
 else enterBossPhase(alive?'gunTell':'eyeTell');
 b.turn++;break;}
 case 'gunTell':enterBossPhase(b.arms.some(a=>a.hp>0)?'gunFire':'eyeTell');break;
 case 'gunFire':case 'eyeFire':enterBossPhase('idle');break;
 case 'eyeTell':enterBossPhase('eyeFire');break;
 case 'stagger':enterBossPhase('eyeTell');break;
 case 'hatchOpen':enterBossPhase('hatchDeploy');break;
 case 'hatchDeploy':if(b.bots.every(m=>m.deploy>=1))enterBossPhase('hatchClose');break;
 case 'hatchClose':enterBossPhase('idle');break;
 }
}
function damageBossArm(i){
 const b=boss,a=b.arms[i];if(a.hp<=0)return;a.hp--;a.flash=.15;playSE('hit');
 const r=bossArmRect(i);burst(r.x+30,r.y+60,'#ffc273',6);
 if(a.hp===0){
 b.pendingEye=true;b.message=(i===0?'手前':'奥')+'の腕を破壊！ 目のビームに注意';b.messageTime=3;
 burst(r.x+45,r.y+55,'#ff8c54',24);
 for(let j=0;j<8;j++)b.debris.push({x:r.x+35+j*6,y:r.y+60,vx:-65+j*19,vy:-140-j*12,t:1.7,size:5+j%4});
 if(!b.phase.startsWith('hatch'))enterBossPhase('stagger');
 }
}
function defeatBoss(){
 const b=boss;b.dead=true;b.hp=0;b.bullets=[];b.bots=[];b.eyeTarget=null;b.hatch=0;
 b.message='司令官のロボが停止した！';b.messageTime=3;enterBossPhase('defeat');shots=[];clearKeys();stopSE();playSE('up');
 burst(b.x+175,b.y+150,'#ffe1a3',60);
}
function beamHitsPlayer(origin,target,width){
 const px=player.x+player.w/2,py=player.y+player.h/2;
 const dx=target.x-origin.x,dy=target.y-origin.y,den=dx*dx+dy*dy;
 const t=Math.max(0,Math.min(1,((px-origin.x)*dx+(py-origin.y)*dy)/(den||1)));
 return Math.hypot(px-origin.x-dx*t,py-origin.y-dy*t)<width+Math.min(player.w,player.h)*.42;
}
function bossBeamEnd(origin){
 const target=boss.eyeTarget,dx=target.x-origin.x,dy=target.y-origin.y,len=Math.hypot(dx,dy)||1;
 return {x:origin.x+dx/len*1150,y:origin.y+dy/len*1150};
}
function stepBoss(dt){
 if(stage!==4||!boss||state!=='playing')return;const b=boss;
 if(!b.active){if(player.x<7845)return;b.active=true;bossReached=true;checkpoint=7890;document.querySelector('#game').classList.add('boss-arena');resize();}
 player.x=Math.max(7845,Math.min(b.x-42,player.x));
 b.time+=dt;b.phaseTime+=dt;b.flash=Math.max(0,b.flash-dt);b.messageTime=Math.max(0,b.messageTime-dt);
 for(const a of b.arms){a.recoil=Math.max(0,a.recoil-dt);a.flash=Math.max(0,a.flash-dt);}
 for(const p of b.debris){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=400*dt;p.t-=dt;}b.debris=b.debris.filter(p=>p.t>0);
 if(b.dead){if(b.phaseTime>=BOSS_TIMES.defeat){state='clear';syncMusic();show('ネコ型ロボを撃破！','ネズミ司令官の作戦を阻止！ 機械仕掛けの古城クリア！','もういちど遊ぶ');}return;}
 // Resolve hits before new attacks, so broken guns stop immediately.
 for(const shot of shots){
 if(shot.t<=0)continue;let consumed=false;
 for(const bot of b.bots)if(bot.deploy>=1&&rect(shot,bot)){bot.hp--;shot.t=0;consumed=true;playSE('hit');break;}
 if(consumed)continue;
 if(rect(shot,bossHead())){shot.t=0;b.hp--;b.flash=.13;playSE('hit');burst(shot.x,shot.y,'#c9f4ff',8);if(b.hp===12){b.message='コックピットにひび！ 司令官が焦りはじめた';b.messageTime=3;}continue;}
 for(let i=0;i<2;i++)if(b.arms[i].hp>0&&rect(shot,bossArmRect(i))){shot.t=0;damageBossArm(i);consumed=true;break;}
 // Beams pass the destroyed front gun to reach the rear gun at the same height.
 const armBand=shot.y>=b.y+161&&shot.y<=b.y+288;
 if(!consumed&&!armBand&&rect(shot,{x:b.x+30,y:b.y+105,w:300,h:240})){shot.t=0;burst(shot.x,shot.y,'#90a9bc',3);}
 }
 if(b.hp<=0){defeatBoss();return;}
 if(b.phaseTime>=BOSS_TIMES[b.phase])nextBossPhase();
 b.hatch=b.phase==='hatchOpen'?Math.min(1,b.phaseTime/BOSS_TIMES.hatchOpen):b.phase==='hatchDeploy'?1:b.phase==='hatchClose'?Math.max(0,1-b.phaseTime/BOSS_TIMES.hatchClose):0;
 if(b.phase==='gunFire'){
 b.gunClock-=dt;if(b.gunClock<=0){b.gunClock=.28;
 const available=[0,1].filter(i=>b.arms[i].hp>0),i=available[b.nextArm++%available.length];
 if(i!==undefined){const m=bossMuzzle(i),dx=player.x+19-m.x,dy=player.y+19-m.y,len=Math.hypot(dx,dy)||1;
 b.arms[i].recoil=.23;b.bullets.push({...m,w:10,h:7,vx:dx/len*220,vy:dy/len*220,t:5});playSE('beam');}
 }}
 if(b.phase==='eyeFire'&&b.eyeTarget)for(const origin of bossEyes())if(beamHitsPlayer(origin,bossBeamEnd(origin),6))hit();
 if(b.phase==='hatchDeploy'&&b.spawned<3&&b.phaseTime>=b.spawned*.8){b.spawned++;if(b.bots.length<6)b.bots.push({x:b.x+155,y:b.y+241,w:42,h:36,hp:2,deploy:0});}
 b.bots=b.bots.filter(m=>m.hp>0&&m.x>7780);
 for(const m of b.bots){
 if(m.deploy<1){m.deploy=Math.min(1,m.deploy+dt/1.35);const t=m.deploy;
 m.x=b.x+155-115*Math.max(0,(t-.48)/.52);m.y=b.y+241+(GROUND-m.h-b.y-241)*Math.min(1,t/.78);
 }else{m.x-=80*dt;m.y=GROUND-m.h;if(rect(m,player))hit();}
 }
 for(const p of b.bullets){p.x+=p.vx*dt;p.y+=p.vy*dt;p.t-=dt;if(rect(p,player)){p.t=0;hit();}}
 b.bullets=b.bullets.filter(p=>p.t>0&&p.x>7770&&p.y>0&&p.y<540);
}
function bodyAnimation(){
 const b=boss,cracked=b.hp<=b.maxHp*.5;
 if(b.phase.startsWith('hatch'))return {row:cracked?3:1,frame:Math.min(3,Math.floor(b.hatch*3.999))};
 return {row:cracked?2:0,frame:b.dead?0:Math.floor(b.time*(cracked?12:6))%4};
}
function drawBodyAtlas(){
 const b=boss,im=art.bossBody;if(!im)return;const anim=bodyAnimation(),r=BOSS_ATLAS.body[anim.row*4+anim.frame];
 ctx.drawImage(im,r[0],r[1],r[2],r[3],b.x,b.y,b.w,b.h);
}
function drawArmAtlas(i){
 const b=boss,a=b.arms[i],im=art.bossArms;if(!im)return;
 const frame=a.hp===0?3:a.recoil>.15?2:a.recoil>0?1:0;
 const sw=im.width/4,sh=im.height/2,r=bossArmRect(i),kick=a.hp>0?Math.sin(a.recoil/.23*Math.PI)*4:0;
 ctx.save();if(a.flash>0)ctx.filter='brightness(1.8)';ctx.drawImage(im,frame*sw,i*sh,sw,sh,r.x+kick,r.y-12,r.w,r.h+12);ctx.restore();
 if(a.hp===0)for(let j=0;j<3;j++){const t=(b.time*.55+j/3)%1;ctx.fillStyle=`rgba(89,95,109,${(1-t)*.36})`;ctx.beginPath();ctx.arc(r.x+50+Math.sin(t*7+j)*6,r.y+45-t*45,4+t*10,0,Math.PI*2);ctx.fill();}
}
function drawRobotMouse(m){
 const im=art.robotMouse;if(!im)return;const t=m.deploy,scale=t<1?.35+.65*t:1,w=51*scale,h=45*scale;
 ctx.save();ctx.globalAlpha*=t<1?.45+.55*t:1;ctx.drawImage(im,123,120,1071,1018,m.x+m.w/2-w/2,m.y+m.h-h,w,h);
 if(t>=1){ctx.fillStyle='#151e2780';ctx.fillRect(m.x+3,GROUND-2,m.w-6,2);}ctx.restore();
}
function drawBoss(){
 if(stage!==4||!boss)return;const b=boss;ctx.save();
 if(b.dead)ctx.globalAlpha=Math.max(.25,1-b.phaseTime*.28);
 if(b.flash>0)ctx.filter='brightness(1.6)';drawBodyAtlas();ctx.filter='none';
 drawArmAtlas(0);drawArmAtlas(1);
 for(const m of b.bots)drawRobotMouse(m);
 for(const p of b.debris){ctx.fillStyle='#b4bac1';ctx.fillRect(p.x,p.y,p.size,p.size);}
 for(const p of b.bullets){ctx.fillStyle='#ff6a43';ctx.fillRect(p.x-2,p.y-2,p.w+4,p.h+4);ctx.fillStyle='#fff4ba';ctx.fillRect(p.x,p.y,p.w,p.h);}
 if(b.active&&!b.dead){
 if((b.phase==='eyeTell'||b.phase==='eyeFire')&&b.eyeTarget)for(const o of bossEyes()){
 const end=bossBeamEnd(o);ctx.save();ctx.lineCap='round';
 if(b.phase==='eyeTell'){ctx.strokeStyle='#ff6a6eaa';ctx.lineWidth=2;ctx.setLineDash([9,7]);}
 else{ctx.strokeStyle='#ff194b88';ctx.lineWidth=17;ctx.beginPath();ctx.moveTo(o.x,o.y);ctx.lineTo(end.x,end.y);ctx.stroke();ctx.strokeStyle='#ff5573';ctx.lineWidth=9;}
 ctx.beginPath();ctx.moveTo(o.x,o.y);ctx.lineTo(end.x,end.y);ctx.stroke();
 if(b.phase==='eyeFire'){ctx.strokeStyle='#fff3d3';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(o.x,o.y);ctx.lineTo(end.x,end.y);ctx.stroke();}
 ctx.setLineDash([]);ctx.fillStyle='#fff0a4';ctx.beginPath();ctx.arc(o.x,o.y,b.phase==='eyeFire'?8:3+3*b.phaseTime,0,Math.PI*2);ctx.fill();ctx.restore();
 }
 if(b.phase==='gunTell')for(let i=0;i<2;i++)if(b.arms[i].hp>0){const o=bossMuzzle(i);ctx.strokeStyle='#ffb25e88';ctx.lineWidth=1;ctx.setLineDash([5,7]);ctx.beginPath();ctx.moveTo(o.x,o.y);ctx.lineTo(player.x+19,player.y+19);ctx.stroke();ctx.setLineDash([]);}
 const head=bossHead();ctx.strokeStyle=b.hp<=12?'#ff9c9c':'#fff1ac';ctx.lineWidth=1;ctx.setLineDash([4,5]);ctx.strokeRect(head.x,head.y,head.w,head.h);ctx.setLineDash([]);
 for(let i=0;i<2;i++){const r=bossArmRect(i),a=b.arms[i];ctx.fillStyle='#182130';ctx.fillRect(r.x+22,r.y-5,70,5);ctx.fillStyle=a.hp?'#ffc879':'#68717d';ctx.fillRect(r.x+22,r.y-5,70*a.hp/a.maxHp,5);}
 }
 ctx.restore();
}
function drawBossHUD(w){
 if(stage!==4||!boss||!boss.active)return;const b=boss,width=Math.min(400,w-40),x=(w-width)/2;
 const tips={intro:'M-01 起動 ─ 腕を壊すか、コックピットを狙おう',idle:'足場を登って頭部へ！ 腕もビームで破壊できる',gunTell:'バルカン予告 ─ 弾道から離れよう',gunFire:'バルカン連射！',eyeTell:'目が発光！ 赤い予告線から離れよう',eyeFire:'アイビーム発射！',stagger:'腕が破損！ 目のビームに切り替わる',hatchOpen:'腹部ハッチが開く…',hatchDeploy:'機械ネズミが出撃中！',hatchClose:'出撃完了 ─ ハッチ閉鎖',defeat:'ネズミ司令官のロボが停止した！'};
 ctx.save();ctx.fillStyle='#101b2bef';ctx.fillRect(x-12,49,width+24,77);ctx.textAlign='center';ctx.font='bold 12px sans-serif';ctx.fillStyle='#fff0da';
 ctx.fillText('M-01 ネコ型ロボ / コックピット '+Math.max(0,b.hp)+' / '+b.maxHp,w/2,66);
 ctx.fillStyle='#51323d';ctx.fillRect(x,74,width,7);ctx.fillStyle=b.hp<=12?'#ff6688':'#ff9a74';ctx.fillRect(x,74,width*Math.max(0,b.hp)/b.maxHp,7);
 ctx.font='11px sans-serif';ctx.fillStyle='#f8d797';ctx.fillText('手前の腕 '+(b.arms[0].hp||'破損')+' / 奥の腕 '+(b.arms[1].hp||'破損')+(b.hp<=12?' · ガラス損傷':''),w/2,96);
 ctx.fillStyle='#f0f6fa';ctx.fillText(b.messageTime>0?b.message:tips[b.phase],w/2,114);ctx.restore();
}
function startBossPractice(){stage=4;reset();bossReached=true;player.x=7890;player.y=GROUND-player.h;player.inv=2;checkpoint=7890;midpointUnlocked=true;state='playing';ui.overlay.style.display='none';camera=Math.max(0,Math.min(WORLD-viewW(),player.x-viewW()*.33));syncMusic(true);}
