source "vagrant" "sv-kubernetes" {
	communicator = "ssh"
	source_path = "bento/ubuntu-22.04"
	box_version = "202206.03.0"
	provider = "virtualbox"
}

build {
	sources = ["source.vagrant.sv-kubernetes"]
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
