// netlify/functions/chat.js — 流式转发，避开30秒超时（v2写法，支持流）

export default async function (req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: { message: "Method not allowed" } }), { status: 405 });
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: { message: "服务器未配置 API key" } }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const { system, messages } = await req.json();
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2000,
        stream: true,
        system: system,
        messages: messages,
      }),
    });
    // 直接把上游的流式响应透传给前端
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
