const {Schema,model} = require('mongoose');

const userSchema = new Schema({
    username : String,
    email : String,
    password : String,
    role : Number,
    active : Boolean,
    followers : {type : Array , default : []},
    following : {type : Array , default : []}
});

const User = new model('User',userSchema);

module.exports = User;