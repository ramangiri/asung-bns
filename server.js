
const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'database.sqlite');

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(__dirname));

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    employeeId TEXT,
    employeeName TEXT,
    designation TEXT,
    department TEXT,
    mailId TEXT,
    pfNo TEXT,
    pan TEXT,
    esiNo TEXT,
    doj TEXT,
    bankName TEXT,
    bankAccount TEXT,
    createdAt TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS payslips (
    id TEXT PRIMARY KEY,
    employeeId TEXT,
    employeeName TEXT,
    designation TEXT,
    department TEXT,
    mailId TEXT,
    pfNo TEXT,
    pan TEXT,
    esiNo TEXT,
    doj TEXT,
    bankName TEXT,
    bankAccount TEXT,
    month TEXT,
    year TEXT,
    monthYear TEXT,
    totalWorkingDays INTEGER,
    paidDays INTEGER,
    lopDays INTEGER,
    leavesTaken INTEGER,
    basicWage REAL,
    hra REAL,
    conveyance REAL,
    dearnessAllowance REAL,
    otherAllowance REAL,
    grossWage REAL,
    epf REAL,
    esiDeduction REAL,
    professionalTax REAL,
    loanRecovery REAL,
    tds REAL,
    totalEarnings REAL,
    totalDeductions REAL,
    netSalary REAL,
    netWords TEXT,
    createdAt TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    companyName TEXT,
    address1 TEXT,
    address2 TEXT,
    cin TEXT,
    email TEXT,
    footerCompany TEXT,
    footerName TEXT,
    footerRole TEXT,
    logoData TEXT,
    signatureData TEXT
  )`);

  db.get("SELECT id FROM settings WHERE id = 1", (err, row) => {
    if (!row) {
      db.run(`INSERT INTO settings
        (id, companyName, address1, address2, cin, email, footerCompany, footerName, footerRole, logoData, signatureData)
        VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, '', '')`,
        [
          'ASUNG BNS GLOBAL PRIVATE LIMITED',
          'No.8, Pillaiyar Kovil Street, Potheri (po)',
          'Kattankolathur-603 203',
          'U62091TN2025PTC176719',
          'maya@asungbns.co.kr',
          'For ASUNG BNS GLOBAL PVT. LTD.',
          'Padma Priya',
          'Director'
        ]
      );
    }
  });
});

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
  });
}
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
  });
}
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      err ? reject(err) : resolve(this);
    });
  });
}

app.get('/api/health', async (req, res) => {
  res.json({ ok: true, db: DB_PATH });
});

app.get('/api/employees', async (req, res) => {
  try {
    const rows = await all(`SELECT * FROM employees ORDER BY employeeName COLLATE NOCASE ASC`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/employees/:id', async (req, res) => {
  try {
    const row = await get(`SELECT * FROM employees WHERE id = ?`, [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Employee not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/employees', async (req, res) => {
  try {
    const e = req.body;
    const id = e.id || ('emp_' + Date.now());
    await run(
      `INSERT INTO employees (id, employeeId, employeeName, designation, department, mailId, pfNo, pan, esiNo, doj, bankName, bankAccount, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, e.employeeId || '', e.employeeName || '', e.designation || '', e.department || '',
        e.mailId || '', e.pfNo || '', e.pan || '', e.esiNo || '', e.doj || '',
        e.bankName || '', e.bankAccount || '', e.createdAt || new Date().toLocaleString()
      ]
    );
    const row = await get(`SELECT * FROM employees WHERE id = ?`, [id]);
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/employees/:id', async (req, res) => {
  try {
    const e = req.body;
    await run(
      `UPDATE employees SET
        employeeId=?, employeeName=?, designation=?, department=?, mailId=?, pfNo=?, pan=?, esiNo=?, doj=?, bankName=?, bankAccount=?
       WHERE id=?`,
      [
        e.employeeId || '', e.employeeName || '', e.designation || '', e.department || '',
        e.mailId || '', e.pfNo || '', e.pan || '', e.esiNo || '', e.doj || '',
        e.bankName || '', e.bankAccount || '', req.params.id
      ]
    );
    const row = await get(`SELECT * FROM employees WHERE id = ?`, [req.params.id]);
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/employees/:id', async (req, res) => {
  try {
    await run(`DELETE FROM employees WHERE id = ?`, [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/payslips', async (req, res) => {
  try {
    const rows = await all(`SELECT * FROM payslips ORDER BY createdAt DESC`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/payslips/:id', async (req, res) => {
  try {
    const row = await get(`SELECT * FROM payslips WHERE id = ?`, [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Payslip not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/payslips', async (req, res) => {
  try {
    const p = req.body;
    const id = p.id || ('ps_' + Date.now());
    await run(
      `INSERT INTO payslips (
        id, employeeId, employeeName, designation, department, mailId, pfNo, pan, esiNo, doj,
        bankName, bankAccount, month, year, monthYear, totalWorkingDays, paidDays, lopDays, leavesTaken,
        basicWage, hra, conveyance, dearnessAllowance, otherAllowance, grossWage,
        epf, esiDeduction, professionalTax, loanRecovery, tds, totalEarnings, totalDeductions,
        netSalary, netWords, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, p.employeeId || '', p.employeeName || '', p.designation || '', p.department || '',
        p.mailId || '', p.pfNo || '', p.pan || '', p.esiNo || '', p.doj || '', p.bankName || '',
        p.bankAccount || '', p.month || '', p.year || '', p.monthYear || '',
        p.totalWorkingDays || 0, p.paidDays || 0, p.lopDays || 0, p.leavesTaken || 0,
        p.basicWage || 0, p.hra || 0, p.conveyance || 0, p.dearnessAllowance || 0, p.otherAllowance || 0,
        p.grossWage || 0, p.epf || 0, p.esiDeduction || 0, p.professionalTax || 0,
        p.loanRecovery || 0, p.tds || 0, p.totalEarnings || 0, p.totalDeductions || 0,
        p.netSalary || 0, p.netWords || '', p.createdAt || new Date().toLocaleString()
      ]
    );
    const row = await get(`SELECT * FROM payslips WHERE id = ?`, [id]);
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/payslips/:id', async (req, res) => {
  try {
    await run(`DELETE FROM payslips WHERE id = ?`, [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/settings', async (req, res) => {
  try {
    const row = await get(`SELECT * FROM settings WHERE id = 1`);
    res.json(row || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/settings', async (req, res) => {
  try {
    const s = req.body;
    await run(
      `UPDATE settings SET
        companyName=?, address1=?, address2=?, cin=?, email=?, footerCompany=?, footerName=?, footerRole=?, logoData=?, signatureData=?
       WHERE id = 1`,
      [
        s.companyName || '', s.address1 || '', s.address2 || '', s.cin || '', s.email || '',
        s.footerCompany || '', s.footerName || '', s.footerRole || '', s.logoData || '', s.signatureData || ''
      ]
    );
    const row = await get(`SELECT * FROM settings WHERE id = 1`);
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Database: ${DB_PATH}`);
});
