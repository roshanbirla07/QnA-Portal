module.exports = {
  apps: [
    {
      name: "qna-portal-backend",
      cwd: "./backend",
      script: "index.js",
      exec_mode: "fork",
      instances: 1,
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      error_file: "./logs/backend-error.log",
      out_file: "./logs/backend-out.log",
      time: true,
    },
  ],
};
