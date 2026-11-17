CREATE OR REPLACE FUNCTION public.shop_quote_item(p_slug text, p_width_cm integer, p_height_cm integer, p_kasa_tip text DEFAULT 'acik'::text, p_kasa_renk text DEFAULT ''::text, p_zincir text DEFAULT 'plastik'::text, p_yon text DEFAULT 'sol'::text, p_boru text DEFAULT 'standart'::text, p_ayak text DEFAULT 'plastik'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
declare v_product public.shop_products%rowtype; v_detail public.shop_product_details%rowtype;
v_billed_width integer; v_sqm numeric; v_base numeric;v_metal numeric;v_pipe numeric;v_kasa numeric;v_total numeric;
begin
 if p_width_cm is null or p_height_cm is null or p_width_cm not between 50 and 280 or p_height_cm not between 50 and 280 then raise exception 'Invalid dimensions' using errcode='22023';end if;
 if p_kasa_tip not in ('acik','klasik','renkli') or p_zincir not in ('plastik','metal') or p_yon not in ('sol','sag') or p_boru not in ('standart','jumbo') or p_ayak not in ('plastik','metal') then raise exception 'Invalid option' using errcode='22023';end if;
 if (p_kasa_tip='acik' and coalesce(p_kasa_renk,'')<>'')
 or(p_kasa_tip='klasik' and p_kasa_renk not in ('Beyaz','Krem'))
 or(p_kasa_tip='renkli' and p_kasa_renk not in ('Gri','Antrasit','Kahve')) then raise exception 'Invalid cassette color' using errcode='22023';end if;
 select * into v_product from public.shop_products where slug=p_slug and is_active=true;
 if not found then raise exception 'Product not found' using errcode='22023';end if;
 select * into v_detail from public.shop_product_details where slug=p_slug and display_status='published';
 if found then
   if v_detail.stock_qty=0 then raise exception 'Product out of stock' using errcode='22023';end if;
   if p_width_cm < coalesce((v_detail.measurement_options->>'min_width')::integer,50)
      or p_width_cm > coalesce((v_detail.measurement_options->>'max_width')::integer,280)
      or p_height_cm < coalesce((v_detail.measurement_options->>'min_height')::integer,50)
      or p_height_cm > coalesce((v_detail.measurement_options->>'max_height')::integer,280)
    then raise exception 'Dimensions outside product limits' using errcode='22023';end if;
 end if;
 v_billed_width=greatest(100,p_width_cm);
 v_sqm=v_billed_width::numeric * (case when v_product.collection='mat-stor' then greatest(200,p_height_cm) else p_height_cm end) / 10000;
 v_base=round(v_sqm*v_product.price_per_sqm,2);
 v_metal=case when p_zincir='metal' then 105 else 0 end;
 v_pipe=case when p_boru='jumbo' then round(p_width_cm::numeric/100*200,2) else 0 end;
 v_kasa=case p_kasa_tip when 'klasik' then round(p_width_cm::numeric/100*140,2) when 'renkli' then round(p_width_cm::numeric/100*170,2) else 0 end;
 v_total=v_base+v_metal+v_pipe+v_kasa;
 return jsonb_build_object('slug',v_product.slug,'title',v_product.title,'width_cm',p_width_cm,'height_cm',p_height_cm,'billed_width_cm',v_billed_width,'sqm',v_sqm,'currency','TRY','price_per_sqm',v_product.price_per_sqm,'base',v_base,'chain_fee',v_metal,'pipe_fee',v_pipe,'cassette_fee',v_kasa,'unit_total',v_total,'options',jsonb_build_object('kasaTip',p_kasa_tip,'kasaRenk',p_kasa_renk,'zincir',p_zincir,'yon',p_yon,'boru',p_boru,'ayak',p_ayak));
end;$function$;
