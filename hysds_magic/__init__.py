from .hysds import HysdsMagic

# def load_ipython_extension(ipython):
#     ipython.register_magic_function(execute, 'line')

def load_ipython_extension(ipython):
	m = HysdsMagic()
    ipython.register_magics(m)