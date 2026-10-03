const APPS_SCRIPT_URL = (process.env.REPAIR_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbyHAJ31ObeKGW8Xttu8KMpgrGuY3zSCTH66gKuY8qfLYuYYLepEZj0hnddsZon8h_X-8g/exec').trim();

exports.handler = async function(event) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  };

  if (event.httpMethod === 'GET') {
    try {
      const res = await fetch(APPS_SCRIPT_URL, { method: 'GET', redirect: 'follow' });
      const text = await res.text();
      return { statusCode: res.ok ? 200 : 502, headers, body: text };
    } catch (err) {
      return { statusCode: 502, headers, body: JSON.stringify({ success:false, code:'PROXY_FETCH_FAILED', message:'Netlify không kết nối được Apps Script: ' + (err.message || String(err)) }) };
    }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ success:false, message:'Method not allowed' }) };
  }

  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),20000);
  try {
    let rawBody = event.body || '{}';
    if (event.isBase64Encoded) rawBody = Buffer.from(rawBody, 'base64').toString('utf8');

    // Xác minh body là JSON trước khi chuyển tiếp để lỗi hiện rõ ở frontend.
    JSON.parse(rawBody || '{}');

    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: rawBody,
      signal:controller.signal,
      redirect: 'follow'
    });
    const text = await res.text();

    if (!res.ok) {
      return { statusCode: res.status===504?504:502, headers, body: JSON.stringify({ success:false, code:'APPS_SCRIPT_HTTP_' + res.status, message:(res.status === 404 ? 'Apps Script 404: sai Web App deployment URL. Kiểm tra REPAIR_APPS_SCRIPT_URL hoặc URL fallback trong function.' : 'Apps Script HTTP ' + res.status), response:text.slice(0,500) }) };
    }

    // Apps Script phải trả JSON; nếu trả HTML thì biến thành lỗi JSON có mô tả.
    try {
      JSON.parse(text);
      return { statusCode: 200, headers, body: text };
    } catch (_) {
      return { statusCode: 502, headers, body: JSON.stringify({ success:false, code:'APPS_SCRIPT_NOT_JSON', message:'Apps Script không trả JSON. Kiểm tra deployment/quyền truy cập.', response:text.slice(0,500) }) };
    }
  } catch (err) {
    const timedOut=err.name==='AbortError';
    return { statusCode: timedOut?504:502, headers, body: JSON.stringify({ success:false, code:timedOut?'API_TIMEOUT':'PROXY_ERROR', message:timedOut?'API phản hồi quá lâu. Vui lòng thử lại.':err.message || String(err) }) };
  } finally {clearTimeout(timer);}
};
