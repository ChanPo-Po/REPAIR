/***********************
 * POPOPHONE REPAIR API V6.2 FINAL
 * Required sheets:
 * DATA_SUA_CHUA, CT_DICH_VU, CT_VAT_TU, LOG_SUA_CHUA
 * DM_TRANG_THAI, DM_DICH_VU, DM_VAT_TU, DM_KY_THUAT
 ***********************/

const SHEET_DATA = "DATA_SUA_CHUA";
const SHEET_SERVICE = "CT_DICH_VU";
const SHEET_MATERIAL = "CT_VAT_TU";
const SHEET_LOG = "LOG_SUA_CHUA";
const SHEET_KPI_TECH = "KPI_KY_THUAT";

const SHEET_DM_STATUS = "DM_TRANG_THAI";
const SHEET_DM_SERVICE = "DM_DICH_VU";
const SHEET_DM_MATERIAL = "DM_VAT_TU";
const SHEET_DM_TECH = "DM_KY_THUAT";
const SHEET_DM_NCC = "DM_NCC";
const SHEET_DM_COMMISSION = "DM_HOA_HONG";
const SHEET_DM_TECH_SALARY = "DM_LUONG_KTV";

const TZ = "GMT+7";

const ROLE_PERMISSIONS = {
  sale: ["createRepair", "searchRepair", "getRepair", "getMasterData"],
  tech: ["createRepair", "searchRepair", "getRepair", "updateTech", "addService", "deleteService", "addWorklog", "getWorklogs", "getCommission", "getWorklogSummary", "getMasterData"],
  store_manager: ["createRepair", "searchRepair", "getRepair", "getDashboard", "getMasterData"],
  tech_manager: ["searchRepair", "getRepair", "updateTech", "addService", "deleteService", "addMaterial", "deleteMaterial", "updateMoney", "getDashboard", "addWorklog", "getWorklogs", "getCommission", "getWorklogSummary", "getMasterData"],
  admin: ["createRepair", "searchRepair", "getRepair", "updateTech", "addService", "deleteService", "addMaterial", "deleteMaterial", "updateMoney", "getDashboard", "addWorklog", "getWorklogs", "getCommission", "getWorklogSummary", "getMasterData"]
};

function doGet() {
  return json({ ok: true, message: "POPOPHONE Repair API V6.2 Final đang chạy", time: new Date() });
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) return json({ ok: false, message: "Không có dữ liệu POST" });

    const req = JSON.parse(e.postData.contents || "{}");
    const action = req.action;

    requireAction_(req, action);

    switch (action) {
      case "getMasterData": return json(getMasterData());
      case "createRepair": return json(createRepair(req.data));
      case "searchRepair": return json(searchRepair(req.keyword || ""));
      case "getRepair": return json(getRepair(req.repairId));
      case "updateTech": return json(updateTech(req.data));
      case "addService": return json(addService(req.data));
      case "deleteService": return json(deleteService(req.repairId, req.serviceName));
      case "addMaterial": return json(addMaterial(req.data));
      case "deleteMaterial": return json(deleteMaterial(req.repairId, req.materialName));
      case "updateMoney": return json(updateMoney(req.data));
      case "getDashboard": return json(getDashboardV4(req));
      case "addWorklog": return json(addWorklog(req.data, req));
      case "getWorklogs": return json(getWorklogs(req.keyword || "", req));
      case "getCommission": return json(getCommission(req.model, req.serviceName));
      case "getWorklogSummary": return json(getWorklogSummary(req.technician || "", req.month || "", req));
      default: return json({ ok: false, message: "Invalid action: " + action });
    }
  } catch (err) {
    return json({ ok: false, message: String(err), stack: err.stack || "" });
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function canAction_(req, action) {
  const role = req && req.auth && req.auth.role ? String(req.auth.role) : "admin";
  const allowed = ROLE_PERMISSIONS[role] || [];
  return allowed.indexOf(action) >= 0;
}

function requireAction_(req, action) {
  if (!canAction_(req, action)) throw new Error("Tài khoản không có quyền thực hiện: " + action);
}

function getSheet_(name) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sh) throw new Error("Không tìm thấy sheet: " + name);
  return sh;
}

function trySheet_(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

function now_() { return new Date(); }
function fmtDate_(date, fmt) { return Utilities.formatDate(new Date(date), TZ, fmt); }
function num_(v) {
  const n = Number(String(v || "0").replace(/[^\d.-]/g, ""));
  return isNaN(n) ? 0 : n;
}
function clean_(v) { return String(v || "").replace(/^'/, "").trim(); }

function genRepairId_() {
  const today = fmtDate_(new Date(), "yyMMdd");
  return "SC" + today +
    Utilities.getUuid()
      .replace(/-/g, "")
      .substring(0, 6)
      .toUpperCase();
}

function getWeekNumber_(date) {
  const d = new Date(date);
  const oneJan = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - oneJan) / 86400000) + oneJan.getDay() + 1) / 7);
}

function weekOfMonth_(date) {
  const d = new Date(date);
  return Math.ceil(d.getDate() / 7);
}

function findRepairRow_(repairId) {
  const sh = getSheet_(SHEET_DATA);
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (clean_(data[i][0]) === clean_(repairId)) return { sheet: sh, rowIndex: i + 1, row: data[i] };
  }
  return null;
}

/***********************
 * MASTER DATA
 ***********************/
function getMasterData() {
  return {
    ok: true,
    data: {
      statuses: readMaster_(SHEET_DM_STATUS),
      services: readMaster_(SHEET_DM_SERVICE),
      materials: readMaster_(SHEET_DM_MATERIAL),
      technicians: readMaster_(SHEET_DM_TECH),
      branches: [
        { name: "113" },
        { name: "148" }
      ],
      suppliers: readMaster_(SHEET_DM_NCC),
      commissions: readCommissionTable_(),
      techSalaries: readMaster_(SHEET_DM_TECH_SALARY)
    }
  };
}

function readMaster_(sheetName) {
  const sh = trySheet_(sheetName);
  if (!sh) return [];
  const data = sh.getDataRange().getValues();
  if (data.length < 2) return [];

  const headers = data[0].map(h => clean_(h));
  const arr = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i].join("").trim() === "") continue;

    const obj = {};
    headers.forEach((h, idx) => {
      if (!h) return;
      obj[h] = data[i][idx];
    });

    const first = clean_(data[i][0]);
    const activeCol = headers.findIndex(h => /hoạt|hoat|active|trạng thái|trang thai/i.test(h));
    if (activeCol >= 0) {
      const val = String(data[i][activeCol]).toLowerCase();
      if (val === "false" || val === "ngưng" || val === "không" || val === "khong" || val === "0") continue;
    }

    obj.name = obj["Tên"] || obj["Tên dịch vụ"] || obj["Tên vật tư"] || obj["Tên kỹ thuật"] || obj["Trạng thái"] || first;
    arr.push(obj);
  }

  return arr;
}

/***********************
 * CREATE / SEARCH / GET
 ***********************/
function createRepair(data) {
  if (!data) return { ok: false, message: "Thiếu data" };

  const sh = getSheet_(SHEET_DATA);
  const id = data.repairId || genRepairId_();
  const createdAt = now_();

  sh.appendRow([
    id,
    "'" + clean_(data.imei),
    data.receiveDate || createdAt,
    normalizeBranch_(data.branch || ""),
    data.product || "",
    data.customer || "",
    data.phone || "",
    data.serviceType || "",
    data.receiveStatus || "",
    data.request || "",
    data.receiveNote || "",
    data.appointment || "",
    data.faceId || "",
    data.screen || "",
    data.cameraMic || "",
    data.speaker || "",
    num_(data.estimate),
    data.staff || "",
    "",
    data.processPlace || "",
    "",
    "1. Đã tiếp nhận",
    "",
    "",
    "",
    "",
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    "Chưa thanh toán",
    "",
    fmtDate_(createdAt, "yyyy"),
    fmtDate_(createdAt, "MM"),
    getWeekNumber_(createdAt),
    createdAt,
    createdAt
  ]);

  writeLog_(id, data.imei, data.user || data.staff || "", "TIẾP NHẬN", "Tạo phiếu sửa", "", "", "");
  return { ok: true, message: "Đã tạo phiếu sửa", repairId: id };
}

function searchRepair(keyword) {
  const sh = getSheet_(SHEET_DATA);
  const data = sh.getDataRange().getValues();
  keyword = String(keyword || "").toLowerCase().trim();

  const results = [];
  for (let i = 1; i < data.length; i++) {
    const txt = data[i].join(" ").toLowerCase();
    if (!keyword || txt.includes(keyword)) {
      results.push({
        repairId: data[i][0],
        imei: clean_(data[i][1]),
        receiveDate: data[i][2],
        branch: data[i][3],
        product: data[i][4],
        customer: data[i][5],
        phone: data[i][6],
        serviceType: data[i][7],
        appointment: data[i][11],
        technician: data[i][20],
        status: data[i][21],
        revenue: data[i][31],
        profit: data[i][32]
      });
    }
  }

  return { ok: true, results: results.slice(-300).reverse() };
}

function getRepair(repairId) {
  const found = findRepairRow_(repairId);
  if (!found) return { ok: false, message: "Không tìm thấy phiếu" };

  return {
    ok: true,
    data: {
      info: rowToRepair_(found.row),
      services: getServices_(repairId),
      materials: getMaterials_(repairId)
    }
  };
}

function rowToRepair_(r) {
  return {
    repairId: r[0],
    imei: clean_(r[1]),
    receiveDate: r[2],
    branch: r[3],
    product: r[4],
    customer: r[5],
    phone: r[6],
    serviceType: r[7],
    receiveStatus: r[8],
    request: r[9],
    receiveNote: r[10],
    appointment: r[11],
    faceId: r[12],
    screen: r[13],
    cameraMic: r[14],
    speaker: r[15],
    estimate: r[16],
    staff: r[17],
    actualStatus: r[18],
    processPlace: r[19],
    technician: r[20],
    status: r[21],
    completedDate: r[22],
    deliveredDate: r[23],
    overdue: r[24],
    techNote: r[25],
    totalService: r[26],
    totalMaterial: r[27],
    totalLabor: r[28],
    extraCost: r[29],
    totalCost: r[30],
    actualRevenue: r[31],
    profit: r[32],
    paymentStatus: r[33],
    extraNote: r[34],
    year: r[35],
    month: r[36],
    week: r[37],
    createdAt: r[38],
    updatedAt: r[39]
  };
}

/***********************
 * TECH / SERVICE / MATERIAL / MONEY
 ***********************/
function updateTech(data) {
  if (!data || !data.repairId) return { ok: false, message: "Thiếu mã sửa chữa" };

  const found = findRepairRow_(data.repairId);
  if (!found) return { ok: false, message: "Không tìm thấy phiếu" };

  const sh = found.sheet;
  const row = found.rowIndex;
  const oldStatus = found.row[21];

  sh.getRange(row, 19).setValue(data.actualStatus || "");
  sh.getRange(row, 20).setValue(data.processPlace || "");
  sh.getRange(row, 21).setValue(data.technician || "");
  sh.getRange(row, 22).setValue(data.status || "");
  sh.getRange(row, 26).setValue(data.techNote || "");

  if (data.status === "7. Đã hoàn thành" && !found.row[22]) sh.getRange(row, 23).setValue(now_());
  if (data.status === "8. Đã bàn giao" && !found.row[23]) sh.getRange(row, 24).setValue(now_());

  sh.getRange(row, 25).setValue(calcOverdue_(found.row[11], data.status));
  sh.getRange(row, 40).setValue(now_());

  writeLog_(data.repairId, found.row[1], data.user || data.technician || "", "KỸ THUẬT", "Cập nhật kỹ thuật", oldStatus, data.status || "", data.techNote || "");
  return { ok: true, message: "Đã cập nhật kỹ thuật" };
}

function addService(data) {
  if (!data || !data.repairId) return { ok: false, message: "Thiếu mã sửa chữa" };

  const found = findRepairRow_(data.repairId);
  if (!found) return { ok: false, message: "Không tìm thấy phiếu" };

  getSheet_(SHEET_SERVICE).appendRow([
    data.repairId,
    "'" + clean_(found.row[1]),
    data.serviceName || "",
    num_(data.price),
    data.technician || found.row[20] || "",
    data.note || "",
    now_()
  ]);

  recalcMoney_(data.repairId);
  writeLog_(data.repairId, found.row[1], data.user || data.technician || "", "KỸ THUẬT", "Thêm dịch vụ", "", data.serviceName || "", "");
  return { ok: true, message: "Đã thêm dịch vụ" };
}

function deleteService(repairId, serviceName) {
  const sh = getSheet_(SHEET_SERVICE);
  const data = sh.getDataRange().getValues();

  for (let i = data.length - 1; i >= 1; i--) {
    if (clean_(data[i][0]) === clean_(repairId) && clean_(data[i][2]) === clean_(serviceName)) {
      sh.deleteRow(i + 1);
      recalcMoney_(repairId);
      writeLog_(repairId, data[i][1], "", "KỸ THUẬT", "Xóa dịch vụ", serviceName, "", "");
      return { ok: true, message: "Đã xóa dịch vụ" };
    }
  }
  return { ok: false, message: "Không tìm thấy dịch vụ" };
}

function addMaterial(data) {
  if (!data || !data.repairId) return { ok: false, message: "Thiếu mã sửa chữa" };

  const found = findRepairRow_(data.repairId);
  if (!found) return { ok: false, message: "Không tìm thấy phiếu" };

  const qty = num_(data.qty || 1);
  const unitPrice = num_(data.unitPrice);
  const amount = qty * unitPrice;

  getSheet_(SHEET_MATERIAL).appendRow([
    data.repairId,
    "'" + clean_(found.row[1]),
    data.materialName || "",
    qty,
    unitPrice,
    amount,
    data.supplier || "",
    data.note || "",
    now_()
  ]);

  recalcMoney_(data.repairId);
  writeLog_(data.repairId, found.row[1], data.user || "", "QUẢN LÝ", "Thêm vật tư", "", data.materialName || "", "");
  return { ok: true, message: "Đã thêm vật tư", amount };
}

function deleteMaterial(repairId, materialName) {
  const sh = getSheet_(SHEET_MATERIAL);
  const data = sh.getDataRange().getValues();

  for (let i = data.length - 1; i >= 1; i--) {
    if (clean_(data[i][0]) === clean_(repairId) && clean_(data[i][2]) === clean_(materialName)) {
      sh.deleteRow(i + 1);
      recalcMoney_(repairId);
      writeLog_(repairId, data[i][1], "", "QUẢN LÝ", "Xóa vật tư", materialName, "", "");
      return { ok: true, message: "Đã xóa vật tư" };
    }
  }
  return { ok: false, message: "Không tìm thấy vật tư" };
}

function updateMoney(data) {
  if (!data || !data.repairId) return { ok: false, message: "Thiếu mã sửa chữa" };

  const found = findRepairRow_(data.repairId);
  if (!found) return { ok: false, message: "Không tìm thấy phiếu" };

  const sh = found.sheet;
  const row = found.rowIndex;

  sh.getRange(row, 29).setValue(num_(data.totalLabor));
  sh.getRange(row, 30).setValue(num_(data.extraCost));
  sh.getRange(row, 32).setValue(num_(data.actualRevenue));
  sh.getRange(row, 34).setValue(data.paymentStatus || "Chưa thanh toán");
  sh.getRange(row, 35).setValue(data.extraNote || "");
  sh.getRange(row, 40).setValue(now_());

  const totals = recalcMoney_(data.repairId);
  writeLog_(data.repairId, found.row[1], data.user || "QUẢN LÝ", "QUẢN LÝ", "Cập nhật tiền", "", "", "");
  return { ok: true, message: "Đã cập nhật tiền", totals, data: getRepair(data.repairId).data.info };
}

function recalcMoney_(repairId) {
  const found = findRepairRow_(repairId);
  if (!found) throw new Error("Không tìm thấy phiếu để tính tiền");

  const sh = found.sheet;
  const row = found.rowIndex;

  const totalService = sumService_(repairId);
  const totalMaterial = sumMaterial_(repairId);
  const totalLabor = num_(sh.getRange(row, 29).getValue());
  const extraCost = num_(sh.getRange(row, 30).getValue());
  const actualRevenue = num_(sh.getRange(row, 32).getValue());

  const totalCost = totalMaterial + totalLabor + extraCost;
  const profit = actualRevenue - totalCost;

  sh.getRange(row, 27).setValue(totalService);
  sh.getRange(row, 28).setValue(totalMaterial);
  sh.getRange(row, 31).setValue(totalCost);
  sh.getRange(row, 33).setValue(profit);
  sh.getRange(row, 40).setValue(now_());

  return { totalService, totalMaterial, totalLabor, extraCost, totalCost, actualRevenue, profit };
}

function sumService_(repairId) {
  const data = getSheet_(SHEET_SERVICE).getDataRange().getValues();
  let total = 0;
  for (let i = 1; i < data.length; i++) if (clean_(data[i][0]) === clean_(repairId)) total += num_(data[i][3]);
  return total;
}

function sumMaterial_(repairId) {
  const data = getSheet_(SHEET_MATERIAL).getDataRange().getValues();
  let total = 0;
  for (let i = 1; i < data.length; i++) if (clean_(data[i][0]) === clean_(repairId)) total += num_(data[i][5]);
  return total;
}

function getServices_(repairId) {
  const data = getSheet_(SHEET_SERVICE).getDataRange().getValues();
  const arr = [];
  for (let i = 1; i < data.length; i++) {
    if (clean_(data[i][0]) === clean_(repairId)) {
      arr.push({ repairId:data[i][0], imei:clean_(data[i][1]), serviceName:data[i][2], price:data[i][3], technician:data[i][4], note:data[i][5], createdAt:data[i][6] });
    }
  }
  return arr;
}

function getMaterials_(repairId) {
  const data = getSheet_(SHEET_MATERIAL).getDataRange().getValues();
  const arr = [];
  for (let i = 1; i < data.length; i++) {
    if (clean_(data[i][0]) === clean_(repairId)) {
      arr.push({ repairId:data[i][0], imei:clean_(data[i][1]), materialName:data[i][2], qty:data[i][3], unitPrice:data[i][4], amount:data[i][5], supplier:data[i][6], note:data[i][7], createdAt:data[i][8] });
    }
  }
  return arr;
}

/***********************
 * DASHBOARD V4
 ***********************/
function getDashboardV4(req) {
  const data = getSheet_(SHEET_DATA).getDataRange().getValues();
  const serviceData = getSheet_(SHEET_SERVICE).getDataRange().getValues();
  const materialData = getSheet_(SHEET_MATERIAL).getDataRange().getValues();

  const today = fmtDate_(new Date(), "yyyy-MM-dd");
  let totalOrders=0,todayReceived=0,todayCompleted=0,todayDelivered=0,overdue=0,waitingParts=0,repairing=0,warrantyBack=0;
  let revenue=0,materialCost=0,laborCost=0,extraCost=0,totalCost=0,profit=0;

  const byTech={},byStatus={},weeklyMap={},repairMap={},modelMap={},serviceByRepair={};
  for(let w=1;w<=5;w++) weeklyMap[w]={week:w,orders:0,revenue:0,cost:0,profit:0};

  for(let i=1;i<data.length;i++){
    const r=data[i], repairId=clean_(r[0]);
    if(!repairId) continue;

    const receiveDate=r[2]?new Date(r[2]):null;
    const receiveDateStr=receiveDate?fmtDate_(receiveDate,"yyyy-MM-dd"):"";
    const status=String(r[21]||"");
    const tech=String(r[20]||"Chưa có KTV");
    const model=normalizeModel_(r[4]);
    const serviceType=String(r[7]||"");

    const rowRevenue=num_(r[31]),rowMaterial=num_(r[27]),rowLabor=num_(r[28]),rowExtra=num_(r[29]),rowCost=num_(r[30]),rowProfit=num_(r[32]);

    totalOrders++;
    if(receiveDateStr===today) todayReceived++;
    if(r[22]&&fmtDate_(r[22],"yyyy-MM-dd")===today) todayCompleted++;
    if(r[23]&&fmtDate_(r[23],"yyyy-MM-dd")===today) todayDelivered++;
    if(isOverdue_(r[11],status)) overdue++;
    if(status==="6. Chờ linh kiện") waitingParts++;
    if(status==="5. Đang sửa") repairing++;
    if(status==="10. Bảo hành lại"||serviceType.indexOf("Bảo hành")>=0) warrantyBack++;

    revenue+=rowRevenue; materialCost+=rowMaterial; laborCost+=rowLabor; extraCost+=rowExtra; totalCost+=rowCost; profit+=rowProfit;

    const wom=receiveDate?weekOfMonth_(receiveDate):1;
    if(!weeklyMap[wom]) weeklyMap[wom]={week:wom,orders:0,revenue:0,cost:0,profit:0};
    weeklyMap[wom].orders++; weeklyMap[wom].revenue+=rowRevenue; weeklyMap[wom].cost+=rowCost; weeklyMap[wom].profit+=rowProfit;

    if(!byTech[tech]) byTech[tech]={technician:tech,total:0,completed:0,overdue:0,revenue:0,profit:0};
    byTech[tech].total++; byTech[tech].revenue+=rowRevenue; byTech[tech].profit+=rowProfit;
    if(status==="7. Đã hoàn thành"||status==="8. Đã bàn giao") byTech[tech].completed++;
    if(isOverdue_(r[11],status)) byTech[tech].overdue++;

    byStatus[status||"Không rõ"]=(byStatus[status||"Không rõ"]||0)+1;
    repairMap[repairId]={repairId,model,revenue:rowRevenue,cost:rowCost,profit:rowProfit};
    if(!modelMap[model]) modelMap[model]={model,orders:0,services:{}};
    modelMap[model].orders++;
  }

  const serviceMap={};
  for(let i=1;i<serviceData.length;i++){
    const repairId=clean_(serviceData[i][0]);
    const name=String(serviceData[i][2]||"Không rõ");
    const price=num_(serviceData[i][3]);
    const model=repairMap[repairId]?repairMap[repairId].model:normalizeModel_(serviceData[i][1]);

    if(!serviceMap[name]) serviceMap[name]={name,count:0,revenue:0,cost:0,profit:0};
    serviceMap[name].count++; serviceMap[name].revenue+=price;

    if(!serviceByRepair[repairId]) serviceByRepair[repairId]=[];
    serviceByRepair[repairId].push(name);

    if(!modelMap[model]) modelMap[model]={model,orders:0,services:{}};
    modelMap[model].services[name]=(modelMap[model].services[name]||0)+1;
  }

  const materialByRepair={},materialMap={};
  for(let i=1;i<materialData.length;i++){
    const repairId=clean_(materialData[i][0]);
    const name=String(materialData[i][2]||"Không rõ");
    const qty=num_(materialData[i][3]);
    const cost=num_(materialData[i][5]);

    if(!materialMap[name]) materialMap[name]={name,qty:0,cost:0};
    materialMap[name].qty+=qty; materialMap[name].cost+=cost;

    if(!materialByRepair[repairId]) materialByRepair[repairId]=0;
    materialByRepair[repairId]+=cost;
  }

  Object.keys(serviceMap).forEach(name=>{
    let estCost=0;
    Object.keys(serviceByRepair).forEach(rid=>{
      if(serviceByRepair[rid].includes(name)){
        const share=serviceByRepair[rid].length||1;
        estCost+=(materialByRepair[rid]||0)/share;
      }
    });
    serviceMap[name].cost=Math.round(estCost);
    serviceMap[name].profit=serviceMap[name].revenue-serviceMap[name].cost;
  });

  const servicesList=Object.values(serviceMap).sort((a,b)=>b.revenue-a.revenue);
  const topServices=servicesList.slice(0,10);

  const modelStats=Object.values(modelMap).map(m=>{
    const entries=Object.entries(m.services).sort((a,b)=>b[1]-a[1]);
    const top=entries[0]||["Không rõ",0];
    return {model:m.model,orders:m.orders,topService:top[0],topServiceQty:top[1],suggest:suggestFor_(top[0],m.model,top[1])};
  }).sort((a,b)=>b.orders-a.orders).slice(0,20);

  const serviceNames=servicesList.slice(0,8).map(x=>x.name);
  const matrixRows=Object.values(modelMap).sort((a,b)=>b.orders-a.orders).slice(0,20).map(m=>{
    const values={};
    serviceNames.forEach(s=>values[s]=m.services[s]||0);
    return {model:m.model,values};
  });

  const materialNeeds=buildMaterialNeedsFromMatrix_(matrixRows,serviceNames);

  return {
    ok:true,totalOrders,todayReceived,todayCompleted,todayDelivered,overdue,waitingParts,repairing,warrantyBack,
    revenue,materialCost,laborCost,extraCost,totalCost,profit,
    byTech:Object.values(byTech).sort((a,b)=>b.profit-a.profit),
    byStatus,
    weekly:Object.values(weeklyMap).sort((a,b)=>a.week-b.week),
    topServices,
    topMaterials:Object.values(materialMap).sort((a,b)=>b.cost-a.cost).slice(0,10),
    modelStats,
    matrix:{services:serviceNames,rows:matrixRows},
    materialNeeds
  };
}

function normalizeModel_(product){
  let s=String(product||"").toUpperCase();
  s=s.replace(/IPHONE/g,"").replace(/IP/g,"").replace(/\s+/g," ").trim();
  const m=s.match(/(XS MAX|XR|SE\s?\d?|11\s?PRO\s?MAX|12\s?PRO\s?MAX|13\s?PRO\s?MAX|14\s?PRO\s?MAX|15\s?PRO\s?MAX|16\s?PRO\s?MAX|11|12|13|14|15|16)/i);
  if(!m) return String(product||"Không rõ").trim()||"Không rõ";
  return m[1].replace(/\s+/g," ").trim().replace("PRO MAX","Pro Max");
}

function suggestFor_(service,model,qty){
  const n=Math.ceil(num_(qty)*1.4);
  if(/pin/i.test(service)) return "Pin "+model+": tồn tối thiểu "+n;
  if(/kính|kinh|ép|ep/i.test(service)) return "Kính "+model+": tồn tối thiểu "+n;
  if(/màn|man/i.test(service)) return "Màn "+model+": tồn tối thiểu "+n;
  return "Theo dõi thêm";
}

function buildMaterialNeedsFromMatrix_(rows,serviceNames){
  const out={pin:[],kinh:[],man:[],khac:[]};
  rows.forEach(r=>{
    const pin=findServiceQty_(r.values,["pin"]);
    const kinh=findServiceQty_(r.values,["kính","kinh","ép","ep"]);
    const man=findServiceQty_(r.values,["màn","man"]);
    if(pin>0) out.pin.push({name:"Pin "+r.model,need:pin,minStock:Math.ceil(pin*1.4),note:"Dựa trên dịch vụ thay pin"});
    if(kinh>0) out.kinh.push({name:"Kính "+r.model,need:kinh,minStock:Math.ceil(kinh*1.3),note:"Dựa trên dịch vụ ép/thay kính"});
    if(man>0) out.man.push({name:"Màn "+r.model,need:man,minStock:Math.ceil(man*1.2),note:"Dựa trên dịch vụ thay màn"});
  });
  Object.keys(out).forEach(k=>out[k].sort((a,b)=>b.need-a.need));
  return out;
}

function findServiceQty_(values,keys){
  let total=0;
  Object.keys(values).forEach(k=>{
    const low=k.toLowerCase();
    if(keys.some(x=>low.indexOf(x)>=0)) total+=num_(values[k]);
  });
  return total;
}

function normalizeBranch_(v){
  const s=String(v||"").trim();
  if(s==="1/48") return "148";
  return s;
}

function isOverdue_(appointment,status){
  if(!appointment) return false;
  const done=["7. Đã hoàn thành","8. Đã bàn giao","9. Back lại khách","11. Hủy sửa"];
  if(done.includes(String(status||""))) return false;
  return new Date(appointment)<new Date();
}

function calcOverdue_(appointment,status){return isOverdue_(appointment,status)?"Trễ":"";}

function writeLog_(repairId,imei,user,role,action,oldValue,newValue,note){
  getSheet_(SHEET_LOG).appendRow([now_(),repairId||"",clean_(imei),user||"",role||"",action||"",oldValue||"",newValue||"",note||""]);
}


/***********************
 * V6 - KỸ THUẬT GHI CÔNG SỬA CHỮA
 * Sheet KPI_KY_THUAT columns:
 * Thời gian ghi | Ngày | Kỹ thuật | Dòng máy | IMEI | Dịch vụ | Số lượng | Hoa hồng | Ghi chú | Người ghi
 ***********************/
function addWorklog(data, req) {
  if (!data) return { ok:false, message:"Thiếu data" };

  const sh = getSheet_(SHEET_KPI_TECH);
  const createdAt = now_();

  let commission = num_(data.commission);
  if (!commission) {
    const c = getCommission(data.model || "", data.serviceName || "");
    commission = c.ok ? num_(c.commission) : 0;
  }

  sh.appendRow([
    createdAt,
    data.date || fmtDate_(createdAt, "yyyy-MM-dd"),
    data.technician || "",
    data.model || "",
    "'" + clean_(data.imei),
    data.serviceName || "",
    num_(data.qty || 1),
    commission,
    data.note || "",
    data.user || (req && req.auth && req.auth.user) || ""
  ]);

  writeLog_("", data.imei || "", data.user || "", "KỸ THUẬT", "Ghi công sửa chữa", "", data.serviceName || "", "HH: " + commission);
  return { ok:true, message:"Đã ghi công sửa chữa", commission };
}

function getWorklogs(keyword, req) {
  const sh = trySheet_(SHEET_KPI_TECH);
  if (!sh) return { ok:true, results:[] };

  const data = sh.getDataRange().getValues();
  const results = [];
  keyword = String(keyword || "").toLowerCase().trim();

  const role = req && req.auth && req.auth.role ? String(req.auth.role) : "";
  const user = req && req.auth && req.auth.user ? String(req.auth.user) : "";

  for (let i=1;i<data.length;i++) {
    const rowText = data[i].join(" ").toLowerCase();
    if (keyword && rowText.indexOf(keyword) < 0) continue;

    const item = {
      createdAt: data[i][0],
      date: data[i][1],
      technician: data[i][2],
      model: data[i][3],
      imei: clean_(data[i][4]),
      serviceName: data[i][5],
      qty: data[i][6],
      commission: data[i][7],
      note: data[i][8],
      user: data[i][9]
    };

    // Kỹ thuật thường chỉ nên xem công do mình ghi nếu user trùng.
    // Nếu shop dùng chung account kythuat thì vẫn xem được tất cả để tiện vận hành.
    results.push(item);
  }

  return { ok:true, results: results.slice(-300).reverse() };
}


/***********************
 * V6.2 - HOA HỒNG + LƯƠNG TẠM TÍNH
 ***********************/
function normKey_(v) {
  return String(v || "")
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/IPHONE/g, "")
    .replace(/PRO MAX/g, "PROMAX")
    .trim();
}

function readCommissionTable_() {
  const sh = trySheet_(SHEET_DM_COMMISSION);
  if (!sh) return [];

  const data = sh.getDataRange().getValues();
  if (data.length < 2) return [];

  const headers = data[0].map(h => String(h || "").trim());
  const result = [];

  for (let i = 1; i < data.length; i++) {
    const model = String(data[i][0] || "").trim();
    if (!model) continue;

    for (let c = 1; c < headers.length; c++) {
      const serviceName = headers[c];
      if (!serviceName) continue;

      let commission = num_(data[i][c]);
      if (commission > 0 && commission < 1000) commission = commission * 1000;

      result.push({
        model,
        serviceName,
        commission
      });
    }
  }

  return result;
}

function getCommission(model, serviceName) {
  const targetModel = normKey_(model);
  const targetService = normKey_(serviceName);

  const table = readCommissionTable_();

  for (let i = 0; i < table.length; i++) {
    if (normKey_(table[i].model) === targetModel &&
        normKey_(table[i].serviceName) === targetService) {
      return {
        ok: true,
        model: table[i].model,
        serviceName: table[i].serviceName,
        commission: num_(table[i].commission)
      };
    }
  }

  return {
    ok: true,
    model,
    serviceName,
    commission: 0,
    message: "Không tìm thấy hoa hồng trong DM_HOA_HONG"
  };
}

function getTechSalary_(technician) {
  const sh = trySheet_(SHEET_DM_TECH_SALARY);
  if (!sh) return { baseSalary: 4500000, mealPerDay: 30000 };

  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const name = clean_(data[i][0]);
    if (normKey_(name) === normKey_(technician)) {
      return {
        baseSalary: num_(data[i][1]) || 4500000,
        mealPerDay: num_(data[i][2]) || 30000
      };
    }
  }

  return { baseSalary: 4500000, mealPerDay: 30000 };
}

function getWorklogSummary(technician, month, req) {
  const sh = trySheet_(SHEET_KPI_TECH);
  if (!sh) {
    return { ok:true, totalRows:0, totalCommission:0, baseSalary:0, mealSupport:0, grandTotal:0, byService:[] };
  }

  const data = sh.getDataRange().getValues();
  let totalRows = 0;
  let totalCommission = 0;
  const workDays = {};
  const byService = {};

  month = String(month || fmtDate_(new Date(), "yyyy-MM")).trim();

  for (let i = 1; i < data.length; i++) {
    const dateVal = data[i][1];
    const rowMonth = dateVal ? fmtDate_(new Date(dateVal), "yyyy-MM") : "";
    if (month && rowMonth !== month) continue;

    const ktv = clean_(data[i][2]);
    if (technician && normKey_(ktv) !== normKey_(technician)) continue;

    const serviceName = clean_(data[i][5]);
    const qty = num_(data[i][6] || 1);
    const commission = num_(data[i][7]);

    totalRows++;
    totalCommission += commission;
    if (dateVal) workDays[fmtDate_(new Date(dateVal), "yyyy-MM-dd")] = true;

    if (!byService[serviceName]) byService[serviceName] = { serviceName, qty:0, commission:0 };
    byService[serviceName].qty += qty;
    byService[serviceName].commission += commission;
  }

  const salary = getTechSalary_(technician);
  const dayCount = Object.keys(workDays).length;
  const mealSupport = dayCount * salary.mealPerDay;
  const grandTotal = salary.baseSalary + mealSupport + totalCommission;

  return {
    ok: true,
    month,
    technician,
    totalRows,
    workDays: dayCount,
    totalCommission,
    baseSalary: salary.baseSalary,
    mealPerDay: salary.mealPerDay,
    mealSupport,
    grandTotal,
    byService: Object.values(byService).sort((a,b)=>b.commission-a.commission)
  };
}
