import { verify } from 'jsonwebtoken';

export function authMiddleware(handler) {
  return async (req, res) => {
    try {
      const token = req.cookies.token;

      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const decoded = verify(token, process.env.JWT_SECRET);
      req.userId = decoded.userId;
      req.isAdmin = decoded.isAdmin || false;
      
      // Add adminId to request if it exists
      if (decoded.isAdmin && decoded.adminId) {
        req.adminId = decoded.adminId;
      }

      // For admin-only routes, check if user is admin
      if (req.url.startsWith('/api/admin') && !decoded.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      return handler(req, res);
    } catch (error) {
      console.error('Authentication error:', error);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
}