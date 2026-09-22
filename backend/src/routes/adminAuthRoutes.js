const { Router } = require('express');
const adminAuthController = require('../controllers/adminAuthController');
const requireAdminAuth = require('../middlewares/adminAuthMiddleware');

const router = Router();

router.post('/login', adminAuthController.login);

router.get('/me', requireAdminAuth, (req, res) => {
  res.json({ admin: req.admin });
});

module.exports = router;
