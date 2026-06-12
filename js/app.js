const API_URL="/.netlify/functions/repair-api";

const ACCOUNTS = {
  sale:{
    password:"123456",
    name:"SALE / Tiếp nhận",
    role:"sale",
    permissions:["receive","search"]
  },

  kythuat:{
    password:"123456",
    name:"Kỹ thuật",
    role:"tech",
    permissions:["receive","repair","search","worklog"]
  },

  qlcuahang:{
    password:"123456",
    name:"QL cửa hàng",
    role:"store_manager",
    permissions:["dashboard_basic","receive","search"]
  },

  qlkythuat:{
    password:"123456",
    name:"QL kỹ thuật",
    role:"tech_manager",
    permissions:["dashboard_full","repair","money","search","worklog","worklog_manage"]
  },

  admin:{
    password:"123456",
    name:"Admin / Full quyền",
    role:"admin",
    permissions:[
      "dashboard_full",
      "dashboard_basic",
      "receive",
      "repair",
      "money",
      "search",
      "worklog",
      "worklog_manage"
    ]
  }
};

let CURRENT_USER=null,DASH=null,currentRepair=null,currentMoney=null,currentMaterialView="pin";

const titles={overview:["Tổng quan sửa chữa","Dashboard quản trị sửa chữa theo tháng, tuần, dịch vụ, dòng máy và vật tư."],weekly:["Theo tuần","So sánh tuần 1-4/5 trong tháng để nắm nhịp tăng giảm."],services:["Dịch vụ","Biết dịch vụ nào mạnh, yếu, lời hoặc lỗ."],models:["Dòng máy","Xem dịch vụ theo model để đặt vật tư phù hợp."],materials:["Nhu cầu vật tư","Quy đổi dịch vụ theo dòng máy thành số lượng vật tư cần nhập."],techs:["KPI kỹ thuật","Theo dõi hiệu suất từng kỹ thuật."],receive:["Tiếp nhận máy","Tạo phiếu sửa chữa mới."],repair:["Xử lý sửa chữa","Cập nhật trạng thái và dịch vụ."],money:["Chi phí & lợi nhuận","Quản lý vật tư, công thợ và thực thu."],search:["Tra cứu","Tìm và xem chi tiết phiếu sửa."],worklog:["Công sửa chữa","Kỹ thuật ghi công sửa chữa và hoa hồng."]};

document.addEventListener("DOMContentLoaded",()=>{
  const saved = localStorage.getItem("repairUser");

  if(saved && ACCOUNTS[saved]){
    loginAs(saved,false);
  }else{
    localStorage.removeItem("repairUser");
  }
  const d=new Date();
  monthFilter.value=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
  bindLogin();bindTabs();bindForms();
  if(window.worklogForm && worklogForm.date) worklogForm.date.value = new Date().toISOString().slice(0,10);
  if(window.worklogForm){
    ["model","serviceName","technician"].forEach(n=>{
      const el = worklogForm.querySelector(`[name="${n}"]`);
      if(el) el.addEventListener("change", calculateCommissionUI);
      if(el) el.addEventListener("blur", calculateCommissionUI);
    });
  }
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
  const roleLabel = {
    sale:"Chỉ tiếp nhận máy",
    tech:"Tiếp nhận + xử lý sửa chữa",
    store_manager:"Theo dõi tiến độ, số đơn, doanh thu; không thấy lợi nhuận",
    tech_manager:"QL kỹ thuật: xử lý, chi phí, tra cứu, lợi nhuận",
    admin:"Full quyền"
  };
  currentRoleName.textContent=roleLabel[CURRENT_USER.role] || CURRENT_USER.permissions.join(", ");
  applyPermissions();
  if(typeof loadMasterData === "function") loadMasterData();
  loadDashboard();
}

function logout(){
  localStorage.removeItem("repairUser");
  location.reload();
}

function can(permission){
  if(!CURRENT_USER) return false;
  if(permission==="dashboard"){
    return CURRENT_USER.permissions.includes("dashboard_basic") || CURRENT_USER.permissions.includes("dashboard_full");
  }
  if(permission==="dashboard_basic"){
    return CURRENT_USER.permissions.includes("dashboard_basic") || CURRENT_USER.permissions.includes("dashboard_full");
  }
  if(permission==="dashboard_full"){
    return CURRENT_USER.permissions.includes("dashboard_full");
  }
  return CURRENT_USER.permissions.includes(permission);
}

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

  if(window.worklogForm){
    worklogForm.addEventListener("submit",async e=>{
      e.preventDefault();
      if(!can("worklog")) return toast("Không có quyền ghi công sửa chữa","error");
      const data=formData(e.target);
      data.user=CURRENT_USER.username;
      if(!data.technician) data.technician = CURRENT_USER.name || CURRENT_USER.username;
      const r=await api("addWorklog",{data});
      r.ok?(toast("Đã ghi công sửa chữa","ok"),e.target.reset(),worklogForm.date.value=new Date().toISOString().slice(0,10),loadWorklogs(),loadWorklogSummary()):toast(r.message||"Lỗi ghi công","error");
    });
  }

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
  raw = raw || {};

  const byTech = raw.byTech || [];
  const byStatus = raw.byStatus || {};
  const topServices = raw.topServices || [];

  return {
    orders: raw.totalOrders || 0,
    revenue: raw.revenue || 0,
    materialCost: raw.materialCost || 0,
    laborCost: raw.laborCost || 0,
    totalCost: raw.totalCost || 0,
    profit: raw.profit || 0,

    completed: raw.todayCompleted || 0,
    overdue: raw.overdue || 0,
    waitingParts: raw.waitingParts || 0,
    warranty: raw.warrantyBack || 0,

    byTech: byTech,
    byStatus: byStatus,
    topServices: topServices,

    weekly: raw.weekly || [],
    modelStats: raw.modelStats || [],

    matrix: raw.matrix || {
      services: [],
      rows: []
    },

    materialNeeds: raw.materialNeeds || {
      pin: [],
      kinh: [],
      man: [],
      khac: []
    }
  };
}

function renderDashboard(){
  if(!DASH)return;
  const [y,m]=(monthFilter.value||"2026-06").split("-");
  setText("heroMonth",`Tháng ${m}/${y}`);setText("ovOrders",DASH.orders);setText("ovRevenue",vnd(DASH.revenue));setText("ovProfit",secureProfit(DASH.profit));setText("ovMargin",secureMargin(DASH.profit,DASH.revenue));setText("ovOverdue",DASH.overdue);setText("ovWaitingParts",DASH.waitingParts);setText("ovWarranty",DASH.warranty);setText("ovCompleted",DASH.completed);
  renderWeeks();renderTopServices();renderTopModels();renderAlerts();renderTechTables();renderStatuses();renderServicesTable();renderModelsTable();renderMatrix();renderMaterialNeeds();
}

function renderWeeks(){
  const html = DASH.weekly.map(w=>`
    <div class="week-card">
      <strong>Tuần ${w.week}</strong>
      <div class="row"><span>Đơn</span><b>${w.orders}</b></div>
      <div class="row"><span>Doanh thu</span><b>${shortMoney(w.revenue)}</b></div>
      <div class="row"><span>Chi phí</span><b>${canSeeFullMoney()?shortMoney(w.cost):"Ẩn"}</b></div>
      <div class="row"><span>Lợi nhuận</span><b>${canSeeProfit()?shortMoney(w.profit):"Ẩn"}</b></div>
    </div>`).join("");

  if(window.overviewWeeks) overviewWeeks.innerHTML = html;
  if(window.weeklyCards) weeklyCards.innerHTML = html;

  if(window.weeklyTable){
    const rows = [
      ["Đơn sửa", ...DASH.weekly.map(w=>w.orders)],
      ["Doanh thu", ...DASH.weekly.map(w=>shortMoney(w.revenue))],
      ["Chi phí", ...DASH.weekly.map(w=>canSeeFullMoney()?shortMoney(w.cost):"Ẩn")],
      ["Lợi nhuận", ...DASH.weekly.map(w=>canSeeProfit()?shortMoney(w.profit):"Ẩn")]
    ];
    weeklyTable.innerHTML = rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join("")}</tr>`).join("");
  }
}
function renderTopServices(){
  if(!window.topServiceCards) return;
  topServiceCards.innerHTML = DASH.topServices.slice(0,5).map((x,i)=>{
    const mainValue = canSeeProfit() ? shortMoney(x.profit||0) : shortMoney(x.revenue||0);
    const label = canSeeProfit() ? "LN" : "DT";
    return `<div class="rank-item">
      <div class="rank-meta">
        <span>${rank(i)} ${esc(x.name||x.serviceName)}</span>
        <small>${x.count||x.qty||0} đơn • ${vnd(x.revenue||0)}</small>
      </div>
      <b>${label}: ${mainValue}</b>
    </div>`;
  }).join("");
}
function renderTopModels(){if(!window.topModelCards)return;topModelCards.innerHTML=DASH.modelStats.slice(0,5).map((x,i)=>`<div class="rank-item"><div class="rank-meta"><span>${rank(i)} ${esc(x.model)}</span><small>Dịch vụ mạnh: ${esc(x.topService)}</small></div><b>${x.orders} đơn</b></div>`).join("")}
function renderAlerts(){if(!window.alertCards)return;const a=[];if(DASH.overdue>0)a.push(`${DASH.overdue} máy quá hẹn cần xử lý`);if(DASH.waitingParts>0)a.push(`${DASH.waitingParts} máy đang chờ linh kiện`);if(DASH.warranty>0)a.push(`Bảo hành/bảo hành lại: ${DASH.warranty} đơn`);const n=(DASH.materialNeeds.pin||[])[0];if(n)a.push(`Kiểm tra tồn ${n.name}: nhu cầu ${n.need}/tháng`);alertCards.innerHTML=a.map(x=>`<div class="alert-item">🚨 <b>${esc(x)}</b></div>`).join("")}
function renderTechTables(){
  const rows = DASH.byTech.map(x=>{
    const score = canSeeProfit() ? Math.max(0,Math.round((x.completed||0)*2+(x.profit||0)/100000-(x.overdue||0)*3)) : "-";
    return `<tr>
      <td><b>${esc(x.technician)}</b></td>
      <td>${x.total}</td>
      <td>${x.completed}</td>
      <td>${x.overdue}</td>
      <td>${vnd(x.revenue)}</td>
      <td>${canSeeProfit()?vnd(x.profit):"Ẩn"}</td>
      <td><span class="badge">${score}</span></td>
    </tr>`;
  }).join("");

  if(window.overviewTechRows){
    overviewTechRows.innerHTML = rows.replace(/<td><span class="badge">.*?<\/span><\/td>\s*<\/tr>/g,"</tr>");
  }
  if(window.techRows) techRows.innerHTML = rows;
}
function renderStatuses(){if(!window.statusCards)return;statusCards.innerHTML=Object.entries(DASH.byStatus).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="status-item"><span>${esc(k)}</span><b>${v}</b></div>`).join("")}
function renderServicesTable(){
  if(!window.serviceRows) return;
  serviceRows.innerHTML = DASH.topServices.map(x=>{
    const rev = x.revenue || 0;
    const cost = x.cost || Math.round(rev*.48);
    const p = x.profit ?? rev-cost;
    return `<tr>
      <td><b>${esc(x.name)}</b></td>
      <td>${x.count||0}</td>
      <td>${vnd(rev)}</td>
      <td>${canSeeFullMoney()?vnd(cost):"Ẩn"}</td>
      <td>${canSeeProfit()?vnd(p):"Ẩn"}</td>
      <td>${canSeeProfit()?pct(p,rev):"Ẩn"}</td>
    </tr>`;
  }).join("");
}
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

async function globalSearch(){
  if(!can("search")) return toast("Không có quyền tra cứu","error");

  const r = await api("searchRepair",{keyword:globalKeyword.value.trim()});
  if(!r.ok) return toast(r.message || "Lỗi tìm kiếm","error");

  searchRows.innerHTML = (r.results || []).map(x => `
    <tr>
      <td><b>${esc(x.repairId)}</b></td>
      <td>${esc(x.imei)}</td>
      <td>${esc(x.customer)}</td>
      <td>${esc(x.phone)}</td>
      <td>${esc(x.product)}</td>
      <td>${esc(x.status)}</td>
      <td>${esc(x.technician)}</td>
      <td>${esc(x.serviceType || "")}</td>
      <td>${vnd(x.revenue || 0)}</td>
      <td><button class="small-btn" onclick="viewDetail('${jsesc(x.repairId)}')">Xem</button></td>
    </tr>
  `).join("") || `<tr><td colspan="10">Không có kết quả</td></tr>`;
}
async function viewDetail(id){const r=await api("getRepair",{repairId:id});if(!r.ok)return toast(r.message||"Không tải được chi tiết","error");detailBox.classList.remove("hidden");detailBox.innerHTML=`<h3>Phiếu ${esc(id)}</h3>${renderInfo(r.data.info)}`}
function renderInfo(info){
  const items=[
    ["Mã sửa",info.repairId],
    ["IMEI",info.imei],
    ["Khách",info.customer],
    ["SĐT",info.phone],
    ["Sản phẩm",info.product],
    ["Loại DV",info.serviceType],
    ["KTV",info.technician],
    ["Trạng thái",info.status],
    ["Hẹn trả",fmtDate(info.appointment)],
    ["Báo giá / Thực thu",vnd(info.actualRevenue || info.estimate || 0)]
  ];

  if(canSeeFullMoney()) items.push(["Chi phí",vnd(info.totalCost)]);
  if(canSeeProfit()) items.push(["Lợi nhuận",vnd(info.profit)]);

  return `<div class="info-grid">${items.map(([k,v])=>`<div class="info-item"><span>${k}</span><b>${esc(v??"")}</b></div>`).join("")}</div>`;
}

function formData(f){const o={};new FormData(f).forEach((v,k)=>o[k]=v);return o}function money(v){const n=Number(String(v||0).replace(/[^\d.-]/g,""));return isNaN(n)?0:n}function vnd(v){return money(v).toLocaleString("vi-VN")+"đ"}function shortMoney(v){v=money(v);return v>=1e6?(v/1e6).toFixed(v%1e6?1:0)+"tr":vnd(v)}function pct(a,b){a=money(a);b=money(b);return b?((a/b)*100).toFixed(1)+"%":"0%"}function setText(id,v){const el=document.getElementById(id);if(el)el.textContent=v??""}function toast(msg,type="ok"){const t=document.getElementById("toast");t.textContent=msg;t.className=`toast show ${type}`;setTimeout(()=>t.className="toast",3200)}function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}function jsesc(s){return String(s??"").replace(/\\/g,"\\\\").replace(/'/g,"\\'")}function fmtDate(v){if(!v)return"";const d=new Date(v);return isNaN(d)?v:d.toLocaleString("vi-VN")}function rank(i){return["🥇","🥈","🥉"][i]||`${i+1}.`}



/* ===================== V4 FINAL OVERRIDES ===================== */

let MASTER_DATA = {
  statuses:[],
  services:[],
  materials:[],
  technicians:[]
};

function can(permission){
  if(!CURRENT_USER) return false;
  if(permission==="dashboard"){
    return CURRENT_USER.permissions.includes("dashboard_basic") || CURRENT_USER.permissions.includes("dashboard_full");
  }
  if(permission==="dashboard_basic"){
    return CURRENT_USER.permissions.includes("dashboard_basic") || CURRENT_USER.permissions.includes("dashboard_full");
  }
  if(permission==="dashboard_full"){
    return CURRENT_USER.permissions.includes("dashboard_full");
  }
  return CURRENT_USER.permissions.includes(permission);
}

function canSeeProfit(){
  return CURRENT_USER && (CURRENT_USER.role==="admin" || CURRENT_USER.role==="tech_manager");
}

function canSeeFullMoney(){
  return CURRENT_USER && (CURRENT_USER.role==="admin" || CURRENT_USER.role==="tech_manager");
}

function secureMoney(value){
  return canSeeFullMoney() ? vnd(value) : "Ẩn";
}

function secureProfit(value){
  return canSeeProfit() ? vnd(value) : "Ẩn";
}

function secureMargin(profit,revenue){
  return canSeeProfit() ? pct(profit,revenue) : "Ẩn";
}

const oldLoginAsV4 = typeof loginAs === "function" ? loginAs : null;
loginAs = function(username,save){
  CURRENT_USER={username,...ACCOUNTS[username]};
  if(save)localStorage.setItem("repairUser",username);
  loginScreen.classList.add("hidden");
  appRoot.classList.remove("hidden");
  currentUserName.textContent=CURRENT_USER.name;
  const roleLabel={
    sale:"Tiếp nhận máy, in phiếu và tra cứu trạng thái",
    tech:"Tiếp nhận + xử lý sửa chữa + ghi công sửa chữa",
    store_manager:"Nhập phiếu, tra cứu, danh sách đơn; không thấy chi phí/lợi nhuận",
    tech_manager:"QL kỹ thuật: xử lý, chi phí, KPI, công sửa chữa",
    admin:"Full quyền"
  };
  currentRoleName.textContent=roleLabel[CURRENT_USER.role] || CURRENT_USER.permissions.join(", ");
  applyPermissions();
  loadMasterData();
  loadDashboard();
};

applyPermissions = function(){
  document.querySelectorAll("[data-permission]").forEach(el=>{
    const p=el.dataset.permission;
    let allowed=can(p);
    if(!allowed) el.classList.add("hidden");
    else el.classList.remove("hidden");
  });

  let first=document.querySelector(".nav-btn:not(.hidden)");
  document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));
  document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));

  if(first){
    first.classList.add("active");
    const tab=first.dataset.tab;
    document.getElementById(tab).classList.add("active");
    if(typeof titles !== "undefined" && titles[tab]){
      pageTitle.textContent=titles[tab][0];
      pageSub.textContent=titles[tab][1];
    }
  }
};

async function loadMasterData(){
  const res = await api("getMasterData");
  if(res && res.ok){
    MASTER_DATA = res.data || MASTER_DATA;
    fillMasterDropdowns();
  }
}

function fillMasterDropdowns(){
  fillSelectByName("serviceType", MASTER_DATA.serviceTypes || MASTER_DATA.services || []);
  fillSelectByName("status", MASTER_DATA.statuses || []);

  fillInputList("technician", "dlTechnicians", MASTER_DATA.technicians || []);
  fillInputList("serviceName", "dlServices", MASTER_DATA.services || []);
  fillInputList("materialName", "dlMaterials", MASTER_DATA.materials || []);
  fillInputList("materialSupplier", "dlSuppliers", MASTER_DATA.suppliers || []);
}

function getMasterName(x){
  return x?.name || x?.["Tên"] || x?.["Tên dịch vụ"] || x?.["Tên vật tư"] || x?.["Tên kỹ thuật"] || x?.["Trạng thái"] || x?.["Tên NCC"] || x || "";
}

function fillSelectByName(name, list){
  document.querySelectorAll(`[name="${name}"]`).forEach(select=>{
    if(!select || select.tagName !== "SELECT") return;
    const first = select.querySelector('option[value=""]')?.outerHTML || `<option value="">Chọn</option>`;
    select.innerHTML = first + (list||[]).map(x=>{
      const n = getMasterName(x);
      return n ? `<option value="${esc(n)}">${esc(n)}</option>` : "";
    }).join("");
  });
}

function fillInputList(inputId, datalistId, list){
  const input = document.getElementById(inputId) || document.querySelector(`[name="${inputId}"]`);
  if(!input) return;

  let dl = document.getElementById(datalistId);
  if(!dl){
    dl = document.createElement("datalist");
    dl.id = datalistId;
    document.body.appendChild(dl);
  }

  dl.innerHTML = (list||[]).map(x=>{
    const n = getMasterName(x);
    return n ? `<option value="${esc(n)}"></option>` : "";
  }).join("");

  input.setAttribute("list", datalistId);
}

function injectDatalist(id, arr){
  let dl = document.getElementById(id);
  if(!dl){
    dl = document.createElement("datalist");
    dl.id=id;
    document.body.appendChild(dl);
  }
  dl.innerHTML = (arr||[]).filter(Boolean).map(x=>`<option value="${esc(x)}"></option>`).join("");
}

const originalRenderDashboardV4 = typeof renderDashboard === "function" ? renderDashboard : null;
renderDashboard = function(){
  if(originalRenderDashboardV4) originalRenderDashboardV4();

  if(typeof DASH === "undefined" || !DASH) return;
  setText("ovProfit", secureProfit(DASH.profit));
  setText("ovMargin", secureMargin(DASH.profit,DASH.revenue));

  // Hide profit/cost numbers after old render for lower roles
  if(!canSeeProfit()){
    document.querySelectorAll("#overviewTechRows tr").forEach(tr=>{
      const tds=tr.querySelectorAll("td");
      if(tds[5]) tds[5].textContent="Ẩn";
    });
    document.querySelectorAll("#techRows tr").forEach(tr=>{
      const tds=tr.querySelectorAll("td");
      if(tds[5]) tds[5].textContent="Ẩn";
      if(tds[6]) tds[6].textContent="-";
    });
  }
};

const oldRenderInfoV4 = typeof renderInfo === "function" ? renderInfo : null;
renderInfo = function(info){
  const items=[
    ["Mã sửa",info.repairId],
    ["IMEI",info.imei],
    ["Khách",info.customer],
    ["SĐT",info.phone],
    ["Sản phẩm",info.product],
    ["Loại DV",info.serviceType],
    ["KTV",info.technician],
    ["Trạng thái",info.status],
    ["Hẹn trả",fmtDate(info.appointment)],
    ["Báo giá / Thực thu",vnd(info.actualRevenue || info.estimate || 0)]
  ];

  if(canSeeFullMoney()) items.push(["Chi phí",vnd(info.totalCost)]);
  if(canSeeProfit()) items.push(["Lợi nhuận",vnd(info.profit)]);

  return `<div class="info-grid">${items.map(([k,v])=>`<div class="info-item"><span>${k}</span><b>${esc(v??"")}</b></div>`).join("")}</div>`;
};

async function saveReceiveAndPrint(){
  if(!can("receive")) return toast("Không có quyền tiếp nhận","error");
  const form = document.getElementById("receiveForm");
  if(!form) return toast("Không thấy form tiếp nhận","error");

  const data = formData(form);
  if(!data.imei || !data.product || !data.customer || !data.phone){
    return toast("Nhập đủ IMEI, sản phẩm, tên khách, số điện thoại trước khi in","error");
  }

  data.user = CURRENT_USER?.username || "";
  const res = await api("createRepair",{data});
  if(!res.ok) return toast(res.message || "Lỗi lưu phiếu", "error");

  const detail = await api("getRepair",{repairId:res.repairId});
  if(detail.ok){
    toast(`Đã lưu phiếu ${res.repairId}`, "ok");
    form.reset();
    openPrintReceipt(detail.data.info);
    loadDashboard();
  }else{
    toast(`Đã lưu phiếu ${res.repairId}, nhưng chưa tải được phiếu in`, "error");
  }
}

function openPrintReceipt(info){
  const wrap = document.getElementById("repairReceipt");
  if(!wrap) return;
  wrap.innerHTML = buildReceiptHtml(info);
  document.getElementById("printModal").classList.remove("hidden");
}

function closePrintModal(){
  document.getElementById("printModal").classList.add("hidden");
}

function receiptVal(v){
  return esc(v || "");
}

function receiptDate(v){
  if(!v) return "";
  const d = new Date(v);
  return isNaN(d.getTime()) ? esc(v) : d.toLocaleString("vi-VN");
}

function buildReceiptHtml(info){
  const receiveDate = receiptDate(info.receiveDate || info.createdAt);
  const appointment = receiptDate(info.appointment);
  const status = receiptVal(info.receiveStatus);
  const request = receiptVal(info.request);
  const note = receiptVal(info.receiveNote);

  return `
  <div class="receipt">
    <div class="receipt-header">
      <div class="receipt-logo"><div class="pmark">P</div></div>
      <div class="receipt-shop">
        <h1>POPO PHONE</h1>
        <b>Chi nhánh: 113 Yersin, Phú Cường, Thủ Dầu Một, Bình Dương</b><br>
        <b>POPO Phone &nbsp;&nbsp;&nbsp; popophonetdm &nbsp;&nbsp;&nbsp; POPO Phone &nbsp;&nbsp;&nbsp; popophone.vn</b><br>
        <b>Tư vấn bán hàng - Trả góp: 0986.039.179</b>
      </div>
      <div class="receipt-title"><h2>THÔNG TIN SỬA CHỮA</h2></div>
    </div>

    <div class="r-section-title">I. THÔNG TIN KHÁCH HÀNG/ Customer information</div>
    <div class="r-grid">
      <div class="r-cell"><span class="r-label">Họ và tên:</span> ${receiptVal(info.customer)}</div>
      <div class="r-cell"><span class="r-label">Số điện thoại:</span> ${receiptVal(info.phone)}</div>
    </div>
    <div class="r-grid">
      <div class="r-cell"><span class="r-label">Địa chỉ khách hàng:</span></div>
      <div class="r-cell"><span class="r-label">Loại khách:</span> ${receiptVal(info.serviceType)}</div>
    </div>

    <div class="r-section-title">II. THÔNG TIN SẢN PHẨM/ Product information</div>
    <div class="r-grid">
      <div class="r-cell"><span class="r-label">Tên máy:</span> ${receiptVal(info.product)}</div>
      <div class="r-cell"><span class="r-label">Loại dịch vụ:</span> ${receiptVal(info.serviceType)}</div>
    </div>
    <div class="r-grid">
      <div class="r-cell"><span class="r-label">IMEI:</span> ${receiptVal(info.imei)} <span class="r-check"></span></div>
      <div class="r-cell"><span class="r-label">Ngày mua:</span></div>
    </div>

    <div class="r-full"><span class="r-label">Tình trạng máy:</span></div>
    <div class="r-full r-tall">${status}</div>

    <div class="r-grid-4">
      <div class="r-cell"><span class="r-label">FaceID:</span> ${receiptVal(info.faceId || "Không test được")}</div>
      <div class="r-cell"><span class="r-label">Camera:</span> ${receiptVal(info.cameraMic || "Không test được")}</div>
      <div class="r-cell"><span class="r-label">Màn hình:</span> ${receiptVal(info.screen || "Không test được")}</div>
      <div class="r-cell"><span class="r-label">Loa:</span> ${receiptVal(info.speaker || "Không test được")}</div>
    </div>

    <div class="r-full"><span class="r-label">Mô tả lỗi (nếu có):</span> ${status}</div>
    <div class="r-grid">
      <div class="r-cell"><span class="r-label">Yêu cầu sửa chữa:</span> ${request}</div>
      <div class="r-cell"><span class="r-label">Ốp lưng/Sim:</span></div>
    </div>
    <div class="r-full"><span class="r-label">Giá dự kiến:</span> ${vnd(info.estimate)}</div>
    <div class="r-full r-tall"><span class="r-label">Ghi chú cho Kỹ thuật:</span><br>${note}</div>

    <div class="r-grid">
      <div class="r-cell"><span class="r-label">Ngày nhận máy:</span> ${receiveDate}</div>
      <div class="r-cell"><span class="r-label">Dự kiến trả máy:</span> ${appointment}</div>
    </div>

    <div class="r-section-title">III. THÔNG TIN XÁC NHẬN TÌNH TRẠNG SẢN PHẨM/ Products status confirmation information</div>
    <div class="r-sign">
      <div>Nhân viên nhận máy<br><em>(Ký, ghi rõ họ tên)</em><br><br><br>${receiptVal(info.staff)}</div>
      <div>Quản lý<br><em>(Ký, ghi rõ họ tên)</em></div>
      <div>Phần dành cho khách hàng<br><br>
        <span class="r-muted">Tôi đã kiểm tra và đồng ý với tình trạng máy sửa chữa phía trên</span><br>
        <b>Khách hàng</b><br><em>(Ký, ghi rõ họ tên)</em>
      </div>
    </div>

    <div class="r-policy">
      <div class="r-policy-text">
        <b>Không bảo hành trong các trường hợp sau:</b><br>
        - Máy không có hóa đơn, tem rách, máy bung<br>
        - Máy bị vỡ, va đập, vào nước<br>
        - Cửa hàng không chịu trách nhiệm các trường hợp quên iCloud, mật khẩu các loại
      </div>
      <div class="r-qr">
        <div class="qr-box">${receiptVal(info.repairId)}</div>
        <div>Quét mã tra cứu</div>
      </div>
    </div>
    <div class="r-footer">Cảm ơn bạn đã tin tưởng POPO PHONE, chúng tôi luôn nỗ lực mang đến những trải nghiệm tốt với nhất!</div>
  </div>`;
}


/* ===================== V6 WORKLOG ===================== */
async function loadWorklogs(){
  if(!can("worklog") && !can("worklog_manage")) return toast("Không có quyền xem công sửa chữa","error");

  const keyword = window.worklogKeyword ? worklogKeyword.value.trim() : "";
  const r = await api("getWorklogs",{keyword});
  loadWorklogSummary();

  if(!r.ok) return toast(r.message || "Không tải được công sửa chữa","error");

  const rows = r.results || [];
  if(window.worklogRows){
    worklogRows.innerHTML = rows.map(x=>`
      <tr>
        <td>${fmtDate(x.date).split(" ")[0]}</td>
        <td><b>${esc(x.technician)}</b></td>
        <td>${esc(x.model)}</td>
        <td>${esc(x.imei)}</td>
        <td>${esc(x.serviceName)}</td>
        <td>${esc(x.qty || 1)}</td>
        <td>${vnd(x.commission || 0)}</td>
        <td>${esc(x.note || "")}</td>
      </tr>
    `).join("") || `<tr><td colspan="8">Chưa có dữ liệu.</td></tr>`;
  }
}



/* ===================== V6.2 AUTO COMMISSION + SALARY SUMMARY ===================== */
async function calculateCommissionUI(){
  if(!window.worklogForm) return;
  const model = worklogForm.model?.value || "";
  const serviceName = worklogForm.serviceName?.value || "";
  if(!model || !serviceName) return;

  const r = await api("getCommission",{model,serviceName});
  if(r && r.ok && worklogForm.commission){
    worklogForm.commission.value = r.commission || 0;
  }
}

async function loadWorklogSummary(){
  if(!can("worklog") && !can("worklog_manage")) return;

  const technician = window.worklogForm?.technician?.value || "";
  const month = window.monthFilter?.value || "";

  const r = await api("getWorklogSummary",{technician,month});
  if(!r || !r.ok) return;

  setText("wlTotalRows", r.totalRows || 0);
  setText("wlTotalCommission", vnd(r.totalCommission || 0));
  setText("wlBaseSalary", vnd(r.baseSalary || 0));
  setText("wlMealSupport", vnd(r.mealSupport || 0));
  setText("wlGrandTotal", vnd(r.grandTotal || 0));
}
