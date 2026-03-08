import { supabase } from './supabase-client.js'

const DEFAULT_USER_ID = 'default-user-0000-0000-000000000001'

const input   = document.getElementById('textInput')
const saveBtn = document.getElementById('saveBtn')
const list    = document.getElementById('entriesList')
const status  = document.getElementById('status')

async function fetchEntries() {
  const { data, error } = await supabase
    .from('entries')
    .select('id, text, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Fel vid hämtning:', error)
    return
  }

  list.innerHTML = ''
  data.forEach(entry => {
    const li = document.createElement('li')

    const span = document.createElement('span')
    span.textContent = entry.text
    li.appendChild(span)

    const delBtn = document.createElement('button')
    delBtn.textContent = 'Ta bort'
    delBtn.className = 'del-btn'
    delBtn.addEventListener('click', () => deleteEntry(entry.id))
    li.appendChild(delBtn)

    list.appendChild(li)
  })
}

async function saveEntry() {
  const text = input.value.trim()
  if (!text) {
    status.textContent = 'Skriv något innan du sparar.'
    return
  }

  saveBtn.disabled = true
  status.textContent = 'Sparar...'

  const { error } = await supabase
    .from('entries')
    .insert({ text, user_id: DEFAULT_USER_ID })

  if (error) {
    console.error('Fel vid sparning:', error)
    status.textContent = 'Fel vid sparning. Se konsolen.'
  } else {
    input.value = ''
    status.textContent = 'Sparat!'
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
