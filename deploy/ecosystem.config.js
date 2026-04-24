module.exports = {
  apps: [
    {
      name: 'flipos',
      script: 'node',
      args: '.next/standalone/server.js',
      cwd: '/var/www/peskett',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        HOSTNAME: '127.0.0.1',
        // Copy your .env.local values here or use a secrets manager
      },
      error_file: '/var/log/pm2/flipos-error.log',
      out_file: '/var/log/pm2/flipos-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
}
