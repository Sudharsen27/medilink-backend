// const jwt = require('jsonwebtoken');

// function verifyToken(req, res, next) {
//   const authHeader = req.headers['authorization'];
//   const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

//   if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded; // { id, role }
//     next();
//   } catch (err) {
//     res.status(403).json({ error: 'Invalid token' });
//   }
// }

// module.exports = verifyToken;

const jwt = require('jsonwebtoken');

/**
 * Middleware to protect private routes
 * Validates JWT token and attaches decoded user to req.user
 */
const protect = (req, res, next) => {
  let token;

  // Check Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user object -> your routes use req.user.id
    req.user = decoded;

    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

module.exports = { protect };
