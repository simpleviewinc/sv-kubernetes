//@ts-check
const child_process = require("child_process");
const fs = require("fs");

const outputDir = `${__dirname}/../output-sv-kubernetes`;

function exec(command) {
	return child_process.execSync(command, { stdio: "inherit" });
}

fs.rmSync(outputDir, { recursive: true, force: true  });
fs.mkdirSync(outputDir);

if (process.arch === "x64") {
	exec(`packer build -force -var="output_directory=${outputDir}" -only vagrant.sv-kubernetes-amd ${__dirname}/sv-kubernetes.pkr.hcl`);
} else {
	exec(`packer build -force -var="output_directory=${outputDir}" -only vagrant.sv-kubernetes-arm ${__dirname}/sv-kubernetes.pkr.hcl`);
}
