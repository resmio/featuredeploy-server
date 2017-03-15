export const makeGithubFeatureDeployComments = (integrationId, installationId, cert, pullUrl, message, giphyApiKey) => {
  tools.getJWT(integrationId, cert).then((token) => {
    tools.getGithubToken(installationId, token).then((ghToken) => {
      tools.getPullRequest(pullUrl, ghToken).then((pull) => {
        if (message) {
          tools.commentOnPullRequest(pull.comments_url, message, ghToken).then((newComment) => {
            tools.getPullComments(pull.comments_url, ghToken).then((comments) => {
              var oldBotComments = comments.filter((c) => {c.user.id === newComment.user.id && c.id !== newComment.id})
              tools.deleteMultipleComments(oldBotComments, ghToken).then(() => {

              }) // end delete old bot comments
            }) // end getPullComments
          }) // end first comment
        }
      }) // end getPullRequest
    }) // end getGithubToken
  }).catch((e) => { console.log(e) }) // end getJWT
}
