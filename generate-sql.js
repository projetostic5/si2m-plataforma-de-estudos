const fs = require('fs');

const questions = JSON.parse(fs.readFileSync('./parsed-questions.json', 'utf-8'));
const disciplineId = 'f3965736-aa39-43dd-8b6a-b2076ac4c596';
const adminId = 'd3f43101-e5f2-408d-bdca-330d7eafb5ac';

// Get unique dimensions and themes
const dimensionsMap = new Map();
const themesMap = new Map();

questions.forEach(q => {
  if (q.dimension && !dimensionsMap.has(q.dimension)) {
    dimensionsMap.set(q.dimension, { name: q.dimension, themes: new Set() });
  }
  if (q.dimension && q.theme) {
    dimensionsMap.get(q.dimension)?.themes.add(q.theme);
  }
});

// Generate SQL
console.log('-- Create dimensions');
let dimCounter = 1;
dimensionsMap.forEach((dim, name) => {
  const cleanName = name.replace(/'/g, "''");
  console.log(`INSERT INTO dimensions (id, discipline_id, name) VALUES (gen_random_uuid(), '${disciplineId}', '${cleanName}') ON CONFLICT DO NOTHING;`);
});

console.log('\n-- Get dimension IDs');
dimensionsMap.forEach((dim, name) => {
  const cleanName = name.replace(/'/g, "''");
  console.log(`-- Dimension: ${name}`);
});

console.log('\n-- Create themes');
// We need to insert themes after dimensions, then insert questions
// This is complex, so let's output a more complete script
