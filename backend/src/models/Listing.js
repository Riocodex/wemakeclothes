import mongoose from 'mongoose'

const listingSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    designId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Design',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },
    price: {
      type: Number,
      required: true,
      min: 1,
    },
    currency: {
      type: String,
      enum: ['USD', 'EUR', 'GBP'],
      default: 'USD',
    },
    status: {
      type: String,
      enum: ['active', 'sold', 'removed'],
      default: 'active',
      index: true,
    },
    previewImageUrl: {
      type: String,
      default: '',
    },
    soldAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
)

listingSchema.index({ status: 1, createdAt: -1 })
listingSchema.index({ sellerId: 1, status: 1 })

listingSchema.virtual('id').get(function () {
  return this._id.toString()
})

listingSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret._id
    delete ret.__v
    return ret
  },
})

const Listing = mongoose.model('Listing', listingSchema)

export default Listing
