var GITHUB_INTEGRATION_ID = process.env.GITHUB_INTEGRATION_ID
var GITHUB_PRIVATE_KEY = process.env.GITHUB_PRIVATE_KEY
var GIPHY_API_KEY = process.env.GIPHY_API_KEY

var jwt = require('jsonwebtoken')
var tools = require('./githubTools')
var request = require('request')

const getJWT = () => {
  return new Promise((resolve, reject) => {
    jwt.sign(
      {iss: GITHUB_INTEGRATION_ID},
      GITHUB_PRIVATE_KEY,
      {algorithm: 'RS256', expiresIn: '1m'},
      (err, token) => {
        if (err) { reject('There was a problem with the github certificate.') }
        else { resolve(token) }
      }
    )
  })
}

const getGiphyFromPullTitle = (title) => {
  return new Promise((resolve, reject) => {
    var searchTerms = encodeURIComponent(title)
    var giphySearchUrl = 'http://api.giphy.com/v1/gifs/search?q=' + searchTerms + '&api_key=' + GIPHY_API_KEY
    var giphyGifUrl = 'http://i.giphy.com/'

    request.get(
      {url: giphySearchUrl},
      (err, res, body) => {
        const {data} = JSON.parse(body)
        if (data && data.length) {
          let randomOne = data[Math.floor(Math.random() * data.length)]
          resolve('![](' + giphyGifUrl + randomOne.id + '.' + randomOne.type + ')')
        } else {
          reject()
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
  giphy
}) => {
  getJWT().then((token) => {
    tools.getGithubToken(installationId, token).then((ghToken) => {
      getPullRequest({pullUrl, fullName, branchName, ghToken}).then((pull) => {
        tools.addLabelToPullRequest(pull.issue_url, 'featuredeploy', ghToken)
        tools.commentOnPullRequest(pull.comments_url, message, ghToken).then((newComment) => {
          tools.getPullComments(pull.comments_url, ghToken).then((comments) => {
            let oldBotComments = comments.filter((c) => c.user.id === newComment.user.id && c.id !== newComment.id)
            tools.deleteMultipleComments(oldBotComments, ghToken).then(() => {
              if (giphy) {
                getGiphyFromPullTitle(pull.title).then((giphyMessage) => {
                  if (giphyMessage) { tools.commentOnPullRequest(pull.comments_url, giphyMessage, ghToken) }
                })
              }
            }) // end delete old bot comments
          }) // end getPullComments
        }) // end first comment
      }) // end getPullRequest
    }) // end getGithubToken
  }).catch((e) => { console.log(e) }) // end getJWT
}

const removeGithubFeatureDeployComments = ({
  installationId,
  pullUrl,
  fullName,
  branchName
}) => {
  getJWT().then((token) => {
    tools.getGithubToken(installationId, token).then((ghToken) => {
      getPullRequest({pullUrl, fullName, branchName, ghToken}).then((pull) => {
        tools.commentOnPullRequest(pull.comments_url, 'removing featuredeploy...', ghToken).then((newComment) => {
          tools.getPullComments(pull.comments_url, ghToken).then((comments) => {
            let allBotComments = comments.filter((c) => c.user.id === newComment.user.id)
            tools.deleteMultipleComments(allBotComments, ghToken).then(() => {
              tools.deleteLabelFromPullRequest(pull.issue_url, 'featuredeploy', ghToken)
            }) // end delete all bot comments
          }) // end getPullComments
        }) // end first comment
      })
    })
  }).catch((e) => { console.log(e) })
}

const getPullRequest = ({pullUrl, fullName, branchName, ghToken}) => {
  if (pullUrl) {
    return tools.getPullRequestByUrl(pullUrl, ghToken)
  } else if (fullName && branchName) {
    return tools.getPullRequestByBranch(fullName, branchName, ghToken)
  } else {
    console.log('not enough information to get pull request...')
  }
}

module.exports = {
  makeGithubFeatureDeployComments,
  removeGithubFeatureDeployComments
}
