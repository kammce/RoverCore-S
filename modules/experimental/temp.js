fs = require('fs')

setInterval(function(){
fs.readFile('/sys/class/hwmon/hwmon0/device/temp1_input', 'utf8', function (err,data) {
  if (err) {
    return console.log(err);
  }
  data = data/1000;
  console.log(data);
});

},1000);
