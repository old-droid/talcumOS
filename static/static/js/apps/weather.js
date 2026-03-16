// Weather JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const locationElement = document.getElementById('location');
    const dateElement = document.getElementById('date');
    const temperatureElement = document.getElementById('temperature');
    const weatherDescriptionElement = document.getElementById('weather-description');
    const humidityElement = document.getElementById('humidity');
    const windElement = document.getElementById('wind');
    const pressureElement = document.getElementById('pressure');
    const weatherIconElement = document.createElement('div');
    weatherIconElement.className = 'weather-icon';
    weatherIconElement.id = 'weather-icon';
    
    // Insert icon element after temperature
    temperatureElement.parentNode.insertBefore(weatherIconElement, temperatureElement.nextSibling);
    
    // Update date/time
    function updateDateTime() {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateElement.textContent = now.toLocaleDateString(undefined, options);
    }
    
    // Get user location based on IP
    function getLocation() {
        // Show loading state
        locationElement.textContent = 'Determining location...';
        
        // Using a free IP geolocation service
        fetch('https://ipapi.co/json/')
            .then(response => {
                if (!response.ok) {
                    throw new Error('IP service unavailable');
                }
                return response.json();
            })
            .then(data => {
                const city = data.city || 'Unknown';
                const region = data.region || '';
                const country = data.country_name || '';
                locationElement.textContent = `${city}, ${region}`;
                
                // Fetch weather data using Open-Meteo API (free, no key required)
                fetchWeatherData(data.latitude, data.longitude, city);
            })
            .catch(error => {
                console.error('Error getting location:', error);
                locationElement.textContent = 'Location unavailable';
                // Use mock data for demo
                fetchWeatherData(40.7128, -74.0060, 'New York');
            });
    }
    
    // Fetch weather data from Open-Meteo API
    function fetchWeatherData(lat, lon, cityName) {
        // Open-Meteo API endpoint
        const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,pressure_msl&timezone=auto`;
        
        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Weather service unavailable');
                }
                return response.json();
            })
            .then(data => {
                updateWeatherDisplay(data, cityName);
            })
            .catch(error => {
                console.error('Error fetching weather:', error);
                showErrorState();
            });
    }
    
    // Update weather display with actual data
    function updateWeatherDisplay(data, cityName) {
        const current = data.current;
        
        // Location already set
        locationElement.textContent = cityName;
        
        // Temperature
        const tempC = Math.round(current.temperature_2m);
        temperatureElement.textContent = `${tempC}°`;
        
        // Weather description based on weather code
        const description = getWeatherDescription(current.weather_code);
        weatherDescriptionElement.textContent = description;
        
        // Weather icon
        const iconClass = getWeatherIconClass(current.weather_code);
        weatherIconElement.className = `weather-icon ${iconClass}`;
        
        // Humidity
        humidityElement.textContent = `${current.relative_humidity_2m}%`;
        
        // Wind
        const windSpeedKmh = current.wind_speed_10m;
        const windSpeedMph = Math.round(windSpeedKmh * 0.621371);
        windElement.textContent = `${windSpeedMph} mph`;
        
        // Pressure
        const pressureHpa = Math.round(current.pressure_msl);
        pressureElement.textContent = `${pressureHpa} hPa`;
    }
    
    // Show error state
    function showErrorState() {
        locationElement.textContent = 'Weather unavailable';
        temperatureElement.textContent = '--°';
        weatherDescriptionElement.textContent = 'Unable to fetch weather data';
        weatherIconElement.className = 'weather-icon error';
        humidityElement.textContent = '--%';
        windElement.textContent = '-- mph';
        pressureElement.textContent = '-- hPa';
    }
    
    // Convert weather code to description
    function getWeatherDescription(code) {
        const descriptions = {
            0: 'Clear sky',
            1: 'Mainly clear',
            2: 'Partly cloudy',
            3: 'Overcast',
            45: 'Foggy',
            48: 'Depositing rime fog',
            51: 'Light drizzle',
            53: 'Moderate drizzle',
            55: 'Dense drizzle',
            56: 'Light freezing drizzle',
            57: 'Dense freezing drizzle',
            61: 'Slight rain',
            63: 'Moderate rain',
            65: 'Heavy rain',
            66: 'Light freezing rain',
            67: 'Heavy freezing rain',
            71: 'Slight snow fall',
            73: 'Moderate snow fall',
            75: 'Heavy snow fall',
            77: 'Snow grains',
            80: 'Slight rain showers',
            81: 'Moderate rain showers',
            82: 'Violent rain showers',
            85: 'Slight snow showers',
            86: 'Heavy snow showers',
            95: 'Thunderstorm',
            96: 'Thunderstorm with slight hail',
            99: 'Thunderstorm with heavy hail'
        };
        
        return descriptions[code] || 'Unknown';
    }
    
    // Get CSS class for weather icon based on code
    function getWeatherIconClass(code) {
        switch (code) {
            case 0: return 'icon-sunny';
            case 1: return 'icon-partly-cloudy';
            case 2: return 'icon-cloudy';
            case 3: return 'icon-cloudy';
            case 45:
            case 48: return 'icon-fog';
            case 51:
            case 53:
            case 55:
            case 56:
            case 57: return 'icon-drizzle';
            case 61:
            case 63:
            case 65:
            case 66:
            case 67: return 'icon-rain';
            case 71:
            case 73:
            case 75:
            case 77: return 'icon-snow';
            case 80:
            case 81:
            case 82: return 'icon-showers';
            case 85:
            case 86: return 'icon-snow-showers';
            case 95:
            case 96:
            case 99: return 'icon-thunderstorm';
            default: return 'icon-unknown';
        }
    }
    
    // Initialize
    updateDateTime();
    setInterval(updateDateTime, 60000); // Update every minute
    getLocation();
    
    // Add CSS for weather icons
    const style = document.createElement('style');
    style.textContent = `
        .weather-icon {
            width: 60px;
            height: 60px;
            margin: 10px auto;
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
        }
        .icon-sunny { background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ffeb3b"><path d="M12 4v2M12 18v2M4.93 6.58l1.42 1.42M17.66 17.66l1.42 1.42M2 12h2M20 12h2M6.34 4.93l1.42-1.42M17.66 6.34l1.42-1.42"/></svg>'); }
        .icon-partly-cloudy { background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2390caf9"><path d="M12 4v2M4.93 6.58l1.42 1.42M17.66 17.66l1.42 1.42M2 12h2M20 12h2M6.34 4.93l1.42-1.42M17.66 6.34l1.42-1.42M5 16h6a2 2 0 0 0 1.99-1.4l.01-.02a2 2 0 0 0-.99-3.4l-.01.02A2 2 0 0 0 11 14h3a4 4 0 0 1-4 4H9a2 2 0 0 0-2 2z"/></svg>'); }
        .icon-cloudy { background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2390caf9"><path d="M12 4v2M4.93 6.58l1.42 1.42M17.66 17.66l1.42 1.42M2 12h2M20 12h2M6.34 4.93l1.42-1.42M17.66 6.34l1.42-1.42M5 16h6a2 2 0 0 0 1.99-1.4l.01-.02a2 2 0 0 0-.99-3.4l-.01.02A2 2 0 0 0 11 14h3a4 4 0 0 1-4 4H9a2 2 0 0 0-2 2z"/></svg>'); }
        .icon-fog { background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23bdbdbd"><path d="M12 4v2M4.93 6.58l1.42 1.42M17.66 17.66l1.42 1.42M2 12h2M20 12h2M6.34 4.93l1.42-1.42M17.66 6.34l1.42-1.42M5 16h6a2 2 0 0 0 1.99-1.4l.01-.02a2 2 0 0 0-.99-3.4l-.01.02A2 2 0 0 0 11 14h3a4 4 0 0 1-4 4H9a2 2 0 0 0-2 2z"/></svg>'); }
        .icon-drizzle { background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%234fc3f7"><path d="M12 4v2M4.93 6.58l1.42 1.42M17.66 17.66l1.42 1.42M2 12h2M20 12h2M6.34 4.93l1.42-1.42M17.66 6.34l1.42-1.42M5 16h6a2 2 0 0 0 1.99-1.4l.01-.02a2 2 0 0 0-.99-3.4l-.01.02A2 2 0 0 0 11 14h3a4 4 0 0 1-4 4H9a2 2 0 0 0-2 2z"/></svg>'); }
        .icon-rain { background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%231976d2"><path d="M12 4v2M4.93 6.58l1.42 1.42M17.66 17.66l1.42 1.42M2 12h2M20 12h2M6.34 4.93l1.42-1.42M17.66 6.34l1.42-1.42M5 16h6a2 2 0 0 0 1.99-1.4l.01-.02a2 2 0 0 0-.99-3.4l-.01.02A2 2 0 0 0 11 14h3a4 4 0 0 1-4 4H9a2 2 0 0 0-2 2z"/></svg>'); }
        .icon-snow { background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ffffff"><path d="M12 4v2M4.93 6.58l1.42 1.42M17.66 17.66l1.42 1.42M2 12h2M20 12h2M6.34 4.93l1.42-1.42M17.66 6.34l1.42-1.42M5 16h6a2 2 0 0 0 1.99-1.4l.01-.02a2 2 0 0 0-.99-3.4l-.01.02A2 2 0 0 0 11 14h3a4 4 0 0 1-4 4H9a2 2 0 0 0-2 2z"/></svg>'); }
        .icon-showers { background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2326a69a"><path d="M12 4v2M4.93 6.58l1.42 1.42M17.66 17.66l1.42 1.42M2 12h2M20 12h2M6.34 4.93l1.42-1.42M17.66 6.34l1.42-1.42M5 16h6a2 2 0 0 0 1.99-1.4l.01-.02a2 2 0 0 0-.99-3.4l-.01.02A2 2 0 0 0 11 14h3a4 4 0 0 1-4 4H9a2 2 0 0 0-2 2z"/></svg>'); }
        .icon-snow-showers { background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ffffff"><path d="M12 4v2M4.93 6.58l1.42 1.42M17.66 17.66l1.42 1.42M2 12h2M20 12h2M6.34 4.93l1.42-1.42M17.66 6.34l1.42-1.42M5 16h6a2 2 0 0 0 1.99-1.4l.01-.02a2 2 0 0 0-.99-3.4l-.01.02A2 2 0 0 0 11 14h3a4 4 0 0 1-4 4H9a2 2 0 0 0-2 2z"/></svg>'); }
        .icon-thunderstorm { background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ff9800"><path d="M12 4v2M4.93 6.58l1.42 1.42M17.66 17.66l1.42 1.42M2 12h2M20 12h2M6.34 4.93l1.42-1.42M17.66 6.34l1.42-1.42M5 16h6a2 2 0 0 0 1.99-1.4l.01-.02a2 2 0 0 0-.99-3.4l-.01.02A2 2 0 0 0 11 14h3a4 4 0 0 1-4 4H9a2 2 0 0 0-2 2z"/></svg>'); }
        .icon-unknown { background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%239e9e9e"><path d="M12 4v2M4.93 6.58l1.42 1.42M17.66 17.66l1.42 1.42M2 12h2M20 12h2M6.34 4.93l1.42-1.42M17.66 6.34l1.42-1.42M5 16h6a2 2 0 0 0 1.99-1.4l.01-.02a2 2 0 0 0-.99-3.4l-.01.02A2 2 0 0 0 11 14h3a4 4 0 0 1-4 4H9a2 2 0 0 0-2 2z"/></svg>'); }
        .error { background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23f44336"><path d="M12 4v2M4.93 6.58l1.42 1.42M17.66 17.66l1.42 1.42M2 12h2M20 12h2M6.34 4.93l1.42-1.42M17.66 6.34l1.42-1.42M5 16h6a2 2 0 0 0 1.99-1.4l.01-.02a2 2 0 0 0-.99-3.4l-.01.02A2 2 0 0 0 11 14h3a4 4 0 0 1-4 4H9a2 2 0 0 0-2 2z"/></svg>'); }
    `;
    document.head.appendChild(style);
});