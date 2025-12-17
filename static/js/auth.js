// Конфигурация API
const API_BASE_URL = '';
const AUTH_ENDPOINTS = {
    REGISTER: `${API_BASE_URL}/auth/register`,
    LOGIN: `${API_BASE_URL}/auth/login`
};

// Управление формами
document.addEventListener('DOMContentLoaded', function() {
    // Переключение между формами
    const switchButtons = document.querySelectorAll('.switch-form');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    switchButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('data-target');

            if (target === 'register') {
                loginForm.classList.add('hidden');
                registerForm.classList.remove('hidden');
            } else {
                registerForm.classList.add('hidden');
                loginForm.classList.remove('hidden');
            }
        });
    });

    // Обработка формы регистрации
    const registerFormElement = document.getElementById('registerForm');
    registerFormElement.addEventListener('submit', handleRegister);

    // Обработка формы входа
    const loginFormElement = document.getElementById('loginForm');
    loginFormElement.addEventListener('submit', handleLogin);
});

// Функция для отображения уведомлений
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.remove('hidden');

    // Автоматическое скрытие уведомления через 5 секунд
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 5000);
}

// Обработка регистрации
async function handleRegister(e) {
    e.preventDefault();

    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    // Валидация
    if (!name || !email || !password) {
        showNotification('Пожалуйста, заполните все поля', 'error');
        return;
    }

    if (password.length < 6) {
        showNotification('Пароль должен содержать минимум 6 символов', 'error');
        return;
    }

    const submitBtn = e.target.querySelector('.btn-submit');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Регистрация...</span>';
    submitBtn.disabled = true;

    try {
        const response = await fetch(AUTH_ENDPOINTS.REGISTER, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                email: email,
                password: password
            })
        });

        const data = await response.json();

        if (response.status === 409) {
            showNotification(data.detail || 'Пользователь с таким email уже существует', 'error');
        } else if (response.status === 200) {
            showNotification('Регистрация успешна! Теперь вы можете войти.', 'success');

            // Очистка формы
            document.getElementById('registerForm').reset();

            // Переключение на форму входа
            document.getElementById('register-form').classList.add('hidden');
            document.getElementById('login-form').classList.remove('hidden');

            // Автозаполнение email в форме входа
            document.getElementById('loginEmail').value = email;
        } else {
            showNotification('Произошла ошибка при регистрации', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('Ошибка соединения с сервером', 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Обработка входа
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // Валидация
    if (!email || !password) {
        showNotification('Пожалуйста, заполните все поля', 'error');
        return;
    }

    const submitBtn = e.target.querySelector('.btn-submit');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Вход...</span>';
    submitBtn.disabled = true;

    try {
        const response = await fetch(AUTH_ENDPOINTS.LOGIN, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password
            }),
            credentials: 'include'
        });

        const data = await response.json();

        if (response.status === 200 && data.access_token) {
            showNotification('Вход успешен! Перенаправление...', 'success');

            // Редирект на главную страницу
            setTimeout(() => {
                window.location.href = '/web';
            }, 1000);
        } else {
            showNotification('Неверный email или пароль', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Ошибка соединения с сервером', 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}