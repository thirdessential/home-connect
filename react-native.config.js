// @react-native-firebase/messaging is installed but never imported in JS. Its
// Android ReactNativeFirebaseMessagingService (priority 0) outranks
// expo-notifications' service (priority -1), so foreground pushes were consumed
// there and never reached expo-notifications (no banner, no received-listener).
// Excluding it from Android autolinking leaves Expo as the only FCM handler.
module.exports = {
  dependencies: {
    "@react-native-firebase/messaging": { platforms: { android: null } },
  },
};
