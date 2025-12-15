// settings.js
import ConfigManager from './config.js';

// Elementos del DOM
const modal = document.getElementById('settings-modal');
const btnOpen = document.getElementById('btn-open-settings');
const btnClose = document.getElementById('btn-close-settings');
const btnCancel = document.getElementById('btn-cancel-settings');
const btnSave = document.getElementById('btn-save-settings');

const inputLat = document.getElementById('input-lat');
const inputLng = document.getElementById('input-lng');
const inputMinRain = document.getElementById('input-min-rain');
const inputOptRain = document.getElementById('input-opt-rain');
const inputPerfRain = document.getElementById('input-perf-rain');
const inputForecastDays = document.getElementById('input-forecast-days');
const inputFollowupRain = document.getElementById('input-followup-rain');

let map = null;
let marker = null;

/**
 * Inicializa el mapa de Leaflet
 */
function initMap(lat, lng) {
    if (map) return; // Ya inicializado

    // Esperar a que el modal sea visible para que Leaflet calcule bien el tamaño
    setTimeout(() => {
        map = L.map('map').setView([lat, lng], 9);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        marker = L.marker([lat, lng], { draggable: true }).addTo(map);

        // Click en el mapa mueve el marcador
        map.on('click', function (e) {
            updateMarker(e.latlng.lat, e.latlng.lng);
        });

        // Arrastrar marcador actualiza inputs
        marker.on('dragend', function (e) {
            const { lat, lng } = marker.getLatLng();
            updateInputs(lat, lng);
        });
    }, 100);
}

function updateMarker(lat, lng) {
    if (marker) {
        marker.setLatLng([lat, lng]);
    }
    updateInputs(lat, lng);
}

function updateInputs(lat, lng) {
    inputLat.value = parseFloat(lat).toFixed(4);
    inputLng.value = parseFloat(lng).toFixed(4);
}

/**
 * Abre el modal y carga datos actuales
 */
function openSettings() {
    const config = ConfigManager.get();

    // Cargar valores en inputs
    inputLat.value = config.LATITUDE;
    inputLng.value = config.LONGITUDE;

    inputMinRain.value = config.THRESHOLDS.MINIMUM;
    inputOptRain.value = config.THRESHOLDS.OPTIMAL;
    inputPerfRain.value = config.THRESHOLDS.PERFECT;

    inputForecastDays.value = config.FORECAST_CRITERIA.FORECAST_DAYS || 7;
    inputFollowupRain.value = config.FORECAST_CRITERIA.MIN_FOLLOW_UP_RAIN || 5.0;

    // Mostrar modal
    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden'); // Evitar scroll en body

    // Inicializar o actualizar mapa
    if (!map) {
        initMap(config.LATITUDE, config.LONGITUDE);
    } else {
        map.invalidateSize(); // Recalcular tamaño por si acaso
        map.setView([config.LATITUDE, config.LONGITUDE], 9);
        updateMarker(config.LATITUDE, config.LONGITUDE);
    }
}

/**
 * Cierra el modal sin guardar
 */
function closeSettings() {
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
}

/**
 * Guarda la configuración
 */
function saveSettings() {
    const newConfig = {
        LATITUDE: parseFloat(inputLat.value),
        LONGITUDE: parseFloat(inputLng.value),
        THRESHOLDS: {
            MINIMUM: parseFloat(inputMinRain.value),
            OPTIMAL: parseFloat(inputOptRain.value),
            PERFECT: parseFloat(inputPerfRain.value)
        },
        FORECAST_CRITERIA: {
            // Mantenemos los antiguos si no están en UI (aunque podríamos cargarlos)
            // Ideally, we should load current first then merge, but ConfigManager.save does a merge logic too.
            // But verify nested merge in ConfigManager.
            FORECAST_DAYS: parseInt(inputForecastDays.value),
            MIN_FOLLOW_UP_RAIN: parseFloat(inputFollowupRain.value)
        }
    };

    // Validaciones básicas
    if (isNaN(newConfig.LATITUDE) || isNaN(newConfig.LONGITUDE)) {
        alert("Por favor, introduce coordenadas válidas.");
        return;
    }

    ConfigManager.save(newConfig);
    closeSettings();
}

// Event Listeners
btnOpen.addEventListener('click', openSettings);
btnClose.addEventListener('click', closeSettings);
btnCancel.addEventListener('click', closeSettings);
btnSave.addEventListener('click', saveSettings);

// Sincronizar inputs manuales con marcador
inputLat.addEventListener('change', () => {
    if (marker) updateMarker(inputLat.value, inputLng.value);
});
inputLng.addEventListener('change', () => {
    if (marker) updateMarker(inputLat.value, inputLng.value);
});
