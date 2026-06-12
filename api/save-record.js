import { put } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { company, phone, qa, time } = req.body || {};
    if (!company || !phone) return res.status(400).json({ error: 'missing fields' });

    const record = {
      company: String(company).slice(0, 100),
      phone: String(phone).slice(0, 20),
      qa: Array.isArray(qa) ? qa.slice(0, 10) : [],
      time: time || new Date().toISOString(),
      type: (Array.isArray(qa) && qa.length > 0) ? '完整咨询' : '新线索'
    };

    // 1) 存入 Vercel Blob 云存储
    try {
      await put('records/' + Date.now() + '.json', JSON.stringify(record), {
        access: 'public',
        addRandomSuffix: true,
        contentType: 'application/json'
      });
    } catch (e) { console.error('blob save failed:', e); }

    // 2) 推送到飞书群
    const hook = process.env.FEISHU_WEBHOOK;
    if (hook) {
      let text = (record.type === '新线索' ? '🔔 新线索留资' : '✅ 完成三轮咨询')
        + '\n公司：' + record.company
        + '\n手机号：' + record.phone
        + '\n时间：' + record.time;
      if (record.qa.length) {
        record.qa.forEach((item, i) => {
          const a = String(item.a || '');
          text += '\n\n问' + (i + 1) + '：' + String(item.q || '').slice(0, 200);
          text += '\n答' + (i + 1) + '：' + a.slice(0, 300) + (a.length > 300 ? '……' : '');
        });
      }
      try {
        await fetch(hook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ msg_type: 'text', content: { text } })
        });
      } catch (e) { console.error('feishu push failed:', e); }
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
