create or replace function public.ege_admin_enregistrer_moyen(p_moyen text,p_actif boolean,p_numero text,p_titulaire text) returns boolean language plpgsql security definer set search_path='' as $$
declare old public.ege_comptes_paiement%rowtype; new_value public.ege_comptes_paiement%rowtype; tel text:=nullif(btrim(p_numero),''); v_titulaire text:=nullif(btrim(p_titulaire),'');
begin
 if auth.uid() is null or not public.ege_est_admin() then raise exception 'Acces administrateur refuse'; end if;
 if p_actif is null or p_moyen is null or p_moyen not in ('waafi','dmoney','cacpay','sabapay') then raise exception 'Moyen de paiement invalide'; end if;
 if tel is not null and (tel !~ '^[+]?[0-9 ]{7,20}$' or length(regexp_replace(tel,'[^0-9]','','g')) not between 7 and 15) then raise exception 'Numero marchand invalide'; end if;
 if p_actif and (tel is null or coalesce(length(v_titulaire),0) not between 3 and 100) then raise exception 'Numero et titulaire requis avant activation'; end if;
 if coalesce(length(v_titulaire),0)>100 then raise exception 'Titulaire trop long'; end if;
 select * into old from public.ege_comptes_paiement where moyen=p_moyen for update;
 if not found then raise exception 'Moyen introuvable'; end if;
 if (old.actif,old.numero_reception,old.titulaire) is not distinct from (p_actif,tel,v_titulaire) then return true; end if;
 update public.ege_comptes_paiement set actif=p_actif,numero_reception=tel,titulaire=v_titulaire,modifie_le=now() where moyen=p_moyen returning * into new_value;
 insert into ege_private.journal_configuration(moyen,ancienne_valeur,nouvelle_valeur,administrateur_id) values(p_moyen,to_jsonb(old),to_jsonb(new_value),auth.uid());
 return true;
end $$;

