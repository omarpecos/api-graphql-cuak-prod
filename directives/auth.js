const {SchemaDirectiveVisitor,AuthenticationError,ForbiddenError} = require('apollo-server-express')

class AuthDirective extends SchemaDirectiveVisitor{
    visitFieldDefinition(field){
        const {resolve = defaultFieldResolver} = field;

        field.resolve = function(...args){
           // console.log(args);
            
            const { authUser } = args[2]

            if (!authUser){
                throw new AuthenticationError("Not authenticated")
            }

            //user blocked - active == false
            if (!authUser.active){
                throw new ForbiddenError("User blocked");
            }

            return resolve.apply(this, args)
        };
    }
}

module.exports = AuthDirective