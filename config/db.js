import { MongoClient } from "mongodb";

const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/fittrack";

let dbInstance = null;

export async function connectToMongo() {
    try {
        const client = new MongoClient(MONGO_URI);
        await client.connect();
        dbInstance = client.db();
        console.log("✅ Conectado a MongoDB correctamente desde MCP Server (Capa Config)");
        return dbInstance;
    } catch (e) {
        console.error("❌ Error conectando a MongoDB en MCP Server:", e);
        return null;
    }
}

export function getDb() {
    return dbInstance;
}
