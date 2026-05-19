const fs = require('fs');
const path = require('path');

const WORDS_DIR = 'C:/Users/z004seap/.gemini/antigravity/scratch/downloads/antigravity/brzokucanje.rs/lib/words';

const latinBanned = /[qwyx]/i;
const allowedChars = /^[a-zšđčćž]+$/i;

// Read all text files from latinica
const latinicaDir = path.join(WORDS_DIR, 'latinica');
let allTexts = [];
fs.readdirSync(latinicaDir).forEach(file => {
  if (file.endsWith('.json')) {
    const data = JSON.parse(fs.readFileSync(path.join(latinicaDir, file), 'utf8'));
    allTexts = allTexts.concat(data);
  }
});

let cleanWords = new Set();
allTexts.forEach(text => {
  const words = text.split(/[\s,.:;?!"'()\[\]\-\–\—\d]+/);
  words.forEach(w => {
    let lower = w.trim().toLowerCase();
    if (lower.length >= 3 && lower.length <= 10 && allowedChars.test(lower) && !latinBanned.test(lower)) {
      cleanWords.add(lower);
    }
  });
});

let wordsArray = Array.from(cleanWords);
// Shuffle words
for (let i = wordsArray.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [wordsArray[i], wordsArray[j]] = [wordsArray[j], wordsArray[i]];
}

// We will replace base.json with these clean words
fs.writeFileSync(path.join(WORDS_DIR, 'base.json'), JSON.stringify(wordsArray, null, 2));

// For the sentences themselves, let's filter out sentences that contain banned words from all text-*.json
function cleanJsonFiles(dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(file => {
    let filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      cleanJsonFiles(filePath);
    } else if (filePath.endsWith('.json')) {
      let data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (Array.isArray(data) && typeof data[0] === 'string') {
        let isCyr = dir.includes('cirilica');
        const cyrBanned = /[a-zA-ZыэъщёйьієїґЫЭЪЩЁЙЬІЄЇҐ]/;
        
        let filtered = data.filter(sentence => {
           const words = sentence.split(/[\s,.:;?!"'()\[\]\-\–\—\d]+/);
           for (let w of words) {
             if (!w.trim()) continue;
             if (isCyr) {
                if (cyrBanned.test(w)) return false;
             } else {
                if (latinBanned.test(w)) return false;
                if (/[а-яА-Я]/.test(w)) return false;
             }
           }
           return true;
        });
        
        fs.writeFileSync(filePath, JSON.stringify(filtered, null, 2));
      }
    }
  });
}

cleanJsonFiles(WORDS_DIR);

console.log("Extracted", wordsArray.length, "clean words to base.json");
console.log("Filtered all sentences.");
