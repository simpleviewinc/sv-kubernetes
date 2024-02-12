#!/bin/bash
. ./scripts/platform_lookup.sh
BOX_BUILD_DIR=output-sv-kubernetes-arm64
BASH_SOURCE_DIR="${BASH_SOURCE[0]%/*}"
BASH_SOURCE_DIR="$(readlink -f ${BASH_SOURCE_DIR:-.})"

if [[ "${PLATFORM}" = "arm64" ]]; then
    # Clean-up build dir
    rm -rf "${BOX_BUILD_DIR}"

    # Spin-up base VM
    vagrant up base

    # Run provisioning script
    vagrant ssh base -c 'sudo bash /sv/scripts/provision.sh'

    # Stop VM
    vagrant halt base

    # Prepare Vagrant package
    mkdir -p "${BOX_BUILD_DIR}"
    cd "${BOX_BUILD_DIR}"
    cp "../.vagrant/machines/base/qemu/$(cat ../.vagrant/machines/base/qemu/id)/linked-box.img" box.img
    cat <<-'EOF' > Vagrantfile
Vagrant.configure(2) do |config|
  config.vm.box = "owenallenaz/sv-kubernetes-arm64"
  config.vm.synced_folder ".", "/vagrant", disabled: true

  config.vm.provider "qemu" do |qe|
    qe.arch = "aarch64"
    qe.cpu = "host"
  end
end
EOF

    cat <<-'EOF' > metadata.json
{"format":"qcow2","provider":"libvirt"}
EOF

    # Build Vagrant box
    tar czf package.box ./metadata.json ./Vagrantfile ./box.img

    # Clean-up base VM
    cd "${BASH_SOURCE_DIR}"
    vagrant destroy -f base
else
    packer build -force sv-kubernetes.pkr.hcl
fi
