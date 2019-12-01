const mongoose = require('mongoose');

const Schema = mongoose.Schema;

//Subdocument (Options)
const optionSchema = new Schema({
    answer: {
        type: String,
        required: true,
    },

    votes: [
        {
            userId: {
                type: Schema.Types.ObjectId,
                ref: 'User',
                required: true,
            },

            votedAt: {
                type: Schema.Types.Date,
                default: () => moment().format(),
                required: true,
            }
        }
    ]
});

//Main document & model (Polls)
const pollSchema = new Schema({

    question: {
        type: String,
        required: true,
    },

    options: [ optionSchema ],

    visibility: {
        public: {
            type: Boolean,
            default: true,
            requried: true,
        },

        invited: [
            {
                type: Schema.Types.ObjectId,
                ref: 'User',
                required: false,
            }
        ]
    },

    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    createdAt: {
        type: Schema.Types.Date,
        default: () => moment().format(),
        required: true,
    },

});

module.exports = mongoose.model('Poll', pollSchema);
