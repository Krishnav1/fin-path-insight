import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import chalk from 'chalk';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(chalk.red('❌ Error: Missing Supabase environment variables'));
  console.log(chalk.yellow('Please make sure SUPABASE_URL and SUPABASE_ANON_KEY are set in your .env file'));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createHealthCheckTable() {
  console.log(chalk.blue('🔍 Creating health_check table...'));
  
  try {
    // Create the health_check table using SQL query
    const { error } = await supabase.rpc('create_health_check_table', {});
    
    if (error && !error.message.includes('already exists')) {
      console.error(chalk.red(`❌ Failed to create health_check table: ${error.message}`));
      return false;
    }
    
    // Insert initial health check record
    const { error: insertError } = await supabase
      .from('health_check')
      .upsert([{ service: 'supabase', status: 'ok', message: 'Supabase is operational' }]);
    
    if (insertError) {
      console.error(chalk.red(`❌ Failed to insert health check record: ${insertError.message}`));
      return false;
    }
    
    console.log(chalk.green('✅ Health check table created or already exists'));
    return true;
  } catch (error) {
    console.error(chalk.red(`❌ Failed to create health_check table: ${error.message}`));
    return false;
  }
}

async function testSupabaseConnection() {
  console.log(chalk.blue('🔍 Testing Supabase connection...'));
  
  try {
    // First, create the SQL function to create the health_check table if it doesn't exist
    const createFunctionQuery = `
      CREATE OR REPLACE FUNCTION create_health_check_table()
      RETURNS void AS $$
      BEGIN
        CREATE TABLE IF NOT EXISTS health_check (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          service TEXT NOT NULL,
          status TEXT NOT NULL,
          message TEXT,
          timestamp TIMESTAMPTZ DEFAULT NOW()
        );
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    // Execute the function creation query using REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        query: createFunctionQuery
      })
    });
    
    if (!response.ok) {
      console.warn(chalk.yellow(`⚠️ Could not create SQL function: ${response.statusText}`));
      console.log(chalk.yellow('Continuing with table check...'));
    }
    
    // Create the health_check table
    await createHealthCheckTable();
    
    // Test a simple query
    const { data, error } = await supabase.from('health_check').select('*').limit(1);
    
    if (error) {
      throw error;
    }
    
    console.log(chalk.green('✅ Successfully connected to Supabase!'));
    console.log(chalk.gray('Connection details:'));
    console.log(chalk.gray(`  URL: ${supabaseUrl}`));
    console.log(chalk.gray(`  Project ID: ${supabaseUrl.split('.')[0].split('//')[1]}`));
    
    // Check if health_check table exists
    if (data && data.length > 0) {
      console.log(chalk.green('✅ Health check table exists and contains data'));
    } else {
      console.log(chalk.yellow('⚠️ Health check table exists but contains no data'));
      console.log(chalk.yellow('You may need to run the database setup script to initialize tables'));
    }
    
    // Test table existence
    const tables = ['stocks', 'market_indices', 'market_status', 'charts', 'news', 'profiles', 'watchlists'];
    console.log(chalk.blue('\n🔍 Checking required tables...'));
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('count').limit(1);
        
        if (error) {
          if (error.code === '42P01') { // Relation does not exist
            console.log(chalk.red(`❌ Table '${table}' does not exist`));
          } else {
            console.log(chalk.red(`❌ Error querying table '${table}': ${error.message}`));
          }
        } else {
          console.log(chalk.green(`✅ Table '${table}' exists`));
        }
      } catch (err) {
        console.log(chalk.red(`❌ Error checking table '${table}': ${err.message}`));
      }
    }
    
    console.log(chalk.blue('\n📋 Summary:'));
    console.log(chalk.green('Supabase connection: OK'));
    console.log(chalk.yellow('If any tables are missing, please run the database setup script'));
    console.log(chalk.yellow('See SUPABASE-SETUP.md for instructions on setting up the database'));
    
  } catch (error) {
    console.error(chalk.red(`❌ Failed to connect to Supabase: ${error.message}`));
    console.log(chalk.yellow('Please check your Supabase credentials and network connection'));
    
    if (error.code) {
      console.log(chalk.gray(`Error code: ${error.code}`));
    }
    
    process.exit(1);
  }
}

testSupabaseConnection();
