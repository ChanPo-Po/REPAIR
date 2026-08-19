const SHEET_ID = '1ZsLoZF4hVBpSrbna0sZQ-lg9KNI-TkwuUYmiJP885mo'; // DATA chính POPOPHONE
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
const USER_ACCOUNTS = {
  thanh: { password: '123456', role: 'tech', name: 'Thanh', home: 'attendance' },
  phong: { password: '123456', role: 'tech', name: 'Phong', home: 'attendance' },
  truong: { password: '123456', role: 'tech', name: 'Trường', home: 'attendance' },
  thanh2: { password: '123456', role: 'tech', name: 'Thành', home: 'attendance' },
  ha: { password: '123456', role: 'tech', name: 'Hà', home: 'attendance' },
  ms001: { password: 'pocn113', role: 'tech', name: 'Thanh', home: 'attendance' },
  ms002: { password: 'pocn113', role: 'store', name: 'QL cửa hàng', home: 'overview' },
  ms003: { password: 'pocn113', role: 'tech_manager', name: 'QL kỹ thuật', home: 'overview' },
  ms004: { password: 'pocn113', role: 'admin', name: 'Admin', home: 'overview' }
};
const SESSION_TTL_SECONDS = 21600; // 6 giờ
const PUBLIC_ACTIONS = ['login', 'getMasters', 'createRepair', 'search', 'getDetail'];

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
  LUONG_THO: [['Tháng', 'Kỹ thuật', 'Lương cơ bản', 'Phụ cấp', 'Thưởng', 'Phạt', 'Ghi chú', 'Ngày cập nhật', 'Người nhập']],
  MAY_GUI_XU_LY: [['Ngày gửi', 'IMEI', 'Dòng máy', 'Xử lý 1', 'Xử lý 2', 'Kỹ thuật', 'Người gửi', 'Tại sao chưa nhận', 'Ngày nhận lại', 'Trạng thái', 'Đã đối chiếu công', 'Ngày tạo', 'Ngày cập nhật']],
  CHAM_CONG_THO: [['Tháng', 'Kỹ thuật', 'Ngày', 'Trạng thái', 'Ghi chú', 'Ngày cập nhật', 'Người nhập']]
};

function doGet() {
  setupSheets();
  return json({ success: true, message: 'POPOPHONE Repair V9 API OK' });
}

function doPost(e) {
  let action = '';
  try {
    const body = JSON.parse(e && e.postData && e.postData.contents || '{}');
    action = String(body.action || '').trim();

    if (action === 'login') return json(login_(body));

    const session = getSession_(body);

    if (action === 'getMasters') return json({ success: true, data: getMastersCached_() });
    if (action === 'createRepair') { setupSheetsLite_(); return json(createRepair(body.data || {})); }
    if (action === 'search') return json({ success: true, data: sanitizeRepairsForPublic_(searchRepairs(body.q || '')) });
    if (action === 'getDetail') return json(session ? getDetail(body.repairId) : sanitizeDetailForPublic_(getDetail(body.repairId)));

    const authError = requireAuth_(session);
    if (authError) return json(authError);

    if (action === 'bootstrap') return json({ success: true, data: getBootstrapForSession_(session) });
    if (action === 'list') return json({ success: true, data: listRepairsForRole_(session.role) });
    if (action === 'getDashboard') return json({ success: true, data: getDashboardForSession_(session) });
    if (action === 'updateStatus') return json(updateStatus(body.repairId, withSession_(body.data || {}, session)));
    if (action === 'quickStatus') return json(updateStatus(body.repairId, withSession_(body.data || {}, session)));
    if (action === 'updateCost') return json(updateCost(body.repairId, withSession_(body.data || {}, session)));
    if (action === 'createTechWork') return json(createTechWork(withSession_(body.data || {}, session)));
    if (action === 'saveTechAttendanceDay') return json(saveTechAttendanceDay(withSession_(body.data || {}, session)));
    if (action === 'saveTechSalaryConfig') return json(saveTechSalaryConfig(withSession_(body.data || {}, session)));
    if (action === 'createSentRepair') return json(createSentRepair(withSession_(body.data || {}, session)));
    if (action === 'updateSentRepair') return json(updateSentRepair(body.rowNumber, withSession_(body.data || {}, session)));
    if (action === 'backfillOldDataToCT') return json(requireRole_(session, ['admin']) || backfillOldDataToCT());
    if (action === 'unlockRepair') return json(unlockRepair(body.repairId, withSession_(body.data || {}, session)));
    if (action === 'fixMoneyDateColumns') return json(requireRole_(session, ['admin']) || fixMoneyDateColumns());

    return json({ success: false, message: 'Unknown action: ' + action });
  } catch (err) {
    return json({
      success: false,
      action: action || '',
      message: 'Lỗi API' + (action ? ' [' + action + ']' : '') + ': ' + String(err && err.message || err),
      detail: String(err && err.stack || err)
    });
  }
}

function login_(body) {
  const username = String(body.username || '').trim();
  const password = String(body.password || '').trim();
  const account = USER_ACCOUNTS[username];
  if (!account || String(account.password) !== password) {
    return { success: false, message: 'Sai tài khoản hoặc mật khẩu.' };
  }
  const token = Utilities.getUuid() + Utilities.getUuid().replace(/-/g, '');
  const user = { username: username, role: account.role, name: account.name, home: account.home };
  CacheService.getScriptCache().put('SESSION_' + token, JSON.stringify(user), SESSION_TTL_SECONDS);
  return { success: true, token: token, user: user, expiresIn: SESSION_TTL_SECONDS };
}

function getSession_(body) {
  const token = String((body && (body.authToken || (body.data && body.data.authToken))) || '').trim();
  if (!token || token === 'LOCAL_DEMO') return null;
  const raw = CacheService.getScriptCache().get('SESSION_' + token);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}

function requireAuth_(session) {
  if (!session || !session.role) return { success: false, message: 'Phiên đăng nhập hết hạn hoặc chưa đăng nhập. Vui lòng đăng nhập lại.' };
  return null;
}

function requireRole_(session, roles) {
  const err = requireAuth_(session);
  if (err) return err;
  if (roles.indexOf(session.role) === -1) return { success: false, message: 'Bạn không có quyền thực hiện thao tác này.' };
  return null;
}

function withSession_(data, session) {
  const d = data || {};
  d.userRole = session.role;
  d.actor = session.name || session.username || d.actor || '';
  d.sessionUser = session.username || '';
  return d;
}

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

function listRepairsForRole_(role) {
  const rows = listRepairs();
  if (role === 'store' || role === 'tech') return sanitizeRepairsForPublic_(rows);
  return rows;
}

function monthKey_(v) {
  if (!v) return '';
  if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v)) return Utilities.formatDate(v, TZ, 'yyyy-MM');
  const s = String(v).trim();
  if (/^\d{4}-\d{2}$/.test(s)) return s;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 7);
  const d = new Date(s);
  if (!isNaN(d)) return Utilities.formatDate(d, TZ, 'yyyy-MM');
  return s.slice(0, 7);
}

function getDashboardForSession_(session) {
  const role = session && session.role;
  const data = getDashboard();
  if (role === 'store' || role === 'tech') {
    data.rows = sanitizeRepairsForPublic_(data.rows || []);
    data.ctMaterials = [];
    data.materialsCt = [];
  }
  if (role === 'tech') {
    const techName = String(session.name || '').trim();
    const techKey = normText_(techName);
    data.techWork = (data.techWork || []).filter(function (x) { return normText_(x.technician || '') === techKey; });
    data.thoNhapCong = data.techWork;
    data.attendance = (data.attendance || []).filter(function (x) { return normText_(x.technician || '') === techKey; });
    data.chamCongTho = data.attendance;
    data.techSalaryConfig = (data.techSalaryConfig || []).filter(function (x) { return normText_(x.technician || '') === techKey; });
  }
  return data;
}

let _SS_CACHE = null;

function ss() {
  if (!_SS_CACHE) _SS_CACHE = SpreadsheetApp.openById(SHEET_ID);
  return _SS_CACHE;
}

function sh(name) {
  const sheet = ss().getSheetByName(name);
  if (!sheet) throw new Error('Không tìm thấy sheet: ' + name);
  return sheet;
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

function setupSheetsLite_() {
  // Bản nhẹ dùng trong API hằng ngày: chỉ đảm bảo sheet/header tồn tại, không format nguyên cột để tránh treo Apps Script.
  const book = ss();
  ensureSheet(book, SHEETS.DATA, [HEADERS_DATA]);
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

function getMastersCached_() {
  const cache = CacheService.getScriptCache();
  const key = 'REPAIR_MASTERS_V1';
  const cached = cache.get(key);
  if (cached) {
    try { return JSON.parse(cached); } catch (e) {}
  }
  const data = getMasters();
  try { cache.put(key, JSON.stringify(data), 300); } catch (e) {}
  return data;
}

function getBootstrapForSession_(session) {
  return {
    masters: getMastersCached_(),
    dashboard: getDashboardForSession_(session)
  };
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

function forceReceiveColumnFormats_(sheet, map) {
  applyDataNumberFormats_(sheet, map);
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

function updateStatus(id, d) {
  const roleCheck = requireRole_({ role: String((d && d.userRole) || '') }, ['tech', 'store', 'tech_manager', 'admin']);
  if (roleCheck) return roleCheck;
  const sheet = sh(SHEETS.DATA);
  const row = findRow(id);
  if (row < 2) return { success: false, message: 'Không tìm thấy phiếu' };

  const role = String(d.userRole || d.role || '').trim();
  const actor = String(d.actor || d.userName || d.technician || '').trim();
  const m = mapHeader(SHEETS.DATA);

  // FAST PATH: chỉ đọc đúng 1 dòng đang sửa, không gọi getDetail() / không quét DATA + LOG + CT.
  const lastCol = sheet.getLastColumn();
  const rowRange = sheet.getRange(row, 1, 1, lastCol);
  const rowValues = rowRange.getValues()[0];
  const old = rowToObj(rowValues, m) || {};
  const oldStatus = String(old.status || '');
  const newStatus = String(d.status || old.status || '');
  const stamp = nowText();

  if (oldStatus.startsWith('8.') && role !== 'admin') {
    return { success: false, message: 'Đơn đã trả khách, dữ liệu đã khóa. Chỉ Admin được mở khóa/sửa.' };
  }

  // Gán trực tiếp vào mảng rồi setValues 1 lần để tránh 8-10 lần gọi Spreadsheet service.
  function put(header, value) {
    if (m[header] !== undefined) rowValues[m[header]] = value;
  }

  if (role === 'store') {
    if (!newStatus.startsWith('8.')) {
      return { success: false, message: 'QL cửa hàng chỉ được cập nhật trạng thái Đã trả khách.' };
    }
    put('Trạng thái máy', '8. Đã trả khách');
    put('Ngày bàn giao', stamp);
    put('Ngày cập nhật', stamp);
    rowRange.setValues([rowValues]);
    addLog(id, actor || 'QL cửa hàng', 'Đã trả khách', 'QL cửa hàng xác nhận đã trả máy cho khách');
    return { success: true, data: rowToObj(rowValues, m), services: [] };
  }

  const services = normalizeServices(d, old);
  const serviceText = services.map(function (x) { return x.name; }).join(', ');

  put('Dịch vụ sửa chữa', serviceText);
  put('Nơi xử lý', d.place || old.place || '');
  put('Kỹ thuật xử lý', d.technician || old.technician || '');
  put('Trạng thái máy', newStatus);
  put('Giá dự kiến', moneyValue(d.estimate !== undefined ? d.estimate : old.estimate || 0));
  put('Ghi chú kỹ thuật', d.techNote !== undefined ? d.techNote : (old.techNote || ''));
  put('Trễ hẹn', calcOverdueValue_(old.appointment));
  if (newStatus.startsWith('7.')) put('Ngày hoàn thành', old.completedDate || stamp);
  if (newStatus.startsWith('8.')) put('Ngày bàn giao', old.handoverDate || stamp);
  put('Ngày cập nhật', stamp);

  rowRange.setValues([rowValues]);
  writeCtServicesFast_(id, services, d.technician || actor || old.technician || '');
  addLog(id, actor || d.technician || old.technician || 'Kỹ thuật', 'Cập nhật trạng thái', newStatus + (serviceText ? ' | DV: ' + serviceText : '') + (d.techNote ? ' | ' + d.techNote : ''));

  return { success: true, data: rowToObj(rowValues, m), services: services };
}

function calcOverdueValue_(appointment) {
  if (!appointment) return 'Không';
  try {
    const dt = appointment instanceof Date ? appointment : new Date(appointment);
    if (isNaN(dt.getTime())) return 'Không';
    return dt < new Date() ? 'Có' : 'Không';
  } catch (e) {
    return 'Không';
  }
}

function updateCost(id, d) {
  const roleCheck = requireRole_({ role: String((d && d.userRole) || '') }, ['tech_manager', 'admin']);
  if (roleCheck) return roleCheck;
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
  // Giữ hàm cũ cho tương thích các luồng khác, nhưng dùng implementation nhanh.
  return writeCtServicesFast_(id, services, user);
}

function writeCtServicesFast_(id, services, user) {
  const sheet = sh(SHEETS.CT_DICH_VU);
  const normalized = normalizeServices({ services: services }, {});
  const stamp = nowText();
  const rows = normalized.map(function (svc) {
    return [id, svc.name, moneyValue(svc.price || 0), svc.note || '', user || '', stamp];
  });

  const lastRow = sheet.getLastRow();
  const matches = [];
  if (lastRow >= 2) {
    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0] || '').trim() === String(id || '').trim()) matches.push(i + 2);
    }
  }

  // Ghi đè các dòng cũ trước, không deleteRow (deleteRow rất chậm và làm dịch chuyển sheet).
  const shared = Math.min(matches.length, rows.length);
  for (let i = 0; i < shared; i++) {
    sheet.getRange(matches[i], 1, 1, 6).setValues([rows[i]]);
  }
  // Dòng cũ dư thì clear nội dung, không xóa row.
  for (let i = shared; i < matches.length; i++) {
    sheet.getRange(matches[i], 1, 1, 6).clearContent();
  }
  // Dịch vụ mới nhiều hơn thì append 1 lần theo block.
  if (rows.length > shared) {
    const extra = rows.slice(shared);
    const start = Math.max(sheet.getLastRow() + 1, 2);
    sheet.getRange(start, 1, extra.length, 6).setValues(extra);
  }
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
  const rows = listRepairs();
  const techWork = readTechWork();
  const sentRepairs = readSentRepairs();
  const attendance = readTechAttendance();
  const techSalaryConfig = readTechSalaryConfig();
  const dataSheet = sh(SHEETS.DATA);
  return {
    rows: rows,
    dataHealth: {
      sheetId: SHEET_ID,
      sheetName: SHEETS.DATA,
      lastRow: dataSheet.getLastRow(),
      repairCount: rows.length,
      checkedAt: nowText()
    },
    ctServices: readCtServices(),
    ctMaterials: readCtMaterials(),
    techWork: techWork,
    thoNhapCong: techWork,
    sentRepairs: sentRepairs,
    mayGuiXuLy: sentRepairs,
    attendance: attendance,
    chamCongTho: attendance,
    techSalaryConfig: techSalaryConfig
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

function readTechAttendance() {
  return readObjects(SHEETS.CHAM_CONG_THO).map(function (x) {
    return {
      month: monthKey_(x['Tháng']),
      technician: x['Kỹ thuật'],
      day: Number(x['Ngày'] || 0) || 0,
      status: x['Trạng thái'] || 'Đi làm',
      note: x['Ghi chú'],
      updatedAt: x['Ngày cập nhật'],
      createdBy: x['Người nhập']
    };
  }).filter(function (x) { return x.technician && x.month && x.day; });
}

function readTechSalaryConfig() {
  return readObjects(SHEETS.LUONG_THO).map(function (x) {
    return {
      month: monthKey_(x['Tháng']),
      technician: x['Kỹ thuật'],
      baseSalary: moneyValue(x['Lương cơ bản']),
      allowance: moneyValue(x['Phụ cấp']),
      bonus: moneyValue(x['Thưởng']),
      penalty: moneyValue(x['Phạt']),
      note: x['Ghi chú'],
      updatedAt: x['Ngày cập nhật'],
      createdBy: x['Người nhập']
    };
  }).filter(function (x) { return x.technician && x.month; });
}

function upsertByKeys_(sheetName, keys, values) {
  const sheet = sh(sheetName);
  const vals = sheet.getDataRange().getValues();
  const h = vals[0] || [];
  const col = {};
  h.forEach(function (name, i) { col[String(name).trim()] = i; });
  let row = -1;
  for (let i = vals.length - 1; i >= 1; i--) {
    let ok = true;
    keys.forEach(function (k) {
      if (String(vals[i][col[k]] || '') !== String(values[k] || '')) ok = false;
    });
    if (ok) { row = i + 1; break; }
  }
  if (row < 0) {
    const out = h.map(function (name) { return values[String(name).trim()] !== undefined ? values[String(name).trim()] : ''; });
    sheet.appendRow(out);
    return sheet.getLastRow();
  }
  Object.keys(values).forEach(function (name) {
    if (col[name] !== undefined) sheet.getRange(row, col[name] + 1).setValue(values[name]);
  });
  return row;
}

function saveTechAttendanceDay(d) {
  const role = String((d && d.userRole) || '');
  if (['tech_manager', 'admin', 'tech'].indexOf(role) === -1) return { success: false, message: 'Bạn không có quyền chấm công thợ.' };
  setupSheetsLite_();
  d = d || {};
  const month = String(d.month || '').trim();
  const tech = String(d.technician || '').trim();
  const day = Number(d.day || 0) || 0;
  const status = String(d.status || 'Đi làm').trim();
  if (!/^\d{4}-\d{2}$/.test(month)) return { success: false, message: 'Tháng không hợp lệ.' };
  if (!tech) return { success: false, message: 'Chưa chọn kỹ thuật.' };
  if (role === 'tech' && String(d.actor || '').trim() && String(d.actor || '').trim() !== tech) return { success: false, message: 'Thợ chỉ được chấm công của chính mình.' };
  if (day < 1 || day > 31) return { success: false, message: 'Ngày không hợp lệ.' };
  upsertByKeys_(SHEETS.CHAM_CONG_THO, ['Tháng', 'Kỹ thuật', 'Ngày'], {
    'Tháng': month,
    'Kỹ thuật': tech,
    'Ngày': day,
    'Trạng thái': status,
    'Ghi chú': String(d.note || '').trim(),
    'Ngày cập nhật': nowText(),
    'Người nhập': String(d.actor || '').trim()
  });
  return { success: true, message: 'Đã lưu công ngày ' + day + ' cho ' + tech + '.' };
}

function saveTechSalaryConfig(d) {
  const roleCheck = requireRole_({ role: String((d && d.userRole) || '') }, ['tech_manager', 'admin']);
  if (roleCheck) return roleCheck;
  setupSheetsLite_();
  d = d || {};
  const month = String(d.month || '').trim();
  const tech = String(d.technician || '').trim();
  if (!/^\d{4}-\d{2}$/.test(month)) return { success: false, message: 'Tháng không hợp lệ.' };
  if (!tech) return { success: false, message: 'Chưa chọn kỹ thuật.' };
  upsertByKeys_(SHEETS.LUONG_THO, ['Tháng', 'Kỹ thuật'], {
    'Tháng': month,
    'Kỹ thuật': tech,
    'Lương cơ bản': moneyValue(d.baseSalary),
    'Phụ cấp': moneyValue(d.allowance),
    'Thưởng': moneyValue(d.bonus),
    'Phạt': moneyValue(d.penalty),
    'Ghi chú': String(d.note || '').trim(),
    'Ngày cập nhật': nowText(),
    'Người nhập': String(d.actor || '').trim()
  });
  return { success: true, message: 'Đã lưu cấu hình lương cho ' + tech + '.' };
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
      sentDate: x['Ngày gửi'] || x['Ngày Gửi'],
      imei: x['IMEI'],
      model: x['Dòng máy'] || x['Tên máy'] || x['Tên Máy'],
      name: x['Dòng máy'] || x['Tên máy'] || x['Tên Máy'],
      process1: x['Xử lý 1'] || x['Xử Lý 1'],
      process2: x['Xử lý 2'] || x['Xử Lý 2'],
      technician: x['Kỹ thuật'] || x['Kỹ Thuật'] || x['KTV'],
      sender: x['Người gửi'] || x['Người Gửi'],
      notReceivedReason: x['Tại sao chưa nhận'] || x['TẠI SAO CHƯA NHẬN'],
      receivedBackDate: x['Ngày nhận lại'] || x['Ngày Nhận Lại'] || '',
      status: x['Trạng thái'] || x['Trạng Thái'],
      checkedWork: x['Đã đối chiếu công'] || '',
      createdAt: x['Ngày tạo'],
      updatedAt: x['Ngày cập nhật']
    };
  }).filter(function (x) { return x.imei; });
}

function createTechWork(d) {
  const roleCheck = requireRole_({ role: String((d && d.userRole) || '') }, ['tech', 'tech_manager', 'admin']);
  if (roleCheck) return roleCheck;
  setupSheetsLite_();
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
  const roleCheck = requireRole_({ role: String((d && d.userRole) || '') }, ['tech_manager', 'admin']);
  if (roleCheck) return roleCheck;
  setupSheetsLite_();
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
  const roleCheck = requireRole_({ role: String((d && d.userRole) || '') }, ['tech_manager', 'admin']);
  if (roleCheck) return roleCheck;
  setupSheetsLite_();
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


