module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./src"],
          extensions: [".js", ".jsx", ".ts", ".tsx"],
          alias: {
            "@": "./src",
            app: "./src/app",
            components: "./src/components",
            // add more aliases as needed
          },
        },
      ],
      "react-native-reanimated/plugin", // Must be last
    ],
  };
};
