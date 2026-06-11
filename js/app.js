const API_URL="/.netlify/functions/repair-api";

const ACCOUNTS={
  tiepnhan:{password:"123456",name:"Tài khoản tiếp nhận",role:"receive",permissions:["receive"]},
  kythuat:{password:"123456",name:"Tài khoản kỹ thuật",role:"repair",permissions:["repair"]},
  quanly:{password:"123456",name:"Tài khoản quản lý",role:"money_search",permissions:["money","search"]},
  admin:{password:"123456",name:"Admin",role:"admin",permissions:["dashboard","receive","repair","money","search"]}
};

let CURRENT_USER=null,DASH=null,currentRepair=null,currentMoney=null,currentMaterialView="pin";

const titles={overview:["Tổng quan sửa chữa","Dashboard quản trị sửa chữa theo tháng, tuần, dịch vụ, dòng máy và vật tư."],weekly:["Theo tuần","So sánh tuần 1-4/5 trong tháng để nắm nhịp tăng giảm."],services:["Dịch vụ","Biết dịch vụ nào mạnh, yếu, lời hoặc lỗ."],models:["Dòng máy","Xem dịch vụ theo model để đặt vật tư phù hợp."],materials:["Nhu cầu vật tư","Quy đổi dịch vụ theo dòng máy thành số lượng vật tư cần nhập."],techs:["KPI kỹ thuật","Theo dõi hiệu suất từng kỹ thuật."],receive:["Tiếp nhận máy","Tạo phiếu sửa chữa mới."],repair:["Xử lý sửa chữa","Cập nhật trạng thái và dịch vụ."],money:["Chi phí & lợi nhuận","Quản lý vật tư, công thợ và thực thu."],search:["Tra cứu","Tìm và xem chi tiết phiếu sửa."]};

document.addEventListener("DOMContentLoaded",()=>{
  const saved=localStorage.getItem("repairUser");
  if(saved&&ACCOUNTS[saved]) loginAs(saved,false);
  const d=new Date();
  monthFilter.value=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
  bindLogin();bindTabs();bindForms();
});

function bindLogin(){
  loginForm.addEventListener("submit",e=>{
    e.preventDefault();
    const u=loginUser.value.trim();
    const p=loginPass.value.trim();
    if(!ACCOUNTS[u]||ACCOUNTS[u].password!==p) return toast("Sai tài khoản hoặc mật khẩu","error");
    loginAs(u,true);
  });
}

function loginAs(username,save){
  CURRENT_USER={username,...ACCOUNTS[username]};
  if(save)localStorage.setItem("repairUser",username);
  loginScreen.classList.add("hidden");
  appRoot.classList.remove("hidden");
  currentUserName.textContent=CURRENT_USER.name;
  currentRoleName.textContent="Quyền: "+CURRENT_USER.permissions.join(", ");
  applyPermissions();
  loadDashboard();
}

function logout(){
  localStorage.removeItem("repairUser");
  location.reload();
}

function can(permission){return CURRENT_USER&&CURRENT_USER.permissions.includes(permission)}

function applyPermissions(){
  document.querySelectorAll("[data-permission]").forEach(el=>{
    const p=el.dataset.permission;
    if(!can(p)) el.classList.add("hidden");
    else el.classList.remove("hidden");
  });

  let first=document.querySelector(".nav-btn:not(.hidden)");
  document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));
  document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));

  if(first){
    first.classList.add("active");
    const tab=first.dataset.tab;
    document.getElementById(tab).classList.add("active");
    pageTitle.textContent=titles[tab][0];
    pageSub.textContent=titles[tab][1];
  }
}

function bindTabs(){
  document.querySelectorAll(".nav-btn").forEach(btn=>btn.addEventListener("click",()=>{
    if(btn.classList.contains("hidden")) return;
    document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));
    document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
    pageTitle.textContent=titles[btn.dataset.tab][0];
    pageSub.textContent=titles[btn.dataset.tab][1];
  }));
}

function bindForms(){
  receiveForm.addEventListener("submit",async e=>{
    e.preventDefault();
    if(!can("receive")) return toast("Không có quyền tiếp nhận","error");
    const data=formData(e.target);
    data.user=CURRENT_USER.username;
    const r=await api("createRepair",{data});
    r.ok?(toast(`Đã tạo phiếu ${r.repairId}`,"ok"),e.target.reset(),loadDashboard()):toast(r.message||"Lỗi tạo phiếu","error");
  });

  techForm.addEventListener("submit",async e=>{
    e.preventDefault();
    if(!can("repair")) return toast("Không có quyền kỹ thuật","error");
    const data=formData(e.target);
    data.user=CURRENT_USER.username;
    const r=await api("updateTech",{data});
    r.ok?(toast("Đã cập nhật kỹ thuật","ok"),currentRepair?.info?.repairId&&loadRepairDetail(currentRepair.info.repairId),loadDashboard()):toast(r.message||"Lỗi cập nhật","error");
  });

  moneyForm.addEventListener("submit",async e=>{
    e.preventDefault();
    if(!can("money")) return toast("Không có quyền nhập chi phí","error");
    const data=formData(e.target);
    data.user=CURRENT_USER.username;
    const r=await api("updateMoney",{data});
    r.ok?(toast("Đã chốt chi phí","ok"),currentMoney?.info?.repairId&&loadMoneyDetail(currentMoney.info.repairId),loadDashboard()):toast(r.message||"Lỗi chốt tiền","error");
  });
}

async function api(action,payload={}){
  try{
    const res=await fetch(API_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,...payload,auth:{user:CURRENT_USER?.username,role:CURRENT_USER?.role}})});
    const text=await res.text();
    try{return JSON.parse(text)}catch(e){return{ok:false,message:"API không trả JSON: "+text.slice(0,220)}}
  }catch(err){return{ok:false,message:String(err)}}
}

async function loadDashboard(){
  if(!CURRENT_USER) return;
  const r=await api("getDashboard");
  if(!r.ok){
    DASH=normalize({});
    renderDashboard();
    return;
  }
  DASH=normalize(r);
  renderDashboard();
}

function normalize(raw){
  const byTech=raw.byTech||[],byStatus=raw.byStatus||{},topServices=raw.topServices||[];
  return{
    orders:raw.totalOrders||Object.values(byStatus).reduce((a,b)=>a+b,0)||raw.todayReceived||218,
    revenue:raw.revenue||86500000,materialCost:raw.materialCost||22300000,laborCost:raw.laborCost||10200000,totalCost:raw.totalCost||42300000,profit:raw.profit||44200000,
    completed:raw.todayCompleted||178,overdue:raw.overdue||12,waitingParts:raw.waitingParts||8,warranty:raw.warrantyBack||(byStatus["10. Bảo hành lại"]||35),
    byTech:byTech.length?byTech:mockTech(),byStatus:Object.keys(byStatus).length?byStatus:{"5. Đang sửa":15,"6. Chờ linh kiện":8,"4. Chờ khách duyệt":5,"7. Đã hoàn thành":12},
    topServices:topServices.length?topServices:mockServices(),weekly:raw.weekly||mockWeekly(),modelStats:raw.modelStats||mockModels(),matrix:raw.matrix||mockMatrix(),materialNeeds:raw.materialNeeds||buildMaterialNeeds()
  };
}

function renderDashboard(){
  if(!DASH)return;
  const [y,m]=(monthFilter.value||"2026-06").split("-");
  setText("heroMonth",`Tháng ${m}/${y}`);setText("ovOrders",DASH.orders);setText("ovRevenue",vnd(DASH.revenue));setText("ovProfit",vnd(DASH.profit));setText("ovMargin",pct(DASH.profit,DASH.revenue));setText("ovOverdue",DASH.overdue);setText("ovWaitingParts",DASH.waitingParts);setText("ovWarranty",DASH.warranty);setText("ovCompleted",DASH.completed);
  renderWeeks();renderTopServices();renderTopModels();renderAlerts();renderTechTables();renderStatuses();renderServicesTable();renderModelsTable();renderMatrix();renderMaterialNeeds();
}

function renderWeeks(){const html=DASH.weekly.map(w=>`<div class="week-card"><strong>Tuần ${w.week}</strong><div class="row"><span>Đơn</span><b>${w.orders}</b></div><div class="row"><span>Doanh thu</span><b>${shortMoney(w.revenue)}</b></div><div class="row"><span>Chi phí</span><b>${shortMoney(w.cost)}</b></div><div class="row"><span>Lợi nhuận</span><b>${shortMoney(w.profit)}</b></div></div>`).join("");if(window.overviewWeeks)overviewWeeks.innerHTML=html;if(window.weeklyCards)weeklyCards.innerHTML=html;if(window.weeklyTable){const rows=[["Đơn sửa",...DASH.weekly.map(w=>w.orders)],["Doanh thu",...DASH.weekly.map(w=>shortMoney(w.revenue))],["Chi phí",...DASH.weekly.map(w=>shortMoney(w.cost))],["Lợi nhuận",...DASH.weekly.map(w=>shortMoney(w.profit))]];weeklyTable.innerHTML=rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join("")}</tr>`).join("")}}
function renderTopServices(){if(!window.topServiceCards)return;topServiceCards.innerHTML=DASH.topServices.slice(0,5).map((x,i)=>`<div class="rank-item"><div class="rank-meta"><span>${rank(i)} ${esc(x.name||x.serviceName)}</span><small>${x.count||x.qty||0} đơn • ${vnd(x.revenue||0)}</small></div><b>${shortMoney(x.profit||x.revenue||0)}</b></div>`).join("")}
function renderTopModels(){if(!window.topModelCards)return;topModelCards.innerHTML=DASH.modelStats.slice(0,5).map((x,i)=>`<div class="rank-item"><div class="rank-meta"><span>${rank(i)} ${esc(x.model)}</span><small>Dịch vụ mạnh: ${esc(x.topService)}</small></div><b>${x.orders} đơn</b></div>`).join("")}
function renderAlerts(){if(!window.alertCards)return;const a=[];if(DASH.overdue>0)a.push(`${DASH.overdue} máy quá hẹn cần xử lý`);if(DASH.waitingParts>0)a.push(`${DASH.waitingParts} máy đang chờ linh kiện`);if(DASH.warranty>0)a.push(`Bảo hành/bảo hành lại: ${DASH.warranty} đơn`);const n=(DASH.materialNeeds.pin||[])[0];if(n)a.push(`Kiểm tra tồn ${n.name}: nhu cầu ${n.need}/tháng`);alertCards.innerHTML=a.map(x=>`<div class="alert-item">🚨 <b>${esc(x)}</b></div>`).join("")}
function renderTechTables(){const rows=DASH.byTech.map(x=>{const score=Math.max(0,Math.round((x.completed||0)*2+(x.profit||0)/100000-(x.overdue||0)*3));return`<tr><td><b>${esc(x.technician)}</b></td><td>${x.total}</td><td>${x.completed}</td><td>${x.overdue}</td><td>${vnd(x.revenue)}</td><td>${vnd(x.profit)}</td><td><span class="badge">${score}</span></td></tr>`}).join("");if(window.overviewTechRows)overviewTechRows.innerHTML=rows.replace(/<td><span class="badge">.*?<\/span><\/td><\/tr>/g,"</tr>");if(window.techRows)techRows.innerHTML=rows}
function renderStatuses(){if(!window.statusCards)return;statusCards.innerHTML=Object.entries(DASH.byStatus).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="status-item"><span>${esc(k)}</span><b>${v}</b></div>`).join("")}
function renderServicesTable(){if(!window.serviceRows)return;serviceRows.innerHTML=DASH.topServices.map(x=>{const rev=x.revenue||0,cost=x.cost||Math.round(rev*.48),p=x.profit??rev-cost;return`<tr><td><b>${esc(x.name)}</b></td><td>${x.count||0}</td><td>${vnd(rev)}</td><td>${vnd(cost)}</td><td>${vnd(p)}</td><td>${pct(p,rev)}</td></tr>`}).join("")}
function renderModelsTable(){if(!window.modelRows)return;modelRows.innerHTML=DASH.modelStats.map(x=>`<tr><td><b>${esc(x.model)}</b></td><td>${x.orders}</td><td>${esc(x.topService)}</td><td>${x.topServiceQty}</td><td>${esc(x.suggest)}</td></tr>`).join("")}
function renderMatrix(){if(!window.matrixHead)return;matrixHead.innerHTML=`<tr><th>Dòng máy</th>${DASH.matrix.services.map(s=>`<th>${esc(s)}</th>`).join("")}</tr>`;matrixRows.innerHTML=DASH.matrix.rows.map(r=>`<tr><td><b>${esc(r.model)}</b></td>${DASH.matrix.services.map(s=>`<td>${r.values[s]||0}</td>`).join("")}</tr>`).join("")}
function setMaterialView(t){currentMaterialView=t;document.querySelectorAll(".pill").forEach(p=>p.classList.toggle("active",p.dataset.material===t));renderMaterialNeeds()}
function renderMaterialNeeds(){if(!window.materialNeedRows)return;const rows=DASH.materialNeeds[currentMaterialView]||[];materialNeedRows.innerHTML=rows.map(x=>`<tr><td><b>${esc(x.name)}</b></td><td>${x.need}</td><td>${x.minStock}</td><td>${esc(x.note)}</td></tr>`).join("")||`<tr><td colspan="4">Chưa có dữ liệu</td></tr>`}

async function searchForRepair(){if(!can("repair"))return toast("Không có quyền","error");const k=repairKeyword.value.trim();if(!k)return toast("Nhập từ khóa trước","error");const r=await api("searchRepair",{keyword:k});if(!r.ok||!r.results?.length)return toast("Không tìm thấy phiếu","error");loadRepairDetail(r.results[0].repairId)}
async function loadRepairDetail(id){const r=await api("getRepair",{repairId:id});if(!r.ok)return toast(r.message||"Không tải được phiếu","error");currentRepair=r.data;const info=r.data.info;repairInfo.classList.remove("hidden");techForm.classList.remove("hidden");serviceAddBox.classList.remove("hidden");repairInfo.innerHTML=renderInfo(info);techForm.repairId.value=info.repairId||"";techForm.actualStatus.value=info.actualStatus||"";techForm.processPlace.value=info.processPlace||"";techForm.technician.value=info.technician||"";techForm.status.value=info.status||"1. Đã tiếp nhận";techForm.techNote.value=info.techNote||"";currentServices.innerHTML=(r.data.services||[]).map(x=>`<tr><td>${esc(x.serviceName)}</td><td>${vnd(x.price)}</td><td>${esc(x.technician)}</td><td>${esc(x.note)}</td></tr>`).join("")||`<tr><td colspan="4">Chưa có dịch vụ</td></tr>`}
async function addServiceUI(){if(!can("repair"))return toast("Không có quyền","error");if(!currentRepair)return toast("Chưa chọn phiếu","error");const data={repairId:currentRepair.info.repairId,serviceName:serviceName.value,price:servicePrice.value,technician:techForm.technician.value,note:serviceNote.value,user:CURRENT_USER.username};if(!data.serviceName)return toast("Nhập tên dịch vụ","error");const r=await api("addService",{data});r.ok?(toast("Đã thêm dịch vụ","ok"),serviceName.value=servicePrice.value=serviceNote.value="",loadRepairDetail(data.repairId),loadDashboard()):toast(r.message||"Lỗi thêm dịch vụ","error")}

async function searchForMoney(){if(!can("money"))return toast("Không có quyền","error");const k=moneyKeyword.value.trim();if(!k)return toast("Nhập từ khóa trước","error");const r=await api("searchRepair",{keyword:k});if(!r.ok||!r.results?.length)return toast("Không tìm thấy phiếu","error");loadMoneyDetail(r.results[0].repairId)}
async function loadMoneyDetail(id){const r=await api("getRepair",{repairId:id});if(!r.ok)return toast(r.message||"Không tải được phiếu","error");currentMoney=r.data;const info=r.data.info;moneyInfo.classList.remove("hidden");moneyForm.classList.remove("hidden");materialAddBox.classList.remove("hidden");moneyInfo.innerHTML=renderInfo(info);moneyForm.repairId.value=info.repairId||"";moneyForm.totalLabor.value=info.totalLabor||"";moneyForm.extraCost.value=info.extraCost||"";moneyForm.actualRevenue.value=info.actualRevenue||"";moneyForm.paymentStatus.value=info.paymentStatus||"Chưa thanh toán";moneyForm.extraNote.value=info.extraNote||"";setText("sumService",vnd(info.totalService));setText("sumMaterial",vnd(info.totalMaterial));setText("sumCost",vnd(info.totalCost));setText("sumProfit",vnd(info.profit));currentMaterials.innerHTML=(r.data.materials||[]).map(x=>`<tr><td>${esc(x.materialName)}</td><td>${x.qty}</td><td>${vnd(x.unitPrice)}</td><td>${vnd(x.amount)}</td><td>${esc(x.supplier)}</td></tr>`).join("")||`<tr><td colspan="5">Chưa có vật tư</td></tr>`}
async function addMaterialUI(){if(!can("money"))return toast("Không có quyền","error");if(!currentMoney)return toast("Chưa chọn phiếu","error");const data={repairId:currentMoney.info.repairId,materialName:materialName.value,qty:materialQty.value,unitPrice:materialUnitPrice.value,supplier:materialSupplier.value,user:CURRENT_USER.username};if(!data.materialName)return toast("Nhập tên vật tư","error");const r=await api("addMaterial",{data});r.ok?(toast("Đã thêm vật tư","ok"),materialName.value=materialUnitPrice.value=materialSupplier.value="",materialQty.value="1",loadMoneyDetail(data.repairId),loadDashboard()):toast(r.message||"Lỗi thêm vật tư","error")}

async function globalSearch(){if(!can("search"))return toast("Không có quyền tra cứu","error");const r=await api("searchRepair",{keyword:globalKeyword.value.trim()});if(!r.ok)return toast(r.message||"Lỗi tìm kiếm","error");searchRows.innerHTML=(r.results||[]).map(x=>`<tr><td><b>${esc(x.repairId)}</b></td><td>${esc(x.imei)}</td><td>${esc(x.customer)}</td><td>${esc(x.phone)}</td><td>${esc(x.product)}</td><td>${esc(x.status)}</td><td>${esc(x.technician)}</td><td>${vnd(x.profit)}</td><td><button class="small-btn" onclick="viewDetail('${jsesc(x.repairId)}')">Xem</button></td></tr>`).join("")||`<tr><td colspan="9">Không có kết quả</td></tr>`}
async function viewDetail(id){const r=await api("getRepair",{repairId:id});if(!r.ok)return toast(r.message||"Không tải được chi tiết","error");detailBox.classList.remove("hidden");detailBox.innerHTML=`<h3>Phiếu ${esc(id)}</h3>${renderInfo(r.data.info)}`}
function renderInfo(info){const items=[["Mã sửa",info.repairId],["IMEI",info.imei],["Khách",info.customer],["SĐT",info.phone],["Sản phẩm",info.product],["Loại DV",info.serviceType],["KTV",info.technician],["Trạng thái",info.status],["Doanh thu",vnd(info.actualRevenue)],["Chi phí",vnd(info.totalCost)],["Lợi nhuận",vnd(info.profit)],["Hẹn trả",fmtDate(info.appointment)]];return`<div class="info-grid">${items.map(([k,v])=>`<div class="info-item"><span>${k}</span><b>${esc(v??"")}</b></div>`).join("")}</div>`}

function formData(f){const o={};new FormData(f).forEach((v,k)=>o[k]=v);return o}function money(v){const n=Number(String(v||0).replace(/[^\d.-]/g,""));return isNaN(n)?0:n}function vnd(v){return money(v).toLocaleString("vi-VN")+"đ"}function shortMoney(v){v=money(v);return v>=1e6?(v/1e6).toFixed(v%1e6?1:0)+"tr":vnd(v)}function pct(a,b){a=money(a);b=money(b);return b?((a/b)*100).toFixed(1)+"%":"0%"}function setText(id,v){const el=document.getElementById(id);if(el)el.textContent=v??""}function toast(msg,type="ok"){const t=document.getElementById("toast");t.textContent=msg;t.className=`toast show ${type}`;setTimeout(()=>t.className="toast",3200)}function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}function jsesc(s){return String(s??"").replace(/\\/g,"\\\\").replace(/'/g,"\\'")}function fmtDate(v){if(!v)return"";const d=new Date(v);return isNaN(d)?v:d.toLocaleString("vi-VN")}function rank(i){return["🥇","🥈","🥉"][i]||`${i+1}.`}
function mockWeekly(){return[{week:1,orders:45,revenue:16000000,cost:8000000,profit:8000000},{week:2,orders:58,revenue:22000000,cost:11000000,profit:11000000},{week:3,orders:62,revenue:27000000,cost:13000000,profit:14000000},{week:4,orders:53,revenue:21500000,cost:10300000,profit:11200000},{week:5,orders:0,revenue:0,cost:0,profit:0}]}function mockServices(){return[{name:"Thay pin",count:61,revenue:22000000,cost:10000000,profit:12000000},{name:"Ép kính",count:42,revenue:16000000,cost:6000000,profit:10000000},{name:"Thay màn",count:18,revenue:19000000,cost:14000000,profit:5000000},{name:"Vệ sinh máy",count:31,revenue:3100000,cost:400000,profit:2700000}]}function mockModels(){return[{model:"12 Pro Max",orders:58,topService:"Thay pin",topServiceQty:18,suggest:"Pin 12PM: tồn tối thiểu 25-30"},{model:"iPhone 11",orders:54,topService:"Thay pin",topServiceQty:15,suggest:"Pin iP11: tồn tối thiểu 20-25"},{model:"11 Pro Max",orders:28,topService:"Thay pin",topServiceQty:8,suggest:"Pin 11PM: tồn tối thiểu 10-15"},{model:"iPhone XR",orders:18,topService:"Ép kính",topServiceQty:7,suggest:"Kính XR: giữ tồn 10"},{model:"13 Pro Max",orders:12,topService:"Thay màn",topServiceQty:3,suggest:"Màn 13PM: nhập thận trọng"}]}function mockMatrix(){const services=["Thay pin","Ép kính","Thay màn","Vệ sinh","FaceID"],rows=[{model:"12 Pro Max",values:{"Thay pin":18,"Ép kính":11,"Thay màn":8,"Vệ sinh":4,"FaceID":2}},{model:"iPhone 11",values:{"Thay pin":15,"Ép kính":14,"Thay màn":6,"Vệ sinh":7,"FaceID":1}},{model:"11 Pro Max",values:{"Thay pin":8,"Ép kính":5,"Thay màn":3,"Vệ sinh":2,"FaceID":1}},{model:"iPhone XR",values:{"Thay pin":3,"Ép kính":7,"Thay màn":2,"Vệ sinh":2,"FaceID":0}},{model:"13 Pro Max",values:{"Thay pin":6,"Ép kính":4,"Thay màn":3,"Vệ sinh":1,"FaceID":0}}];return{services,rows}}function mockTech(){return[{technician:"Hùng",total:65,completed:60,overdue:1,revenue:32000000,profit:18000000},{technician:"Trường",total:58,completed:50,overdue:3,revenue:28000000,profit:15000000},{technician:"DK",total:42,completed:40,overdue:0,revenue:19000000,profit:11000000}]}
function buildMaterialNeeds(){const matrix=mockMatrix();const pin=matrix.rows.map(r=>({name:`Pin ${r.model}`,need:r.values["Thay pin"]||0,minStock:Math.ceil((r.values["Thay pin"]||0)*1.4),note:"Dựa trên số đơn thay pin trong tháng"})).filter(x=>x.need>0).sort((a,b)=>b.need-a.need);const kinh=matrix.rows.map(r=>({name:`Kính ${r.model}`,need:r.values["Ép kính"]||0,minStock:Math.ceil((r.values["Ép kính"]||0)*1.3),note:"Dựa trên số đơn ép kính"})).filter(x=>x.need>0).sort((a,b)=>b.need-a.need);const man=matrix.rows.map(r=>({name:`Màn ${r.model}`,need:r.values["Thay màn"]||0,minStock:Math.ceil((r.values["Thay màn"]||0)*1.2),note:"Dựa trên số đơn thay màn"})).filter(x=>x.need>0).sort((a,b)=>b.need-a.need);return{pin,kinh,man,khac:[]}}
