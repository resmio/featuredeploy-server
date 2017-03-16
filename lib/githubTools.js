var request = require('request')

const getGithubToken = (installationId, jwt) => {
  return new Promise((resolve, reject) => {
    request.post(
      {
        url: 'https://api.github.com/installations/' + installationId + '/access_tokens',
        auth: {'bearer': jwt},
        headers: {
          'User-Agent': 'node.js',
          'Accept': 'application/vnd.github.machine-man-preview+json'
        }
      },
      (err, res, body) => {
        if (err) { reject('There was a problem with the github certificate.') }
        else { resolve(JSON.parse(body).token) }
      }
    )
  })
}

const getPullRequestByUrl = (pullUrl, ghToken) => {
  return new Promise((resolve, reject) => {
    request.get(
      {
        url: pullUrl,
        auth: {'bearer': ghToken},
        headers: {
          'User-Agent': 'node.js',
          'Accept': 'application/vnd.github.v3+json'
        }
      },
      (err, res, body) => {
        if (err) { reject('There was a problem getting pull requests.') }
        else { resolve(JSON.parse(body)) }
      }
    )
  })
}

const getPullRequestByBranch = (fullName, branchName, ghToken) => {
  return new Promise((resolve, reject) => {
    request.get(
      {
        url: 'https://api.github.com/repos/' + fullName + '/pulls',
        auth: {'bearer': ghToken},
        headers: {
          'User-Agent': 'node.js',
          'Accept': 'application/vnd.github.v3+json'
        },
        qs: {head: branchName}
      },
      (err, res, body) => {
        var pulls = JSON.parse(body)
        if (err) { reject('There was a problem getting pull requests.') }
        else { resolve(pulls[0]) }
      }
    )
  })
}

const getPullComments = (commentsUrl, ghToken) => {
  return new Promise((resolve, reject) => {
    request.get(
      {
        url: commentsUrl,
        auth: {'bearer': ghToken},
        headers: {
          'User-Agent': 'node.js',
          'Accept': 'application/vnd.github.v3+json'
        }
      },
      (err, res, body) => {
        if (err) { reject('There was a problem getting pull request comments.') }
        else { resolve(JSON.parse(body)) }
      }
    )
  })
}

const deleteComment = (commentUrl, ghToken) => {
  return new Promise((resolve, reject) => {
    request.delete(
      {
        url: commentUrl,
        auth: {'bearer': ghToken},
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
        if (err) { reject('There was a problem deleting one of multiple comments.') }
        else { resolve() }
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
        auth: {'bearer': ghToken},
        headers: {
          'User-Agent': 'node.js',
          'Accept': 'application/vnd.github.v3+json'
        },
        json: {body: message}
      },
      (err, res, body) => {
        if (err) { reject('There was a problem commenting on pull request.') }
        else { resolve(body) }
      }
    )
  })
}

const addLabelToPullRequest = (issueUrl, label, ghToken) => {
  return new Promise((resolve, reject) => {
    request.post(
      {
        url: issueUrl + '/labels',
        auth: {'bearer': ghToken},
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
        auth: {'bearer': ghToken},
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

module.exports = {
  getGithubToken,
  getPullRequestByUrl,
  getPullRequestByBranch,
  getPullComments,
  deleteComment,
  deleteMultipleComments,
  commentOnPullRequest,
  addLabelToPullRequest,
  deleteLabelFromPullRequest
}
