##############################################################################
# Imports
##############################################################################

import _ast
import ast

##############################################################################
# Globals
##############################################################################

allow_modules = ['__future__', 'simtk.openmm.app', 'simtk.openmm',
    'simtk.unit', 'sys']
allow_func_call = ['print', 'PDBFile', 'ForceField', 'AmberPrmtopFile',
    'AmberInpcrdFile', 'LangevinIntegrator', 'VerletIntegrator',
    'BrownianIntegrator', 'VariableLangevinIntegrator',
    'VariableVerletIntegrator', 'Simulation', 'DCDReporter',
    'StateDataReporter', 'AndersenThermostat', 'MonteCarloBarostat']
allow_attributes = ['createSystem', 'topology', 'getPlatformByName',
    'setPositions', 'context', 'positions', 'minimizeEnergy', 'append',
    'reporters', 'step', 'addForce', 'setConstraintTolerance',
    'setVelocitiesToTemperature']
disallowed_nodes = [_ast.BoolOp, _ast.UnaryOp, _ast.Lambda, 
                    _ast.IfExp, _ast.Set, _ast.ListComp, _ast.SetComp,
                    _ast.DictComp, _ast.GeneratorExp, _ast.Compare,
                    _ast.Subscript, _ast.Tuple]

__all__ = ['validate_openmm', 'ValidationError']

##############################################################################
# Functions
##############################################################################

def validate_openmm(script_code):
    try:
        __validator.visit(ast.parse(script_code))
    except ValidationError as e:
        return False, 'Sorry, there has been an error'
    except:
        print 'error1'
        return False, 'Sorry, there has been an error'

    return True, None


class ValidationError(Exception):
    pass


class Validator(ast.NodeVisitor):
    def generic_visit(self, node):
        if isinstance(node, _ast.ImportFrom):
            if not node.module in allow_modules:
                raise ValidationError('import %s not allowed' % node.module)
        elif isinstance(node, _ast.Call):
            if isinstance(node.func, _ast.Name):
                id = node.func.id
                if not id in allow_func_call:
                    raise ValidationError('call %s not allowed' % id)

        elif isinstance(node, _ast.Attribute):
            id = node.attr
            if not id in  allow_attributes:
                raise ValidationError('attribute %s not allowed' % id)

        elif any(isinstance(node, e) for e in disallowed_nodes):
            print node
            raise ValidationError('Sorry, there has been an error')

        ast.NodeVisitor.generic_visit(self, node)

# used in the validate_openmm function
__validator = Validator()