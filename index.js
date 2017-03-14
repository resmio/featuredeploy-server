var port = process.env.PORT || 3000
var githubBotUserId = process.env.GITHUB_BOT_USER_ID
var giphyApiKey = process.env.GIPHY_API_KEY
var cert = fs.readFileSync('./github.pem')

var app = require('express')()
var bodyParser = require('body-parser')
app.use(bodyParser.json())

var server = require('http').Server(app)
server.listen(port)

var lollygag = require('@resmio/lollygag')

app.post('/pull_request', function (req, res) {
  if (body) {
    const {action, pull_request, label} = req.body
    switch (action) {
      case 'labeled':
        if (label.name === 'featuredeploy') {
          lollygag.makeGithubFeatureDeployComments(cert, pull_request.head.ref, 'deploying feature...', githubBotUserId, giphyApiKey)
          // RUN THE DEPLOY SCRIPT HERE
        }
        break
      case 'unlabeled':
        if (label.name === 'featuredeploy') {
          lollygag.makeGithubFeatureDeployComments(cert, pull_request.head.ref, null, githubBotUserId, giphyApiKey)
          // RUN THE DESTROY SCRIPT HERE
        }
        break
    }
  }
})
