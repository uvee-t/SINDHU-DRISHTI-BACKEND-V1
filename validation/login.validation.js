import Joi from "joi";
const loginValidateSchema = Joi.object({
        distCode: Joi.string().required().trim(),
        email: Joi.string().required().trim(),
        password: Joi.string().required().regex("^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=*])(?=\S+$).{8,15}$"),
})
export {loginValidateSchema};