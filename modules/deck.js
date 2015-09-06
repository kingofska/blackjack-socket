var Deck = (function(){

    var cards = [];
    var suits = [ "suitclubs", "suitspades", "suithearts", "suitdiamonds"];



    return {
        /**
         * Generates a new deck, resetting all cards
         */
        startNew: function(){
            for(var suit = 0; suit < 4; suit++){
                for(var cardNumber = 1; cardNumber <= 11; cardNumber++){
                    cards.push({ suit: suits[suit], value: cardNumber});
                }
            }

        },

        /**
         * Choose a random card from the deck, remove and return it
         * @returns {Object} card
         */
        getCard: function(){
            var index = Math.floor( Math.random() * cards.length );
            var cardToReturn = cards[index];
            cards.splice(index, 1);
            return cardToReturn;
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

module.exports = Deck;