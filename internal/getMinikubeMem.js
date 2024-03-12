const os = require("os");

// determine the number of MB of memory the machine has, and then multiply by .75 so we use at-most 3/4 of it
const mem = Math.round(os.totalmem() / 1024 / 1024 * .75);

process.stdout.write(mem.toString());