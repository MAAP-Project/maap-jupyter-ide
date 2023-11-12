# Troubleshooting running readme commands in `maap-jupyter-ide` and ipycmc for local development
1. Disconnect from VPN if errors downloading packages or url cannot be resolved
2. If this line fails: `jupyter labextension install jupyterlab_toastify@3.0.0`, then try `jupyter labextension install --minimize=False jupyterlab_toastify@3.0.0` (this happens in MAAP ade Pilot ops, but only sometimes)
3. If `npm run build` fails with exit status 137, then you may need to increase the RAM of your workspace. 
4. If `jupyter labextension install @jupyter-widgets/jupyterlab-manager@2.0` fails, then run `jupyter labextension install --minimize=False @jupyter-widgets/jupyterlab-manager@2.0` instead (happens in MAAP ade Pilot ops sometimes)
5. If you get the error `ValueError: "/projects/maap-jupyter-ide/ipycmc/ipycmc" is not a valid npm package` when running `jupyter labextension install ipycmc` then `cd ..` out of `/ipycmc`
6. If you get this error message `OSError: No maap.cfg file found. Locations checked: ./maap.cfg; /home/gllewellyn19/maap.cfg; ./maap.cfg`, try running `export MAAP_CONF=/home/maap-py` where `home` is replaces with the file path to `maap-py`. You can find this by running `pwd`. 
7. If `npm run build` fails with a webpack error or exit status 1, in webpack.config.js, change 
```
const rules = [
  { test: /\.ts$/, loader: "ts-loader" },
  { test: /\.js$/, loader: "source-map-loader" },
  { test: /\.css$/, use: ["style-loader", "css-loader"] }
];
```
to
```
const rules = [
  { test: /\.ts$/, loader: "ts-loader" },
  { test: /\.js$/, loader: "source-map-loader" },
  { test: /\.css$/, use: ["style-loader", "css-loader"] },
  { test: /\.ttf$/, use: ["file-loader"] },
  { test: /\.woff$/, use: ["file-loader"] },
  { test: /\.eot$/, use: ["file-loader"] },
  { test: /\.svg$/, use: ["file-loader"] }
];
```