const Poll = require('../models/Poll');
const User = require('../models/User');

module.exports = class PollController {

    /**
     * List all the polls, sorted by ther creation date.
     */
    indexRecent(req, res) {
        Poll
            .find({ 'visibility.public' : true })
            .sort({ createdAt: 'desc' })
            .exec((error, polls) => {
                res.send(polls);
            });
    }

    /**
     * List all the polls, sorted by popularity.
     */
    indexPopular(req, res) {
        Poll
            .find({ 'visibility.public' : true })
            .exec((error, polls) => {
                polls.sort((pollA, pollB) => {
                    let pollAVotes = 0;
                    let pollBVotes = 0;

                    pollA.options.forEach(option => {
                        pollAVotes += option.votes.length;
                    });

                    pollB.options.forEach(option => {
                        pollBVotes += option.votes.length;
                    });

                    return pollBVotes - pollAVotes;
                });

                res.send(polls);
            });
    }

    /**
     * List all the polls the currently logged in user is invited to.
     */
    indexInvited(req, res) {
        Poll
            .find({ 'visibility.invited' : req.user._id })
            .sort({ createdAt: 'desc' })
            .exec((error, polls) => {
                res.send(polls);
            });
    }

    /**
     * Create a poll.
     */
    create(req, res, next) {
        const poll = new Poll(req.body);

        poll.creatorId = req.user._id;

        poll.save()
            .then(poll => {
                User.findOne({_id: req.user._id}).exec((error, user) => {
                    if(!user) {
                        return next();
                    }

                    user.polls.push(poll._id);

                    user.save()
                        .then(() => {
                            res.send(poll);
                        })
                        .catch((error) => {
                            res.status(400).send(error);
                        });
                });
            })
            .catch(error => {
                res.status(400).send(error);
            });
    }

    /**
     * Show a poll.
     */
    show(req, res, next) {
        Poll.findOne({_id: req.params.pollId}).exec((error, poll) => {
            if(!poll) {
                return next();
            }

            /**
             * I can access this route when:
             *  - I'm the owner of the poll.
             *  - I'm invited to the poll.
             *  - The poll is public.
             */
            if (
                !poll.creatorId.equals(req.user._id) &&
                poll.visibility.invited.filter((_id) => _id.equals(req.user._id) ).length === 0 &&
                poll.visibility.public !== true
            ) {
                return res.status(401).send({ error: 'Access denied.' });
            }

            res.send(poll);
        });
    }

    /**
     * Delete a poll.
     */
    delete(req, res, next) {
        /**
         * I can access this route when:
         *  - I'm the owner of the poll.
         */
        Poll.findOne({
            _id: req.params.pollId,
            creatorId: req.user._id,
        }).exec((error, poll) => {
            if(!poll) {
                return next();
            }

            poll.delete()
                .then(() => {
                    res.send();
                })
                .catch(error => {
                    res.send(error);
                });
        });
    }

    /**
     * Update a polls info and settings. Limited to visibility settings only.
     */
    update(req, res) {
        /**
         * I can access this route when:
         *  - I'm the owner of the poll.
         */
        Poll.findOne({
            _id: req.params.pollId,
            creatorId: req.user._id,
        }).exec((error, poll) => {
            if(!poll) {
                return next();
            }

            const publicVisibility = req.body.visibility.public;

            if(publicVisibility === null || publicVisibility === undefined) {
                return res.send();
            }

            if(poll.visibility.public && publicVisibility === false) {
                return res.status(403).send(
                    "You can't change the visibility of a poll from public to invite-only."
                );
            }

            poll.visibility.public = publicVisibility;

            poll.save((error) => {
                return res.send(error);
            });
        });
    }

    /**
     * Vote for a poll option.
     */
    vote(req, res) {
        Poll.findOne({_id: req.params.pollId}).exec((error, poll) => {
            if(!poll) {
                return next(); // Poll doesn't exist.
            }

            /**
             * I can access this route when:
             *  - I'm the owner of the poll.
             *  - I'm invited to the poll.
             *  - The poll is public.
             */
            if (
                !poll.creatorId.equals(req.user._id) &&
                poll.visibility.invited.filter((_id) => _id.equals(req.user._id) ).length === 0 &&
                poll.visibility.public !== true
            ) {
                return res.status(401).send({ error: 'Access denied.' });
            }

            let hasVoted = false;
            poll.options.forEach(option => {
                if(option.votes.filter((vote) => vote.userId.equals(req.user._id)).length > 0) {
                    hasVoted = true;
                }
            });

            if(hasVoted) {
                return res.status(403).send(
                    "Only one vote per user is permitted."
                );
            }

            const option = poll.options.find((option) => option._id.equals(req.params.optionId));

            if(!option) {
                return next(); // There are no options.
            }

            option.votes.push({
                userId: req.user._id
            });

            poll.save()
                .then((poll) => {
                    return res.send(poll);
                })
                .catch((error) => {
                    return res.send(error);
                });
        });
    }

}
