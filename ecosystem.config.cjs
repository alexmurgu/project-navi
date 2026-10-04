module.exports = {
  apps: [
    {
      name: "aftermind-finance",
      script: "bun",
      args: "run start",
      interpreter: "none",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      time: true,
      max_restarts: 10,
      restart_delay: 5000,
    },
  ],
};
