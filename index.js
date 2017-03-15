var port = process.env.PORT || 3000
var githubBotUserId = process.env.GITHUB_BOT_USER_ID
var giphyApiKey = process.env.GIPHY_API_KEY
var cert = process.env.GITHUB_PRIVATE_KEY

var app = require('express')()
var bodyParser = require('body-parser')
app.use(bodyParser.json())

var server = require('http').Server(app)
server.listen(port)

var lollygag = require('@resmio/lollygag')
const execFile = require('child_process').execFile;


// call the featuredeploy script and passes the last stdout line as argument
function featuredeploy(args, callback){
  execFile('featuredeploy', args, function(error, stdout, stderr){
    if (error){
      console.error('Error calling featuredeploy') 
      console.error(error)
    } else {
      stdout = stdout.trim()
      lastLine = stdout.substr(stdout.lastIndexOf("\n") + 1) // last line
      callback(lastLine)
    }
  })
}


app.post('/pull_request', function (req, res) {
  const {action, pull_request, label} = req.body
  switch (action) {
    case 'labeled':
      if (label.name === 'featuredeploy') {
        // lollygag.makeGithubFeatureDeployComments(1755, 15513, cert, pull_request.head.ref, 'deploying feature...', githubBotUserId, giphyApiKey)
        // RUN THE DEPLOY SCRIPT HERE
        featuredeploy(['deploy', pull_request.head.ref, pull_request.head.sha], function(ip){
          console.log(ip) 
        })
      }
      break
    case 'unlabeled':
      if (label.name === 'featuredeploy') {
        // lollygag.makeGithubFeatureDeployComments(1755, 15513, cert, pull_request.head.ref, null, githubBotUserId, giphyApiKey)
        // RUN THE DESTROY SCRIPT HERE
        featuredeploy(['rmbranch', pull_request.head.ref], function(){
          console.log('rmved')
        })
      }
      break
  }
  res.sendStatus(200)
})
