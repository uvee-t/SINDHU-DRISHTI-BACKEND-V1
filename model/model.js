import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
        distCode: {
                type: String,
                required: true,
                trim :true,
        },
        username: {
                type:String,
                trim: true,
                required: true,
        },
        password: {
                type: String,
                required: true,
        }
},{timestamps: true})
const User = mongoose.model("User", userSchema);
export {User};