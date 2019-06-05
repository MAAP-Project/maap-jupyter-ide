import json
import os

WORKDIR = os.getcwd()+'/../../submit_jobs'
fields_path = WORKDIR+'/src/fields.json'
# getCapabilities, execute, getStatus, getResult, dismiss, describe

def getFields(param):
	try:
		with open(fields_path) as fields:
			data = json.load(fields)
			return data[param]
	except:
		return []
