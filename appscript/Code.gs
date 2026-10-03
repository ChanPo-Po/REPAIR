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
  kt: { password: '123456', role: 'tech', name: 'Kỹ thuật', home: 'progress' },
  ql: { password: 'pocn113', role: 'department_head', name: 'Quản lý', home: 'overview' },
  admin: { password: 'pocn113', role: 'admin', name: 'Admin', home: 'overview' }
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

const API_VERSION = '17.1';

function canonicalAction_(value) {
  const raw = String(value || '').trim();
  const key = raw.toLowerCase().replace(/[._\-\s]/g, '');
  const map = {
    login: 'login',
    getmasters: 'getMasters',
    createrepair: 'createRepair',
    search: 'search',
    getdetail: 'getDetail',
    bootstrap: 'bootstrap',
    adminoverview: 'adminOverview',
    progresslist: 'progressList',
    repairlistpaged: 'repairListPaged',
    serviceanalytics: 'serviceAnalytics',
    servicetypeanalytics: 'serviceTypeAnalytics',
    weeklyanalytics: 'weeklyAnalytics',
    list: 'list',
    getdashboard: 'getDashboard',
    updatestatus: 'updateStatus',
    quickstatus: 'quickStatus',
    updatecost: 'updateCost',
    createtechwork: 'createTechWork',
    createsentrepair: 'createSentRepair',
    updatesentrepair: 'updateSentRepair',
    backfillolddatatoct: 'backfillOldDataToCT',
    unlockrepair: 'unlockRepair',
    fixmoneydatecolumns: 'fixMoneyDateColumns',
    apiinfo: 'apiInfo',
    systemcheck: 'systemCheck'
  };
  return map[key] || raw;
}

function apiInfo_() {
  return {
    success: true,
    version: API_VERSION,adminWorkspace:true,
    periodFiltering: true,
    operationsOnly: true,
    monthlyOverview: true,
    dailyHandover: true,
    workflowTracking: true,
    supportedActions: [
      'login','getMasters','createRepair','search','getDetail','bootstrap',
      'adminOverview','progressList','repairListPaged','serviceAnalytics',
      'serviceTypeAnalytics','weeklyAnalytics','list','getDashboard',
      'updateStatus','quickStatus','updateCost','createTechWork',
      'createSentRepair','updateSentRepair','backfillOldDataToCT',
      'unlockRepair','fixMoneyDateColumns','apiInfo','systemCheck','dashboardBatch','operationsOverview','operationsList','saveOpsTracking','operationsStart','getEditDetail','adminBootstrap','adminHeavy','adminDetail'
    ]
  };
}

function doGet() {
  return json({ success: true, message: 'POPOPHONE Repair API OK', version: API_VERSION, checkedAt: nowText() });
}

function doPost(e) {
  let action = '';
  try {
    const body = JSON.parse(e && e.postData && e.postData.contents || '{}');
    action = canonicalAction_(body.action);

    if (action === 'apiInfo') return json(apiInfo_());
    if (action === 'login') return json(login_(body));

    const session = getSession_(body);

    if (action === 'getMasters') return json({ success: true, data: session ? getMastersForV15_(session) : getPublicMasters_() });
    if (action === 'createRepair') { setupSheetsLite_(); return json(createRepair(body.data || {})); }
    if (action === 'search') return json({ success: true, data: sanitizeRepairsForPublic_(searchRepairs(body.q || '')) });
    if (action === 'getDetail') return json(session ? getDetailForSession_(body.repairId, session) : sanitizeDetailForPublic_(getDetail(body.repairId)));

    const authError = requireAuth_(session);
    if (authError) return json(authError);

    if(action==='operationsStart')return json({success:true,info:apiInfo_(),masters:getOpsMastersCached_(),view:operationsOverview_(body,session)});
    if(action==='getEditDetail')return json(getOpsEditDetail_(body.repairId,session));
    if(action==='adminBootstrap')return json(requireRole_(session,['admin'])||adminBootstrap_(body));
    if(action==='adminHeavy')return json(requireRole_(session,['admin'])||adminHeavy_(body));
    if(action==='adminDetail')return json(requireRole_(session,['admin'])||adminDetail_(body.repairId));
    if (action === 'dashboardBatch') return json(dashboardBatch_(body,session));
    if (action === 'operationsOverview') return json(operationsOverview_(body,session));
    if (action === 'operationsList') return json(operationsList_(body,session));
    if (action === 'saveOpsTracking') return json(saveOpsTracking_(body.repairId,withSession_(body.data||{},session)));
    if (action === 'updateLocation') return json({success:false,message:'Lọc theo chi nhánh trong DATA. Dùng cập nhật trạng thái để xác nhận trả khách.'});
    if (action === 'bootstrap') return json(operationsOverview_(body,session));
    if (action === 'systemCheck') return json(systemCheck_(session));
    if (action === 'adminOverview') return json(operationsOverview_(body, session));
    if (action === 'progressList') return json(progressList_(body, session));
    if (action === 'repairListPaged') return json(repairListPaged_(body, session));
    if (action === 'serviceAnalytics') return json(serviceAnalytics_(body, session));
    if (action === 'serviceTypeAnalytics') return json(serviceTypeAnalytics_(body, session));
    if (action === 'weeklyAnalytics') return json({success:false,message:'Ứng dụng này chỉ quản lý tiến độ và bàn giao máy.'});
    if (action === 'list') return json(operationsList_(body,session));
    if (action === 'getDashboard') return json(operationsOverview_(body,session));
    if (action === 'updateStatus') return json(updateStatus(body.repairId, withSession_(body.data || {}, session)));
    if (action === 'quickStatus') return json(updateStatus(body.repairId, withSession_(body.data || {}, session)));
    if(action==='updateCost')return json(requireRole_(session,['admin'])||updateAdminCost_(body.repairId,withSession_(body.data||{},session)));
    if (action === 'createTechWork') return json(requireRole_(session,['admin'])||createTechWork(withSession_(body.data || {}, session)));
    if (action === 'createSentRepair') return json(requireRole_(session,['admin'])||createSentRepair(withSession_(body.data || {}, session)));
    if (action === 'updateSentRepair') return json(requireRole_(session,['admin'])||updateSentRepair(body.rowNumber, withSession_(body.data || {}, session)));
    if (action === 'backfillOldDataToCT') return json(requireRole_(session, ['admin']) || backfillOldDataToCT());
    if (action === 'unlockRepair') return json(unlockRepair(body.repairId, withSession_(body.data || {}, session)));
    if (action === 'fixMoneyDateColumns') return json(requireRole_(session, ['admin']) || fixMoneyDateColumns());

    return json({ success: false, code: 'UNKNOWN_ACTION', version: API_VERSION, message: 'Unknown action: ' + action });
  } catch (err) {
    return json({
      success: false,
      action: action || '',
      message: 'Lỗi API' + (action ? ' [' + action + ']' : '') + ': ' + String(err && err.message || err),
      detail: String(err && err.stack || err)
    });
  }
}


function systemCheck_(session) {
  try {
    const sheet = sh(SHEETS.DATA);
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    const headers = lastRow ? sheet.getRange(1,1,1,lastCol).getDisplayValues()[0] : [];
    const rows = listRepairs();
    const sample = rows.slice(0,3).map(function(r){
      return {repairId:r.repairId,date:String(r.date||''),status:r.status,technician:r.technician,actualRevenue:r.actualRevenue,totalCost:r.totalCost,profit:r.profit};
    });
    return {success:true,data:{apiVersion:API_VERSION,role:String(session&&session.role||''),sheetName:SHEETS.DATA,lastRow:lastRow,lastCol:lastCol,parsedRows:rows.length,headers:headers,sample:sample}};
  } catch (err) {
    return {success:false,message:'System check lỗi: '+String(err&&err.message||err)};
  }
}
function login_(body) {
  const username = String(body.username || '').trim();
  const password = String(body.password || '').trim();
  let account = USER_ACCOUNTS[username];
  const configured=account&&PropertiesService.getScriptProperties().getProperty('REPAIR_'+username.toUpperCase()+'_PASSWORD');
  if (!account || String(configured||account.password) !== password) {
    return { success: false, message: 'Sai tài khoản hoặc mật khẩu.' };
  }
  const token = Utilities.getUuid() + Utilities.getUuid().replace(/-/g, '');
  const user = { username: username, role: account.role, name: account.name, home: account.home, authVersion: API_VERSION };
  CacheService.getScriptCache().put('SESSION_' + token, JSON.stringify(user), SESSION_TTL_SECONDS);
  return { success: true, token: token, user: user, expiresIn: SESSION_TTL_SECONDS };
}

function getSession_(body) {
  const token = String((body && (body.authToken || (body.data && body.data.authToken))) || '').trim();
  if (!token || token === 'LOCAL_DEMO') return null;
  const raw = CacheService.getScriptCache().get('SESSION_' + token);
  if (!raw) return null;
  try { const user=JSON.parse(raw),account=USER_ACCOUNTS[user.username];return account&&user.authVersion===API_VERSION&&user.role===account.role?user:null; } catch (e) { return null; }
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
  d.sessionName = session.name || '';
  // Tài khoản kỹ thuật thao tác đơn nào thì đơn đó phải ghi nhận đúng người thao tác.
  // QL kỹ thuật/Admin vẫn có quyền phân công/chuyển KTV.

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
    if (['THO_NHAP_CONG','CHAM_CONG_THO','LUONG_THO'].indexOf(key) > -1) return;
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
    if (['THO_NHAP_CONG','CHAM_CONG_THO','LUONG_THO'].indexOf(key) > -1) return;
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
  // V15: bootstrap chỉ trả master nhẹ. Không còn đẩy toàn bộ DATA/CT/chấm công về frontend.
  return {
    masters: getMastersCached_(),
    dashboard: { rows: [], dataHealth: { sheetName: SHEETS.DATA, lastRow: sh(SHEETS.DATA).getLastRow(), checkedAt: nowText() } }
  };
}

function getMasters() {
  return {
    trangThai: DEFAULTS.DM_TRANG_THAI.slice(1),
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

// Resolve aliases once per header map rather than normalizing every column for every cell.
const ROW_COLUMN_CACHE_ = new WeakMap();
function rowValue_(row, headerMap, aliases) {
  aliases=aliases||[];
  let cache=ROW_COLUMN_CACHE_.get(headerMap);
  if(!cache){cache={keys:Object.keys(headerMap),normalized:Object.keys(headerMap).map(normalizeHeader_),aliases:{}};ROW_COLUMN_CACHE_.set(headerMap,cache);}
  const key=JSON.stringify(aliases);
  let columns=cache.aliases[key];
  if(!columns){
    columns=aliases.filter(function(a){return headerMap[a]!==undefined;}).map(function(a){return headerMap[a];});
    const normalized=aliases.map(normalizeHeader_);
    cache.keys.forEach(function(k,i){if(normalized.indexOf(cache.normalized[i])!==-1)columns.push(headerMap[k]);});
    cache.aliases[key]=columns;
  }
  let firstExisting='';
  for(let i=0;i<columns.length;i++){
    const value=row[columns[i]];
    if(firstExisting==='')firstExisting=value;
    if(value!==''&&value!==null&&value!==undefined)return value;
  }
  return firstExisting||'';
}


let BATCH_REPAIR_ROWS_ = null;
let BATCH_READ_ACTIVE_ = false;
function listRepairs() {
  if(BATCH_READ_ACTIVE_ && BATCH_REPAIR_ROWS_) return BATCH_REPAIR_ROWS_;
  const sheet = sh(SHEETS.DATA);
  const vals = sheet.getDataRange().getValues();
  if (vals.length <= 1) return [];
  const m = {};
  vals[0].forEach(function(h,i){const key=String(h||'').trim();if(key&&m[key]===undefined)m[key]=i;});
  const rows = vals.slice(1).filter(function (r) {
    return String(rowValue_(r, m, ['Mã sửa chữa', 'Mã SC', 'Mã sửa', 'MA SUA CHUA']) || '').trim();
  }).map(function (r) { return rowToObj(r, m); }).reverse();

  if(BATCH_READ_ACTIVE_) BATCH_REPAIR_ROWS_=rows;
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
    location: v(['Vị trí máy']),
    technician: v(['Kỹ thuật xử lý', 'Kỹ thuật', 'KTV']),
    status: v(['Trạng thái máy', 'Trạng thái', 'Tình trạng xử lý']),
    completedDate: v(['Ngày hoàn thành', 'Ngày sửa xong']),
    handoverDate: v(['Ngày bàn giao', 'Ngày trả khách', 'Ngày trả']),
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
  invalidateOpsData_();
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

function updateStatus(id,d){
 const lock=LockService.getScriptLock();if(!lock.tryLock(5000))return {success:false,message:'Đơn đang được cập nhật. Vui lòng thử lại.'};
 try{return updateStatusLocked_(id,d);}finally{lock.releaseLock();}
}
function updateStatusLocked_(id, d) {
  const roleCheck = requireRole_({ role: String((d && d.userRole) || '') }, ['tech', 'store', 'tech_manager', 'department_head', 'admin']);
  if (roleCheck) return roleCheck;
  const sheet = sh(SHEETS.DATA);
  const row = findRow(id);
  if (row < 2) return { success: false, message: 'Không tìm thấy phiếu' };

  const role = String(d.userRole || d.role || '').trim();
  const actor = String(d.actor || d.userName || d.sessionName || d.technician || '').trim();
  // Không cho tài khoản thợ cập nhật dưới tên người khác.
  // Đây là khóa liên kết ĐƠN ↔ THỢ để dashboard/KPI cuối ngày không bị sai người.

  const m = mapHeader(SHEETS.DATA);

  // FAST PATH: chỉ đọc đúng 1 dòng đang sửa, không gọi getDetail() / không quét DATA + LOG + CT.
  const lastCol = sheet.getLastColumn();
  const rowRange = sheet.getRange(row, 1, 1, lastCol);
  const rowValues = rowRange.getValues()[0];
  const old = rowToObj(rowValues, m) || {};
  const oldStatus = String(old.status || '');
  if(d.technician!==undefined&&d.technician&&!validOpsTechnician_(d.technician,old.technician))return {success:false,message:'Chọn kỹ thuật trong danh mục DM_KY_THUAT.'};
  const newStatus = String(d.status || old.status || '');
  if([8,9,10,11].indexOf(opsCode_(newStatus))>=0&&newStatus!==oldStatus){
    if(opsCode_(oldStatus)!==7)return {success:false,message:'Cần chuyển về 7. Đã sửa xong trước khi kết thúc đơn.'};
    if(!getOpsTracking_(id).storeReceivedAt)return {success:false,message:'Cần CH nhận trước khi cập nhật trạng thái 8–11.'};
  }
  if(d.status&&DEFAULTS.DM_TRANG_THAI.slice(1).indexOf(d.status)<0)return {success:false,message:'Trạng thái không hợp lệ.'};
  if(role==='tech'&&newStatus.startsWith('8.'))return {success:false,message:'Cửa hàng xác nhận trả khách sau khi nhận lại máy.'};
  const stamp = nowText();

  if (oldStatus.startsWith('8.') && role !== 'admin') {
    return { success: false, message: 'Đơn đã trả khách, dữ liệu đã khóa. Chỉ Admin được mở khóa/sửa.' };
  }

  // Gán trực tiếp vào mảng rồi setValues 1 lần để tránh 8-10 lần gọi Spreadsheet service.
  function put(header, value) {
    if(header==='Ngày bàn giao'&&m[header]===undefined)header=['Ngày trả khách','Ngày trả'].filter(function(k){return m[k]!==undefined;})[0]||header;
    if (m[header] !== undefined) rowValues[m[header]] = value;
  }

  if (role === 'store') {
    if([8,9,10,11].indexOf(opsCode_(newStatus))<0)return {success:false,message:'Cửa hàng chỉ cập nhật trạng thái kết thúc 8–11 sau CH nhận.'};
    if(newStatus===oldStatus)return {success:true,data:sanitizeRepairForRole_(old,role)};
    put('Trạng thái máy',newStatus);
    if(opsCode_(newStatus)===8)put('Ngày bàn giao',stamp);
    put('Ngày cập nhật',stamp);rowRange.setValues([rowValues]);
    addLog(id,actor||'Cửa hàng','Cập nhật trạng thái',JSON.stringify({type:'STATUS',fromStatus:oldStatus,toStatus:newStatus,message:'Cửa hàng cập nhật sau CH nhận'}));invalidateOpsData_();
    return {success:true,data:sanitizeRepairForRole_(rowToObj(rowValues,m),role),services:[]};
  }

  const previous=readOpsServices_(id,old.repairService);
  let services = normalizeServices(d, old).map(function(svc){const existing=previous.filter(function(x){return normText_(x.name)===normText_(svc.name);})[0];return existing||svc;});
  if(Array.isArray(d.services)) {
    const catalog=readObjects(SHEETS.DM_DICH_VU),allowed={};
    catalog.forEach(function(x){const name=String(pick_(x,['Tên dịch vụ','Dịch vụ'])||'').trim();if(name)allowed[normText_(name)]=name;});
    const seen={},resolved=[];
    for(let i=0;i<services.length;i++) {
      const svc=services[i],key=normText_(svc.name),existing=previous.filter(function(x){return normText_(x.name)===key;})[0];
      if(!allowed[key]&&!existing)return {success:false,message:'Dịch vụ không có trong danh mục: '+svc.name};
      if(seen[key])continue;seen[key]=true;
      resolved.push({name:allowed[key]||existing.name,price:existing?existing.price:0,note:existing?existing.note:''});
    }
    services=resolved;
  }
  const serviceText = services.map(function (x) { return x.name; }).join(', ');

  // Từ lúc kỹ thuật thực sự xử lý (đang sửa/chờ linh kiện/hoàn tất), bắt buộc phải có KTV phụ trách.
  if ((newStatus.startsWith('5.') || newStatus.startsWith('6.') || newStatus.startsWith('7.')) && !String(d.technician || old.technician || '').trim()) {
    return { success: false, message: 'Chưa có kỹ thuật phụ trách. Hãy chọn/gán KTV trước khi chuyển trạng thái này.' };
  }

  put('Dịch vụ sửa chữa', serviceText);
  put('Nơi xử lý', d.place || old.place || '');
  put('Kỹ thuật xử lý', d.technician || old.technician || '');
  put('Trạng thái máy', newStatus);
  put('Giá dự kiến', moneyValue(d.estimate !== undefined ? d.estimate : old.estimate || 0));
  put('Ghi chú kỹ thuật', d.techNote !== undefined ? d.techNote : (old.techNote || ''));
  put('Trễ hẹn', calcOverdueValue_(old.appointment));
  if (newStatus.startsWith('7.')) put('Ngày hoàn thành', old.completedDate || stamp);
  if (newStatus.startsWith('8.')) {put('Ngày bàn giao', old.handoverDate || stamp);}
  put('Ngày cập nhật', stamp);

  rowRange.setValues([rowValues]);
  if(newStatus!==oldStatus&&opsCode_(newStatus)<=7)clearStoreReceipt_(id);
  invalidateOpsData_();
  writeCtServicesFast_(id, services, d.technician || actor || old.technician || '');
  addLog(id, actor || d.technician || old.technician || 'Kỹ thuật', 'Cập nhật trạng thái', JSON.stringify({type:'STATUS',fromStatus:oldStatus,toStatus:newStatus,message:'Dịch vụ trước: '+(old.repairService||'Chưa có')+'; Dịch vụ thực tế: '+(serviceText||'Chưa có')}));

  return { success: true, data: sanitizeRepairForRole_(rowToObj(rowValues,m),role), services: services };
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
  const roleCheck = requireRole_({ role: String((d && d.userRole) || '') }, ['department_head', 'admin']);
  if (roleCheck) return roleCheck;
  const sheet = sh(SHEETS.DATA);
  const row = findRow(id);
  if (row < 2) return { success: false, message: 'Không tìm thấy phiếu' };

  const role = String(d.userRole || d.role || '').trim();
  if (role !== 'department_head' && role !== 'admin') return { success: false, message: 'Chỉ Trưởng phòng/Admin được cập nhật chi phí và lợi nhuận.' };

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
  const row=findRow(id);if(row<2)return {success:false,message:'Không tìm thấy đơn sửa chữa.'};
  const sheet=sh(SHEETS.DATA),values=sheet.getRange(row,1,1,sheet.getLastColumn()).getValues()[0],map=mapHeader(SHEETS.DATA),data=rowToObj(values,map);
  const quote=rowValue_(values,map,['Giá dự kiến','Giá báo dự kiến','Báo giá dự kiến']);data.estimate=quote===''?'':moneyValue(quote);
  return { success: true, data: data, logs: logsFor(id), services: [], materials: [] };
}

function logsFor(id) {
  return readObjectsByRepair_(SHEETS.LOG,id).map(function (x) { return { id: x.ID, repairId: x['Mã sửa chữa'], time: x['Thời gian'], user: x['Người thực hiện'], action: x['Hành động'], content: x['Nội dung'] }; });
}

function ctFor(sheetName, id) {
  return readObjectsByRepair_(sheetName,id);
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
  const roleCheck = requireRole_({ role: String((d && d.userRole) || '') }, ['department_head', 'admin']);
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
  const roleCheck = requireRole_({ role: String((d && d.userRole) || '') }, ['department_head', 'admin']);
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
  const roleCheck = requireRole_({ role: String((d && d.userRole) || '') }, ['department_head', 'admin']);
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



/* ========================================================================== */
/* V15 — MOBILE COMMAND / SERVER-SIDE SUMMARY & PAGING                        */
/* ========================================================================== */
function getMastersForV15_(session) {
  // V15 chỉ lấy danh mục thực sự dùng trên mobile, tránh tải hoa hồng/vật tư/NCC không cần thiết.
  return {
    trangThai: DEFAULTS.DM_TRANG_THAI.slice(1),
    loaiDichVu: readSingle(SHEETS.DM_LOAI_DICH_VU),
    dichVu: readObjects(SHEETS.DM_DICH_VU).map(function (x) { return { name: pick_(x, ['Tên dịch vụ','Dịch vụ']), group: pick_(x, ['Nhóm dịch vụ','Nhóm']) }; }).filter(function(x){ return x.name; }),
    kyThuat: readObjects(SHEETS.DM_KY_THUAT).map(function (x) { return { name: pick_(x, ['Tên kỹ thuật','Kỹ thuật','Tên nhân viên']), branch: pick_(x, ['Chi nhánh','CN']), status: pick_(x, ['Trạng thái']) }; }).filter(function(x){ return x.name; }),
    dongMay: readSingle(SHEETS.DM_DONG_MAY)
  };
}

function getPublicMasters_() {
  const m = getMastersCached_();
  return { trangThai: m.trangThai || [], loaiDichVu: m.loaiDichVu || [], dongMay: m.dongMay || [], nhanVien: m.nhanVien || [] };
}

function sanitizeRepairForRole_(r,role){
 if(!r)return r;const x=Object.assign({},r);
 ['location','materialCost','laborCost','totalCost','actualRevenue','profit','ncc','billCode','paymentStatus'].forEach(function(k){delete x[k];});return x;
}

function getDetailForSession_(id, session) {
  const d = getDetail(id);
  if(d.success===false)return d;
  d.logs=(d.logs||[]).filter(function(x){return /trạng thái|Bàn giao|Tiếp nhận|trả khách|nhận máy|báo khách/i.test(x.action||'');});
  const role = String(session && session.role || '');
  d.data = sanitizeRepairForRole_(d.data, role);
  d.materials=[];d.services=[];d.data.tracking=getOpsTracking_(id);d.history=(d.logs||[]).map(publicOpsHistory_).reverse();
  d.logs=[];d.services=readOpsServices_(id,d.data.repairService).map(function(x){return {name:x.name};});d.relatedRepairs=relatedOpsRepairs_(d.data);
  return d;
}

function parseV15Date_(v) {
  if (!v) return null;
  if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v)) return v;
  const s = String(v).trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(Number(m[1]), Number(m[2])-1, Number(m[3]), 12, 0, 0);
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return new Date(Number(m[3]), Number(m[2])-1, Number(m[1]), 12, 0, 0);
  const d = new Date(s);
  return isNaN(d) ? null : d;
}
function v15DayStart_(d){ const x=new Date(d); x.setHours(0,0,0,0); return x; }
function v15DayEnd_(d){ const x=new Date(d); x.setHours(23,59,59,999); return x; }
function inV15Range_(row, from, to) {
  const d = parseV15Date_(row.date);
  if (!d) return false;
  const f = from ? parseV15Date_(from) : null, t = to ? parseV15Date_(to) : null;
  if (f && d < v15DayStart_(f)) return false;
  if (t && d > v15DayEnd_(t)) return false;
  return true;
}
function isDoneV15_(r){ const s=String(r.status||''); return s.indexOf('7.')===0 || s.indexOf('8.')===0; }
function isClosedV15_(r){ const s=String(r.status||''); return s.indexOf('8.')===0 || s.indexOf('11.')===0; }
function isPendingV15_(r){ const s=String(r.status||''); return !!s && !isDoneV15_(r) && s.indexOf('11.')!==0; }
function isOverdueV15_(r){
  if (isClosedV15_(r) || isDoneV15_(r)) return false;
  if (String(r.overdue||'').toLowerCase()==='có') return true;
  const a=parseV15Date_(r.appointment); return !!(a && a.getTime()<Date.now());
}
function splitServiceV15_(s){ return String(s||'').split(/[,;\n]+/).map(function(x){return x.trim();}).filter(Boolean); }
function normalizeStatusV15_(s){ return normText_(String(s||'').replace(/^\d+\.\s*/,'')); }
function matchesQueryV15_(r, q){
  q=normText_(q||''); if(!q) return true;
  return [r.repairId,r.imei,r.phone,r.customer,r.product].some(function(v){return normText_(v||'').indexOf(q)>-1;});
}
function roleCanMoneyV15_(role){ return role==='admin' || role==='department_head'; }

function adminOverview_(body, session) {
  const role=String(session.role||'');
  if (role!=='admin' && role!=='department_head') return {success:false,message:'Bạn không có quyền xem tổng quan tài chính.'};
  const all=readPeriodRepairs_(body);
  const rows=all.filter(function(r){return inV15Range_(r,body.from,body.to);});
  let revenue=0,cost=0,profit=0,overdue=0,unassigned=0,waitQuote=0,waitParts=0;
  const tech={};
  rows.forEach(function(r){
    revenue+=moneyValue(r.actualRevenue); cost+=moneyValue(r.totalCost); profit+=moneyValue(r.profit);
    if(isOverdueV15_(r)) overdue++;
    if(isPendingV15_(r)&&!String(r.technician||'').trim()) unassigned++;
    if(String(r.status||'').indexOf('3.')===0) waitQuote++;
    if(String(r.status||'').indexOf('6.')===0) waitParts++;
    const name=String(r.technician||'Chưa gán').trim()||'Chưa gán';
    if(!tech[name]) tech[name]={name:name,total:0,done:0,pending:0,overdue:0};
    tech[name].total++; if(isDoneV15_(r)) tech[name].done++; if(isPendingV15_(r)) tech[name].pending++; if(isOverdueV15_(r)) tech[name].overdue++;
  });
  return {success:true,data:{orders:rows.length,revenue:revenue,cost:cost,profit:profit,overdue:overdue,unassigned:unassigned,waitQuote:waitQuote,waitParts:waitParts,technicians:Object.keys(tech).map(function(k){return tech[k];}).sort(function(a,b){return b.pending-a.pending||b.total-a.total;}),periodLabel:String(body.from||'')+' → '+String(body.to||'')}};
}

function filterRowsV15_(body, session, pendingOnly) {
  let rows=readPeriodRepairs_(body);
  const role=String(session.role||'');

  const bounds=periodBounds_(body);
  rows=rows.filter(function(r){const d=parseV15Date_(r.date);return inV15Range_(r,bounds.from,bounds.to)||(body.includePending===true&&isOutstandingOps_(r)&&(!d||d<=bounds.end));});
  if(pendingOnly) rows=rows.filter(isPendingV15_);
  if(body.technician) { const k=normText_(body.technician); rows=rows.filter(function(r){return normText_(r.technician||'')===k;}); }
  if(body.branch) { const k=normText_(body.branch); rows=rows.filter(function(r){return normText_(r.branch||'')===k;}); }
  if(body.q) rows=rows.filter(function(r){return matchesQueryV15_(r,body.q);});
  const st=String(body.status||'');
  if(st==='overdue') rows=rows.filter(isOverdueV15_);
  else if(st==='unassigned') rows=rows.filter(function(r){return !String(r.technician||'').trim();});
  else if(st) { const k=normalizeStatusV15_(st); rows=rows.filter(function(r){return normalizeStatusV15_(r.status)===k || String(r.status||'').indexOf(st)===0;}); }
  return rows;
}
function pageV15_(rows, body, session){
  const limit=Math.max(10,Math.min(50,Number(body.limit||30))); const page=Math.max(1,Number(body.page||1)); const total=rows.length; const pages=Math.max(1,Math.ceil(total/limit)); const safe=Math.min(page,pages); const start=(safe-1)*limit;
  return {data:rows.slice(start,start+limit).map(function(r){return sanitizeRepairForRole_(r,session.role);}),meta:{page:safe,pages:pages,total:total,limit:limit}};
}
function progressList_(body, session){
  if(['admin','department_head','tech_manager','tech'].indexOf(session.role)===-1) return {success:false,message:'Bạn không có quyền xem tiến độ kỹ thuật.'};
  const selected=String(body.status||'');
  const pendingOnly=!(selected.indexOf('7.')===0 || normalizeStatusV15_(selected)==='da hoan thanh' || normalizeStatusV15_(selected)==='da sua xong');
  const rows=filterRowsV15_(body,session,pendingOnly); const out=pageV15_(rows,body,session); out.success=true;out.meta.carryPending=rows.filter(function(r){return !inV15Range_(r,body.from,body.to);}).length; return out;
}

function repairListPaged_(body, session){
  let rows=filterRowsV15_(body,session,false);
  // mặc định 30 ngày nếu không tìm kiếm và không truyền khoảng ngày, tránh mở cả lịch sử 6.000 dòng.
  if(!body.q && !body.from && !body.to){ const to=new Date(), from=new Date(); from.setDate(to.getDate()-30); rows=rows.filter(function(r){const d=parseV15Date_(r.date);return d&&d>=v15DayStart_(from)&&d<=v15DayEnd_(to);}); }
  const out=pageV15_(rows,body,session); out.success=true;out.meta.carryPending=rows.filter(function(r){return !inV15Range_(r,body.from,body.to);}).length; return out;
}

function serviceAnalytics_(body, session){
  if(session.role!=='admin') return {success:false,message:'Chỉ Admin được xem phân tích dịch vụ.'};
  const rows=readPeriodRepairs_(body).filter(function(r){return inV15Range_(r,body.from,body.to);});
  const map={}, repairMap={}, materialMap={}; let total=0, materialTotal=0;
  rows.forEach(function(r){
    repairMap[String(r.repairId||'')] = r;
    splitServiceV15_(r.repairService).forEach(function(s){ const key=s+'|||'+String(r.product||'Chưa rõ'); if(!map[key]) map[key]={service:s,model:String(r.product||'Chưa rõ'),count:0}; map[key].count++; total++; });
  });
  readPeriodMaterials_(repairMap).forEach(function(m){
    const r=repairMap[String(m.repairId||'')]; if(!r) return;
    const name=String(m.name||'Chưa rõ').trim()||'Chưa rõ', model=String(r.product||'Chưa rõ'), qty=Number(m.qty||1)||1, key=name+'|||'+model;
    if(!materialMap[key]) materialMap[key]={material:name,model:model,qty:0,repairCount:0,_repairs:{}};
    materialMap[key].qty+=qty; materialTotal+=qty;
    if(!materialMap[key]._repairs[r.repairId]){materialMap[key]._repairs[r.repairId]=1;materialMap[key].repairCount++;}
  });
  const materials=Object.keys(materialMap).map(function(k){const x=materialMap[k];delete x._repairs;return x;}).sort(function(a,b){return b.qty-a.qty;}).slice(0,80);
  return {success:true,data:{total:total,rows:Object.keys(map).map(function(k){return map[k];}).sort(function(a,b){return b.count-a.count;}).slice(0,100),materialTotal:materialTotal,materials:materials}};
}
function serviceTypeAnalytics_(body, session){
  if(session.role!=='admin') return {success:false,message:'Chỉ Admin được xem cơ cấu loại dịch vụ.'};
  const all=readPeriodRepairs_(body);
  const firstSeen=periodFirstSeen_();
  const rows=all.filter(function(r){return inV15Range_(r,body.from,body.to);}); const types={}, groups={new:0,old:0,warranty:0};
  rows.forEach(function(r){ const typ=String(r.serviceType||'Chưa phân loại').trim()||'Chưa phân loại'; types[typ]=(types[typ]||0)+1; const nk=normText_(typ); if(nk.indexOf('bao hanh')>-1) groups.warranty++; else { const p=onlyDigits_(r.phone||''); const d=parseV15Date_(r.date); if(p&&d&&firstSeen[p]&&Math.abs(v15DayStart_(firstSeen[p])-v15DayStart_(d))<86400000) groups.new++; else groups.old++; } });
  return {success:true,data:{total:rows.length,rows:Object.keys(types).map(function(k){return{name:k,count:types[k]};}).sort(function(a,b){return b.count-a.count;}),customerTotal:rows.length,customerGroups:[{name:'Khách mới',count:groups.new},{name:'Khách cũ',count:groups.old},{name:'Bảo hành',count:groups.warranty}]}};
}
function weekStartV15_(d){ const x=v15DayStart_(d), day=(x.getDay()+6)%7; x.setDate(x.getDate()-day); return x; }
function weeklyAnalytics_(body, session){
  if(session.role!=='admin') return {success:false,message:'Chỉ Admin được xem báo cáo tuần.'};
  const bounds=periodBounds_(body), start=weekStartV15_(bounds.start), end=weekStartV15_(bounds.end), weeks=Math.round((end-start)/604800000)+1; const buckets={};
  for(let i=0;i<weeks;i++){const ws=new Date(start);ws.setDate(start.getDate()+i*7);const key=Utilities.formatDate(ws,TZ,'yyyy-MM-dd');buckets[key]={key:key,label:'Tuần '+Utilities.formatDate(ws,TZ,'dd/MM'),orders:0,revenue:0,cost:0,profit:0};}
  readPeriodRepairs_(body).forEach(function(r){const d=parseV15Date_(r.date);if(!d||!inV15Range_(r,bounds.from,bounds.to))return;const ws=weekStartV15_(d);const key=Utilities.formatDate(ws,TZ,'yyyy-MM-dd');if(!buckets[key])return;const b=buckets[key];b.orders++;b.revenue+=moneyValue(r.actualRevenue);b.cost+=moneyValue(r.totalCost);b.profit+=moneyValue(r.profit);});
  return {success:true,data:{rows:Object.keys(buckets).sort().reverse().map(function(k){return buckets[k];})}};
}

// Read-only warmup. Each existing route retains its own role checks and sanitization.
function dashboardBatch_(body,session){
  const requests=body.requests;
  if(!Array.isArray(requests)||requests.length>7)return {success:false,message:'Batch tối đa 7 yêu cầu đọc.'};
  const handlers={operationsOverview:operationsOverview_,operationsList:operationsList_};
  BATCH_READ_ACTIVE_=true;BATCH_REPAIR_ROWS_=null;
  try{return {success:true,data:requests.map(function(req){
    const action=String(req&&req.action||'');
    if(!Object.prototype.hasOwnProperty.call(handlers,action))return {success:false,message:'Batch chỉ hỗ trợ đọc dữ liệu dashboard.'};
    try{return handlers[action](req,session);}catch(err){return {success:false,message:String(err&&err.message||err)};}
  })};}finally{BATCH_READ_ACTIVE_=false;BATCH_REPAIR_ROWS_=null;}
}

let PERIOD_INDEX_ = null;
const PERIOD_ROWS_ = {};
const PERIOD_OBJECTS_ = {};
function periodColumns_(map, aliases){
 const out=[];aliases.forEach(function(a){if(map[a]!==undefined&&out.indexOf(map[a])<0)out.push(map[a]);});
 const norms=aliases.map(normalizeHeader_);Object.keys(map).forEach(function(k){if(norms.indexOf(normalizeHeader_(k))>=0&&out.indexOf(map[k])<0)out.push(map[k]);});return out;
}
function periodIndex_(){
 if(PERIOD_INDEX_)return PERIOD_INDEX_;
 const sheet=sh(SHEETS.DATA), last=sheet.getLastRow(), width=sheet.getLastColumn(), map={};
 if(last<2)return PERIOD_INDEX_={sheet:sheet,map:map,width:width,rows:[]};
 sheet.getRange(1,1,1,width).getValues()[0].forEach(function(h,i){const k=String(h||'').trim();if(k&&map[k]===undefined)map[k]=i;});
 const dates=periodColumns_(map,['Ngày nhận','Ngày tiếp nhận','Dấu thời gian']);
 const statuses=periodColumns_(map,['Trạng thái máy','Trạng thái','Tình trạng xử lý']);
 if(!dates.length||!statuses.length)throw new Error('DATA thiếu cột Ngày nhận hoặc Trạng thái.');
 const locations=periodColumns_(map,['Vị trí máy']);
 const values={};dates.concat(statuses,locations).forEach(function(c){if(!values[c])values[c]=sheet.getRange(2,c+1,last-1,1).getValues();});
 function valueAt(cols,i){for(let j=0;j<cols.length;j++){const v=values[cols[j]][i][0];if(v!==''&&v!==null&&v!==undefined)return v;}return '';}
 const rows=[];for(let i=0;i<last-1;i++)rows.push({row:i+2,date:valueAt(dates,i),status:valueAt(statuses,i),location:valueAt(locations,i)});
 return PERIOD_INDEX_={sheet:sheet,map:map,width:width,rows:rows};
}
function periodBounds_(body){
 const today=new Date(), from=body.from||Utilities.formatDate(new Date(today.getFullYear(),today.getMonth(),1),TZ,'yyyy-MM-dd'),to=body.to||Utilities.formatDate(new Date(today.getFullYear(),today.getMonth()+1,0),TZ,'yyyy-MM-dd');
 const f=parseV15Date_(from),t=parseV15Date_(to);if(!f||!t)throw new Error('Kỳ dữ liệu không hợp lệ.');return {from:from,to:to,start:v15DayStart_(f),end:v15DayEnd_(t)};
}
function readPeriodRepairs_(body){
 const bounds=periodBounds_(body), key=String(bounds.from)+'|'+String(bounds.to)+'|'+String(body.includePending===true);
 if(PERIOD_ROWS_[key])return PERIOD_ROWS_[key];
 const index=periodIndex_(),selected=index.rows.filter(function(r){const d=parseV15Date_(r.date);return (d&&d>=bounds.start&&d<=bounds.end)||(body.includePending===true&&isOutstandingOps_(r)&&(!d||d<=bounds.end));});
 const groups=[];selected.filter(function(r){return !PERIOD_OBJECTS_[r.row];}).forEach(function(r){let g=groups[groups.length-1];if(!g||r.row-g.end>8){g={start:r.row,end:r.row,selected:{}};groups.push(g);}g.end=r.row;g.selected[r.row]=true;});
 groups.forEach(function(g){index.sheet.getRange(g.start,1,g.end-g.start+1,index.width).getValues().forEach(function(row,i){if(!g.selected[g.start+i])return;const obj=rowToObj(row,index.map);PERIOD_OBJECTS_[g.start+i]=obj;});});
 return PERIOD_ROWS_[key]=selected.map(function(r){return PERIOD_OBJECTS_[r.row];}).filter(function(r){return r&&r.repairId;}).reverse();
}

function periodFirstSeen_(){
 const index=periodIndex_(),columns=periodColumns_(index.map,['Số điện thoại','SĐT','Điện thoại']),values={};
 columns.forEach(function(c){if(index.rows.length)values[c]=index.sheet.getRange(2,c+1,index.rows.length,1).getValues();});
 const first={};index.rows.forEach(function(r,i){let phone='';for(let j=0;j<columns.length;j++){const v=values[columns[j]][i][0];if(v!==''&&v!==null&&v!==undefined){phone=onlyDigits_(v);break;}}const d=parseV15Date_(r.date);if(phone&&d&&(!first[phone]||d<first[phone]))first[phone]=d;});return first;
}

function readPeriodMaterials_(repairMap){
 const sheet=sh(SHEETS.CT_VAT_TU),last=sheet.getLastRow(),width=sheet.getLastColumn();if(last<2||!Object.keys(repairMap).length)return [];
 const headers=sheet.getRange(1,1,1,width).getValues()[0].map(function(x){return String(x||'').trim();}), id=headers.indexOf('Mã sửa chữa');if(id<0)throw new Error('CT_VAT_TU thiếu cột Mã sửa chữa');
 const ids=sheet.getRange(2,id+1,last-1,1).getValues(),groups=[];
 ids.forEach(function(v,i){if(!repairMap[String(v[0]||'')])return;const row=i+2;let g=groups[groups.length-1];if(!g||row-g.end>8){g={start:row,end:row};groups.push(g);}g.end=row;});
 const out=[];groups.forEach(function(g){sheet.getRange(g.start,1,g.end-g.start+1,width).getValues().forEach(function(row){if(!repairMap[String(row[id]||'')])return;const x={};headers.forEach(function(h,i){x[h]=row[i];});if(x['Tên vật tư'])out.push({repairId:x['Mã sửa chữa'],name:x['Tên vật tư'],qty:Number(x['SL']||1)});});});return out;
}

function opsCode_(status){const m=String(status||'').match(/^\s*(\d+)/);return m?Number(m[1]):0;}
function isOutstandingOps_(r){return [8,9,10,11].indexOf(opsCode_(r.status))<0;}
function operationRows_(body,session){
 if(body.returnedTodayOnly===true){const today=Utilities.formatDate(new Date(),TZ,'yyyy-MM-dd');return readOpsData_(body.fresh===true).filter(function(r){return opsCode_(r.status)===8&&inV15Range_({date:r.handoverDate},today,today);});}
 if(String(body.q||'').trim()){let all=readOpsData_(body.fresh===true);return all;}
 const selected=body.todayOnly===true?Object.assign({},body,{from:Utilities.formatDate(new Date(),TZ,'yyyy-MM-dd'),to:Utilities.formatDate(new Date(),TZ,'yyyy-MM-dd')}):body;
 const bounds=periodBounds_(selected),now=parseV15Date_(Utilities.formatDate(new Date(),TZ,'yyyy-MM-dd'));
 let rows=readOpsData_(body.fresh===true).filter(function(r){const d=parseV15Date_(r.date);return inV15Range_(r,bounds.from,bounds.to)||((body.onlyOutstanding===true||body.includePending===true)&&isOutstandingOps_(r)&&(!d||d<=v15DayEnd_(now)));});
 return rows;
}
function operationsOverview_(body,session){
 const rows=operationRows_(Object.assign({},body,{includePending:true}),session),month=rows.filter(function(r){return inV15Range_(r,body.from,body.to);}),pending=rows.filter(function(r){const date=parseV15Date_(r.date);return isOutstandingOps_(r)&&(!date||date<=v15DayEnd_(parseV15Date_(Utilities.formatDate(new Date(),TZ,'yyyy-MM-dd'))));}),today=Utilities.formatDate(new Date(),TZ,'yyyy-MM-dd'),receivedToday=readOpsData_(false).filter(function(r){return inV15Range_(r,today,today);}),returnedToday=readOpsData_(false).filter(function(r){return opsCode_(r.status)===8&&inV15Range_({date:r.handoverDate},today,today);}),todayStatuses=Object.create(null),tech=Object.create(null),branches=Object.create(null),serviceTypes=Object.create(null);
 function group(map,name){if(!map[name])map[name]={name:name,total:0,pending:0};return map[name];}
 month.forEach(function(r){group(tech,r.technician||'Chưa gán').total++;group(branches,r.branch||'Chưa có chi nhánh').total++;const type=group(serviceTypes,String(r.serviceType||'').trim()||'Chưa phân loại');type.total++;if(isOutstandingOps_(r))type.pending++;});
 pending.forEach(function(r){group(tech,r.technician||'Chưa gán').pending++;group(branches,r.branch||'Chưa có chi nhánh').pending++;});
 receivedToday.forEach(function(r){const n=opsCode_(r.status);todayStatuses[n]=(todayStatuses[n]||0)+1;});
 const late=pending.filter(isOverdueOps_).sort(function(a,b){return (parseV15Date_(a.appointment)||0)-(parseV15Date_(b.appointment)||0);});
 function arr(map){return Object.keys(map).map(function(k){return map[k];}).sort(function(a,b){return b.pending-a.pending||b.total-a.total;});}
 return {success:true,data:{periodTotal:month.length,pending:pending.length,waitingStore:readOpsData_(false).filter(function(r){return isAwaitingStoreOps_(r);}).length,receivedToday:receivedToday.length,returnedToday:returnedToday.length,receivedTodayPending:receivedToday.filter(isOutstandingOps_).length,todayLabel:today,todayStatuses:todayStatuses,technicians:arr(tech),branches:arr(branches),serviceTypes:arr(serviceTypes).map(function(t){t.completed=t.total-t.pending;return t;}),overdue:late.length,overdueRows:late.slice(0,20).map(function(r){return sanitizeRepairForRole_(r,session.role);}),branchOptions:Array.from(new Set(rows.map(function(r){return r.branch||'Chưa có chi nhánh';}))).sort()}};
}
function isAwaitingStoreOps_(r){return opsCode_(r.status)===7&&!(r.tracking||{}).storeReceivedAt;}
function operationsList_(body,session){
 let rows=operationRows_(body,session);
 if(body.onlyOutstanding===true){const todayEnd=v15DayEnd_(parseV15Date_(Utilities.formatDate(new Date(),TZ,'yyyy-MM-dd')));rows=rows.filter(function(r){const d=parseV15Date_(r.date);return isOutstandingOps_(r)&&(!d||d<=todayEnd);});}
 function common(list){
  if(body.q)list=list.filter(function(r){return matchesQueryV15_(r,body.q);});
  if(body.branch)list=list.filter(function(r){return (r.branch||'Chưa có chi nhánh')===body.branch;});
  if(body.technician)list=list.filter(function(r){return (r.technician||'Chưa gán')===body.technician;});
  if(body.serviceType)list=list.filter(function(r){return (String(r.serviceType||'').trim()||'Chưa phân loại')===body.serviceType;});

  return list;
 }
 rows=common(rows);
 if(body.todayOnly===true){const today=Utilities.formatDate(new Date(),TZ,'yyyy-MM-dd');rows=rows.filter(function(r){return inV15Range_(r,today,today);});}
 const statusCounts={},totalBeforeStatus=rows.length,overdueCount=rows.filter(isOverdueOps_).length,unassignedCount=rows.filter(function(r){return isOutstandingOps_(r)&&!r.technician;}).length;
 rows.forEach(function(r){const n=opsCode_(r.status);statusCounts[n]=(statusCounts[n]||0)+1;});
 const waiting=common(readOpsData_(false).filter(isAwaitingStoreOps_));
 if(body.status==='waitingStore')rows=waiting;
 else if(body.status==='overdue')rows=rows.filter(isOverdueOps_);
 else if(body.status==='unassigned')rows=rows.filter(function(r){return isOutstandingOps_(r)&&!r.technician;});
 else if(body.status)rows=rows.filter(function(r){return opsCode_(r.status)===Number(body.status);});
 const out=pageV15_(rows,body,session);out.success=true;out.searchAllHistory=!!String(body.q||'').trim();out.statusCounts=statusCounts;out.totalBeforeStatus=totalBeforeStatus;out.overdueCount=overdueCount;out.unassignedCount=unassignedCount;out.waitingStoreCount=waiting.length;out.branchOptions=Array.from(new Set(rows.map(function(r){return r.branch||'Chưa có chi nhánh';}))).sort();return out;
}


function readObjectsByRepair_(name,id){
 const sheet=sh(name),last=sheet.getLastRow(),width=sheet.getLastColumn();if(last<2)return [];
 const headers=sheet.getRange(1,1,1,width).getValues()[0].map(function(x){return String(x||'').trim();}),col=headers.indexOf('Mã sửa chữa');if(col<0)return [];
 const ids=sheet.getRange(2,col+1,last-1,1).getValues(),groups=[];ids.forEach(function(v,i){if(String(v[0])!==String(id))return;const row=i+2;let g=groups[groups.length-1];if(!g||row-g.end>8){g={start:row,end:row};groups.push(g);}g.end=row;});
 const out=[];groups.forEach(function(g){sheet.getRange(g.start,1,g.end-g.start+1,width).getValues().forEach(function(row){if(String(row[col])!==String(id))return;const x={};headers.forEach(function(h,i){if(h)x[h]=row[i];});out.push(x);});});return out;
}

function isOverdueOps_(r){
 if(!isOutstandingOps_(r))return false;const text=String(r.appointment||''),d=parseV15Date_(r.appointment);if(!d)return false;
 const clock=text.match(/(?:T|\s)(\d{1,2}):(\d{2})(?::(\d{2}))?/),date=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'),time=clock?String(clock[1]).padStart(2,'0')+':'+clock[2]+':'+(clock[3]||'00'):'23:59:59';
 return new Date(date+'T'+time+'+07:00').getTime()<Date.now();
}

let OPS_DATA_LOCAL_=null;
function invalidateOpsData_(){OPS_DATA_LOCAL_=null;try{PropertiesService.getScriptProperties().setProperty('OPS_DATA_REV',Utilities.getUuid());}catch(e){}}
function readOpsData_(fresh){
 if(OPS_DATA_LOCAL_&&!fresh)return OPS_DATA_LOCAL_;
 let cache,revision='0',prefix;
 try{
   cache=CacheService.getScriptCache();revision=PropertiesService.getScriptProperties().getProperty('OPS_DATA_REV')||'0';prefix='OPS170_'+revision;
   if(!fresh){const raw=cache.get(prefix);if(raw){const meta=JSON.parse(raw),keys=Array.from({length:meta.parts},function(_,i){return prefix+'_'+i;}),parts=cache.getAll(keys);if(keys.every(function(k){return parts[k];})){const encoded=keys.map(function(k){return parts[k];}).join('');return OPS_DATA_LOCAL_=JSON.parse(Utilities.ungzip(Utilities.newBlob(Utilities.base64Decode(encoded))).getDataAsString());}}}
 }catch(e){}
 const sheet=sh(SHEETS.DATA),last=sheet.getLastRow(),width=sheet.getLastColumn();if(last<2)return OPS_DATA_LOCAL_=[];
 const headers=sheet.getRange(1,1,1,width).getValues()[0],map={};headers.forEach(function(h,i){const k=String(h||'').trim();if(k&&map[k]===undefined)map[k]=i;});
 const aliases=[['Mã sửa chữa','Mã SC','Mã sửa','MA SUA CHUA'],['IMEI','IMEI/Serial','Serial'],['Ngày nhận','Ngày tiếp nhận','Dấu thời gian'],['Chi nhánh nhận','CN nhận','Chi nhánh','CN'],['Sản phẩm','Dòng máy','Tên máy'],['Tên khách hàng','Họ tên khách hàng','Họ và tên','Khách hàng'],['Số điện thoại','SĐT','Điện thoại'],['Yêu cầu sửa chữa','Yêu cầu','Nội dung sửa chữa'],['Dịch vụ sửa chữa','Dịch vụ','DV sửa chữa'],['Kỹ thuật xử lý','Kỹ thuật','KTV'],['Trạng thái máy','Trạng thái','Tình trạng xử lý'],['Hẹn trả','Ngày hẹn trả','Ngày hẹn'],['Ngày hoàn thành','Ngày sửa xong'],['Ngày bàn giao','Ngày trả khách','Ngày trả'],['Giá dự kiến','Giá báo dự kiến','Báo giá dự kiến'],['Loại dịch vụ','Loại DV','Nhóm loại dịch vụ']];
 const columns=[];aliases.forEach(function(a){periodColumns_(map,a).forEach(function(c){if(columns.indexOf(c)<0)columns.push(c);});});
 if(!periodColumns_(map,aliases[0]).length||!periodColumns_(map,aliases[2]).length||!periodColumns_(map,aliases[10]).length)throw new Error('DATA thiếu cột Mã sửa chữa, Ngày nhận hoặc Trạng thái.');
 const first=Math.min.apply(null,columns),end=Math.max.apply(null,columns),values=sheet.getRange(2,first+1,last-1,end-first+1).getValues(),keys=['repairId','imei','date','branch','product','customer','phone','request','repairService','technician','status','appointment','completedDate','handoverDate','estimate','serviceType'];
 const out=[];values.forEach(function(v){const sparse=[];columns.forEach(function(c){sparse[c]=v[c-first];});const row={};aliases.forEach(function(a,i){let value=rowValue_(sparse,map,a);if(Object.prototype.toString.call(value)==='[object Date]')value=Utilities.formatDate(value,TZ,'yyyy-MM-dd HH:mm:ss');row[keys[i]]=keys[i]==='estimate'&&value!==''?moneyValue(value):value;});if(row.repairId)out.push(row);});out.reverse();const tracking=readOpsTracking_();out.forEach(function(r){r.tracking=tracking[String(r.repairId)]||{};});OPS_DATA_LOCAL_=out;
 try{if(cache&&prefix){const encoded=Utilities.base64Encode(Utilities.gzip(Utilities.newBlob(JSON.stringify(out))).getBytes()),parts={};let n=0;for(let i=0;i<encoded.length;i+=80000)parts[prefix+'_'+n++]=encoded.slice(i,i+80000);if(n<20){cache.putAll(parts,60);cache.put(prefix,JSON.stringify({parts:n}),60);}}}catch(e){}
 return out;
}

const OPS_TRACKING_SHEET_='THEO_DOI_DON';
const OPS_TRACKING_HEADERS_=['Mã sửa chữa','Kỹ thuật nhận lúc','Kỹ thuật nhận bởi','Cửa hàng nhận về lúc','Cửa hàng nhận về bởi','Kết quả báo khách','Đang chờ','Dự kiến hoàn tất','Báo khách lúc','Báo khách bởi','Nội dung báo khách','Kênh báo khách'];
const OPS_TRACKING_KEYS_=['repairId','techReceivedAt','techReceivedBy','storeReceivedAt','storeReceivedBy','customerResult','waitingReason','expectedFinish','lastContactAt','lastContactBy','lastContactNote','lastContactChannel'];
function readOpsTracking_(){
 const sheet=ss().getSheetByName(OPS_TRACKING_SHEET_);if(!sheet||sheet.getLastRow()<2)return {};
 const rows=sheet.getRange(2,1,sheet.getLastRow()-1,OPS_TRACKING_HEADERS_.length).getValues(),out={};rows.forEach(function(r){if(!r[0])return;const o={};OPS_TRACKING_KEYS_.forEach(function(k,i){let v=r[i];if(Object.prototype.toString.call(v)==='[object Date]')v=Utilities.formatDate(v,TZ,'yyyy-MM-dd HH:mm:ss');o[k]=v;});out[String(r[0])]=o;});return out;
}
function getOpsTracking_(id){return readOpsTracking_()[String(id)]||{};}
function publicOpsHistory_(log){
 const out={time:log.time,user:log.user,action:log.action,fromStatus:'',toStatus:'',message:''};
 try{const v=JSON.parse(log.content||'{}');out.fromStatus=v.fromStatus||'';out.toStatus=v.toStatus||'';out.message=v.message||'';}catch(e){out.message=String(log.content||'').split(' | ')[0];}
 return out;
}
function saveOpsTracking_(id,d){
 const role=String(d.userRole||''),event=String(d.event||''),allowed={techReceived:['tech','tech_manager','department_head','admin'],storeReceived:['store','department_head','admin'],customerInfo:['tech','tech_manager','department_head','admin'],contact:['cskh','store','tech','tech_manager','department_head','admin']};
 if(!Object.prototype.hasOwnProperty.call(allowed,event)||allowed[event].indexOf(role)<0)return {success:false,message:'Bạn không có quyền thực hiện thao tác này.'};
 if(event==='contact'&&!String(d.note||'').trim())return {success:false,message:'Nhập nội dung đã báo khách.'};
 if(event==='customerInfo'&&d.expectedFinish&&!parseV15Date_(d.expectedFinish))return {success:false,message:'Ngày dự kiến không hợp lệ.'};
 if(event==='customerInfo'&&d.estimate!==undefined&&d.estimate!==''&&(!isFinite(Number(d.estimate))||Number(d.estimate)<0))return {success:false,message:'Báo giá không hợp lệ.'};
 const lock=LockService.getScriptLock();if(!lock.tryLock(5000))return {success:false,message:'Đơn đang được cập nhật. Vui lòng thử lại.'};
 try{
  const dataSheet=sh(SHEETS.DATA),row=findRow(id);if(row<2)return {success:false,message:'Không tìm thấy đơn.'};const map=mapHeader(SHEETS.DATA),vals=dataSheet.getRange(row,1,1,dataSheet.getLastColumn()).getValues()[0],old=rowToObj(vals,map),current=getOpsTracking_(id),stamp=nowText(),actor=d.actor||d.sessionUser||'';
  if(event!=='contact'&&opsCode_(old.status)===8)return {success:false,message:'Đơn đã trả khách.'};
  let action='',message='';
  if(event==='techReceived'){
   if(current.techReceivedAt)return {success:true,data:current};
   const technician=String(d.technician||old.technician||'').trim();
   if(!technician||!validOpsTechnician_(technician,old.technician))return {success:false,message:'Chọn kỹ thuật nhận máy từ DM_KY_THUAT.'};
   if(map['Kỹ thuật xử lý']===undefined)return {success:false,message:'DATA thiếu cột Kỹ thuật xử lý.'};
   dataSheet.getRange(row,map['Kỹ thuật xử lý']+1).setValue(technician);
   current.techReceivedAt=stamp;current.techReceivedBy=technician;action='KT nhận';message=actor+' xác nhận KT nhận: '+technician;
  }
  if(event==='storeReceived'){if(opsCode_(old.status)!==7)return {success:false,message:'Chỉ CH nhận khi đơn ở 7. Đã sửa xong.'};if(current.storeReceivedAt)return {success:true,data:current};current.storeReceivedAt=stamp;current.storeReceivedBy=actor;action='Cửa hàng đã nhận máy về';message=actor+' xác nhận máy đã về '+(old.branch||'cửa hàng');}
  if(event==='customerInfo'){current.customerResult=String(d.customerResult||'').trim();current.waitingReason=String(d.waitingReason||'').trim();current.expectedFinish=String(d.expectedFinish||'').trim();action='Cập nhật thông tin báo khách';message=[current.customerResult,current.waitingReason?'Đang chờ: '+current.waitingReason:'',current.expectedFinish?'Dự kiến: '+current.expectedFinish:''].filter(Boolean).join(' · ');if(d.estimate!==undefined&&d.estimate!==''){const cols=periodColumns_(map,['Giá dự kiến','Giá báo dự kiến','Báo giá dự kiến']);if(!cols.length)return {success:false,message:'DATA thiếu cột báo giá.'};dataSheet.getRange(row,cols[0]+1).setValue(Number(d.estimate));}}
  if(event==='contact'){current.lastContactAt=stamp;current.lastContactBy=actor;current.lastContactNote=String(d.note||'').trim();current.lastContactChannel=String(d.channel||'').trim();action='Đã báo khách';message=(current.lastContactChannel?current.lastContactChannel+': ':'')+current.lastContactNote;}
  let sheet=ss().getSheetByName(OPS_TRACKING_SHEET_);if(!sheet){sheet=ss().insertSheet(OPS_TRACKING_SHEET_);sheet.getRange(1,1,1,OPS_TRACKING_HEADERS_.length).setValues([OPS_TRACKING_HEADERS_]);}
  const n=sheet.getLastRow(),ids=n>1?sheet.getRange(2,1,n-1,1).getValues():[],index=ids.findIndex(function(r){return String(r[0])===String(id);}),target=index>=0?index+2:n+1;current.repairId=id;sheet.getRange(target,1,1,OPS_TRACKING_KEYS_.length).setValues([OPS_TRACKING_KEYS_.map(function(k){return current[k]||'';})]);
  addLog(id,actor,action,JSON.stringify({type:event,message:message}));invalidateOpsData_();return {success:true,data:current};
 }finally{lock.releaseLock();}
}

// Chỉ đọc chi tiết dịch vụ khi mở/cập nhật một đơn, không đưa CT vào dashboard.
function readOpsServices_(id,fallback) {
 const sheet=ss().getSheetByName(SHEETS.CT_DICH_VU);
 if(sheet&&sheet.getLastRow()>1){const rows=readObjectsByRepair_(SHEETS.CT_DICH_VU,id);if(rows.length)return rows.map(function(r){return {name:String(pick_(r,['Tên dịch vụ','Dịch vụ'])).trim(),price:moneyValue(pick_(r,['Giá bán','Giá'])),note:r['Ghi chú']||''};}).filter(function(r){return r.name;});}
 return normalizeServices({repairService:fallback},{});
}

function historyPhone_(v) {let n=String(v||'').replace(/\D/g,'');if(n.indexOf('84')===0&&n.length===11)n='0'+n.slice(2);return n;}
function relatedOpsRepairs_(current) {
 const imei=String(current.imei||'').replace(/\s/g,'').toLowerCase(),phone=historyPhone_(current.phone),seen={};
 const rows=readOpsData_().filter(function(r){if(!r.repairId||seen[r.repairId])return false;seen[r.repairId]=true;return true;});
 function build(match) {
  const list=rows.filter(match).sort(function(a,b){return (parseV15Date_(a.date)||new Date(0))-(parseV15Date_(b.date)||new Date(0))||String(a.repairId).localeCompare(String(b.repairId));});
  return {total:list.length,currentVisit:list.findIndex(function(r){return String(r.repairId)===String(current.repairId);})+1,rows:list.map(function(r,i){return {repairId:r.repairId,visit:i+1,date:r.date,imei:r.imei,customer:r.customer,product:r.product,branch:r.branch,technician:r.technician,status:r.status,repairService:r.repairService,request:r.request,estimate:r.estimate,handoverDate:r.handoverDate,result:(r.tracking||{}).customerResult||'',current:String(r.repairId)===String(current.repairId)};}).reverse()};
 }
 return {machine:imei?build(function(r){return String(r.imei||'').replace(/\s/g,'').toLowerCase()===imei;}):null,customer:phone?build(function(r){return historyPhone_(r.phone)===phone;}):null};
}

function clearStoreReceipt_(id){
 const sheet=ss().getSheetByName(OPS_TRACKING_SHEET_);if(!sheet||sheet.getLastRow()<2)return;
 const ids=sheet.getRange(2,1,sheet.getLastRow()-1,1).getValues(),i=ids.findIndex(function(r){return String(r[0])===String(id);});
 if(i>=0)sheet.getRange(i+2,4,1,2).setValues([['','']]);
}

function validOpsTechnician_(name,existing){
 const key=normText_(name);if(existing&&key===normText_(existing))return true;
 return readObjects(SHEETS.DM_KY_THUAT).some(function(x){return normText_(pick_(x,['Tên kỹ thuật','Kỹ thuật','Tên nhân viên']))===key;});
}

// Admin routes are authenticated separately; financial fields never enter operational responses.
function getOpsMastersCached_(){const c=CacheService.getScriptCache(),k='OPS_MASTERS_'+API_VERSION,raw=c.get(k);if(raw){try{return JSON.parse(raw);}catch(e){}}const m=getMastersForV15_({});try{c.put(k,JSON.stringify(m),300);}catch(e){}return m;}
function getOpsEditDetail_(id,session){
 const row=findRow(id);if(row<2)return {success:false,message:'Không tìm thấy đơn.'};const sheet=sh(SHEETS.DATA),map=mapHeader(SHEETS.DATA),v=sheet.getRange(row,1,1,sheet.getLastColumn()).getValues()[0],data=sanitizeRepairForRole_(rowToObj(v,map),session.role);
 const quote=rowValue_(v,map,['Giá dự kiến','Giá báo dự kiến','Báo giá dự kiến']);data.estimate=quote===''?'':moneyValue(quote);data.tracking=getOpsTracking_(id);
 return {success:true,data:data,services:readOpsServices_(id,data.repairService).map(function(x){return {name:x.name};})};
}
function readAdminPeriod_(body){
 const sheet=sh(SHEETS.DATA),last=sheet.getLastRow(),width=sheet.getLastColumn();if(last<2)return [];
 const headers=sheet.getRange(1,1,1,width).getValues()[0],map={};headers.forEach(function(h,i){map[String(h).trim()]=i;});
 const vals=sheet.getRange(2,1,last-1,width).getValues(),tracking=readOpsTracking_(),out=[];
 vals.forEach(function(v){const r=rowToObj(v,map);if(!r.repairId||!inV15Range_(r,body.from,body.to)||(body.branch&&r.branch!==body.branch))return;r.tracking=tracking[String(r.repairId)]||{};r.overdue=isOverdueOps_(r)?'Có':'Không';out.push(r);});return out.reverse();
}
function adminBootstrap_(body){if(!body.from||!body.to)return {success:false,message:'Chọn kỳ Admin.'};const rows=readAdminPeriod_(body);return {success:true,version:API_VERSION,data:{masters:adminLightMasters_(),dashboard:{rows:rows,dataHealth:{sheetName:SHEETS.DATA,parsedRows:rows.length,checkedAt:nowText()}}}};}
function adminHeavy_(body){
 const rows=readAdminPeriod_(body),ids={};rows.forEach(function(r){ids[String(r.repairId)]=true;});const tab=String(body.tab||''),data={};
 if(['materials','commission','weeklyReport','masters'].indexOf(tab)<0&&tab!=='sentRepairs')return {success:false,message:'Mục Admin không hợp lệ.'};
 if(tab==='materials'||tab==='weeklyReport')data.ctMaterials=readCtMaterials().filter(function(x){return ids[String(x.repairId)];});
 if(tab==='masters')data.masters=getMastersCached_();
 if(tab==='commission'){data.masters={hoaHongTho:readObjects(SHEETS.DM_HOA_HONG_THO)};data.ctServices=readCtServices().filter(function(x){return ids[String(x.repairId)];});data.techWork=readTechWork().filter(function(x){return inV15Range_({date:x.date},body.from,body.to);});}
 if(tab==='commission'||tab==='sentRepairs')data.sentRepairs=ss().getSheetByName(SHEETS.MAY_GUI_XU_LY)?readSentRepairs().filter(function(x){return inV15Range_({date:x.sentDate},body.from,body.to)||!/đã nhận|hoàn tất|hủy/i.test(String(x.status||''));}):[];
 return {success:true,data:data};
}
function adminDetail_(id){const d=getDetail(id);if(!d.success)return d;d.services=readCtServices().filter(function(x){return String(x.repairId)===String(id);});d.materials=readCtMaterials().filter(function(x){return String(x.repairId)===String(id);});return d;}
function updateAdminCost_(id,d){
 const lock=LockService.getScriptLock();if(!lock.tryLock(5000))return {success:false,message:'Đơn đang cập nhật.'};
 try{
 const row=findRow(id);if(row<2)return {success:false,message:'Không tìm thấy đơn.'};const sheet=sh(SHEETS.DATA),m=mapHeader(SHEETS.DATA),range=sheet.getRange(row,1,1,sheet.getLastColumn()),v=range.getValues()[0],old=rowToObj(v,m),materials=normalizeMaterials(d,old);
 const labor=moneyValue(d.laborCost||0),revenue=moneyValue(d.actualRevenue||0);if(labor<0||revenue<0||materials.some(function(x){return x.qty<=0||x.unitPrice<0||x.amount<0;}))return {success:false,message:'Chi phí, thực thu và số lượng không hợp lệ.'};
 const material=materials.reduce(function(sum,x){return sum+x.amount;},0),fields={'Mã hóa đơn mua vật tư':uniqueText(materials.map(function(x){return x.billCode;})).join(', '),'Tên vật tư':materials.map(function(x){return x.name;}).join(', '),'Giá vật tư':material,'Công thợ':labor,'Tổng chi phí':material+labor,'Thực thu':revenue,'Lợi nhuận':revenue-material-labor,'NCC':uniqueText(materials.map(function(x){return x.ncc;})).join(', '),'Trạng thái thanh toán':d.paymentStatus||old.paymentStatus||'Chưa thanh toán','Ngày cập nhật':nowText()};
 for(const key of Object.keys(fields)){if(m[key]===undefined)return {success:false,message:'DATA thiếu cột '+key};v[m[key]]=fields[key];}
 const book=ss();if(!book.getSheetByName(SHEETS.CT_VAT_TU))ensureSheet(book,SHEETS.CT_VAT_TU,[['Mã sửa chữa','Mã bill mua vật tư','Tên vật tư','SL','Đơn giá','Thành tiền','NCC','Người thêm','Ngày thêm']]);
 writeAdminMaterials_(id,materials,d.actor);range.setValues([v]);addLog(id,d.actor,'Cập nhật chi phí','Thực thu '+revenue+' | Tổng chi phí '+(material+labor)+' | Lợi nhuận '+(revenue-material-labor));invalidateOpsData_();return {success:true,data:rowToObj(v,m)};
 }finally{lock.releaseLock();}
}
function writeAdminMaterials_(id,materials,actor){const sheet=sh(SHEETS.CT_VAT_TU),last=sheet.getLastRow(),matches=[];if(last>1)sheet.getRange(2,1,last-1,1).getValues().forEach(function(r,i){if(String(r[0])===String(id))matches.push(i+2);});const rows=materials.map(function(x){return [id,x.billCode,x.name,x.qty,x.unitPrice,x.amount,x.ncc,actor||'Admin',nowText()];}),n=Math.min(matches.length,rows.length);for(let i=0;i<n;i++)sheet.getRange(matches[i],1,1,9).setValues([rows[i]]);for(let i=n;i<matches.length;i++)sheet.getRange(matches[i],1,1,9).clearContent();if(rows.length>n)sheet.getRange(Math.max(2,sheet.getLastRow()+1),1,rows.length-n,9).setValues(rows.slice(n));}

function adminLightMasters_(){const m=getOpsMastersCached_();return Object.assign({},m,{vatTu:readObjects(SHEETS.DM_VAT_TU).map(function(x){return {name:pick_(x,['Tên vật tư','Vật tư']),group:pick_(x,['Nhóm vật tư','Nhóm'])};}),ncc:readObjects(SHEETS.DM_NCC).map(function(x){return Object.keys(x).map(function(k){return x[k];})[0];}).filter(Boolean)});}
