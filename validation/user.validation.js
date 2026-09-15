import Joi from "joi";
const validate = Joi.object({
        distCode: Joi.string().required().trim(),
        username: Joi.string().required().trim(),
        password: join.string().required().regex("^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=*])(?=\S+$).{8,15}$"),
})
export {validate};