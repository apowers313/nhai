#!/bin/bash
# event manager for supervisord: shuts down the daemon when one of it's processes exits
# see also: http://supervisord.org/events.html

printf "READY\n";

while read line; do
  echo "Processing Event: $line" >&2;
  kill -3 $(cat "/var/run/supervisord.pid")
done < /dev/stdin