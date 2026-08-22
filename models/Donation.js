import mongoose from 'mongoose';

/**
 * Calculates urgency level based on hours remaining until food expiration.
 * - CRITICAL: <= 2 hours remaining (or already expired)
 * - HIGH: > 2 hours and <= 6 hours remaining
 * - MEDIUM: > 6 hours and <= 12 hours remaining
 * - LOW: > 12 hours remaining
 */
export function getUrgencyLevel(expiryTime) {
  const now = new Date();
  const expiry = new Date(expiryTime);
  const diffHours = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (diffHours <= 2) return 'CRITICAL';
  if (diffHours <= 6) return 'HIGH';
  if (diffHours <= 12) return 'MEDIUM';
  return 'LOW';
}

const TransitLogSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['AVAILABLE', 'CLAIMED', 'IN_TRANSIT', 'DELIVERED', 'EXPIRED'],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  note: {
    type: String,
    default: '',
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});

const DonationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    foodType: {
      type: String,
      enum: ['PERISHABLE', 'NON_PERISHABLE', 'COOKED_MEAL'],
      required: [true, 'Food type is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity (in kg or servings) is required'],
      min: [0.1, 'Quantity must be greater than 0'],
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude] - GeoJSON format
        required: [true, 'Coordinates [longitude, latitude] are required'],
      },
      address: {
        type: String,
        default: '',
      },
    },
    expiryTime: {
      type: Date,
      required: [true, 'Expiry time is required'],
    },
    pickupWindow: {
      start: {
        type: Date,
        required: [true, 'Pickup window start time is required'],
      },
      end: {
        type: Date,
        required: [true, 'Pickup window end time is required'],
      },
    },
    urgencyLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'LOW',
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'CLAIMED', 'IN_TRANSIT', 'DELIVERED', 'EXPIRED'],
      default: 'AVAILABLE',
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    claimedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    transitLogs: [TransitLogSchema],
  },
  {
    timestamps: true,
  }
);

// 2dsphere index for geospatial distance queries ($near, $geoWithin)
DonationSchema.index({ location: '2dsphere' });

// Pre-save middleware to dynamically update urgencyLevel before saving
DonationSchema.pre('save', function (next) {
  if (this.expiryTime) {
    this.urgencyLevel = getUrgencyLevel(this.expiryTime);
    // If expiryTime has passed and status is still AVAILABLE, flag as EXPIRED
    if (new Date(this.expiryTime) < new Date() && this.status === 'AVAILABLE') {
      this.status = 'EXPIRED';
    }
  }
  next();
});

export default mongoose.models.Donation || mongoose.model('Donation', DonationSchema);
