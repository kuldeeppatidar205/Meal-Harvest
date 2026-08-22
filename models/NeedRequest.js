import mongoose from 'mongoose';

const TransitLogSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['OPEN', 'MATCHED', 'IN_TRANSIT', 'DELIVERED', 'FULFILLED'],
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

const NeedRequestSchema = new mongoose.Schema(
  {
    recipientName: {
      type: String,
      required: [true, 'Recipient or Community Name is required'],
      trim: true,
    },
    contactPerson: {
      type: String,
      required: [true, 'Contact person name is required'],
      trim: true,
    },
    contactPhone: {
      type: String,
      required: [true, 'Contact phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: '',
    },
    organizationType: {
      type: String,
      enum: ['SHELTER', 'COMMUNITY_KITCHEN', 'ORPHANAGE', 'INDIVIDUAL', 'SLUM_COMMUNITY', 'OTHER'],
      default: 'INDIVIDUAL',
    },
    servingsNeeded: {
      type: Number,
      required: [true, 'Number of servings or food quantity (in kg) needed is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    dietaryPreference: {
      type: String,
      enum: ['ANY', 'VEGETARIAN', 'VEGAN', 'DRY_RATIONS'],
      default: 'ANY',
    },
    urgencyLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'HIGH',
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Coordinates [longitude, latitude] are required'],
      },
      address: {
        type: String,
        required: [true, 'Dropoff address is required'],
      },
    },
    status: {
      type: String,
      enum: ['OPEN', 'MATCHED', 'IN_TRANSIT', 'DELIVERED', 'FULFILLED'],
      default: 'OPEN',
    },
    matchedDonationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation',
      default: null,
    },
    assignedDriverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
    transitLogs: [TransitLogSchema],
  },
  {
    timestamps: true,
  }
);

NeedRequestSchema.index({ location: '2dsphere' });

export default mongoose.models.NeedRequest || mongoose.model('NeedRequest', NeedRequestSchema);
