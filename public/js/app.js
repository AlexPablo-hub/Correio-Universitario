let selectedChoice = null;

// Função para validar e formatar o telefone
function formatPhone(phoneInput) {
    let phone = phoneInput.value.replace(/\D/g, ''); // Remove todos os caracteres que não são dígitos
    if (phone.length > 0) {
        phone = phone.replace(/^(\d{2})(\d)/g, '($1) $2'); // Adiciona os parênteses para o DDD
        phone = phone.replace(/(\d{5})(\d{4})$/, '$1-$2'); // Adiciona o traço entre a parte do número
    }
    phoneInput.value = phone; // Atualiza o valor formatado
}

// Função para validar e formatar o telefone
function validateForm() {
    const nome = document.getElementById('nome').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const message = document.getElementById('message').value.trim();
    const sala = document.getElementById('sala').value; // valor do select
    const destinatario = document.getElementById('destinatario').value.trim();

    if (!nome || !phone || !message || !sala || !destinatario) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return false;
    }

    // Verifica se o número de telefone é válido 
    const phonePattern = /^\(\d{2}\) \d{5}-\d{4}$/;
    if (!phonePattern.test(phone)) {
        alert('Por favor, insira um número de telefone válido.');
        return false;
    }

    if (!selectedChoice) {
        alert('Por favor, selecione uma das opções.');
        return false;
    }

    return true;
}

function handleSubmit(event) {
    event.preventDefault();

    if (validateForm()) {
        const formData = {
            nome: document.getElementById('nome').value,
            phone: document.getElementById('phone').value,
            message: document.getElementById('message').value,
            sala: document.getElementById('sala').value, // Enviar sala selecionada
            destinatario: document.getElementById('destinatario').value,
            choice: selectedChoice
        };

        // Faz uma requisição POST para enviar os dados ao backend
        fetch('/api/enviarMensagem', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao enviar a mensagem');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    // Redireciona para a página de confirmação
                    window.location.href = '/confirmacao';
                } else {
                    alert('Erro ao enviar a mensagem. Tente novamente.');
                }
            })
            .catch(error => {
                console.error('Erro:', error);
                alert('Erro ao enviar a mensagem. Tente novamente.');
            });
    }
}

function selectChoice(choice) {
    selectedChoice = choice;
    document.querySelectorAll('.choice').forEach(img => {
        img.classList.remove('selected');
    });
    document.getElementById(choice).classList.add('selected');
}

window.onload = function () {
    const textarea = document.getElementById('message');
    const charCount = document.getElementById('char-count');

    textarea.addEventListener('input', () => {
        charCount.textContent = `${textarea.value.length}/200 caracteres`;
    });
}