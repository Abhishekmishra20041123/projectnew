// Test date formatting to ensure it matches what the backend expects

const testDate = new Date('2025-09-01');
console.log('Original date string: 2025-09-01');
console.log('Parsed date:', testDate);
console.log('toISOString():', testDate.toISOString());
console.log('toISOString().split("T")[0]:', testDate.toISOString().split('T')[0]);
console.log('toJSON():', testDate.toJSON());
console.log('toLocaleDateString():', testDate.toLocaleDateString());

// Test what happens with different date formats
console.log('\n--- Testing different date formats ---');

const formats = [
  '2025-09-01',
  '2025-09-1',
  '2025/09/01',
  '09/01/2025',
  '01/09/2025',
  'September 1, 2025'
];

formats.forEach(format => {
  try {
    const date = new Date(format);
    console.log(`${format} -> ${date.toISOString().split('T')[0]} (${isNaN(date.getTime()) ? 'INVALID' : 'VALID'})`);
  } catch (e) {
    console.log(`${format} -> ERROR: ${e.message}`);
  }
});

// Test the exact format used in the frontend
console.log('\n--- Testing frontend format ---');
const selectedCheckIn = new Date('2025-09-01');
const formatted = selectedCheckIn.toISOString().split('T')[0];
console.log('Frontend format:', formatted);

// Test parsing this format back
const parsed = new Date(formatted);
console.log('Parsed back:', parsed);
console.log('Valid?', !isNaN(parsed.getTime()));