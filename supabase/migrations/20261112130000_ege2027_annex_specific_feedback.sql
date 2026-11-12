-- Permettre des commentaires sur une annexe précise sans modifier les anciens avis.
alter table public.ege2027_reviews add column if not exists annex_number smallint;
alter table public.ege2027_reviews drop constraint if exists ege2027_reviews_annex_number_check;
alter table public.ege2027_reviews add constraint ege2027_reviews_annex_number_check
check(annex_number is null or annex_number between 1 and 4);
