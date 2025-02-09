import { parse } from 'url';
import bcrypt from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { query } from '../../utils/db';
import { authMiddleware } from '../../utils/authMiddleware';
import { serialize } from 'cookie';

const handler = async (req, res) => {
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
        }
        break;
      case 'GET':
        if (pathname === '/api/user') {
          return authMiddleware(getUserData)(req, res);
        } else if (pathname === '/api/admin/user') {
          return authMiddleware(getUserDataAdmin)(req, res);
        } else if (pathname === '/api/admin/studies') {
          return authMiddleware(getStudies)(req, res);
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


//Getting Research Studies in database
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

//For adding-updating-deleting studies section
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
      author_id,
      status
    } = req.body;

    const result = await query(
      `INSERT INTO research_studies 
       (title, abstract, keywords, year_of_completion, degree_program, 
        category, institution, author_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        abstract,
        keywords,
        year_of_completion,
        degree_program,
        category,
        institution,
        author_id,
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
      author_id,
      status
    } = req.body;

    await query(
      `UPDATE research_studies 
       SET title = ?, abstract = ?, keywords = ?, 
           year_of_completion = ?, degree_program = ?,
           category = ?, institution = ?, author_id = ?, 
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
        author_id,
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







//Users - Login-Signup Section
async function handleAdminLogin(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Query to get admin account
    const [admin] = await query(
      'SELECT * FROM admin_accounts WHERE email = ?',
      [email]
    );

    if (!admin) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Direct password comparison for admin accounts
    // NOTE: This is temporary - in production, passwords should always be hashed
    const isValidPassword = password === admin.password;
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token with admin flag
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

    // Set HTTP-only cookie
    res.setHeader('Set-Cookie', serialize('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 86400,
      path: '/'
    }));

    // Return success response
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

async function handleLogin(req, res) {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const users = await query(
      'SELECT * FROM registered_accounts WHERE email = ?',
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

    // Get additional info based on user type
    if (user.user_type === 'Educator') {
      const [educatorInfo] = await query(
        'SELECT institution_name, year_level, course_type FROM educators WHERE account_id = ?',
        [user.account_id]
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
        'SELECT organization_name FROM researchers WHERE account_id = ?',
        [user.account_id]
      );
      if (researcherInfo) {
        additionalInfo = {
          organization: researcherInfo.organization_name
        };
      }
    }

    // Generate JWT token
    const token = sign(
      {
        userId: user.account_id,
        email: user.email,
        userType: user.user_type
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set HTTP-only cookie
    res.setHeader('Set-Cookie', serialize('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 86400, // 24 hours
      path: '/'
    }));

    // Prepare user data response (excluding sensitive information)
    const userData = {
      id: user.account_id,
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
      'SELECT account_id, email, first_name, last_name, user_type FROM registered_accounts WHERE account_id = ?',
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

async function getUserDataAdmin(req, res) {
  try {
    const [admin] = await query(
      'SELECT admin_id, email, username FROM admin_accounts WHERE admin_id = ?',
      [req.userId]
    );

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Add isAdmin flag to the response
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

    // Check if email already exists
    const existingUser = await query(
      'SELECT * FROM registered_accounts WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into registered_accounts
    const accountResult = await query(
      'INSERT INTO registered_accounts (first_name, last_name, email, password, user_type) VALUES (?, ?, ?, ?, ?)',
      [firstName, lastName, email, hashedPassword, userType]
    );

    const accountId = accountResult.insertId;

    // Insert additional info based on user type
    if (userType === 'Educator') {
      await query(
        'INSERT INTO educators (account_id, institution_name, year_level, course_type) VALUES (?, ?, ?, ?)',
        [accountId, institution, yearLevel, course]
      );
    } else if (userType === 'Researcher') {
      await query(
        'INSERT INTO researchers (account_id, organization_name) VALUES (?, ?)',
        [accountId, organization]
      );
    }

    // Generate JWT token
    const token = sign(
      { userId: accountId, email, userType },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: accountId,
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
