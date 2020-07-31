const {Schema,model} = require('mongoose');

const favoriteSchema = new Schema({
    userId : String,
    cuakId : String
});

const Favorite = new model('Favorite',favoriteSchema);

module.exports = Favorite;