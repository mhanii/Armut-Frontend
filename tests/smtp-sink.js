// Minimal SMTP sink: accepts any message and appends it to captured.log.
const net = require('net'); const fs = require('fs');
const OUT = process.argv[3] || '/tmp/captured.log';
net.createServer(sock => {
  let data = false, buf = '';
  sock.write('220 sink ESMTP\r\n');
  sock.on('data', c => {
    buf += c.toString();
    if (data) {
      if (buf.includes('\r\n.\r\n')) { fs.appendFileSync(OUT, '===MESSAGE===\n' + buf.split('\r\n.\r\n')[0] + '\n'); data = false; buf=''; sock.write('250 OK queued\r\n'); }
      return;
    }
    let line;
    while ((line = buf.match(/^(.*?)\r\n/))) {
      buf = buf.slice(line[0].length);
      const cmd = line[1].toUpperCase();
      if (cmd.startsWith('EHLO') || cmd.startsWith('HELO')) sock.write('250-sink\r\n250 AUTH PLAIN LOGIN\r\n');
      else if (cmd.startsWith('AUTH')) sock.write('235 ok\r\n');
      else if (cmd.startsWith('MAIL') || cmd.startsWith('RCPT')) { fs.appendFileSync(OUT, line[1] + '\n'); sock.write('250 OK\r\n'); }
      else if (cmd === 'DATA') { data = true; sock.write('354 go\r\n'); break; }
      else if (cmd === 'QUIT') { sock.write('221 bye\r\n'); sock.end(); }
      else sock.write('250 OK\r\n');
    }
  });
  sock.on('error', () => {});
}).listen(Number(process.argv[2] || 2525), () => console.log('sink listening'));
