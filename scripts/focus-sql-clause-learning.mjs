import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const lessonPath = path.join(root, 'lessons', 'writing-your-first-sql-query.html');

if (!fs.existsSync(lessonPath)) {
  throw new Error('The generated SQL lesson was not found. Run build-interactive-sql-lesson.mjs first.');
}

const focusedClauseSection = `      <section id="clause-lessons" class="focused-clause-section">
        <h2>Learn one SQL clause at a time</h2>
        <p class="section-intro">Choose one clause from the dropdown. The lesson will show only that clause, explain it in plain language, and give you one focused practice task before you move on.</p>

        <div class="clause-focus-picker">
          <label for="clause-focus-select">Choose a clause to learn</label>
          <select id="clause-focus-select">
            <option value="select">1. SELECT — choose what to show</option>
            <option value="from">2. FROM — choose the source table</option>
            <option value="where">3. WHERE — filter rows</option>
            <option value="order">4. ORDER BY — sort the result</option>
            <option value="group">5. GROUP BY — summarize categories</option>
            <option value="having">6. HAVING — filter groups</option>
            <option value="join">7. JOIN — connect tables</option>
            <option value="limit">8. LIMIT — restrict the number of rows</option>
          </select>
          <span id="clause-focus-progress">Clause 1 of 8</span>
        </div>

        <article class="clause-focus-card" aria-live="polite">
          <header class="clause-focus-header c-select" id="clause-focus-header">
            <p class="clause-focus-kicker">Current clause</p>
            <h3 id="clause-focus-title">SELECT</h3>
            <p id="clause-focus-subtitle">Choose what appears in the result</p>
          </header>
          <div class="clause-focus-body">
            <div class="clause-focus-block">
              <h4>What this clause does</h4>
              <p id="clause-focus-what"></p>
            </div>

            <div class="clause-focus-grid">
              <div class="clause-focus-block">
                <h4>How to use it</h4>
                <ol id="clause-focus-steps"></ol>
              </div>
              <div>
                <div class="clause-focus-block beginner-tip">
                  <h4>Beginner tip</h4>
                  <p id="clause-focus-tip"></p>
                </div>
                <div class="clause-focus-block practice-prompt">
                  <h4>Your focused practice</h4>
                  <p id="clause-focus-task"></p>
                </div>
              </div>
            </div>

            <div class="clause-focus-block">
              <h4>Example query</h4>
              <pre class="code-example" id="clause-focus-example"></pre>
            </div>

            <div class="clause-focus-actions">
              <button class="button secondary small load-example" type="button" id="clause-load-example" data-example="select">Load example in SQL lab</button>
              <button class="button small" type="button" id="clause-practice-button">Practice SELECT in the live lab</button>
              <button class="button secondary small" type="button" id="clause-previous-button">Previous clause</button>
              <button class="button secondary small" type="button" id="clause-next-button">Next clause</button>
            </div>
            <p class="clause-focus-note">The practice button opens the live laboratory with a starter query. Complete the missing part, run the query, and use the friendly error coach when needed.</p>
          </div>
        </article>
      </section>

`;

let lessonHtml = fs.readFileSync(lessonPath, 'utf8');
const clauseSectionStart = lessonHtml.indexOf('      <section id="clause-lessons">');
const sqlLabStart = lessonHtml.indexOf('      <section id="sql-lab">', clauseSectionStart);

if (clauseSectionStart < 0 || sqlLabStart < 0) {
  throw new Error('Unable to locate the clause-by-clause section in the SQL lesson.');
}

lessonHtml = lessonHtml.slice(0, clauseSectionStart) + focusedClauseSection + lessonHtml.slice(sqlLabStart);
lessonHtml = lessonHtml.replace(
  '<li><a href="#clause-lessons">Clause-by-clause examples</a></li>',
  '<li><a href="#clause-lessons">Learn one clause at a time</a></li>'
);

const stylesheetTag = '  <link rel="stylesheet" href="/lessons/sql-clause-focus.css">\n';
const headClose = lessonHtml.indexOf('</head>');
if (headClose < 0) throw new Error('Unable to locate the SQL lesson head closing tag.');
lessonHtml = lessonHtml.slice(0, headClose) + stylesheetTag + lessonHtml.slice(headClose);

const scriptTag = '  <script src="/lessons/sql-clause-focus.js"></script>\n';
const bodyClose = lessonHtml.lastIndexOf('</body>');
if (bodyClose < 0) throw new Error('Unable to locate the SQL lesson body closing tag.');
lessonHtml = lessonHtml.slice(0, bodyClose) + scriptTag + lessonHtml.slice(bodyClose);

fs.writeFileSync(lessonPath, lessonHtml, 'utf8');
console.log('Focused one-clause-at-a-time learning interface installed.');
