// netlify/functions/records.js — 读取全部咨询记录（需管理员密码，v2 写法）

import { getStore } from "@netlify/blobs";

export default async function (req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }
  try {
    const { password } = await req.json();
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      return new Response(JSON.stringify({ error: "服务器未配置管理员密码" }), {
        status: 500, headers: { "Content-Type": "application/json" }
      });
    }
    if (password !== adminPassword) {
      return new Response(JSON.stringify({ error: "密码错误" }), {
        status: 401, headers: { "Content-Type": "application/json" }
      });
    }
    const store = getStore("consultations");
    const { blobs } = await store.list();
    const records = [];
    for (const b of blobs) {
      const r = await store.get(b.key, { type: "json" });
      if (r) records.push(r);
    }
    records.sort((a, b) => (b.time || "").localeCompare(a.time || ""));
    return new Response(JSON.stringify({ ok: true, records }), {
      status: 200, headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    console.log("读取记录出错:", String(e));
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
}
