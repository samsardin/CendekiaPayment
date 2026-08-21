const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'cendekia_lamongan_super_secret_key_2026';

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ success: false, error: 'ERR-008: Authorization token missing' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, error: 'ERR-008: Invalid token format' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, error: 'ERR-008: Session expired or invalid token' });
  }
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'ERR-008: Anda tidak memiliki hak akses untuk modul ini' });
    }
    next();
  };
};

module.exports = {
  JWT_SECRET,
  verifyToken,
  authorizeRoles
};
