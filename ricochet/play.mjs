import {boards} from './levels.mjs?v=compact';
import {tuning} from './tuning.mjs';
import {createAdvance} from './advance.mjs';
import {trace, portPoint} from './engine.mjs';

const $ = id => document.getElementById(id);
const letters = 'ABCDE';
const svg = $('board');
const ns = 'http://www.w3.org/2000/svg';
const pad = tuning.boardPadding;
const advance = createAdvance(setTimeout, clearTimeout, setLevel);
document.documentElement.style.setProperty('--main-width', tuning.mainWidth + 'px');
document.documentElement.style.setProperty('--board-width', tuning.boardWidth + 'px');
let level = 0, mask = 0, history = [], busy = false, outcome = '';
const board = () => boards[level];
const firstMessage = 'Choose a launch opening.';
let message = firstMessage;

function element(tag, attrs, parent = svg) {
  const node = document.createElementNS(ns, tag);
  for (const [key,value] of Object.entries(attrs)) node.setAttribute(key,value);
  parent.append(node);
  return node;
}

function line(a,b,stroke,width,extra={}) {
  return element('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke,'stroke-width':width,'stroke-linecap':'round',...extra});
}

function draw() {
  const {size,pieces,ports,finish} = board();
  svg.replaceChildren();
  svg.classList.toggle('busy',busy);
  svg.setAttribute('viewBox',[-pad,-pad,size+2*pad,size+2*pad].join(' '));
  element('rect',{x:0,y:0,width:size,height:size,fill:'#10191d',rx:.1});
  for(let t=1;t<size;t++){
    line([t,0],[t,size],'#26363b',.014);
    line([0,t],[size,t],'#26363b',.014);
  }
  for (let side=0;side<4;side++) {
    const opens = [...ports,finish].filter(p=>p[0]===side).map(p=>p[1]+.5).sort((a,b)=>a-b);
    const point=t=>[[t,0],[size,t],[t,size],[0,t]][side];
    let start=0;
    for(const end of opens){
      line(point(start),point(end-.31),'#779298',.055);
      start=end+.31;
    }
    line(point(start),point(size),'#779298',.055);
  }
  pieces.forEach(([x,y,t,g])=>{
    const a=x+.5,b=y+.5;
    if(t===2){
      element('rect',{x:a-.18,y:b-.18,width:.36,height:.36,rx:.06,fill:'#432c40',stroke:'#d4a6cb','stroke-width':.045});
      line([a-.085,b],[a+.085,b],'#d4a6cb',.035);
      line([a,b-.085],[a,b+.085],'#d4a6cb',.035);
    } else {
      const rising=(t ^ (g===undefined?0:(mask>>g)&1))===0;
      const halfLength=g===undefined?tuning.mirrorHalfLength:tuning.gateHalfLength;
      const v=rising?halfLength:-halfLength;
      const color=g===undefined?'#8bc7eb':'#ffc577';
      line([a-halfLength,b+v],[a+halfLength,b-v],color,.077);
      if(g!==undefined) element('circle',{cx:a,cy:b,r:.083,fill:'#1b2425',stroke:color,'stroke-width':.026});
    }
  });
  for(const [i,p] of [...ports,finish].entries()){
    const end=i===ports.length, [x,y]=portPoint(size,p);
    const [ox,oy]=[[0,-1],[1,0],[0,1],[-1,0]][p[0]];
    const c=end?'#8ee6b6':'#d1e8ee';
    if(end) line([x-oy*.27,y-ox*.27],[x+oy*.27,y+ox*.27],c,.055,{'stroke-dasharray':'.07 .085'});
    const g=element('g',{class:end?'finish-port':'entry'});
    element('circle',{cx:x+ox*.28,cy:y+oy*.28,r:.19,fill:end?'#8ee6b6':'#273c43',stroke:c,'stroke-width':.027},g);
    element('text',{x:x+ox*.28,y:y+oy*.28+.008,fill:end?'#10231a':c,'text-anchor':'middle','dominant-baseline':'middle','font-size':.21,'font-weight':800},g).textContent=end?'✓':letters[i];
    if(!end) {
      element('circle',{cx:x+ox*.18,cy:y+oy*.18,r:.36,fill:'transparent'},g);
      g.addEventListener('click',()=>launch(i));
    }
  }
}

function ball(point) {
  element('circle',{cx:point[0],cy:point[1],r:board().size*tuning.ballRadius,fill:'#fff',stroke:'#d4ffff','stroke-width':.018,id:'ball'});
}

function ui() {
  const remaining=board().balls-history.length-Number(busy);
  $('balls').textContent=remaining;
  $('pips').replaceChildren(...Array.from({length:board().balls},(_,i)=>Object.assign(document.createElement('span'),{className:i<remaining?'live':''})));
  $('message').textContent=message;
  $('message').className=outcome;
  $('history').replaceChildren(...history.map(shot=>Object.assign(document.createElement('span'),{textContent:letters[shot.launch]+(shot.status==='finish'?' → ✓':' → '+letters[shot.slot])})));
  for(const button of $('launches').children) button.disabled=busy||!!outcome;
  $('undo').disabled=busy||!history.length;
  $('reset').disabled=busy;
  $('level').disabled=busy;
  $('next').hidden=outcome!=='win'||level===boards.length-1;
}

function setLevel(index) {
  if(busy)return;
  advance.clear();
  level=index;
  $('level').value=String(index);
  mask=0;history=[];outcome='';message=firstMessage;
  $('launches').replaceChildren(...board().ports.map((_,i)=>{
    const button=Object.assign(document.createElement('button'),{textContent:'Launch '+letters[i]});
    button.addEventListener('click',()=>launch(i));
    return button;
  }));
  draw();ui();
}

function launch(index) {
  if(busy||outcome||index>=board().ports.length)return;
  const before=mask, shot=trace(board(),mask,index), steps=shot.steps;
  busy=true;message='Ball in play…';draw();ui();
  const lengths=steps.slice(1).map((s,i)=>Math.hypot(s.point[0]-steps[i].point[0],s.point[1]-steps[i].point[1]));
  let start, segment=0, spent=0;
  const speed=board().size*tuning.speed;
  function frame(now) {
    start??=now;
    const distance=(now-start)*speed/1000;
    while(segment<lengths.length && distance>=spent+lengths[segment]){
      spent+=lengths[segment++];
      if(mask!==steps[segment].mask){mask=steps[segment].mask;draw();}
    }
    if(segment===lengths.length) {
      busy=false;mask=shot.mask;
      history.push({...shot,before,launch:index});
      if(shot.status==='finish'){
        const finalLevel=level===boards.length-1;
        outcome='win';message=finalLevel?'Circuit complete.':'Level complete.';
        if(!finalLevel) advance.queue(level+1);
      } else if(history.length===board().balls) {
        outcome='fail';message='Out of balls. Undo a shot or reset.';
      } else message='Exited through '+letters[shot.slot]+'. Choose your next opening.';
      draw();ui();
      return;
    }
    svg.querySelector('#ball')?.remove();
    const portion=(distance-spent)/lengths[segment];
    ball(steps[segment].point.map((value,axis)=>value+(steps[segment+1].point[axis]-value)*portion));
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

$('level').replaceChildren(...boards.map((_,i)=>new Option(String(i+1),String(i))));
$('undo').onclick=()=>{if(busy||!history.length)return;advance.clear();mask=history.pop().before;outcome='';message='Shot undone.';draw();ui();};
$('reset').onclick=()=>setLevel(level);
$('next').onclick=()=>setLevel(level+1);
$('level').onchange=e=>setLevel(Number(e.target.value));
document.addEventListener('keydown',e=>{
  if(e.repeat||e.altKey||e.ctrlKey||e.metaKey||e.target.tagName==='SELECT')return;
  const key=e.key.toUpperCase();
  if(key==='R')setLevel(level);
  if(key.length===1&&letters.includes(key))launch(letters.indexOf(key));
});
setLevel(0);
