// netlify/functions/chat.js — 通义千问(OpenAI兼容)+ 联网搜索 + 流式转发

export default async function (req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: { message: "Method not allowed" } }), { status: 405 });
  }
  const apiKey = process.env.QWEN_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: { message: "服务器未配置 QWEN_API_KEY" } }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const { system, messages } = await req.json();
    const oaMessages = [{ role: "system", content: system }, ...messages];

    const upstream = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey,
      },
      body: JSON.stringify({
        model: "qwen-plus",
        messages: oaMessages,
        max_tokens: 2000,
        stream: true,
        enable_search: true,
        search_options: { search_strategy: "standard" }
      }),
    });
    return new Response(upstream.body, {
      status: upstream.status,
      headers: { "Content-Type": "text/event-stream; charset=utf-8" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: { message: String(e) } }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
}
