export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const USERNAME = env.BASIC_AUTH_USER;
  const PASSWORD = env.BASIC_AUTH_PASS;
  const expectedAuth = `Basic ${btoa(`${USERNAME}:${PASSWORD}`)}`;
  const auth = request.headers.get('Authorization');

  // 1. 如果密码正确，通行证直接放行（最高优先级）
  if (auth === expectedAuth) {
    return await context.next();
  }

  // 2. 如果密码错误或没带密码
  // 判断是否为 API 请求（Hono 路由路径）
  if (url.pathname.startsWith('/v1/')) {
    // 关键点：返回 401，但【严禁】携带 'WWW-Authenticate' 头
    // 这会让 API 请求静默失败（返回错误），而不会导致浏览器弹窗死循环
    return new Response('API Unauthorized', { 
      status: 401 
    });
  }

  // 3. 只有当用户直接访问网页（非 v1 路径）时，才触发浏览器弹窗
  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
      'Cache-Control': 'no-cache',
    },
  });
}
