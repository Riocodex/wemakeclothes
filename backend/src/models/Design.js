import mongoose from 'mongoose'

const designSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
    catalogId: {
      type: String,
      required: true,
      enum: ['tshirt_short', 'tshirt_long', 'shirt', 'vest', 'blouse', 'dress', 'bikini'],
      default: 'tshirt_short',
    },
    type: {
      type: String,
      default: 'tshirt',
      trim: true,
    },
    sleeve: {
      type: String,
      default: 'short',
      trim: true,
    },
    colors: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({ body: '#EFBD48' }),
    },
    textures: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({ logo: './me.jpg', full: './me.jpg' }),
    },
    layers: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    isLogoTexture: {
      type: Boolean,
      default: true,
    },
    isFullTexture: {
      type: Boolean,
      default: false,
    },
    sceneTheme: {
      type: String,
      enum: ['dark', 'light', 'neutral'],
      default: 'dark',
    },
    previewImageUrl: {
      type: String,
      default: '',
    },
    sourceDesignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Design',
      default: null,
    },
  },
  { timestamps: true }
)

designSchema.index({ ownerId: 1, createdAt: -1 })

designSchema.virtual('id').get(function () {
  return this._id.toString()
})

designSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret._id
    delete ret.__v
    return ret
  },
})

const Design = mongoose.model('Design', designSchema)

export default Design
