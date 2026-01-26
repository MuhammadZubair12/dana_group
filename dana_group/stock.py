import frappe
from frappe.utils import flt
from frappe import _

import json
from frappe.utils import cint

@frappe.whitelist()
def get_sales_person_by_sales_order(sales_order):
    """Fetch the Sales Person name from Sales Order"""
    if not sales_order:
        frappe.throw(_("Missing Sales Order"))
    sales_person = frappe.db.get_value("Sales Order", sales_order, "sales_person")
    if not sales_person:
        sales_person = frappe.db.get_value("Sales Team", {"parent": sales_order}, "sales_person")

    return sales_person or ""


import frappe
from frappe.utils import flt
from frappe import _
import json


def _first_existing_field(doctype, candidates):
    meta = frappe.get_meta(doctype)
    for f in candidates:
        if meta.has_field(f):
            return f
    return None


def _get_doc_value(doc, candidates, default=""):
    for f in candidates:
        if hasattr(doc, f):
            v = getattr(doc, f)
            if v not in (None, ""):
                return v
    return default


def _set_doc_value_if_field_exists(doc, candidates, value):
    meta = frappe.get_meta(doc.doctype)
    for f in candidates:
        if meta.has_field(f):
            setattr(doc, f, value)
            return f
    return None


@frappe.whitelist(allow_guest=False)
def get_batch_details(batch_no):
    """
    Returns details for batch + warehouse wise available qty
    AND also returns fields needed by Batch Edit modal:
      - book_for_salesperson
      - machine_name
      - operator_name
      - custom_physical_locations
      - custom_comments
    """
    if not batch_no:
        frappe.throw(_("Batch number is required"), frappe.ValidationError)

    try:
        batch_doc = frappe.get_doc("Batch", batch_no)
    except frappe.DoesNotExistError:
        return {"status": "error", "message": _("Batch not found")}

    item_code = batch_doc.item

    warehouses = frappe.db.sql("""
        SELECT
            sle.warehouse,
            SUM(sle.actual_qty) AS qty
        FROM `tabStock Ledger Entry` sle
        WHERE
            sle.batch_no = %s
            AND sle.item_code = %s
            AND sle.is_cancelled = 0
        GROUP BY sle.warehouse
        HAVING qty != 0
    """, (batch_no, item_code), as_dict=True)

    total_batch_qty = sum(flt(w.get("qty")) for w in warehouses)

    # ---- read values from whichever fields exist on your Batch doctype ----
    book_for_salesperson = _get_doc_value(batch_doc, [
        "custom_book_for_salesperson",
        "booked_for_salesperson",
        "book_for_salesperson",
    ], default="")

    machine_name = _get_doc_value(batch_doc, [
        "custom_machine",
        "machine",
        "custom_machine_name",
    ], default="")

    operator_name = _get_doc_value(batch_doc, [
        "custom_operator",
        "operator",
        "custom_operator_name",
    ], default="")

    physical_locations = _get_doc_value(batch_doc, [
        "physical_locations",
        "custom_physical_locations",
    ], default="")

    comments = _get_doc_value(batch_doc, [
        "batch_desc",
        "custom_batch_desc",
        "custom_comments",
        "description",
    ], default="")

    return {
        "status": "success",
        "message": {
            "item_code": item_code,
            "batch_qty": total_batch_qty,
            "warehouses": [
                {"warehouse": w.get("warehouse"), "available_qty": flt(w.get("qty"))}
                for w in warehouses
            ],

            # keys your JS expects:
            "book_for_salesperson": book_for_salesperson,
            "machine_name": machine_name,
            "operator_name": operator_name,
            "custom_physical_locations": physical_locations,
            "custom_comments": comments,
        }
    }


@frappe.whitelist(allow_guest=False)
def update_batch_book_for_salesperson():
    try:
        raw = frappe.local.form_dict.get("data")
        payload = frappe.parse_json(raw) if raw else frappe.form_dict

        batch_no = (payload.get("batch_no") or "").strip()
        book_for_salesperson = (payload.get("book_for_salesperson") or "").strip()
        machine = (payload.get("machine") or "").strip()
        operator = (payload.get("operator") or "").strip()
        custom_physical_locations = (payload.get("custom_physical_locations") or "").strip()
        custom_comments = (payload.get("custom_comments") or "").strip()

        if not batch_no:
            return {"status": "error", "message": _("batch_no is required")}

        try:
            batch_doc = frappe.get_doc("Batch", batch_no)
        except frappe.DoesNotExistError:
            return {"status": "error", "message": _("Batch {0} not found").format(batch_no)}

        # ✅ update all required fields
        batch_doc.booked_for_salesperson = book_for_salesperson
        batch_doc.custom_book_for_salesperson = book_for_salesperson

        batch_doc.custom_machine = machine
        batch_doc.custom_operator = operator

        if custom_physical_locations != "":
            batch_doc.physical_locations = custom_physical_locations

        # ✅ this is the important part
        batch_doc.batch_desc = custom_comments

        batch_doc.save(ignore_permissions=True)
        frappe.db.commit()

        return {
            "status": "success",
            "message": _("Batch updated successfully"),
            "batch_no": batch_no
        }

    except Exception:
        frappe.log_error(message=frappe.get_traceback(), title="update_batch_book_for_salesperson error")
        return {"status": "error", "message": _("Unexpected error. Check error log.")}













def _warehouse_exists(name):
    return bool(frappe.db.exists("Warehouse", name))


def _get_projected_qty(item_code, warehouse):
    val = frappe.db.get_value("Bin", {"item_code": item_code, "warehouse": warehouse}, "projected_qty")
    return flt(val or 0.0)

@frappe.whitelist(allow_guest=False)
def create_material_receipt(data=None):
    """
    Create a Stock Entry of type Material Receipt (Stock Entry Type = Material Receipt or purpose 'Material Receipt')
    Expected payload (JSON):
    {
      "posting_date": "2025-10-10",
      "posting_time": "10:00:00",
      "company": "My Company",
      "to_warehouse": "Stores - DC",
      "items": [
         {"batch_no": "BATCH-001", "item_code": "ITEM-001", "qty": 10, "uom": "Nos", "warehouse": "Stores - DC"},
         ...
      ],
      "remarks": "optional"
    }
    """
    import json
    if not data:
        frappe.throw(_("Missing data"), exc=frappe.ValidationError)

    if isinstance(data, str):
        try:
            data = json.loads(data)
        except Exception:
            frappe.throw(_("Invalid JSON payload"), exc=frappe.ValidationError)

    items = data.get("items") or []
    if not items:
        frappe.throw(_("At least one item is required"), exc=frappe.ValidationError)

    se = frappe.new_doc("Stock Entry")
    se.stock_entry_type = "Material Receipt" if frappe.db.exists("Stock Entry Type", "Material Receipt") else "Material Receipt"
    se.purpose = "Material Receipt"
    se.custom_created_by = frappe.session.user
    se.sales_order_number = data.get("receipt_comments")
    if data.get("machine_name") is not None:
        se.custom_machine = data.get("machine_name")
    if data.get("operator_name") is not None:
        se.custom_operator = data.get("operator_name")
    se.company = data.get("company") or frappe.defaults.get_global_default("company")
    se.posting_date = data.get("posting_date") or frappe.utils.nowdate()
    se.posting_time = data.get("posting_time") or frappe.utils.nowtime()
    se.to_warehouse = data.get("to_warehouse") or data.get("warehouse") or ""
    se.set_posting_time = 1 if data.get("posting_time") else 0
    se.remark = data.get("remarks") or data.get("remark") or ""

    for it in items:
        qty = flt(it.get("qty") or 0)
        if qty <= 0:
            frappe.throw(_("Quantity must be positive for item {0}").format(it.get("item_code") or it.get("batch_no") or ""))
        se.append("items", {
            "item_code": it.get("item_code"),
            "qty": qty,
            "uom": it.get("uom") or frappe.db.get_value("Item", it.get("item_code"), "stock_uom"),
            "s_warehouse": "",
            "t_warehouse": it.get("warehouse") or it.get("to_warehouse") or se.to_warehouse,
            "batch_no": it.get("batch_no")
        })

    try:
        se.insert(ignore_permissions=True)
        se.submit()
    except Exception as exc:
        frappe.log_error(frappe.get_traceback(), "create_material_receipt_failed")
        return {"status": "error", "message": str(exc)}

    return {"status": "success", "message": {"name": se.name}}

@frappe.whitelist(allow_guest=False)
def get_warehouses():
    """
    Return a list of warehouses for populating dropdowns.
    Each entry is a dict with keys 'name' and 'full_name' (if available).
    """
    rows = frappe.db.get_all('Warehouse', fields=['name', 'warehouse_name', 'parent_warehouse'])
    out = []
    for r in rows:
        label = r.get('warehouse_name') or r.get('name')
        out.append({'name': r.get('name'), 'full_name': label})
    return out
@frappe.whitelist(allow_guest=False)
def create_material_issue(data=None):
    if not data:
        data = frappe.local.form_dict.get('data') or frappe.local.request.get_data(as_text=True) or None

    if not data:
        frappe.throw(_("Missing data"), exc=frappe.ValidationError)

    if isinstance(data, str):
        try:
            data = json.loads(data)
        except Exception:
            frappe.throw(_("Invalid JSON payload"), exc=frappe.ValidationError)

    items = data.get("items") or []
    if not items:
        frappe.throw(_("At least one item is required"), exc=frappe.ValidationError)
    se = frappe.new_doc("Stock Entry")
    se.stock_entry_type = "Material Issue"
    se.purpose = "Material Issue"
    se.sales_order_number = data.get("issue_comments")
    se.company = data.get("company") or frappe.defaults.get_global_default("company")
    se.posting_date = data.get("posting_date") or frappe.utils.nowdate()
    se.posting_time = data.get("posting_time") or frappe.utils.nowtime()
    se.from_warehouse = data.get("from_warehouse") or data.get("warehouse") or ""
    se.set_posting_time = 1 if data.get("posting_time") else 0
    se.remark = data.get("remarks") or data.get("remark") or ""
    sales_order = data.get("custom_sales_order_no")
    se.sales_order = sales_order
    if sales_order:
        sales_person = frappe.db.get_value("Sales Order", sales_order, "sales_person")
        if sales_person:
            se.custom_salesman = sales_person
        else:
            frappe.log_error(f"Sales Order {sales_order} has no sales_person", "Missing Sales Person")
    else:
        frappe.log_error("No Sales Order provided in data", "Missing Sales Order")
    se.custom_machine = data.get("custom_machine") or data.get("machine_name") or ""
    se.custom_operator = data.get("custom_operator") or data.get("operator_name") or ""
    for it in items:
        qty = flt(it.get("qty") or 0)
        if qty <= 0:
            frappe.throw(_("Quantity must be positive for item {0}").format(it.get("item_code") or it.get("batch_no") or ""))
        se.append("items", {
            "item_code": it.get("item_code"),
            "qty": qty,
            "uom": it.get("uom") or frappe.db.get_value("Item", it.get("item_code"), "stock_uom"),
            "s_warehouse": it.get("s_warehouse") or se.from_warehouse or "",
            "batch_no": it.get("batch_no")
        })

    try:
        se.insert(ignore_permissions=True)
        se.submit()
    except Exception as exc:
        frappe.log_error(frappe.get_traceback(), "create_material_issue_failed")
        return {"status": "error", "message": str(exc)}

    return {"status": "success", "message": {"name": se.name}}
@frappe.whitelist(allow_guest=False)
def create_material_issue_old(data=None):
    if not data:
        data = frappe.local.form_dict.get('data') or frappe.local.request.get_data(as_text=True) or None

    if not data:
        frappe.throw(_("Missing data"), exc=frappe.ValidationError)

    if isinstance(data, str):
        try:
            data = json.loads(data)
        except Exception:
            frappe.throw(_("Invalid JSON payload"), exc=frappe.ValidationError)

    items = data.get("items") or []
    if not items:
        frappe.throw(_("At least one item is required"), exc=frappe.ValidationError)

    se = frappe.new_doc("Stock Entry")
    se.stock_entry_type = "Material Issue"
    se.purpose = "Material Issue"
    se.sales_order_number = data.get("issue_comments")
    se.company = data.get("company") or frappe.defaults.get_global_default("company")
    se.posting_date = data.get("posting_date") or frappe.utils.nowdate()
    se.posting_time = data.get("posting_time") or frappe.utils.nowtime()
    se.from_warehouse = data.get("from_warehouse") or data.get("warehouse") or ""
    se.set_posting_time = 1 if data.get("posting_time") else 0
    se.remark = data.get("remarks") or data.get("remark") or ""

    se.sales_order = data.get("custom_sales_order_no")
    se.custom_salesman = data.get("custom_salesman_name")
    se.custom_machine = data.get("custom_machine") or data.get("machine_name") or ""
    se.custom_operator = data.get("custom_operator") or data.get("operator_name") or ""

    for it in items:
        qty = flt(it.get("qty") or 0)
        if qty <= 0:
            frappe.throw(_("Quantity must be positive for item {0}").format(it.get("item_code") or it.get("batch_no") or ""))
        se.append("items", {
            "item_code": it.get("item_code"),
            "qty": qty,
            "uom": it.get("uom") or frappe.db.get_value("Item", it.get("item_code"), "stock_uom"),
            "s_warehouse": it.get("s_warehouse") or se.from_warehouse or "",
            "batch_no": it.get("batch_no")
        })

    try:
        se.insert(ignore_permissions=True)
        se.submit()
    except Exception as exc:
        frappe.log_error(frappe.get_traceback(), "create_material_issue_failed")
        return {"status": "error", "message": str(exc)}

    return {"status": "success", "message": {"name": se.name}}