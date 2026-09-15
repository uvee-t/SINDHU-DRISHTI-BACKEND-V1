import express from "express";
import { loginValidateSchema } from "./validation/login.validation.js";
import { registerValidateSchema } from "./validation/register.validation.js";
import { User } from "./model/user.model.js";
import { hashPass, verifyPass } from "./util/hash.util.js";
import { dbconnection } from "./db/mongoDB.js";
import { genJWT } from "./jwt/jwt.js";
import "./util/dotenv.util.js";
const app = express();
app.use(express.json());
app.use(express.urlencoded());

app.post("/auth/register", async (req, res) => {
	try {
		const validateRegister = registerValidateSchema.validate(req.body);
		const { value, error } = validateRegister;
		if (error) {
			return res.status(429).json({
				success: false,
				message: error.details[0].message,
			});
		}
		const { fullname, email, distCode, password } = value;
		const isEmailExists = await User.findOne({ email: email });
		if (isEmailExists) {
			return res.status(409).json({
				success: false,
				message: "Email already exists!",
			});
		}
		const insertData = await User.insertOne({
			fullname: fullname,
			email: email,
			distCode: distCode,
			password: await hashPass(password),
		});

		if (!insertData) {
			return res.status(400).json({
				success: false,
				message: "Data insertion failed!",
			});
		}
		return res.status(200).json({
			success: true,
			message: {
				fullname: fullname,
				distCode: distCode,
				email: email,
			},
		});
	} catch (err) {
		console.log(err);
		res.status(500).json({
			success: false,
			message: "Something went wrong!",
		});
	}
});
app.post("/auth/login", async (req, res) => {
	try {
		const validateData = loginValidateSchema.validate(req.body);
		const { value, error } = validateData;
		if (error) {
			return res.status(429).json({
				success: false,
				message: error.details[0].message,
			});
		}
		const { distCode, email, password } = value;
		const isEmailExists = await User.findOne({ email: email });
		if (!isEmailExists) {
			return res.status(400).json({
				success: false,
				message: "Invalid Credentials!",
			});
		}
		if (distCode != isEmailExists.distCode) {
			return res.status(400).json({
				success: false,
				message: "Invalid Credentials!",
			});
		}
		if (!(await verifyPass(password, isEmailExists.password))) {
			return res.status(400).json({
				success: false,
				message: "Invalid Credentials!",
			});
		}
		res.cookie("token", genJWT(distCode, email), {
			expires: new Date(Date.now() + 2 * 60 * 60 * 1000),
			secure: true,
			httpOnly: true,
		});
		return res.status(200).json({
			"success": true,
			"message": "Login Successfull!"
		})
	} catch (err) {
		console.log(err);
		return res.status(500).json({
			success: false,
			message: "Something went wrong",
		});
	}
});
const dbConnect = async () => {
	try {
		await dbconnection();
		console.log("MongoDB connected!");
		app.listen(8000, "0.0.0.0", () => {
			console.log("Server Started...");
		});
	} catch (err) {
		console.log(err);
	}
};
dbConnect();
