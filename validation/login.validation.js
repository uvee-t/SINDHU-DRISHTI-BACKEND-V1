import Joi from "joi";
const loginValidateSchema = Joi.object({
        distCode: Joi.string().required().trim(),
        email: Joi.string().required().trim(),
        password: Joi.string().required().regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/),
})
export {loginValidateSchema};