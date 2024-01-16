var GITHUB_INTEGRATION_ID = process.env.GITHUB_INTEGRATION_ID
var GITHUB_PRIVATE_KEY = process.env.GITHUB_PRIVATE_KEY
var GITHUB_LABEL_NAME = process.env.GITHUB_LABEL_NAME

var jwt = require('jsonwebtoken')
var tools = require('./githubTools')
var request = require('request')

const getPullRequest = ({pullUrl, fullName, branchName, installationId}) => {
  return new Promise((resolve, reject) => {
    jwt.sign(
      {iss: GITHUB_INTEGRATION_ID},
      GITHUB_PRIVATE_KEY,
      {algorithm: 'RS256', expiresIn: '1m'},
      (err, token) => {
        if (err) { reject('There was a problem with the github certificate.') }
        else {
          tools.getGithubToken(installationId, token).then((ghToken) => {
            if (pullUrl) {
              tools.getPullRequestByUrl(pullUrl, ghToken)
                   .then((pull) => resolve({pull, ghToken}))
                   .catch((e) => { console.log(e) })
            } else if (fullName && branchName) {
              tools.getPullRequestByBranch(fullName, branchName, ghToken)
                   .then((pull) => resolve({pull, ghToken}))
                   .catch((e) => { console.log(e) })
            } else {
              reject('not enough information to get pull request...')
            }
          }).catch((e) => { console.log(e) })
        }
      }
    )
  })
}

const makeGithubFeatureDeployComments = ({
  installationId,
  pullUrl,
  fullName,
  branchName,
  message,
}) => {
  getPullRequest({pullUrl, fullName, branchName, installationId}).then(({pull, ghToken}) => {
    tools.commentOnPullRequest(pull.comments_url, message, ghToken).then((newComment) => {
      tools.getPullComments(pull.comments_url, ghToken).then((comments) => {
        let oldBotComments = comments.filter((c) => c.user.id === newComment.user.id && c.id !== newComment.id)
        tools.deleteMultipleComments(oldBotComments, ghToken).then(() => {
          tools.getPullLabels(pull.issue_url, ghToken).then((labels) => {
            if (!labels.map((l) => l.name).includes(GITHUB_LABEL_NAME)) {
              tools.addLabelToPullRequest(pull.issue_url, GITHUB_LABEL_NAME, ghToken).catch((e) => { console.log(e) })
            }
          }).catch((e) => { console.log(e) })
        }).catch((e) => { console.log(e) }) // end delete old bot comments
      }).catch((e) => { console.log(e) }) // end getPullComments
    }).catch((e) => { console.log(e) }) // end first comment
  }).catch((e) => { console.log(e) }) // end getPullRequest
}

const removeGithubFeatureDeployComments = ({
  installationId,
  pullUrl,
  fullName,
  branchName
}) => {
  getPullRequest({pullUrl, fullName, branchName, installationId}).then(({pull, ghToken}) => {
    tools.commentOnPullRequest(pull.comments_url, 'removing featuredeploy...', ghToken).then((newComment) => {
      tools.getPullComments(pull.comments_url, ghToken).then((comments) => {
        let allBotComments = comments.filter((c) => c.user.id === newComment.user.id)
        tools.deleteMultipleComments(allBotComments, ghToken).then(() => {
          tools.getPullLabels(pull.issue_url, ghToken).then((labels) => {
            if (labels.map((l) => l.name).includes(GITHUB_LABEL_NAME)) {
              tools.deleteLabelFromPullRequest(pull.issue_url, GITHUB_LABEL_NAME, ghToken).catch((e) => { console.log(e) })
            }
          }).catch((e) => { console.log(e) })
        }).catch((e) => { console.log(e) }) // end delete all bot comments
      }).catch((e) => { console.log(e) }) // end getPullComments
    }).catch((e) => { console.log(e) }) // end first comment
  }).catch((e) => { console.log(e) })
}

const checkForFeatureDeployLabel = ({
  installationId,
  pullUrl,
  fullName,
  branchName
}) => {
  return new Promise((resolve, reject) => {
    getPullRequest({pullUrl, fullName, branchName, installationId}).then(({pull, ghToken}) => {
      tools.getPullLabels(pull.issue_url, ghToken).then((labels) => {
        if (labels) {
          resolve(labels.map((l) => l.name).includes(GITHUB_LABEL_NAME))
        } else {
          reject('There was a problem checking for labels.')
        }
      }).catch((e) => { console.log(e) })
    }).catch((e) => { console.log(e) })
  })
}

module.exports = {
  makeGithubFeatureDeployComments,
  removeGithubFeatureDeployComments,
  checkForFeatureDeployLabel
}
