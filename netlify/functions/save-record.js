// netlify/functions/save-record.js — 保存一次完整咨询记录到 Netlify Blobs

const { getStore } = require("@netlify/blobs");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const { company, qa } = JSON.parse(event.body);
    // qa 是一个数组：[{q:"问题1", a:"回答1"}, ...]

    const record = {
      id: Date.now() + "-" + Math.random().toString(36).slice(2, 8),
      company: company || "(未填写)",
      qa: qa || [],
      time: new Date().toISOString(),
    };

    const store = getStore("consultations");
    await store.setJSON(record.id, record);

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    console.log("保存记录出错:", String(e));
    return { statusCode: 500, body: JSON.stringify({ error: String(e) }) };
  }
};
