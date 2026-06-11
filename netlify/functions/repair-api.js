exports.handler = async function(event) {
  const GAS_URL = process.env.GAS_REPAIR_URL || "DAN_LINK_APPS_SCRIPT_EXEC_VAO_DAY";

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json; charset=utf-8"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ ok: false, message: "Method not allowed" }) };
  }

  try {
    if (!GAS_URL || GAS_URL.includes("DAN_LINK_APPS_SCRIPT")) {
      return { statusCode: 500, headers, body: JSON.stringify({ ok: false, message: "Chưa cấu hình GAS_REPAIR_URL" }) };
    }

    const gasRes = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: event.body || "{}"
    });

    const text = await gasRes.text();

    try { JSON.parse(text); }
    catch (e) {
      return { statusCode: 502, headers, body: JSON.stringify({ ok:false, message:"Apps Script không trả JSON", response:text.slice(0,500) }) };
    }

    return { statusCode: 200, headers, body: text };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok:false, message:String(err) }) };
  }
};