var http = require('http');

var port = process.env.PORT || 3000;
var data;

http.createServer(function(req, res) {
  res.writeHead(200, {'Content-Type' : 'text/plain'});
  console.log(req)
  res.end('OK\n');
}).listen(port, '0.0.0.0');
