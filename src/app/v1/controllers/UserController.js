const User = require('../models/User');
const Poll = require('../models/Poll');
const Friendship = require('../models/Friendship');

module.exports = class UserController {

    /**
     * Retrieve currently logged in user.
     */
    showMe(req, res) {
        User
            .find({_id: req.user._id})
            .populate('polls')
            .exec((error, user) => {
                res.send(error ? error : user);
            });
    }

    /**
     * Edit the current user
     */
    updateMe(req, res) {
        const { name } = req.body;

        req.user.name = name;

        req.user.save().then(
            (user) => {
                res.send(user);
            },
            error => {
                res.status(500).send(error);
            });
    }

    /**
     * Permanently remove the currently logged in users account.
     */
    deleteMe(req, res) {
        try {
            req.user.remove().then(() => {
                res.send();
            });
        } catch (error) {
            res.status(500).send(error);
        }
    }

    /**
     * Show the currently logged in users polls.
     */
    myPolls(req, res) {
        Poll
            .find({ 'creatorId' : req.user._id })
            .sort({ createdAt: 'desc' })
            .exec((error, polls) => {
                res.send(polls);
            });
    }

    /**
     * Show the currently logged in users friends.
     */
    myFriends(req, res) {
        Friendship
            .find()
            .or([
                { suitor : req.user._id },
                { respondentEmail : req.user.email }
            ])
            .where("acceptedAt").ne(null)
            .populate('suitor', ['name', 'email'])
            .sort({ createdAt: 'asc' })
            .exec((error, friendships) => {
                const _friendships = [];
                
                const promises = friendships.map(friendship => {
                    return new Promise((resolve) => {
                        friendship = friendship.toObject();

                        User.findOne({ email: friendship.respondentEmail }, ['name', 'email'])
                            .exec((error, respondent) => {
                                if(friendship.respondentEmail === req.user.email) {
                                    // The suitor is my friend, because I'm the respondent.
                                    friendship.friend = friendship.suitor;
                                } else {
                                    // The respondent is my friend, because I'm the suitor.
                                    friendship.friend = respondent;
                                }

                                _friendships.push(friendship);
                                resolve();
                            });
                    });
                });

                Promise.all(promises).then(() => res.send(_friendships));
            });
    }

    /**
     * Show the currently logged in users invites.
     */
    myInvites(req, res) {
        Poll
            .find({ 'visibility.invited' : req.user._id })
            .sort({ createdAt: 'desc' })
            .exec((error, polls) => {
                polls = polls.filter(poll => {
                    let hasVoted = false;
                    poll.options.forEach(option => {
                        if(option.votes.filter((vote) => vote.userId.equals(req.user._id)).length > 0) {
                            hasVoted = true;
                        }
                    });

                    return !hasVoted;
                });

                res.send(polls);
            });
    }

    /**
     * Show the currently logged in users friend requests.
     */
    myFriendRequests(req, res) {
        Friendship
            .find({
                respondentEmail : req.user.email,
                acceptedAt: null,
                deniedAt: null
            })
            .populate('suitor', ['name', 'email'])
            .sort({ createdAt: 'asc' })
            .exec((error, friendships) => {
                res.send(friendships);
            });
    }

    /**
     * Register a new user.
     */
    create(req, res) {
        try {
            const user = new User(req.body);

            user.save().then(user => {
                user.generateAuthToken().then(token => {
                    res.status(201).send({ user, token });
                });
            }).catch(error => {
                if(error.code === 11000) {
                    res.status(400).send({message: 'User already registered.'});
                }

                res.status(400).send();
            });
        } catch (error) {
            res.status(400).send(error);
        }
    }

    /**
     * Attempt a user login.
     */
    login(req, res) {
        try {
            const { email, password } = req.body;

            User.findByCredentials(email, password).then(
                user => {
                    user.generateAuthToken().then((token => {
                        res.send({ user, token });
                    }));
                },

                error => {
                    return res.status(401).send({error: 'Invalid credentials.'});
                });
        } catch (error) {
            res.status(400).send(error);
        }
    }

    /**
     * Logout a user.
     */
    logout(req, res) {
        try {
            req.user.tokens =
                req.user.tokens.filter((token) => token.token != req.token);

            req.user.save().then(() => {
                res.send();
            });
        } catch (error) {
            res.status(500).send(error);
        }
    }

}
