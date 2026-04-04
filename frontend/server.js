const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const PORT = process.env.PORT || 3001;
const CACHE_DURATION = 31536000000; // 1 year in ms
const fileCache = {};

const mime = (ext) => {
  const map = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
  };
  return map[ext] || 'text/plain';
};

const getCacheHeaders = (ext) => {
  // Cache static assets for 1 year, HTML for 1 hour
  const isStatic = ['.js', '.css', '.png', '.jpg', '.gif', '.svg', '.woff', '.woff2'].includes(ext);
  const maxAge = isStatic ? CACHE_DURATION : 3600;
  return {
    'Cache-Control': `public, max-age=${Math.floor(maxAge / 1000)}`,
    'ETag': `"${Date.now()}"`
  };
};

const shouldCompress = (contentType) => {
  return contentType.includes('text') || 
         contentType.includes('javascript') || 
         contentType.includes('json');
};

const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  
  // Security: Prevent directory traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  const ext = path.extname(filePath);
  const contentType = mime(ext);
  const headers = {
    'Content-Type': contentType,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    ...getCacheHeaders(ext)
  };

  const fileStream = fs.createReadStream(filePath);

  fileStream.on('error', (err) => {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  });

  fileStream.on('open', () => {
    // Add gzip compression for text-based content
    if (shouldCompress(contentType)) {
      headers['Content-Encoding'] = 'gzip';
      res.writeHead(200, headers);
      fileStream.pipe(zlib.createGzip()).pipe(res);
    } else {
      res.writeHead(200, headers);
      fileStream.pipe(res);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Frontend server running on http://localhost:${PORT}`);
});
