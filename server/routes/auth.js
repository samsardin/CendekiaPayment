const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { get, query } = require('../database/db');
const { JWT_SECRET, verifyToken } = require('../middleware/authMiddleware');
const { logAudit } = require('../middleware/auditMiddleware');

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;
    if (!usernameOrEmail || !password) {
      return res.status(400).json({ success: false, error: 'Email/No HP dan Password wajib diisi' });
    }

    const user = await get(`SELECT * FROM users WHERE email = ? OR phone = ?`, [usernameOrEmail, usernameOrEmail]);
    if (!user) {
      return res.status(401).json({ success: false, error: 'ERR-001: Email/No HP atau Password salah' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'ERR-001: Email/No HP atau Password salah' });
    }

    // If role is parent ('ortu'), fetch parent record & children
    let parentInfo = null;
    let children = [];
    if (user.role === 'ortu') {
      parentInfo = await get(`SELECT * FROM parents WHERE user_id = ? OR email = ? OR phone = ?`, [user.id, user.email, user.phone]);
      if (parentInfo) {
        children = await query(
          `SELECT s.*, u.name as unit_name, c.name as class_name 
           FROM students s 
           LEFT JOIN units u ON s.unit_id = u.id 
           LEFT JOIN classes c ON s.class_id = c.id 
           WHERE s.parent_id = ?`,
          [parentInfo.id]
        );
      }
    }

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      parentId: parentInfo ? parentInfo.id : null
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

    await logAudit(user.id, user.name, user.role, 'LOGIN', 'AUTH', `User ${user.name} logged in successfully`, req);

    return res.json({
      success: true,
      token,
      user: {
        ...payload,
        children
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Server error during login' });
  }
});

// Current User profile
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await get(`SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?`, [req.user.id]);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    let children = [];
    if (user.role === 'ortu') {
      const parentInfo = await get(`SELECT id FROM parents WHERE user_id = ? OR email = ?`, [user.id, user.email]);
      if (parentInfo) {
        children = await query(
          `SELECT s.*, u.name as unit_name, c.name as class_name 
           FROM students s 
           LEFT JOIN units u ON s.unit_id = u.id 
           LEFT JOIN classes c ON s.class_id = c.id 
           WHERE s.parent_id = ?`,
          [parentInfo.id]
        );
      }
    }

    res.json({ success: true, user: { ...user, children } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
