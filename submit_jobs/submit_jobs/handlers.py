from notebook.base.handlers import IPythonHandler
import requests
import xml.etree.ElementTree as ET
import json
import datetime
import os

from .fields import getFields
# USE https when pointing to actual MAAP API server
BASE_URL = "http://localhost:5000/api"

def dig(node):
	# print("dig!")
	if len(node) > 1:
		return {node.tag[node.tag.index('}')+1:]:[dig(e) for e in node]}
	elif len(node) == 1:
		return {node.tag[node.tag.index('}')+1:]:dig(node[0])}
	else:
		# return {node.tag[node.tag.index('}')+1:]:node.text.split(' ')}
		return {node.tag[node.tag.index('}')+1:]:node.text}

def getParams(node):
	tag = node.tag[node.tag.index('}')+1:]
	if tag in ['Title','Identifier']:
		# print('title')
		return (tag,node.text)
	elif tag == 'LiteralData':
		# print('literaldata')
		return (node[1][1].tag.split('}')[-1],list(node[1][1].attrib.values())[0].split(':')[-1])
	else:
		# print('other')
		return (tag,[getParams(e) for e in node])

class RegisterAlgorithmHandler(IPythonHandler):
	def get(self):
		json_file = "./submit_jobs/register.json"
		fields = getFields('register')

		params = {}
		# params['url_list'] = []
		# params['timestamp'] = str(datetime.datetime.today())
		for f in fields:
			try:
				arg = self.get_argument(f.lower(), '').strip()
				params[f] = arg
			except:
				params[f] = ''
		# params['run_cmd'] = 'python /app/plant.py'
		# params['algo_name'] = 'plant_test'
		# params['algo_desc'] = 'test plant'
		# print(params)

		url = BASE_URL+'/mas/algorithm'
		headers = {'Content-Type':'application/json'}

		with open(json_file) as jso:
			req_json = jso.read()

		req_json = req_json.format(**params)
		# print(req_json)

		try:
			r = requests.post(
				url=url,
				data=req_json,
				headers=headers
			)
			if r.status_code == 200:
				# print(r.text)
				try:
					# empty
					resp = json.loads(r.text)
					self.finish({"status_code": resp['code'], "result": resp['message']})
				except:
					self.finish({"status_code": r.status_code, "result": r.text})
			else:
				print('failed')
				self.finish({"status_code": r.status_code, "result": r.reason})
		except:
			self.finish({"status_code": 400, "result": "Bad Request"})

class GetCapabilitiesHandler(IPythonHandler):
	def get(self):
		fields = getFields('getCapabilities')

		url = BASE_URL+'/dps/job'
		headers = {'Content-Type':'application/json'}

		r = requests.get(
			url,
			headers=headers
		)

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
		# submit job
		xml_file = "./submit_jobs/execute.xml"
		fields = getFields('execute')

		params = {}
		for f in fields:
			try:
				arg = self.get_argument(f.lower(), '').strip()
				params[f] = arg
			except:
				params[f] = ''

		# params['identifier'] = 'org.n52.wps.server.algorithm.SimpleBufferAlgorithm'
		# params['algo_id'] = 'plant_test'
		# params['version'] = 'master'
		# params['url_list'] = []
		params['timestamp'] = str(datetime.datetime.today())
		if params['url_list'] == '':
			params['url_list'] = []
		# print(params)

		url = BASE_URL+'/dps/job'
		headers = {'Content-Type':'application/xml'}
		with open(xml_file) as xml:
			req_xml = xml.read()

		req_xml = req_xml.format(**params)
		# print(url)
		# print(req_xml)

		try:
			r = requests.post(
				url=url, 
				data=req_xml, 
				headers=headers
			)
			# print(r.status_code)
			# print(r.text)

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
		# xml_file = "./submit_jobs/getStatus.xml"
		fields = getFields('getStatus')

		params = {}
		for f in fields:
			try:
				arg = self.get_argument(f.lower(), '').strip()
				params[f] = arg
			except:
				arg = ''

		# params['job_id'] = 'random_job_id'
		# print(params)
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

			# bad job id will still give 200
			if r.status_code == 200:
				try:
					# parse out JobID from response
					rt = ET.fromstring(r.text)

					# if bad job id, show provided parameters
					if 'Exception' in r.text:
						result = 'Exception: {}\n'.format(rt[0].attrib['exceptionCode'])
						result += 'Bad Request\nThe provided parameters were:\n'
						for f in fields:
							result += '\t{}: {}\n'.format(f,params[f])
						result += '\n'
						self.finish({"status_code": 404, "result": result})

					else:
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
				result = 'Bad Request\nDid you submit a valid JobID?\nJobID: {}'.format(params['job_id'])
				self.finish({"status_code": r.status_code, "result": result})
			else:
				self.finish({"status_code": r.status_code, "result": r.reason})
		except:
			self.finish({"status_code": 400, "result": "Bad Request"})

class GetResultHandler(IPythonHandler):
	def get(self):
		xml_file = "./submit_jobs/getResult.xml"
		fields = getFields('getResult')

		params = {}
		for f in fields:
			try:
				arg = self.get_argument(f.lower(), '')
				params[f] = arg
			except:
				pass

		url = 'http://geoprocessing.demo.52north.org:8080/wps/WebProcessingService'
		headers = {'Content-Type':'text/xml'}
		# print(params)
		with open(xml_file) as xml:
			req_xml = xml.read()

		req_xml = req_xml.format(**params)
		# print(req_xml)
		r = requests.post(
			url,
			data=req_xml,
			headers=headers
		)
		try:
			# resp = json.loads(r.text)
			self.finish({"status_code": r.status_code, "result": r.text})
		except:
			self.finish({"status_code": r.status_code, "result": r.reason})

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
		complete = True
		# xml_file = "./submit_jobs/describe.xml"
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

		# params['algo_id'] = 'plant_test'
		# params['version'] = 'master'
		# print(params)

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
		# print(r)
		# print(r.text)
		# print(r.status_code)

		if r.status_code == 200:
			try:
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
