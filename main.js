// main.js
import ConfigManager from './config.js';

// --- Datos Históricos ---
const historicalData = [
    { year: 2013, months: ["🔴", "🔴", "🟢", "🔴", "🔴", "🔴", "🔴", "🔴", "🔴", "🟢", "🔴", "🔴"], total: 260.4 },
    { year: 2014, months: ["🔴", "🔴", "🟡", "🔴", "🔴", "🔴", "🔴", "🔴", "🟢", "🔴", "🔴", "🔴"], total: 155.4 },
    { year: 2015, months: ["🔴", "🟢", "🔴", "🔴", "🟡", "🔴", "🔴", "🔴", "🔴", "🔴", "🔴", "🔴"], total: 108.6 },
    { year: 2016, months: ["🔴", "🔴", "🔴", "🔴", "🔴", "🔴", "🔴", "🔴", "🔴", "🔴", "🟩", "🟦"], total: 297.8 },
    { year: 2017, months: ["🟢", "🔴", "🟡", "🔴", "🔴", "🔴", "🔴", "🔴", "🔴", "🔴", "🔴", "🟡"], total: 205.2 },
    { year: 2018, months: ["🔴", "🔴", "🟡", "🔴", "🔴", "🔴", "🔴", "🔴", "🟢", "🟦", "🔴", "🔴"], total: 382.6 },
    { year: 2019, months: ["🔴", "🔴", "🔴", "🟢", "🔴", "🔴", "🔴", "🔴", "🟦", "🟡", "🔴", "🟦"], total: 471.2 },
    { year: 2020, months: ["🟢", "🔴", "🟢", "🟢", "🔴", "🔴", "🔴", "🔴", "🔴", "🔴", "🟢", "🔴"], total: 258.4 },
    { year: 2021, months: ["🔴", "🔴", "🟡", "🔴", "🔴", "🔴", "🔴", "🔴", "🟢", "🔴", "🔴", "🔴"], total: 310.0 },
    { year: 2022, months: ["🔴", "🔴", "🟦", "🟢", "🔴", "🔴", "🔴", "🔴", "🔴", "🔴", "🔴", "🔴"], total: 374.0 },
    { year: 2023, months: ["🔴", "🔴", "🔴", "🔴", "🟢", "🔴", "🔴", "🔴", "🔴", "🟡", "🟢", "🔴"], total: 215.8 },
    { year: 2024, months: ["🔴", "🔴", "🟢", "🔴", "🔴", "🔴", "🔴", "🔴", "🟢", "🔴", "🔴", "🔴"], total: 166.4 },
    { year: 2025, months: ["🔴", "🟡", "🟩", "🟢", "🔴", "...", "...", "...", "...", "...", "...", "..."], total: "147.2 (parcial)" },
];

/**
 * Genera el HTML para una celda del calendario histórico
 */
function createCalendarCell(value) {
    let bgColor, textColor, text;
    switch (value) {
        case "🟦": bgColor = "bg-blue-700"; textColor = "text-white"; text = "Perfecta"; break;
        case "🟩": bgColor = "bg-green-600"; textColor = "text-white"; text = "Óptima"; break;
        case "🟢": bgColor = "bg-green-400"; textColor = "text-green-900"; text = "Favorable"; break;
        case "🟡": bgColor = "bg-yellow-400"; textColor = "text-yellow-900"; text = "Arriesgada"; break;
        case "🔴": bgColor = "bg-red-500"; textColor = "text-white"; text = "No Viable"; break;
        default: bgColor = "bg-gray-200"; textColor = "text-gray-600"; text = "N/D";
    }
    return `<td class="p-2 text-center text-xs sm:text-sm font-semibold ${bgColor} ${textColor}"><span class="hidden sm:inline">${text}</span><span class="sm:hidden">${value}</span></td>`;
}

/**
 * Renderiza la tabla histórica
 */
function renderHistoricalTable() {
    const tbody = document.getElementById('historical-table-body');
    if (!tbody) return;

    tbody.innerHTML = historicalData.map(data => `
        <tr class="border-b border-gray-200 hover:bg-gray-50">
            <td class="p-3 font-bold text-gray-800">${data.year}</td>
            ${data.months.map(createCalendarCell).join('')}
            <td class="p-3 text-right font-mono font-bold text-blue-800">${data.total}</td>
        </tr>
    `).join('');
}

/**
 * Genera HTML para un día de pronóstico
 */
function createForecastDay(day, rain, prob) {
    const isProbHigh = prob > 20;
    const probabilityClass = isProbHigh ? 'text-blue-500' : 'text-gray-400';

    // CloudRain Icon SVG string
    const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" class="mx-auto my-2 ${probabilityClass}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" /><path d="M16 14v6" /><path d="M8 14v6" /><path d="M12 16v6" /></svg>`;

    return `
        <div class="text-center p-3 bg-gray-50 rounded-lg border">
            <p class="font-bold text-gray-800">${day}</p>
            ${iconSvg}
            <p class="text-sm font-semibold">${rain.toFixed(1)} mm</p>
            <p class="text-xs text-gray-500">${prob}% prob.</p>
        </div>
    `;
}

/**
 * Lógica principal del Dashboard en tiempo real
 */
export async function initLiveDashboard() {
    const container = document.getElementById('live-dashboard');
    if (!container) return;

    // Mostrar spinner de carga al reiniciar
    container.innerHTML = `
            <div class="flex flex-col items-center justify-center p-8 text-gray-500">
                <svg class="animate-spin -ml-1 mr-3 h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p class="mt-4 text-lg font-semibold">Consultando datos meteorológicos...</p>
            </div>`;

    const config = ConfigManager.get();
    const forecastDaysCount = config.FORECAST_CRITERIA.FORECAST_DAYS || 7;

    // Open-Meteo necesita los días totales (pasados + futuros)
    // Pero la API tiene parámetros separados: 'past_days' y 'forecast_days'.
    // Default forecast_days is 7. We should override it.
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${config.LATITUDE}&longitude=${config.LONGITUDE}&past_days=7&forecast_days=${forecastDaysCount}&hourly=precipitation&daily=precipitation_sum,precipitation_probability_mean&timezone=${config.TIMEZONE}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        const data = await response.json();

        processAndRecommend(data, container, config);

    } catch (e) {
        console.error(e);
        container.innerHTML = `<div class="text-center p-8 bg-red-100 text-red-700 rounded-lg">No se pudo cargar la información meteorológica. Por favor, intente de nuevo más tarde.</div>`;
    }
}

function processAndRecommend(data, container, config) {
    const { THRESHOLDS, FORECAST_CRITERIA } = config;
    const forecastDaysCount = FORECAST_CRITERIA.FORECAST_DAYS || 7;
    const minFollowUpRain = FORECAST_CRITERIA.MIN_FOLLOW_UP_RAIN || 5.0;

    // 1. Calcular Lluvia Acumulada (Últimos 7 Días)
    const past7DaysRain = data.daily.precipitation_sum.slice(0, 7);
    const sevenDayTotal = past7DaysRain.reduce((sum, rain) => sum + (rain || 0), 0);

    // 2. Analizar Pronóstico
    // Los indices 0-6 son pasados (si past_days=7). El índice 7 es hoy/mañana (primer día forecast).
    const forecastStartIndex = 7;
    const forecastEndIndex = forecastStartIndex + forecastDaysCount;

    const forecastDays = data.daily.time.slice(forecastStartIndex, forecastEndIndex);
    const forecastRain = data.daily.precipitation_sum.slice(forecastStartIndex, forecastEndIndex);
    const forecastProb = data.daily.precipitation_probability_mean.slice(forecastStartIndex, forecastEndIndex);

    // Calc Total Forecast Rain (Follow-up Rain)
    const totalForecastRain = forecastRain.reduce((sum, val) => sum + (val || 0), 0);
    const hasFollowUpRain = totalForecastRain >= minFollowUpRain;

    // 3. Motor de Reglas (Actualizado)
    let rec = {
        level: "🔴",
        title: "No Viable",
        details: "No se han alcanzado los umbrales de lluvia.",
        bgColor: "bg-red-100",
        textColor: "text-red-800",
        borderColor: "border-red-500"
    };

    if (sevenDayTotal >= THRESHOLDS.PERFECT) {
        rec = { level: "🟦", title: "Ventana Perfecta", bgColor: "bg-blue-100", textColor: "text-blue-800", borderColor: "border-blue-500" };
        rec.details = `Evento de ${sevenDayTotal.toFixed(1)}mm. Saturación profunda.`;
        if (!hasFollowUpRain) rec.details += ` PRECAUCIÓN: Lluvia de seguimiento escasa (${totalForecastRain.toFixed(1)}mm en ${forecastDaysCount}d).`;

    } else if (sevenDayTotal >= THRESHOLDS.OPTIMAL) {
        rec = { level: "🟩", title: "Ventana Óptima", bgColor: "bg-green-100", textColor: "text-green-800", borderColor: "border-green-500" };
        rec.details = `Evento de ${sevenDayTotal.toFixed(1)}mm. Humedad favorable.`;
        if (!hasFollowUpRain) rec.details += ` RIESGO: Lluvia de seguimiento baja (${totalForecastRain.toFixed(1)}mm en ${forecastDaysCount}d).`;

    } else if (sevenDayTotal >= THRESHOLDS.MINIMUM) {
        rec = { level: "🟢", title: "Ventana Favorable", bgColor: "bg-emerald-100", textColor: "text-emerald-800", borderColor: "border-emerald-500" };
        rec.details = `Evento de ${sevenDayTotal.toFixed(1)}mm. Humedad superficial.`;

        if (hasFollowUpRain) {
            rec.details += ` Lluvia de seguimiento positiva (${totalForecastRain.toFixed(1)}mm en próximos ${forecastDaysCount} días).`;
        } else {
            rec = { level: "🟡", title: "Ventana Arriesgada", bgColor: "bg-yellow-100", textColor: "text-yellow-800", borderColor: "border-yellow-500" };
            rec.details = `Evento de ${sevenDayTotal.toFixed(1)}mm, pero lluvia de seguimiento insuficiente (${totalForecastRain.toFixed(1)}mm < ${minFollowUpRain}mm). Alto riesgo de desecación.`
        }
    } else {
        rec.details = `Lluvia acumulada (${sevenDayTotal.toFixed(1)}mm) insuficiente. Esperando evento de lluvia significativo (>${THRESHOLDS.MINIMUM}mm).`;
    }

    // Renderizar
    const weatherData = {
        sevenDayTotal,
        forecast: forecastDays.map((time, i) => ({
            day: new Date(time).toLocaleDateString('es-ES', { weekday: 'short' }),
            rain: forecastRain[i],
            prob: forecastProb[i],
        })).slice(0, 5) // Mostramos solo 5 en la tarjeta pequeña por espacio
    };

    const brainIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" class="mr-3 text-purple-600" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5a3 3 0 1 0-5.993.341" /><path d="M18 8a4 4 0 0 0-8 0" /><path d="M12 13a3 3 0 1 0 .284 5.99" /><path d="M19 13a1 1 0 1 0 2 0" /><path d="M6 13a1 1 0 1 0 2 0" /><path d="M12 21a1 1 0 1 0 0-2" /><path d="M4.03 11.2a1 1 0 0 0-1.933.514" /><path d="M21.9 11.2a1 1 0 0 1-1.933.514" /><path d="M12 5V2" /><path d="M12 12v-2" /><path d="m6.5 12.5-1-1" /><path d="M17.5 12.5 19 14" /><path d="m6.5 14.5-1.34-1.34" /><path d="M18.84 15.84 17.5 14.5" /><path d="m4.5 18.5 1.5-1.5" /><path d="M18 18.5h-2" /><path d="M12 21v-2" /></svg>`;

    const forecastHtml = weatherData.forecast.map(day => createForecastDay(day.day, day.rain, day.prob)).join('');

    container.innerHTML = `
        <div class="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 mb-8">
            <h2 class="text-2xl font-bold mb-4 flex items-center text-gray-700">
                ${brainIcon}
                Panel de Control en Tiempo Real
            </h2>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Tarjeta de Recomendación -->
                <div class="lg:col-span-1 p-6 rounded-lg border-l-4 ${rec.borderColor} ${rec.bgColor}">
                    <p class="font-bold text-lg mb-2 ${rec.textColor}">Recomendación Actual:</p>
                    <p class="text-4xl font-black ${rec.textColor} mb-3">${rec.level} ${rec.title}</p>
                    <p class="text-sm ${rec.textColor}">${rec.details}</p>
                    <p class="text-xs text-gray-500 mt-4 pt-4 border-t border-gray-300">
                        Ubicación: ${config.LATITUDE.toFixed(2)}, ${config.LONGITUDE.toFixed(2)}
                    </p>
                </div>

                <!-- Datos Numéricos -->
                <div class="lg:col-span-2">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="p-4 bg-gray-50 rounded-lg border">
                            <p class="text-sm text-gray-600">Lluvia últimos 7 días</p>
                            <p class="text-3xl font-bold text-blue-800">${weatherData.sevenDayTotal.toFixed(1)} mm</p>
                        </div>
                        <div class="p-4 bg-gray-50 rounded-lg border">
                            <p class="text-sm text-gray-600 mb-2">Previsión próximos 5 días</p>
                            <div class="grid grid-cols-5 gap-2">
                                ${forecastHtml}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// --- Inicialización ---
document.addEventListener('DOMContentLoaded', () => {
    initLiveDashboard();
    renderHistoricalTable();

    // Escuchar cambios de configuración para recargar el dashboard
    window.addEventListener('configChanged', () => {
        initLiveDashboard();
    });
});
