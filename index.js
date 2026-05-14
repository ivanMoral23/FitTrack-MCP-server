import express from "express";
import cors from "cors";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

// Import modules
import { connectToMongo } from "./config/db.js";
import { TOOLS_SCHEMAS } from "./schemas/toolsSchemas.js";
import { ToolController } from "./controllers/ToolController.js";

const app = express();
app.use(cors());

// Conectar a MongoDB via config
connectToMongo();

// Inicializar Servidor MCP
const server = new Server(
    { name: "FitTrack-Server", version: "1.0.0" },
    { capabilities: { tools: {} } }
);

// Registrar Schemas
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS_SCHEMAS };
});

// Registrar Manejadores (Delegado a ToolController)
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    return await ToolController.handleToolCall(name, args);
});

// Exponer Transporte SSE
let activeTransport = null;

app.get("/sse", async (req, res) => {
    console.log("Nueva conexión SSE establecida con el Cliente MCP");
    activeTransport = new SSEServerTransport("/message", res);
    await server.connect(activeTransport);
});

app.post("/message", async (req, res) => {
    if (activeTransport) {
        await activeTransport.handlePostMessage(req, res);
    } else {
        res.status(503).send("El transporte MCP no está inicializado");
    }
});

// Arrancar express
const PORT = process.env.PORT || 8083;

app.listen(PORT, () => {
    console.log(`🚀 MCP Server corriendo en http://localhost:${PORT}`);
    console.log(`Conexión SSE disponible en http://localhost:${PORT}/sse`);
});
