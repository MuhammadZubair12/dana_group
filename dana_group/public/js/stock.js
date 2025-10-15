
async function fetchBatchData(element) {
  const batchNo = element.value.trim();
  const row = element.closest('tr');
  
  let modalError = document.getElementById('receiptModalError') || document.getElementById('issue-message');
  if (modalError) {
    modalError.textContent = '';
    modalError.classList.add('hidden');
  }
  
  if (!batchNo) {
    row.querySelector('.item-code').value = '';
    const warehouseInput = row.querySelector('.warehouse') || row.querySelector('.s-warehouse');
    if (warehouseInput) warehouseInput.value = '';
    
    row.querySelector('.available-qty').value = '';
    return;
  }
  
  element.disabled = true;
  try {
    const res = await fetch(`/api/method/dana_group.stock.get_batch_details?batch_no=${encodeURIComponent(batchNo)}`, { credentials: 'include' });
    const raw = await res.json();
    element.disabled = false;
    
    if (!raw || raw.message == null) {
      if (modalError) {
        modalError.textContent = 'Invalid response from server';
        modalError.classList.remove('hidden');
      }
      row.querySelector('.item-code').value = '';
      
      const warehouseInput = row.querySelector('.warehouse') || row.querySelector('.s-warehouse');
      if (warehouseInput) warehouseInput.value = '';
      
      row.querySelector('.available-qty').value = '';
      return;
    }
    
    const outer = raw.message;
    if (outer.status === 'error') {
      if (modalError) {
        modalError.textContent = outer.message || 'Batch not found';
        modalError.classList.remove('hidden');
      }
      row.querySelector('.item-code').value = '';
      const warehouseInput = row.querySelector('.warehouse') || row.querySelector('.s-warehouse');
      if (warehouseInput) {
        if (warehouseInput.tagName === 'SELECT') {
          const input = document.createElement('input');
          input.type = 'text';
          input.className = warehouseInput.className;
          input.id = warehouseInput.id || '';
          input.name = warehouseInput.name || '';
          warehouseInput.replaceWith(input);
          input.value = '';
        } else {
          warehouseInput.value = '';
        }
      }
      
      row.querySelector('.available-qty').value = '';
      return;
    }
    
    const msg = outer.message || {};
    row.querySelector('.item-code').value = msg.item_code || '';
    const warehouseInput = row.querySelector('.warehouse') || row.querySelector('.s-warehouse');
    const warehouses = Array.isArray(msg.warehouses) ? msg.warehouses : [];
    
    if (warehouseInput) {
      if (warehouses.length > 1) {
        const select = document.createElement('select');
        select.className = warehouseInput.className + ' border p-2 rounded w-full bg-white';
        select.innerHTML = warehouses.map(w => `<option value="${w.warehouse}" data-qty="${w.available_qty}">${w.warehouse} — ${w.available_qty}</option>`).join('');
        select.id = warehouseInput.id || '';
        select.name = warehouseInput.name || '';
        warehouseInput.replaceWith(select);
        
        select.addEventListener('change', () => {
          const qty = select.selectedOptions[0]?.dataset?.qty || '';
          row.querySelector('.available-qty').value = qty;
        });
        
        select.dispatchEvent(new Event('change'));
      } else if (warehouses.length === 1) {
        const w = warehouses[0];
        if (warehouseInput.tagName === 'SELECT') {
          warehouseInput.innerHTML = `<option value="${w.warehouse}">${w.warehouse}</option>`;
        } else {
          warehouseInput.value = w.warehouse || '';
        }
        row.querySelector('.available-qty').value = (w.available_qty != null) ? w.available_qty : (msg.batch_qty || '');
      } else {
        if (warehouseInput.tagName === 'SELECT') {
          const input = document.createElement('input');
          input.type = 'text';
          input.className = warehouseInput.className;
          input.id = warehouseInput.id || '';
          input.name = warehouseInput.name || '';
          warehouseInput.replaceWith(input);
          input.value = msg.batch_warehouse || '';
        } else {
          warehouseInput.value = msg.batch_warehouse || '';
        }
        row.querySelector('.available-qty').value = msg.batch_qty != null ? msg.batch_qty : '';
      }
    } else {
      console.error('Warehouse input not found - check class names');
    }
    
    row.querySelector('.qty').focus();
  } catch (err) {
    element.disabled = false;
    if (modalError) {
      modalError.textContent = 'Error fetching batch details';
      modalError.classList.remove('hidden');
    }
    console.error(err);
  }

}

async function fetchBatchDataold(element) {
  const batchNo = element.value.trim();
  if (!batchNo) return;
  const row = element.closest('tr');
  element.disabled = true;
  try {
    const res = await fetch(`/api/method/dana_group.stock.get_batch_details?batch_no=${encodeURIComponent(batchNo)}`, { credentials: 'include' });
    const raw = await res.json();
    element.disabled = false;
    if (!raw || raw.message == null) {
      row.querySelector('.item-code').value = '';
      row.querySelector('.available-qty').value = '';
      return;
    }
    const outer = raw.message;
    if (outer.status === 'error') {
      row.querySelector('.item-code').value = '';
      row.querySelector('.warehouse').value = '';
      row.querySelector('.available-qty').value = '';
      return;
    }
    const msg = outer.message || {};
    row.querySelector('.item-code').value = msg.item_code || '';
    const whInput = row.querySelector('.warehouse');
    const warehouses = Array.isArray(msg.warehouses) ? msg.warehouses : [];
    if (warehouses.length > 1) {
      const select = document.createElement('select');
      select.className = whInput.className + ' border p-2 rounded w-full bg-white';
      select.innerHTML = warehouses.map(w => `<option value="${w.warehouse}" data-qty="${w.available_qty}">${w.warehouse} — ${w.available_qty}</option>`).join('');
      select.id = whInput.id || '';
      select.name = whInput.name || '';
      whInput.replaceWith(select);
      select.addEventListener('change', () => {
        const qty = select.selectedOptions[0]?.dataset?.qty || '';
        row.querySelector('.available-qty').value = qty;
      });
      select.dispatchEvent(new Event('change'));
    } else if (warehouses.length === 1) {
      const w = warehouses[0];
      if (whInput.tagName === 'SELECT') {
        whInput.innerHTML = `<option value="${w.warehouse}">${w.warehouse}</option>`;
      } else {
        whInput.value = w.warehouse || '';
      }
      row.querySelector('.available-qty').value = (w.available_qty != null) ? w.available_qty : (msg.batch_qty || '');
    } else {
      if (whInput.tagName === 'SELECT') {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = whInput.className;
        input.id = whInput.id || '';
        input.name = whInput.name || '';
        whInput.replaceWith(input);
        input.value = '';
      } else {
        whInput.value = '';
      }
      row.querySelector('.available-qty').value = msg.batch_qty != null ? msg.batch_qty : '';
    }
    row.querySelector('.qty').focus();
  } catch (err) {
    element.disabled = false;
    console.error('Error fetching batch details', err);
  }
}




// document.addEventListener('DOMContentLoaded', function () {
//   const saveBtn = document.getElementById('save-receipt-btn');
//   if (!saveBtn) return;

//   saveBtn.addEventListener('click', async function (e) {
//     const btn = this;
//     const spinner = document.getElementById('save-receipt-spinner');
//     const rows = Array.from(document.querySelectorAll('#receiptModal tbody tr'));
//     if (rows.length === 0) {
//       alert('Add at least one row');
//       return;
//     }

//     const machineName = (document.getElementById('machine_name') || {}).value.trim() || '';
//     const operatorName = (document.getElementById('operator_name') || {}).value.trim() || '';

//     const items = rows.map(row => {
//       const batchEl = row.querySelector('.batch-no');
//       const itemEl = row.querySelector('.item-code');
//       const qtyEl = row.querySelector('.qty');
//       const uomEl = row.querySelector('.uom');
//       const whEl = row.querySelector('.warehouse');
//       return {
//         batch_no: (batchEl && batchEl.value || '').trim(),
//         item_code: (itemEl && itemEl.value || '').trim(),
//         qty: parseFloat((qtyEl && qtyEl.value) || 0),
//         uom: uomEl ? uomEl.value : undefined,
//         warehouse: (whEl && (whEl.tagName === 'SELECT' ? whEl.value : whEl.value) || '').trim()
//       };
//     });

//     for (const it of items) {
//       if (!it.item_code || !it.qty || it.qty <= 0) {
//         alert('Each row requires valid Item and positive Qty');
//         return;
//       }
//     }

//     const payload = {
//       posting_date: (new Date()).toISOString().slice(0, 10),
//       posting_time: (new Date()).toTimeString().split(' ')[0],
//       to_warehouse: items[0].warehouse || '',
//       // send both names (backend can accept either)
//       custom_machine_name: machineName,
//       custom_operator_name: operatorName,
//       machine_name: machineName,
//       operator_name: operatorName,
//       items
//     };

//     const form = new FormData();
//     form.append('data', JSON.stringify(payload));
//     spinner.classList.remove('hidden');
//     btn.disabled = true;

//     try {
//       const res = await fetch('/api/method/dana_group.stock.create_material_receipt', {
//         method: 'POST',
//         credentials: 'include',
//         body: form
//       });
//       const data = await res.json();
//       spinner.classList.add('hidden');
//       btn.disabled = false;
//       if (data && ((data.message && data.message.status === 'success') || (data.message && data.message.name) || data.status === 'success')) {
//         document.getElementById('receiptModal').classList.remove('is-open');
//         document.querySelector('#receiptModal tbody').innerHTML = '';
//         alert('Receipt created: ' + ((data.message && data.message.name) || ''));
//       } else {
//         const err = (data && data.message && data.message.message) || JSON.stringify(data);
//         alert('Error creating receipt: ' + err);
//       }
//     } catch (err) {
//       spinner.classList.add('hidden');
//       btn.disabled = false;
//       console.error('Error creating receipt', err);
//       alert('Error creating receipt. Check console.');
//     }
//   });
// });















// document.addEventListener('DOMContentLoaded', function () {
//   const issueModal = document.getElementById('issueModal');
//   const tbody = document.querySelector('#issueModal tbody');
//   const addRowBtn = document.querySelector('#issueModal .add-row-btn');
//   const issueForm = issueModal.querySelector('form');

//   const saveBtn = document.getElementById('save-issue-btn');
//   const saveText = document.getElementById('save-issue-text');
//   const saveSpinner = document.getElementById('save-issue-spinner');
//   const messageEl = document.getElementById('issue-message');

//   const salesOrderInput = document.getElementById('issue-sales-order');
//   const salesmanInput = document.getElementById('issue-salesman');
//   const machineInput = document.getElementById('issue-machine');
//   const operatorInput = document.getElementById('issue-operator');

//   function showButtonLoading() {
//     if (saveSpinner) saveSpinner.classList.remove('hidden');
//     if (saveText) saveText.textContent = 'Saving...';
//     if (saveBtn) saveBtn.disabled = true;
//   }
//   function hideButtonLoading() {
//     if (saveSpinner) saveSpinner.classList.add('hidden');
//     if (saveText) saveText.textContent = 'Save Issue';
//     if (saveBtn) saveBtn.disabled = false;
//   }
//   function showMessage(text, type) {
//     if (!messageEl) return;
//     messageEl.textContent = text || '';
//     messageEl.classList.remove('text-red-600', 'text-green-600', 'text-gray-700', 'hidden');
//     if (type === 'success') messageEl.classList.add('text-green-600');
//     else if (type === 'error') messageEl.classList.add('text-red-600');
//     else messageEl.classList.add('text-gray-700');
//   }
//   function clearMessage() {
//     if (!messageEl) return;
//     messageEl.textContent = '';
//     messageEl.classList.add('hidden');
//     messageEl.classList.remove('text-red-600', 'text-green-600', 'text-gray-700');
//   }

//   function createRowHtml() {
//     return `
//       <tr>
//         <td>
//           <input type="text" onblur="window.__fetchIssueBatchData && window.__fetchIssueBatchData(this)" class="batch-no border p-2 rounded w-full">
//           <div class="batch-error text-sm text-red-600 mt-1 hidden"></div>
//         </td>
//         <td><input type="text" class="item-code border p-2 rounded w-full bg-gray-100" readonly></td>
//         <td><input type="text" class="s-warehouse border p-2 rounded w-full bg-gray-100" readonly></td>
//         <td><input type="number" class="available-qty border p-2 rounded w-full bg-gray-100 text-right" readonly></td>
//         <td><input type="number" step="any" class="qty border p-2 rounded w-full text-right"></td>
//         <td><button type="button" class="remove-row-btn text-red-500" style="padding:10px !important">X</button></td>
//       </tr>
//     `;
//   }

//   function addRow() { tbody.insertAdjacentHTML('beforeend', createRowHtml()); }
//   addRowBtn.addEventListener('click', addRow);

//   tbody.addEventListener('click', function (e) {
//     const btn = e.target.closest('.remove-row-btn');
//     if (btn) btn.closest('tr').remove();
//   });

//   function findRowByBatchAndItem(batch_no, item_code) {
//     batch_no = (batch_no || '').trim();
//     item_code = (item_code || '').trim();
//     if (!batch_no && !item_code) return null;
//     const rows = Array.from(tbody.querySelectorAll('tr'));
//     return rows.find(r => {
//       const b = (r.querySelector('.batch-no') && r.querySelector('.batch-no').value || '').trim();
//       const i = (r.querySelector('.item-code') && r.querySelector('.item-code').value || '').trim();
//       return b === batch_no || (b === batch_no && i === item_code) || (i === item_code && i !== '');
//     }) || null;
//   }

//   window.__fetchIssueBatchData = async function (element) {
//     const batchNo = (element.value || '').trim();
//     const row = element.closest('tr');
//     const errorEl = row.querySelector('.batch-error');
//     if (errorEl) { errorEl.textContent = ''; errorEl.classList.add('hidden'); }

//     if (!batchNo) {
//       row.querySelector('.item-code').value = '';
//       row.querySelector('.s-warehouse').value = '';
//       row.querySelector('.available-qty').value = '';
//       return;
//     }

//     const existing = findRowByBatchAndItem(batchNo, '');
//     if (existing && existing !== row && existing.querySelector('.batch-no').value.trim() === batchNo) {
//       existing.querySelector('.qty').focus();
//       if ((row.querySelector('.item-code').value || '') === '') row.remove();
//       return;
//     }

//     element.disabled = true;
//     try {
//       const res = await fetch(`/api/method/dana_group.stock.get_batch_details?batch_no=${encodeURIComponent(batchNo)}`, { credentials: 'include' });
//       const raw = await res.json();
//       element.disabled = false;

//       if (!raw || raw.message == null) {
//         if (errorEl) { errorEl.textContent = 'Invalid response from server'; errorEl.classList.remove('hidden'); }
//         row.querySelector('.item-code').value = '';
//         row.querySelector('.s-warehouse').value = '';
//         row.querySelector('.available-qty').value = '';
//         return;
//       }
//       const outer = raw.message;
//       if (outer.status === 'error') {
//         if (errorEl) { errorEl.textContent = outer.message || 'Batch not found'; errorEl.classList.remove('hidden'); }
//         row.querySelector('.item-code').value = '';
//         row.querySelector('.s-warehouse').value = '';
//         row.querySelector('.available-qty').value = '';
//         return;
//       }

//       const msg = outer.message || {};
//       const itemCode = msg.item_code || '';
//       row.querySelector('.item-code').value = itemCode;

//       const warehousesFromBatch = Array.isArray(msg.warehouses) ? msg.warehouses : [];
//       if (warehousesFromBatch.length > 0) {
//         row.querySelector('.s-warehouse').value = warehousesFromBatch[0].warehouse || warehousesFromBatch[0].name || '';
//         row.querySelector('.available-qty').value = warehousesFromBatch[0].available_qty != null ? warehousesFromBatch[0].available_qty : '';
//       } else {
//         row.querySelector('.s-warehouse').value = msg.batch_warehouse || '';
//         row.querySelector('.available-qty').value = msg.batch_qty != null ? msg.batch_qty : '';
//       }

//       const dup = findRowByBatchAndItem(batchNo, itemCode);
//       if (dup && dup !== row) { dup.querySelector('.qty').focus(); row.remove(); return; }

//       row.querySelector('.qty').focus();
//     } catch (err) {
//       element.disabled = false;
//       if (errorEl) { errorEl.textContent = 'Error fetching batch details'; errorEl.classList.remove('hidden'); }
//       console.error(err);
//     }
//   };

//   issueForm.addEventListener('submit', async function (ev) {
//     ev.preventDefault();
//     clearMessage();
//     showButtonLoading();

//     const rows = Array.from(tbody.querySelectorAll('tr'));
//     if (rows.length === 0) {
//       showMessage('Add at least one row', 'error');
//       hideButtonLoading();
//       return;
//     }

//     const items = rows.map(row => {
//       const batch = (row.querySelector('.batch-no') && row.querySelector('.batch-no').value || '').trim();
//       const item_code = (row.querySelector('.item-code') && row.querySelector('.item-code').value || '').trim();
//       const qty = parseFloat((row.querySelector('.qty') && row.querySelector('.qty').value) || 0);
//       const s_wh = (row.querySelector('.s-warehouse') && row.querySelector('.s-warehouse').value || '').trim();
//       return { batch_no: batch, item_code: item_code, qty: qty, s_warehouse: s_wh };
//     });

//     for (const it of items) {
//       if (!it.item_code || !it.qty || it.qty <= 0) {
//         showMessage('Each row requires valid Item and positive Qty', 'error');
//         hideButtonLoading();
//         return;
//       }
//     }

//     const payload = {
//       posting_date: (new Date()).toISOString().slice(0,10),
//       posting_time: (new Date()).toTimeString().split(' ')[0],
//       from_warehouse: items[0].s_warehouse || '',
//       items: items,
//       sales_order_no: salesOrderInput ? salesOrderInput.value.trim() : '',
//       salesman_name: salesmanInput ? salesmanInput.value.trim() : '',
//       machine_name: machineInput ? machineInput.value.trim() : '',
//       operator_name: operatorInput ? operatorInput.value.trim() : '',
//       custom_sales_order_no: salesOrderInput ? salesOrderInput.value.trim() : '',
//       custom_salesman_name: salesmanInput ? salesmanInput.value.trim() : '',
//       custom_machine_name: machineInput ? machineInput.value.trim() : '',
//       custom_operator_name: operatorInput ? operatorInput.value.trim() : ''
//     };

//     const form = new FormData();
//     form.append('data', JSON.stringify(payload));

//     try {
//       const res = await fetch('/api/method/dana_group.stock.create_material_issue', {
//         method: 'POST',
//         credentials: 'include',
//         body: form
//       });
//       const data = await res.json();

//       if (data && ((data.message && data.message.status === 'success') || (data.message && data.message.name) || data.status === 'success')) {
//         tbody.innerHTML = '';
//         addRow();
//         if (salesOrderInput) salesOrderInput.value = '';
//         if (salesmanInput) salesmanInput.value = '';
//         if (machineInput) machineInput.value = '';
//         if (operatorInput) operatorInput.value = '';
//         showMessage('Material Issued Successfully: ' + ((data.message && data.message.name) || ''), 'success');
//       } else {
//         const err = (data && data.message && (data.message.message || data.message)) || JSON.stringify(data);
//         showMessage('Error creating issue: ' + err, 'error');
//       }
//     } catch (err) {
//       console.error('Error creating issue', err);
//       showMessage('Error creating issue. Check console.', 'error');
//     } finally {
//       hideButtonLoading();
//     }
//   });

//   (function init() {
//     tbody.innerHTML = '';
//     addRow();
//     clearMessage();
//     hideButtonLoading();
//   })();
// });






















document.addEventListener('DOMContentLoaded', function () {
  const modal = document.getElementById('editBatchModal');
  const form = document.getElementById('edit-batch-form');
  const batchNoInput = document.getElementById('eb-batch-no');
  const itemCodeInput = document.getElementById('eb-item-code');
  const qtyInput = document.getElementById('eb-qty');
  const warehouseInput = document.getElementById('eb-warehouse');
  const machineInput = document.getElementById('eb-machine');
  const operatorInput = document.getElementById('eb-operator');
  const bookInput = document.getElementById('eb-book-salesperson');

  const saveBtn = document.getElementById('edit-batch-save');
  const saveText = document.getElementById('edit-batch-save-text');
  const saveSpinner = document.getElementById('edit-batch-save-spinner');
  const cancelBtn = document.getElementById('edit-batch-cancel');
  const messageEl = document.getElementById('edit-batch-message');

  function openModal() {
    modal.classList.remove('opacity-0', 'pointer-events-none');
  }
  function closeModal() {
    modal.classList.add('opacity-0', 'pointer-events-none');
  }
  function clearForm() {
    batchNoInput.value = '';
    itemCodeInput.value = '';
    qtyInput.value = '';
    warehouseInput.value = '';
    machineInput.value = '';
    operatorInput.value = '';
    bookInput.value = '';
    clearMessage();
  }
  function showButtonLoading() {
    if (saveSpinner) saveSpinner.classList.remove('hidden');
    if (saveText) saveText.textContent = 'Saving...';
    if (saveBtn) saveBtn.disabled = true;
  }
  function hideButtonLoading() {
    if (saveSpinner) saveSpinner.classList.add('hidden');
    if (saveText) saveText.textContent = 'Update Batch';
    if (saveBtn) saveBtn.disabled = false;
  }
  function showMessage(text, type) {
    if (!messageEl) return;
    messageEl.textContent = text || '';
    messageEl.classList.remove('hidden', 'text-red-600', 'text-green-600', 'text-gray-700');
    if (type === 'success') messageEl.classList.add('text-green-600');
    else if (type === 'error') messageEl.classList.add('text-red-600');
    else messageEl.classList.add('text-gray-700');
  }
  function clearMessage() {
    if (!messageEl) return;
    messageEl.textContent = '';
    messageEl.classList.add('hidden');
    messageEl.classList.remove('text-red-600', 'text-green-600', 'text-gray-700');
  }

  batchNoInput.addEventListener('blur', async function () {
    const batch = (batchNoInput.value || '').trim();
    clearMessage();
    if (!batch) {
      itemCodeInput.value = '';
      qtyInput.value = '';
      warehouseInput.value = '';
      machineInput.value = '';
      operatorInput.value = '';
      return;
    }
    batchNoInput.disabled = true;
    try {
      const res = await fetch(`/api/method/dana_group.stock.get_batch_details?batch_no=${encodeURIComponent(batch)}`, { credentials: 'include' });
      const raw = await res.json();
      batchNoInput.disabled = false;
      if (!raw || raw.message == null) {
        showMessage('Invalid response from server', 'error');
        return;
      }
      const outer = raw.message;
      if (outer.status === 'error') {
        showMessage(outer.message || 'Batch not found', 'error');
        itemCodeInput.value = '';
        qtyInput.value = '';
        warehouseInput.value = '';
        machineInput.value = '';
        operatorInput.value = '';
        return;
      }
      const msg = outer.message || {};
      itemCodeInput.value = msg.item_code || '';
      const warehousesFromBatch = Array.isArray(msg.warehouses) ? msg.warehouses : [];
      if (warehousesFromBatch.length > 0) {
        warehouseInput.value = warehousesFromBatch[0].warehouse || warehousesFromBatch[0].name || '';
        qtyInput.value = warehousesFromBatch[0].available_qty != null ? warehousesFromBatch[0].available_qty : (msg.batch_qty != null ? msg.batch_qty : '');
      } else {
        warehouseInput.value = msg.batch_warehouse || '';
        qtyInput.value = msg.batch_qty != null ? msg.batch_qty : '';
      }
      machineInput.value = msg.machine_name || '';
      operatorInput.value = msg.operator_name || '';
      bookInput.value = msg.book_for_salesperson || '';
    } catch (err) {
      batchNoInput.disabled = false;
      console.error(err);
      showMessage('Error fetching batch details', 'error');
    }
  });

  form.addEventListener('submit', async function (ev) {
    ev.preventDefault();
    clearMessage();
    showButtonLoading();
    const batch = (batchNoInput.value || '').trim();
    if (!batch) {
      showMessage('Batch No is required', 'error');
      hideButtonLoading();
      return;
    }
    const payload = {
      batch_no: batch,
      machine: (machineInput.value || '').trim(),
      operator: (operatorInput.value || '').trim(),
      book_for_salesperson: (bookInput.value || '').trim()
    };
    const formData = new FormData();
    formData.append('data', JSON.stringify(payload));
    try {
      const res = await fetch('/api/method/dana_group.stock.update_batch_book_for_salesperson', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      const data = await res.json();
      if (data && ((data.message && data.message.status === 'success') || data.status === 'success' || (data.message && data.message.updated))) {
        showMessage('Batch updated', 'success');
      } else {
        const err = (data && data.message && (data.message.message || data.message)) || JSON.stringify(data);
        showMessage('Error updating batch: ' + err, 'error');
      }
    } catch (err) {
      console.error(err);
      showMessage('Error updating batch. Check console.', 'error');
    } finally {
      hideButtonLoading();
    }
  });

  cancelBtn.addEventListener('click', function () {
    clearForm();
    closeModal();
  });

  (function init() {
    clearForm();
    hideButtonLoading();
  })();

  window.openEditBatchModal = function (batchNo) {
    clearForm();
    if (batchNo) batchNoInput.value = batchNo;
    openModal();
    if (batchNo) batchNoInput.dispatchEvent(new Event('blur'));
  };
});