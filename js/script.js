document.addEventListener('DOMContentLoaded', function() {
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    const loginButton = document.getElementById('loginButton');
    const alertError = document.getElementById('alertError');
    
    function validateInputs() {
        loginButton.disabled = !(emailInput.value && passwordInput.value);
    }
    
    emailInput.addEventListener('input', validateInputs);
    passwordInput.addEventListener('input', validateInputs);
    
    loginButton.addEventListener('click', function() {
        const email = emailInput.value;
        const password = passwordInput.value;
        
        fetch('http://127.0.0.1:5000//api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email, senha: password })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Falha na autenticação');
            }
            return response.json();
        })
        .then(data => {
            console.log(data);
            if (data.status === "error") {
                alertError.textContent = data.response;
                alertError.style.display = 'block';
            } else {
                alertError.style.display = 'none';
                
            }
        })
        .catch(error => {
            alertError.textContent = error.message;
            alertError.style.display = 'block';
            console.error('Erro:', error);
        });
    });
    
    validateInputs();
});