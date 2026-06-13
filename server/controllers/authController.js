import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import Company from '../models/Company.js';
import Invitation from '../models/Invitation.js';
import Activity from '../models/Activity.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateAccessToken = (user) => {
  return jwt.sign({ userId: user._id, sessionVersion: user.sessionVersion || 1 }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (user) => {
  return jwt.sign({ userId: user._id, sessionVersion: user.sessionVersion || 1, type: 'refresh' }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const setRefreshCookie = (res, token) => {
  res.cookie('invotrack_refresh', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

export const register = async (req, res) => {
  try {
    const { name, email, password, companyName, inviteToken } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    if (inviteToken) {
      const invitation = await Invitation.findOne({
        token: inviteToken,
        status: 'pending'
      });

      if (!invitation) {
        return res.status(400).json({ message: 'Invalid or expired invitation.' });
      }

      if (new Date() > invitation.expiresAt) {
        invitation.status = 'expired';
        await invitation.save();
        return res.status(400).json({ message: 'Invitation has expired.' });
      }

      const user = await User.create({
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: 'staff',
        companyId: invitation.companyId,
        status: 'pending'
      });

      invitation.status = 'accepted';
      await invitation.save();

      const io = req.app.get('io');
      if (io) {
        await Activity.create({
          companyId: invitation.companyId,
          userId: user._id,
          userName: user.name,
          action: 'Staff member registered via invite link',
          entityType: 'staff',
          entityId: user._id,
          details: `${user.name} (${user.email}) joined and is pending approval`
        });
        io.to(invitation.companyId.toString()).emit('activity:new', {
          message: `${user.name} registered via invite and is pending approval`
        });
        io.to(invitation.companyId.toString()).emit('staff:updated');
      }

      const token = generateAccessToken(user);
      setRefreshCookie(res, generateRefreshToken(user));
      return res.status(201).json({ token, user });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'admin',
      status: 'active'
    });

    const company = await Company.create({
      name: companyName || `${name}'s Business`,
      ownerId: user._id
    });

    user.companyId = company._id;
    await user.save();

    const token = generateAccessToken(user);
    setRefreshCookie(res, generateRefreshToken(user));
    return res.status(201).json({ token, user });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Server error during registration.' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    if (!user.passwordHash) {
      return res.status(400).json({ message: 'This account uses Google Sign-In. Please log in with Google.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const token = generateAccessToken(user);
    setRefreshCookie(res, generateRefreshToken(user));
    return res.json({ token, user });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login.' });
  }
};

export const googleAuth = async (req, res) => {
  try {
    const { credential, inviteToken } = req.body;

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({ $or: [{ googleId }, { email: email.toLowerCase() }] });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        if (picture && !user.avatar) user.avatar = picture;
        await user.save();
      }

      const token = generateAccessToken(user);
      setRefreshCookie(res, generateRefreshToken(user));
      return res.json({ token, user });
    }

    if (inviteToken) {
      const invitation = await Invitation.findOne({ token: inviteToken, status: 'pending' });

      if (!invitation || new Date() > invitation.expiresAt) {
        if (invitation) { invitation.status = 'expired'; await invitation.save(); }
        return res.status(400).json({ message: 'Invalid or expired invitation.' });
      }

      user = await User.create({
        name,
        email: email.toLowerCase(),
        googleId,
        avatar: picture,
        role: 'staff',
        companyId: invitation.companyId,
        status: 'pending'
      });

      invitation.status = 'accepted';
      await invitation.save();

      const io = req.app.get('io');
      if (io) {
        await Activity.create({
          companyId: invitation.companyId,
          userId: user._id,
          userName: user.name,
          action: 'Staff member registered via Google with invite',
          entityType: 'staff',
          entityId: user._id,
          details: `${user.name} (${user.email}) joined via Google and is pending approval`
        });
        io.to(invitation.companyId.toString()).emit('activity:new', {
          message: `${user.name} registered via Google and is pending approval`
        });
        io.to(invitation.companyId.toString()).emit('staff:updated');
      }
    } else {
      user = await User.create({
        name,
        email: email.toLowerCase(),
        googleId,
        avatar: picture,
        role: 'admin',
        status: 'active'
      });

      const company = await Company.create({
        name: `${name}'s Business`,
        ownerId: user._id
      });

      user.companyId = company._id;
      await user.save();
    }

    const token = generateAccessToken(user);
    setRefreshCookie(res, generateRefreshToken(user));
    return res.status(201).json({ token, user });
  } catch (error) {
    console.error('Google Auth error:', error);
    return res.status(500).json({ message: 'Server error during Google authentication.' });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ message: 'Server error.' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;

    if (newPassword) {
      if (!user.passwordHash) {
        user.passwordHash = await bcrypt.hash(newPassword, 12);
      } else {
        if (!currentPassword) {
          return res.status(400).json({ message: 'Current password is required to change it.' });
        }
        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isMatch) {
          return res.status(400).json({ message: 'Current password is incorrect.' });
        }
        user.passwordHash = await bcrypt.hash(newPassword, 12);
      }
    }

    if (req.file) {
      user.avatar = `/uploads/${req.file.filename}`;
    }

    await user.save();
    return res.json({ user });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

export const refreshAuth = async (req, res) => {
  try {
    const refreshToken = req.cookies.invotrack_refresh;
    if (!refreshToken) return res.status(401).json({ message: 'No refresh token.' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    if (decoded.type !== 'refresh') return res.status(401).json({ message: 'Invalid token type.' });

    const user = await User.findById(decoded.userId);
    if (!user || user.sessionVersion !== decoded.sessionVersion) {
      return res.status(401).json({ message: 'Session expired.' });
    }

    const accessToken = generateAccessToken(user);
    return res.json({ token: accessToken });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired refresh token.' });
  }
};

export const logout = async (req, res) => {
  res.clearCookie('invotrack_refresh');
  return res.json({ message: 'Logged out successfully.' });
};
