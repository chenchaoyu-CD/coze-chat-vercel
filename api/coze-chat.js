// api/coze-chat.js - Vercel代理函数，安全转发请求到Coze API
export default async function handler(req, res) {
  // 解决跨域问题（允许前端页面访问，生产环境可指定具体域名更安全）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 仅允许POST请求，不符合则返回405错误
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持POST请求，请使用POST方式调用' });
  }

  try {
    // 1. 解析前端传递的参数（用户提问、会话ID）
    const { query, conversation_id } = req.body;
    if (!query) {
      return res.status(400).json({ error: '缺少必要参数：query（用户提问内容）' });
    }

    // 2. 从Vercel环境变量获取Coze信息（避免密钥泄露）
    const COZE_BOT_ID = process.env.COZE_BOT_ID;
    const COZE_PAT = process.env.COZE_PAT;
    if (!COZE_BOT_ID || !COZE_PAT) {
      return res.status(500).json({ error: 'Vercel环境变量未配置：请添加COZE_BOT_ID和COZE_PAT' });
    }

    // 3. 调用Coze官方API
    const cozeResponse = await fetch('https://api.coze.com/open_api/v2/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COZE_PAT}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bot_id: COZE_BOT_ID,
        user_id: 'vercel_github_user_001', // 自定义唯一用户标识，可修改
        query: query,
        conversation_id: conversation_id || undefined // 维持会话上下文
      })
    });

    // 4. 解析Coze响应并返回给前端
    const cozeData = await cozeResponse.json();
    return res.status(200).json(cozeData);

  } catch (error) {
    // 捕获异常并返回友好提示
    return res.status(500).json({
      error: '代理请求失败',
      detail: error.message,
      tip: '请检查Coze BOT_ID、PAT是否有效，或网络是否通畅'
    });
  }
}
