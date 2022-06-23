var app=function(){"use strict";function t(){}function e(t,e){for(const n in e)t[n]=e[n];return t}function n(t){return t()}function s(){return Object.create(null)}function i(t){t.forEach(n)}function l(t){return"function"==typeof t}function o(t,e){return t!=t?e==e:t!==e||t&&"object"==typeof t||"function"==typeof t}function r(t){const e={};for(const n in t)"$"!==n[0]&&(e[n]=t[n]);return e}function c(t){return null==t?"":t}function a(t,e){t.appendChild(e)}function u(t,e,n){t.insertBefore(e,n||null)}function d(t){t.parentNode.removeChild(t)}function f(t,e){for(let n=0;n<t.length;n+=1)t[n]&&t[n].d(e)}function h(t){return document.createElement(t)}function p(t){return document.createTextNode(t)}function g(){return p(" ")}function m(t,e,n,s){return t.addEventListener(e,n,s),()=>t.removeEventListener(e,n,s)}function v(t,e,n){null==n?t.removeAttribute(e):t.getAttribute(e)!==n&&t.setAttribute(e,n)}function $(t,e){e=""+e,t.wholeText!==e&&(t.data=e)}function b(t,e){t.value=null==e?"":e}function x(t,e,n,s){null===n?t.style.removeProperty(e):t.style.setProperty(e,n,s?"important":"")}function w(t,e,n){t.classList[n?"add":"remove"](e)}let y;function k(t){y=t}function z(t,e){const n=t.$$.callbacks[e.type];n&&n.slice().forEach((t=>t.call(this,e)))}const _=[],P=[],C=[],q=[],E=Promise.resolve();let T=!1;function M(t){C.push(t)}function N(t){q.push(t)}const A=new Set;let R=0;function S(){const t=y;do{for(;R<_.length;){const t=_[R];R++,k(t),F(t.$$)}for(k(null),_.length=0,R=0;P.length;)P.pop()();for(let t=0;t<C.length;t+=1){const e=C[t];A.has(e)||(A.add(e),e())}C.length=0}while(_.length);for(;q.length;)q.pop()();T=!1,A.clear(),k(t)}function F(t){if(null!==t.fragment){t.update(),i(t.before_update);const e=t.dirty;t.dirty=[-1],t.fragment&&t.fragment.p(t.ctx,e),t.after_update.forEach(M)}}const I=new Set;let L;function j(t,e){t&&t.i&&(I.delete(t),t.i(e))}function O(t,e,n,s){if(t&&t.o){if(I.has(t))return;I.add(t),L.c.push((()=>{I.delete(t),s&&(n&&t.d(1),s())})),t.o(e)}}function B(t,e){t.d(1),e.delete(t.key)}function G(t,e,n){const s=t.$$.props[e];void 0!==s&&(t.$$.bound[s]=n,n(t.$$.ctx[s]))}function H(t){t&&t.c()}function W(t,e,s,o){const{fragment:r,on_mount:c,on_destroy:a,after_update:u}=t.$$;r&&r.m(e,s),o||M((()=>{const e=c.map(n).filter(l);a?a.push(...e):i(e),t.$$.on_mount=[]})),u.forEach(M)}function V(t,e){const n=t.$$;null!==n.fragment&&(i(n.on_destroy),n.fragment&&n.fragment.d(e),n.on_destroy=n.fragment=null,n.ctx=[])}function D(t,e){-1===t.$$.dirty[0]&&(_.push(t),T||(T=!0,E.then(S)),t.$$.dirty.fill(0)),t.$$.dirty[e/31|0]|=1<<e%31}function X(e,n,l,o,r,c,a,u=[-1]){const f=y;k(e);const h=e.$$={fragment:null,ctx:null,props:c,update:t,not_equal:r,bound:s(),on_mount:[],on_destroy:[],on_disconnect:[],before_update:[],after_update:[],context:new Map(n.context||(f?f.$$.context:[])),callbacks:s(),dirty:u,skip_bound:!1,root:n.target||f.$$.root};a&&a(h.root);let p=!1;if(h.ctx=l?l(e,n.props||{},((t,n,...s)=>{const i=s.length?s[0]:n;return h.ctx&&r(h.ctx[t],h.ctx[t]=i)&&(!h.skip_bound&&h.bound[t]&&h.bound[t](i),p&&D(e,t)),n})):[],h.update(),p=!0,i(h.before_update),h.fragment=!!o&&o(h.ctx),n.target){if(n.hydrate){const t=function(t){return Array.from(t.childNodes)}(n.target);h.fragment&&h.fragment.l(t),t.forEach(d)}else h.fragment&&h.fragment.c();n.intro&&j(e.$$.fragment),W(e,n.target,n.anchor,n.customElement),S()}k(f)}class J{$destroy(){V(this,1),this.$destroy=t}$on(t,e){const n=this.$$.callbacks[t]||(this.$$.callbacks[t]=[]);return n.push(e),()=>{const t=n.indexOf(e);-1!==t&&n.splice(t,1)}}$set(t){var e;this.$$set&&(e=t,0!==Object.keys(e).length)&&(this.$$.skip_bound=!0,this.$$set(t),this.$$.skip_bound=!1)}}function K(e){let n,s,i,l,o,r;return{c(){n=h("button"),s=p("↺"),v(n,"class",i=c(e[0].class)+" svelte-15ulq7z"),v(n,"style",l=e[0].style)},m(t,i){u(t,n,i),a(n,s),o||(r=m(n,"click",e[1]),o=!0)},p(t,[e]){1&e&&i!==(i=c(t[0].class)+" svelte-15ulq7z")&&v(n,"class",i),1&e&&l!==(l=t[0].style)&&v(n,"style",l)},i:t,o:t,d(t){t&&d(n),o=!1,r()}}}function Q(t,n,s){return t.$$set=t=>{s(0,n=e(e({},n),r(t)))},[n=r(n),function(e){z.call(this,t,e)}]}class U extends J{constructor(t){super(),X(this,t,Q,K,o,{})}}function Y(t){let e,n,s,i,l,o,r,c,f,x;return r=new U({}),r.$on("click",t[5]),{c(){e=h("div"),n=h("input"),s=g(),i=h("label"),l=p(t[2]),o=g(),H(r.$$.fragment),v(n,"id",t[1]),v(n,"type","color"),v(n,"class","color-picker svelte-8249i9"),v(i,"for",t[1]),v(i,"class","svelte-8249i9"),v(e,"class","color-settings svelte-8249i9")},m(d,h){u(d,e,h),a(e,n),b(n,t[0]),a(e,s),a(e,i),a(i,l),a(e,o),W(r,e,null),c=!0,f||(x=m(n,"input",t[4]),f=!0)},p(t,[e]){(!c||2&e)&&v(n,"id",t[1]),1&e&&b(n,t[0]),(!c||4&e)&&$(l,t[2]),(!c||2&e)&&v(i,"for",t[1])},i(t){c||(j(r.$$.fragment,t),c=!0)},o(t){O(r.$$.fragment,t),c=!1},d(t){t&&d(e),V(r),f=!1,x()}}}function Z(t,e,n){let{color:s}=e;const i=s;let{id:l}=e,{text:o}=e;return t.$$set=t=>{"color"in t&&n(0,s=t.color),"id"in t&&n(1,l=t.id),"text"in t&&n(2,o=t.text)},[s,l,o,i,function(){s=this.value,n(0,s)},()=>n(0,s=i)]}class tt extends J{constructor(t){super(),X(this,t,Z,Y,o,{color:0,id:1,text:2})}}function et(e){let n,s,l,o,r,c,f,x,w,y;return{c(){n=h("div"),s=h("span"),l=p(e[1]),o=g(),r=h("input"),c=g(),f=h("span"),x=p(e[2]),v(r,"type","range"),v(r,"min",e[1]),v(r,"max",e[2]),v(r,"step",e[3]),v(r,"class","svelte-3frgtn"),v(n,"class","slider svelte-3frgtn")},m(t,i){u(t,n,i),a(n,s),a(s,l),a(n,o),a(n,r),b(r,e[0]),a(n,c),a(n,f),a(f,x),w||(y=[m(r,"change",e[6]),m(r,"input",e[6]),m(r,"input",e[4]),m(r,"change",e[5])],w=!0)},p(t,[e]){2&e&&$(l,t[1]),2&e&&v(r,"min",t[1]),4&e&&v(r,"max",t[2]),8&e&&v(r,"step",t[3]),1&e&&b(r,t[0]),4&e&&$(x,t[2])},i:t,o:t,d(t){t&&d(n),w=!1,i(y)}}}function nt(t,e,n){let{value:s}=e,{min:i}=e,{max:l}=e,{step:o=1}=e;return t.$$set=t=>{"value"in t&&n(0,s=t.value),"min"in t&&n(1,i=t.min),"max"in t&&n(2,l=t.max),"step"in t&&n(3,o=t.step)},[s,i,l,o,function(e){z.call(this,t,e)},function(e){z.call(this,t,e)},function(){s=function(t){return""===t?null:+t}(this.value),n(0,s)}]}class st extends J{constructor(t){super(),X(this,t,nt,et,o,{value:0,min:1,max:2,step:3})}}class it{function=null;#t=!1;set#e(t){this.#t!==t&&(this.#t=t,this.onPauseChange?.call(this,t))}get isPaused(){return this.#t}speed=300;#n=!1;onPauseChange;onFinished;#s(){!1===this.#t&&null!=this.function&&(this.#n=!0,setTimeout((()=>{this.#n=!1,this.#s()}),this.speed),this.#i())}#i(){const t=this.function?.next();t?.done&&(this.function=null,this.onFinished?.call())}start(){!1===this.#n&&(this.#e=!1,this.#s())}stop(){this.#e=!0}step(){this.#e=!0,this.#i()}instant(){let t=!1;for(;!1===t;){if(null==this.function)return;t=this.function.next().done}this.onFinished?.call()}}class lt extends Array{constructor(t){super();for(let e=0;e<t;e++){const n=new Array(t);for(let s=0;s<t;s++)n[s]=new ot(e,s);this.push(n)}}isCellValid(t,e){return!(t>this.length-1||t<0)&&(!(e>this[t].length-1||e<0)&&!0!==this[t][e].visited)}}class ot{active=!1;visited=!1;finished=!1;walls={up:!0,down:!0,left:!0,right:!0};coordinates;constructor(t,e){this.coordinates={x:t,y:e}}}const rt={colors:{start:"#94b5c9","väg":"#ffffff","färdig":"#89e66f",aktiv:"#dd0069","väggar":"#000000"},speed:150,size:10};class ct{constructor(t,e,n){this.name=t,this.coordinates={x:e,y:n}}}const at=new class extends Array{constructor(){super(),this.push(new ct("up",0,-1)),this.push(new ct("down",0,1)),this.push(new ct("left",-1,0)),this.push(new ct("right",1,0))}opposite(t){const{x:e,y:n}=t.coordinates,s=-1*e,i=-1*n,l=this.find((t=>t.coordinates.x===s&&t.coordinates.y===i));return l}getRandomized(){return this.#l([...this])}#l(t){for(let e=t.length-1;e>0;e--){const n=Math.floor(Math.random()*(e+1));[t[e],t[n]]=[t[n],t[e]]}return t}};function ut(e){let n,s,i;return{c(){n=h("h1"),n.textContent="Randomized depth-first search / recursive backtracker",s=g(),i=h("details"),i.innerHTML='<summary class="svelte-1fxrib7">Beskrivning från Wikipedia</summary> \n\n    <div class="content svelte-1fxrib7">The depth-first search algorithm of maze generation is frequently implemented using backtracking. This can be described with a following recursive routine:\n        <ol><li>Given a current cell as a parameter,</li> \n            <li>Mark the current cell as visited</li> \n            <li>While the current cell has any unvisited neighbour cells\n                <ol><li>Choose one of the unvisited neighbours</li> \n                    <li>Remove the wall between the current cell and the chosen cell</li> \n                    <li>Invoke the routine recursively for a chosen cell</li></ol></li></ol> \n        which is invoked once for any initial cell in the area. \n        <br/> \n        <a href="https://en.wikipedia.org/wiki/Maze_generation_algorithm#Randomized_depth-first_search" target="_blank" rel="noopener noreferrer">Wikipedia</a></div>',v(n,"class","svelte-1fxrib7"),v(i,"class","svelte-1fxrib7")},m(t,e){u(t,n,e),u(t,s,e),u(t,i,e)},p:t,i:t,o:t,d(t){t&&d(n),t&&d(s),t&&d(i)}}}class dt extends J{constructor(t){super(),X(this,t,null,ut,o,{})}}function ft(e){let n,s,l,o,r,c,f,p,$,b,w,y;return{c(){n=h("div"),s=h("button"),l=h("span"),l.textContent="⋏",r=g(),c=h("input"),f=g(),p=h("button"),$=h("span"),$.textContent="⋎",v(l,"class","svelte-1hg5mi7"),s.disabled=o=e[0]>=e[2],v(s,"class","svelte-1hg5mi7"),v(c,"type","text"),v(c,"inputmode","numeric"),c.value=e[0],v(c,"min",e[1]),v(c,"max",e[2]),v(c,"step",e[3]),v(c,"class","svelte-1hg5mi7"),x(c,"width",e[4],!1),v($,"class","svelte-1hg5mi7"),p.disabled=b=e[0]<=e[1],v(p,"class","svelte-1hg5mi7"),v(n,"class","input-box-number svelte-1hg5mi7")},m(t,i){u(t,n,i),a(n,s),a(s,l),a(n,r),a(n,c),e[10](c),a(n,f),a(n,p),a(p,$),w||(y=[m(s,"mousedown",e[9]),m(s,"mouseup",e[8]),m(s,"mouseleave",e[8]),m(c,"change",e[11]),m(p,"mousedown",e[12]),m(p,"mouseup",e[8]),m(p,"mouseleave",e[8])],w=!0)},p(t,[e]){5&e&&o!==(o=t[0]>=t[2])&&(s.disabled=o),1&e&&c.value!==t[0]&&(c.value=t[0]),2&e&&v(c,"min",t[1]),4&e&&v(c,"max",t[2]),8&e&&v(c,"step",t[3]),16&e&&x(c,"width",t[4],!1),3&e&&b!==(b=t[0]<=t[1])&&(p.disabled=b)},i:t,o:t,d(t){t&&d(n),e[10](null),w=!1,i(y)}}}function ht(t,e,n){let s,i,{value:l}=e,{min:o=Number.MIN_SAFE_INTEGER}=e,{max:r=Number.MAX_SAFE_INTEGER}=e,{step:c=1}=e,{width:a="5ch"}=e;function u(t){var e;t=Number(t),Number.isNaN(t)||(t=function(t){return t>r?r:t<o?o:t}(t=(e=t)-e%c),n(0,l=t)),n(5,s.value=l,s)}const d=3,f=50,h=400;function p(t,e=h){u(l+t);let n=e/d;n<f&&(n=f),i=setTimeout((()=>p(t,n)),e)}return t.$$set=t=>{"value"in t&&n(0,l=t.value),"min"in t&&n(1,o=t.min),"max"in t&&n(2,r=t.max),"step"in t&&n(3,c=t.step),"width"in t&&n(4,a=t.width)},[l,o,r,c,a,s,u,p,function(){clearInterval(i)},()=>p(c),function(t){P[t?"unshift":"push"]((()=>{s=t,n(5,s)}))},t=>u(t.target.value),()=>p(-c)]}class pt extends J{constructor(t){super(),X(this,t,ht,ft,o,{value:0,min:1,max:2,step:3,width:4})}}function gt(t,e,n){const s=t.slice();return s[13]=e[n][0],s[14]=e,s[15]=n,s}function mt(t){let e,n,s;function i(e){t[12](e,t[13])}let l={id:`color-${t[13]}`,text:t[13]};return void 0!==t[2][t[13]]&&(l.color=t[2][t[13]]),e=new tt({props:l}),P.push((()=>G(e,"color",i))),{c(){H(e.$$.fragment)},m(t,n){W(e,t,n),s=!0},p(s,i){t=s;const l={};4&i&&(l.id=`color-${t[13]}`),4&i&&(l.text=t[13]),!n&&4&i&&(n=!0,l.color=t[2][t[13]],N((()=>n=!1))),e.$set(l)},i(t){s||(j(e.$$.fragment,t),s=!0)},o(t){O(e.$$.fragment,t),s=!1},d(t){V(e,t)}}}function vt(t){let e,n,s,l,o,r,c,b,x,y,k,z,_,C,q,E,T,M,A,R,S,F,I,B,D,X,J,K,Q,Y,Z,tt,et,nt,it,lt,ot,rt,ct,at,ut,dt,ft,ht;function vt(e){t[6](e)}let $t={min:t[4].size.min,max:t[4].size.max,step:1,width:"3ch"};function bt(e){t[8](e)}void 0!==t[0]&&($t.value=t[0]),z=new pt({props:$t}),P.push((()=>G(z,"value",vt))),A=new U({}),A.$on("click",t[7]);let xt={min:t[4].size.min,max:t[4].size.max,step:"1"};function wt(e){t[9](e)}void 0!==t[0]&&(xt.value=t[0]),S=new st({props:xt}),P.push((()=>G(S,"value",bt)));let yt={min:t[4].speed.min,max:t[4].speed.max,step:1,width:"4ch"};function kt(e){t[11](e)}void 0!==t[1]&&(yt.value=t[1]),Q=new pt({props:yt}),P.push((()=>G(Q,"value",wt))),nt=new U({}),nt.$on("click",t[10]);let zt={min:t[4].speed.min,max:t[4].speed.max,step:1};void 0!==t[1]&&(zt.value=t[1]),lt=new st({props:zt}),P.push((()=>G(lt,"value",kt)));let _t=Object.entries(t[2]),Pt=[];for(let e=0;e<_t.length;e+=1)Pt[e]=mt(gt(t,_t,e));const Ct=t=>O(Pt[t],1,1,(()=>{Pt[t]=null}));return{c(){e=h("div"),n=h("button"),n.innerHTML='<span class="svelte-g5gs1z">⏵</span>',s=g(),l=h("div"),o=h("h2"),o.textContent="Inställningar",r=g(),c=h("div"),b=h("div"),x=h("h3"),x.textContent="Storlek:",y=g(),k=h("div"),H(z.$$.fragment),C=g(),q=h("span"),E=p("x "),T=p(t[0]),M=g(),H(A.$$.fragment),R=g(),H(S.$$.fragment),I=g(),B=h("div"),D=h("div"),X=h("h3"),X.textContent="Hastighet:",J=g(),K=h("div"),H(Q.$$.fragment),Z=g(),tt=h("span"),tt.textContent="ms",et=g(),H(nt.$$.fragment),it=g(),H(lt.$$.fragment),rt=g(),ct=h("div"),at=h("h3"),at.textContent="Färger",ut=g();for(let t=0;t<Pt.length;t+=1)Pt[t].c();v(n,"id","open-settings"),v(n,"class","svelte-g5gs1z"),w(n,"closed",t[3]),v(q,"class","svelte-g5gs1z"),v(k,"class","input__box-container svelte-g5gs1z"),v(b,"class","slider-header svelte-g5gs1z"),v(c,"class","group svelte-g5gs1z"),v(tt,"class","svelte-g5gs1z"),v(K,"class","input__box-container svelte-g5gs1z"),v(D,"class","slider-header svelte-g5gs1z"),v(B,"class","group svelte-g5gs1z"),v(at,"class","color-title svelte-g5gs1z"),v(ct,"id","color-settings"),v(ct,"class","group svelte-g5gs1z"),v(l,"class","expandable svelte-g5gs1z"),w(l,"closed",t[3]),v(e,"id","settings"),v(e,"class","svelte-g5gs1z")},m(i,d){u(i,e,d),a(e,n),a(e,s),a(e,l),a(l,o),a(l,r),a(l,c),a(c,b),a(b,x),a(b,y),a(b,k),W(z,k,null),a(k,C),a(k,q),a(q,E),a(q,T),a(b,M),W(A,b,null),a(c,R),W(S,c,null),a(l,I),a(l,B),a(B,D),a(D,X),a(D,J),a(D,K),W(Q,K,null),a(K,Z),a(K,tt),a(D,et),W(nt,D,null),a(B,it),W(lt,B,null),a(l,rt),a(l,ct),a(ct,at),a(ct,ut);for(let t=0;t<Pt.length;t+=1)Pt[t].m(ct,null);var f;dt=!0,ft||(ht=m(n,"click",(f=t[5],function(t){return t.preventDefault(),f.call(this,t)})),ft=!0)},p(t,[e]){8&e&&w(n,"closed",t[3]);const s={};!_&&1&e&&(_=!0,s.value=t[0],N((()=>_=!1))),z.$set(s),(!dt||1&e)&&$(T,t[0]);const o={};!F&&1&e&&(F=!0,o.value=t[0],N((()=>F=!1))),S.$set(o);const r={};!Y&&2&e&&(Y=!0,r.value=t[1],N((()=>Y=!1))),Q.$set(r);const c={};if(!ot&&2&e&&(ot=!0,c.value=t[1],N((()=>ot=!1))),lt.$set(c),4&e){let n;for(_t=Object.entries(t[2]),n=0;n<_t.length;n+=1){const s=gt(t,_t,n);Pt[n]?(Pt[n].p(s,e),j(Pt[n],1)):(Pt[n]=mt(s),Pt[n].c(),j(Pt[n],1),Pt[n].m(ct,null))}for(L={r:0,c:[],p:L},n=_t.length;n<Pt.length;n+=1)Ct(n);L.r||i(L.c),L=L.p}8&e&&w(l,"closed",t[3])},i(t){if(!dt){j(z.$$.fragment,t),j(A.$$.fragment,t),j(S.$$.fragment,t),j(Q.$$.fragment,t),j(nt.$$.fragment,t),j(lt.$$.fragment,t);for(let t=0;t<_t.length;t+=1)j(Pt[t]);dt=!0}},o(t){O(z.$$.fragment,t),O(A.$$.fragment,t),O(S.$$.fragment,t),O(Q.$$.fragment,t),O(nt.$$.fragment,t),O(lt.$$.fragment,t),Pt=Pt.filter(Boolean);for(let t=0;t<Pt.length;t+=1)O(Pt[t]);dt=!1},d(t){t&&d(e),V(z),V(A),V(S),V(Q),V(nt),V(lt),f(Pt,t),ft=!1,ht()}}}function $t(t,e,n){let{size:s=rt.size}=e,{speed:i=rt.speed}=e,{colors:l=rt.colors}=e,{closed:o=!1}=e;const r={size:{value:s,min:5,max:20},speed:{value:i,min:10,max:1e3}};return t.$$set=t=>{"size"in t&&n(0,s=t.size),"speed"in t&&n(1,i=t.speed),"colors"in t&&n(2,l=t.colors),"closed"in t&&n(3,o=t.closed)},[s,i,l,o,r,()=>n(3,o=!o),function(t){s=t,n(0,s)},()=>n(0,s=r.size.value),function(t){s=t,n(0,s)},function(t){i=t,n(1,i)},()=>n(1,i=r.speed.value),function(t){i=t,n(1,i)},function(e,s){t.$$.not_equal(l[s],e)&&(l[s]=e,n(2,l))}]}class bt extends J{constructor(t){super(),X(this,t,$t,vt,o,{size:0,speed:1,colors:2,closed:3})}}function xt(t,e,n){const s=t.slice();return s[20]=e[n],s[22]=n,s}function wt(t,e,n){const s=t.slice();return s[23]=e[n],s[25]=n,s}function yt(t,e){let n,s,i;function l(){return e[15](e[25],e[22])}return{key:t,first:null,c(){n=h("td"),v(n,"class","svelte-73bqpl"),x(n,"background-color",e[3][e[25]][e[22]].finished?e[2].färdig:e[3][e[25]][e[22]].active?e[2].aktiv:e[3][e[25]][e[22]].visited?e[2].väg:e[2].start,!1),x(n,"border-color",e[2].väggar,!1),x(n,"border-top-width",e[3][e[25]][e[22]].walls.up?"1px":0,!1),x(n,"border-bottom-width",e[3][e[25]][e[22]].walls.down?"1px":0,!1),x(n,"border-left-width",e[3][e[25]][e[22]].walls.left?"1px":0,!1),x(n,"border-right-width",e[3][e[25]][e[22]].walls.right?"1px":0,!1),this.first=n},m(t,e){u(t,n,e),s||(i=m(n,"click",l),s=!0)},p(t,s){e=t,12&s&&x(n,"background-color",e[3][e[25]][e[22]].finished?e[2].färdig:e[3][e[25]][e[22]].active?e[2].aktiv:e[3][e[25]][e[22]].visited?e[2].väg:e[2].start,!1),4&s&&x(n,"border-color",e[2].väggar,!1),8&s&&x(n,"border-top-width",e[3][e[25]][e[22]].walls.up?"1px":0,!1),8&s&&x(n,"border-bottom-width",e[3][e[25]][e[22]].walls.down?"1px":0,!1),8&s&&x(n,"border-left-width",e[3][e[25]][e[22]].walls.left?"1px":0,!1),8&s&&x(n,"border-right-width",e[3][e[25]][e[22]].walls.right?"1px":0,!1)},d(t){t&&d(n),s=!1,i()}}}function kt(t){let e,n,s=[],i=new Map,l=t[20];const o=t=>t[25]+","+t[22];for(let e=0;e<l.length;e+=1){let n=wt(t,l,e),r=o(n);i.set(r,s[e]=yt(r,n))}return{c(){e=h("tr");for(let t=0;t<s.length;t+=1)s[t].c();n=g()},m(t,i){u(t,e,i);for(let t=0;t<s.length;t+=1)s[t].m(e,null);a(e,n)},p(t,r){524&r&&(l=t[20],s=function(t,e,n,s,i,l,o,r,c,a,u,d){let f=t.length,h=l.length,p=f;const g={};for(;p--;)g[t[p].key]=p;const m=[],v=new Map,$=new Map;for(p=h;p--;){const t=d(i,l,p),r=n(t);let c=o.get(r);c?s&&c.p(t,e):(c=a(r,t),c.c()),v.set(r,m[p]=c),r in g&&$.set(r,Math.abs(p-g[r]))}const b=new Set,x=new Set;function w(t){j(t,1),t.m(r,u),o.set(t.key,t),u=t.first,h--}for(;f&&h;){const e=m[h-1],n=t[f-1],s=e.key,i=n.key;e===n?(u=e.first,f--,h--):v.has(i)?!o.has(s)||b.has(s)?w(e):x.has(i)?f--:$.get(s)>$.get(i)?(x.add(s),w(e)):(b.add(i),f--):(c(n,o),f--)}for(;f--;){const e=t[f];v.has(e.key)||c(e,o)}for(;h;)w(m[h-1]);return m}(s,r,o,1,t,l,i,e,B,yt,n,wt))},d(t){t&&d(e);for(let t=0;t<s.length;t+=1)s[t].d()}}}function zt(t){let e,n,s,l,o,r,c,$,b,w,y,k,z,_,C,q,E,T,M,A,R,S,F,I,L,B,D,X,J,K,Q,U,Y,Z;n=new dt({});let tt=t[3],et=[];for(let e=0;e<tt.length;e+=1)et[e]=kt(xt(t,tt,e));function nt(e){t[16](e)}function st(e){t[17](e)}function it(e){t[18](e)}let lt={};return void 0!==t[1]&&(lt.size=t[1]),void 0!==t[0]&&(lt.speed=t[0]),void 0!==t[2]&&(lt.colors=t[2]),X=new bt({props:lt}),P.push((()=>G(X,"size",nt))),P.push((()=>G(X,"speed",st))),P.push((()=>G(X,"colors",it))),{c(){e=h("header"),H(n.$$.fragment),s=g(),l=h("main"),o=h("h2"),o.textContent="Tryck på en ruta för att starta",r=g(),c=h("div"),$=h("button"),b=p("⯈"),y=g(),k=h("button"),z=p("||"),_=g(),C=h("button"),q=p("⤺"),E=g(),T=h("button"),M=p("🗲"),A=g(),R=h("button"),S=p("↺"),I=g(),L=h("table");for(let t=0;t<et.length;t+=1)et[t].c();B=g(),D=h("aside"),H(X.$$.fragment),v(e,"class","svelte-73bqpl"),x(o,"margin","0"),v($,"title","Starta"),$.disabled=w=!t[5],v($,"class","svelte-73bqpl"),v(k,"title","Pausa"),v(k,"class","pause svelte-73bqpl"),k.disabled=t[5],v(C,"title","Ett steg"),v(C,"class","step svelte-73bqpl"),C.disabled=t[6],v(T,"title","Lös direkt"),v(T,"class","instant svelte-73bqpl"),T.disabled=t[6],v(R,"title","Ny"),v(R,"class","reset svelte-73bqpl"),R.disabled=F=t[6]&&!t[7],v(c,"class","play-controls svelte-73bqpl"),v(L,"class","svelte-73bqpl"),x(L,"border-color",t[2].väggar,!1),x(L,"background-color",t[2].väggar,!1),v(l,"class","svelte-73bqpl"),v(D,"class","svelte-73bqpl")},m(i,d){u(i,e,d),W(n,e,null),u(i,s,d),u(i,l,d),a(l,o),a(l,r),a(l,c),a(c,$),a($,b),a(c,y),a(c,k),a(k,z),a(c,_),a(c,C),a(C,q),a(c,E),a(c,T),a(T,M),a(c,A),a(c,R),a(R,S),a(l,I),a(l,L);for(let t=0;t<et.length;t+=1)et[t].m(L,null);u(i,B,d),u(i,D,d),W(X,D,null),U=!0,Y||(Z=[m($,"click",t[10]),m(k,"click",t[11]),m(C,"click",t[12]),m(T,"click",t[13]),m(R,"click",t[14])],Y=!0)},p(t,[e]){if((!U||32&e&&w!==(w=!t[5]))&&($.disabled=w),(!U||32&e)&&(k.disabled=t[5]),(!U||64&e)&&(C.disabled=t[6]),(!U||64&e)&&(T.disabled=t[6]),(!U||192&e&&F!==(F=t[6]&&!t[7]))&&(R.disabled=F),524&e){let n;for(tt=t[3],n=0;n<tt.length;n+=1){const s=xt(t,tt,n);et[n]?et[n].p(s,e):(et[n]=kt(s),et[n].c(),et[n].m(L,null))}for(;n<et.length;n+=1)et[n].d(1);et.length=tt.length}4&e&&x(L,"border-color",t[2].väggar,!1),4&e&&x(L,"background-color",t[2].väggar,!1);const n={};!J&&2&e&&(J=!0,n.size=t[1],N((()=>J=!1))),!K&&1&e&&(K=!0,n.speed=t[0],N((()=>K=!1))),!Q&&4&e&&(Q=!0,n.colors=t[2],N((()=>Q=!1))),X.$set(n)},i(t){U||(j(n.$$.fragment,t),j(X.$$.fragment,t),U=!0)},o(t){O(n.$$.fragment,t),O(X.$$.fragment,t),U=!1},d(t){t&&d(e),V(n),t&&d(s),t&&d(l),f(et,t),t&&d(B),t&&d(D),V(X),Y=!1,i(Z)}}}function _t(t,e,n){let s={...rt.colors},i=rt.speed,l=rt.size,o=new lt(l),r=new it,c=r.isPaused;r.onPauseChange=t=>n(5,c=t);let a=!0;r.onFinished=()=>n(6,a=!0);let u=!1;function d(t){n(4,r.function=null,r),n(6,a=!0),n(7,u=!1),n(3,o=new lt(t))}function f(t,e){null==r.function&&(n(4,r.function=h(t,e),r),n(6,a=!1),n(7,u=!0),!1===c?r.start():r.step())}function*h(t,e){n(3,o[t][e].active=!0,o),n(3,o[t][e].visited=!0,o);for(const s of at.getRandomized()){const i=t+s.coordinates.x,l=e+s.coordinates.y;o.isCellValid(i,l)&&(yield,n(3,o[t][e].walls[s.name]=!1,o),n(3,o[i][l].walls[at.opposite(s).name]=!1,o),n(3,o[t][e].active=!1,o),yield*h(i,l),n(3,o[t][e].active=!0,o))}yield,n(3,o[t][e].finished=!0,o)}return t.$$.update=()=>{2&t.$$.dirty&&d(l),1&t.$$.dirty&&n(4,r.speed=i,r)},[i,l,s,o,r,c,a,u,d,f,()=>r.start(),()=>r.stop(),()=>r.step(),()=>r.instant(),()=>d(l),(t,e)=>f(t,e),function(t){l=t,n(1,l)},function(t){i=t,n(0,i)},function(t){s=t,n(2,s)}]}return new class extends J{constructor(t){super(),X(this,t,_t,zt,o,{})}}({target:document.body,props:{}})}();
//# sourceMappingURL=bundle.js.map
