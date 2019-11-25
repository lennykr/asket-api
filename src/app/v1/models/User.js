const mongoose = require('mongoose');
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const Schema = mongoose.Schema;

const schema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        validate: {
            validator: value => validator.isEmail(value),
            message: props => `${props.value} is not a valid email address!`
        },
    },
    password: {
        type: String,
        required: true,
    },
    polls: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Poll',
        }
    ],
    createdAt: {
        type: Schema.Types.Date,
        default: () => moment().format(),
        required: true,
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
});


/**
 * Hash the password before saving the user model
 */
schema.pre('save', async function (next) {
    const user = this;

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }

    next();
});


/**
 * Generates a new JWT for the user.
 */
schema.methods.generateAuthToken = function() {
    const user = this;
    const token = jwt.sign({_id: user._id}, process.env.APP_SECRET);

    user.tokens = user.tokens.concat({token});

    return user.save().then(() => {
        return token;
    });
}


/**
 * Find a user by their login credentials.
 */
schema.statics.findByCredentials = (email, password) => {
    return User.findOne({ email }).then(
        user => {
            return bcrypt.compare(password, user.password).then(isPasswordMatch => {
                if (!isPasswordMatch) {
                    throw new Error({ error: 'Invalid login credentials' });
                }

                return user;
            });
        },
        error => {
            throw new Error({ error: 'Invalid login credentials' });
        });
}

const User = mongoose.model('User', schema);

module.exports = User;
