git clone git://source.ffmpeg.org/ffmpeg.git
cd ffmpeg
./configure --enable-gpl --enable-libx264 --enable-libmp3lame --enable-nonfree --enable-libaacplus
make
make install