-- Prevent the same domain from being attached more than once, including case
-- variants (Example.com / example.com). Run the preflight query first and
-- resolve any reported duplicates before creating the index.

SELECT lower("domain") AS normalized_domain,
       count(*) AS connection_count,
       array_agg("id") AS connection_ids
FROM "CustomDomain"
GROUP BY lower("domain")
HAVING count(*) > 1;

-- Run separately after the preflight query returns no rows. CONCURRENTLY must
-- not run inside an explicit transaction block.
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "CustomDomain_domain_lower_key"
  ON "CustomDomain" (lower("domain"));
