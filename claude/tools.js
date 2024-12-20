  const tools = [
    {
      name: "get_weather",
      description: `Get the current weather for a location. This tool provides current temperature and weather conditions.
        - When a city is provided without a specific area, it returns weather for the city center
        - Temperature can be returned in either Celsius (default) or Fahrenheit
        - The location parameter should include both city and country/state for accuracy
        - Returns current temperature and general weather conditions`,
      input_schema: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description:
              "City and state/country (e.g., 'Paris, France' or 'San Francisco, CA')",
          },
          unit: {
            type: "string",
            enum: ["celsius", "fahrenheit"],
            description: "Temperature unit (optional, defaults to celsius)",
          },
        },
        required: ["location"],
      },
    },
    {
      name: "get_forecast",
      description: `Get the weather forecast for the next few days.
        - Provides forecast data including temperature and conditions
        - Returns forecast for the next 3 days by default
        - Temperature can be in Celsius or Fahrenheit
        - Location should include city and country/state`,
      input_schema: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "City and state/country",
          },
          unit: {
            type: "string",
            enum: ["celsius", "fahrenheit"],
            description: "Temperature unit (optional, defaults to celsius)",
          },
          days: {
            type: "number",
            description: "Number of days to forecast (optional, defaults to 3)",
            minimum: 1,
            maximum: 7,
          },
        },
        required: ["location"],
      },
    },
  ];
  
  module.exports = { tools };