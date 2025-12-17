// Конфигурация API
const API_BASE_URL = '';
const SCOOTERS_ENDPOINT = `${API_BASE_URL}/scooters`;
const AUTH_ENDPOINT = `${API_BASE_URL}/web/auth`;
const LOGOUT_ENDPOINT = `${API_BASE_URL}/auth/logout`;
// Глобальные переменные
let map;
let markers = [];
let currentCity = 'moscow';
let scootersData = [];
let selectedPoint = null;
let cityCoordinates = {
    'moscow': [55.7558, 37.6173],
    'saint-petersburg': [59.9343, 30.3351],
    'kazan': [55.7961, 49.1064],
    'ekaterinburg': [56.8389, 60.6057],
    'novosibirsk': [55.0084, 82.9357],
    'sochi': [43.5855, 39.7231]
};

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    loadScootersData();
    setupEventListeners();
});

// Инициализация карты
function initMap() {
    // Создаем карту с центром в Москве
    map = L.map('map').setView(cityCoordinates[currentCity], 12);

    // Добавляем слой карты
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

    // Скрываем заглушку после загрузки карты
    setTimeout(() => {
        document.getElementById('mapPlaceholder').classList.add('hidden');
    }, 1000);
}

// Загрузка данных о самокатах
async function loadScootersData(city = currentCity) {
    showLoadingState();

    try {
        // В реальном приложении здесь будет запрос к API
        // const response = await fetch(`${SCOOTERS_ENDPOINT}?city=${city}`);
        // const data = await response.json();

        // Имитация задержки запроса
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Тестовые данные
        scootersData = generateMockData(city);

        // Обновляем интерфейс
        updateUIWithData(scootersData);
        updateMapMarkers(scootersData);
        hideLoadingState();

    } catch (error) {
        console.error('Error loading scooters data:', error);
        showNotification('Ошибка при загрузке данных', 'error');
        hideLoadingState();
        // Показываем заглушку с тестовыми данными
        showMockData();
    }
}

// Генерация тестовых данных
function generateMockData(city) {
    const cities = {
        'moscow': 'Москва',
        'saint-petersburg': 'Санкт-Петербург',
        'kazan': 'Казань',
        'ekaterinburg': 'Екатеринбург',
        'novosibirsk': 'Новосибирск',
        'sochi': 'Сочи'
    };

    const points = [];
    const totalPoints = 8 + Math.floor(Math.random() * 8); // 8-15 точек

    for (let i = 1; i <= totalPoints; i++) {
        const baseLat = cityCoordinates[city][0];
        const baseLng = cityCoordinates[city][1];

        // Генерация случайных координат вокруг центра города
        const lat = baseLat + (Math.random() - 0.5) * 0.05;
        const lng = baseLng + (Math.random() - 0.5) * 0.05;

        const availableScooters = Math.floor(Math.random() * 15) + 1;
        const totalScooters = availableScooters + Math.floor(Math.random() * 10);
        const available = availableScooters > 0;

        points.push({
            id: i,
            name: `Точка проката ${i}`,
            address: `ул. Примерная, д. ${i * 10}, ${cities[city]}`,
            coordinates: [lat, lng],
            totalScooters: totalScooters,
            availableScooters: availableScooters,
            available: available,
            batteryLevel: Math.floor(Math.random() * 100),
            status: available ? (availableScooters > 5 ? 'available' : 'low') : 'unavailable'
        });
    }

    return points;
}

// Показать тестовые данные при ошибке
function showMockData() {
    const mockData = generateMockData(currentCity);
    scootersData = mockData;
    updateUIWithData(mockData);
    updateMapMarkers(mockData);
}

// Обновление маркеров на карте
function updateMapMarkers(points) {
    // Очищаем старые маркеры
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    // Добавляем новые маркеры
    points.forEach(point => {
        let iconColor;
        switch (point.status) {
            case 'available':
                iconColor = '#4CAF50'; // Зеленый
                break;
            case 'low':
                iconColor = '#FFC107'; // Желтый
                break;
            default:
                iconColor = '#F44336'; // Красный
        }

        const icon = L.divIcon({
            html: `
                <div class="custom-marker" style="
                    background: ${iconColor};
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    border: 3px solid white;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    font-size: 12px;
                ">
                    ${point.availableScooters}
                </div>
            `,
            className: 'custom-div-icon',
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        });

        const marker = L.marker(point.coordinates, { icon: icon })
            .addTo(map)
            .bindPopup(`
                <div style="padding: 10px;">
                    <h4 style="margin: 0 0 8px 0; color: #333;">${point.name}</h4>
                    <p style="margin: 0 0 8px 0; color: #666; font-size: 13px;">${point.address}</p>
                    <p style="margin: 0 0 8px 0; color: #333;">
                        <strong>Доступно:</strong> ${point.availableScooters} из ${point.totalScooters} самокатов
                    </p>
                    <button onclick="selectPoint(${point.id})" style="
                        background: #6a11cb;
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 13px;
                        width: 100%;
                    ">
                        Подробнее
                    </button>
                </div>
            `);

        marker.on('click', () => {
            selectPoint(point.id);
        });

        markers.push(marker);
    });

    // Масштабируем карту, чтобы показать все маркеры
    if (points.length > 0) {
        const group = new L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

// Обновление интерфейса с данными
function updateUIWithData(points) {
    // Обновляем статистику
    const totalScooters = points.reduce((sum, point) => sum + point.totalScooters, 0);
    const availableScooters = points.reduce((sum, point) => sum + point.availableScooters, 0);
    const chargingScooters = Math.floor(totalScooters * 0.1); // 10% на зарядке
    const inUseScooters = totalScooters - availableScooters - chargingScooters;

    document.getElementById('totalScooters').textContent = totalScooters;
    document.getElementById('availableNow').textContent = availableScooters;
    document.getElementById('inUse').textContent = inUseScooters;
    document.getElementById('charging').textContent = chargingScooters;
    document.getElementById('pointsTotal').textContent = points.length;
    document.getElementById('pointsCount').textContent = `${points.length} точек`;

    // Обновляем список точек
    updatePointsList(points);
}

// Обновление списка точек
function updatePointsList(points) {
    const container = document.getElementById('pointsContainer');
    container.innerHTML = '';

    if (points.length === 0) {
        container.innerHTML = `
            <div class="no-points">
                <i class="fas fa-map-marker-slash"></i>
                <p>В этом городе пока нет точек проката</p>
            </div>
        `;
        return;
    }

    points.forEach(point => {
        const pointElement = document.createElement('div');
        pointElement.className = `point-item ${selectedPoint === point.id ? 'active' : ''}`;
        pointElement.dataset.id = point.id;
        pointElement.innerHTML = `
            <div class="point-header">
                <div class="point-name">${point.name}</div>
                <div class="point-status ${point.status}">
                    ${point.status === 'available' ? 'Доступно' : 
                      point.status === 'low' ? 'Мало' : 'Нет'}
                </div>
            </div>
            <div class="point-details">
                <div class="point-location">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${point.address.split(', ')[0]}</span>
                </div>
                <div class="point-count">
                    <i class="fas fa-scooter"></i>
                    <span>${point.availableScooters}/${point.totalScooters}</span>
                </div>
            </div>
            <div class="point-battery">
                <span>Зарядка:</span>
                <div class="battery-level">
                    <div class="battery-fill" style="width: ${point.batteryLevel}%"></div>
                </div>
                <span>${point.batteryLevel}%</span>
            </div>
        `;

        pointElement.addEventListener('click', () => {
            selectPoint(point.id);
            // Прокручиваем карту к выбранной точке
            map.setView(point.coordinates, 15);
        });

        container.appendChild(pointElement);
    });
}

// Выбор точки
function selectPoint(pointId) {
    selectedPoint = pointId;
    const point = scootersData.find(p => p.id === pointId);

    if (!point) return;

    // Обновляем активный элемент в списке
    document.querySelectorAll('.point-item').forEach(item => {
        item.classList.toggle('active', parseInt(item.dataset.id) === pointId);
    });

    // Показываем детали в правой панели
    showPointDetails(point);

    // Открываем попап на карте
    const marker = markers.find(m => {
        const latlng = m.getLatLng();
        return latlng.lat === point.coordinates[0] && latlng.lng === point.coordinates[1];
    });

    if (marker) {
        marker.openPopup();
    }
}

// Показать детали точки
function showPointDetails(point) {
    const detailsContent = document.getElementById('detailsContent');

    detailsContent.innerHTML = `
        <div class="point-details-view">
            <div class="details-header-info">
                <h4>${point.name}</h4>
                <div class="details-status ${point.status}">
                    ${point.status === 'available' ? 'Доступно для аренды' : 
                      point.status === 'low' ? 'Мало самокатов' : 'Временно недоступно'}
                </div>
            </div>
            
            <div class="details-section">
                <div class="details-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <div>
                        <h5>Адрес</h5>
                        <p>${point.address}</p>
                    </div>
                </div>
                
                <div class="details-item">
                    <i class="fas fa-scooter"></i>
                    <div>
                        <h5>Самокаты</h5>
                        <p>${point.availableScooters} из ${point.totalScooters} доступно</p>
                    </div>
                </div>
                
                <div class="details-item">
                    <i class="fas fa-bolt"></i>
                    <div>
                        <h5>Средний заряд</h5>
                        <p>${point.batteryLevel}%</p>
                    </div>
                </div>
                
                <div class="details-item">
                    <i class="fas fa-clock"></i>
                    <div>
                        <h5>Часы работы</h5>
                        <p>Круглосуточно</p>
                    </div>
                </div>
            </div>
            
            <div class="details-actions">
                <button class="btn-primary" id="rentScooter">
                    <i class="fas fa-scooter"></i>
                    Арендовать самокат
                </button>
                <button class="btn-secondary" id="navigateTo">
                    <i class="fas fa-directions"></i>
                    Проложить маршрут
                </button>
            </div>
            
            <div class="details-map">
                <div id="miniMap"></div>
            </div>
        </div>
    `;

    // Инициализация мини-карты
    const miniMap = L.map('miniMap').setView(point.coordinates, 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(miniMap);
    L.marker(point.coordinates).addTo(miniMap);

    // Обработчики кнопок
    document.getElementById('rentScooter').addEventListener('click', () => {
        showRentModal(point);
    });

    document.getElementById('navigateTo').addEventListener('click', () => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${point.coordinates[0]},${point.coordinates[1]}`;
        window.open(url, '_blank');
    });
}

// Показать модальное окно аренды
function showRentModal(point) {
    const modal = document.getElementById('pointModal');
    const modalBody = document.getElementById('modalBody');

    modalBody.innerHTML = `
        <div class="modal-point-info">
            <div class="modal-point-header">
                <h4>${point.name}</h4>
                <p>${point.address}</p>
            </div>
            
            <div class="modal-stats">
                <div class="modal-stat">
                    <i class="fas fa-scooter"></i>
                    <span>${point.availableScooters} самокатов доступно</span>
                </div>
                <div class="modal-stat">
                    <i class="fas fa-bolt"></i>
                    <span>Средний заряд: ${point.batteryLevel}%</span>
                </div>
            </div>
            
            <div class="modal-form">
                <div class="form-group">
                    <label for="rentDuration">Продолжительность аренды:</label>
                    <select id="rentDuration" class="form-control">
                        <option value="30">30 минут</option>
                        <option value="60">1 час</option>
                        <option value="120">2 часа</option>
                        <option value="180">3 часа</option>
                        <option value="300">5 часов</option>
                        <option value="480">8 часов (весь день)</option>
                    </select>
                </div>
                
                <div class="price-estimate">
                    <h5>Примерная стоимость:</h5>
                    <p class="price" id="estimatedPrice">150 ₽</p>
                    <p class="price-note">Цена зависит от времени аренды</p>
                </div>
                
                <div class="terms-agreement">
                    <label class="checkbox-label">
                        <input type="checkbox" id="agreeTerms">
                        <span class="checkmark"></span>
                        <span>Я согласен с <a href="#">условиями аренды</a></span>
                    </label>
                </div>
            </div>
        </div>
    `;

    modal.classList.add('active');

    // Обновление стоимости при изменении продолжительности
    document.getElementById('rentDuration').addEventListener('change', function() {
        const duration = parseInt(this.value);
        const price = calculatePrice(duration);
        document.getElementById('estimatedPrice').textContent = `${price} ₽`;
    });

    // Обработчик подтверждения аренды
    document.getElementById('confirmRent').addEventListener('click', function() {
        const agreeTerms = document.getElementById('agreeTerms').checked;
        const duration = document.getElementById('rentDuration').value;

        if (!agreeTerms) {
            showNotification('Пожалуйста, примите условия аренды', 'error');
            return;
        }

        // Имитация запроса на аренду
        this.disabled = true;
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Обработка...';

        setTimeout(() => {
            modal.classList.remove('active');
            showNotification('Самокат успешно забронирован!', 'success');
            // Обновляем данные
            loadScootersData(currentCity);
        }, 1500);
    });
}

// Расчет стоимости аренды
function calculatePrice(duration) {
    const basePrice = 100; // 100 рублей за первые 30 минут
    const additionalPrice = Math.ceil((duration - 30) / 30) * 50; // 50 рублей за каждые следующие 30 минут
    return duration <= 30 ? basePrice : basePrice + additionalPrice;
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Выбор города
    document.getElementById('citySelect').addEventListener('change', function() {
        currentCity = this.value;
        const cityName = this.options[this.selectedIndex].text;
        document.getElementById('currentCity').textContent = cityName;
        loadScootersData(currentCity);
    });

    // Кнопка "Мое местоположение"
    document.getElementById('locateMe').addEventListener('click', function() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    const userLatLng = [position.coords.latitude, position.coords.longitude];
                    map.setView(userLatLng, 15);

                    // Добавляем маркер пользователя
                    L.marker(userLatLng, {
                        icon: L.divIcon({
                            html: '<div style="background: #2575fc; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
                            className: 'user-marker',
                            iconSize: [24, 24],
                            iconAnchor: [12, 12]
                        })
                    }).addTo(map).bindPopup('Вы здесь').openPopup();

                    showNotification('Ваше местоположение найдено', 'info');
                },
                error => {
                    console.error('Geolocation error:', error);
                    showNotification('Не удалось определить ваше местоположение', 'error');
                }
            );
        } else {
            showNotification('Геолокация не поддерживается вашим браузером', 'error');
        }
    });

    // Кнопка обновления карты
    document.getElementById('refreshMap').addEventListener('click', () => {
        loadScootersData(currentCity);
    });

    // Закрытие деталей
    document.getElementById('closeDetails').addEventListener('click', () => {
        selectedPoint = null;
        document.querySelectorAll('.point-item').forEach(item => {
            item.classList.remove('active');
        });
        document.getElementById('detailsContent').innerHTML = `
            <div class="no-selection">
                <i class="fas fa-mouse-pointer"></i>
                <h4>Выберите точку на карте</h4>
                <p>Нажмите на маркер или точку в списке, чтобы увидеть подробную информацию</p>
            </div>
        `;
    });

    // Закрытие модального окна
    document.getElementById('closeModal').addEventListener('click', () => {
        document.getElementById('pointModal').classList.remove('active');
    });

    document.getElementById('cancelRent').addEventListener('click', () => {
        document.getElementById('pointModal').classList.remove('active');
    });

    // Выход из системы
    document.getElementById('logout-btn').addEventListener('click', async function(e) {
        e.preventDefault();
        if (confirm('Вы уверены, что хотите выйти?')) {
            // Здесь должен быть запрос на сервер для выхода
            const response = await fetch(LOGOUT_ENDPOINT, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json'
            },
        });
            window.location.href = AUTH_ENDPOINT; // Редирект на страницу авторизации
        }
    });

    // Фильтры
    document.getElementById('filterAvailable').addEventListener('change', applyFilters);
    document.getElementById('filterCharged').addEventListener('change', applyFilters);
    document.getElementById('radiusRange').addEventListener('input', function() {
        document.getElementById('radiusValue').textContent = `${this.value} км`;
        applyFilters();
    });
}

// Применение фильтров
function applyFilters() {
    const showOnlyAvailable = document.getElementById('filterAvailable').checked;
    const showOnlyCharged = document.getElementById('filterCharged').checked;
    const radius = parseFloat(document.getElementById('radiusRange').value);

    let filteredData = scootersData;

    if (showOnlyAvailable) {
        filteredData = filteredData.filter(point => point.available);
    }

    if (showOnlyCharged) {
        filteredData = filteredData.filter(point => point.batteryLevel > 50);
    }

    // Фильтрация по радиусу (имитация)
    if (radius < 5) {
        filteredData = filteredData.slice(0, Math.floor(filteredData.length * (radius / 5)));
    }

    updatePointsList(filteredData);
    updateMapMarkers(filteredData);
}

// Показать состояние загрузки
function showLoadingState() {
    const container = document.getElementById('pointsContainer');
    container.innerHTML = `
        <div class="loading-points">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Загрузка точек...</p>
        </div>
    `;

    document.getElementById('mapPlaceholder').classList.remove('hidden');
}

// Скрыть состояние загрузки
function hideLoadingState() {
    document.getElementById('mapPlaceholder').classList.add('hidden');
}

// Показать уведомление
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.remove('hidden');

    setTimeout(() => {
        notification.classList.add('hidden');
    }, 5000);
}