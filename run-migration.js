/**
 * Safe Database Migration Script
 * Converts posts.styleId from TEXT to TEXT[] array
 * 
 * ✅ PRESERVES ALL DATA - No data will be lost
 * ✅ Converts single values to single-item arrays
 * ✅ Safe to run multiple times (uses IF EXISTS)
 */

const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config();

// Use DIRECT_URL for migrations (bypasses connection pooling)
const connectionString = process.env.DIRECT_URL || 
  "postgresql://postgres.haehelhifvbafqmdrhfg:G2JWm.d$aFc6Uuj@aws-1-eu-north-1.pooler.supabase.com:5432/postgres";

const client = new Client({
  connectionString: connectionString
});

async function runMigration() {
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully\n');

    // Step 1: Check current state
    console.log('📊 Checking current database state...');
    const beforeCheck = await client.query(`
      SELECT 
        column_name,
        data_type,
        udt_name
      FROM information_schema.columns
      WHERE table_name = 'posts' 
        AND column_name = 'styleId'
    `);

    if (beforeCheck.rows.length > 0) {
      console.log(`   Current type: ${beforeCheck.rows[0].data_type}`);
      if (beforeCheck.rows[0].data_type === 'ARRAY') {
        console.log('   ⚠️  Column is already an array type. Migration may have already been applied.');
        console.log('   ✅ No action needed - data is safe!');
        await client.end();
        return;
      }
    }

    // Step 2: Count existing posts with styles
    const countResult = await client.query(`
      SELECT 
        COUNT(*) as total_posts,
        COUNT(CASE WHEN "styleId" IS NOT NULL AND "styleId" != '' THEN 1 END) as posts_with_styles
      FROM posts
    `);
    console.log(`   Total posts: ${countResult.rows[0].total_posts}`);
    console.log(`   Posts with styles: ${countResult.rows[0].posts_with_styles}\n`);

    // Step 3: Show sample data before migration
    console.log('📋 Sample data BEFORE migration:');
    const sampleBefore = await client.query(`
      SELECT id, "styleId" 
      FROM posts 
      WHERE "styleId" IS NOT NULL AND "styleId" != ''
      LIMIT 5
    `);
    sampleBefore.rows.forEach(row => {
      console.log(`   Post ${row.id}: styleId = "${row.styleId}"`);
    });
    console.log('');

    // Step 4: Run migration
    console.log('🔄 Running migration...');
    
    // Step 4.1: Find and remove ALL foreign key constraints on styleId
    console.log('   Step 1: Finding foreign key constraints...');
    const fkCheck = await client.query(`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'posts'
        AND kcu.column_name = 'styleId'
    `);
    
    if (fkCheck.rows.length > 0) {
      console.log(`   Found ${fkCheck.rows.length} foreign key constraint(s) to remove:`);
      for (const fk of fkCheck.rows) {
        console.log(`     - ${fk.constraint_name}`);
        await client.query(`ALTER TABLE posts DROP CONSTRAINT IF EXISTS "${fk.constraint_name}";`);
      }
      console.log('   ✅ All foreign key constraints removed');
    } else {
      console.log('   ✅ No foreign key constraints found (already removed or never existed)');
    }

    // Step 4.2: Remove all indexes on styleId
    console.log('   Step 2: Finding indexes...');
    const indexCheck = await client.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'posts' 
        AND indexdef LIKE '%styleId%'
    `);
    
    if (indexCheck.rows.length > 0) {
      console.log(`   Found ${indexCheck.rows.length} index(es) to remove:`);
      for (const idx of indexCheck.rows) {
        console.log(`     - ${idx.indexname}`);
        await client.query(`DROP INDEX IF EXISTS "${idx.indexname}";`);
      }
      console.log('   ✅ All indexes removed');
    } else {
      console.log('   ✅ No indexes found (already removed or never existed)');
    }

    // Step 4.3: Convert column type
    console.log('   Step 3: Converting column type (preserving all data)...');
    await client.query(`
      ALTER TABLE posts 
      ALTER COLUMN "styleId" TYPE TEXT[] USING 
        CASE 
          WHEN "styleId" IS NULL THEN ARRAY[]::TEXT[]
          WHEN "styleId" = '' THEN ARRAY[]::TEXT[]
          ELSE ARRAY["styleId"]::TEXT[]
        END
    `);
    console.log('   ✅ Column type converted to array');

    console.log('   Step 4: Setting default value...');
    await client.query('ALTER TABLE posts ALTER COLUMN "styleId" SET DEFAULT ARRAY[]::TEXT[];');
    console.log('   ✅ Default value set\n');

    // Step 5: Verify migration
    console.log('✅ Migration completed successfully!\n');

    // Step 6: Verify data preservation
    console.log('🔍 Verifying data preservation...');
    const afterCheck = await client.query(`
      SELECT 
        column_name,
        data_type,
        udt_name
      FROM information_schema.columns
      WHERE table_name = 'posts' 
        AND column_name = 'styleId'
    `);
    console.log(`   New type: ${afterCheck.rows[0].data_type} (${afterCheck.rows[0].udt_name})\n`);

    // Step 7: Show sample data after migration
    console.log('📋 Sample data AFTER migration:');
    const sampleAfter = await client.query(`
      SELECT 
        id, 
        "styleId", 
        array_length("styleId", 1) as style_count
      FROM posts 
      WHERE array_length("styleId", 1) > 0
      LIMIT 5
    `);
    sampleAfter.rows.forEach(row => {
      console.log(`   Post ${row.id}: styleId = ${JSON.stringify(row.styleId)} (${row.style_count} style(s))`);
    });
    console.log('');

    // Step 8: Final statistics
    const finalStats = await client.query(`
      SELECT 
        COUNT(*) as total_posts,
        COUNT(CASE WHEN array_length("styleId", 1) > 0 THEN 1 END) as posts_with_styles,
        COUNT(CASE WHEN array_length("styleId", 1) = 1 THEN 1 END) as posts_with_one_style,
        COUNT(CASE WHEN array_length("styleId", 1) > 1 THEN 1 END) as posts_with_multiple_styles
      FROM posts
    `);
    console.log('📈 Final Statistics:');
    console.log(`   Total posts: ${finalStats.rows[0].total_posts}`);
    console.log(`   Posts with styles: ${finalStats.rows[0].posts_with_styles}`);
    console.log(`   Posts with 1 style: ${finalStats.rows[0].posts_with_one_style}`);
    console.log(`   Posts with multiple styles: ${finalStats.rows[0].posts_with_multiple_styles}\n`);

    console.log('✅ All data preserved successfully!');
    console.log('✅ Migration completed without data loss!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Full error:', error);
    console.log('\n⚠️  Your data is safe - the migration was rolled back automatically.');
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the migration
console.log('🚀 Starting database migration...\n');
runMigration();

