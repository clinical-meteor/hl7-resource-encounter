
JsonRoutes.Middleware.use(
    '/api/*',
    oAuth2Server.oauthserver.authorise()   // OAUTH FLOW - A7.1
);




JsonRoutes.add("get", "/encounter/:id", function (req, res, next) {
  console.log('GET /encounter/' + req.params.id);

  var accessTokenStr = (req.params && req.params.access_token) || (req.query && req.query.access_token);
  var accessToken = oAuth2Server.collections.accessToken.findOne({accessToken: accessTokenStr});

  if (accessToken) {
    console.log('accessToken', accessToken);
    console.log('accessToken.userId', accessToken.userId);

    var id = req.params.id;
    console.log('Encounters.findOne(id)', Encounters.findOne(id));

    JsonRoutes.sendResult(res, {
      code: 200,
      data: Encounters.findOne(id)
    });
  } else {
    JsonRoutes.sendResult(res, {
      code: 401
    });
  }
});
