-- CORRECTION PROPOSÉE : NE PAS EXÉCUTER SANS VALIDATION EXPLICITE
-- Projet : mon-bac (nwcatsmfbkcgvgbanwyl)
-- Anomalie observée dans tp_owner_select : a.tp_id = a.id
-- Correctif ciblé : a.tp_id = tp_tableur.id
-- Préserve la lecture de ses propres TP par l'enseignant et permet
-- la lecture des TP publiés attribués à l'élève authentifié.
-- Aucun changement des données, ni des autres politiques RLS.

alter policy "tp_owner_select" on public.tp_tableur
to authenticated
using (
  enseignant_id = (select auth.uid())
  or (
    statut = 'publie'
    and exists (
      select 1
      from public.tp_tableur_affectations a
      where a.tp_id = tp_tableur.id
        and a.eleve_id = (select auth.uid())
    )
  )
);
