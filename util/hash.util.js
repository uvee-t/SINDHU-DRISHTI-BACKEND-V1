import bcrypt from "bcrypt";
const hashPass = async (password)=>{
    try{
        return await bcrypt.hash(password,10);
    }
    catch(err){
        console.log(err);
    }
}
const verifyPass = async (password, encPass)=>{
    try{
        return await bcrypt.compare(password, encPass);
    }
    catch(err){
        console.log(err);
    }
}
export {hashPass, verifyPass};