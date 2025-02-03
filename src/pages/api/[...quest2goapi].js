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
        } else if (pathname === '/api/logout') {
          await handleLogout(req, res);
        }
        break;
      case 'GET':
        if (pathname === '/api/user') {
          return authMiddleware(getUserData)(req, res);
        }
        break;
      default:
        res.setHeader('Allow', ['POST', 'GET']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while processing your request' });
  }
};

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
