var Deck = (function(){

    var cards = [];
    var suits = [ "suitclubs", "suitspades", "suithearts", "suitdiamonds"];



    return {
        /**
         * Generates a new deck, resetting all cards
         */
        startNew: function(){
            cards = [];
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
        }


    }
})();

module.exports = Deck;