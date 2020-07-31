const {Schema, model} = require('mongoose');
const MongoPaging = require('mongo-cursor-pagination');

const cuakSchema = new Schema({
    userId : String,
    title : String,
    text : String,
    image : String,
    date : {type : Date , default : Date.now},
    lastRepliedAt : {type : Date , default : Date.now}
});

//plugin para cursor pagination
cuakSchema.plugin(MongoPaging.mongoosePlugin);
const Cuak = new model('Cuak',cuakSchema);

module.exports = Cuak;