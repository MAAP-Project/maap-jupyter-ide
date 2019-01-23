#!/bin/bash

/usr/sbin/sshd -D &
jupyter lab --no-browser --allow-root --port 8888
