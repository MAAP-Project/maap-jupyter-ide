# In-line Notebook Magics

## Load the inline magics in notebook
**WARNING**: This will not work for a python script.  This is for use in notebooks only.<br>
You must enable the extension in the notebook: `%load_ext dps_magic`<br>
You can run a command by entering `%` followed by a command and its arguments into a notebook cell.

## Available Magics
You can list the available magics by running `%help`<br>
Output:<br>
| Magic Command	| Description |
| ------------- | ----------- |
| %capabilities | get information about MAAP API services |
| %list | list algorithms registered in MAS |
| %describe | describe the selected algorithm |
| %execute | submit a job to DPS using an algorithm registered in MAS |
| %status | check the status of a submitted job |
| %result | get the results for a completed job |
| %delete_algorithm | remove a registered algorithm from MAS |
| %delete_job | remove a completed job from DPS |
| %s3_url | get a presigned s3 url for an object |
| %help | print this help info |

Pass the argument "help" to a command for more specific instructions on how to use it:<br>
`%execute help`<br>
Output:<br>
![execute_help_menu](./images/execute_help.png)

Cell: `%s3_url`<br>
Output:
```
Presigned S3 Url Help

Get a presigned s3 url for an object.  You need to know the path of the file relative to the bucket or your /projects directory.
Example s3_url call:
    %s3_url eyam/file-on-bucket
```

### List
Cell:<br>
`%list`<br>
Output:
```
Algorithms:
	example_plot_ubuntu:1.0
	gdal_service:master
	george_demo_ubuntu:master
	george_esdis_demo_ubuntu:1.0
	liz-plot2_ubuntu:1.0
	plant_algo:master
	plant_test:master
	plot_algo:master
	plot_demo3:master
	plot_demo4:master
	plot_demo_ubuntu:master
	plot_example_ubuntu:1.0
	plot_test2_ubuntu:master
	plot_test3_ubuntu:master
	plot_test5_ubuntu:master
	plot_test_ubuntu:master
	plot_ubuntu:master
```

### Describe
Cell:<br>
`%describe help`<br>
Output:
```
Describe Algorithm Help

Check the inputs required for an algorithm stored in MAS.  You need to know your algorithm name and version.

Example Describe Call:
    %describe plot_algo:master
Example Dictionary Call: 
    d = {'algo_id':'plot_algo','version':'master'} 
    %describe $d
```
<br><br>
Cell:<br>
`%describe george_demo_ubuntu:master`<br>
OR<br>
Cell:<br>
```
d = {'algo_id':'george_demo_ubuntu','version':'master'}
%describe $d
```
<br>
Output:
```
Algorithm: george_demo_ubuntu
Version: master
Identifier:	george_demo_ubuntu:master
Input
	Title:	pass_number
	Identifier:	pass_number
	DataType:	string

Input
	Title:	timestamp
	Identifier:	timestamp
	DataType:	string

Input
	Title:	username
	Identifier:	username
	DataType:	string

Output:	[]
```

### Execute
Cell:<br>
`%execute help`<br>
Output:
```
Execute Job Help
Execute a job through DPS.  You need to know the parameters of your algorithm.  Use %describe to check if you are unsure.

Example String Call: 
    %execute plot_algo:master(pass_number=3,username=liz)
Example Dictionary Call: 
    d = {'pass_number':'6','username':'liz','algo_id':'plot_algo','version':'master'} 
    %execute $d
```
<br><br>
Cell:<br>
`%execute plot_algo:master(pass_number=3,username=eyam)`<br>
OR<br>
```
d = {'pass_number':'6','username':'eyam','algo_id':'plot_algo','version':'master'} 
%execute $d
```
<br>
Output:
```
JobID is cd36b6ff-5477-4cbf-80b8-772a77a44c58
```
- make sure you use your username, or else the Job ID will **not** be saved anywhere else and will **not** be displayed in the jobs table

### Status
Cell:<br>
`%status help`<br>
Output:
```
Job Status Help

Check the status of a job in DPS.  You need to know your job ID.
Example Status Call:
    %status ef6fde9e-0975-4556-b8a7-ee52e91d8e61
```
<br><br>
Cell:<br>
`%status cd36b6ff-5477-4cbf-80b8-772a77a44c58`<br>
<br>
Output:
```
JobID is cd36b6ff-5477-4cbf-80b8-772a77a44c58
Status: Succeeded
```
### Result
Cell:<br>
`%result help`<br>
Output:
```
Job Result Help

Check the result of a completed job in DPS.  You need to know your job ID.
Example Result Call:
    %result ef6fde9e-0975-4556-b8a7-ee52e91d8e61
```
<br><br>
Cell:<br>
`%result cd36b6ff-5477-4cbf-80b8-772a77a44c58`<br>
<br>
Output:<br>
<table id="job-result-display" style="border-style: none; font-size: 11px">
	<thead>
		<tr>
			<th colspan="2" style="text-align:left"> Job Results</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>JobID: </td><td style="text-align:left">cd36b6ff-5477-4cbf-80b8-772a77a44c58</td>
		</tr>
		<tr>
			<td>ProductName: </td><td style="text-align:left">output-2019-09-13_00-21-53</td>
		</tr>
		<tr>
			<td>Locations: </td><td style="text-align:left">http://maapdev.s3.amazonaws.com/products/plot/v1.0/2019/09/13/output-2019-09-13_00-21-53<br>	•&nbsp;s3://s3.amazonaws.com:80/maapdev/products/plot/v1.0/2019/09/13/output-2019-09-13_00-21-53<br>	•&nbsp;<a href="https://s3.console.aws.amazon.com/s3/buckets/maapdev/products/plot/v1.0/2019/09/13/output-2019-09-13_00-21-53/?region=us-east-1&tab=overview" target="_blank" style="border-bottom: 1px solid #0000ff; color: #0000ff;">https://s3.console.aws.amazon.com/s3/buckets/maapdev/products/plot/v1.0/2019/09/13/output-2019-09-13_00-21-53/?region=us-east-1&tab=overview</a></td>
		</tr>
	</tbody>
</table>

- the call will return an error if the job was not successfully completed (includes started, revoked, failed, and deleted)

### Delete
Cell:<br>
`%delete_job help`<br>
Output:
```
Delete Job Help

Delete a finished (completed or failed) job or queued job stored in DPS.  You need to know your Job ID.
Example Delete Call:
    %delete_job ef6fde9e-0975-4556-b8a7-ee52e91d8e61
```
<br><br>
Cell:<br>
`%delete_job 5bcac3c8-9958-4c54-bb73-99d5eba09879`
Output:<br>
```
JobID is 5bcac3c8-9958-4c54-bb73-99d5eba09879
Status: Deleted
```

### Dismiss
Cell:<br>
`%dismiss help`<br>
Output:
```
Dismiss Job Help

Dismiss a running (started, NOT queued) job on DPS.  You need to know your Job ID.
Example Dismiss call:
	%dismiss_job ef6fde9e-0975-4556-b8a7-ee52e91d8e61'
```
<br><br>
Cell:<br>
`%dismiss c9737ace-b143-49cc-96e4-9a6a7665932d`<br>
Output:
```
JobID is c9737ace-b143-49cc-96e4-9a6a7665932d
Status: Dismissed
```

### s3 Url
Cell:<br>
`%s3_url help`<br>
Output:
```
Presigned S3 Url Help

Get a presigned s3 url for an object.  You need to know the path of the file relative to the bucket or your /projects directory.
Example s3_url call:
	%s3_url eyam/file-on-bucket
```
<br><br>
Cell:<br>
`%s3_url eyam/file-on-bucket`<br>
Output:
```
https://maap-mount-dev.s3.amazonaws.com/eyam/file-on-bucket?AWSAccessKeyId=AKIAJTSO23RLALBN45NQ&Signature=vgK%2FvwuSSYc4WUf39o4KWtbdVtw%3D&Expires=1568351409
```