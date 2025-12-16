import fs from 'fs';
import path from 'path';
import https from 'https';

// Manually parse .env to avoid dependencies
const envPath = path.resolve(process.cwd(), '.env');
let envVars = {};

try {
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^["'](.*)["']$/, '$1');
                envVars[key] = value;
            }
        });
        console.log('✅ Loaded .env file');
    } else {
        console.error('❌ .env file not found at:', envPath);
    }
} catch (err) {
    console.error('❌ Error reading .env:', err.message);
}

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

console.log('--- Configuration Check ---');
console.log(`VITE_SUPABASE_URL: ${supabaseUrl ? 'Found' : 'MISSING'}`);
if (supabaseUrl) console.log(`  Value: ${supabaseUrl}`);
console.log(`VITE_SUPABASE_ANON_KEY: ${supabaseKey ? 'Found' : 'MISSING'}`);
if (supabaseKey) console.log(`  Value (first 10 chars): ${supabaseKey.substring(0, 10)}...`);

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing required Supabase environment variables.');
    process.exit(1);
}

console.log('\n--- Connectivity Check ---');
const url = new URL(supabaseUrl);
const options = {
    hostname: url.hostname,
    path: '/auth/v1/health',
    method: 'GET',
    headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
    }
};

const req = https.request(options, (res) => {
    console.log(`Response Status: ${res.statusCode}`);

    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Response Body:', data);
        if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('✅ Connection to Supabase successful!');
        } else {
            console.error('❌ Failed to connect to Supabase.');
        }
    });
});

req.on('error', (e) => {
    console.error(`❌ Request Error: ${e.message}`);
    if (e.code === 'ENOTFOUND') {
        console.error('   -> Host not found. Check the URL.');
    }
});

req.end();
