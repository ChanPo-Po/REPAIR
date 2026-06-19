let currentUser=null;let rows=[];document.addEventListener('DOMContentLoaded',init);
function init(){currentUser=JSON.parse(localStorage.getItem('repairUser')||'null');if(!currentUser)return location.href='login.html';document.getElementById('currentRole').textContent=currentUser.name;document.body.classList.toggle('no-sensitive',!['qlkythuat','admin'].includes(currentUser.role));document.body.classList.add('role-'+currentUser.role);document.body.classList.toggle('no-admin',currentUser.role!=='admin');buildNav();fillAdminSelects();bindFilters();if(currentUser.role==='kythuat'){openTab('status')}loadDashboard();loadRepairList();renderMaterials();}

function bindFilters(){
  ['matrixModelFilter','matrixServiceFilter','matrixLimit'].forEach(id=>document.getElementById(id)?.addEventListener('change',()=>renderModels(filteredRows())));
  ['matrixModelFilter','matrixServiceFilter'].forEach(id=>document.getElementById(id)?.addEventListener('input',debounce(()=>renderModels(filteredRows()),250)));
  ['listKeyword','listBranch','listStatus','listTech','listService','listFrom','listTo'].forEach(id=>document.getElementById(id)?.addEventListener('change',loadRepairList));
  document.getElementById('listKeyword')?.addEventListener('input',debounce(loadRepairList,300));
  ['costListKeyword','costListStatus','costPaymentFilter','costMaterialFilter'].forEach(id=>document.getElementById(id)?.addEventListener('input',debounce(()=>renderCostQueue(filteredRows()),250)));
  ['costListStatus','costPaymentFilter'].forEach(id=>document.getElementById(id)?.addEventListener('change',()=>renderCostQueue(filteredRows())));
  ['materialSearch','materialGroupFilter'].forEach(id=>document.getElementById(id)?.addEventListener('input',debounce(renderMaterials,250)));
}
function debounce(fn,ms){let t;return function(){clearTimeout(t);t=setTimeout(()=>fn.apply(this,arguments),ms)}}

function logout(){localStorage.removeItem('repairUser');location.href='login.html'}
function buildNav(){const all=[['overview','📊 Tổng quan',['qlcuahang','qlkythuat','admin']],['list','📋 Danh sách sửa chữa',['qlcuahang','qlkythuat','admin']],['status','🔨 Cập nhật trạng thái',['kythuat','qlcuahang','qlkythuat','admin']],['cost','💰 Cập nhật chi phí',['qlkythuat','admin']],['materials','📦 Vật tư',['qlkythuat','admin']],['kpi','📈 KPI',['admin']],['settings','⚙️ Danh mục / Người dùng',['admin']]];const nav=document.getElementById('adminNav');nav.innerHTML=all.filter(x=>x[2].includes(currentUser.role)).map(x=>`<button class="nav-btn" data-tab="${x[0]}" onclick="openTab('${x[0]}')">${x[1]}</button>`).join('');nav.querySelector('.nav-btn')?.classList.add('active');}
function openTab(id){document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));document.getElementById(id).classList.add('active');document.querySelectorAll('.nav-btn').forEach(x=>x.classList.toggle('active',x.dataset.tab===id));document.getElementById('pageTitle').textContent=document.querySelector(`[data-tab="${id}"]`).textContent.trim();}
function fillAdminSelects(){['listStatus','statusSelect','costListStatus'].forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML='<option value="">Tất cả trạng thái</option>'+DM_TRANG_THAI.map(x=>`<option>${x}</option>`).join('')});['listTech','statusTech'].forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML='<option value="">Chọn KTV</option>'+DM_KY_THUAT.map(x=>`<option>${x.name}</option>`).join('')});const sv=document.getElementById('statusService');if(sv)sv.innerHTML='<option value="">Chọn dịch vụ sửa chữa</option>'+DM_DICH_VU.map(x=>`<option>${x.name}</option>`).join('');const ls=document.getElementById('listService');if(ls)ls.innerHTML='<option value="">Tất cả dịch vụ</option>'+DM_DICH_VU.map(x=>`<option>${x.name}</option>`).join('');const mt=document.getElementById('costMaterial');if(mt)mt.innerHTML='<option value="">Chọn vật tư</option>'+DM_VAT_TU.map(x=>`<option>${x.name}</option>`).join('');const ncc=document.getElementById('costSupplier');if(ncc)ncc.innerHTML='<option value="">Chọn NCC</option>'+DM_NCC.map(x=>`<option>${x}</option>`).join('');const mg=document.getElementById('materialGroupFilter');if(mg){const groups=[...new Set(DM_VAT_TU.map(x=>x.group).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi'));mg.innerHTML='<option value="">Tất cả nhóm</option>'+groups.map(x=>`<option>${x}</option>`).join('')}}
async function getRows(){const res=await api('list',{});rows=(res.data||[]).map(normalizeRow);return rows}
function normalizeRow(x){return {...x,estimate:num(x.estimate),materialCost:num(x.materialCost),laborCost:num(x.laborCost),extraCost:num(x.extraCost||0),totalCost:num(x.totalCost),actualRevenue:num(x.actualRevenue),profit:num(x.profit)}}
function num(v){return Number(String(v||0).replace(/[^0-9.-]/g,''))||0}
function parseDate(v){if(!v)return null;if(v instanceof Date)return v;let s=String(v);if(s.includes('/')){const [d,m,yAndTime]=s.split('/');const [y,t='00:00:00']=yAndTime.split(' ');return new Date(`${y}-${m}-${d}T${t}`)}return new Date(s.replace(' ','T'))}
function fmtDate(v){const d=parseDate(v);if(!d||isNaN(d))return safe(v);return d.toLocaleString('vi-VN',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit',year:'numeric'})}
function cleanModel(v){return String(v||'Không rõ').toUpperCase().replace(/IPHONE/gi,'').replace(/PRO MAX/gi,'PM').replace(/PROMAX/gi,'PM').replace(/\s+/g,' ').trim()||'Không rõ'}
function repairServiceRaw(x){return (x.repairService||x.serviceName||x.service||'').toString().trim()}
function splitServices(v){
  const raw=String(v||'').trim();
  if(!raw)return [];
  return raw.split(/[,;\n]+/).map(x=>x.trim()).filter(Boolean);
}
function canSeeMoney(){return ['qlkythuat','admin'].includes(currentUser?.role)}
function canEditCost(){return ['qlkythuat','admin'].includes(currentUser?.role)}
function canReturnQuick(){return ['qlcuahang','qlkythuat','admin'].includes(currentUser?.role)}
function canEditStatus(){return ['kythuat','qlcuahang','qlkythuat','admin'].includes(currentUser?.role)}
function canAdminOverride(){return currentUser?.role==='admin'}
function statusNo(s){const m=String(s||'').match(/^(\d+)/);return m?Number(m[1]):0}
function validStatusMove(from,to){
  if(!from||!to||from===to||canAdminOverride())return true;
  const a=statusNo(from), b=statusNo(to);
  if(!a||!b)return true;
  if([6,9,10,11].includes(b))return true; // chờ LK/back/BH/hủy là trạng thái ngoại lệ
  if(b===8)return a===7; // trả khách phải sau đã sửa xong
  return b>=a && b<=a+2;
}
function repairService(x){return repairServiceRaw(x)||'Chưa cập nhật dịch vụ'}
function serviceFacts(data){
  const facts=[];
  data.forEach(x=>{
    const services=splitServices(repairServiceRaw(x));
    if(!services.length)return;
    const revenue=rev(x);
    const profit=x.profit || (rev(x)-x.totalCost);
    const shareRevenue=services.length?revenue/services.length:0;
    const shareProfit=services.length?profit/services.length:0;
    services.forEach(service=>facts.push({service,row:x,model:cleanModel(x.product),revenue:shareRevenue,profit:shareProfit}));
  });
  return facts;
}
function rev(x){return x.actualRevenue||x.estimate||0}
function isSameDay(a,b){return a&&a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate()}
function isSameWeek(a,b){if(!a)return false;const one=new Date(b);one.setDate(b.getDate()-b.getDay()+1);one.setHours(0,0,0,0);const end=new Date(one);end.setDate(one.getDate()+7);return a>=one&&a<end}
function isSameMonth(a,b){return a&&a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()}
function filteredRows(){const branch=document.getElementById('branchFilter')?.value||'';const m=document.getElementById('monthFilter')?.value||'';return rows.filter(x=>(!branch||x.branch===branch)&&(!m||String(x.date||x.createdAt||'').includes(m.split('-').reverse().join('/'))||String(x.date||'').includes(m)))}
async function loadDashboard(){await getRows();const data=filteredRows();const now=new Date();const today=data.filter(x=>isSameDay(parseDate(x.date||x.createdAt),now));const week=data.filter(x=>isSameWeek(parseDate(x.date||x.createdAt),now));const month=data.filter(x=>isSameMonth(parseDate(x.date||x.createdAt),now));setText('todayOrders',today.length);setText('repairingOrders',data.filter(x=>x.status==='5. Đang sửa').length);setText('completedOrders',data.filter(x=>String(x.status).startsWith('7.')).length);setText('deliveredOrders',data.filter(x=>String(x.status).startsWith('8.')).length);setText('overdueOrders',data.filter(isOverdue).length);setText('waitingPartOrders',data.filter(x=>x.status==='6. Chờ linh kiện').length);setText('storeDayOrders',today.length);setText('storeWeekOrders',week.length);setText('storeMonthOrders',month.length);setText('storeDayRevenue',money(sum(today,rev)));setText('storeWeekRevenue',money(sum(week,rev)));setText('storeMonthRevenue',money(sum(month,rev)));setText('moneyRevenue',money(sum(data,rev)));setText('moneyMaterial',money(sum(data,x=>x.materialCost)));setText('moneyLabor',money(sum(data,x=>x.laborCost)));setText('moneyExtra',money(sum(data,x=>x.extraCost)));setText('moneyProfit',money(sum(data,x=>x.profit||rev(x)-x.totalCost)));setText('compareText','↑ '+pct(sum(week,rev),sum(data,rev)/4)+' so với TB tuần');renderWeekChart(data);renderServices(data);renderModels(data);renderMaterialsNeed(data);renderTechKpi(data);renderWarnings(data);renderBranches(data);renderStatusRatio(data);setText('avgRepairTime',avgRepairDays(data)+' ngày');renderTopOverdueTech(data);}
function setText(id,v){const el=document.getElementById(id);if(el)el.textContent=v}
function sum(arr,fn){return arr.reduce((s,x)=>s+(fn(x)||0),0)}
function pct(a,b){if(!b)return '0%';return Math.round((a-b)/b*100)+'%'}
function isClosedStatus(status){return /^(7|8|9|11)\./.test(String(status||''))}
function isOverdue(x){if(!x.appointment||isClosedStatus(x.status))return false;return parseDate(x.appointment)<new Date()}
function groupBy(arr,fn){return arr.reduce((m,x)=>{const k=fn(x)||'Khác';(m[k]=m[k]||[]).push(x);return m},{})}
function rankHTML(items,type='count'){return items.map((x,i)=>`<div class="rank-item"><span>${i+1}. ${x.name}</span><b>${type==='money'?money(x.value):x.value}</b></div>`).join('')||'<p class="muted">Chưa có dữ liệu</p>'}
function topFromGroups(groups,calc){return Object.entries(groups).map(([name,arr])=>({name,value:calc(arr)})).sort((a,b)=>b.value-a.value).slice(0,6)}
function shortMoney(v){v=Number(v)||0;if(Math.abs(v)>=1000000)return (v/1000000).toFixed(v%1000000?1:0).replace('.0','')+'tr';if(Math.abs(v)>=1000)return Math.round(v/1000)+'k';return String(v)}
function renderWeekChart(data){
  const box=document.getElementById('weekChart');if(!box)return;
  const canMoney=['qlkythuat','admin'].includes(currentUser?.role);
  const now=new Date();const weeks=[];
  for(let i=3;i>=0;i--){const end=new Date(now);end.setDate(now.getDate()-i*7);const start=new Date(end);start.setDate(end.getDate()-6);const arr=data.filter(x=>{const d=parseDate(x.date||x.createdAt);return d>=start&&d<=end});weeks.push({name:'Tuần '+(4-i),orders:arr.length,revenue:sum(arr,rev),profit:sum(arr,x=>x.profit||rev(x)-x.totalCost)});}
  const maxMoney=Math.max(...weeks.map(w=>Math.max(w.revenue,canMoney?w.profit:0)),1);
  const maxOrders=Math.max(...weeks.map(w=>w.orders),1);
  box.innerHTML=weeks.map(w=>{
    const orderH=Math.max(8,Math.min(78,w.orders/maxOrders*78));
    const revH=Math.max(8,Math.min(112,w.revenue/maxMoney*112));
    const profitH=Math.max(8,Math.min(112,Math.max(w.profit,0)/maxMoney*112));
    return `<div class="week-col"><b>${w.name}</b><div class="bar-stack ${canMoney?'':'no-profit-bar'}"><span title="Đơn" style="height:${orderH}px"></span><span title="Doanh thu" style="height:${revH}px"></span>${canMoney?`<span title="Lợi nhuận" style="height:${profitH}px"></span>`:''}</div><small>Đơn ${w.orders}<br>DT ${shortMoney(w.revenue)}${canMoney?`<br>LN ${shortMoney(w.profit)}`:''}</small></div>`
  }).join('')
}
function renderServices(data){
  const facts=serviceFacts(data);
  const g=groupBy(facts,x=>x.service);
  document.getElementById('topServices').innerHTML=rankHTML(topFromGroups(g,a=>a.length));
  document.getElementById('topServiceRevenue').innerHTML=rankHTML(topFromGroups(g,a=>sum(a,x=>x.revenue)),'money');
  document.getElementById('topProfit').innerHTML=rankHTML(topFromGroups(g,a=>sum(a,x=>x.profit)),'money');
}
function smartModelSort(a,b){
  const pa=parseModelSort(a), pb=parseModelSort(b);
  if(pa.num!==pb.num) return pa.num-pb.num;
  return pa.suf.localeCompare(pb.suf,'vi');
}
function parseModelSort(v){
  const s=String(v||'').toUpperCase().replace(/IPHONE|PROMAX/g,'').trim();
  const m=s.match(/(\d+)/); return {num:m?Number(m[1]):999, suf:s.replace(/\d+/g,'')};
}
function renderModels(data){
  let facts=serviceFacts(data);
  const serviceQ=(document.getElementById('matrixServiceFilter')?.value||'').toLowerCase().trim();
  const modelQ=(document.getElementById('matrixModelFilter')?.value||'').toLowerCase().trim();
  const limit=Number(document.getElementById('matrixLimit')?.value||20);
  if(serviceQ)facts=facts.filter(x=>String(x.service||'').toLowerCase().includes(serviceQ));
  if(modelQ)facts=facts.filter(x=>String(x.model||'').toLowerCase().includes(modelQ));
  const byService=groupBy(facts,x=>x.service);
  const matrix=document.getElementById('commonIssues');
  if(!matrix)return;
  const services=Object.keys(byService).sort((a,b)=>byService[b].length-byService[a].length).slice(0,limit);
  const models=[...new Set(facts.map(x=>x.model).filter(Boolean))].sort(smartModelSort);
  if(!services.length || !models.length){matrix.innerHTML='<p class="muted">Chưa có dữ liệu phù hợp bộ lọc</p>';return;}
  const countMap={};
  facts.forEach(x=>{const key=x.model+'||'+x.service;countMap[key]=(countMap[key]||0)+1;});
  const max=Math.max(1,...Object.values(countMap));
  const heat=n=>!n?'':` style="--heat:${Math.min(1,n/max).toFixed(2)}"`;
  matrix.innerHTML=`
    <div class="matrix-summary"><b>${models.length}</b> dòng máy · <b>${services.length}</b> dịch vụ · <b>${facts.length}</b> lượt sửa</div>
    <div class="matrix-table-wrap full-matrix">
      <table class="service-matrix-table heatmap-table">
        <thead>
          <tr class="matrix-title-row"><th></th><th colspan="${services.length}">DỊCH VỤ</th></tr>
          <tr><th>DÒNG MÁY</th>${services.map(s=>`<th>${safe(s)}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${models.map(model=>`<tr><th>${safe(model)}</th>${services.map(service=>{const n=countMap[model+'||'+service]||0;return `<td${heat(n)}>${n||''}</td>`}).join('')}</tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}
function renderMaterialsNeed(data){
  const usedByMaterial=DM_VAT_TU.map(v=>{
    const vg=String(v.group||'').toLowerCase(), vn=String(v.name||'').toLowerCase(), vm=cleanModel(v.model||'');
    const used=data.filter(x=>{
      const service=repairService(x).toLowerCase(); const req=String(x.request||'').toLowerCase(); const material=String(x.materialName||'').toLowerCase(); const model=cleanModel(x.product||'');
      return (material.includes(vn)||material.includes(vg)||service.includes(vg)||req.includes(vg)||service.includes(vn)||req.includes(vn)) && (!vm||model.includes(vm)||vm.includes(model));
    }).length;
    return {...v,used,need:Math.max(0,Math.ceil(used*.8))};
  });
  document.getElementById('materialNeed').innerHTML=usedByMaterial.map(v=>`<div class="material-card"><b>${v.name}</b><span>${v.group||''}</span><p>Đã dùng: <b>${v.used}</b></p><p>Đề xuất nhập: <b>${v.need}</b></p></div>`).join('')||'<p class="muted">Chưa có dữ liệu</p>'
}
function renderTechKpi(data){const g=groupBy(data,x=>x.technician||'Chưa giao');const list=topFromGroups(g,a=>a.filter(x=>String(x.status).startsWith('7.')||String(x.status).startsWith('8.')).length).map((x,i)=>({name:x.name,rank:['🥇','🥈','🥉'][i]||i+1,arr:g[x.name]}));const html=list.map(x=>`<tr><td>${x.name}</td><td>${x.arr.filter(i=>String(i.status).startsWith('7.')||String(i.status).startsWith('8.')).length}</td><td>${money(sum(x.arr,rev))}</td><td>${money(sum(x.arr,i=>i.laborCost))}</td><td>${x.arr.filter(isOverdue).length}</td><td>${x.rank}</td></tr>`).join('')||'<tr><td colspan="6">Chưa có dữ liệu</td></tr>';setTBody('techKpiRows',html);setTBody('adminKpiRows',html.replaceAll('<td>'+list[0]?.rank+'</td>',''))}
function setTBody(id,html){const el=document.getElementById(id);if(el)el.innerHTML=html}
function renderWarnings(data){const soak=data.filter(x=>{const d=parseDate(x.date||x.createdAt);return d&&!isClosedStatus(x.status)&&(new Date()-d)>3*864e5}).length;const cards=[['Máy quá hẹn',data.filter(isOverdue).length],['Máy ngâm trên 3 ngày',soak],['Chờ linh kiện',data.filter(x=>x.status==='6. Chờ linh kiện').length],['Bảo hành lại',data.filter(x=>x.status==='10. Bảo hành lại').length]];document.getElementById('warningCards').innerHTML=cards.map(c=>`<button class="warning-card" onclick="openTab('list')"><span>${c[0]}</span><b>${c[1]}</b><small>Bấm xem danh sách</small></button>`).join('')}
function renderBranches(data){const g=groupBy(data,x=>x.branch||'Không rõ');document.getElementById('branchCards').innerHTML=Object.entries(g).map(([b,a])=>`<div class="branch-card"><b>CN${b}</b><p>Đơn: ${a.length}</p><p>Doanh thu: ${money(sum(a,rev))}</p><p class="sensitive-money">Lợi nhuận: ${money(sum(a,x=>x.profit||rev(x)-x.totalCost))}</p></div>`).join('')}
function renderStatusRatio(data){document.getElementById('statusRatio').innerHTML=DM_TRANG_THAI.map(s=>{const c=data.filter(x=>x.status===s).length;const p=data.length?Math.round(c/data.length*100):0;return `<div class="status-item"><b>${p}%</b><br><span>${s}</span><small>${c} máy</small></div>`}).join('')}
function avgRepairDays(data){const arr=data.map(x=>{const a=parseDate(x.date||x.createdAt),b=parseDate(x.completedDate||x.handoverDate);return a&&b?Math.max(0,(b-a)/864e5):null}).filter(x=>x!==null);return arr.length?(sum(arr,x=>x)/arr.length).toFixed(1):'0'}
function renderTopOverdueTech(data){const arr=data.filter(x=>isOverdue(x)&&x.technician);const g=groupBy(arr,x=>x.technician);document.getElementById('topOverdueTech').innerHTML=rankHTML(topFromGroups(g,a=>a.length))}
async function loadRepairList(){
  await getRows();
  const q=(document.getElementById('listKeyword')?.value||'').toLowerCase().trim();
  const st=document.getElementById('listStatus')?.value||'';
  const tech=document.getElementById('listTech')?.value||'';
  const branch=document.getElementById('listBranch')?.value||'';
  const svc=document.getElementById('listService')?.value||'';
  const from=document.getElementById('listFrom')?.value||'';
  const to=document.getElementById('listTo')?.value||'';
  const dFrom=from?new Date(from+'T00:00:00'):null;
  const dTo=to?new Date(to+'T23:59:59'):null;
  const data=filteredRows().filter(x=>{
    const d=parseDate(x.date||x.createdAt);
    return (!q||JSON.stringify(x).toLowerCase().includes(q))&&(!branch||x.branch===branch)&&(!st||x.status===st)&&(!tech||x.technician===tech)&&(!svc||splitServices(repairService(x)).includes(svc))&&(!dFrom||d>=dFrom)&&(!dTo||d<=dTo);
  });
  const tbody=document.getElementById('repairRows');
  if(tbody)tbody.innerHTML=data.map(x=>{
    const canQuickDone=canEditStatus() && !(String(x.status||'').startsWith('7.')||String(x.status||'').startsWith('8.'));
    const canReturn=canReturnQuick() && !String(x.status||'').startsWith('8.');
    const costBtn=canEditCost()?`<button class="view-btn money" onclick="openTab('cost');prefillCost('${x.repairId}')">Chi phí</button>`:'';
    return `<tr class="${isOverdue(x)?'row-overdue':''}"><td><b>${x.repairId||''}</b></td><td>${fmtDate(x.date)}</td><td>${x.branch||''}</td><td>${x.product||''}</td><td>${x.customer||''}</td><td>${x.phone||''}</td><td><span class="status-dot ${statusTone(x.status)}">${cleanStatus(x.status)}</span></td><td>${x.technician||'—'}</td><td>${fmtDate(x.appointment)}</td><td><b>${money(rev(x))}</b></td><td><div class="row-actions"><button class="view-btn" onclick="openDetail('${x.repairId}')">Chi tiết</button><button class="view-btn light" onclick="openTab('status');prefillStatus('${x.repairId}')">Cập nhật</button>${costBtn}${canQuickDone?`<button class="view-btn success" onclick="quickDone('${x.repairId}')">Đã sửa xong</button>`:''}${canReturn?`<button class="view-btn success" onclick="quickReturn('${x.repairId}')">Đã trả</button>`:''}</div></td></tr>`
  }).join('')||'<tr><td colspan="11">Không có dữ liệu phù hợp bộ lọc</td></tr>';
  renderTechQueue(data);
  renderCostQueue(filteredRows());
}

function renderCostQueue(data){
  const tbody=document.getElementById('costRows'); if(!tbody)return;
  const q=(document.getElementById('costListKeyword')?.value||'').toLowerCase().trim();
  const st=document.getElementById('costListStatus')?.value||'';
  const pay=document.getElementById('costPaymentFilter')?.value||'';
  const mat=(document.getElementById('costMaterialFilter')?.value||'').toLowerCase().trim();
  const list=data.filter(x=>{
    const hay=[x.repairId,x.product,x.customer,x.phone,x.imei].join(' ').toLowerCase();
    const matHay=[x.materialName,x.supplier,x.materialBill].join(' ').toLowerCase();
    return !String(x.status||'').startsWith('11.')&&(!q||hay.includes(q))&&(!st||x.status===st)&&(!pay||x.paymentStatus===pay)&&(!mat||matHay.includes(mat));
  }).slice(0,120);
  tbody.innerHTML=list.map(x=>`<tr><td><b>${x.repairId}</b></td><td>${x.product||''}</td><td>${x.customer||''}</td><td><span class="status-dot ${statusTone(x.status)}">${cleanStatus(x.status)}</span></td><td>${x.materialName||'—'}</td><td>${money(x.totalCost)}</td><td>${money(x.actualRevenue||x.estimate)}</td><td><button class="view-btn money" onclick="prefillCost('${x.repairId}')">Cập nhật chi phí</button></td></tr>`).join('')||'<tr><td colspan="8">Không có dữ liệu phù hợp bộ lọc</td></tr>';
}

function renderTechQueue(data){
  const box=document.getElementById('techQueue'); if(!box)return;
  let active=data.filter(x=>!isClosedStatus(x.status));
  // Nếu tài khoản kỹ thuật là tên người thật thì chỉ hiện máy của người đó + máy chưa giao.
  if(currentUser?.role==='kythuat' && currentUser?.name && currentUser.name!=='Kỹ thuật'){
    active=active.filter(x=>!x.technician || x.technician===currentUser.name);
  }
  box.innerHTML=active.slice(0,60).map(x=>`<div class="job-card"><button class="job-main" onclick="prefillStatus('${x.repairId}')"><div><b>${x.product||'Không rõ máy'}</b><span>${x.customer||''} · ${x.phone||''}</span></div><em class="status-dot ${statusTone(x.status)}">${cleanStatus(x.status)}</em><small>${x.repairId} · Hẹn ${fmtDate(x.appointment)||'—'}</small></button><div class="job-actions"><button class="view-btn light" onclick="prefillStatus('${x.repairId}')">Cập nhật</button>${String(x.status||'').startsWith('7.')||String(x.status||'').startsWith('8.')?'':`<button class="view-btn success" onclick="quickDone('${x.repairId}')">Đã sửa xong</button>`}</div></div>`).join('')||'<p class="empty-note">Không có máy cần xử lý.</p>'
}

function prefillStatus(id){const x=rows.find(r=>String(r.repairId)===String(id));if(!x)return;const f=document.getElementById('statusForm');f.classList.remove('hidden');f.repairId.value=x.repairId;f.actualStatus.value=x.actualStatus||'';f.processPlace.value=x.place||'Nội bộ';f.technician.value=x.technician||'';f.status.value=x.status||'1. Đã tiếp nhận'; if(f.repairService)f.repairService.value=x.repairService||''; if(f.estimate)f.estimate.value=x.estimate||''; f.techNote.value=x.techNote||'';document.getElementById('statusForm').scrollIntoView({behavior:'smooth',block:'start'});}



async function quickDone(id){
  const x=rows.find(r=>String(r.repairId)===String(id));
  if(!x)return notifyWarn('Không tìm thấy phiếu để cập nhật.','Không thấy phiếu');
  notifyPopup('Xác nhận đã sửa xong',`Cập nhật phiếu ${id} sang trạng thái Đã sửa xong?`,'warn',[
    {label:'Cập nhật',className:'primary-btn',onClick:async()=>{
      const res=await api('updateStatus',{repairId:id,data:{repairService:x.repairService||'',estimate:x.estimate||0,place:x.place||'Nội bộ',technician:x.technician||'',status:'7. Đã sửa xong',techNote:x.techNote||'',actualStatus:x.actualStatus||'',user:currentUser?.name||currentUser?.role||''}});
      if(!res.success)return notifyError(res.message||'Không cập nhật được phiếu.');
      await getRows();loadRepairList();loadDashboard();document.getElementById('statusForm')?.classList.add('hidden');notifySuccess('Đã cập nhật phiếu '+id+' sang Đã sửa xong.','Đã sửa xong');
      if(currentUser?.role==='kythuat'){openTab('status');window.scrollTo({top:0,behavior:'smooth'});}else{openTab('list');}
    }},
    {label:'Bỏ qua',className:'ghost-btn',onClick:()=>{}}
  ]);
}

async function quickReturn(id){
  const x=rows.find(r=>String(r.repairId)===String(id));
  if(!x)return notifyWarn('Không tìm thấy phiếu để cập nhật.','Không thấy phiếu');
  notifyPopup('Xác nhận trả khách',`Cập nhật phiếu ${id} sang trạng thái Đã trả khách?`,'warn',[
    {label:'Cập nhật',className:'primary-btn',onClick:async()=>{
      const res=await api('updateStatus',{repairId:id,data:{repairService:x.repairService||'',estimate:x.estimate||0,place:x.place||'Nội bộ',technician:x.technician||'',status:'8. Đã trả khách',techNote:x.techNote||'',user:currentUser?.name||currentUser?.role||''}});
      if(!res.success)return notifyError(res.message||'Không cập nhật được phiếu.');
      await getRows();loadRepairList();loadDashboard();notifyPopup('Đã trả khách','Đã cập nhật trạng thái. Có muốn in phiếu trả không?','success',[{label:'In phiếu trả',className:'primary-btn',onClick:()=>printReceipt('return',id)},{label:'Đóng',className:'ghost-btn',onClick:()=>{}}]);
    }},
    {label:'Bỏ qua',className:'ghost-btn',onClick:()=>{}}
  ]);
}

async function findForStatusPc(){
  const q=document.getElementById('statusPcKeyword')?.value.trim()||'';
  if(!q) return notifyWarn('Nhập Mã SC / IMEI / SĐT trước nha.','Thiếu từ khóa');
  const res=await api('search',{q});
  const x=res.data?.[0];
  if(!x)return notifyWarn('Không tìm thấy phiếu theo từ khóa này.','Không thấy phiếu');
  openTab('status');
  prefillStatus(x.repairId);
}

async function findForStatus(inputId='statusKeyword'){const el=document.getElementById(inputId)||document.getElementById('statusKeyword');const q=(el?.value||'').trim();if(!q)return notifyWarn('Nhập mã SC / IMEI / SĐT để tìm phiếu.','Thiếu từ khóa');const res=await api('search',{q});const x=res.data?.[0];if(!x)return notifyWarn('Không tìm thấy phiếu theo từ khóa này.','Không thấy phiếu');prefillStatus(x.repairId);openTab('status');}
document.getElementById('statusForm')?.addEventListener('submit',async e=>{
  e.preventDefault();
  const f=new FormData(e.target),d=Object.fromEntries(f.entries());
  const old=rows.find(x=>String(x.repairId)===String(d.repairId));
  if(old && !validStatusMove(old.status,d.status)){return notifyWarn(`Không nên nhảy trạng thái từ "${cleanStatus(old.status)}" sang "${cleanStatus(d.status)}". Admin mới được override.`, 'Sai luồng trạng thái')}
  const res=await api('updateStatus',{repairId:d.repairId,data:{actualStatus:d.actualStatus,repairService:d.repairService,estimate:d.estimate,place:d.processPlace,technician:d.technician,status:d.status,techNote:d.techNote,updatedAt:new Date().toLocaleString('vi-VN'),user:currentUser?.name||currentUser?.role||'',role:currentUser?.role||''}});
  if(!res.success)return notifyError(res.message||'Không cập nhật được trạng thái.');
  await getRows();loadRepairList();loadDashboard();document.getElementById('statusForm')?.classList.add('hidden');notifySuccess('Đã cập nhật trạng thái phiếu '+d.repairId,'Cập nhật thành công');
  if(String(d.status||'').startsWith('8.')){notifyPopup('Đã trả khách','Bạn có muốn in phiếu trả cho khách ký không?','success',[{label:'In phiếu trả',className:'primary-btn',onClick:()=>printReceipt('return',d.repairId)},{label:'Bỏ qua',className:'ghost-btn',onClick:()=>{}}]);}
  if(currentUser?.role==='kythuat'){openTab('status');window.scrollTo({top:0,behavior:'smooth'});}else{openTab('list');}
});
async function findForCost(){
  const q=document.getElementById('costKeyword').value.trim();
  if(!q)return notifyWarn('Nhập mã SC / IMEI / SĐT để tìm phiếu.','Thiếu từ khóa');
  const res=await api('search',{q});
  const x=res.data?.[0];
  if(!x)return notifyWarn('Không tìm thấy phiếu theo từ khóa này.','Không thấy phiếu');
  await getRows();
  prefillCost(x.repairId);
}
function prefillCost(id){
  const x=rows.find(r=>String(r.repairId)===String(id));
  if(!x)return notifyWarn('Không tìm thấy phiếu để cập nhật chi phí.','Không thấy phiếu');
  if(String(x.status||'').startsWith('8.') && currentUser?.role!=='admin')return notifyWarn('Phiếu đã trả khách. Chỉ Admin mới được sửa lại chi phí sau khi trả khách.','Đã khóa chi phí');
  const f=document.getElementById('costForm');
  f.classList.remove('hidden');
  f.repairId.value=x.repairId;
  if(f.materialBill)f.materialBill.value=x.materialBill||'';
  if(f.materialName)f.materialName.value=x.materialName||'';
  f.materialCost.value=x.materialCost||0;
  f.laborCost.value=x.laborCost||0;
  f.actualRevenue.value=x.actualRevenue||x.estimate||0;
  if(f.supplier)f.supplier.value=x.supplier||'';
  f.paymentStatus.value=x.paymentStatus||'Chưa thanh toán';
  f.scrollIntoView({behavior:'smooth',block:'start'});
}
document.getElementById('costForm')?.addEventListener('submit',async e=>{
  e.preventDefault();
  const f=new FormData(e.target),d=Object.fromEntries(f.entries());
  d.user=currentUser?.name||currentUser?.role||''; d.role=currentUser?.role||'';
  const res=await api('updateCost',{repairId:d.repairId,data:d});
  if(!res.success)return notifyError(res.message||'Không cập nhật được chi phí.');
  notifySuccess('Đã lưu chi phí / thực thu cho phiếu '+d.repairId,'Cập nhật chi phí xong');
  await getRows();loadRepairList();loadDashboard();
  document.getElementById('costForm')?.classList.add('hidden');
});
function statusTone(status){
  const s=String(status||'');
  if(s.startsWith('7.')||s.startsWith('8.')) return 'good';
  if(s.startsWith('6.')||s.startsWith('3.')||s.startsWith('4.')) return 'warn';
  if(s.startsWith('9.')||s.startsWith('10.')||s.startsWith('11.')) return 'danger';
  return 'info';
}
function safe(v){return v==null||v===''?'—':v}
function cleanStatus(s){return String(s||'').replace(/^\d+\.\s*/,'')||'Chưa rõ'}
function openDetail(id){
  const x=rows.find(r=>String(r.repairId)===String(id));if(!x)return;
  const canMoney=['qlkythuat','admin'].includes(currentUser.role);
  const statusIndex=Math.max(0,DM_TRANG_THAI.indexOf(x.status));
  const coreSteps=['1. Đã tiếp nhận','2. Đang kiểm tra','4. Chờ khách duyệt','5. Đang sửa','6. Chờ linh kiện','7. Đã sửa xong','8. Đã trả khách'];
  const steps=coreSteps.map(st=>{const idx=DM_TRANG_THAI.indexOf(st);return `<span class="flow-step ${idx<statusIndex?'done':idx===statusIndex?'active':''}">${cleanStatus(st)}</span>`}).join('');
  const moneyBlock=canMoney?`<section class="detail-section private-money"><h4>Chi phí nội bộ</h4><div class="money-mini"><p><span>Vật tư</span><b>${money(x.materialCost)}</b></p><p><span>Tên vật tư</span><b>${safe(x.materialName)}</b></p><p><span>NCC</span><b>${safe(x.supplier)}</b></p><p><span>Công thợ</span><b>${money(x.laborCost)}</b></p><p><span>Tổng chi phí</span><b>${money(x.totalCost)}</b></p><p><span>Thực thu</span><b>${money(x.actualRevenue)}</b></p><p class="profit"><span>Lợi nhuận</span><b>${money(x.profit)}</b></p></div></section>`:'';
  document.getElementById('detailContent').innerHTML=`
    <article class="repair-detail-v2026">
      <header class="detail-topline">
        <div><small>${safe(x.repairId)}</small><h2>${safe(x.product)}</h2><p>${safe(x.customer)} · ${safe(x.phone)} · CN ${safe(x.branch)}</p></div>
        <aside><em class="status-dot ${statusTone(x.status)}">${cleanStatus(x.status)}</em><b>${money(rev(x))}</b><span>Báo giá khách</span></aside>
      </header>
      <nav class="flow-line">${steps}</nav>
      <div class="detail-actions no-print"><button class="ghost-btn" onclick="printReceipt('receive','${x.repairId}')">In phiếu nhận</button><button class="primary-btn" onclick="printReceipt('return','${x.repairId}')">In phiếu trả</button></div>
      <div class="detail-grid-v2026">
        <section class="detail-section"><h4>Thông tin tiếp nhận</h4><dl><div><dt>IMEI</dt><dd>${safe(x.imei)}</dd></div><div><dt>Ngày nhận</dt><dd>${fmtDate(x.date)}</dd></div><div><dt>Loại dịch vụ</dt><dd>${safe(x.serviceType)}</dd></div><div><dt>Hẹn trả</dt><dd>${fmtDate(x.appointment)}</dd></div><div><dt>NV tiếp nhận</dt><dd>${safe(x.staff)}</dd></div><div><dt>Kỹ thuật</dt><dd>${safe(x.technician)}</dd></div></dl></section>
        <section class="detail-section"><h4>Tình trạng & yêu cầu</h4><p><b>Tình trạng nhận:</b><br>${safe(x.receiveStatus)}</p><p><b>Yêu cầu:</b><br>${safe(x.request)}</p><p><b>Ghi chú:</b><br>${safe(x.receiveNote)}</p></section>
        <section class="detail-section"><h4>Test chức năng</h4><div class="test-mini"><span>FaceID <b>${safe(x.faceId)}</b></span><span>Màn <b>${safe(x.screen)}</b></span><span>Camera/Mic <b>${safe(x.cameraMic)}</b></span><span>Loa <b>${safe(x.speaker)}</b></span></div></section>
        <section class="detail-section"><h4>Cập nhật kỹ thuật</h4><p><b>Nơi xử lý:</b> ${safe(x.place)}</p><p><b>Tình trạng thực tế:</b><br>${safe(x.actualStatus)}</p><p><b>Ghi chú kỹ thuật:</b><br>${safe(x.techNote)}</p></section>
        <section class="detail-section quote-box"><h4>Dịch vụ & báo giá</h4><p><span>${safe(repairService(x))}</span><b>${money(rev(x))}</b></p><small>QL cửa hàng được xem phần này để báo khách.</small></section>
        ${moneyBlock}
      </div>
    </article>`;
  document.getElementById('detailModal').classList.remove('hidden')
}
function printReceipt(type,id){const x=rows.find(r=>String(r.repairId)===String(id));if(!x)return notifyWarn('Không tìm thấy dữ liệu phiếu để in.','Không in được');const isReturn=type==='return';document.getElementById('printTitle').textContent=isReturn?'Phiếu trả máy':'Phiếu nhận máy';document.getElementById('printContent').innerHTML=`<div class="receipt-head"><h2>POPOPHONE</h2><p>${isReturn?'PHIẾU TRẢ MÁY SỬA CHỮA':'PHIẾU TIẾP NHẬN SỬA CHỮA'}</p></div><div class="receipt-code">${x.repairId}</div><table class="receipt-table"><tr><td>Khách hàng</td><td>${safe(x.customer)} - ${safe(x.phone)}</td></tr><tr><td>Sản phẩm</td><td>${safe(x.product)}</td></tr><tr><td>IMEI</td><td>${safe(x.imei)}</td></tr><tr><td>Chi nhánh</td><td>${safe(x.branch)}</td></tr><tr><td>Ngày nhận</td><td>${fmtDate(x.date)}</td></tr><tr><td>Hẹn trả</td><td>${fmtDate(x.appointment)}</td></tr><tr><td>Tình trạng nhận</td><td>${safe(x.receiveStatus)}</td></tr><tr><td>Yêu cầu sửa chữa</td><td>${safe(x.request)}</td></tr><tr><td>Trạng thái</td><td>${cleanStatus(x.status)}</td></tr><tr><td>Báo giá</td><td>${money(rev(x))}</td></tr>${isReturn?`<tr><td>Tình trạng thực tế</td><td>${safe(x.actualStatus)}</td></tr><tr><td>Kỹ thuật</td><td>${safe(x.technician)}</td></tr><tr><td>Ngày hoàn thành</td><td>${fmtDate(x.completedDate)}</td></tr><tr><td>Thanh toán</td><td>${safe(x.paymentStatus)}</td></tr>`:''}</table><div class="receipt-sign"><span>Khách hàng</span><span>Nhân viên</span></div>`;document.getElementById('printModal').classList.remove('hidden');setTimeout(()=>window.print(),450)}
function closePrint(){document.getElementById('printModal').classList.add('hidden')}
function closeDetail(){document.getElementById('detailModal').classList.add('hidden')}
function renderMaterials(){const box=document.getElementById('materialsList');if(!box)return;const q=(document.getElementById('materialSearch')?.value||'').toLowerCase().trim();const g=document.getElementById('materialGroupFilter')?.value||'';const list=DM_VAT_TU.filter(x=>(!q||[x.name,x.group].join(' ').toLowerCase().includes(q))&&(!g||x.group===g));box.innerHTML=list.map(x=>`<div class="card"><h4>${x.name}</h4><p>${x.group||''}</p></div>`).join('')||'<p class="muted">Không có vật tư phù hợp</p>'}
