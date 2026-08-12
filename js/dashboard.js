let USER = null;
let REPAIRS = [];
let MASTERS = {};
let DASH = {};
let CT_SERVICES = [];
let CT_MATERIALS = [];
let TECH_WORK = [];
let SENT_REPAIRS = [];
let ACTIVE_TAB = 'overview';
let CURRENT_OVERVIEW_ROWS = [];
let DATA_HEALTH = {};

function initDashboard() {
  applySavedTheme();
  USER = requireLogin();
  if (!USER) return;
  document.getElementById('userName').textContent = USER.name;
  document.getElementById('userRole').textContent = ROLE_LABELS[USER.role] || USER.role;
  setupNavByRole();
  initOverviewFilters();
  loadAll().then(function () {
    openTab(USER.home || 'overview');
  }).catch(function (err) {
    openTab(USER.home || 'overview');
    setOverviewDataStatus('Không tải được DATA: ' + (err.message || err), true);
  });
}

function toggleMobileMenu(force) {
  const shouldOpen = typeof force === 'boolean' ? force : !document.body.classList.contains('mobile-menu-open');
  document.body.classList.toggle('mobile-menu-open', shouldOpen);
}

window.addEventListener('resize', function () {
  if (window.innerWidth > 760) toggleMobileMenu(false);
});

function setupNavByRole() {
  const allowed = {
    tech: ['status', 'salaryAudit'],
    store: ['overview', 'repairs'],
    tech_manager: ['overview', 'repairs', 'status', 'cost', 'materials', 'commission', 'salaryAudit', 'sentRepairs', 'weeklyReport'],
    admin: ['overview', 'repairs', 'status', 'cost', 'materials', 'commission', 'salaryAudit', 'sentRepairs', 'weeklyReport', 'masters']
  }[USER.role] || [];

  document.querySelectorAll('#navMenu button').forEach(function (btn) {
    const tab = btn.dataset.tab;
    if (!allowed.includes(tab)) btn.remove();
    btn.addEventListener('click', function () { openTab(tab); toggleMobileMenu(false); });
  });
}

function openTab(tab) {
  ACTIVE_TAB = tab;
  document.querySelectorAll('.tab').forEach(function (x) { x.classList.remove('active'); });
  document.getElementById(tab).classList.add('active');
  document.querySelectorAll('#navMenu button').forEach(function (b) { b.classList.toggle('active', b.dataset.tab === tab); });
  const pageTitle = document.getElementById('pageTitle');
  if (pageTitle) {
    const activeNav = document.querySelector('#navMenu button[data-tab="' + tab + '"]');
    pageTitle.textContent = activeNav ? activeNav.textContent.trim() : 'POPOPHONE Repair';
  }
  const sub = document.getElementById('pageSubtitle');
  if (sub) sub.textContent = getTabSubtitle(tab);

  const overviewTopFilters = document.getElementById('overviewTopFilters');
  if (overviewTopFilters) overviewTopFilters.style.display = tab === 'overview' ? 'flex' : 'none';
  const overviewDataStatus = document.getElementById('overviewDataStatus');
  if (overviewDataStatus) overviewDataStatus.style.display = tab === 'overview' ? 'block' : 'none';

  if (tab === 'overview') renderOverview();
  if (tab === 'repairs') renderRepairTable();
  if (tab === 'status') renderStatusList();
  if (tab === 'cost') renderCostTable();
  if (tab === 'materials') renderMaterialsFull();
  if (tab === 'commission') initCommissionTab();
  if (tab === 'salaryAudit') initSalaryAuditTab();
  if (tab === 'sentRepairs') initSentRepairsTab();
  if (tab === 'weeklyReport') initWeeklyReport();
  if (tab === 'masters') renderMasters();
}

function loadAll() {
  setOverviewDataStatus('Đang tải dữ liệu DATA...');
  return Promise.allSettled([
    apiCall({ action: 'getMasters' }),
    apiCall({ action: 'list' }, { timeoutMs: 45000 }),
    apiCall({ action: 'getDashboard' }, { timeoutMs: 45000 })
  ]).then(function (all) {
    const masterRes = all[0].status === 'fulfilled' ? all[0].value : null;
    const listRes = all[1].status === 'fulfilled' ? all[1].value : null;
    const dashRes = all[2].status === 'fulfilled' ? all[2].value : null;
    const errors = [];

    if (!masterRes || masterRes.success === false) errors.push((masterRes && masterRes.message) || (all[0].reason && all[0].reason.message) || 'Lỗi danh mục');
    if (!listRes || listRes.success === false) errors.push((listRes && listRes.message) || (all[1].reason && all[1].reason.message) || 'Lỗi danh sách DATA');
    if (!dashRes || dashRes.success === false) errors.push((dashRes && dashRes.message) || (all[2].reason && all[2].reason.message) || 'Lỗi dashboard API');

    MASTERS = masterRes && masterRes.success !== false ? (masterRes.data || {}) : {};
    DASH = dashRes && dashRes.success !== false ? (dashRes.data || {}) : {};
    DATA_HEALTH = DASH.dataHealth || {};

    const listRows = listRes && listRes.success !== false && Array.isArray(listRes.data) ? listRes.data : [];
    const dashboardRows = Array.isArray(DASH.rows) ? DASH.rows : [];
    // Nếu action list bị lỗi/rỗng nhưng getDashboard vẫn có rows thì không để toàn bộ giao diện trắng.
    REPAIRS = listRows.length ? listRows : dashboardRows;
    if (!Array.isArray(REPAIRS)) REPAIRS = [];

    CT_SERVICES = DASH.ctServices || DASH.services || [];
    CT_MATERIALS = DASH.ctMaterials || DASH.materialsCt || [];
    TECH_WORK = DASH.techWork || DASH.thoNhapCong || [];
    SENT_REPAIRS = DASH.sentRepairs || DASH.mayGuiXuLy || [];
    hydrateFilters();

    if (REPAIRS.length) {
      const sourceNote = DATA_HEALTH.sheetName ? ' từ sheet ' + DATA_HEALTH.sheetName : '';
      setOverviewDataStatus('Đã tải ' + REPAIRS.length + ' phiếu' + sourceNote + '.');
      if (errors.length) showToast('Đã tải dữ liệu bằng nguồn dự phòng. ' + errors.join(' | '), 'warn');
      return;
    }

    const healthNote = DATA_HEALTH.lastRow ? ' DATA có ' + DATA_HEALTH.lastRow + ' dòng nhưng API đọc được 0 phiếu.' : '';
    const message = (errors.length ? errors.join(' | ') : 'API trả về 0 phiếu sửa chữa.') + healthNote;
    setOverviewDataStatus(message, true);
    if (errors.length) throw new Error(message);
  });
}

function refreshAll() {
  loadAll().then(function () {
    openTab(ACTIVE_TAB);
    showToast('Đã làm mới ' + REPAIRS.length + ' phiếu');
  }).catch(function (err) {
    showToast(err.message || 'Không tải được dữ liệu', 'error');
  });
}

function hydrateFilters() {
  fillSelect('repairStatus', MASTERS.trangThai || []);
  fillSelect('statusFilter', MASTERS.trangThai || []);
  fillSelect('costStatus', MASTERS.trangThai || []);
  fillSelect('repairTech', (MASTERS.kyThuat || []).map(x => x.name));
  fillSelect('statusTech', (MASTERS.kyThuat || []).map(x => x.name));
  fillSelect('commissionTech', (MASTERS.kyThuat || []).map(x => x.name));
  fillSelect('salaryTech', (MASTERS.kyThuat || []).map(x => x.name));
  fillSelect('techWorkTech', (MASTERS.kyThuat || []).map(x => x.name));
  fillSelect('techWorkModel', MASTERS.dongMay || []);
  fillSelect('techWorkService', (MASTERS.dichVu || []).map(x => x.name));
  fillSelect('sentModel', MASTERS.dongMay || []);
  fillSelect('sentTech', (MASTERS.kyThuat || []).map(x => x.name));
  fillSelect('sentRepairTechFilter', (MASTERS.kyThuat || []).map(x => x.name));
  fillSelect('sentProcess1', (MASTERS.dichVu || []).map(x => x.name));
  fillSelect('sentProcess2', (MASTERS.dichVu || []).map(x => x.name));
  fillSelect('materialGroup', [...new Set((MASTERS.vatTu || []).map(x => x.group).filter(Boolean))]);
}

function fillSelect(id, items) {
  const el = document.getElementById(id);
  if (!el) return;
  const first = el.options[0]?.outerHTML || '<option value="">Tất cả</option>';
  el.innerHTML = first + items.map(x => '<option value="' + x + '">' + x + '</option>').join('');
}

function formatInputDate_(date) {
  const d = date || new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

function parseInputDate_(value, endOfDay) {
  if (!value) return null;
  const parts = String(value).split('-').map(Number);
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return null;
  return new Date(parts[0], parts[1] - 1, parts[2], endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
}

function initOverviewFilters() {
  const now = new Date();
  const modeEl = document.getElementById('overviewMode');
  const monthEl = document.getElementById('overviewMonth');
  const fromEl = document.getElementById('overviewFrom');
  const toEl = document.getElementById('overviewTo');
  if (modeEl && !modeEl.value) modeEl.value = 'month';
  if (monthEl && !monthEl.value) monthEl.value = formatInputDate_(now).slice(0, 7);
  if (fromEl && !fromEl.value) fromEl.value = formatInputDate_(new Date(now.getFullYear(), now.getMonth(), 1));
  if (toEl && !toEl.value) toEl.value = formatInputDate_(now);
  changeOverviewMode(false);
}

function setOverviewDataStatus(message, isError) {
  const el = document.getElementById('overviewDataStatus');
  if (!el) return;
  el.textContent = message || '';
  el.classList.toggle('error', !!isError);
}

function globalFilterState_() {
  const mode = document.getElementById('overviewMode')?.value || 'month';
  const monthValue = document.getElementById('overviewMonth')?.value || '';
  const branch = document.getElementById('globalBranch')?.value || '';
  let from = null;
  let to = null;
  let label = 'toàn bộ thời gian';

  if (mode === 'range') {
    from = parseInputDate_(document.getElementById('overviewFrom')?.value || '', false);
    to = parseInputDate_(document.getElementById('overviewTo')?.value || '', true);
    const f = from ? formatInputDate_(from).split('-').reverse().join('/') : 'đầu kỳ';
    const t = to ? formatInputDate_(to).split('-').reverse().join('/') : 'hiện tại';
    label = 'từ ' + f + ' đến ' + t;
  } else {
    const parts = monthValue.split('-').map(Number);
    if (parts[0] && parts[1]) {
      from = new Date(parts[0], parts[1] - 1, 1, 0, 0, 0, 0);
      to = new Date(parts[0], parts[1], 0, 23, 59, 59, 999);
      label = 'tháng ' + String(parts[1]).padStart(2, '0') + '/' + parts[0];
    }
  }

  return { mode: mode, monthValue: monthValue, branch: branch, from: from, to: to, label: label };
}

function globalFilterRows_(rows, dateGetter, branchGetter) {
  const state = globalFilterState_();
  const getDate = typeof dateGetter === 'function' ? dateGetter : function (r) { return r.date || r.createdAt; };
  const getBranch = typeof branchGetter === 'function' ? branchGetter : function (r) { return r.branch; };

  return (Array.isArray(rows) ? rows : []).filter(function (r) {
    if (state.branch) {
      const rowBranch = String(getBranch(r) || '').trim();
      // Dữ liệu không có trường chi nhánh vẫn được giữ, tránh làm trắng các bảng phụ.
      if (rowBranch && rowBranch !== String(state.branch).trim()) return false;
    }

    const rawDate = getDate(r);
    const d = parseAnyDate(rawDate);
    if (!d) return false;
    if (state.from && d < state.from) return false;
    if (state.to && d > state.to) return false;
    return true;
  });
}

function branchFiltered() {
  return globalFilterRows_(REPAIRS, function (r) { return r.date || r.createdAt; }, function (r) { return r.branch; });
}

function rerenderActiveTab_() {
  if (!ACTIVE_TAB) return;
  openTab(ACTIVE_TAB);
}

function applyGlobalFilters() {
  // Bộ lọc chi nhánh/thời gian chỉ dùng cho menu Tổng quan.
  if (ACTIVE_TAB === 'overview') renderOverview();
}

function changeOverviewMode(shouldRender) {
  const mode = document.getElementById('overviewMode')?.value || 'month';
  const monthWrap = document.getElementById('overviewMonthWrap');
  const rangeWrap = document.getElementById('overviewRangeWrap');
  if (monthWrap) monthWrap.style.display = mode === 'month' ? 'flex' : 'none';
  if (rangeWrap) rangeWrap.style.display = mode === 'range' ? 'flex' : 'none';
  if (shouldRender !== false && ACTIVE_TAB === 'overview') renderOverview();
}

function resetOverviewFilters() {
  const now = new Date();
  const mode = document.getElementById('overviewMode');
  const branch = document.getElementById('globalBranch');
  const month = document.getElementById('overviewMonth');
  const from = document.getElementById('overviewFrom');
  const to = document.getElementById('overviewTo');
  if (mode) mode.value = 'month';
  if (branch) branch.value = '';
  if (month) month.value = formatInputDate_(now).slice(0, 7);
  if (from) from.value = formatInputDate_(new Date(now.getFullYear(), now.getMonth(), 1));
  if (to) to.value = formatInputDate_(now);
  changeOverviewMode(false);
  if (ACTIVE_TAB === 'overview') renderOverview();
}

function latestRepairDate_(rows) {
  let latest = null;
  (rows || []).forEach(function (r) {
    const d = parseAnyDate(r.date || r.createdAt);
    if (d && (!latest || d > latest)) latest = d;
  });
  return latest;
}

function overviewFiltered() {
  const rows = branchFiltered().slice();
  const state = globalFilterState_();
  const referenceDate = state.to || state.from || latestRepairDate_(rows) || new Date();
  return { rows: rows, mode: state.mode, label: state.label, referenceDate: referenceDate };
}

function renderOverview() {
  const filter = overviewFiltered();
  const data = filter.rows;
  CURRENT_OVERVIEW_ROWS = data;
  const d = buildLocalDashboard(data, { referenceDate: filter.referenceDate, periodLabel: filter.label, mode: filter.mode });
  const isMoneyHidden = MONEY_HIDDEN_ROLES.includes(USER.role);
  updateExecutiveDashboard(d, isMoneyHidden);

  const opsCards = [
    ['Điểm vận hành', d.healthScore + '/100', d.healthScore >= 85 ? 'success' : (d.healthScore >= 70 ? 'warn' : 'danger')],
    ['Tổng đơn trong kỳ', d.periodOrders, ''],
    ['Đang xử lý', d.inProgress, ''],
    ['Đã sửa xong', d.completed, ''],
    ['Đã giao khách', d.returned, ''],
    ['Quá hẹn', d.overdue, 'danger'],
    ['Chờ linh kiện', d.waitingPart, 'warn']
  ];
  const kpiEl = document.getElementById('kpiGrid');
  if (kpiEl) kpiEl.innerHTML = opsCards.map(function (c) {
    return '<div class="kpi-card ' + c[2] + '"><span>' + c[0] + '</span><b>' + c[1] + '</b></div>';
  }).join('');

  const bizCards = [
    ['Phạm vi đang xem', d.periodLabel, ''],
    ['Tổng phiếu', d.periodOrders, ''],
    ['Doanh thu trong kỳ', fmtMoney(d.periodRevenue), ''],
    ['Đã giao khách', d.returned, ''],
    ['Đang xử lý', d.inProgress, ''],
    ['Ticket trung bình', fmtMoney(d.avgTicket), '']
  ];

  // Chỉ Admin mới thấy chi phí/lợi nhuận ở Tổng quan.
  if (USER.role === 'admin') {
    bizCards.push(
      ['Chi phí trong kỳ', fmtMoney(d.periodCost), 'warn'],
      ['Lợi nhuận trong kỳ', fmtMoney(d.periodProfit), 'success']
    );
  }

  const bizEl = document.getElementById('businessGrid');
  if (bizEl) bizEl.innerHTML = bizCards.map(function (c) {
    return '<div class="kpi-card ' + c[2] + '"><span>' + c[0] + '</span><b>' + c[1] + '</b></div>';
  }).join('');

  renderWeekChart(d.weekly, isMoneyHidden);
  renderServiceTypeDist(d.serviceTypes);
  renderRank('topServices', d.topServices, 'đơn');
  renderRank('topModels', d.topModels, 'đơn');
  renderRank('techKpi', d.techKpi.map(x => ({ name: x.name, count: x.done + ' đơn · QH ' + x.overdue })), '');
  renderMatrix();
  renderMaterialsNeed();
  renderOpsAlerts(d);
}

function renderWeekChart(weekly, hideMoney) {
  const rows = (weekly || []).map(function (w) {
    return '<tr><td><b>Tuần ' + w.week + '</b></td><td>' + w.count + '</td><td>' + fmtMoney(w.revenue) + '</td>' + (hideMoney ? '' : '<td>' + fmtMoney(w.profit) + '</td>') + '</tr>';
  }).join('');
  document.getElementById('weekChart').innerHTML = '<table><thead><tr><th>Tuần</th><th>Đơn</th><th>Doanh thu</th>' + (hideMoney ? '' : '<th>Lợi nhuận</th>') + '</tr></thead><tbody>' + rows + '</tbody></table>';
}

function renderServiceTypeDist(items) {
  const total = (items || []).reduce((s, x) => s + x.count, 0) || 1;
  document.getElementById('serviceTypeDist').innerHTML = (items || []).map(function (x) {
    const pct = Math.round(x.count * 100 / total);
    return '<div class="type-row"><b>' + x.name + '</b><span>' + x.count + ' · ' + pct + '%</span><div class="type-bar"><i style="width:' + pct + '%"></i></div></div>';
  }).join('') || '<p>Chưa có dữ liệu.</p>';
}

function renderRank(id, items, suffix) {
  document.getElementById(id).innerHTML = (items || []).slice(0, 8).map(function (x, i) {
    return '<div class="rank-row"><b>' + (i + 1) + '. ' + x.name + '</b><span>' + x.count + (suffix ? ' ' + suffix : '') + '</span></div>';
  }).join('') || '<p>Chưa có dữ liệu.</p>';
}

function renderMatrix() {
  const sourceRows = ACTIVE_TAB === 'overview' ? branchFiltered() : REPAIRS;
  const d = buildLocalDashboard(sourceRows);
  let matrix = d.matrix || { models: [], services: [], values: {} };
  const modelQ = (document.getElementById('matrixModelFilter')?.value || '').toLowerCase();
  const serviceQ = (document.getElementById('matrixServiceFilter')?.value || '').toLowerCase();
  const limit = Number(document.getElementById('matrixLimit')?.value || 20);

  // V10.12: đảo ma trận đúng nghiệp vụ: CỘT = DÒNG MÁY, DÒNG = DỊCH VỤ.
  const models = matrix.models.filter(x => x.toLowerCase().includes(modelQ)).slice(0, limit);
  const services = matrix.services.filter(x => x.toLowerCase().includes(serviceQ));

  let html = '<table class="matrix-table matrix-transposed"><thead><tr><th>Dịch vụ</th>' + models.map(m => '<th>' + esc(m) + '</th>').join('') + '</tr></thead><tbody>';
  html += services.map(function (s) {
    return '<tr><td><b>' + esc(s) + '</b></td>' + models.map(function (m) {
      const v = matrix.values[m + '|' + s] || 0;
      const heat = v === 0 ? 0 : v < 3 ? 1 : v < 6 ? 2 : v < 10 ? 3 : 4;
      return '<td class="heat-' + heat + '">' + (v || '') + '</td>';
    }).join('') + '</tr>';
  }).join('');
  html += '</tbody></table>';
  document.getElementById('serviceMatrix').innerHTML = html;
}

function renderMaterialsNeed() {
  const sourceRows = ACTIVE_TAB === 'overview' ? branchFiltered() : REPAIRS;
  const d = buildLocalDashboard(sourceRows);
  const q = (document.getElementById('materialSearch')?.value || '').toLowerCase();
  const g = document.getElementById('materialGroup')?.value || '';
  const showAll = document.getElementById('showAllMaterials')?.checked;
  let rows = d.materials || [];

  if (showAll) {
    const usedMap = Object.fromEntries(rows.map(x => [normalizeKey(x.name), x]));
    rows = (MASTERS.vatTu || []).map(function (v) {
      const name = v.name || v['Tên vật tư'] || '';
      return usedMap[normalizeKey(name)] || { name: name, group: v.group || v['Nhóm vật tư'] || '', repairCount: 0, totalQty: 0, suggest: 0 };
    });
  }

  rows = rows.filter(x => (!q || normalizeKey(x.name).includes(normalizeKey(q))) && (!g || x.group === g));
  document.getElementById('materialsNeed').innerHTML = '<table><thead><tr><th>Vật tư</th><th>Nhóm</th><th>Số phiếu dùng</th><th>Tổng SL</th><th>Đề xuất nhập</th></tr></thead><tbody>' +
    rows.map(x => '<tr><td><b>' + esc(x.name) + '</b></td><td>' + esc(x.group || '') + '</td><td>' + (x.repairCount || 0) + '</td><td>' + (x.totalQty || 0) + '</td><td>' + (x.suggest || 0) + '</td></tr>').join('') +
    '</tbody></table>';
}

function renderMaterialSupplierSummary(targetPrefix) {
  const sourceRows = ACTIVE_TAB === 'overview' ? branchFiltered() : REPAIRS;
  const d = buildLocalDashboard(sourceRows);
  const rows = d.supplierStats || [];
  const totalCost = rows.reduce(function (sum, x) { return sum + Number(x.totalCost || 0); }, 0);
  const totalQty = rows.reduce(function (sum, x) { return sum + Number(x.totalQty || 0); }, 0);
  const topSupplier = rows[0] || null;
  const topMaterial = getTopMaterialFromSuppliers(rows);

  const kpiId = targetPrefix ? targetPrefix + 'SupplierKpis' : 'supplierKpis';
  const tableId = targetPrefix ? targetPrefix + 'SupplierSummary' : 'supplierSummary';
  const detailId = targetPrefix ? targetPrefix + 'SupplierMaterials' : 'supplierMaterials';

  const kpiEl = document.getElementById(kpiId);
  if (kpiEl) {
    kpiEl.innerHTML = [
      { label: 'Tổng NCC sử dụng', value: rows.length },
      { label: 'Tổng chi vật tư', value: fmtMoney(totalCost) },
      { label: 'NCC lớn nhất', value: topSupplier ? topSupplier.ncc : 'Chưa có' },
      { label: 'Vật tư dùng nhiều nhất', value: topMaterial ? topMaterial.name + ' (' + topMaterial.qty + ')' : 'Chưa có' }
    ].map(function (x) {
      return '<div class="kpi-card mini"><span>' + esc(x.label) + '</span><b>' + esc(x.value) + '</b></div>';
    }).join('');
  }

  const tableEl = document.getElementById(tableId);
  if (tableEl) {
    tableEl.innerHTML = '<table><thead><tr><th>NCC</th><th>Số phiếu</th><th>Tổng SL</th><th>Tổng tiền vật tư</th><th>Tỷ trọng</th><th>Top vật tư</th></tr></thead><tbody>' +
      (rows.length ? rows.map(function (x) {
        const top = topMaterialOfSupplier(x);
        const pct = totalCost ? Math.round(Number(x.totalCost || 0) * 1000 / totalCost) / 10 : 0;
        return '<tr>' +
          '<td><b>' + esc(x.ncc) + '</b></td>' +
          '<td>' + (x.repairCount || 0) + '</td>' +
          '<td>' + (x.totalQty || 0) + '</td>' +
          '<td>' + fmtMoney(x.totalCost || 0) + '</td>' +
          '<td>' + pct + '%</td>' +
          '<td>' + (top ? esc(top.name) + ' · ' + top.qty : '') + '</td>' +
        '</tr>';
      }).join('') : '<tr><td colspan="6">Chưa có dữ liệu NCC.</td></tr>') +
      '</tbody></table>';
  }

  const detailEl = document.getElementById(detailId);
  if (detailEl) {
    detailEl.innerHTML = rows.slice(0, 8).map(function (x) {
      const mats = Object.values(x.materials || {}).sort(function (a, b) { return b.qty - a.qty; }).slice(0, 8);
      return '<div class="supplier-card"><h4>' + esc(x.ncc) + '</h4>' +
        '<p>' + (x.repairCount || 0) + ' phiếu · ' + (x.totalQty || 0) + ' SL · <b>' + fmtMoney(x.totalCost || 0) + '</b></p>' +
        '<div class="supplier-materials">' + (mats.length ? mats.map(function (m) { return '<span>' + esc(m.name) + ' <b>' + m.qty + '</b></span>'; }).join('') : '<small>Chưa có vật tư.</small>') + '</div>' +
      '</div>';
    }).join('') || '<p>Chưa có dữ liệu NCC.</p>';
  }
}

function topMaterialOfSupplier(supplier) {
  return Object.values((supplier && supplier.materials) || {}).sort(function (a, b) { return b.qty - a.qty; })[0] || null;
}

function getTopMaterialFromSuppliers(rows) {
  const map = {};
  (rows || []).forEach(function (s) {
    Object.values(s.materials || {}).forEach(function (m) {
      const key = normalizeKey(m.name);
      if (!map[key]) map[key] = { name: m.name, qty: 0 };
      map[key].qty += Number(m.qty || 0);
    });
  });
  return Object.values(map).sort(function (a, b) { return b.qty - a.qty; })[0] || null;
}

function renderOpsAlerts(d) {
  const items = [
    { name: 'Máy quá hẹn', count: d.overdue },
    { name: 'Chờ linh kiện', count: d.waitingPart },
    { name: 'Bảo hành lại', count: d.warrantyBack },
    { name: 'Máy ngâm > 3 ngày', count: d.stuck }
  ];
  renderRank('opsAlerts', items, 'máy');
}

function initWeeklyReport() {
  renderWeeklyReport();
}

function getWeeklyReportRows() {
  const weekVal = document.getElementById('reportWeek')?.value || '';
  return REPAIRS.filter(function (r) {
    const d = parseAnyDate(r.date || r.createdAt);
    const rw = Number(r.week || (d ? Math.ceil(d.getDate() / 7) : 0));
    if (weekVal && rw !== Number(weekVal)) return false;
    return true;
  });
}

function reportPeriodText() {
  const weekVal = document.getElementById('reportWeek')?.value || '';
  return weekVal ? ('Tuần ' + weekVal + ' · toàn bộ dữ liệu') : 'Toàn bộ dữ liệu';
}

function reportPercent(value, total) {
  if (!total) return 0;
  return Math.round((Number(value || 0) / Number(total || 1)) * 1000) / 10;
}

function reportCompletionRate(d, total) {
  const completedTotal = Number(d.completed || 0) + Number(d.returned || 0);
  return reportPercent(completedTotal, total || 0);
}

function reportBar(width, tone) {
  const w = Math.max(4, Math.min(100, Number(width || 0)));
  return '<span class="exec-bar"><i class="' + (tone || '') + '" style="width:' + w + '%"></i></span>';
}

function reportKpiCard(icon, label, value, note, tone) {
  return '<article class="exec-kpi ' + (tone || '') + '">' +
    '<div class="exec-kpi-icon">' + icon + '</div>' +
    '<span>' + esc(label) + '</span>' +
    '<b>' + esc(value) + '</b>' +
    '<em>' + esc(note || '') + '</em>' +
  '</article>';
}

function reportBullet(text, tone) {
  return '<li class="' + (tone || '') + '"><span></span>' + esc(text) + '</li>';
}

function topListCards(items, total, unit, limit) {
  const list = (items || []).slice(0, limit || 5);
  if (!list.length) return '<div class="exec-empty">Chưa có dữ liệu đủ để phân tích.</div>';
  const max = Math.max.apply(null, list.map(x => Number(x.count || x.totalQty || 0))) || 1;
  return list.map(function (x, i) {
    const count = Number(x.count || x.totalQty || x.repairCount || 0);
    const pct = total ? reportPercent(count, total) : Math.round(count / max * 100);
    return '<div class="exec-rank-row">' +
      '<div class="exec-rank-no">' + (i + 1) + '</div>' +
      '<div class="exec-rank-main"><b>' + esc(x.name || x.ncc || '') + '</b>' + reportBar(Math.round(count / max * 100), i === 0 ? 'gold' : '') + '</div>' +
      '<div class="exec-rank-value"><b>' + count + '</b><span>' + esc(unit || 'phiếu') + (total ? ' · ' + pct + '%' : '') + '</span></div>' +
    '</div>';
  }).join('');
}

function reportBacklogItems(rows, limit) {
  return (rows || []).filter(function (r) {
    const s = String(r.status || '');
    return r.overdue === 'Có' || s.startsWith('6.') || s.startsWith('10.') || (parseAnyDate(r.date || r.createdAt) && daysBetween(parseAnyDate(r.date || r.createdAt), new Date()) > 3 && !s.startsWith('8.'));
  }).slice(0, limit || 6);
}

function execReportInsights(d, rows, hideMoney) {
  const completedTotal = Number(d.completed || 0) + Number(d.returned || 0);
  const topService = (d.topServices || [])[0];
  const topModel = (d.topModels || [])[0];
  const topTech = (d.techKpi || []).slice().sort(function(a,b){ return Number(b.done || 0) - Number(a.done || 0); })[0];
  const topMat = (d.materials || [])[0];
  const insights = [];
  insights.push('Tuần này ghi nhận ' + rows.length + ' máy, đã hoàn thành/giao ' + completedTotal + ' máy, tỷ lệ hoàn thành ' + reportCompletionRate(d, rows.length) + '%.');
  if (!hideMoney) insights.push('Doanh thu ghi nhận ' + fmtMoney(d.revenue || 0) + ', lợi nhuận ' + fmtMoney(d.profit || 0) + '.');
  if (topService) insights.push('Dịch vụ nổi bật nhất là ' + topService.name + ' với ' + topService.count + ' phiếu.');
  if (topModel) insights.push('Dòng máy phát sinh nhiều nhất là ' + topModel.name + ' với ' + topModel.count + ' phiếu.');
  if (topTech) insights.push('Kỹ thuật xử lý nhiều nhất: ' + topTech.name + ' (' + topTech.done + ' máy hoàn thành).');
  if (topMat) insights.push('Vật tư cần ưu tiên kiểm tra tồn: ' + topMat.name + ' (đã dùng ' + (topMat.totalQty || topMat.repairCount || 0) + ').');
  if (d.overdue) insights.push('Có ' + d.overdue + ' máy quá hẹn cần xử lý trước khi sang kỳ tiếp theo.');
  if (d.waitingPart) insights.push('Có ' + d.waitingPart + ' máy đang chờ linh kiện, cần rà tồn kho và đơn đặt hàng.');
  return insights;
}

function executiveCoverPage(periodText, reportDate) {
  return '<section class="exec-page exec-cover">' +
    '<div class="exec-cover-brand"><div class="exec-logo-mark">P</div><div><b>POPOPHONE</b><span>Repair Operation System</span></div></div>' +
    '<div class="exec-cover-title"><span>EXECUTIVE REPORT</span><h1>BÁO CÁO<br>ĐIỀU HÀNH</h1><p>' + esc(periodText) + '</p></div>' +
    '<div class="exec-cover-meta"><div><span>Ngày xuất</span><b>' + esc(reportDate) + '</b></div><div><span>Người lập</span><b>Quản lý kỹ thuật</b></div></div>' +
    '<div class="exec-cover-footer">POPOPHONE REPAIR · Báo cáo nội bộ</div>' +
  '</section>';
}

function executiveBusinessPage(d, rows, hideMoney) {
  const completedTotal = Number(d.completed || 0) + Number(d.returned || 0);
  const completion = reportCompletionRate(d, rows.length);
  const serviceTotal = (d.topServices || []).reduce((sum, x) => sum + Number(x.count || 0), 0) || rows.length;
  const insights = execReportInsights(d, rows, hideMoney).slice(0, 3);
  return '<section class="exec-page">' +
    '<div class="exec-page-head"><div class="exec-number">01</div><div><h2>Tuần này kinh doanh thế nào?</h2><p>Tổng quan hiệu quả sửa chữa trong kỳ báo cáo.</p></div><div class="exec-mini-brand">POPOPHONE</div></div>' +
    '<div class="exec-kpi-grid">' +
      reportKpiCard('📱', 'Máy nhận', rows.length, 'Tổng phiếu trong kỳ', '') +
      reportKpiCard('✅', 'Hoàn thành / giao', completedTotal, completion + '% hoàn tất', 'ok') +
      reportKpiCard('🛠️', 'Đang xử lý', d.inProgress || 0, 'Cần theo dõi tiến độ', 'warn') +
      reportKpiCard('⏰', 'Quá hẹn', d.overdue || 0, d.overdue ? 'Cần xử lý ngay' : 'Không có cảnh báo', d.overdue ? 'danger' : 'ok') +
      (hideMoney ? reportKpiCard('🔒', 'Doanh thu', 'Đã ẩn', 'Theo phân quyền', '') : reportKpiCard('💰', 'Doanh thu', fmtMoney(d.revenue || 0), 'Ghi nhận trong kỳ', 'money')) +
      (hideMoney ? reportKpiCard('🔒', 'Lợi nhuận', 'Đã ẩn', 'Theo phân quyền', '') : reportKpiCard('📈', 'Lợi nhuận', fmtMoney(d.profit || 0), 'Sau chi phí', 'money')) +
    '</div>' +
    '<div class="exec-two-col">' +
      '<article class="exec-panel"><h3>Cơ cấu dịch vụ chủ lực</h3>' + topListCards(d.topServices, serviceTotal, 'phiếu', 5) + '</article>' +
      '<article class="exec-panel exec-center"><h3>Tỷ lệ hoàn thành</h3><div class="exec-donut" style="--p:' + completion + '"><b>' + completion + '%</b><span>' + completedTotal + '/' + rows.length + ' máy</span></div><p class="exec-muted">Tỷ lệ tính trên tổng máy đã hoàn thành hoặc đã bàn giao trong kỳ.</p></article>' +
    '</div>' +
    '<article class="exec-note"><h3>Nhận định nhanh</h3><ul>' + insights.map(x => reportBullet(x, 'ok')).join('') + '</ul></article>' +
    '<div class="exec-footer">Báo cáo điều hành · ' + esc(reportPeriodText()) + '<b>01</b></div>' +
  '</section>';
}

function executiveTechPage(d, rows) {
  const list = (d.techKpi || []).slice().sort(function(a,b){ return Number(b.done || 0) - Number(a.done || 0); }).slice(0, 8);
  const maxDone = Math.max.apply(null, list.map(x => Number(x.done || 0))) || 1;
  const top = list[0];
  return '<section class="exec-page">' +
    '<div class="exec-page-head"><div class="exec-number">02</div><div><h2>Kỹ thuật hoạt động ra sao?</h2><p>Hiệu suất xử lý và tình trạng vận hành của đội kỹ thuật.</p></div><div class="exec-mini-brand">POPOPHONE</div></div>' +
    '<div class="exec-two-col">' +
      '<article class="exec-panel"><h3>Hiệu suất kỹ thuật</h3>' + (list.length ? list.map(function(x){
        const done = Number(x.done || 0); const total = done + Number(x.overdue || 0); const rate = total ? Math.max(0, Math.round((done / total) * 100)) : (done ? 100 : 0);
        return '<div class="exec-tech-row"><div class="exec-avatar">' + esc(String(x.name || '?').charAt(0).toUpperCase()) + '</div><div><b>' + esc(x.name || '') + '</b>' + reportBar(Math.round(done / maxDone * 100), '') + '</div><div><b>' + done + '</b><span>hoàn thành · QH ' + (x.overdue || 0) + '</span></div></div>';
      }).join('') : '<div class="exec-empty">Chưa có dữ liệu kỹ thuật.</div>') + '</article>' +
      '<article class="exec-panel"><h3>Tình trạng máy</h3>' +
        '<div class="exec-status-item ok"><b>Đã hoàn thành/giao</b><span>' + ((d.completed || 0) + (d.returned || 0)) + ' máy</span></div>' +
        '<div class="exec-status-item warn"><b>Đang xử lý</b><span>' + (d.inProgress || 0) + ' máy</span></div>' +
        '<div class="exec-status-item part"><b>Chờ linh kiện</b><span>' + (d.waitingPart || 0) + ' máy</span></div>' +
        '<div class="exec-status-item danger"><b>Quá hẹn</b><span>' + (d.overdue || 0) + ' máy</span></div>' +
      '</article>' +
    '</div>' +
    '<div class="exec-feature-card">' +
      '<div class="exec-trophy">🏆</div><div><span>Kỹ thuật nổi bật trong kỳ</span><h3>' + esc(top ? top.name : 'Chưa có dữ liệu') + '</h3><p>' + (top ? ('Hoàn thành ' + top.done + ' máy. Tiếp tục duy trì tốc độ xử lý và kiểm soát máy quá hẹn.') : 'Chưa đủ dữ liệu để đánh giá.') + '</p></div>' +
    '</div>' +
    '<article class="exec-note"><h3>Góc nhìn vận hành</h3><ul>' +
      reportBullet((d.overdue || 0) ? ('Ưu tiên xử lý ' + d.overdue + ' máy quá hẹn trước khi nhận thêm ca phức tạp.') : 'Chưa phát sinh máy quá hẹn đáng chú ý.', (d.overdue || 0) ? 'danger' : 'ok') +
      reportBullet((d.waitingPart || 0) ? ('Rà lại ' + d.waitingPart + ' máy chờ linh kiện để tránh kéo dài thời gian hẹn khách.') : 'Nhóm chờ linh kiện đang trong mức kiểm soát.', (d.waitingPart || 0) ? 'warn' : 'ok') +
      reportBullet('Nên duy trì cập nhật trạng thái ngay sau mỗi mốc xử lý để báo cáo phản ánh đúng thực tế.', '') +
    '</ul></article>' +
    '<div class="exec-footer">Báo cáo điều hành · ' + esc(reportPeriodText()) + '<b>02</b></div>' +
  '</section>';
}

function executiveMaterialPage(d) {
  const mats = (d.materials || []).slice(0, 6);
  const maxQty = Math.max.apply(null, mats.map(x => Number(x.totalQty || 0))) || 1;
  return '<section class="exec-page">' +
    '<div class="exec-page-head"><div class="exec-number">03</div><div><h2>Vật tư nào cần nhập?</h2><p>Phân tích vật tư tiêu hao và đề xuất nhập hàng.</p></div><div class="exec-mini-brand">POPOPHONE</div></div>' +
    '<div class="exec-two-col">' +
      '<article class="exec-panel"><h3>Vật tư tiêu hao nhiều nhất</h3>' + (mats.length ? mats.map(function(x, i){
        return '<div class="exec-rank-row"><div class="exec-rank-no">' + (i + 1) + '</div><div class="exec-rank-main"><b>' + esc(x.name || '') + '</b><small>' + esc(x.group || 'Chưa phân nhóm') + '</small>' + reportBar(Math.round(Number(x.totalQty || 0) / maxQty * 100), i === 0 ? 'gold' : '') + '</div><div class="exec-rank-value"><b>' + (x.totalQty || 0) + '</b><span>đã dùng</span></div></div>';
      }).join('') : '<div class="exec-empty">Chưa có dữ liệu vật tư.</div>') + '</article>' +
      '<article class="exec-panel"><h3>Đề xuất nhập</h3>' + (mats.length ? mats.slice(0,5).map(function(x){
        const suggest = Number(x.suggest || 0);
        return '<div class="exec-order-card"><div>📦</div><div><b>' + esc(x.name || '') + '</b><span>Nên nhập thêm: ' + suggest + ' cái</span></div></div>';
      }).join('') : '<div class="exec-empty">Chưa có vật tư cần đề xuất.</div>') + '</article>' +
    '</div>' +
    '<article class="exec-note amber"><h3>Lưu ý trước khi đặt hàng</h3><ul>' +
      reportBullet('Kiểm tra tồn thực tế tại kho trước khi đặt để tránh tồn lâu và chôn vốn.', 'warn') +
      reportBullet('Ưu tiên nhóm pin, kính, màn hình nếu xuất hiện nhiều trong danh sách tiêu hao.', '') +
      reportBullet('Các vật tư phát sinh ít nên nhập theo nhu cầu thực tế, không nhập dàn trải.', '') +
    '</ul></article>' +
    '<div class="exec-footer">Báo cáo điều hành · ' + esc(reportPeriodText()) + '<b>03</b></div>' +
  '</section>';
}

function executiveDecisionPage(d, rows, hideMoney) {
  const backlog = reportBacklogItems(rows, 5);
  const topMat = (d.materials || [])[0];
  const topSvc = (d.topServices || [])[0];
  const bullets = [];
  if (d.overdue) bullets.push({ text: 'Xử lý dứt điểm ' + d.overdue + ' máy quá hẹn, ưu tiên gọi khách và cập nhật cam kết trả máy.', tone: 'danger' });
  if (d.waitingPart) bullets.push({ text: 'Duyệt nhập hoặc điều chuyển vật tư cho ' + d.waitingPart + ' máy đang chờ linh kiện.', tone: 'warn' });
  if (topMat) bullets.push({ text: 'Xem xét nhập thêm ' + topMat.name + ' theo đề xuất để tránh thiếu hàng trong tuần tới.', tone: 'warn' });
  if (topSvc) bullets.push({ text: 'Tiếp tục theo dõi dịch vụ ' + topSvc.name + ' vì đang chiếm tỷ trọng cao trong cơ cấu sửa chữa.', tone: 'ok' });
  if (!hideMoney && Number(d.profit || 0) < 0) bullets.push({ text: 'Lợi nhuận đang âm, cần kiểm tra lại chi phí vật tư và thực thu.', tone: 'danger' });
  if (!bullets.length) bullets.push({ text: 'Chưa có vấn đề nghiêm trọng cần sếp quyết định trong kỳ này.', tone: 'ok' });
  return '<section class="exec-page">' +
    '<div class="exec-page-head"><div class="exec-number">04</div><div><h2>Có vấn đề gì cần sếp quyết định?</h2><p>Các điểm cần xử lý để giữ tốc độ và chất lượng dịch vụ.</p></div><div class="exec-mini-brand">POPOPHONE</div></div>' +
    '<div class="exec-two-col">' +
      '<article class="exec-panel"><h3>Máy cần chú ý</h3>' + (backlog.length ? backlog.map(function(r){
        const danger = r.overdue === 'Có' ? 'danger' : 'warn';
        return '<div class="exec-machine-alert ' + danger + '"><div>' + (danger === 'danger' ? '🔴' : '🟡') + '</div><div><b>' + esc(r.repairId || 'Chưa có mã') + '</b><span>' + esc(r.product || '') + ' · ' + esc(r.customer || '') + '</span><em>' + esc(statusClean(r.status || 'Cần theo dõi')) + '</em></div></div>';
      }).join('') : '<div class="exec-empty ok">Không có máy tồn đáng chú ý.</div>') + '</article>' +
      '<article class="exec-panel"><h3>Kiến nghị & quyết định</h3><ul class="exec-decision-list">' + bullets.map(function(x){ return reportBullet(x.text, x.tone); }).join('') + '</ul></article>' +
    '</div>' +
    '<article class="exec-quote"><b>“</b><p>Chất lượng sửa chữa là uy tín của POPOPHONE. Tuần tới ưu tiên tốc độ xử lý, cập nhật trạng thái đúng lúc và không để máy quá hẹn kéo dài.</p><span>Quản lý kỹ thuật</span></article>' +
    '<div class="exec-sign-row"><div><b>Người lập báo cáo</b><span>Ký, ghi rõ họ tên</span></div><div><b>Quản lý duyệt</b><span>Ký, ghi rõ họ tên</span></div></div>' +
    '<div class="exec-footer">Báo cáo điều hành · ' + esc(reportPeriodText()) + '<b>04</b></div>' +
  '</section>';
}

function weeklyReportHtml() {
  const rows = getWeeklyReportRows();
  const d = buildLocalDashboard(rows);
  const hideMoney = MONEY_HIDDEN_ROLES.includes(USER.role);
  const reportDate = new Date().toLocaleDateString('vi-VN');
  const periodText = reportPeriodText();
  return '<div class="exec-report-book">' +
    executiveCoverPage(periodText, reportDate) +
    executiveBusinessPage(d, rows, hideMoney) +
    executiveTechPage(d, rows) +
    executiveMaterialPage(d) +
    executiveDecisionPage(d, rows, hideMoney) +
  '</div>';
}

function renderWeeklyReport() {
  const el = document.getElementById('weeklyReportPreview');
  if (!el) return;
  el.innerHTML = weeklyReportHtml();
}

function printWeeklyReport() {
  const printArea = document.getElementById('printArea');
  printArea.innerHTML = weeklyReportHtml();
  window.print();
}

function renderRepairTable() {
  const rows = filterRepairs(REPAIRS, 'repair').sort(statusPrioritySort);
  document.getElementById('repairTable').innerHTML = tableHtml(rows, true);
}

function renderStatusList() {
  let rows = filterRepairs(REPAIRS, 'status');

  // Mặc định màn cập nhật trạng thái chỉ hiện các máy còn trong luồng xử lý.
  // Các trạng thái 8/9/10 chỉ hiện khi người dùng chủ động nhập tiêu chí lọc.
  if (!hasStatusFilterActive()) {
    rows = rows.filter(function (x) {
      return !isStatusClosedForDefault(x);
    });
  }

  if (USER.role === 'tech') rows = rows.filter(x => !String(x.status || '').startsWith('8.'));
  rows.sort(statusPrioritySort);
  document.getElementById('statusList').innerHTML = queueHtml(rows) || statusListHtml(rows) || '<p>Không có máy phù hợp.</p>';
}

function renderCostTable() {
  const el = document.getElementById('costTable');
  if (MONEY_HIDDEN_ROLES.includes(USER.role)) {
    el.innerHTML = '<p>Bạn không có quyền xem chi phí.</p>';
    return;
  }
  let rows = filterRepairs(REPAIRS, 'cost');

  // Mặc định màn cập nhật chi phí chỉ hiện phiếu chưa nhập chi phí.
  // Phiếu đã đủ chi phí chỉ hiện khi người dùng chủ động lọc/tìm.
  if (!hasCostFilterActive()) {
    rows = rows.filter(function (x) {
      return !Number(x.totalCost || 0);
    });
  }

  rows.sort(costPrioritySort);
  if (!rows.length) {
    el.innerHTML = '<p>Không có phiếu phù hợp.</p>';
    return;
  }
  el.innerHTML = costListHtml(rows);
}

function isReturned(r) { return String(r.status || '').startsWith('8.'); }
function canEditStatus(r) {
  if (USER.role === 'store') return false;
  if (isReturned(r) && USER.role !== 'admin') return false;
  return ['tech', 'tech_manager', 'admin'].includes(USER.role);
}
function canEditCost(r) {
  if (MONEY_HIDDEN_ROLES.includes(USER.role)) return false;
  if (isReturned(r) && USER.role !== 'admin') return false;
  return ['tech_manager', 'admin'].includes(USER.role);
}
function canQuickReturn(r) {
  return USER.role === 'store' && !isReturned(r);
}

function isStatusClosedForDefault(r) {
  const s = String(r.status || '').trim();
  return s.startsWith('8.') || s.startsWith('9.') || s.startsWith('10.');
}

function hasAnyValue(ids) {
  return ids.some(function (id) {
    const el = document.getElementById(id);
    return el && String(el.value || '').trim();
  });
}

function hasStatusFilterActive() {
  return hasAnyValue(['statusQ', 'statusFilter', 'statusTech', 'statusFrom', 'statusTo']);
}

function hasCostFilterActive() {
  return hasAnyValue(['costQ', 'costStatus', 'costPayment', 'costMaterialQ', 'costFrom', 'costTo']);
}

function tableHtml(rows, showMoney, costMode) {
  return '<table class="repair-table"><thead><tr><th>Mã</th><th>Máy</th><th>Khách</th><th>Dịch vụ</th><th>KTV</th><th>Trạng thái</th><th>Báo giá</th>' + (showMoney ? '' : '<th>Chi phí</th><th>Thu</th>') + '<th>Hành động</th></tr></thead><tbody>' +
    rows.map(function (r) {
      let actions = '<button class="mini-btn" onclick="openDetail(\'' + r.repairId + '\')">Xem</button>';
      if (canEditStatus(r)) actions += '<button class="mini-btn primary" onclick="openStatusEditor(\'' + r.repairId + '\')">Cập nhật</button>';
      if (costMode && canEditCost(r)) actions += '<button class="mini-btn money" onclick="openCostEditor(\'' + r.repairId + '\')">Chi phí</button>';
      if (canQuickReturn(r)) actions += '<button class="mini-btn done" onclick="quickReturn(\'' + r.repairId + '\')">Đã trả</button>';
      const locked = isReturned(r) ? '<span class="data-chip lock">Đã khóa</span>' : '';
      return '<tr><td><b class="code-text">' + esc(r.repairId || '') + '</b><br>' + locked + '</td><td><b>' + esc(r.product || '') + '</b><br><small>IMEI ' + esc(r.imei || '') + '</small></td><td>' + esc(r.customer || '') + '<br><small>' + esc(r.phone || '') + '</small></td><td class="service-cell">' + esc(r.repairService || 'Chưa có DV') + '</td><td>' + esc(r.technician || 'Chưa có KTV') + '</td><td><span class="status-pill ' + statusClass(r.status) + '">' + statusClean(r.status) + '</span></td><td>' + fmtMoney(r.estimate || 0) + '</td>' + (showMoney ? '' : '<td>' + fmtMoney(r.totalCost || 0) + '</td><td>' + fmtMoney(r.actualRevenue || 0) + '</td>') + '<td><div class="action-group">' + actions + '</div></td></tr>';
    }).join('') + '</tbody></table>';
}


function statusListHtml(rows) {
  if (!rows.length) return '';
  return '<div class="list-summary"><b>' + rows.length + '</b> phiếu đang hiển thị · Ưu tiên: quá hẹn, chờ linh kiện, đang sửa, chờ trả</div>' +
    '<div class="compact-table-wrap"><table class="repair-table compact-action-table"><thead><tr><th>Mã</th><th>Máy / IMEI</th><th>Khách</th><th>Dịch vụ</th><th>KTV</th><th>Trạng thái</th><th>Hẹn trả</th><th>Cảnh báo</th><th>Thao tác</th></tr></thead><tbody>' +
    rows.map(function (r) {
      const warning = missingStatusWarnings(r) || '';
      let actions = '<button class="mini-btn" onclick="openDetail(\'' + r.repairId + '\')">Xem</button>';
      if (canEditStatus(r)) actions += '<button class="mini-btn primary" onclick="openStatusEditor(\'' + r.repairId + '\')">Cập nhật</button><button class="mini-btn done" onclick="quickDone(\'' + r.repairId + '\')">Xong</button>';
      return '<tr>' +
        '<td><b class="code-text">' + esc(r.repairId || '') + '</b>' + (isReturned(r) ? '<br><span class="data-chip lock">Đã khóa</span>' : '') + '</td>' +
        '<td><b>' + esc(r.product || '') + '</b><br><small>IMEI ' + esc(r.imei || '') + '</small></td>' +
        '<td>' + esc(r.customer || '') + '<br><small>' + esc(r.phone || '') + '</small></td>' +
        '<td class="service-cell">' + esc(r.repairService || 'Chưa có DV') + '</td>' +
        '<td>' + esc(r.technician || 'Chưa có KTV') + '</td>' +
        '<td><span class="status-pill ' + statusClass(r.status) + '">' + statusClean(r.status) + '</span></td>' +
        '<td>' + esc(dateTime(r.appointment) || 'Chưa hẹn') + '</td>' +
        '<td class="warning-cell">' + (warning || '<small>Ổn</small>') + '</td>' +
        '<td><div class="action-group compact-actions">' + actions + '</div></td>' +
        '</tr>';
    }).join('') + '</tbody></table></div>';
}

function costListHtml(rows) {
  if (!rows.length) return '';
  return '<div class="list-summary"><b>' + rows.length + '</b> phiếu đang hiển thị · Ưu tiên: thiếu vật tư/NCC/chi phí, chờ bàn giao, chưa thanh toán</div>' +
    '<div class="compact-table-wrap"><table class="repair-table compact-action-table cost-list-table"><thead><tr><th>Mã</th><th>Máy / Khách</th><th>Dịch vụ</th><th>Vật tư / NCC</th><th>Trạng thái</th><th>Báo giá</th><th>Chi phí</th><th>Thực thu</th><th>Cảnh báo</th><th>Thao tác</th></tr></thead><tbody>' +
    rows.map(function (r) {
      const missing = missingCostWarnings(r) || '';
      let actions = '<button class="mini-btn" onclick="openDetail(\'' + r.repairId + '\')">Xem</button>';
      if (canEditCost(r)) actions += '<button class="mini-btn money" onclick="openCostEditor(\'' + r.repairId + '\')">Nhập chi phí</button>';
      return '<tr>' +
        '<td><b class="code-text">' + esc(r.repairId || '') + '</b>' + (isReturned(r) ? '<br><span class="data-chip lock">Đã khóa</span>' : '') + '</td>' +
        '<td><b>' + esc(r.product || '') + '</b><br><small>' + esc(r.customer || '') + ' · ' + esc(r.phone || '') + '</small></td>' +
        '<td class="service-cell">' + esc(r.repairService || 'Chưa có DV') + '</td>' +
        '<td>' + esc(r.materialName || 'Chưa có vật tư') + '<br><small>' + esc(r.ncc || 'Chưa có NCC') + '</small></td>' +
        '<td><span class="status-pill ' + statusClass(r.status) + '">' + statusClean(r.status) + '</span><br><small>' + esc(r.paymentStatus || '') + '</small></td>' +
        '<td>' + fmtMoney(r.estimate || 0) + '</td>' +
        '<td>' + fmtMoney(r.totalCost || 0) + '</td>' +
        '<td><b>' + fmtMoney(r.actualRevenue || 0) + '</b></td>' +
        '<td class="warning-cell">' + (missing || '<small>Đủ dữ liệu</small>') + '</td>' +
        '<td><div class="action-group compact-actions">' + actions + '</div></td>' +
        '</tr>';
    }).join('') + '</tbody></table></div>';
}

function queueHtml(rows) {
  const groups = [
    { title: '🔴 Quá hẹn', test: r => r.overdue === 'Có' && !isReturned(r) },
    { title: '🟡 Chờ linh kiện', test: r => String(r.status || '').startsWith('6.') },
    { title: '🟢 Đang sửa', test: r => ['2.', '3.', '4.', '5.'].some(s => String(r.status || '').startsWith(s)) && r.overdue !== 'Có' },
    { title: '🔵 Đã sửa xong chờ trả', test: r => String(r.status || '').startsWith('7.') },
    { title: '✅ Đã trả / khác', test: r => isReturned(r) || !r.status }
  ];
  return groups.map(function (g) {
    const items = rows.filter(g.test);
    if (!items.length) return '';
    return '<section class="queue-section"><h3>' + g.title + ' <span>' + items.length + '</span></h3><div class="queue-grid">' + items.map(statusCard).join('') + '</div></section>';
  }).join('');
}

function statusCard(r) {
  const quick = canEditStatus(r) ? '<button class="mini-btn primary" onclick="openStatusEditor(\'' + r.repairId + '\')">Cập nhật</button><button class="mini-btn done" onclick="quickDone(\'' + r.repairId + '\')">Đã sửa xong</button>' : '';
  const warning = missingStatusWarnings(r);
  return '<article class="job-card modern-card"><div class="job-head"><div><h3>' + esc(r.product || '') + ' · ' + esc(r.customer || '') + '</h3><p>' + esc(r.repairId || '') + ' · ' + esc(r.phone || '') + '</p></div><span class="status-pill ' + statusClass(r.status) + '">' + statusClean(r.status) + '</span></div><div class="job-meta"><span>🔧 ' + esc(r.repairService || 'Chưa có DV') + '</span><span>👨‍🔧 ' + esc(r.technician || 'Chưa có KTV') + '</span><span>💰 ' + fmtMoney(r.estimate || 0) + '</span><span>⏰ ' + esc(dateTime(r.appointment) || 'Chưa hẹn') + '</span></div>' + (warning ? '<div class="warning-line">' + warning + '</div>' : '') + '<div class="action-group">' + quick + '<button class="mini-btn" onclick="openDetail(\'' + r.repairId + '\')">Timeline</button></div></article>';
}

function costCard(r) {
  const missing = missingCostWarnings(r);
  return '<article class="cost-card modern-card"><div class="job-head"><div><h3>' + esc(r.product || '') + ' · ' + esc(r.customer || '') + '</h3><p>' + esc(r.repairId || '') + ' · ' + esc(r.phone || '') + '</p></div><span class="status-pill ' + statusClass(r.status) + '">' + statusClean(r.status) + '</span></div><div class="cost-line"><span>Báo giá</span><b>' + fmtMoney(r.estimate || 0) + '</b></div><div class="cost-line"><span>Chi phí</span><b>' + fmtMoney(r.totalCost || 0) + '</b></div><div class="cost-line"><span>Thực thu</span><b>' + fmtMoney(r.actualRevenue || 0) + '</b></div><p class="service-cell">🔧 ' + esc(r.repairService || 'Chưa có DV') + '</p>' + (missing ? '<div class="warning-line">' + missing + '</div>' : '') + '<div class="action-group"><button class="mini-btn" onclick="openDetail(\'' + r.repairId + '\')">Xem</button>' + (canEditCost(r) ? '<button class="mini-btn money" onclick="openCostEditor(\'' + r.repairId + '\')">Cập nhật chi phí</button>' : '') + '</div></article>';
}

function missingStatusWarnings(r) {
  const w = [];
  if (!r.repairService) w.push('Chưa có dịch vụ');
  if (!r.technician) w.push('Chưa có KTV');
  if (r.overdue === 'Có' && !isReturned(r)) w.push('Quá hẹn');
  return w.map(x => '<span class="warn-chip">⚠ ' + x + '</span>').join(' ');
}

function missingCostWarnings(r) {
  const w = [];
  if (!r.repairService) w.push('Chưa có dịch vụ');
  if (!r.materialName) w.push('Chưa có vật tư');
  if (!r.ncc) w.push('Chưa có NCC');
  if (!Number(r.totalCost || 0)) w.push('Chưa nhập chi phí');
  return w.map(x => '<span class="warn-chip">⚠ ' + x + '</span>').join(' ');
}

function statusPrioritySort(a, b) {
  return priorityStatus(a) - priorityStatus(b) || String(b.date || '').localeCompare(String(a.date || ''));
}

function costPrioritySort(a, b) {
  return costPriority(a) - costPriority(b) || String(b.date || '').localeCompare(String(a.date || ''));
}

function priorityStatus(r) {
  if (r.overdue === 'Có' && !isReturned(r)) return 1;
  if (String(r.status || '').startsWith('6.')) return 2;
  if (['2.', '3.', '4.', '5.'].some(s => String(r.status || '').startsWith(s))) return 3;
  if (String(r.status || '').startsWith('7.')) return 4;
  return 9;
}

function costPriority(r) {
  if (!r.materialName || !r.ncc || !Number(r.totalCost || 0)) return 1;
  if (String(r.status || '').startsWith('7.')) return 2;
  if (String(r.paymentStatus || '').includes('Chưa')) return 3;
  return 9;
}

function filterRepairs(rows, mode) {
  // Các menu Danh sách/Xử lý/Chi phí dùng toàn bộ dữ liệu; không nhận bộ lọc Tổng quan.
  let out = (Array.isArray(rows) ? rows : []).slice();

  const get = function (id) {
    const el = document.getElementById(id);
    return el ? String(el.value || '').trim() : '';
  };

  const q = get(mode + 'Q').toLowerCase();

  const statusValue =
    mode === 'status' ? get('statusFilter') :
    mode === 'cost' ? get('costStatus') :
    get('repairStatus');

  const techValue =
    mode === 'status' ? get('statusTech') :
    get(mode + 'Tech');

  const branchValue = mode === 'repair' ? get('repairBranch') : '';

  const from =
    mode === 'status' ? get('statusFrom') :
    mode === 'cost' ? get('costFrom') :
    get('repairFrom');
  const to =
    mode === 'status' ? get('statusTo') :
    mode === 'cost' ? get('costTo') :
    get('repairTo');
  const pay = mode === 'cost' ? get('costPayment') : '';
  const matq = mode === 'cost' ? get('costMaterialQ').toLowerCase() : '';

  if (q) {
    const digits = q.replace(/\D/g, '');
    out = out.filter(function (x) {
      const repairId = String(x.repairId || '').toLowerCase();
      const imei = String(x.imei || '');
      const phone = String(x.phone || '');
      const customer = String(x.customer || '').toLowerCase();
      const product = String(x.product || '').toLowerCase();
      const service = String(x.repairService || '').toLowerCase();

      if (repairId.includes(q)) return true;
      if (digits && imei.includes(digits)) return true;
      if (digits && phone.includes(digits)) return true;
      if (customer.includes(q)) return true;
      if (product.includes(q)) return true;
      if (service.includes(q)) return true;
      return false;
    });
  }

  if (branchValue) {
    out = out.filter(function (x) {
      return String(x.branch || '').trim() === String(branchValue).trim();
    });
  }

  if (statusValue) {
    out = out.filter(function (x) {
      return normalizeStatusForFilter(x.status) === normalizeStatusForFilter(statusValue);
    });
  }

  if (techValue) {
    out = out.filter(function (x) {
      return normalizeKey(x.technician) === normalizeKey(techValue);
    });
  }

  if (from) out = out.filter(function (x) { return dateNumber(x.date || x.createdAt) >= dateNumber(from); });
  if (to) out = out.filter(function (x) { return dateNumber(x.date || x.createdAt) <= dateNumber(to) + 86399999; });

  if (pay) {
    out = out.filter(function (x) {
      return normalizeKey(x.paymentStatus) === normalizeKey(pay);
    });
  }

  if (matq) {
    out = out.filter(function (x) {
      const text = [x.materialName, x.ncc, x.billCode].join(' ').toLowerCase();
      return text.includes(matq);
    });
  }

  return out;
}

function normalizeStatusForFilter(v) {
  return String(v || '')
    .trim()
    .toLowerCase()
    .replace(/^\d+\.\s*/, '')
    .replace(/\s+/g, ' ');
}

function dateNumber(v) {
  const d = parseAnyDate(v);
  return d ? d.getTime() : 0;
}

function openStatusEditor(id) {
  const r = REPAIRS.find(x => x.repairId === id);
  if (!canEditStatus(r)) { showToast('Đơn đã khóa hoặc bạn không có quyền sửa trạng thái', 'error'); return; }
  const selected = splitItems(r.repairService || '');
  const serviceOptions = (MASTERS.dichVu || []).map(function (x) {
    const checked = selected.includes(x.name) ? 'checked' : '';
    return '<label class="check-row"><input type="checkbox" name="repairServices" value="' + esc(x.name) + '" ' + checked + '><span>' + esc(x.name) + '</span><small>' + esc(x.group || '') + '</small></label>';
  }).join('');
  const techs = (MASTERS.kyThuat || []).map(x => '<option ' + (x.name === r.technician ? 'selected' : '') + '>' + esc(x.name) + '</option>').join('');
  const statuses = (MASTERS.trangThai || []).map(x => '<option ' + (x === r.status ? 'selected' : '') + '>' + esc(x) + '</option>').join('');
  const placeInternal = (r.place || 'Nội bộ') === 'Nội bộ' ? 'selected' : '';
  const placeExternal = (r.place || '') === 'Bên ngoài' ? 'selected' : '';

  showModal('<div class="modal-card wide"><h2>Cập nhật trạng thái</h2><p>' + esc(r.repairId) + ' · ' + esc(r.product || '') + ' · ' + esc(r.customer || '') + '</p><form id="statusForm" class="form-grid"><label class="span-3"><span>Dịch vụ sửa chữa (chọn nhiều)</span><input id="serviceSearchBox" placeholder="Tìm dịch vụ..." oninput="filterCheckList(\'serviceCheckList\', this.value)"><div id="serviceCheckList" class="check-list">' + serviceOptions + '</div></label><label><span>Nơi xử lý</span><select name="place"><option ' + placeInternal + '>Nội bộ</option><option ' + placeExternal + '>Bên ngoài</option></select></label><label><span>Kỹ thuật xử lý</span><select name="technician">' + techs + '</select></label><label><span>Trạng thái máy</span><select name="status">' + statuses + '</select></label><label><span>Giá dự kiến</span><input name="estimate" type="number" value="' + (r.estimate || 0) + '"></label><label class="span-3"><span>Ghi chú kỹ thuật</span><textarea name="techNote">' + esc(r.techNote || '') + '</textarea></label><div class="form-actions"><button type="button" class="ghost-btn" onclick="closeModal()">Đóng</button><button type="submit" class="primary-btn">Lưu cập nhật</button></div></form></div>');
  document.getElementById('statusForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    data.repairServices = Array.from(e.target.querySelectorAll('input[name="repairServices"]:checked')).map(x => x.value);
    data.repairService = data.repairServices.join(', ');
    data.estimate = Number(data.estimate || 0);
    data.userRole = USER.role;
    data.actor = USER.name || USER.username || '';
    apiCall({ action: 'updateStatus', repairId: id, data: data }).then(function (res) {
      if (!res.success) return showToast(res.message || 'Lỗi lưu', 'error');
      closeModal();
      showToast('Đã cập nhật trạng thái');
      ACTIVE_TAB = USER.role === 'tech' ? 'status' : ACTIVE_TAB;
      refreshAll();
    });
  });
}

function openCostEditor(id) {
  const r = REPAIRS.find(x => x.repairId === id);
  if (!canEditCost(r)) { showToast('Đơn đã khóa hoặc bạn không có quyền sửa chi phí', 'error'); return; }
  apiCall({ action: 'getDetail', repairId: id }).then(function (detail) {
    const materialRows = detail.materials && detail.materials.length ? detail.materials.map(function (m) {
      return {
        billCode: m['Mã bill mua vật tư'] || r.billCode || '',
        name: m['Tên vật tư'] || '',
        qty: Number(m.SL || 1),
        unitPrice: Number(m['Đơn giá'] || 0),
        amount: Number(m['Thành tiền'] || 0),
        ncc: m.NCC || r.ncc || ''
      };
    }) : splitItems(r.materialName || '').map(function (name, idx) {
      return { billCode: r.billCode || '', name: name, qty: 1, unitPrice: idx === 0 ? Number(r.materialCost || 0) : 0, amount: idx === 0 ? Number(r.materialCost || 0) : 0, ncc: r.ncc || '' };
    });
    if (!materialRows.length) materialRows.push({ billCode: r.billCode || '', name: '', qty: 1, unitPrice: 0, amount: 0, ncc: r.ncc || '' });

    showModal('<div class="modal-card wide"><h2>Cập nhật chi phí</h2><p>' + esc(r.repairId) + ' · ' + esc(r.product || '') + '</p><form id="costForm" class="form-grid"><label><span>Công thợ</span><input name="laborCost" type="number" oninput="updateMaterialPreview()" value="' + (r.laborCost || 0) + '"></label><label><span>Thực thu</span><input name="actualRevenue" type="number" value="' + (r.actualRevenue || 0) + '"></label><label><span>Trạng thái thanh toán</span><select name="paymentStatus"><option ' + (r.paymentStatus === 'Chưa thanh toán' ? 'selected' : '') + '>Chưa thanh toán</option><option ' + (r.paymentStatus === 'Đã thanh toán' ? 'selected' : '') + '>Đã thanh toán</option></select></label><div class="span-3"><div class="sub-head"><b>Vật tư sử dụng (thêm nhiều dòng)</b><button type="button" class="ghost-btn" onclick="addMaterialRow()">+ Thêm vật tư</button></div><div id="materialRows" class="material-lines"></div><div class="cost-preview"><span>Tổng vật tư: <b id="materialTotalPreview">0đ</b></span><span>Tổng chi phí: <b id="totalCostPreview">0đ</b></span></div></div><div class="form-actions"><button type="button" class="ghost-btn" onclick="closeModal()">Đóng</button><button type="submit" class="primary-btn">Lưu chi phí</button></div></form></div>');

    window.__materialDraft = materialRows;
    renderMaterialRows();

    document.getElementById('costForm').addEventListener('submit', function (e) {
      e.preventDefault();
      const formData = Object.fromEntries(new FormData(e.target).entries());
      const materials = collectMaterialRows();
      const data = {
        laborCost: Number(formData.laborCost || 0),
        actualRevenue: Number(formData.actualRevenue || 0),
        paymentStatus: formData.paymentStatus || 'Chưa thanh toán',
        materials: materials,
        userRole: USER.role,
        actor: USER.name || USER.username || ''
      };
      apiCall({ action: 'updateCost', repairId: id, data: data }).then(function (res) {
        if (!res.success) return showToast(res.message || 'Lỗi lưu', 'error');
        closeModal();
        showToast('Đã cập nhật chi phí');
        refreshAll();
      });
    });
  });
}


function canSeeCostTimeline() {
  const role = String((USER && USER.role) || '').toLowerCase();
  return role === 'admin' || role === 'tech_manager' || role === 'qlkythuat';
}

function isSensitiveTimelineLog(log) {
  const action = String(log.action || log['Hành động'] || '').toLowerCase();
  const content = String(log.content || log['Nội dung'] || '').toLowerCase();
  const text = action + ' | ' + content;
  return (
    text.includes('cập nhật chi phí') ||
    text.includes('chi phí') ||
    text.includes('tổng chi phí') ||
    text.includes('thực thu') ||
    text.includes('lợi nhuận') ||
    text.includes('giá vật tư') ||
    text.includes('công thợ') ||
    text.includes('ncc') ||
    text.includes('vt:') ||
    text.includes('vật tư')
  );
}

function timelineLogsByRole(logs) {
  if (canSeeCostTimeline()) return logs || [];
  return (logs || []).filter(function (log) {
    return !isSensitiveTimelineLog(log);
  });
}

function timelineContentByRole(log) {
  if (canSeeCostTimeline()) return String(log.content || log['Nội dung'] || '');
  return String(log.content || log['Nội dung'] || '');
}


function detailHtml(r, logs, services, materials, showMoney) {
  if (!r) return '<h2>Không tìm thấy phiếu</h2><button class="ghost-btn" onclick="closeModal()">Đóng</button>';
  const serviceList = (services && services.length ? services.map(function (x) { return x['Tên dịch vụ'] || x.name; }) : splitItems(r.repairService || '')).filter(Boolean);
  const materialList = (materials && materials.length ? materials.map(function (x) { return (x['Tên vật tư'] || x.name || '') + (showMoney && (x['Thành tiền'] || x.amount) ? ' · ' + fmtMoney(x['Thành tiền'] || x.amount) : ''); }) : splitItems(r.materialName || '')).filter(Boolean);
  const safeLogs = timelineLogsByRole(logs || []);
  const timeline = safeLogs.length ? safeLogs.map(function (l) {
    return '<div class="timeline-item"><div class="timeline-dot"></div><div><b>' + dateTime(l.time || l['Thời gian']) + ' · ' + esc(l.action || l['Hành động'] || '') + '</b><p>' + esc(timelineContentByRole(l)) + '</p><small>' + esc(l.user || l['Người thực hiện'] || '') + '</small></div></div>';
  }).join('') : '<p>Chưa có lịch sử xử lý.</p>';
  return '<div class="detail-header"><div><h2>' + esc(r.product || '') + ' · ' + esc(r.customer || '') + '</h2><p>' + esc(r.repairId || '') + ' · IMEI ' + esc(r.imei || '') + ' · ' + esc(r.phone || '') + '</p></div><span class="status-pill ' + statusClass(r.status) + '">' + statusClean(r.status) + '</span></div>' +
    '<div class="detail-grid"><section><h3>Thông tin tiếp nhận</h3><p><b>Loại DV:</b> ' + esc(r.serviceType || '') + '</p><p><b>Yêu cầu:</b> ' + esc(r.request || '') + '</p><p><b>Hẹn trả:</b> ' + esc(dateTime(r.appointment) || '') + '</p><p><b>Báo giá:</b> ' + fmtMoney(r.estimate || 0) + '</p></section>' +
    '<section><h3>Dịch vụ sửa chữa</h3>' + (serviceList.length ? '<ul>' + serviceList.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '<p>Chưa cập nhật dịch vụ.</p>') + '</section>' +
    (showMoney ? '<section><h3>Chi phí / vật tư</h3>' + (materialList.length ? '<ul>' + materialList.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '<p>Chưa cập nhật vật tư.</p>') + '<p><b>Tổng chi phí:</b> ' + fmtMoney(r.totalCost || 0) + '</p><p><b>Thực thu:</b> ' + fmtMoney(r.actualRevenue || 0) + '</p><p><b>Lợi nhuận:</b> ' + fmtMoney(r.profit || 0) + '</p></section>' : '') +
    '</div><section class="timeline-box"><h3>📋 Timeline xử lý</h3><div class="timeline">' + timeline + '</div></section>' +
    '<div class="form-actions"><button class="ghost-btn" onclick="printRepairReceipt(\'' + esc(r.repairId || '') + '\')">In phiếu nhận</button><button class="ghost-btn" onclick="closeModal()">Đóng</button></div>';
}

function openDetail(id) { apiCall({ action: 'getDetail', repairId: id }).then(res => showModal('<div class="modal-card wide">' + detailHtml(res.data, res.logs || [], res.services || [], res.materials || [], !MONEY_HIDDEN_ROLES.includes(USER.role)) + '</div>')); }
function closeModal() { document.getElementById('modal').classList.remove('show'); }
function showModal(html) { const m = document.getElementById('modal'); m.innerHTML = html; m.classList.add('show'); }
function quickDone(id) { const r = REPAIRS.find(x => x.repairId === id); if (!canEditStatus(r)) return showToast('Không có quyền hoặc đơn đã khóa', 'error'); apiCall({ action: 'quickStatus', repairId: id, data: { status: '7. Đã sửa xong', userRole: USER.role, actor: USER.name || USER.username || '' } }).then(() => { showToast('Đã cập nhật Đã sửa xong'); refreshAll(); }); }
function quickReturn(id) { const r = REPAIRS.find(x => x.repairId === id); if (!canQuickReturn(r) && USER.role !== 'admin') return showToast('Không có quyền trả khách hoặc đơn đã khóa', 'error'); apiCall({ action: 'quickStatus', repairId: id, data: { status: '8. Đã trả khách', userRole: USER.role, actor: USER.name || USER.username || '' } }).then((res) => { if (!res.success) return showToast(res.message || 'Lỗi cập nhật', 'error'); showToast('Đã cập nhật Đã trả khách'); refreshAll(); }); }
function renderMaterialsFull() {
  renderMaterialsNeed();
  const full = document.getElementById('materialsFull');
  const need = document.getElementById('materialsNeed');
  if (full && need) full.innerHTML = need.innerHTML;
  renderMaterialSupplierSummary('materialsFull');
}


function initCommissionTab() {
  renderCommissionDashboard();
}

function getCommissionRows() {
  const techFilter = document.getElementById('commissionTech')?.value || '';

  const rules = buildCommissionRuleMap();
  const serviceCt = normalizeCtServices(CT_SERVICES);
  const serviceByRepair = {};
  serviceCt.forEach(function (svc) {
    serviceByRepair[svc.repairId] = serviceByRepair[svc.repairId] || [];
    serviceByRepair[svc.repairId].push(svc.name);
  });

  const out = [];

  // 1) Hoa hồng từ máy khách trên hệ thống: DATA + CT_DICH_VU
  REPAIRS.forEach(function (r) {
    const techName = String(r.technician || '').trim();
    if (!techName) return;
    if (techFilter && techName !== techFilter) return;


    const model = canonicalModelName(r.product || 'Khác');
    const services = uniqueTextList((serviceByRepair[r.repairId] && serviceByRepair[r.repairId].length) ? serviceByRepair[r.repairId] : splitItems(r.repairService || ''));
    if (!services.length) return;

    services.forEach(function (svc) {
      const group = commissionGroupFromService(svc);
      if (!group) return;
      const amount = lookupCommissionAmount(rules, techName, model, group);
      out.push({
        repairId: r.repairId || '',
        imei: imei6_(r.imei || ''),
        date: r.completedDate || r.updatedAt || r.date || r.createdAt || '',
        tech: techName,
        model: model,
        service: canonicalServiceName(svc),
        group: group,
        amount: amount,
        hasRule: amount > 0 || hasCommissionRule(rules, techName, model, group),
        customer: r.customer || '',
        source: 'Khách hệ thống'
      });
    });
  });

  // 2) Hoa hồng từ máy nhà / máy gửi xử lý: lấy TRỰC TIẾP từ MAY_GUI_XU_LY.
  // THO_NHAP_CONG chỉ dùng cho tab Đối chiếu công kỹ thuật để kiểm tra thợ nhập thiếu/dư,
  // tuyệt đối không dùng THO_NHAP_CONG làm nguồn chuẩn tính hoa hồng.
  const pushedSent = {};
  SENT_REPAIRS.forEach(function (sent) {
    const techName = String(sent.technician || sent.tech || sent['Kỹ thuật'] || sent['Kỹ Thuật'] || '').trim();
    if (!techName) return;
    if (techFilter && techName !== techFilter) return;

    const rowDate = sent.receivedBackDate || sent.sentDate || sent.updatedAt || sent.createdAt || '';

    const imeiKey = imei6_(sent.imei);
    if (!imeiKey) return;

    const model = canonicalModelName(sent.model || sent.name || sent.productName || 'Khác');
    const services = uniqueTextList(
      splitItems([sent.process1, sent.process2].filter(Boolean).join(', '))
    );
    if (!services.length) return;

    services.forEach(function (svc) {
      const serviceName = canonicalServiceName(svc);
      if (!serviceName) return;

      const group = commissionGroupFromService(serviceName) || serviceName;
      const amount = lookupCommissionAmount(rules, techName, model, group);
      const pushKey = imeiKey + '|' + normalizeKey(techName) + '|' + normalizeKey(serviceName);
      if (pushedSent[pushKey]) return;
      pushedSent[pushKey] = true;

      out.push({
        repairId: 'MGXL-' + imeiKey,
        imei: imeiKey,
        date: rowDate,
        tech: techName,
        model: model,
        service: serviceName,
        group: group,
        amount: amount,
        hasRule: amount > 0 || hasCommissionRule(rules, techName, model, group),
        customer: '',
        source: 'Máy gửi xử lý'
      });
    });
  });

  return out.sort(function (a, b) {
    return String(a.tech).localeCompare(String(b.tech), 'vi') || String(a.date).localeCompare(String(b.date), 'vi') || String(a.source).localeCompare(String(b.source), 'vi');
  });
}

function renderCommissionDashboard() {
  const rows = getCommissionRows();
  const total = rows.reduce(function (sum, x) { return sum + Number(x.amount || 0); }, 0);
  const summaryMap = {};
  const allTechs = (MASTERS.kyThuat || []).map(function (x) { return x.name; }).filter(Boolean);

  allTechs.forEach(function (name) {
    summaryMap[name] = { tech: name, count: 0, total: 0, systemTotal: 0, sentTotal: 0, services: {}, missing: 0 };
  });

  rows.forEach(function (x) {
    if (!summaryMap[x.tech]) summaryMap[x.tech] = { tech: x.tech, count: 0, total: 0, systemTotal: 0, sentTotal: 0, services: {}, missing: 0 };
    const b = summaryMap[x.tech];
    b.count++;
    b.total += Number(x.amount || 0);
    if (x.source === 'Máy gửi xử lý') b.sentTotal += Number(x.amount || 0);
    else b.systemTotal += Number(x.amount || 0);
    if (!x.hasRule) b.missing++;
    const k = normalizeKey(x.service);
    if (!b.services[k]) b.services[k] = { name: x.service, count: 0 };
    b.services[k].count++;
  });

  const summary = Object.values(summaryMap).sort(function (a, b) { return b.total - a.total || b.count - a.count; });
  const topTech = summary.filter(x => x.total > 0)[0] || null;
  const missingCount = rows.filter(x => !x.hasRule).length;

  const systemTotal = rows.filter(function (x) { return x.source === 'Khách hệ thống'; }).reduce(function (sum, x) { return sum + Number(x.amount || 0); }, 0);
  const sentTotal = rows.filter(function (x) { return x.source === 'Máy gửi xử lý'; }).reduce(function (sum, x) { return sum + Number(x.amount || 0); }, 0);

  const kpiEl = document.getElementById('commissionKpis');
  if (kpiEl) {
    kpiEl.innerHTML = [
      { label: 'Tổng hoa hồng', value: fmtMoney(total) },
      { label: 'Khách hệ thống', value: fmtMoney(systemTotal) },
      { label: 'Máy gửi xử lý', value: fmtMoney(sentTotal) },
      { label: 'KTV cao nhất', value: topTech ? topTech.tech + ' · ' + fmtMoney(topTech.total) : 'Chưa có' },
      { label: 'Dịch vụ/công tính lương', value: rows.length },
      { label: 'Chưa có bảng/0đ', value: missingCount }
    ].map(function (x) { return '<div class="kpi-card mini"><span>' + esc(x.label) + '</span><b>' + esc(x.value) + '</b></div>'; }).join('');
  }

  const summaryEl = document.getElementById('commissionSummary');
  if (summaryEl) {
    summaryEl.innerHTML = '<table><thead><tr><th>Kỹ thuật</th><th>Số dịch vụ</th><th>Khách hệ thống</th><th>Máy gửi xử lý</th><th>Tổng hoa hồng</th><th>Top dịch vụ</th><th>Thiếu bảng</th></tr></thead><tbody>' +
      (summary.length ? summary.map(function (x) {
        const topSvc = Object.values(x.services || {}).sort(function (a, b) { return b.count - a.count; })[0];
        return '<tr>' +
          '<td><b>' + esc(x.tech) + '</b></td>' +
          '<td>' + (x.count || 0) + '</td>' +
          '<td>' + fmtMoney(x.systemTotal || 0) + '</td>' +
          '<td>' + fmtMoney(x.sentTotal || 0) + '</td>' +
          '<td><b>' + fmtMoney(x.total || 0) + '</b></td>' +
          '<td>' + (topSvc ? esc(topSvc.name) + ' · ' + topSvc.count : '') + '</td>' +
          '<td>' + (x.missing || 0) + '</td>' +
        '</tr>';
      }).join('') : '<tr><td colspan="7">Chưa có dữ liệu hoa hồng.</td></tr>') +
      '</tbody></table>';
  }

  const detailEl = document.getElementById('commissionDetail');
  if (detailEl) {
    detailEl.innerHTML = '<table><thead><tr><th>Ngày</th><th>Nguồn</th><th>IMEI</th><th>KTV</th><th>Dòng máy</th><th>Dịch vụ</th><th>Hoa hồng</th></tr></thead><tbody>' +
      (rows.length ? rows.map(function (x) {
        return '<tr class="' + (!x.hasRule ? 'warn-row' : '') + '">' +
          '<td>' + esc(dateTime(x.date) || x.date || '') + '</td>' +
          '<td><span class="status-pill ' + (x.source === 'Máy gửi xử lý' ? 'wait' : 'done') + '">' + esc(x.source || 'Khách hệ thống') + '</span></td>' +
          '<td><b>' + esc(x.imei || x.repairId || '') + '</b></td>' +
          '<td>' + esc(x.tech) + '</td>' +
          '<td>' + esc(x.model) + '</td>' +
          '<td>' + esc(x.service) + '</td>' +
          '<td><b>' + fmtMoney(x.amount || 0) + '</b></td>' +
        '</tr>';
      }).join('') : '<tr><td colspan="7">Chưa có dữ liệu hoa hồng.</td></tr>') +
      '</tbody></table>';
  }
}

function commissionReportHtml() {
  const rows = getCommissionRows();
  const techFilter = document.getElementById('commissionTech')?.value || '';
  const titleMonth = 'Toàn bộ dữ liệu';
  const titleTech = techFilter || 'Tất cả kỹ thuật';
  const total = rows.reduce(function (sum, x) { return sum + Number(x.amount || 0); }, 0);
  const systemTotal = rows.filter(x => x.source === 'Khách hệ thống').reduce((s,x)=>s+Number(x.amount||0),0);
  const sentTotal = rows.filter(x => x.source === 'Máy gửi xử lý').reduce((s,x)=>s+Number(x.amount||0),0);
  const byTech = {};
  rows.forEach(function (x) {
    if (!byTech[x.tech]) byTech[x.tech] = { tech: x.tech, count: 0, total: 0 };
    byTech[x.tech].count++;
    byTech[x.tech].total += Number(x.amount || 0);
  });
  const summaryRows = Object.values(byTech).sort(function (a,b){ return b.total-a.total; });
  const detailRows = rows.map(function (x, i) {
    return '<tr>' +
      '<td>' + (i + 1) + '</td>' +
      '<td>' + esc(dateOnly(x.date) || dateTime(x.date) || x.date || '') + '</td>' +
      '<td>' + esc(x.source || '') + '</td>' +
      '<td><b>' + esc(x.imei || '') + '</b></td>' +
      '<td>' + esc(x.tech || '') + '</td>' +
      '<td>' + esc(x.model || '') + '</td>' +
      '<td>' + esc(x.service || '') + '</td>' +
      '<td><b>' + fmtMoney(x.amount || 0) + '</b></td>' +
    '</tr>';
  }).join('');
  const summaryHtml = summaryRows.map(function (x) {
    return '<tr><td><b>' + esc(x.tech) + '</b></td><td>' + x.count + '</td><td><b>' + fmtMoney(x.total) + '</b></td></tr>';
  }).join('');
  return '<section class="commission-report-sheet">' +
    '<div class="report-title"><div><h1>POPOPHONE</h1><p>BẢNG XÁC NHẬN HOA HỒNG KỸ THUẬT</p></div><div><b>' + esc(titleMonth) + '</b><span>Kỹ thuật: ' + esc(titleTech) + '</span></div></div>' +
    '<div class="report-kpis">' +
      '<div><span>Tổng hoa hồng</span><b>' + fmtMoney(total) + '</b></div>' +
      '<div><span>Khách hệ thống</span><b>' + fmtMoney(systemTotal) + '</b></div>' +
      '<div><span>Máy gửi xử lý</span><b>' + fmtMoney(sentTotal) + '</b></div>' +
      '<div><span>Tổng dòng công</span><b>' + rows.length + '</b></div>' +
    '</div>' +
    '<div class="report-box full"><h4>1. Tổng hợp theo kỹ thuật</h4><table><thead><tr><th>Kỹ thuật</th><th>Số dòng công</th><th>Tổng hoa hồng</th></tr></thead><tbody>' + (summaryHtml || '<tr><td colspan="3">Chưa có dữ liệu.</td></tr>') + '</tbody></table></div>' +
    '<div class="report-box full"><h4>2. Chi tiết hoa hồng</h4><table><thead><tr><th>#</th><th>Ngày</th><th>Nguồn</th><th>IMEI</th><th>KTV</th><th>Dòng máy</th><th>Dịch vụ</th><th>Hoa hồng</th></tr></thead><tbody>' + (detailRows || '<tr><td colspan="8">Chưa có dữ liệu.</td></tr>') + '</tbody></table></div>' +
    '<div class="report-note"><b>Xác nhận:</b><p>Kỹ thuật đã kiểm tra danh sách máy, dịch vụ và hoa hồng trong tháng. Các dòng chưa khớp nguồn đối chiếu không được tính vào bảng này.</p></div>' +
    '<div class="report-sign"><div><b>Kỹ thuật xác nhận</b><span>Ký, ghi rõ họ tên</span></div><div><b>Quản lý kỹ thuật</b><span>Ký, ghi rõ họ tên</span></div><div><b>Admin/Kế toán</b><span>Ký, ghi rõ họ tên</span></div></div>' +
  '</section>';
}

function printCommissionReport() {
  const printArea = document.getElementById('printArea');
  if (!printArea) return showToast('Không tìm thấy vùng in PDF', 'error');
  printArea.innerHTML = commissionReportHtml();
  window.print();
}

function buildCommissionRuleMap() {
  const map = {};
  (MASTERS.hoaHongTho || []).forEach(function (r) {
    const tech = normalizeKey(r.tech || r['Kỹ thuật'] || r['KỸ THUẬT'] || r.kyThuat || '');
    const model = canonicalModelName(r.model || r.MODEL || r['Model'] || '');
    if (!tech || !model) return;
    map[tech + '|' + model] = r;
  });
  return map;
}

function lookupCommissionAmount(rules, tech, model, group) {
  const row = rules[normalizeKey(tech) + '|' + canonicalModelName(model)];
  if (!row || !group) return 0;
  return parseMoneyValue(getCommissionCellValue_(row, group));
}

function hasCommissionRule(rules, tech, model, group) {
  const row = rules[normalizeKey(tech) + '|' + canonicalModelName(model)];
  if (!row || !group) return false;
  const val = getCommissionCellValue_(row, group);
  return val !== undefined && val !== '' && val !== null;
}

function getCommissionCellValue_(row, group) {
  if (!row || !group) return 0;
  const target = normalizeTextNoAccent(group);
  const keys = Object.keys(row);

  // Ưu tiên đúng header gốc trước.
  if (row[group] !== undefined) return row[group];

  // Sau đó so header đã chuẩn hóa để chịu được khác hoa/thường, dấu, khoảng trắng.
  for (let i = 0; i < keys.length; i++) {
    if (normalizeTextNoAccent(keys[i]) === target) return row[keys[i]];
  }

  return 0;
}

function commissionGroupFromService(serviceName) {
  const clean = canonicalServiceName(serviceName);
  const s = normalizeTextNoAccent(clean);
  if (!s) return '';

  // Ưu tiên vài alias cũ, còn lại trả nguyên tên dịch vụ.
  // Nhờ vậy CT_DICH_VU = tên cột DM_HOA_HONG_THO thì tự tính được,
  // sau này thêm cột mới như Thay màn LK / Thay chân sạc không cần sửa code.
  if (s.includes('fix man')) return 'Fix ảo';
  if (s.includes('phan quang') && !s.includes('thay phan quang')) return 'Thay phản quang';

  return clean;
}

function normalizeTextNoAccent(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ')
    .trim();
}

function uniqueTextList(items) {
  const seen = {};
  const out = [];
  (items || []).forEach(function (x) {
    const clean = titleClean(x);
    const k = normalizeKey(clean);
    if (!clean || seen[k]) return;
    seen[k] = true;
    out.push(clean);
  });
  return out;
}


function initSalaryAuditTab() {
  ['techWorkForm'].forEach(function (id) {
    const f = document.getElementById(id);
    if (f && f.querySelector('input[type="date"]') && !f.querySelector('input[type="date"]').value) {
      f.querySelector('input[type="date"]').value = new Date().toISOString().slice(0, 10);
    }
  });
  const isManager = USER.role === 'admin' || USER.role === 'tech_manager';
  document.querySelectorAll('.salary-manager-only').forEach(function (el) { el.style.display = isManager ? '' : 'none'; });
  updateTechWorkCommissionPreview();
  renderSalaryAudit();
}

function submitTechWork(e) {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form).entries());
  data.actor = USER.name || USER.username || '';
  data.qty = 1;
  apiCall({ action: 'createTechWork', data: data }).then(function (res) {
    if (!res.success) return showToast(res.message || 'Không lưu được công thợ', 'error');
    showToast('Đã lưu công thợ · Hoa hồng ' + fmtMoney(res.commission || 0));
    form.reset();
    refreshAll();
  }).catch(function (err) { showToast(err.message || 'Lỗi lưu công thợ', 'error'); });
}

function submitSentRepair(e) {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form).entries());
  data.name = data.model || data.name || '';
  data.productName = data.model || data.productName || '';
  apiCall({ action: 'createSentRepair', data: data }).then(function (res) {
    if (!res.success) return showToast(res.message || 'Không lưu được máy gửi xử lý', 'error');
    showToast('Đã lưu máy gửi xử lý');
    form.reset();
    refreshAll();
  }).catch(function (err) { showToast(err.message || 'Lỗi lưu máy gửi xử lý', 'error'); });
}


function initSentRepairsTab() {
  const form = document.getElementById('sentRepairForm');
  if (form && form.querySelector('input[type="date"]') && !form.querySelector('input[type="date"]').value) {
    form.querySelector('input[type="date"]').value = new Date().toISOString().slice(0, 10);
  }
  renderSentRepairList();
}

function sentRepairStatusClass_(status) {
  const s = String(status || '').toLowerCase();
  if (s.includes('đã nhận') || s.includes('da nhan')) return 'done';
  if (s.includes('hủy') || s.includes('huy')) return 'danger';
  if (s.includes('chưa nhận') || s.includes('chua nhan')) return 'warn';
  return 'wait';
}

function isSentRepairOpen_(status) {
  const s = normalizeTextNoAccent(status);
  return !s || s.includes('dang gui') || s.includes('chua nhan');
}

function getSentRepairFilteredRows_() {
  const q = normalizeTextNoAccent(document.getElementById('sentRepairKeyword')?.value || '');
  const tech = document.getElementById('sentRepairTechFilter')?.value || '';
  const sender = normalizeTextNoAccent(document.getElementById('sentRepairSenderFilter')?.value || '');
  const status = document.getElementById('sentRepairStatusFilter')?.value || '';
  const showAll = !!document.getElementById('sentRepairShowAll')?.checked;

  return SENT_REPAIRS.filter(function (r) {
    if (!showAll && !status && !isSentRepairOpen_(r.status)) return false;
    if (status && String(r.status || '') !== status) return false;
    if (tech && String(r.technician || '') !== tech) return false;
    if (sender && normalizeTextNoAccent(r.sender || '').indexOf(sender) === -1) return false;

    if (q) {
      const text = normalizeTextNoAccent([r.imei, r.model || r.name, r.process1, r.process2, r.technician, r.sender, r.status].join(' '));
      if (text.indexOf(q) === -1) return false;
    }
    return true;
  }).sort(function (a, b) {
    const ao = isSentRepairOpen_(a.status) ? 0 : 1;
    const bo = isSentRepairOpen_(b.status) ? 0 : 1;
    if (ao !== bo) return ao - bo;
    return (parseAnyDate(b.sentDate || b.createdAt)?.getTime() || 0) - (parseAnyDate(a.sentDate || a.createdAt)?.getTime() || 0);
  });
}

function sentRepairHasTechWork_(r) {
  const key = salaryKey_(r.imei, r.technician);
  return (TECH_WORK || []).some(function (w) {
    return salaryKey_(w.imei, w.technician) === key;
  });
}

function renderSentRepairList() {
  const all = SENT_REPAIRS.slice();
  const rows = getSentRepairFilteredRows_();
  const kpis = document.getElementById('sentRepairKpis');
  if (kpis) {
    const countStatus = function (name) { return all.filter(function (x) { return String(x.status || '') === name; }).length; };
    const matchedCount = all.filter(sentRepairHasTechWork_).length;
    kpis.innerHTML = [
      { label: 'Đang gửi xử lý', value: countStatus('Đang gửi xử lý') },
      { label: 'Chưa nhận', value: countStatus('Chưa nhận') },
      { label: 'Đã nhận', value: countStatus('Đã nhận') },
      { label: 'Đã kê công', value: matchedCount }
    ].map(function (x) { return '<div class="kpi-card mini"><span>' + esc(x.label) + '</span><b>' + esc(x.value) + '</b></div>'; }).join('');
  }

  const el = document.getElementById('sentRepairList');
  if (!el) return;
  const statusOptions = ['Đang gửi xử lý', 'Chưa nhận', 'Đã nhận', 'Hủy'];
  el.innerHTML = '<table><thead><tr>' +
    '<th>Ngày gửi</th><th>IMEI</th><th>Dòng máy</th><th>Xử lý 1</th><th>Xử lý 2</th><th>Kỹ thuật</th><th>Người gửi</th><th>Tại sao chưa nhận</th><th>Trạng thái</th><th>Đối chiếu công</th><th>Cập nhật</th>' +
    '</tr></thead><tbody>' +
    (rows.length ? rows.map(function (r) {
      const rowNo = r.rowNumber || r.rowNo || '';
      const opts = statusOptions.map(function (x) { return '<option value="' + esc(x) + '" ' + (String(r.status || '') === x ? 'selected' : '') + '>' + esc(x) + '</option>'; }).join('');
      const matched = sentRepairHasTechWork_(r);
      return '<tr class="' + (isSentRepairOpen_(r.status) ? 'warn-row' : '') + '">' +
        '<td>' + esc(dateOnly(r.sentDate) || r.sentDate || '') + '</td>' +
        '<td><b>' + esc(r.imei || '') + '</b></td>' +
        '<td><b>' + esc(r.model || r.name || '') + '</b></td>' +
        '<td>' + esc(r.process1 || '') + '</td>' +
        '<td>' + esc(r.process2 || '') + '</td>' +
        '<td>' + esc(r.technician || '') + '</td>' +
        '<td>' + esc(r.sender || '') + '</td>' +
        '<td><input id="srReason_' + rowNo + '" value="' + esc(r.notReceivedReason || '') + '" placeholder="Lý do" /></td>' +
        '<td><select id="srStatus_' + rowNo + '" class="status-pill ' + sentRepairStatusClass_(r.status) + '">' + opts + '</select></td>' +
        '<td>' + (matched ? '<span class="status-pill done">Đã kê công</span>' : '<span class="status-pill wait">Chưa kê công</span>') + '</td>' +
        '<td><button class="ghost-btn" onclick="updateSentRepairRow(' + rowNo + ')">Lưu</button></td>' +
      '</tr>';
    }).join('') : '<tr><td colspan="11">Không có máy gửi xử lý cần hiển thị.</td></tr>') +
    '</tbody></table>';
}

function inputDateValue_(value) {
  if (!value) return '';
  const d = parseAnyDate(value);
  if (!d) return String(value || '').slice(0, 10);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function updateSentRepairRow(rowNumber) {
  const status = document.getElementById('srStatus_' + rowNumber)?.value || '';
  const notReceivedReason = document.getElementById('srReason_' + rowNumber)?.value || '';
  apiCall({ action: 'updateSentRepair', rowNumber: rowNumber, data: { status: status, notReceivedReason: notReceivedReason } })
    .then(function (res) {
      if (!res.success) return showToast(res.message || 'Không cập nhật được máy gửi xử lý', 'error');
      showToast('Đã cập nhật máy gửi xử lý');
      refreshAll();
    })
    .catch(function (err) { showToast(err.message || 'Lỗi cập nhật máy gửi xử lý', 'error'); });
}

function updateTechWorkCommissionPreview() {
  const tech = document.getElementById('techWorkTech')?.value || '';
  const model = document.getElementById('techWorkModel')?.value || '';
  const service = document.getElementById('techWorkService')?.value || '';
  const amount = lookupCommissionAmount(buildCommissionRuleMap(), tech, canonicalModelName(model), service);
  const el = document.getElementById('techWorkCommissionPreview');
  if (el) el.value = fmtMoney(amount || 0);
}

function renderSalaryAudit() {
  const rows = salaryFilteredTechWork();
  const audits = buildSalaryAuditRows();
  const total = rows.reduce(function (s, x) { return s + parseMoneyValue(x.commission || 0); }, 0);
  const matched = audits.filter(x => x.type === 'input' && (x.status.indexOf('✅') === 0)).length;
  const matchedSystem = audits.filter(x => x.type === 'input' && x.source === 'Khách lẻ hệ thống').length;
  const matchedSent = audits.filter(x => x.type === 'input' && x.source === 'Máy gửi xử lý').length;
  const pending = audits.filter(x => x.status.indexOf('⚠️') === 0 || x.status.indexOf('❌') === 0).length;
  const kpi = document.getElementById('salaryKpis');
  if (kpi) {
    kpi.innerHTML = [
      { label: 'Tổng công thợ nhập', value: rows.length },
      { label: 'Hoa hồng tự nhập', value: fmtMoney(total) },
      { label: 'Khớp khách lẻ', value: matchedSystem },
      { label: 'Khớp máy gửi xử lý', value: matchedSent },
      { label: 'Đã khớp nguồn', value: matched },
      { label: 'Cần kiểm tra', value: pending }
    ].map(x => '<div class="kpi-card mini"><span>' + esc(x.label) + '</span><b>' + esc(x.value) + '</b></div>').join('');
  }

  const table = document.getElementById('techWorkTable');
  if (table) {
    table.innerHTML = '<table><thead><tr><th>Ngày</th><th>KTV</th><th>IMEI</th><th>Dòng máy</th><th>Dịch vụ</th><th>SL</th><th>Hoa hồng</th><th>Trạng thái</th><th>Ghi chú</th></tr></thead><tbody>' +
      (rows.length ? rows.map(function (r) {
        return '<tr><td>' + esc(dateOnly(r.date) || r.date || '') + '</td><td>' + esc(r.technician) + '</td><td><b>' + esc(r.imei) + '</b></td><td>' + esc(r.model) + '</td><td>' + esc(r.service) + '</td><td>1</td><td><b>' + fmtMoney(r.commission || 0) + '</b></td><td>' + esc(r.approvalStatus || '') + '</td><td>' + esc(r.note || '') + '</td></tr>';
      }).join('') : '<tr><td colspan="9">Chưa có dữ liệu công thợ.</td></tr>') + '</tbody></table>';
  }

  const auditEl = document.getElementById('salaryAuditTable');
  if (auditEl) {
    auditEl.innerHTML = '<table><thead><tr><th>IMEI</th><th>Kỹ thuật</th><th>Dòng máy</th><th>Dịch vụ</th><th>Nguồn đối chiếu</th><th>Kết luận</th><th>Gợi ý</th></tr></thead><tbody>' +
      (audits.length ? audits.map(function (a) {
        return '<tr class="' + (a.status.indexOf('✅') === 0 ? '' : 'warn-row') + '"><td><b>' + esc(a.imei) + '</b></td><td>' + esc(a.technician) + '</td><td>' + esc(a.model || '') + '</td><td>' + esc(a.service || '') + '</td><td>' + esc(a.source || '') + '</td><td><b>' + esc(a.status) + '</b></td><td>' + esc(a.suggestion || '') + '</td></tr>';
      }).join('') : '<tr><td colspan="7">Chưa có dữ liệu đối chiếu.</td></tr>') + '</tbody></table>';
  }
}

function salaryFilteredTechWork() {
  const techFilter = document.getElementById('salaryTech')?.value || '';
  return TECH_WORK.filter(function (r) {
    if (techFilter && String(r.technician || '') !== techFilter) return false;
    return true;
  });
}

function buildSalaryAuditRows() {
  const techFilter = document.getElementById('salaryTech')?.value || '';
  const inputRows = salaryFilteredTechWork();
  const inputKeys = {};
  inputRows.forEach(function (r) { inputKeys[salaryKey_(r.imei, r.technician)] = true; });

  const systemSources = [];
  const servicesByRepair = {};
  normalizeCtServices(CT_SERVICES).forEach(function (svc) {
    servicesByRepair[svc.repairId] = servicesByRepair[svc.repairId] || [];
    servicesByRepair[svc.repairId].push(svc.name);
  });
  REPAIRS.forEach(function (r) {
    if (!r.imei || !r.technician) return;
    if (techFilter && r.technician !== techFilter) return;
    const services = uniqueTextList((servicesByRepair[r.repairId] && servicesByRepair[r.repairId].length) ? servicesByRepair[r.repairId] : splitItems(r.repairService || ''));
    systemSources.push({ imei: r.imei, technician: r.technician, model: r.product, service: services.join(', '), source: 'Khách lẻ hệ thống' });
  });

  const sentSources = SENT_REPAIRS.filter(function (r) {
    if (techFilter && String(r.technician || '') !== techFilter) return false;
    return true;
  }).map(function (r) { return { imei: r.imei, technician: r.technician, model: r.model || r.name, service: [r.process1, r.process2].filter(Boolean).join(', '), source: 'Máy gửi xử lý' }; });

  const allSources = systemSources.concat(sentSources);
  const sourceKeys = {};
  const sentSourceByImei = {};
  allSources.forEach(function (s) {
    sourceKeys[salaryKey_(s.imei, s.technician)] = s;
    if (s.source === 'Máy gửi xử lý') {
      const imeiKey = imei6_(s.imei);
      if (imeiKey && !sentSourceByImei[imeiKey]) sentSourceByImei[imeiKey] = s;
    }
  });

  const out = [];
  inputRows.forEach(function (r) {
    const imeiKey = imei6_(r.imei);
    const src = sourceKeys[salaryKey_(r.imei, r.technician)] || sentSourceByImei[imeiKey];
    out.push({
      type: 'input', imei: r.imei, technician: r.technician, model: r.model, service: r.service,
      source: src ? src.source : 'Không có nguồn',
      status: src ? (src.source === 'Máy gửi xử lý' ? '✅ Khớp máy gửi xử lý' : '✅ Khớp hệ thống') : '⚠️ Thợ nhập nhưng không có nguồn đối chiếu',
      suggestion: src ? '' : 'Kiểm tra IMEI/KTV hoặc Admin duyệt tay nếu là khách quen ngoài hệ thống'
    });
  });
  allSources.forEach(function (s) {
    if (inputKeys[salaryKey_(s.imei, s.technician)]) return;
    out.push({ type: 'missing', imei: s.imei, technician: s.technician, model: s.model, service: s.service, source: s.source, status: s.source === 'Máy gửi xử lý' ? '⚠️ Máy gửi xử lý nhưng thợ chưa nhập' : '⚠️ Có trong hệ thống nhưng thợ chưa nhập', suggestion: 'Nhắc thợ nhập công hoặc kiểm tra lại KTV' });
  });
  return out;
}

function imei6_(value) {
  const d = String(value || '').replace(/\D/g, '').slice(-6);
  return d ? d.padStart(6, '0') : '';
}

function salaryKey_(imei, tech) { return imei6_(imei) + '|' + normalizeKey(tech); }
function matchMonth_(dateValue, monthVal) {
  if (!monthVal) return true;
  const d = parseAnyDate(dateValue);
  if (!d) return false;
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') === monthVal;
}

function renderMasters() { document.getElementById('masterView').innerHTML = '<table><thead><tr><th>Danh mục</th><th>Số lượng</th></tr></thead><tbody>' + Object.keys(MASTERS).map(k => '<tr><td>' + k + '</td><td>' + (MASTERS[k] || []).length + '</td></tr>').join('') + '</tbody></table>'; }
function esc(v) {
  return String(v == null ? '' : v).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}

function filterCheckList(id, keyword) {
  const q = String(keyword || '').toLowerCase();
  document.querySelectorAll('#' + id + ' .check-row').forEach(function (row) {
    row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

function addMaterialRow(row) {
  window.__materialDraft = window.__materialDraft || [];
  window.__materialDraft.push(row || { billCode: '', name: '', qty: 1, unitPrice: 0, amount: 0, ncc: '' });
  renderMaterialRows();
}

function removeMaterialRow(index) {
  window.__materialDraft.splice(index, 1);
  if (!window.__materialDraft.length) window.__materialDraft.push({ billCode: '', name: '', qty: 1, unitPrice: 0, amount: 0, ncc: '' });
  renderMaterialRows();
}

function renderMaterialRows() {
  const vtOptions = (MASTERS.vatTu || []).map(function (x) { return '<option value="' + esc(x.name) + '">' + esc(x.name) + '</option>'; }).join('');
  const nccOptions = (MASTERS.ncc || []).map(function (x) { return '<option value="' + esc(x) + '">' + esc(x) + '</option>'; }).join('');
  const rows = window.__materialDraft || [];
  document.getElementById('materialRows').innerHTML = rows.map(function (r, i) {
    return '<div class="material-row" data-index="' + i + '">' +
      '<input class="mat-bill" placeholder="Mã bill" value="' + esc(r.billCode || '') + '">' +
      '<select class="mat-name"><option value="">Chọn vật tư</option>' + vtOptions.replace('value="' + esc(r.name || '') + '"', 'value="' + esc(r.name || '') + '" selected') + '</select>' +
      '<input class="mat-qty" type="number" min="1" step="1" value="' + (r.qty || 1) + '" oninput="updateMaterialPreview()">' +
      '<input class="mat-price" type="number" min="0" step="1000" value="' + (r.unitPrice || 0) + '" oninput="updateMaterialPreview()">' +
      '<select class="mat-ncc"><option value="">NCC</option>' + nccOptions.replace('value="' + esc(r.ncc || '') + '"', 'value="' + esc(r.ncc || '') + '" selected') + '</select>' +
      '<button type="button" class="ghost-btn" onclick="removeMaterialRow(' + i + ')">Xóa</button>' +
    '</div>';
  }).join('');
  updateMaterialPreview();
}

function collectMaterialRows() {
  return Array.from(document.querySelectorAll('#materialRows .material-row')).map(function (row) {
    const qty = Number(row.querySelector('.mat-qty').value || 1);
    const unitPrice = Number(row.querySelector('.mat-price').value || 0);
    return {
      billCode: row.querySelector('.mat-bill').value.trim(),
      name: row.querySelector('.mat-name').value.trim(),
      qty: qty,
      unitPrice: unitPrice,
      amount: qty * unitPrice,
      ncc: row.querySelector('.mat-ncc').value.trim()
    };
  }).filter(function (x) { return x.name; });
}

function updateMaterialPreview() {
  if (!document.getElementById('materialTotalPreview')) return;
  const materialTotal = collectMaterialRows().reduce((s, x) => s + Number(x.amount || 0), 0);
  const labor = Number(document.querySelector('#costForm input[name="laborCost"]')?.value || 0);
  document.getElementById('materialTotalPreview').textContent = fmtMoney(materialTotal);
  document.getElementById('totalCostPreview').textContent = fmtMoney(materialTotal + labor);
}

function clearRepairFilters() { ['repairQ','repairBranch','repairStatus','repairTech','repairFrom','repairTo'].forEach(function (id) { const el = document.getElementById(id); if (el) el.value = ''; }); renderRepairTable(); }


function getTabSubtitle(tab) {
  const map = {
    overview: 'Executive dashboard - nhìn 10 giây nắm toàn bộ vận hành',
    repairs: 'CRM sửa chữa - lọc, xem timeline, kiểm tra trạng thái từng máy',
    status: 'Repair board - ưu tiên máy quá hẹn, chờ linh kiện và đang sửa',
    cost: 'Kiểm soát chi phí, thực thu và lợi nhuận theo quyền',
    materials: 'Theo dõi vật tư sử dụng và nhà cung cấp',
    commission: 'Tổng hợp hoa hồng kỹ thuật',
    salaryAudit: 'Đối chiếu công thợ nhập với dữ liệu hệ thống',
    sentRepairs: 'Theo dõi máy gửi xử lý ngoài luồng',
    weeklyReport: 'Báo cáo tuần/tháng để in hoặc trình sếp',
    masters: 'Danh mục nền của hệ thống'
  };
  return map[tab] || 'POPOPHONE Repair Operation Center';
}

function applySavedTheme() {
  const theme = localStorage.getItem('popo_os_theme') || 'light';
  document.body.classList.toggle('dark-mode', theme === 'dark');
  setTimeout(function () {
    const btn = document.querySelector('.theme-toggle');
    if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  }, 0);
}

function toggleTheme() {
  const next = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
  localStorage.setItem('popo_os_theme', next);
  applySavedTheme();
}

function updateExecutiveDashboard(d, isMoneyHidden) {
  const name = USER?.name || USER?.username || 'POPO';
  setText('heroGreeting', 'Xin chào ' + name + ' 👋 · ' + (d.periodLabel || 'tổng quan'));
  setText('execReceivedLabel', 'Tổng đơn ' + (d.periodLabel || 'trong kỳ'));
  setText('heroSummary', executiveSummaryText(d, isMoneyHidden));
  setText('heroScore', d.healthScore + '/100');
  setText('sidebarHealth', d.healthScore + '/100');
  setText('execTodayReceived', d.periodOrders || 0);
  setText('execInProgress', d.inProgress || 0);
  setText('execOverdue', d.overdue || 0);
  if (isMoneyHidden) {
    setText('execMoneyLabel', 'Đã giao trong kỳ');
    setText('execMoneyValue', d.returned || 0);
    setText('execMoneyNote', 'Ẩn doanh thu theo phân quyền');
  } else {
    setText('execMoneyLabel', 'Doanh thu trong kỳ');
    setText('execMoneyValue', fmtMoney(d.periodRevenue || 0));
    setText('execMoneyNote', USER.role === 'admin' ? 'Lợi nhuận trong kỳ: ' + fmtMoney(d.periodProfit || 0) : 'Doanh thu theo dữ liệu thực thu');
  }
  const alerts = [
    { title: 'Máy quá hẹn', note: 'Cần gọi KTV / báo khách', count: d.overdue || 0, level: 'danger' },
    { title: 'Chờ linh kiện', note: 'Kiểm tra vật tư/NCC', count: d.waitingPart || 0, level: 'warn' },
    { title: 'Tồn quá 3 ngày', note: 'Rà lại nguyên nhân tồn', count: d.stuck || 0, level: (d.stuck ? 'warn' : '') },
    { title: 'Bảo hành lại', note: 'Theo dõi chất lượng sửa', count: d.warrantyBack || 0, level: (d.warrantyBack ? 'danger' : '') }
  ];
  const alertEl = document.getElementById('execAlerts');
  if (alertEl) alertEl.innerHTML = alerts.map(function (a) {
    return '<div class="command-item ' + a.level + '"><div><b>' + esc(a.title) + '</b><span>' + esc(a.note) + '</span></div><div class="command-count">' + esc(a.count) + '</div></div>';
  }).join('');
  const topService = (d.topServices || [])[0] || { name: 'Chưa có dữ liệu', count: 0 };
  const topModel = (d.topModels || [])[0] || { name: 'Chưa có dữ liệu', count: 0 };
  const topTech = (d.techKpi || []).slice().sort(function(a,b){return (b.done||0)-(a.done||0);})[0] || { name: 'Chưa có KTV', done: 0, overdue: 0 };
  const topType = (d.serviceTypes || [])[0] || { name: 'Chưa có dữ liệu', count: 0 };
  const insights = [
    { label: 'Dịch vụ chạy nhất', value: topService.name, note: topService.count + ' phiếu' },
    { label: 'Dòng máy nhiều nhất', value: topModel.name, note: topModel.count + ' phiếu' },
    { label: 'KTV nổi bật', value: topTech.name, note: (topTech.done || 0) + ' hoàn thành · QH ' + (topTech.overdue || 0) },
    { label: 'Loại dịch vụ chính', value: topType.name, note: topType.count + ' phiếu' }
  ];
  const insightEl = document.getElementById('execInsights');
  if (insightEl) insightEl.innerHTML = insights.map(function (x) {
    return '<div class="insight-card"><span>' + esc(x.label) + '</span><b>' + esc(x.value) + '</b><small>' + esc(x.note) + '</small></div>';
  }).join('');
}

function executiveSummaryText(d, isMoneyHidden) {
  const issues = [];
  if (d.overdue) issues.push(d.overdue + ' máy quá hẹn');
  if (d.waitingPart) issues.push(d.waitingPart + ' máy chờ linh kiện');
  if (d.stuck) issues.push(d.stuck + ' máy tồn quá 3 ngày');
  if (!issues.length) return 'Phạm vi ' + (d.periodLabel || 'đang chọn') + ' có ' + (d.periodOrders || 0) + ' phiếu, đang xử lý ' + (d.inProgress || 0) + ' máy.';
  return 'Cần xử lý: ' + issues.join(', ') + '. ' + (isMoneyHidden ? 'Doanh thu đang ẩn theo phân quyền.' : 'Doanh thu trong kỳ ' + fmtMoney(d.periodRevenue || 0) + '.');
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function buildLocalDashboard(data, options) {
  options = options || {};
  data = Array.isArray(data) ? data : [];
  const todayDate = options.referenceDate instanceof Date ? options.referenceDate : new Date();
  const currentYear = todayDate.getFullYear();
  const currentMonth = todayDate.getMonth() + 1;
  const currentWeek = Math.ceil(todayDate.getDate() / 7);

  const top = {}, models = {}, types = {}, tech = {}, mats = {}, matrix = { models: [], services: [], values: {} };
  let revenue = 0, profit = 0, periodCost = 0, inProgress = 0, completed = 0, waitingPart = 0, returned = 0, overdue = 0, warrantyBack = 0, stuck = 0;
  let todayReceived = 0, todayOrders = 0, weekOrders = 0, monthOrders = 0, todayRevenue = 0, weekRevenue = 0, monthRevenue = 0, monthCost = 0, monthProfit = 0;
  const weeklyMap = {};
  [1, 2, 3, 4, 5].forEach(function (w) { weeklyMap[w] = { week: w, count: 0, revenue: 0, profit: 0 }; });

  const repairMap = {};
  const repairIds = {};
  data.forEach(function (r) {
    repairIds[r.repairId] = true;
    repairMap[r.repairId] = r;
  });

  data.forEach(function (r) {
    const rowDate = parseAnyDate(r.date || r.createdAt);
    const rowYear = Number(r.year || (rowDate ? rowDate.getFullYear() : currentYear));
    const rowMonth = Number(r.month || (rowDate ? rowDate.getMonth() + 1 : currentMonth));
    const rowWeek = Number(r.week || (rowDate ? Math.ceil(rowDate.getDate() / 7) : currentWeek));
    const rowRevenue = parseMoneyValue(r.actualRevenue || 0);
    const rowCost = parseMoneyValue(r.totalCost || 0);
    const rowProfit = parseMoneyValue(r.profit || (rowRevenue - rowCost));

    revenue += rowRevenue;
    profit += rowProfit;
    periodCost += rowCost;
    if (['2.', '3.', '4.', '5.'].some(function (s) { return String(r.status).startsWith(s); })) inProgress++;
    if (String(r.status).startsWith('7.')) completed++;
    if (String(r.status).startsWith('6.')) waitingPart++;
    if (String(r.status).startsWith('8.')) returned++;
    if (r.overdue === 'Có') overdue++;
    if (String(r.status).startsWith('10.')) warrantyBack++;
    if (rowDate && daysBetween(rowDate, todayDate) > 3 && !String(r.status).startsWith('8.')) stuck++;

    if (isSameDay(rowDate, todayDate)) {
      todayReceived++;
      todayOrders++;
      todayRevenue += rowRevenue;
    }

    if (rowYear === currentYear && rowMonth === currentMonth) {
      monthOrders++;
      monthRevenue += rowRevenue;
      monthCost += rowCost;
      monthProfit += rowProfit;
      if (weeklyMap[rowWeek]) {
        weeklyMap[rowWeek].count++;
        weeklyMap[rowWeek].revenue += rowRevenue;
        weeklyMap[rowWeek].profit += rowProfit;
      }
      if (rowWeek === currentWeek) {
        weekOrders++;
        weekRevenue += rowRevenue;
      }
    }

    types[r.serviceType || 'Khác'] = (types[r.serviceType || 'Khác'] || 0) + 1;
    const modelName = canonicalModelName(r.product || 'Khác');
    models[modelName] = (models[modelName] || 0) + 1;

    if (r.technician) {
      tech[r.technician] = tech[r.technician] || { name: r.technician, done: 0, overdue: 0 };
      if (String(r.status).startsWith('7.') || String(r.status).startsWith('8.')) tech[r.technician].done++;
      if (r.overdue === 'Có') tech[r.technician].overdue++;
    }
  });

  // Top dịch vụ + ma trận phải đếm theo MÃ SỬA CHỮA DUY NHẤT.
  // Nguyên tắc V10.1:
  // 1) DATA.Dịch vụ sửa chữa là nguồn chính.
  // 2) CT_DICH_VU chỉ bù cho đơn chưa có DATA service.
  // 3) Nếu đơn có vật tư rõ ràng nhưng thiếu dịch vụ tương ứng, tự suy luận dịch vụ từ vật tư.
  //    Ví dụ: Pin DLC/Pin DLC Maxe/Pin DLC Gold => Thay pin KSC DLC.
  // Như vậy Nhu cầu vật tư 70 phiếu dùng pin thì Top dịch vụ thay pin không bị hụt 65.
  const serviceRepairSets = {};
  const matrixRepairSets = {};
  const repairsWithDataService = {};
  const repairServiceKeys = {};

  function addServiceStat(repairId, model, serviceName) {
    repairId = String(repairId || '').trim();
    const name = canonicalServiceName(serviceName);
    if (!repairId || !name) return;
    const serviceKey = normalizeKey(name);
    if (!serviceRepairSets[serviceKey]) serviceRepairSets[serviceKey] = { name: name, ids: new Set() };
    serviceRepairSets[serviceKey].ids.add(repairId);

    const matrixKey = canonicalModelName(model || 'Khác') + '|' + name;
    if (!matrixRepairSets[matrixKey]) matrixRepairSets[matrixKey] = new Set();
    matrixRepairSets[matrixKey].add(repairId);

    repairServiceKeys[repairId] = repairServiceKeys[repairId] || {};
    repairServiceKeys[repairId][serviceKey] = true;
  }

  data.forEach(function (r) {
    const services = splitItems(r.repairService || '');
    if (services.length) repairsWithDataService[r.repairId] = true;
    services.forEach(function (svc) {
      addServiceStat(r.repairId, r.product || 'Khác', svc);
    });
  });

  normalizeCtServices(CT_SERVICES).filter(function (x) {
    return repairIds[x.repairId] && !repairsWithDataService[x.repairId];
  }).forEach(function (svc) {
    const r = repairMap[svc.repairId] || {};
    addServiceStat(svc.repairId, r.product || 'Khác', svc.name);
  });

  // Vật tư: ưu tiên CT_VAT_TU để lấy đúng SL; nếu CT thiếu thì bù từ DATA.Tên vật tư.
  // Không bỏ qua vật tư chưa có trong danh mục, để thống kê không bị hụt số.
  const materialMap = {};
  const supplierMap = {};
  function ensureMaterialBucket(name, group) {
    name = canonicalMaterialName(name);
    if (!name) return null;
    const key = normalizeKey(name);
    if (!materialMap[key]) {
      materialMap[key] = { name: name, group: group || '', repairIds: new Set(), totalQty: 0 };
    }
    return materialMap[key];
  }

  (MASTERS.vatTu || []).forEach(function (m) {
    ensureMaterialBucket(m.name || m['Tên vật tư'] || '', m.group || m['Nhóm vật tư'] || '');
  });

  const repairsWithCtMaterial = {};
  const materialsByRepair = {};

  function rememberRepairMaterial(repairId, name) {
    repairId = String(repairId || '').trim();
    name = canonicalMaterialName(name);
    if (!repairId || !name) return;
    materialsByRepair[repairId] = materialsByRepair[repairId] || [];
    materialsByRepair[repairId].push(name);
  }

  function addSupplierStat(repairId, ncc, materialName, qty, amount) {
    repairId = String(repairId || '').trim();
    materialName = canonicalMaterialName(materialName);
    ncc = String(ncc || '').trim() || 'Chưa khai báo';
    qty = Number(qty || 1) || 1;
    amount = Number(amount || 0) || 0;
    if (!repairId || !materialName) return;
    const key = normalizeKey(ncc);
    if (!supplierMap[key]) {
      supplierMap[key] = { ncc: ncc, repairIds: new Set(), totalQty: 0, totalCost: 0, materials: {} };
    }
    const bucket = supplierMap[key];
    bucket.repairIds.add(repairId);
    bucket.totalQty += qty;
    bucket.totalCost += amount;
    const matKey = normalizeKey(materialName);
    if (!bucket.materials[matKey]) bucket.materials[matKey] = { name: materialName, qty: 0, amount: 0 };
    bucket.materials[matKey].qty += qty;
    bucket.materials[matKey].amount += amount;
  }

  normalizeCtMaterials(CT_MATERIALS).filter(function (x) { return repairIds[x.repairId]; }).forEach(function (mat) {
    const bucket = ensureMaterialBucket(mat.name, '');
    if (!bucket) return;
    const qty = Number(mat.qty || 1) || 1;
    bucket.totalQty += qty;
    bucket.repairIds.add(mat.repairId);
    repairsWithCtMaterial[mat.repairId] = true;
    rememberRepairMaterial(mat.repairId, mat.name);
    const r = repairMap[mat.repairId] || {};
    addSupplierStat(mat.repairId, mat.ncc || r.ncc, mat.name, qty, Number(mat.amount || 0));
  });

  data.forEach(function (r) {
    if (repairsWithCtMaterial[r.repairId]) return;
    const materialParts = splitItems(r.materialName || '');
    materialParts.forEach(function (name, idx) {
      const bucket = ensureMaterialBucket(name, '');
      if (!bucket) return;
      bucket.totalQty += 1;
      bucket.repairIds.add(r.repairId);
      rememberRepairMaterial(r.repairId, name);
      addSupplierStat(r.repairId, r.ncc, name, 1, idx === 0 ? Number(r.materialCost || 0) : 0);
    });
  });

  // Bù thống kê dịch vụ/ma trận từ vật tư thực dùng.
  // Chỉ thêm khi đơn chưa có dịch vụ cùng nhóm, tránh double-count.
  Object.keys(materialsByRepair).forEach(function (repairId) {
    const r = repairMap[repairId] || {};
    const inferred = inferServicesFromMaterials(materialsByRepair[repairId], r.request || '');
    inferred.forEach(function (svc) {
      const groupKey = serviceGroupKey(svc);
      const existing = repairServiceKeys[repairId] || {};
      const alreadyHasGroup = Object.keys(existing).some(function (k) { return serviceGroupKey(k) === groupKey; });
      if (!alreadyHasGroup) addServiceStat(repairId, r.product || 'Khác', svc);
    });
  });

  Object.values(serviceRepairSets).forEach(function (x) {
    top[x.name] = x.ids.size;
  });
  Object.keys(matrixRepairSets).forEach(function (k) {
    matrix.values[k] = matrixRepairSets[k].size;
  });

  matrix.models = Object.keys(models).map(canonicalModelName).filter(Boolean).sort(naturalSort);
  matrix.services = Object.keys(top).sort(function (a, b) { return top[b] - top[a]; });

  const materialRows = Object.values(materialMap).map(function (x) {
    return {
      name: x.name,
      group: x.group || '',
      repairCount: x.repairIds.size,
      totalQty: x.totalQty,
      suggest: Math.ceil(x.totalQty / 5) * 5
    };
  }).filter(function (x) { return x.totalQty > 0; }).sort(function (a, b) { return b.totalQty - a.totalQty; });

  const supplierRows = Object.values(supplierMap).map(function (x) {
    return {
      ncc: x.ncc,
      repairCount: x.repairIds.size,
      totalQty: x.totalQty,
      totalCost: x.totalCost,
      materials: x.materials
    };
  }).filter(function (x) { return x.totalQty > 0 || x.totalCost > 0; })
    .sort(function (a, b) { return Number(b.totalCost || 0) - Number(a.totalCost || 0) || Number(b.totalQty || 0) - Number(a.totalQty || 0); });

  const healthScore = Math.max(0, Math.min(100, 100 - (overdue * 8) - (waitingPart * 4) - (stuck * 6) - (warrantyBack * 5)));

  const periodLabel = options.periodLabel || 'toàn bộ dữ liệu';
  const weekTitle = '3. Doanh thu theo tuần · tháng ' + String(currentMonth).padStart(2, '0') + '/' + currentYear;
  if (options.periodLabel) setText('weekChartTitle', weekTitle);

  return {
    healthScore: healthScore,
    periodLabel: periodLabel,
    periodOrders: data.length,
    periodRevenue: revenue,
    periodCost: periodCost,
    periodProfit: profit,
    todayReceived: todayReceived,
    todayOrders: todayOrders,
    weekOrders: weekOrders,
    monthOrders: monthOrders,
    todayRevenue: todayRevenue,
    weekRevenue: weekRevenue,
    monthRevenue: monthRevenue,
    monthCost: monthCost,
    monthProfit: monthProfit,
    avgTicket: data.length ? Math.round(revenue / data.length) : 0,
    todayCount: todayReceived,
    revenue: revenue,
    profit: profit,
    inProgress: inProgress,
    completed: completed,
    waitingPart: waitingPart,
    returned: returned,
    overdue: overdue,
    warrantyBack: warrantyBack,
    stuck: stuck,
    weekly: Object.values(weeklyMap),
    serviceTypes: toRows(types),
    topServices: toRows(top),
    topModels: toRows(models),
    techKpi: Object.values(tech),
    materials: materialRows,
    supplierStats: supplierRows,
    matrix: matrix
  };
}

function normalizeKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}


function titleClean(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function canonicalModelName(value) {
  const raw = titleClean(value).toUpperCase();
  if (!raw) return 'Khác';
  return raw
    .replace(/\s+/g, '')
    .replace(/PRO MAX/g, 'PROMAX')
    .replace(/PM$/g, 'PROMAX');
}

function canonicalServiceName(value) {
  return titleClean(value);
}

function canonicalMaterialName(value) {
  return titleClean(value);
}

function serviceGroupKey(value) {
  const s = normalizeKey(value);
  if (s.includes('pin')) return 'pin';
  if (s.includes('màn') || s.includes('man')) return 'man-hinh';
  if (s.includes('kính') || s.includes('kinh')) return 'kinh';
  if (s.includes('lưng') || s.includes('lung') || s.includes('vỏ') || s.includes('vo')) return 'vo-lung';
  if (s.includes('cam')) return 'camera';
  if (s.includes('loa')) return 'loa';
  if (s.includes('sạc') || s.includes('sac')) return 'sac';
  if (s.includes('face')) return 'faceid';
  return s;
}

function inferServicesFromMaterials(materials, requestText) {
  const text = normalizeKey([].concat(materials || []).join(' ') + ' ' + (requestText || ''));
  const out = [];

  if (text.includes('pin')) {
    if (text.includes('dlc') || text.includes('ksc') || text.includes('maxe')) out.push('Thay pin KSC DLC');
    else if (text.includes('bison')) out.push('Thay pin Bison');
    else if (text.includes('energizer')) out.push('Thay pin Energizer');
    else if (text.includes('pisen')) out.push('Thay pin Pisen DLC');
    else out.push('Thay pin');
  }
  if (text.includes('màn') || text.includes('man')) {
    if (text.includes('lk')) out.push('Thay màn LK');
    else if (text.includes('zin') || text.includes('ek')) out.push('Thay màn zin EK');
    else out.push('Thay màn');
  }
  if (text.includes('kính cam') || text.includes('kinh cam')) out.push('Thay kính cam');
  if ((text.includes('lưng') || text.includes('lung')) && (text.includes('mắt nhỏ') || text.includes('mat nho'))) out.push('Thay lưng mắt nhỏ');
  else if ((text.includes('lưng') || text.includes('lung')) && (text.includes('mắt to') || text.includes('mat to'))) out.push('Thay lưng mắt to');
  else if (text.includes('lưng') || text.includes('lung')) out.push('Thay lưng');
  if (text.includes('vỏ') || text.includes('vo')) out.push('Thay vỏ');
  if (text.includes('loa')) out.push('Thay loa trên');
  if (text.includes('chân sạc') || text.includes('chan sac') || text.includes('cụm sạc') || text.includes('cum sac')) out.push('Thay chân sạc');
  if (text.includes('face')) out.push('Sửa FaceID');

  const seen = {};
  return out.filter(function (x) {
    const k = normalizeKey(x);
    if (seen[k]) return false;
    seen[k] = true;
    return true;
  });
}

function normalizeCtServices(rows) {
  return (rows || []).map(function (x) {
    return {
      repairId: x.repairId || x['Mã sửa chữa'],
      name: String(x.name || x['Tên dịch vụ'] || '').trim(),
      price: parseMoneyValue(x.price || x['Giá bán'] || 0)
    };
  }).filter(function (x) { return x.repairId && x.name; });
}

function normalizeCtMaterials(rows) {
  return (rows || []).map(function (x) {
    return {
      repairId: x.repairId || x['Mã sửa chữa'],
      billCode: x.billCode || x['Mã bill mua vật tư'] || x['Mã hóa đơn mua vật tư'] || '',
      name: String(x.name || x['Tên vật tư'] || '').trim(),
      qty: Number(x.qty || x.SL || x['SL'] || 1) || 1,
      unitPrice: parseMoneyValue(x.unitPrice || x['Đơn giá'] || 0),
      amount: parseMoneyValue(x.amount || x['Thành tiền'] || 0),
      ncc: String(x.ncc || x.NCC || x['NCC'] || '').trim()
    };
  }).filter(function (x) { return x.repairId && x.name; });
}

function parseAnyDate(v) {
  if (!v) return null;
  if (v instanceof Date) return v;
  const s = String(v);
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2}))?/);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), Number(m[4] || 0), Number(m[5] || 0));
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function isSameDay(a, b) {
  return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function daysBetween(a, b) {
  return Math.floor((b.getTime() - a.getTime()) / 86400000);
}

function toRows(obj) { return Object.keys(obj).map(k => ({ name: k, count: obj[k] })).sort((a,b)=>Number(b.count)-Number(a.count)); }
function naturalSort(a,b) { return String(a).localeCompare(String(b), 'vi', { numeric: true }); }
function statusClass(status) { const s = String(status || ''); if (s.includes('7.') || s.includes('8.')) return 'done'; if (s.includes('6.') || s.includes('3.') || s.includes('4.')) return 'wait'; if (s.includes('9.') || s.includes('10.') || s.includes('11.')) return 'danger'; return ''; }


function receiptStatusCell(label, value) {
  const v = esc(value || 'Chưa test');
  const cls = String(value || '').toLowerCase().includes('lỗi') ? 'bad' : (String(value || '').toLowerCase().includes('không') ? 'warn' : 'ok');
  return '<div class="receipt-test ' + cls + '"><span>' + label + '</span><b>' + v + '</b></div>';
}

function printReceipt(r, type) {
  const title = type === 'return' ? 'PHIẾU TRẢ MÁY' : 'PHIẾU TIẾP NHẬN SỬA CHỮA';
  const printArea = document.getElementById('printArea');
  const dateText = r.date || r.createdAt || new Date().toLocaleString('vi-VN');
  const estimate = fmtMoney(r.estimate || r.actualRevenue || 0);
  printArea.innerHTML = '<section class="receipt-sheet">' +
    '<div class="receipt-top">' +
      '<div><div class="receipt-logo">P</div><h1>POPOPHONE</h1><p>Trung tâm tiếp nhận sửa chữa</p></div>' +
      '<div class="receipt-code"><span>Mã sửa chữa</span><b>' + esc(r.repairId || '') + '</b><small>' + esc(dateTime(dateText) || dateText) + '</small></div>' +
    '</div>' +
    '<h2>' + title + '</h2>' +
    '<div class="receipt-grid">' +
      '<div><span>Chi nhánh nhận</span><b>CN ' + esc(r.branch || '') + '</b></div>' +
      '<div><span>Nhân viên nhận</span><b>' + esc(r.staff || r.receiver || r.receiveStaff || '') + '</b></div>' +
      '<div><span>Khách hàng</span><b>' + esc(r.customer || '') + '</b></div>' +
      '<div><span>Số điện thoại</span><b>' + esc(r.phone || '') + '</b></div>' +
      '<div><span>Dòng máy</span><b>' + esc(r.product || '') + '</b></div>' +
      '<div><span>IMEI / Serial</span><b>' + esc(r.imei || '') + '</b></div>' +
      '<div><span>Loại dịch vụ</span><b>' + esc(r.serviceType || '') + '</b></div>' +
      '<div><span>Hẹn trả</span><b>' + esc(dateTime(r.appointment || '') || 'Chưa hẹn') + '</b></div>' +
    '</div>' +
    '<div class="receipt-box"><span>Tình trạng khi nhận</span><p>' + esc(r.receiveStatus || '') + '</p></div>' +
    '<div class="receipt-box"><span>Yêu cầu sửa chữa</span><p>' + esc(r.request || r.repairService || '') + '</p></div>' +
    '<div class="receipt-box"><span>Ghi chú tiếp nhận</span><p>' + esc(r.receiveNote || 'Không có') + '</p></div>' +
    '<div class="receipt-tests">' + receiptStatusCell('FaceID', r.faceId) + receiptStatusCell('Màn hình', r.screen) + receiptStatusCell('Camera/Mic', r.cameraMic) + receiptStatusCell('Loa', r.speaker) + '</div>' +
    '<div class="receipt-price"><span>Giá dự kiến / Báo giá</span><b>' + estimate + '</b></div>' +
    '<ul class="receipt-note"><li>Phiếu này dùng để đối chiếu khi nhận/trả máy.</li><li>Báo giá có thể thay đổi sau khi kỹ thuật kiểm tra thực tế và sẽ báo khách trước khi sửa.</li><li>Khách vui lòng kiểm tra lại chức năng máy khi nhận lại.</li></ul>' +
    '<div class="receipt-sign"><div><b>Khách hàng</b><span>Ký, ghi rõ họ tên</span></div><div><b>Nhân viên tiếp nhận</b><span>Ký, ghi rõ họ tên</span></div></div>' +
  '</section>';
  window.print();
}

function printRepairReceipt(id) {
  const local = REPAIRS.find(function (x) { return x.repairId === id; });
  if (local) return printReceipt(local, 'receive');
  apiCall({ action: 'getDetail', repairId: id }).then(function (res) {
    if (!res.data) return showToast('Không tìm thấy phiếu để in', 'error');
    printReceipt(res.data, 'receive');
  });
}

document.addEventListener('DOMContentLoaded', initDashboard);
