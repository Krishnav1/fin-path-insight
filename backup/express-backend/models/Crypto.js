import mongoose from 'mongoose';

const marketDataSchema = new mongoose.Schema({
  date: Date,
  price: Number,
  volume: Number
});

const cryptoSchema = new mongoose.Schema({
  coinId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  symbol: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  change24h: Number,
  changePercent24h: Number,
  marketCap: Number,
  totalVolume: Number,
  circulatingSupply: Number,
  maxSupply: Number,
  ath: Number,
  athDate: Date,
  marketData: [marketDataSchema],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Create text index for search
cryptoSchema.index({ name: 'text', symbol: 'text' });

export default mongoose.models.Crypto || mongoose.model('Crypto', cryptoSchema); 