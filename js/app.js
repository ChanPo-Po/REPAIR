const API_URL = "/.netlify/functions/repair-api";

let currentTechRepair = null;
let currentMoneyRepair = null;

const titles = {
  dashboard: ["Dashboard vận hành", "Theo dõi sửa chữa, vật tư, công thợ và lợi nhuận."],
  receive: ["Tiếp nhận máy", "Tạo phiếu sửa chữa mới cho sale/nhân viên."],
  tech: ["Kỹ thuật xử lý", "Cập nhật trạng thái và thêm dịch vụ sửa chữa."],
  money: ["Chi phí & Lợi nhuận", "Quản lý vật tư, công thợ, thực thu và lợi nhuận."],
  search: ["Tra cứu phiếu", "Tìm kiếm và xem chi tiết phiếu sửa chữa."]
};

document.addEventListener("DOMContentLoaded", () => {
  bindTabs();
  bindForms();
  loadDashboard();
});

function bindTabs(){
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-page").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      const tab = btn.dataset.tab;
      document.getElementById(tab).classList.add("active");
      document.getElementById("pageTitle").textContent = titles[tab][0];
      document.getElementById("pageSub").textContent = titles[tab][1];
      if(tab === "dashboard") loadDashboard();
    });
  });
}

function bindForms(){
  document.getElementById("receiveForm").addEventListener("submit", async e => {
    e.preventDefault();
    const data = formData(e.target);
    const res = await api("createRepair", { data });
    if(res.ok){
      toast(`Đã tạo phiếu ${res.repairId}`, "ok");
      e.target.reset();
      loadDashboard();
    }else toast(res.message || "Lỗi tạo phiếu", "error");
  });

  document.getElementById("techForm").addEventListener("submit", async e => {
    e.preventDefault();
    const data = formData(e.target);
    const res = await api("updateTech", { data });
    if(res.ok){
      toast("Đã cập nhật kỹ thuật", "ok");
      await reloadCurrentTech();
      loadDashboard();
    }else toast(res.message || "Lỗi cập nhật", "error");
  });

  document.getElementById("moneyForm").addEventListener("submit", async e => {
    e.preventDefault();
    const data = formData(e.target);
    const res = await api("updateMoney", { data });
    if(res.ok){
      toast("Đã chốt chi phí", "ok");
      await reloadCurrentMoney();
      loadDashboard();
    }else toast(res.message || "Lỗi chốt tiền", "error");
  });
}

async function api(action, payload = {}){
  try{
    const res = await fetch(API_URL, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ action, ...payload })
    });
    const text = await res.text();
    try{
      return JSON.parse(text);
    }catch(e){
      return { ok:false, message:"API không trả JSON: " + text.slice(0,200) };
    }
  }catch(err){
    return { ok:false, message:String(err) };
  }
}

function formData(form){
  const fd = new FormData(form);
  const obj = {};
  fd.forEach((v,k) => obj[k] = v);
  return obj;
}

function money(v){
  const n = Number(String(v || 0).replace(/[^\d.-]/g,""));
  return isNaN(n) ? 0 : n;
}

function vnd(v){
  return money(v).toLocaleString("vi-VN") + "đ";
}

function toast(msg, type="ok"){
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = `toast show ${type}`;
  setTimeout(() => t.className = "toast", 3200);
}

async function loadDashboard(){
  const res = await api("getDashboard");
  if(!res.ok){
    toast(res.message || "Không tải được dashboard", "error");
    return;
  }

  setText("mTodayReceived", res.todayReceived);
  setText("mTodayCompleted", res.todayCompleted);
  setText("mTodayDelivered", res.todayDelivered);
  setText("mOverdue", res.overdue);
  setText("mWaitingParts", res.waitingParts);
  setText("mWarrantyBack", res.warrantyBack);
  setText("mRevenue", vnd(res.revenue));
  setText("mMaterialCost", vnd(res.materialCost));
  setText("mLaborCost", vnd(res.laborCost));
  setText("mProfit", vnd(res.profit));

  const rows = (res.byTech || []).map(x => `
    <tr>
      <td><b>${escapeHtml(x.technician)}</b></td>
      <td>${x.total}</td>
      <td>${x.completed}</td>
      <td>${x.overdue}</td>
      <td>${vnd(x.revenue)}</td>
      <td>${vnd(x.profit)}</td>
    </tr>
  `).join("");

  document.getElementById("techDashboardRows").innerHTML = rows || `<tr><td colspan="6">Chưa có dữ liệu</td></tr>`;
}

function setText(id, val){
  document.getElementById(id).textContent = val ?? "";
}

async function searchForTech(){
  const keyword = document.getElementById("techKeyword").value.trim();
  if(!keyword) return toast("Nhập mã/IMEI/SĐT trước", "error");

  const res = await api("searchRepair", { keyword });
  if(!res.ok) return toast(res.message || "Lỗi tìm kiếm", "error");
  if(!res.results.length) return toast("Không tìm thấy phiếu", "error");

  await loadTechRepair(res.results[0].repairId);
}

async function loadTechRepair(repairId){
  const res = await api("getRepair", { repairId });
  if(!res.ok) return toast(res.message || "Không tải được phiếu", "error");

  currentTechRepair = res.data;
  const info = res.data.info;

  document.getElementById("techResult").classList.remove("hidden");
  document.getElementById("techForm").classList.remove("hidden");
  document.getElementById("serviceBox").classList.remove("hidden");

  document.getElementById("techResult").innerHTML = renderInfo(info);

  const f = document.getElementById("techForm");
  f.repairId.value = info.repairId || "";
  f.actualStatus.value = info.actualStatus || "";
  f.processPlace.value = info.processPlace || "";
  f.technician.value = info.technician || "";
  f.status.value = info.status || "1. Đã tiếp nhận";
  f.techNote.value = info.techNote || "";

  renderServices(res.data.services || []);
}

async function reloadCurrentTech(){
  if(currentTechRepair?.info?.repairId){
    await loadTechRepair(currentTechRepair.info.repairId);
  }
}

async function addServiceUI(){
  if(!currentTechRepair) return toast("Chưa chọn phiếu", "error");

  const repairId = currentTechRepair.info.repairId;
  const tech = document.getElementById("techForm").technician.value;
  const data = {
    repairId,
    serviceName: document.getElementById("serviceName").value,
    price: document.getElementById("servicePrice").value,
    technician: tech,
    note: document.getElementById("serviceNote").value
  };

  if(!data.serviceName) return toast("Nhập tên dịch vụ", "error");

  const res = await api("addService", { data });
  if(res.ok){
    toast("Đã thêm dịch vụ", "ok");
    document.getElementById("serviceName").value = "";
    document.getElementById("servicePrice").value = "";
    document.getElementById("serviceNote").value = "";
    await reloadCurrentTech();
  }else toast(res.message || "Lỗi thêm dịch vụ", "error");
}

function renderServices(items){
  document.getElementById("serviceRows").innerHTML = (items || []).map(x => `
    <tr>
      <td>${escapeHtml(x.serviceName)}</td>
      <td>${vnd(x.price)}</td>
      <td>${escapeHtml(x.technician)}</td>
      <td>${escapeHtml(x.note)}</td>
    </tr>
  `).join("") || `<tr><td colspan="4">Chưa có dịch vụ</td></tr>`;
}

async function searchForMoney(){
  const keyword = document.getElementById("moneyKeyword").value.trim();
  if(!keyword) return toast("Nhập mã/IMEI/SĐT trước", "error");

  const res = await api("searchRepair", { keyword });
  if(!res.ok) return toast(res.message || "Lỗi tìm kiếm", "error");
  if(!res.results.length) return toast("Không tìm thấy phiếu", "error");

  await loadMoneyRepair(res.results[0].repairId);
}

async function loadMoneyRepair(repairId){
  const res = await api("getRepair", { repairId });
  if(!res.ok) return toast(res.message || "Không tải được phiếu", "error");

  currentMoneyRepair = res.data;
  const info = res.data.info;

  document.getElementById("moneyResult").classList.remove("hidden");
  document.getElementById("moneyForm").classList.remove("hidden");
  document.getElementById("materialBox").classList.remove("hidden");

  document.getElementById("moneyResult").innerHTML = renderInfo(info);

  const f = document.getElementById("moneyForm");
  f.repairId.value = info.repairId || "";
  f.totalLabor.value = info.totalLabor || "";
  f.extraCost.value = info.extraCost || "";
  f.actualRevenue.value = info.actualRevenue || "";
  f.paymentStatus.value = info.paymentStatus || "Chưa thanh toán";
  f.extraNote.value = info.extraNote || "";

  renderMaterials(res.data.materials || []);
  renderMoneySummary(info);
}

async function reloadCurrentMoney(){
  if(currentMoneyRepair?.info?.repairId){
    await loadMoneyRepair(currentMoneyRepair.info.repairId);
  }
}

async function addMaterialUI(){
  if(!currentMoneyRepair) return toast("Chưa chọn phiếu", "error");

  const data = {
    repairId: currentMoneyRepair.info.repairId,
    materialName: document.getElementById("materialName").value,
    qty: document.getElementById("materialQty").value,
    unitPrice: document.getElementById("materialUnitPrice").value,
    supplier: document.getElementById("materialSupplier").value
  };

  if(!data.materialName) return toast("Nhập tên vật tư", "error");

  const res = await api("addMaterial", { data });
  if(res.ok){
    toast("Đã thêm vật tư", "ok");
    document.getElementById("materialName").value = "";
    document.getElementById("materialQty").value = "1";
    document.getElementById("materialUnitPrice").value = "";
    document.getElementById("materialSupplier").value = "";
    await reloadCurrentMoney();
  }else toast(res.message || "Lỗi thêm vật tư", "error");
}

function renderMaterials(items){
  document.getElementById("materialRows").innerHTML = (items || []).map(x => `
    <tr>
      <td>${escapeHtml(x.materialName)}</td>
      <td>${x.qty}</td>
      <td>${vnd(x.unitPrice)}</td>
      <td>${vnd(x.amount)}</td>
      <td>${escapeHtml(x.supplier)}</td>
    </tr>
  `).join("") || `<tr><td colspan="5">Chưa có vật tư</td></tr>`;
}

function renderMoneySummary(info){
  setText("sumService", vnd(info.totalService));
  setText("sumMaterial", vnd(info.totalMaterial));
  setText("sumCost", vnd(info.totalCost));
  setText("sumProfit", vnd(info.profit));
}

async function globalSearch(){
  const keyword = document.getElementById("globalKeyword").value.trim();
  const res = await api("searchRepair", { keyword });
  if(!res.ok) return toast(res.message || "Lỗi tìm kiếm", "error");

  document.getElementById("searchRows").innerHTML = (res.results || []).map(x => `
    <tr>
      <td><b>${escapeHtml(x.repairId)}</b></td>
      <td>${escapeHtml(x.imei)}</td>
      <td>${escapeHtml(x.customer)}</td>
      <td>${escapeHtml(x.phone)}</td>
      <td>${escapeHtml(x.product)}</td>
      <td>${escapeHtml(x.status)}</td>
      <td>${escapeHtml(x.technician)}</td>
      <td>${vnd(x.profit)}</td>
      <td><button class="small-btn" onclick="viewDetail('${escapeJs(x.repairId)}')">Xem</button></td>
    </tr>
  `).join("") || `<tr><td colspan="9">Không có kết quả</td></tr>`;
}

async function viewDetail(repairId){
  const res = await api("getRepair", { repairId });
  if(!res.ok) return toast(res.message || "Không tải được chi tiết", "error");

  const info = res.data.info;
  document.getElementById("detailBox").classList.remove("hidden");
  document.getElementById("detailBox").innerHTML = `
    <h3>Chi tiết phiếu ${escapeHtml(info.repairId)}</h3>
    ${renderInfo(info)}
    <h4>Dịch vụ</h4>
    <div class="table-wrap">
      <table><thead><tr><th>Dịch vụ</th><th>Giá</th><th>KTV</th><th>Ghi chú</th></tr></thead>
      <tbody>${(res.data.services || []).map(x => `<tr><td>${escapeHtml(x.serviceName)}</td><td>${vnd(x.price)}</td><td>${escapeHtml(x.technician)}</td><td>${escapeHtml(x.note)}</td></tr>`).join("") || `<tr><td colspan="4">Chưa có</td></tr>`}</tbody></table>
    </div>
    <h4>Vật tư</h4>
    <div class="table-wrap">
      <table><thead><tr><th>Vật tư</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th><th>NCC</th></tr></thead>
      <tbody>${(res.data.materials || []).map(x => `<tr><td>${escapeHtml(x.materialName)}</td><td>${x.qty}</td><td>${vnd(x.unitPrice)}</td><td>${vnd(x.amount)}</td><td>${escapeHtml(x.supplier)}</td></tr>`).join("") || `<tr><td colspan="5">Chưa có</td></tr>`}</tbody></table>
    </div>
  `;
}

function renderInfo(info){
  const items = [
    ["Mã sửa", info.repairId],
    ["IMEI", info.imei],
    ["Khách", info.customer],
    ["SĐT", info.phone],
    ["Sản phẩm", info.product],
    ["Chi nhánh", info.branch],
    ["Hẹn trả", formatDate(info.appointment)],
    ["KTV", info.technician],
    ["Trạng thái", info.status],
    ["Thực thu", vnd(info.actualRevenue)],
    ["Tổng chi phí", vnd(info.totalCost)],
    ["Lợi nhuận", vnd(info.profit)]
  ];

  return `<div class="info-grid">${items.map(([k,v]) => `
    <div class="info-item"><span>${k}</span><b>${escapeHtml(v ?? "")}</b></div>
  `).join("")}</div>`;
}

function formatDate(v){
  if(!v) return "";
  const d = new Date(v);
  if(isNaN(d.getTime())) return v;
  return d.toLocaleString("vi-VN");
}

function escapeHtml(s){
  return String(s ?? "").replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}

function escapeJs(s){
  return String(s ?? "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}
