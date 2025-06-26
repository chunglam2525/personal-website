'use client';

import { useQuery } from '@tanstack/react-query';

interface WeatherData {
  temp: number;
  condition: string;
  location: string;
  country: string;
}

interface GeolocationCoords {
  latitude: number;
  longitude: number;
}

const getGeolocation = async (): Promise<GeolocationCoords> => {
  // Default fallback coordinates (Hong Kong)
  const fallback = { latitude: 22.4400132399, longitude: 114.022146578 };

  if (!navigator.geolocation) {
    console.warn('Geolocation not supported, using fallback position');
    return fallback;
  }

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 10000,
        enableHighAccuracy: true
      });
    });
    
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    };
  } catch (geoError) {
    console.warn('Geolocation failed, using fallback position:', geoError);
    return fallback;
  }
};

const fetchWeatherData = async (): Promise<WeatherData> => {
  const coords = await getGeolocation();
  const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
  
  if (!API_KEY) {
    throw new Error('OpenWeather API key not found');
  }

  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${coords.latitude}&lon=${coords.longitude}&appid=${API_KEY}&units=metric`
  );

  if (!response.ok) {
    throw new Error('Weather API request failed');
  }

  const data = await response.json();

  return {
    temp: Math.round(data.main.temp),
    condition: data.weather[0].main,
    location: data.name,
    country: data.sys.country
  };
};

export default function WeatherDisplay() {
  const { data: weather, isLoading, isError } = useQuery({
    queryKey: ['weather'],
    queryFn: fetchWeatherData,
    staleTime: 10 * 60 * 1000,
    refetchInterval: 30 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
  });

  const getCountryFlag = (countryCode: string) => {
    return countryCode
      .toUpperCase()
      .replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt(0)));
  };

  return (
    <div className="bg-black text-sm font-medium px-2">
      {(isLoading || isError || !weather) ?
        'Loading...' :
        `${getCountryFlag(weather.country)} ${weather.location} - ${weather.temp}°C ${weather.condition}`
      }
    </div>
  );
}