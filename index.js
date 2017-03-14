var http = require('http');
var qs = require('querystring');

var port = process.env.PORT || 3000;

http.createServer(function(req, res) {
    var body = '';
    req.on('data', function(chunk) {
      body += chunk;
    });
    req.on('end', function() {
      var data = qs.parse(body);
      console.log(data.action)
      console.log(data)
    });

  res.writeHead(200, {'Content-Type' : 'text/plain'});
  res.end('OK\n');

}).listen(port, '0.0.0.0');
