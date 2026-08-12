function currentUser() {
  try {
    return JSON.parse(localStorage.getItem('repairUser') || 'null');
  } catch (e) {
    return null;
  }
}

function requireLogin() {
  const user = currentUser();
  if (!user) {
    window.location.replace('index.html');
    return null;
  }
  return user;
}

function logout() {
  localStorage.removeItem('repairUser');
  window.location.replace('index.html');
}

function setupLogin() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const btn = form.querySelector('button[type="submit"]');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Đang đăng nhập...';
    }

    apiCall({ action: 'login', username: username, password: password }, { timeoutMs: 15000 })
      .then(function (res) {
        if (!res || !res.success) throw new Error((res && res.message) || 'Sai tài khoản hoặc mật khẩu');
        const user = {
          username: res.user.username,
          role: res.user.role,
          name: res.user.name,
          home: res.user.home,
          token: res.token,
          loginAt: Date.now()
        };
        localStorage.setItem('repairUser', JSON.stringify(user));
        window.location.href = 'dashboard.html';
      })
      .catch(function (err) {
        // Chỉ dùng fallback khi cố ý bật LOCAL_AUTH_FALLBACK để test offline.
        if (typeof LOCAL_AUTH_FALLBACK !== 'undefined' && LOCAL_AUTH_FALLBACK && USERS && USERS[username] && USERS[username].password === password) {
          const account = USERS[username];
          localStorage.setItem('repairUser', JSON.stringify({ username: username, role: account.role, name: account.name, home: account.home, token: 'LOCAL_DEMO' }));
          window.location.href = 'dashboard.html';
          return;
        }
        showToast(err.message || 'Sai tài khoản hoặc mật khẩu', 'error');
      })
      .finally(function () {
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Đăng nhập';
        }
      });
  });
}

function showToast(message, type) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.className = 'toast show ' + (type || 'success');
  setTimeout(function () {
    toast.className = 'toast';
  }, 2600);
}

document.addEventListener('DOMContentLoaded', setupLogin);
