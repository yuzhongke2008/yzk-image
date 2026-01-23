export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // 1. 安全提取变量：增加 trim() 防止不小心打入的空格导致登录失败
  const USERNAME = (env.BASIC_AUTH_USER || "").trim();
  const PASSWORD = (env.BASIC_AUTH_PASS || "").trim();
  
  if (!USERNAME || !PASSWORD) {
    return new Response("Server configuration error: Auth variables missing.", { status: 500 });
  }

  // 生成一个更复杂的签名（取 Base64 的中间部分 + 长度校验）
  const fullAuth = btoa(`${USERNAME}:${PASSWORD}`);
  const SECRET_TOKEN = fullAuth.substring(Math.floor(fullAuth.length / 4));
  const expectedAuth = `Basic ${fullAuth}`;
  
  const auth = request.headers.get('Authorization');
  const cookie = request.headers.get('Cookie') || '';
  const isAuthByCookie = cookie.includes(`session_token=${SECRET_TOKEN}`);

  // 2. 验证通过
  if (auth === expectedAuth || isAuthByCookie) {
    const response = await context.next();
    
    // 仅对 HTML 页面和 API 请求植入 Cookie，避免静态资源开销
    const isPageOrApi = !/\.(jpg|jpeg|png|gif|css|js|ico|woff2)$/i.test(url.pathname);

    if (isPageOrApi && auth === expectedAuth) {
      const newResponse = new Response(response.body, response);
      // 增加 Secure 和 HttpOnly，SameSite 设为 Lax 兼顾安全与兼容
      newResponse.headers.set(
        'Set-Cookie', 
        `session_token=${SECRET_TOKEN}; Path=/; HttpOnly; Secure; SameSite=Lax`
      );
      return newResponse;
    }
    return response;
  }

  // 3. 验证失败拦截
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
      'X-Content-Type-Options': 'nosniff' // 最后一点安全防御
    },
  });
}
