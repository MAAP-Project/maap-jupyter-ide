# dps_magic

An nbextension to allow inline submission of DPS jobs, corresponding to and dependent on API endpoints from the `submit_jobs` extension, using jupyter notebook line magics.<br>
When opening the workspace (or any time the kernel has been restarted), the extension must be loaded by running `%load_ext dps_magic` in a cell.  Currently implemented are:

1. Get Capabilities
	- calls `hysds/getCapabilities`
	- inline call: `%capabilities`
2. List Algorithms
	- calls `hysds/listAlgorithms`
	- inline call: `%list`
3. Describe Process
	- calls `hysds/describeProcess`
	- inline call: `%describe algorithm_name:version`
4. Execute
	- calls `hysds/execute`
	- inline call: `%execute algorithm_name:version(param1:val1,param2:val2`
5. Get Status
	- calls `hysds/getStatus`
	- inline call: `%status job_id`
6. Get Result
	- calls `hysds/getResult`
	- inline call: `%result job_id`
7. Delete Algorithm
	- calls `hysds/deleteAlgorithm`
	- inline call: `%delete algorithm_name:version`

If you are unsure of how to use the line magics, you can view the help text by calling `%function help`, for example `%execute help`.

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

Within Dockerfile, cd into the extension top directory:

```bash
pip install -e .
jupyter nbextension install --symlink --py dps_magic --sys-prefix
jupyter nbextension enable --py dps_magic --sys-prefix
```