import { supabase } from './supabase-client.js'
import { create, all } from 'https://cdn.jsdelivr.net/npm/mathjs/+esm'

const math = create(all)

const DEFAULT_USER_ID    = '00000000-0000-0000-0000-000000000001'
const CALCULATOR_USER_ID = '00000000-0000-0000-0000-000000000002'

const input   = document.getElementById('textInput')
const saveBtn = document.getElementById('saveBtn')
const list    = document.getElementById('entriesList')
const status  = document.getElementById('status')

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

saveBtn.addEventListener('click', saveEntry)

input.addEventListener('keydown', e => {
  if (e.key === 'Enter') saveEntry()
})

fetchEntries()
