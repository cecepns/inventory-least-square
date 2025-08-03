import fetch from 'node-fetch';

const testLogin = async () => {
  try {
    console.log('🧪 Testing login functionality...');
    
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Login successful!');
      console.log('📋 Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Login failed!');
      console.log('📋 Error:', data);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testLogin(); 