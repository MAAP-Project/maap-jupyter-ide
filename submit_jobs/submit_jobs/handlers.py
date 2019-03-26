from notebook.base.handlers import IPythonHandler
import requests
import xml.etree.ElementTree as ET
import json
import os

from .fields import getFields

def dig(node):
	# print("dig!")
	if len(node) > 1:
		return {node.tag[node.tag.index('}')+1:]:[dig(e) for e in node]}
	elif len(node) == 1:
		return {node.tag[node.tag.index('}')+1:]:dig(node[0])}
	else:
		return {node.tag[node.tag.index('}')+1:]:node.text.split(' ')}

class RegisterAlgorithmHandler(IPythonHandler):
	def get(self):
		self.finish({"status_code": 200, "result": 'hi'})

class GetCapabilitiesHandler(IPythonHandler):
	def get(self):
		# submit job
		# fields = ['service', 'version','url']
		# template_file = "./submit_jobs/capabilities_template.html"
		# template_data_file = "./submit_jobs/capabilities_template_data.html"
		fields = getFields('getCapabilities')
		params = {}
		
		for f in fields:
			try:
				arg = self.get_argument(f.lower(), '')
				params[f] = arg
			except:
				pass

		url = 'http://geoprocessing.demo.52north.org:8080/wps/WebProcessingService'
		params['service'] = 'WPS'
		params['version'] = '2.0.0'
		params['request'] = 'GetCapabilities'

		# http://geoprocessing.demo.52north.org:8080/wps/WebProcessingService?service=WPS&version=2.0.0&request=GetCapabilities
		# url = params.pop('url',None)
		r = requests.get(
			url,
			params=params
		)

		try:
			try:
				rt = ET.fromstring(r.text)
				algo_lst = rt[4]
				algo_info = [(n[0].text, n[1].text) for n in algo_lst]
				result = ''

				# Table Output
				# body = ''
				# data_templ = ''

				# with open(template_data_file) as tdf:
				# 	data_templ = tdf.read()

				# for (title,algo_id) in algo_info:
				# 	body += data_templ.format(algo_id=algo_id,title=title)

				# with open(template_file) as tf:
				# 	result = tf.read().format(data=body)

				# replace \t with &emsp;
				for (title, algo_id) in algo_info:
					result += '{title}\n	{algo_id}\n\n'.format(title=title,algo_id=algo_id)

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
		# params['data_value'] = 5.0

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
		# params['job_id'] = 'random_job'
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