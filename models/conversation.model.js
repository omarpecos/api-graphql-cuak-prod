const {Schema, model} = require('mongoose');

const conversationSchema = new Schema({
    title : String,
    type : {type : String, default : 'group'},
    notifications : { type : Number , default : 0},
    users : {type : Array , default : []}
});

const Conversation = new model('Conversation',conversationSchema);

module.exports = Conversation;