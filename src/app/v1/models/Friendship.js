const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const schema = new Schema({
    suitorId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    respondentEmail: {
        type: String,
        required: true,
    },
    acceptedAt: {
        type: Schema.Types.Date,
        required: false,
    },
    deniedAt: {
        type: Schema.Types.Date,
        required: false,
    },
    sentAt: {
        type: Schema.Types.Date,
        default: () => moment().format(),
        required: true,
    },
});

module.exports = mongoose.model('Friendship', schema);
