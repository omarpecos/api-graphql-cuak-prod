const {Schema, model} = require('mongoose');

const replySchema = new Schema({
    userId : String,
    cuakId : String,
    text : String,
    date : { type : Date , default : Date.now }
});

const Reply = new model('Reply', replySchema);

module.exports = Reply;