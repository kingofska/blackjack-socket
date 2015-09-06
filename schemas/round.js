var mongoose = require('mongoose'),
    Db = require('../database.js');

var roundSchema = new mongoose.Schema({
    activePlayers: [],
    currentPlayer: String,
    dealerCards: [],
    isActive: Boolean,
    winner: String
});

roundSchema.virtual('nextPlayer').get(function () {
    var currentPlayerIndex = this.activePlayers.indexOf(this.currentPlayer);
    var newPlayerIndex = currentPlayerIndex + 1 ;
    if(newPlayerIndex < this.activePlayers.length){
        return this.activePlayers[newPlayerIndex];
    }else{
        return false;
    }

});
var Round = Db.db.model('Round', roundSchema);
module.exports = Round;