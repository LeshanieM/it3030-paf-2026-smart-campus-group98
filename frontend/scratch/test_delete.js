import axios from 'axios';
import crypto from 'crypto';

function signJwt(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encode = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const part1 = encode(header);
  const part2 = encode(payload);
  const signature = crypto.createHmac('sha256', secret).update(`${part1}.${part2}`).digest('base64url');
  return `${part1}.${part2}.${signature}`;
}

const JWT_SECRET = '3dbdeb3482a58802f5fdc7bb412cbd8dec633a96aa805a31c3e2607a1159b001';
const TEST_USER = {
  email: 'student@example.com',
  id: 'user-123',
  name: 'Student User',
  role: 'USER',
};

const token = signJwt({
  sub: TEST_USER.email,
  id: TEST_USER.id,
  name: TEST_USER.name,
  role: 'ROLE_USER', // Match Spring Security role format if needed
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 86400,
}, JWT_SECRET);

async function testDelete() {
  const bookingId = '69ed08138fdc213c6551a767';
  console.log(`Testing DELETE for booking ${bookingId} on 127.0.0.1:8092...`);
  try {
    const response = await axios.delete(`http://127.0.0.1:8092/api/bookings/${bookingId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Response:', response.status);
  } catch (error) {
    console.log('Error Status:', error.response?.status || 'No Status');
    if (error.response?.data) {
        console.log('Error Data:', JSON.stringify(error.response.data, null, 2));
    } else {
        console.log('Error Message:', error.message);
    }
  }
}

testDelete();
