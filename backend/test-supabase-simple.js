import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Missing Supabase environment variables');
  console.log('Please make sure SUPABASE_URL and SUPABASE_ANON_KEY are set in your .env file');
  process.exit(1);
}

console.log('Supabase URL:', supabaseUrl);
console.log('Testing Supabase connection...');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Simple test to check if we can connect to Supabase
async function testConnection() {
  try {
    // Try to query a non-existent table to test connection
    try {
      const { data, error } = await supabase.from('_dummy_query_').select('*').limit(1);
      // If we get here without an error, something unexpected happened
      console.log('Unexpected success querying non-existent table:', data);
    } catch (err) {
      // This query is expected to fail with a "relation does not exist" error
      // But it still confirms we can connect to Supabase
      if (err.message && err.message.includes('does not exist')) {
        console.log('✅ Successfully connected to Supabase!');
        console.log('The query failed as expected, but the connection works.');
      } else {
        throw err;
      }
    }
    
    console.log('Connection test completed');
    
    // Try to get a list of tables
    try {
      // Query the information_schema to get table list
      const { data: tables, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
      
      if (error) {
        console.log('Could not retrieve table list:', error.message);
      } else if (tables && tables.length > 0) {
        console.log('\nExisting tables in the database:');
        tables.forEach(table => {
          console.log(`- ${table.table_name}`);
        });
      } else {
        console.log('No tables found in the database.');
      }
    } catch (err) {
      console.log('Could not query table list:', err.message);
    }
    
    console.log('\nTo create the necessary tables, please run the SQL in create-tables.sql');
    console.log('You can do this in the Supabase dashboard SQL Editor.');
    
  } catch (error) {
    console.error('❌ Failed to connect to Supabase:', error.message);
    process.exit(1);
  }
}

testConnection();
