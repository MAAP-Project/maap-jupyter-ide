
# dps_magic

[![Build Status](https://travis-ci.org//dps_magic.svg?branch=master)](https://travis-ci.org//dps_magic)
[![codecov](https://codecov.io/gh//dps_magic/branch/master/graph/badge.svg)](https://codecov.io/gh//dps_magic)


An nbextension to allow inline submission of DPS jobs

## Installation

You can install using `pip`:

```bash
pip install dps_magic
```

Or if you use jupyterlab:

```bash
pip install dps_magic
jupyter labextension install @jupyter-widgets/jupyterlab-manager
```

If you are using Jupyter Notebook 5.2 or earlier, you may also need to enable
the nbextension:
```bash
jupyter nbextension enable --py [--sys-prefix|--user|--system] dps_magic
```
