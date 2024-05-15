# This script creates the extended parition within the vm
# help from https://gist.github.com/christopher-hopper/9755310

# halts execution of script if anything here fails + outputs everything
set -e

if [ -f /etc/disk_added_date ]
then
   echo "Disk already added."
   exit 0
fi

fdisk /dev/sda <<EOF
n
4


w
EOF

# The above formats the disk passing in the following arguments:
# n - creates new partition
# 4 - allocate it as partition #4
# [enter] start block - accepts defaults
# [enter] end block - accepts defaults
# w - write changes

# the following extends the newly formatted partion onto our main disk
pvcreate /dev/sda4
vgextend ubuntu-vg /dev/sda4
lvextend -l +100%FREE /dev/mapper/ubuntu--vg-ubuntu--lv
resize2fs /dev/mapper/ubuntu--vg-ubuntu--lv

date > /etc/disk_added_date

echo "Disk successfully extended"
