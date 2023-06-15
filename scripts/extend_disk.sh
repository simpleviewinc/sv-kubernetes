# This script creates the extended parition within the vm
# help from https://gist.github.com/christopher-hopper/9755310

# halts execution of script if anything here fails + outputs everything
set -e

# checks to ensure that the /dev/sdb disk exists
status=$((fdisk -l /dev/sdb >/dev/null 2>&1 && echo "0") || echo "1")

# if the user hasn't run vagrant halt and vagrant up to init the disk then nothing to do, exit peacefully
if [ $status == "1" ]; then
   echo "Additional disk not added yet via vagrant halt and vagrant up."
   exit 0
fi

if [ -f /etc/disk_added_date ]
then
   exit 0
fi

fdisk -u /dev/sdb <<EOF
n
p
1


t
8e
w
EOF

# The above formats the disk passing in the following arguments:
# n - creates new partition
# p - selects type primary
# 1 - selects the first partition
# [enter] - accepts defaults
# [enter] - accepts defaults
# t - change partition id
# 8e - change Hex Code of partion for `Linux LVM`
# w - write changes

# the following extends the newly formatted partion onto our main disk
pvcreate /dev/sdb1
vgextend ubuntu-vg /dev/sdb1
lvextend -l +100%FREE /dev/mapper/ubuntu--vg-ubuntu--lv
resize2fs /dev/mapper/ubuntu--vg-ubuntu--lv

date > /etc/disk_added_date
