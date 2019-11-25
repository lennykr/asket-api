const express = require('express');
const router = express.Router();

const auth = require('../middlewares/auth');

const {
    FriendshipController,
    PollController,
    UserController
} = require('../controllers/_index');



/********************************/
/*           Routes             */
/********************************/

router.post('/users', UserController.create);
router.post('/users/login', UserController.login);
router.get('/users/logout', auth, UserController.logout);
router.get('/users/me', auth, UserController.showMe);
router.put('/users/me', auth, UserController.updateMe);
router.delete('/users/me', auth, UserController.deleteMe);
router.get('/users/me/polls', auth, UserController.myPolls);
router.get('/users/me/friends', auth, UserController.myFriends);
router.get('/users/me/invites', auth, UserController.myInvites);
router.get('/users/me/friend-requests', auth, UserController.myFriendRequests);

router.get('/polls/recent', PollController.indexRecent);
router.get('/polls/popular', PollController.indexPopular);
router.get('/polls/invited', auth, PollController.indexInvited);
router.post('/polls', auth, PollController.create);
router.get('/polls/:pollId', auth, PollController.show);
router.delete('/polls/:pollId', auth, PollController.delete);
router.put('/polls/:pollId', auth, PollController.update);
router.get('/polls/:pollId/vote/:optionId', auth, PollController.vote);

router.post('/friendships/', auth, FriendshipController.create);
router.get('/friendships/:friendshipId/accept', auth, FriendshipController.accept);
router.get('/friendships/:friendshipId/deny', auth, FriendshipController.deny);
router.delete('/friendships/:friendshipId', auth, FriendshipController.delete);



module.exports = router;
