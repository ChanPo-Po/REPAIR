const API_URL = 'https://script.google.com/macros/s/AKfycbyHLnjGAnk5FcPLQ58Y3PtyFcWxzKaJj7aJ3l6_hkwvhhaoloELmBI_vJOGICLqLuVJVA/exec';
const DEMO_MODE = false;
const DM_LOAI_DICH_VU = ['Khách cũ lấy phí','Sửa chữa mới','Bảo hành','Thay pin miễn phí','Đặc quyền tối thượng','Khách đối tác'];
const DM_DICH_VU = [
['Thay pin KSC','Pin'],['Thay pin KSC DLC','Pin'],['Thay pin Energizer','Pin'],['Thay pin Bison','Pin'],['Thay pin Pisen','Pin'],['Thay pin Pisen DLC','Pin'],['Thay pin thường','Pin'],['Thay pin Maxe DLC','Pin'],['Thay màn LK','Màn hình'],['Thay màn Zin EK','Màn hình'],['Thay màn Zin New','Màn hình'],['Thay màn OLED','Màn hình'],['Thay màn GX','Màn hình'],['Thay màn Incell','Màn hình'],['Thay màn bóc máy','Màn hình'],['Fix màn','Màn hình'],['Ép cổ cáp màn','Màn hình'],['Ép kính','Kính'],['Ép cảm','Kính'],['Thay kính cam','Kính'],['Thay kính lưng','Kính'],['Thay vỏ','Vỏ'],['Thay sườn','Vỏ'],['Thay lưng mắt to','Vỏ'],['Thay lưng mắt nhỏ','Vỏ'],['Thay nắp lưng','Vỏ'],['Đánh bóng vỏ','Vỏ'],['Sửa cam','Camera'],['Sửa cam rung','Camera'],['Thay cam trước','Camera'],['Thay cam sau','Camera'],['Thay cụm camera','Camera'],['Sửa Face ID','FaceID'],['Thay Face ID','FaceID'],['Thay cảm biến','FaceID'],['Sửa cảm biến','FaceID'],['Thay loa trên','Âm thanh'],['Thay loa dưới','Âm thanh'],['Thay mic','Âm thanh'],['Sửa mic audio','Âm thanh'],['Sửa audio','Âm thanh'],['Thay chân sạc','Sạc - kết nối'],['Sửa chân sạc','Sạc - kết nối'],['Sửa sạc không vào','Sạc - kết nối'],['Thay cáp sạc','Sạc - kết nối'],['Thay cáp nguồn','Sạc - kết nối'],['Sửa nguồn','Nguồn - main'],['Sửa mất nguồn','Nguồn - main'],['Sửa treo táo','Nguồn - main'],['Sửa sập nguồn','Nguồn - main'],['Sửa nóng máy','Nguồn - main'],['Sửa hao pin','Nguồn - main'],['Sửa không lên màn','Nguồn - main'],['Sửa Wifi','Chức năng'],['Sửa Bluetooth','Chức năng'],['Sửa sóng','Chức năng'],['Sửa eSIM','Chức năng'],['Sửa rung','Chức năng'],['Sửa NFC','Chức năng'],['Vệ sinh máy','Vệ sinh'],['Vệ sinh sau nước','Vệ sinh'],['Bảo dưỡng máy','Vệ sinh'],['Kiểm tra máy','Vệ sinh'],['Chạy phần mềm','Phần mềm'],['Mở khóa máy','Phần mềm'],['Nâng cấp bộ nhớ','Phần mềm'],['Sao lưu dữ liệu','Phần mềm'],['Khôi phục dữ liệu','Phần mềm'],['Bình thường','Khác'],['Khác','Khác']
].map(x=>({name:x[0],group:x[1]}));
const DM_TRANG_THAI = ['1. Đã tiếp nhận','2. Đang kiểm tra','3. Chờ báo giá','4. Chờ khách duyệt','5. Đang sửa','6. Chờ linh kiện','7. Đã sửa xong','8. Đã trả khách','9. Back lại khách','10. Bảo hành lại','11. Hủy sửa'];
const DM_KY_THUAT = [{name:'Thanh',branch:'113',status:'Đang làm'},{name:'Trường',branch:'113',status:'Đang làm'},{name:'Phong',branch:'113',status:'Đang làm'},{name:'Thành',branch:'113',status:'Đang làm'},{name:'Hà',branch:'113',status:'Đang làm'},{name:'Phan Dương',branch:'Bên ngoài',status:'Đang làm'}];
const DM_VAT_TU = [
['Pin KSC (Gold)','Pin'],['Pin KSC DLC','Pin'],['Pin Energizer','Pin'],['Pin Bison','Pin'],['Pin Pisen','Pin'],['Pin Pisen DLC','Pin'],['Pin Luban','Pin'],['Pin Foxcon','Pin'],['Pin Maxe','Pin'],['Màn LK','Màn hình'],['Màn Zin EK','Màn hình'],['Màn Zin New','Màn hình'],['Màn OLED','Màn hình'],['Màn GX','Màn hình'],['Màn Incell','Màn hình'],['Kính cam','Kính'],['Kính lưng','Kính'],['Kính màn hình','Kính'],['Lưng mắt to','Lưng - vỏ'],['Lưng mắt nhỏ','Lưng - vỏ'],['Vỏ máy','Lưng - vỏ'],['Sườn máy','Lưng - vỏ'],['Camera trước','Camera'],['Camera sau','Camera'],['Cụm camera','Camera'],['Face ID','FaceID'],['Cảm biến tiệm cận','FaceID'],['Cụm Face ID','FaceID'],['Loa trên','Âm thanh'],['Loa dưới','Âm thanh'],['Mic','Âm thanh'],['Audio IC','Âm thanh'],['Chân sạc','Sạc - kết nối'],['Cụm sạc','Sạc - kết nối'],['Cáp sạc','Sạc - kết nối'],['Cáp nguồn','Sạc - kết nối'],['IC nguồn','Nguồn - main'],['IC sóng','Nguồn - main'],['IC Wifi','Nguồn - main'],['IC Audio','Nguồn - main'],['Kính + ron','Kính']
].map(x=>({name:x[0],group:x[1]}));
const DM_NCC = ['Thắng','Vtech','Hồ Chí Trung','Nhà','Mua từ thợ','Maxe','Luban'];
const USERS = {
  kythuat:{pass:'123456',role:'kythuat',name:'Kỹ thuật'},
  qlcuahang:{pass:'123456',role:'qlcuahang',name:'QL cửa hàng'},
  qlkythuat:{pass:'123456',role:'qlkythuat',name:'QL kỹ thuật'},
  admin:{pass:'123456',role:'admin',name:'Admin'}
};
const DEMO_DATA = [
 {branch:'113',repairId:'SC26061800443135D5',imei:'111111',date:'18/06/2026 00:44:31',product:'12promax',customer:'huynh',phone:'909009000',serviceType:'Sửa chữa',receiveStatus:'full chức năng',request:'theo ý khách',receiveNote:'mk:0909',appointment:'2026-06-18 00:44',faceId:'Bình thường',screen:'Bình thường',cameraMic:'Bình thường',speaker:'Bình thường',estimate:1200000,staff:'chan',repairService:'Thay pin KSC',place:'Nội bộ',technician:'Thanh',status:'7. Đã sửa xong',completedDate:'18/06/2026 12:57:33',materialBill:'',materialName:'Pin KSC (Gold)',materialCost:200000,laborCost:20000,totalCost:220000,actualRevenue:1200000,profit:980000,supplier:'',paymentStatus:'Đã thanh toán'}
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

function demoApi(action,payload){ let data=JSON.parse(localStorage.getItem('repairDemoData')||'null')||DEMO_DATA; const save=()=>localStorage.setItem('repairDemoData',JSON.stringify(data)); if(action==='createRepair'){const id='SC'+Date.now().toString().slice(-10); data.unshift({...payload.data,repairId:id,date:new Date().toLocaleString('vi-VN'),status:'1. Đã tiếp nhận',paymentStatus:'Chưa thanh toán',materialCost:0,laborCost:0,totalCost:0,actualRevenue:0,profit:0});save();return Promise.resolve({success:true,repairId:id})} if(action==='search'){const q=(payload.q||'').toLowerCase();return Promise.resolve({success:true,data:data.filter(x=>JSON.stringify(x).toLowerCase().includes(q))})} if(action==='list'){return Promise.resolve({success:true,data})} if(action==='updateStatus'){const x=data.find(i=>i.repairId===payload.repairId);Object.assign(x||{},payload.data);save();return Promise.resolve({success:true})} if(action==='updateCost'){const x=data.find(i=>i.repairId===payload.repairId);Object.assign(x||{},payload.data); if(x){x.totalCost=(+x.materialCost||0)+(+x.laborCost||0);x.profit=(+x.actualRevenue||0)-x.totalCost} save();return Promise.resolve({success:true})} return Promise.resolve({success:true,data}) }
