var port = process.env.PORT || 3000;

var app = require('express')();
var server = require('http').Server(app);
server.listen(port);

app.post('/', function ({body}, res) {
  console.log(body.action)
  console.log(body.label.name)
  console.log(body.pull_request.head.sha)
  console.log(body.pull_request.head.ref)

});

//
// var http = require('http');

// var port = process.env.PORT || 3000;

// http.createServer(function(req, res) {
//     var body = '';
//     req.on('data', function(chunk) {
//       body += chunk;
//     });
//     req.on('end', function() {
//       var data = JSON.parse(body);
//       console.log(data.action)
//       console.log(data.label.name)
//       console.log(data.pull_request.head.sha)
//       console.log(data.pull_request.head.ref)
//       body = ''
//     });

//   res.writeHead(200, {'Content-Type' : 'text/plain'});
//   res.end('OK\n');

// }).listen(port, '0.0.0.0');
