import { connectToDatabase } from '@/lib/mongodb';
import jwt from 'jsonwebtoken';

const SECRET_KEY = "fantastic"; // Replace with your secret key

// Test admin credentials - In production, these should be stored securely
const TEST_ADMIN = {
  username: 'admin',
  password: '123',
  role: 'admin'
};

export async function POST(req) {
  const { username, password } = await req.json();

  try {
    // Check for test admin credentials first
    if (username === TEST_ADMIN.username && password === TEST_ADMIN.password) {
      // Generate JWT for test admin
      const token = jwt.sign(
        { 
          username: TEST_ADMIN.username, 
          role: TEST_ADMIN.role 
        }, 
        SECRET_KEY, 
        { expiresIn: '1h' }
      );

      return new Response(
        JSON.stringify({ message: 'Login successful' }),
        {
          status: 200,
          headers: {
            'Set-Cookie': `admin_token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict`,
          },
        }
      );
    }

    // If not test admin, proceed with database check
    const db = await connectToDatabase();
    const user = await db.collection('admin_users').findOne({ username });

    if (!user || user.password !== password) {
      return new Response(
        JSON.stringify({ message: 'Invalid credentials or not an admin' }),
        { status: 401 }
      );
    }

    if (user.role !== 'admin') {
      return new Response(
        JSON.stringify({ message: 'You do not have admin privileges' }),
        { status: 403 }
      );
    }

    // Log the successful login
    await db.collection('user_logins').insertOne({
      username,
      login_time: new Date(),
    });

    // Generate JWT for database user
    const token = jwt.sign(
      { 
        username: user.username, 
        role: user.role 
      }, 
      SECRET_KEY, 
      { expiresIn: '1h' }
    );
    
    return new Response(
      JSON.stringify({ message: 'Login successful' }),
      {
        status: 200,
        headers: {
          'Set-Cookie': `admin_token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict`,
        },
      }
    );

  } catch (error) {
    console.error('Error during login:', error);
    return new Response(
      JSON.stringify({ message: 'Internal server error' }),
      { status: 500 }
    );
  }
}