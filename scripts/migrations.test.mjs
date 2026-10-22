import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const migrationsDirectory = fileURLToPath(new URL('../supabase/migrations/', import.meta.url));
const migrationFiles = (await readdir(migrationsDirectory))
  .filter(name => /^\d{14}_.+\.sql$/.test(name))
  .sort();

test('SQL migration filenames use unique version prefixes', () => {
  assert.ok(migrationFiles.length > 0, 'Expected at least one SQL migration');
  const versions = migrationFiles.map(name => name.slice(0, 14));
  assert.equal(new Set(versions).size, versions.length, 'Migration version prefixes must be unique');
});

test('SQL migration dollar-quoted blocks are balanced', async () => {
  for (const filename of migrationFiles) {
    const sql = await readFile(join(migrationsDirectory, filename), 'utf8');
    const delimiters = sql.match(/\$\$/g) || [];
    assert.equal(
      delimiters.length % 2,
      0,
      `${filename} contains an unmatched $$ delimiter`
    );
    assert.doesNotMatch(
      sql,
      /\bend\s+\$;/i,
      `${filename} contains an invalid single-dollar block terminator`
    );
  }
});
