import { authUser, getUserProfile, getUsers, createUser, updateUser, deleteUser } from '../controllers/authController.js';
import { protect, admin } from '../middlewares/auth.js';
import express from 'express';

const router = express.Router();

router.post('/login', authUser);
router.route('/profile').get(protect, getUserProfile);

// Admin only routes
router.route('/users')
  .get(protect, admin, getUsers)
  .post(protect, admin, createUser);

router.route('/users/:id')
  .put(protect, admin, updateUser)
  .delete(protect, admin, deleteUser);

export default router;
