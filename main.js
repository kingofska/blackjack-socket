var Boom = require('boom'),
    Player = require('./schemas/player'),
    Game = require('./modules/game'),
    server = require('./server'),
    socket = require('./socket')(server);

var game = new Game(socket);

/**
 * Serve static files ( html, js, css )
 */
server.route({
    method: 'GET',
    path: '/{param*}',
    handler: {
        directory: {
            path: 'public',
            listing: true
        }
    }
});

/**
 * Adds a new player
 */
server.route({
    method: 'GET',
    path: '/player',
    handler: function (request, reply) {

      game.addPlayer()
      .then(function(response){
          reply(response);
      });

    }
});

/**
 * Gets the first hand of card for a given player
 */
server.route({
    method: 'GET',
    path: '/player/{name}/cards',
    handler: function (request, reply) {
        var playerName = request.params.name;
        game.dealToPlayer(playerName)
            .then(function(response){
                reply(response);
            },function(){
                reply(Boom.unauthorized());
            });;

    }
});

/**
 * Hit another card for a given player
 */
server.route({
    method: 'GET',
    path: '/player/{name}/hit',
    handler: function (request, reply) {
        var playerName = request.params.name;

        game.hit(playerName)
            .then(
            function(response){
                reply(response);
            },
            function(){
                reply(Boom.unauthorized());
            }
        );

    }
});

/**
 * Pass the hand to the next player
 */
server.route({
    method: 'GET',
    path: '/player/{name}/stand',
    handler: function (request, reply) {
        var playerName = request.params.name;

        game.stand(playerName)
            .then(
            function() {
                reply()
            },function(){
                reply(Boom.unauthorized());
            }
        );
    }
});

