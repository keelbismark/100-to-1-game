const Joi = require('joi');
const logger = require('../utils/logger');

const roomValidationError = (error, details) => {
  logger.error('Validation error', { error: error.message, details });
  return {
    success: false,
    error: 'Validation error',
    message: error.message,
    details: details ? details.map(d => d.message) : []
  };
};

const roomValidators = {
  validateCreateRoom: (data) => {
    const schema = Joi.object({
      packId: Joi.string().required().min(1).max(50)
        .messages({
          'string.empty': 'packId не может быть пустым',
          'any.required': 'packId обязателен'
        })
    });

    const { error, value } = schema.validate(data);
    if (error) {
      return roomValidationError(error, error.details);
    }
    return { success: true, data: value };
  },

  validateJoinRoom: (data) => {
    const schema = Joi.object({
      roomId: Joi.string().required().pattern(/^[A-Z0-9]{4}$/)
        .messages({
          'string.pattern.base': 'roomId должен быть 4 символа (A-Z, 0-9)',
          'any.required': 'roomId обязателен'
        }),
      role: Joi.string().required().valid('board', 'admin', 'buzzer')
        .messages({
          'any.only': 'role должен быть board, admin или buzzer',
          'any.required': 'role обязателен'
        })
    });

    const { error, value } = schema.validate(data);
    if (error) {
      return roomValidationError(error, error.details);
    }
    return { success: true, data: value };
  },

  validateSetTeam: (data) => {
    const schema = Joi.object({
      roomId: Joi.string().required(),
      team: Joi.number().required().valid(1, 2)
        .messages({
          'any.only': 'team должен быть 1 или 2',
          'any.required': 'team обязателен'
        })
    });

    const { error, value } = schema.validate(data);
    if (error) {
      return roomValidationError(error, error.details);
    }
    return { success: true, data: value };
  },

  validateRevealAnswer: (data) => {
    const schema = Joi.object({
      roomId: Joi.string().required(),
      answerIndex: Joi.number().required().min(0).max(100)
        .messages({
          'number.min': 'answerIndex не может быть отрицательным',
          'number.max': 'answerIndex слишком большой'
        })
    });

    const { error, value } = schema.validate(data);
    if (error) {
      return roomValidationError(error, error.details);
    }
    return { success: true, data: value };
  },

  validateAddMistake: (data) => {
    const schema = Joi.object({
      roomId: Joi.string().required()
    });

    const { error, value } = schema.validate(data);
    if (error) {
      return roomValidationError(error, error.details);
    }
    return { success: true, data: value };
  },

  validateSwitchTeam: (data) => {
    const schema = Joi.object({
      roomId: Joi.string().required()
    });

    const { error, value } = schema.validate(data);
    if (error) {
      return roomValidationError(error, error.details);
    }
    return { success: true, data: value };
  },

  validateAwardPoints: (data) => {
    const schema = Joi.object({
      roomId: Joi.string().required(),
      team: Joi.number().required().valid(1, 2),
      points: Joi.number().required().min(0)
        .messages({
          'number.min': 'points не могут быть отрицательными'
        })
    });

    const { error, value } = schema.validate(data);
    if (error) {
      return roomValidationError(error, error.details);
    }
    return { success: true, data: value };
  },

  validateLoadRound: (data) => {
    const schema = Joi.object({
      roomId: Joi.string().required(),
      roundData: Joi.object({
        question: Joi.string().required(),
        answers: Joi.array().items(
          Joi.object({
            text: Joi.string().required(),
            score: Joi.number().required().min(0)
          })
        ).required(),
        type: Joi.string().required().valid('simple', 'double', 'triple', 'reverse')
      }).required()
    });

    const { error, value } = schema.validate(data);
    if (error) {
      return roomValidationError(error, error.details);
    }
    return { success: true, data: value };
  },

  validateBuzzerPress: (data) => {
    const schema = Joi.object({
      roomId: Joi.string().required(),
      team: Joi.number().required().valid(1, 2),
      timestamp: Joi.number().optional()
    });

    const { error, value } = schema.validate(data);
    if (error) {
      return roomValidationError(error, error.details);
    }
    return { success: true, data: value };
  },

  validateResetBuzzer: (data) => {
    const schema = Joi.object({
      roomId: Joi.string().required()
    });

    const { error, value } = schema.validate(data);
    if (error) {
      return roomValidationError(error, error.details);
    }
    return { success: true, data: value };
  },

  validateToggleSound: (data) => {
    const schema = Joi.object({
      roomId: Joi.string().required(),
      enabled: Joi.boolean().required()
    });

    const { error, value } = schema.validate(data);
    if (error) {
      return roomValidationError(error, error.details);
    }
    return { success: true, data: value };
  }
};

module.exports = roomValidators;
