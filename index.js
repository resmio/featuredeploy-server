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
    if (error) { console.error(error) }
    else {
      stdout = stdout.trim()
      let lastLine = stdout.substr(stdout.lastIndexOf('\n') + 1) // last line
      callback(lastLine)
    }
  })
}

app.post('/pull_request', (req, res) => {
  const {action, pull_request, label, repository, installation} = req.body
  if (installation && action && pull_request) { // we only want to concern ourselves with the intallation actions, not the user actions
    switch (action) {
      case 'labeled':
        if (label.name === 'featuredeploy') {
          integrationTools.makeGithubFeatureDeployComments({
            installationId: installation.id,
            pullUrl: pull_request.url,
            message: 'building...'
          })
          featuredeploy(['deploy', pull_request.head.ref, pull_request.head.sha], () => false)
        }
        break
      case 'unlabeled':
        if (label.name === 'featuredeploy') {
          integrationTools.removeGithubFeatureDeployComments({
            installationId: installation.id,
            pullUrl: pull_request.url
          })
          featuredeploy(['rmbranch', pull_request.head.ref], () => false)
        }
        break
      case 'closed':
        integrationTools.checkForFeatureDeployLabel({
          installationId: installation.id,
          labelsUrl: pull_request.issue_url + '/labels'
        }).then((hasLabel) => {
          if (hasLabel) {
            integrationTools.removeGithubFeatureDeployComments({
              installationId: installation.id,
              pullUrl: pull_request.url
            })
            featuredeploy(['rmbranch', pull_request.head.ref], () => false)
          }
        })
        break
    }
  }
  res.sendStatus(200)
})

app.post('/destroy', (req, res) => {
  const {full_name: fullName, branch: branchName, installation_id: installationId} = req.body
  integrationTools.removeGithubFeatureDeployComments({
    installationId,
    branchName,
    fullName
  })
  res.sendStatus(200)
})

app.post('/deployed', (req, res) => {
  const {full_name: fullName, branch: branchName, installation_id: installationId, ip, hash} = req.body
  integrationTools.makeGithubFeatureDeployComments({
    installationId,
    branchName,
    fullName,
    message: 'deployed to http://' + ip + ' ' + hash,
    giphy: true
  })
  res.sendStatus(200)
})
