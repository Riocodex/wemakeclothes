import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 160,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['buyer', 'seller', 'admin'],
      default: 'buyer',
    },
  },
  { timestamps: true }
)

userSchema.virtual('id').get(function () {
  return this._id.toString()
})

userSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret._id
    delete ret.__v
    delete ret.passwordHash
    return ret
  },
})

userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next()
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12)
  next()
})

userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.passwordHash)
}

const User = mongoose.model('User', userSchema)

export default User
