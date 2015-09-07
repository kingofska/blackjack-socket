var dealer = require('./dealer'),
    Player = require('./../schemas/player'),
    Round = require('./../schemas/round'),
    deck = require('./deck'),
    hat = require('hat');

var Game = function(socket){
    //Clean out previouse games and players, we are just a demo :)
    Round.find({isActive: true}).remove().exec();
    Player.find().remove().exec();

    var rack = hat.rack();

    return {



        /**
         * Adds a new player to the database and return it's name
         * @returns {Promise}
         */
        addPlayer: function(){
            return new Promise(function(resolve){
                var random = Math.floor( Math.random() * 500 );
                var playerName = "Player" + random;
                var playerData = {
                    name: playerName,
                    token: rack()
                };

                var player = new Player(playerData);
                var result = {
                    playerData : playerData
                };

                player.save().then(function(){
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

            return new Promise(function(resolve){
                var dealerState,isActive, dealerCards, playerCards, playerState;
                Round.find({isActive: true},function(err,roundModel) {
                    if (roundModel.length === 0) {
                        deck.startNew();
                        var round = new Round(
                            {
                                activePlayers: [playerName],
                                currentPlayer: playerName,
                                isActive: true
                            });
                        round.dealerCards = [deck.getCard()];
                        dealerCards = round.dealerCards;
                        isActive = true;
                        return round.save();
                    } else {
                        //Logic for already active round
                        roundModel[0].activePlayers.push(playerName);
                        isActive = false;
                        dealerCards = roundModel[0].dealerCards;
                        return roundModel[0].save();
                    }
                }).then(function() {

                    dealerState = dealer.checkCards(dealerCards);

                    playerCards = [deck.getCard(), deck.getCard()];
                    playerState = dealer.checkCards(playerCards);

                    return Player.findOne({name: playerName});
                }).then(function(player){
                    player.total = playerState.total;
                    player.cards = playerCards;
                    player.lastDealDate = new Date();
                   return player.save();
                }).then(function(){

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
                var currentCards, newCard, playerState;
                Round.findOne({isActive: true}).then(function(round) {
                    if (round.currentPlayer !== playerName) {
                        reject();
                    }
                }).then(function() {
                    return Player.findOne({name: playerName});
                }).then(function(player) {

                    currentCards = player.cards;

                    newCard = deck.getCard();
                    currentCards.push(newCard);

                    playerState = dealer.checkCards(currentCards);

                    player.total = playerState.total;
                    player.cards = currentCards;
                    return player.save();
                }).then(function(){
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
                            this.endGame();
                        }else{
                            this.nextPlayer(playerName);
                        }

                    }

                    var message = {
                        otherPlayers : { }
                    };
                    message.otherPlayers[playerName] = response.playerData;
                    //Inform the other users of his current score
                    socket.broadcast(message);

                    resolve(response);
                }.bind(this))
            }.bind(this));
        },

        /**
         * Pass the hand to the next player or to the dealer
         * @param playerName
         * @param reject
         */
        nextPlayer: function (playerName) {
            return new Promise( function(resolve, reject) {
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

                        socket.sendToPlayer(playerName, {isActive: false});
                        resolve({});
                    } else {
                        //Unauthorized to play, wait!!
                        reject();
                    }
                }.bind(this));
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
            var currentRound, dealerCards, dealerState;
            Round.findOne({isActive: true})
            .then(function(roundModel) {
                currentRound = roundModel;
            })
            .then(function() {
                return Player.find({
                    name:   {   $in: currentRound.activePlayers   },
                    total:  {   $lte: 21  }
                }).sort('-total');
            })
            .then(function(players) {
                var maxScore;
                if(players.length === 0){
                    maxScore = 0;
                }else{
                    maxScore = players[0].total;
                }
                dealerCards = dealer.playDealer(currentRound.dealerCards, maxScore);
                dealerState = dealer.checkCards(dealerCards);

                return dealer.getWinners(currentRound, dealerState);
            }).then(function(winningPlayers){

                socket.broadcast({
                    dealerData:{
                        state: dealerState.state,
                        total: dealerState.total,
                        cards: dealerCards
                    },
                    winner: winningPlayers
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