// helper to get the current total memory in MB
const os = require("os");
process.stdout.write(Math.round(os.totalmem() / 1024 / 1024).toString());
