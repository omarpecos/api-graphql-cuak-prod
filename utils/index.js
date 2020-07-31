var jwt = require('jsonwebtoken');
const db = require('../models');

isAuth = async (req) => {
    let token;

    if (req.headers.authorization) {
        token = req.header('authorization');

        try{
            let decoded = jwt.verify(token, process.env.JWT_SECRET);
            //console.log(decoded);
            
           let user = await db.User.findById(decoded.id);
           return user;
                
        }catch (e){
            //console.log(e); error al verify!
            return null
        }

    } else {
        return null;
    }

}

module.exports = { isAuth };