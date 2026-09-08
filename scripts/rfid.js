const fs = require('fs');
let data = fs.readFileSync('database/borrowers.json', 'utf8');
let count = 0;
data = data.replace(/"rfid"\s*:\s*"(\d{9})"/g, (match, p1) => {
	count++;
	return `"rfid": "0${p1}"`;
});
console.log(`RFID 9 digit found and replaced: ${count}`);
fs.writeFileSync('database/borrowers.json', data);