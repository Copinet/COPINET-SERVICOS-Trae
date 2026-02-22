const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

let PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5173;
const ROOT = path.resolve(__dirname, '..', 'web-build');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.map': 'application/json'
};

const indexHtmlPath = path.join(ROOT, 'index.html');

function send(res, status, headers, body) {
  res.writeHead(status, headers);
  res.end(body);
}

function getLanIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return null;
}

function renderQrPage(url) {
  const encoded = encodeURIComponent(url);
  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>QR do Preview</title>
  </head>
  <body style="font-family:sans-serif;background:#0b0b0b;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;">
    <div style="text-align:center;padding:24px;">
      <div style="font-size:18px;margin-bottom:12px;">Aponte a câmera do celular</div>
      <img alt="QR do Preview" src="https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encoded}" style="border-radius:12px;background:#fff;padding:12px;" />
      <div style="margin-top:12px;font-size:12px;word-break:break-all;">${url}</div>
    </div>
  </body>
</html>`;
}

function serveFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const encoding = ext === '.html' ? 'utf8' : undefined;
  fs.readFile(filePath, encoding, (err, data) => {
    if (err) {
      fs.readFile(indexHtmlPath, 'utf8', (e2, data2) => {
        if (e2) return send(res, 500, { 'Content-Type': 'text/plain' }, '500 Internal Server Error');
        const injected = data2.replace(
          '</body>',
          `<script>
            (function(){
              var box=document.createElement('div');
              box.id='__overlay__';
              box.style.cssText='position:fixed;left:0;right:0;bottom:0;padding:8px 12px;background:#111;color:#fff;font:12px/1.4 sans-serif;z-index:99999;opacity:.9';
              box.textContent='Pré-visualização carregada. Aguardando app...';
              document.addEventListener('DOMContentLoaded',function(){document.body.appendChild(box);});
              window.addEventListener('error',function(e){
                box.style.background='#8B0000';
                box.textContent='Erro: '+(e && e.message ? e.message : e);
              });
            })();
          </script></body>`
        );
        send(res, 200, { 'Content-Type': 'text/html; charset=utf-8' }, injected);
      });
      return;
    }
    if (ext === '.html') {
      const injected = String(data).replace(
        '</body>',
        `<script>
          (function(){
            var box=document.createElement('div');
            box.id='__overlay__';
            box.style.cssText='position:fixed;left:0;right:0;bottom:0;padding:8px 12px;background:#111;color:#fff;font:12px/1.4 sans-serif;z-index:99999;opacity:.9';
            box.textContent='Pré-visualização carregada. Aguardando app...';
            document.addEventListener('DOMContentLoaded',function(){document.body.appendChild(box);});
            window.addEventListener('error',function(e){
              box.style.background='#8B0000';
              box.textContent='Erro: '+(e && e.message ? e.message : e);
            });
          })();
        </script></body>`
      );
      send(res, 200, { 'Content-Type': 'text/html; charset=utf-8' }, injected);
      return;
    }
    send(res, 200, { 'Content-Type': MIME[ext] || 'application/octet-stream' }, data);
  });
}

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  if (urlPath === '/qr') {
    const lanIp = getLanIp();
    const url = lanIp ? `http://${lanIp}:${PORT}/` : `http://localhost:${PORT}/`;
    return send(res, 200, { 'Content-Type': 'text/html; charset=utf-8' }, renderQrPage(url));
  }
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.join(ROOT, urlPath);

  if (!filePath.startsWith(ROOT)) {
    return send(res, 403, { 'Content-Type': 'text/plain' }, '403 Forbidden');
  }

  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isFile()) {
      serveFile(filePath, res);
    } else if (!err && stat.isDirectory()) {
      serveFile(path.join(filePath, 'index.html'), res);
    } else {
      serveFile(indexHtmlPath, res);
    }
  });
});

function listen(port) {
  server.listen(port, '0.0.0.0', () => {
    console.log(`Local preview: http://localhost:${port}/`);
    const lanIp = getLanIp();
    if (lanIp) {
      console.log(`LAN preview: http://${lanIp}:${port}/`);
      console.log(`QR preview: http://${lanIp}:${port}/qr`);
    }
  });
}

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    PORT += 1;
    listen(PORT);
  } else {
    throw err;
  }
});

listen(PORT);
