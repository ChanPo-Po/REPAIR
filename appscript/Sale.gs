/* SALE.GS — Nhận đơn / danh mục / tra cứu / dữ liệu bill.
Cùng dự án và /exec với QuanLy.gs. Không khai báo doPost/doGet ở đây.
Các helper đặt trong namespace riêng, không trùng helper quản lý. */
var SaleAPI=(function(){
const SHEET_ID = '1GHk9rs_GEM8y-jdz3pL38Txd8ve6jINpRQ_AbwDUCEU'; // DATA chính POPOPHONE
const TZ = 'GMT+7';

const SHEETS = {
  DATA: 'DATA',
  CT_DICH_VU: 'CT_DICH_VU',
  CT_VAT_TU: 'CT_VAT_TU',
  LOG: 'LOG_SUA_CHUA',
  DM_TRANG_THAI: 'DM_TRANG_THAI',
  DM_DICH_VU: 'DM_DICH_VU',
  DM_VAT_TU: 'DM_VAT_TU',
  DM_LOAI_DICH_VU: 'DM_LOAI_DICH_VU',
  DM_KY_THUAT: 'DM_KY_THUAT',
  DM_NCC: 'DM_NCC',
  DM_DONG_MAY: 'DM_DONG_MAY',
  DM_NHAN_VIEN: 'DM_NHAN_VIEN',
  DM_HOA_HONG_THO: 'DM_HOA_HONG_THO',
  THO_NHAP_CONG: 'THO_NHAP_CONG',
  MAY_GUI_XU_LY: 'MAY_GUI_XU_LY',
  CHAM_CONG_THO: 'CHAM_CONG_THO',
  LUONG_THO: 'LUONG_THO'
};

const HEADERS_DATA = [
  'Mã sửa chữa', 'IMEI', 'Ngày nhận', 'Chi nhánh nhận', 'Sản phẩm',
  'Tên khách hàng', 'Số điện thoại', 'Loại dịch vụ', 'Tình trạng khi nhận máy',
  'Yêu cầu sửa chữa', 'Ghi chú tiếp nhận', 'Hẹn trả', 'FaceID', 'Màn hình',
  'Camera/Mic', 'Loa', 'Giá dự kiến', 'Nhân viên tiếp nhận', 'Dịch vụ sửa chữa',
  'Nơi xử lý', 'Kỹ thuật xử lý', 'Trạng thái máy', 'Ngày hoàn thành', 'Ngày bàn giao',
  'Trễ hẹn', 'Ghi chú kỹ thuật', 'Mã hóa đơn mua vật tư', 'Tên vật tư', 'Giá vật tư',
  'Công thợ', 'Tổng chi phí', 'Thực thu', 'Lợi nhuận', 'NCC', 'Trạng thái thanh toán',
  'Năm', 'Tháng', 'Tuần', 'Ngày tạo', 'Ngày cập nhật'
];

const MONEY_HEADERS = ['Giá dự kiến', 'Giá vật tư', 'Công thợ', 'Tổng chi phí', 'Thực thu', 'Lợi nhuận'];
const TEXT_HEADERS = ['IMEI', 'Số điện thoại'];

// Tài khoản quản trị đặt ở Apps Script, không public trên Netlify.
// Đổi mật khẩu trước khi deploy thật.

const DEFAULTS={DM_TRANG_THAI:['Trạng thái','1. Đã tiếp nhận','2. Đang kiểm tra','3. Chờ báo giá','4. Chờ khách duyệt','5. Đang sửa','6. Chờ linh kiện','7. Đã sửa xong','8. Đã trả khách','9. Back lại khách','10. Bảo hành lại','11. Hủy sửa']};
const API_VERSION='16.9.2';
let _SS_CACHE=null;

function sanitizeRepairForPublic_(r) {
  if (!r) return r;
  const x = Object.assign({}, r);
  ['materialCost', 'laborCost', 'totalCost', 'actualRevenue', 'profit', 'ncc', 'billCode', 'paymentStatus'].forEach(function (k) { delete x[k]; });
  return x;
}


function sanitizeRepairsForPublic_(rows) {
  return (rows || []).map(sanitizeRepairForPublic_);
}


function sanitizeDetailForPublic_(detail) {
  detail = detail || { success: true };
  return {
    success: detail.success !== false,
    data: sanitizeRepairForPublic_(detail.data),
    logs: [],
    services: detail.services || [],
    materials: []
  };
}


function ss() {
  if (!_SS_CACHE) _SS_CACHE = SpreadsheetApp.openById(SHEET_ID);
  return _SS_CACHE;
}


function sh(name) {
  const sheet = ss().getSheetByName(name);
  if (!sheet) throw new Error('Không tìm thấy sheet: ' + name);
  return sheet;
}


function nowText() {
  return Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy HH:mm:ss');
}


function weekInMonth(dateObj) {
  const d = dateObj || new Date();
  return Math.ceil(d.getDate() / 7);
}


function setupSheetsLite_(){const book=ss();ensureSheet(book,SHEETS.DATA,[HEADERS_DATA]);ensureSheet(book,SHEETS.LOG,[['ID','Mã sửa chữa','Thời gian','Người thực hiện','Hành động','Nội dung']]);}

function ensureSheet(book, name, rows) {
  let s = book.getSheetByName(name);
  if (!s) s = book.insertSheet(name);
  if (s.getLastRow() < 1) {
    s.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
    return;
  }

  // Nếu sheet cũ thiếu cột do nâng version, tự thêm cột thiếu vào cuối để API không lỗi.
  const expectedHeaders = Array.isArray(rows[0]) ? rows[0] : [];
  if (!expectedHeaders.length) return;
  const lastCol = Math.max(s.getLastColumn(), 1);
  const currentHeaders = s.getRange(1, 1, 1, lastCol).getValues()[0].map(function (x) { return String(x || '').trim(); });
  const normalizedCurrentHeaders = currentHeaders.map(normalizeHeader_);
  const missing = expectedHeaders.filter(function (h) {
    return normalizedCurrentHeaders.indexOf(normalizeHeader_(h)) === -1;
  });
  if (missing.length) {
    s.getRange(1, currentHeaders.length + 1, 1, missing.length).setValues([missing]);
  }
}


function headers(sheetName) {
  const sheet = sh(sheetName);
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
}


function mapHeader(sheetName) {
  const h = headers(sheetName);
  const m = {};
  h.forEach(function (x, i) {
    const key = String(x || '').trim();
    if (!key) return;
    // Luôn giữ cột xuất hiện đầu tiên. Nếu DATA lỡ có header trùng ở cuối,
    // API vẫn đọc và ghi vào cột gốc đang chứa dữ liệu.
    if (m[key] === undefined) m[key] = i;
  });
  return m;
}


function pick_(obj, keys) {
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    if (obj[k] !== undefined && obj[k] !== '') return obj[k];
  }
  return '';
}


function getMasters() {
  return {
    trangThai: readSingle(SHEETS.DM_TRANG_THAI),
    loaiDichVu: readSingle(SHEETS.DM_LOAI_DICH_VU),
    dichVu: readObjects(SHEETS.DM_DICH_VU).map(function (x) { return { name: pick_(x, ['Tên dịch vụ', 'Dịch vụ']), group: pick_(x, ['Nhóm dịch vụ', 'Nhóm']) }; }).filter(function (x) { return x.name; }),
    vatTu: readObjects(SHEETS.DM_VAT_TU).map(function (x) { return { name: pick_(x, ['Tên vật tư', 'Vật tư']), group: pick_(x, ['Nhóm vật tư', 'Nhóm']) }; }).filter(function (x) { return x.name; }),
    kyThuat: readObjects(SHEETS.DM_KY_THUAT).map(function (x) { return { name: pick_(x, ['Tên kỹ thuật', 'Kỹ thuật', 'Tên nhân viên']), branch: pick_(x, ['Chi nhánh', 'CN']), status: pick_(x, ['Trạng thái']) }; }).filter(function (x) { return x.name; }),
    ncc: readSingle(SHEETS.DM_NCC),
    dongMay: readSingle(SHEETS.DM_DONG_MAY),
    hoaHongTho: readObjects(SHEETS.DM_HOA_HONG_THO),
    nhanVien: readObjects(SHEETS.DM_NHAN_VIEN).map(function (x) {
      return {
        name: pick_(x, ['Tên nhân viên', 'Nhân viên', 'Họ tên', 'Tên', 'Tên nhân viên nhận']),
        branch: pick_(x, ['Chi nhánh', 'CN']),
        department: pick_(x, ['Bộ phận', 'Phòng ban', 'Vai trò', 'Nhóm']),
        status: pick_(x, ['Trạng thái', 'Tình trạng']) || 'Đang làm'
      };
    }).filter(function (x) { return x.name; })
  };
}


function readSingle(sheetName) {
  const values = sh(sheetName).getDataRange().getValues().slice(1);
  return values.map(function (r) { return r[0]; }).filter(Boolean);
}


function readObjects(sheetName) {
  const sheet = ss().getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  const h = values[0].map(function (x) { return String(x || '').trim(); });
  return values.slice(1).filter(function (r) { return r.join(''); }).map(function (r) {
    const o = {};
    h.forEach(function (k, i) { if (k) o[k] = r[i]; });
    return o;
  });
}


function normalizeHeader_(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, '');
}


function rowValue_(row, headerMap, aliases) {
  aliases = aliases || [];
  let firstExisting = '';

  // Ưu tiên cột có dữ liệu. Cách này chịu được sheet cũ có cả header alias
  // và header chuẩn mới được thêm ở cuối nhưng các dòng cũ vẫn đang nằm ở cột alias.
  for (let i = 0; i < aliases.length; i++) {
    const idx = headerMap[aliases[i]];
    if (idx === undefined) continue;
    const value = row[idx];
    if (firstExisting === '') firstExisting = value;
    if (value !== '' && value !== null && value !== undefined) return value;
  }

  const normalizedAliases = aliases.map(normalizeHeader_);
  const keys = Object.keys(headerMap);
  for (let i = 0; i < keys.length; i++) {
    if (normalizedAliases.indexOf(normalizeHeader_(keys[i])) === -1) continue;
    const value = row[headerMap[keys[i]]];
    if (firstExisting === '') firstExisting = value;
    if (value !== '' && value !== null && value !== undefined) return value;
  }
  return firstExisting || '';
}


function listRepairs() {
  const sheet = sh(SHEETS.DATA);
  const vals = sheet.getDataRange().getValues();
  if (vals.length <= 1) return [];
  const m = mapHeader(SHEETS.DATA);
  const rows = vals.slice(1).filter(function (r) {
    return String(rowValue_(r, m, ['Mã sửa chữa', 'Mã SC', 'Mã sửa', 'MA SUA CHUA']) || '').trim();
  }).map(function (r) { return rowToObj(r, m); }).reverse();

  return rows;
}


function rowToObj(r, m) {
  const v = function (aliases) { return rowValue_(r, m, aliases); };
  return {
    repairId: v(['Mã sửa chữa', 'Mã SC', 'Mã sửa', 'MA SUA CHUA']),
    imei: v(['IMEI', 'IMEI/Serial', 'Serial']),
    date: v(['Ngày nhận', 'Ngày tiếp nhận', 'Dấu thời gian']),
    branch: v(['Chi nhánh nhận', 'CN nhận', 'Chi nhánh', 'CN']),
    product: v(['Sản phẩm', 'Dòng máy', 'Tên máy']),
    customer: v(['Tên khách hàng', 'Họ tên khách hàng', 'Họ và tên', 'Khách hàng']),
    phone: v(['Số điện thoại', 'SĐT', 'Điện thoại']),
    serviceType: v(['Loại dịch vụ', 'Loại DV']),
    receiveStatus: v(['Tình trạng khi nhận máy', 'Tình trạng khi nhận', 'Tình trạng máy']),
    request: v(['Yêu cầu sửa chữa', 'Yêu cầu', 'Nội dung sửa chữa']),
    receiveNote: v(['Ghi chú tiếp nhận', 'Ghi chú nhận máy', 'Ghi chú']),
    appointment: v(['Hẹn trả', 'Ngày hẹn trả', 'Ngày hẹn']),
    faceId: v(['FaceID', 'Face ID']),
    screen: v(['Màn hình']),
    cameraMic: v(['Camera/Mic', 'Camera - Mic', 'Camera Mic']),
    speaker: v(['Loa']),
    estimate: moneyValue(v(['Giá dự kiến', 'Giá báo dự kiến', 'Báo giá dự kiến'])),
    staff: v(['Nhân viên tiếp nhận', 'Nhân viên', 'Người tiếp nhận']),
    repairService: v(['Dịch vụ sửa chữa', 'Dịch vụ', 'DV sửa chữa']),
    place: v(['Nơi xử lý', 'Đơn vị xử lý']),
    technician: v(['Kỹ thuật xử lý', 'Kỹ thuật', 'KTV']),
    status: v(['Trạng thái máy', 'Trạng thái', 'Tình trạng xử lý']),
    completedDate: v(['Ngày hoàn thành', 'Ngày sửa xong']),
    handoverDate: v(['Ngày bàn giao', 'Ngày trả khách']),
    overdue: v(['Trễ hẹn', 'Quá hẹn']),
    techNote: v(['Ghi chú kỹ thuật', 'Ghi chú KTV']),
    billCode: v(['Mã hóa đơn mua vật tư', 'Mã HĐ vật tư', 'Mã bill mua vật tư']),
    materialName: v(['Tên vật tư', 'Vật tư']),
    materialCost: moneyValue(v(['Giá vật tư', 'Chi phí vật tư'])),
    laborCost: moneyValue(v(['Công thợ', 'Tiền công'])),
    totalCost: moneyValue(v(['Tổng chi phí', 'Chi phí'])),
    actualRevenue: moneyValue(v(['Thực thu', 'Doanh thu', 'Khách thanh toán'])),
    profit: moneyValue(v(['Lợi nhuận'])),
    ncc: v(['NCC', 'Nhà cung cấp']),
    paymentStatus: v(['Trạng thái thanh toán', 'Thanh toán']),
    year: v(['Năm']),
    month: v(['Tháng']),
    week: v(['Tuần']),
    createdAt: v(['Ngày tạo', 'Thời gian tạo']),
    updatedAt: v(['Ngày cập nhật', 'Thời gian cập nhật'])
  };
}


function searchRepairs(q) {
  const raw = String(q || '').trim();
  if (!raw) return [];

  const query = normText_(raw);
  const qDigits = onlyDigits_(raw);
  const isNumeric = qDigits.length >= 4 && qDigits.length === raw.replace(/\s/g, '').length;

  const scored = listRepairs().map(function (x) {
    return { item: x, score: searchScore_(x, query, qDigits, isNumeric) };
  }).filter(function (x) {
    return x.score > 0;
  }).sort(function (a, b) {
    return b.score - a.score;
  });

  return scored.slice(0, 50).map(function (x) { return x.item; });
}


function searchScore_(x, query, qDigits, isNumeric) {
  const repairId = normText_(x.repairId || '');
  const repairDigits = onlyDigits_(x.repairId || '');
  const imei = onlyDigits_(x.imei || '');
  const phone = onlyDigits_(x.phone || '');
  const customer = normText_(x.customer || '');

  // Mã sửa chữa: cho phép tìm đủ mã hoặc một phần mã có chữ SC.
  if (query && repairId === query) return 100;
  if (query.indexOf('sc') === 0 && repairId.indexOf(query) > -1) return 95;

  // IMEI/SĐT: không quét toàn bộ JSON, chỉ khớp đúng field.
  if (qDigits) {
    if (imei && imei === qDigits) return 100;
    if (phone && phone === qDigits) return 100;
    if (repairDigits && repairDigits.indexOf(qDigits) > -1) return 96;

    // Cho phép tìm 6 số cuối IMEI hoặc 7 số cuối SĐT, nhưng vẫn chỉ trên field IMEI/SĐT.
    if (qDigits.length >= 6 && imei && imei.endsWith(qDigits)) return 92;
    if (qDigits.length >= 7 && phone && phone.endsWith(qDigits)) return 90;

    // Nếu người dùng nhập toàn số thì không tìm trong ngày/giá/trạng thái để tránh ra rác.
    if (isNumeric) return 0;
  }

  // Tên khách: ưu tiên trùng khớp nhất.
  if (query && customer) {
    if (customer === query) return 85;
    if (customer.startsWith(query)) return 78;

    const tokens = query.split(/\s+/).filter(Boolean);
    if (tokens.length && tokens.every(function (t) { return customer.indexOf(t) > -1; })) return 70;
    if (query.length >= 3 && customer.indexOf(query) > -1) return 60;
  }

  return 0;
}


function normText_(v) {
  return String(v || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ')
    .trim();
}


function onlyDigits_(v) {
  return String(v || '').replace(/\D/g, '');
}


function randomCode_(len) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < len; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}


function repairCodeExists(code) {
  const sheet = sh(SHEETS.DATA);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  const m = mapHeader(SHEETS.DATA);
  if (m['Mã sửa chữa'] === undefined) throw new Error('DATA thiếu cột Mã sửa chữa');
  const values = sheet.getRange(2, m['Mã sửa chữa'] + 1, lastRow - 1, 1).getValues().flat();
  return values.some(function (x) { return String(x || '').trim() === String(code || '').trim(); });
}


function generateRepairCode(imei, branch) {
  const tail = onlyDigits_(imei).slice(-6).padStart(6, '0');
  const br = onlyDigits_(branch || '').slice(-3) || '000';
  let code = '';
  let guard = 0;
  do {
    code = 'SC' + br + '-' + tail + '-' + randomCode_(3);
    guard++;
  } while (repairCodeExists(code) && guard < 50);

  if (repairCodeExists(code)) {
    code = 'SC' + br + '-' + tail + '-' + randomCode_(5);
  }
  return code;
}


function normalizeReceiveData_(d) {
  d = d || {};
  return {
    imei: onlyDigits_(d.imei).slice(0, 6),
    phone: onlyDigits_(d.phone).slice(0, 10),
    branch: String(d.branch || '').trim(),
    product: String(d.product || '').trim(),
    customer: String(d.customer || '').replace(/\s+/g, ' ').trim(),
    serviceType: String(d.serviceType || '').trim(),
    receiveStatus: String(d.receiveStatus || '').trim(),
    request: String(d.request || '').trim(),
    receiveNote: String(d.receiveNote || '').trim(),
    appointment: d.appointment || '',
    faceId: String(d.faceId || '').trim(),
    screen: String(d.screen || '').trim(),
    cameraMic: String(d.cameraMic || '').trim(),
    speaker: String(d.speaker || '').trim(),
    estimate: d.estimate || 0,
    staff: String(d.staff || '').trim(),
    clientRequestId: String(d.clientRequestId || '').trim()
  };
}


function validateReceiveData_(d) {
  const errors = [];
  if (!/^\d{6}$/.test(d.imei)) errors.push('IMEI phải nhập đúng 6 số.');
  if (!/^0\d{9}$/.test(d.phone)) errors.push('SĐT phải đủ 10 số và bắt đầu bằng 0.');
  if (!d.product) errors.push('Chưa chọn dòng máy.');
  if (!d.branch) errors.push('Chưa chọn chi nhánh nhận.');
  if (!d.customer || d.customer.length < 2) errors.push('Tên khách hàng chưa hợp lệ.');
  if (!d.serviceType) errors.push('Chưa chọn loại dịch vụ.');
  if (!d.receiveStatus || d.receiveStatus.length < 5) errors.push('Tình trạng khi nhận máy quá sơ sài.');
  if (!d.request || d.request.length < 3) errors.push('Yêu cầu sửa chữa quá sơ sài.');
  if (!d.staff) errors.push('Chưa chọn nhân viên tiếp nhận.');
  return errors;
}


function normCompare_(v) {
  return normText_(v);
}


function sameText_(a, b) {
  return normCompare_(a) === normCompare_(b);
}


function todayPrefix_() {
  return Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy');
}


function findRecentDuplicateRepair_(d) {
  const sheet = sh(SHEETS.DATA);
  const last = sheet.getLastRow();
  if (last < 2) return '';

  const m = mapHeader(SHEETS.DATA);
  const start = Math.max(2, last - 120);
  const values = sheet.getRange(start, 1, last - start + 1, sheet.getLastColumn()).getDisplayValues();
  const today = todayPrefix_();

  for (let i = values.length - 1; i >= 0; i--) {
    const row = values[i];
    const created = m['Ngày tạo'] !== undefined ? String(row[m['Ngày tạo']] || '') : '';
    const received = m['Ngày nhận'] !== undefined ? String(row[m['Ngày nhận']] || '') : '';
    const sameToday = created.indexOf(today) === 0 || received.indexOf(today) === 0 || !created;
    if (!sameToday) continue;

    const same =
      sameText_(row[m['IMEI']], d.imei) &&
      sameText_(row[m['Số điện thoại']], d.phone) &&
      sameText_(row[m['Chi nhánh nhận']], d.branch) &&
      sameText_(row[m['Sản phẩm']], d.product) &&
      sameText_(row[m['Tên khách hàng']], d.customer) &&
      sameText_(row[m['Loại dịch vụ']], d.serviceType) &&
      sameText_(row[m['Yêu cầu sửa chữa']], d.request) &&
      sameText_(row[m['Hẹn trả']], d.appointment);

    if (same) return String(row[m['Mã sửa chữa']] || '');
  }
  return '';
}


function rememberClientRequest_(requestId, repairId) {
  if (!requestId) return;
  PropertiesService.getScriptProperties().setProperty('CREATE_REPAIR_' + requestId, repairId);
}


function getClientRequestRepair_(requestId) {
  if (!requestId) return '';
  return PropertiesService.getScriptProperties().getProperty('CREATE_REPAIR_' + requestId) || '';
}


function createRepair(d) {
  d = normalizeReceiveData_(d);
  const errors = validateReceiveData_(d);
  if (errors.length) return { success: false, message: errors.join(' ') };

  const previousByRequest = getClientRequestRepair_(d.clientRequestId);
  if (previousByRequest) return { success: true, repairId: previousByRequest, duplicate: true, message: 'Phiếu này đã được lưu trước đó.' };

  const duplicateId = findRecentDuplicateRepair_(d);
  if (duplicateId) {
    rememberClientRequest_(d.clientRequestId, duplicateId);
    return { success: true, repairId: duplicateId, duplicate: true, message: 'Đã phát hiện phiếu trùng trong hôm nay.' };
  }

  const now = new Date();
  const id = generateRepairCode(d.imei, d.branch);
  const week = weekInMonth(now);
  const year = Number(Utilities.formatDate(now, TZ, 'yyyy'));
  const month = Number(Utilities.formatDate(now, TZ, 'M'));
  const dict = {
    'Mã sửa chữa': id, 'IMEI': d.imei || '', 'Ngày nhận': nowText(), 'Chi nhánh nhận': d.branch || '', 'Sản phẩm': d.product || '', 'Tên khách hàng': d.customer || '', 'Số điện thoại': d.phone || '', 'Loại dịch vụ': d.serviceType || '', 'Tình trạng khi nhận máy': d.receiveStatus || '', 'Yêu cầu sửa chữa': d.request || '', 'Ghi chú tiếp nhận': d.receiveNote || '', 'Hẹn trả': d.appointment || '', 'FaceID': d.faceId || '', 'Màn hình': d.screen || '', 'Camera/Mic': d.cameraMic || '', 'Loa': d.speaker || '', 'Giá dự kiến': moneyValue(d.estimate), 'Nhân viên tiếp nhận': d.staff || '', 'Trạng thái máy': '2. Đang kiểm tra', 'Trạng thái thanh toán': 'Chưa thanh toán', 'Năm': year, 'Tháng': month, 'Tuần': week, 'Ngày tạo': nowText(), 'Ngày cập nhật': nowText()
  };
  const dataHeaders = headers(SHEETS.DATA);
  const row = dataHeaders.map(function (h) {
    const key = String(h || '').trim();
    if (dict[key] !== undefined) return dict[key];
    if (['Giá vật tư', 'Công thợ', 'Tổng chi phí', 'Thực thu', 'Lợi nhuận'].indexOf(key) > -1) return 0;
    return '';
  });
  sh(SHEETS.DATA).appendRow(row);
  rememberClientRequest_(d.clientRequestId, id);
  addLog(id, d.staff || 'Sale', 'Tiếp nhận', 'Tạo phiếu tiếp nhận');
  if(typeof invalidateOpsData_==='function')invalidateOpsData_();
  return { success: true, repairId: id };
}


function findRow(id) {
  const sheet = sh(SHEETS.DATA);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const m = mapHeader(SHEETS.DATA);
  if (m['Mã sửa chữa'] === undefined) throw new Error('DATA thiếu cột Mã sửa chữa');
  const vals = sheet.getRange(2, m['Mã sửa chữa'] + 1, lastRow - 1, 1).getValues().flat();
  const target = String(id || '').trim();
  const idx = vals.findIndex(function (x) { return String(x || '').trim() === target; });
  return idx >= 0 ? idx + 2 : -1;
}


function getDetail(id){const row=findRow(id);if(row<2)return {success:false,message:'Không tìm thấy đơn sửa chữa.'};const sheet=sh(SHEETS.DATA),map=mapHeader(SHEETS.DATA),values=sheet.getRange(row,1,1,sheet.getLastColumn()).getValues()[0];return {success:true,data:rowToObj(values,map),logs:[],services:[],materials:[]};}

function addLog(id, user, action, content) {
  sh(SHEETS.LOG).appendRow([Utilities.getUuid(), id, nowText(), user, action, content]);
}


function moneyValue(value) {
  if (value instanceof Date) {
    // Trường hợp cột tiền bị format nhầm Date: Google Sheet biến 1000000 thành 26/11/4637.
    // Đổi ngược Date serial về số tiền để dashboard/tra cứu vẫn đọc đúng.
    const epoch = new Date(1899, 11, 30);
    const serial = Math.round((value.getTime() - epoch.getTime()) / 86400000);
    return serial > 0 ? serial : 0;
  }
  if (typeof value === 'number') return value;
  const raw = String(value == null ? '' : value).trim();
  if (!raw) return 0;
  if (/\d{1,2}\/\d{1,2}\/\d{4}/.test(raw) && /4637|4636|4638/.test(raw)) {
    const parts = raw.split(/[\/\s:]+/).map(Number);
    if (parts.length >= 3) {
      const d = new Date(parts[2], parts[1] - 1, parts[0]);
      const epoch = new Date(1899, 11, 30);
      const serial = Math.round((d.getTime() - epoch.getTime()) / 86400000);
      return serial > 0 ? serial : 0;
    }
  }
  let cleaned = raw.replace(/đ|₫|\s/g, '');
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(cleaned)) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    cleaned = cleaned.replace(/,/g, '');
  }
  const num = Number(cleaned.replace(/[^\d.-]/g, ''));
  return isNaN(num) ? 0 : num;
}


function getPublicMasters_() {
 // Sale needs only intake catalogs, never financial or technician catalogs.
 const cache=CacheService.getScriptCache(),key='REPAIR_SALE_MASTERS_'+API_VERSION,cached=cache.get(key);
 if(cached){try{return JSON.parse(cached);}catch(e){}}
 const data={
  trangThai:DEFAULTS.DM_TRANG_THAI.slice(1),
  loaiDichVu:readSingle(SHEETS.DM_LOAI_DICH_VU),
  dongMay:readSingle(SHEETS.DM_DONG_MAY),
  dichVu:readObjects(SHEETS.DM_DICH_VU).map(function(x){return {name:pick_(x,['Tên dịch vụ','Dịch vụ']),group:pick_(x,['Nhóm dịch vụ','Nhóm'])};}).filter(function(x){return x.name;}),
  nhanVien:readObjects(SHEETS.DM_NHAN_VIEN).map(function(x){return {name:pick_(x,['Tên nhân viên','Nhân viên','Họ tên','Tên','Tên nhân viên nhận']),branch:pick_(x,['Chi nhánh','CN']),department:pick_(x,['Bộ phận','Phòng ban','Vai trò','Nhóm']),status:pick_(x,['Trạng thái','Tình trạng'])||'Đang làm'};}).filter(function(x){return x.name;})
 };
 try{cache.put(key,JSON.stringify(data),300);}catch(e){}return data;
}

function saleHandle_(body){switch(body.action){case 'getMasters':return {success:true,data:getPublicMasters_()};case 'createRepair':setupSheetsLite_();return createRepair(body.data||{});case 'search':return {success:true,data:sanitizeRepairsForPublic_(searchRepairs(body.q||''))};case 'getDetail':return sanitizeDetailForPublic_(getDetail(body.repairId));default:return {success:false,message:'Sale không hỗ trợ action: '+String(body.action||'')};}}

return {handle:saleHandle_};
})();
