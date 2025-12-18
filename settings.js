// settings.js
import ConfigManager from './config.js';

// Elementos del DOM Genéricos
const modal = document.getElementById('settings-modal');
const btnOpen = document.getElementById('btn-open-settings');
const btnClose = document.getElementById('btn-close-settings');
const btnCancel = document.getElementById('btn-cancel-settings');
const btnSave = document.getElementById('btn-save-settings');

// Elementos de Configuración General
const inputLat = document.getElementById('input-lat');
const inputLng = document.getElementById('input-lng');
const inputMinRain = document.getElementById('input-min-rain');
const inputOptRain = document.getElementById('input-opt-rain');
const inputPerfRain = document.getElementById('input-perf-rain');
const inputForecastDays = document.getElementById('input-forecast-days');
const inputFollowupRain = document.getElementById('input-followup-rain');

// Elementos de Estaciones
const radioSourceMap = document.querySelector('input[name="source-type"][value="map"]');
const radioSourceStation = document.querySelector('input[name="source-type"][value="station"]');
const stationsContainer = document.getElementById('stations-container');
const selectStation = document.getElementById('select-station');
const btnAddStation = document.getElementById('btn-add-station');
const stationForm = document.getElementById('station-form');
const btnCloseStationForm = document.getElementById('btn-close-station-form');
const btnSaveStation = document.getElementById('btn-save-station');

// Campos del formulario de estación
const stationName = document.getElementById('station-name');
const stationLat = document.getElementById('station-lat');
const stationLng = document.getElementById('station-lng');
const stationUrl = document.getElementById('station-url');
const stationFormatCsv = document.querySelector('input[name="station-format"][value="csv"]');
const stationFormatJson = document.querySelector('input[name="station-format"][value="json"]');
const csvOptions = document.getElementById('csv-options');
const stationCsvCol = document.getElementById('station-csv-col');
const jsonOptions = document.getElementById('json-options');
const stationJsonPath = document.getElementById('station-json-path');

let map = null;
let marker = null;
let currentStations = [];
let editingStationId = null; // null si estamos creando, ID si editamos

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
 * Gestiona la visibilidad de opciones según el origen seleccionado
 */
function toggleSourceOptions() {
    if (radioSourceStation.checked) {
        stationsContainer.classList.remove('hidden');
        // Deshabilitar inputs manuales si se quisiera, pero mejor dejarlos visibles
    } else {
        stationsContainer.classList.add('hidden');
    }
}

/**
 * Renderiza la lista de estaciones en el select
 */
function renderStationOptions(selectedId) {
    selectStation.innerHTML = '<option value="">-- Seleccionar --</option>';
    currentStations.forEach(st => {
        const option = document.createElement('option');
        option.value = st.id;
        option.textContent = st.name;
        if (st.id === selectedId) option.selected = true;
        selectStation.appendChild(option);
    });
}

/**
 * Abre el formulario para añadir/editar estación
 */
function openStationForm(station = null) {
    stationForm.classList.remove('hidden');
    btnAddStation.classList.add('hidden'); // Ocultar botón de añadir mientras editamos

    if (station) {
        editingStationId = station.id;
        stationName.value = station.name;
        stationLat.value = station.lat;
        stationLng.value = station.lng;
        stationUrl.value = station.url;

        if (station.format === 'json') {
            stationFormatJson.checked = true;
            stationJsonPath.value = station.mapping || '';
            toggleFormatOptions();
        } else {
            stationFormatCsv.checked = true;
            stationCsvCol.value = station.mapping || '';
            toggleFormatOptions();
        }
    } else {
        editingStationId = null;
        stationName.value = '';
        stationLat.value = inputLat.value; // Por defecto coger la del mapa principal
        stationLng.value = inputLng.value;
        stationUrl.value = '';
        stationFormatCsv.checked = true;
        stationCsvCol.value = 'precipitations'; // Default sensato
        stationJsonPath.value = '';
        toggleFormatOptions();
    }
}

function closeStationForm() {
    stationForm.classList.add('hidden');
    btnAddStation.classList.remove('hidden');
    editingStationId = null;
}

function toggleFormatOptions() {
    if (stationFormatCsv.checked) {
        csvOptions.classList.remove('hidden');
        jsonOptions.classList.add('hidden');
    } else {
        csvOptions.classList.add('hidden');
        jsonOptions.classList.remove('hidden');
    }
}

function saveStationLocal() {
    const name = stationName.value.trim();
    if (!name) {
        alert("El nombre de la estación es obligatorio.");
        return;
    }

    const newStation = {
        id: editingStationId || crypto.randomUUID(), // Generar ID si es nueva
        name: name,
        lat: parseFloat(stationLat.value),
        lng: parseFloat(stationLng.value),
        url: stationUrl.value.trim(),
        format: stationFormatCsv.checked ? 'csv' : 'json',
        mapping: stationFormatCsv.checked ? stationCsvCol.value.trim() : stationJsonPath.value.trim()
    };

    if (editingStationId) {
        // Actualizar existente
        const index = currentStations.findIndex(s => s.id === editingStationId);
        if (index !== -1) currentStations[index] = newStation;
    } else {
        // Añadir nueva
        currentStations.push(newStation);
    }

    // Actualizar select y seleccionar la recién creada/editada
    renderStationOptions(newStation.id);
    selectStation.value = newStation.id;

    closeStationForm();
}

/**
 * Abre el modal y carga datos actuales
 */
function openSettings() {
    const config = ConfigManager.get();

    // Cargar valores generales
    inputLat.value = config.LATITUDE;
    inputLng.value = config.LONGITUDE;
    inputMinRain.value = config.THRESHOLDS.MINIMUM;
    inputOptRain.value = config.THRESHOLDS.OPTIMAL;
    inputPerfRain.value = config.THRESHOLDS.PERFECT;
    inputForecastDays.value = config.FORECAST_CRITERIA.FORECAST_DAYS || 7;
    inputFollowupRain.value = config.FORECAST_CRITERIA.MIN_FOLLOW_UP_RAIN || 5.0;

    // Cargar estaciones
    currentStations = [...(config.STATIONS || [])];

    // Configurar selección de origen
    if (config.SELECTED_STATION_ID) {
        radioSourceStation.checked = true;
    } else {
        radioSourceMap.checked = true;
    }
    toggleSourceOptions();
    renderStationOptions(config.SELECTED_STATION_ID);

    // Mostrar modal
    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');

    // Inicializar o actualizar mapa
    if (!map) {
        initMap(config.LATITUDE, config.LONGITUDE);
    } else {
        map.invalidateSize();
        map.setView([config.LATITUDE, config.LONGITUDE], 9);
        updateMarker(config.LATITUDE, config.LONGITUDE);
    }
}

function closeSettings() {
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
    closeStationForm();
}

/**
 * Guarda la configuración global
 */
function saveSettings() {
    const selectedStationId = radioSourceStation.checked ? selectStation.value : null;

    // Si seleccionó estación, validamos que haya elegido una
    if (radioSourceStation.checked && !selectedStationId) {
        alert("Por favor, selecciona una estación o cambia a 'Usar Coordenadas del Mapa'.");
        return;
    }

    // Actualizamos coordenadas si hay estación seleccionada
    let lat = parseFloat(inputLat.value);
    let lng = parseFloat(inputLng.value);

    // Si usamos estación, también podríamos actualizar LAT/LNG globales para que el mapa principal se centre ahí
    if (selectedStationId) {
        const station = currentStations.find(s => s.id === selectedStationId);
        if (station) {
            lat = station.lat;
            lng = station.lng;
        }
    }

    const newConfig = {
        LATITUDE: lat,
        LONGITUDE: lng,
        THRESHOLDS: {
            MINIMUM: parseFloat(inputMinRain.value),
            OPTIMAL: parseFloat(inputOptRain.value),
            PERFECT: parseFloat(inputPerfRain.value)
        },
        FORECAST_CRITERIA: {
            FORECAST_DAYS: parseInt(inputForecastDays.value),
            MIN_FOLLOW_UP_RAIN: parseFloat(inputFollowupRain.value)
        },
        STATIONS: currentStations,
        SELECTED_STATION_ID: selectedStationId
    };

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
inputLat.addEventListener('change', () => { if (marker) updateMarker(inputLat.value, inputLng.value); });
inputLng.addEventListener('change', () => { if (marker) updateMarker(inputLat.value, inputLng.value); });

// Event Listeners de Estaciones
radioSourceMap.addEventListener('change', toggleSourceOptions);
radioSourceStation.addEventListener('change', toggleSourceOptions);
btnAddStation.addEventListener('click', () => openStationForm());
btnCloseStationForm.addEventListener('click', closeStationForm);
btnSaveStation.addEventListener('click', saveStationLocal);
stationFormatCsv.addEventListener('change', toggleFormatOptions);
stationFormatJson.addEventListener('change', toggleFormatOptions);

// Al cambiar estación en el select, podríamos querer (opcionalmente) ofrecer editarla
// De momento lo dejamos simple: solo añadir nuevas. 
// Para mejorar: añadir botón de "Editar seleccionada" junto al select si hay valor.
