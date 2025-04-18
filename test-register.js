// Test script to check if registration works with the database connection
import fetch from 'node-fetch';

async function testRegistration() {
  console.log('Testing user registration...');
  
  try {
    const response = await fetch('http://localhost:5000/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'testuser_' + Date.now(),
        password: 'password123',
        role: 'user',
      }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('Registration successful!', data);
    } else {
      console.error('Registration failed:', data);
    }
  } catch (error) {
    console.error('Error testing registration:', error);
  }
}

testRegistration();