var mongoose = require('mongoose'),
    Db = require('../database.js');

var playerSchema = new mongoose.Schema({
    name: String,
    cards: Array,
    total: Number,
    token: String,
    lastDealTime: Date
});

var Player = Db.db.model('Player', playerSchema);

module.exports = Player;