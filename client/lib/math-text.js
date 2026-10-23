// JSON.parse treats an unescaped TeX sequence such as \frac or \to as a
// form-feed or tab escape. Restore the common TeX commands affected by that.
export function restoreEscapedLatex(text) {
  return String(text)
    .replace(/\f(?=rac(?:\d|[^A-Za-z]|$)|orall\b|loor\b|box\b)/g, "\\f")
    .replace(/\t(?=o(?:\d|[^A-Za-z]|$)|heta\b|ext\b|imes\b|op\b|riangle\b)/g, "\\t")
    .replace(/\x08(?=egin\b|eta\b|ar\b|ig[A-Za-z]*\b)/g, "\\b")
    .replace(/\r(?=ight\b|ho\b|m\b)/g, "\\r");
}

export function normalizeMathExpression(expression) {
  let math = restoreEscapedLatex(expression).trim();

  // Models sometimes write a Greek command as a bare word, or attach the
  // following variable to it (for example, `DeltaH` or `mcDeltaT`). Restore
  // those boundaries before KaTeX interprets the expression as Latin letters.
  const greekCommands = "Delta|Gamma|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega|delta|gamma|theta|lambda|xi|pi|sigma|upsilon|phi|psi|omega";
  const escapedGreekBoundary = new RegExp(`\\\\(${greekCommands})(?=[A-Za-z])`, "g");
  const bareGreekBoundary = new RegExp(`(?<!\\\\)(${greekCommands})(?=[A-Za-z])`, "g");
  const bareGreekWord = new RegExp(`(?<!\\\\)\\b(${greekCommands})\\b`, "g");

  math = math.replace(escapedGreekBoundary, (_match, command) => `\\${command} `);
  math = math.replace(bareGreekBoundary, (_match, command) => `\\${command} `);
  math = math.replace(bareGreekWord, (_match, command) => `\\${command}`);

  // Some model outputs omit the slash from the display style command and
  // common TeX commands. Repair them before KaTeX sees the expression.
  math = math.replace(/(^|\s)displaystyle\b/g, (_match, prefix) => `${prefix}\\displaystyle`);
  math = math.replace(/\btapprox\b/g, "t\\approx");
  // The model occasionally drops the slash from an inequality command, most
  // often in a compound expression such as `20ge0` or `kge5`.
  math = math.replace(/(?<=[A-Za-z0-9})])(?:ge|le)(?=\s*[-+]?\d)/g, (command) => `\\${command}`);
  // A missing space can hide a function name after a subscripted variable,
  // such as v_0sqrt(...). Restore the command boundary in that pattern.
  math = math.replace(/(_\d+)(sqrt|arcsin|arccos|arctan|sin|cos|tan)(?=[^A-Za-z]|$)/g, (_match, subscript, command) => `${subscript}\\${command}`);
  math = math.replace(/(^|[^\\])\b(sin|cos|tan|arcsin|arccos|arctan|sinh|cosh|tanh|sec|csc|cot|sqrt|frac|mathrm|ln|log|exp|lim|max|min|inf|sup|pi|theta|alpha|beta|gamma|delta|epsilon|varepsilon|zeta|eta|kappa|lambda|mu|nu|xi|omicron|rho|sigma|tau|upsilon|phi|varphi|chi|psi|omega|sum|prod|int|infty|partial|to|leq|geq|neq|approx|times|cdot)(?=[^A-Za-z]|$)/g, (_match, prefix, command) => `${prefix}\\${command}`);
  math = math.replace(/\bcircmathrm(?=\{)/g, "\\circ\\mathrm");
  math = math.replace(/(^|[^\\])\bcirc(?=[^A-Za-z]|$)/g, (_match, prefix) => `${prefix}\\circ`);
  math = math.replace(/(\d+(?:\.\d+)?),\s*(\\mathrm\{)/g, (_match, value, unitCommand) => `${value}\\,${unitCommand}`);

  return math;
}
