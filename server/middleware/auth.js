import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select('-passwordHash');
    if (!user) {
      return res.status(401).json({ message: 'User not found.' });
    }

    if (decoded.sessionVersion !== user.sessionVersion) {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }

    if (user.status === 'pending') {
      return res.status(403).json({ message: 'Your account is pending approval by the admin.' });
    }

    if (user.status === 'deactivated') {
      return res.status(403).json({ message: 'Your account has been deactivated.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please log in again.' });
    }
    return res.status(401).json({ message: 'Invalid token.' });
  }
};

export const verifyAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  next();
};

export const verifyInventoryAccess = (req, res, next) => {
  if (req.user.role === 'admin') {
    return next();
  }
  if (req.user.canEditInventory) {
    return next();
  }
  return res.status(403).json({ message: 'You do not have permission to modify inventory.' });
};

/**
 * Higher-order middleware function to check for specific RBAC permissions.
 * Admins automatically bypass this check.
 * 
 * Usage: router.delete('/:id', verifyToken, requirePermission('canDeletePayments'), deletePayment);
 */
export const requirePermission = (permissionFlag) => {
  return (req, res, next) => {
    // Admins have all permissions implicitly
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Check if the staff user has the specific boolean flag set to true
    if (req.user[permissionFlag] === true) {
      return next();
    }
    
    return res.status(403).json({ 
      message: `Access denied. You lack the '${permissionFlag}' permission.` 
    });
  };
};
