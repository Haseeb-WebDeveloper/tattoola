const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// NativeWind config
const nativeWindOptions = { input: "./src/global.css", inlineRem: 16 };

// Ensure console logs are not filtered in development
if (process.env.NODE_ENV === "development") {
  // Disable console log filtering
  config.resolver.platforms = ["ios", "android", "native", "web"];

  // Ensure all console methods are available
  config.transformer.minifierConfig = {
    ...config.transformer.minifierConfig,
    keep_fnames: true,
    mangle: {
      ...config.transformer.minifierConfig?.mangle,
      keep_fnames: true,
    },
  };
}

// SVG support
config.transformer.babelTransformerPath = require.resolve("react-native-svg-transformer");
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== "svg");
config.resolver.sourceExts.push("svg");

module.exports = withNativeWind(config, nativeWindOptions);