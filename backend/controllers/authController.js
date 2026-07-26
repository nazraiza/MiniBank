const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { sendWelcomeEmail } = require('../utils/email');
const audit = require('../utils/audit');

// @POST /api/auth/register  — customers only
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone, nidNumber, address } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, password, phone, nidNumber, address, role: 'customer' });
    sendWelcomeEmail(user);
    await audit(user._id, 'REGISTER', 'User', user._id, 'New customer registration', req);

    res.status(201).json({
      success: true,
      token: generateToken(user._id, user.role),
      user,
    });
  } catch (err) { next(err); }
};

// @POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (user.status === 'suspended') return res.status(403).json({ message: 'Account suspended. Contact admin.' });

    await audit(user._id, 'LOGIN', 'User', user._id, '', req);
    res.json({
      success: true,
      token: generateToken(user._id, user.role),
      user: user.toJSON(),
    });
  } catch (err) { next(err); }
};

// @GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// @PUT /api/auth/password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    await audit(user._id, 'CHANGE_PASSWORD', 'User', user._id, '', req);
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) { next(err); }
};
