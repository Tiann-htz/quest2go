import { parse } from 'url';
import bcrypt from 'bcrypt';
import { sign, verify } from 'jsonwebtoken';
import { query } from '../../utils/db';
import { authMiddleware } from '../../utils/authMiddleware';
import { serialize } from 'cookie';

const handler = async (req, res) => {
  console.log('API handler called:', req.method, req.url);
  const { method } = req;
  const { pathname } = parse(req.url, true);

  //main API router or request handler section:
  try {
    switch (method) {
      case 'POST':
        if (pathname === '/api/signup') {
          await handleSignup(req, res);
        } else if (pathname === '/api/login') {
          await handleLogin(req, res);
        } else if (pathname === '/api/admin/login') {
          await handleAdminLogin(req, res);
        } else if (pathname === '/api/logout') {
          await handleLogout(req, res); 
        } else if (pathname === '/api/admin/logout') {
          await handleAdminLogout(req, res);
        } else if (pathname === '/api/admin/studies') {
          return authMiddleware(createStudy)(req, res); 
        } else if (pathname.startsWith('/api/admin/references/') && method === 'POST') {
          return updateReferences(req, res);
        } else if (pathname === '/api/chat/send') {
          return authMiddleware(handleChatMessage)(req, res);
      } else if (pathname === '/api/chat/edit') {
        return authMiddleware(editChatMessage)(req, res);
      } else if (pathname === '/api/admin/chat/reply') {
        return authMiddleware(handleAdminReply)(req, res);
      } else if (pathname === '/api/chat/mark-read' && method === 'POST') {
        return authMiddleware(markMessagesAsRead)(req, res);
      } else if (pathname === '/api/admin/update-request-status' && method === 'POST') {
        return authMiddleware(updateRequestStatus)(req, res);
      } else if (pathname === '/api/forgot-password/verify-email') {
      await verifyEmail(req, res);
    } else if (pathname === '/api/forgot-password/verify-names') {
      await verifyNames(req, res);
    } else if (pathname === '/api/forgot-password/retrieve-password') {
      await retrievePassword(req, res);
    } 
 
        break;
      case 'GET':
        if (pathname === '/api/user') {
          return authMiddleware(getUserData)(req, res);
        } else if (pathname === '/api/admin/user') {
          return authMiddleware(getUserDataAdmin)(req, res);
        } else if (pathname === '/api/admin/studies') {
          return authMiddleware(getStudies)(req, res);
        } else if (pathname === '/api/search') {
          return searchStudies(req, res);
        } else if (method === 'GET' && pathname === '/api/filter-options') {
          return getFilterOptions(req, res);
        } else if (pathname.startsWith('/api/admin/references/') && method === 'GET') {
          return getReferences(req, res);
        } else if (pathname === '/api/study/references') {
          return getStudyReferences(req, res);
        } else if (pathname.startsWith('/api/chat/messages/')) {
          return authMiddleware(getChatMessages)(req, res);
        } else if (pathname === '/api/chat/requests') {
          return authMiddleware(getChatRequests)(req, res);
        } else if (pathname === '/api/admin/chat/users') {
          return authMiddleware(getRequestUsers)(req, res);
        } else if (pathname.startsWith('/api/admin/chat/user-studies/')) {
          const userId = pathname.split('/').pop();
          req.query.userId = userId;
          return authMiddleware(getUserStudies)(req, res);
        } else if (pathname.startsWith('/api/admin/chat/study-messages')) {
          return authMiddleware(getStudyMessages)(req, res);
        } else if (pathname.startsWith('/api/chat/admin-replies/')) {
          return authMiddleware(getAdminReplies)(req, res);
        } else if (pathname === '/api/admin/stats') {
          return authMiddleware(getStats)(req, res);
        } else if (pathname === '/api/admin/institutions') {
          return authMiddleware(getInstitutions)(req, res);
        } else  if (pathname === '/api/admin/users-with-requests') {
          return authMiddleware(getUsersWithRequests)(req, res);
        }  else if (pathname === '/api/admin/analytics/studies-by-category') {
          return authMiddleware(getStudiesByCategory)(req, res);
        } else if (pathname === '/api/admin/analytics/user-activity') {
          return authMiddleware(getUserActivity)(req, res);
        } else if (pathname === '/api/admin/analytics/chat-metrics') {
          return authMiddleware(getChatMetrics)(req, res);
        } else if (pathname === '/api/admin/analytics/request-status') {
          return authMiddleware(getRequestStatus)(req, res);
        } else if (pathname === '/api/admin/analytics/study-institutions') {
          return authMiddleware(getStudyInstitutions)(req, res);
        } else if (pathname === '/api/admin/analytics/recent-logs') {
          return authMiddleware(getRecentLogs)(req, res);
        } else if (pathname === '/api/admin/analytics/summary-stats') {
          return authMiddleware(getSummaryStats)(req, res);
        } else if (pathname === '/api/profile/user') {
          return authMiddleware(getProfileData)(req, res);
        }
        
        break;
      case 'PUT':
        if (pathname.startsWith('/api/admin/studies/')) {
          return authMiddleware(updateStudy)(req, res);
        } else if (pathname === '/api/profile/update') {
          return authMiddleware(updateProfile)(req, res);
        }
        break;
      case 'DELETE':
        if (pathname.startsWith('/api/admin/studies/')) {
          return authMiddleware(deleteStudy)(req, res);
        } else if (pathname.startsWith('/api/admin/references/') && method === 'DELETE') {
          return deleteReference(req, res);
        } else if (pathname.startsWith('/api/chat/message/')) {
          return authMiddleware(deleteChatMessage)(req, res);
        }
        break;
      default:
        res.setHeader('Allow', ['POST', 'GET', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while processing your request' });
  }
};

async function updateProfile(req, res) {
  try {
    const userId = req.userId; // This comes from the authMiddleware
    const { firstName, lastName, email, password } = req.body;
    
    // Verify user exists
    const users = await query(
      'SELECT * FROM user WHERE user_id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = users[0];
    
    // Check if email is already in use by another user
    if (email && email !== user.email) {
      const existingUser = await query(
        'SELECT * FROM user WHERE email = ? AND user_id != ?',
        [email, userId]
      );
      
      if (existingUser.length > 0) {
        return res.status(400).json({ error: 'Email already in use by another account' });
      }
    }
    
    // Start building the update query
    let updateFields = [];
    let queryParams = [];
    
    if (firstName) {
      updateFields.push('first_name = ?');
      queryParams.push(firstName);
    }
    
    if (lastName) {
      updateFields.push('last_name = ?');
      queryParams.push(lastName);
    }
    
    if (email) {
      updateFields.push('email = ?');
      queryParams.push(email);
    }
    
    // Handle password update without the password_change_log
    if (password && password.trim() !== '') {
      // Hash the new password
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push('password = ?');
      queryParams.push(hashedPassword);
    }
    
    // If there are no fields to update, return
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    // Build the final query
    queryParams.push(userId);
    const updateResult = await query(
      `UPDATE user SET ${updateFields.join(', ')} WHERE user_id = ?`,
      queryParams
    );
    
    // Get updated user data
    const updatedUser = await query(
      'SELECT user_id, email, first_name, last_name, user_type FROM user WHERE user_id = ?',
      [userId]
    );
    
    res.status(200).json({ 
      message: 'Profile updated successfully',
      user: updatedUser[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
}

async function getProfileData(req, res) {
  try {
    // First get base user information
    const users = await query(
      'SELECT user_id, email, first_name, last_name, user_type FROM user WHERE user_id = ?',
      [req.userId]
    );

    const user = users[0];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get additional information based on user type
    let additionalInfo = {};
    let recentRequests = [];

    if (user.user_type === 'Student') {
      const [studentInfo] = await query(
        'SELECT institution_name, year_level, course_type FROM students WHERE user_id = ?', 
        [user.user_id]
      );
      if (studentInfo) {
        additionalInfo = {
          institution_name: studentInfo.institution_name,
          year_level: studentInfo.year_level,
          course_type: studentInfo.course_type
        };
      }
    } else if (user.user_type === 'Researcher') {
      const [researcherInfo] = await query(
        'SELECT organization_name FROM researchers WHERE user_id = ?',
        [user.user_id]
      );
      if (researcherInfo) {
        additionalInfo = {
          organization_name: researcherInfo.organization_name
        };
      }
    } else if (user.user_type === 'Teacher') {
      const [teacherInfo] = await query(
        'SELECT institution_name FROM teachers WHERE user_id = ?',
        [user.user_id]
      );
      if (teacherInfo) {
        additionalInfo = {
          institution_name: teacherInfo.institution_name
        };
      }
    }

    // Get recent research access requests
    recentRequests = await query(
      `SELECT 
        r.request_id, 
        r.research_id,
        r.status,
        r.request_date,
        s.title
      FROM 
        research_access_requests r
      JOIN 
        research_studies s ON r.research_id = s.research_id  
      WHERE 
        r.user_id = ?
      ORDER BY 
        r.request_date DESC
      LIMIT 10`,
      [user.user_id]
    );

    const userData = {
      ...user,
      ...additionalInfo,
      recentRequests
    };

    res.status(200).json({ user: userData });
  } catch (error) {
    console.error('Error fetching profile data:', error);
    res.status(500).json({ error: 'Error fetching profile data' });
  }
}

async function verifyEmail(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const users = await query(
      'SELECT * FROM user WHERE email = ?',
      [email]
    );

    const exists = users.length > 0;
    
    res.status(200).json({ exists });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Error verifying email' });
  }
}

async function verifyNames(req, res) {
  const { email, firstName, lastName } = req.body;

  if (!email || !firstName || !lastName) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const users = await query(
      'SELECT * FROM user WHERE email = ? AND first_name = ? AND last_name = ?',
      [email, firstName, lastName]
    );

    if (users.length === 0) {
      return res.status(200).json({ verified: false });
    }

    const user = users[0];
    
    res.status(200).json({ 
      verified: true,
      userType: user.user_type
    });
  } catch (error) {
    console.error('Name verification error:', error);
    res.status(500).json({ error: 'Error verifying name' });
  }
}

async function retrievePassword(req, res) {
  const { email, firstName, lastName, userType, additionalInfo } = req.body;

  if (!email || !firstName || !lastName || !userType || !additionalInfo) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // First verify the user exists
    const users = await query(
      'SELECT * FROM user WHERE email = ? AND first_name = ? AND last_name = ? AND user_type = ?',
      [email, firstName, lastName, userType]
    );

    if (users.length === 0) {
      return res.status(200).json({ success: false });
    }

    const user = users[0];
    let verified = false;

    // Verify additional information based on user type
    if (userType === 'Student') {
      const studentInfo = await query(
        'SELECT * FROM students WHERE user_id = ? AND institution_name = ?',
        [user.user_id, additionalInfo]
      );
      verified = studentInfo.length > 0;
    } else if (userType === 'Researcher') {
      const researcherInfo = await query(
        'SELECT * FROM researchers WHERE user_id = ? AND organization_name = ?',
        [user.user_id, additionalInfo]
      );
      verified = researcherInfo.length > 0;
    } else if (userType === 'Teacher') {
      const teacherInfo = await query(
        'SELECT * FROM teachers WHERE user_id = ? AND institution_name = ?',
        [user.user_id, additionalInfo]
      );
      verified = teacherInfo.length > 0;
    }

    if (!verified) {
      return res.status(200).json({ success: false });
    }
    
    // Generate a new random password (8 characters)
    const newPassword = generateRandomPassword(8);
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the user's password in the database
    await query(
      'UPDATE user SET password = ? WHERE user_id = ?',
      [hashedPassword, user.user_id]
    );
    
    
    res.status(200).json({ 
      success: true,
      password: newPassword 
    });
  } catch (error) {
    console.error('Password retrieval error:', error);
    res.status(500).json({ error: 'Error resetting password' });
  }
}

// Function to generate a random password
function generateRandomPassword(length) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  
  return password;
}

/////analytics.js API endpoints
async function getStudiesByCategory(req, res) {
  try {
    const results = await query(`
      SELECT category as name, COUNT(*) as value
      FROM research_studies
      GROUP BY category
      ORDER BY value DESC
      LIMIT 5
    `);
    
    res.status(200).json(results);
  } catch (error) {
    console.error('Error fetching study categories:', error);
    res.status(500).json({ error: 'Failed to fetch study categories' });
  }
}

async function getUserActivity(req, res) {
  try {
    // Get monthly activity for the last 6 months
    const results = await query(`
      SELECT 
        DATE_FORMAT(last_activity, '%b') as name,
        SUM(CASE WHEN user_type = 'Student' THEN 1 ELSE 0 END) as Students,
        SUM(CASE WHEN user_type = 'Researcher' THEN 1 ELSE 0 END) as Researchers,
        SUM(CASE WHEN user_type = 'Teacher' THEN 1 ELSE 0 END) as Teachers
      FROM user
      WHERE last_activity >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(last_activity, '%b'), MONTH(last_activity)
      ORDER BY MONTH(last_activity)
    `);
    
    res.status(200).json(results);
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ error: 'Failed to fetch user activity' });
  }
}

async function getChatMetrics(req, res) {
  try {
    const results = await query(`
      SELECT 
        DATE_FORMAT(timestamp, '%b') as name,
        COUNT(*) as messages
      FROM chats
      WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(timestamp, '%b'), MONTH(timestamp)
      ORDER BY MONTH(timestamp)
    `);
    
    res.status(200).json(results);
  } catch (error) {
    console.error('Error fetching chat metrics:', error);
    res.status(500).json({ error: 'Failed to fetch chat metrics' });
  }
}

async function getRequestStatus(req, res) {
  try {
    const results = await query(`
      SELECT 
        status as name,
        COUNT(*) as value
      FROM research_access_requests
      GROUP BY status
    `);
    
    res.status(200).json(results);
  } catch (error) {
    console.error('Error fetching request status:', error);
    res.status(500).json({ error: 'Failed to fetch request status' });
  }
}

async function getStudyInstitutions(req, res) {
  try {
    const results = await query(`
      SELECT 
        institution as name,
        COUNT(*) as value
      FROM research_studies
      GROUP BY institution
      ORDER BY value DESC
      LIMIT 5
    `);
    
    res.status(200).json(results);
  } catch (error) {
    console.error('Error fetching study institutions:', error);
    res.status(500).json({ error: 'Failed to fetch study institutions' });
  }
}

async function getRecentLogs(req, res) {
  try {
    // Get study logs with study title
    const studyLogs = await query(`
      SELECT 
        date_added as timestamp,
        CONCAT('New study added: "', title, '"') as action,
        'study' as type,
        title as studyTitle,
        NULL as userName,
        NULL as userEmail,
        NULL as userType,
        research_id as studyId
      FROM research_studies
      ORDER BY date_added DESC
      LIMIT 5
    `);
    
    // Get request logs with user name and study title
    const requestLogs = await query(`
      SELECT 
        r.request_date as timestamp,
        CONCAT(
          CASE r.status
            WHEN 'Pending' THEN 'New access request from '
            WHEN 'Approved' THEN 'User request approved: '
            WHEN 'Denied' THEN 'User request denied: '
          END,
          CONCAT(u.first_name, ' ', u.last_name), ' for Study: ', s.title
        ) as action,
        'request' as type,
        s.title as studyTitle,
        CONCAT(u.first_name, ' ', u.last_name) as userName,
        u.email as userEmail,
        u.user_type as userType,
        r.research_id as studyId
      FROM research_access_requests r
      JOIN user u ON r.user_id = u.user_id
      JOIN research_studies s ON r.research_id = s.research_id
      ORDER BY r.request_date DESC
      LIMIT 5
    `);
    
    // Get chat logs with user name and study title
    const chatLogs = await query(`
      SELECT 
        c.timestamp,
        CONCAT('New chat message from ', CONCAT(u.first_name, ' ', u.last_name), ' for Study: ', s.title) as action,
        'chat' as type,
        s.title as studyTitle,
        CONCAT(u.first_name, ' ', u.last_name) as userName,
        u.email as userEmail,
        u.user_type as userType,
        c.research_id as studyId
      FROM chats c
      JOIN user u ON c.sender_id = u.user_id
      JOIN research_studies s ON c.research_id = s.research_id
      WHERE c.adminsender_id IS NULL
      ORDER BY c.timestamp DESC
      LIMIT 5
    `);
    
    // Combine all logs and sort by timestamp (most recent first)
    const allLogs = [...studyLogs, ...requestLogs, ...chatLogs]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);
    
    res.status(200).json(allLogs);
  } catch (error) {
    console.error('Error fetching recent logs:', error);
    res.status(500).json({ error: 'Failed to fetch recent logs' });
  }
}

async function getSummaryStats(req, res) {
  try {
    // Get total studies
    const [totalStudiesResult] = await query(`
      SELECT COUNT(*) as count FROM research_studies
    `);
    
    // Get total messages
    const [totalMessagesResult] = await query(`
      SELECT COUNT(*) as count FROM chats
    `);
    
    // Get total requests
    const [totalRequestsResult] = await query(`
      SELECT COUNT(*) as count FROM research_access_requests
    `);
    
    // Calculate average time between user message and admin reply
    // This requires a more complex query that might need customization based on your specific data model
    const [avgResponseTimeResult] = await query(`
      SELECT 
        SEC_TO_TIME(AVG(TIME_TO_SEC(TIMEDIFF(a.timestamp, u.timestamp)))) as avg_time
      FROM 
        (SELECT research_id, MIN(timestamp) as timestamp FROM chats WHERE adminsender_id IS NOT NULL GROUP BY research_id) a
        JOIN
        (SELECT research_id, MIN(timestamp) as timestamp FROM chats WHERE adminsender_id IS NULL GROUP BY research_id) u
        ON a.research_id = u.research_id
      WHERE a.timestamp > u.timestamp
    `);
    
    const avgResponseTime = avgResponseTimeResult && avgResponseTimeResult.avg_time 
      ? avgResponseTimeResult.avg_time.substring(0, 5) // Format as HH:MM
      : '0:00';
    
    const summaryStats = {
      totalStudies: totalStudiesResult.count || 0,
      totalMessages: totalMessagesResult.count || 0,
      totalRequests: totalRequestsResult.count || 0,
      averageResponseTime: avgResponseTime
    };
    
    res.status(200).json(summaryStats);
  } catch (error) {
    console.error('Error fetching summary stats:', error);
    res.status(500).json({ error: 'Failed to fetch summary stats' });
  }
}




/////users.js API endpoint
async function updateRequestStatus(req, res) {
  try {
    const { researchId, userId, status } = req.body;
    
    if (!researchId || !userId || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Verify that the status is valid
    const validStatuses = ['Pending', 'Approved', 'Denied'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }
    
    // Update the request in the database
    await query(
      `UPDATE research_access_requests 
       SET status = ? 
       WHERE user_id = ? AND research_id = ?`,
      [status, userId, researchId]
    );
    
    // Fetch the updated request to confirm
    const [updatedRequest] = await query(
      `SELECT * FROM research_access_requests 
       WHERE user_id = ? AND research_id = ?`,
      [userId, researchId]
    );
    
    if (!updatedRequest) {
      return res.status(404).json({ error: 'Request not found after update' });
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Request status updated successfully',
      request: updatedRequest
    });
    
  } catch (error) {
    console.error('Error updating request status:', error);
    res.status(500).json({ error: 'An error occurred while updating the request status' });
  }
}

function mapInstitutionToAbbreviation(fullName) {
  const institutionMap = {
    'Holycross of Davao College': 'HCDC',
    'University of the Immaculate Conception': 'UIC',
    'University of Southeastern Philippines': 'USEP',
    'University of Mindanao': 'UM',
    'Ateneo de Davao University': 'ADDU',
    'San Pedro College': 'SPC'
  };
  
  return institutionMap[fullName] || fullName;
}

async function getUsersWithRequests(req, res) {
  try {
    // Get the admin's institution from the request
    const adminInstitution = req.institution;
    
    if (!adminInstitution) {
      return res.status(400).json({ error: 'Admin institution not found' });
    }
    
    // Map the full institution name to its abbreviation
    const institutionAbbr = mapInstitutionToAbbreviation(adminInstitution);
    
    // First, get all users
    const usersResult = await query(`
      SELECT 
        user_id, 
        first_name, 
        last_name, 
        email, 
        user_type,
        last_activity
      FROM 
        user
      ORDER BY 
        last_activity DESC
    `);
    
    // For each user, get their requested studies filtered by admin's institution
    const usersWithRequests = [];
    
    for (const user of usersResult) {
      // Get all requests for this user filtered by admin's institution
      const requestsResult = await query(`
        SELECT 
          rs.research_id,
          rs.title as study_title,
          rar.status as request_status
        FROM 
          research_access_requests rar
        JOIN 
          research_studies rs ON rar.research_id = rs.research_id
        WHERE 
          rar.user_id = ?
          AND rs.institution = ?
      `, [user.user_id, institutionAbbr]);
      
      // Only add users who have requests for studies from this admin's institution
      if (requestsResult.length > 0) {
        usersWithRequests.push({
          ...user,
          requests: requestsResult
        });
      }
    }
    
    res.status(200).json({ users: usersWithRequests });
  } catch (error) {
    console.error('Error fetching users with requests:', error);
    res.status(500).json({ error: 'Error fetching users with requests' });
  }
}






/////panel.js API endpoint
async function getInstitutions(req, res) {
  try {
    // Get distinct institutions from research_studies
    const institutionsResult = await query(
      'SELECT DISTINCT institution FROM research_studies'
    );
    
    // Map institution names to standard formats for logo matching
    const institutions = institutionsResult.map(item => {
      const institutionName = item.institution;
      let logoKey = '';
      
      // Map full names to logo file names
      if (institutionName.toLowerCase().includes('holycross') || 
          institutionName.toLowerCase().includes('hcdc')) {
        logoKey = 'hcdc';
      } else if (institutionName.toLowerCase().includes('university of immaculate conception') || 
                institutionName.toLowerCase().includes('uic')) {
        logoKey = 'uic';
      } else if (institutionName.toLowerCase().includes('university of mindanao') || 
                institutionName.toLowerCase().includes('um')) {
        logoKey = 'um';
      } else if (institutionName.toLowerCase().includes('university of southeastern philippines') || 
                institutionName.toLowerCase().includes('usep')) {
        logoKey = 'usep';
      } else {
        // Default case - use first part of name as key
        logoKey = institutionName.split(' ')[0].toLowerCase();
      }
      
      return {
        name: institutionName,
        logoPath: `/Institution/${logoKey}.png`,
        researchCount: 0 // Will be populated next
      };
    });
    
    // Get count of research studies for each institution
    for (let i = 0; i < institutions.length; i++) {
      const countResult = await query(
        'SELECT COUNT(*) as count FROM research_studies WHERE institution = ?',
        [institutions[i].name]
      );
      institutions[i].researchCount = countResult[0].count;
    }
    
    res.status(200).json({ institutions });
  } catch (error) {
    console.error('Error fetching institutions:', error);
    res.status(500).json({ error: 'Error fetching institutions' });
  }
}

async function getStats(req, res) {
  try {
    // Get total users count
    const totalUsersResult = await query(
      'SELECT COUNT(*) as count FROM user'
    );
    
    // Get count of students
    const studentsResult = await query(
      'SELECT COUNT(*) as count FROM students'
    );
    
    // Get count of teachers
    const teachersResult = await query(
      'SELECT COUNT(*) as count FROM teachers'
    );
    
    // Get count of researchers
    const researchersResult = await query(
      'SELECT COUNT(*) as count FROM researchers'
    );
    
    res.status(200).json({
      totalUsers: totalUsersResult[0].count,
      totalStudents: studentsResult[0].count,
      totalTeachers: teachersResult[0].count,
      totalResearchers: researchersResult[0].count
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Error fetching user statistics' });
  }
}





/////Users side chats API endpoint
async function markMessagesAsRead(req, res) {
  try {
    const userId = req.userId;
    const { researchId } = req.body;

    await query(
      `UPDATE chats 
       SET is_read = 0 
       WHERE research_id = ? 
       AND sender_id IN (SELECT admin_id FROM admin_accounts)
       AND replies IS NOT NULL
       AND adminsender_id IS NOT NULL
       AND EXISTS (
         SELECT 1 
         FROM (SELECT * FROM chats) AS user_msg 
         WHERE user_msg.research_id = chats.research_id 
         AND user_msg.sender_id = ?
         AND user_msg.chat_id = chats.chat_id
       )`,
      [researchId, userId]
    );

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
}

async function getChatRequests(req, res) {
  try {
    const userId = req.userId; // This comes from authMiddleware

    // Modified query to count only replies to THIS user's specific messages
    const chatRequests = await query(
      `SELECT DISTINCT 
        r.research_id, 
        r.title,
        (SELECT COUNT(*) 
         FROM chats c2 
         WHERE c2.research_id = r.research_id 
         AND c2.is_read = 1
         AND c2.sender_id IN (SELECT admin_id FROM admin_accounts)
         AND c2.replies IS NOT NULL
         AND c2.adminsender_id IS NOT NULL
         AND EXISTS (
           SELECT 1 
           FROM chats user_msg 
           WHERE user_msg.research_id = r.research_id 
           AND user_msg.sender_id = ?
           AND user_msg.chat_id = c2.chat_id  
         )
        ) as admin_response_count
       FROM research_studies r
       JOIN chats c ON r.research_id = c.research_id
       WHERE c.sender_id = ?
       ORDER BY (
         SELECT MAX(timestamp) 
         FROM chats 
         WHERE research_id = r.research_id
         AND (
           sender_id = ? 
           OR (
             sender_id IN (SELECT admin_id FROM admin_accounts)
             AND EXISTS (
               SELECT 1 
               FROM chats user_msg 
               WHERE user_msg.research_id = r.research_id 
               AND user_msg.sender_id = ?
               AND user_msg.chat_id = chats.chat_id
             )
           )
         )
       ) DESC`,
      [userId, userId, userId, userId]
    );

    // Modified query to count only unread replies to THIS user's messages
    const [responseCount] = await query(
      `SELECT COUNT(*) as count
       FROM chats c
       WHERE c.sender_id IN (SELECT admin_id FROM admin_accounts)
       AND c.is_read = 1
       AND c.replies IS NOT NULL
       AND c.adminsender_id IS NOT NULL
       AND EXISTS (
         SELECT 1 
         FROM chats user_msg 
         WHERE user_msg.research_id = c.research_id 
         AND user_msg.sender_id = ?
         AND user_msg.chat_id = c.chat_id  
       )`,
      [userId]
    );

    res.status(200).json({ 
      chatRequests,
      adminResponses: responseCount.count
    });
  } catch (error) {
    console.error('Error fetching chat requests:', error);
    res.status(500).json({ error: 'Failed to fetch chat requests' });
  }
}

async function handleChatMessage(req, res) {
  try {
    const userId = req.userId; 

    const { research_id, message } = req.body;
    console.log('Looking up research_id:', research_id);

    const [research] = await query(
      'SELECT * FROM research_studies WHERE research_id = ?',
      [research_id]
    );
    console.log('Found research:', research);

    if (!research) {
      return res.status(404).json({ error: 'Research study not found' });
    }

    // Check if an access request already exists
    const [existingRequest] = await query(
      'SELECT * FROM research_access_requests WHERE user_id = ? AND research_id = ?',
      [userId, research_id]
    );

    // Only create a new access request if one doesn't exist
    if (!existingRequest) {
      await query(
        'INSERT INTO research_access_requests (user_id, research_id) VALUES (?, ?)',
        [userId, research_id]
      );
    }

    // Insert the chat message with corrected query
    await query(
      'INSERT INTO chats (sender_id, research_id, message) VALUES (?, ?, ?)',
      [userId, research_id, message]
    );

    res.status(200).json({
      success: true,
      message: 'Chat message and access request sent successfully'
    });
  } catch (error) {
    console.error('Detailed error in chat message handler:', error);
    res.status(500).json({
      error: 'Failed to send message. Please try again.'
    });
  }
}







//Users side chats
async function getAdminReplies(req, res) {
  try {
    const userId = req.userId;
    const research_id = req.url.split('/').pop();

    if (!research_id || research_id === 'undefined') {
      return res.status(400).json({ error: 'Research ID is required' });
    }

    const adminReplies = await query(
      `SELECT c.chat_id, c.replies
       FROM chats c
       WHERE c.research_id = ?
       AND EXISTS (
         SELECT 1 
         FROM chats user_msg 
         WHERE user_msg.research_id = c.research_id 
         AND user_msg.sender_id = ?
         AND user_msg.chat_id = c.chat_id
       )
       AND c.replies IS NOT NULL
       AND c.replies != ''`,
      [research_id, userId]
    );

    res.status(200).json({ replies: adminReplies });
  } catch (error) {
    console.error('Error fetching admin replies:', error);
    res.status(500).json({ error: 'Failed to fetch admin replies' });
  }
}


async function getChatMessages(req, res) {
  try {
    const userId = req.userId;
    const isAdmin = req.isAdmin;
    const research_id = req.url.split('/').pop();

    if (!research_id || research_id === 'undefined') {
      return res.status(400).json({ error: 'Research ID is required' });
    }

    let messages;
    if (isAdmin) {
      messages = await query(
        `SELECT c.*, 
          CASE WHEN c.sender_id = ? THEN true ELSE false END as isCurrentUser,
          u.first_name, u.last_name
         FROM chats c
         JOIN user u ON c.sender_id = u.user_id
         WHERE c.research_id = ?
         AND ((c.message IS NOT NULL AND c.message != '') 
           OR (c.replies IS NOT NULL AND c.replies != ''))
         ORDER BY c.timestamp ASC`,
        [userId, research_id]
      );
    } else {
      messages = await query(
        `WITH UserMessages AS (
          SELECT 
            c.*,
            u.first_name,
            u.last_name,
            TRUE as isCurrentUser,
            c.timestamp as message_timestamp,
            NULL as reply_timestamp
          FROM chats c
          JOIN user u ON c.sender_id = u.user_id
          WHERE c.research_id = ?
            AND c.sender_id = ?
            AND c.message IS NOT NULL 
            AND c.message != ''
            AND c.adminsender_id IS NULL
        ),
        AdminReplies AS (
          SELECT 
            c.*,
            u.first_name,
            u.last_name,
            FALSE as isCurrentUser,
            NULL as message_timestamp,
            c.timestamp as reply_timestamp
          FROM chats c
          JOIN user u ON c.sender_id = u.user_id
          WHERE c.research_id = ?
            AND EXISTS (
              SELECT 1 
              FROM chats user_msg 
              WHERE user_msg.research_id = c.research_id 
              AND user_msg.sender_id = ?
              AND user_msg.chat_id = c.chat_id
            )
            AND c.replies IS NOT NULL 
            AND c.replies != ''
            AND c.adminsender_id IS NOT NULL
        )
        SELECT * FROM UserMessages
        UNION ALL
        SELECT * FROM AdminReplies
        ORDER BY COALESCE(message_timestamp, reply_timestamp) ASC`,
        [research_id, userId, research_id, userId]
      );
    }

    const formattedMessages = messages
      .map(msg => ({
        id: msg.chat_id,
        message: msg.message || null,
        timestamp: msg.message_timestamp || msg.timestamp,
        isCurrentUser: msg.isCurrentUser,
        senderName: `${msg.first_name} ${msg.last_name}`,
        reply: msg.replies,
        replyTimestamp: msg.reply_timestamp
      }))
      .filter(msg => msg.message || msg.reply);

    res.status(200).json({ messages: formattedMessages });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
}











//Users side chats
async function editChatMessage(req, res) {
  try {
    const userId = req.userId;
    const { chatId, message } = req.body;

    const [existingMessage] = await query(
      'SELECT * FROM chats WHERE chat_id = ? AND sender_id = ?',
      [chatId, userId]
    );

    if (!existingMessage) {
      return res.status(403).json({ error: 'Not authorized to edit this message' });
    }

    await query(
      'UPDATE chats SET message = ? WHERE chat_id = ?',
      [message, chatId]
    );

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error editing chat message:', error);
    res.status(500).json({ error: 'Failed to edit message' });
  }
}

// Update delete message handler
async function deleteChatMessage(req, res) {
  try {
    const userId = req.userId;
    const chatId = req.url.split('/').pop();

    const [existingMessage] = await query(
      'SELECT * FROM chats WHERE chat_id = ? AND sender_id = ?',
      [chatId, userId]
    );

    if (!existingMessage) {
      return res.status(403).json({ error: 'Not authorized to delete this message' });
    }

    await query('DELETE FROM chats WHERE chat_id = ?', [chatId]);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting chat message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
}







/////Admin Side chats API endpoint
async function handleAdminReply(req, res) {
  const adminId = req.adminId;
  const { userId, researchId, reply } = req.body;
  
  if (!adminId) {
    return res.status(401).json({ error: 'Admin ID not found in session' });
  }
  
  try {
    // Insert the admin's reply
    const result = await query(`
      INSERT INTO chats (
        sender_id,
        research_id,
        message,
        adminsender_id,
        replies,
        is_read
      ) VALUES (?, ?, NULL, ?, ?, 1)
    `, [userId, researchId, adminId, reply]);
    
    // Fetch the updated messages with the same scoping as getStudyMessages
    const messages = await query(`
      SELECT 
        c.chat_id,
        c.sender_id,
        c.message,
        c.adminsender_id,
        c.replies,
        c.timestamp,
        c.is_read,
        u.first_name,
        u.last_name,
        u.user_type,
        COALESCE(a.username, 'Admin') as admin_username
      FROM chats c
      LEFT JOIN user u ON c.sender_id = u.user_id
      LEFT JOIN admin_accounts a ON c.adminsender_id = a.admin_id
      WHERE 
        c.research_id = ?
        AND (
          c.sender_id = ?
          OR (
            c.adminsender_id IS NOT NULL
            AND c.sender_id = ?
          )
        )
      ORDER BY c.timestamp ASC
    `, [researchId, userId, userId]);
    
    res.status(200).json({ success: true, messages });
  } catch (error) {
    console.error('Error handling admin reply:', error);
    res.status(500).json({ error: 'Failed to send reply' });
  }
}

async function getStudyMessages(req, res) {
  const { userId, researchId } = req.query;
  
  try {
    const messages = await query(`
      SELECT 
        c.chat_id,
        c.sender_id,
        c.message,
        c.adminsender_id,
        c.replies,
        c.timestamp,
        c.is_read,
        u.first_name,
        u.last_name,
        u.user_type,
        COALESCE(a.username, 'Admin') as admin_username
      FROM chats c
      LEFT JOIN user u ON c.sender_id = u.user_id
      LEFT JOIN admin_accounts a ON c.adminsender_id = a.admin_id
      WHERE 
        c.research_id = ?
        AND (
          c.sender_id = ?  
          OR (
            c.adminsender_id IS NOT NULL  
            AND c.sender_id = ?          
          )
        )
      ORDER BY c.timestamp ASC
    `, [researchId, userId, userId]);
    
    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching study messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
}

async function getRequestUsers(req, res) {
  try {
    // Get the admin's institution
    const adminInstitution = req.institution;
    if (!adminInstitution) {
      return res.status(400).json({ error: 'Admin institution not found' });
    }
    
    // Map the full institution name to its abbreviation
    const institutionAbbr = mapInstitutionToAbbreviation(adminInstitution);
    
    // Get users who have requested studies from this institution
    const users = await query(`
      SELECT DISTINCT u.user_id, u.first_name, u.last_name, u.user_type
      FROM user u
      JOIN research_access_requests rar ON u.user_id = rar.user_id
      JOIN research_studies rs ON rar.research_id = rs.research_id
      JOIN chats c ON u.user_id = c.sender_id
      WHERE rs.institution = ?
      ORDER BY u.last_name, u.first_name
    `, [institutionAbbr]);
    
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching request users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}

// Update getUserStudies function to filter by admin's institution
async function getUserStudies(req, res) {
  const { userId } = req.query;
  const adminInstitution = req.institution;
  
  if (!adminInstitution) {
    return res.status(400).json({ error: 'Admin institution not found' });
  }
  
  // Map the full institution name to its abbreviation
  const institutionAbbr = mapInstitutionToAbbreviation(adminInstitution);
  
  try {
    const studies = await query(`
      SELECT DISTINCT rs.research_id, rs.title, rs.status, rar.status as request_status
      FROM research_studies rs
      JOIN research_access_requests rar ON rs.research_id = rar.research_id
      JOIN chats c ON rs.research_id = c.research_id
      WHERE rar.user_id = ?
      AND rs.institution = ?
      ORDER BY rs.title
    `, [userId, institutionAbbr]);
    
    res.status(200).json(studies);
  } catch (error) {
    console.error('Error fetching user studies:', error);
    res.status(500).json({ error: 'Failed to fetch studies' });
  }
}










//////Filtering and Searching - home.js API endpoint
async function getStudyReferences(req, res) {
  try {
    const { studyId } = req.query;
    const references = await query(
      'SELECT reference_id, reference_link, reference_details FROM study_references WHERE research_id = ?',
      [studyId]
    );
    res.status(200).json({ references });
  } catch (error) {
    console.error('Error fetching references:', error);
    res.status(500).json({ error: 'Error fetching references' });
  }
}

async function getFilterOptions(req, res) {
  try {
    const [degrees, categories, institutions, years] = await Promise.all([
      query('SELECT DISTINCT degree_program FROM research_studies WHERE degree_program IS NOT NULL ORDER BY degree_program'),
      query('SELECT DISTINCT category FROM research_studies WHERE category IS NOT NULL ORDER BY category'),
      query('SELECT DISTINCT institution FROM research_studies WHERE institution IS NOT NULL ORDER BY institution'),
      query('SELECT YEAR(MIN(year_of_completion)) as min_year, YEAR(MAX(year_of_completion)) as max_year FROM research_studies')
    ]);

    res.status(200).json({
      degrees: degrees.map(d => d.degree_program),
      categories: categories.map(c => c.category),
      institutions: institutions.map(i => i.institution),
      years: {
        min: years[0].min_year,
        max: years[0].max_year
      }
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({ error: 'Error fetching filter options' });
  }
}

//Search section
async function searchStudies(req, res) {
  try {
    const { query: searchQuery } = req.query;
    const filters = req.query.filters ? JSON.parse(req.query.filters) : null;
    
    let whereConditions = [];
    let parameters = [];

    // Add search query conditions if present
    if (searchQuery && searchQuery.trim() !== '') {
      const searchTerms = searchQuery.toLowerCase().trim().split(/\s+/).filter(term => term.length > 0);
      
      if (searchTerms.length > 0) {
        // Create a CASE statement for ranking matches
        const rankingCase = `
          CASE 
            WHEN LOWER(rs.title) = ? THEN 100  
            WHEN LOWER(rs.title) LIKE ? THEN 90  
            WHEN LOWER(rs.title) LIKE ? THEN 80  
            WHEN LOWER(rs.keywords) LIKE ? THEN 60 
            WHEN LOWER(rs.abstract) LIKE ? THEN 50 
            WHEN LOWER(rs.author) LIKE ? THEN 40  
            WHEN LOWER(rs.institution) LIKE ? THEN 30  
            WHEN LOWER(rs.category) LIKE ? THEN 20  
            ELSE 0
          END as match_score`;

        const searchCondition = searchTerms.map(() => 
          'LOWER(rs.title) LIKE ? OR ' +
          'LOWER(rs.keywords) LIKE ? OR ' +
          'LOWER(rs.abstract) LIKE ? OR ' +
          'LOWER(rs.institution) LIKE ? OR ' +
          'LOWER(rs.category) LIKE ? OR ' +
          'LOWER(rs.author) LIKE ?'
        ).join(' OR ');

        whereConditions.push(`(${searchCondition})`);
        
        searchTerms.forEach(term => {
          // Parameters for ranking
          parameters.push(
            term.toLowerCase(), 
            `${term.toLowerCase()}%`, 
            `%${term.toLowerCase()}%`, 
            `%${term.toLowerCase()}%`, 
            `%${term.toLowerCase()}%`, 
            `%${term.toLowerCase()}%`, 
            `%${term.toLowerCase()}%`, 
            `%${term.toLowerCase()}%` 
          );
          const termPattern = `%${term}%`;
          parameters.push(...Array(6).fill(termPattern));
        });
      }
    }

    if (filters) {
      if (filters.yearRange && Array.isArray(filters.yearRange)) {
        whereConditions.push('YEAR(rs.year_of_completion) BETWEEN ? AND ?');
        parameters.push(filters.yearRange[0], filters.yearRange[1]);
      }

      if (filters.selectedDegrees?.length) {
        whereConditions.push(`rs.degree_program IN (${filters.selectedDegrees.map(() => '?').join(',')})`);
        parameters.push(...filters.selectedDegrees);
      }

      if (filters.selectedCategories?.length) {
        whereConditions.push(`rs.category IN (${filters.selectedCategories.map(() => '?').join(',')})`);
        parameters.push(...filters.selectedCategories);
      }

      if (filters.selectedInstitutions?.length) {
        whereConditions.push(`rs.institution IN (${filters.selectedInstitutions.map(() => '?').join(',')})`);
        parameters.push(...filters.selectedInstitutions);
      }
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    const searchSql = `
      SELECT DISTINCT
        rs.*,
        CASE 
          WHEN rs.author LIKE 'Dr.%' OR rs.author LIKE 'Mr.%' OR rs.author LIKE 'Ms.%' OR rs.author LIKE 'Mrs.%'
          THEN rs.author
          ELSE COALESCE(rs.author, 'Unknown Author')
        END as author_name,
        (SELECT COUNT(*) FROM study_references WHERE research_id = rs.research_id) as reference_count,
        ${searchQuery ? `
          CASE 
            WHEN LOWER(rs.title) = ? THEN 100
            WHEN LOWER(rs.title) LIKE ? THEN 90
            WHEN LOWER(rs.title) LIKE ? THEN 80
            WHEN LOWER(rs.keywords) LIKE ? THEN 60
            WHEN LOWER(rs.abstract) LIKE ? THEN 50
            WHEN LOWER(rs.author) LIKE ? THEN 40
            WHEN LOWER(rs.institution) LIKE ? THEN 30
            WHEN LOWER(rs.category) LIKE ? THEN 20
            ELSE 0
          END` : '0'} as match_score
      FROM research_studies rs
      ${whereClause}
      ORDER BY match_score DESC, rs.date_added DESC
      LIMIT 50
    `;

    // Add ranking parameters if there's a search query
    if (searchQuery && searchQuery.trim() !== '') {
      const term = searchQuery.toLowerCase().trim();
      parameters.push(
        term,
        `${term}%`,
        `%${term}%`,
        `%${term}%`,
        `%${term}%`,
        `%${term}%`,
        `%${term}%`,
        `%${term}%`
      );
    }

    const studies = await query(searchSql, parameters);

    return res.status(200).json({ 
      studies,
      total: studies.length
    });

  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ 
      error: 'Error searching studies',
      details: error.message 
    });
  }
}


















/////Admin Study References section - Adding, Updating, Deleting - studies.js API endpoint
async function getReferences(req, res) {
  try {
    const studyId = req.url.split('/').pop();
    const references = await query(
      'SELECT * FROM study_references WHERE research_id = ?',
      [studyId]
    );
    res.status(200).json({ references });
  } catch (error) {
    console.error('Error fetching references:', error);
    res.status(500).json({ error: 'Error fetching references' });
  }
}

// Add or update references for a study
async function updateReferences(req, res) {
  try {
    const studyId = req.url.split('/').pop();
    const { references } = req.body;

    // Start a transaction
    await query('START TRANSACTION');

    // Delete existing references
    await query('DELETE FROM study_references WHERE research_id = ?', [studyId]);

    // Insert new references
    for (const ref of references) {
      await query(
        'INSERT INTO study_references (research_id, reference_link, reference_details) VALUES (?, ?, ?)',
        [studyId, ref.reference_link, ref.reference_details]
      );
    }

    // Commit the transaction
    await query('COMMIT');

    res.status(200).json({ message: 'References updated successfully' });
  } catch (error) {
    // Rollback in case of error
    await query('ROLLBACK');
    console.error('Error updating references:', error);
    res.status(500).json({ error: 'Error updating references' });
  }
}

// Delete a single reference
async function deleteReference(req, res) {
  try {
    const referenceId = req.url.split('/').pop();
    await query('DELETE FROM study_references WHERE reference_id = ?', [referenceId]);
    res.status(200).json({ message: 'Reference deleted successfully' });
  } catch (error) {
    console.error('Error deleting reference:', error);
    res.status(500).json({ error: 'Error deleting reference' });
  }
}



/////Admin Research Studies section - Adding, Updating, Deleting
async function getStudies(req, res) {
  try {
    // Get the admin's institution from the request (set by authMiddleware)
    const adminInstitution = req.institution;
    
    if (!adminInstitution) {
      return res.status(400).json({ error: 'Admin institution not found' });
    }
    
    // Map the full institution name to its abbreviation
    const institutionAbbr = mapInstitutionToAbbreviation(adminInstitution);
    
    // Fetch only studies belonging to the admin's institution
    const studies = await query(
      'SELECT * FROM research_studies WHERE institution = ? ORDER BY date_added DESC',
      [institutionAbbr]
    );
    
    res.status(200).json({ studies });
  } catch (error) {
    console.error('Error fetching studies:', error);
    res.status(500).json({ error: 'Error fetching studies' });
  }
}

async function createStudy(req, res) {
  try {
    const {
      title,
      abstract,
      keywords,
      year_of_completion,
      degree_program,
      category,
      institution,
      author,
      status
    } = req.body;

    // Validate status
    if (status !== 'Available' && status !== 'Non-Available') {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const result = await query(
      `INSERT INTO research_studies 
       (title, abstract, keywords, year_of_completion, degree_program, 
        category, institution, author, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        abstract,
        keywords,
        year_of_completion,
        degree_program,
        category,
        institution,
        author,
        status
      ]
    );

    res.status(201).json({ 
      message: 'Study created successfully',
      study_id: result.insertId 
    });
  } catch (error) {
    console.error('Error creating study:', error);
    res.status(500).json({ error: 'Error creating study' });
  }
}

async function updateStudy(req, res) {
  try {
    const studyId = req.url.split('/').pop();
    const {
      title,
      abstract,
      keywords,
      year_of_completion,
      degree_program,
      category,
      institution,
      author,
      status
    } = req.body;

    // Validate status
    if (status !== 'Available' && status !== 'Non-Available') {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    await query(
      `UPDATE research_studies 
       SET title = ?, abstract = ?, keywords = ?, 
           year_of_completion = ?, degree_program = ?,
           category = ?, institution = ?, author = ?, 
           status = ?
       WHERE research_id = ?`,
      [
        title,
        abstract,
        keywords,
        year_of_completion,
        degree_program,
        category,
        institution,
        author,
        status,
        studyId
      ]
    );

    res.status(200).json({ message: 'Study updated successfully' });
  } catch (error) {
    console.error('Error updating study:', error);
    res.status(500).json({ error: 'Error updating study' });
  }
}

async function deleteStudy(req, res) {
  try {
    const studyId = req.url.split('/').pop();
    await query('DELETE FROM research_studies WHERE research_id = ?', [studyId]);
    res.status(200).json({ message: 'Study deleted successfully' });
  } catch (error) {
    console.error('Error deleting study:', error);
    res.status(500).json({ error: 'Error deleting study' });
  }
}












//Admin Login section - login.js and panel.js
async function handleAdminLogout(req, res) {
  try {
    // Only clear the admin token
    res.setHeader('Set-Cookie', [
      serialize('adminToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: -1,
        path: '/'
      })
    ]);

    res.status(200).json({ message: 'Admin logged out successfully' });
  } catch (error) {
    console.error('Admin logout error:', error);
    res.status(500).json({ error: 'Error during admin logout' });
  }
}

async function handleAdminLogin(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const [admin] = await query(
      'SELECT * FROM admin_accounts WHERE email = ?',
      [email]
    );

    if (!admin) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValidPassword = password === admin.password;
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = sign(
      {
        userId: admin.admin_id,
        adminId: admin.admin_id,
        email: admin.email,
        username: admin.username,
        institution: admin.institution,
        isAdmin: true
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set admin token specifically
    res.setHeader('Set-Cookie', [
      serialize('adminToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 86400,
        path: '/'
      })
    ]);

    res.status(200).json({
      message: 'Admin login successful',
      admin: {
        id: admin.admin_id,
        username: admin.username,
        email: admin.email,
        institution: admin.institution
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'An error occurred during login' });
  }
}

async function getUserDataAdmin(req, res) {
  try {
    const [admin] = await query(
      'SELECT admin_id, email, username FROM admin_accounts WHERE admin_id = ?',
      [req.userId]
    );

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    const adminData = {
      ...admin,
      isAdmin: true
    };

    res.status(200).json({ user: adminData });
  } catch (error) {
    console.error('Error fetching admin data:', error);
    res.status(500).json({ error: 'Error fetching admin data' });
  }
}














//Users Login, Logout, section - login and home.js API endpoint
async function handleLogin(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const users = await query(
      'SELECT * FROM user WHERE email = ?',
      [email]
    );

    const user = users[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Add last activity tracking
    await query(
      'UPDATE user SET last_activity = CURRENT_TIMESTAMP WHERE user_id = ?',
      [user.user_id]
    );

    let additionalInfo = {};

    if (user.user_type === 'Student') {
      const [studentInfo] = await query(
        'SELECT institution_name, year_level, course_type FROM students WHERE user_id = ?', 
        [user.user_id]
      );
      if (studentInfo) {
        additionalInfo = {
          institution: studentInfo.institution_name,
          yearLevel: studentInfo.year_level,
          course: studentInfo.course_type
        };
      }
    } else if (user.user_type === 'Researcher') {
      const [researcherInfo] = await query(
        'SELECT organization_name FROM researchers WHERE user_id = ?',
        [user.user_id]
      );
      if (researcherInfo) {
        additionalInfo = {
          organization: researcherInfo.organization_name
        };
      }
    } else if (user.user_type === 'Teacher') {
      const [teacherInfo] = await query(
        'SELECT institution_name FROM teachers WHERE user_id = ?',
        [user.user_id]
      );
      if (teacherInfo) {
        additionalInfo = {
          institution: teacherInfo.institution_name
        };
      }
    }

    const token = sign(
      {
        userId: user.user_id,
        email: user.email,
        userType: user.user_type,
        isAdmin: false
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // MODIFIED: Set user token without clearing admin token
    res.setHeader('Set-Cookie', [
      serialize('userToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 86400,
        path: '/'
      })
      // REMOVED: The line that clears the adminToken
    ]);

    const userData = {
      id: user.user_id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      userType: user.user_type,
      ...additionalInfo
    };

    res.status(200).json({
      message: 'Login successful',
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error during login' });
  }
}

async function handleLogout(req, res) {
  try {
    // New parameter to determine which account to log out
    const { logoutType } = req.body; // Can be 'user', 'admin', or 'all'
    
    // Default to logging out all accounts if not specified
    const type = logoutType || 'all';
    
    let cookies = [];
    
    // Get the user token from cookies
    const userToken = req.cookies.userToken;
    const adminToken = req.cookies.adminToken;
    
    // Update last activity for user if logging out user account
    if ((type === 'user' || type === 'all') && userToken) {
      try {
        // Verify and decode the token to get userId
        const decoded = verify(userToken, process.env.JWT_SECRET);
        
        // Update last activity when logging out
        await query(
          'UPDATE user SET last_activity = CURRENT_TIMESTAMP WHERE user_id = ?',
          [decoded.userId]
        );
      } catch (tokenError) {
        console.error('Token verification error:', tokenError);
        // If token verification fails, just proceed with logout
      }
    }

    // Add cookies to clear based on logout type
    if (type === 'user' || type === 'all') {
      cookies.push(
        serialize('userToken', '', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: -1,
          path: '/'
        })
      );
    }
    
    if (type === 'admin' || type === 'all') {
      cookies.push(
        serialize('adminToken', '', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: -1,
          path: '/'
        })
      );
    }

    res.setHeader('Set-Cookie', cookies);
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Error during logout' });
  }
}

async function getUserData(req, res) {
  try {
    const users = await query(
      'SELECT user_id, email, first_name, last_name, user_type FROM user WHERE user_id = ?',
      [req.userId]
    );

    const user = users[0];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ error: 'Error fetching user data' });
  }
}


//signup.js API endpoint
async function handleSignup(req, res) {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      userType,
      institution,
      yearLevel,
      course,
      organization
    } = req.body;

    const existingUser = await query(
      'SELECT * FROM user WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const accountResult = await query(
      'INSERT INTO user (first_name, last_name, email, password, user_type) VALUES (?, ?, ?, ?, ?)',
      [firstName, lastName, email, hashedPassword, userType]
    );

    const userId = accountResult.insertId;

    if (userType === 'Student') { 
      await query(
        'INSERT INTO students (user_id, institution_name, year_level, course_type) VALUES (?, ?, ?, ?)',
        [userId, institution, yearLevel, course]
      );
    } else if (userType === 'Researcher') {
      await query(
        'INSERT INTO researchers (user_id, organization_name) VALUES (?, ?)',
        [userId, organization]
      );
    } else if (userType === 'Teacher') {
      await query(
        'INSERT INTO teachers (user_id, institution_name) VALUES (?, ?)',
        [userId, institution]
      );
    }

    const token = sign(
      { userId, email, userType },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: userId,
        email,
        userType,
        firstName,
        lastName
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Error creating account' });
  }
}

export default handler;