exports.handler = async function(event) {
  const GAS_URL = process.env.GAS_REPAIR_URL || "https://script.googleusercontent.com/macros/echo?user_content_key=AUkAhnTxwKcr6a5p9GJPhdwcEgO9GlHdF6cn49ceXbaNtglbpb96sgcBCO3TGs9uyCjB92-MqyYSR5Q6tFZnJxH7geZWH24796QOLeOfYNAGIrOEuZF-Euip-QjBW-1jx_Z_8DcYWrKHpsd6cCW4oFoaNlwptACBF7xL87PlTeRJERNv9UvNY6May7nYFrxHXCdsayd-UFvYr-GhMqQkjFaMtGY_ujkugVDYgxdV0KJminIDKy4zal0jFS6ui1V617MysxKa-4mQC9X4h988qL0xGN86-4txUw&lib=M_uGOmSivXgM1zcADwnUjLhurfQGjr4wS";

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
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ ok: false, message: "Method not allowed" })
    };
  }

  try {
    if (!GAS_URL || GAS_URL.includes("DAN_LINK_APPS_SCRIPT")) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          ok: false,
          message: "Chưa cấu hình GAS_REPAIR_URL trong Netlify Environment Variables hoặc repair-api.js"
        })
      };
    }

    const gasRes = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: event.body || "{}"
    });

    const text = await gasRes.text();

    try {
      JSON.parse(text);
    } catch (e) {
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({
          ok: false,
          message: "Apps Script không trả JSON",
          response: text.slice(0, 500)
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: text
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        ok: false,
        message: String(err)
      })
    };
  }
};
