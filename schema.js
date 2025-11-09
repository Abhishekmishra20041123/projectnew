const Joi = require("joi");
//server side validation

module.exports.listingSchema = Joi.object({
  listing: Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    location: Joi.string().required(),
    country: Joi.string().required(),
    price: Joi.number().required().min(0),
    accommodates: Joi.number().min(1).required(),
    propertyType: Joi.string().valid('Entire place','Private room','Shared room','Hotel room').required(),
    bedrooms: Joi.number().min(0).required(),
    bathrooms: Joi.number().min(0.5).required(),
    beds: Joi.number().min(1).required(),
    amenities: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()).optional(),
    houseRules: Joi.object({
      checkIn: Joi.string().optional(),
      checkOut: Joi.string().optional(),
      minStay: Joi.number().min(1).optional(),
      maxStay: Joi.number().min(1).optional(),
      maxGuests: Joi.number().min(1).optional(),
      smokingAllowed: Joi.boolean().optional(),
      petsAllowed: Joi.boolean().optional(),
      eventsAllowed: Joi.boolean().optional()
    }).optional(),
    availability: Joi.object({
      instantBook: Joi.boolean().optional(),
      minAdvanceNotice: Joi.string().valid('Same day','1 day','2 days','3 days','1 week').optional(),
      maxAdvanceNotice: Joi.string().valid('3 months','6 months','9 months','12 months','All dates available').optional()
    }).optional(),
    image: Joi.any(),
    additionalImages: Joi.any(),
    category: Joi.string().valid(
      'Trending',
      'Rooms',
      'Mountain Cities',
      'Castles',
      'Swimming Pools',
      'Camping Ground',
      'Cow Farms',
      'Bus Side',
      'Sea Beaches',
      'Vacant',
      'Hotel'
    ).required()
  }).required().unknown(true)
}).unknown(true);


module.exports.reviewSchema = Joi.object({
    review:Joi.object({
        rating:Joi.number().required().min(1).max(5),
        comment:Joi.string().required()
    }).required(),
})