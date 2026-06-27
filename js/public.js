let PUBLIC_MASTERS = {};

function esc(v) {
  return String(v || '').replace(/[&<>\"]/g, function (c) {
    return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c];
  });
}

function notify(msg, type) {
  if (typeof showToast === 'function') showToast(msg, type || 'success');
  else alert(msg);
}

function optionList(select, items, getValue) {
  if (!select) return;
  select.innerHTML = '';

  (items || []).forEach(function (item) {
    const value = getValue ? getValue(item) : item;
    if (!value) return;
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = value;
    select.appendChild(opt);
  });
}

function masterValue(x) {
  if (typeof x === 'string' || typeof x === 'number') return String(x);
  return x.name || x.ten || x.value || x['Tên dòng máy'] || x['Tên loại dịch vụ'] || x['Tên nhân viên'] || '';
}

function loadPublicMasters() {
  apiCall({ action: 'getMasters' }).then(function (res) {
    PUBLIC_MASTERS = res.data || {};

    optionList(
      document.getElementById('receiveProduct'),
      PUBLIC_MASTERS.dongMay || PUBLIC_MASTERS.dongmay || [],
      masterValue
    );

    optionList(
      document.getElementById('receiveServiceType'),
      PUBLIC_MASTERS.loaiDichVu || PUBLIC_MASTERS.loaidichvu || [],
      masterValue
    );

    const allStaff = (PUBLIC_MASTERS.nhanVien || []).filter(function (x) {
      return x && x.name && String(x.status || '').toLowerCase().indexOf('nghỉ') === -1;
    });

    let saleStaff = allStaff.filter(function (x) {
      const dep = String(x.department || '').toLowerCase();
      return dep.includes('sale') || dep.includes('bán') || dep.includes('kinh doanh') || dep.includes('kd') || dep === '';
    });

    if (!saleStaff.length) saleStaff = allStaff;

    const staffSelect = document.getElementById('receiveStaff');
    optionList(staffSelect, saleStaff, function (x) { return x.name; });

    if (staffSelect && !saleStaff.length) {
      staffSelect.innerHTML = '<option value="">Chưa có nhân viên trong DM_NHAN_VIEN</option>';
    }
  }).catch(function (err) {
    notify('Không tải được danh mục: ' + err.message, 'error');
  });
}

function setupTabs() {
  document.querySelectorAll('[data-public-tab]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('[data-public-tab]').forEach(function (x) { x.classList.remove('active'); });
      btn.classList.add('active');
      document.querySelectorAll('.public-tab').forEach(function (x) { x.classList.add('hidden'); });
      document.getElementById(btn.dataset.publicTab).classList.remove('hidden');
    });
  });
}

function formData(form) {
  const obj = {};
  new FormData(form).forEach(function (v, k) { obj[k] = v; });
  return obj;
}

function digitsOnly(v) {
  return String(v || '').replace(/\D/g, '');
}

function clearFieldErrors(form) {
  form.querySelectorAll('.input-error').forEach(function (el) { el.classList.remove('input-error'); });
  form.querySelectorAll('.field-error-text').forEach(function (el) { el.remove(); });
}

function setFieldError(form, name, message) {
  const el = form.querySelector('[name="' + name + '"]');
  if (!el) return;
  el.classList.add('input-error');
  const msg = document.createElement('small');
  msg.className = 'field-error-text';
  msg.textContent = message;
  el.insertAdjacentElement('afterend', msg);
}

function validateReceiveData(data, form) {
  clearFieldErrors(form);

  data.imei = digitsOnly(data.imei);
  data.phone = digitsOnly(data.phone);
  data.customer = String(data.customer || '').replace(/\s+/g, ' ').trim();
  data.receiveStatus = String(data.receiveStatus || '').trim();
  data.request = String(data.request || '').trim();
  data.receiveNote = String(data.receiveNote || '').trim();

  const errors = [];

  if (!/^\d{6}$/.test(data.imei)) {
    errors.push('IMEI phải nhập đúng 6 số.');
    setFieldError(form, 'imei', 'IMEI quy định nhập đúng 6 số.');
  }

  if (!/^0\d{9}$/.test(data.phone)) {
    errors.push('SĐT phải đủ 10 số và bắt đầu bằng 0.');
    setFieldError(form, 'phone', 'SĐT phải đủ 10 số và bắt đầu bằng 0.');
  }

  if (data.customer.length < 2) {
    errors.push('Tên khách quá ngắn.');
    setFieldError(form, 'customer', 'Nhập rõ tên khách hàng.');
  }

  if (data.receiveStatus.length < 5) {
    errors.push('Tình trạng khi nhận máy quá sơ sài.');
    setFieldError(form, 'receiveStatus', 'Ghi rõ tình trạng máy khi nhận.');
  }

  if (data.request.length < 3) {
    errors.push('Yêu cầu sửa chữa quá sơ sài.');
    setFieldError(form, 'request', 'Ghi rõ yêu cầu sửa chữa.');
  }

  return errors;
}

function setupReceiveInputRules() {
  const form = document.getElementById('receiveForm');
  if (!form) return;

  ['imei', 'phone'].forEach(function (name) {
    const el = form.querySelector('[name="' + name + '"]');
    if (!el) return;
    el.addEventListener('input', function () {
      el.value = digitsOnly(el.value).slice(0, name === 'imei' ? 6 : 10);
    });
  });
}

function setupReceive() {
  const form = document.getElementById('receiveForm');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const data = formData(form);
    const errors = validateReceiveData(data, form);

    if (errors.length) {
      alert(errors[0]);
      const firstError = form.querySelector('.input-error');
      if (firstError) firstError.focus();
      return;
    }

    data.estimate = Number(data.estimate || 0);

    apiCall({ action: 'createRepair', data: data }).then(function (res) {
      if (!res.success) {
        alert(res.message || 'Không lưu được phiếu');
        return;
      }

      const repairId = res.repairId;

      window.LAST_PRINT_RECEIPT = Object.assign({}, data, {
        repairId: repairId,
        date: new Date().toLocaleString('vi-VN')
      });

      alert('Đã lưu phiếu: ' + repairId);

      form.reset();
      loadPublicMasters();
    }).catch(function (err) {
      alert('Lỗi API: ' + err.message);
    });
  });
}

function setupPrintButton() {
  const btn = document.getElementById('btnPrint');
  if (!btn) return;

  btn.setAttribute('type', 'button');

  btn.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();

    if (!window.LAST_PRINT_RECEIPT) {
      alert('Chưa có phiếu để in. Lưu phiếu trước rồi bấm In phiếu nhận.');
      return;
    }

    printReceipt(window.LAST_PRINT_RECEIPT, 'receive');
  });
}

function publicSearch() {
  const q = document.getElementById('publicKeyword').value.trim();

  apiCall({ action: 'search', q: q }).then(function (res) {
    const rows = res.data || [];
    const body = document.getElementById('publicResults');

    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="9">Không tìm thấy phiếu.</td></tr>';
      return;
    }

    body.innerHTML = rows.map(function (r) {
      return '<tr>' +
        '<td><b>' + r.repairId + '</b></td>' +
        '<td>' + (r.product || '') + '</td>' +
        '<td>' + (r.customer || '') + '</td>' +
        '<td>' + (r.phone || '') + '</td>' +
        '<td class="service-cell">' + serviceText(r) + '</td>' +
        '<td><span class="status-pill ' + statusClass(r.status) + '">' + statusClean(r.status) + '</span></td>' +
        '<td>' + dateTime(r.appointment) + '</td>' +
        '<td>' + fmtMoney(r.estimate || r.actualRevenue || 0) + '</td>' +
        '<td><button class="ghost-btn" onclick="openPublicDetail(\'' + r.repairId + '\')">Xem</button></td>' +
      '</tr>';
    }).join('');
  });
}

function openPublicDetail(id) {
  apiCall({ action: 'getDetail', repairId: id }).then(function (res) {
    const r = res.data;
    if (!r) return notify('Không tìm thấy phiếu', 'error');
    r.services = res.services || r.services || [];
    showModal('<div class="modal-card">' + detailHtml(r, res.logs || [], false) + '</div>');
  });
}

function isSensitiveTimelineLogPublic(log) {
  const text = String((log.action || log['Hành động'] || '') + ' | ' + (log.content || log['Nội dung'] || '')).toLowerCase();
  return text.includes('chi phí') || text.includes('thực thu') || text.includes('lợi nhuận') || text.includes('vật tư') || text.includes('ncc') || text.includes('công thợ');
}

function timelineLogsPublic(logs) {
  return (logs || []).filter(function (log) {
    return !isSensitiveTimelineLogPublic(log);
  });
}

function detailHtml(r, logs, showMoney) {
  const service = serviceText(r) || 'Chưa cập nhật';
  return '<div class="detail-hero">' +
    '<div><h2>' + (r.product || '') + '</h2><p><b>' + r.repairId + '</b> · ' + (r.customer || '') + ' · ' + (r.phone || '') + '</p></div>' +
    '<span class="status-pill ' + statusClass(r.status) + '">' + statusClean(r.status) + '</span>' +
  '</div>' +
  '<div class="dashboard-grid-2">' +
    '<div class="panel"><h3>Thông tin tiếp nhận</h3><p>IMEI: ' + (r.imei || '') + '</p><p>Yêu cầu: ' + (r.request || '') + '</p><p><b>Dịch vụ sửa chữa:</b> ' + service + '</p><p>Hẹn trả: ' + dateTime(r.appointment) + '</p><p>Báo giá: ' + fmtMoney(r.estimate || 0) + '</p></div>' +
    '<div class="panel"><h3>Tình trạng</h3><p>FaceID: ' + (r.faceId || '') + '</p><p>Màn: ' + (r.screen || '') + '</p><p>Camera/Mic: ' + (r.cameraMic || '') + '</p><p>Loa: ' + (r.speaker || '') + '</p></div>' +
  '</div>' +
  '<div class="panel"><h3>Timeline</h3><div class="timeline">' +
    (timelineLogsPublic(logs).length ? timelineLogsPublic(logs).map(function (l) {
      return '<div class="timeline-row"><b>' + dateTime(l.time || l['Thời gian']) + '</b><div><b>' + esc(l.action || l['Hành động'] || '') + '</b><p>' + esc(l.content || l['Nội dung'] || '') + '</p></div></div>';
    }).join('') : '<p>Chưa có lịch sử.</p>') +
  '</div></div>' +
  '<div class="form-actions" style="margin-top:14px;"><button class="ghost-btn" onclick="closeModal()">Đóng</button></div>';
}

function serviceText(r) {
  const fromData = r.repairService || r.serviceRepair || r.serviceName || r.service || '';
  if (Array.isArray(r.services) && r.services.length) {
    return r.services.map(function (x) {
      return x.name || x.service || x['Tên dịch vụ'] || x;
    }).filter(Boolean).join(', ');
  }
  return String(fromData || '').trim();
}

function statusClass(status) {
  const s = String(status || '');
  if (s.includes('7.') || s.includes('8.')) return 'done';
  if (s.includes('6.') || s.includes('3.') || s.includes('4.')) return 'wait';
  if (s.includes('9.') || s.includes('10.') || s.includes('11.')) return 'danger';
  return '';
}

function showModal(html) {
  const modal = document.getElementById('modal');
  modal.innerHTML = html;
  modal.classList.add('show');
}

function closeModal() {
  document.getElementById('modal').classList.remove('show');
}

function receiptStatusCell(label, value) {
  const v = esc(value || 'Chưa test');
  const cls = String(value || '').toLowerCase().includes('lỗi') ? 'bad' : (String(value || '').toLowerCase().includes('không') ? 'warn' : 'ok');
  return '<div class="receipt-test ' + cls + '"><span>' + label + '</span><b>' + v + '</b></div>';
}

function buildReceiptHtml(r, type) {
  const title = type === 'return' ? 'PHIẾU TRẢ MÁY' : 'PHIẾU TIẾP NHẬN SỬA CHỮA';
  const dateText = r.date || new Date().toLocaleString('vi-VN');
  const estimate = fmtMoney(r.estimate || r.actualRevenue || 0);

  return '<section class="receipt-sheet">' +
    '<div class="receipt-top">' +
      '<div><div class="receipt-logo">P</div><h1>POPOPHONE</h1><p>Trung tâm tiếp nhận sửa chữa</p></div>' +
      '<div class="receipt-code"><span>Mã sửa chữa</span><b>' + esc(r.repairId || '') + '</b><small>' + esc(dateText) + '</small></div>' +
    '</div>' +
    '<h2>' + title + '</h2>' +
    '<div class="receipt-grid">' +
      '<div><span>Chi nhánh nhận</span><b>CN ' + esc(r.branch || '') + '</b></div>' +
      '<div><span>Nhân viên nhận</span><b>' + esc(r.staff || '') + '</b></div>' +
      '<div><span>Khách hàng</span><b>' + esc(r.customer || '') + '</b></div>' +
      '<div><span>Số điện thoại</span><b>' + esc(r.phone || '') + '</b></div>' +
      '<div><span>Dòng máy</span><b>' + esc(r.product || '') + '</b></div>' +
      '<div><span>IMEI / Serial</span><b>' + esc(r.imei || '') + '</b></div>' +
      '<div><span>Loại dịch vụ</span><b>' + esc(r.serviceType || '') + '</b></div>' +
      '<div><span>Hẹn trả</span><b>' + esc(dateTime(r.appointment || '') || 'Chưa hẹn') + '</b></div>' +
    '</div>' +
    '<div class="receipt-box"><span>Tình trạng khi nhận</span><p>' + esc(r.receiveStatus || '') + '</p></div>' +
    '<div class="receipt-box"><span>Yêu cầu sửa chữa</span><p>' + esc(r.request || '') + '</p></div>' +
    '<div class="receipt-box"><span>Ghi chú tiếp nhận</span><p>' + esc(r.receiveNote || 'Không có') + '</p></div>' +
    '<div class="receipt-tests">' +
      receiptStatusCell('FaceID', r.faceId) +
      receiptStatusCell('Màn hình', r.screen) +
      receiptStatusCell('Camera/Mic', r.cameraMic) +
      receiptStatusCell('Loa', r.speaker) +
    '</div>' +
    '<div class="receipt-price"><span>Giá dự kiến / Báo giá</span><b>' + estimate + '</b></div>' +
    '<ul class="receipt-note"><li>Phiếu này dùng để đối chiếu khi nhận/trả máy.</li><li>Báo giá có thể thay đổi sau khi kỹ thuật kiểm tra thực tế.</li><li>Khách vui lòng kiểm tra lại chức năng máy khi nhận lại.</li></ul>' +
    '<div class="receipt-sign"><div><b>Khách hàng</b><span>Ký, ghi rõ họ tên</span></div><div><b>Nhân viên tiếp nhận</b><span>Ký, ghi rõ họ tên</span></div></div>' +
  '</section>';
}

function printReceipt(r, type) {
  if (!r) {
    alert('Chưa có phiếu để in. Lưu phiếu trước rồi bấm In phiếu nhận.');
    return;
  }

  const printArea = document.getElementById('printArea');
  if (printArea) printArea.innerHTML = buildReceiptHtml(r, type || 'receive');

  alert('Đang mở phiếu in...');
  setTimeout(function () { window.print(); }, 150);
}

document.addEventListener('DOMContentLoaded', function () {
  setupTabs();
  setupReceiveInputRules();
  loadPublicMasters();
  setupReceive();
  setupPrintButton();
});
