
//require mongoose and models
const mongoose = require('mongoose');
const User = require('./user.model');
const Cuak = require('./cuak.model');
const Favorite = require('./favorite.model');
const Reply = require('./reply.model');
const Conversation = require('./conversation.model');
const Message = require('./message.model');

mongoose.set('useFindAndModify',false);
//log queries
mongoose.set('debug', false);

mongoose.connect(
     process.env.MONGO_URI,
     {useNewUrlParser: true , useUnifiedTopology: true}
).then(() =>{
    console.log('Conectado a mongoDB');
    
}).catch(err =>{
    console.log('Algo falló con la BBDD!');
    console.log(err);
});

module.exports = {
    User,
    Cuak,
    Favorite,
    Reply,
    Conversation,
    Message
}