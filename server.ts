import express from 'express';
import { createServer as createViteServer } from 'vite';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import db, { initDb } from './db.ts';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'autocare-secret-key-123';
const PORT = 3000;

async function startServer() {
  initDb();
  const app = express();
  app.use(express.json());

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // Auth Routes
  app.post('/api/auth/register', async (req, res) => {
    const { email, password, role } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const stmt = db.prepare('INSERT INTO users (email, password, role) VALUES (?, ?, ?)');
      const info = stmt.run(email, hashedPassword, role || 'OWNER');
      res.status(201).json({ id: info.lastInsertRowid });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  });

  // Vehicle Routes
  app.get('/api/vehicles', authenticateToken, (req: any, res) => {
    let vehicles;
    if (req.user.role === 'ADMIN') {
      vehicles = db.prepare('SELECT * FROM vehicles').all();
    } else {
      vehicles = db.prepare('SELECT * FROM vehicles WHERE owner_id = ?').all(req.user.id);
    }
    res.json(vehicles);
  });

  app.post('/api/vehicles', authenticateToken, (req: any, res) => {
    const { make, model, year, current_mileage } = req.body;
    const stmt = db.prepare('INSERT INTO vehicles (owner_id, make, model, year, current_mileage) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(req.user.id, make, model, year, current_mileage);
    const vehicleId = info.lastInsertRowid;

    // Add default service rules for the new vehicle
    const defaultRules = [
      { type: 'Oil Change', mileage: 5000 },
      { type: 'Brake Service', mileage: 20000 },
      { type: 'Tire Rotation', mileage: 10000 }
    ];
    const ruleStmt = db.prepare('INSERT INTO service_rules (vehicle_id, service_type, mileage_interval) VALUES (?, ?, ?)');
    defaultRules.forEach(rule => ruleStmt.run(vehicleId, rule.type, rule.mileage));

    res.status(201).json({ id: vehicleId });
  });

  // Service Records
  app.get('/api/vehicles/:id/services', authenticateToken, (req, res) => {
    const services = db.prepare('SELECT * FROM service_records WHERE vehicle_id = ? ORDER BY date DESC').all(req.params.id);
    res.json(services);
  });

  app.post('/api/services', authenticateToken, (req: any, res) => {
    const { vehicle_id, date, type, mileage, cost, notes, photo_url } = req.body;
    const stmt = db.prepare('INSERT INTO service_records (vehicle_id, date, type, mileage, cost, notes, technician_id, photo_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    const info = stmt.run(vehicle_id, date, type, mileage, cost, notes, req.user.id, photo_url);
    
    // Update vehicle mileage
    db.prepare('UPDATE vehicles SET current_mileage = MAX(current_mileage, ?) WHERE id = ?').run(mileage, vehicle_id);
    
    res.status(201).json({ id: info.lastInsertRowid });
  });

  // Analytics
  app.get('/api/analytics/costs/:vehicleId', authenticateToken, (req, res) => {
    const records = db.prepare('SELECT date, cost FROM service_records WHERE vehicle_id = ?').all(req.params.vehicleId);
    res.json(records);
  });

  // Predictive Maintenance Logic
  app.get('/api/predictive/:vehicleId', authenticateToken, (req, res) => {
    const vehicle: any = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.vehicleId);
    const records: any = db.prepare('SELECT * FROM service_records WHERE vehicle_id = ? ORDER BY mileage DESC').all(req.params.vehicleId);
    const rules: any = db.prepare('SELECT * FROM service_rules WHERE vehicle_id = ?').all(req.params.vehicleId);

    const predictions = rules.map((rule: any) => {
      const lastService = records.find((r: any) => r.type === rule.service_type);
      const lastMileage = lastService ? lastService.mileage : 0;
      const nextMileage = lastMileage + rule.mileage_interval;
      const remainingKm = nextMileage - vehicle.current_mileage;
      
      return {
        type: rule.service_type,
        lastMileage,
        nextMileage,
        remainingKm,
        status: remainingKm < 500 ? 'URGENT' : (remainingKm < 2000 ? 'UPCOMING' : 'OK')
      };
    });

    res.json(predictions);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => res.sendFile(path.resolve('dist/index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
