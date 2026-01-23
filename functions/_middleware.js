export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const USERNAME = env.BASIC_AUTH_USER;
  const PASSWORD = env.BASIC_AUTH_PASS;
  const expectedAuth = `Basic ${btoa(`${USERNAME}:${PASSWORD}`)}`;
  const auth = request.headers.get('Authorization');

  // 仅校验 Authorization Header
  if (auth === expectedAuth) {
    return await context.next();
  }

  // API 接口拦截
  if (url.pathname.startsWith('/v1/')) {
    return new Response(JSON.stringify({ error: "No permission" }), { 
      status: 403, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  // 弹出登录框
  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="ZENITH AI Secure"',
      'Cache-Control': 'no-cache, no-store, must-revalidate', // 禁止缓存认证状态
    },
  });
}
