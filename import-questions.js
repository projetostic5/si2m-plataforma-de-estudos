import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const text = fs.readFileSync('./questions_text.txt', 'utf-8');

function parseQuestions(text) {
  const questions = [];
  const lines = text.split('\n');

  let currentQuestion = null;
  let currentSection = 'header';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Detect question start
    const questionMatch = line.match(/^Questão\s+(\d+)/i);
    if (questionMatch) {
      if (currentQuestion && currentQuestion.enunciado) {
        questions.push(currentQuestion);
      }
      currentQuestion = {
        number: parseInt(questionMatch[1]),
        enunciado: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        option_e: '',
        correct_answer: '',
        explanation: '',
        specialty: 'TELEINFECTOLOGIA',
        dimension: '',
        theme: '',
        difficulty: 'medium'
      };
      currentSection = 'enunciado';
      continue;
    }

    if (!currentQuestion) continue;

    // Skip header lines
    if (line.includes('TESTE DE PROFICIÊNCIA') || line.includes('PARTE')) {
      continue;
    }

    // Detect alternatives - looking for patterns like "A)", "A)", etc.
    const altMatch = line.match(/^([A-E])\)\s*(.+)/i);
    if (altMatch) {
      const letter = altMatch[1].toUpperCase();
      const optionText = altMatch[2].trim();
      if (letter === 'A') currentQuestion.option_a = optionText;
      else if (letter === 'B') currentQuestion.option_b = optionText;
      else if (letter === 'C') currentQuestion.option_c = optionText;
      else if (letter === 'D') currentQuestion.option_d = optionText;
      else if (letter === 'E') currentQuestion.option_e = optionText;
      currentSection = 'alternatives';
      continue;
    }

    // Detect gabarito
    if (line.toLowerCase().startsWith('gabarito:')) {
      const gabaritoText = line.substring(9).trim();
      // Extract the letter - look for patterns like "A resposta correta é A" or "B" or "Alternativa B"
      const letterMatch = gabaritoText.match(/\b([A-E])\b/i);
      if (letterMatch) {
        currentQuestion.correct_answer = letterMatch[1].toLowerCase();
      }
      currentSection = 'gabarito';
      continue;
    }

    // Detect justificativa
    if (line.toLowerCase().startsWith('justificativa:')) {
      currentQuestion.explanation = line.substring(13).trim();
      currentSection = 'justificativa';
      continue;
    }

    // Detect METADADOS
    if (line.toUpperCase().includes('METADADOS:')) {
      currentSection = 'metadados';
      continue;
    }

    // Parse metadados section
    if (currentSection === 'metadados') {
      const dimMatch = line.match(/DIMENSÃO:\s*([^O\n]+)/i);
      if (dimMatch) {
        currentQuestion.dimension = dimMatch[1].trim();
      }

      const temaMatch = line.match(/TEMA:\s*([^\n]+)/i);
      if (temaMatch) {
        currentQuestion.theme = temaMatch[1].trim();
      }

      const nivelMatch = line.match(/NÍVEL DE DIFICULDADE:\s*(\d)/i);
      if (nivelMatch) {
        const nivel = parseInt(nivelMatch[1]);
        if (nivel === 1) currentQuestion.difficulty = 'easy';
        else if (nivel === 2) currentQuestion.difficulty = 'medium';
        else if (nivel === 3) currentQuestion.difficulty = 'hard';
      }

      // Also check for OPÇÃO CORRETA in metadados
      const opcaoMatch = line.match(/OPÇÃO CORRETA:\s*([A-E])/i);
      if (opcaoMatch && !currentQuestion.correct_answer) {
        currentQuestion.correct_answer = opcaoMatch[1].toLowerCase();
      }
      continue;
    }

    // Continue building enunciado or explanation
    if (currentSection === 'enunciado' && !currentQuestion.option_a) {
      currentQuestion.enunciado += (currentQuestion.enunciado ? ' ' : '') + line;
    } else if (currentSection === 'justificativa') {
      currentQuestion.explanation += ' ' + line;
    }
  }

  // Push the last question
  if (currentQuestion && currentQuestion.enunciado) {
    questions.push(currentQuestion);
  }

  return questions;
}

async function importQuestions() {
  console.log('Parsing questions...');
  const parsedQuestions = parseQuestions(text);
  console.log(`Found ${parsedQuestions.length} questions`);

  // Get or create TELEINFECTOLOGIA discipline
  let { data: discipline } = await supabase
    .from('disciplines')
    .select('id')
    .eq('name', 'TELEINFECTOLOGIA')
    .maybeSingle();

  if (!discipline) {
    const { data: newDiscipline } = await supabase
      .from('disciplines')
      .insert({ name: 'TELEINFECTOLOGIA', color: '#10b981' })
      .select()
      .single();
    discipline = newDiscipline;
  }

  console.log('Discipline:', discipline.id);

  // Get admin user for created_by
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const adminUser = users.find(u => u.email === 'projetostic5@gmail.com');

  if (!adminUser) {
    console.error('Admin user not found');
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  for (const q of parsedQuestions) {
    try {
      // Find or create dimension
      let { data: dimension } = await supabase
        .from('dimensions')
        .select('id')
        .eq('discipline_id', discipline.id)
        .eq('name', q.dimension)
        .maybeSingle();

      if (!dimension && q.dimension) {
        const { data: newDimension } = await supabase
          .from('dimensions')
          .insert({ discipline_id: discipline.id, name: q.dimension })
          .select()
          .single();
        dimension = newDimension;
      }

      // Find or create theme
      let { data: theme } = await supabase
        .from('themes')
        .select('id')
        .eq('dimension_id', dimension?.id)
        .eq('name', q.theme)
        .maybeSingle();

      if (!theme && q.theme && dimension) {
        const { data: newTheme } = await supabase
          .from('themes')
          .insert({ dimension_id: dimension.id, name: q.theme })
          .select()
          .single();
        theme = newTheme;
      }

      // Insert question
      const { error } = await supabase.from('questions').insert({
        discipline_id: discipline.id,
        dimension_id: dimension?.id,
        theme_id: theme?.id,
        question_text: q.enunciado.trim(),
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        option_e: q.option_e || null,
        correct_answer: q.correct_answer,
        explanation: q.explanation.trim(),
        difficulty: q.difficulty,
        specialty: q.specialty,
        created_by: adminUser.id,
      });

      if (error) {
        console.error(`Error on question ${q.number}:`, error.message);
        errorCount++;
      } else {
        successCount++;
        if (successCount % 10 === 0) {
          console.log(`Imported ${successCount} questions...`);
        }
      }
    } catch (err) {
      console.error(`Error on question ${q.number}:`, err.message);
      errorCount++;
    }
  }

  console.log(`\nImport complete: ${successCount} success, ${errorCount} errors`);
}

importQuestions();
