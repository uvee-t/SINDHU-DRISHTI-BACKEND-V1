import mongoose from "mongoose"
const dbconnection = ()=>{
        try{
                mongoose.connect("mongodb+srv://uvee:Ijmp1ZRgvs5jeEnR@cluster0.aenyg2l.mongodb.net/sindhudrishti?appName=Cluster0")
        }
        catch(err){
                console.log(err);
        }
}
export {dbconnection};