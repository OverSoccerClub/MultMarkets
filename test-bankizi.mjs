import fs from 'fs';

async function test() {
  try {
    console.log('Authenticating...');
    const authRes = await fetch('https://api-hom.bankizi.com/api/auth/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: '3a24ebe7-a0f9-471e-988e-c1f7bf1cbc7c',
        client_secret: 'f7f29fce-28f0-40f6-969a-278faa63e062'
      }).toString()
    });
    
    console.log('Auth status:', authRes.status);
    const authData = await authRes.json();
    console.log('Token received:', !!authData.access_token);
    
    if (authData.access_token) {
        console.log('Generating QR Code...');
        const qrRes = await fetch('https://api-hom.bankizi.com/api/pix/qrcode/dynamic', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authData.access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: 5000,
                expiration: 3600,
                transactionId: 'TESTE' + Date.now()
            })
        });
        console.log('QR Code status:', qrRes.status);
        console.log('QR Code body:', await qrRes.text());
    }
  } catch (e) {
    console.error(e);
  }
}

test();
