import express from "express";
import { loginValidateSchema } from "./validation/login.validation.js";
import { registerValidateSchema } from "./validation/register.validation.js";
import { User } from "./model/user.model.js";
const app = express();
app.post("/auth/register", async (req, res) => {
	try {
		const validateRegister = registerValidateSchema.validate(req.body);
		const { error, success } = validateRegister;
		if (error) {
			return res.status(429).json(error.details[0].message);
		}
		const { fullname, email, distCode, password } = success.data;
		const isEmailExists = await User.findOne({email: email});
		if(isEmailExists){
			return res.status(409).json("Email already exists!");
		}
		const insertData = await User.insertOne({fullname: fullname, email: email, distCode: distCode, password: password})
	} 
	catch (err) {
		console.log(err);
	}
});
app.listen(8000, "0.0.0.0", () => {
	console.log("Server Started...");
});
