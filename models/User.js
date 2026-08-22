import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    role: {
      type: String,
      enum: ['PROVIDER', 'NGO', 'VOLUNTEER'],
      required: [true, 'Role is required'],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    organizationDetails: {
      name: { type: String, default: '' },
      registrationId: { type: String, default: '' },
      documentUrl: { type: String, default: '' },
    },
    vehicleCapacity: {
      type: Number,
      default: 0, // in kg
    },
  },
  {
    timestamps: true,
  }
);

// Prevent overwrite of model if already compiled
export default mongoose.models.User || mongoose.model('User', UserSchema);
