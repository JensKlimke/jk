// Simple test to simulate browser behavior with cookies
const http = require('http');

function testCookieStorage() {
  const options = {
    hostname: 'app.localhost',
    port: 80,
    path: '/',
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Browser Test)'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log('Response Headers:');
    console.log(res.headers);
    
    // Check Set-Cookie header
    const setCookie = res.headers['set-cookie'];
    if (setCookie) {
      console.log('\nSet-Cookie header found:');
      setCookie.forEach(cookie => {
        console.log(`  ${cookie}`);
        
        // Check if cookie has Secure flag while being served over HTTP
        if (cookie.includes('Secure') && options.port === 80) {
          console.log('  ❌ ISSUE: Cookie has Secure flag but served over HTTP!');
          console.log('  ❌ Browsers will reject this cookie!');
        }
      });
    } else {
      console.log('\n❌ No Set-Cookie header found');
    }

    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });

    res.on('end', () => {
      console.log('\nResponse body:');
      console.log(body);
    });
  });

  req.on('error', (e) => {
    console.error(`Request error: ${e.message}`);
  });

  req.end();
}

console.log('Testing cookie storage behavior...\n');
testCookieStorage();