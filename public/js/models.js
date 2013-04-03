$(function() {
/*
    * Expected behavior of the Backone.Model subclasses
    * -------------------------------------------------
    *
    * javascript doesn't support the kind of class-based OO that I'm familiar
    * with, so we can't just extend Backbone.Model to make a base class, and
    * then extend that further.
    *
    * So I'll just write the API for our models here, as a comment:
    *
    * el : string
    *     a jquery selector for the DOM element where this model should be
    *     rendered, as a form.
    * name : string
    *     a string giving the name of the class. this is used by the "view" to
    *     create the script, in views.js
    * schema : dict
    *     schema for the model, i.e. what fields it has, what type they, are, etc
    *     this information is directly interpreted by Backbone.Forms, and its
    *     format is described here: https://github.com/powmedia/backbone-forms.
    *     the keys in this schema should be called the model's "attributes".
    *     They're not the only methods defined on the model class, but they _ARE_
    *     the things that get directly displayed to the user in the forms.
    * visibility : dict
    *     a dict of functions -- the keys in this dict should be the model's
    *     attributes. the functions take a single argument, which is a dict of
    *     the model's current attributes (mapping to their current values)
    *     and returns a bool, specifying whether this attribute should be
    *     shown or hidden to the user inside of the form.
    * defaults : dict
    *     a dict giving the default value for each of the attributes in the schema
    */

Collection = Backbone.Collection.extend({
  model: Backbone.Model
});

// https://github.com/powmedia/backbone-forms
General = Backbone.Model.extend({
  el: '#sidepane-general',
  name: 'general',
  schema: {
    coords_fn:   {type: 'Text', title: 'Input coordinates',
                  validators: ['required', /\.pdb$|\.inpcrd$/]},
    topology_fn: {type: 'Text', title: 'Input topology',
                  validators: ['prmtop', 'required']},
    protein:   {type: 'Select', title: 'Protein forcefield',
                options: ['amber03.xml', 'amber03_gbvi.xml',
                          'amber03_obc.xml', 'amber10.xml',
                          'amber10_gbvi.xml', 'amber10_obc.xml',
                          'amber96.xml', 'amber96_gbvi.xml',
                          'amber96_obc.xml', 'amber99_gbvi.xml',
                          'amber99_obc.xml', 'amber99sb.xml',
                          'amber99sbildn.xml', 'amber99sbnmr.xml']},
    water:     {type: 'Select', options: ['spce.xml', 'tip3p.xml',
                                          'tip4pew.xml', 'tip5p.xml'],
                title: 'Water forcefield'},
    platform:  {type: 'Select', options: ['Reference', 'OpenCL', 'CUDA'],
                title: 'Platform'},
    precision: {type: 'Select', options: ['single', 'mixed', 'double'],
                     title: 'Precision'},
    device: {type: 'Text', title: 'Device index',
             validators: [/^\d+(,\d+)*$/]},
    opencl_plat_index: {type: 'Text', title: 'OpenCL platform indx',
                        validators: ['pos_integer']},
  },

  visibility: {
    protein: function(attrs) {
      return !(attrs.coords_fn.match(/\.inpcrd$/) && attrs.topology_fn.match(/\.prmtop$/))
    },
    water: function(attrs) {
      if (attrs.coords_fn.match(/\.inpcrd$/) && attrs.topology_fn.match(/\.prmtop$/)) {
          return false;
      }
      if (!attrs.protein.match(/_obc|_gbvi/)) {
        return true;
      }
      return false;
    },
    precision: function(attrs) {
      return _.contains(['CUDA', 'OpenCL'], attrs.platform);
    },
    device: function(attrs) {
      return _.contains(['CUDA', 'OpenCL'], attrs.platform);
    },
    topology_fn: function(attrs) {
      return attrs.coords_fn.match(/\.inpcrd$/)
    },
    opencl_plat_index: function(attrs) {
      return attrs.platform == 'OpenCL';
    }
  },

  defaults: {
    coords_fn: 'input.pdb',
    topology_fn: 'input.prmtop',
    protein: 'amber99sb.xml',
    water: 'tip3p.xml',
    platform: 'CUDA',
    precision: 'mixed',
    device: 0,
    opencl_plat_index: '',
  },
});

System = Backbone.Model.extend({
  el: '#sidepane-system',
  name: 'system',
  schema: {
    nb_method: {type: 'Select', options: ['NoCutoff', 'CutoffNonPeriodic',
                                          'CutoffPeriodic', 'Ewald', 'PME'],
                title: 'Nonbonded method'},
    ewald_error_tolerance: {type: 'Text', title: 'Ewald error tolerance',
                            validators: ['pos_float', 'required']},
    constraints: {type: 'Select', title: 'Constraints',
                  options: ['None', 'HBonds', 'HAngles', 'AllBonds']},
    constraint_error_tol: {type: 'Text', title: 'Constraint error tol.', 
                           validators: ['required', 'pos_float']},
    rigid_water: {type: 'Select', options: ['True', 'False'],
                  title: 'Rigid water?'},
    nb_cutoff:   {type: 'Text', title: 'Nonbonded cutoff',
                  validators: ['distance']},
    random_initial_velocities: {type: 'Select', title: 'Random init vels.',
                                options: ['True', 'False']},
    gentemp:     {type: 'Text', title: 'Generation temp.',
                  validators: ['temperature']}
  },

  visibility: {
    nb_cutoff: function(attrs) {
      return attrs.nb_method != 'NoCutoff';
    },
    gentemp: function(attrs) {
      return attrs.random_initial_velocities == 'True';
    },
    ewald_error_tolerance : function(attrs) {
      return _.contains(['PME', 'Ewald'], attrs.nb_method);
    },
    constraint_error_tol: function(attrs) {
      return attrs.constraints != 'None';
    },
  },

  defaults: {
    nb_method: 'PME',
    constraints: 'HBonds',
    rigid_water: 'True',
    nb_cutoff: '1.0 nm',
    rnd_init: 'True',
    gentemp: '300 K',
    ewald_error_tolerance: 0.0005,
    constraint_error_tol: 0.0001,
  },
});

Integrator = Backbone.Model.extend({
  el: '#sidepane-integrator',
  name: 'integrator',
  schema: {
    kind: {type: 'Select', title: 'Integrator',
           options: ['Langevin', 'VariableLangevin', 'Brownian', 'Verlet', 'VariableVerlet']},
    timestep: {type: 'Text', validators: ['time'], title: 'Timestep'},
    tolerance: {type: 'Text', title: 'Error tolerance',
                validators: ['pos_float', 'required']},
    friction: {type: 'Text', validators: ['friction'], title: 'collision rate'},
    temperature: {type: 'Text', validators: ['temperature']},
    barostat: {type: 'Select', options: ['None', 'Monte Carlo']},
    pressure: {type: 'Text', validators: ['pressure']},
    barostat_step: {type: 'Text', title: 'Barostat interval',
                    validators: ['pos_integer']},
    thermostat: {type: 'Select', options: ['None', 'Andersen']},
  },

  defaults: {
    kind: 'Langevin',
    timestep: '2.0 fs',
    tolerance: '0.0001',
    friction: '91.0/ps',
    temperature: '300 K',
    barostat: 'None',
    barostat_step: '25',
    pressure: '1 atm',
  },

  visibility: {
    timestep: function(attrs) {
      return !_.contains(['VariableVerlet', 'VariableLangevin'], attrs.kind);
    },
    tolerance: function(attrs) {
      return _.contains(['VariableVerlet', 'VariableLangevin'], attrs.kind);
    },
    friction: function(attrs) {
      return _.contains(['Brownian', 'Langevin', 'VariableLangevin'], attrs.kind) || attrs.thermostat == 'Andersen';
    },
    temperature: function(attrs) {
      return _.contains(['Brownian', 'Langevin', 'VariableLangevin'], attrs.kind) || attrs.thermostat == 'Andersen';
    },
    barostat_step: function(attrs) {
      return attrs.barostat == 'Monte Carlo';
    },
    pressure: function(attrs) {
      return attrs.barostat == 'Monte Carlo';
    },
    thermostat: function(attrs) {
      return  _.contains(['Verlet', 'VariableVerlet'], attrs.kind);
    },
    barostat: function(attrs) {
      return _.contains(['Langevin', 'VariableLangevin', 'Brownian'], attrs.kind) ||
                attrs.thermostat == 'Andersen';
    },
  },
});


Simulation = Backbone.Model.extend({
  el: '#sidepane-simulation',
  name: 'simulation',
  schema: {
    equil_steps: {type: 'Text', title: 'Equilibration steps', validators: ['pos_integer']},
    prod_steps: {type: 'Text', title: 'Production steps', validators: ['pos_integer', 'required']},
    minimize: {type: 'Select', options: ['True', 'False'], title: 'Minimize?'},
    minimize_iters: {type: 'Text', title: 'Max minimize steps', validators: ['pos_integer']},
    dcd_reporter: {type: 'Select', options: ['True', 'False'], title: 'DCD reporter?'},
    dcd_freq: {type: 'Text', title: 'DCD freq [steps]', validators: ['pos_integer', 'required']},
    dcd_file: {type: 'Text', title: 'DCD filename'},
    statedata_reporter: {type: 'Select', options: ['True', 'False'], title: 'StateData reporter?'},
    statedata_freq: {type: 'Text', title: 'StateData freq [steps]', validators: ['pos_integer', 'required']},
    statedata_file: {type: 'Text', title: 'StateData filename'},
    statedata_opts: {type: 'Checkboxes', title: 'StateData options',
                     options: ['Step index', 'Time', 'Potential energy', 'Kinetic energy',
                               'Total energy', 'Temperature', 'Volume', 'Density']},
  },

  defaults: {
    equil_steps: 100,
    prod_steps: 1000,
    minimize: 'True',
    minimize_iters: '',
    dcd_reporter: 'True',
    dcd_freq: 100,
    dcd_file: 'output.dcd',
    statedata_reporter: 'True',
    statedata_freq: 100,
    statedata_file: '',
    statedata_opts: ['Step', 'Potential energy', 'Temperature'],
  },

  visibility: {
    minimize_iters: function(attrs) {
      return attrs.minimize == 'True';
    },
    dcd_freq: function(attrs) {
      return attrs.dcd_reporter == 'True';
    },
    dcd_file: function(attrs) {
      return attrs.dcd_reporter == 'True';
    },
    statedata_freq: function(attrs) {
      return attrs.statedata_reporter == 'True';
    },
    statedata_file: function(attrs) {
      return attrs.statedata_reporter == 'True';
    },
    statedata_opts: function(attrs) {
      return attrs.statedata_reporter == 'True';
    },
  },
});


});