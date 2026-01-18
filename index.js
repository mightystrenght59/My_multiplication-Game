// Clean, DOM-ready game logic (Addition, Multiplication, Subtraction, Division)

(() => {
  'use strict';

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  function playTune(sequence, type = 'sine', volume = 0.12) {
    if (!Array.isArray(sequence) || sequence.length === 0) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    let t = now;
    sequence.forEach(({ freq, dur, gain = volume }) => {
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur - 0.01);
      osc.connect(g);
      g.connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + dur);
      t += dur;
    });
  }

  const successTune = [
    { freq: 660, dur: 0.12 },
    { freq: 792, dur: 0.12 },
    { freq: 990, dur: 0.22 }
  ];

  const failTune = [
    { freq: 440, dur: 0.14 },
    { freq: 392, dur: 0.18 },
    { freq: 330, dur: 0.22 }
  ];

  // Wait for DOM
  document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const operatorButtons = document.querySelectorAll('.operator-btn');
    const problemEl = document.getElementById('problem');
    const answerInput = document.getElementById('answer-input');
    const submitBtn = document.getElementById('submit-btn');
    const feedbackView = document.getElementById('feedback-view');
    const questionView = document.getElementById('question-view');
    const feedbackEmoji = document.getElementById('feedback-emoji');
    const feedbackMsg = document.getElementById('feedback-msg');
    const correctAnswerDisplay = document.getElementById('correct-answer-display');
    const nextBtn = document.getElementById('next-btn');
    const historyList = document.getElementById('history-list');
    const scoreCorrectEl = document.getElementById('score-correct');
    const scoreIncorrectEl = document.getElementById('score-incorrect');

    // State (keeps scores & history across operator switches)
    const state = {
      operator: 'add', // default
      current: { a: 0, b: 0, answer: null, text: '—' },
      scores: { correct: 0, incorrect: 0 },
      history: [] // { op, opSymbol, problem, userAnswer, correct, answer, ts }
    };

    function opLabel(op) {
      if (op === 'add') return '+';
      if (op === 'multiply') return '×';
      if (op === 'subtract') return '−';
      if (op === 'divide') return '÷';
      return '?';
    }

    function randInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function generateQuestion(op) {
      let a = 0, b = 0, answer = null, text = '—';
      if (op === 'add') {
        a = randInt(1, 20);
        b = randInt(1, 20);
        answer = a + b;
        text = `${a} + ${b}`;
      } else if (op === 'multiply') {
        a = randInt(1, 12);
        b = randInt(1, 12);
        answer = a * b;
        text = `${a} × ${b}`;
      } else if (op === 'subtract') {
        a = randInt(5, 20);
        b = randInt(1, a - 1);
        answer = a - b;
        text = `${a} − ${b}`;
      } else if (op === 'divide') {
        b = randInt(1, 12);
        const quotient = randInt(1, 12);
        a = b * quotient;
        answer = quotient; // show quotient as correct answer
        text = `${a} ÷ ${b}`;
      } else {
        a = randInt(1, 20);
        b = randInt(1, 20);
        answer = a + b;
        text = `${a} + ${b}`;
      }
      state.current = { a, b, answer, text, op };
      renderProblem();
    }

    function renderProblem() {
      problemEl.textContent = state.current.text;
      answerInput.value = '';
      answerInput.focus();
    }

    function setOperator(op) {
      state.operator = op;
      operatorButtons.forEach(btn => {
        const is = btn.dataset.op === op;
        btn.setAttribute('aria-pressed', String(is));
        if (is) {
          btn.classList.remove('bg-gray-800', 'text-gray-300');
          btn.classList.add('bg-blue-600', 'text-white');
        } else {
          btn.classList.remove('bg-blue-600', 'text-white');
          btn.classList.add('bg-gray-800', 'text-gray-300');
        }
      });
      generateQuestion(op);
    }

    function updateScores() {
      scoreCorrectEl.textContent = state.scores.correct;
      scoreIncorrectEl.textContent = state.scores.incorrect;
    }

    function renderHistory() {
      historyList.innerHTML = '';
      if (state.history.length === 0) {
        const div = document.createElement('div');
        div.className = 'text-gray-500 italic text-sm';
        div.textContent = 'No answers yet...';
        historyList.appendChild(div);
        return;
      }
      state.history.slice(0, 20).forEach(entry => {
        const item = document.createElement('div');
        item.className = 'flex justify-between items-center py-1';
        const left = document.createElement('div');
        left.className = 'flex items-baseline gap-2';
        const opTag = document.createElement('span');
        opTag.className = 'px-2 py-1 rounded-md bg-gray-800 text-xs text-gray-300';
        opTag.textContent = entry.opSymbol;
        const prob = document.createElement('span');
        prob.className = 'text-sm';
        prob.textContent = `${entry.problem} = ${entry.answer}`;
        left.appendChild(opTag);
        left.appendChild(prob);

        const right = document.createElement('div');
        right.className = 'text-sm font-medium';
        right.textContent = entry.correct ? `✔ ${entry.userAnswer}` : `✖ ${entry.userAnswer}`;
        if (!entry.correct) right.classList.add('text-red-400'); else right.classList.add('text-green-400');

        item.appendChild(left);
        item.appendChild(right);
        historyList.appendChild(item);
      });
    }

    function submitAnswer() {
      const raw = answerInput.value.trim();
      if (raw === '') return;
      const userVal = Number(raw);
      const correct = userVal === state.current.answer;
      if (correct) {
        state.scores.correct += 1;
        feedbackEmoji.textContent = '🎉';
        feedbackMsg.textContent = 'CORRECT!';
        feedbackMsg.classList.remove('text-red-400');
        feedbackMsg.classList.add('text-green-400');
        playTune(successTune, 'sine', 0.12);
      } else {
        state.scores.incorrect += 1;
        feedbackEmoji.textContent = '😬';
        feedbackMsg.textContent = 'NOT QUITE';
        feedbackMsg.classList.remove('text-green-400');
        feedbackMsg.classList.add('text-red-400');
        playTune(failTune, 'sawtooth', 0.10);
      }

      correctAnswerDisplay.textContent = `${state.current.text} = ${state.current.answer}`;
      state.history.unshift({
        op: state.operator,
        opSymbol: opLabel(state.operator),
        problem: state.current.text,
        userAnswer: userVal,
        correct,
        answer: state.current.answer,
        ts: Date.now()
      });
      updateScores();
      renderHistory();

      questionView.classList.add('hidden');
      feedbackView.classList.remove('hidden');
    }

    // Events
    operatorButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const op = btn.dataset.op;
        setOperator(op);
      });
    });

    submitBtn.addEventListener('click', submitAnswer);
    answerInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitAnswer();
    });

    nextBtn.addEventListener('click', () => {
      feedbackView.classList.add('hidden');
      questionView.classList.remove('hidden');
      generateQuestion(state.operator);
    });

    // initial render
    setOperator(state.operator);
    updateScores();
    renderHistory();
  });
})();
```// filepath: c:\Users\User\OneDrive\Desktop\My Webdev Projects\index.js
// Clean, DOM-ready game logic (Addition, Multiplication, Subtraction, Division)

(() => {
  'use strict';

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  function playTune(sequence, type = 'sine', volume = 0.12) {
    if (!Array.isArray(sequence) || sequence.length === 0) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    let t = now;
    sequence.forEach(({ freq, dur, gain = volume }) => {
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur - 0.01);
      osc.connect(g);
      g.connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + dur);
      t += dur;
    });
  }

  const successTune = [
    { freq: 660, dur: 0.12 },
    { freq: 792, dur: 0.12 },
    { freq: 990, dur: 0.22 }
  ];

  const failTune = [
    { freq: 440, dur: 0.14 },
    { freq: 392, dur: 0.18 },
    { freq: 330, dur: 0.22 }
  ];

  // Wait for DOM
  document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const operatorButtons = document.querySelectorAll('.operator-btn');
    const problemEl = document.getElementById('problem');
    const answerInput = document.getElementById('answer-input');
    const submitBtn = document.getElementById('submit-btn');
    const feedbackView = document.getElementById('feedback-view');
    const questionView = document.getElementById('question-view');
    const feedbackEmoji = document.getElementById('feedback-emoji');
    const feedbackMsg = document.getElementById('feedback-msg');
    const correctAnswerDisplay = document.getElementById('correct-answer-display');
    const nextBtn = document.getElementById('next-btn');
    const historyList = document.getElementById('history-list');
    const scoreCorrectEl = document.getElementById('score-correct');
    const scoreIncorrectEl = document.getElementById('score-incorrect');

    // State (keeps scores & history across operator switches)
    const state = {
      operator: 'add', // default
      current: { a: 0, b: 0, answer: null, text: '—' },
      scores: { correct: 0, incorrect: 0 },
      history: [] // { op, opSymbol, problem, userAnswer, correct, answer, ts }
    };

    function opLabel(op) {
      if (op === 'add') return '+';
      if (op === 'multiply') return '×';
      if (op === 'subtract') return '−';
      if (op === 'divide') return '÷';
      return '?';
    }

    function randInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function generateQuestion(op) {
      let a = 0, b = 0, answer = null, text = '—';
      if (op === 'add') {
        a = randInt(1, 20);
        b = randInt(1, 20);
        answer = a + b;
        text = `${a} + ${b}`;
      } else if (op === 'multiply') {
        a = randInt(1, 12);
        b = randInt(1, 12);
        answer = a * b;
        text = `${a} × ${b}`;
      } else if (op === 'subtract') {
        a = randInt(5, 20);
        b = randInt(1, a - 1);
        answer = a - b;
        text = `${a} − ${b}`;
      } else if (op === 'divide') {
        b = randInt(1, 12);
        const quotient = randInt(1, 12);
        a = b * quotient;
        answer = quotient; // show quotient as correct answer
        text = `${a} ÷ ${b}`;
      } else {
        a = randInt(1, 20);
        b = randInt(1, 20);
        answer = a + b;
        text = `${a} + ${b}`;
      }
      state.current = { a, b, answer, text, op };
      renderProblem();
    }

    function renderProblem() {
      problemEl.textContent = state.current.text;
      answerInput.value = '';
      answerInput.focus();
    }

    function setOperator(op) {
      state.operator = op;
      operatorButtons.forEach(btn => {
        const is = btn.dataset.op === op;
        btn.setAttribute('aria-pressed', String(is));
        if (is) {
          btn.classList.remove('bg-gray-800', 'text-gray-300');
          btn.classList.add('bg-blue-600', 'text-white');
        } else {
          btn.classList.remove('bg-blue-600', 'text-white');
          btn.classList.add('bg-gray-800', 'text-gray-300');
        }
      });
      generateQuestion(op);
    }

    function updateScores() {
      scoreCorrectEl.textContent = state.scores.correct;
      scoreIncorrectEl.textContent = state.scores.incorrect;
    }

    function renderHistory() {
      historyList.innerHTML = '';
      if (state.history.length === 0) {
        const div = document.createElement('div');
        div.className = 'text-gray-500 italic text-sm';
        div.textContent = 'No answers yet...';
        historyList.appendChild(div);
        return;
      }
      state.history.slice(0, 20).forEach(entry => {
        const item = document.createElement('div');
        item.className = 'flex justify-between items-center py-1';
        const left = document.createElement('div');
        left.className = 'flex items-baseline gap-2';
        const opTag = document.createElement('span');
        opTag.className = 'px-2 py-1 rounded-md bg-gray-800 text-xs text-gray-300';
        opTag.textContent = entry.opSymbol;
        const prob = document.createElement('span');
        prob.className = 'text-sm';
        prob.textContent = `${entry.problem} = ${entry.answer}`;
        left.appendChild(opTag);
        left.appendChild(prob);

        const right = document.createElement('div');
        right.className = 'text-sm font-medium';
        right.textContent = entry.correct ? `✔ ${entry.userAnswer}` : `✖ ${entry.userAnswer}`;
        if (!entry.correct) right.classList.add('text-red-400'); else right.classList.add('text-green-400');

        item.appendChild(left);
        item.appendChild(right);
        historyList.appendChild(item);
      });
    }

    function submitAnswer() {
      const raw = answerInput.value.trim();
      if (raw === '') return;
      const userVal = Number(raw);
      const correct = userVal === state.current.answer;
      if (correct) {
        state.scores.correct += 1;
        feedbackEmoji.textContent = '🎉';
        feedbackMsg.textContent = 'CORRECT!';
        feedbackMsg.classList.remove('text-red-400');
        feedbackMsg.classList.add('text-green-400');
        playTune(successTune, 'sine', 0.12);
      } else {
        state.scores.incorrect += 1;
        feedbackEmoji.textContent = '😬';
        feedbackMsg.textContent = 'NOT QUITE';
        feedbackMsg.classList.remove('text-green-400');
        feedbackMsg.classList.add('text-red-400');
        playTune(failTune, 'sawtooth', 0.10);
      }

      correctAnswerDisplay.textContent = `${state.current.text} = ${state.current.answer}`;
      state.history.unshift({
        op: state.operator,
        opSymbol: opLabel(state.operator),
        problem: state.current.text,
        userAnswer: userVal,
        correct,
        answer: state.current.answer,
        ts: Date.now()
      });
      updateScores();
      renderHistory();

      questionView.classList.add('hidden');
      feedbackView.classList.remove('hidden');
    }

    // Events
    operatorButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const op = btn.dataset.op;
        setOperator(op);
      });
    });

    submitBtn.addEventListener('click', submitAnswer);
    answerInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitAnswer();
    });

    nextBtn.addEventListener('click', () => {
      feedbackView.classList.add('hidden');
      questionView.classList.remove('hidden');
      generateQuestion(state.operator);
    });

    // initial
