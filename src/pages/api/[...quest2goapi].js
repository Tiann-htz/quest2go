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
        }
        
        break;
      case 'PUT':
        if (pathname.startsWith('/api/admin/studies/')) {
          return authMiddleware(updateStudy)(req, res);
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

async function getAdminReplies(req, res) {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    
    // Extract research_id from URL
    const research_id = req.url.split('/').pop();
    
    if (!research_id || research_id === 'undefined') {
      return res.status(400).json({ error: 'Research ID is required' });
    }

    // Get only the chat_id and replies - exclude the message field
    const adminReplies = await query(
      `SELECT c.chat_id, c.replies
       FROM chats c
       WHERE c.sender_id = ?
       AND c.research_id = ?
       AND c.replies IS NOT NULL
       AND c.replies != ''`,
      [userId, research_id]
    );

    res.status(200).json({ replies: adminReplies });
  } catch (error) {
    console.error('Error fetching admin replies:', error);
    res.status(500).json({ error: 'Failed to fetch admin replies' });
  }
}


async function getChatMessages(req, res) {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    const isAdmin = decoded.isAdmin || false;
    
    const research_id = req.url.split('/').pop();
    
    if (!research_id || research_id === 'undefined') {
      return res.status(400).json({ error: 'Research ID is required' });
    }

    let messages;
    if (isAdmin) {
      // Admin can see all messages for the research study
      messages = await query(
        `SELECT c.*, 
          CASE WHEN c.sender_id = ? THEN true ELSE false END as isCurrentUser,
          u.first_name, u.last_name
         FROM chats c
         JOIN user u ON c.sender_id = u.user_id
         WHERE c.research_id = ?
         AND ((c.message IS NOT NULL AND c.message != '') OR (c.replies IS NOT NULL AND c.replies != ''))
         ORDER BY c.timestamp ASC`,
        [userId, research_id]
      );
    } else {
      // Regular users only see their own messages and admin replies
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
            AND c.sender_id = ?
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

    const formattedMessages = messages.map(msg => ({
      id: msg.chat_id,
      message: msg.message || null, 
      timestamp: msg.message_timestamp || msg.timestamp,
      isCurrentUser: msg.isCurrentUser,
      senderName: `${msg.first_name} ${msg.last_name}`,
      reply: msg.replies,
      replyTimestamp: msg.reply_timestamp
    })).filter(msg => msg.message || msg.reply); 

    res.status(200).json({ messages: formattedMessages });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
}


async function getChatRequests(req, res) {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Get chat requests for regular users
    // Now counts responses from admins (where is_read = 1)
    const chatRequests = await query(
      `SELECT DISTINCT 
        r.research_id, 
        r.title,
        (SELECT COUNT(*) 
         FROM chats c2 
         WHERE c2.research_id = r.research_id 
         AND c2.is_read = 1
         AND c2.sender_id IN (SELECT admin_id FROM admin_accounts)
         AND EXISTS (
           SELECT 1 FROM chats c3 
           WHERE c3.research_id = r.research_id 
           AND c3.sender_id = ?
         )
        ) as admin_response_count
       FROM research_studies r
       JOIN chats c ON r.research_id = c.research_id
       WHERE c.sender_id = ?
       ORDER BY (
         SELECT MAX(timestamp) 
         FROM chats 
         WHERE research_id = r.research_id
       ) DESC`,
      [userId, userId]
    );

    // Calculate total admin responses
    const [responseCount] = await query(
      `SELECT COUNT(*) as count
       FROM chats c
       WHERE c.sender_id IN (SELECT admin_id FROM admin_accounts)
       AND c.is_read = 1
       AND EXISTS (
         SELECT 1 
         FROM chats c2 
         WHERE c2.research_id = c.research_id 
         AND c2.sender_id = ?
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
    console.log('Received chat message request:', req.body);
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    console.log('User ID from token:', userId);

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





async function editChatMessage(req, res) {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    
    const { chatId, message } = req.body;

    // Verify the message belongs to the user
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

async function deleteChatMessage(req, res) {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    
    const chatId = req.url.split('/').pop();

    // Verify the message belongs to the user
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







//Admin Side
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
    const users = await query(`
      SELECT DISTINCT u.user_id, u.first_name, u.last_name, u.user_type
      FROM user u
      JOIN research_access_requests rar ON u.user_id = rar.user_id
      JOIN chats c ON u.user_id = c.sender_id
      ORDER BY u.last_name, u.first_name
    `);
    
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching request users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}

// Get studies requested by a specific user
async function getUserStudies(req, res) {
  const { userId } = req.query;
  
  try {
    const studies = await query(`
      SELECT DISTINCT rs.research_id, rs.title, rs.status, rar.status as request_status
      FROM research_studies rs
      JOIN research_access_requests rar ON rs.research_id = rar.research_id
      JOIN chats c ON rs.research_id = c.research_id
      WHERE rar.user_id = ?
      ORDER BY rs.title
    `, [userId]);
    
    res.status(200).json(studies);
  } catch (error) {
    console.error('Error fetching user studies:', error);
    res.status(500).json({ error: 'Failed to fetch studies' });
  }
}











//////Filtering and Searching
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
      query('SELECT MIN(year_of_completion) as min_year, MAX(year_of_completion) as max_year FROM research_studies')
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
        
        // Add parameters for both ranking and search conditions
        searchTerms.forEach(term => {
          // Parameters for ranking
          parameters.push(
            term.toLowerCase(), // Exact match
            `${term.toLowerCase()}%`, // Starts with
            `%${term.toLowerCase()}%`, // Contains
            `%${term.toLowerCase()}%`, // Keywords
            `%${term.toLowerCase()}%`, // Abstract
            `%${term.toLowerCase()}%`, // Author
            `%${term.toLowerCase()}%`, // Institution
            `%${term.toLowerCase()}%`  // Category
          );
          // Parameters for WHERE conditions
          const termPattern = `%${term}%`;
          parameters.push(...Array(6).fill(termPattern));
        });
      }
    }

    // Add filter conditions if present
    if (filters) {
      if (filters.yearRange && Array.isArray(filters.yearRange)) {
        whereConditions.push('rs.year_of_completion BETWEEN ? AND ?');
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


















/////Admin Study References section - Adding, Updating, Deleting
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
    const studies = await query(
      'SELECT * FROM research_studies ORDER BY date_added DESC'
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












//Admin Login section
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
        isAdmin: true
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.setHeader('Set-Cookie', serialize('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 86400,
      path: '/'
    }));

    res.status(200).json({
      message: 'Admin login successful',
      admin: {
        id: admin.admin_id,
        username: admin.username,
        email: admin.email
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














//Users Login, Logout, Signup section
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
        userType: user.user_type
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.setHeader('Set-Cookie', serialize('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 86400,
      path: '/'
    }));

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
    // Get the token from cookies
    const token = req.cookies.token;
    
    if (!token) {
      // If no token exists, just clear the cookie and return success
      res.setHeader('Set-Cookie', serialize('token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: -1,
        path: '/'
      }));
      return res.status(200).json({ message: 'Logged out successfully' });
    }

    try {
      // Verify and decode the token to get userId
      const decoded = verify(token, process.env.JWT_SECRET);
      
      // Update last activity when logging out
      await query(
        'UPDATE user SET last_activity = CURRENT_TIMESTAMP WHERE user_id = ?',
        [decoded.userId]
      );
    } catch (tokenError) {
      console.error('Token verification error:', tokenError);
      // If token verification fails, just proceed with logout
    }

    // Clear the cookie regardless of token verification
    res.setHeader('Set-Cookie', serialize('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: -1,
      path: '/'
    }));

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