const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const data = jwt.verify(token, process.env.APP_SECRET);

        User.findOne({ _id: data._id, 'tokens.token': token }).then(
            user => {
                if(!user) {
                    res.status(401).send({ error: 'Invalid token.' });
                }

                req.user = user;
                req.token = token;

                next();
            },
            error => {
                throw new Error();
            });
    } catch (error) {
        res.status(401).send({ error: 'Authorization required.' });
    }
}
