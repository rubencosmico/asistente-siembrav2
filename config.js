// config.js

const DEFAULT_CONFIG = {
    LATITUDE: 38.27,
    LONGITUDE: -0.70,
    TIMEZONE: "Europe/Madrid",
    THRESHOLDS: {
        PERFECT: 90.0,
        OPTIMAL: 70.0,
        MINIMUM: 40.0
    },
    FORECAST_CRITERIA: {
        MIN_RAIN_MM: 1.0,
        MIN_PROBABILITY_PERCENT: 30,
        FORECAST_DAYS: 7, // Días a mirar en el futuro
        MIN_FOLLOW_UP_RAIN: 5.0 // Lluvia acumulada necesaria para considerar "seguimiento"
    }
};

const ConfigManager = {
    /**
     * Carga la configuración desde localStorage o usa los valores por defecto.
     * @returns {Object} Configuración actual.
     */
    get: function () {
        const savedConfig = localStorage.getItem('appConfig');
        if (savedConfig) {
            try {
                // Mezclamos con DEFAULT_CONFIG para asegurar que nuevos campos existan
                // si la estructura guardada es antigua (deep merge simplificado)
                const parsed = JSON.parse(savedConfig);
                return {
                    ...DEFAULT_CONFIG,
                    ...parsed,
                    THRESHOLDS: { ...DEFAULT_CONFIG.THRESHOLDS, ...parsed.THRESHOLDS },
                    FORECAST_CRITERIA: { ...DEFAULT_CONFIG.FORECAST_CRITERIA, ...parsed.FORECAST_CRITERIA }
                };
            } catch (e) {
                console.error("Error al cargar configuración:", e);
                return DEFAULT_CONFIG;
            }
        }
        return DEFAULT_CONFIG;
    },

    /**
     * Guarda la nueva configuración en localStorage.
     * @param {Object} newConfig - Objeto de configuración parcial o completo.
     */
    save: function (newConfig) {
        // Obtenemos la actual para no perder datos que no vengan en newConfig
        const current = this.get();
        const updated = {
            ...current,
            ...newConfig,
            THRESHOLDS: { ...current.THRESHOLDS, ...(newConfig.THRESHOLDS || {}) },
            FORECAST_CRITERIA: { ...current.FORECAST_CRITERIA, ...(newConfig.FORECAST_CRITERIA || {}) }
        };
        localStorage.setItem('appConfig', JSON.stringify(updated));
        // Disparamos un evento custom para que la app sepa que ha cambiado
        window.dispatchEvent(new Event('configChanged'));
    }
};

export default ConfigManager;
