const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const readStream = fs.createReadStream('admin.html');
    const writeStream = sftp.createWriteStream('/var/www/teodorofit/admin.html');
    writeStream.on('close', () => {
      console.log('admin.html transferred successfully');
      conn.end();
    });
    readStream.pipe(writeStream);
  });
}).connect({
  host: '187.127.1.210',
  port: 22,
  username: 'root',
  password: '5r-#uOj9(C5Nbu4lGJqG'
});
