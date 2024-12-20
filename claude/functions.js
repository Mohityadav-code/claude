async function getWeather({ location, unit = "celsius" }) {
  console.log(`Getting weather for ${location} in ${unit}`);
  const data = {
    temperature: Math.floor(Math.random() * 30),
    unit: unit,
    conditions: ["sunny", "cloudy", "rainy"][Math.floor(Math.random() * 3)],
    location: location,
  };
  console.log(`Weather data for ${location}:`, data);
  return data;
}

async function getForecast({ location, unit = "celsius", days = 3 }) {
  console.log(`Getting ${days}-day forecast for ${location} in ${unit}`);
  const data = {
    temperature: Math.floor(Math.random() * 30),
    unit: unit,
    conditions: ["partly cloudy", "scattered showers", "clear"][
      Math.floor(Math.random() * 3)
    ],
    location: location,
    forecast_days: days,
  };
  console.log(`Forecast data for ${location}:`, data);
  return data;
}

module.exports = { getWeather, getForecast };
