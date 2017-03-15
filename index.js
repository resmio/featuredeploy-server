var port = process.env.PORT || 3000

var app = require('express')()
var bodyParser = require('body-parser')
app.use(bodyParser.json())

var server = require('http').Server(app)
server.listen(port)

app.post('/pull_request', function (req, res) {
  const {action, pull_request, label, repo} = req.body
  console.log(req.body)
  switch (action) {
    case 'labeled':
      if (label.name === 'featuredeploy') {

      }
      break
    case 'unlabeled':
      if (label.name === 'featuredeploy') {

      }
      break
  }
  res.sendStatus(200)
})
