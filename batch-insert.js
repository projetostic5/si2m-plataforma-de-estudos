import fs from 'fs';

const questions = JSON.parse(fs.readFileSync('./parsed-questions.json', 'utf-8'));
const disciplineId = 'f3965736-aa39-43dd-8b6a-b2076ac4c596';
const adminId = 'd3f43101-e5f2-408d-bdca-330d7eafb5ac';

// Dimension IDs
const dimensionIds = {
  'Conhecimento Clínico e Saúde Digital': 'e9fd508c-7156-45c4-abe5-5832a4f4429f',
  'Gestão e Saúde Coletiva': '4b16ca37-05d4-4b1a-999e-353e16fa8574',
  'Smart Skills e Saúde Coletiva': 'c40a3986-7111-474d-8acd-9d4379adf679'
};

// Filter valid questions
const validQuestions = questions.filter(q => q.enunciado && q.option_a && q.option_b && q.option_c && q.option_d);

// Normalize dimension name
const normalizeDimension = (dim) => {
  if (!dim) return null;
  if (dim.includes('Gestão e Saúde Coletiv')) return 'Gestão e Saúde Coletiva';
  return dim;
};

// Generate batch insert SQL
console.log('-- Insert questions');
let count = 0;

validQuestions.forEach((q, i) => {
  const dimensionId = dimensionIds[normalizeDimension(q.dimension)];
  if (!dimensionId) return;

  const escapeSQL = (str) => {
    if (!str) return 'NULL';
    return `'${str.replace(/'/g, "''").replace(/\n/g, ' ').replace(/\r/g, '')}'`;
  };

  const enunciado = escapeSQL(q.enunciado);
  const optionA = escapeSQL(q.option_a);
  const optionB = escapeSQL(q.option_b);
  const optionC = escapeSQL(q.option_c);
  const optionD = escapeSQL(q.option_d);
  const optionE = q.option_e ? escapeSQL(q.option_e) : 'NULL';
  const correctAnswer = `'${q.correct_answer}'`;
  const explanation = escapeSQL((q.explanation || '').replace(/^:\s*/, ''));
  const difficulty = `'${q.difficulty}'`;

  console.log(`INSERT INTO questions (discipline_id, dimension_id, question_text, option_a, option_b, option_c, option_d, option_e, correct_answer, explanation, difficulty, specialty, created_by) VALUES ('${disciplineId}', '${dimensionId}', ${enunciado}, ${optionA}, ${optionB}, ${optionC}, ${optionD}, ${optionE}, ${correctAnswer}, ${explanation}, ${difficulty}, 'TELEINFECTOLOGIA', '${adminId}');`);
  count++;
});

console.log(`\n-- Total: ${count} questions`);
