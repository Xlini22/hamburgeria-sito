const loginForm = document.getElementById('login-form');
const message = document.getElementById('login-message');
const loginButton = document.getElementById('login-button');

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  message.textContent = 'Accesso in corso...';
  message.className = 'text-secondary';
  loginButton.disabled = true;

  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error(`Errore HTTP ${response.status}`);
    }

    const result = await response.json();

    localStorage.setItem('token', result.access_token);
    localStorage.setItem('refresh_token', result.refresh_token);

    message.textContent = 'Login effettuato';
    message.className = 'text-success';
    window.location.href = 'index.html';
  } catch (error) {
    message.textContent = 'Credenziali non valide o backend non raggiungibile';
    message.className = 'text-danger';
  } finally {
    loginButton.disabled = false;
  }
});
