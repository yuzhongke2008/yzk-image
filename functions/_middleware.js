export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const USERNAME = env.BASIC_AUTH_USER;
  const PASSWORD = env.BASIC_AUTH_PASS;
  
  // 安全保障：如果没配变量，直接报错，不给任何漏洞
  if (!USERNAME || !PASSWORD) {
    return new Response("Configuration Error", { status: 500 });
  }

  const auth = request.headers.get('Authorization');
  const expectedAuth = `Basic ${btoa(`${USERNAME}:${PASSWORD}`)}`;

  // 1. 核心验证：如果凭据正确，无论是什么请求都放行
  if (auth === expectedAuth) {
    return await context.next();
  }

  // 2. 核心逻辑：如果凭据错误或缺失
  // 针对 /v1/ 的处理
  if (url.pathname.startsWith('/v1/')) {
    // 关键点：我们依然返回 401 触发浏览器验证，
    // 但通过这种方式，浏览器会意识到整个域（Same-origin）都需要验证。
    return new Response('Unauthorized', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Area"',
        'Content-Type': 'text/plain',
      },
    });
  }

  // 3. 针对普通页面的处理
  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}
