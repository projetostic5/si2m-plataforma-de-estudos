-- Promote isaque_melo@hotmail.com to admin role
UPDATE profiles
SET role = 'admin',
    updated_at = now()
WHERE id = '299cd178-9aff-4587-91c2-262ce60e3ff6';
