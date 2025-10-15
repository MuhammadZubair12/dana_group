import frappe

def on_login(login_manager):
    user = login_manager.user
    roles = frappe.get_roles(user)

    # store redirect page in session
    if "v3" in roles:
        frappe.local.response["home_page"] = "/cat"
    else:
        frappe.local.response["home_page"] = "/home"
