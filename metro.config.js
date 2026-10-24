const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
 
const config = getDefaultConfig(__dirname)
 
const finalConfig = withNativeWind(config, { input: './global.css' })

// TEMPORARY diagnostic (revert with `git checkout -- metro.config.js`)
if (process.env.HC_STUB_REANIMATED === "1") {
  const path = require("path");
  const prev = finalConfig.resolver.resolveRequest;
  finalConfig.resolver.resolveRequest = (ctx, name, platform) => {
    if (name === "react-native-reanimated" || name === "react-native-worklets") {
      if ((ctx.originModulePath || "").includes("/node_modules/")) return { type: "empty" };
      return { type: "sourceFile", filePath: path.join(__dirname, "__hc_reanimated_stub.js") };
    }
    return prev ? prev(ctx, name, platform) : ctx.resolveRequest(ctx, name, platform);
  };
}

module.exports = finalConfig