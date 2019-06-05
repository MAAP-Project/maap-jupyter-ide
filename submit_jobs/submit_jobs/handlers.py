from notebook.base.handlers import IPythonHandler
from notebook.notebookapp import list_running_servers
import xml.etree.ElementTree as ET
import requests
import subprocess
import json
import datetime
import copy
import sys
import os
import logging

# logger = logging.getLogger()
# logger.setLevel(logging.DEBUG)

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from fields import getFields
# USE https when pointing to actual MAAP API server
#BASE_URL = "http://localhost:5000/api"
BASE_URL = "https://api.maap.xyz/api"
WORKDIR = os.getcwd()+'/../../submit_jobs'

def dig(node):
	# print("dig!")
	if len(node) > 1:
		return {node.tag[node.tag.index('}')+1:]:[dig(e) for e in node]}
	elif len(node) == 1:
		return {node.tag[node.tag.index('}')+1:]:dig(node[0])}
	else:
		# return {node.tag[node.tag.index('}')+1:]:node.text.split(' ')}
		return {node.tag[node.tag.index('}')+1:]:node.text}

# helper to parse out algorithm parameters for execute
def getParams(node):
	tag = node.tag[node.tag.index('}')+1:]
	if tag in ['Title','Identifier']:
		return (tag,node.text)
	elif tag == 'LiteralData':
		return (node[1][1].tag.split('}')[-1],list(node[1][1].attrib.values())[0].split(':')[-1])
	else:
		return (tag,[getParams(e) for e in node])

# helper to parse out products of result
def getProds(node):
	tag = node.tag[node.tag.index('}')+1:]
	if tag in ['ProductName','Location']:
		return (tag,node.text)
	elif tag == 'Locations':
		return (tag,[loc.text for loc in node])
	else:
		return (tag,[getProds(e) for e in node])

# helper to parse out user-defined inputs when registering algorithm
def parseInputs(popped):
	a = popped.strip()
	a = a.replace('\n',';')
	inputs = [e.split(',') for e in a.split(';')]							# split lines into inputs
	inputs = [[e.strip().replace(' ','_') for e in e1] for e1 in inputs]	# strip whitespace
	inputs = [e+['false'] if len(e) == 1 else e for e in inputs]			# set false if dl not set
	inputs = [[e[0],'true'] if e[1].lower() in ['true','download','dl'] else [e[0],'false'] for e in inputs] 	# replace anything not dl=true to false
	inputs = {e[0]:e[1] for e in inputs}									# convert to dictionary & overwrite duplicate input names
	# print(a)
	# print(inputs)
	return inputs

# helper to print accepted user-defined inputs when registering algorithm
def printInputs(resp,inputs):
	result = resp['message'] + '\nInputs:\n'
	for name in inputs.keys():
			if len(name) > 0:
				if inputs[name] == 'true':
					result += '\t{} (download)\n'.format(name)
				else:
					result += '\t{} (no download)\n'.format(name)
	return result

class RegisterAlgorithmHandler(IPythonHandler):
	def get(self,**params):
		# ==================================
		# Part 1: Parse Required Arguments
		# ==================================
		# logging.debug('workdir is '+WORKDIR)
		fields = ['nb_name'] + getFields('register')
		# logging.debug('fields')
		# logging.debug(fields)

		params = {}
		for f in fields:
			try:
				arg = self.get_argument(f.lower(), '').strip()
				params[f] = arg
				# logging.debug('found '+f)
			except:
				params[f] = ''
				# logging.debug('no '+f)
		
		print(params)
		# logging.debug('params are')
		# logging.debug(params)
		nb_name = params['nb_name']

		if params['repo_url'] == '':
			json_file = WORKDIR+"/submit_jobs/register.json"
			params.pop('repo_url')
		else:
			json_file = WORKDIR+"/submit_jobs/register_url.json"

		# replace spaces in algorithm name
		params['algo_name'] = params['algo_name'].replace(' ', '_')

		# ==================================
		# Part 2: Check if User Has Committed
		# ==================================
		if nb_name != '':
			# navigate to project directory
			proj_path = ('/').join(['/projects']+nb_name.split('/')[:-1])
			os.chdir(proj_path)

			# get git status
			git_status_out = subprocess.check_output("git status --porcelain", shell=True).decode("utf-8")

			# is there a git repo?
			if 'not a git repository' in git_status_out:
				self.finish({"status_code": 412, "result": "Error: \n{}".format(git_status_out)})
				return

			git_status = git_status_out.splitlines()
			git_status = [e.strip() for e in git_status]

			# filter for unsaved python files
			unsaved = list(filter(lambda e: ( (e.split('.')[-1] in ['ipynb','py']) and (e[0] in ['M','?']) ), git_status))

			# if there are unsaved python files, user needs to commit
			if len(unsaved) != 0:
				self.finish({"status_code": 412, "result": "Error: Notebook(s) and/or script(s) have not been committed\n{}".format('\n'.join(unsaved))})
				return

		# ==================================
		# Part 3: Build & Send Request
		# ==================================
		json_in_file = WORKDIR+"/submit_jobs/register_inputs.json"
		url = BASE_URL+'/mas/algorithm'
		headers = {'Content-Type':'application/json'}

		with open(json_in_file) as f:
			ins_json = f.read()

		# build inputs json		
		popped = params.pop('inputs')
		inputs = parseInputs(popped)

		ins = ''
		for name in inputs.keys():
			if len(name) > 0:
				ins += ins_json.format(field_name=name,dl=inputs[name])

		# print(ins)
		# add inputs json to params for template substitution
		params['algo_inputs'] = ins

		with open(json_file) as jso:
			req_json = jso.read()

		req_json = req_json.format(**params)
		print(req_json)

		# ==================================
		# Part 4: Check Response
		# ==================================
		try:
			r = requests.post(
				url=url,
				data=req_json,
				headers=headers
			)
			print(r.text)
			if r.status_code == 200:
				try:
					# MAAP API response
					resp = json.loads(r.text)
					# show registered inputs
					result = printInputs(resp,inputs)
					self.finish({"status_code": resp['code'], "result": result})
				except:
					self.finish({"status_code": r.status_code, "result": r.text})
			else:
				print('failed')
				self.finish({"status_code": r.status_code, "result": r.reason})
		except:
			self.finish({"status_code": 400, "result": "Bad Request"})

# class RegisterAutoHandler(IPythonHandler):
# 	def get(self):
# 		# ==================================
# 		# Part 1: Get Notebook Information Processed in UI
# 		# ==================================
# 		# include user-defined inputs
# 		fields =  getFields('register') + ['lang','nb_name']#,'algo_name']
# 		params = {}
# 		for f in fields:
# 			try:
# 				arg = self.get_argument(f,'').strip()
# 				params[f] = arg
# 			except:
# 				params[f] = ''

# 		# print(params)
# 		lang = params['lang']
# 		nb_name = params['nb_name']
# 		algo_name = nb_name
# 		params['algo_name'] = nb_name

# 		# ==================================
# 		# Part 2: GitLab Token
# 		# ==================================
# 		# set key and path
# 		ENV_TOKEN_KEY = 'gitlab_token'
# 		proj_path = ('/').join(['/projects']+nb_name.split('/')[:-1])
# 		# if proj_path != '/':
# 		os.chdir(proj_path)

# 		# check if GitLab token has been set
# 		git_url = subprocess.check_output("git remote get-url origin", shell=True).decode('utf-8').strip()
# 		print(git_url)
# 		token = git_url.split("repo.nasa")[0][:-1]
# 		ind = token.find("gitlab-ci-token:")
# 		notoken = True

# 		# if repo url has token, no problems
# 		if ind != -1:
# 			token = token[ind+len("gitlab-ci-token:"):]
# 			if len(token) != 0:
# 				print("token has been set")
# 				notoken = False
		
# 		# token needs to be set
# 		if notoken:
# 			# if saved in environment, set for user
# 			if ENV_TOKEN_KEY in os.environ:
# 				token = os.environ[ENV_TOKEN_KEY]
# 				print(token)
# 				url = git_url.split("//")
# 				new_url = "{pre}//gitlab-ci-token:{tkn}@{rep}".format(pre=url[0],tkn=token,rep=url[1])
# 				status = subprocess.call("git remote set-url origin {}".format(new_url), shell=True)

# 				if status != 0:
# 					self.finish({"status_code": 412, "result": "Error {} setting GitLab Token".format(status)})
# 					return
# 			else:
# 				self.finish({"status_code": 412, "result": "Error: GitLab Token not set in environment\n{}".format(git_url)})
# 				return

# 		# self.finish({"status_code":200,"result":"finish checking token"})

# 		# ==================================
# 		# Part 3: Check if User Has Committed
# 		# ==================================
# 		# get git status
# 		git_status_out = subprocess.check_output("git status --porcelain", shell=True).decode("utf-8")
# 		git_status = git_status_out.splitlines()
# 		git_status = [e.strip() for e in git_status]

# 		# filter for unsaved python files
# 		unsaved = list(filter(lambda e: ( (e.split('.')[-1] in ['ipynb','py']) and (e[0] in ['M','?']) ), git_status))

# 		# if there are unsaved python files, user needs to commit
# 		if len(unsaved) != 0:
# 			self.finish({"status_code": 412, "result": "Error: Notebook(s) and/or script(s) have not been committed\n{}".format('\n'.join(unsaved))})
# 			return

# 		# self.finish({"status_code" : 200, "result": "Done checking commit"})
# 		# return

# 		# ==================================
# 		# Part 4: Extract Required Register Parameters
# 		# ==================================
# 		# sanitize algo_name input
# 		# 	not allowed: '/' ' ' '"'
# 		# 	remove filename extension
# 		file_name = algo_name.split('/')[-1]
# 		algo_name = algo_name.replace('/',':').replace(' ', '_').replace('"','')
# 		algo_name = ('.').join(algo_name.split('.')[:-1])
# 		# lang = tab['kernel']['name']
# 		# nb_name = tab['path'] 
# 		git_url = str(subprocess.check_output("git remote get-url origin", shell=True).decode('utf-8').strip())

# 		# convert python notebook to python script
# 		status = subprocess.call("ipython nbconvert --to python {}".format(file_name), shell=True)
# 		if status != 0:
# 			self.finish({"status_code": 500, "result": "Could not convert .ipynb to .py"})
# 			return

# 		# push converted python script to git
# 		status = subprocess.call("git add {}\ngit commit -m 'commit converted notebook'\ngit push".format(file_name.replace('ipynb','py')), shell=True)
# 		if status !=0:
# 			self.finish({"status_code": 500, "result": "Could not commit converted notebook to git"})	
# 			return		

# 		run_cmd = '{} {}'.format(lang,nb_name.replace('.ipynb','.py'))

# 		# looks like:
# 		# 	algo_name 		che-test:GetKernelData
# 		# 	run_cmd 		python3 che-test/GetKernelData.py
# 		# self.finish({"status_code" : 200, "result": "Done getting params\n{}\n{}".format(algo_name,run_cmd)})
# 		# return
		
# 		# ==================================
# 		# Part 5: Build Request
# 		# ==================================
# 		json_file = WORKDIR+"/submit_jobs/register_url.json"
# 		json_in_file = WORKDIR+"/submit_jobs/register_inputs.json"
# 		url = BASE_URL+'/mas/algorithm'
# 		headers = {'Content-Type':'application/json'}

# 		with open(json_in_file) as f:
# 			ins_json = f.read()

# 		# build inputs json		
# 		popped = params.pop('inputs')
# 		inputs = parseInputs(popped)

# 		ins = ''
# 		for name in inputs.keys():
# 			if len(name) > 0:
# 				ins += ins_json.format(field_name=name,dl=inputs[name])

# 		# print(ins)
# 		# add inputs json to params for template substitution

# 		with open(json_file) as jso:
# 			req_json = jso.read()

# 		# rebuild params dictionary with required parameters for registering
# 		# some may have been modified since initial UI processing
# 		params = {}
# 		params["repo_url"] = git_url
# 		params["run_cmd"] = run_cmd
# 		params["algo_name"] = algo_name
# 		params["algo_desc"] = 'auto-register {}'.format(algo_name)
# 		params['algo_inputs'] = ins

# 		req_json = req_json.format(**params)
# 		# print(req_json)
# 		# self.finish({"status_code" : 200, "result": json.dumps(req_json)})
# 		# return

# 		# ==================================
# 		# Part 6: Send Request & Check Response
# 		# ==================================
# 		try:
# 			r = requests.post(
# 				url=url,
# 				data=req_json,
# 				headers=headers
# 			)
# 			if r.status_code == 200:
# 				# print(r.text)
# 				try:
# 					# MAAP API response
# 					resp = json.loads(r.text)
# 					# show registered inputs
# 					result = printInputs(resp,inputs)
# 					self.finish({"status_code": resp['code'], "result": result})
# 				except:
# 					self.finish({"status_code": r.status_code, "result": r.text})
# 			else:
# 				print('failed')
# 				self.finish({"status_code": r.status_code, "result": r.reason})
# 		except:
# 			self.finish({"status_code": 400, "result": "Bad Request"})

class DeleteAlgorithmHandler(IPythonHandler):
	def get(self):
		# ==================================
		# Part 1: Parse Required Arguments
		# ==================================
		complete = True
		fields = getFields('deleteAlgorithm')

		params = {}
		for f in fields:
			try:
				arg = self.get_argument(f.lower(), '').strip()
				params[f] = arg
			except:
				complete = False

		if all(e == '' for e in list(params.values())):
			complete = False

		print(params)
		print(complete)

		# ==================================
		# Part 2: Build & Send Request
		# ==================================
		# return all algorithms if malformed request
		headers = {'Content-Type':'application/json'}
		if complete:
			url = BASE_URL+'/mas/algorithm/{algo_id}:{version}'.format(**params) 
			r = requests.delete(
				url,
				headers=headers
			)
		else:
			url = BASE_URL+'/mas/algorithm'
			r = requests.get(
				url,
				headers=headers
			)

		# print(url)
		# print(r.status_code)
		# print(r.text)

		# ==================================
		# Part 3: Check & Parse Response
		# ==================================

		if r.status_code == 200:
			try:
				if complete:
					# MAAP API response
					resp = json.loads(r.text)
					# show registered inputs
					result = resp['message']
				else:
					resp = json.loads(r.text)
					result = 'Algorithms:\n'
					for e in resp['algorithms']:
						result += '\t{}:{}\n'.format(e['type'],e['version'])

				if result.strip() == '':
					result = 'Bad Request\nThe provided parameters were\n\talgo_id:{}\n\tversion:{}\n'.format(params['algo_id'],params['version'])
					self.finish({"status_code": 400, "result": result})
					return

				# print(result)
				self.finish({"status_code": r.status_code, "result": result})
			except:
				self.finish({"status_code": r.status_code, "result": r.text})

		# malformed request will still give 500
		elif r.status_code == 500:
			if 'AttributeError' in r.text:
				result = 'Bad Request\nThe provided parameters were\n\talgo_id:{}\n\tversion:{}\n'.format(params['algo_id'],params['version'])
				self.finish({"status_code": 400, "result": result})
			else:
				self.finish({"status_code": r.status_code, "result": r.reason})
		else:
			self.finish({"status_code": 400, "result": "Bad Request"})

class GetCapabilitiesHandler(IPythonHandler):
	def get(self):
		# No Required Arguments
		# ==================================
		# Part 1: Build & Send Request
		# ==================================
		url = BASE_URL+'/dps/job'
		headers = {'Content-Type':'application/json'}

		r = requests.get(
			url,
			headers=headers
		)

		# ==================================
		# Part 2: Check & Parse Response
		# ==================================
		try:
			try:
				# parse out capability names & request info
				rt = ET.fromstring(r.text)
				result = ''

				meta = rt[0]
				info = [(n.tag[n.tag.index('}')+1:], n.text) for n in meta]
				for (tag,txt) in info:
					result += '{tag}: {txt}\n'.format(tag=tag,txt=txt)
				result += '\n'

				cap = rt[2]
				cap_info = [ \
					( e.attrib['name'], \
						e[0][0][0].tag[ e[0][0][0].tag.index('}')+1 : ], \
						list(e[0][0][0].attrib.values())[0] \
					) for e in cap ]

				# print request type and url in indented new line below capability name
				for (title, req_type, req_url) in cap_info:
					result += '{title}\n	{req_type}\n	{req_url}\n\n'.format(title=title,req_type=req_type,req_url=req_url)

				# print(result)
				self.finish({"status_code": r.status_code, "result": result})

			except:
				self.finish({"status_code": r.status_code, "result": r.text})
		except:
			print('failed')
			self.finish({"status_code": r.status_code, "result": r.reason})

class ExecuteHandler(IPythonHandler):
	def get(self):
		xml_file = WORKDIR+"/submit_jobs/execute.xml"
		input_xml = WORKDIR+"/submit_jobs/execute_inputs.xml"
		
		# ==================================
		# Part 1: Parse Required Arguments
		# ==================================
		fields = getFields('execute')
		input_names = self.get_argument("inputs", '').split(',')[:-1]
		# print(inputs)
		# print(fields)

		params = {}
		for f in fields:
			try:
				arg = self.get_argument(f.lower(), '').strip()
				params[f] = arg
			except:
				params[f] = ''

		inputs = {}
		for f in input_names:
			try:
				arg = self.get_argument(f.lower(), '').strip()
				inputs[f] = arg
			except:
				inputs[f] = ''

		params['timestamp'] = str(datetime.datetime.today())
		if 'username' in params.keys() and inputs['username'] =='':
			inputs['username'] = 'anonymous'
		# if inputs['localize_urls'] == '':
		# 	inputs['localize_urls'] = []
		# print(params)

		# ==================================
		# Part 2: Build & Send Request
		# ==================================
		req_xml = ''
		ins_xml = ''
		url = BASE_URL+'/dps/job'
		headers = {'Content-Type':'application/xml'}

		other = ''
		with open(input_xml) as xml:
			ins_xml = xml.read()

		# -------------------------------
		# Insert XML for algorithm inputs
		# -------------------------------
		for i in range(len(input_names)):
			name = input_names[i]
			other += ins_xml.format(name=name).format(value=inputs[name])
			other += '\n'

		# print(other)
		params['other_inputs'] = other

		with open(xml_file) as xml:
			req_xml = xml.read()

		req_xml = req_xml.format(**params)
		print(req_xml)

		# -------------------------------
		# Send Request
		# -------------------------------
		try:
			r = requests.post(
				url=url, 
				data=req_xml, 
				headers=headers
			)
			print(r.status_code)
			print(r.text)

			# ==================================
			# Part 3: Check & Parse Response
			# ==================================
			# malformed request will still give 200
			if r.status_code == 200:
				try:
					# parse out JobID from response
					rt = ET.fromstring(r.text)

					# if bad request, show provided parameters
					if 'Exception' in r.text:
						result = 'Exception: {}\n'.format(rt[0].attrib['exceptionCode'])
						result += 'Bad Request\nThe provided parameters were:\n'
						for f in fields:
							result += '\t{}: {}\n'.format(f,params[f])
						result += '\n'
						self.finish({"status_code": 400, "result": result})

					else:
						job_id = rt[0].text
						# print(job_id)

						result = 'JobID is {}'.format(job_id)
						# print("success!")
						self.finish({"status_code": r.status_code, "result": result})
				except:
					self.finish({"status_code": r.status_code, "result": r.text})
			else:
				self.finish({"status_code": r.status_code, "result": r.reason})
		except:
			self.finish({"status_code": 400, "result": "Bad Request"})

class GetStatusHandler(IPythonHandler):
	def get(self):
		# ==================================
		# Part 1: Parse Required Arguments
		# ==================================
		fields = getFields('getStatus')

		params = {}
		for f in fields:
			try:
				arg = self.get_argument(f.lower(), '').strip()
				params[f] = arg
			except:
				arg = ''

		# print(params)

		# ==================================
		# Part 2: Build & Send Request
		# ==================================
		url = BASE_URL+'/dps/job/{job_id}/status'.format(**params)
		headers = {'Content-Type':'application/xml'}
		# print(url)
		# print(req_xml)

		try:
			r = requests.get(
				url,
				headers=headers
			)

			# print(r.status_code)
			# print(r.text)

			# ==================================
			# Part 3: Check Response
			# ==================================
			# bad job id will still give 200
			if r.status_code == 200:
				try:
					# parse out JobID from response
					rt = ET.fromstring(r.text)

					job_id = rt[0].text
					status = rt[1].text
					# print(job_id)

					result = 'JobID is {}\nStatus: {}'.format(job_id,status)
					# print("success!")
					self.finish({"status_code": r.status_code, "result": result})
				except:
					self.finish({"status_code": r.status_code, "result": r.text})
			# if no job id provided
			elif r.status_code in [404]:
				# print('404?')
				# if bad job id, show provided parameters
				result = 'Exception: {}\nMessage: {}\n(Did you provide a valid JobID?)\n'.format(rt[0].attrib['exceptionCode'], rt[0][0].text)
				result += '\nThe provided parameters were:\n'
				for f in fields:
					result += '\t{}: {}\n'.format(f,params[f])
				result += '\n'
				self.finish({"status_code": 404, "result": result})
			else:
				self.finish({"status_code": r.status_code, "result": r.reason})
		except:
			self.finish({"status_code": 400, "result": "Bad Request"})

class GetResultHandler(IPythonHandler):
	def get(self):
		# ==================================
		# Part 1: Parse Required Arguments
		# ==================================
		fields = getFields('getResult')

		params = {}
		for f in fields:
			try:
				arg = self.get_argument(f.lower(), '').strip()
				params[f] = arg
			except:
				arg = ''

		# print(params)

		# ==================================
		# Part 2: Build & Send Request
		# ==================================
		url = BASE_URL+'/dps/job/{job_id}'.format(**params)
		headers = {'Content-Type':'application/xml'}
		# print(url)
		# print(req_xml)

		try:
			r = requests.get(
				url,
				headers=headers
			)
			# print(r.status_code)
			# print(r.text)

			# ==================================
			# Part 3: Check & Parse Response
			# ==================================
			if r.status_code == 200:
				try:
					# parse out JobID from response
					rt = ET.fromstring(r.text)

					# if bad job id, show provided parameters
					if 'Exception' in r.text:
						result = 'Exception: {}\nMessage: {}\n'.format(rt[0].attrib['exceptionCode'], rt[0][0].text)
						result += '\nThe provided parameters were:\n'
						for f in fields:
							result += '\t{}: {}\n'.format(f,params[f])
						result += '\n'

						self.finish({"status_code": 404, "result": result})
					else:
						job_id = rt[0].text
						# print(job_id)

						prods = rt[1][0]
						p = getProds(prods)

						result = 'JobID is {}\n'.format(job_id)

						for product in p[1]:
							for attrib in product[1]:
								if attrib[0] == 'Locations' and type(attrib[1] == type([])):
									lst = attrib[1]
									lnk = lst[-1]
									lst[-1] = "<a href=\"{}\">{}</a>".format(lnk,lnk)
									prop = ('\n	').join(lst)
									result += '{}: {}\n'.format(attrib[0],prop)
								else:
									result += '{}: {}\n'.format(attrib[0],attrib[1])
							result += '\n'

						print(result)
						# result = result.replace(',',',<br>	')
						result = result.replace('\n','<br>')
						print(result)

						# print("success!")
						self.finish({"status_code": r.status_code, "result": result})
				except:
					self.finish({"status_code": r.status_code, "result": r.text})
			# if no job id provided
			elif r.status_code in [404]:
				# print('404?')
				# if bad job id, show provided parameters
				result = 'Exception: {}\nMessage: {}\n(Did you provide a valid JobID?)\n'.format(rt[0].attrib['exceptionCode'], rt[0][0].text)
				result += '\nThe provided parameters were:\n'
				for f in fields:
					result += '\t{}: {}\n'.format(f,params[f])
				result += '\n'
				self.finish({"status_code": 404, "result": result})

			else:
				self.finish({"status_code": r.status_code, "result": r.reason})
		except:
			self.finish({"status_code": 400, "result": "Bad Request"})

class DismissHandler(IPythonHandler):
	def post(self):
		fields = getFields('dismiss')
		params = {}

		for f in fields:
			try:
				arg = self.get_argument(f.lower(), '')
				params[f] = arg
			except:
				pass

		url = params.pop('url',None)
		url = 'http://geoprocessing.demo.52north.org:8080/wps/WebProcessingService'
		params['service'] = 'WPS'
		params['version'] = '2.0.0'
		params['request'] = 'Dismiss'
		r.requests.get(
			url,
			params=params
		)
		try:
			self.finish({"status_code": r.status_code, "result": r.text})
		except:
			print('failed')
			self.finish({"status_code": r.status_code, "result": r.reason})

class DescribeProcessHandler(IPythonHandler):
	def get(self):
		# ==================================
		# Part 1: Parse Required Arguments
		# ==================================
		complete = True
		fields = getFields('describeProcess')

		params = {}
		for f in fields:
			try:
				arg = self.get_argument(f.lower(), '').strip()
				params[f] = arg
			except:
				complete = False

		if all(e == '' for e in list(params.values())):
			complete = False

		print(params)
		print(complete)

		# ==================================
		# Part 2: Build & Send Request
		# ==================================
		# return all algorithms if malformed request
		if complete:
			url = BASE_URL+'/mas/algorithm/{algo_id}:{version}'.format(**params) 
		else:
			url = BASE_URL+'/mas/algorithm'

		headers = {'Content-Type':'application/json'}
		# print(url)

		r = requests.get(
			url,
			headers=headers
		)
		# print(r.status_code)
		# print(r.text)

		# ==================================
		# Part 3: Check & Parse Response
		# ==================================

		if r.status_code == 200:
			try:
				# if 'AttributeError' in r.text:
				# 	# print('attribute error')
				# 	result = 'Bad Request\nThe provided parameters were\n\talgo_id:{}\n\tversion:{}\n'.format(params['algo_id'],params['version'])
				# 	self.finish({"status_code": 400, "result": result})
				# elif complete:
				if complete:
					# parse out capability names & request info
					rt = ET.fromstring(r.text)
					attrib = [getParams(e) for e in rt[0][0]]

					result = ''
					for (tag,txt) in attrib:
						if tag == 'Input':
							result += '{}\n'.format(tag)
							for (tag1,txt1) in txt:
								result += '\t{tag1}:\t{txt1}\n'.format(tag1=tag1,txt1=txt1)
							result += '\n'
						else:
							result += '{tag}:\t{txt}\n'.format(tag=tag,txt=txt)
				else:
					resp = json.loads(r.text)
					result = 'Algorithms:\n'
					for e in resp['algorithms']:
						result += '\t{}:{}\n'.format(e['type'],e['version'])

				if result.strip() == '':
					result = 'Bad Request\nThe provided parameters were\n\talgo_id:{}\n\tversion:{}\n'.format(params['algo_id'],params['version'])
					self.finish({"status_code": 400, "result": result})
					return

				# print(result)
				self.finish({"status_code": r.status_code, "result": result})
			except:
				self.finish({"status_code": r.status_code, "result": r.text})

		# malformed request will still give 500
		elif r.status_code == 500:
			if 'AttributeError' in r.text:
				result = 'Bad Request\nThe provided parameters were\n\talgo_id:{}\n\tversion:{}\n'.format(params['algo_id'],params['version'])
				self.finish({"status_code": 400, "result": result})
			else:
				self.finish({"status_code": r.status_code, "result": r.reason})
		else:
			self.finish({"status_code": 400, "result": "Bad Request"})

class ExecuteInputsHandler(IPythonHandler):
	def get(self):
		# ==================================
		# Part 1: Parse Required Arguments
		# ==================================
		complete = True
		fields = getFields('executeInputs')

		params = {}
		for f in fields:
			try:
				arg = self.get_argument(f.lower(), '').strip()
				params[f] = arg
			except:
				params[f] = ''
				complete = False

		if all(e == '' for e in list(params.values())):
			complete = False

		print(params)
		params2 = copy.deepcopy(params)
		# params2.pop('identifier')
		# print(params)

		# ==================================
		# Part 2: Build & Send Request
		# ==================================
		# return all algorithms if malformed request
		if complete:
			url = BASE_URL+'/mas/algorithm/{algo_id}:{version}'.format(**params2) 
		else:
			url = BASE_URL+'/mas/algorithm'

		headers = {'Content-Type':'application/json'}
		# print(url)

		r = requests.get(
			url,
			headers=headers
		)
		# print(r.status_code)
		# print(r.text)

		# ==================================
		# Part 3: Check & Parse Response
		# ==================================

		if r.status_code == 200:
			try:
				# print('200')
				if complete:
					# print('complete')
					# parse out capability names & request info
					rt = ET.fromstring(r.text)
					attrib = [getParams(e) for e in rt[0][0]] 						# parse XML
					inputs = [e[1] for e in attrib[2:-1]]
					ins_req = [[e[1][1],e[2][1]] for e in inputs] 					# extract identifier & type for each input
					ins_req = list(filter(lambda e: e[0] != 'timestamp', ins_req)) 	# filter out automatic timestamp req input

					result = ''
					for (identifier,typ) in ins_req:
						result += '{identifier}:\t{typ}\n'.format(identifier=identifier,typ=typ)
					# print(result)

					if result.strip() == '':
						result = 'Bad Request\nThe provided parameters were\n\talgo_id:{}\n\tversion:{}\n'.format(params['algo_id'],params['version'])
						self.finish({"status_code": 400, "result": result})
						return

					self.finish({"status_code": r.status_code, "result": result, "ins": ins_req, "old":params})
					return

				else:
					# print('failed 200')
					result = 'Bad Request\nThe provided parameters were\n\talgo_id:{}\n\tversion:{}\n'.format(params['algo_id'],params['version'])
					self.finish({"status_code": 400, "result": result, "ins": [], "old":params})
					return

			except:
				self.finish({"status_code": 500, "result": r.text, "ins": [], "old":params})

		# malformed request will still give 500
		elif r.status_code == 500:
			if 'AttributeError' in r.text:
				result = 'Bad Request\nThe provided parameters were\n\talgo_id:{}\n\tversion:{}\n'.format(params['algo_id'],params['version'])
				self.finish({"status_code": 400, "result": result, "ins": [], "old":params})
			else:
				self.finish({"status_code": 500, "result": r.reason, "ins": [], "old":params})
		else:
			self.finish({"status_code": 400, "result": "Bad Request", "ins": [], "old":params})

class DefaultValuesHandler(IPythonHandler):
	# inputs: code_path
	# outputs: repo_url, algo_name, run_cmd, dockerfile_path, environment_name, branch
	def get(self):
		# ==================================
		# Part 1: Get Notebook Information Processed in UI
		# ==================================
		fields = ['code_path']

		params = {}
		for f in fields:
			try:
				arg = self.get_argument(f.lower(), '').strip()
				params[f] = arg
			except:
				params[f] = ''
		proj_path = '/projects/'+params['code_path']

		# ==================================
		# Part 2: GitLab Token
		# ==================================
		# set key and path
		ENV_TOKEN_KEY = 'gitlab_token'
		proj_path = '/'.join(proj_path.split('/')[:-1])
		# if proj_path != '/':
		os.chdir(proj_path)

		# check if GitLab token has been set
		git_url = subprocess.check_output("git remote get-url origin", shell=True).decode('utf-8').strip()
		print(git_url)
		token = git_url.split("repo.nasa")[0][:-1]
		ind = token.find("gitlab-ci-token:")
		notoken = True

		# if repo url has token, no problems
		if ind != -1:
			token = token[ind+len("gitlab-ci-token:"):]
			if len(token) != 0:
				print("token has been set")
				notoken = False
		
		# token needs to be set
		if notoken:
			# if saved in environment, set for user
			if ENV_TOKEN_KEY in os.environ:
				token = os.environ[ENV_TOKEN_KEY]
				print(token)
				url = git_url.split("//")
				new_url = "{pre}//gitlab-ci-token:{tkn}@{rep}".format(pre=url[0],tkn=token,rep=url[1])
				status = subprocess.call("git remote set-url origin {}".format(new_url), shell=True)

				if status != 0:
					self.finish({"status_code": 412, "result": "Error {} setting GitLab Token".format(status)})
					return
			else:
				self.finish({"status_code": 412, "result": "Error: GitLab Token not set in environment\n{}".format(git_url)})
				return

		# self.finish({"status_code":200,"result":"finish checking token"})

		# ==================================
		# Part 3: Check if User Has Committed
		# ==================================
		# get git status
		git_status_out = subprocess.check_output("git status --porcelain", shell=True).decode("utf-8")
		git_status = git_status_out.splitlines()
		git_status = [e.strip() for e in git_status]

		# filter for unsaved python files
		unsaved = list(filter(lambda e: ( (e.split('.')[-1] in ['ipynb','py']) and (e[0] in ['M','?']) ), git_status))

		# if there are unsaved python files, user needs to commit
		if len(unsaved) != 0:
			self.finish({"status_code": 412, "result": "Error: Notebook(s) and/or script(s) have not been committed\n{}".format('\n'.join(unsaved))})
			return

		# self.finish({"status_code" : 200, "result": "Done checking commit"})
		# return

		# ==================================
		# Part 4: Extract Required Register Parameters
		# ==================================
		vals = {}
		code_path = params['code_path']
		file_name = code_path.split('/')[-1]
		algo_name = file_name.replace('/',':').replace(' ', '_').replace('"','').replace("'",'')
		vals['algo_name'] = ('.').join(algo_name.split('.')[:-1])

		if code_path.split('.')[-1] in ['.py','ipynb']:
			vals['run_cmd'] = 'python '+code_path
		else:
			vals['run_cmd'] = code_path

		vals['repo_url'] = git_url
		vals['branch'] = subprocess.check_output("git branch | grep \\* | cut -d ' ' -f2", shell=True).decode('utf-8').strip()
		vals['env_name'] = "ubuntu"
		vals['dockerfile_path'] = os.environ['DOCKERFILE_PATH']

		# outputs: repo_url, algo_name, run_cmd, dockerfile_path, environment_name, branch
		self.finish({"status_code": 200, "default_values":vals})
