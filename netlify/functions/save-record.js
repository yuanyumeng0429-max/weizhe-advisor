// netlify/functions/save-record.js — 保存一次完整咨询记录（Netlify Functions v2 写法，Blobs 自动可用）

import { getStore } from "@netlify/blobs";

export default async function (req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }
  try {
    const { company, qa } = await req.json();
    const record = {
      id: Date.now() + "-" + Math.random().toString(36).slice(2, 8),
      company: company || "(未填写)",
      qa: qa || [],
      time: new Date().toISOString(),
    };
    const store = getStore("consultations");
    await store.setJSON(record.id, record);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    console.log("保存记录出错:", String(e));
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
}
