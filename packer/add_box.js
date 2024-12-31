//@ts-check
const child_process = require("child_process");

child_process.execSync(`vagrant box add ${__dirname}/../output-sv-kubernetes/package.box --name owenallenaz/sv-kubernetes --force`, { stdio: "inherit" });
