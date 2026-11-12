-- Ajouts non destructifs, valeurs NULL pour préserver les annonces existantes.
ALTER TABLE public.ege2027_ads
 ADD COLUMN IF NOT EXISTS whatsapp_number text,
 ADD COLUMN IF NOT EXISTS subjects text,
 ADD COLUMN IF NOT EXISTS fee_amount integer,
 ADD COLUMN IF NOT EXISTS fee_period text,
 ADD COLUMN IF NOT EXISTS teaching_days text,
 ADD COLUMN IF NOT EXISTS teaching_hours text,
 ADD COLUMN IF NOT EXISTS teaching_mode text,
 ADD COLUMN IF NOT EXISTS course_address text,
 ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.ege2027_ads
 ADD CONSTRAINT ege2027_ads_whatsapp_valid CHECK(whatsapp_number IS NULL OR whatsapp_number ~ '^[0-9]{8,15}$'),
 ADD CONSTRAINT ege2027_ads_fee_valid CHECK(fee_amount IS NULL OR fee_amount BETWEEN 0 AND 100000000),
 ADD CONSTRAINT ege2027_ads_period_valid CHECK(fee_period IS NULL OR fee_period IN ('seance','semaine','mois','trimestre')),
 ADD CONSTRAINT ege2027_ads_mode_valid CHECK(teaching_mode IS NULL OR teaching_mode IN ('groupe','domicile','mixte')),
 ADD CONSTRAINT ege2027_ads_subjects_valid CHECK(subjects IS NULL OR length(subjects)<=180),
 ADD CONSTRAINT ege2027_ads_days_valid CHECK(teaching_days IS NULL OR length(teaching_days)<=120),
 ADD CONSTRAINT ege2027_ads_hours_valid CHECK(teaching_hours IS NULL OR length(teaching_hours)<=100),
 ADD CONSTRAINT ege2027_ads_address_valid CHECK(course_address IS NULL OR length(course_address)<=200),
 ADD CONSTRAINT ege2027_ads_image_valid CHECK(image_url IS NULL OR (length(image_url)<=600 AND image_url ~ '^https://[^[:space:]]+$'));
-- RLS existante inchangée : les professeurs soumettent, l'admin approuve et définit le Premium.
-- Retour arrière uniquement si nécessaire : DROP COLUMN ... pour chacune des nouvelles colonnes.
