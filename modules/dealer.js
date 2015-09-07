var deck = require('./deck'),
    Player = require('./../schemas/player');

var Dealer = (function(){

    return {

        /**
         * Declare the winner/s , checking dealer and player scores
         * @param currentRound
         * @param dealerState
         * @returns {Promise}
         */
        getWinners: function (currentRound, dealerState) {
            var winners;
            var query = {
                name: {$in: currentRound.activePlayers},
                total: { $lte: 21}
            };

            /**
             * If the dealer is still in play, to win the player need to bet his score
             */
            if (dealerState.state !== "BUSTED") {
                query["total"]["$gt"] = dealerState.total;
            }
            return Player.find(query, 'name cards total').then(function (winningPlayers) {
                var dealer = {name: "DEALER"};
                if (dealerState.total < 21) {
                    winners = winningPlayers.length === 0 ? dealer : winningPlayers;
                } else if (dealerState.total === 21) {
                    winners = dealer;
                } else if (dealerState.total > 21) {
                    winners = winningPlayers.length === 0 ? "NONE" : winningPlayers;
                }
                return winners;
            });

        },

        /**
         * Simulate dealer, rules:
 *       * 1 : must at least score 17
         * 2: must try to beat the highest score of the current round players
         * @param dealerCards
         * @param maxToBet
         * @returns {Array of Cards}
         */
        playDealer: function playDealer(dealerCards, maxToBet) {
            var dealerState;
            do {
                var newCard = deck.getCard();
                dealerCards.push(newCard);
                dealerState = this.checkCards(dealerCards);
            } while (
                ( dealerState.total <= 21 &&
                dealerState.total <= maxToBet ) ||
                dealerState.total < 17
            );
            return dealerCards;
        },

        /**
         * Check all cards of a user ( both dealer and player ) and tell the state and the total
         * @param cards
         * @returns {Object}
         */
        checkCards: function(cards){
            var total = 0;
            cards.forEach(function(card){
                total += card.value;
            });
            if(total > 21){
                return {state: "BUSTED", total: total};
            }else if(total == 21){
                return {state: "BLACKJACK", total: total};
            }else if(total <21){
                return {state: "OK", total: total};
            }
        }
    }
})();

module.exports = Dealer;