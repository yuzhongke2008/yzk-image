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

  // 2. 验证判断：必须有正确 Header 或 有效登录 Cookie
  const hasAccess = (auth === expectedAuth || isAuthByCookie);

  if (hasAccess) {
    const response = await context.next();
    // 登录成功时，种下长效安全 Cookie (30天免登录)
    if (auth === expectedAuth) {
      response.headers.append('Set-Cookie', 'authorized=true; Path=/; HttpOnly; SameSite=Strict; Max-Age=2592000');
    }
    return response;
  }

  // 3. 针对不同路径的拦截策略
  // 如果是后台接口 /v1/ (处理历史记录、生成请求等)
  if (url.pathname.startsWith('/v1/')) {
    return new Response(JSON.stringify({ error: "No permission" }), { 
      status: 403, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  // 如果是 HTML 页面，弹出登录框
  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="ZENITH AI Secure"',
      'Cache-Control': 'no-cache',
    },
  });
}
