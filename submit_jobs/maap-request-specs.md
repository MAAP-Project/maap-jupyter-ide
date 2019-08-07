# Required parameters for interfacing with MAAP API vs user-provided info
## Register
### Parameters
Required by API:
- script_command (run_cmd)
- algorithm_name (algo_name)
- code_version (version)
- algorithm_description (algo_desc)
- environment_name (environment)
- docker_container_url (docker_url)
- repo_url (repo_url)
- algorithm_params (algo_inputs)

User-Provided:
- script_command (run_cmd), to be pre-populated
- algorithm_name (algo_name), pre-populated with filename/path
- environment_name (environment), pre-populated as `ubuntu`
- optional: algorithm_description (algo_desc)
- optional: algorithm_params (algo_inputs)
	- separated by newline
	- if input needs to be downloaded, add `true`,`download`, or `dl` after a comma; default if unspecified is false
	- example for Jupyter UI: 
```
localize_urls, false
username, false
```

Provided by Jupyter UI:
- repo_url (repo_url), pre-populated with `git remote get-url origin`
- code_version (version), pre-populated with `git branch`
- algorithm_description (algo_desc), defaults to empty string


Other:
- docker_container_url (docker_url), currently hardcoded to `registry.nasa.maap.xyz/root/dps_plot:master`
	- will be pre-populated as environment variable when solution is found for running without wrapper script

### Example POST Request
url: https://api.maap.xyz/api/mas/algorithm

```
{
	"script_command" : "run_plot.sh",
	"algorithm_name" : "plot_test",
	"code_version": "master",
	"algorithm_description" : "Plot Algo",
	"environment_name": "ubuntu",
	"docker_container_url": "registry.nasa.maap.xyz/root/dps_plot:master",
	"repo_url" : "https://repo.nasa.maap.xyz/root/dps_plot.git",
	"algorithm_params" : [
		{
			"field": "pass_number",
			"download": false
		},
		{
			"field": "timestamp",
			"download": false
		},
		{
	      "field": "username",
	      "download": false
	    }
	]
}
```

## Delete
### Parameters
Required by API:
- algorithm id (algo_id)
- algorithm version (version)

### Example POST Request
url: https://api.maap.xyz/api/mas/algorithm/<algo_id>:<version>
<br>
no body

## Get Capabilities
### Parameters
no parameters

### Example GET Request
url: https://api.maap.xyz/api/dps/job

## List Algorithms
### Parameters
no parameters

### Example GET Request
url: https://api.maap.xyz/api/mas/algorithm

## Describe Process
### Parameters
Required in URL:
- algorithm id (algo_id)
- algorithm version (version)

### Example GET Request
url: https://api.maap.xyz/api/mas/algorithm/<algo_id>:<version>

## Execute
### Parameters
Required by API:
- job_type (algo_id,version)
- optional: input

### Example POST Request
url: http://api.maap.xyz/api/dps/job
<br>
```
<wps:Execute
	xmlns:wps="http://www.opengis.net/wps/2.0"
	xmlns:ows="http://www.opengis.net/ows/2.0"
	xmlns:xlink="http://www.w3.org/1999/xlink"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.opengis.net/wps/2.0 ../wps.xsd" service="WPS"
       version="2.0.0" response="document" mode="sync">
	<ows:Identifier>org.n52.wps.server.algorithm.SimpleBufferAlgorithm</ows:Identifier>
	<wps:Input id="job_type">
		<wps:Data>
			<wps:LiteralValue>
	            job-plot_test:master
	        </wps:LiteralValue>
		</wps:Data>
	</wps:Input>
	<wps:Input id="pass_number">
		<wps:Data>
			<wps:LiteralValue>2</wps:LiteralValue>
		</wps:Data>
	</wps:Input>
	<wps:Input id="timestamp">
		<wps:Data>
			<wps:LiteralValue>2018-03-26T00:00:01Z</wps:LiteralValue>
		</wps:Data>
	</wps:Input>
	<wps:Output id="result" transmission="value"/>
</wps:Execute>
```

## Get Status
### Parameters
Required in URL:
- job id (job_id)

### Example GET Request
url: http://api.maap.xyz/api/dps/job/<job_id>/status

## Get Result
### Parameters
Required in URL:
- job id (job_id)

### Example GET Request
url: https://api.maap.xyz/api/dps/job/<job_id>

## List Jobs
### Parameters
Required in URL:
- username (username)

### Example GET Request
url: http://api.maap.xyz/api/dps/job/<username>/list

## Dismiss
not implemented