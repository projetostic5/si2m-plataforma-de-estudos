-- Promote Giorgio Souto to admin role
UPDATE profiles
SET role = 'admin',
    updated_at = now()
WHERE id = 'f349d704-a328-4831-a439-3db3a4e41838';
