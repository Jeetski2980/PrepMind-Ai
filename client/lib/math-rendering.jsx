import { Fragment } from "react";
import { BlockMath, InlineMath } from "react-katex";
import { normalizeMathExpression, restoreEscapedLatex } from "./math-text.js";

const MATH_DELIMITER = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\$[^$\n]+?\$|\\\([\s\S]+?\\\))/g;
const BOLD_MARKDOWN = /(\*\*[\s\S]+?\*\*)/g;

function isMathLike(expression) {
  const value = expression.trim();
  if (!value) return false;

  return /\\[A-Za-z]+|[=<>≤≥≠≈±×÷^+*\/-]|_|\b(?:sin|cos|tan|arcsin|arccos|arctan|sqrt|frac|ln|log|lim|pi|theta|alpha|beta|gamma|delta|epsilon|zeta|eta|kappa|lambda|mu|nu|xi|rho|sigma|tau|phi|chi|psi|omega)\b/i.test(value);
}

function findClosingParen(text, start) {
  let depth = 0;
  for (let index = start; index < text.length; index += 1) {
    if (text[index] === "(") depth += 1;
    if (text[index] === ")") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function renderPlainText(text, keyPrefix) {
  const nodes = [];
  let plainStart = 0;
  let index = 0;
  let part = 0;

  while (index < text.length) {
    if (text[index] !== "(") {
      index += 1;
      continue;
    }

    const end = findClosingParen(text, index);
    if (end < 0) break;

    const expression = text.slice(index + 1, end);
    if (isMathLike(expression)) {
      if (index > plainStart) {
        nodes.push(...renderBold(text.slice(plainStart, index), `${keyPrefix}-plain-${part++}`));
      }
      nodes.push(
        <InlineMath
          key={`${keyPrefix}-inferred-${part++}`}
          math={normalizeMathExpression(expression)}
          renderError={() => <span title="This formula could not be rendered">{expression}</span>}
        />
      );
      index = end + 1;
      plainStart = index;
      continue;
    }

    index += 1;
  }

  if (plainStart < text.length) {
    nodes.push(...renderBold(text.slice(plainStart), `${keyPrefix}-plain-${part++}`));
  }

  return nodes;
}

function renderBold(text, keyPrefix) {
  // A percent sign escaped for TeX sometimes appears in ordinary prose
  // outside math delimiters. Preserve the symbol without showing its slash.
  const readableText = text.replace(/\\%/g, "%");
  return readableText.split(BOLD_MARKDOWN).filter(Boolean).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${keyPrefix}-${index}`}>{part.slice(2, -2)}</strong>;
    }
    return <Fragment key={`${keyPrefix}-${index}`}>{part}</Fragment>;
  });
}

function isStandaloneMathExpression(value) {
  const expression = value.trim();
  if (!expression) return false;

  // Older generated answer choices often contain bare TeX rather than a
  // delimited expression. Treat a whole choice that starts with a TeX
  // command as one formula so braces and function parentheses stay together.
  if (/^\\[A-Za-z]+/.test(expression)) return true;

  if (!/^[\sA-Za-z0-9.,()[\]{}|=<>≤≥≠≈±×÷^_+*/\\-]+$/.test(expression)) return false;
  if (/^\d+\s*\/\s*\d+$/.test(expression)) return true;

  const mathWords = /^(?:[A-Za-z]|sin|cos|tan|arcsin|arccos|arctan|sinh|cosh|tanh|sec|csc|cot|ln|log|exp|sqrt|frac|lim|max|min|sup|inf|det|dim|rank|deg|arg|mod|pi|theta|alpha|beta|gamma|delta|epsilon|varepsilon|zeta|eta|kappa|lambda|mu|nu|xi|rho|sigma|tau|phi|varphi|chi|psi|omega|infty|partial|displaystyle)$/i;
  const words = expression.match(/[A-Za-z]+/g) || [];
  if (!words.length || words.some((word) => !mathWords.test(word))) return false;

  return /[=<>≤≥≠≈±×÷^_+*/-]/.test(expression) || words.length === 1;
}

function normalizeStandaloneMathExpression(expression) {
  const fraction = expression.trim().match(/^(\d+)\s*\/\s*(\d+)$/);
  if (fraction) return `\\frac{${fraction[1]}}{${fraction[2]}}`;
  return normalizeMathExpression(expression);
}

export function renderTextWithMath(value, { inferStandaloneMath = false } = {}) {
  if (value == null) return null;

  const text = restoreEscapedLatex(value);
  const parts = text.split(MATH_DELIMITER).filter(Boolean);

  return parts.map((part, index) => {
    const key = `math-text-${index}`;
    let math = null;
    let display = false;

    if (part.startsWith("$$") && part.endsWith("$$")) {
      math = part.slice(2, -2);
      display = true;
    } else if (part.startsWith("\\[") && part.endsWith("\\]")) {
      math = part.slice(2, -2);
      display = true;
    } else if (part.startsWith("\\(") && part.endsWith("\\)")) {
      math = part.slice(2, -2);
    } else if (part.startsWith("$") && part.endsWith("$")) {
      math = part.slice(1, -1);
    }

    if (math != null) {
      const normalizedMath = normalizeMathExpression(math);
      const fallback = () => <span title="This formula could not be rendered">{math}</span>;
      return display
        ? <BlockMath key={key} math={normalizedMath} renderError={fallback} />
        : <InlineMath key={key} math={normalizedMath} renderError={fallback} />;
    }

    if (inferStandaloneMath && isStandaloneMathExpression(part)) {
      const normalizedMath = normalizeStandaloneMathExpression(part);
      return (
        <InlineMath
          key={key}
          math={normalizedMath}
          renderError={() => <span title="This formula could not be rendered">{part}</span>}
        />
      );
    }

    return <Fragment key={key}>{renderPlainText(part, key)}</Fragment>;
  });
}
