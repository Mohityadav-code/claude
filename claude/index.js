const { config } = require("./config.js");
const { tools } = require("./tools.js");
const { getWeather, getForecast } = require("./functions.js");
const { userSessions } = require("../../sessionManager.js");

async function makeAnthropicRequest(endpoint, payload) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": config.apiVersion,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Anthropic API Error: ${errorData.error?.message || "Unknown error"}`
    );
  }

  return response.json();
}

async function agent(userQuery,sessionId) {
  const socket = userSessions[sessionId];

  try {
    let conversation = [{ role: "user", content: userQuery }];
    let weatherResults = [];

    while (true) {
      const result = await makeAnthropicRequest(config.baseUrl, {
        model: config.model,
        messages: conversation,
        tools: tools,
        max_tokens: 1024,
        tool_choice: {
          type: "auto",
          disable_parallel_tool_use: true,
        },
      });

      const toolUse = result.content.find((item) => item.type === "tool_use");

      if (!toolUse) {
        // Create final summary
        const summary = `Weather Information Summary:
${weatherResults
  .map(
    (result, index) =>
      `${index + 1}. ${result.location}: ${result.temperature}°${result.unit
        .charAt(0)
        .toUpperCase()}, ${result.conditions}${
        result.forecast_days ? ` (${result.forecast_days}-day forecast)` : ""
      }`
  )
  .join("\n")}`;

        return {
          ...result,
          weatherResults,
          summary,
        };
      }

      try {
        console.log(
          `Executing tool: ${toolUse.name} with input:`,
          toolUse.input
        );
        const weatherData = await executeAgentTools(toolUse);
        weatherResults.push(weatherData);

        const toolResult = formatToolResult(toolUse.id, weatherData);
        socket.emit("assistant_message", {
          content: result.content || "",
        });
        
        conversation.push(
          { role: "assistant", content: result.content },
          { role: "user", content: [toolResult] }
        );
      } catch (toolError) {
        console.error("Tool execution error:", toolError);
        const errorResult = await handleToolError(
          toolUse.id,
          toolError,
          conversation
        );
        return {
          ...errorResult,
          weatherResults,
          error: toolError.message,
        };
      }
    }
  } catch (error) {
    console.error("Error in agent:", error);
    throw error;
  }
}

async function executeAgentTools(toolUse) {
  const toolInput =
    typeof toolUse.input === "string"
      ? JSON.parse(toolUse.input)
      : toolUse.input;

  if (toolUse.name === "get_weather") {
    return await getWeather(toolInput);
  } else if (toolUse.name === "get_forecast") {
    return await getForecast(toolInput);
  }

  throw new Error(`Unknown tool: ${toolUse.name}`);
}

function formatToolResult(toolUseId, data) {
  if (!data) {
    return {
      type: "tool_result",
      tool_use_id: toolUseId,
      content: [{ type: "text", text: "No data available" }],
      is_error: true,
    };
  }

  const text = data.forecast_days
    ? `${data.temperature}°${data.unit.charAt(0).toUpperCase()}, ${
        data.conditions
      } (${data.forecast_days}-day forecast)`
    : `${data.temperature}°${data.unit.charAt(0).toUpperCase()}, ${
        data.conditions
      }`;

  return {
    type: "tool_result",
    tool_use_id: toolUseId,
    content: [{ type: "text", text }],
  };
}

async function handleToolError(toolUseId, error, conversation) {
  const errorResult = await makeAnthropicRequest(config.baseUrl, {
    model: config.model,
    messages: [
      ...conversation,
      {
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: toolUseId,
            content: [{ type: "text", text: `Error: ${error.message}` }],
            is_error: true,
          },
        ],
      },
    ],
    tools: tools,
    max_tokens: 1024,
  });

  return errorResult;
}

async function runExamples() {
  try {
    console.log("Starting weather queries...\n");

    const response = await agent(
      "What's the weather like in Paris? and What's the forecast for Tokyo for the next 5 days? and How hot will it be in New York tomorrow?"
    );

    console.log("\nWeather Results:");
    response.weatherResults.forEach((result) => {
      console.log(JSON.stringify(result, null, 2));
    });

    console.log("\nSummary:");
    console.log(response.summary);

    console.log("\nTool Execution Log:");
    console.log(JSON.stringify(response.content, null, 2));
  } catch (error) {
    console.error("Error running examples:", error);
  }
}

if (require.main === module) {
  runExamples();
}

module.exports = { agent };
