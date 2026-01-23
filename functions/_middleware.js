export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // 1. 获取认证信息
  const auth = request.headers.get('Authorization');
  const USERNAME = env.BASIC_AUTH_USER;
  const PASSWORD = env.BASIC_AUTH_PASS;
  const expectedAuth = `Basic ${btoa(`${USERNAME}:${PASSWORD}`)}`;

  // 2. 如果认证通过，直接放行（无论是页面还是 API）
  if (auth === expectedAuth) {
    return await context.next();
  }

  // 3. --- 关键优化：针对 API 请求的处理 ---
  // 如果是 /v1/ 下的请求且未通过验证
  if (url.pathname.startsWith('/v1/')) {
    // 我们返回 401 但不带 'WWW-Authenticate' 头
    // 这样 Hono 客户端会收到 401 错误，但浏览器【不会】弹出烦人的登录框
    return new Response('API Unauthorized', { status: 401 });
  }

  // 4. 对于普通页面请求，未验证则弹出登录框
  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
      'Cache-Control': 'no-cache',
    },
  });
}
