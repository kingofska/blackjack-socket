var Hapi = require('hapi');
var server = new Hapi.Server();
server.connection({ port: (~~process.env.PORT || 3000 )});

server.register(require('inert'), function (err) {

    if (err) {
        throw err;
    }
    server.start(function () {
        console.log('Server running at:', server.info.uri);
    });
});

module.exports = server;