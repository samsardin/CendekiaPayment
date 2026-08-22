const { query, get } = require('../server/database/db');

async function testStudentWA() {
  const students = await query(`SELECT * FROM students LIMIT 5`);
  console.log('Sample students columns:', Object.keys(students[0] || {}));
  console.log('Sample student:', students[0]);

  try {
    const parents = await query(`SELECT * FROM parents LIMIT 5`);
    console.log('Sample parents:', parents);
  } catch (e) {
    console.log('Parents query notice:', e.message);
  }
}

testStudentWA();
