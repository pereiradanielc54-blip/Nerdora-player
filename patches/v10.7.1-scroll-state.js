(()=>{
  'use strict';
  if(globalThis.__NERDORA_SCROLL_STATE_PATCH__) return;
  globalThis.__NERDORA_SCROLL_STATE_PATCH__='10.7.1';

  const heroMemory=new Map();
  const rosterMemory=new Map();
  let renderedHeroKey=null;
  let renderedRosterKey=null;

  const heroKey=()=>`${UI.selectedHero||''}::${UI.heroTab||'overview'}`;
  const rosterKey=()=>`${UI.heroFilter||'all'}::${UI.heroOwned||'all'}`;
  const heroScrollSelector=[
    '.p52PanelBody',
    '.p52Tabs',
    '.p66BookChapters',
    '.p59ChronTrack',
    '.p65HeroSystemBody',
    '.ui61InnerScroll',
    '[class*="Scroll"]',
    '[class*="scroll"]'
  ].join(',');

  function uniqueNodes(root,selector){
    if(!root) return [];
    return [...new Set(Array.from(root.querySelectorAll(selector)))];
  }
  function heroNodes(){
    const modal=document.querySelector('#modal.heroDetailModal.show');
    return uniqueNodes(modal,heroScrollSelector);
  }
  function captureHero(){
    if(!renderedHeroKey) return;
    const nodes=heroNodes();
    if(!nodes.length) return;
    heroMemory.set(renderedHeroKey,nodes.map(el=>({top:el.scrollTop,left:el.scrollLeft})));
  }
  function restoreHero(key){
    const saved=heroMemory.get(key);
    if(!saved) return;
    const apply=()=>{
      const nodes=heroNodes();
      nodes.forEach((el,i)=>{
        const pos=saved[i];
        if(!pos) return;
        el.scrollTop=pos.top||0;
        el.scrollLeft=pos.left||0;
      });
    };
    requestAnimationFrame(()=>requestAnimationFrame(apply));
    setTimeout(apply,70);
  }

  if(typeof UI!=='undefined'&&typeof UI.renderHeroModal==='function'){
    const baseRenderHeroModal=UI.renderHeroModal;
    UI.renderHeroModal=function(...args){
      captureHero();
      const out=baseRenderHeroModal.apply(this,args);
      renderedHeroKey=heroKey();
      restoreHero(renderedHeroKey);
      return out;
    };
  }
  if(typeof UI!=='undefined'&&typeof UI.closeModal==='function'){
    const baseCloseModal=UI.closeModal;
    UI.closeModal=function(...args){
      captureHero();
      renderedHeroKey=null;
      return baseCloseModal.apply(this,args);
    };
  }
  if(document.querySelector('#modal.heroDetailModal.show')) renderedHeroKey=heroKey();

  function captureRoster(){
    const el=document.querySelector('#app.heroes-mode .rosterScroll');
    if(!el) return;
    rosterMemory.set(renderedRosterKey||rosterKey(),{top:el.scrollTop,left:el.scrollLeft});
  }
  function restoreRoster(key){
    const saved=rosterMemory.get(key);
    if(!saved) return;
    const apply=()=>{
      const el=document.querySelector('#app.heroes-mode .rosterScroll');
      if(!el) return;
      el.scrollTop=saved.top||0;
      el.scrollLeft=saved.left||0;
    };
    requestAnimationFrame(()=>requestAnimationFrame(apply));
    setTimeout(apply,60);
  }

  if(typeof renderHeroes==='function'){
    const baseRenderHeroes=renderHeroes;
    renderHeroes=function(...args){
      captureRoster();
      const out=baseRenderHeroes.apply(this,args);
      renderedRosterKey=rosterKey();
      restoreRoster(renderedRosterKey);
      return out;
    };
  }
  if(typeof UI!=='undefined'&&UI.route==='heroes') renderedRosterKey=rosterKey();
})();