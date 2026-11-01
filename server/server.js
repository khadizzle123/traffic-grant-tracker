// ==========================================================================
// ShieldStat API Server — PostgreSQL Backend
// Covers: shifts (with all 17 metrics + dept calls), officers, grants, settings
// Deployed on Render. DATABASE_URL must be set as an environment variable.
// ==========================================================================

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Serve the frontend static files from the project root (one level up from /server)
app.use(express.static(path.join(__dirname, '..')));

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ==========================================================================
// DB INIT — create all tables on startup if they don't exist
// ==========================================================================
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS officers (
      id        SERIAL PRIMARY KEY,
      name      VARCHAR(100) NOT NULL,
      badge     VARCHAR(50),
      rank      VARCHAR(50),
      hourly_rate NUMERIC(10,2) DEFAULT 65.00,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS grants (
      id              SERIAL PRIMARY KEY,
      code            VARCHAR(50) NOT NULL,
      name            VARCHAR(200),
      agency          VARCHAR(200),
      budget          NUMERIC(12,2) DEFAULT 0,
      allocated_hours NUMERIC(10,2) DEFAULT 0,
      start_date      DATE,
      end_date        DATE,
      status          VARCHAR(30) DEFAULT 'Active',
      focus           TEXT,
      created_at      TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS shifts (
      id              BIGSERIAL PRIMARY KEY,
      shift_date      DATE NOT NULL,
      time_start      VARCHAR(10),
      time_end        VARCHAR(10),
      officer         VARCHAR(150),
      shift_type      VARCHAR(100),
      unit            VARCHAR(100),
      location        TEXT,
      start_mileage   NUMERIC(10,1) DEFAULT 0,
      end_mileage     NUMERIC(10,1) DEFAULT 0,
      total_miles     NUMERIC(10,1) DEFAULT 0,
      hours           NUMERIC(6,2)  DEFAULT 0,
      total_hours     NUMERIC(6,2)  DEFAULT 0,
      dept_hours      NUMERIC(6,2)  DEFAULT 0,
      grant_hours     NUMERIC(6,2)  DEFAULT 0,
      -- Enforcement metrics
      stops             INT DEFAULT 0,
      citations         INT DEFAULT 0,
      duis              INT DEFAULT 0,
      felonies          INT DEFAULT 0,
      stolen_vehicles   INT DEFAULT 0,
      stat_stops        INT DEFAULT 0,
      stat_dui_alcohol  INT DEFAULT 0,
      stat_dui_drugs    INT DEFAULT 0,
      stat_dui_both     INT DEFAULT 0,
      stat_underage_alcohol INT DEFAULT 0,
      stat_seat_belt    INT DEFAULT 0,
      stat_child_seat_belt INT DEFAULT 0,
      stat_speeding     INT DEFAULT 0,
      stat_reckless     INT DEFAULT 0,
      stat_texting      INT DEFAULT 0,
      stat_bike_ped     INT DEFAULT 0,
      stat_no_insurance INT DEFAULT 0,
      stat_susp_license INT DEFAULT 0,
      stat_moto_endorse INT DEFAULT 0,
      stat_felony_arrest INT DEFAULT 0,
      stat_stolen_vehicles INT DEFAULT 0,
      stat_fugitives    INT DEFAULT 0,
      -- Department billed calls stored as JSON
      calls             JSONB DEFAULT '[]',
      created_at        TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key   VARCHAR(100) PRIMARY KEY,
      value TEXT
    );
  `);

  // Seed default officers if table is empty
  const offCount = await pool.query('SELECT COUNT(*) FROM officers');
  if (parseInt(offCount.rows[0].count) === 0) {
    await pool.query(`
      INSERT INTO officers (name, badge, rank, hourly_rate) VALUES
        ('Miller', '#412', 'Officer', 68.50),
        ('Vance', '#204', 'Sergeant', 82.00),
        ('Davis', '#511', 'Officer', 64.00),
        ('Chen', '#318', 'Officer', 66.50),
        ('Reynolds', '#109', 'Corporal', 72.00)
    `);
    console.log('🌱 Seeded default officer roster.');
  }

  // Seed default grants if table is empty
  const grantCount = await pool.query('SELECT COUNT(*) FROM grants');
  if (parseInt(grantCount.rows[0].count) === 0) {
    await pool.query(`
      INSERT INTO grants (code, name, agency, budget, allocated_hours, start_date, end_date, status, focus) VALUES
        ('HVE-2026', 'NHTSA High Visibility Enforcement', 'State DOT / NHTSA CFDA #20.600', 45000.00, 180.0, '2026-10-01', '2026-12-31', 'Active', 'Speed corridor saturation & seat belt compliance'),
        ('ID-2026', 'State Impaired Driving Crackdown', 'State Highway Safety Office', 25000.00, 100.0, '2026-10-15', '2027-01-15', 'Active', 'Nighttime DUI checkpoints & roving patrols'),
        ('STEP-2027', 'Selective Traffic Enforcement Program', 'Governor Highway Safety Program', 18000.00, 75.0, '2027-01-01', '2027-03-31', 'Upcoming', 'School zones & distracted driver enforcement')
    `);
    console.log('🌱 Seeded default grant programs.');
  }

  console.log('✅ Database tables ready.');
}
initDB().catch(err => console.error('DB init error:', err));

// ==========================================================================
// HEALTH CHECK
// ==========================================================================
app.get('/api/health', (req, res) => res.json({ status: 'ok', ts: new Date() }));

// ==========================================================================
// SHIFTS
// ==========================================================================

// GET all shifts, optionally filtered by ?start=YYYY-MM-DD&end=YYYY-MM-DD
app.get('/api/shifts', async (req, res) => {
  try {
    const { start, end } = req.query;
    let query = 'SELECT * FROM shifts';
    const params = [];
    if (start && end) {
      query += ' WHERE shift_date BETWEEN $1 AND $2';
      params.push(start, end);
    } else if (start) {
      query += ' WHERE shift_date >= $1';
      params.push(start);
    } else if (end) {
      query += ' WHERE shift_date <= $1';
      params.push(end);
    }
    query += ' ORDER BY shift_date DESC, created_at DESC';
    const result = await pool.query(query, params);
    // Map snake_case DB columns back to camelCase for the frontend
    res.json(result.rows.map(dbRowToShift));
  } catch (err) {
    console.error('GET /api/shifts error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST — create a new shift
app.post('/api/shifts', async (req, res) => {
  try {
    const s = req.body;
    const st = s.stats || {};
    const result = await pool.query(`
      INSERT INTO shifts (
        shift_date, time_start, time_end, officer, shift_type, unit, location,
        start_mileage, end_mileage, total_miles, hours, total_hours, dept_hours, grant_hours,
        stops, citations, duis, felonies, stolen_vehicles,
        stat_stops, stat_dui_alcohol, stat_dui_drugs, stat_dui_both, stat_underage_alcohol,
        stat_seat_belt, stat_child_seat_belt, stat_speeding, stat_reckless, stat_texting,
        stat_bike_ped, stat_no_insurance, stat_susp_license, stat_moto_endorse,
        stat_felony_arrest, stat_stolen_vehicles, stat_fugitives, calls
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,
        $8,$9,$10,$11,$12,$13,$14,
        $15,$16,$17,$18,$19,
        $20,$21,$22,$23,$24,
        $25,$26,$27,$28,$29,
        $30,$31,$32,$33,
        $34,$35,$36,$37
      ) RETURNING *`,
      [
        s.date, s.timeStart, s.timeEnd, s.officer, s.type, s.unit, s.location || '',
        s.startMileage || 0, s.endMileage || 0, s.totalMiles || 0,
        s.hours || 0, s.totalHours || 0, s.deptHours || 0, s.grantHours || 0,
        s.stops || 0, s.citations || 0, s.duis || 0, s.felonies || 0, s.stolenVehicles || 0,
        st.stops || 0, st.dui_alcohol || 0, st.dui_drugs || 0, st.dui_both || 0, st.underage_alcohol || 0,
        st.seat_belt || 0, st.child_seat_belt || 0, st.speeding || 0, st.reckless_driving || 0, st.texting || 0,
        st.bike_ped || 0, st.no_insurance || 0, st.suspended_license || 0, st.motorcycle_endorsement || 0,
        st.felony_arrest || 0, st.stolen_vehicles || 0, st.fugitives || 0,
        JSON.stringify(s.calls || [])
      ]
    );
    res.status(201).json(dbRowToShift(result.rows[0]));
  } catch (err) {
    console.error('POST /api/shifts error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE a shift by id
app.delete('/api/shifts/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM shifts WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/shifts error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE all shifts (danger zone)
app.delete('/api/shifts', async (req, res) => {
  try {
    await pool.query('DELETE FROM shifts');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper: map DB row → frontend camelCase object
function dbRowToShift(row) {
  return {
    id:            row.id,
    date:          row.shift_date ? row.shift_date.toISOString().slice(0, 10) : '',
    timeStart:     row.time_start,
    timeEnd:       row.time_end,
    officer:       row.officer,
    type:          row.shift_type,
    unit:          row.unit,
    location:      row.location,
    startMileage:  parseFloat(row.start_mileage) || 0,
    endMileage:    parseFloat(row.end_mileage) || 0,
    totalMiles:    parseFloat(row.total_miles) || 0,
    hours:         parseFloat(row.hours) || 0,
    totalHours:    parseFloat(row.total_hours) || 0,
    deptHours:     parseFloat(row.dept_hours) || 0,
    grantHours:    parseFloat(row.grant_hours) || 0,
    stops:         row.stops || 0,
    citations:     row.citations || 0,
    duis:          row.duis || 0,
    felonies:      row.felonies || 0,
    stolenVehicles:row.stolen_vehicles || 0,
    calls:         row.calls || [],
    stats: {
      stops:                  row.stat_stops || 0,
      dui_alcohol:            row.stat_dui_alcohol || 0,
      dui_drugs:              row.stat_dui_drugs || 0,
      dui_both:               row.stat_dui_both || 0,
      underage_alcohol:       row.stat_underage_alcohol || 0,
      seat_belt:              row.stat_seat_belt || 0,
      child_seat_belt:        row.stat_child_seat_belt || 0,
      speeding:               row.stat_speeding || 0,
      reckless_driving:       row.stat_reckless || 0,
      texting:                row.stat_texting || 0,
      bike_ped:               row.stat_bike_ped || 0,
      no_insurance:           row.stat_no_insurance || 0,
      suspended_license:      row.stat_susp_license || 0,
      motorcycle_endorsement: row.stat_moto_endorse || 0,
      felony_arrest:          row.stat_felony_arrest || 0,
      stolen_vehicles:        row.stat_stolen_vehicles || 0,
      fugitives:              row.stat_fugitives || 0,
    }
  };
}

// ==========================================================================
// OFFICERS
// ==========================================================================
app.get('/api/officers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM officers ORDER BY name ASC');
    res.json(result.rows.map(r => ({
      id: r.id, name: r.name, badge: r.badge, rank: r.rank,
      hourlyRate: parseFloat(r.hourly_rate) || 65
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/officers', async (req, res) => {
  try {
    const { name, badge, rank, hourlyRate } = req.body;
    const result = await pool.query(
      'INSERT INTO officers (name, badge, rank, hourly_rate) VALUES ($1,$2,$3,$4) RETURNING *',
      [name, badge, rank, hourlyRate || 65]
    );
    const r = result.rows[0];
    res.status(201).json({ id: r.id, name: r.name, badge: r.badge, rank: r.rank, hourlyRate: parseFloat(r.hourly_rate) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/officers/:id', async (req, res) => {
  try {
    const { name, badge, rank, hourlyRate } = req.body;
    const result = await pool.query(
      'UPDATE officers SET name=$1, badge=$2, rank=$3, hourly_rate=$4 WHERE id=$5 RETURNING *',
      [name, badge, rank, hourlyRate || 65, req.params.id]
    );
    const r = result.rows[0];
    res.json({ id: r.id, name: r.name, badge: r.badge, rank: r.rank, hourlyRate: parseFloat(r.hourly_rate) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/officers/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM officers WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================================================
// GRANTS
// ==========================================================================
app.get('/api/grants', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM grants ORDER BY start_date DESC');
    res.json(result.rows.map(r => ({
      id: r.id, code: r.code, name: r.name, agency: r.agency,
      budget: parseFloat(r.budget) || 0,
      allocatedHours: parseFloat(r.allocated_hours) || 0,
      startDate: r.start_date ? r.start_date.toISOString().slice(0,10) : '',
      endDate:   r.end_date   ? r.end_date.toISOString().slice(0,10)   : '',
      status: r.status, focus: r.focus
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/grants', async (req, res) => {
  try {
    const { code, name, agency, budget, allocatedHours, startDate, endDate, status, focus } = req.body;
    const result = await pool.query(
      `INSERT INTO grants (code, name, agency, budget, allocated_hours, start_date, end_date, status, focus)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [code, name, agency, budget || 0, allocatedHours || 0, startDate || null, endDate || null, status || 'Active', focus || '']
    );
    const r = result.rows[0];
    res.status(201).json({ id: r.id, code: r.code, name: r.name, agency: r.agency,
      budget: parseFloat(r.budget), allocatedHours: parseFloat(r.allocated_hours),
      startDate: r.start_date?.toISOString().slice(0,10),
      endDate:   r.end_date?.toISOString().slice(0,10),
      status: r.status, focus: r.focus });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/grants/:id', async (req, res) => {
  try {
    const { code, name, agency, budget, allocatedHours, startDate, endDate, status, focus } = req.body;
    const result = await pool.query(
      `UPDATE grants SET code=$1, name=$2, agency=$3, budget=$4, allocated_hours=$5,
       start_date=$6, end_date=$7, status=$8, focus=$9 WHERE id=$10 RETURNING *`,
      [code, name, agency, budget || 0, allocatedHours || 0, startDate || null, endDate || null, status || 'Active', focus || '', req.params.id]
    );
    const r = result.rows[0];
    res.json({ id: r.id, code: r.code, name: r.name, agency: r.agency,
      budget: parseFloat(r.budget), allocatedHours: parseFloat(r.allocated_hours),
      startDate: r.start_date?.toISOString().slice(0,10),
      endDate:   r.end_date?.toISOString().slice(0,10),
      status: r.status, focus: r.focus });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/grants/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM grants WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================================================
// APP SETTINGS (key-value store)
// ==========================================================================
app.get('/api/settings', async (req, res) => {
  try {
    const result = await pool.query('SELECT key, value FROM app_settings');
    const settings = {};
    result.rows.forEach(r => {
      try { settings[r.key] = JSON.parse(r.value); }
      catch { settings[r.key] = r.value; }
    });
    res.json(settings);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/settings', async (req, res) => {
  try {
    const settings = req.body;
    for (const [key, value] of Object.entries(settings)) {
      await pool.query(
        `INSERT INTO app_settings (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        [key, JSON.stringify(value)]
      );
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================================================
// START
// ==========================================================================
// Serve index.html for any frontend client-side routes (non-API)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  const rootIndex = path.join(__dirname, '..', 'index.html');
  const localIndex = path.join(__dirname, 'index.html');
  const fs = require('fs');
  if (fs.existsSync(rootIndex)) return res.sendFile(rootIndex);
  if (fs.existsSync(localIndex)) return res.sendFile(localIndex);
  next();
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 ShieldStat server running on port ${PORT}`));