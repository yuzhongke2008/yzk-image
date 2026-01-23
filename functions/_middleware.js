export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // 1. 配置与安全密钥
  const USERNAME = env.BASIC_AUTH_USER;
  const PASSWORD = env.BASIC_AUTH_PASS;
  // 使用用户名和密码的 MD5/Base64 组合一个简单的 Token 签名
  const SECRET_TOKEN = btoa(`${USERNAME}:${PASSWORD}`).slice(-15);
  const expectedAuth = `Basic ${btoa(`${USERNAME}:${PASSWORD}`)}`;
  
  const auth = request.headers.get('Authorization');
  const cookie = request.headers.get('Cookie') || '';
  // 校验 Cookie 是否包含我们的加密 Token
  const isAuthByCookie = cookie.includes(`session_token=${SECRET_TOKEN}`);

  // 2. 验证判断
  if (auth === expectedAuth || isAuthByCookie) {
    const originalResponse = await context.next();
    const response = new Response(originalResponse.body, originalResponse);

    // 如果是通过弹窗登录成功的，种下加密的“会话级 Cookie”
    if (auth === expectedAuth) {
      // 不设置 Max-Age = 退出浏览器即失效
      // 增加 Secure = 强制加密传输
      // 增加 HttpOnly = 脚本无法读取
      response.headers.set('Set-Cookie', `session_token=${SECRET_TOKEN}; Path=/; HttpOnly; Secure; SameSite=Strict`);
    }
    return response;
  }

  // 3. 拦截逻辑
  if (url.pathname.startsWith('/v1/')) {
    return new Response(JSON.stringify({ error: "No permission" }), { 
      status: 403, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="ZENITH AI Secure"',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
