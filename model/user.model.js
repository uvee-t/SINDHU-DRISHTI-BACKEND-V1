import mongoose from "mongoose";
const userSchema = new mongoose.Schema(
	{
		distCode: {
			type: String,
			required: true,
			trim: true,
		},
		fullname: {
			type: String,
			trim: true,
			required: true,
			minlength: 1,
			maxlength: 50,
		},
		email: {
			type: String,
			trim: true,
			required: true,
			lowercase: true,
			minlength: 5,
			maxlength: 100,
		},
		password: {
			type: String,
			required: true,
		},
		isVerified: {
			type: Boolean,
			deafult: false,
		},
	},
	{ timestamps: true },
);
const User = mongoose.model("User", userSchema);
export { User };
