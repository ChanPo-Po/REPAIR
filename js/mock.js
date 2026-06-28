const MOCK_MASTERS = {
  trangThai: [
    '1. Đã tiếp nhận',
    '2. Đang kiểm tra',
    '3. Chờ báo giá',
    '4. Chờ khách duyệt',
    '5. Đang sửa',
    '6. Chờ linh kiện',
    '7. Đã sửa xong',
    '8. Đã trả khách',
    '9. Back lại khách',
    '10. Bảo hành lại',
    '11. Hủy sửa'
  ],
  dichVu: [
    { name: 'Thay pin KSC', group: 'Pin' },
    { name: 'Thay pin KSC DLC', group: 'Pin' },
    { name: 'Ép kính', group: 'Kính' },
    { name: 'Thay màn Zin New', group: 'Màn hình' },
    { name: 'Thay màn OLED', group: 'Màn hình' },
    { name: 'Fix màn', group: 'Màn hình' },
    { name: 'Sửa Face ID', group: 'FaceID' },
    { name: 'Vệ sinh máy', group: 'Vệ sinh' }
  ],
  vatTu: [
    { name: 'Pin KSC (Gold)', group: 'Pin' },
    { name: 'Pin KSC DLC', group: 'Pin' },
    { name: 'Kính + ron', group: 'Kính' },
    { name: 'Màn Zin New', group: 'Màn hình' },
    { name: 'Màn OLED', group: 'Màn hình' }
  ],
  loaiDichVu: [
    'Khách cũ lấy phí',
    'Sửa chữa mới',
    'Bảo hành',
    'Thay pin miễn phí',
    'Đặc quyền tối thượng',
    'Khách đối tác'
  ],
  kyThuat: [
    { name: 'Thanh', branch: '113', status: 'Đang làm' },
    { name: 'Trường', branch: '113', status: 'Đang làm' },
    { name: 'Phong', branch: '113', status: 'Đang làm' },
    { name: 'Thành', branch: '113', status: 'Đang làm' },
    { name: 'Hà', branch: '113', status: 'Đang làm' }
  ],
  ncc: ['Thắng', 'Vtech', 'Hồ Chí Trung', 'Nhà', 'Mua từ thợ', 'Maxe', 'Luban'],
  dongMay: ['11', '11PM', '12', '12PM', '12PRO', '13', '13PM', '14PM', '15PM', '16PM'],
  nhanVien: [
    { name: 'Chan', branch: '113', department: 'SALE', status: 'Đang làm' },
    { name: 'Hùng', branch: '113', department: 'SALE', status: 'Đang làm' },
    { name: 'Trường', branch: '113', department: 'SALE', status: 'Đang làm' }
  ]
};

let MOCK_REPAIRS = [
  {
    repairId: 'SC2606190001',
    imei: '111111',
    date: '19/06/2026 09:00:00',
    branch: '113',
    product: '12PM',
    customer: 'Huỳnh',
    phone: '0909009000',
    serviceType: 'Sửa chữa mới',
    receiveStatus: 'Full chức năng, pin bảo trì',
    request: 'Thay pin, vệ sinh máy',
    receiveNote: 'mk:0909',
    appointment: '2026-06-19 17:00',
    faceId: 'Bình thường',
    screen: 'Bình thường',
    cameraMic: 'Bình thường',
    speaker: 'Bình thường',
    estimate: 1200000,
    staff: 'Chan',
    repairService: 'Thay pin KSC, Vệ sinh máy',
    place: 'Nội bộ',
    technician: 'Thanh',
    status: '5. Đang sửa',
    completedDate: '',
    handoverDate: '',
    overdue: 'Không',
    techNote: '',
    billCode: 'VT001',
    materialName: 'Pin KSC (Gold)',
    materialCost: 220000,
    laborCost: 50000,
    totalCost: 270000,
    actualRevenue: 1200000,
    profit: 930000,
    ncc: 'Thắng',
    paymentStatus: 'Chưa thanh toán',
    year: 2026,
    month: 6,
    week: 25,
    createdAt: '19/06/2026 09:00:00',
    updatedAt: '19/06/2026 09:20:00'
  },
  {
    repairId: 'SC2606190002',
    imei: '222222',
    date: '19/06/2026 10:00:00',
    branch: '113',
    product: '13PM',
    customer: 'An',
    phone: '0909111222',
    serviceType: 'Khách cũ lấy phí',
    receiveStatus: 'Hư màn',
    request: 'Ép kính',
    receiveNote: '',
    appointment: '2026-06-20 10:00',
    faceId: 'Bình thường',
    screen: 'Lỗi',
    cameraMic: 'Bình thường',
    speaker: 'Bình thường',
    estimate: 900000,
    staff: 'Hùng',
    repairService: 'Ép kính',
    place: 'Nội bộ',
    technician: 'Phong',
    status: '7. Đã sửa xong',
    completedDate: '19/06/2026 12:00:00',
    handoverDate: '',
    overdue: 'Không',
    techNote: '',
    billCode: 'VT002',
    materialName: 'Kính + ron',
    materialCost: 160000,
    laborCost: 40000,
    totalCost: 200000,
    actualRevenue: 900000,
    profit: 700000,
    ncc: 'Nhà',
    paymentStatus: 'Đã thanh toán',
    year: 2026,
    month: 6,
    week: 25,
    createdAt: '19/06/2026 10:00:00',
    updatedAt: '19/06/2026 12:00:00'
  }
];

let MOCK_LOGS = [];
let MOCK_CT_DV = [
  { repairId: 'SC2606190001', name: 'Thay pin KSC', price: 0, note: '', user: 'Thanh', date: '19/06/2026 09:20:00' },
  { repairId: 'SC2606190001', name: 'Vệ sinh máy', price: 0, note: '', user: 'Thanh', date: '19/06/2026 09:20:00' },
  { repairId: 'SC2606190002', name: 'Ép kính', price: 0, note: '', user: 'Phong', date: '19/06/2026 12:00:00' }
];
let MOCK_CT_VT = [
  { repairId: 'SC2606190001', billCode: 'VT001', name: 'Pin KSC (Gold)', qty: 1, unitPrice: 220000, amount: 220000, ncc: 'Thắng', user: 'QLKT/Admin', date: '19/06/2026 09:20:00' },
  { repairId: 'SC2606190002', billCode: 'VT002', name: 'Kính + ron', qty: 1, unitPrice: 160000, amount: 160000, ncc: 'Nhà', user: 'QLKT/Admin', date: '19/06/2026 12:00:00' }
];

function mockApi(payload) {
  const action = payload.action;

  if (action === 'getMasters') {
    return Promise.resolve({ success: true, data: MOCK_MASTERS });
  }

  if (action === 'createRepair') {
    const d = payload.data || {};
    d.imei = String(d.imei || '').replace(/\D/g, '').slice(0, 6);
    d.phone = String(d.phone || '').replace(/\D/g, '').slice(0, 10);
    if (!/^\d{6}$/.test(d.imei)) return Promise.resolve({ success: false, message: 'IMEI phải nhập đúng 6 số.' });
    if (!/^0\d{9}$/.test(d.phone)) return Promise.resolve({ success: false, message: 'SĐT phải đủ 10 số và bắt đầu bằng 0.' });
    const id = 'SC' + Date.now().toString().slice(-10);
    const repair = Object.assign({
      repairId: id,
      date: new Date().toLocaleString('vi-VN'),
      status: '1. Đã tiếp nhận',
      repairService: '',
      materialName: '',
      materialCost: 0,
      laborCost: 0,
      totalCost: 0,
      actualRevenue: 0,
      profit: 0,
      ncc: '',
      paymentStatus: 'Chưa thanh toán',
      createdAt: new Date().toLocaleString('vi-VN'),
      updatedAt: new Date().toLocaleString('vi-VN')
    }, d);
    repair.repairId = id;
    MOCK_REPAIRS.unshift(repair);
    return Promise.resolve({ success: true, repairId: id, data: repair });
  }

  if (action === 'list') {
    return Promise.resolve({ success: true, data: MOCK_REPAIRS });
  }

  if (action === 'search') {
    const q = String(payload.q || '').trim();
    return Promise.resolve({ success: true, data: mockSearchRepairs(q) });
  }

  if (action === 'getDetail') {
    const item = MOCK_REPAIRS.find(function (x) { return x.repairId === payload.repairId; });
    return Promise.resolve({ success: true, data: item, logs: MOCK_LOGS, services: MOCK_CT_DV, materials: MOCK_CT_VT });
  }

  if (action === 'updateStatus' || action === 'quickStatus') {
    const item = MOCK_REPAIRS.find(function (x) { return x.repairId === payload.repairId; });
    const d = payload.data || {};
    if (item) {
      if (d.repairServices) {
        item.repairService = d.repairServices.join(', ');
        MOCK_CT_DV = MOCK_CT_DV.filter(function (x) { return x.repairId !== payload.repairId; });
        d.repairServices.forEach(function (name) {
          MOCK_CT_DV.push({ repairId: payload.repairId, name: name, price: 0, note: '', user: d.technician || item.technician || '', date: new Date().toLocaleString('vi-VN') });
        });
      }
      Object.assign(item, d, { updatedAt: new Date().toLocaleString('vi-VN') });
    }
    return Promise.resolve({ success: true });
  }

  if (action === 'updateCost') {
    const item = MOCK_REPAIRS.find(function (x) { return x.repairId === payload.repairId; });
    const d = payload.data || {};
    if (item) {
      const mats = d.materials || [];
      const materialTotal = mats.reduce(function (sum, x) { return sum + Number(x.amount || 0); }, 0);
      item.materialName = mats.map(function (x) { return x.name; }).join(', ');
      item.materialCost = materialTotal;
      item.laborCost = Number(d.laborCost || 0);
      item.totalCost = materialTotal + item.laborCost;
      item.actualRevenue = Number(d.actualRevenue || 0);
      item.profit = item.actualRevenue - item.totalCost;
      item.paymentStatus = d.paymentStatus || item.paymentStatus;
      item.updatedAt = new Date().toLocaleString('vi-VN');
      MOCK_CT_VT = MOCK_CT_VT.filter(function (x) { return x.repairId !== payload.repairId; });
      mats.forEach(function (x) {
        MOCK_CT_VT.push({ repairId: payload.repairId, billCode: x.billCode || '', name: x.name, qty: x.qty || 1, unitPrice: x.unitPrice || 0, amount: x.amount || 0, ncc: x.ncc || '', user: 'QLKT/Admin', date: item.updatedAt });
      });
    }
    return Promise.resolve({ success: true });
  }

  if (action === 'getDashboard') {
    return Promise.resolve({ success: true, data: { rows: MOCK_REPAIRS, ctServices: MOCK_CT_DV, ctMaterials: MOCK_CT_VT } });
  }

  return Promise.resolve({ success: false, message: 'Mock chưa hỗ trợ action ' + action });
}


function mockNormText(v) {
  return String(v || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ')
    .trim();
}

function mockOnlyDigits(v) {
  return String(v || '').replace(/\D/g, '');
}

function mockSearchScore(x, query, qDigits, isNumeric) {
  const repairId = mockNormText(x.repairId || '');
  const imei = mockOnlyDigits(x.imei || '');
  const phone = mockOnlyDigits(x.phone || '');
  const customer = mockNormText(x.customer || '');

  if (query && repairId === query) return 100;
  if (query.indexOf('sc') === 0 && repairId.indexOf(query) > -1) return 95;

  if (qDigits) {
    if (imei && imei === qDigits) return 100;
    if (phone && phone === qDigits) return 100;
    if (qDigits.length >= 6 && imei && imei.endsWith(qDigits)) return 92;
    if (qDigits.length >= 7 && phone && phone.endsWith(qDigits)) return 90;
    if (isNumeric) return 0;
  }

  if (query && customer) {
    if (customer === query) return 85;
    if (customer.startsWith(query)) return 78;
    const tokens = query.split(/\s+/).filter(Boolean);
    if (tokens.length && tokens.every(function (t) { return customer.indexOf(t) > -1; })) return 70;
    if (query.length >= 3 && customer.indexOf(query) > -1) return 60;
  }

  return 0;
}

function mockSearchRepairs(q) {
  const raw = String(q || '').trim();
  if (!raw) return [];
  const query = mockNormText(raw);
  const qDigits = mockOnlyDigits(raw);
  const isNumeric = qDigits.length >= 4 && qDigits.length === raw.replace(/\s/g, '').length;

  return MOCK_REPAIRS.map(function (x) {
    return { item: x, score: mockSearchScore(x, query, qDigits, isNumeric) };
  }).filter(function (x) {
    return x.score > 0;
  }).sort(function (a, b) {
    return b.score - a.score;
  }).slice(0, 50).map(function (x) { return x.item; });
}
