var deck = require('./deck'),
    Player = require('./../schemas/player');

var Dealer = (function(){

    return {

        checkWinner: function(dealerCards, playerTotal){
            var dealerScore = deck.checkCards(dealerCards);

            if(playerTotal > dealerScore.total || dealerScore.state === "BUSTED" ){
                return "PLAYER";
            }else{
                return "DEALER";
            }
        }
    }
})();

module.exports = Dealer;