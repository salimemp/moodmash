// Utility to generate bcrypt hash for admin password
const bcrypt = require('bcryptjs');

const password = 'admin123';
const hash = bcrypt.hashSync(password, 10);

console.log('Password:', password);
console.log('Bcrypt Hash:', hash);
