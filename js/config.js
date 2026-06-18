const API_URL = 'https://script.google.com/macros/s/AKfycbyHLnjGAnk5FcPLQ58Y3PtyFcWxzKaJj7aJ3l6_hkwvhhaoloELmBI_vJOGICLqLuVJVA/exec';
const DEMO_MODE = false;
const DM_LOAI_DICH_VU = ['Sửa chữa','Bảo hành','Đặc quyền','Thay pin miễn phí','Khách nội bộ','Khách đối tác'];
const DM_DICH_VU = [
  {name:'Thay pin', group:'Pin', price:''},{name:'Ép kính', group:'Kính', price:''},{name:'Thay màn', group:'Màn', price:''},
  {name:'Sửa nguồn', group:'Main', price:''},{name:'Sửa FaceID', group:'FaceID', price:''},{name:'Sửa camera', group:'Camera', price:''},
  {name:'Sửa loa/ mic', group:'Âm thanh', price:''},{name:'Thay chân sạc', group:'Sạc', price:''},{name:'Vệ sinh máy', group:'Vệ sinh', price:''},{name:'Không sửa được', group:'Khác', price:''}
];
const DM_TRANG_THAI = ['1. Đã tiếp nhận','2. Đang kiểm tra','3. Chờ báo giá','4. Chờ khách duyệt','5. Đang sửa','6. Chờ linh kiện','7. Đã hoàn thành','8. Đã bàn giao','9. Back lại khách','10. Bảo hành lại','11. Hủy sửa'];
const DM_KY_THUAT = [{name:'Thanh',branch:'113',status:'Đang làm'},{name:'Trường',branch:'113',status:'Đang làm'},{name:'Phong',branch:'113',status:'Đang làm'},{name:'Thành',branch:'113',status:'Đang làm'},{name:'Hà',branch:'113',status:'Đang làm'},{name:'Phan Dương',branch:'Bên ngoài',status:'Đang làm'}];
const DM_VAT_TU = [{name:'Pin 12 Pro Max',group:'Pin',model:'12 Pro Max',price:'',supplier:''},{name:'Pin iPhone 11',group:'Pin',model:'iPhone 11',price:'',supplier:''},{name:'Kính 12 Pro Max',group:'Kính',model:'12 Pro Max',price:'',supplier:''},{name:'Màn 12 Pro Max',group:'Màn',model:'12 Pro Max',price:'',supplier:''}];
const DM_NCC = ['Thắng','Vtech','Hồ Chí Trung','Nhà','Mua từ thợ','Maxe','Luban'];
const USERS = {
  kythuat:{pass:'123456',role:'kythuat',name:'Kỹ thuật'},
  qlcuahang:{pass:'123456',role:'qlcuahang',name:'QL cửa hàng'},
  qlkythuat:{pass:'123456',role:'qlkythuat',name:'QL kỹ thuật'},
  admin:{pass:'123456',role:'admin',name:'Admin'}
};
const DEMO_DATA = [
 {repairId:'SC26061403C72B',imei:'24124124',date:'14/06/2026 14:39:14',branch:'113',product:'12PROMAX',customer:'CHAN',phone:'290499294',serviceType:'Thay pin',receiveStatus:'FULL CN, PIN PHÙ',request:'THAY PIN',appointment:'2026-06-15 14:38',faceId:'Bình thường',screen:'Bình thường',cameraMic:'Bình thường',speaker:'Bình thường',estimate:500000,staff:'Trường',actualStatus:'',place:'',technician:'',status:'1. Đã tiếp nhận',techNote:'',serviceTotal:0,materialCost:0,laborCost:0,extraCost:0,totalCost:0,actualRevenue:0,profit:0,paymentStatus:'Chưa thanh toán'},
 {repairId:'SC26061430E133',imei:'111111',date:'14/06/2026 15:07:18',branch:'113',product:'13PROMAX',customer:'Hy',phone:'993749273',serviceType:'Thay chân sạc',receiveStatus:'màn đen',request:'fix màn',appointment:'2026-06-14 15:20',faceId:'Bình thường',screen:'Bình thường',cameraMic:'Bình thường',speaker:'Bình thường',estimate:800000,staff:'Thy',actualStatus:'fix màn',place:'Nội bộ',technician:'Thanh',status:'5. Đang sửa',techNote:'',serviceTotal:1600000,materialCost:0,laborCost:0,extraCost:0,totalCost:0,actualRevenue:0,profit:0,paymentStatus:'Chưa thanh toán'}
];
function money(n){return (Number(n)||0).toLocaleString('vi-VN')+'đ'}

function toast(msg){
  const t=document.getElementById('toast');
  if(!t){ notifyPopup('Thông báo', msg, 'info'); return; }
  t.textContent=msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2200)
}
function ensureNotifyRoot(){
  let root=document.getElementById('notifyModal');
  if(root) return root;
  root=document.createElement('div');
  root.id='notifyModal';
  root.className='notify-modal hidden';
  root.innerHTML=`<div class="notify-card"><button class="notify-x" onclick="closeNotify()">×</button><div id="notifyIcon" class="notify-icon">✓</div><h3 id="notifyTitle">Thông báo</h3><p id="notifyText"></p><div id="notifyActions" class="notify-actions"></div></div>`;
  document.body.appendChild(root);
  return root;
}
function notifyPopup(title,msg,type='info',actions=[]){
  const root=ensureNotifyRoot();
  const icon=document.getElementById('notifyIcon');
  const titleEl=document.getElementById('notifyTitle');
  const textEl=document.getElementById('notifyText');
  const act=document.getElementById('notifyActions');
  root.className='notify-modal '+type;
  icon.textContent= type==='success'?'✓': type==='error'?'!': type==='warn'?'⚠':'i';
  titleEl.textContent=title||'Thông báo';
  textEl.innerHTML=String(msg||'').replace(/\n/g,'<br>');
  act.innerHTML='';
  (actions.length?actions:[{label:'Đã hiểu',className:'primary-btn',onClick:closeNotify}]).forEach(a=>{
    const b=document.createElement('button');
    b.className=a.className||'ghost-btn';
    b.textContent=a.label;
    b.onclick=()=>{ if(a.close!==false) closeNotify(); if(typeof a.onClick==='function') a.onClick(); };
    act.appendChild(b);
  });
}
function closeNotify(){const root=document.getElementById('notifyModal'); if(root)root.classList.add('hidden')}
function notifySuccess(msg,title='Thành công',actions){notifyPopup(title,msg,'success',actions)}
function notifyError(msg,title='Có lỗi xảy ra'){notifyPopup(title,msg,'error')}
function notifyWarn(msg,title='Cần kiểm tra'){notifyPopup(title,msg,'warn')}
async function api(action,payload={}){
  try{
    if(DEMO_MODE){return demoApi(action,payload)}
    const r=await fetch(API_URL,{method:'POST',body:JSON.stringify({action,...payload})});
    const text=await r.text();
    try{return JSON.parse(text)}catch(e){return {success:false,message:'API không trả JSON. Kiểm tra Web App URL / quyền deploy.\n'+text.slice(0,160)}}
  }catch(err){return {success:false,message:'Không kết nối được API. Kiểm tra mạng, API_URL hoặc quyền Web App.\n'+err.message}}
}

function demoApi(action,payload){ let data=JSON.parse(localStorage.getItem('repairDemoData')||'null')||DEMO_DATA; const save=()=>localStorage.setItem('repairDemoData',JSON.stringify(data)); if(action==='createRepair'){const id='SC'+Date.now().toString().slice(-10); data.unshift({...payload.data,repairId:id,date:new Date().toLocaleString('vi-VN'),status:'1. Đã tiếp nhận',paymentStatus:'Chưa thanh toán',serviceTotal:0,materialCost:0,laborCost:0,extraCost:0,totalCost:0,actualRevenue:0,profit:0});save();return Promise.resolve({success:true,repairId:id})} if(action==='search'){const q=(payload.q||'').toLowerCase();return Promise.resolve({success:true,data:data.filter(x=>JSON.stringify(x).toLowerCase().includes(q))})} if(action==='list'){return Promise.resolve({success:true,data})} if(action==='updateStatus'){const x=data.find(i=>i.repairId===payload.repairId);Object.assign(x||{},payload.data);save();return Promise.resolve({success:true})} if(action==='updateCost'){const x=data.find(i=>i.repairId===payload.repairId);Object.assign(x||{},payload.data); if(x){x.totalCost=(+x.materialCost||0)+(+x.laborCost||0)+(+x.extraCost||0);x.profit=(+x.actualRevenue||0)-x.totalCost} save();return Promise.resolve({success:true})} return Promise.resolve({success:true,data}) }
