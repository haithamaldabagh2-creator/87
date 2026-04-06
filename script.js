const STORAGE_KEY = 'carContractsAppRecords';

const tabs = document.querySelectorAll('.nav-btn');
const pages = document.querySelectorAll('.tab-page');
const form = document.getElementById('contractForm');
const searchInput = document.getElementById('searchInput');
const recordsContainer = document.getElementById('recordsContainer');
const editBadge = document.getElementById('editBadge');
const previewModal = document.getElementById('previewModal');
const previewContent = document.getElementById('previewContent');

const fields = {
  recordId: document.getElementById('recordId'),
  contractNumber: document.getElementById('contractNumber'),
  contractDate: document.getElementById('contractDate'),
  sellerName: document.getElementById('sellerName'),
  sellerIdNumber: document.getElementById('sellerIdNumber'),
  sellerProfession: document.getElementById('sellerProfession'),
  sellerPhone: document.getElementById('sellerPhone'),
  sellerAddress: document.getElementById('sellerAddress'),
  sellerIssueDate: document.getElementById('sellerIssueDate'),
  buyerName: document.getElementById('buyerName'),
  buyerIdNumber: document.getElementById('buyerIdNumber'),
  buyerProfession: document.getElementById('buyerProfession'),
  buyerPhone: document.getElementById('buyerPhone'),
  buyerAddress: document.getElementById('buyerAddress'),
  buyerIssueDate: document.getElementById('buyerIssueDate'),
  carType: document.getElementById('carType'),
  carModel: document.getElementById('carModel'),
  carColor: document.getElementById('carColor'),
  engineNumber: document.getElementById('engineNumber'),
  chassisNumber: document.getElementById('chassisNumber'),
  carPrice: document.getElementById('carPrice'),
  paidAmount: document.getElementById('paidAmount'),
  remainingAmount: document.getElementById('remainingAmount'),
  installmentAmount: document.getElementById('installmentAmount'),
  installmentMonths: document.getElementById('installmentMonths'),
  delayNote: document.getElementById('delayNote'),
  generalNotes: document.getElementById('generalNotes'),
  contractTerms: document.getElementById('contractTerms')
};

function getRecords() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-US');
}

function calculateRemaining() {
  const total = Number(fields.carPrice.value || 0);
  const paid = Number(fields.paidAmount.value || 0);
  const remaining = Math.max(total - paid, 0);
  fields.remainingAmount.value = remaining;
}

function collectFormData() {
  calculateRemaining();
  return Object.fromEntries(Object.entries(fields).map(([key, el]) => [key, el.value.trim()]));
}

function setFormData(data) {
  Object.entries(fields).forEach(([key, el]) => {
    el.value = data?.[key] ?? '';
  });
  calculateRemaining();
}

function resetForm() {
  form.reset();
  fields.recordId.value = '';
  fields.carPrice.value = 0;
  fields.paidAmount.value = 0;
  fields.remainingAmount.value = 0;
  fields.installmentAmount.value = 0;
  fields.installmentMonths.value = 0;
  editBadge.classList.add('hidden');
}

function switchTab(tabName) {
  tabs.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabName));
  pages.forEach(page => page.classList.toggle('active', page.id === `tab-${tabName}`));
}

function renderRecords(filter = '') {
  const records = getRecords();
  const query = filter.trim().toLowerCase();
  const filtered = records.filter(record => {
    const haystack = [
      record.contractNumber,
      record.sellerName,
      record.buyerName,
      record.carType,
      record.carModel
    ].join(' ').toLowerCase();
    return haystack.includes(query);
  });

  if (!filtered.length) {
    recordsContainer.innerHTML = `<div class="empty-state">لا توجد استمارات مطابقة حاليًا.</div>`;
    updateDashboard(records);
    return;
  }

  recordsContainer.innerHTML = filtered.map(record => `
    <article class="record-item">
      <div class="record-top">
        <div>
          <h3 class="record-title">عقد رقم ${escapeHtml(record.contractNumber || '-')}</h3>
          <div class="record-meta">
            <span><i class="fa-solid fa-user"></i> البائع: ${escapeHtml(record.sellerName || '-')}</span>
            <span><i class="fa-solid fa-user-check"></i> المشتري: ${escapeHtml(record.buyerName || '-')}</span>
          </div>
        </div>
        <span class="badge">${escapeHtml(record.contractDate || 'بدون تاريخ')}</span>
      </div>
      <div class="record-values">
        <div class="value-box"><span>نوع السيارة</span><strong>${escapeHtml(record.carType || '-')} ${escapeHtml(record.carModel || '')}</strong></div>
        <div class="value-box"><span>السعر</span><strong>${formatNumber(record.carPrice)}</strong></div>
        <div class="value-box"><span>المسدد</span><strong>${formatNumber(record.paidAmount)}</strong></div>
        <div class="value-box"><span>المتبقي</span><strong>${formatNumber(record.remainingAmount)}</strong></div>
      </div>
      <div class="record-actions">
        <button class="record-btn view" onclick="showPreview('${record.recordId}')"><i class="fa-solid fa-eye"></i> عرض</button>
        <button class="record-btn edit" onclick="editRecord('${record.recordId}')"><i class="fa-solid fa-pen"></i> تعديل</button>
        <button class="record-btn print" onclick="printRecord('${record.recordId}')"><i class="fa-solid fa-print"></i> طباعة</button>
        <button class="record-btn delete" onclick="deleteRecord('${record.recordId}')"><i class="fa-solid fa-trash"></i> حذف</button>
      </div>
    </article>
  `).join('');

  updateDashboard(records);
}

function updateDashboard(records = getRecords()) {
  const totalContracts = records.length;
  const dueCount = records.filter(item => Number(item.remainingAmount) > 0).length;
  const names = new Set(records.flatMap(item => [item.sellerName, item.buyerName]).filter(Boolean));

  document.getElementById('contractsCount').textContent = totalContracts;
  document.getElementById('dueCount').textContent = dueCount;
  document.getElementById('clientsCount').textContent = names.size;

  const totalValue = records.reduce((sum, item) => sum + Number(item.carPrice || 0), 0);
  const totalPaid = records.reduce((sum, item) => sum + Number(item.paidAmount || 0), 0);
  const totalRemaining = records.reduce((sum, item) => sum + Number(item.remainingAmount || 0), 0);

  document.getElementById('reportTotalContracts').textContent = formatNumber(totalContracts);
  document.getElementById('reportTotalValue').textContent = formatNumber(totalValue);
  document.getElementById('reportPaidValue').textContent = formatNumber(totalPaid);
  document.getElementById('reportRemainingValue').textContent = formatNumber(totalRemaining);

  const alertsList = document.getElementById('alertsList');
  const dueRecords = records.filter(item => Number(item.remainingAmount) > 0);

  if (!dueRecords.length) {
    alertsList.innerHTML = '<div class="empty-state">لا توجد تنبيهات حالياً.</div>';
    return;
  }

  alertsList.innerHTML = dueRecords.slice(0, 6).map(item => `
    <div class="alert-item">
      <div>
        <strong>${escapeHtml(item.buyerName || item.sellerName || 'بدون اسم')}</strong>
        <p>المتبقي: ${formatNumber(item.remainingAmount)}${item.delayNote ? ' - ' + escapeHtml(item.delayNote) : ''}</p>
      </div>
      <span class="badge">${escapeHtml(item.contractNumber || '-')}</span>
    </div>
  `).join('');
}

function editRecord(id) {
  const record = getRecords().find(item => item.recordId === id);
  if (!record) return;
  setFormData(record);
  editBadge.classList.remove('hidden');
  switchTab('contract');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteRecord(id) {
  const confirmed = confirm('هل أنت متأكد من حذف هذه الاستمارة؟');
  if (!confirmed) return;
  const updated = getRecords().filter(item => item.recordId !== id);
  saveRecords(updated);
  renderRecords(searchInput.value);
}

function printData(record) {
  if (!record) return;
  const printContent = document.getElementById('printContent');
  
  printContent.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; background-color: #555; color: #ffcc00; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-family: 'Cairo', sans-serif;">
      <div style="text-align: center; flex: 1;">
        <h2 style="margin: 0; font-size: 24px; color: #ffcc00;">Mega Cars Show</h2>
        <div style="background-color: #ffcc00; color: #000; padding: 5px 10px; border-radius: 5px; margin-top: 8px; font-weight: bold; font-size: 14px; display: inline-block;">For all types of cars trading</div>
      </div>
      <div style="text-align: center; flex: 1.5;">
        <h1 style="margin: 0; font-size: 32px; border-top: 2px solid #ffcc00; border-bottom: 2px solid #ffcc00; padding: 5px 0; color: #fff;">Mega Cars</h1>
        <p style="margin: 8px 0 0; font-size: 18px; color: #ffcc00;">لبيع وشراء السيارات</p>
      </div>
      <div style="text-align: center; flex: 1; direction: rtl;">
        <h2 style="margin: 0; font-size: 24px; color: #ffcc00;">معرض ميگا كارس</h2>
        <div style="background-color: #ffcc00; color: #000; padding: 5px 10px; border-radius: 5px; margin-top: 8px; font-weight: bold; font-size: 14px; display: inline-block;">دهوك - پيشائگه هين ترومبيلا<br>تيرمنال معرض رقم 27</div>
      </div>
    </div>

    <div style="text-align: center; font-size: 22px; font-weight: bold; margin-bottom: 20px; text-decoration: underline;">عقد بيع وشراء سيارة</div>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;" border="1" bordercolor="#333">
        <tr>
            <td style="padding: 10px; width: 50%;"><strong>رقم العقد:</strong> ${escapeHtml(record.contractNumber || '-')}</td>
            <td style="padding: 10px; width: 50%;"><strong>تاريخ العقد:</strong> ${escapeHtml(record.contractDate || '-')}</td>
        </tr>
    </table>

    <h3 style="margin-bottom: 8px; font-size: 18px; color: #000; border-bottom: 2px solid #ccc; padding-bottom: 5px;">الطرف الأول (البائع)</h3>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;" border="1" bordercolor="#333">
        <tr>
            <td style="padding: 10px; width: 50%;"><strong>الاسم:</strong> ${escapeHtml(record.sellerName || '-')}</td>
            <td style="padding: 10px; width: 50%;"><strong>رقم الهوية:</strong> ${escapeHtml(record.sellerIdNumber || '-')}</td>
        </tr>
        <tr>
            <td style="padding: 10px; width: 50%;"><strong>المهنة:</strong> ${escapeHtml(record.sellerProfession || '-')}</td>
            <td style="padding: 10px; width: 50%;"><strong>تاريخ الإصدار:</strong> ${escapeHtml(record.sellerIssueDate || '-')}</td>
        </tr>
        <tr>
            <td style="padding: 10px; width: 50%;"><strong>رقم الهاتف:</strong> ${escapeHtml(record.sellerPhone || '-')}</td>
            <td style="padding: 10px; width: 50%;"><strong>السكن:</strong> ${escapeHtml(record.sellerAddress || '-')}</td>
        </tr>
    </table>

    <h3 style="margin-bottom: 8px; font-size: 18px; color: #000; border-bottom: 2px solid #ccc; padding-bottom: 5px;">الطرف الثاني (المشتري)</h3>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;" border="1" bordercolor="#333">
        <tr>
            <td style="padding: 10px; width: 50%;"><strong>الاسم:</strong> ${escapeHtml(record.buyerName || '-')}</td>
            <td style="padding: 10px; width: 50%;"><strong>رقم الهوية:</strong> ${escapeHtml(record.buyerIdNumber || '-')}</td>
        </tr>
        <tr>
            <td style="padding: 10px; width: 50%;"><strong>المهنة:</strong> ${escapeHtml(record.buyerProfession || '-')}</td>
            <td style="padding: 10px; width: 50%;"><strong>تاريخ الإصدار:</strong> ${escapeHtml(record.buyerIssueDate || '-')}</td>
        </tr>
        <tr>
            <td style="padding: 10px; width: 50%;"><strong>رقم الهاتف:</strong> ${escapeHtml(record.buyerPhone || '-')}</td>
            <td style="padding: 10px; width: 50%;"><strong>السكن:</strong> ${escapeHtml(record.buyerAddress || '-')}</td>
        </tr>
    </table>

    <h3 style="margin-bottom: 8px; font-size: 18px; color: #000; border-bottom: 2px solid #ccc; padding-bottom: 5px;">بيانات السيارة والمبالغ</h3>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;" border="1" bordercolor="#333">
        <tr>
            <td style="padding: 10px; width: 33%;"><strong>نوع السيارة:</strong> ${escapeHtml(record.carType || '-')}</td>
            <td style="padding: 10px; width: 33%;"><strong>الموديل:</strong> ${escapeHtml(record.carModel || '-')}</td>
            <td style="padding: 10px; width: 33%;"><strong>اللون:</strong> ${escapeHtml(record.carColor || '-')}</td>
        </tr>
        <tr>
            <td style="padding: 10px; width: 50%;" colspan="1"><strong>رقم المحرك:</strong> ${escapeHtml(record.engineNumber || '-')}</td>
            <td style="padding: 10px; width: 50%;" colspan="2"><strong>رقم الشاصي:</strong> ${escapeHtml(record.chassisNumber || '-')}</td>
        </tr>
        <tr>
            <td style="padding: 10px;"><strong>السعر الكلي:</strong> ${formatNumber(record.carPrice)}</td>
            <td style="padding: 10px;"><strong>المبلغ المسدد:</strong> ${formatNumber(record.paidAmount)}</td>
            <td style="padding: 10px;"><strong>المبلغ المتبقي:</strong> ${formatNumber(record.remainingAmount)}</td>
        </tr>
        <tr>
            <td style="padding: 10px;"><strong>مبلغ القسط:</strong> ${formatNumber(record.installmentAmount)}</td>
            <td style="padding: 10px;"><strong>عدد الأشهر:</strong> ${escapeHtml(record.installmentMonths || '0')}</td>
            <td style="padding: 10px;"><strong>ملاحظات الأقساط:</strong> ${escapeHtml(record.delayNote || '-')}</td>
        </tr>
    </table>

    <h3 style="margin-bottom: 8px; font-size: 18px; color: #000; border-bottom: 2px solid #ccc; padding-bottom: 5px;">الملاحظات والشروط</h3>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;" border="1" bordercolor="#333">
        <tr>
            <td style="padding: 10px; min-height: 60px; vertical-align: top;">
                <strong>ملاحظات إضافية:</strong><br>${escapeHtml(record.generalNotes || '-').replace(/\n/g, '<br>')}
            </td>
        </tr>
        <tr>
            <td style="padding: 10px; min-height: 80px; vertical-align: top;">
                <strong>شروط العقد:</strong><br>${escapeHtml(record.contractTerms || '-').replace(/\n/g, '<br>')}
            </td>
        </tr>
    </table>

    <div style="display: flex; justify-content: space-between; margin-top: 50px; text-align: center; padding: 0 50px;">
        <div>
            <h4 style="margin-bottom: 40px; color: #000;">توقيع الطرف الأول (البائع)</h4>
            <p>.......................................</p>
        </div>
        <div>
            <h4 style="margin-bottom: 40px; color: #000;">توقيع الطرف الثاني (المشتري)</h4>
            <p>.......................................</p>
        </div>
    </div>
  `;
  window.print();
}

function printRecord(id) {
  const record = getRecords().find(item => item.recordId === id);
  printData(record);
}

function createPreviewHtml(record) {
  return `
    <div class="preview-grid">
      <div class="preview-block">
        <h4>بيانات العقد</h4>
        <p>رقم العقد: ${escapeHtml(record.contractNumber || '-')}</p>
        <p>التاريخ: ${escapeHtml(record.contractDate || '-')}</p>
        <p>نوع السيارة: ${escapeHtml(record.carType || '-')}</p>
        <p>الموديل: ${escapeHtml(record.carModel || '-')}</p>
        <p>اللون: ${escapeHtml(record.carColor || '-')}</p>
      </div>
      <div class="preview-block">
        <h4>المبالغ</h4>
        <p>السعر: ${formatNumber(record.carPrice)}</p>
        <p>المسدد: ${formatNumber(record.paidAmount)}</p>
        <p>المتبقي: ${formatNumber(record.remainingAmount)}</p>
        <p>مبلغ القسط: ${formatNumber(record.installmentAmount)}</p>
        <p>عدد الأشهر: ${escapeHtml(record.installmentMonths || '0')}</p>
      </div>
      <div class="preview-block">
        <h4>البائع</h4>
        <p>الاسم: ${escapeHtml(record.sellerName || '-')}</p>
        <p>الهاتف: ${escapeHtml(record.sellerPhone || '-')}</p>
        <p>الهوية: ${escapeHtml(record.sellerIdNumber || '-')}</p>
        <p>السكن: ${escapeHtml(record.sellerAddress || '-')}</p>
      </div>
      <div class="preview-block">
        <h4>المشتري</h4>
        <p>الاسم: ${escapeHtml(record.buyerName || '-')}</p>
        <p>الهاتف: ${escapeHtml(record.buyerPhone || '-')}</p>
        <p>الهوية: ${escapeHtml(record.buyerIdNumber || '-')}</p>
        <p>السكن: ${escapeHtml(record.buyerAddress || '-')}</p>
      </div>
    </div>
    <div class="preview-full">
      <h4>الملاحظات والشروط</h4>
      <p><strong>ملاحظات إضافية:</strong><br>${escapeHtml(record.generalNotes || '-').replace(/\n/g, '<br>')}</p>
      <p><strong>شروط العقد:</strong><br>${escapeHtml(record.contractTerms || '-').replace(/\n/g, '<br>')}</p>
      <p><strong>ملاحظات الأقساط:</strong> ${escapeHtml(record.delayNote || '-')}</p>
      <p><strong>رقم المحرك:</strong> ${escapeHtml(record.engineNumber || '-')} | <strong>رقم الشاصي:</strong> ${escapeHtml(record.chassisNumber || '-')}</p>
    </div>
  `;
}

function showPreview(id = null) {
  const data = id ? getRecords().find(item => item.recordId === id) : collectFormData();
  if (!data) return;
  previewContent.innerHTML = createPreviewHtml(data);
  previewModal.classList.remove('hidden');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = collectFormData();
  if (!data.sellerName || !data.buyerName) {
    alert('يرجى إدخال اسم البائع واسم المشتري على الأقل.');
    return;
  }

  const records = getRecords();
  if (data.recordId) {
    const index = records.findIndex(item => item.recordId === data.recordId);
    if (index !== -1) records[index] = data;
  } else {
    data.recordId = `rec_${Date.now()}`;
    records.unshift(data);
  }

  saveRecords(records);
  resetForm();
  renderRecords(searchInput.value);
  switchTab('records');
});

document.getElementById('resetFormBtn').addEventListener('click', resetForm);
document.getElementById('printPreviewBtn').addEventListener('click', () => showPreview());
document.getElementById('printFormBtn').addEventListener('click', () => printData(collectFormData()));
document.getElementById('closeModalBtn').addEventListener('click', () => previewModal.classList.add('hidden'));
previewModal.addEventListener('click', (e) => {
  if (e.target === previewModal) previewModal.classList.add('hidden');
});

[fields.carPrice, fields.paidAmount].forEach(input => input.addEventListener('input', calculateRemaining));
searchInput.addEventListener('input', (e) => renderRecords(e.target.value));

tabs.forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

document.getElementById('clearDataBtn').addEventListener('click', () => {
  if (!confirm('هل تريد حذف جميع البيانات نهائياً؟')) return;
  localStorage.removeItem(STORAGE_KEY);
  renderRecords('');
  resetForm();
});

document.getElementById('exportDataBtn').addEventListener('click', () => {
  const data = JSON.stringify(getRecords(), null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'car-contract-records.json';
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('importTriggerBtn').addEventListener('click', () => {
  document.getElementById('importFileInput').click();
});

document.getElementById('importFileInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!Array.isArray(data)) throw new Error('invalid');
    saveRecords(data);
    renderRecords(searchInput.value);
    alert('تم استيراد البيانات بنجاح.');
  } catch {
    alert('ملف الاستيراد غير صالح.');
  }

  e.target.value = '';
});

window.editRecord = editRecord;
window.deleteRecord = deleteRecord;
window.showPreview = showPreview;
window.printRecord = printRecord;

resetForm();
renderRecords('');
