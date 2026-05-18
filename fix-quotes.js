const fs = require('fs');
let html = fs.readFileSync('quiz-game.html', 'utf8');

const scriptMatch = html.match(/(<script>)([\s\S]*?)(<\/script>)/);
if (!scriptMatch) { console.log('No script'); process.exit(1); }

let script = scriptMatch[2];

// Fix: escape inner ASCII double quotes inside exp: and q: strings
// Strategy: for each line containing exp: or q:,
//   find the string value and replace inner " with 「/」 pairs
const lines = script.split('\n');
const fixed = lines.map(line => {
  // Match lines like:     exp: "...",
  // or:     q: "...",
  const m = line.match(/^(\s*)(exp|q):\s*"(.*)",?\s*$/);
  if (!m) return line;

  const prefix = m[1];
  const key = m[2];
  let value = m[3];

  // Count inner ASCII double quotes
  const innerQuotes = value.match(/"/g);
  if (!innerQuotes || innerQuotes.length === 0) return line;

  // Even number of inner quotes = pairs of Chinese-style quoting
  if (innerQuotes.length % 2 !== 0) return line; // odd, something weird, skip

  // Replace pairs of inner " with 「」
  let count = 0;
  value = value.replace(/"/g, () => {
    count++;
    return count % 2 === 1 ? '「' : '」';
  });

  return `${prefix}${key}: "${value}",`;
});

script = fixed.join('\n');

// Verify
try {
  new Function(script);
  console.log('JavaScript is now valid!');
} catch(e) {
  // Find the problematic line
  const errLine = e.stack.match(/:(\d+):/);
  if (errLine) {
    console.log('Error at line', errLine[1], ':', e.message);
    console.log('  ->', lines[parseInt(errLine[1]) - 1]?.trim().substring(0, 150));
  } else {
    console.log('Still has error:', e.message);
  }
}

html = scriptMatch[1] + '\n' + script + '\n' + scriptMatch[3];
fs.writeFileSync('quiz-game.html', html, 'utf8');
fs.writeFileSync('index.html', html, 'utf8');
console.log('Files updated.');
