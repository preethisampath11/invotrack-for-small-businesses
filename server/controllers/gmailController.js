import { google } from 'googleapis';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const getOAuth2Client = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5001/api/gmail/callback'
  );
};

export const connectGmail = async (req, res) => {
  try {
    const token = req.query.token;
    if (!token) return res.status(401).send('No token provided');
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const oauth2Client = getOAuth2Client();

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent', 
      scope: [
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
      state: decoded.userId
    });

    res.redirect(authUrl);
  } catch (err) {
    console.error('Error connecting to Gmail:', err);
    res.status(401).send('Invalid token');
  }
};

export const callbackGmail = async (req, res) => {
  const { code, state: userId } = req.query;

  try {
    if (!code || !userId) {
      throw new Error('Missing code or state parameter');
    }

    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    
    oauth2Client.setCredentials(tokens);

    // Fetch the user's email address using the token
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Save the refresh token and connected email
    if (tokens.refresh_token) {
      user.googleRefreshToken = tokens.refresh_token;
    }
    user.connectedGmail = userInfo.data.email;
    await user.save();

    // Redirect back to the frontend settings page
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/settings?gmail=success`);

  } catch (error) {
    console.error('Gmail OAuth callback error:', error);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/settings?gmail=error`);
  }
};

export const disconnectGmail = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.googleRefreshToken = null;
    user.connectedGmail = null;
    await user.save();

    res.json({ message: 'Gmail disconnected successfully', user });
  } catch (error) {
    console.error('Gmail disconnect error:', error);
    res.status(500).json({ message: 'Server error disconnecting Gmail' });
  }
};
