const { UserInputError, ApolloError, ForbiddenError } = require('apollo-server-express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const GraphQLDateTime = require('graphql-type-datetime');
var sortBy = require('lodash.sortby');

const NEW_MSG = 'NEW_MSG';
const NEW_REPLY = 'NEW_REPLY';
const NEW_PRIVATE_CONVER = 'NEW_PRIVATE_CONVER';

//resolvers
const resolvers = {
    /* Resolver for DateTime */
    DateTime: GraphQLDateTime,

    Query: {
        /*** RUTAS DE PRUEBA  */

        /* hello(parent,args,{chain}){
            return 'Hello world from a GraphQL API!! le he pasado >> '+ chain;
        }*/
        public(parent, args, { }) {
            return 'Hello from PUBLIC content!';
        },
        // El primero hecho con directiva @auth
        private(parent, args, { authUser }) {
            return 'Hello from PRIVATE content! eres el user : ' + authUser.username + ' con ID : ' + authUser._id;
        },

        /* User */
        allUsers(parent, args, { db }) {
            const users = db.User.find({}).sort('-_id');
            return users;
        },
       async oneUser(parent, {id} , {db,authUser}){
            const user =  await db.User.findById(id);
            if (!user) {
                // like 404 - posible InputTypeError también
                throw new ApolloError('Not found');
            }
            
            if (id != authUser._id && authUser.role == 0){
                throw new ForbiddenError('Not authorized to get user data');
            }
            return user;
        },

        /* Cuak */
       allCuaks(parent, { paginate }, { db }) {
           /* const cuaks = db.Cuak.find({}).sort('-lastRepliedAt');
            return cuaks;*/
            
            let Cuak = db.Cuak;
            let cursorParams = {  limit : 10, paginatedField : 'lastRepliedAt' , ...paginate};
                // console.log('cursorParams>>');
                // console.log(cursorParams);
            
            const result = Cuak.paginate(cursorParams);
            return result;
            
          /*  Cuak.paginate( cursorParams )
                .then(result => {
                    console.log(result);
                    
                    return result;
                })
                .catch(e =>{
                    console.log(e);
                });*/
        },
        async oneCuak(parent, { id }, { db }) {
            const cuak = await db.Cuak.findById(id);

            if (!cuak) {
                // like 404 - posible InputTypeError también
                throw new ApolloError('Not found');
            }
            return cuak;
        },
        searchCuaks(parent, {search}, {db}){
            const cuaks = db.Cuak.find({
                "$or" : [
                    {'title' : { "$regex" : search, "$options" : "i" }},
                    {'text' : { "$regex" : search, "$options" : "i" }}
                ]
            });

            return cuaks;
        },

        /* Convers */
        allConversations(parent, args,{db}){
            return db.Conversation.find({}).sort('-_id');
        },
        myConversations(parent, args, {db , authUser}){
            const convers = db.Conversation.find(
                { users : { "$regex" : (authUser._id).toString() , "$options" : "i"}}
            );
            return convers;
        }
    },

    Mutation: {
        /* User AUTH */
        async register(parent, { username, email, password, confirmPassword }, { db }) {
            //checkear que no hay otro usuario con su mismo username
            const user = await db.User.findOne({ username: username });

            if (user) {
                //hay otro ya con ese nombre throw error
                throw new UserInputError('Username in use', {
                    invalidArgs: ['username'],
                });
            }

            if (password != confirmPassword) {
                //contraseñas diferentes
                throw new UserInputError('Passwords not match', {
                    invalidArgs: ['password', 'confirmPassword']
                });
            }

            //Se crea el User
            var passHashed = await bcrypt.hash(password, 10);
            var newUser = new db.User({ username, email });
            newUser.password = passHashed;
            newUser.active = 1; // como bool
            newUser.role = 0;

            await newUser.save();
            return newUser;
        },

        async login(parent, { username, password }, { db }) {
            //saca el user
            const user = await db.User.findOne({ username: username });
            if (!user) {
                //hay otro ya con ese nombre throw error
                throw new UserInputError('User dont exist', {
                    invalidArgs: ['username'],
                });
            }

            var match = bcrypt.compareSync(password, user.password);

            if (match) {
                //coincide las pass - do login - jwt
                var token = jwt.sign(
                    { id: user._id, username: user.username, email: user.email, role: user.role },
                    process.env.JWT_SECRET,
                    { expiresIn: '24h' }
                );

                return {
                    token: token,
                    user: user
                };

            } else {
                //hay otro ya con ese nombre throw error
                throw new UserInputError('Password not valid', {
                    invalidArgs: ['password'],
                });
            }
        },

        /* User */
        markAsFavorite(parent, { cuakId }, { db, authUser }) {
            return db.Favorite.create({
                userId: authUser._id,
                cuakId : cuakId
            });
        },
       async unmarkAsFavorite(parent, { cuakId }, { db, authUser }) {
            const cuak = await db.Favorite.findOneAndDelete({
                userId: authUser._id,
                cuakId : cuakId
            });
            return cuak;
        },
        async editUser(parent, {id , username , email, password, newPassword, confirmPassword}, {db,authUser}){
            const user = await db.User.findById(id);
            user.username = username;
            user.email = email;

            //dispuesto a cambiar la pass
            if (password){
                let matchPass = bcrypt.compareSync(password, user.password);
                
                //La antigua contraseña no coincide
                if (!matchPass){
                    throw new UserInputError('Password do not match our records',{
                        invalidArgs : ['password']
                    });
                }

                if (newPassword != confirmPassword){
                    throw new UserInputError('New and confirmed passwords do not match',{
                        invalidArgs : ['newPassword','confirmPassword']
                    });
                }else{
                    user.password = await bcrypt.hash(newPassword,10);
                }
            }

            await user.save();
            return user;
        },
        blockUser(parent,{id}, {db}){
            const user = db.User.findByIdAndUpdate(id,{ active : false }, {new : true});
            return user;
        },
        unblockUser(parent,{id}, {db}){
            const user = db.User.findByIdAndUpdate(id,{ active : true }, {new : true});
            return user;
        },
        grant(parent,{id}, {db}){
            const user = db.User.findByIdAndUpdate(id,{ role : 1 }, {new : true});
            return user;
        },
        revoke(parent,{id}, {db}){
            const user = db.User.findByIdAndUpdate(id,{ role : 0 }, {new : true});
            return user;
        },
        async followUser(parent, {id}, {db,authUser}){
            const myUser = await db.User.findById(authUser._id);
            let following = myUser.following;
            following.push(id);
            await myUser.save();

            const otherUser = await db.User.findById(id);
            let followers = otherUser.followers;
            followers.push( (authUser._id).toString() );
            await otherUser.save();

            return [myUser,otherUser];
        },
        async unfollowUser(parent , {id}, {db,authUser}){
            const myUser = await db.User.findById(authUser._id);
            let following = myUser.following;
            myUser.following = following.filter(idUser => idUser != id);
            await myUser.save();

            const otherUser = await db.User.findById(id);
            let followers = otherUser.followers;
            otherUser.followers = followers.filter(idUser => idUser != (authUser._id).toString() );
            await otherUser.save();

            return [myUser,otherUser];
        },
        async deleteUser(parent, {id}, {db}){
            const user = await db.User.findByIdAndDelete(id);
            return user;
        },

        /* Cuak */
        async addCuak(parent, { input, imageFile }, { db, authUser }) {
            var image = null;

            var cuak = new db.Cuak();
            cuak.userId = authUser._id;
            cuak.title = input.title;
            cuak.text = input.text;

            //trae IsImgUrl a true o es una Upload
            if (input.isImageUrl == true) {
                if (input.imageUrl) {
                    image = input.imageUrl;
                }// o se queda a null

            } else {

                // subida de archivo
               // const { createReadStream } = await imageFile;
                const  {createReadStream}  = await imageFile;
                console.log(imageFile);
                

                cloudinary.config({
                    cloud_name: process.env.CLOUD_NAME,
                    api_key: process.env.API_KEY,
                    api_secret: process.env.API_SECRET
                });

                try {
                    const result = await new Promise((resolve, reject) => {
                        createReadStream().pipe(
                            cloudinary.uploader.upload_stream((error, result) => {
                                if (error) {
                                    reject(error);
                                }

                                resolve(result)
                            }));
                    });

                    image = result.secure_url;
                } catch (e) {
                    throw new ApolloError("There was a problem uploading the Image");
                }
            }

            // Finalmente se setea cuak.image - (null,url , o upload)
            cuak.image = image;
            await cuak.save();
            return cuak;
        },
        async editCuak(parent, { id, input, imageFile }, { db, authUser }) {
            //recoger el cuak con el id
            let cuak = await db.Cuak.findById(id);

            //comprobar que es el usuario que creó el cuak o es admin
            if (cuak.userId != authUser._id && authUser.role == 0) {
                throw new ForbiddenError('Not authorized to edit cuak');
            }
            var image = cuak.image;

            cuak.title = input.title;
            cuak.text = input.text;

            //trae IsImgUrl a true o es una Upload
            if (input.isImageUrl == true) {
                if (input.imageUrl) {
                    image = input.imageUrl;
                }// o se queda a null o la imagen que estuviera ya

            } else {

                // subida de archivo
                const { createReadStream } = await imageFile;

                cloudinary.config({
                    cloud_name: process.env.CLOUD_NAME,
                    api_key: process.env.API_KEY,
                    api_secret: process.env.API_SECRET
                });

                try {
                    const result = await new Promise((resolve, reject) => {
                        createReadStream().pipe(
                            cloudinary.uploader.upload_stream((error, result) => {
                                if (error) {
                                    reject(error);
                                }

                                resolve(result)
                            }));
                    });

                    image = result.secure_url;
                } catch (e) {
                    throw new ApolloError("There was a problem uploading the Image");
                }
            }

            // Finalmente se actualiza cuak.image - (null,url, o upload) o la que ya estuviera y no es ninguna nueva
            cuak.image = image;
            await cuak.save();
            return cuak;
        },
        async deleteCuak(parent, { id }, { db, authUser }) {

            const cuak = await db.Cuak.findById(id);

            //comprobar que es el usuario que creó el cuak o es admin
            if (cuak.userId != authUser._id && authUser.role == 0) {
                throw new ForbiddenError('Not authorized to delete cuak');
            }

            await cuak.remove()
            return cuak;
        },

        /* Reply */
        async addReply(parent, { cuakId, text }, { db, authUser, pubsub }) {
            const reply = new db.Reply({
                userId: authUser._id,
                cuakId,
                text
            });

            const cuak = await db.Cuak.findById(cuakId);
            cuak.lastRepliedAt = reply.date;

            await reply.save();
            await cuak.save();
            pubsub.publish(NEW_REPLY,{newReplySub : reply});
            return reply;
        },
        async editReply(parent, { replyId, text }, { db, authUser }) {
            try {
                const reply = await db.Reply.findByIdAndUpdate(replyId, {
                    text: text,
                    date: new Date().toISOString()
                }, { new: true });

                const cuak = await db.Cuak.findById(reply.cuakId);

                cuak.lastRepliedAt = reply.date;

                await cuak.save();
                return reply;
            } catch (e) {
                throw new ApolloError(e);
            }
        },
        async deleteReply(parent, { replyId }, { db, authUser }) {
            try {
                const reply = await db.Reply.findByIdAndDelete(replyId);

                let replies = await db.Reply.find({ cuakId: reply.cuakId, userId: authUser._id });

                const cuak = await db.Cuak.findById(reply.cuakId);
                if (replies.length == 0) {
                    cuak.lastRepliedAt = cuak.date;
                } else {
                    cuak.lastRepliedAt = replies[(replies.length - 1)].date;
                }
                await cuak.save();
                return reply;
            } catch (e) {
                throw new ApolloError(e);
            }
        },

        /* Conversation */
        addConversation(parent,{title},{db, authUser}){
            const conver = new db.Conversation({
                title : title,
                users : [ (authUser._id).toString() ]
            });
            conver.save();
            return conver;
        },
        async addPrivateConversation (parent, {userIds},{db, pubsub}){
            var title = '';
            const users = await db.User.find({ _id : { $in : userIds }});
            users.map((user,index) =>{
                if (index == 0){
                    title = '@' + user.username + ' - '; 
                }else{
                    title += ('@' + user.username);
                } 
            });

            const conver = new db.Conversation({
                title : title,
                type : 'private',
                users : userIds
            });
            await conver.save();
            //emit evento newPrivateConverSub
            pubsub.publish( NEW_PRIVATE_CONVER,  {newPrivateConver : conver})
            return conver;
        },
        async joinConversation(parent, {id} , {db, authUser}){
            const conver = await db.Conversation.findById(id);
            let participants = conver.users;
            participants.push( (authUser._id).toString() );
            await conver.save();
            return conver;
        },
        // I can do a leaveConversation(){}

        /* Message */
       async newMsg (parent, {converId, text}, {db,authUser, pubsub}){
            const msg = await new db.Message({
                converId,
                userId : authUser._id,
                text
            });

           await msg.save();
            pubsub.publish(NEW_MSG,{newMsgSub : msg});
            return msg;
        }
    },

    Subscription : {
        newMsgSub:{
            subscribe(parent, args,{pubsub}){
               // console.log(pubsub.asyncIterator(NEW_MSG));
                return pubsub.asyncIterator(NEW_MSG);
            }
        },

        newReplySub : {
            subscribe(parent, args, {pubsub}){
                return pubsub.asyncIterator(NEW_REPLY);
            }
        },

        newPrivateConver : {
            subscribe(parent, args, {pubsub}){
                return pubsub.asyncIterator(NEW_PRIVATE_CONVER);
            }
        }
    },

    User: {
        async cuaks(user, args, { db }) {
            const cuaks = await db.Cuak.find({
                userId: user._id
            });
            return cuaks;
        },
        favorites(user, args, { db }) {
            const cuaks = db.Favorite.find({ userId: user._id });
            return cuaks;
        },
        following(user, args , { db }){
            const following = db.User.find({ _id : { $in : user.following }});
            return following;
        },
        followers(user, args , { db }){
            const followers = db.User.find({ _id : { $in : user.followers }});
            return followers;
        }
    },

    Cuak: {
        author(cuak, args, { dataloaderFactory, db }) {
            //const user = db.User.findById(cuak.userId);
            //return user;
            let userIdDataLoader = dataloaderFactory.mongooseLoader(db.User).dataloader('_id');
            return userIdDataLoader.load(cuak.userId);
        },
        favorites(cuak, args, { db }) {
            const favs = db.Favorite.find({ cuakId: cuak._id });
            return favs;
        },
        replies(cuak, args, { db }) {
            const replies = db.Reply.find({ cuakId: cuak._id });
            return replies;
        }
    },

    Favorite: {
        user(favorite, args, { dataloaderFactory, db }) {
           /* const user = db.User.findById(favorite.userId);
            return user;*/
            let userIdDataLoader = dataloaderFactory.mongooseLoader(db.User).dataloader('_id');
            return userIdDataLoader.load(favorite.userId);
        },
        cuak(favorite, args, { db }) {
            const cuak = db.Cuak.findById(favorite.cuakId);
            return cuak;
        }
    },

    Reply: {
        user(reply, args, { dataloaderFactory, db }) {
            //const user = db.User.findById(reply.userId);
            //return user;
            let userIdDataLoader = dataloaderFactory.mongooseLoader(db.User).dataloader('_id');
            return userIdDataLoader.load(reply.userId);
        },
    },

    Conversation : {
        participants(conver,args,{dataloaderFactory , db}){
           /* const participants = db.User.find(
                {
                 _id : { 
                    $in : conver.users 
                }});

            return participants;*/
            let userIdDataLoader = dataloaderFactory.mongooseLoader(db.User).dataloader('_id');
            return userIdDataLoader.loadMany(conver.users);

        },
        async messages (conver,args, {db}){
            const msgs = await db.Message.find({ converId : conver._id}).sort('-_id').limit(20);
            return sortBy(msgs,['_id']);
        }
    },

    Message : {
        sender (msg, args, {dataloaderFactory , db}){
           // const user = db.User.findById(msg.userId);
           // return user;
            let userIdDataLoader = dataloaderFactory.mongooseLoader(db.User).dataloader('_id');
            return userIdDataLoader.load(msg.userId);
        }
    }
};

module.exports = resolvers;