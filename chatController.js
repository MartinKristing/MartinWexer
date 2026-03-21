import { supabase } from './supabase-client.js'
import { create, all } from 'https://cdn.jsdelivr.net/npm/mathjs/+esm'

const math = create(all)

const DEFAULT_USER_ID    = '00000000-0000-0000-0000-000000000001'
const CALCULATOR_USER_ID = '00000000-0000-0000-0000-000000000002'

const input   = document.getElementById('textInput')
const saveBtn = document.getElementById('saveBtn')
const list    = document.getElementById('entriesList')
const status  = document.getElementById('status')

let activeProblem = null  // { question: string, answer: number } | null

const castleFacts = [
  'Gripsholms slott började byggas år 1537 av Gustav Vasa och är ett av Sveriges mest välbevarade renässansslott.',
  'Drottningholms slott är det enda svenska kungliga slottet som finns med på UNESCOs världsarvslista.',
  'Kalmar slott är en av Sveriges bäst bevarade renässansborgarna och anlades redan på 1100-talet.',
  'Läckö slott på Kållandsö i Vänern byggdes under medeltiden och är känt för sina vackra barockinteriörer.',
  'Skokloster slott innehåller en av Europas bäst bevarade originalinredningar från 1600-talets Sverige.',
  'Vadstena slott byggdes av Gustav Vasa på 1500-talet och tjänstgjorde länge som statsfängelse.',
  'Trolleholms slott i Skåne är ett av de få slotten i Sverige som fortfarande ägs och bebos av samma familj sedan 1600-talet.',
  'Örebro slott har anor från 1200-talet och omgärdas av floden Svartån – det var länge en viktig försvarsborg.',
  'Strömsholms slott i Västmanland byggdes på 1670-talet och är känt för sin kungliga stallmästaretradition.',
  'Tyresö slott utanför Stockholm uppfördes på 1620-talet och är idag ett museum med guidade visningar.',
]

function generateProblem() {
  const type = Math.floor(Math.random() * 4)
  let question, answer

  if (type === 0) {
    // Addition: två 2-3-siffriga tal
    const a = Math.floor(Math.random() * 150) + 50
    const b = Math.floor(Math.random() * 150) + 50
    answer = a + b
    question = `Vad är ${a} + ${b}?`
  } else if (type === 1) {
    // Subtraktion: resultat alltid positivt
    const b = Math.floor(Math.random() * 80) + 20
    const a = b + Math.floor(Math.random() * 100) + 20
    answer = a - b
    question = `Vad är ${a} − ${b}?`
  } else if (type === 2) {
    // Multiplikation: 2-siffrigt × 1-2-siffrigt
    const a = Math.floor(Math.random() * 15) + 6
    const b = Math.floor(Math.random() * 9) + 2
    answer = a * b
    question = `Vad är ${a} × ${b}?`
  } else {
    // Division: svar och divisor valda → täljaren beräknad (alltid heltal)
    const ans = Math.floor(Math.random() * 10) + 6
    const divisor = Math.floor(Math.random() * 10) + 3
    const dividend = ans * divisor
    answer = ans
    question = `Vad är ${dividend} ÷ ${divisor}?`
  }

  return { question, answer }
}

function calcExpression(expr) {
  try {
    const result = math.evaluate(expr)
    return { value: math.format(result, { precision: 14 }), error: null }
  } catch (e) {
    return { value: null, error: e.message }
  }
}

function errorHint(msg) {
  if (/Undefined symbol|Undefined function/i.test(msg)) {
    const name = msg.match(/'([^']+)'/)?.[1] ?? ''
    return `Okänd funktion eller variabel${name ? ': ' + name : ''}`
  }
  if (/Unexpected end|Unexpected token/i.test(msg)) {
    return 'Ofullständigt uttryck – saknas en siffra eller operator?'
  }
  if (/arenthes/i.test(msg)) {
    return 'Kontrollera att alla parenteser öppnas och stängs'
  }
  if (/[Dd]ivision by zero/i.test(msg)) {
    return 'Division med noll är inte tillåtet'
  }
  return 'Kunde inte räkna ut – kontrollera syntaxen'
}

async function fetchEntries() {
  const { data, error } = await supabase
    .from('entries')
    .select('id, text, user_id, created_at')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Fel vid hämtning:', error)
    return
  }

  list.innerHTML = ''
  data.forEach(entry => {
    const isCalc = entry.user_id === CALCULATOR_USER_ID

    const wrap = document.createElement('div')
    wrap.className = isCalc ? 'msg-wrap received' : 'msg-wrap'

    const bubble = document.createElement('div')
    bubble.className = isCalc ? 'msg-bubble calc' : 'msg-bubble'
    bubble.textContent = entry.text

    const delBtn = document.createElement('button')
    delBtn.textContent = '×'
    delBtn.className = 'del-btn'
    delBtn.title = 'Ta bort'
    delBtn.addEventListener('click', () => deleteEntry(entry.id))
    bubble.appendChild(delBtn)

    wrap.appendChild(bubble)
    list.appendChild(wrap)
  })

  list.scrollTop = list.scrollHeight
}

async function saveEntry() {
  const text = input.value.trim()
  if (!text) return

  // Quizläge: inmatningen är ett rent tal → rätta svaret
  if (activeProblem && /^-?\d+(\.\d+)?$/.test(text)) {
    const userAnswer = parseFloat(text)
    const correct = Math.abs(userAnswer - activeProblem.answer) < 0.001
    const feedback = correct
      ? `Rätt svar! ${activeProblem.answer} stämmer. Bra jobbat!`
      : `Fel svar. Rätt svar är ${activeProblem.answer}. Försök igen nästa gång!`
    activeProblem = null

    saveBtn.disabled = true
    await supabase.from('entries').insert({ text, user_id: DEFAULT_USER_ID })
    await supabase.from('entries').insert({ text: feedback, user_id: CALCULATOR_USER_ID })
    input.value = ''
    status.textContent = ''
    await fetchEntries()
    saveBtn.disabled = false
    return
  }

  // Avbryt quizläge om annan inmatning
  activeProblem = null

  if (!text.startsWith('=')) {
    saveBtn.disabled = true
    const { error } = await supabase
      .from('entries')
      .insert({ text, user_id: DEFAULT_USER_ID })
    if (error) {
      console.error('Fel vid sparning:', error)
      status.textContent = 'Fel vid sparning. Se konsolen.'
    } else {
      input.value = ''
      status.textContent = ''
      await fetchEntries()
    }
    saveBtn.disabled = false
    return
  }

  const expr = text.slice(1).trim()
  const { value, error } = calcExpression(expr)

  if (error !== null) {
    status.textContent = errorHint(error)
    return
  }

  saveBtn.disabled = true
  status.textContent = 'Räknar...'

  const exprInsert = await supabase
    .from('entries')
    .insert({ text, user_id: DEFAULT_USER_ID })

  if (exprInsert.error) {
    console.error('Fel vid sparning:', exprInsert.error)
    status.textContent = 'Fel vid sparning. Se konsolen.'
    saveBtn.disabled = false
    return
  }

  const calcInsert = await supabase
    .from('entries')
    .insert({ text: `${expr}=${value}`, user_id: CALCULATOR_USER_ID })

  if (calcInsert.error) {
    console.error('Fel vid sparning:', calcInsert.error)
    status.textContent = 'Fel vid sparning. Se konsolen.'
  } else {
    input.value = ''
    status.textContent = ''
    await fetchEntries()
  }

  saveBtn.disabled = false
}

async function deleteEntry(id) {
  const { error } = await supabase
    .from('entries')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Fel vid borttagning:', error)
    status.textContent = 'Fel vid borttagning. Se konsolen.'
  } else {
    status.textContent = 'Borttagen!'
    await fetchEntries()
  }
}

// Gear dropdown
const gearBtn     = document.getElementById('gearBtn')
const gearDropdown = document.getElementById('gearDropdown')

gearBtn.addEventListener('click', e => {
  e.stopPropagation()
  gearDropdown.classList.toggle('hidden')
})

document.addEventListener('click', () => {
  gearDropdown.classList.add('hidden')
})

document.getElementById('castleFactBtn').addEventListener('click', async () => {
  const fact = castleFacts[Math.floor(Math.random() * castleFacts.length)]
  await supabase.from('entries').insert({ text: fact, user_id: CALCULATOR_USER_ID })
  await fetchEntries()
})

async function clearAllEntries() {
  const { data, error: fetchError } = await supabase
    .from('entries')
    .select('id')

  if (fetchError) {
    console.error('Fel vid rensning:', fetchError)
    status.textContent = 'Fel vid rensning. Se konsolen.'
    return
  }

  if (data.length === 0) {
    activeProblem = null
    return
  }

  const ids = data.map(e => e.id)
  const { error } = await supabase
    .from('entries')
    .delete()
    .in('id', ids)

  if (error) {
    console.error('Fel vid rensning:', error)
    status.textContent = 'Fel vid rensning. Se konsolen.'
  } else {
    activeProblem = null
    status.textContent = ''
    await fetchEntries()
  }
}

document.getElementById('clearChatBtn').addEventListener('click', clearAllEntries)

// Quiz-ikon (pratbubbla)
document.querySelector('.chat-header-icon').addEventListener('click', async () => {
  const problem = generateProblem()
  activeProblem = problem
  await supabase.from('entries').insert({ text: problem.question, user_id: CALCULATOR_USER_ID })
  await fetchEntries()
})

saveBtn.addEventListener('click', saveEntry)

input.addEventListener('keydown', e => {
  if (e.key === 'Enter') saveEntry()
})

fetchEntries()
