import ConfigManager from './config.js';

// State
let stations = [];
let map;
let markers = {};

// Icons
const iconBase = {
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
};

// Leaflet default markers are weird to colorize without custom images.
// We'll use CSS formatted icons (divIcon) for simple colored dots or standard colored markers if available.
// For now, simpler: standard blue, and maybe changing opacity or using a filter for red/green.
// Actually, let's use a simple SVG placeholder for red/green markers to be precise.
function createMarkerIcon(color) {
    return L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color:${color};" class="marker-pin"></div><i class="material-icons"></i>`,
        iconSize: [30, 42],
        iconAnchor: [15, 42]
    });
}

// Better approach: filter standard marker hue
// Or just standard markers for now + popup status text. 
// Plan said: "Icono del mapa debe mostrar en color rojo o verde".
// Let's use simple colored CircleMarkers for functionality and robustness.
function getMarkerOptions(status) {
    const color = status === 'online' ? '#16a34a' : (status === 'offline' ? '#dc2626' : '#9ca3af');
    return {
        color: 'white',
        fillColor: color,
        fillOpacity: 1,
        weight: 2,
        radius: 12
    };
}

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    loadStations();
    initEventListeners();
});

function initMap() {
    map = L.map('map').setView([38.27, -0.70], 10); // Default Elche
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
}

function loadStations() {
    const config = ConfigManager.get();
    stations = config.STATIONS || [];
    renderList();
    renderMap();
}

async function renderList() {
    const container = document.getElementById('station-list');
    container.innerHTML = '';

    if (stations.length === 0) {
        container.innerHTML = '<div class="p-8 text-center text-gray-400">No hay estaciones guardadas.</div>';
        return;
    }

    for (const station of stations) {
        const item = document.createElement('div');
        item.className = 'p-4 border rounded-lg hover:bg-gray-50 transition cursor-pointer group flex justify-between items-center bg-white';
        item.onclick = () => focusStation(station.id);

        // Status Check (Async)
        // Default unknown
        let statusBadge = `<span class="inline-block w-3 h-3 rounded-full bg-gray-300 mr-2" title="Desconocido"></span>`;

        item.innerHTML = `
            <div>
                <h4 class="font-bold text-gray-800 flex items-center">
                    <span id="status-dot-${station.id}" class="inline-block w-3 h-3 rounded-full bg-gray-300 mr-2 animate-pulse"></span>
                    ${station.name}
                </h4>
            </div>
            <div class="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button class="btn-edit p-2 text-gray-500 hover:text-blue-600" data-id="${station.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="btn-delete p-2 text-gray-500 hover:text-red-600" data-id="${station.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
            </div>
        `;

        container.appendChild(item);

        // Trigger status check without blocking list render
        checkStationStatus(station);
    }

    // Attach event listeners to buttons
    document.querySelectorAll('.btn-edit').forEach(b => b.addEventListener('click', (e) => {
        e.stopPropagation();
        openModal(stations.find(s => s.id === b.dataset.id));
    }));

    document.querySelectorAll('.btn-delete').forEach(b => b.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('¿Seguro que quieres borrar esta estación?')) {
            deleteStation(b.dataset.id);
        }
    }));
}

function renderMap() {
    // Clear existing
    Object.values(markers).forEach(m => map.removeLayer(m));
    markers = {};

    stations.forEach(station => {
        const marker = L.circleMarker([station.lat, station.lng], getMarkerOptions('unknown'));
        marker.bindPopup(`<b>${station.name}</b><br>Lat: ${station.lat}, Lng: ${station.lng}`);
        marker.addTo(map);
        markers[station.id] = marker;
    });

    if (stations.length > 0) {
        const group = new L.featureGroup(Object.values(markers));
        map.fitBounds(group.getBounds().pad(0.2));
    }
}

async function checkStationStatus(station) {
    const dot = document.getElementById(`status-dot-${station.id}`);
    if (!dot) return;

    // Use proxy to define status
    // Hack: Request only 1 day to be fast, or check 200 OK via HEAD? 
    // HEAD isn't always supported by proxy or destination CSV. 
    // Let's do a light fetch.
    const testUrl = station.url
        .replace('{startDate}', new Date().toISOString().split('T')[0])
        .replace('{endDate}', new Date().toISOString().split('T')[0]);

    const proxyUrl = `/api/proxy?url=${encodeURIComponent(testUrl)}`;

    try {
        const res = await fetch(proxyUrl);
        if (res.ok) {
            updateStationStatus(station.id, 'online');
        } else {
            updateStationStatus(station.id, 'offline');
        }
    } catch {
        updateStationStatus(station.id, 'offline');
    }
}

function updateStationStatus(id, status) {
    const dot = document.getElementById(`status-dot-${id}`);
    if (dot) {
        dot.classList.remove('bg-gray-300', 'animate-pulse', 'bg-green-500', 'bg-red-500');
        if (status === 'online') dot.classList.add('bg-green-500');
        else dot.classList.add('bg-red-500');
    }

    // Update map marker
    const marker = markers[id];
    if (marker) {
        marker.setStyle(getMarkerOptions(status));
    }
}

function focusStation(id) {
    const station = stations.find(s => s.id === id);
    if (station && markers[id]) {
        map.flyTo([station.lat, station.lng], 13);
        markers[id].openPopup();
    }
}

// CRUD
function openModal(station = null) {
    const modal = document.getElementById('station-modal');
    const form = document.getElementById('station-form');
    const title = document.getElementById('modal-title');

    form.reset();

    if (station) {
        title.textContent = 'Editar Estación';
        document.getElementById('edit-id').value = station.id;
        document.getElementById('edit-name').value = station.name;
        document.getElementById('edit-lat').value = station.lat;
        document.getElementById('edit-lng').value = station.lng;
        document.getElementById('edit-url').value = station.url;
        document.getElementById('edit-mapping').value = station.mapping || '';
        form.elements['edit-format'].value = station.format;
    } else {
        title.textContent = 'Nueva Estación';
        document.getElementById('edit-id').value = '';
    }

    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('station-modal').classList.add('hidden');
}

function saveStation(e) {
    e.preventDefault();

    const id = document.getElementById('edit-id').value;
    const name = document.getElementById('edit-name').value;
    const lat = parseFloat(document.getElementById('edit-lat').value);
    const lng = parseFloat(document.getElementById('edit-lng').value);
    const url = document.getElementById('edit-url').value;
    const format = document.querySelector('input[name="edit-format"]:checked').value;
    const mapping = document.getElementById('edit-mapping').value;

    const newStation = {
        id: id || Date.now().toString(), // Simple ID gen
        name,
        lat,
        lng,
        url,
        format,
        mapping
    };

    if (id) {
        // Edit
        const idx = stations.findIndex(s => s.id === id);
        if (idx !== -1) stations[idx] = newStation;
    } else {
        // Create
        stations.push(newStation);
    }

    // Persist
    ConfigManager.save({ STATIONS: stations });

    loadStations(); // Reload UI
    closeModal();
}

function deleteStation(id) {
    stations = stations.filter(s => s.id !== id);
    ConfigManager.save({ STATIONS: stations });
    loadStations();
}

// Event Listeners
function initEventListeners() {
    document.getElementById('btn-new-station').addEventListener('click', () => openModal());
    document.getElementById('btn-close-modal').addEventListener('click', closeModal);
    document.getElementById('btn-cancel-modal').addEventListener('click', closeModal);
    document.getElementById('station-form').addEventListener('submit', saveStation);
}
