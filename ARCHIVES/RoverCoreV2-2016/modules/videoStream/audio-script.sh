#!/bin/bash
if [ -n "$1" ]
then
	arecord -f cd -D hw:CARD=C920 | ffmpeg -re -ac 2 -i - -acodec libmp3lame -b:a 128k -vn -f rtp rtp://$1:9008
else 
	exit 0
fi 
