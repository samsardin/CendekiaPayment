const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? null : 'cendekia_lamongan_dev_secret');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Autentikasi diperlukan' });
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token || !JWT_SECRET) {
    return res.status(401).json({ success: false, error: 'Token autentikasi tidak valid' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Token autentikasi tidak valid atau sudah kedaluwarsa' });
  }
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role) && req.user.role !== 'superadmin')) {
      return res.status(403).json({ success: false, error: 'ERR-008: Hak akses terbatas' });
    }
    next();
  };
};

module.exports = {
  JWT_SECRET,
  verifyToken,
  authorizeRoles
};
