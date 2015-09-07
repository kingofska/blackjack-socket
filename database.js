var Mongoose = require('mongoose');

//Mongoose.connect(process.env.MONGODB_URL);
Mongoose.connect("mongodb://cardgame:cardgame123123!@ds035663.mongolab.com:35663/heroku_8q7mxq9p");

var db = Mongoose.connection;
db.on('error', console.error.bind(console, 'connection error'));
db.once('open', function callback() {
    console.log("Connection with database succeeded.");
});
//Mongoose.set('debug', true);

exports.Mongoose = Mongoose;
exports.db = db;