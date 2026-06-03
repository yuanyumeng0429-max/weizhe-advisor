// netlify/functions/chat.js — 后端函数（藏 key，转发给 Claude），带错误日志

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log("ERROR: 环境变量 ANTHROPIC_API_KEY 未读取到");
    return { statusCode: 500, body: JSON.stringify({ error: { message: "服务器未配置 API key（环境变量没生效，需重新部署）" } }) };
  }

  try {
    const { system, messages } = JSON.parse(event.body);

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1600,
        system: system,
        messages: messages,
      }),
    });

    const data = await r.json();
    // 把 Claude 的返回打到日志，方便排查
    console.log("Claude 返回状态:", r.status);
    console.log("Claude 返回内容:", JSON.stringify(data).slice(0, 500));
    return { statusCode: r.status, body: JSON.stringify(data) };
  } catch (e) {
    console.log("ERROR 调用异常:", String(e));
    return { statusCode: 500, body: JSON.stringify({ error: { message: String(e) } }) };
  }
};
