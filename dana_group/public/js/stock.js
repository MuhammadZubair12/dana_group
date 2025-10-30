
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
  const physicalLocationInputLabel = document.getElementById('eb-physical-location-label');
  const physicalLocationInput = document.getElementById('eb-physical-location');
  const commentsInput = document.getElementById('eb-comments');

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
    physicalLocationInput.value = '';
    physicalLocationInputLabel.value = '';
    commentsInput.value = '';
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
      physicalLocationInputLabel.value = msg.custom_physical_locations || '';
      commentsInput.value = msg.custom_comments || '';
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
      book_for_salesperson: (bookInput.value || '').trim(),
      custom_physical_locations: (physicalLocationInput.value || '').trim(),
      custom_comments: (commentsInput.value || '').trim()
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


