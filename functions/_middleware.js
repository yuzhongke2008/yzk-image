export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const USERNAME = env.BASIC_AUTH_USER;
  const PASSWORD = env.BASIC_AUTH_PASS;
  
  if (!USERNAME || !PASSWORD) {
    return new Response("Auth Env Missing", { status: 500 });
  }

  const expectedAuth = `Basic ${btoa(`${USERNAME}:${PASSWORD}`)}`;
  const auth = request.headers.get('Authorization');
  const cookie = request.headers.get('Cookie') || '';
  const isAuthByCookie = cookie.includes('authorized=true');

  // --- 核心逻辑：验证凭证 ---
  const isAuthenticated = (auth === expectedAuth || isAuthByCookie);

  // 1. 如果验证通过：放行并种下/更新 Cookie
  if (isAuthenticated) {
    const response = await context.next();
    // 只有在通过 Basic Auth 或还没种下 Cookie 时才设置 Set-Cookie
    if (auth === expectedAuth) {
      response.headers.append('Set-Cookie', 'authorized=true; Path=/; HttpOnly; SameSite=Strict; Max-Age=2592000');
    }
    return response;
  }

  // 2. 如果验证未通过：
  // 如果是 API 请求 (/v1/)，直接拒绝访问，不给数据，也不弹窗（防止死循环）
  if (url.pathname.startsWith('/v1/')) {
    return new Response(JSON.stringify({ error: "Unauthorized Access" }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 3. 如果是 HTML 页面访问，触发浏览器 Basic Auth 弹窗
  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="ZENITH Secure Admin"',
      'Cache-Control': 'no-cache',
    },
  });
}
