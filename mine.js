const http = require('http');

const OPTIONS = {
  host: 'localhost',
  port: 29183,
  wallet_address: 'SFXtzTFyCKwKUSAjPZNmu7GKYMEzbKgATdG7UTx4vg8DPTC3wAxswtECJsPZmudkiFbM2FFU2n7So2KJLVYdHyiFXcDC6ve1xpM'
};

function rpc(method, params = undefined) {
  return new Promise((resolve, reject) => {
    const payload = {
      jsonrpc: '2.0',
      id: 0,
      method: method,
      params: params
    };
    
    const body = JSON.stringify(payload);
    
    const req = http.request({
      hostname: OPTIONS.host,
      port: OPTIONS.port,
      path: '/json_rpc',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, callback);
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.end(body);
    
    function callback(res) {
      let data = '';
      
      res.setEncoding('utf8');
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        }
        catch (err) {
          return reject(err);
        }
        
        if (parsed.error) {
          reject(parsed.error);
        } else {
          resolve(parsed.result);
        }
      });
    }
  });
}

rpc('get_block_template', {
    reserve_size: 8,
    wallet_address: OPTIONS.wallet_address
  })
  .then(blockTemplate => {
    console.log('block template', blockTemplate);
    
    const block = Buffer.from(blockTemplate.blocktemplate_blob, 'hex');
    const nonce = Math.floor(Math.random() * 4294967295);
    block.writeUInt32BE(nonce, blockTemplate.reserved_offset);
    const payload = block.toString('hex');
    
    return rpc('submit_block', [payload]);
  })
  .then(res => {
    console.log('submit result', res);
  })
  .catch(err => {
    console.error('error', err);
  });