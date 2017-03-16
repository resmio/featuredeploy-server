var GITHUB_INTEGRATION_ID = 1755
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
  message
}) => {
  getJWT().then((token) => {
    tools.getGithubToken(installationId, token).then((ghToken) => {
      tools.getPullRequest(pullUrl, ghToken).then((pull) => {
        if (message) {
          tools.commentOnPullRequest(pull.comments_url, message, ghToken).then((newComment) => {
            tools.getPullComments(pull.comments_url, ghToken).then((comments) => {
              var oldBotComments = comments.filter((c) => c.user.id === newComment.user.id && c.id !== newComment.id)
              tools.deleteMultipleComments(oldBotComments, ghToken).then(() => {
                getGiphyFromPullTitle(pull.title).then((giphyMessage) => {
                  if (giphyMessage) {
                    tools.commentOnPullRequest(pull.comments_url, giphyMessage, ghToken)
                  }
                })
              }) // end delete old bot comments
            }) // end getPullComments
          }) // end first comment
        }
      }) // end getPullRequest
    }) // end getGithubToken
  }).catch((e) => { console.log(e) }) // end getJWT
}

const removeGithubFeatureDeploy = ({
  installationId,
  pullUrl,
  fullName,
  branchName
}) => {
  getJWT().then((token) => {
    tools.getGithubToken(installationId, token).then((ghToken) => {
      if (pullUrl) {
        tools.getPullRequest(pullUrl, ghToken).then((pull) => {
          removeComments(pull, ghToken)
        }) // end getPullRequest
      } else if (fullName && branchName) {
        tools.getPullRequestsByBranch(fullName, branchName, ghToken).then((pull) => {
          removeComments(pull, ghToken)
        })
      } else {
        console.log('not enough information...')
      }
    }) // end getGithubToken
  }).catch((e) => { console.log(e) }) // end getJWT
}

const removeComments = (pull, ghToken) => {
  return tools.commentOnPullRequest(pull.comments_url, 'removing...', ghToken).then((newComment) => {
    tools.getPullComments(pull.comments_url, ghToken).then((comments) => {
      var allBotComments = comments.filter((c) => c.user.id === newComment.user.id)
      tools.deleteMultipleComments(allBotComments, ghToken).then(() => {
        tools.deleteLabelFromPullRequest(pull.issue_url, 'featuredeploy', ghToken)
      }) // end delete all bot comments
    }) // end getPullComments
  }) // end first comment
}

module.exports = {
  makeGithubFeatureDeployComments,
  removeGithubFeatureDeploy
}
