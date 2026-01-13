// Simple test script to verify file upload functionality
const fs = require('fs');
const path = require('path');

// Create a simple test image file (1x1 pixel PNG)
const testImageData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

const testImagePath = path.join(__dirname, 'test-image.png');
fs.writeFileSync(testImagePath, testImageData);

console.log('Test image created at:', testImagePath);
console.log('You can now test uploading this file through the admin interface.');
console.log('After testing, you can delete this file with: rm', testImagePath);