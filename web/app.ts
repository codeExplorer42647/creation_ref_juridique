import { generateId, LocalStorageStore } from '../src/id.js';

declare const window: any;
const form = document.getElementById('form') as HTMLFormElement;
const result = document.getElementById('result') as HTMLElement;
const copyBtn = document.getElementById('copy') as HTMLButtonElement;
const historyList = document.getElementById('history') as HTMLUListElement;
const dateInput = document.getElementById('date') as HTMLInputElement;
dateInput.value = new Date().toISOString().slice(0,10);
const secret = window.prompt('Secret salt?') || '';
const store = new LocalStorageStore();

loadHistory();

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const inputs = {
    type: (document.getElementById('type') as HTMLSelectElement).value,
    date: dateInput.value,
    juridiction: (document.getElementById('juridiction') as HTMLInputElement).value,
    canal: (document.getElementById('canal') as HTMLInputElement).value,
    secret_salt: secret
  };
  try {
    const id = await generateId(inputs, store);
    result.textContent = id;
    copyBtn.style.display = 'inline';
    copyBtn.onclick = () => navigator.clipboard.writeText(id);
    copyBtn.focus();
    addHistory({date: inputs.date, type: inputs.type, id});
  } catch (err:any) {
    result.textContent = err.message;
    copyBtn.style.display = 'none';
  }
});

function addHistory(item:{date:string;type:string;id:string}) {
  const hist = JSON.parse(localStorage.getItem('refgen:history')||'[]');
  hist.unshift(item);
  localStorage.setItem('refgen:history', JSON.stringify(hist));
  const li = document.createElement('li');
  li.textContent = `${item.date} ${item.type} ${item.id}`;
  historyList.prepend(li);
}

function loadHistory() {
  const hist = JSON.parse(localStorage.getItem('refgen:history')||'[]');
  hist.forEach((h:any)=>{
    const li = document.createElement('li');
    li.textContent = `${h.date} ${h.type} ${h.id}`;
    historyList.appendChild(li);
  });
}
