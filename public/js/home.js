function redirectToApp() {
  window.location.href = "/app"; // Redireciona para a rota /app
}

function toggleButton() {
  const checkbox = document.getElementById('termos');
  const button = document.getElementById('startButton');

  // Habilita o botão se o checkbox estiver marcado
  button.disabled = !checkbox.checked;
}