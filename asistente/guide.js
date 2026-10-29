document.querySelectorAll('.copy-code').forEach((button) => button.addEventListener('click', async () => {
  await navigator.clipboard.writeText(document.getElementById(button.dataset.copy).innerText);
  button.textContent = 'Copiado';
  setTimeout(() => { button.textContent = 'Copiar'; }, 1800);
}));
