import { supabase } from './supabase-client.js'

const DEFAULT_USER_ID    = '00000000-0000-0000-0000-000000000001'
const CALCULATOR_USER_ID = '00000000-0000-0000-0000-000000000002'

const input   = document.getElementById('textInput')
const saveBtn = document.getElementById('saveBtn')
const list    = document.getElementById('entriesList')
const status  = document.getElementById('status')

function calcExpression(expr) {
  if (!/^[\d+\-*/(). ]+$/.test(expr)) return null
  try {
    const result = Function('"use strict"; return (' + expr + ')')()
    if (typeof result !== 'number' || !isFinite(result)) return null
    return result
  } catch {
    return null
  }
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
  if (!text || !text.startsWith('=')) return

  const expr   = text.slice(1).trim()
  const result = calcExpression(expr)
  if (result === null) return

  saveBtn.disabled = true
  status.textContent = 'Räknar...'

  const expressionText = `${expr}=${result}`

  const [exprInsert, calcInsert] = await Promise.all([
    supabase.from('entries').insert({ text, user_id: DEFAULT_USER_ID }),
    supabase.from('entries').insert({ text: expressionText, user_id: CALCULATOR_USER_ID })
  ])

  if (exprInsert.error || calcInsert.error) {
    console.error('Fel vid sparning:', exprInsert.error || calcInsert.error)
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
