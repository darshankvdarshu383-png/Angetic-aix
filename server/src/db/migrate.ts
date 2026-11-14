import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';

const rootDir = path.resolve(process.cwd(), '..');

// Load environment variables
dotenv.config({ path: path.join(rootDir, '.env') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

const { Client } = pg;

interface MigrationConfig {
  databaseUrl?: string;
  supabaseUrl?: string;
  supabaseServiceRoleKey?: string;
}

const config: MigrationConfig = {
  databaseUrl: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || process.env.POSTGRES_URL,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY,
};

export async function runMigration() {
  console.log('=================================================================');
  console.log('🛡️  AEGISFLOW SUPABASE CLOUD POSTGRESQL MIGRATION RUNNER');
  console.log('=================================================================');

  const migrationFile = path.join(rootDir, 'supabase', 'migrations', '001_initial_schema.sql');
  if (!fs.existsSync(migrationFile)) {
    console.error(`❌ Migration file not found at: ${migrationFile}`);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(migrationFile, 'utf-8');
  console.log(`📄 Loaded migration script: 001_initial_schema.sql (${(sqlContent.length / 1024).toFixed(1)} KB)`);

  // Strategy 1: Direct PostgreSQL Connection via pg client (Recommended for full DDL & RLS)
  if (config.databaseUrl) {
    console.log('\n📡 Connecting to Supabase Cloud PostgreSQL via connection string...');
    console.log(`   Target: ${config.databaseUrl.replace(/:[^:@]+@/, ':****@')}`);

    const client = new Client({
      connectionString: config.databaseUrl,
      ssl: { rejectUnauthorized: false },
    });

    try {
      await client.connect();
      console.log('✅ Connected successfully to Supabase PostgreSQL instance.');

      console.log('🚀 Executing initial schema migration, RLS policies & seed data...');
      await client.query(sqlContent);
      console.log('✅ Migration applied successfully!');

      // Verify created tables
      console.log('\n🔍 Verifying database tables in public schema:');
      const res = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `);

      const tables = res.rows.map((r) => r.table_name);
      console.log('   Tables created:', tables.join(', '));

      // Check seed data count
      const profileCheck = await client.query('SELECT COUNT(*) FROM public.profiles;');
      const recordsCheck = await client.query('SELECT COUNT(*) FROM public.fragmented_data_records;');
      const incidentsCheck = await client.query('SELECT COUNT(*) FROM public.incidents;');
      const mitigationsCheck = await client.query('SELECT COUNT(*) FROM public.mitigation_workflows;');

      console.log('\n📊 Seed data status:');
      console.log(`   Profiles: ${profileCheck.rows[0].count} record(s)`);
      console.log(`   Multi-Silo Records: ${recordsCheck.rows[0].count} record(s)`);
      console.log(`   Incidents: ${incidentsCheck.rows[0].count} record(s)`);
      console.log(`   Mitigations: ${mitigationsCheck.rows[0].count} record(s)`);

      await client.end();
      console.log('\n=================================================================');
      console.log('🎉 SUPABASE MIGRATION COMPLETED SUCCESSFULLY!');
      console.log('=================================================================');
      return;
    } catch (err: any) {
      console.error('❌ Error executing migration via PostgreSQL client:', err.message);
      await client.end().catch(() => {});
      console.log('Falling back to Supabase REST / Management API inspection...');
    }
  }

  // Strategy 2: Supabase Service Role Client
  if (config.supabaseUrl && config.supabaseServiceRoleKey && !config.supabaseUrl.includes('placeholder')) {
    console.log('\n📡 Connecting via Supabase Service Role Client...');
    console.log(`   Project URL: ${config.supabaseUrl}`);

    const supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    try {
      const { error: rpcError } = await supabase.rpc('exec_sql', { sql_query: sqlContent });

      if (!rpcError) {
        console.log('✅ Migration applied successfully via Supabase RPC exec_sql!');
      } else {
        console.log('ℹ️  exec_sql RPC not yet present in database.');
        console.log('   Checking if public tables already exist via REST:');

        const { data, error: selectError } = await supabase.from('profiles').select('id, email').limit(1);

        if (!selectError) {
          console.log('✅ Supabase tables are verified active via Service Role key.');
          console.log('   Sample profile query:', data);
        } else {
          console.warn('⚠️  Tables not yet initialized on Supabase Cloud:', selectError.message);
          printManualInstructions();
        }
      }
    } catch (err: any) {
      console.error('❌ Failed Supabase client migration call:', err.message);
      printManualInstructions();
    }
  } else {
    console.log('\n⚠️  No active DATABASE_URL or SUPABASE_SERVICE_ROLE_KEY detected in .env.');
    printManualInstructions();
  }
}

function printManualInstructions() {
  console.log('\n=================================================================');
  console.log('📋 HOW TO APPLY THIS MIGRATION TO SUPABASE CLOUD:');
  console.log('=================================================================');
  console.log('Option A (Direct CLI Migration):');
  console.log('  1. Open your Supabase Dashboard: https://supabase.com/dashboard');
  console.log('  2. Navigate to: Project Settings -> Database -> Connection String (URI).');
  console.log('  3. Paste into your .env file:');
  console.log('     DATABASE_URL="postgres://postgres.[ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres"');
  console.log('  4. Run in your terminal:');
  console.log('     npm run db:migrate');
  console.log('\nOption B (Supabase Dashboard SQL Editor):');
  console.log('  1. Open your Supabase Dashboard -> SQL Editor.');
  console.log('  2. Paste the full contents of:');
  console.log('     /supabase/migrations/001_initial_schema.sql');
  console.log('  3. Click "Run" (or Ctrl + Enter). All tables, RLS & seed data will be created!');
  console.log('=================================================================\n');
}

runMigration().catch((err) => {
  console.error('Fatal Migration Error:', err);
  process.exit(1);
});
