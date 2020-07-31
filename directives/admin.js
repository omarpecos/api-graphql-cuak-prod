const {SchemaDirectiveVisitor , AuthenticationError , ForbiddenError} = require('apollo-server-express');

class AdminDirective extends SchemaDirectiveVisitor{
    visitFieldDefinition(field){
        const {resolve = defaultFieldResolver} = field;

        field.resolve = (...args) => {
            const { authUser } = args[2];

            if (!authUser){
                throw new AuthenticationError("Not authenticated")
            }

            if (authUser.role != 1){
                throw new ForbiddenError("Not authorized");
            }

            //user blocked - active == false
            if (!authUser.active){
                throw new ForbiddenError("User blocked");
            }

            return resolve.apply(this, args);
        }
    }
}

module.exports = AdminDirective;