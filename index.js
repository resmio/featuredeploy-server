var http = require('http');

var port = process.env.PORT || 3000;

http.createServer(function(req, res) {
  res.writeHead(200, {'Content-Type' : 'text/plain'});
  res.end('OK\n');
}).listen(port, '0.0.0.0');
