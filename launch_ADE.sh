#!/bin/bash
SSHKEY=$1
QUOTE='"'
KEY=$QUOTE$SSHKEY$QUOTE

CONTAINER_ID=$(sudo docker run -d -p :8888 -p :22 jupyter-lab-image)
CONTAINER_NAME=$(echo `sudo docker inspect --format='{{.Name}}' $CONTAINER_ID` | cut -c 2-)
CONTAINER_PORT=$(sudo docker inspect --format='{{(index (index .NetworkSettings.Ports "22/tcp") 0).HostPort}}' $CONTAINER_NAME)
#echo $CONTAINER_ID
#echo $CONTAINER_NAME
echo $CONTAINER_PORT
ssh 172.17.0.1 -p $CONTAINER_PORT -o StrictHostKeyChecking=no "bash -s" < set_ssh_key.sh "$KEY"
