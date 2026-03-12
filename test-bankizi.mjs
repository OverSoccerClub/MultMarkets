import fs from 'fs';

async function test() {
  try {
    const authRes = await fetch('https://api-hom.bankizi.com/api/auth/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: '3a24ebe7-a0f9-471e-988e-c1f7bf1cbc7c',
        client_secret: 'f7f29fce-28f0-40f6-969a-278faa63e062'
      }).toString()
    });
    
    const authData = await authRes.json();
    const token = authData.access_token;
    
    if (token) {
        console.log('Initiating...');
        const dynTxId = 'MM' + Date.now() + 'ABCDEFGHIJ';
        const initRes = await fetch('https://api-hom.bankizi.com/api/pix/withdraw/initiate/key', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: 5000, txId: dynTxId, pixKey: 'teste@bankizi.com' })
        });
        const initBody = await initRes.json();
        console.log('Init Status:', initRes.status);
        
        if (initBody.success) {
            console.log('Confirming...');
            const confRes = await fetch(`https://api-hom.bankizi.com/api/pix/withdraw/confirm/key/${dynTxId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('Conf Status by TransactionId (PUT):', confRes.status);
            console.log('Conf Body:', await confRes.text());
        }
    }
  } catch (e) {
    console.error(e);
  }
}

test();
