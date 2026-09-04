import express from "express";
import path from "path";
import fs from "fs";

// Initial fallback patients data
const INITIAL_SERVER_PATIENTS = [
  {
    id: 'SKP-2026-0001',
    name: 'Patient',
    email: 'patient@sokhapheap.kh',
    dob: '',
    gender: 'Female',
    phone: '',
    profilePicture: undefined,
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
    },
    bloodType: 'Unknown',
    allergies: [],
    vaccinations: [],
    illnessHistory: [],
    labResults: [],
    medicalRecords: [],
    qrToken: 'SKP-TOK-0001',
    qrTokenCreatedAt: new Date().toISOString(),
  }
];

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'patients.json');

// Helper to load persistent patient store from disk
function loadDiskPatients(): any[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Notice: loading patients from disk:', err);
  }
  return [...INITIAL_SERVER_PATIENTS];
}

// Helper to save patient store to disk
function saveDiskPatients(patients: any[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(patients, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Notice: saving patients to disk:', err);
  }
}

// Patient store across mobile and desktop devices with disk persistence
let patientsStore: any[] = loadDiskPatients();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Configure JSON parser with generous payload size for uploaded document previews/data URLs
  app.use(express.json({ limit: '60mb' }));
  app.use(express.urlencoded({ extended: true, limit: '60mb' }));

  // CORS headers so web and mobile can sync smoothly
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // =========================================================================
  // API ROUTES
  // =========================================================================

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", patientsCount: patientsStore.length, timestamp: new Date().toISOString() });
  });

  // Get all patients
  app.get("/api/patients", (req, res) => {
    res.json({ success: true, data: patientsStore });
  });

  // Get a specific patient by ID or Token
  app.get("/api/patient", (req, res) => {
    const { id, token } = req.query;
    if (!id && !token) {
      return res.status(400).json({ success: false, message: "Missing id or token parameter" });
    }

    const patient = patientsStore.find(
      (p) => (id && p.id === id) || (token && p.qrToken === token)
    );

    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    res.json({ success: true, data: patient });
  });

  // Get patient by path ID
  app.get("/api/patients/:id", (req, res) => {
    const patient = patientsStore.find(p => p.id === req.params.id || p.qrToken === req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }
    res.json({ success: true, data: patient });
  });

  // Save or update a single patient record (including uploaded medical documents)
  app.post("/api/patient", (req, res) => {
    const updatedPatient = req.body;
    if (!updatedPatient || !updatedPatient.id) {
      return res.status(400).json({ success: false, message: "Invalid patient payload" });
    }

    const existingIndex = patientsStore.findIndex(p => p.id === updatedPatient.id);
    if (existingIndex >= 0) {
      patientsStore[existingIndex] = {
        ...patientsStore[existingIndex],
        ...updatedPatient,
        medicalRecords: updatedPatient.medicalRecords || patientsStore[existingIndex].medicalRecords,
        accessRequests: updatedPatient.accessRequests || patientsStore[existingIndex].accessRequests || []
      };
    } else {
      patientsStore.unshift(updatedPatient);
    }
    saveDiskPatients(patientsStore);

    res.json({ success: true, data: updatedPatient });
  });

  // =========================================================================
  // QR ACCESS ADMISSION & PERMISSION ROUTES (SSE & REAL-TIME EVENT STREAM)
  // =========================================================================

  // In-memory active Server-Sent Events (SSE) connections for zero-latency push updates
  // requestId -> Array of Express responses (scanners awaiting authorization)
  const scannerSseClients = new Map<string, express.Response[]>();
  // patientId -> Array of Express responses (patients listening for incoming scan alerts)
  const patientSseClients = new Map<string, express.Response[]>();

  // Real-time Server-Sent Events (SSE) streaming endpoint
  app.get("/api/qr-access/events", (req, res) => {
    const { patientId, requestId } = req.query;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Disable proxy buffering for immediate push
    res.flushHeaders();

    // Initial connection acknowledgement
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: Date.now() })}\n\n`);

    const pId = patientId ? String(patientId) : null;
    const rId = requestId ? String(requestId) : null;

    if (pId) {
      if (!patientSseClients.has(pId)) patientSseClients.set(pId, []);
      patientSseClients.get(pId)!.push(res);
    }

    if (rId) {
      if (!scannerSseClients.has(rId)) scannerSseClients.set(rId, []);
      scannerSseClients.get(rId)!.push(res);
    }

    // Keep-alive heartbeat every 15 seconds
    const heartbeatTimer = setInterval(() => {
      try {
        res.write(`: heartbeat\n\n`);
      } catch {
        clearInterval(heartbeatTimer);
      }
    }, 15000);

    req.on("close", () => {
      clearInterval(heartbeatTimer);
      if (pId && patientSseClients.has(pId)) {
        patientSseClients.set(pId, patientSseClients.get(pId)!.filter(c => c !== res));
      }
      if (rId && scannerSseClients.has(rId)) {
        scannerSseClients.set(rId, scannerSseClients.get(rId)!.filter(c => c !== res));
      }
    });
  });

  // Submit an admission request when scanning a patient's QR code
  // Every scan produces a single isolated request. No blanket authorization for everyone!
  app.post("/api/qr-access/request", (req, res) => {
    const { patientId, qrToken, requesterName, requesterRole, requesterLocation, deviceId, requestId } = req.body;
    if (!patientId && !qrToken) {
      return res.status(400).json({ success: false, message: "Missing patient identifier" });
    }

    const patient = patientsStore.find(p => (patientId && p.id === patientId) || (qrToken && p.qrToken === qrToken));
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    if (!Array.isArray(patient.accessRequests)) {
      patient.accessRequests = [];
    }

    // Strictly check by requestId if supplied (Never allow past permissions to grant blanket access!)
    if (requestId) {
      const existingReq = patient.accessRequests.find((r: any) => r.id === requestId);
      if (existingReq) {
        return res.json({ success: true, request: existingReq });
      }
    }

    const newRequest = {
      id: requestId || `req-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      patientId: patient.id,
      requesterName: requesterName || 'Emergency Physician',
      requesterRole: requesterRole || 'Clinical Doctor',
      requesterLocation: requesterLocation || 'Hospital Emergency Department',
      requestedAt: new Date().toISOString(),
      status: 'pending',
      qrToken: qrToken || patient.qrToken,
      deviceId: deviceId || `dev-${Math.random().toString(36).substring(2, 8)}`,
    };

    // Insert at beginning of requests list
    patient.accessRequests.unshift(newRequest);
    saveDiskPatients(patientsStore);

    console.log(`[QR Access] New unique scan request ${newRequest.id} for patient ${patient.id} (${patient.name}) from ${newRequest.requesterName}`);

    // Instant SSE push to patient listening connections (one scan = one immediate notification alert!)
    const patientConns = patientSseClients.get(patient.id) || [];
    for (const conn of patientConns) {
      try {
        conn.write(`data: ${JSON.stringify({ type: 'NEW_REQUEST_ALERT', request: newRequest, requests: patient.accessRequests })}\n\n`);
      } catch {
        // ignore
      }
    }

    res.json({ success: true, request: newRequest });
  });

  // Check authorization status for a scanner request
  // Strictly enforce 1-to-1 matching by requestId. Do NOT grant blanket access to other scans!
  app.get("/api/qr-access/status", (req, res) => {
    const { patientId, requestId, qrToken } = req.query;
    const patient = patientsStore.find(p => (patientId && p.id === patientId) || (qrToken && p.qrToken === qrToken));
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    const requests = patient.accessRequests || [];
    if (!requestId) {
      return res.json({ success: true, status: 'none' });
    }

    const found = requests.find((r: any) => r.id === requestId);

    if (!found) {
      return res.json({ success: true, status: 'none' });
    }

    res.json({ success: true, status: found.status, request: found });
  });

  // Patient responds to access request (Allow or Not Allowed)
  app.post("/api/qr-access/respond", (req, res) => {
    const { patientId, requestId, status } = req.body;
    const patient = patientsStore.find(p => p.id === patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    if (!Array.isArray(patient.accessRequests)) {
      patient.accessRequests = [];
    }

    const reqItem = patient.accessRequests.find((r: any) => r.id === requestId);
    if (!reqItem) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    reqItem.status = status === 'allowed' ? 'allowed' : 'not_allowed';
    reqItem.respondedAt = new Date().toISOString();
    saveDiskPatients(patientsStore);

    console.log(`[QR Access] Patient ${patient.id} responded to request ${requestId}: ${reqItem.status}`);

    // Instant SSE push to the waiting scanner with this specific requestId
    const waitingScanners = scannerSseClients.get(requestId) || [];
    for (const conn of waitingScanners) {
      try {
        conn.write(`data: ${JSON.stringify({ type: 'DECISION', requestId, status: reqItem.status })}\n\n`);
      } catch {
        // ignore
      }
    }

    // Also notify any patient SSE listeners
    const patientConns = patientSseClients.get(patient.id) || [];
    for (const conn of patientConns) {
      try {
        conn.write(`data: ${JSON.stringify({ type: 'REQUESTS_UPDATED', requests: patient.accessRequests })}\n\n`);
      } catch {
        // ignore
      }
    }

    res.json({ success: true, request: reqItem, accessRequests: patient.accessRequests });
  });

  // Get all access requests for a patient
  app.get("/api/qr-access/requests", (req, res) => {
    const { patientId } = req.query;
    const patient = patientsStore.find(p => p.id === patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }
    res.json({ success: true, requests: patient.accessRequests || [] });
  });

  // Batch sync patients database
  app.post("/api/patients/sync", (req, res) => {
    const { patients } = req.body;
    if (Array.isArray(patients) && patients.length > 0) {
      patients.forEach(newP => {
        const idx = patientsStore.findIndex(p => p.id === newP.id);
        if (idx >= 0) {
          // Merge preserving existing documents
          patientsStore[idx] = {
            ...patientsStore[idx],
            ...newP,
            medicalRecords: newP.medicalRecords && newP.medicalRecords.length > 0 ? newP.medicalRecords : patientsStore[idx].medicalRecords,
          };
        } else {
          patientsStore.push(newP);
        }
      });
      saveDiskPatients(patientsStore);
      return res.json({ success: true, count: patientsStore.length, data: patientsStore });
    }
    res.json({ success: true, data: patientsStore });
  });

  // Vite middleware setup for SPA
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Sokhapheap Digital Server running on http://0.0.0.0:${PORT}`);
  });

  process.on('SIGTERM', () => {
    server.close(() => {
      process.exit(0);
    });
  });
}

startServer();
