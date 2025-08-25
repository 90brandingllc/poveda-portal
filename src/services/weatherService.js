// Weather service using OpenWeatherMap API
// Free tier: 1000 calls/day, current weather + 5-day forecast
// Smart caching to minimize API calls

const API_KEY = process.env.REACT_APP_WEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Cache configuration
const CACHE_DURATION = {
  CURRENT_WEATHER: 30 * 60 * 1000, // 30 minutes
  FORECAST: 2 * 60 * 60 * 1000     // 2 hours
};

// In-memory cache
let weatherCache = {
  currentWeather: null,
  forecast: null,
  lastUpdated: {
    currentWeather: null,
    forecast: null
  },
  lastLocation: null,
  lastAppointmentDates: []
};

export const weatherService = {
  // Get current weather by coordinates
  async getCurrentWeather(lat, lon) {
    try {
      // Check if API key is configured
      if (!API_KEY) {
        console.warn('⚠️ Weather API key not configured');
        return null;
      }

      const currentLocation = `${lat},${lon}`;
      const now = Date.now();
      
      // Check if we have cached data that's still valid
      if (
        weatherCache.currentWeather &&
        weatherCache.lastUpdated.currentWeather &&
        weatherCache.lastLocation === currentLocation &&
        (now - weatherCache.lastUpdated.currentWeather) < CACHE_DURATION.CURRENT_WEATHER
      ) {
        console.log('🔄 Using cached current weather data');
        return weatherCache.currentWeather;
      }
      
      console.log('🌐 Fetching fresh current weather data from API');
      const response = await fetch(
        `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Weather API error:', response.status, errorText);
        throw new Error(`Weather API error: ${response.status}`);
      }
      
      const data = await response.json();
      const weatherData = {
        temperature: Math.round(data.main.temp),
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        location: data.name,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        feelsLike: Math.round(data.main.feels_like)
      };
      
      // Cache the data
      weatherCache.currentWeather = weatherData;
      weatherCache.lastUpdated.currentWeather = now;
      weatherCache.lastLocation = currentLocation;
      
      return weatherData;
    } catch (error) {
      console.error('Error fetching current weather:', error);
      // Return cached data if available, even if expired
      return weatherCache.currentWeather || null;
    }
  },

  // Get 5-day forecast by coordinates
  async getForecast(lat, lon, appointmentDates = []) {
    try {
      // Check if API key is configured
      if (!API_KEY) {
        console.warn('⚠️ Weather API key not configured');
        return [];
      }

      const currentLocation = `${lat},${lon}`;
      const now = Date.now();
      const sortedAppointmentDates = [...appointmentDates].sort();
      
      // Check if we have cached data that's still valid
      const appointmentDatesChanged = JSON.stringify(sortedAppointmentDates) !== JSON.stringify(weatherCache.lastAppointmentDates);
      
      if (
        weatherCache.forecast &&
        weatherCache.lastUpdated.forecast &&
        weatherCache.lastLocation === currentLocation &&
        !appointmentDatesChanged &&
        (now - weatherCache.lastUpdated.forecast) < CACHE_DURATION.FORECAST
      ) {
        console.log('🔄 Using cached forecast data');
        return weatherCache.forecast;
      }
      
      console.log('🌐 Fetching fresh forecast data from API');
      const response = await fetch(
        `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
      );
      
      if (!response.ok) {
        throw new Error('Forecast data not available');
      }
      
      const data = await response.json();
      const forecastData = data.list.map(item => ({
        date: new Date(item.dt * 1000),
        temperature: Math.round(item.main.temp),
        description: item.weather[0].description,
        icon: item.weather[0].icon,
        humidity: item.main.humidity,
        windSpeed: item.wind.speed
      }));
      
      // Cache the data
      weatherCache.forecast = forecastData;
      weatherCache.lastUpdated.forecast = now;
      weatherCache.lastLocation = currentLocation;
      weatherCache.lastAppointmentDates = sortedAppointmentDates;
      
      return forecastData;
    } catch (error) {
      console.error('Error fetching forecast:', error);
      // Return cached data if available, even if expired
      return weatherCache.forecast || [];
    }
  },

  // Get weather for specific date from forecast
  getWeatherForDate(forecast, targetDate) {
    const target = new Date(targetDate);
    const targetDateString = target.toDateString();
    
    // Find forecast entries for the target date
    const dayForecasts = forecast.filter(item => 
      item.date.toDateString() === targetDateString
    );
    
    if (dayForecasts.length === 0) return null;
    
    // Return midday forecast (around 12:00) if available, otherwise first entry
    const middayForecast = dayForecasts.find(item => 
      item.date.getHours() >= 12 && item.date.getHours() <= 15
    );
    
    return middayForecast || dayForecasts[0];
  },

  // Get user's location using browser geolocation
  async getUserLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          // Fallback to a default location (e.g., New York)
          console.warn('Geolocation error, using default location:', error);
          resolve({
            lat: 40.7128,
            lon: -74.0060
          });
        },
        {
          timeout: 10000,
          enableHighAccuracy: false
        }
      );
    });
  },

  // Get weather icon URL
  getIconUrl(iconCode) {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  },

  // Clear cache (useful for debugging or forced refresh)
  clearCache() {
    weatherCache = {
      currentWeather: null,
      forecast: null,
      lastUpdated: {
        currentWeather: null,
        forecast: null
      },
      lastLocation: null,
      lastAppointmentDates: []
    };
    console.log('🗑️ Weather cache cleared');
  },

  // Get cache status (for debugging)
  getCacheStatus() {
    const now = Date.now();
    return {
      currentWeather: {
        cached: !!weatherCache.currentWeather,
        age: weatherCache.lastUpdated.currentWeather ? now - weatherCache.lastUpdated.currentWeather : null,
        expires: weatherCache.lastUpdated.currentWeather ? CACHE_DURATION.CURRENT_WEATHER - (now - weatherCache.lastUpdated.currentWeather) : null
      },
      forecast: {
        cached: !!weatherCache.forecast,
        age: weatherCache.lastUpdated.forecast ? now - weatherCache.lastUpdated.forecast : null,
        expires: weatherCache.lastUpdated.forecast ? CACHE_DURATION.FORECAST - (now - weatherCache.lastUpdated.forecast) : null
      },
      location: weatherCache.lastLocation,
      appointmentDates: weatherCache.lastAppointmentDates
    };
  }
};
