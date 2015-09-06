var dealer = require('./dealer'),
    Player = require('./../schemas/player'),
    Round = require('./../schemas/round'),
    deck = require('./deck');

var Game = function(socket){
    //Clean out eventually pending games, we are just a demo :)
    Round.find({isActive: true}).remove().exec();

    return {

        /**
         * Adds a new player to the database and return it's name
         * @returns {Promise}
         */
        addPlayer: function(){
            return new Promise(function(resolve){
                var playerName = "Player" + Math.floor( Math.random() * 500 );

                var player = new Player({
                    name: playerName
                });
                var result = {
                    playerData :{
                        name:   playerName
                    }
                };
                player.save().then(function(){
                    console.log(player._id);
                    resolve(result);
                })
            });
        },

        /**
         * Deal 2 cards to the given player
         * @param playerName
         * @returns {Promise}
         */
        dealToPlayer: function(playerName){

            return new Promise(function(resolve, reject){
                Round.find({isActive: true},function(err,roundModel){
                    var dealerState,isActive, dealerCards;
                    if(roundModel.length === 0) {
                        deck.startNew();
                        var round = new Round(
                            {
                                activePlayers: [playerName],
                                currentPlayer: playerName,
                                isActive: true
                            });
                        round.dealerCards = [ deck.getCard() ];
                        dealerCards = round.dealerCards;
                        isActive = true;
                        round.save();

                    }else{
                        //Logic for already active round
                        roundModel[0].activePlayers.push(playerName);
                        isActive = false
                        dealerCards = roundModel[0].dealerCards;
                        roundModel[0].save();
                    }
                    dealerState = deck.checkCards(dealerCards);

                    var playerCards = [ deck.getCard(), deck.getCard() ];
                    var playerState = deck.checkCards(playerCards);

                    Player.findOne({name: playerName})
                        .then(function(player){
                            console.log(player._id);
                            player.total = playerState.total;
                            player.cards = playerCards;
                            player.lastDealDate = new Date();
                            player.save();
                    });


                    var result = {
                        playerData: {
                            name: playerName,
                            cards: playerCards,
                            state: playerState.state,
                            total: playerState.total
                        },
                        dealerData:{
                            cards: dealerCards,
                            state: dealerState.state,
                            total: dealerState.total
                        }

                    };

                    var message = { otherPlayers:{}};
                    message.otherPlayers[playerName] = result.playerData;
                    //Inform the other user of his current score
                    socket.broadcast(message);

                    socket.sendToPlayer(playerName,{isActive: isActive});
                    resolve ( result );
                })

            });

        },

        /**
         * Hit a card for a given player, and check if does BLACKJACK or gets BUSTED
         * @param playerName
         * @returns {Promise}
         */
        hit: function(playerName){
            return new Promise(function(resolve, reject){
                Round.findOne({isActive: true}).then(function(round) {
                    if (round.currentPlayer !== playerName) {
                        reject("Wait your time");
                    }
                }).then(function() {
                    return Player.findOne({name: playerName});
                }).then(function(player){
                    var currentCards, newCard, playerState;
                    currentCards = player.cards;

                    newCard = deck.getCard();
                    currentCards.push(newCard);

                    playerState = deck.checkCards(currentCards);

                    player.total = playerState.total;

                    player.cards = currentCards;
                    player.save(function (err, player) {
                        if (err) return console.error(err);
                    });

                    var response = {
                        playerData: {
                            name: playerName,
                            cards: currentCards,
                            state: playerState.state,
                            total: playerState.total
                        }
                    };

                    if(playerState.state === "BLACKJACK" || playerState.state === "BUSTED"){
                        if(playerState.state === "BLACKJACK"){
                            response.winner =  playerName;
                        }
                        this.nextPlayer(playerName);
                    }

                    var message = { otherPlayers:{}};
                    message.otherPlayers[playerName] = response.playerData;
                    //Inform the other user of his current score
                    socket.broadcast(message);

                    resolve(response);
                }.bind(this))
            }.bind(this));
        },

        /**
         * Pass the hand to the next player or to the dealer
         * @param playerName
         * @param resolve
         * @param reject
         */
        nextPlayer: function (playerName, resolve, reject) {
            Round.findOne({isActive: true}).then(function (round) {
                if (playerName === round.currentPlayer) {
                    var nextPlayer = round.nextPlayer;
                    if (nextPlayer) {
                        round.currentPlayer = nextPlayer;
                        round.save();
                        socket.sendToPlayer(nextPlayer, {isActive: true});
                    } else {
                        //let the dealer play
                        this.playDealer();
                    }
                    if(resolve){
                        resolve({});
                    }
                    socket.sendToPlayer(playerName, {isActive: false});
                } else {
                    //Unauthorized to play, wait!!
                    reject({message: "It's not your time"});
                }
            }.bind(this));
        },

        /**
         * Pass the round to the next player as the cyrrent player stands
         * @param playerName
         * @returns {Promise}
         */
        stand: function(playerName){
            return new Promise(function(resolve, reject){
                this.nextPlayer(playerName, resolve, reject);
            }.bind(this));
        },

        /**
         * Simulate the dealer playin his hand
         */
        playDealer: function(){
            var currentRound, winners, dealerCards, dealerState;
            Round.findOne({isActive: true},function(err,roundModel) {
                currentRound = roundModel;
                return roundModel;
            }).then(function(roundModel) {
                return Player.find({
                    name: {$in: currentRound.activePlayers}
                }).sort('-total');
            }).then(function(players) {
                dealerCards = currentRound.dealerCards;

                do {
                    var newCard = deck.getCard();
                    dealerCards.push(newCard);
                    dealerState = deck.checkCards(dealerCards);
                } while (dealerState.total <= 21 && dealerState.total <= players[0].total);
                var query = {
                    name: {$in: currentRound.activePlayers}
                };
                if(dealerState.state !== "BUSTED"){
                    query["total"] =  {$gt: dealerState.total, $lte: 21};
                }
                return Player.find(query);
            }).then(function(winningPlayers){

                if(dealerState.total < 21){
                    winners = winningPlayers.length === 0 ? "DEALER" : winningPlayers;
                }else if(dealerState.total === 21){
                    winners = "DEALER";
                }else if(dealerState.total > 21){
                    winners = winningPlayers.length === 0 ? "NONE" : winningPlayers;
                }

                socket.broadcast({
                    dealerData:{
                        state: dealerState.state,
                        total: dealerState.total,
                        cards: dealerCards
                    },
                    winner: winners
                });

                this.endGame();

            }.bind(this));
        },

        /**
         * Emd the current round and save to DB
         */
        endGame: function(){
            Round.findOne({isActive: true},function(err,roundModel){
                roundModel.isActive = false;
                roundModel.save();
            });
        }
    }
};

module.exports = Game;