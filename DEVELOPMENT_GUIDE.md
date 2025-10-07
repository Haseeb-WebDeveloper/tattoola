# 🚀 Tattoola Development & Distribution Guide

## Overview
This guide covers the complete development and distribution workflow for the Tattoola app using Expo and EAS Build.

## 🛠️ Development Workflow

### Option 1: Development Builds (Recommended)
**Best for**: Production-like testing with instant updates

#### Setup (One-time):
```bash
# 1. Install EAS CLI
npm install -g @expo/eas-cli

# 2. Login to Expo
eas login

# 3. Build development version
eas build --platform android --profile development
# or for iOS: eas build --platform ios --profile development

# 4. Install the APK/IPA on your device
# Download from: https://expo.dev/accounts/haseebfigmenta/projects/tattoola/builds
```

#### Daily Development:
```bash
# 1. Start development server
npm start

# 2. Open your development build app and scan QR code
# 3. Make changes - they'll appear instantly!
```

### Option 2: Expo Go (Quick Testing)
**Best for**: Quick testing, but has limitations

```bash
# 1. Install Expo Go from app store
# 2. Start development server
npm start
# 3. Scan QR code with Expo Go
```

**Limitations with Expo Go:**
- Deep linking works differently
- Some native features may not work
- Not suitable for production testing

## 📱 Distribution Workflow

### For Client Testing (Preview Builds)

#### 1. Build Preview Version:
```bash
eas build --platform android --profile preview
eas build --platform ios --profile preview
```

#### 2. Share with Client:
- Send APK/IPA file to client
- Client installs and tests the app
- No development server needed!

#### 3. Send Updates (OTA):
```bash
# After making changes, publish update
eas update --channel preview

# Client will get update when they reopen the app
```

### For Production (App Store)

#### 1. Build Production Version:
```bash
eas build --platform android --profile production
eas build --platform ios --profile production
```

#### 2. Submit to App Stores:
```bash
# Submit to Google Play Store
eas submit --platform android --profile production

# Submit to Apple App Store
eas submit --platform ios --profile production
```

## 🔧 Environment Configuration

### Development vs Production URLs
The app automatically uses different redirect URLs based on the build:

- **Development Build**: `tattoola://` (custom scheme)
- **Expo Go**: `exp://192.168.1.100:8081` (Expo scheme)
- **Production**: `tattoola://` (custom scheme)

### Supabase Configuration
Make sure your Supabase project has these redirect URLs configured:

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add these redirect URLs:
   - `tattoola://` (for development builds and production)
   - `exp://192.168.1.100:8081` (for Expo Go - replace with your IP)

## 🐛 Debugging Deep Linking

### Check Logs:
- **Development Build**: Use `npx expo start` and check terminal logs
- **Expo Go**: Use `npx expo start` and check terminal logs
- **Production Build**: Use remote logging or crash reporting

### Test Deep Linking:
1. Use the red "Test Deep Link" button on welcome screen
2. Check console logs for deep linking events
3. Verify email verification flow

## 📋 Daily Workflow Checklist

### For Development:
- [ ] Start development server: `npm start`
- [ ] Open development build app
- [ ] Scan QR code
- [ ] Make changes
- [ ] Test on device
- [ ] Check console logs

### For Client Updates:
- [ ] Make changes
- [ ] Test locally
- [ ] Publish update: `eas update --channel preview`
- [ ] Notify client to reopen app

### For Production Release:
- [ ] Test thoroughly
- [ ] Build production: `eas build --platform android --profile production`
- [ ] Test production build
- [ ] Submit to app stores: `eas submit`

## 🚨 Common Issues & Solutions

### Issue: Deep linking not working
**Solution**: Check Supabase redirect URL configuration

### Issue: App not updating for client
**Solution**: Make sure client reopens the app after `eas update`

### Issue: Build fails
**Solution**: Check EAS logs: `eas build:list` and `eas build:view [BUILD_ID]`

### Issue: Can't see logs in development build
**Solution**: Use `npx expo start` and check terminal, or add remote logging

## 📞 Support Commands

```bash
# Check build status
eas build:list

# View specific build
eas build:view [BUILD_ID]

# Check update status
eas update:list

# View project info
eas project:info

# Check account info
eas whoami
```

## 🎯 Best Practices

1. **Always test on real device** - Simulators don't show all issues
2. **Use development builds for testing** - Closest to production
3. **Test deep linking thoroughly** - Critical for email verification
4. **Keep client builds updated** - Use OTA updates for quick fixes
5. **Monitor build logs** - Check for errors and warnings

## 📱 Client Distribution

### For Android:
- Send APK file directly
- Client enables "Install from unknown sources"
- Client installs APK

### For iOS:
- Send IPA file
- Client needs to trust developer certificate
- Or use TestFlight for easier distribution

---

**Need Help?** Check the [Expo Documentation](https://docs.expo.dev/) or [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
