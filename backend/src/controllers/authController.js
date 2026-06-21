import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const authUser = async (req, res) => {
  const { username, password } = req.body;

  const userCount = await User.countDocuments();
  
  if (userCount === 0) {
    const user = await User.create({
      username,
      password,
      role: 'admin' // First user is always admin
    });

    return res.json({
      _id: user._id,
      username: user.username,
      role: user.role,
      token: generateToken(user._id, user.role),
      message: 'Initial admin user created successfully',
    });
  }

  const user = await User.findOne({ username });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      token: generateToken(user._id, user.role),
    });
  } else {
    res.status(401).json({ message: 'Invalid username or password' });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// ADMIN ONLY CONTROLLERS

// @desc    Get all users
// @route   GET /api/auth/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
  const users = await User.find({}).select('-password');
  res.json(users);
};

// @desc    Create new user
// @route   POST /api/auth/users
// @access  Private/Admin
export const createUser = async (req, res) => {
  const { username, email, password, role, avatar } = req.body;

  const userExists = await User.findOne({ username });
  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const user = await User.create({
    username,
    email,
    password,
    role: role || 'user',
    avatar: avatar || ''
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar
    });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
};

// @desc    Update user
// @route   PUT /api/auth/users/:id
// @access  Private/Admin
export const updateUser = async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;
    user.role = req.body.role || user.role;
    user.avatar = req.body.avatar || user.avatar;
    
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      avatar: updatedUser.avatar
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Delete user
// @route   DELETE /api/auth/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    await user.deleteOne();
    res.json({ message: 'User removed' });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};
