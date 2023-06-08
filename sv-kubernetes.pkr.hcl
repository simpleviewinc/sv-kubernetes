source "vagrant" "sv-kubernetes" {
	communicator = "ssh"
	source_path = "bento/ubuntu-18.04"
	box_version = "201912.14.0"
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
			"sudo bash /sv/scripts/provision.sh"
		]
	}
}
