import { supabase } from './supabase-client.js'

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
    li.textContent = entry.text
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
    .insert({ text })

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

saveBtn.addEventListener('click', saveEntry)

input.addEventListener('keydown', e => {
  if (e.key === 'Enter') saveEntry()
})

fetchEntries()
