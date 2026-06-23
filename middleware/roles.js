/**
 * Role-based access control middleware.
 * Use after `protect` so req.user is set from JWT.
 */
const requireRoles = (...allowedRoles) => {
  const roles = allowedRoles.flat();

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Authentication required.",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Insufficient permissions.",
      });
    }

    next();
  };
};

const requireAdmin = requireRoles("admin");
const requireStaff = requireRoles("doctor", "admin");

module.exports = {
  requireRoles,
  requireAdmin,
  requireStaff,
};
