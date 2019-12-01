const Friendship = require('../models/Friendship');

module.exports = class FriendshipController {

    /**
     * Invite another user to start a friendship.
     */
    create(req, res) {
        const friendship = new Friendship();

        friendship.suitor = req.user._id;
        friendship.respondentEmail = req.body.respondentEmail;

        friendship.save()
            .then(friendship => {
                res.send(friendship);
            })
            .catch(error => {
                res.status(400).send(error);
            });
    }

    /**
     * Accept another users invitation to start a friendship.
     */
    accept(req, res, next) {
        /**
         * I can access this route when:
         *  - I'm the respondent of the request.
         */
        Friendship
            .findOne({ _id : req.params.friendshipId })
            .exec((error, friendship) => {
                if(!friendship) {
                    next();
                }

                if(friendship.respondentEmail !== req.user.email) {
                    return res.status(403).send(
                        "Only the invited friend can change the status of the friendship to 'accepted'."
                    );
                }

                if(!friendship.acceptedAt) {
                    friendship.acceptedAt = moment().format();
                }

                friendship.save()
                    .then(() => {
                        return res.send();
                    })
                    .catch(error => {
                        res.status(400).send(error);
                    });
            });
    }

    /**
     * Deny another users invitation to start a friendship.
     */
    deny(req, res) {
        /**
         * I can access this route when:
         *  - I'm the respondent of the request.
         */
        Friendship
            .findOne({ _id : req.params.friendshipId })
            .exec((error, friendship) => {
                if(!friendship) {
                    next();
                }

                if(friendship.respondentEmail !== req.user.email) {
                    return res.status(403).send(
                        "Only the invited friend can change the status of the friendship to 'denied'."
                    );
                }

                if(!friendship.deniedAt) {
                    friendship.deniedAt = moment().format();
                }

                friendship.save()
                    .then(() => {
                        return res.send();
                    })
                    .catch(error => {
                        res.status(400).send(error);
                    });
            });
    }

    /**
     * Delete a friendship (either accepted, denied or active).
     */
    delete(req, res) {
        /**
         * I can access this route when:
         *  - I'm the suitor of the request.
         *  - I'm the respondent of the request.
         */
        Friendship.findOne({
            _id: req.params.friendshipId
        }).exec((error, friendship) => {
            if(!friendship) {
                return next();
            }

            if(
                !friendship.suitor.equals(req.user._id) &&
                friendship.respondentEmail !== req.user.email
            ) {
                return res.status(401).send("Access denied.");
            }

            friendship.delete()
                .then(() => {
                    res.send();
                })
                .catch(error => {
                    res.send(error);
                });
        });
    }

}
