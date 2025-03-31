const http = require('http');

const server = http.createServer((req, res) => {
  console.log(`Request received: ${req.method} ${req.url}`);

  res.setHeader('Content-Type', 'application/json');

  if (req.url === '/equipment') {
    res.statusCode = 200;
    res.end(JSON.stringify({
      items: [
        {
          id: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
          name: 'RF 분석기',
          managementNumber: 'EQ-RF-001',
          status: 'available'
        },
        {
          id: '2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q',
          name: '오실로스코프',
          managementNumber: 'EQ-OSC-001',
          status: 'in_use'
        }
      ],
      meta: {
        totalItems: 2,
        itemCount: 2,
        itemsPerPage: 20,
        totalPages: 1,
        currentPage: 1
      }
    }));
  } else {
    res.statusCode = 200;
    res.end(JSON.stringify({ message: 'API Test Server' }));
  }
});

const port = 3002;
server.listen(port, () => {
  console.log(`Test server running at http://localhost:${port}/`);
}); 