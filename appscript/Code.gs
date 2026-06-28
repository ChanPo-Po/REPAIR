/* POPOPHONE Repair V9 - Google Apps Script API
Deploy: Apps Script > Deploy > Web app > Execute as Me > Anyone.
*/
const SHEET_ID = 'PASTE_SPREADSHEET_ID_HERE';
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
  MAY_GUI_XU_LY: 'MAY_GUI_XU_LY'
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


const DEFAULTS = {
  DM_TRANG_THAI: ['Trạng thái', '1. Đã tiếp nhận', '2. Đang kiểm tra', '3. Chờ báo giá', '4. Chờ khách duyệt', '5. Đang sửa', '6. Chờ linh kiện', '7. Đã sửa xong', '8. Đã trả khách', '9. Back lại khách', '10. Bảo hành lại', '11. Hủy sửa'],
  DM_LOAI_DICH_VU: ['Tên loại dịch vụ', 'Khách cũ lấy phí', 'Sửa chữa mới', 'Bảo hành', 'Thay pin miễn phí', 'Đặc quyền tối thượng', 'Khách đối tác'],
  DM_DICH_VU: [['Tên dịch vụ', 'Nhóm dịch vụ'], ['Thay pin KSC', 'Pin'], ['Thay pin KSC DLC', 'Pin'], ['Ép kính', 'Kính'], ['Thay màn Zin New', 'Màn hình'], ['Thay màn OLED', 'Màn hình'], ['Fix màn', 'Màn hình'], ['Sửa Face ID', 'FaceID'], ['Vệ sinh máy', 'Vệ sinh']],
  DM_VAT_TU: [['Tên vật tư', 'Nhóm vật tư'], ['Pin KSC (Gold)', 'Pin'], ['Pin KSC DLC', 'Pin'], ['Kính + ron', 'Kính'], ['Màn Zin New', 'Màn hình'], ['Màn OLED', 'Màn hình']],
  DM_KY_THUAT: [['Tên kỹ thuật', 'Chi nhánh', 'Trạng thái'], ['Thanh', '113', 'Đang làm'], ['Trường', '113', 'Đang làm'], ['Phong', '113', 'Đang làm'], ['Thành', '113', 'Đang làm'], ['Hà', '113', 'Đang làm']],
  DM_NCC: ['Tên NCC', 'Thắng', 'Vtech', 'Hồ Chí Trung', 'Nhà', 'Mua từ thợ', 'Maxe', 'Luban'],
  DM_DONG_MAY: ['Tên dòng máy', '11', '11PM', '12', '12PM', '12PRO', '13', '13PM', '14PM', '15PM', '16PM'],
  DM_NHAN_VIEN: [['Tên nhân viên', 'Chi nhánh', 'Bộ phận', 'Trạng thái'], ['Chan', '113', 'SALE', 'Đang làm'], ['Hùng', '113', 'SALE', 'Đang làm'], ['Trường', '113', 'SALE', 'Đang làm']],
  DM_HOA_HONG_THO: [['Kỹ thuật', 'MODEL', 'THAY PIN CÓ SÀN CỔ', 'THAY PIN KHÔNG SÀN CỔ', 'PHẢN QUANG', 'FIX ẢO', 'ÉP KÍNH', 'ÉP CẢM', 'THAY VỎ', 'LƯNG MẮT TO'], ['Thanh', '8P', 0, 0, 50, 0, 50, 0, 90, 0], ['Thanh', 'X', 0, 0, 0, 0, 0, 0, 90, 0], ['Thanh', 'XS', 50, 30, 0, 30, 80, 180, 90, 80], ['Thanh', 'XR', 50, 30, 50, 30, 80, 180, 90, 80], ['Thanh', 'XSM', 50, 30, 0, 30, 130, 230, 90, 80], ['Thanh', '11', 50, 30, 50, 30, 130, 230, 90, 90], ['Thanh', '11PRO', 50, 30, 0, 30, 130, 230, 90, 90], ['Thanh', '11PROMAX', 50, 30, 0, 30, 130, 230, 90, 90], ['Thanh', '12', 60, 30, 0, 30, 190, 250, 90, 90], ['Thanh', '12PRO', 60, 30, 0, 30, 190, 250, 90, 90], ['Thanh', '12PROMAX', 80, 30, 0, 30, 220, 280, 90, 100], ['Thanh', '13', 90, 30, 0, 30, 180, 0, 90, 100], ['Thanh', '13PRO', 90, 30, 0, 30, 180, 0, 90, 130], ['Thanh', '13PROMAX', 90, 30, 0, 30, 230, 0, 90, 130], ['Thanh', '14', 80, 30, 0, 30, 180, 0, 90, 0], ['Thanh', '14PLUS', 80, 30, 0, 30, 220, 0, 100, 0], ['Thanh', '14PRO', 120, 30, 0, 30, 250, 0, 100, 170], ['Thanh', '14PROMAX', 120, 30, 0, 30, 260, 0, 100, 170], ['Thanh', '15', 120, 120, 0, 30, 0, 0, 0, 0], ['Thanh', '15PLUS', 120, 120, 0, 30, 0, 0, 0, 0], ['Thanh', '15PRO', 130, 130, 0, 30, 0, 0, 0, 0], ['Thanh', '15PROMAX', 130, 130, 0, 30, 0, 0, 0, 0], ['Thanh', '16PRO', 0, 0, 0, 0, 0, 0, 0, 0], ['Thanh', '16PROMAX', 0, 0, 0, 0, 0, 0, 0, 0], ['Trường', '8P', 0, 0, 50, 0, 50, 0, 90, 0], ['Trường', 'X', 0, 0, 0, 0, 0, 0, 90, 0], ['Trường', 'XS', 50, 30, 0, 30, 80, 180, 90, 80], ['Trường', 'XR', 50, 30, 50, 30, 80, 180, 90, 80], ['Trường', 'XSM', 50, 30, 0, 30, 130, 230, 90, 80], ['Trường', '11', 50, 30, 50, 30, 130, 230, 90, 90], ['Trường', '11PRO', 50, 30, 0, 30, 130, 230, 90, 90], ['Trường', '11PROMAX', 50, 30, 0, 30, 130, 230, 90, 90], ['Trường', '12', 60, 30, 0, 30, 190, 250, 90, 90], ['Trường', '12PRO', 60, 30, 0, 30, 190, 250, 90, 90], ['Trường', '12PROMAX', 80, 30, 0, 30, 220, 280, 90, 100], ['Trường', '13', 90, 30, 0, 30, 180, 0, 90, 100], ['Trường', '13PRO', 90, 30, 0, 30, 180, 0, 90, 130], ['Trường', '13PROMAX', 90, 30, 0, 30, 230, 0, 90, 130], ['Trường', '14', 80, 30, 0, 30, 180, 0, 90, 0], ['Trường', '14PLUS', 80, 30, 0, 30, 220, 0, 100, 0], ['Trường', '14PRO', 120, 30, 0, 30, 250, 0, 100, 170], ['Trường', '14PROMAX', 120, 30, 0, 30, 260, 0, 100, 170], ['Trường', '15', 120, 120, 0, 30, 0, 0, 0, 0], ['Trường', '15PLUS', 120, 120, 0, 30, 0, 0, 0, 0], ['Trường', '15PRO', 130, 130, 0, 30, 0, 0, 0, 0], ['Trường', '15PROMAX', 130, 130, 0, 30, 0, 0, 0, 0], ['Trường', '16PRO', 0, 0, 0, 0, 0, 0, 0, 0], ['Trường', '16PROMAX', 0, 0, 0, 0, 0, 0, 0, 0], ['Phong', '8P', 0, 0, 50, 0, 50, 0, 90, 0], ['Phong', 'X', 0, 0, 0, 0, 0, 0, 90, 0], ['Phong', 'XS', 50, 30, 0, 30, 80, 180, 90, 80], ['Phong', 'XR', 50, 30, 50, 30, 80, 180, 90, 80], ['Phong', 'XSM', 50, 30, 0, 30, 130, 230, 90, 80], ['Phong', '11', 50, 30, 50, 30, 130, 230, 90, 90], ['Phong', '11PRO', 50, 30, 0, 30, 130, 230, 90, 90], ['Phong', '11PROMAX', 50, 30, 0, 30, 130, 230, 90, 90], ['Phong', '12', 60, 30, 0, 30, 190, 250, 90, 90], ['Phong', '12PRO', 60, 30, 0, 30, 190, 250, 90, 90], ['Phong', '12PROMAX', 80, 30, 0, 30, 220, 280, 90, 100], ['Phong', '13', 90, 30, 0, 30, 180, 0, 90, 100], ['Phong', '13PRO', 90, 30, 0, 30, 180, 0, 90, 130], ['Phong', '13PROMAX', 90, 30, 0, 30, 230, 0, 90, 130], ['Phong', '14', 80, 30, 0, 30, 180, 0, 90, 0], ['Phong', '14PLUS', 80, 30, 0, 30, 220, 0, 100, 0], ['Phong', '14PRO', 120, 30, 0, 30, 250, 0, 100, 170], ['Phong', '14PROMAX', 120, 30, 0, 30, 260, 0, 100, 170], ['Phong', '15', 120, 120, 0, 30, 0, 0, 0, 0], ['Phong', '15PLUS', 120, 120, 0, 30, 0, 0, 0, 0], ['Phong', '15PRO', 130, 130, 0, 30, 0, 0, 0, 0], ['Phong', '15PROMAX', 130, 130, 0, 30, 0, 0, 0, 0], ['Phong', '16PRO', 0, 0, 0, 0, 0, 0, 0, 0], ['Phong', '16PROMAX', 0, 0, 0, 0, 0, 0, 0, 0], ['Thành', '8P', 0, 0, 50, 0, 50, 0, 90, 0], ['Thành', 'X', 0, 0, 0, 0, 0, 0, 90, 0], ['Thành', 'XS', 50, 30, 0, 30, 80, 180, 90, 80], ['Thành', 'XR', 50, 30, 50, 30, 80, 180, 90, 80], ['Thành', 'XSM', 50, 30, 0, 30, 130, 230, 90, 80], ['Thành', '11', 50, 30, 50, 30, 130, 230, 90, 90], ['Thành', '11PRO', 50, 30, 0, 30, 130, 230, 90, 90], ['Thành', '11PROMAX', 50, 30, 0, 30, 130, 230, 90, 90], ['Thành', '12', 60, 30, 0, 30, 190, 250, 90, 90], ['Thành', '12PRO', 60, 30, 0, 30, 190, 250, 90, 90], ['Thành', '12PROMAX', 80, 30, 0, 30, 220, 280, 90, 100], ['Thành', '13', 90, 30, 0, 30, 180, 0, 90, 100], ['Thành', '13PRO', 90, 30, 0, 30, 180, 0, 90, 130], ['Thành', '13PROMAX', 90, 30, 0, 30, 230, 0, 90, 130], ['Thành', '14', 80, 30, 0, 30, 180, 0, 90, 0], ['Thành', '14PLUS', 80, 30, 0, 30, 220, 0, 100, 0], ['Thành', '14PRO', 120, 30, 0, 30, 250, 0, 100, 170], ['Thành', '14PROMAX', 120, 30, 0, 30, 260, 0, 100, 170], ['Thành', '15', 120, 120, 0, 30, 0, 0, 0, 0], ['Thành', '15PLUS', 120, 120, 0, 30, 0, 0, 0, 0], ['Thành', '15PRO', 130, 130, 0, 30, 0, 0, 0, 0], ['Thành', '15PROMAX', 130, 130, 0, 30, 0, 0, 0, 0], ['Thành', '16PRO', 0, 0, 0, 0, 0, 0, 0, 0], ['Thành', '16PROMAX', 0, 0, 0, 0, 0, 0, 0, 0], ['Hà', '8P', 0, 0, 50, 0, 50, 0, 90, 0], ['Hà', 'X', 0, 0, 0, 0, 0, 0, 90, 0], ['Hà', 'XS', 50, 30, 0, 30, 80, 180, 90, 80], ['Hà', 'XR', 50, 30, 50, 30, 80, 180, 90, 80], ['Hà', 'XSM', 50, 30, 0, 30, 130, 230, 90, 80], ['Hà', '11', 50, 30, 50, 30, 130, 230, 90, 90], ['Hà', '11PRO', 50, 30, 0, 30, 130, 230, 90, 90], ['Hà', '11PROMAX', 50, 30, 0, 30, 130, 230, 90, 90], ['Hà', '12', 60, 30, 0, 30, 190, 250, 90, 90], ['Hà', '12PRO', 60, 30, 0, 30, 190, 250, 90, 90], ['Hà', '12PROMAX', 80, 30, 0, 30, 220, 280, 90, 100], ['Hà', '13', 90, 30, 0, 30, 180, 0, 90, 100], ['Hà', '13PRO', 90, 30, 0, 30, 180, 0, 90, 130], ['Hà', '13PROMAX', 90, 30, 0, 30, 230, 0, 90, 130], ['Hà', '14', 80, 30, 0, 30, 180, 0, 90, 0], ['Hà', '14PLUS', 80, 30, 0, 30, 220, 0, 100, 0], ['Hà', '14PRO', 120, 30, 0, 30, 250, 0, 100, 170], ['Hà', '14PROMAX', 120, 30, 0, 30, 260, 0, 100, 170], ['Hà', '15', 120, 120, 0, 30, 0, 0, 0, 0], ['Hà', '15PLUS', 120, 120, 0, 30, 0, 0, 0, 0], ['Hà', '15PRO', 130, 130, 0, 30, 0, 0, 0, 0], ['Hà', '15PROMAX', 130, 130, 0, 30, 0, 0, 0, 0], ['Hà', '16PRO', 0, 0, 0, 0, 0, 0, 0, 0], ['Hà', '16PROMAX', 0, 0, 0, 0, 0, 0, 0, 0]],
  THO_NHAP_CONG: [['Ngày', 'Kỹ thuật', 'IMEI', 'Dòng máy', 'Dịch vụ', 'SL', 'Hoa hồng', 'Ghi chú', 'Nguồn nhập', 'Trạng thái duyệt', 'Ngày tạo', 'Người nhập']],
  MAY_GUI_XU_LY: [['Ngày gửi', 'IMEI', 'Dòng máy', 'Xử lý 1', 'Xử lý 2', 'Kỹ thuật', 'Người gửi', 'Tại sao chưa nhận', 'Trạng thái', 'Đã đối chiếu công', 'Ngày tạo', 'Ngày cập nhật']]
};

function doGet() {
  setupSheets();
  return json({ success: true, message: 'POPOPHONE Repair V9 API OK' });
}

function doPost(e) {
  try {
    setupSheets();
    const body = JSON.parse(e.postData.contents || '{}');
    const action = body.action;

    if (action === 'getMasters') return json({ success: true, data: getMasters() });
    if (action === 'createRepair') return json(createRepair(body.data || {}));
    if (action === 'list') return json({ success: true, data: listRepairs() });
    if (action === 'search') return json({ success: true, data: searchRepairs(body.q || '') });
    if (action === 'getDetail') return json(getDetail(body.repairId));
    if (action === 'updateStatus') return json(updateStatus(body.repairId, body.data || {}));
    if (action === 'quickStatus') return json(updateStatus(body.repairId, body.data || {}));
    if (action === 'updateCost') return json(updateCost(body.repairId, body.data || {}));
    if (action === 'getDashboard') return json({ success: true, data: getDashboard() });
    if (action === 'createTechWork') return json(createTechWork(body.data || {}));
    if (action === 'createSentRepair') return json(createSentRepair(body.data || {}));
    if (action === 'updateSentRepair') return json(updateSentRepair(body.rowNumber, body.data || {}));
    if (action === 'backfillOldDataToCT') return json(backfillOldDataToCT());
    if (action === 'unlockRepair') return json(unlockRepair(body.repairId, body.data || {}));
    if (action === 'fixMoneyDateColumns') return json(fixMoneyDateColumns());

    return json({ success: false, message: 'Unknown action: ' + action });
  } catch (err) {
    return json({ success: false, message: String(err && err.stack || err) });
  }
}

function ss() {
  return SpreadsheetApp.openById(SHEET_ID);
}

function sh(name) {
  return ss().getSheetByName(name);
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function nowText() {
  return Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy HH:mm:ss');
}

function weekInMonth(dateObj) {
  const d = dateObj || new Date();
  return Math.ceil(d.getDate() / 7);
}

function setupSheets() {
  const book = ss();
  ensureSheet(book, SHEETS.DATA, [HEADERS_DATA]);
  applyDataNumberFormats_(sh(SHEETS.DATA), mapHeader(SHEETS.DATA));
  ensureSheet(book, SHEETS.CT_DICH_VU, [['Mã sửa chữa', 'Tên dịch vụ', 'Giá bán', 'Ghi chú', 'Người thêm', 'Ngày thêm']]);
  ensureSheet(book, SHEETS.CT_VAT_TU, [['Mã sửa chữa', 'Mã bill mua vật tư', 'Tên vật tư', 'SL', 'Đơn giá', 'Thành tiền', 'NCC', 'Người thêm', 'Ngày thêm']]);
  ensureSheet(book, SHEETS.LOG, [['ID', 'Mã sửa chữa', 'Thời gian', 'Người thực hiện', 'Hành động', 'Nội dung']]);

  Object.keys(DEFAULTS).forEach(function (key) {
    const val = DEFAULTS[key];
    const rows = Array.isArray(val[0]) ? val : val.map(function (x) { return [x]; });
    ensureSheet(book, SHEETS[key], rows);
  });
}

function ensureSheet(book, name, rows) {
  let s = book.getSheetByName(name);
  if (!s) s = book.insertSheet(name);
  if (s.getLastRow() < 1) s.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
}

function headers(sheetName) {
  const sheet = sh(sheetName);
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
}

function mapHeader(sheetName) {
  const h = headers(sheetName);
  const m = {};
  h.forEach(function (x, i) { m[String(x).trim()] = i; });
  return m;
}

function setCell(sheet, row, map, header, value) {
  if (map[header] === undefined) return;
  const cell = sheet.getRange(row, map[header] + 1);
  if (MONEY_HEADERS.indexOf(header) > -1) {
    setMoneyCell_(cell, value);
    return;
  }
  if (TEXT_HEADERS.indexOf(header) > -1) {
    cell.setNumberFormat('@').setValue(String(value || ''));
    return;
  }
  cell.setValue(value);
}

function setMoneyCell_(range, value) {
  const num = moneyValue(value);
  range.setNumberFormat('#,##0').setValue(num || 0);
}

function applyDataNumberFormats_(sheet, map) {
  TEXT_HEADERS.forEach(function (h) {
    if (map[h] !== undefined) {
      sheet.getRange(1, map[h] + 1, Math.max(sheet.getMaxRows(), 1000), 1).setNumberFormat('@');
    }
  });

  MONEY_HEADERS.forEach(function (h) {
    if (map[h] !== undefined) {
      sheet.getRange(1, map[h] + 1, Math.max(sheet.getMaxRows(), 1000), 1).setNumberFormat('#,##0');
    }
  });
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
  const sheet = sh(sheetName);
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  const h = values[0];
  return values.slice(1).filter(function (r) { return r.join(''); }).map(function (r) {
    const o = {};
    h.forEach(function (k, i) { o[k] = r[i]; });
    return o;
  });
}

function listRepairs() {
  const sheet = sh(SHEETS.DATA);
  const vals = sheet.getDataRange().getValues();
  if (vals.length <= 1) return [];
  const m = mapHeader(SHEETS.DATA);
  return vals.slice(1).filter(function (r) { return r[m['Mã sửa chữa']]; }).map(function (r) { return rowToObj(r, m); }).reverse();
}

function rowToObj(r, m) {
  return {
    repairId: r[m['Mã sửa chữa']], imei: r[m['IMEI']], date: r[m['Ngày nhận']], branch: r[m['Chi nhánh nhận']], product: r[m['Sản phẩm']], customer: r[m['Tên khách hàng']], phone: r[m['Số điện thoại']], serviceType: r[m['Loại dịch vụ']], receiveStatus: r[m['Tình trạng khi nhận máy']], request: r[m['Yêu cầu sửa chữa']], receiveNote: r[m['Ghi chú tiếp nhận']], appointment: r[m['Hẹn trả']], faceId: r[m['FaceID']], screen: r[m['Màn hình']], cameraMic: r[m['Camera/Mic']], speaker: r[m['Loa']], estimate: moneyValue(r[m['Giá dự kiến']]), staff: r[m['Nhân viên tiếp nhận']], repairService: r[m['Dịch vụ sửa chữa']], place: r[m['Nơi xử lý']], technician: r[m['Kỹ thuật xử lý']], status: r[m['Trạng thái máy']], completedDate: r[m['Ngày hoàn thành']], handoverDate: r[m['Ngày bàn giao']], overdue: r[m['Trễ hẹn']], techNote: r[m['Ghi chú kỹ thuật']], billCode: r[m['Mã hóa đơn mua vật tư']], materialName: r[m['Tên vật tư']], materialCost: moneyValue(r[m['Giá vật tư']]), laborCost: moneyValue(r[m['Công thợ']]), totalCost: moneyValue(r[m['Tổng chi phí']]), actualRevenue: moneyValue(r[m['Thực thu']]), profit: moneyValue(r[m['Lợi nhuận']]), ncc: r[m['NCC']], paymentStatus: r[m['Trạng thái thanh toán']], year: r[m['Năm']], month: r[m['Tháng']], week: r[m['Tuần']], createdAt: r[m['Ngày tạo']], updatedAt: r[m['Ngày cập nhật']]
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
  const values = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
  return values.some(function (x) { return String(x || '').trim() === code; });
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

function forceReceiveColumnFormats_(sheet, map) {
  applyDataNumberFormats_(sheet, map);
}

function normCompare_(v) {
  return String(v || '').trim().toLowerCase().replace('t', ' ').replace(/\s+/g, ' ');
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
  PropertiesService.getDocumentProperties().setProperty('CREATE_REPAIR_' + requestId, repairId);
}

function getClientRequestRepair_(requestId) {
  if (!requestId) return '';
  return PropertiesService.getDocumentProperties().getProperty('CREATE_REPAIR_' + requestId) || '';
}

function createRepair(d) {
  const now = new Date();
  const id = generateRepairCode(d.imei, d.branch);
  const week = weekInMonth(now);
  const year = Number(Utilities.formatDate(now, TZ, 'yyyy'));
  const month = Number(Utilities.formatDate(now, TZ, 'M'));
  const row = HEADERS_DATA.map(function (h) {
    const dict = {
      'Mã sửa chữa': id, 'IMEI': d.imei || '', 'Ngày nhận': nowText(), 'Chi nhánh nhận': d.branch || '', 'Sản phẩm': d.product || '', 'Tên khách hàng': d.customer || '', 'Số điện thoại': d.phone || '', 'Loại dịch vụ': d.serviceType || '', 'Tình trạng khi nhận máy': d.receiveStatus || '', 'Yêu cầu sửa chữa': d.request || '', 'Ghi chú tiếp nhận': d.receiveNote || '', 'Hẹn trả': d.appointment || '', 'FaceID': d.faceId || '', 'Màn hình': d.screen || '', 'Camera/Mic': d.cameraMic || '', 'Loa': d.speaker || '', 'Giá dự kiến': moneyValue(d.estimate), 'Nhân viên tiếp nhận': d.staff || '', 'Trạng thái máy': '2. Đang kiểm tra', 'Trạng thái thanh toán': 'Chưa thanh toán', 'Năm': year, 'Tháng': month, 'Tuần': week, 'Ngày tạo': nowText(), 'Ngày cập nhật': nowText()
    };
    if (dict[h] !== undefined) return dict[h];
    if (['Giá vật tư', 'Công thợ', 'Tổng chi phí', 'Thực thu', 'Lợi nhuận'].indexOf(h) > -1) return 0;
    return '';
  });
  sh(SHEETS.DATA).appendRow(row);
  addLog(id, d.staff || 'Sale', 'Tiếp nhận', 'Tạo phiếu tiếp nhận');
  return { success: true, repairId: id };
}

function findRow(id) {
  const vals = sh(SHEETS.DATA).getRange(1, 1, sh(SHEETS.DATA).getLastRow(), 1).getValues().flat();
  const idx = vals.indexOf(id);
  return idx >= 0 ? idx + 1 : -1;
}

function updateStatus(id, d) {
  const sheet = sh(SHEETS.DATA);
  const row = findRow(id);
  if (row < 2) return { success: false, message: 'Không tìm thấy phiếu' };

  const role = String(d.userRole || d.role || '').trim();
  const actor = String(d.actor || d.userName || d.technician || '').trim();
  const m = mapHeader(SHEETS.DATA);
  const old = getDetail(id).data || {};
  const oldStatus = String(old.status || '');
  const newStatus = String(d.status || old.status || '');

  // Đơn đã trả khách = khóa dữ liệu, chỉ Admin được sửa/mở khóa.
  if (oldStatus.startsWith('8.') && role !== 'admin') {
    return { success: false, message: 'Đơn đã trả khách, dữ liệu đã khóa. Chỉ Admin được mở khóa/sửa.' };
  }

  // QL cửa hàng chỉ được xác nhận đã trả khách, không sửa dịch vụ/giá/KTV/ghi chú.
  if (role === 'store') {
    if (!newStatus.startsWith('8.')) {
      return { success: false, message: 'QL cửa hàng chỉ được cập nhật trạng thái Đã trả khách.' };
    }
    setCell(sheet, row, m, 'Trạng thái máy', '8. Đã trả khách');
    setCell(sheet, row, m, 'Ngày bàn giao', nowText());
    setCell(sheet, row, m, 'Ngày cập nhật', nowText());
    addLog(id, actor || 'QL cửa hàng', 'Đã trả khách', 'QL cửa hàng xác nhận đã trả máy cho khách');
    return { success: true };
  }

  // KTV / QLKT / Admin được cập nhật sửa chữa trước khi trả khách.
  const services = normalizeServices(d, old);
  const serviceText = services.map(function (x) { return x.name; }).join(', ');

  setCell(sheet, row, m, 'Dịch vụ sửa chữa', serviceText);
  setCell(sheet, row, m, 'Nơi xử lý', d.place || old.place || '');
  setCell(sheet, row, m, 'Kỹ thuật xử lý', d.technician || old.technician || '');
  setCell(sheet, row, m, 'Trạng thái máy', newStatus);
  setCell(sheet, row, m, 'Giá dự kiến', moneyValue(d.estimate || old.estimate || 0));
  setCell(sheet, row, m, 'Ghi chú kỹ thuật', d.techNote || old.techNote || '');
  setCell(sheet, row, m, 'Trễ hẹn', calcOverdue(row, m));
  if (newStatus.startsWith('7.')) setCell(sheet, row, m, 'Ngày hoàn thành', nowText());
  if (newStatus.startsWith('8.')) setCell(sheet, row, m, 'Ngày bàn giao', nowText());
  setCell(sheet, row, m, 'Ngày cập nhật', nowText());

  writeCtServices(id, services, d.technician || actor || old.technician || '');
  addLog(id, actor || d.technician || old.technician || 'Kỹ thuật', 'Cập nhật trạng thái', newStatus + (serviceText ? ' | DV: ' + serviceText : '') + (d.techNote ? ' | ' + d.techNote : ''));
  return { success: true };
}

function updateCost(id, d) {
  const sheet = sh(SHEETS.DATA);
  const row = findRow(id);
  if (row < 2) return { success: false, message: 'Không tìm thấy phiếu' };

  const role = String(d.userRole || d.role || '').trim();
  if (role === 'store' || role === 'tech') return { success: false, message: 'Bạn không có quyền cập nhật chi phí.' };

  const m = mapHeader(SHEETS.DATA);
  const old = getDetail(id).data || {};
  if (String(old.status || '').startsWith('8.') && role !== 'admin') {
    return { success: false, message: 'Đơn đã trả khách, chi phí đã khóa. Chỉ Admin được mở khóa/sửa.' };
  }

  const materials = normalizeMaterials(d, old);
  const material = materials.reduce(function (sum, x) { return sum + moneyValue(x.amount || 0); }, 0);
  const labor = moneyValue(d.laborCost || 0);
  const total = material + labor;
  const revenue = moneyValue(d.actualRevenue || 0);
  const profit = revenue - total;
  const materialText = materials.map(function (x) { return x.name; }).filter(Boolean).join(', ');
  const billText = uniqueText(materials.map(function (x) { return x.billCode; })).join(', ');
  const nccText = uniqueText(materials.map(function (x) { return x.ncc; })).join(', ');

  setCell(sheet, row, m, 'Mã hóa đơn mua vật tư', billText);
  setCell(sheet, row, m, 'Tên vật tư', materialText);
  setCell(sheet, row, m, 'Giá vật tư', material);
  setCell(sheet, row, m, 'Công thợ', labor);
  setCell(sheet, row, m, 'Tổng chi phí', total);
  setCell(sheet, row, m, 'Thực thu', revenue);
  setCell(sheet, row, m, 'Lợi nhuận', profit);
  setCell(sheet, row, m, 'NCC', nccText);
  setCell(sheet, row, m, 'Trạng thái thanh toán', d.paymentStatus || old.paymentStatus || 'Chưa thanh toán');
  setCell(sheet, row, m, 'Ngày cập nhật', nowText());

  writeCtMaterials(id, materials);
  addLog(id, d.actor || 'QLKT/Admin', 'Cập nhật chi phí', 'VT: ' + materialText + ' | Thực thu ' + revenue + ' | Tổng chi phí ' + total + ' | Lợi nhuận ' + profit);
  return { success: true };
}

function unlockRepair(id, d) {
  const role = String(d.userRole || d.role || '').trim();
  if (role !== 'admin') return { success: false, message: 'Chỉ Admin được mở khóa đơn.' };
  const reason = String(d.reason || '').trim();
  addLog(id, d.actor || 'Admin', 'Mở khóa đơn', reason ? 'Lý do: ' + reason : 'Admin mở khóa đơn');
  return { success: true };
}

function calcOverdue(row, m) {
  const ap = sh(SHEETS.DATA).getRange(row, m['Hẹn trả'] + 1).getValue();
  if (!ap) return 'Không';
  try {
    const dt = new Date(ap);
    return dt < new Date() ? 'Có' : 'Không';
  } catch (e) {
    return 'Không';
  }
}

function normalizeServices(d, old) {
  let raw = d.services || d.repairServices || d.serviceList || d.repairService || (old && old.repairService) || '';
  if (!Array.isArray(raw)) raw = splitItems(raw);
  return raw.map(function (item) {
    if (typeof item === 'string') return { name: item.trim(), price: 0, note: '' };
    return { name: String(item.name || item.service || item['Tên dịch vụ'] || '').trim(), price: moneyValue(item.price || item.gia || item['Giá bán'] || 0), note: item.note || item['Ghi chú'] || '' };
  }).filter(function (x) { return x.name; });
}

function normalizeMaterials(d, old) {
  let raw = d.materials || d.materialRows || null;
  if (!raw) {
    raw = splitItems(d.materialName || (old && old.materialName) || '').map(function (name) {
      return { name: name, qty: 1, unitPrice: Number(d.materialCost || 0), amount: Number(d.materialCost || 0), billCode: d.billCode || '', ncc: d.ncc || '' };
    });
  }
  if (!Array.isArray(raw)) raw = [];
  return raw.map(function (item) {
    if (typeof item === 'string') item = { name: item };
    const qty = Number(item.qty || item.sl || item['SL'] || 1);
    const unitPrice = moneyValue(item.unitPrice || item.price || item.donGia || item['Đơn giá'] || 0);
    const amount = moneyValue(item.amount || item.thanhTien || item['Thành tiền'] || qty * unitPrice || 0);
    return {
      billCode: String(item.billCode || item.bill || item['Mã bill mua vật tư'] || '').trim(),
      name: String(item.name || item.materialName || item['Tên vật tư'] || '').trim(),
      qty: qty || 1,
      unitPrice: unitPrice,
      amount: amount,
      ncc: String(item.ncc || item.NCC || '').trim()
    };
  }).filter(function (x) { return x.name; });
}

function uniqueText(arr) {
  const seen = {};
  return (arr || []).map(function (x) { return String(x || '').trim(); }).filter(function (x) {
    if (!x || seen[x]) return false;
    seen[x] = true;
    return true;
  });
}

function writeCtServices(id, services, user) {
  const sheet = sh(SHEETS.CT_DICH_VU);
  removeByRepair(sheet, id);
  normalizeServices({ services: services }, {}).forEach(function (svc) {
    sheet.appendRow([id, svc.name, moneyValue(svc.price || 0), svc.note || '', user || '', nowText()]);
  });
}

function writeCtMaterials(id, materials) {
  const sheet = sh(SHEETS.CT_VAT_TU);
  removeByRepair(sheet, id);
  normalizeMaterials({ materials: materials }, {}).forEach(function (mat) {
    sheet.appendRow([id, mat.billCode || '', mat.name, Number(mat.qty || 1), moneyValue(mat.unitPrice || 0), moneyValue(mat.amount || 0), mat.ncc || '', 'QLKT/Admin', nowText()]);
  });
}

function removeByRepair(sheet, id) {
  const vals = sheet.getDataRange().getValues();
  for (let i = vals.length - 1; i >= 1; i--) {
    if (vals[i][0] === id) sheet.deleteRow(i + 1);
  }
}

function splitItems(text) {
  return String(text || '').split(/[,;\n]+/).map(function (x) { return x.trim(); }).filter(Boolean);
}

function getDetail(id) {
  const data = listRepairs().find(function (x) { return x.repairId === id; });
  return { success: true, data: data, logs: logsFor(id), services: ctFor(SHEETS.CT_DICH_VU, id), materials: ctFor(SHEETS.CT_VAT_TU, id) };
}

function logsFor(id) {
  return readObjects(SHEETS.LOG).filter(function (x) { return x['Mã sửa chữa'] === id; }).map(function (x) { return { id: x.ID, repairId: x['Mã sửa chữa'], time: x['Thời gian'], user: x['Người thực hiện'], action: x['Hành động'], content: x['Nội dung'] }; });
}

function ctFor(sheetName, id) {
  return readObjects(sheetName).filter(function (x) { return x['Mã sửa chữa'] === id; });
}

function addLog(id, user, action, content) {
  sh(SHEETS.LOG).appendRow([Utilities.getUuid(), id, nowText(), user, action, content]);
}

function getDashboard() {
  return {
    rows: listRepairs(),
    ctServices: readCtServices(),
    ctMaterials: readCtMaterials(),
    techWork: readTechWork(),
    sentRepairs: readSentRepairs()
  };
}

function readCtServices() {
  return readObjects(SHEETS.CT_DICH_VU).map(function (x) {
    return {
      repairId: x['Mã sửa chữa'],
      name: x['Tên dịch vụ'],
      price: moneyValue(x['Giá bán']),
      note: x['Ghi chú'],
      user: x['Người thêm'],
      date: x['Ngày thêm']
    };
  }).filter(function (x) { return x.repairId && x.name; });
}

function readCtMaterials() {
  return readObjects(SHEETS.CT_VAT_TU).map(function (x) {
    return {
      repairId: x['Mã sửa chữa'],
      billCode: x['Mã bill mua vật tư'],
      name: x['Tên vật tư'],
      qty: Number(x['SL'] || 1),
      unitPrice: moneyValue(x['Đơn giá']),
      amount: moneyValue(x['Thành tiền']),
      ncc: x['NCC'],
      user: x['Người thêm'],
      date: x['Ngày thêm']
    };
  }).filter(function (x) { return x.repairId && x.name; });
}


function readTechWork() {
  return readObjects(SHEETS.THO_NHAP_CONG).map(function (x) {
    return {
      date: x['Ngày'],
      technician: x['Kỹ thuật'],
      imei: x['IMEI'],
      model: x['Dòng máy'],
      service: x['Dịch vụ'],
      qty: Number(x['SL'] || 1) || 1,
      commission: moneyValue(x['Hoa hồng']),
      note: x['Ghi chú'],
      source: x['Nguồn nhập'],
      approvalStatus: x['Trạng thái duyệt'],
      createdAt: x['Ngày tạo'],
      createdBy: x['Người nhập']
    };
  }).filter(function (x) { return x.imei && x.technician; });
}

function readSentRepairs() {
  const sheet = sh(SHEETS.MAY_GUI_XU_LY);
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  const h = values[0];
  return values.slice(1).map(function (r, idx) {
    const x = {};
    h.forEach(function (k, i) { x[String(k).trim()] = r[i]; });
    return {
      rowNumber: idx + 2,
      sentDate: x['Ngày gửi'],
      imei: x['IMEI'],
      model: x['Dòng máy'] || x['Tên máy'],
      name: x['Dòng máy'] || x['Tên máy'],
      process1: x['Xử lý 1'],
      process2: x['Xử lý 2'],
      technician: x['Kỹ thuật'],
      sender: x['Người gửi'],
      notReceivedReason: x['Tại sao chưa nhận'],
      receivedBackDate: x['Ngày nhận lại'] || '',
      status: x['Trạng thái'],
      checkedWork: x['Đã đối chiếu công'] || '',
      createdAt: x['Ngày tạo'],
      updatedAt: x['Ngày cập nhật']
    };
  }).filter(function (x) { return x.imei; });
}

function createTechWork(d) {
  setupSheets();
  d = d || {};
  const tech = String(d.technician || d.tech || '').trim();
  const model = String(d.model || d.product || '').trim();
  const service = String(d.service || '').trim();
  const imei = onlyDigits_(d.imei || '').slice(-6);
  const date = d.date || nowText().split(' ')[0];
  if (!tech) return { success: false, message: 'Chưa chọn kỹ thuật.' };
  if (!model) return { success: false, message: 'Chưa chọn dòng máy.' };
  if (!service) return { success: false, message: 'Chưa chọn dịch vụ.' };
  if (!/^\d{6}$/.test(imei)) return { success: false, message: 'IMEI phải nhập đúng 6 số.' };

  const commission = lookupTechCommission_(tech, model, service);
  sh(SHEETS.THO_NHAP_CONG).appendRow([
    date,
    tech,
    imei,
    model,
    service,
    1,
    commission,
    String(d.note || '').trim(),
    'Thợ tự nhập',
    'Chờ đối chiếu',
    nowText(),
    String(d.actor || d.createdBy || '').trim()
  ]);
  return { success: true, message: 'Đã lưu công thợ.', commission: commission };
}

function createSentRepair(d) {
  setupSheets();
  d = d || {};
  const imei = onlyDigits_(d.imei || '').slice(-6);
  if (!/^\d{6}$/.test(imei)) return { success: false, message: 'IMEI phải nhập đúng 6 số.' };

  const sheet = sh(SHEETS.MAY_GUI_XU_LY);
  const h = headers(SHEETS.MAY_GUI_XU_LY);
  const model = String(d.model || d.name || d.productName || '').trim();
  const rowObj = {
    'Ngày gửi': d.sentDate || d.date || nowText().split(' ')[0],
    'IMEI': imei,
    'Dòng máy': model,
    'Tên máy': model, // tương thích sheet cũ nếu đã tạo theo header cũ
    'GB': '',
    'Màu': '',
    'Xử lý 1': String(d.process1 || '').trim(),
    'Xử lý 2': String(d.process2 || '').trim(),
    'Kỹ thuật': String(d.technician || '').trim(),
    'Người gửi': String(d.sender || '').trim(),
    'Tại sao chưa nhận': String(d.notReceivedReason || '').trim(),
    'Ngày nhận lại': '',
    'Trạng thái': String(d.status || 'Đang gửi xử lý').trim(),
    'Đã đối chiếu công': 'Không',
    'Ngày tạo': nowText(),
    'Ngày cập nhật': nowText()
  };
  sheet.appendRow(h.map(function (key) { return rowObj[String(key).trim()] !== undefined ? rowObj[String(key).trim()] : ''; }));
  return { success: true, message: 'Đã lưu máy gửi xử lý.' };
}

function updateSentRepair(rowNumber, d) {
  setupSheets();
  const sheet = sh(SHEETS.MAY_GUI_XU_LY);
  const row = Number(rowNumber || 0);
  if (!row || row < 2 || row > sheet.getLastRow()) {
    return { success: false, message: 'Không tìm thấy dòng máy gửi xử lý.' };
  }

  const map = mapHeader(SHEETS.MAY_GUI_XU_LY);
  d = d || {};

  if (map['Tại sao chưa nhận'] !== undefined) {
    sheet.getRange(row, map['Tại sao chưa nhận'] + 1).setValue(String(d.notReceivedReason || '').trim());
  }
  if (map['Ngày nhận lại'] !== undefined && d.receivedBackDate !== undefined) {
    sheet.getRange(row, map['Ngày nhận lại'] + 1).setValue(String(d.receivedBackDate || '').trim());
  }
  if (map['Trạng thái'] !== undefined) {
    sheet.getRange(row, map['Trạng thái'] + 1).setValue(String(d.status || '').trim() || 'Đang gửi xử lý');
  }
  if (map['Ngày cập nhật'] !== undefined) {
    sheet.getRange(row, map['Ngày cập nhật'] + 1).setValue(nowText());
  }

  return { success: true, message: 'Đã cập nhật máy gửi xử lý.' };
}

function lookupTechCommission_(tech, model, service) {
  const rows = readObjects(SHEETS.DM_HOA_HONG_THO);
  const t = normText_(tech);
  const m = normalizeModelForCommission_(model);
  const serviceKey = normText_(service);
  for (var i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowTech = normText_(pick_(r, ['Kỹ thuật', 'KỸ THUẬT', 'Tên kỹ thuật']));
    const rowModel = normalizeModelForCommission_(pick_(r, ['Model', 'MODEL', 'Dòng máy']));
    if (rowTech !== t || rowModel !== m) continue;
    const keys = Object.keys(r);
    for (var j = 0; j < keys.length; j++) {
      if (normText_(keys[j]) === serviceKey) return moneyValue(r[keys[j]]);
    }
  }
  return 0;
}

function normalizeModelForCommission_(v) {
  return normText_(v).replace(/\s+/g, '').replace(/promax/g, 'promax').replace(/pm$/g, 'promax');
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

function fixMoneyDateColumns() {
  setupSheets();
  const sheet = sh(SHEETS.DATA);
  const map = mapHeader(SHEETS.DATA);
  const last = sheet.getLastRow();
  if (last < 2) return { success: true, message: 'Không có dữ liệu cần sửa.' };

  MONEY_HEADERS.forEach(function (h) {
    if (map[h] === undefined) return;
    const col = map[h] + 1;
    const range = sheet.getRange(2, col, last - 1, 1);
    const values = range.getValues().map(function (r) { return [moneyValue(r[0])]; });
    range.setNumberFormat('#,##0').setValues(values);
  });

  TEXT_HEADERS.forEach(function (h) {
    if (map[h] === undefined) return;
    const col = map[h] + 1;
    const range = sheet.getRange(2, col, last - 1, 1);
    const values = range.getDisplayValues().map(function (r) { return [String(r[0] || '')]; });
    range.setNumberFormat('@').setValues(values);
  });

  return { success: true, message: 'Đã sửa format cột tiền, IMEI và SĐT trong DATA.' };
}

function backfillOldDataToCT() {
  setupSheets();

  const dataSheet = sh(SHEETS.DATA);
  const serviceSheet = sh(SHEETS.CT_DICH_VU);
  const materialSheet = sh(SHEETS.CT_VAT_TU);
  const values = dataSheet.getDataRange().getValues();
  if (values.length <= 1) return { success: true, message: 'DATA trống, không có gì để backfill' };

  const h = values[0];
  const col = {};
  h.forEach(function (name, i) { col[name] = i; });

  clearSheetBody_(serviceSheet);
  clearSheetBody_(materialSheet);

  let serviceCount = 0;
  let materialCount = 0;

  values.slice(1).forEach(function (r) {
    const repairId = r[col['Mã sửa chữa']];
    if (!repairId) return;

    const user = r[col['Kỹ thuật xử lý']] || r[col['Nhân viên tiếp nhận']] || 'Backfill';
    const date = r[col['Ngày cập nhật']] || r[col['Ngày tạo']] || nowText();

    splitItems(r[col['Dịch vụ sửa chữa']]).forEach(function (serviceName) {
      serviceSheet.appendRow([repairId, serviceName, 0, 'Backfill từ DATA', user, date]);
      serviceCount++;
    });

    const billCode = r[col['Mã hóa đơn mua vật tư']] || '';
    const ncc = r[col['NCC']] || '';
    const materialCost = moneyValue(r[col['Giá vật tư']]);
    const materials = splitItems(r[col['Tên vật tư']]);
    materials.forEach(function (materialName, index) {
      const amount = materials.length === 1 ? materialCost : (index === 0 ? materialCost : 0);
      materialSheet.appendRow([repairId, billCode, materialName, 1, amount, amount, ncc, user, date]);
      materialCount++;
    });
  });

  return { success: true, message: 'Đã backfill xong', serviceRows: serviceCount, materialRows: materialCount };
}

function clearSheetBody_(sheet) {
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
  }
}
