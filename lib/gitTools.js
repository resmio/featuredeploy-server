var jwt = require('jsonwebtoken')
var request = require('request')

const getJWT = (integrationId, cert) => {
  return new Promise((resolve, reject) => {
    jwt.sign(
      {iss: integrationId},
      cert,
      {algorithm: 'RS256', expiresIn: '1m'},
      (err, token) => {
        if (err) { reject('There was a problem with the github certificate.') }
        else { resolve(token) }
      }
    )
  })
}

const getGithubToken = (installationId, token) => {
  return new Promise((resolve, reject) => {
    request.post(
      {
        url: 'https://api.github.com/installations/' + installationId + '/access_tokens',
        auth: {
          'bearer': token
        },
        headers: {
          'User-Agent': 'node.js',
          'Accept': 'application/vnd.github.machine-man-preview+json'
        }
      },
      (err, res, body) => {
        var data = JSON.parse(body)
        if (err) { reject('There was a problem with the github certificate.') }
        else { resolve(data.token) }
      }
    )
  })
}

const getPullRequest = (pullUrl, ghToken) => {
  return new Promise((resolve, reject) => {
    request.get(
      {
        url: pullUrl,
        auth: {
          'bearer': ghToken
        },
        headers: {
          'User-Agent': 'node.js',
          'Accept': 'application/vnd.github.v3+json'
        }
      },
      (err, res, body) => {
        var pull = JSON.parse(body)
        if (err) { reject('There was a problem getting pull requests.') }
        else { resolve(pull) }
      }
    )
  })
}

const getPullComments = (commentsUrl, ghToken) => {
  return new Promise((resolve, reject) => {
    request.get(
      {
        url: commentsUrl,
        auth: {
          'bearer': ghToken
        },
        headers: {
          'User-Agent': 'node.js',
          'Accept': 'application/vnd.github.v3+json'
        }
      },
      (err, res, body) => {
        var comments = JSON.parse(body)
        if (err) { reject('There was a problem getting pull request comments.') }
        else { resolve(comments) }
      }
    )
  })
}

const deleteComment = (commentUrl, ghToken) => {
  return new Promise((resolve, reject) => {
    request.delete(
      {
        url: commentUrl,
        auth: {
          'bearer': ghToken
        },
        headers: {
          'User-Agent': 'node.js',
          'Accept': 'application/vnd.github.v3+json'
        }
      },
      (err, res, body) => {
        if (err) { reject('There was a problem deleting a comment.') }
        else { resolve() }
      }
    )
  })
}

const deleteMultipleComments = (comments, ghToken) => {
  var promises = []
  comments.forEach((comment) => {
    promises.push(new Promise((resolve, reject) => {
      deleteComment(comment.url, ghToken).then((err) => {
        if (err) { reject() } else {
          resolve()
        }
      })
    }))
  })
  return Promise.all(promises)
}

const commentOnPullRequest = (commentsUrl, message, ghToken) => {
  return new Promise((resolve, reject) => {
    request.post(
      {
        url: commentsUrl,
        auth: {
          'bearer': ghToken
        },
        headers: {
          'User-Agent': 'node.js',
          'Accept': 'application/vnd.github.v3+json'
        },
        json: {body: message}
      },
      (err, res, body) => {
        console.log(body)
        if (err) { reject('There was a problem commenting on pull request.') }
        else { resolve(body) }
      }
    )
  })
}

const addLabelToPullRequest = (issueUrl, label, ghToken) => {
  console.log(issueUrl)
  return new Promise((resolve, reject) => {
    request.post(
      {
        url: issueUrl + '/labels',
        auth: {
          'bearer': ghToken
        },
        headers: {
          'User-Agent': 'node.js',
          'Accept': 'application/vnd.github.v3+json'
        },
        json: [label]
      },
      (err, res, body) => {
        if (err) { reject('There was a problem adding a label to a pull request.') }
        else { resolve() }
      }
    )
  })
}

const deleteLabelFromPullRequest = (issueUrl, label, ghToken) => {
  return new Promise((resolve, reject) => {
    request.delete(
      {
        url: issueUrl + '/labels/' + label,
        auth: {
          'bearer': ghToken
        },
        headers: {
          'User-Agent': 'node.js',
          'Accept': 'application/vnd.github.v3+json'
        }
      },
      (err, res, body) => {
        if (err) { reject('There was a problem deleting a label.') }
        else { resolve() }
      }
    )
  })
}

const getGiphyFromPullTitle = (title, giphyApiKey) => {
  return new Promise((resolve, reject) => {
    var searchTerms = encodeURIComponent(title)
    var giphySearchUrl = 'http://api.giphy.com/v1/gifs/search?q=' + searchTerms + '&api_key=' + giphyApiKey
    var giphyGifUrl = 'http://i.giphy.com/'

    request.get(
      {url: giphySearchUrl},
      (err, res, body) => {
        var data = JSON.parse(body)
        if (data.data && data.data.length) {
          var randomOne = data.data[Math.floor(Math.random() * data.data.length)]
          var message = '![](' + giphyGifUrl + randomOne.id + '.' + randomOne.type + ')'
          resolve(message)
        } else {
          reject()
        }
      }
    )
  })
}

module.exports ={
  getJWT,
  getGithubToken,
  getPullRequest,
  getPullComments,
  deleteComment,
  deleteMultipleComments,
  commentOnPullRequest,
  addLabelToPullRequest,
  deleteLabelFromPullRequest,
  getGiphyFromPullTitle
}
