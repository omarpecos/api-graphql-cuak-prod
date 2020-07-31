const {gql} = require('apollo-server-express');

//typeDefs
const typeDefs = gql`
    scalar DateTime

    directive @auth on FIELD_DEFINITION
    directive @admin on FIELD_DEFINITION

    type Token{
        token : String !
        user : User!
    }

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

    input newCuakInput{
        title : String!
        text : String!
        isImageUrl : Boolean!
        imageUrl : String
    }

    type Favorite {
        userId : ID!
        
        user : User!
        cuak : Cuak!
    }

    type Reply {
        _id : ID!
        cuakId : ID!
        text : String
        date : DateTime!

        user : User!
    }

    type Conversation {
        _id : ID!
        title : String!
        type : String!
        notifications : Int
        
        participants : [User!]!
        messages : [Message!]!
    }

    type Message {
        _id : ID!
        converId : ID!
        text : String!
        date : DateTime!

        sender : User!
    }

    input PagInput{
        next : String
        previous : String
    }

    type PaginatedCuak {
        results : [Cuak!]!
        previous : String!
        hasPrevious : Boolean!
        next : String
        hasNext : Boolean!
    }

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

    type Subscription {
        newReplySub : Reply

        newMsgSub : Message!

        newPrivateConver : Conversation!
    }
`;

module.exports = typeDefs;