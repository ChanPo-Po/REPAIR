const API_URL = 'https://script.google.com/macros/s/AKfycbyHAJ31ObeKGW8Xttu8KMpgrGuY3zSCTH66gKuY8qfLYuYYLepEZj0hnddsZon8h_X-8g/exec';
const EXPECTED_API_VERSION = '17.10';

// Không để mật khẩu thật ở frontend. Đăng nhập được xác thực ở Apps Script (action: login).
// Chỉ bật LOCAL_AUTH_FALLBACK khi test offline/demo.
const LOCAL_AUTH_FALLBACK = false;
const USERS = {};

const ROLE_LABELS = {
  tech: 'Kỹ thuật',
  store: 'QL cửa hàng',
  cskh: 'CSKH',
  tech_manager: 'QL kỹ thuật',
  department_head: 'Quản lý',
  admin: 'Admin'
};

const MONEY_HIDDEN_ROLES = ['tech','store','cskh'];

function apiCall(payload, options) {
  payload = payload || {};
  if (!API_URL || API_URL.includes('PASTE_')) {
    return Promise.reject(new Error('Chưa cấu hình URL Apps Script /exec trong js/config.js.'));
  }

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

  // Trên Netlify: gọi proxy cùng domain để tránh CORS/redirect từ Apps Script.
  // Khi chạy file/local preview: fallback gọi Apps Script trực tiếp.
  const isHttpPage = /^https?:$/i.test(window.location.protocol || '');
  const isNetlifyLike = isHttpPage && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
  const requestUrl = isNetlifyLike ? '/.netlify/functions/repair-api' : API_URL;

  return fetch(requestUrl, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    signal: controller ? controller.signal : undefined
  }).then(function (res) {
    return res.text().then(function (text) {
      if (!res.ok) {
        let msg = 'API HTTP ' + res.status;
        try {
          const e = JSON.parse(text);
          msg = e.message || msg;
        } catch (_) {}
        const err=new Error(msg);err.httpStatus=res.status;throw err;
      }
      return text;
    });
  }).then(function (text) {
    try {
      const data = JSON.parse(text);
      if (data && data.success === false && typeof showToast === 'function') {
        showToast(data.message || 'Lỗi API', 'error');
      }
      return data;
    } catch (e) {
      const preview = String(text || '').slice(0, 180);
      throw new Error('API không trả JSON. Response: ' + preview);
    }
  }).catch(function (err) {
    if (err && err.name === 'AbortError') {
      err = new Error('API quá lâu không phản hồi sau ' + Math.round(timeoutMs / 1000) + ' giây.');
    } else if (String(err && err.message || err).includes('Failed to fetch')) {
      err = new Error('Không kết nối được API. Bản này cần deploy cả thư mục netlify/functions để dùng proxy chống CORS.');
    }
    if (typeof showToast === 'function') showToast(err.message || 'Lỗi API', 'error');
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

function repairBranchLine(r){return (r.branch||'Chưa có chi nhánh')+' - '+(r.serviceType||'Chưa phân loại')+' - '+(Number(r.machineVisit)>0?'Sửa lần '+Number(r.machineVisit):'Chưa xác định lần sửa');}

// Short-lived page bundles are bound to the authenticated user and API version.
function readWarmBundle(scope,period){try{const u=currentUser(),v=JSON.parse(sessionStorage.getItem('repairWarm:'+scope)||'null');return v&&u&&v.token===u.token&&v.role===u.role&&v.version===EXPECTED_API_VERSION&&v.period===period&&Date.now()-v.at<1800000?v:null;}catch(e){return null;}}
function saveWarmBundle(scope,period,data){try{const u=currentUser();if(u&&u.token)sessionStorage.setItem('repairWarm:'+scope,JSON.stringify({token:u.token,role:u.role,version:EXPECTED_API_VERSION,period,at:Date.now(),data}));}catch(e){}}
function dropWarmBundles(){try{sessionStorage.removeItem('repairWarm:ops');sessionStorage.removeItem('repairWarm:admin');}catch(e){}}

function patchWarmBundles(patches){try{const u=currentUser();for(const scope of ['ops','admin']){const key='repairWarm:'+scope,v=JSON.parse(sessionStorage.getItem(key)||'null');if(!v||!u||v.token!==u.token||v.role!==u.role||v.version!==EXPECTED_API_VERSION)continue;const rows=scope==='ops'?v.data.snapshot.rows:v.data.data.dashboard.rows;patches.forEach(p=>{const i=rows.findIndex(r=>String(r.repairId)===String(p.id));if(p.deleted){if(i>=0)rows.splice(i,1);return;}if(i>=0){const row={...rows[i],...p.row};if(scope==='ops')['materialCost','laborCost','totalCost','actualRevenue','profit','ncc','billCode','paymentStatus'].forEach(k=>delete row[k]);rows[i]=row;}});sessionStorage.setItem(key,JSON.stringify(v));}}catch(e){}}
