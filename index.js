   const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        const state = {
            num1: 0,
            num2: 0,
            correct: 0,
            incorrect: 0,
            history: []
        };

        const elements = {
            problem: document.getElementById('problem'),
            input: document.getElementById('answer-input'),
            submitBtn: document.getElementById('submit-btn'),
            nextBtn: document.getElementById('next-btn'),
            qView: document.getElementById('question-view'),
            fView: document.getElementById('feedback-view'),
            scoreCorrect: document.getElementById('score-correct'),
            scoreIncorrect: document.getElementById('score-incorrect'),
            feedbackEmoji: document.getElementById('feedback-emoji'),
            feedbackMsg: document.getElementById('feedback-msg'),
            ansDisplay: document.getElementById('correct-answer-display'),
            container: document.getElementById('game-container'),
            historyList: document.getElementById('history-list')
        };

        // Synthesized Sound Effects
        function playSound(type) {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            if (type === 'correct') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
                osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.3);
            } else {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(110, audioCtx.currentTime); // A2
                osc.frequency.linearRampToValueAtTime(55, audioCtx.currentTime + 0.2);
                gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.4);
            }
        }

        function generateProblem() {
            state.num1 = Math.floor(Math.random() * 11) + 2; 
            state.num2 = Math.floor(Math.random() * 11) + 2; 
            elements.problem.innerText = `${state.num1} × ${state.num2}`;
            elements.input.value = '';
            elements.input.focus();
        }

        function updateHistory(n1, n2, userAns, correctAns, isCorrect) {
            const item = document.createElement('div');
            item.className = `p-2 rounded flex justify-between items-center text-sm font-bold ${isCorrect ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`;
            item.innerHTML = `
                <span>${n1} × ${n2} = ${userAns}</span>
                <span>${isCorrect ? '✓' : '✗ (Correct: ' + correctAns + ')'}</span>
            `;
            
            if (state.history.length === 0) elements.historyList.innerHTML = '';
            elements.historyList.prepend(item);
            state.history.push({n1, n2, userAns, isCorrect});
        }

        function checkAnswer() {
            const userAnswer = parseInt(elements.input.value);
            const correctAnswer = state.num1 * state.num2;

            if (isNaN(userAnswer)) return;

            // Ensure AudioContext is resumed (browser security requirement)
            if (audioCtx.state === 'suspended') audioCtx.resume();

            elements.qView.classList.add('hidden');
            elements.fView.classList.remove('hidden');
            elements.ansDisplay.innerText = `${state.num1} × ${state.num2} = ${correctAnswer}`;

            if (userAnswer === correctAnswer) {
                state.correct++;
                elements.scoreCorrect.innerText = state.correct;
                elements.feedbackEmoji.innerText = '🌟';
                elements.feedbackMsg.innerText = 'AWESOME!';
                elements.feedbackMsg.className = 'text-3xl font-bold mb-2 text-green-400 celebrate';
                elements.container.style.borderColor = '#4ecca3';
                playSound('correct');
                updateHistory(state.num1, state.num2, userAnswer, correctAnswer, true);
            } else {
                state.incorrect++;
                elements.scoreIncorrect.innerText = state.incorrect;
                elements.feedbackEmoji.innerText = '❌';
                elements.feedbackMsg.innerText = 'OOPS!';
                elements.feedbackMsg.className = 'text-3xl font-bold mb-2 text-red-400 shake';
                elements.container.style.borderColor = '#e94560';
                playSound('wrong');
                updateHistory(state.num1, state.num2, userAnswer, correctAnswer, false);
            }
        }

        function nextRound() {
            elements.fView.classList.add('hidden');
            elements.qView.classList.remove('hidden');
            elements.container.style.borderColor = '#0f3460';
            generateProblem();
        }

        elements.submitBtn.onclick = checkAnswer;
        elements.nextBtn.onclick = nextRound;

        elements.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') checkAnswer();
        });

        window.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !elements.fView.classList.contains('hidden')) {
                nextRound();
            }
        });

        window.onload = generateProblem;
