# Cuak GraphQL API

- [Cuak GraphQL API](#cuak-graphql-api)
  * [Description](#description)
  * [Documentation](#documentation)
    + [Mongoose Schemas](#mongoose-schemas)
      - [User](#user)
      - [Cuak](#cuak)
      - [Reply](#reply)
      - [Favorite](#favorite)
      - [Conversation](#conversation)
      - [Message](#message)
    + [GraphQL Schema : Inputs](#graphql-schema---inputs)
      - [NewCuak Input](#newcuak-input)
      - [Page Input](#page-input)
    + [GraphQL Schema : Type Definitions](#graphql-schema---type-definitions)
      - [Token](#token)
      - [User](#user-1)
      - [Cuak](#cuak-1)
      - [Reply](#reply-1)
      - [Favorite](#favorite-1)
      - [Conversation](#conversation-1)
      - [Message](#message-1)
      - [PaginatedCuak](#paginatedcuak)
    + [GraphQL Schema : Queries](#graphql-schema---queries)
    + [GraphQL Schema : Mutations](#graphql-schema---mutations)
    + [GraphQL Schema : Subscriptions](#graphql-schema---subscriptions)
  * [Installation](#installation)
    + [Environment](#environment)
    + [Start server](#start-server)
  * [Usage](#usage)
  * [Project Timeline](#project-timeline)

[tags: `Documentation` `GraphQL` `Node` `Express` `Mongoose` `GraphQL API` `Apollo Server` `apollo-server-express`](#tags)


## Description
![image alt](https://cdn-media-1.freecodecamp.org/images/1*rhpr5EnxrphBwqyTus0jmg.png "GraphQL,Node,Mongo")

**GraphQL API** developed with **Node**, **Express**, **MongoDB** *(mongoose)*, **Apollo Server** *(apollo-server-express)* with **Queries**,**Mutations** and **Subscriptions** to be consumed by an [Angular app](https://github.com/Omar-Pecos/app-cuak-angular). The idea is to create a social network like Twitter but every post (Cuak) has a random image loaded from [Unsplash](https://unsplash.com/) or a file image uploaded by the user to [Cloudinary](https://cloudinary.com/).

It has **authentication** and **authorization** made with **GraphQL directives** and **JsonWebTokens**, **cursor pagination** with *mongo-cursor-pagination* and **dataloaders** with *graphql-dataloader-mongoose* to reduce the number of requests made to the database and optimize their performance.

## Documentation

### Mongoose Schemas

#### User
<pre>
const userSchema = new Schema({
    username : String,
    email : String,
    password : String,
    role : Number,
    active : Boolean,
    followers : {type : Array , default : []},
    following : {type : Array , default : []}
});
</pre>

#### Cuak
<pre>
const cuakSchema = new Schema({
    userId : String,
    title : String,
    text : String,
    image : String,
    date : {type : Date , default : Date.now},
    lastRepliedAt : {type : Date , default : Date.now}
});
</pre>

#### Reply
<pre>
const replySchema = new Schema({
    userId : String,
    cuakId : String,
    text : String,
    date : { type : Date , default : Date.now }
});
</pre>

#### Favorite
<pre>
const favoriteSchema = new Schema({
    userId : String,
    cuakId : String
});
</pre>

#### Conversation
<pre>
const conversationSchema = new Schema({
    title : String,
    type : {type : String, default : 'group'},
    notifications : { type : Number , default : 0},
    users : {type : Array , default : []}
});
</pre>

#### Message
<pre>
const messageSchema = new Schema({
    text : String,
    converId : String,
    userId : String,
    date : { type : Date , default : Date.now}
});
</pre>

### GraphQL Schema : Inputs

#### NewCuak Input

<pre>
 input newCuakInput{
        title : String!
        text : String!
        isImageUrl : Boolean!
        imageUrl : String
    }
</pre>

#### Page Input

<pre>
 input PagInput{
        next : String
        previous : String
    }
</pre>

### GraphQL Schema : Type Definitions

#### Token
<pre>
type Token{
        token : String !
        user : User!
    }
</pre>

#### User
<pre>
type User {
        _id : ID!
        username : String!
        email : String!
        role : Int!
        active : Boolean!

        cuaks : [Cuak!]!
        favorites : [Favorite!]!
        following : [User!]!
        followers : [User!]!
    }
</pre>

#### Cuak
<pre>
type Cuak {
        _id : ID!
        title : String!
        text : String!
        image : String
        date : DateTime!
        lastRepliedAt : DateTime!
        
        author : User!
        favorites : [Favorite!]!
        replies : [Reply!]!
    }
</pre>

#### Reply
<pre>
 type Reply {
        _id : ID!
        cuakId : ID!
        text : String
        date : DateTime!

        user : User!
    }
</pre>

#### Favorite
<pre>
type Favorite {
        userId : ID!
        
        user : User!
        cuak : Cuak!
    }
</pre>

#### Conversation
<pre>
type Conversation {
        _id : ID!
        title : String!
        type : String!
        notifications : Int
        
        participants : [User!]!
        messages : [Message!]!
    }
</pre>

#### Message
<pre>
 type Message {
        _id : ID!
        converId : ID!
        text : String!
        date : DateTime!

        sender : User!
    }
</pre>

#### PaginatedCuak
<pre>
 type PaginatedCuak {
        results : [Cuak!]!
        previous : String!
        hasPrevious : Boolean!
        next : String
        hasNext : Boolean!
    }
</pre>

### GraphQL Schema : Queries

<pre>
    type Query {
        public : String!
        private : String! @auth
        allUsers : [User!]! @auth
        oneUser (id : ID!) : User! @auth

        allCuaks (paginate : PagInput) : PaginatedCuak!
        oneCuak (id : ID!) : Cuak!
        searchCuaks (search : String!) : [Cuak!]!

        allConversations : [Conversation!]!
        myConversations : [Conversation!]! @auth
    }
</pre>

### GraphQL Schema : Mutations

<pre>
    type Mutation {
        login (username : String! , password : String!) : Token!
        register (username : String!,email :String!,password : String!,confirmPassword : String!) : User!
        markAsFavorite (cuakId : ID!) : Favorite! @auth
        unmarkAsFavorite (cuakId : ID!) : Favorite! @auth
        editUser (id : ID! ,username : String, email :String ,password : String ,newPassword : String, confirmPassword : String) : User! @auth
        blockUser (id : ID!) : User! @admin
        unblockUser (id : ID!) : User! @admin
        grant (id : ID!) : User! @admin
        revoke (id : ID!) : User! @admin
        followUser (id : ID!) : [User!]! @auth
        unfollowUser (id : ID!) : [User!]! @auth
        deleteUser (id : ID!) : User! @admin

        addCuak (input : newCuakInput!,imageFile : Upload) : Cuak! @auth
        editCuak (id : ID! ,input : newCuakInput!, imageFile : Upload ) : Cuak! @auth
        deleteCuak (id : ID!) : Cuak! @auth

        addReply (cuakId : ID! , text : String!) : Reply! @auth
        editReply (replyId : ID! , text : String!) : Reply! @auth
        deleteReply (replyId : ID!) : Reply! @auth

        addConversation (title : String!) : Conversation! @admin
        addPrivateConversation (userIds : [String]!) : Conversation! @auth
        joinConversation (id : ID!) : Conversation! @auth

        newMsg (text : String! , converId : ID!) : Message! @auth
    }
</pre>

### GraphQL Schema : Subscriptions

<pre>
    type Subscription {
        newReplySub : Reply

        newMsgSub : Message!

        newPrivateConver : Conversation!
    }
</pre>


## Installation

To run this API in local you need **npm**

### Environment

You need to create a **.env** file in the root of your project with this structure and fill it with proper data *(Mongo connection string, JWT secret password and Cloudinary account data)*.

<pre>
MONGO_URI=
JWT_SECRET=

CLOUD_NAME=
API_KEY=
API_SECRET=
</pre>

### Start server

Run npm run dev or nodemon index.js for start server (with file changes watcher). The API will be listening at http://localhost:4000/

Run npm start or node index.js for start server. The API will be listening at http://localhost:4000/

## Usage
Visit the [API Apollo Playground](https://api-graphql-cuak-prod.omarpv.repl.co/graphql) where you can try to do some requests or see the GraphQL schema and the documentation automatically generated.

> Deployed with [Repl.it](https://repl.it/)

A simple query you can do there :
<pre>
{
   allCuaks(paginate :{}){
            results{
              title
              author {
                username
              }
              image
            }
    }
}</pre>

To perform more queries or try some mutations see the documentation there and maybe you have to register and log in with a valid user to get the token.
When you get the token you may try to set authorization headers for other queries, mutations or subscriptions like this : <br/>
<pre>
  {
    "Authorization" : "TOKEN"
  }
</pre>

## Project Timeline

![image alt](https://res.cloudinary.com/omarpvcloud/image/upload/v1609848536/Projects/api-node-portfolio/Gantt_GraphQL_API_Cuak_trans_hta4n9.png "Gantt Diagram - Cuak API")

#### Tags
###### tags : `Documentation` `GraphQL` `Node` `Express` `Mongoose` `GraphQL API` `Apollo Server` `apollo-server-express`

