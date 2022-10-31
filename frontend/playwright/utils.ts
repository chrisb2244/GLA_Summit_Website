import { IncomingMessage } from 'http';
import { networkInterfaces } from 'os';

const results = Object.create(null);
const nets = networkInterfaces()
for (const name of Object.keys(nets)) {
  /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
  for (const net of nets[name]!) {
    const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4
      if (net.family === familyV4Value && !net.internal) {
          if (!results[name]) {
              results[name] = [];
          }
          results[name].push(net.address);
      }
  }
}

export const reqToBody = (req: IncomingMessage, callback: (body: string) => void) => {
  let body = ''
  req.on('data', (chunk) => {
    body += chunk
  })
  req.on('end', () => {
    callback(body)
  })
}

export const localIP = results['eth0'][0]