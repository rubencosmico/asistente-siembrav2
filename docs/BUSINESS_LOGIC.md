# Lógica de Negocio y Reglas

Este documento detalla la lógica de toma de decisiones utilizada por el **Asistente de Siembra Inteligente**. El sistema evalúa la disponibilidad de humedad del suelo basándose en las precipitaciones recientes y los pronósticos futuros para recomendar ventanas de siembra.

## Conceptos Clave

### 1. Lluvia Acumulada (Reserva del Suelo)
El sistema calcula la precipitación total acumulada durante los **últimos 7 días**. Esta métrica sirve como indicador indirecto de la saturación de humedad del suelo.
- **Variable**: `sevenDayTotal`
- **Fuente**: Open-Meteo `daily.precipitation_sum` (últimos 7 días).

### 2. Lluvia de Seguimiento (Garantía de Supervivencia)
El sistema analiza el pronóstico para los **próximos 7 días** para identificar el "Día de la Próxima Lluvia".
- **Definición de Día de Lluvia**:
    - Suma de Precipitación > **1.0 mm**
    - Y Probabilidad de Precipitación > **30%**
- **Variable**: `daysToNextRain` (Índice calculado del primer día coincidente + 1).

## Motor de Reglas de Recomendación

El sistema clasifica las condiciones en 4 niveles de viabilidad basados en `sevenDayTotal` y `daysToNextRain`.

### Matriz de Decisión

| Lluvia Acumulada (Últimos 7 Días) | Condición de Lluvia de Seguimiento | Nivel de Viabilidad | Título de Estado | Lógica / Razonamiento |
| :--- | :--- | :--- | :--- | :--- |
| **>= 90 mm** | Cualquiera | 🟦 **Azul** | **Ventana Perfecta** | Saturación profunda del suelo lograda. Condiciones ideales independientemente del pronóstico inmediato. (Se añade advertencia si no hay lluvia en >7 días). |
| **>= 70 mm** | Cualquiera | 🟩 **Verde** | **Ventana Óptima** | Humedad suficiente para alcanzar capas profundas. (Se añade nota de riesgo si no hay lluvia en >10 días). |
| **>= 40 mm** | Lluvia en ≤ 5 días | 🟢 **Esmeralda** | **Ventana Favorable** | Existe humedad superficial. La lluvia de seguimiento asegura la supervivencia de la plántula. |
| **>= 40 mm** | No hay lluvia en 5 días | 🟡 **Amarillo** | **Ventana Arriesgada** | Existe humedad superficial pero alto riesgo de desecación debido a la falta de lluvia de seguimiento inmediata. |
| **< 40 mm** | Cualquiera | 🔴 **Rojo** | **No Viable** | Humedad acumulada insuficiente. No se recomienda la siembra. |

### Diagrama de Flujo Lógico

```mermaid
flowchart TD
    Start[Inicio del Análisis] --> FetchAPI[Consulta API Open-Meteo]
    
    subgraph DataSources [Fuentes de Datos]
        direction TB
        API_Hist[Histórico 7 Días]
        API_Fore[Pronóstico 7 Días]
    end
    
    FetchAPI -.-> API_Hist
    FetchAPI -.-> API_Fore
    
    API_Hist --> CalcRain[Calcular Lluvia Acumulada]
    API_Fore --> CheckForecast[Analizar Pronóstico Futuro]
    
    CalcRain --> Check90{Lluvia >= 90mm?}
    
    Check90 -- Sí --> ResBlue[resultado: VENTANA PERFECTA 🟦]
    Check90 -- No --> Check70{Lluvia >= 70mm?}
    
    Check70 -- Sí --> ResGreen[resultado: VENTANA ÓPTIMA 🟩]
    Check70 -- No --> Check40{Lluvia >= 40mm?}
    
    Check40 -- No --> ResRed[resultado: NO VIABLE 🔴]
    Check40 -- Sí --> CheckForecast
    
    CheckForecast -- Lluvia Prevista --> ResEmerald[resultado: VENTANA FAVORABLE 🟢]
    CheckForecast -- Sin Lluvia --> ResYellow[resultado: VENTANA ARRIESGADA 🟡]
    
    ResBlue --> Details[Generar Texto de Detalles]
    ResGreen --> Details
    ResEmerald --> Details
    ResYellow --> Details
    ResRed --> Details
    
    Details --> Render[Renderizar Panel]
    
    style DataSources fill:#f0f8ff,stroke:#5d8aa8,stroke-dasharray: 5 5
    style FetchAPI fill:#fff3cd,stroke:#ffc107
```

## Contexto del Perfil del Suelo (Reglas Estáticas)

La aplicación asume características específicas del suelo para el área objetivo (Elche, Alicante):
- **Tipo**: Aridisol.
- **Rasgos**: Baja materia orgánica, acumulación de sales (carbonatos), riesgo de costra superficial.
- **Implicación**: Las altas tasas de evaporación hacen que la "Lluvia de Seguimiento" sea crítica para escenarios de acumulación media (40-70mm). La acumulación baja (<40mm) se rechaza porque probablemente se evapore antes de alcanzar la profundidad de la raíz.

## Restricciones de Datos y API
- **Ubicación**: Codificada (hardcoded) a `Lat: 38.27`, `Lon: -0.70`.
- **API**: Open-Meteo V1.
- **A prueba de fallos**: Si la API falla, muestra mensaje de error; no almacena en caché resultados anteriores (sin estado).
