var port = process.env.PORT || 3000

var app = require('express')()
var bodyParser = require('body-parser')
app.use(bodyParser.json())

var server = require('http').Server(app)
server.listen(port)


var integrationTools = require('./lib/integrationTools')

const execFile = require('child_process').execFile;
// call the featuredeploy script and passes the last stdout line as argument
const featuredeploy = (args, callback) => {
  execFile('featuredeploy', args, (error, stdout, stderr) => {
    if (error) {
      console.error('Error calling featuredeploy')
      console.error(error)
    } else {
      stdout = stdout.trim()
      let lastLine = stdout.substr(stdout.lastIndexOf('\n') + 1) // last line
      callback(lastLine)
    }
  })
}

app.post('/pull_request', (req, res) => {
  const {action, pull_request, label, repo, installation} = req.body
  switch (action) {
    case 'labeled':
      if (label.name === 'featuredeploy') {
        featuredeploy(['deploy', pull_request.head.ref, pull_request.head.sha], (ip) => {
          integrationTools.makeGithubFeatureDeployComments({
            installationId: installation.id,
            pullUrl: pull_request.url,
            message: 'deploying to ' + ip
          })
        })
      }
      break
    case 'unlabeled':
      if (label.name === 'featuredeploy') {
        featuredeploy(['rmbranch', pull_request.head.ref], () => {
          integrationTools.removeGithubFeatureDeploy({
            installationId: installation.id,
            pullUrl: pull_request.url
          })
        })
      }
      break
  }
  res.sendStatus(200)
})

app.post('/destroy', (req, res) => {
  const {full_name, branch} = req.body
  integrationTools.removeGithubFeatureDeploy({
    installationId: installation.id,
    branchName: branch,
    fullName: full_name
  })
})

app.post('/deployed', (req, res) => {
  const {full_name, branch} = req.body
  integrationTools.removeGithubFeatureDeploy({
    installationId: installation.id,
    branch,
    fullName: full_name
  })
})
