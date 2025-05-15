import mongoose from 'mongoose';

const financialDataSchema = new mongoose.Schema({
  year: Number,
  revenue: Number,
  netIncome: Number
});

const chartDataPointSchema = new mongoose.Schema({
  date: Date,
  close: Number,
  volume: Number
});

const stockSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  displaySymbol: {
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
  change: Number,
  changePercent: Number,
  marketCap: Number,
  peRatio: Number,
  eps: Number,
  roe: Number,
  debtToEquity: Number,
  volume: Number,
  financialData: [financialDataSchema],
  chartData: [chartDataPointSchema],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for frequently queried fields
stockSchema.index({ name: 'text' });

export default mongoose.models.Stock || mongoose.model('Stock', stockSchema); 