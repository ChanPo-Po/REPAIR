function currentUser() {
  try {
    return JSON.parse(localStorage.getItem('repairUser') || 'null');
  } catch (e) {
    return null;
  }
}

function requireLogin() {
  const user = currentUser();
  if (!user) window.location.href = 'login.html';
  return user;
}

function logout() {
  localStorage.removeItem('repairUser');
  window.location.href = 'login.html';
}

function setupLogin() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const account = USERS[username];

    if (!account || account.password !== password) {
      showToast('Sai tài khoản hoặc mật khẩu', 'error');
      return;
    }

    const user = {
      username: username,
      role: account.role,
      name: account.name,
      home: account.home
    };

    localStorage.setItem('repairUser', JSON.stringify(user));
    window.location.href = 'dashboard.html';
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
