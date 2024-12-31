variable "output_directory" {
	type = string
	default = "output-sv-kubernetes"
}

source "vagrant" "sv-kubernetes-amd" {
	communicator = "ssh"
	source_path = "bento/ubuntu-22.04"
	box_version = "202206.03.0"
	provider = "virtualbox"
	output_dir = var.output_directory
}

source "vagrant" "sv-kubernetes-arm" {
	communicator = "ssh"
	source_path = "bento/ubuntu-22.04-arm64"
	box_version = "202401.31.0"
	provider = "vmware_desktop"
	output_dir = var.output_directory
}

build {
	sources = [
		"source.vagrant.sv-kubernetes-amd",
		"source.vagrant.sv-kubernetes-arm"
	]

	provisioner "shell" {
		inline = ["mkdir -p /tmp/sv"]
	}
	provisioner "file" {
		source = "scripts"
		destination = "/tmp/sv"
	}
	provisioner "file" {
		source = "internal"
		destination = "/tmp/sv"
	}
	provisioner "file" {
		source = "sv"
		destination = "/tmp/sv"
	}
	provisioner "shell" {
		inline = [
			"sudo cp -r /tmp/sv /sv",
			"sudo -H bash /sv/scripts/provision.sh"
		]
	}
}
