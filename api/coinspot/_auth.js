const crypto = require('crypto');

function sign(secret, nonce, postData) {
  return crypto.createHmac('sha512', secret).update(nonce + postData).digest('hex');
}

async function coinspotPost(path, key, secret, body = {}) {
  const nonce = Date.now().toString();
  const postData = JSON.stringify({ nonce, ...body });
  const signature = sign(secret, nonce, postData);

  const res = await fetch(`https://www.coinspot.com.au${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'key': key,
      'sign': signature,
    },
    body: postData,
  });
  return res.json();
}

module.exports = { coinspotPost };
