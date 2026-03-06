import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import { analyzePatientInput } from "./src/services/gemini.ts";

const db = new Database("mindguard.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT
  );

  CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id TEXT,
    type TEXT, -- 'journal', 'mood', 'voice', 'sos'
    content TEXT,
    sentiment TEXT,
    risk_score INTEGER,
    analysis_json TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id TEXT,
    reason TEXT,
    risk_level TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved INTEGER DEFAULT 0
  );
`);

// Seed data if empty
const patientCount = db.prepare("SELECT COUNT(*) as count FROM patients").get() as { count: number };
if (patientCount.count === 0) {
  db.prepare("INSERT INTO patients (id, name, email) VALUES (?, ?, ?)").run("p1", "John Doe", "john@example.com");
  db.prepare("INSERT INTO patients (id, name, email) VALUES (?, ?, ?)").run("p2", "Jane Smith", "jane@example.com");
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });
  const PORT = 3000;

  app.use(express.json());

  // WebSocket connection handling
  const clients = new Set<WebSocket>();
  wss.on("connection", (ws) => {
    clients.add(ws);
    ws.on("close", () => clients.delete(ws));
  });

  function broadcast(data: any) {
    const message = JSON.stringify(data);
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // API Routes
  app.get("/api/patients", (req, res) => {
    const patients = db.prepare("SELECT * FROM patients").all();
    res.json(patients);
  });

  app.get("/api/patients/:id/history", (req, res) => {
    const history = db.prepare("SELECT * FROM entries WHERE patient_id = ? ORDER BY timestamp DESC").all(req.params.id);
    res.json(history);
  });

  app.get("/api/alerts", (req, res) => {
    const alerts = db.prepare(`
      SELECT a.*, p.name as patient_name 
      FROM alerts a 
      JOIN patients p ON a.patient_id = p.id 
      WHERE a.resolved = 0 
      ORDER BY a.timestamp DESC
    `).all();
    res.json(alerts);
  });

  app.post("/api/entries", async (req, res) => {
    const { patientId, type, content } = req.body;
    
    let analysis = null;
    let riskScore = 0;
    let sentiment = "neutral";

    if (type === "journal" || type === "mood") {
      try {
        analysis = await analyzePatientInput(content);
        riskScore = analysis.riskScore;
        sentiment = analysis.sentiment;
      } catch (error) {
        console.error("AI Analysis failed:", error);
      }
    } else if (type === "sos") {
      riskScore = 100;
      sentiment = "negative";
      analysis = { summary: "SOS Emergency Triggered" };
    }

    const stmt = db.prepare(`
      INSERT INTO entries (patient_id, type, content, sentiment, risk_score, analysis_json)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(patientId, type, content, sentiment, riskScore, JSON.stringify(analysis));

    // Check for alerts
    if (riskScore >= 60 || type === "sos") {
      const riskLevel = riskScore >= 80 ? "CRITICAL" : "HIGH";
      const alertStmt = db.prepare("INSERT INTO alerts (patient_id, reason, risk_level) VALUES (?, ?, ?)");
      alertStmt.run(patientId, analysis?.summary || "High risk detected", riskLevel);
      
      broadcast({
        type: "NEW_ALERT",
        data: {
          patient_id: patientId,
          patient_name: db.prepare("SELECT name FROM patients WHERE id = ?").get(patientId).name,
          reason: analysis?.summary || "High risk detected",
          risk_level: riskLevel,
          timestamp: new Date().toISOString()
        }
      });
    }

    broadcast({ type: "NEW_ENTRY", patientId });
    res.json({ id: result.lastInsertRowid, analysis });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
