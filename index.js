var port = process.env.PORT || 3000;

var app = require('express')();
var myParser = require("body-parser");
app.use(myParser.json());

var server = require('http').Server(app);
server.listen(port);

app.post('/', function ({body}, res) {
  console.log(body.action)
  console.log(body.label.name)
  console.log(body.pull_request.head.sha)
  console.log(body.pull_request.head.ref)

});
