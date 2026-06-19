
const SHEET_ID = '1ZsLoZF4hVBpSrbna0sZQ-lg9KNI-TkwuUYmiJP885mo';
const TZ = 'GMT+7';
const SHEET_DATA = 'DATA';
const SHEET_LOG = 'LOG_SUA_CHUA';
const SHEET_CT_DICH_VU = 'CT_DICH_VU';
const SHEET_CT_VAT_TU = 'CT_VAT_TU';
const SHEET_DM_TRANG_THAI = 'DM_TRANG_THAI';
const SHEET_DM_DICH_VU = 'DM_DICH_VU';
const SHEET_DM_VAT_TU = 'DM_VAT_TU';
const SHEET_DM_LOAI_DICH_VU = 'DM_LOAI_DICH_VU';
const SHEET_DM_KY_THUAT = 'DM_KY_THUAT';
const SHEET_DM_NCC = 'DM_NCC';

const HEADERS_DATA = ['Mã sửa chữa','IMEI','Ngày nhận','Chi nhánh nhận','Sản phẩm','Tên khách hàng','Số điện thoại','Loại dịch vụ','Tình trạng khi nhận máy','Yêu cầu sửa chữa','Ghi chú tiếp nhận','Hẹn trả','FaceID','Màn hình','Camera/Mic','Loa','Giá dự kiến','Nhân viên tiếp nhận','Dịch vụ sửa chữa','Nơi xử lý','Kỹ thuật xử lý','Trạng thái máy','Ngày hoàn thành','Ngày bàn giao','Trễ hẹn','Ghi chú kỹ thuật','Mã hóa đơn mua vật tư','Tên vật tư','Giá vật tư','Công thợ','Tổng chi phí','Thực thu','Lợi nhuận','NCC','Trạng thái thanh toán','Năm','Tháng','Tuần','Ngày tạo','Ngày cập nhật'];
const HEADERS_LOG = ['ID','Mã sửa chữa','Thời gian','Người thực hiện','Hành động','Nội dung'];
const HEADERS_CT_DICH_VU = ['Mã sửa chữa','Tên dịch vụ','Giá bán','Ghi chú','Người thêm','Ngày thêm'];
const HEADERS_CT_VAT_TU = ['Mã sửa chữa','Mã bill mua vật tư','Tên vật tư','SL','Đơn giá','Thành tiền','NCC','Người thêm','Ngày thêm'];

function doPost(e){
  try{
    setupSheets();
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const action = body.action;
    if(action==='createRepair') return json(createRepair(body.data||{}));
    if(action==='list') return json({success:true,data:listRepairs(body.filter||{})});
    if(action==='search') return json({success:true,data:searchRepairs(body.q)});
    if(action==='getDetail') return json(getDetail(body.repairId));
    if(action==='getLogs') return json(getLogs(body.repairId));
    if(action==='updateStatus') return json(updateStatus(body.repairId,body.data||{}));
    if(action==='updateCost') return json(updateCost(body.repairId,body.data||{}));
    if(action==='addService') return json(addService(body.repairId,body.data||{}));
    if(action==='addMaterial') return json(addMaterial(body.repairId,body.data||{}));
    if(action==='getDashboard' || action==='getAdminDashboard' || action==='getStoreDashboard') return json(getDashboard(body.filter||{}));
    if(action==='getMasters') return json(getMasters());
    return json({success:false,message:'Unknown action: '+action});
  }catch(err){return json({success:false,message:String(err && err.stack || err)})}
}
function doGet(){setupSheets();return json({success:true,message:'POPOPHONE Repair V8.2 API OK'})}
function ss(){return SpreadsheetApp.openById(SHEET_ID)}
function getSheet(name){return ss().getSheetByName(name)}
function json(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON)}
function nowStr(){return Utilities.formatDate(new Date(),TZ,'dd/MM/yyyy HH:mm:ss')}
function num(v){return Number(String(v||0).replace(/[^0-9.-]/g,''))||0}
function safe(v){return v==null?'':v}
function splitList(v){return String(v||'').split(/[,;\n]+/).map(x=>x.trim()).filter(Boolean)}
function statusNo(v){const m=String(v||'').match(/^(\d+)/);return m?Number(m[1]):0}
function isAdminRole(d){return String(d.role||'').toLowerCase()==='admin'}
function ensureSheet(name,headers){const book=ss();let s=book.getSheetByName(name);if(!s)s=book.insertSheet(name);if(s.getLastRow()<1)s.appendRow(headers);return s}
function setupSheets(){
  ensureSheet(SHEET_DATA,HEADERS_DATA);ensureSheet(SHEET_LOG,HEADERS_LOG);ensureSheet(SHEET_CT_DICH_VU,HEADERS_CT_DICH_VU);ensureSheet(SHEET_CT_VAT_TU,HEADERS_CT_VAT_TU);
  seedSheet(SHEET_DM_TRANG_THAI,['Tên trạng thái'],['1. Đã tiếp nhận','2. Đang kiểm tra','3. Chờ báo giá','4. Chờ khách duyệt','5. Đang sửa','6. Chờ linh kiện','7. Đã sửa xong','8. Đã trả khách','9. Back lại khách','10. Bảo hành lại','11. Hủy sửa'].map(x=>[x]));
  seedSheet(SHEET_DM_LOAI_DICH_VU,['Tên loại dịch vụ'],['Khách cũ lấy phí','Sửa chữa mới','Bảo hành','Thay pin miễn phí','Đặc quyền tối thượng','Khách đối tác'].map(x=>[x]));
  seedSheet(SHEET_DM_NCC,['Tên NCC'],['Thắng','Vtech','Hồ Chí Trung','Nhà','Mua từ thợ','Maxe','Luban'].map(x=>[x]));
  seedSheet(SHEET_DM_KY_THUAT,['Tên kỹ thuật','Chi nhánh','Trạng thái'],[['Thanh','113','Đang làm'],['Trường','113','Đang làm'],['Phong','113','Đang làm'],['Thành','113','Đang làm'],['Hà','113','Đang làm'],['Phan Dương','Bên ngoài','Đang làm']]);
  seedSheet(SHEET_DM_DICH_VU,['Tên dịch vụ','Nhóm dịch vụ'],DEFAULT_DICH_VU);
  seedSheet(SHEET_DM_VAT_TU,['Tên vật tư','Nhóm vật tư'],DEFAULT_VAT_TU);
}
function seedSheet(name,headers,rows){let s=ensureSheet(name,headers);if(s.getLastRow()<2 && rows && rows.length)s.getRange(2,1,rows.length,headers.length).setValues(rows)}
function mapHeader(sheetName){const s=getSheet(sheetName);const h=s.getRange(1,1,1,s.getLastColumn()).getValues()[0].map(String);const m={};h.forEach((x,i)=>m[x.trim()]=i);return m}
function getVal(row,m,h){return m[h] == null ? '' : row[m[h]]}
function setVal(sheet,row,m,h,v){if(m[h]!=null)sheet.getRange(row,m[h]+1).setValue(v)}
function parseDate(v){if(!v)return null;if(Object.prototype.toString.call(v)==='[object Date]')return v;let s=String(v);if(s.includes('/')){const p=s.split('/');const d=p[0],mo=p[1],yt=(p[2]||'').split(' ');return new Date(`${yt[0]}-${mo}-${d}T${yt[1]||'00:00:00'}`)}return new Date(s.replace(' ','T'))}
function fmtDate(v){const d=parseDate(v);return d && !isNaN(d) ? Utilities.formatDate(d,TZ,'dd/MM/yyyy HH:mm:ss') : safe(v)}
function rowToObj(r,m){return {
  branch:getVal(r,m,'Chi nhánh nhận'),repairId:getVal(r,m,'Mã sửa chữa'),imei:getVal(r,m,'IMEI'),date:fmtDate(getVal(r,m,'Ngày nhận')),product:getVal(r,m,'Sản phẩm'),customer:getVal(r,m,'Tên khách hàng'),phone:getVal(r,m,'Số điện thoại'),serviceType:getVal(r,m,'Loại dịch vụ'),receiveStatus:getVal(r,m,'Tình trạng khi nhận máy'),request:getVal(r,m,'Yêu cầu sửa chữa'),receiveNote:getVal(r,m,'Ghi chú tiếp nhận'),appointment:getVal(r,m,'Hẹn trả'),faceId:getVal(r,m,'FaceID'),screen:getVal(r,m,'Màn hình'),cameraMic:getVal(r,m,'Camera/Mic'),speaker:getVal(r,m,'Loa'),estimate:num(getVal(r,m,'Giá dự kiến')),staff:getVal(r,m,'Nhân viên tiếp nhận'),repairService:getVal(r,m,'Dịch vụ sửa chữa'),place:getVal(r,m,'Nơi xử lý'),technician:getVal(r,m,'Kỹ thuật xử lý'),status:getVal(r,m,'Trạng thái máy'),completedDate:fmtDate(getVal(r,m,'Ngày hoàn thành')),handoverDate:fmtDate(getVal(r,m,'Ngày bàn giao')),overdue:getVal(r,m,'Trễ hẹn'),techNote:getVal(r,m,'Ghi chú kỹ thuật'),materialBill:getVal(r,m,'Mã hóa đơn mua vật tư'),materialName:getVal(r,m,'Tên vật tư'),materialCost:num(getVal(r,m,'Giá vật tư')),laborCost:num(getVal(r,m,'Công thợ')),extraCost:0,totalCost:num(getVal(r,m,'Tổng chi phí')),actualRevenue:num(getVal(r,m,'Thực thu')),profit:num(getVal(r,m,'Lợi nhuận')),supplier:getVal(r,m,'NCC'),paymentStatus:getVal(r,m,'Trạng thái thanh toán'),year:getVal(r,m,'Năm'),month:getVal(r,m,'Tháng'),week:getVal(r,m,'Tuần'),createdAt:fmtDate(getVal(r,m,'Ngày tạo')),updatedAt:fmtDate(getVal(r,m,'Ngày cập nhật'))
}}
function listRepairs(filter){const s=getSheet(SHEET_DATA);const vals=s.getDataRange().getValues();if(vals.length<=1)return [];const m=mapHeader(SHEET_DATA);let data=vals.slice(1).filter(r=>getVal(r,m,'Mã sửa chữa')).map(r=>rowToObj(r,m)).reverse();if(filter.branch)data=data.filter(x=>String(x.branch)===String(filter.branch));return data}
function searchRepairs(q){q=String(q||'').toLowerCase().trim();if(!q)return [];return listRepairs({}).filter(x=>JSON.stringify(x).toLowerCase().indexOf(q)>-1).slice(0,80)}
function createRepair(d){const now=new Date();const id='SC'+Utilities.formatDate(now,TZ,'yyMMddHHmmss')+Utilities.getUuid().slice(0,4).toUpperCase();const year=Number(Utilities.formatDate(now,TZ,'yyyy')),month=Number(Utilities.formatDate(now,TZ,'M')),week=Number(Utilities.formatDate(now,TZ,'w'));const created=nowStr();const row=HEADERS_DATA.map(h=>{switch(h){case 'Chi nhánh nhận':return d.branch||'';case 'Mã sửa chữa':return id;case 'IMEI':return d.imei||'';case 'Ngày nhận':return created;case 'Sản phẩm':return d.product||'';case 'Tên khách hàng':return d.customer||'';case 'Số điện thoại':return d.phone||'';case 'Loại dịch vụ':return d.serviceType||'';case 'Tình trạng khi nhận máy':return d.receiveStatus||'';case 'Yêu cầu sửa chữa':return d.request||'';case 'Ghi chú tiếp nhận':return d.receiveNote||'';case 'Hẹn trả':return d.appointment||'';case 'FaceID':return d.faceId||'';case 'Màn hình':return d.screen||'';case 'Camera/Mic':return d.cameraMic||'';case 'Loa':return d.speaker||'';case 'Giá dự kiến':return num(d.estimate);case 'Nhân viên tiếp nhận':return d.staff||'';case 'Trạng thái máy':return '1. Đã tiếp nhận';case 'Trạng thái thanh toán':return 'Chưa thanh toán';case 'Năm':return year;case 'Tháng':return month;case 'Tuần':return week;case 'Ngày tạo':return created;case 'Ngày cập nhật':return created;case 'Trễ hẹn':return 'Không';case 'Tổng chi phí':case 'Thực thu':case 'Lợi nhuận':case 'Giá vật tư':case 'Công thợ':return 0;default:return ''}});getSheet(SHEET_DATA).appendRow(row);addLog(id,d.staff||'Sale','Tiếp nhận','Tạo phiếu tiếp nhận');return {success:true,repairId:id}}
function findRow(id){const s=getSheet(SHEET_DATA);const m=mapHeader(SHEET_DATA);if(m['Mã sửa chữa']==null)return -1;const vals=s.getRange(1,m['Mã sửa chữa']+1,s.getLastRow(),1).getValues().flat().map(String);const idx=vals.indexOf(String(id));return idx>=0?idx+1:-1}
function updateStatus(id,d){
  const s=getSheet(SHEET_DATA);const row=findRow(id);if(row<2)return {success:false,message:'Không tìm thấy phiếu'};
  const m=mapHeader(SHEET_DATA);
  const current=s.getRange(row,1,1,s.getLastColumn()).getValues()[0];
  const service = d.repairService ?? d.serviceName ?? d.service ?? getVal(current,m,'Dịch vụ sửa chữa');
  const place = d.place ?? d.processPlace ?? getVal(current,m,'Nơi xử lý');
  const technician = d.technician ?? getVal(current,m,'Kỹ thuật xử lý');
  const status = d.status ?? getVal(current,m,'Trạng thái máy');
  const oldStatus = getVal(current,m,'Trạng thái máy');
  const oldNo=statusNo(oldStatus), newNo=statusNo(status);
  if(!isAdminRole(d) && oldNo && newNo && oldStatus!==status){
    const ok = (newNo>=oldNo && newNo<=oldNo+2) || [6,9,10,11].indexOf(newNo)>-1 || (newNo===8 && oldNo===7);
    if(!ok) return {success:false,message:'Sai luồng trạng thái. Admin mới được nhảy trạng thái đặc biệt.'};
  }
  const techNote = d.techNote ?? getVal(current,m,'Ghi chú kỹ thuật');
  setVal(s,row,m,'Dịch vụ sửa chữa',service||'');
  if(d.estimate!==undefined) setVal(s,row,m,'Giá dự kiến',num(d.estimate));
  setVal(s,row,m,'Nơi xử lý',place||'');
  setVal(s,row,m,'Kỹ thuật xử lý',technician||'');
  setVal(s,row,m,'Trạng thái máy',status||'');
  setVal(s,row,m,'Ghi chú kỹ thuật',techNote||'');
  const now=nowStr(); setVal(s,row,m,'Ngày cập nhật',now);
  if(String(status||'').startsWith('7.')) setVal(s,row,m,'Ngày hoàn thành',now);
  if(String(status||'').startsWith('8.')) setVal(s,row,m,'Ngày bàn giao',now);
  const app=parseDate(getVal(current,m,'Hẹn trả'));
  const closed=/^(7|8|9|11)\./.test(String(status||''));
  setVal(s,row,m,'Trễ hẹn',app && !closed && app<new Date()?'Có':'Không');
  // Đồng bộ CT_DICH_VU theo DATA mới: mỗi dịch vụ là 1 dòng, không gom chuỗi.
  splitList(service).forEach(sv=>appendServiceIfMissing(id, sv, num(d.estimate), techNote||'', technician||'Kỹ thuật'));
  addLog(id,technician||'Kỹ thuật','Cập nhật trạng thái',(status||'')+(service?' | DV: '+service:'')+(techNote?' | '+techNote:''));
  return {success:true}
}
function updateCost(id,d){
  const s=getSheet(SHEET_DATA);const row=findRow(id);if(row<2)return {success:false,message:'Không tìm thấy phiếu'};
  const m=mapHeader(SHEET_DATA);
  const current=s.getRange(row,1,1,s.getLastColumn()).getValues()[0];
  const currentStatus=getVal(current,m,'Trạng thái máy');
  if(String(currentStatus||'').startsWith('8.') && !isAdminRole(d)){
    return {success:false,message:'Phiếu đã trả khách. Chỉ Admin mới được sửa lại chi phí sau khi trả khách.'};
  }
  const materialBill = d.materialBill ?? d.bill ?? d.billCode ?? '';
  const materialName = d.materialName ?? d.name ?? '';
  const material = num(d.materialCost ?? d.materialPrice ?? d.price);
  const labor = num(d.laborCost ?? d.labor);
  const actual = num(d.actualRevenue ?? d.revenue ?? d.thucThu);
  const total = material + labor;
  const profit = actual - total;
  const supplier = d.supplier ?? d.ncc ?? '';
  setVal(s,row,m,'Mã hóa đơn mua vật tư',materialBill);
  setVal(s,row,m,'Tên vật tư',materialName);
  setVal(s,row,m,'Giá vật tư',material);
  setVal(s,row,m,'Công thợ',labor);
  setVal(s,row,m,'Tổng chi phí',total);
  setVal(s,row,m,'Thực thu',actual);
  setVal(s,row,m,'Lợi nhuận',profit);
  setVal(s,row,m,'NCC',supplier);
  setVal(s,row,m,'Trạng thái thanh toán',d.paymentStatus||'');
  setVal(s,row,m,'Ngày cập nhật',nowStr());
  // Đồng bộ CT_VAT_TU theo DATA mới: mỗi vật tư là 1 dòng. Nếu nhập nhiều tên bằng dấu phẩy thì chia đều giá.
  const mats=splitList(materialName);
  if(mats.length){
    const each=mats.length?material/mats.length:material;
    mats.forEach(mat=>appendMaterialIfMissing(id, materialBill, mat, d.qty||1, each, each, supplier, d.user||'QLKT/Admin'));
  }
  addLog(id,d.user||'QLKT/Admin','Cập nhật chi phí','Bill '+materialBill+' | VT: '+materialName+' | Vật tư '+material+' | Công '+labor+' | Thực thu '+actual+' | Tổng chi phí '+total+' | Lợi nhuận '+profit+' | NCC '+supplier);
  return {success:true}
}
function addService(id,d){
  const now=nowStr(); const name=d.name||d.serviceName||d.repairService||''; const price=num(d.price||d.estimate);
  if(!name) return {success:false,message:'Thiếu tên dịch vụ'};
  splitList(name).forEach(sv=>appendServiceIfMissing(id,sv,price,d.note||'',d.user||''));
  const s=getSheet(SHEET_DATA); const row=findRow(id); if(row>=2){
    const m=mapHeader(SHEET_DATA); const cur=s.getRange(row,1,1,s.getLastColumn()).getValues()[0];
    const old=String(getVal(cur,m,'Dịch vụ sửa chữa')||'').trim();
    const next=old ? (old.includes(name)?old:old+', '+name) : name;
    setVal(s,row,m,'Dịch vụ sửa chữa',next);
    if(price) setVal(s,row,m,'Giá dự kiến',price);
    setVal(s,row,m,'Ngày cập nhật',now);
  }
  addLog(id,d.user||'Kỹ thuật','Thêm dịch vụ',name+' '+price);
  return {success:true}
}
function addMaterial(id,d){
  const qty=num(d.qty)||1, price=num(d.price||d.unitPrice||d.materialCost), total=qty*price, now=nowStr();
  const bill=d.bill||d.materialBill||d.billCode||'', name=d.name||d.materialName||'', supplier=d.supplier||d.ncc||'';
  if(!name) return {success:false,message:'Thiếu tên vật tư'};
  getSheet(SHEET_CT_VAT_TU).appendRow([id,bill,name,qty,price,total,supplier,d.user||'',now]);
  const s=getSheet(SHEET_DATA); const row=findRow(id); if(row>=2){
    const m=mapHeader(SHEET_DATA); const cur=s.getRange(row,1,1,s.getLastColumn()).getValues()[0];
    const oldBill=String(getVal(cur,m,'Mã hóa đơn mua vật tư')||'').trim();
    const oldName=String(getVal(cur,m,'Tên vật tư')||'').trim();
    const oldSupplier=String(getVal(cur,m,'NCC')||'').trim();
    const nextBill=oldBill ? (bill && !oldBill.includes(bill)?oldBill+', '+bill:oldBill) : bill;
    const nextName=oldName ? (oldName.includes(name)?oldName:oldName+', '+name) : name;
    const nextSupplier=oldSupplier ? (supplier && !oldSupplier.includes(supplier)?oldSupplier+', '+supplier:oldSupplier) : supplier;
    const material=num(getVal(cur,m,'Giá vật tư'))+total;
    const labor=num(getVal(cur,m,'Công thợ'));
    const actual=num(getVal(cur,m,'Thực thu'));
    const cost=material+labor;
    setVal(s,row,m,'Mã hóa đơn mua vật tư',nextBill);
    setVal(s,row,m,'Tên vật tư',nextName);
    setVal(s,row,m,'Giá vật tư',material);
    setVal(s,row,m,'NCC',nextSupplier);
    setVal(s,row,m,'Tổng chi phí',cost);
    setVal(s,row,m,'Lợi nhuận',actual-cost);
    setVal(s,row,m,'Ngày cập nhật',now);
  }
  addLog(id,d.user||'QLKT/Admin','Thêm vật tư',name+' '+qty+'x'+price+' | '+supplier);
  return {success:true}
}

function appendServiceIfMissing(id,name,price,note,user){
  splitList(name).forEach(one=>{
    const sv=String(one||'').trim(); if(!sv) return;
    const sheet=getSheet(SHEET_CT_DICH_VU); const vals=sheet.getDataRange().getValues();
    const exists=vals.slice(1).some(r=>String(r[0])===String(id)&&String(r[1]).trim().toLowerCase()===sv.toLowerCase());
    if(!exists) sheet.appendRow([id,sv,num(price),note||'',user||'',nowStr()]);
  });
}
function appendMaterialIfMissing(id,bill,name,qty,price,total,supplier,user){
  name=String(name||'').trim(); if(!name) return;
  bill=String(bill||'').trim(); supplier=String(supplier||'').trim();
  qty=num(qty)||1; price=num(price); total=num(total)||qty*price;
  const sheet=getSheet(SHEET_CT_VAT_TU); const vals=sheet.getDataRange().getValues();
  const exists=vals.slice(1).some(r=>String(r[0])===String(id)&&String(r[1]).trim()===bill&&String(r[2]).trim().toLowerCase()===name.toLowerCase()&&num(r[5])===total);
  if(!exists) sheet.appendRow([id,bill,name,qty,price,total,supplier,user||'',nowStr()]);
}

function getDetail(id){const item=listRepairs({}).find(x=>String(x.repairId)===String(id));return {success:!!item,data:item||null,logs:getLogs(id).data||[],services:getRowsByRepair(SHEET_CT_DICH_VU,id),materials:getRowsByRepair(SHEET_CT_VAT_TU,id)}}
function getRowsByRepair(sheetName,id){const s=getSheet(sheetName);const vals=s.getDataRange().getValues();if(vals.length<=1)return [];const h=vals[0];return vals.slice(1).filter(r=>String(r[0])===String(id)).map(r=>{const o={};h.forEach((x,i)=>o[x]=r[i]);return o})}
function getLogs(id){const s=getSheet(SHEET_LOG);const vals=s.getDataRange().getValues();if(vals.length<=1)return {success:true,data:[]};const h=vals[0],idx=h.indexOf('Mã sửa chữa');const data=vals.slice(1).filter(r=>String(r[idx])===String(id)).map(r=>({id:r[0],repairId:r[1],time:fmtDate(r[2]),user:r[3],action:r[4],content:r[5]}));return {success:true,data}}
function addLog(id,user,action,content){getSheet(SHEET_LOG).appendRow([Utilities.getUuid(),id,nowStr(),user,action,content])}
function rowsOf(name){const s=getSheet(name);const vals=s.getDataRange().getValues();if(vals.length<=1)return [];const h=vals[0];return vals.slice(1).filter(r=>r.some(x=>x!==''&&x!=null)).map(r=>{const o={};h.forEach((x,i)=>o[x]=r[i]);return o})}
function getMasters(){return {success:true,data:{trangThai:rowsOf(SHEET_DM_TRANG_THAI),loaiDichVu:rowsOf(SHEET_DM_LOAI_DICH_VU),dichVu:rowsOf(SHEET_DM_DICH_VU),vatTu:rowsOf(SHEET_DM_VAT_TU),kyThuat:rowsOf(SHEET_DM_KY_THUAT),ncc:rowsOf(SHEET_DM_NCC)}}}
function getDashboard(filter){return {success:true,data:{repairs:listRepairs(filter||{}),masters:getMasters().data}}}

const DEFAULT_DICH_VU = [
['Thay pin KSC','Pin'],['Thay pin KSC DLC','Pin'],['Thay pin Energizer','Pin'],['Thay pin Bison','Pin'],['Thay pin Pisen','Pin'],['Thay pin Pisen DLC','Pin'],['Thay pin thường','Pin'],['Thay pin Maxe DLC','Pin'],['Thay màn LK','Màn hình'],['Thay màn Zin EK','Màn hình'],['Thay màn Zin New','Màn hình'],['Thay màn OLED','Màn hình'],['Thay màn GX','Màn hình'],['Thay màn Incell','Màn hình'],['Thay màn bóc máy','Màn hình'],['Fix màn','Màn hình'],['Ép cổ cáp màn','Màn hình'],['Ép kính','Kính'],['Ép cảm','Kính'],['Thay kính cam','Kính'],['Thay kính lưng','Kính'],['Thay vỏ','Vỏ'],['Thay sườn','Vỏ'],['Thay lưng mắt to','Vỏ'],['Thay lưng mắt nhỏ','Vỏ'],['Thay nắp lưng','Vỏ'],['Đánh bóng vỏ','Vỏ'],['Sửa cam','Camera'],['Sửa cam rung','Camera'],['Thay cam trước','Camera'],['Thay cam sau','Camera'],['Thay cụm camera','Camera'],['Sửa Face ID','FaceID'],['Thay Face ID','FaceID'],['Thay cảm biến','FaceID'],['Sửa cảm biến','FaceID'],['Thay loa trên','Âm thanh'],['Thay loa dưới','Âm thanh'],['Thay mic','Âm thanh'],['Sửa mic audio','Âm thanh'],['Sửa audio','Âm thanh'],['Thay chân sạc','Sạc - kết nối'],['Sửa chân sạc','Sạc - kết nối'],['Sửa sạc không vào','Sạc - kết nối'],['Thay cáp sạc','Sạc - kết nối'],['Thay cáp nguồn','Sạc - kết nối'],['Sửa nguồn','Nguồn - main'],['Sửa mất nguồn','Nguồn - main'],['Sửa treo táo','Nguồn - main'],['Sửa sập nguồn','Nguồn - main'],['Sửa nóng máy','Nguồn - main'],['Sửa hao pin','Nguồn - main'],['Sửa không lên màn','Nguồn - main'],['Sửa Wifi','Chức năng'],['Sửa Bluetooth','Chức năng'],['Sửa sóng','Chức năng'],['Sửa eSIM','Chức năng'],['Sửa rung','Chức năng'],['Sửa NFC','Chức năng'],['Vệ sinh máy','Vệ sinh'],['Vệ sinh sau nước','Vệ sinh'],['Bảo dưỡng máy','Vệ sinh'],['Kiểm tra máy','Vệ sinh'],['Chạy phần mềm','Phần mềm'],['Mở khóa máy','Phần mềm'],['Nâng cấp bộ nhớ','Phần mềm'],['Sao lưu dữ liệu','Phần mềm'],['Khôi phục dữ liệu','Phần mềm'],['Bình thường','Khác'],['Khác','Khác']
];
const DEFAULT_VAT_TU = [
['Pin KSC (Gold)','Pin'],['Pin KSC DLC','Pin'],['Pin Energizer','Pin'],['Pin Bison','Pin'],['Pin Pisen','Pin'],['Pin Pisen DLC','Pin'],['Pin Luban','Pin'],['Pin Foxcon','Pin'],['Pin Maxe','Pin'],['Màn LK','Màn hình'],['Màn Zin EK','Màn hình'],['Màn Zin New','Màn hình'],['Màn OLED','Màn hình'],['Màn GX','Màn hình'],['Màn Incell','Màn hình'],['Kính cam','Kính'],['Kính lưng','Kính'],['Kính màn hình','Kính'],['Lưng mắt to','Lưng - vỏ'],['Lưng mắt nhỏ','Lưng - vỏ'],['Vỏ máy','Lưng - vỏ'],['Sườn máy','Lưng - vỏ'],['Camera trước','Camera'],['Camera sau','Camera'],['Cụm camera','Camera'],['Face ID','FaceID'],['Cảm biến tiệm cận','FaceID'],['Cụm Face ID','FaceID'],['Loa trên','Âm thanh'],['Loa dưới','Âm thanh'],['Mic','Âm thanh'],['Audio IC','Âm thanh'],['Chân sạc','Sạc - kết nối'],['Cụm sạc','Sạc - kết nối'],['Cáp sạc','Sạc - kết nối'],['Cáp nguồn','Sạc - kết nối'],['IC nguồn','Nguồn - main'],['IC sóng','Nguồn - main'],['IC Wifi','Nguồn - main'],['IC Audio','Nguồn - main'],['Kính + ron','Kính']
];
