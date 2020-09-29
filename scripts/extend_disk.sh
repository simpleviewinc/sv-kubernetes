# This script creates the extended parition within the vm
# help from https://gist.github.com/christopher-hopper/9755310

# halts execution of script if anything here fails + outputs everything
set -e
set -x
 
if [ -f /etc/disk_added_date ]
then
   echo "disk already added so exiting."
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
vgextend vagrant-vg /dev/sdb1
lvextend -l +100%FREE /dev/mapper/vagrant--vg-root
resize2fs /dev/mapper/vagrant--vg-root
 
date > /etc/disk_added_date