(function () {
  "use strict";

  var data = {
    select: {
      label: "SELECT",
      subtitle: "Choose what appears in the result",
      what: "SELECT tells SQL which columns, calculations, or summary values you want to see in the result.",
      steps: [
        "Write SELECT at the beginning of the query.",
        "List the columns you want after SELECT.",
        "Separate multiple columns with commas."
      ],
      tip: "Begin with named columns instead of SELECT *. The result is easier to read and you can see exactly what the query is returning.",
      task: "Return only order_id, product, and grade from production_orders.",
      example: "SELECT order_id, product, grade, quantity\nFROM production_orders;",
      starter: "SELECT \nFROM production_orders;",
      challenge: 1,
      className: "c-select"
    },
    from: {
      label: "FROM",
      subtitle: "Choose the source table",
      what: "FROM tells SQL which table contains the rows you want to query.",
      steps: [
        "Write FROM after the SELECT list.",
        "Enter the exact table name shown in the schema.",
        "Use a short alias later when a query contains more than one table."
      ],
      tip: "If SQL says a table does not exist, compare your spelling with the schema explorer. Spaces, missing underscores, and singular versus plural names are common beginner mistakes.",
      task: "Show every column from the customers table by completing the table name after FROM.",
      example: "SELECT *\nFROM customers;",
      starter: "SELECT *\nFROM ;",
      challenge: 1,
      className: "c-from"
    },
    where: {
      label: "WHERE",
      subtitle: "Filter individual rows",
      what: "WHERE keeps only the rows that meet a condition before any grouping or summary calculation occurs.",
      steps: [
        "Write WHERE after FROM and any JOIN clauses.",
        "Name the column to test.",
        "Add an operator and value, such as status = 'Complete' or quantity > 150."
      ],
      tip: "Text values need quotation marks. Numbers normally do not. Use AND when every condition must be true and OR when either condition may be true.",
      task: "Return only production orders whose status is Complete.",
      example: "SELECT order_id, product, quantity\nFROM production_orders\nWHERE status = 'Complete' AND quantity > 150;",
      starter: "SELECT order_id, product, status, quantity\nFROM production_orders\nWHERE ;",
      challenge: 2,
      className: "c-where"
    },
    order: {
      label: "ORDER BY",
      subtitle: "Sort the returned rows",
      what: "ORDER BY arranges the final result using one or more columns.",
      steps: [
        "Write ORDER BY near the end of the query.",
        "Choose the column that controls the order.",
        "Use ASC for low-to-high or DESC for high-to-low."
      ],
      tip: "ASC is the default, but writing it explicitly can make a beginner query easier to understand. Use DESC when you want the largest or newest values first.",
      task: "Sort all production orders from the largest quantity to the smallest.",
      example: "SELECT product, grade, quantity\nFROM production_orders\nORDER BY quantity DESC;",
      starter: "SELECT order_id, product, quantity\nFROM production_orders\nORDER BY quantity ;",
      challenge: 3,
      className: "c-order"
    },
    group: {
      label: "GROUP BY",
      subtitle: "Summarize rows by category",
      what: "GROUP BY combines rows that share the same value so you can calculate totals, counts, averages, minimums, or maximums for each category.",
      steps: [
        "Place the category column in SELECT.",
        "Add an aggregate such as SUM(quantity) or COUNT(*).",
        "Write GROUP BY followed by every selected category column that is not aggregated."
      ],
      tip: "A grouped query usually returns one row per category, not one row per original record. Ask yourself: 'What should one result row represent?'",
      task: "Calculate total production quantity for each production line.",
      example: "SELECT line, SUM(quantity) AS total_quantity\nFROM production_orders\nGROUP BY line;",
      starter: "SELECT line, SUM(quantity) AS total_quantity\nFROM production_orders\nGROUP BY ;",
      challenge: 4,
      className: "c-group"
    },
    having: {
      label: "HAVING",
      subtitle: "Filter summarized groups",
      what: "HAVING filters groups after GROUP BY has calculated an aggregate such as SUM, COUNT, or AVG.",
      steps: [
        "Create the grouped result with GROUP BY.",
        "Write HAVING after GROUP BY.",
        "Use an aggregate condition such as SUM(quantity) > 500."
      ],
      tip: "Use WHERE to filter original rows. Use HAVING to filter calculated groups. If the condition contains SUM, COUNT, AVG, MIN, or MAX, HAVING is often the correct clause.",
      task: "Keep only production lines whose total quantity is greater than 600.",
      example: "SELECT line, SUM(quantity) AS total_quantity\nFROM production_orders\nGROUP BY line\nHAVING SUM(quantity) > 500;",
      starter: "SELECT line, SUM(quantity) AS total_quantity\nFROM production_orders\nGROUP BY line\nHAVING ;",
      challenge: 5,
      className: "c-having"
    },
    join: {
      label: "JOIN",
      subtitle: "Connect related tables",
      what: "JOIN combines related rows from two tables. The ON condition tells SQL which values identify matching records.",
      steps: [
        "Start with the first table in FROM and give it a short alias.",
        "Write JOIN followed by the second table and its alias.",
        "Write ON and match the related key columns from both tables."
      ],
      tip: "When both tables contain a column with the same name, qualify it with the alias, such as p.order_id. This prevents an ambiguous-column error.",
      task: "Connect production_orders to customers using customer_id, then return the customer name for each order.",
      example: "SELECT p.order_id, p.product, c.customer_name\nFROM production_orders AS p\nJOIN customers AS c\n  ON p.customer_id = c.customer_id;",
      starter: "SELECT p.order_id, p.product, c.customer_name\nFROM production_orders AS p\nJOIN customers AS c\n  ON ;",
      challenge: 6,
      className: "c-join"
    },
    limit: {
      label: "LIMIT",
      subtitle: "Return only a set number of rows",
      what: "LIMIT restricts how many rows appear in the result. This lesson uses SQLite syntax.",
      steps: [
        "Sort the result first when 'top' or 'bottom' has a specific meaning.",
        "Write LIMIT at the end of the query.",
        "Enter the number of rows to return."
      ],
      tip: "LIMIT is used by SQLite, PostgreSQL, and MySQL. SQL Server commonly uses TOP near SELECT instead. In this browser lab, use LIMIT.",
      task: "Return the five production orders with the largest quantity.",
      example: "SELECT order_id, product, quantity\nFROM production_orders\nORDER BY quantity DESC\nLIMIT 5;",
      starter: "SELECT order_id, product, quantity\nFROM production_orders\nORDER BY quantity DESC\nLIMIT ;",
      challenge: 8,
      className: "c-limit"
    }
  };

  var keys = Object.keys(data);
  var select = document.getElementById("clause-focus-select");
  var header = document.getElementById("clause-focus-header");
  var title = document.getElementById("clause-focus-title");
  var subtitle = document.getElementById("clause-focus-subtitle");
  var what = document.getElementById("clause-focus-what");
  var steps = document.getElementById("clause-focus-steps");
  var tip = document.getElementById("clause-focus-tip");
  var task = document.getElementById("clause-focus-task");
  var example = document.getElementById("clause-focus-example");
  var progress = document.getElementById("clause-focus-progress");
  var loadButton = document.getElementById("clause-load-example");
  var practiceButton = document.getElementById("clause-practice-button");
  var previousButton = document.getElementById("clause-previous-button");
  var nextButton = document.getElementById("clause-next-button");

  if (!select || !header || !title || !practiceButton) return;

  function renderClause(key) {
    var item = data[key] || data.select;
    var index = keys.indexOf(key);
    header.className = "clause-focus-header " + item.className;
    title.textContent = item.label;
    subtitle.textContent = item.subtitle;
    what.textContent = item.what;
    steps.innerHTML = item.steps.map(function (step) {
      return "<li>" + step + "</li>";
    }).join("");
    tip.textContent = item.tip;
    task.textContent = item.task;
    example.textContent = item.example;
    progress.textContent = "Clause " + (index + 1) + " of " + keys.length;
    loadButton.setAttribute("data-example", key);
    practiceButton.textContent = "Practice " + item.label + " in the live lab";
    previousButton.disabled = index <= 0;
    nextButton.disabled = index >= keys.length - 1;
  }

  function moveClause(direction) {
    var index = keys.indexOf(select.value);
    var nextIndex = Math.max(0, Math.min(keys.length - 1, index + direction));
    select.value = keys[nextIndex];
    renderClause(select.value);
    select.focus();
  }

  select.addEventListener("change", function () {
    renderClause(select.value);
  });

  previousButton.addEventListener("click", function () {
    moveClause(-1);
  });

  nextButton.addEventListener("click", function () {
    moveClause(1);
  });

  loadButton.addEventListener("click", function () {
    window.setTimeout(function () {
      var lab = document.getElementById("sql-lab");
      if (lab) lab.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  });

  practiceButton.addEventListener("click", function () {
    var item = data[select.value] || data.select;
    var challengeSelect = document.getElementById("challenge-select");

    if (challengeSelect) {
      challengeSelect.value = String(item.challenge);
      challengeSelect.dispatchEvent(new Event("change", { bubbles: true }));
    }

    window.setTimeout(function () {
      var editor = document.getElementById("sql-editor");
      var lab = document.getElementById("sql-lab");

      if (editor) {
        editor.value = item.starter;
        editor.dispatchEvent(new Event("input", { bubbles: true }));
      }

      if (lab) lab.scrollIntoView({ behavior: "smooth", block: "start" });
      if (editor) editor.focus();
    }, 0);
  });

  renderClause(select.value);
}());
