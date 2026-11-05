import faqCsv from '../data/campus_faq.csv?raw'

export type FaqEntry = {
  id: string
  category: string
  question: string
  keywords: string
  answer: string
  source: string
}

type AnswerResult = {
  answer: string
  source?: string
  suggestions?: string[]
}

function parseCsv(csv: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index]

    if (quoted) {
      if (character === '"' && csv[index + 1] === '"') {
        cell += '"'
        index += 1
      } else if (character === '"') {
        quoted = false
      } else {
        cell += character
      }
    } else if (character === '"' && cell.length === 0) {
      quoted = true
    } else if (character === ',') {
      row.push(cell)
      cell = ''
    } else if (character === '\n' || character === '\r') {
      if (character === '\r' && csv[index + 1] === '\n') index += 1
      row.push(cell)
      if (row.some((value) => value.trim())) rows.push(row)
      row = []
      cell = ''
    } else {
      cell += character
    }
  }

  if (quoted) throw new Error('The local FAQ CSV contains an unclosed quoted field.')
  if (cell.length || row.length) {
    row.push(cell)
    if (row.some((value) => value.trim())) rows.push(row)
  }

  return rows
}

function loadFaq(csv: string): FaqEntry[] {
  const [header, ...records] = parseCsv(csv)
  const requiredColumns = ['id', 'category', 'question', 'keywords', 'answer', 'source']

  if (!header || requiredColumns.some((column) => !header.includes(column))) {
    throw new Error(`The local FAQ CSV must contain these columns: ${requiredColumns.join(', ')}.`)
  }

  const columnIndex = Object.fromEntries(header.map((column, index) => [column, index]))

  return records.map((record, rowIndex) => {
    const entry = Object.fromEntries(
      requiredColumns.map((column) => [column, record[columnIndex[column]]?.trim() ?? '']),
    ) as FaqEntry

    if (requiredColumns.some((column) => !entry[column as keyof FaqEntry])) {
      throw new Error(`The local FAQ CSV has a missing value on row ${rowIndex + 2}.`)
    }
    return entry
  })
}

export const campusFaq = loadFaq(faqCsv)

const stopWords = new Set([
  'a', 'about', 'an', 'and', 'are', 'can', 'do', 'does', 'for', 'how', 'i', 'in',
  'is', 'it', 'me', 'my', 'of', 'on', 'or', 'the', 'to', 'what', 'when', 'where',
  'which', 'who', 'with', 'would',
])

function tokenize(value: string): string[] {
  return value
    .toLocaleLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length > 1 && !stopWords.has(token))
}

function rankEntry(queryTokens: string[], entry: FaqEntry): number {
  const questionTokens = new Set(tokenize(entry.question))
  const keywordTokens = new Set(tokenize(entry.keywords.replaceAll('|', ' ')))
  return queryTokens.reduce((score, token) => (
    score + (keywordTokens.has(token) ? 3 : questionTokens.has(token) ? 2 : 0)
  ), 0)
}

export function answerQuestion(question: string): AnswerResult {
  const queryTokens = [...new Set(tokenize(question))]
  const ranked = campusFaq
    .map((entry) => ({ entry, score: rankEntry(queryTokens, entry) }))
    .sort((left, right) => right.score - left.score)

  if (queryTokens.length && ranked[0]?.score >= 3) {
    return {
      answer: ranked[0].entry.answer,
      source: ranked[0].entry.source,
    }
  }

  const suggestions = ranked.slice(0, 3).map(({ entry }) => entry.question)
  return {
    answer: "I couldn't find a matching answer in the local FAQ. Try one of the preset questions below.",
    suggestions,
  }
}
