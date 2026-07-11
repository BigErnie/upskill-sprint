function safeNumber(id) {
  const value = Number(document.getElementById(id).value);
  return Number.isFinite(value) ? value : null;
}

function interpretTest() {
  const p = safeNumber('pValue');
  const alpha = safeNumber('alphaValue');
  const difference = safeNumber('observedDifference');
  const threshold = safeNumber('practicalThreshold');
  const panel = document.getElementById('decisionResult');

  if (p === null || p < 0 || p > 1 || alpha === null || alpha <= 0 || alpha >= 1 || difference === null || threshold === null || threshold < 0) {
    panel.className = 'result-panel caution';
    panel.innerHTML = '<h4>Check the entries</h4><p>Use a p-value between 0 and 1, an alpha between 0 and 1, and a non-negative practical threshold.</p>';
    return;
  }

  const reject = p <= alpha;
  const practical = Math.abs(difference) >= threshold;
  const decision = reject ? 'Reject H<sub>0</sub>' : 'Fail to reject H<sub>0</sub>';
  const evidence = reject
    ? `The result is statistically significant because p = ${p.toFixed(3)} is less than or equal to &alpha; = ${alpha.toFixed(2)}.`
    : `The result is not statistically significant because p = ${p.toFixed(3)} is greater than &alpha; = ${alpha.toFixed(2)}.`;
  const practicalText = practical
    ? `The absolute observed difference (${Math.abs(difference).toFixed(3)}) meets or exceeds the practical threshold (${threshold.toFixed(3)}).`
    : `The absolute observed difference (${Math.abs(difference).toFixed(3)}) is smaller than the practical threshold (${threshold.toFixed(3)}).`;
  const caution = reject
    ? 'This supports a difference, but it does not prove causation or automatic nonconformance.'
    : 'This does not prove equality. The study may lack enough power to detect a meaningful difference.';

  panel.className = 'result-panel ' + (reject && practical ? 'good' : reject || practical ? 'caution' : 'neutral');
  panel.innerHTML = `<h4>${decision}</h4><p>${evidence}</p><p><strong>Practical check:</strong> ${practicalText}</p><p><strong>Correct wording:</strong> ${caution}</p>`;
}

function recommendTest() {
  const response = document.getElementById('responseType').value;
  const comparison = document.getElementById('comparisonType').value;
  const panel = document.getElementById('testRecommendation');
  let test = '';
  let note = '';

  if (response === 'numeric') {
    if (comparison === 'one') { test = '1-Sample t'; note = 'Compare one population mean with a target when the population standard deviation is unknown.'; }
    if (comparison === 'two-independent') { test = '2-Sample t'; note = 'Compare the means of two independent groups.'; }
    if (comparison === 'two-paired') { test = 'Paired t'; note = 'Compare before/after values or matched observations using the within-pair differences.'; }
    if (comparison === 'three-plus') { test = 'One-Way ANOVA'; note = 'Compare the means of three or more independent groups with one overall test.'; }
  } else {
    if (comparison === 'one') { test = '1 Proportion'; note = 'Compare one population proportion with a target proportion.'; }
    if (comparison === 'two-independent') { test = '2 Proportions'; note = 'Compare pass/fail or yes/no rates from two independent groups.'; }
    if (comparison === 'two-paired') { test = 'McNemar test'; note = 'Use for paired binary outcomes, such as the same subjects measured before and after.'; }
    if (comparison === 'three-plus') { test = 'Chi-Square Test'; note = 'Compare categorical outcome patterns across three or more groups.'; }
  }

  panel.className = 'result-panel neutral';
  panel.innerHTML = `<h4>Suggested starting point: ${test}</h4><p>${note}</p><p><strong>Before running it:</strong> confirm the sampling method, independence, test assumptions, and whether the design is more complex than this basic selector covers.</p>`;
}

const quizAnswers = {
  q1: { answer: 'b', correct: 'Correct. H₀ is normally the no-difference, no-effect, or target-equality statement.', incorrect: 'Review the null hypothesis section. H₀ is the default no-difference or equality statement.' },
  q2: { answer: 'a', correct: 'Correct. Since 0.032 ≤ 0.05, reject H₀.', incorrect: 'Compare p with alpha: 0.032 ≤ 0.05, so the decision is to reject H₀.' },
  q3: { answer: 'b', correct: 'Correct. A Type I error is a false alarm.', incorrect: 'A Type I error means rejecting H₀ even though H₀ is true.' },
  q4: { answer: 'a', correct: 'Correct. Statistical significance and practical significance answer different questions.', incorrect: 'A result can be statistically detectable but too small to justify action.' },
  q5: { answer: 'a', correct: 'Correct. A 1-Sample t test compares one mean with a target when σ is unknown.', incorrect: 'The appropriate starting test is 1-Sample t.' }
};

function gradeQuiz() {
  let score = 0;
  Object.entries(quizAnswers).forEach(([name, item], index) => {
    const selected = document.querySelector(`input[name="${name}"]:checked`);
    const feedback = document.getElementById(`f${index + 1}`);
    const isCorrect = selected && selected.value === item.answer;
    if (isCorrect) score += 1;
    feedback.className = 'quiz-feedback ' + (isCorrect ? 'correct' : 'incorrect');
    feedback.textContent = isCorrect ? item.correct : item.incorrect;
  });

  const scoreBox = document.getElementById('quizScore');
  const message = score === 5 ? 'Excellent. You are ready to interpret a basic hypothesis test.'
    : score >= 4 ? 'Strong result. Review the one question you missed.'
    : score >= 3 ? 'Good start. Revisit the p-value, error types, and reporting sections.'
    : 'Review the six-step workflow, then try the quiz again.';
  scoreBox.style.display = 'block';
  scoreBox.innerHTML = `<strong>Score: ${score}/5</strong><br>${message}`;
  scoreBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function resetQuiz() {
  document.querySelectorAll('.quiz-feedback').forEach(el => { el.className = 'quiz-feedback'; el.textContent = ''; });
  const scoreBox = document.getElementById('quizScore');
  scoreBox.style.display = 'none';
  scoreBox.innerHTML = '';
}

interpretTest();
recommendTest();
