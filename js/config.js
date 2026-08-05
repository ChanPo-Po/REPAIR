const API_URL = 'https://script.google.com/macros/s/AKfycbyHAJ31ObeKGW8Xttu8KMpgrGuY3zSCTH66gKuY8qfLYuYYLepEZj0hnddsZon8h_X-8g/exec';
const DEMO_MODE = false;

// Không để mật khẩu thật ở frontend. Đăng nhập được xác thực ở Apps Script (action: login).
// Chỉ bật LOCAL_AUTH_FALLBACK khi test offline/demo.
const LOCAL_AUTH_FALLBACK = false;
const USERS = {};

const ROLE_LABELS = {
  tech: 'Kỹ thuật',
  store: 'QL cửa hàng',
  tech_manager: 'QL kỹ thuật',
  admin: 'Admin'
};

const MONEY_HIDDEN_ROLES = ['store', 'tech'];

function apiCall(payload, options) {
  payload = payload || {};
  if (DEMO_MODE || !API_URL || API_URL.includes('PASTE_')) {
    return mockApi(payload);
  }

  // Gắn session đăng nhập cho các API quản trị. Public form/tra cứu vẫn chạy không cần token.
  try {
    const user = typeof currentUser === 'function' ? currentUser() : JSON.parse(localStorage.getItem('repairUser') || 'null');
    if (user && user.token) {
      payload.authToken = user.token;
      payload.userRole = user.role || payload.userRole || '';
      payload.actor = user.name || user.username || payload.actor || '';
      if (payload.data && typeof payload.data === 'object') {
        payload.data.authToken = user.token;
        payload.data.userRole = user.role || payload.data.userRole || '';
        payload.data.actor = user.name || user.username || payload.data.actor || '';
      }
    }
  } catch (e) {}

  options = options || {};
  const timeoutMs = options.timeoutMs || 25000;
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(function () { controller.abort(); }, timeoutMs) : null;

  return fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    },
    signal: controller ? controller.signal : undefined
  }).then(function (res) {
    if (!res.ok) {
      throw new Error('API trả lỗi HTTP ' + res.status + '. Kiểm tra lại link Apps Script đã deploy chưa.');
    }
    return res.text();
  }).then(function (text) {
    try {
      const data = JSON.parse(text);
      if (data && data.success === false && typeof showToast === 'function') {
        showToast(data.message || 'Lỗi API', 'error');
      }
      return data;
    } catch (e) {
      const preview = String(text || '').slice(0, 140);
      throw new Error('API không trả JSON. Có thể Apps Script deploy sai quyền/link sai. Response: ' + preview);
    }
  }).catch(function (err) {
    if (err && err.name === 'AbortError') {
      err = new Error('API quá lâu không phản hồi sau ' + Math.round(timeoutMs / 1000) + ' giây. Kiểm tra mạng hoặc Apps Script.');
    }
    if (typeof showToast === 'function') {
      showToast(err.message || 'Lỗi API', 'error');
    }
    throw err;
  }).finally(function () {
    if (timer) clearTimeout(timer);
  });
}

const parseMoneyValue = function (value) {
  if (typeof value === 'number') return value;
  const raw = String(value == null ? '' : value).trim();
  if (!raw) return 0;

  // Chuẩn VN: 1.200.000đ / 390.000 / 10.000
  let cleaned = raw.replace(/đ|₫|\s/g, '');
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(cleaned)) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    cleaned = cleaned.replace(/,/g, '');
  }
  const num = Number(cleaned.replace(/[^\d.-]/g, ''));
  return Number.isFinite(num) ? num : 0;
};

const fmtMoney = function (value) {
  const num = parseMoneyValue(value);
  return num.toLocaleString('vi-VN') + 'đ';
};

// Không rút gọn 50tr/2.1tr nữa vì nhìn thiếu chuyên nghiệp.
const compactMoney = function (value) {
  return fmtMoney(value);
};

const statusClean = function (status) {
  return String(status || '').replace(/^\d+\.\s*/, '');
};

const dateOnly = function (value) {
  if (!value) return '';
  const s = String(value);
  if (s.includes('T')) {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d.toLocaleDateString('vi-VN');
  }
  return s.split(' ')[0] || s;
};

const dateTime = function (value) {
  if (!value) return '';
  const s = String(value);
  if (s.includes('T')) {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    }
  }
  return s;
};

const splitItems = function (text) {
  return String(text || '')
    .split(/[,;\n]+/)
    .map(function (x) { return x.trim(); })
    .filter(Boolean);
};


window.onerror = function (msg, url, line, col, error) {
  if (typeof showToast === 'function') showToast(String(msg || 'Lỗi xử lý dữ liệu'), 'error');
  if (error) console.error(error);
  return false;
};

window.addEventListener('unhandledrejection', function (e) {
  const msg = e && e.reason && e.reason.message ? e.reason.message : 'Lỗi xử lý dữ liệu';
  if (typeof showToast === 'function') showToast(msg, 'error');
  console.error(e.reason || e);
});
