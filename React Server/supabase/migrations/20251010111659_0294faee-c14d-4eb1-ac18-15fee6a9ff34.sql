-- Add website_link and company_description to organization_details table
ALTER TABLE public.organization_details 
ADD COLUMN IF NOT EXISTS website_link text,
ADD COLUMN IF NOT EXISTS company_description text;