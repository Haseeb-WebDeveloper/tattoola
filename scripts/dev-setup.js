#!/usr/bin/env node

const { execSync } = require('child_process');
const os = require('os');

console.log('🚀 Setting up Tattoola Development Environment...\n');

// Get local IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '192.168.1.100'; // fallback
}

const localIP = getLocalIP();
console.log(`📍 Detected local IP: ${localIP}`);

// Update app.json with local IP for Expo Go
const fs = require('fs');
const path = require('path');

try {
  const appJsonPath = path.join(__dirname, '..', 'app.json');
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  
  // Add local IP to extra config for Expo Go
  if (!appJson.expo.extra) {
    appJson.expo.extra = {};
  }
  appJson.expo.extra.localIP = localIP;
  
  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
  console.log('✅ Updated app.json with local IP');
} catch (error) {
  console.log('⚠️  Could not update app.json:', error.message);
}

console.log('\n📋 Next Steps:');
console.log('1. Update Supabase redirect URLs:');
console.log(`   - Add: exp://${localIP}:8081 (for Expo Go)`);
console.log('   - Add: tattoola:// (for development builds)');
console.log('\n2. Choose your development method:');
console.log('   Option A (Recommended): Development Build');
console.log('   - Run: eas build --platform android --profile development');
console.log('   - Install APK on device');
console.log('   - Run: npm start');
console.log('\n   Option B: Expo Go');
console.log('   - Install Expo Go from app store');
console.log('   - Run: npm start');
console.log('   - Scan QR code with Expo Go');
console.log('\n3. Test deep linking:');
console.log('   - Use the red "Test Deep Link" button on welcome screen');
console.log('   - Check console logs for deep linking events');

console.log('\n🎉 Setup complete! Happy coding!');
