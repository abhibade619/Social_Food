
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// Load env vars
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function findUser() {
    const username = 'ab8921de';
    console.log(`Searching for username: ${username}`);

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

    if (error) {
        console.error('Error finding user:', error);
    } else {
        console.log('User found in profiles:', data);
        // Profiles might not have email, but let's see what it has.
    }
}

findUser();
