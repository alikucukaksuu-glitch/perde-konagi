create or replace function public.erp_deliver_order(p_org uuid, p_order uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_order public.erp_orders%rowtype;
begin
  if auth.uid() is null or not public.erp_has_menu_permission(p_org, 'orders', true) then
    raise exception 'Sipariş teslimi için yetkiniz yok';
  end if;
  select * into v_order
  from public.erp_orders o
  where o.id = p_order and o.organization_id = p_org
    and public.erp_branch_allowed(p_org, o.branch_id)
  for update;
  if not found then
    raise exception 'Sipariş bulunamadı veya şubeye erişiminiz yok';
  end if;
  if v_order.status = 'delivered' then
    return;
  end if;
  if v_order.status <> 'ready'
    or not exists (select 1 from public.erp_order_items i where i.order_id = p_order and i.organization_id = p_org and i.status = 'ready')
    or exists (select 1 from public.erp_order_items i where i.order_id = p_order and i.organization_id = p_org
      and (i.status not in ('ready', 'cancelled') or (i.status = 'ready' and i.cancellation_requested_at is not null))) then
    raise exception 'Siparişteki tüm aktif ürünler teslime hazır olmalıdır';
  end if;
  update public.erp_order_items
  set status = 'delivered'
  where order_id = p_order and organization_id = p_org and status = 'ready';
  update public.erp_orders
  set status = 'delivered', updated_at = now()
  where id = p_order and organization_id = p_org;
end;
$function$;
revoke all on function public.erp_deliver_order(uuid, uuid) from public, anon;
grant execute on function public.erp_deliver_order(uuid, uuid) to authenticated;
