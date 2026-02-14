const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'voiceroom-hackathon-secret-mongo-2026';

async function signup(username, password) {
  if (!username || username.length < 2) {
    throw new Error('Username must be at least 2 characters');
  }
  if (!password || password.length < 4) {
    throw new Error('Password must be at least 4 characters');
  }

  const existingUser = await User.findOne({ username });
  if (existingUser) {
    throw new Error('Username already taken');
  }

  console.log('🔒 Hashing password for user:', username);
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    username,
    passwordHash,
  });

  const token = generateToken(user);
  return { user: { id: user._id.toString(), username: user.username }, token };
}

async function login(username, password) {
  const user = await User.findOne({ username });
  if (!user) {
    throw new Error('Invalid username or password');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new Error('Invalid username or password');
  }

  const token = generateToken(user);
  return { user: { id: user._id.toString(), username: user.username }, token };
}

function generateToken(user) {
  return jwt.sign(
    { id: user._id.toString(), username: user.username },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

module.exports = { signup, login, verifyToken };
