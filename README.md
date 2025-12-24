# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.



eas update --branch preview --message "ui refactored"

eas build --profile development --platform android

eas build --profile preview --platform android

<!-- For ios -->

eas build --profile development --platform ios
eas build --profile preview --platform ios



# If you used preview profile
eas submit --platform ios --profile preview

# If you used production profile
eas submit --platform ios --profile production

<!-- For ios production build and submission automatically -->
 npx eas-cli build --platform ios --profile production --auto-submit

<!-- For ios submittion only -->
npx eas-cli submit --platform ios --profile production

<!-- For android production build and submission automatically -->
npx eas-cli build --platform android --profile production --auto-submit

<!-- For android submittion only -->
npx eas-cli submit --platform android --profile production

<!-- For setting the version code and version name for ios -->
eas build:version:set --platform ios 

api-0000000000000000000-111111-aaaaaabbbbbb.json















todo
if o current profile do ot show user to other

at user Signup we have login and are you artist links
user signup step 4 logo upload icon
user ame input @






























plan
post show
tab bar icons 
gap on studio profile between icons and text







todo
// .eq("portfolioComplete", true)


ios click on input issue