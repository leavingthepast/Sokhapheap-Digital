import express from "express";
import path from "path";

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

// In-memory patient store across mobile and desktop devices
let patientsStore: any[] = [...INITIAL_SERVER_PATIENTS];

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
        medicalRecords: updatedPatient.medicalRecords || patientsStore[existingIndex].medicalRecords
      };
    } else {
      patientsStore.unshift(updatedPatient);
    }

    res.json({ success: true, data: updatedPatient });
  });

  // Batch sync patients database
  app.post("/api/patients/sync", (req, res) => {
    const { patients } = req.body;
    if (Array.isArray(patients) && patients.length > 0) {
      patients.forEach(newP => {
        const idx = patientsStore.findIndex(p => p.id === newP.id);
        if (idx >= 0) {
          // Merge preserving existing documents
          patientsStore[idx] = newP;
        } else {
          patientsStore.push(newP);
        }
      });
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
