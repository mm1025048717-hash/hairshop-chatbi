/**
 * DeepSeek API 代理服务器
 * 解决浏览器 CORS 跨域问题
 */

const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 3001;
const DEEPSEEK_API = 'https://api.deepseek.com';

const server = http.createServer((req, res) => {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 只代理 /api 路径
  if (!req.url.startsWith('/api')) {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }

  // 构建目标 URL
  const targetPath = req.url.replace('/api', '');
  const targetUrl = `${DEEPSEEK_API}${targetPath}`;
  
  console.log(`[Proxy] ${req.method} ${targetUrl}`);

  // 收集请求体
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    const parsedUrl = url.parse(targetUrl);
    
    const options = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.path,
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || '',
      }
    };

    const proxyReq = https.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (error) => {
      console.error('[Proxy] Error:', error.message);
      res.writeHead(500);
      res.end(JSON.stringify({ error: error.message }));
    });

    if (body) {
      proxyReq.write(body);
    }
    proxyReq.end();
  });
});

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 DeepSeek API 代理服务器已启动                         ║
║                                                            ║
║   代理地址: http://localhost:${PORT}/api                    ║
║   目标API:  ${DEEPSEEK_API}                     ║
║                                                            ║
║   现在可以从浏览器访问 DeepSeek API 了!                    ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});


