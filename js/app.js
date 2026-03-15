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
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });

  if (!res.ok) {
    let message = 'Request failed';
    try {
      const data = await res.json();
      message = data.error || message;
    } catch {}
    throw new Error(message);
  }

  return res.json();
}

function formatMoney(v){
  const n = Number(v || 0);
  return n.toLocaleString('en-IN');
}

function qs(id){
  return document.getElementById(id);
}

function requireLogin(){
  if(localStorage.getItem('loggedIn') !== 'true'){
    location.href='index.html';
  }
}

function logout(){
  localStorage.removeItem('loggedIn');
  location.href='index.html';
}

async function getEmployees(){
  return api('/api/employees');
}

async function getPayslips(){
  return api('/api/payslips');
}

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

  const numFields = [
    'grossWage','totalWorkingDays','paidDays','lopDays','leavesTaken',
    'basicWage','hra','conveyance','dearnessAllowance','otherAllowance',
    'epf','esiDeduction','professionalTax','loanRecovery','tds',
    'totalEarnings','totalDeductions','netSalary'
  ];

  numFields.forEach(function(k){
    data[k] = Number(data[k] || 0);
  });

  data.employeeName = data.employeeName || data.name || '';
  data.employeeId = data.employeeId || '';

  if((!data.month || !data.year) && data.monthPicker){
    const parts = String(data.monthPicker).split(' ');
    if(parts.length >= 2){
      data.month = parts[0];
      data.year = parts[1];
    }
  }

  data.monthYear =
    data.monthYear ||
    (((data.month || '') + ' ' + (data.year || '')).trim());

  data.id = data.id || ('ps_' + Date.now());
  data.createdAt = data.createdAt || new Date().toLocaleString();

  return data;
}

function initLogin(){

  const form = qs('loginForm');
  if(!form) return;

  form.addEventListener('submit', (e)=>{

    e.preventDefault();

    const email = qs('email').value.trim();
    const password = qs('password').value.trim();

    const err = qs('loginError');

    if(email === ADMIN_EMAIL && password === ADMIN_PASSWORD){
      localStorage.setItem('loggedIn','true');
      location.href='dashboard.html';
    }else{
      err.textContent = 'Invalid email or password';
    }

  });
}

async function renderSidebar(active){

  const mount = qs('sidebarMount');
  if(!mount) return;

  const settings = await getSettings();
  const logo = settings.logoData || 'assets/logo.jpg';

  mount.innerHTML = `
    <div id="sidebar" class="sidebar">

      <div class="brand">
        <img src="${logo}">
        <div>
          <h2>ASUNG BNS</h2>
          <p>Payslip Admin</p>
        </div>
      </div>

      <nav class="nav">

        <a class="${active==='dashboard'?'active':''}" href="dashboard.html">
          Dashboard
        </a>

        <a class="${active==='add-employee'?'active':''}" href="add-employee.html">
          Add Employee
        </a>

        <a class="${active==='employees'?'active':''}" href="employee-list.html">
          Employee List
        </a>

        <a class="${active==='create'?'active':''}" href="create-payslip.html">
          Create Payslip
        </a>

        <a class="${active==='history'?'active':''}" href="payslip-history.html">
          Payslip History
        </a>

        <a class="${active==='settings'?'active':''}" href="settings.html">
          Settings
        </a>

      </nav>

      <div class="sidebar-bottom">
        <button class="btn full secondary" onclick="logout()">
          Logout
        </button>
      </div>

    </div>
  `;
}

async function initShell(active,title){

  requireLogin();
  await renderSidebar(active);

  const h = qs('pageTitle');
  if(h) h.textContent = title;

  const btn = qs('mobileToggle');
  if(btn){
    btn.onclick = ()=> qs('sidebar').classList.toggle('open');
  }

}

async function initDashboard(){

  const employees = await getEmployees();
  const payslips = await getPayslips();

  qs('employeeCount').textContent = employees.length;
  qs('payslipCount').textContent = payslips.length;

  qs('latestMonthCount').textContent =
    [...new Set(payslips.map(p=>p.monthYear))].length;

  qs('netTotal').textContent =
    '₹ ' + formatMoney(
      payslips.reduce((a,b)=>a + Number(b.netSalary||0), 0)
    );

  const tbody = qs('recentBody');

  tbody.innerHTML =
    payslips.slice().reverse().slice(0,5).map(p=>`
      <tr>
        <td>${p.employeeName}</td>
        <td>${p.monthYear}</td>
        <td>₹ ${formatMoney(p.netSalary)}</td>
        <td>${p.createdAt||''}</td>
      </tr>
    `).join('')
    || '<tr><td colspan="4">No payslips yet</td></tr>';

}

function bindCalc(form){

  const calcInputs = form.querySelectorAll('[data-calc="1"]');

  const set = (id,val)=>{
    if(qs(id)) qs(id).value = val;
  };

  const calculate = ()=>{

    const gv = id => Number(qs(id)?.value || 0);

    const totalEarnings =
      gv('basicWage') +
      gv('hra') +
      gv('conveyance') +
      gv('dearnessAllowance') +
      gv('otherAllowance');

    const totalDeductions =
      gv('epf') +
      gv('esiDeduction') +
      gv('professionalTax') +
      gv('loanRecovery') +
      gv('tds');

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

  if(num === 0) return 'Zero Only';

  const ones = ['', 'One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
  'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen',
  'Seventeen','Eighteen','Nineteen'];

  const tens = ['', '', 'Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];

  function convert(n){

    let str = '';

    if(n > 99){
      str += ones[Math.floor(n/100)] + ' Hundred ';
      n = n % 100;
    }

    if(n > 19){
      str += tens[Math.floor(n/10)] + ' ';
      n = n % 10;
    }

    if(n > 0){
      str += ones[n] + ' ';
    }

    return str.trim();
  }

  let result = '';

  if(num >= 10000000){
    result += convert(Math.floor(num/10000000)) + ' Crore ';
    num %= 10000000;
  }

  if(num >= 100000){
    result += convert(Math.floor(num/100000)) + ' Lakh ';
    num %= 100000;
  }

  if(num >= 1000){
    result += convert(Math.floor(num/1000)) + ' Thousand ';
    num %= 1000;
  }

  if(num > 0){
    result += convert(num);
  }

  return result.trim() + ' Only';

}