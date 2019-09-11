# In-line Notebook Magics

## Load the inline magics in notebook
**WARNING**: This will not work for a python script.  This is for use in notebooks only.

## Available Magics
You must enable the extension in the notebook: `%load_ext dps_magic`
You can list the available magics by running `%help`<br>
Output:<br>
| Magic Command	| Description |
| %capabilities | get information about MAAP API services |
| %list | list algorithms registered in MAS |
| %describe | describe the selected algorithm |
| %execute | submit a job to DPS using an algorithm registered in MAS |
| %status | check the status of a submitted job |
| %result | get the results for a completed job |
| %delete | remove a registered algorithm from MAS |
| %help | print this help info |

Pass the argument "help" to a command for more specific instructions on how to use it:<br>
`%execute help`<br>
Output:<br>
![execute_help_menu](./images/execute_help.png)