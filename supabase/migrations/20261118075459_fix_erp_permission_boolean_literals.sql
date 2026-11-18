do $repair$
declare f record; fixed text; repaired integer:=0;
begin
 for f in select p.oid from pg_catalog.pg_proc p
 join pg_catalog.pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname in (
 'erp_add_payment','erp_confirm_whatsapp_dispatch','erp_mark_barcode_printed',
 'erp_mark_selected_items_printed','erp_receive_qr_item','erp_record_cash_movement',
 'erp_request_item_cancellation','erp_set_item_urgent','erp_set_item_waiting',
 'erp_set_item_workflow_status','erp_set_order_waiting','erp_update_order')
 loop
  fixed:=pg_catalog.pg_get_functiondef(f.oid);
  if fixed ~ $rx$(public\.erp_has_menu_permission\((?:p_org|\(select organization_id from public\.erp_orders where id=p_order\)),'[a-z_]+',\s*)t(\))$rx$ then
   execute pg_catalog.regexp_replace(fixed,$rx$(public\.erp_has_menu_permission\((?:p_org|\(select organization_id from public\.erp_orders where id=p_order\)),'[a-z_]+',\s*)t(\))$rx$,$replace$\1true\2$replace$,'g');
   repaired:=repaired+1;
  end if;
 end loop;
 if repaired<>12 then raise exception 'Expected to repair 12 ERP routines, found %',repaired;end if;
end
$repair$;
