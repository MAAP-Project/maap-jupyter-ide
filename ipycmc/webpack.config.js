const path = require("path");
const version = require("./package.json").version;

// cmc-jupyter assets
cmc_assets = /maap-common-mapping-client\/dist/;
//cmc_assets = path.normalize('/maap-common-mapping-client\/dist/');
//cmc_assets = path.posix.normalize('/maap-common-mapping-client\/dist/');
//cmc_assets = path.posix.normalize(\\maap-common-mapping-client\\dist\\);
//cmc_assets = path.posix.normalize('/maap-common-mapping-client\/dist/');
//cmc_assets = C:\maap-common-mapping-client\dist\

// Custom webpack rules
const rules = [
  { test: /\.ts$/, loader: "ts-loader" },
  { test: /\.js$/, loader: "source-map-loader" },
  { test: /\.css$/, use: ["style-loader", "css-loader"] },
  { test: /\.ttf$/, use: ["file-loader"] },
  { test: /\.woff$/, use: ["file-loader"] },
  { test: /\.eot$/, use: ["file-loader"] },
  { test: /\.svg$/, use: ["file-loader"] }
];

// Packages that shouldn't be bundled but loaded at runtime
const externals = ["@jupyter-widgets/base"];

const resolve = {
  // Add '.ts' and '.tsx' as resolvable extensions.
  extensions: [".webpack.js", ".web.js", ".ts", ".js"]
};

module.exports = [
  /**
   * Notebook extension
   *
   * This bundle only contains the part of the JavaScript that is run on load of
   * the notebook.
   */
  {
    entry: "./src/extension.ts",
    output: {
      filename: "index.js",
      path: path.resolve(__dirname, "ipycmc", "nbextension", "static"),
      libraryTarget: "amd"
    },
    module: {
      rules: rules,
      noParse: cmc_assets
    },
    devtool: "source-map",
    externals,
    resolve
  },

  /**
   * Embeddable ipycmc bundle
   *
   * This bundle is almost identical to the notebook extension bundle. The only
   * difference is in the configuration of the webpack public path for the
   * static assets.
   *
   * The target bundle is always `dist/index.js`, which is the path required by
   * the custom widget embedder.
   */
  {
    entry: "./src/index.ts",
    output: {
      filename: "index.js",
      path: path.resolve(__dirname, "dist"),
      libraryTarget: "amd",
      library: "ipycmc",
      publicPath: "https://unpkg.com/ipycmc@" + version + "/dist/"
    },
    devtool: "source-map",
    module: {
      rules: rules,
      noParse: cmc_assets
    },
    externals,
    resolve
  },

  /**
   * Documentation widget bundle
   *
   * This bundle is used to embed widgets in the package documentation.
   */
  {
    entry: "./src/index.ts",
    output: {
      filename: "embed-bundle.js",
      path: path.resolve(__dirname, "docs", "source", "_static"),
      library: "ipycmc",
      libraryTarget: "amd"
    },
    module: {
      rules: rules,
      noParse: cmc_assets
    },
    devtool: "source-map",
    externals,
    resolve
  }
];
