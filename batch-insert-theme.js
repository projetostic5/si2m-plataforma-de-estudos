import fs from 'fs';

const questions = JSON.parse(fs.readFileSync('./parsed-questions.json', 'utf-8'));
const disciplineId = 'f3965736-aa39-43dd-8b6a-b2076ac4c596';
const adminId = 'd3f43101-e5f2-408d-bdca-330d7eafb5ac';

// Dimension and Theme IDs
const dimensionThemeIds = {
  'Conhecimento Clínico e Saúde Digital': {
    dimension: 'e9fd508c-7156-45c4-abe5-5832a4f4429f',
    theme: '61dc1309-2165-4126-b929-3a2142a23e55'
  },
  'Gestão e Saúde Coletiva': {
    dimension: '4b16ca37-05d4-4b1a-999e-353e16fa8574',
    theme: '3e4ae507-eca6-45a2-9396-066f2cc489fe'
  },
  'Smart Skills e Saúde Coletiva': {
    dimension: 'c40a3986-7111-474d-8acd-9d4379adf679',
    theme: 'd218fe26-6f43-4962-8b1d-8a049dcb0102'
  }
};

// Filter valid questions
const validQuestions = questions.filter(q => q.enunciado && q.option_a && q.option_b && q.option_c && q.option_d);

// Normalize dimension name
const normalizeDimension = (dim) => {
  if (!dim) return null;
  if (dim.includes('Gestão e Saúde Coletiv')) return 'Gestão e Saúde Coletiva';
  return dim;
};

const escapeSQL = (str) => {
  if (!str) return 'NULL';
  return `'${str.replace(/'/g, "''").replace(/\n/g, ' ').replace(/\r/g, '')}'`;
};

// Generate batch insert SQL with batches of 10 to avoid too large queries
const batchSize = 10;
let count = 0;

for (let i = 0; i < validQuestions.length; i += batchSize) {
  const batch = validQuestions.slice(i, i + batchSize);
  const values = batch.map(q => {
    const ids = dimensionThemeIds[normalizeDimension(q.dimension)];
    if (!ids) return null;

    const enunciado = escapeSQL(q.enunciado);
    const optionA = escapeSQL(q.option_a);
    const optionB = escapeSQL(q.option_b);
    const optionC = escapeSQL(q.option_c);
    const optionD = escapeSQL(q.option_d);
    const optionE = q.option_e ? escapeSQL(q.option_e) : 'NULL';
    const correctAnswer = `'${q.correct_answer}'`;
    const explanation = escapeSQL((q.explanation || '').replace(/^:\s*/, ''));
    const difficulty = `'${q.difficulty}'`;

    return `('${disciplineId}', '${ids.dimension}', '${ids.theme}', ${enunciado}, ${optionA}, ${optionB}, ${optionC}, ${optionD}, ${optionE}, ${correctAnswer}, ${explanation}, ${difficulty}, 'TELEINFECTOLOGIA', '${adminId}')`;
  }).filter(Boolean);

  if (values.length > 0) {
    console.log(`INSERT INTO questions (discipline_id, dimension_id, theme_id, question_text, option_a, option_b, option_c, option_d, option_e, correct_answer, explanation, difficulty, specialty, created_by) VALUES`);
    console.log(values.join(',\n') + ';');
    console.log('');
    count += values.length;
  }
}

console.log(`-- Total: ${count} questions`);
