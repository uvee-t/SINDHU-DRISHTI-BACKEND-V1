import Joi from "joi";
const validateLocation = Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lon: Joi.number().min(-180).max(180).required()
})
export {validateLocation};