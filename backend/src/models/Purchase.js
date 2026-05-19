import mongoose from 'mongoose'

const purchaseSchema = new mongoose.Schema(
  {
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
      index: true,
    },
    originalDesignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Design',
      required: true,
    },
    copiedDesignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Design',
      required: true,
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
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'paid',
      index: true,
    },
  },
  { timestamps: true }
)

purchaseSchema.index({ buyerId: 1, createdAt: -1 })
purchaseSchema.index({ sellerId: 1, createdAt: -1 })
purchaseSchema.index({ listingId: 1 }, { unique: true })

purchaseSchema.virtual('id').get(function () {
  return this._id.toString()
})

purchaseSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret._id
    delete ret.__v
    return ret
  },
})

const Purchase = mongoose.model('Purchase', purchaseSchema)

export default Purchase
