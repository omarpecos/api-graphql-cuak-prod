require('dotenv').config();

//requires
const express = require('express');
const mongoose = require('mongoose');
const { ApolloServer, PubSub } = require('apollo-server-express');
const db = require('./models');
const { typeDefs, resolvers } = require('./schema');
const { AuthDirective, AdminDirective } = require('./directives');
const utils = require('./utils');
const http = require('http');
const PORT = process.env.PORT || 4000;

mongoose.set('useFindAndModify',false);
//log queries
mongoose.set('debug', false);

//Dataloader
const { MongooseDataloaderFactory } = require('graphql-dataloader-mongoose');
    //si no estuvieramos con Apollo 
    //let DataLoader = require('graphql-dataloader-mongoose');
    //let dataloaderFactory = new MongooseDataloaderFactory();
    //let userIdDataLoader = dataloaderFactory.mongooseLoader(db.User).dataloader('_id');
    // Porque en ApolloServer se crea un dataloader por cada Request!

//Inicializar PubSub
const pubsub = new PubSub()

// Servidor Apollo
const server = new ApolloServer({
    typeDefs,
    resolvers,
    schemaDirectives: {
        auth: AuthDirective,
        admin: AdminDirective
    },
    context: async (ctx) => {

        let dataloaderFactory = new MongooseDataloaderFactory();

        if (ctx.connection) {
            return {
                db,
                pubsub,
                dataloaderFactory
            }
        } else {
            let authUser = await utils.isAuth(ctx.req);
            // console.log(authUser);

            return {
                db,
                authUser,
                pubsub,
                dataloaderFactory
            };
        }

    }
});

//App de express
const app = express();

//ruta root de prueba
app.get('/', (req, res) => {
    res.send({
        message: ' API de GraphQL en produccion a ' + new Date().toISOString()
    });
});

//Aply Middleware al Server de la App express!
server.applyMiddleware({ app });

//creo el HttpServer para las subscriptions
const HttpServer = http.createServer(app);
server.installSubscriptionHandlers(HttpServer);



mongoose.connect(
    process.env.MONGO_URI,
    {
      useNewUrlParser: true, 
      useUnifiedTopology: true
    }
 )
 .then(() =>{
 
     //app.listen
   HttpServer.listen({ port: PORT }, () => {
     
       console.log('Conectado a mongoDB');
     
       console.log( 
           `API grahpQL escuchando en http://localhost:${PORT}${server.graphqlPath}`
           );
       // console.log(db);
       console.log(
           `Suscripciones listas en ws://localhost:${PORT}${server.subscriptionsPath}`
           );
   });
     
 })
 .catch(err =>{
     console.log('Algo falló con la BBDD!');
     console.log(err);
 });



/* 

I Use a .env like this

MONGO_URI=
JWT_SECRET=


CLOUD_NAME=
API_KEY=
API_SECRET=

*/