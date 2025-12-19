// settings.js
import ConfigManager from './config.js';

// Elementos del DOM Genéricos
const modal = document.getElementById('settings-modal');
const btnOpen = document.getElementById('btn-open-settings');
const btnClose = document.getElementById('btn-close-settings');
const btnCancel = document.getElementById('btn-cancel-settings');
const btnSave = document.getElementById('btn-save-settings');

// Container de botones globales para ocultarlos
const globalButtonsContainer = btnCancel.parentElement;

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

// Toolbar buttons
const btnAddStation = document.getElementById('btn-add-station');
const btnEditStation = document.getElementById('btn-edit-station');
const btnDeleteStation = document.getElementById('btn-delete-station');

const stationForm = document.getElementById('station-form');
const btnCloseStationForm = document.getElementById('btn-close-station-form');
const btnSaveStation = document.getElementById('btn-save-station');
const formTitle = document.getElementById('form-title');

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
    setTimeout(() => {
        map = L.map('map').setView([lat, lng], 9);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(map);
        marker = L.marker([lat, lng], { draggable: true }).addTo(map);
        map.on('click', e => updateMarker(e.latlng.lat, e.latlng.lng));
        marker.on('dragend', () => {
            const { lat, lng } = marker.getLatLng();
            updateInputs(lat, lng);
        });
        // Render station markers after map is ready
        renderStationMarkers();
    }, 100);
}

function updateMarker(lat, lng) {
    if (marker) marker.setLatLng([lat, lng]);
    updateInputs(lat, lng);
}

function updateInputs(lat, lng) {
    inputLat.value = parseFloat(lat).toFixed(4);
    inputLng.value = parseFloat(lng).toFixed(4);
}

function toggleSourceOptions() {
    if (radioSourceStation.checked) {
        stationsContainer.classList.remove('hidden');
    } else {
        stationsContainer.classList.add('hidden');
    }
}

function renderStationOptions(selectedId) {
    selectStation.innerHTML = '<option value="">-- Seleccionar --</option>';
    currentStations.forEach(st => {
        const option = document.createElement('option');
        option.value = st.id;
        option.textContent = st.name;
        if (st.id === selectedId) option.selected = true;
        selectStation.appendChild(option);
    });
    updateToolbarState();
}

/**
 * Actualiza el estado de los botones de la barra de herramientas según selección
 */
function updateToolbarState() {
    const hasSelection = selectStation.value !== "";
    btnEditStation.disabled = !hasSelection;
    btnDeleteStation.disabled = !hasSelection;
}

/**
 * Lógica para Borrar Estación
 */
function deleteSelectedStation() {
    const id = selectStation.value;
    if (!id) return;

    if (confirm("¿Seguro que quieres borrar esta estación?")) {
        currentStations = currentStations.filter(s => s.id !== id);
        renderStationOptions(""); // Limpiar selección
    }
}

/**
 * Lógica para Editar Estación (pre-rellenar formulario)
 */
function editSelectedStation() {
    const id = selectStation.value;
    if (!id) return;

    const station = currentStations.find(s => s.id === id);
    if (station) {
        openStationForm(station);
    }
}

function openStationForm(station = null) {
    stationForm.classList.remove('hidden');
    btnAddStation.classList.add('hidden');

    // Ocultar botones globales para evitar confusión
    globalButtonsContainer.classList.add('hidden');

    if (station) {
        formTitle.textContent = "Editar Estación";
        editingStationId = station.id;
        stationName.value = station.name;
        stationLat.value = station.lat;
        stationLng.value = station.lng;
        stationUrl.value = station.url;

        if (station.format === 'json') {
            stationFormatJson.checked = true;
            stationJsonPath.value = station.mapping || '';
        } else {
            stationFormatCsv.checked = true;
            stationCsvCol.value = station.mapping || '';
        }
    } else {
        formTitle.textContent = "Nueva Estación";
        editingStationId = null;
        stationName.value = '';
        stationLat.value = inputLat.value;
        stationLng.value = inputLng.value;
        stationUrl.value = '';
        stationFormatCsv.checked = true;
        stationCsvCol.value = 'precipitations';
        stationJsonPath.value = '';
    }
    toggleFormatOptions();

    // Scroll to form to ensure user sees it
    stationForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function closeStationForm() {
    stationForm.classList.add('hidden');
    btnAddStation.classList.remove('hidden');
    // Mostrar botones globales de nuevo
    globalButtonsContainer.classList.remove('hidden');
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
        id: editingStationId || crypto.randomUUID(),
        name: name,
        lat: parseFloat(stationLat.value),
        lng: parseFloat(stationLng.value),
        url: stationUrl.value.trim(),
        format: stationFormatCsv.checked ? 'csv' : 'json',
        mapping: stationFormatCsv.checked ? stationCsvCol.value.trim() : stationJsonPath.value.trim()
    };

    if (editingStationId) {
        const index = currentStations.findIndex(s => s.id === editingStationId);
        if (index !== -1) currentStations[index] = newStation;
    } else {
        currentStations.push(newStation);
    }

    renderStationOptions(newStation.id);
    // Seleccionar automáticamente la estación recién guardada
    selectStation.value = newStation.id;
    updateToolbarState(); // Actualizar botones después de seleccionar

    closeStationForm();
}

function openSettings() {
    const config = ConfigManager.get();
    inputLat.value = config.LATITUDE;
    inputLng.value = config.LONGITUDE;
    inputMinRain.value = config.THRESHOLDS.MINIMUM;
    inputOptRain.value = config.THRESHOLDS.OPTIMAL;
    inputPerfRain.value = config.THRESHOLDS.PERFECT;
    inputForecastDays.value = config.FORECAST_CRITERIA.FORECAST_DAYS || 7;
    inputFollowupRain.value = config.FORECAST_CRITERIA.MIN_FOLLOW_UP_RAIN || 5.0;

    currentStations = [...(config.STATIONS || [])];

    if (config.SELECTED_STATION_ID) {
        radioSourceStation.checked = true;
    } else {
        radioSourceMap.checked = true;
    }
    toggleSourceOptions();
    renderStationOptions(config.SELECTED_STATION_ID);

    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');

    if (!map) {
        initMap(config.LATITUDE, config.LONGITUDE);
    } else {
        map.invalidateSize();
        map.setView([config.LATITUDE, config.LONGITUDE], 9);
        updateMarker(config.LATITUDE, config.LONGITUDE);
    }

    // Render station markers on the map
    renderStationMarkers();
}

let stationMarkersLayer = null;

function renderStationMarkers() {
    if (!map) return;

    if (stationMarkersLayer) {
        map.removeLayer(stationMarkersLayer);
    }

    const markers = [];
    currentStations.forEach(st => {
        // Red/Green/Blue markers? For now, standard markers with popup
        // Or specific color to differentiate from the selection marker
        // Let's use a custom small circle marker
        const marker = L.circleMarker([st.lat, st.lng], {
            color: 'white',
            fillColor: '#8b5cf6', // Violet for stations
            fillOpacity: 0.9,
            weight: 2,
            radius: 8
        });

        marker.bindPopup(`<b>${st.name}</b><br>Haz clic para usar esta estación`);

        marker.on('click', () => {
            // Select this station
            selectStation.value = st.id;
            radioSourceStation.checked = true;
            toggleSourceOptions();
            updateToolbarState();
            // Also center map?
            // map.setView([st.lat, st.lng], 10);
        });

        markers.push(marker);
    });

    if (markers.length > 0) {
        stationMarkersLayer = L.layerGroup(markers).addTo(map);
    }
}

function closeSettings() {
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
    closeStationForm();
}

function saveSettings() {
    const selectedStationId = radioSourceStation.checked ? selectStation.value : null;

    if (radioSourceStation.checked && !selectedStationId) {
        alert("Por favor, selecciona una estación o cambia a 'Usar Coordenadas del Mapa'.");
        return;
    }

    let lat = parseFloat(inputLat.value);
    let lng = parseFloat(inputLng.value);

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

inputLat.addEventListener('change', () => { if (marker) updateMarker(inputLat.value, inputLng.value); });
inputLng.addEventListener('change', () => { if (marker) updateMarker(inputLat.value, inputLng.value); });

radioSourceMap.addEventListener('change', toggleSourceOptions);
radioSourceStation.addEventListener('change', toggleSourceOptions);

// Toolbar Listeners
btnAddStation.addEventListener('click', () => openStationForm());
btnEditStation.addEventListener('click', editSelectedStation);
btnDeleteStation.addEventListener('click', deleteSelectedStation);
selectStation.addEventListener('change', updateToolbarState);

btnCloseStationForm.addEventListener('click', closeStationForm);
btnSaveStation.addEventListener('click', saveStationLocal);
stationFormatCsv.addEventListener('change', toggleFormatOptions);
stationFormatJson.addEventListener('change', toggleFormatOptions);
