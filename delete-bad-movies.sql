
-- Delete confirmed wrong movie matches
DELETE FROM movies WHERE id IN (
  '4f1d41e1-1abd-49cc-be6b-06cb1301e013',
  '7fe26824-3387-450e-836c-9d787e256768',
  '7c4d5d48-47b7-427f-ada0-fb8b79ae2ddf',
  '66a71777-30bc-41a8-85d7-c04d7245aaf7',
  'b1a6907b-f9a9-4e3f-9783-3e436c248901',
  'cacdae23-751b-4c9e-a0bd-4e0a110aeff5'
);

-- Check count before committing
SELECT COUNT(*) FROM movies WHERE id IN (
  '4f1d41e1-1abd-49cc-be6b-06cb1301e013',
  '7fe26824-3387-450e-836c-9d787e256768',
  '7c4d5d48-47b7-427f-ada0-fb8b79ae2ddf',
  '66a71777-30bc-41a8-85d7-c04d7245aaf7',
  'b1a6907b-f9a9-4e3f-9783-3e436c248901',
  'cacdae23-751b-4c9e-a0bd-4e0a110aeff5'
);
