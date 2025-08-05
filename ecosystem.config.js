module.exports = {
  apps: [{
    name: "motospark-crm",
    script: "./src/index.js",
    instances: "max",
    exec_mode: "cluster",
    env: {
      NODE_ENV: "production",
      PORT: 5000
    }
  }]
};