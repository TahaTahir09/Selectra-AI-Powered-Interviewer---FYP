-- Add pre_assessment_questions column to job_posts table
ALTER TABLE job_posts 
ADD COLUMN pre_assessment_questions TEXT[] DEFAULT '{}';

-- Update RLS policies remain the same as they already cover all columns