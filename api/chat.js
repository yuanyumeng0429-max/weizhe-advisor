export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return new Response('Bad Request', { status: 400 });
  }

  const { system, messages } = body || {};
  if (!system || !Array.isArray(messages)) {
    return new Response('Missing system or messages', { status: 400 });
  }

  const apiKey = process.env.QWEN_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: { message: '服务器未配置 QWEN_API_KEY' } }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const upstream = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        stream: true,
        max_tokens: 3000,
        enable_search: true,
        search_options: { forced_search: true },
        messages: [{ role: 'system', content: system }, ...messages]
      })
    });

    if (!upstream.ok || !upstream.body) {
      const t = await upstream.text();
      return new Response(t || 'Upstream error', { status: upstream.status || 502 });
    }

    return new Response(upstream.body, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive'
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: { message: String(e) } }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}
