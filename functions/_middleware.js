export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // 1. 读取配置
  const USERNAME = env.BASIC_AUTH_USER;
  const PASSWORD = env.BASIC_AUTH_PASS;
  const expectedAuth = `Basic ${btoa(`${USERNAME}:${PASSWORD}`)}`;
  const auth = request.headers.get('Authorization');
  const cookie = request.headers.get('Cookie') || '';
  const isAuthByCookie = cookie.includes('authorized=true');

  // 2. 验证判断
  const hasAccess = (auth === expectedAuth || isAuthByCookie);

  if (hasAccess) {
    const originalResponse = await context.next();
    // 构造新 Response 以便修改 Header
    const response = new Response(originalResponse.body, originalResponse);

    // 关键修改点：登录成功时，种下会话级 Cookie
    // 删除了 Max-Age=2592000，这样浏览器关闭后 Cookie 就会失效
    if (auth === expectedAuth) {
      response.headers.set('Set-Cookie', 'authorized=true; Path=/; HttpOnly; SameSite=Strict');
    }
    return response;
  }

  // 3. 针对不同路径的拦截策略
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
      'Cache-Control': 'no-cache',
    },
  });
}
