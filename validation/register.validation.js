import Joi from "joi";
const registerValidateSchema = Joi.object({
        fullname: Joi.string().trim().min(1).max(50).required(),
        email: Joi.string().min(5).max(100).required(),
        distCode: Joi.string().trim().required(),
        password: Joi.string().regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/).required(),
})
export {registerValidateSchema};