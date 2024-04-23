//@ts-check
const child_process = require("child_process");
const fs = require("fs");

const outputDir = `${__dirname}/output-sv-kubernetes`;

function exec(command) {
	return child_process.execSync(command, { stdio: "inherit" });
}

fs.rmSync(outputDir, { recursive: true, force: true  });
fs.mkdirSync(outputDir);

if (process.arch === "x64") {
	exec(`packer build -force sv-kubernetes.pkr.hcl`);
} else {
	// Spin-up base VM
	exec(`vagrant up base`);
	// Run provisioning script
	exec(`vagrant ssh base -c 'sudo bash /sv/scripts/provision.sh`);
	// Stop VM so we can save it into a box
	exec(`vagrant halt base`);
	const id = fs.readFileSync(`${__dirname}/.vagrant/machines/base/qemu/id`);

	// copy the necessary ingredients to create the box file
	fs.copyFileSync(`${__dirname}/.vagrant/machines/base/qemu/${id}/linked-box.img`, `${outputDir}/box.img`);
	fs.copyFileSync(`${__dirname}/internal/vagrantfile.arm`, `${outputDir}/Vagrantfile`);
	fs.copyFileSync(`${__dirname}/internal/metadata.arm.json`, `${outputDir}/metadata.json`);
	exec(`tar czf ${outputDir}/package.box ${outputDir}/metadata.json ${outputDir}/Vagrantfile ${outputDir}/box.img`);
}
