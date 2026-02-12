module.exports = {
  apps: [{
    name: "2048-game",
    script: "server.js",
    instances: 1,
    autorestart: true, // 崩溃自动重启
    watch: false,
    max_memory_restart: "100M", // 内存超过100M自动重启
    env: {
      NODE_ENV: "production",
      PORT: 3000
    },
    log_date_format: "YYYY-MM-DD HH:mm:ss",
    error_file: "./logs/err.log",
    out_file: "./logs/out.log",
    merge_logs: true
  }]
};