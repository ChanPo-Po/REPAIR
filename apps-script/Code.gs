/***********************
 * POPOPHONE REPAIR API V3
 * Sheet cần có:
 * DATA_SUA_CHUA
 * CT_DICH_VU
 * CT_VAT_TU
 * LOG_SUA_CHUA
 ***********************/

const SHEET_DATA = "DATA_SUA_CHUA";
const SHEET_SERVICE = "CT_DICH_VU";
const SHEET_MATERIAL = "CT_VAT_TU";
const SHEET_LOG = "LOG_SUA_CHUA";
const TZ = "GMT+7";

function doGet() {
  return json({
    ok: true,
    message: "POPOPHONE Repair API V3 đang chạy",
    time: new Date()
  });
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return json({ ok: false, message: "Không có dữ liệu POST" });
    }

    const req = JSON.parse(e.postData.contents || "{}");
    const action = req.action;

    switch (action) {
      case "createRepair": return json(createRepair(req.data));
      case "searchRepair": return json(searchRepair(req.keyword || ""));
      case "getRepair": return json(getRepair(req.repairId));
      case "updateTech": return json(updateTech(req.data));
      case "addService": return json(addService(req.data));
      case "deleteService": return json(deleteService(req.repairId, req.serviceName));
      case "addMaterial": return json(addMaterial(req.data));
      case "deleteMaterial": return json(deleteMaterial(req.repairId, req.materialName));
      case "updateMoney": return json(updateMoney(req.data));
      case "getDashboard": return json(getDashboardV3(req));
      default: return json({ ok: false, message: "Invalid action: " + action });
    }

  } catch (err) {
    return json({ ok: false, message: String(err), stack: err.stack || "" });
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function getSheet_(name) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sh) throw new Error("Không tìm thấy sheet: " + name);
  return sh;
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
  const prefix = "SC" + today;
  const sh = getSheet_(SHEET_DATA);
  const lastRow = sh.getLastRow();
  let count = 0;

  if (lastRow >= 2) {
    const ids = sh.getRange(2, 1, lastRow - 1, 1).getValues().flat();
    ids.forEach(id => { if (String(id).startsWith(prefix)) count++; });
  }

  return prefix + String(count + 1).padStart(4, "0");
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
    if (clean_(data[i][0]) === clean_(repairId)) {
      return { sheet: sh, rowIndex: i + 1, row: data[i] };
    }
  }
  return null;
}

/***********************
 * DATA_SUA_CHUA mapping
 * 1 Mã sửa chữa
 * 2 IMEI
 * 3 Ngày nhận
 * 4 Chi nhánh
 * 5 Sản phẩm
 * 6 Tên KH
 * 7 SĐT
 * 8 Loại DV
 * 9 Tình trạng nhận
 * 10 Yêu cầu
 * 11 Ghi chú tiếp nhận
 * 12 Hẹn trả
 * 13 FaceID
 * 14 Màn hình
 * 15 Camera/Mic
 * 16 Loa
 * 17 Giá dự kiến
 * 18 NV tiếp nhận
 * 19 Tình trạng thực tế
 * 20 Nơi xử lý
 * 21 KTV
 * 22 Trạng thái
 * 23 Ngày hoàn thành
 * 24 Ngày bàn giao
 * 25 Trễ hẹn
 * 26 Ghi chú kỹ thuật
 * 27 Tổng tiền dịch vụ
 * 28 Tổng giá vốn vật tư
 * 29 Tổng công thợ
 * 30 Chi phí phát sinh
 * 31 Tổng chi phí
 * 32 Thực thu
 * 33 Lợi nhuận
 * 34 Trạng thái thanh toán
 * 35 Nội dung phát sinh
 * 36 Năm
 * 37 Tháng
 * 38 Tuần
 * 39 Ngày tạo
 * 40 Ngày cập nhật
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
    data.branch || "",
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

  return { ok: true, results: results.slice(-200).reverse() };
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

  const sh = getSheet_(SHEET_SERVICE);
  sh.appendRow([
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

  const sh = getSheet_(SHEET_MATERIAL);
  const qty = num_(data.qty || 1);
  const unitPrice = num_(data.unitPrice);
  const amount = qty * unitPrice;

  sh.appendRow([
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
      arr.push({
        repairId: data[i][0],
        imei: clean_(data[i][1]),
        serviceName: data[i][2],
        price: data[i][3],
        technician: data[i][4],
        note: data[i][5],
        createdAt: data[i][6]
      });
    }
  }
  return arr;
}

function getMaterials_(repairId) {
  const data = getSheet_(SHEET_MATERIAL).getDataRange().getValues();
  const arr = [];
  for (let i = 1; i < data.length; i++) {
    if (clean_(data[i][0]) === clean_(repairId)) {
      arr.push({
        repairId: data[i][0],
        imei: clean_(data[i][1]),
        materialName: data[i][2],
        qty: data[i][3],
        unitPrice: data[i][4],
        amount: data[i][5],
        supplier: data[i][6],
        note: data[i][7],
        createdAt: data[i][8]
      });
    }
  }
  return arr;
}

/***********************
 * DASHBOARD V3
 ***********************/
function getDashboardV3(req) {
  const data = getSheet_(SHEET_DATA).getDataRange().getValues();
  const serviceData = getSheet_(SHEET_SERVICE).getDataRange().getValues();
  const materialData = getSheet_(SHEET_MATERIAL).getDataRange().getValues();

  const today = fmtDate_(new Date(), "yyyy-MM-dd");

  let totalOrders = 0, todayReceived = 0, todayCompleted = 0, todayDelivered = 0;
  let overdue = 0, waitingParts = 0, repairing = 0, warrantyBack = 0;
  let revenue = 0, materialCost = 0, laborCost = 0, extraCost = 0, totalCost = 0, profit = 0;

  const byTech = {};
  const byStatus = {};
  const weeklyMap = {};
  const repairMap = {};
  const modelMap = {};
  const serviceByRepair = {};

  for (let w = 1; w <= 5; w++) weeklyMap[w] = { week: w, orders: 0, revenue: 0, cost: 0, profit: 0 };

  for (let i = 1; i < data.length; i++) {
    const r = data[i];
    const repairId = clean_(r[0]);
    if (!repairId) continue;

    const receiveDate = r[2] ? new Date(r[2]) : null;
    const receiveDateStr = receiveDate ? fmtDate_(receiveDate, "yyyy-MM-dd") : "";
    const status = String(r[21] || "");
    const tech = String(r[20] || "Chưa có KTV");
    const model = normalizeModel_(r[4]);
    const serviceType = String(r[7] || "");

    const rowRevenue = num_(r[31]);
    const rowMaterial = num_(r[27]);
    const rowLabor = num_(r[28]);
    const rowExtra = num_(r[29]);
    const rowCost = num_(r[30]);
    const rowProfit = num_(r[32]);

    totalOrders++;
    if (receiveDateStr === today) todayReceived++;
    if (r[22] && fmtDate_(r[22], "yyyy-MM-dd") === today) todayCompleted++;
    if (r[23] && fmtDate_(r[23], "yyyy-MM-dd") === today) todayDelivered++;
    if (isOverdue_(r[11], status)) overdue++;
    if (status === "6. Chờ linh kiện") waitingParts++;
    if (status === "5. Đang sửa") repairing++;
    if (status === "10. Bảo hành lại" || serviceType.indexOf("Bảo hành") >= 0) warrantyBack++;

    revenue += rowRevenue;
    materialCost += rowMaterial;
    laborCost += rowLabor;
    extraCost += rowExtra;
    totalCost += rowCost;
    profit += rowProfit;

    const wom = receiveDate ? weekOfMonth_(receiveDate) : 1;
    if (!weeklyMap[wom]) weeklyMap[wom] = { week: wom, orders: 0, revenue: 0, cost: 0, profit: 0 };
    weeklyMap[wom].orders++;
    weeklyMap[wom].revenue += rowRevenue;
    weeklyMap[wom].cost += rowCost;
    weeklyMap[wom].profit += rowProfit;

    if (!byTech[tech]) byTech[tech] = { technician: tech, total: 0, completed: 0, overdue: 0, revenue: 0, profit: 0 };
    byTech[tech].total++;
    byTech[tech].revenue += rowRevenue;
    byTech[tech].profit += rowProfit;
    if (status === "7. Đã hoàn thành" || status === "8. Đã bàn giao") byTech[tech].completed++;
    if (isOverdue_(r[11], status)) byTech[tech].overdue++;

    byStatus[status || "Không rõ"] = (byStatus[status || "Không rõ"] || 0) + 1;

    repairMap[repairId] = { repairId, model, revenue: rowRevenue, cost: rowCost, profit: rowProfit };
    if (!modelMap[model]) modelMap[model] = { model, orders: 0, services: {} };
    modelMap[model].orders++;
  }

  const serviceMap = {};
  for (let i = 1; i < serviceData.length; i++) {
    const repairId = clean_(serviceData[i][0]);
    const name = String(serviceData[i][2] || "Không rõ");
    const price = num_(serviceData[i][3]);
    const model = repairMap[repairId] ? repairMap[repairId].model : normalizeModel_(serviceData[i][1]);

    if (!serviceMap[name]) serviceMap[name] = { name, count: 0, revenue: 0, cost: 0, profit: 0 };
    serviceMap[name].count++;
    serviceMap[name].revenue += price;

    if (!serviceByRepair[repairId]) serviceByRepair[repairId] = [];
    serviceByRepair[repairId].push(name);

    if (!modelMap[model]) modelMap[model] = { model, orders: 0, services: {} };
    modelMap[model].services[name] = (modelMap[model].services[name] || 0) + 1;
  }

  const materialByRepair = {};
  const materialMap = {};
  for (let i = 1; i < materialData.length; i++) {
    const repairId = clean_(materialData[i][0]);
    const name = String(materialData[i][2] || "Không rõ");
    const qty = num_(materialData[i][3]);
    const cost = num_(materialData[i][5]);

    if (!materialMap[name]) materialMap[name] = { name, qty: 0, cost: 0 };
    materialMap[name].qty += qty;
    materialMap[name].cost += cost;

    if (!materialByRepair[repairId]) materialByRepair[repairId] = 0;
    materialByRepair[repairId] += cost;
  }

  Object.keys(serviceMap).forEach(name => {
    let estCost = 0;
    Object.keys(serviceByRepair).forEach(rid => {
      if (serviceByRepair[rid].includes(name)) {
        const share = serviceByRepair[rid].length || 1;
        estCost += (materialByRepair[rid] || 0) / share;
      }
    });
    serviceMap[name].cost = Math.round(estCost);
    serviceMap[name].profit = serviceMap[name].revenue - serviceMap[name].cost;
  });

  const servicesList = Object.values(serviceMap).sort((a,b) => b.revenue - a.revenue);
  const topServices = servicesList.slice(0, 10);

  const modelStats = Object.values(modelMap).map(m => {
    const entries = Object.entries(m.services).sort((a,b) => b[1] - a[1]);
    const top = entries[0] || ["Không rõ", 0];
    return {
      model: m.model,
      orders: m.orders,
      topService: top[0],
      topServiceQty: top[1],
      suggest: suggestFor_(top[0], m.model, top[1])
    };
  }).sort((a,b) => b.orders - a.orders).slice(0, 20);

  const serviceNames = servicesList.slice(0, 8).map(x => x.name);
  const matrixRows = Object.values(modelMap).sort((a,b) => b.orders - a.orders).slice(0, 20).map(m => {
    const values = {};
    serviceNames.forEach(s => values[s] = m.services[s] || 0);
    return { model: m.model, values };
  });

  const materialNeeds = buildMaterialNeedsFromMatrix_(matrixRows, serviceNames);

  return {
    ok: true,
    totalOrders,
    todayReceived,
    todayCompleted,
    todayDelivered,
    overdue,
    waitingParts,
    repairing,
    warrantyBack,
    revenue,
    materialCost,
    laborCost,
    extraCost,
    totalCost,
    profit,
    byTech: Object.values(byTech).sort((a,b) => b.profit - a.profit),
    byStatus,
    weekly: Object.values(weeklyMap).sort((a,b) => a.week - b.week),
    topServices,
    topMaterials: Object.values(materialMap).sort((a,b) => b.cost - a.cost).slice(0, 10),
    modelStats,
    matrix: { services: serviceNames, rows: matrixRows },
    materialNeeds
  };
}

function normalizeModel_(product) {
  let s = String(product || "").toUpperCase();
  s = s.replace(/IPHONE/g, "").replace(/IP/g, "").replace(/\s+/g, " ").trim();

  const m = s.match(/(XS MAX|XR|SE\s?\d?|11\s?PRO\s?MAX|12\s?PRO\s?MAX|13\s?PRO\s?MAX|14\s?PRO\s?MAX|15\s?PRO\s?MAX|16\s?PRO\s?MAX|11|12|13|14|15|16)/i);
  if (!m) return String(product || "Không rõ").trim() || "Không rõ";

  return m[1].replace(/\s+/g, " ").trim().replace("PRO MAX", "Pro Max");
}

function suggestFor_(service, model, qty) {
  const n = Math.ceil(num_(qty) * 1.4);
  if (/pin/i.test(service)) return "Pin " + model + ": tồn tối thiểu " + n;
  if (/kính|kinh|ép/i.test(service)) return "Kính " + model + ": tồn tối thiểu " + n;
  if (/màn|man/i.test(service)) return "Màn " + model + ": tồn tối thiểu " + n;
  return "Theo dõi thêm";
}

function buildMaterialNeedsFromMatrix_(rows, serviceNames) {
  const out = { pin: [], kinh: [], man: [], khac: [] };

  rows.forEach(r => {
    const pin = findServiceQty_(r.values, ["pin"]);
    const kinh = findServiceQty_(r.values, ["kính", "kinh", "ép", "ep"]);
    const man = findServiceQty_(r.values, ["màn", "man"]);

    if (pin > 0) out.pin.push({ name: "Pin " + r.model, need: pin, minStock: Math.ceil(pin * 1.4), note: "Dựa trên dịch vụ thay pin" });
    if (kinh > 0) out.kinh.push({ name: "Kính " + r.model, need: kinh, minStock: Math.ceil(kinh * 1.3), note: "Dựa trên dịch vụ ép/thay kính" });
    if (man > 0) out.man.push({ name: "Màn " + r.model, need: man, minStock: Math.ceil(man * 1.2), note: "Dựa trên dịch vụ thay màn" });
  });

  Object.keys(out).forEach(k => out[k].sort((a,b) => b.need - a.need));
  return out;
}

function findServiceQty_(values, keys) {
  let total = 0;
  Object.keys(values).forEach(k => {
    const low = k.toLowerCase();
    if (keys.some(x => low.indexOf(x) >= 0)) total += num_(values[k]);
  });
  return total;
}

function isOverdue_(appointment, status) {
  if (!appointment) return false;
  const doneStatus = ["7. Đã hoàn thành", "8. Đã bàn giao", "9. Back lại khách", "11. Hủy sửa"];
  if (doneStatus.includes(String(status || ""))) return false;
  return new Date(appointment) < new Date();
}

function calcOverdue_(appointment, status) {
  return isOverdue_(appointment, status) ? "Trễ" : "";
}

function writeLog_(repairId, imei, user, role, action, oldValue, newValue, note) {
  const sh = getSheet_(SHEET_LOG);
  sh.appendRow([now_(), repairId || "", clean_(imei), user || "", role || "", action || "", oldValue || "", newValue || "", note || ""]);
}
