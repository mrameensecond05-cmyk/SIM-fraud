const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'UserProfile', required: true },
    amount: { type: Number, required: true },
    channel: { type: String, enum: ['UPI', 'NETBANKING', 'CARD', 'WALLET', 'OTHER'], required: true },
    merchant_id: { type: String, default: null },
    device_id: { type: String, default: null },
    location: { type: String, default: null },
    tx_time: { type: Date, default: Date.now },
    status: { type: String, enum: ['initiated', 'approved', 'declined', 'blocked'], default: 'initiated' }
});

module.exports = mongoose.model('Transaction', TransactionSchema);
