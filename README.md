# FitTrack MCP Server 🤖

An implementation of the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) that provides specialized fitness and nutrition tools to AI agents.

## 🛠️ Tech Stack
- **Runtime:** Node.js
- **Protocol:** Model Context Protocol (MCP)
- **Database:** MongoDB
- **Transport:** SSE (Server-Sent Events)

## ✨ Available Tools
This server exposes several tools that allow LLMs to interact with the FitTrack ecosystem:
- **Workout Management:** Fetch and analyze training history.
- **Nutrition Insights:** Access calorie and macronutrient data.
- **Personalized Recommendations:** Logic to help agents provide better fitness advice.

## 🚀 Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the server:**
   ```bash
   npm start
   ```

3. **Connection details:**
   By default, the server runs on `http://localhost:8083`.
   The SSE endpoint for MCP clients is `http://localhost:8083/sse`.

## ⚙️ Configuration
You can configure the server using environment variables:
- `PORT`: Server port (default: 8083)
- `MONGODB_URI`: Connection string for MongoDB.

---
*Developed by Iván Moral - 2026*
