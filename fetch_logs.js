const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  conn.exec(`
pm2 logs teodorofit --lines 20
`, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', (data) => {
      console.log('STDOUT: ' + data);
    }).stderr.on('data', (data) => {
      console.error('STDERR: ' + data);
    });
  });
}).connect({
  host: '187.127.1.210',
  port: 22,
  username: 'root',
  password: '5r-#uOj9(C5Nbu4lGJqG'
});
