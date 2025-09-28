const http = require('http');

function testServer(port) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:${port}`, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log(`Port ${port}: Status ${res.statusCode}`);
        console.log(`Content length: ${data.length}`);
        if (data.includes('<title>')) {
          console.log(`✅ Port ${port}: HTML content found`);
          resolve(true);
        } else {
          console.log(`❌ Port ${port}: No HTML content`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ Port ${port}: ${err.message}`);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log(`❌ Port ${port}: Timeout`);
      req.destroy();
      resolve(false);
    });
  });
}

async function testAllPorts() {
  const ports = [8081, 8080, 8082, 8083, 3000];
  
  console.log('Testing development servers...\n');
  
  for (const port of ports) {
    await testServer(port);
  }
}

testAllPorts();