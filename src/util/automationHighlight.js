// Лексер для подсветки скриптов автоматизаций в полях ввода. Только раскраска: на сам текст не влияет,
// поэтому он намеренно терпим к недописанным выражениям — на каждый символ найдётся какой-то класс.

const WORD_OPERATORS = new Set(['and', 'or', 'not'])
const LITERAL_WORDS = new Set(['true', 'false', 'null'])
const OPERATORS = ['===', '!==', '&&', '||', '==', '!=', '<=', '>=', '+', '-', '*', '/', '%', '!', '<', '>', '=', '?', ':']
const PUNCTUATION = '(){}[],;.'

const isIdentStart = ch => /[A-Za-z_$А-Яа-яЁё]/.test(ch)
const isIdentPart = ch => /[\w$А-Яа-яЁё]/.test(ch)
const isDigit = ch => ch >= '0' && ch <= '9'

function pushSegment (segments, text, cls) {
  if (!text) return
  const last = segments[segments.length - 1]
  if (last && last.cls === cls) last.text += text
  else segments.push({ text, cls })
}

function previousSignificant (text, index) {
  for (let i = index - 1; i >= 0; i--) {
    if (!/\s/.test(text[i])) return text[i]
  }
  return ''
}

function nextSignificant (text, index) {
  for (let i = index; i < text.length; i++) {
    if (!/\s/.test(text[i])) return text[i]
  }
  return ''
}

/** Строковый литерал: {{ ... }} внутри него — вставка поля, подсвечивается как скрипт. */
function pushString (raw, segments) {
  let cursor = 0
  while (cursor < raw.length) {
    const open = raw.indexOf('{{', cursor)
    if (open < 0) break
    pushSegment(segments, raw.slice(cursor, open), 'aeh-string')
    cursor = pushTemplateSpan(raw, open, segments)
  }
  pushSegment(segments, raw.slice(cursor), 'aeh-string')
}

/** {{ ... }} с позиции open: скобки отдельным цветом, содержимое — скрипт. Возвращает позицию после закрывающей. */
function pushTemplateSpan (text, open, segments) {
  pushSegment(segments, '{{', 'aeh-brace')
  const contentStart = open + 2
  const close = text.indexOf('}}', contentStart)
  const contentEnd = close < 0 ? text.length : close
  tokenizeScript(text.slice(contentStart, contentEnd), segments)
  if (close < 0) return text.length
  pushSegment(segments, '}}', 'aeh-brace')
  return close + 2
}

/** Разбор куска текста как скрипта. */
function tokenizeScript (text, segments) {
  let index = 0
  // true, если предыдущий идентификатор был корнем `var` — следующее за ним `.имя` это переменная графа.
  let afterVarRoot = false

  while (index < text.length) {
    const ch = text[index]

    if (/\s/.test(ch)) {
      let end = index + 1
      while (end < text.length && /\s/.test(text[end])) end++
      pushSegment(segments, text.slice(index, end), '')
      index = end
      continue
    }

    if (ch === '\'' || ch === '"') {
      let end = index + 1
      while (end < text.length && text[end] !== ch) {
        end += text[end] === '\\' ? 2 : 1
      }
      end = Math.min(text.length, end + 1)
      pushString(text.slice(index, end), segments)
      index = end
      afterVarRoot = false
      continue
    }

    if (ch === '{' && text[index + 1] === '{') {
      index = pushTemplateSpan(text, index, segments)
      afterVarRoot = false
      continue
    }

    if (isDigit(ch)) {
      let end = index + 1
      while (end < text.length && (isDigit(text[end]) || (text[end] === '.' && isDigit(text[end + 1] || '')))) end++
      pushSegment(segments, text.slice(index, end), 'aeh-number')
      index = end
      afterVarRoot = false
      continue
    }

    if (isIdentStart(ch)) {
      let end = index + 1
      while (end < text.length && isIdentPart(text[end])) end++
      const word = text.slice(index, end)
      const isCall = nextSignificant(text, end) === '('
      const afterDot = previousSignificant(text, index) === '.'
      let cls
      if (afterDot) {
        if (isCall) cls = 'aeh-method'
        else cls = afterVarRoot ? 'aeh-variable' : 'aeh-getter'
        afterVarRoot = false
      } else if (WORD_OPERATORS.has(word.toLowerCase())) {
        cls = 'aeh-operator'
        afterVarRoot = false
      } else if (LITERAL_WORDS.has(word)) {
        cls = 'aeh-literal'
        afterVarRoot = false
      } else if (isCall) {
        cls = 'aeh-method'
        afterVarRoot = false
      } else {
        cls = 'aeh-variable'
        afterVarRoot = word === 'var'
      }
      pushSegment(segments, word, cls)
      index = end
      continue
    }

    const operator = OPERATORS.find(candidate => text.startsWith(candidate, index))
    if (operator) {
      pushSegment(segments, operator, 'aeh-operator')
      index += operator.length
      afterVarRoot = false
      continue
    }

    // Точка между `var` и именем переменной не должна сбрасывать afterVarRoot.
    if (ch !== '.') afterVarRoot = false
    pushSegment(segments, ch, PUNCTUATION.includes(ch) ? 'aeh-punct' : '')
    index += 1
  }
}

/**
 * Делит текст поля на раскрашенные куски.
 * mode TEMPLATE — обычный текст, скриптом считается только содержимое {{ ... }};
 * остальные режимы — весь текст скрипт (а {{ ... }} внутри строк тоже выделяются как вставка).
 */
export function highlightSegments (value, mode = 'EXPRESSION') {
  const text = String(value ?? '')
  const segments = []

  if (String(mode || '').toUpperCase() !== 'TEMPLATE') {
    tokenizeScript(text, segments)
    return segments
  }

  let cursor = 0
  while (cursor < text.length) {
    const open = text.indexOf('{{', cursor)
    if (open < 0) break
    pushSegment(segments, text.slice(cursor, open), '')
    cursor = pushTemplateSpan(text, open, segments)
  }
  pushSegment(segments, text.slice(cursor), '')
  return segments
}
