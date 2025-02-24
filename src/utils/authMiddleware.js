import { verify } from 'jsonwebtoken';

export function authMiddleware(handler) {
  return async (req, res) => {
    try {
      // Check both tokens
      const userToken = req.cookies.userToken;
      const adminToken = req.cookies.adminToken;
      
      // For admin routes
      if (req.url.startsWith('/api/admin')) {
        if (!adminToken) {
          return res.status(401).json({ error: 'Admin authentication required' });
        }
        const decoded = verify(adminToken, process.env.JWT_SECRET);
        if (!decoded.isAdmin) {
          return res.status(403).json({ error: 'Admin access required' });
        }
        req.userId = decoded.userId;
        req.adminId = decoded.adminId;
        req.isAdmin = true;
      } 
      // For user routes
      else {
        if (!userToken) {
          return res.status(401).json({ error: 'Authentication required' });
        }
        const decoded = verify(userToken, process.env.JWT_SECRET);
        if (decoded.isAdmin) {
          return res.status(403).json({ error: 'User access required' });
        }
        req.userId = decoded.userId;
        req.isAdmin = false;
      }

      return handler(req, res);
    } catch (error) {
      console.error('Authentication error:', error);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
}