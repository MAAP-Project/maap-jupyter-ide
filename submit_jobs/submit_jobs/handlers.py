from notebook.base.handlers import IPythonHandler
import requests
import xml.etree.ElementTree as ET
import json
import datetime
import os

from .fields import getFields
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

class RegisterAlgorithmHandler(IPythonHandler):
	def get(self):
		json_file = "./submit_jobs/register.json"
		fields = getFields('register')

		params = {}
		# params['url_list'] = []
		# params['timestamp'] = str(datetime.datetime.today())
		for f in fields:
			try:
				arg = self.get_argument(f.lower(), '')
				params[f] = arg
			except:
				pass
		params['run_cmd'] = 'python /app/plant.py'
		params['algo_name'] = 'plant_test'
		params['algo_desc'] = 'test plant'
		# print(params)

		url = BASE_URL+'/mas/algorithm'
		headers = {'Content-Type':'application/json'}

		with open(json_file) as jso:
			req_json = jso.read()

		req_json = req_json.format(**params)

		# print(req_json)

		r = requests.post(
			url=url,
			data=req_json,
			headers=headers
		)
		try:
			# print(r.text)
			try:
				resp = json.loads(r.text)
				self.finish({"status_code": resp['code'], "result": resp['message']})
			except:
				self.finish({"status_code": 200, "result": r.text})
		except:
			print('failed')
			self.finish({"status_code": r.status_code, "result": r.reason})

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

				print(result)
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
				arg = self.get_argument(f.lower(), '')
				params[f] = arg
			except:
				pass
		# params['algo_id'] = 'org.n52.wps.server.algorithm.SimpleBufferAlgorithm'
		# params['version'] = 'master'
		# params['data_value'] = 5.0
		params['timestamp'] = str(datetime.datetime.today())

		# http://geoprocessing.demo.52north.org:8080/wps/WebProcessingService?service=WPS&version=2.0.0&request=GetCapabilities
		url = 'http://geoprocessing.demo.52north.org:8080/wps/WebProcessingService'
		headers = {'Content-Type':'text/xml'}
		# print(params)
		with open(xml_file) as xml:
			req_xml = xml.read()

		req_xml = req_xml.format(**params)
		# print(req_xml)
		r = requests.post(
			url=url, 
			data=req_xml, 
			headers=headers
		)
		try:
			# rt = ET.fromstring(r.text)
			# job_id = rt[0].text
			# # print(job_id)
			# data = dig(rt[1])
			# # print(data)
			# result = job_id+'\n '+str(data)
			# print(result)
			print("success!")
			# self.finish({"status_code": r.status_code, "result": result})
			self.finish({"status_code": r.status_code, "result": r.text})
		except:
			print("failed")
			self.finish({"status_code": r.status_code, "result": r.reason})

class GetStatusHandler(IPythonHandler):
	def get(self):
		xml_file = "./submit_jobs/getStatus.xml"
		fields = getFields('getStatus')

		params = {}
		for f in fields:
			try:
				arg = self.get_argument(f.lower(), '')
				params[f] = arg
			except:
				pass

		url = 'http://geoprocessing.demo.52north.org:8080/wps/WebProcessingService'
		# params['job_id'] = 'random_job_id'
		headers = {'Content-Type':'text/xml',}
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
		xml_file = "./submit_jobs/describe.xml"
		fields = getFields('describeProcess')

		params = {}
		for f in fields:
			try:
				arg = self.get_argument(f.lower(), '')
				params[f] = arg
			except:
				pass

		url = 'http://geoprocessing.demo.52north.org:8080/wps/WebProcessingService'
		# params['algo_id'] = 'org.n52.wps.server.algorithm.SimpleBufferAlgorithm'
		# params['version'] = 'master'
		headers = {'Content-Type':'text/xml',}
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
		# print(r)

		try:
			# resp = json.loads(r.text)
			self.finish({"status_code": r.status_code, "result": r.text})
		except:
			self.finish({"status_code": r.status_code, "result": r.reason})
