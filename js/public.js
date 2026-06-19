document.addEventListener('DOMContentLoaded',()=>{
  fillSelect('receiveServiceType',DM_LOAI_DICH_VU);
  document.getElementById('receiveForm').addEventListener('submit',saveReceive);
});
function fillSelect(id,items){const el=document.getElementById(id);el.innerHTML='<option value="">Chọn</option>'+items.map(x=>`<option>${x}</option>`).join('')}
function showPublicTab(id){document.querySelectorAll('.public-tab').forEach(x=>x.classList.remove('active'));document.getElementById(id).classList.add('active');document.querySelectorAll('[data-pubtab]').forEach(b=>b.classList.toggle('active',b.dataset.pubtab===id));}
async function saveReceive(e){
  e.preventDefault();
  const btn=e.submitter||e.target.querySelector('[type="submit"]');
  const old=btn?.textContent;
  if(btn){btn.disabled=true;btn.textContent='Đang lưu...'}
  const f=new FormData(e.target);const data=Object.fromEntries(f.entries());
  const res=await api('createRepair',{data});
  if(btn){btn.disabled=false;btn.textContent=old}
  if(!res.success) return notifyError(res.message||'Không lưu được phiếu. Kiểm tra lại dữ liệu hoặc kết nối API.');
  const repair={...data,repairId:res.repairId,date:new Date().toLocaleString('vi-VN'),status:'1. Đã tiếp nhận',paymentStatus:'Chưa thanh toán'};
  e.target.reset();
  notifySuccess(`Đã tạo phiếu ${res.repairId}\nBấm in phiếu nhận để đưa khách ký.`, 'Tiếp nhận thành công', [
    {label:'In phiếu nhận',className:'primary-btn',onClick:()=>openPublicReceipt(repair,false),close:true},
    {label:'Đóng',className:'ghost-btn',onClick:()=>{},close:true}
  ]);
  setTimeout(()=>openPublicReceipt(repair,true),250);
}
function parsePublicDate(v){if(!v)return '';let d;if(String(v).includes('/')){const [dd,mm,yt]=String(v).split('/');const [yy,t='00:00:00']=(yt||'').split(' ');d=new Date(`${yy}-${mm}-${dd}T${t}`)}else d=new Date(String(v).replace(' ','T'));return isNaN(d)?String(v):d.toLocaleString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}
function cleanStatus(s){return String(s||'').replace(/^\d+\.\s*/,'')||'Chưa rõ'}
function tone(s){s=String(s||'');if(s.startsWith('7.')||s.startsWith('8.'))return 'ok';if(s.startsWith('6.')||s.startsWith('3.')||s.startsWith('4.'))return 'wait';if(s.startsWith('9.')||s.startsWith('10.')||s.startsWith('11.'))return 'bad';return 'run'}
async function publicLookup(){
  const q=document.getElementById('lookupKeyword').value.trim();
  if(!q)return notifyWarn('Nhập mã sửa chữa, IMEI hoặc số điện thoại để tìm.','Thiếu từ khóa');
  const res=await api('search',{q});
  if(!res.success) return notifyError(res.message||'Không tra cứu được dữ liệu.');
  const box=document.getElementById('lookupResult');
  const data=res.data||[];
  if(!data.length){box.innerHTML='<p class="empty-note">Không thấy dữ liệu.</p>'; return notifyWarn('Không tìm thấy phiếu nào khớp từ khóa này.','Không có kết quả')}
  notifySuccess(`Tìm thấy ${data.length} phiếu phù hợp.`, 'Tra cứu xong');
  box.innerHTML=data.map(x=>`<article class="lookup-item"><div><b>${x.product||'Không rõ máy'}</b><span>${x.customer||''} · ${x.phone||''}</span></div><p>${x.repairId||''} · IMEI ${x.imei||''}</p><section><em class="state ${tone(x.status)}">${cleanStatus(x.status)}</em><strong>${money(x.actualRevenue||x.estimate)}</strong></section><small>Hẹn trả: ${parsePublicDate(x.appointment)||'Chưa hẹn'}</small><button class="ghost-btn" onclick='openPublicReceipt(${JSON.stringify(x).replace(/'/g,"&#39;")},false)'>In phiếu nhận</button></article>`).join('')
}
function ensurePublicPrint(){
  let m=document.getElementById('publicPrintModal'); if(m)return m;
  m=document.createElement('div');m.id='publicPrintModal';m.className='print-modal hidden';
  m.innerHTML=`<div class="print-shell"><div class="print-toolbar no-print"><b id="publicPrintTitle">Phiếu nhận</b><div><button class="ghost-btn" onclick="closePublicPrint()">Đóng</button><button class="primary-btn" onclick="window.print()">In</button></div></div><div id="publicPrintContent" class="receipt"></div></div>`;
  document.body.appendChild(m);return m;
}
function val(x,k){return x[k]||x[{repairId:'repairId',customer:'customer',phone:'phone',product:'product',imei:'imei',branch:'branch',date:'date',appointment:'appointment',receiveStatus:'receiveStatus',request:'request',estimate:'estimate',staff:'staff'}[k]]||''}
function openPublicReceipt(x,auto=false){
  const m=ensurePublicPrint();
  document.getElementById('publicPrintContent').innerHTML=`<div class="receipt-head"><h2>POPOPHONE</h2><p>PHIẾU TIẾP NHẬN SỬA CHỮA</p></div><div class="receipt-code">${val(x,'repairId')}</div><table class="receipt-table"><tr><td>Khách hàng</td><td>${val(x,'customer')} - ${val(x,'phone')}</td></tr><tr><td>Sản phẩm</td><td>${val(x,'product')}</td></tr><tr><td>IMEI</td><td>${val(x,'imei')}</td></tr><tr><td>Chi nhánh</td><td>${val(x,'branch')}</td></tr><tr><td>Ngày nhận</td><td>${parsePublicDate(val(x,'date'))||new Date().toLocaleString('vi-VN')}</td></tr><tr><td>Hẹn trả</td><td>${parsePublicDate(val(x,'appointment'))}</td></tr><tr><td>Tình trạng nhận</td><td>${val(x,'receiveStatus')}</td></tr><tr><td>Yêu cầu sửa chữa</td><td>${val(x,'request')}</td></tr><tr><td>Báo giá dự kiến</td><td>${money(val(x,'estimate'))}</td></tr><tr><td>Nhân viên nhận</td><td>${val(x,'staff')}</td></tr></table><div class="receipt-sign"><span>Khách hàng</span><span>Nhân viên</span></div>`;
  m.classList.remove('hidden');
  if(auto) setTimeout(()=>window.print(),500);
}
function closePublicPrint(){document.getElementById('publicPrintModal')?.classList.add('hidden')}
