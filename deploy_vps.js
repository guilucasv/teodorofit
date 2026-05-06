const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  conn.exec(`
set -e

echo "Updating packages and installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
apt-get install -y nodejs git ufw > /dev/null 2>&1
npm install -g pm2 > /dev/null 2>&1

echo "Setting up repository..."
mkdir -p /var/www
cd /var/www

if [ -d "teodorofit" ]; then
    cd teodorofit
    git reset --hard HEAD
    git pull origin main
else
    git clone https://github.com/guilucasv/teodorofit.git
    cd teodorofit
fi

echo "Installing dependencies..."
npm install > /dev/null 2>&1

echo "Creating .env file..."
cat <<EOF > .env
PORT=1010
EMAIL_USER=
EMAIL_PASS=
MERCADO_PAGO_TOKEN=APP_USR-658683757195653-120415-a947b16d7d64ad4e56998377d1a980b3-494653537
MERCADO_PAGO_PUBLIC_KEY=APP_USR-8b594371-f829-4d8d-883f-d8b0e00072dd
MERCADO_PAGO_BRICK_ID=
ADMIN_PASSWORD=admin
EOF

echo "Configuring firewall..."
ufw allow 1010/tcp > /dev/null 2>&1

echo "Starting server with PM2..."
pm2 delete teodorofit > /dev/null 2>&1 || true
pm2 start server.js --name "teodorofit"
pm2 save > /dev/null 2>&1
echo "Deployment successful."
`, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
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
