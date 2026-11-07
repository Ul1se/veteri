const form = document.querySelector('#booking');
const {pet, service, date, time} = form.elements;
const list = document.querySelector('#appointments');
const message = document.querySelector('#message');
const reset = document.querySelector('#reset');
const key = 'veterisoft.demo.turnos.v1';
const slots = ['09:00', '10:00', '11:30', '15:00', '16:00', '17:30'];
let editing = null;
const today = new Intl.DateTimeFormat('sv-SE', {timeZone:'America/Argentina/Buenos_Aires',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
date.min = today;
date.value = today;
function read() {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    return Array.isArray(saved) ? saved : [];
  } catch { return []; }
}
function save(items) {
  try { localStorage.setItem(key, JSON.stringify(items)); return true; }
  catch { message.textContent = 'El navegador no permite guardar esta reserva de prueba.'; return false; }
}
function refreshTimes(selected = time.value) {
  const taken = new Set(read().filter(row => row.date === date.value && row.id !== editing).map(row => row.time));
  const available = slots.filter(slot => !taken.has(slot));
  time.replaceChildren(...available.map(slot => new Option(slot, slot)));
  if (!available.length) time.append(new Option('Sin disponibilidad', ''));
  if (available.includes(selected)) time.value = selected;
}
function clearEditing() {
  editing = null;
  form.querySelector('[type=submit]').textContent = 'Confirmar turno de prueba';
  reset.hidden = true;
  pet.value = '';
  refreshTimes();
}
function render() {
  list.replaceChildren();
  const items = read().sort((a,b) => (a.date+a.time).localeCompare(b.date+b.time));
  if (!items.length) list.textContent = 'Todavía no hay turnos guardados.';
  for (const row of items) {
    const card = document.createElement('div');
    card.className = 'slot';
    const label = document.createElement('p');
    label.textContent = row.pet + ' · ' + row.service + ' · ' + row.date.split('-').reverse().join('/') + ' a las ' + row.time;
    const move = document.createElement('button');
    move.type = 'button';
    move.className = 'plain';
    move.textContent = 'Reprogramar';
    move.addEventListener('click', () => {
      editing = row.id;
      pet.value = row.pet;
      service.value = row.service;
      date.value = row.date < today ? today : row.date;
      refreshTimes(row.time);
      reset.hidden = false;
      form.querySelector('[type=submit]').textContent = 'Guardar reprogramación';
      date.focus();
    });
    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'plain';
    cancel.textContent = 'Cancelar turno';
    cancel.addEventListener('click', () => {
      if (!save(read().filter(item => item.id !== row.id))) return;
      if (editing === row.id) clearEditing();
      message.textContent = 'Turno de prueba cancelado.';
      refreshTimes();
      render();
    });
    card.append(label, move, cancel);
    list.append(card);
  }
}
form.addEventListener('submit', event => {
  event.preventDefault();
  const items = read();
  if (!pet.value.trim() || date.value < today || !slots.includes(time.value) ||
      items.some(row => row.id !== editing && row.date === date.value && row.time === time.value)) {
    message.textContent = 'Completá los datos y elegí un horario disponible.';
    refreshTimes();
    return;
  }
  const row = {id:editing ?? crypto.randomUUID(),pet:pet.value.trim(),service:service.value,date:date.value,time:time.value};
  if (!save([...items.filter(item => item.id !== editing),row])) return;
  message.textContent = editing ? 'Turno de prueba reprogramado.' : 'Turno de prueba confirmado.';
  clearEditing();
  render();
});
date.addEventListener('change', () => refreshTimes());
reset.addEventListener('click', clearEditing);
document.querySelectorAll('[data-service]').forEach(link => link.addEventListener('click', () => {
  if (editing) clearEditing();
  service.value = link.dataset.service;
}));
window.addEventListener('storage', event => { if (event.key === key) { refreshTimes(); render(); } });
refreshTimes();
render();
