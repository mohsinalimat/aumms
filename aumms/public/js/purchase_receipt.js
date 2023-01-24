frappe.ui.form.on('Purchase Receipt', {
  keep_metal_ledger(frm) {
    //Checking the keep metal ledger
    if (frm.doc.keep_metal_ledger) {
      change_keep_metal_ledger(frm, 1)
    }
    else {
      change_keep_metal_ledger(frm, 0)
    }
    frm.refresh_field('items')
  },
  refresh (frm) {

    if ([1, 2].includes(frm.doc.docstatus)) {

      // Custom button Metal Ledger in View
      frm.add_custom_button('Metal Ledger', () => {
        // route to Metal Ledger Report with filter of this voucher no
        frappe.set_route('query-report', 'Metal Ledger', { 'voucher_no': frm.doc.name });
      }, 'View');

    }

  }
});

frappe.ui.form.on('Purchase Receipt Item', {
  items_add(frm, cdt, cdn) {
    let child = locals[cdt][cdn]
    //Checking the keep metal transaction
    if (frm.doc.keep_metal_ledger) {
      //set value to the field is keep_metal_ledger as 1
      frappe.model.set_value(child.doctype, child.name, 'keep_metal_ledger', 1)
    }
  },
  item_code(frm, cdt, cdn) {
    let child = locals[cdt][cdn]

    if (child.item_code) {
      //to make delay in board_rate entry
      setTimeout(function () {
        //call to get board_rate
        frappe.call({
          method: 'aumms.aumms.utils.get_board_rate',
          args: {
            item_type: child.item_type,
            purity: child.purity,
            stock_uom: child.stock_uom,
            date: frm.doc.posting_date,
            time: frm.doc.posting_time
          },
          callback: function (r) {
            if (r.message) {

              //set value to rate field
              frappe.model.set_value(child.doctype, child.name, 'board_rate', r.message)

            }
          }
        })
      }, 500);
    }

  },
  board_rate (frm, cdt, cdn) {
    let child = locals[cdt][cdn]

    if (child.board_rate){
      // declare rate value as board rate
      let rate = child.board_rate
      if (child.conversion_factor) {
        // multiply rate with conversion factor
        rate = rate * child.conversion_factor
      }
      // set value to the rate field
      frappe.model.set_value(child.doctype, child.name, 'rate', rate)
    }

  },
  conversion_factor (frm, cdt, cdn) {
    let child = locals[cdt][cdn]

    if (child.conversion_factor) {
      // trigger board rate field
      frm.script_manager.trigger('board_rate', cdt, cdn);
    }

  }
})

let change_keep_metal_ledger = function (frm, value) {
  /*
    function to iterate item table and set value to the field keep_metal_ledger
    args:
      frm: current form of purchase Receipt
      value: Boolean
  */
  frm.doc.items.forEach((item) => {
    item.keep_metal_ledger = value
  });
}
