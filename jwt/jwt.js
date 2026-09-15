import jwt from "jsonwebtoken";
const genJWT = (distCode, email)=>{
        try{
                return jwt.sign({distCode, email}, process.env.SECRET_KEY, {expiresIn: "1h"});  
        }
        catch(err){
                console.log(err);
        }
}
const verifyJWT = (token)=>{
        try{
                return jwt.verify(token,process.env.SECRET_KEY);
        }
        catch(err){
                console.log(err);
        }
}
export {genJWT, verifyJWT};