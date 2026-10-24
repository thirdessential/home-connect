// TEMPORARY diagnostic stub (not part of the app): used only when Metro runs with
// HC_STUB_REANIMATED=1 to test whether Reanimated's native init is implicated in the
// Fabric pullTransaction crash. Delete after the experiment.
const React = require("react");
const RN = require("react-native");

module.exports = {
  __esModule: true,
  default: {
    View: RN.View,
    Text: RN.Text,
    ScrollView: RN.ScrollView,
    Image: RN.Image,
    createAnimatedComponent: (c) => c,
  },
  useSharedValue: (v) => React.useRef({ value: v }).current,
  useAnimatedStyle: (fn) => {
    try {
      return fn();
    } catch (e) {
      return {};
    }
  },
  withTiming: (to, _opts, cb) => {
    if (typeof cb === "function") cb(true);
    return to;
  },
  runOnJS: (fn) => fn,
};
