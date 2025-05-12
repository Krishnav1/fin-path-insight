import mongoose from 'mongoose';

const marketDataSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  change: {
    type: Number,
    required: true,
  },
  changePercent: {
    type: Number,
    required: true,
  },
  volume: {
    type: Number,
    required: true,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  type: {
    type: String,
    enum: ['stock', 'crypto', 'forex', 'commodity'],
    required: true,
  },
});

export default mongoose.models.MarketData || mongoose.model('MarketData', marketDataSchema); 