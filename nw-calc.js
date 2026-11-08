/* financial math */
(function(){ const NS=window.NS;
NS.calc={
  emi(P,rate,n){ const r=rate/1200; if(!n) return 0; if(!r) return P/n; return P*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1); },
  balance(P,rate,n,k){ const r=rate/1200; const e=this.emi(P,rate,n); if(k>=n) return 0; if(!r) return Math.max(0,P-e*k); return Math.max(0,P*Math.pow(1+r,k)-e*(Math.pow(1+r,k)-1)/r); },
  sipFV(m,rate,years,step=0){ const r=rate/1200; let fv=0,inv=0,mm=m; const out=[]; for(let i=1;i<=years*12;i++){ fv=(fv+mm)*(1+r); inv+=mm; if(i%12===0){ out.push({y:i/12,inv,fv}); if(step) mm*=1+step/100; } } return out; },
  goalMonthly(target,rate,years,lump=0){ const r=rate/1200,n=years*12; const fvLump=lump*Math.pow(1+r,n); const need=Math.max(0,target-fvLump); if(!r) return need/n; return need*r/((Math.pow(1+r,n)-1)*(1+r)); }
};})();
