BEGIN;

INSERT INTO "collection_profiles" (
    "id",
    "user_id",
    "name",
    "objective_mode",
    "createdAt",
    "updatedAt"
)
SELECT
    gen_random_uuid()::text,
    u."id",
    'Main',
    'ALL',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "users" u
WHERE NOT EXISTS (
    SELECT 1
    FROM "collection_profiles" cp
    WHERE cp."user_id" = u."id"
      AND cp."name" = 'Main'
);

UPDATE "user_collection" uc
SET "profile_id" = cp."id"
FROM "collection_profiles" cp
WHERE cp."user_id" = uc."user_id"
  AND cp."name" = 'Main'
  AND uc."profile_id" IS NULL;

UPDATE "user_favorites" uf
SET "profile_id" = cp."id"
FROM "collection_profiles" cp
WHERE cp."user_id" = uf."user_id"
  AND cp."name" = 'Main'
  AND uf."profile_id" IS NULL;

COMMIT;