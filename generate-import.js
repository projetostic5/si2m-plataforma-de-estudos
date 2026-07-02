import fs from 'fs';

const questions = JSON.parse(fs.readFileSync('./parsed-questions.json', 'utf-8'));
const disciplineId = 'f3965736-aa39-43dd-8b6a-b2076ac4c596';
const adminId = 'd3f43101-e5f2-408d-bdca-330d7eafb5ac';

// Filter valid questions (have options and enunciado)
const validQuestions = questions.filter(q => q.enunciado && q.option_a && q.option_b && q.option_c && q.option_d);
console.log(`Valid questions: ${validQuestions.length} out of ${questions.length}`);

// Get unique dimensions
const dimensions = [...new Set(validQuestions.map(q => q.dimension).filter(Boolean))];
console.log('Dimensions:', dimensions.join(', '));

// Output JSON with IDs for the SQL generator
const output = {
  disciplineId,
  adminId,
  dimensions: dimensions.map(name => ({ name })),
  questions: validQuestions
};

fs.writeFileSync('./import-data.json', JSON.stringify(output, null, 2));
console.log('Written import-data.json');
