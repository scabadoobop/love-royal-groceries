// Minimal test server to verify Railway can start a server
const http = require('http');

const PORT = process.env.PORT || 3001;

const server = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'OK', timestamp: new Date().toISOString() }));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Test server running on port ${PORT}`);
  console.log(`🌐 Bound to 0.0.0.0:${PORT}`);
  console.log(`✅ Health check at /health`);
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});




