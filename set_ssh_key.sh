#!/bin/bash

#$CID=$1
QUOTE='"'
SSH_KEY=$1
#echo $QUOTE
SSH_KEY=$SSH_KEY
echo "$SSH_KEY"
#`echo "$SSH_KEY"` >> /home/ubuntu/.ssh/authorized_keys

mkdir /home/ubuntu/.ssh
touch /home/ubuntu/.ssh/authorized_keys
cat << EOF >> /home/ubuntu/.ssh/authorized_keys
$SSH_KEY
EOF
