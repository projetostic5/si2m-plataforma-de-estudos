// This script outputs parsed questions as JSON for import via MCP tools
import fs from 'fs';

const text = fs.readFileSync('/tmp/cc-agent/67223982/project/questions_text.txt', 'utf-8');

function parseQuestions(text) {
  const questions = [];
  const lines = text.split('\n');

  let currentQuestion = null;
  let currentSection = 'header';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Question start can be "Questão 1" followed by text on same line or next line
    const questionMatch = line.match(/^Questão\s+(\d+)\s*(.*)/i);
    if (questionMatch) {
      if (currentQuestion && currentQuestion.enunciado) {
        questions.push(currentQuestion);
      }
      const questionText = questionMatch[2].trim();
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

      // Check if question text has inline alternatives
      if (questionText && /A\)/.test(questionText) && /B\)/.test(questionText)) {
        // Split on each alternative marker
        const parts = questionText.split(/([A-E]\))/);

        let enunciadoParts = [];
        let currentAlt = null;

        for (let k = 0; k < parts.length; k++) {
          const part = parts[k];
          const trimmedPart = part.trim();
          if (!trimmedPart) continue;

          if (/^[A-E]\)$/.test(part)) {
            currentAlt = part[0]; // Get just the letter
          } else if (currentAlt) {
            // This is the text for the current alternative
            const text = trimmedPart;
            if (currentAlt === 'A') currentQuestion.option_a = text;
            else if (currentAlt === 'B') currentQuestion.option_b = text;
            else if (currentAlt === 'C') currentQuestion.option_c = text;
            else if (currentAlt === 'D') currentQuestion.option_d = text;
            else if (currentAlt === 'E') currentQuestion.option_e = text;
            currentAlt = null;
          } else if (!currentQuestion.option_a) {
            // Part of enunciado
            enunciadoParts.push(trimmedPart);
          }
        }

        currentQuestion.enunciado = enunciadoParts.join(' ').trim();
        currentSection = 'alternatives';
      } else {
        currentQuestion.enunciado = questionText;
        currentSection = 'enunciado';
      }
      continue;
    }

    if (!currentQuestion) continue;

    if (line.includes('TESTE DE PROFICIÊNCIA') || line.includes('PARTE')) {
      continue;
    }

    // Check if line has inline alternatives (for questions 11+)
    // Pattern: "Qual a conduta?A) Option A textB) Option B text..."
    if (currentSection === 'enunciado' && /A\)/.test(line) && /B\)/.test(line)) {
      // Split on each alternative marker
      const parts = line.split(/([A-E]\))/);

      let enunciadoParts = [];
      let currentAlt = null;

      for (let k = 0; k < parts.length; k++) {
        const part = parts[k];
        const trimmedPart = part.trim();
        if (!trimmedPart) continue;

        // Check if this part is a marker like "A)" or "B)"
        if (/^[A-E]\)$/.test(part)) {
          currentAlt = part[0]; // Get the letter
        } else if (currentAlt) {
          // This is the text for the current alternative
          if (currentAlt === 'A') currentQuestion.option_a = trimmedPart;
          else if (currentAlt === 'B') currentQuestion.option_b = trimmedPart;
          else if (currentAlt === 'C') currentQuestion.option_c = trimmedPart;
          else if (currentAlt === 'D') currentQuestion.option_d = trimmedPart;
          else if (currentAlt === 'E') currentQuestion.option_e = trimmedPart;
          currentAlt = null;
        } else if (!currentQuestion.option_a) {
          // Part of enunciado
          enunciadoParts.push(trimmedPart);
        }
      }

      currentQuestion.enunciado += (currentQuestion.enunciado ? ' ' : '') + enunciadoParts.join(' ').trim();
      currentSection = 'alternatives';
      continue;
    }

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

    if (line.toLowerCase().startsWith('gabarito:')) {
      const gabaritoText = line.substring(9).trim();
      const letterMatch = gabaritoText.match(/\b([A-E])\b/i);
      if (letterMatch) {
        currentQuestion.correct_answer = letterMatch[1].toLowerCase();
      }
      currentSection = 'gabarito';
      continue;
    }

    if (line.toLowerCase().startsWith('justificativa:')) {
      currentQuestion.explanation = line.substring(13).trim();
      currentSection = 'justificativa';
      continue;
    }

    if (line.toUpperCase().includes('METADADOS:')) {
      // Parse metadados - can span multiple lines or be on one line
      // Collect all metadata lines
      let metadataLine = line;
      let j = i + 1;
      while (j < lines.length && !lines[j].match(/^Questão\s+\d+/i) && !lines[j].includes('Gabarito')) {
        if (lines[j].trim()) {
          metadataLine += ' ' + lines[j].trim();
        }
        j++;
      }

      // DIMENSÃO - find content between "DIMENSÃO:" and "OPÇÃO CORRETA:" or end
      const dimMatch = metadataLine.match(/DIMENSÃO:\s*(.+?)(?=OPÇÃO\s*CORRETA|TEMA|NÍVEL|$)/i);
      if (dimMatch) {
        currentQuestion.dimension = dimMatch[1].trim();
      }

      // TEMA - find content between "TEMA:" and "NÍVEL DE DIFICULDADE:" or end
      const temaMatch = metadataLine.match(/TEMA:\s*(.+?)(?=NÍVEL\s*DE\s*DIFICULDADE|$)/i);
      if (temaMatch) {
        currentQuestion.theme = temaMatch[1].trim();
      }

      const nivelMatch = metadataLine.match(/NÍVEL DE DIFICULDADE:\s*(\d)/i);
      if (nivelMatch) {
        const nivel = parseInt(nivelMatch[1]);
        if (nivel === 1) currentQuestion.difficulty = 'easy';
        else if (nivel === 2) currentQuestion.difficulty = 'medium';
        else if (nivel === 3) currentQuestion.difficulty = 'hard';
      }

      const opcaoMatch = metadataLine.match(/OPÇÃO CORRETA:\s*([A-E])/i);
      if (opcaoMatch && !currentQuestion.correct_answer) {
        currentQuestion.correct_answer = opcaoMatch[1].toLowerCase();
      }

      currentSection = 'metadados';
      continue;
    }


    if (currentSection === 'enunciado' && !currentQuestion.option_a) {
      currentQuestion.enunciado += (currentQuestion.enunciado ? ' ' : '') + line;
    } else if (currentSection === 'justificativa') {
      currentQuestion.explanation += ' ' + line;
    }
  }

  if (currentQuestion && currentQuestion.enunciado) {
    questions.push(currentQuestion);
  }

  return questions;
}

const questions = parseQuestions(text);
console.log(JSON.stringify(questions, null, 2));
