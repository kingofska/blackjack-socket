var Hapi = require('hapi'),
    server = new Hapi.Server(),
    Player = require('./schemas/player');

server.connection({ port: (~~process.env.PORT || 3000 )});

server.register([require('inert'), require('hapi-auth-bearer-token')], function (err) {

    if (err) {
        throw err;
    }

    server.auth.strategy('token', 'bearer-access-token', {
        validateFunc: function( token, callback ) {

            var request = this;

            Player.findOne({ name: request.params.name }).then(function(player){
                if(player && player.token === token ){
                    callback(null, true, { token: token })
                } else {
                    callback(null, false, { token: token })
                }
            })

        }
    });

    server.start(function () {
        console.log('Server running at:', server.info.uri);
    });
});



module.exports = server;