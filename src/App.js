import React, { useState, useEffect } from 'react';

// --- Íconos de Lucide React para una mejor interfaz ---
const Sun = (props) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></svg>);
const CloudRain = (props) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" /><path d="M16 14v6" /><path d="M8 14v6" /><path d="M12 16v6" /></svg>);
const CalendarDays = (props) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" /><path d="M8 18h.01" /><path d="M12 18h.01" /><path d="M16 18h.01" /></svg>);
const Mountain = (props) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m8 3 4 8 5-5 5 15H2L8 3z" /></svg>);
const BrainCircuit = (props) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 5a3 3 0 1 0-5.993.341" /><path d="M18 8a4 4 0 0 0-8 0" /><path d="M12 13a3 3 0 1 0 .284 5.99" /><path d="M19 13a1 1 0 1 0 2 0" /><path d="M6 13a1 1 0 1 0 2 0" /><path d="M12 21a1 1 0 1 0 0-2" /><path d="M4.03 11.2a1 1 0 0 0-1.933.514" /><path d="M21.9 11.2a1 1 0 0 1-1.933.514" /><path d="M12 5V2" /><path d="M12 12v-2" /><path d="m6.5 12.5-1-1" /><path d="M17.5 12.5 19 14" /><path d="m6.5 14.5-1.34-1.34" /><path d="M18.84 15.84 17.5 14.5" /><path d="m4.5 18.5 1.5-1.5" /><path d="M18 18.5h-2" /><path d="M12 21v-2" /></svg>);

// --- Componente: Indicador de Carga ---
const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center p-8 text-gray-500">
        <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-4 text-lg font-semibold">Consultando datos meteorológicos...</p>
    </div>
);

// --- Componente: Tarjeta de Previsión Diaria ---
const ForecastDay = ({ day, rain, prob }) => (
    <div className="text-center p-3 bg-gray-50 rounded-lg border">
        <p className="font-bold text-gray-800">{day}</p>
        <CloudRain className={`w-8 h-8 mx-auto my-2 ${prob > 20 ? 'text-blue-500' : 'text-gray-400'}`} />
        <p className="text-sm font-semibold">{rain.toFixed(1)} mm</p>
        <p className="text-xs text-gray-500">{prob}% prob.</p>
    </div>
);


// --- Componente: Panel de Control en Tiempo Real ---
const LiveDashboard = () => {
    const [weatherData, setWeatherData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [recommendation, setRecommendation] = useState({
        level: "🔴",
        title: "No Viable",
        details: "No se han alcanzado los umbrales de lluvia.",
        bgColor: "bg-red-100",
        textColor: "text-red-800",
        borderColor: "border-red-500"
    });

    useEffect(() => {
        const fetchWeatherData = async () => {
            setLoading(true);
            const lat = 38.27;
            const lon = -0.70;
            
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&past_days=7&hourly=precipitation&daily=precipitation_sum,precipitation_probability_mean&timezone=Europe/Madrid`;

            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Error HTTP: ${response.status}`);
                }
                const data = await response.json();
                
                // Procesar datos y generar recomendación
                processAndRecommend(data);

            } catch (e) {
                setError("No se pudo cargar la información meteorológica. Por favor, intente de nuevo más tarde.");
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        const processAndRecommend = (data) => {
            // 1. Calcular la lluvia acumulada de los últimos 7 días
            const past7DaysRain = data.daily.precipitation_sum.slice(0, 7);
            const sevenDayTotal = past7DaysRain.reduce((sum, rain) => sum + (rain || 0), 0);

            // 2. Analizar la previsión de los próximos días
            const forecastDays = data.daily.time.slice(7, 14);
            const forecastRain = data.daily.precipitation_sum.slice(7, 14);
            const forecastProb = data.daily.precipitation_probability_mean.slice(7, 14);
            
            let nextRainDayIndex = -1;
            for(let i = 0; i < forecastRain.length; i++) {
                if (forecastRain[i] > 1.0 && forecastProb[i] > 30) {
                    nextRainDayIndex = i;
                    break;
                }
            }
            const daysToNextRain = nextRainDayIndex !== -1 ? nextRainDayIndex + 1 : 99;

            // 3. Motor de Recomendación
            let rec = { ...recommendation };
            if (sevenDayTotal >= 90) {
                rec = { level: "🟦", title: "Ventana Perfecta", bgColor: "bg-blue-100", textColor: "text-blue-800", borderColor: "border-blue-500" };
                rec.details = `Evento de ${sevenDayTotal.toFixed(1)}mm. Saturación profunda del suelo. Ideal para siembra.`;
                if(daysToNextRain > 7) rec.details += " PRECAUCIÓN: No hay lluvias de seguimiento previstas.";
            } else if (sevenDayTotal >= 70) {
                rec = { level: "🟩", title: "Ventana Óptima", bgColor: "bg-green-100", textColor: "text-green-800", borderColor: "border-green-500" };
                rec.details = `Evento de ${sevenDayTotal.toFixed(1)}mm. Humedad suficiente para alcanzar capas profundas.`;
                 if(daysToNextRain > 10) rec.details += " RIESGO: Lluvias de seguimiento lejanas.";
            } else if (sevenDayTotal >= 40) {
                rec = { level: "🟢", title: "Ventana Favorable", bgColor: "bg-emerald-100", textColor: "text-emerald-800", borderColor: "border-emerald-500" };
                rec.details = `Evento de ${sevenDayTotal.toFixed(1)}mm. Humedad superficial conseguida.`;
                if (daysToNextRain <= 5) {
                    rec.details += ` Se esperan lluvias en ${daysToNextRain} día(s).`;
                } else {
                    rec = { level: "🟡", title: "Ventana Arriesgada", bgColor: "bg-yellow-100", textColor: "text-yellow-800", borderColor: "border-yellow-500" };
                    rec.details = `Evento de ${sevenDayTotal.toFixed(1)}mm, pero no hay lluvias de seguimiento cercanas. Alto riesgo de desecación.`
                }
            } else {
                 rec.details = `Lluvia acumulada (${sevenDayTotal.toFixed(1)}mm) insuficiente. Esperando evento de lluvia significativo.`;
            }

            setWeatherData({
                sevenDayTotal,
                forecast: forecastDays.map((time, i) => ({
                    day: new Date(time).toLocaleDateString('es-ES', { weekday: 'short' }),
                    rain: forecastRain[i],
                    prob: forecastProb[i],
                })).slice(0, 5) 
            });
            setRecommendation(rec);
        };
        
        fetchWeatherData();
    }, []);

    if (loading) return <LoadingSpinner />;
    if (error) return <div className="text-center p-8 bg-red-100 text-red-700 rounded-lg">{error}</div>;

    return (
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center text-gray-700">
                <BrainCircuit className="w-7 h-7 mr-3 text-purple-600"/>
                Panel de Control en Tiempo Real
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={`lg:col-span-1 p-6 rounded-lg border-l-4 ${recommendation.borderColor} ${recommendation.bgColor}`}>
                    <p className="font-bold text-lg mb-2 ${recommendation.textColor}">Recomendación Actual:</p>
                    <p className={`text-4xl font-black ${recommendation.textColor} mb-3`}>{recommendation.level} {recommendation.title}</p>
                    <p className={`text-sm ${recommendation.textColor}`}>{recommendation.details}</p>
                </div>

                <div className="lg:col-span-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg border">
                            <p className="text-sm text-gray-600">Lluvia últimos 7 días</p>
                            <p className="text-3xl font-bold text-blue-800">{weatherData?.sevenDayTotal.toFixed(1)} mm</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg border">
                            <p className="text-sm text-gray-600 mb-2">Previsión próximos 5 días</p>
                            <div className="grid grid-cols-5 gap-2">
                                {weatherData?.forecast.map((day, i) => <ForecastDay key={i} {...day} />)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Componentes Históricos (sin cambios) ---
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
const monthsHeaders = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const CalendarCell = ({ value }) => {
    let bgColor, textColor, text;
    switch (value) {
        case "🟦": bgColor = "bg-blue-700"; textColor = "text-white"; text = "Perfecta"; break;
        case "🟩": bgColor = "bg-green-600"; textColor = "text-white"; text = "Óptima"; break;
        case "🟢": bgColor = "bg-green-400"; textColor = "text-green-900"; text = "Favorable"; break;
        case "🟡": bgColor = "bg-yellow-400"; textColor = "text-yellow-900"; text = "Arriesgada"; break;
        case "🔴": bgColor = "bg-red-500"; textColor = "text-white"; text = "No Viable"; break;
        default: bgColor = "bg-gray-200"; textColor = "text-gray-600"; text = "N/D";
    }
    return (<td className={`p-2 text-center text-xs sm:text-sm font-semibold ${bgColor} ${textColor}`}><span className="hidden sm:inline">{text}</span><span className="sm:hidden">{value}</span></td>);
};
const SoilProfileCard = () => (<div className="bg-amber-50 rounded-xl shadow-md p-6 border border-amber-200 mb-8"><h2 className="text-2xl font-bold mb-4 flex items-center text-amber-900"><Mountain className="w-7 h-7 mr-3 text-amber-700"/>Perfil del Suelo: Aridisol (Zona de Elche)</h2><div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-gray-700"><div className="md:col-span-1"><h4 className="font-bold text-lg mb-2">Características Clave:</h4><ul className="list-disc list-inside space-y-1"><li>Baja materia orgánica.</li><li>Acumulación de sales (carbonatos).</li><li>Baja retención de agua.</li><li>Riesgo de costra superficial.</li></ul></div><div className="md:col-span-2"><h4 className="font-bold text-lg mb-2">Implicaciones para la Siembra:</h4><p className="mb-2"><span className="font-bold text-red-600">Siembra Arriesgada (+40mm):</span> Humedad superficial. Viable solo si hay lluvias de seguimiento inminentes.</p><p className="mb-2"><span className="font-bold text-green-700">Siembra Segura (+70mm):</span> La lluvia penetra lo suficiente para superar la zona de alta evaporación, creando una reserva de humedad.</p><p><span className="font-bold text-blue-800">Siembra Perfecta (+90mm):</span> Garantiza una saturación profunda del perfil del suelo. Es la ventana ideal que maximiza las probabilidades de supervivencia a largo plazo.</p></div></div></div>);


// --- Componente principal de la App ---
export default function App() {
    return (
        <div className="bg-gray-100 min-h-screen text-gray-800 font-sans p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8 p-6 bg-white rounded-xl shadow-md border border-gray-200">
                    <h1 className="text-3xl sm:text-4xl font-bold text-green-800 mb-2 flex items-center">
                        <Sun className="w-8 h-8 mr-3 text-yellow-500" />
                        Asistente de Siembra Inteligente
                    </h1>
                    <p className="text-gray-600">
                        Análisis de viabilidad para proyectos de reforestación en climas semiáridos.
                    </p>
                </header>

                <LiveDashboard />

                <SoilProfileCard />

                <main className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200">
                    <h2 className="text-2xl font-bold mb-4 flex items-center text-gray-700">
                        <CalendarDays className="w-7 h-7 mr-3 text-blue-600"/>
                        Calendario Histórico de Oportunidades (2013-2025)
                    </h2>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6 p-4 bg-gray-50 rounded-lg border">
                        <div className="flex items-center"><span className="w-4 h-4 rounded-full bg-blue-700 mr-2"></span>Perfecta</div>
                        <div className="flex items-center"><span className="w-4 h-4 rounded-full bg-green-600 mr-2"></span>Óptima</div>
                        <div className="flex items-center"><span className="w-4 h-4 rounded-full bg-green-400 mr-2"></span>Favorable</div>
                        <div className="flex items-center"><span className="w-4 h-4 rounded-full bg-yellow-400 mr-2"></span>Arriesgada</div>
                        <div className="flex items-center"><span className="w-4 h-4 rounded-full bg-red-500 mr-2"></span>No Viable</div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-200">
                                    <th className="p-3 text-left text-sm font-semibold text-gray-700">Año</th>
                                    {monthsHeaders.map(month => (
                                        <th key={month} className="p-2 text-center text-sm font-semibold text-gray-700">{month}</th>
                                    ))}
                                    <th className="p-3 text-right text-sm font-semibold text-gray-700 flex items-center justify-end">
                                      <CloudRain className="w-5 h-5 mr-2"/>
                                      Total (mm)
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {historicalData.map(data => (
                                    <tr key={data.year} className="border-b border-gray-200 hover:bg-gray-50">
                                        <td className="p-3 font-bold text-gray-800">{data.year}</td>
                                        {data.months.map((monthValue, index) => (
                                            <CalendarCell key={index} value={monthValue} />
                                        ))}
                                        <td className="p-3 text-right font-mono font-bold text-blue-800">{data.total}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </main>
            </div>
        </div>
    );
}