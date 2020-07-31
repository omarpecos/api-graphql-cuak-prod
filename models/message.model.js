const {Schema,model} = require('mongoose');

const messageSchema = new Schema({
    text : String,
    converId : String,
    userId : String,
    date : { type : Date , default : Date.now}
});

const Message = new model('Message', messageSchema);

module.exports = Message;