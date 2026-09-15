import Joi from "joi";
const validateTier = Joi.object({
    tier: Joi.string().required().valid('IMMEDIATE', 'SHORT_TERM', 'MEDIUM_TERM', 'MONITOR'),
})
export {validateTier};