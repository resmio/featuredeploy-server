var PORT = process.env.PORT || 3000
var GITHUB_LABEL_NAME = process.env.GITHUB_LABEL_NAME
var SECRET = process.env.SECRET
var CONFIG_FILES = process.env.CONFIG_FILES || '/app/vendor/deploy/resmio'

var app = require('express')()
var bodyParser = require('body-parser')
app.use(bodyParser.json())

var server = require('http').Server(app)
server.listen(PORT)

var integrationTools = require('./lib/integrationTools')

const execFile = require('child_process').execFile;
// call the featuredeploy script and passes the last stdout line as argument
const featuredeploy = (args, callback) => {
  execFile('featuredeploy', args, {cwd: CONFIG_FILES}, (error, stdout, stderr) => {
    if (error) { console.error(error) }
    else {
      stdout = stdout.trim()
      let lastLine = stdout.substr(stdout.lastIndexOf('\n') + 1) // last line
      callback(lastLine)
    }
  })
}

app.post('/pull_request', (req, res) => {
  if (req.query.secret === SECRET) { // in other endpoint we use POST for the secret
    const {action, pull_request, label, repository, installation, sender} = req.body
    const nonBotSender = sender && sender.type && sender.type !== 'Bot'
    if (installation && installation.id && action && pull_request) {
      switch (action) {
        case 'labeled':
          if (nonBotSender && label.name === GITHUB_LABEL_NAME) {
            integrationTools.makeGithubFeatureDeployComments({
              installationId: installation.id,
              pullUrl: pull_request.url,
              message: 'building...'
            })
            featuredeploy(['deploy', pull_request.head.ref, pull_request.head.sha], () => false)
          }
          break
        case 'unlabeled':
          if (nonBotSender && label.name === GITHUB_LABEL_NAME ) {
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
            pullUrl: pull_request.url
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
  } else {
    res.sendStatus(403)
  }
})

app.post('/error', (req, res) => {
  if (req.body.secret === SECRET) {
    const {full_name: fullName, branch: branchName, installation_id: installationId, ip} = req.body
    integrationTools.makeGithubFeatureDeployComments({
      installationId,
      branchName,
      fullName,
      message: 'error happened... check it out here http://' + ip,
    })
    res.sendStatus(200)
  } else {
    res.sendStatus(403)
  }
})

app.post('/destroy', (req, res) => {
  if (req.body.secret === SECRET) {
    const {full_name: fullName, branch: branchName, installation_id: installationId} = req.body
    integrationTools.removeGithubFeatureDeployComments({
      installationId,
      branchName,
      fullName
    })
    res.sendStatus(200)
  } else {
    res.sendStatus(403)
  }
})

app.post('/deployed', (req, res) => {
  if (req.body.secret === SECRET) {
    const {full_name: fullName, branch: branchName, installation_id: installationId, ip, hash} = req.body
    integrationTools.makeGithubFeatureDeployComments({
      installationId,
      branchName,
      fullName,
      message: 'deployed to http://' + ip + ' ' + hash,
    })
  res.sendStatus(200)
  } else {
    res.sendStatus(403)
  }
})
