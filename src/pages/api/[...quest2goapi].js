import { parse } from 'url';
import bcrypt from 'bcrypt';
import { sign } from 'jsonwebtoken';
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



//Research Studies Admin section - Adding, Updating, Deleting
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
  const { query: searchQuery } = req.query;
  const filters = req.query.filters ? JSON.parse(req.query.filters) : null;
  
  try {
    let whereConditions = [];
    let parameters = [];

    // Add search query conditions if present
    if (searchQuery && searchQuery.trim() !== '') {
      const searchTerms = searchQuery.toLowerCase().trim().split(/\s+/).filter(term => term.length > 0);
      
      const searchConditions = searchTerms.map(() => `
        (LOWER(rs.title) LIKE ? 
        OR LOWER(rs.keywords) LIKE ? 
        OR LOWER(rs.abstract) LIKE ?
        OR LOWER(rs.institution) LIKE ? 
        OR LOWER(rs.category) LIKE ?
        OR LOWER(u.first_name) LIKE ? 
        OR LOWER(u.last_name) LIKE ?
        OR LOWER(CONCAT(u.first_name, ' ', u.last_name)) LIKE ?)`
      ).join(' OR ');

      if (searchConditions) {
        whereConditions.push(`(${searchConditions})`);
        parameters.push(...searchTerms.flatMap(term => Array(8).fill(`%${term}%`)));
      }
    }

    // Add filter conditions if present
    if (filters) {
      if (filters.yearRange) {
        whereConditions.push('year_of_completion BETWEEN ? AND ?');
        parameters.push(filters.yearRange[0], filters.yearRange[1]);
      }

      if (filters.selectedDegrees?.length) {
        whereConditions.push(`degree_program IN (${filters.selectedDegrees.map(() => '?').join(', ')})`);
        parameters.push(...filters.selectedDegrees);
      }

      if (filters.selectedCategories?.length) {
        whereConditions.push(`category IN (${filters.selectedCategories.map(() => '?').join(', ')})`);
        parameters.push(...filters.selectedCategories);
      }

      if (filters.selectedInstitutions?.length) {
        whereConditions.push(`institution IN (${filters.selectedInstitutions.map(() => '?').join(', ')})`);
        parameters.push(...filters.selectedInstitutions);
      }
    }

    const whereClause = whereConditions.length ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const searchSql = `
  SELECT DISTINCT
    rs.*,
    CASE 
      WHEN rs.author LIKE 'Dr.%' OR rs.author LIKE 'Mr.%' OR rs.author LIKE 'Ms.%' OR rs.author LIKE 'Mrs.%'
      THEN rs.author
      ELSE COALESCE(rs.author, 'Unknown Author') 
    END as author_name,
    'Researcher' as author_type,
    (SELECT COUNT(*) FROM study_references WHERE research_id = rs.research_id) as reference_count
  FROM research_studies rs
  ${whereClause}
  ORDER BY rs.date_added DESC
  LIMIT 50
`;

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



//Admin section
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

    let additionalInfo = {};

    if (user.user_type === 'Educator') {
      const [educatorInfo] = await query(
        'SELECT institution_name, year_level, course_type FROM educators WHERE user_id = ?',
        [user.user_id]
      );
      if (educatorInfo) {
        additionalInfo = {
          institution: educatorInfo.institution_name,
          yearLevel: educatorInfo.year_level,
          course: educatorInfo.course_type
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
  res.setHeader('Set-Cookie', serialize('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: -1,
    path: '/'
  }));

  res.status(200).json({ message: 'Logged out successfully' });
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

    if (userType === 'Educator') {
      await query(
        'INSERT INTO educators (user_id, institution_name, year_level, course_type) VALUES (?, ?, ?, ?)',
        [userId, institution, yearLevel, course]
      );
    } else if (userType === 'Researcher') {
      await query(
        'INSERT INTO researchers (user_id, organization_name) VALUES (?, ?)',
        [userId, organization]
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