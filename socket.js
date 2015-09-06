function Socket(server) {
    var io = require("socket.io")(server.listener);
    io.on("connection", function (socket) {
        socket.on("playerJoin", function (data) {
            socket.join(data.playerName);
            socket.emit("joined");
            io.to(data.playerName).emit('playerJoined');
        });
    });


    return {
        /**
         * Send a socket message to a player given it's name
         * @param playerName
         */
        sendToPlayer: function (playerName, message) {
            io.to(playerName).emit("message",message);
        },
        broadcast: function(message){
            io.sockets.emit("message",message);
        }
    }
};

module.exports = Socket;