// Čtečka: kapitola knihy jako HTML stránka s listováním (CSS sloupce) pro WebView.
// Klepnutí vlevo/vpravo = stránka zpět/vpřed, uprostřed = nabídka, tažení prstem = listování,
// podržení prstu na odstavci = originál / překlad odstavce, dvojité klepnutí na slovo = překlad slova.
// Zprávy do aplikace jdou přes window.ReactNativeWebView.postMessage(JSON).
import type { Book, Chapter } from './book';
import { escapeXml, toBase64 } from './bytes';

export type ReaderTheme = 'day' | 'sepia' | 'night';

export interface ReaderPrefs {
  font: 'serif' | 'sans';
  size: number; // px
  line: number; // řádkování, např. 1.5
  margin: number; // px
  theme: ReaderTheme;
  justify: boolean;
  /** animace listování: otočení stránky jako v knize, posun, prolnutí, žádná */
  turn: ReaderTurn;
}

export type ReaderTurn = 'curl' | 'slide' | 'fade' | 'none';
export const TURNS: Record<ReaderTurn, string> = { curl: 'otočení stránky', slide: 'posun', fade: 'prolnutí', none: 'bez animace' };

export const DEFAULT_PREFS: ReaderPrefs = { font: 'serif', size: 19, line: 1.55, margin: 22, theme: 'sepia', justify: true, turn: 'curl' };

export const THEMES: Record<ReaderTheme, { bg: string; fg: string; muted: string; accent: string; name: string }> = {
  day: { bg: '#ffffff', fg: '#1b1b1b', muted: '#6b7280', accent: '#2563eb', name: 'Den' },
  sepia: { bg: '#f5ecd9', fg: '#3b2f20', muted: '#7a6a55', accent: '#8b5a2b', name: 'Sépie' },
  night: { bg: '#121212', fg: '#d6d3cc', muted: '#8b8b8b', accent: '#7aa7ff', name: 'Noc' },
};

/** Kde začít: první stránka, poslední (návrat z další kapitoly) nebo podíl kapitoly 0–1. */
export type StartAt = 'start' | 'end' | number;

/** Zprávy z WebView. */
export type ReaderMessage =
  | { type: 'pos'; page: number; pages: number }
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'menu' }
  | { type: 'para'; i: number; text: string }
  | { type: 'word'; i: number; word: string; text: string };

export function parseReaderMessage(raw: string): ReaderMessage | null {
  try {
    const m = JSON.parse(raw);
    return m && typeof m.type === 'string' ? (m as ReaderMessage) : null;
  } catch {
    return null;
  }
}

function blocksHtml(book: Book, ch: Chapter): string {
  let out = '';
  ch.blocks.forEach((b, i) => {
    if (b.type === 'p') out += `<p data-i="${i}">${escapeXml(b.text).replace(/\n/g, '<br/>')}</p>`;
    else if (b.type === 'h') out += `<h${Math.min(4, Math.max(2, (b.level ?? 2) + 1))} data-i="${i}">${escapeXml(b.text)}</h${Math.min(4, Math.max(2, (b.level ?? 2) + 1))}>`;
    else if (b.type === 'pb') out += '<div class="pb"></div>';
    else if (b.type === 'img') {
      const im = book.images[b.name];
      if (im) out += `<figure><img src="data:${im.mime};base64,${toBase64(im.data)}" alt=""/></figure>`;
    }
  });
  return out;
}

/** HTML jedné kapitoly pro čtečku. */
export function chapterHtml(book: Book, index: number, prefs: ReaderPrefs, start: StartAt = 'start'): string {
  const ch = book.chapters[index];
  const t = THEMES[prefs.theme] ?? THEMES.sepia;
  const family = prefs.font === 'sans' ? 'Roboto, "Noto Sans", sans-serif' : '"Noto Serif", Georgia, serif';
  const cover = index === 0 && book.cover && book.images[book.cover]
    ? `<figure class="cover"><img src="data:${book.images[book.cover].mime};base64,${toBase64(book.images[book.cover].data)}" alt=""/></figure>`
    : '';
  const title = ch ? `<h1>${escapeXml(ch.title)}</h1>` : '';
  const body = ch ? blocksHtml(book, ch) : '<p>Kniha je prázdná.</p>';
  const m = prefs.margin;
  return `<!DOCTYPE html><html lang="${escapeXml(book.language || 'cs')}"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>
<style>
html,body{margin:0;padding:0;height:100%;overflow:hidden;background:${t.bg};color:${t.fg};-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}
.pg{height:100%;box-sizing:border-box;padding:${Math.round(m * 1.4)}px ${m}px;column-width:100vw;column-gap:${m * 2}px;column-fill:auto;
  font-family:${family};font-size:${prefs.size}px;line-height:${prefs.line};will-change:transform}
body{perspective:1700px}
#t{position:fixed;left:0;top:0;width:100vw;height:100vh;overflow:hidden;background:${t.bg};transform-origin:0 50%;display:none;z-index:2;
  backface-visibility:hidden;-webkit-backface-visibility:hidden;box-shadow:0 0 28px rgba(0,0,0,${prefs.theme === 'night' ? '.7' : '.28'})}
#t::after{content:'';position:absolute;inset:0;pointer-events:none;opacity:var(--sh,0);
  background:linear-gradient(to left,rgba(0,0,0,.30),rgba(0,0,0,.06) 22%,rgba(255,255,255,.10) 40%,transparent 60%)}
p{margin:0 0 .35em;text-indent:1.3em;text-align:${prefs.justify ? 'justify' : 'left'};hyphens:auto;-webkit-hyphens:auto;orphans:2;widows:2}
h1{font-size:1.45em;text-align:center;margin:.6em 0 1em;line-height:1.25;break-after:avoid}
h2,h3,h4{font-size:1.15em;margin:1em 0 .5em;line-height:1.3;break-after:avoid}
figure{margin:.6em 0;text-align:center;break-inside:avoid}figure img{max-width:100%;max-height:calc(100vh - ${Math.round(m * 3.2)}px);object-fit:contain}
figure.cover{margin:0;height:calc(100vh - ${Math.round(m * 2.8) + 6}px);display:flex;align-items:center;justify-content:center;break-after:column}
.pb{break-after:column;height:0}
.hl{background:${t.accent}33;border-radius:3px}
</style></head><body><div id="c" class="pg">${cover}${title}${body}</div><div id="t"></div>
<script>
(function(){
  var c=document.getElementById('c'),tw=document.getElementById('t'),page=0,pages=1,W=window.innerWidth,busy=false,clone=null;
  var TURN=${JSON.stringify(prefs.turn ?? 'curl')};
  if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)TURN='none';
  function send(o){try{window.ReactNativeWebView.postMessage(JSON.stringify(o))}catch(e){}}
  function measure(){W=window.innerWidth;var t=c.style.transform;c.style.transform='none';var l=c.lastElementChild,r=l?l.getBoundingClientRect().right:W;
    c.style.transform=t;pages=Math.max(1,Math.floor((r-1)/W)+1);}
  function place(p,ms){c.style.transition=ms?'transform '+ms+'ms ease-out':'none';c.style.transform='translateX('+(-p*W)+'px)';}
  function done(p){page=p;busy=false;send({type:'pos',page:page,pages:pages});}
  // otáčená stránka = kopie textu natočená kolem levého okraje (hřbetu knihy)
  function flip(showPage,angle,ms,cb){if(!clone){clone=c.cloneNode(true);clone.removeAttribute('id');tw.appendChild(clone);}
    clone.style.transition='none';clone.style.transform='translateX('+(-showPage*W)+'px)';tw.style.display='block';
    tw.style.transition=ms?'transform '+ms+'ms cubic-bezier(.3,.6,.4,1)':'none';tw.style.transform='rotateY('+angle+'deg)';
    tw.style.setProperty('--sh',String(Math.min(1,Math.abs(angle)/70)));
    if(cb){var f=function(){tw.removeEventListener('transitionend',f);clearTimeout(tt);cb();};var tt=setTimeout(f,ms+80);tw.addEventListener('transitionend',f);}}
  function hideFlip(){tw.style.display='none';tw.style.transition='none';tw.style.transform='none';}
  function go(p,dir){if(busy||p===page)return;p=Math.max(0,Math.min(pages-1,p));
    if(TURN==='curl'){busy=true;
      if(dir>0){var old=page;place(p);flip(old,0,0);requestAnimationFrame(function(){flip(old,-104,420,function(){hideFlip();done(p);});});}
      else{flip(p,-104,0);requestAnimationFrame(function(){flip(p,0,420,function(){place(p);hideFlip();done(p);});});}}
    else if(TURN==='fade'){busy=true;c.style.transition='opacity .14s';c.style.opacity='0';
      setTimeout(function(){place(p);c.style.transition='opacity .16s';c.style.opacity='1';done(p);},140);}
    else if(TURN==='slide'){place(p,230);done(p);}
    else{place(p);done(p);}}
  function show(p){p=Math.max(0,Math.min(pages-1,p));hideFlip();place(p);done(p);}
  window.readerGo=function(where){measure();
    if(where==='end')show(pages-1);else if(typeof where==='number')show(Math.round(where*(pages-1)));else show(0);};
  function next(){if(busy)return;if(page<pages-1)go(page+1,1);else send({type:'next'});}
  function prev(){if(busy)return;if(page>0)go(page-1,-1);else send({type:'prev'});}
  window.readerNext=next;window.readerPrev=prev;
  // tažení prstem: stránka jde za prstem (otočení nebo posun), po puštění se dotočí nebo vrátí
  var drag=null;
  function dragStart(dx){if(busy||TURN==='fade'||TURN==='none')return null;var dir=dx<0?1:-1,target=page+dir;
    if(target<0||target>pages-1)return null;
    if(TURN==='curl'){if(dir>0){place(target);flip(page,0,0);}else flip(target,-104,0);}
    return {dir:dir,target:target};}
  function dragMove(dx){if(!drag)return;var f=Math.max(0,Math.min(1,Math.abs(dx)/(W*0.85)));
    if(TURN==='curl')flip(drag.dir>0?page:drag.target,drag.dir>0?-104*f:-104*(1-f),0);
    else{c.style.transition='none';c.style.transform='translateX('+(-page*W+dx)+'px)';}}
  function dragEnd(dx,fast){var d=drag;drag=null;if(!d)return false;var ok=Math.abs(dx)>W*0.22||fast;busy=true;
    if(TURN==='curl'){if(d.dir>0){if(ok)flip(page,-104,260,function(){hideFlip();done(d.target);});
        else flip(page,0,220,function(){place(page);hideFlip();done(page);});}
      else{if(ok)flip(d.target,0,260,function(){place(d.target);hideFlip();done(d.target);});
        else flip(d.target,-104,220,function(){hideFlip();done(page);});}}
    else{place(ok?d.target:page,200);setTimeout(function(){done(ok?d.target:page);},200);}
    return true;}
  var sx=0,sy=0,st=0,moved=false,lp=null,lastTap=0;
  function para(el){while(el&&el!==c){if(el.getAttribute&&el.getAttribute('data-i')!==null)return el;el=el.parentNode;}return null;}
  function wordAt(x,y){var r=document.caretRangeFromPoint?document.caretRangeFromPoint(x,y):null;if(!r||!r.startContainer||r.startContainer.nodeType!==3)return '';
    var s=r.startContainer.data,i=r.startOffset,a=i,b=i,re=/[\\p{L}\\p{N}'’-]/u;
    while(a>0&&re.test(s[a-1]))a--;while(b<s.length&&re.test(s[b]))b++;return s.slice(a,b).replace(/^['’-]+|['’-]+$/g,'');}
  document.addEventListener('touchstart',function(e){var t=e.touches[0];sx=t.clientX;sy=t.clientY;st=Date.now();moved=false;
    var target=e.target;clearTimeout(lp);lp=setTimeout(function(){if(moved)return;var p=para(target);
      if(p){moved=true;p.classList.add('hl');setTimeout(function(){p.classList.remove('hl')},600);
        send({type:'para',i:+p.getAttribute('data-i'),text:p.innerText});}},550);},{passive:true});
  document.addEventListener('touchmove',function(e){var t=e.touches[0],dx=t.clientX-sx,dy=t.clientY-sy;
    if(Math.abs(dx)>12||Math.abs(dy)>12){moved=true;clearTimeout(lp);}
    if(!drag&&Math.abs(dx)>14&&Math.abs(dx)>Math.abs(dy)*1.2)drag=dragStart(dx);
    if(drag)dragMove(dx);},{passive:true});
  document.addEventListener('touchend',function(e){clearTimeout(lp);var t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;
    if(drag){dragEnd(dx,Math.abs(dx)>40&&Date.now()-st<250);return;}
    if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)){dx<0?next():prev();return;}
    if(moved||Date.now()-st>500)return;
    var now=Date.now(),x=t.clientX,y=t.clientY;
    if(now-lastTap<320){lastTap=0;clearTimeout(window._tapT);var w=wordAt(x,y),p=para(document.elementFromPoint(x,y));
      if(w)send({type:'word',i:p?+p.getAttribute('data-i'):-1,word:w,text:p?p.innerText:''});return;}
    lastTap=now;clearTimeout(window._tapT);
    window._tapT=setTimeout(function(){if(x<W*0.3)prev();else if(x>W*0.7)next();else send({type:'menu'});},300);});
  document.addEventListener('keydown',function(e){if(e.key==='ArrowRight'||e.key===' ')next();if(e.key==='ArrowLeft')prev();});
  window.addEventListener('resize',function(){var f=pages>1?page/(pages-1):0;measure();if(clone){clone.remove();clone=null;}show(Math.round(f*(pages-1)));});
  function start(){window.readerGo(${JSON.stringify(start)});}
  if(document.readyState==='complete')setTimeout(start,30);else window.addEventListener('load',function(){setTimeout(start,30)});
})();
</script></body></html>`;
}

/** Text odstavce i z kapitoly (pro originál k překladu). */
export function blockText(book: Book | null | undefined, chapter: number, i: number): string {
  const b = book?.chapters[chapter]?.blocks[i];
  return b && (b.type === 'p' || b.type === 'h') ? b.text : '';
}

/** Průběh čtení celé knihy 0–1 (podle počtu znaků v kapitolách). */
export function bookProgress(book: Book, chapter: number, fraction: number): number {
  const sizes = book.chapters.map((c) => c.blocks.reduce((a, b) => a + (b.type === 'p' || b.type === 'h' ? b.text.length : 200), 0) + 50);
  const total = sizes.reduce((a, b) => a + b, 0) || 1;
  const before = sizes.slice(0, chapter).reduce((a, b) => a + b, 0);
  return Math.min(1, (before + (sizes[chapter] ?? 0) * Math.min(1, Math.max(0, fraction))) / total);
}
