// netlify/functions/records.js — 读取全部咨询记录（需管理员密码）

const { getStore } = require("@netlify/blobs");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const { password } = JSON.parse(event.body);
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return { statusCode: 500, body: JSON.stringify({ error: "服务器未配置管理员密码" }) };
    }
    if (password !== adminPassword) {
      return { statusCode: 401, body: JSON.stringify({ error: "密码错误" }) };
    }

    const store = getStore("consultations");
    const { blobs } = await store.list();
    const records = [];
    for (const b of blobs) {
      const r = await store.get(b.key, { type: "json" });
      if (r) records.push(r);
    }
    // 按时间倒序
    records.sort((a, b) => (b.time || "").localeCompare(a.time || ""));

    return { statusCode: 200, body: JSON.stringify({ ok: true, records }) };
  } catch (e) {
    console.log("读取记录出错:", String(e));
    return { statusCode: 500, body: JSON.stringify({ error: String(e) }) };
  }
};
