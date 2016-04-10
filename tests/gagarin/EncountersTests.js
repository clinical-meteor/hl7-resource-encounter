describe('clinical:hl7-resources-encounter', function () {
  var server = meteor();
  var client = browser(server);

  it('Encounters should exist on the client', function () {
    return client.execute(function () {
      expect(Encounters).to.exist;
    });
  });

  it('Encounters should exist on the server', function () {
    return server.execute(function () {
      expect(Encounters).to.exist;
    });
  });

});
