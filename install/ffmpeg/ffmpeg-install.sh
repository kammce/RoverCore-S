sudo apt-get update
sudo apt-get -y --force-yes install autoconf automake build-essential libass-dev libfreetype6-dev \
  libtheora-dev libtool libvorbis-dev pkg-config texi2html zlib1g-dev

sudo apt-get install yasm
sudo apt-get install libx264-dev
sudo apt-get install libmp3lame-dev
sudo apt-get install libopus-dev

git clone git://source.ffmpeg.org/ffmpeg.git
cd ffmpeg
./configure --enable-gpl \
  --enable-libfreetype \
  --enable-libmp3lame \
  --enable-libopus \
  --enable-libx264 \
  --enable-nonfree

make
make install