
const ADMIN_EMAIL = 'padmapriya@asungbns.com';
const ADMIN_PASSWORD = 'mayapriya@123';
const COMPANY_DEFAULTS = {
  companyName: 'ASUNG BNS GLOBAL PRIVATE LIMITED',
  address1: 'No.8, Pillaiyar Kovil Street, Potheri (po)',
  address2: 'Kattankolathur-603 203',
  cin: 'U62091TN2025PTC176719',
  email: 'maya@asungbns.co.kr',
  footerCompany: 'For ASUNG BNS GLOBAL PVT. LTD.',
  footerName: 'Padma Priya',
  footerRole: 'Director',
  logoData: '',
  signatureData: ''
};

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  const text = await res.text();

  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text || res.statusText };
  }

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }

  return data;
}

function formatMoney(v){ const n = Number(v||0); return n.toLocaleString('en-IN'); }
function qs(id){ return document.getElementById(id); }
function requireLogin(){ if(localStorage.getItem('loggedIn') !== 'true'){ location.href='index.html'; }}
function logout(){ localStorage.removeItem('loggedIn'); location.href='index.html'; }

async function getEmployees(){ return api('/api/employees'); }
async function getPayslips(){ return api('/api/payslips'); }
async function getSettings(){
  try{
    const s = await api('/api/settings');
    return { ...COMPANY_DEFAULTS, ...(s || {}) };
  }catch{
    return COMPANY_DEFAULTS;
  }
}

function collectPayslipFormData(){
  const form = qs('payslipForm');
  if(!form) return null;
  const fd = new FormData(form);
  const data = Object.fromEntries(fd.entries());

  const numFields = ['grossWage','totalWorkingDays','paidDays','lopDays','leavesTaken','basicWage','hra','conveyance','dearnessAllowance','otherAllowance','epf','esiDeduction','professionalTax','loanRecovery','tds','totalEarnings','totalDeductions','netSalary'];
  numFields.forEach(function(k){ data[k] = Number(data[k] || 0); });

  data.employeeName = data.employeeName || data.name || '';
  data.employeeId = data.employeeId || '';
  if((!data.month || !data.year) && data.monthPicker){
    const parts = String(data.monthPicker).split(' ');
    if(parts.length >= 2){
      data.month = parts[0];
      data.year = parts[1];
    }
  }
  data.monthYear = data.monthYear || (((data.month || '') + ' ' + (data.year || '')).trim());
  data.id = data.id || ('ps_' + Date.now());
  data.createdAt = data.createdAt || new Date().toLocaleString();
  return data;
}

function initLogin(){
  const form = qs('loginForm'); if(!form) return;
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const email = qs('email').value.trim();
    const password = qs('password').value.trim();
    const err = qs('loginError');
    if(email === ADMIN_EMAIL && password === ADMIN_PASSWORD){
      localStorage.setItem('loggedIn','true');
      location.href='dashboard.html';
    } else {
      err.textContent = 'Invalid email or password';
    }
  });
}

async function renderSidebar(active){
  const mount = qs('sidebarMount'); if(!mount) return;
  const settings = await getSettings();
  const logo = settings.logoData || 'assets/logo.jpg';
  mount.innerHTML = `
    <div id="sidebar" class="sidebar">
      <div class="brand">
        <img src="${logo}" alt="Logo">
        <div><h2>ASUNG BNS</h2><p>Payslip Admin</p></div>
      </div>
      <nav class="nav">
        <a class="${active==='dashboard'?'active':''}" href="dashboard.html">Dashboard</a>
        <a class="${active==='add-employee'?'active':''}" href="add-employee.html">Add Employee</a>
        <a class="${active==='employees'?'active':''}" href="employee-list.html">Employee List</a>
        <a class="${active==='create'?'active':''}" href="create-payslip.html">Create Payslip</a>
        <a class="${active==='history'?'active':''}" href="payslip-history.html">Payslip History</a>
        <a class="${active==='settings'?'active':''}" href="settings.html">Settings</a>
      </nav>
      <div class="sidebar-bottom"><button class="btn full secondary" onclick="logout()">Logout</button></div>
    </div>`;
}

async function initShell(active, title){
  requireLogin();
  await renderSidebar(active);
  const h = qs('pageTitle'); if(h) h.textContent = title;
  const btn = qs('mobileToggle');
  if(btn){ btn.onclick = ()=> qs('sidebar').classList.toggle('open'); }
}

async function initDashboard(){
  const employees = await getEmployees();
  const payslips = await getPayslips();
  qs('employeeCount').textContent = employees.length;
  qs('payslipCount').textContent = payslips.length;
  qs('latestMonthCount').textContent = [...new Set(payslips.map(p=>p.monthYear))].length;
  qs('netTotal').textContent = '₹ ' + formatMoney(payslips.reduce((a,b)=>a + Number(b.netSalary||0), 0));
  const tbody = qs('recentBody');
  tbody.innerHTML = payslips.slice().reverse().slice(0,5).map(p=>`<tr><td>${p.employeeName}</td><td>${p.monthYear}</td><td>₹ ${formatMoney(p.netSalary)}</td><td>${p.createdAt||''}</td></tr>`).join('') || '<tr><td colspan="4">No payslips yet</td></tr>';
}

async function initAddEmployee(){
  const form = qs('employeeForm');
  if(!form) return;

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();

    const msg = qs('employeeMsg');
    const submitBtn = form.querySelector('button[type="submit"]');

    if(msg) msg.textContent = '';

    const fd = new FormData(form);
    const employee = Object.fromEntries(fd.entries());

    employee.employeeId = (employee.employeeId || '').trim();
    employee.employeeName = (employee.employeeName || '').trim();
    employee.designation = (employee.designation || '').trim();
    employee.department = (employee.department || '').trim();
    employee.mailId = (employee.mailId || '').trim();
    employee.pfNo = (employee.pfNo || '').trim();
    employee.pan = (employee.pan || '').trim();
    employee.esiNo = (employee.esiNo || '').trim();
    employee.doj = (employee.doj || '').trim();
    employee.bankName = (employee.bankName || '').trim();
    employee.bankAccount = (employee.bankAccount || '').trim();

    if(!employee.employeeId || !employee.employeeName){
      if(msg) msg.textContent = 'Employee ID and Employee Name are required';
      return;
    }

    const id = new URLSearchParams(location.search).get('id');

    try{
      if(submitBtn) submitBtn.disabled = true;

      if(id){
        await api('/api/employees/' + id, {
          method:'PUT',
          body: JSON.stringify(employee)
        });
      }else{
        employee.id = 'emp_' + Date.now();
        employee.createdAt = new Date().toLocaleString();

        await api('/api/employees', {
          method:'POST',
          body: JSON.stringify(employee)
        });
      }

      if(msg) msg.textContent = 'Employee saved successfully';
      setTimeout(()=> location.href='employee-list.html', 600);

    }catch(err){
      if(msg) msg.textContent = err.message || 'Failed to save employee';
    }finally{
      if(submitBtn) submitBtn.disabled = false;
    }
  });
}

async function initEmployeeEdit(){
  const id = new URLSearchParams(location.search).get('id');
  if(!id) return;
  qs('formMode').textContent = 'Edit Employee';
  try{
    const e = await api('/api/employees/' + id);
    ['employeeId','employeeName','designation','department','mailId','pfNo','pan','esiNo','doj','bankName','bankAccount'].forEach(k=>{
      if(qs(k)) qs(k).value = e[k] || '';
    });
  }catch(err){
    qs('employeeMsg').textContent = err.message;
  }
}

async function initEmployeeList(){
  const employees = await getEmployees();
  const input = qs('employeeSearch');
  const body = qs('employeeBody');

  function render(){
    const q = (input.value||'').toLowerCase();
    const rows = employees.filter(e => [e.employeeId,e.employeeName,e.department].join(' ').toLowerCase().includes(q));
    body.innerHTML = rows.map(e=>`<tr><td>${e.employeeId||''}</td><td>${e.employeeName||''}</td><td>${e.designation||''}</td><td>${e.department||''}</td><td>${e.mailId||''}</td><td><div class="row-actions"><a class="btn secondary" href="add-employee.html?id=${e.id}">Edit</a><button class="btn secondary" onclick="deleteEmployee('${e.id}')">Delete</button></div></td></tr>`).join('') || '<tr><td colspan="6">No employees found</td></tr>';
  }

  window.deleteEmployee = async function(id){
    if(!confirm('Delete this employee?')) return;
    await api('/api/employees/' + id, { method:'DELETE' });
    location.reload();
  };

  input.addEventListener('input', render);
  render();
}

function bindCalc(form){
  const calcInputs = form.querySelectorAll('[data-calc="1"]');
  const set = (id, val)=>{ if(qs(id)) qs(id).value = val; };
  const calculate = ()=>{
    const gv = id=> Number(qs(id)?.value || 0);
    const totalEarnings = gv('basicWage') + gv('hra') + gv('conveyance') + gv('dearnessAllowance') + gv('otherAllowance');
    const totalDeductions = gv('epf') + gv('esiDeduction') + gv('professionalTax') + gv('loanRecovery') + gv('tds');
    set('grossWage', totalEarnings);
    set('totalEarnings', totalEarnings);
    set('totalDeductions', totalDeductions);
    set('netSalary', totalEarnings - totalDeductions);
  };
  calcInputs.forEach(el=> el.addEventListener('input', calculate));
  calculate();
}

function toWords(num){
  num = Math.floor(Number(num || 0));

  if (num === 0) return 'Zero Only';

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'];

  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertBelowThousand(n){
    let str = '';

    if (n >= 100){
      str += ones[Math.floor(n / 100)] + ' Hundred ';
      n = n % 100;
    }

    if (n >= 20){
      str += tens[Math.floor(n / 10)] + ' ';
      n = n % 10;
    }

    if (n > 0){
      str += ones[n] + ' ';
    }

    return str.trim();
  }

  let result = '';

  if (num >= 10000000){
    result += convertBelowThousand(Math.floor(num / 10000000)) + ' Crore ';
    num = num % 10000000;
  }

  if (num >= 100000){
    result += convertBelowThousand(Math.floor(num / 100000)) + ' Lakh ';
    num = num % 100000;
  }

  if (num >= 1000){
    result += convertBelowThousand(Math.floor(num / 1000)) + ' Thousand ';
    num = num % 1000;
  }

  if (num > 0){
    result += convertBelowThousand(num);
  }

  return result.trim().replace(/\s+/g, ' ') + ' Only';
}

async function initCreatePayslip(){
  const form = qs('payslipForm'); if(!form) return;
  const employees = await getEmployees();
  const select = qs('employeeSelect');
  select.innerHTML = '<option value="">Select employee</option>' + employees.map(e=>`<option value="${e.id}">${e.employeeName} (${e.employeeId})</option>`).join('');
  bindCalc(form);

  select.addEventListener('change', ()=>{
    const e = employees.find(x=>x.id === select.value);
    if(!e) return;
    ['employeeName','employeeId','designation','department','mailId','pfNo','pan','esiNo','doj','bankName','bankAccount'].forEach(k=>{
      if(qs(k)) qs(k).value = e[k] || '';
    });
  });

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const data = collectPayslipFormData();
    data.netWords = toWords(data.netSalary);
    localStorage.setItem('currentPayslip', JSON.stringify(data));
    location.href = 'payslip-preview.html';
  });

  const saveBtn = qs('savePayslipDraftBtn');
  if(saveBtn){
    saveBtn.onclick = async function(){
      const msg = qs('employeeMsg') || qs('pageTitle');
      try{
        const data = collectPayslipFormData();
        data.netWords = toWords(data.netSalary);
        await api('/api/payslips', { method:'POST', body: JSON.stringify(data) });
        alert('Payslip saved successfully');
      }catch(err){
        alert(err.message);
      }
    };
  }
}

function payCell(id, text){ const el=qs(id); if(el) el.textContent = text ?? ''; }
function payMoney(id, v){ const el=qs(id); if(el) el.textContent = formatMoney(v || 0); }

async function initPreview(){
  const data = JSON.parse(localStorage.getItem('currentPayslip') || 'null');
  if(!data){ location.href='create-payslip.html'; return; }
  const settings = await getSettings();

  payCell('payMonthTitle', data.monthYear);
  payCell('v_employeeName', data.employeeName);
  payCell('v_pfNo', data.pfNo);
  payCell('v_employeeId', data.employeeId);
  payCell('v_pan', data.pan);
  payCell('v_designation', data.designation);
  payCell('v_esiNo', data.esiNo);
  payCell('v_department', data.department);
  payCell('v_bankName', data.bankName);
  payCell('v_doj', data.doj);
  payCell('v_bankAccount', data.bankAccount);
  payCell('v_grossWage', '₹ ' + formatMoney(data.grossWage));
  payCell('v_mailId', data.mailId);
  payCell('v_totalWorkingDays', data.totalWorkingDays);
  payCell('v_paidDays', data.paidDays);
  payCell('v_lopDays', data.lopDays);
  payCell('v_leavesTaken', data.leavesTaken);
  payMoney('v_basicWage', data.basicWage);
  payMoney('v_hra', data.hra);
  payMoney('v_conveyance', data.conveyance);
  payMoney('v_dearnessAllowance', data.dearnessAllowance);
  payMoney('v_otherAllowance', data.otherAllowance);
  payMoney('v_epf', data.epf);
  payMoney('v_esiDeduction', data.esiDeduction);
  payMoney('v_professionalTax', data.professionalTax);
  payMoney('v_loanRecovery', data.loanRecovery);
  payMoney('v_tds', data.tds);
  payMoney('v_totalEarnings', data.totalEarnings);
  payMoney('v_totalDeductions', data.totalDeductions);
  payCell('v_netSalary', '₹ ' + formatMoney(data.netSalary));
  payCell('v_netWords', data.netWords);

  if(qs('logoImg')) qs('logoImg').src = settings.logoData || 'assets/logo.jpg';
  if(qs('signImg')) qs('signImg').src = settings.signatureData || 'assets/signature.jpg';

  qs('savePayslipBtn').onclick = async ()=>{
    const msg = qs('previewMsg');
    try{
      await api('/api/payslips', { method:'POST', body: JSON.stringify(data) });
      msg.textContent = 'Payslip saved to history';
    }catch(err){
      msg.textContent = err.message;
    }
  };

  qs('downloadPdfBtn').onclick = async ()=>{
    const msg = qs('previewMsg');
    try{
      const element = document.getElementById('payslipPrintable');
      if(document.fonts && document.fonts.ready){ await document.fonts.ready; }
      const canvas = await html2canvas(element, { scale:2, useCORS:true, backgroundColor:'#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p','mm','a4');
      const width = 210;
      const height = canvas.height * width / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, width, Math.min(height, 297));
      pdf.save('payslip.pdf');
      msg.textContent = 'PDF downloaded';
    }catch(err){
      msg.textContent = 'PDF failed';
    }
  };
}

async function initHistory(){
  const body = qs('historyBody'); if(!body) return;
  const q1 = qs('searchName'); const q2 = qs('searchMonth');

  async function render(){
    const allPayslips = await getPayslips();
    const name = (q1.value||'').toLowerCase();
    const month = (q2.value||'').toLowerCase();
    const rows = allPayslips.filter(p => (p.employeeName || '').toLowerCase().includes(name) && (p.monthYear || '').toLowerCase().includes(month));
    body.innerHTML = rows.map(p=>`<tr><td>${p.employeeName}</td><td>${p.employeeId}</td><td>${p.monthYear}</td><td>₹ ${formatMoney(p.netSalary)}</td><td>${p.createdAt||''}</td><td><div class="row-actions"><button class="btn secondary" onclick="openHistoryPayslip('${p.id}')">Open</button><button class="btn secondary" onclick="removePayslip('${p.id}')">Delete</button></div></td></tr>`).join('') || '<tr><td colspan="6">No payslips found</td></tr>';
  }

  q1.addEventListener('input', render);
  q2.addEventListener('input', render);
  render();
}

async function openHistoryPayslip(id){
  const p = await api('/api/payslips/' + id);
  localStorage.setItem('currentPayslip', JSON.stringify(p));
  location.href='payslip-preview.html';
}

async function removePayslip(id){
  if(!confirm('Delete this payslip?')) return;
  await api('/api/payslips/' + id, { method:'DELETE' });
  location.reload();
}

async function initSettings(){
  const s = await getSettings();
  ['companyName','address1','address2','cin','email','footerCompany','footerName','footerRole'].forEach(k=>{
    if(qs(k)) qs(k).value = s[k] || '';
  });
  if(qs('logoPreview')) qs('logoPreview').src = s.logoData || 'assets/logo.jpg';
  if(qs('signaturePreview')) qs('signaturePreview').src = s.signatureData || 'assets/signature.jpg';

  const form = qs('settingsForm');
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const logoFile = qs('logoFile').files[0];
    const signatureFile = qs('signatureFile').files[0];

    function fileToData(file){
      return new Promise((resolve)=> {
        if(!file) return resolve('');
        const reader = new FileReader();
        reader.onload = ev => resolve(ev.target.result);
        reader.readAsDataURL(file);
      });
    }

    const payload = {
      companyName: qs('companyName').value,
      address1: qs('address1').value,
      address2: qs('address2').value,
      cin: qs('cin').value,
      email: qs('email').value,
      footerCompany: qs('footerCompany').value,
      footerName: qs('footerName').value,
      footerRole: qs('footerRole').value,
      logoData: s.logoData || '',
      signatureData: s.signatureData || ''
    };

    if(logoFile) payload.logoData = await fileToData(logoFile);
    if(signatureFile) payload.signatureData = await fileToData(signatureFile);

    const saved = await api('/api/settings', { method:'PUT', body: JSON.stringify(payload) });
    qs('settingsMsg').textContent = 'Settings saved';
    qs('logoPreview').src = saved.logoData || 'assets/logo.jpg';
    qs('signaturePreview').src = saved.signatureData || 'assets/signature.jpg';
  });
}
