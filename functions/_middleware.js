export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const USERNAME = env.BASIC_AUTH_USER;
  const PASSWORD = env.BASIC_AUTH_PASS;
  const expectedAuth = `Basic ${btoa(`${USERNAME}:${PASSWORD}`)}`;
  
  // 获取认证头和 Cookie
  const auth = request.headers.get('Authorization');
  const cookie = request.headers.get('Cookie') || '';
  const isAuthByCookie = cookie.includes('authorized=true');

  // 1. 如果有正确的 Auth 头 或 有认证 Cookie，直接放行
  if (auth === expectedAuth || isAuthByCookie) {
    const response = await context.next();
    
    // 如果是第一次通过 Basic Auth 验证成功，顺便种下一个 Cookie
    if (auth === expectedAuth) {
      response.headers.append('Set-Cookie', 'authorized=true; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400');
    }
    return response;
  }

  // 2. 针对 API 请求 (/v1/)
  if (url.pathname.startsWith('/v1/')) {
    // 依然返回 401 但不带弹窗头，避免死循环
    // 此时前端会报错，但没关系，等主页面登录后刷新即可
    return new Response('API Unauthorized', { status: 401 });
  }

  // 3. 针对 HTML 页面请求，弹出登录框
  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
      'Cache-Control': 'no-cache',
    },
  });
}
