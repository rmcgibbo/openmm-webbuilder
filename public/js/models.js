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
    * jsonify : function
    *     UNSTABLE: this is currently part of the pipeline that creates the
    *     script, and runs before the template engine. I think this should be
    *     changed though, butting more template logic in the model.
    *     (nested templates?)
    */

// set of regular expressions to validate input forms
validators = {
  // these ones look for a number with units, like
  // "2.0 fs", "2 fs", "2.0  fs", etc.
  units: {
    'time': [/^\d+(\.\d+)?\s*(fs|ns|ps)$/],
    'friction': [/^\d+(\.\d+)?\s*\/(fs|ps|ns)$/],
    'distance': [/^\d+(\.\d+)?\s*(A|nm)$/],
    'temperature': [/^\d+(\.\d+)?\s*(K)$/],
    'pressure': [/^\d+(\.\d+)?\s*(atm)$/],
  },
  integer: [/^\d+$/],
}

Collection = Backbone.Collection.extend({
  model: Backbone.Model
});

// https://github.com/powmedia/backbone-forms
General = Backbone.Model.extend({
  el: '#sidepane-general',
  name: 'general',
  schema: {
    coords_fn:   {type: 'Text', title: 'input coordinates',
                  help: 'OpenMM can take a .pdb, providing both coordinates\
                         and topology, a .inpcrd, specifying just the\
                         coordinates or a serialized system .xml file.',
                  validators: [/\.pdb$|\.inpcrd$|\.xml$/]},
    topology_fn: {type: 'Text', title: 'input topology',
                  help: '.prmtop file, specifiying the system topology. This\
                         is only required if the coordinate file is a .inpcrd',
                  validators: [/\.prmtop$/],},
    protein:   {type: 'Select', title: 'protein forcefield',
                options: ['amber03.xml', 'amber03_gbvi.xml',
                          'amber03_obc.xml', 'amber10.xml',
                          'amber10_gbvi.xml', 'amber10_obc.xml',
                          'amber96.xml', 'amber96_gbvi.xml',
                          'amber96_obc.xml', 'amber99_gbvi.xml',
                          'amber99_obc.xml', 'amber99sb.xml',
                          'amber99sbildn.xml', 'amber99sbnmr.xml'],
                help: 'Forcefield to use for the protein atoms. \
                       If you\'d like to use implicit solvent, you \
                       can select that here as well (obc or gbvi).'},
    water:     {type: 'Select', options: ['spce.xml', 'tip3p.xml',
                                          'tip4pew.xml', 'tip5p.xml'],
                title: 'water forcefield',
                help: 'Forcefield to use for water, for explicit solvent \
                       calculations. If you\'re using implicit solvent, \
                       that needs to be set in the protein forcefield option.'},
    platform:  {type: 'Select', options: ['Reference', 'OpenCL', 'CUDA'],
                help: 'GPUs are awesome!'},
    cuda_precision: {type: 'Select', options: ['single', 'mixed', 'double'],
                     title: 'CUDA precision',
                     help: 'The precision of the CUDA platform'},
    device: {type: 'Number', title: 'GPU device index',
             help: 'Specify the device (GPU) number'},
  },

  visibility: {
    water: function(attrs) {
      return (attrs.protein.match(/_obc|_gbvi/) == null);
    },
    cuda_precision: function(attrs) {
      return attrs.platform == 'CUDA';
    },
    device: function(attrs) {
      return _.contains(['CUDA', 'OpenCL'], attrs.platform);
    },
    topology_fn: function(attrs) {
      return attrs.coords_fn.match(/.inpcrd$/)
    },
  },

  defaults: {
    coords_fn: 'input.pdb',
    protein: 'amber99sb.xml',
    water: 'tip3p.xml',
    platform: 'CUDA',
    cuda_precision: 'single',
    device: 0,
  },

  jsonify: function () {
    raw = this.toJSON();
    raw.explicit_water = true;
    if (raw.protein.indexOf('obc') != -1 || raw.protein.indexOf('gbvi') != -1) {
      raw.explicit_water = false;
    }
    return raw;
  }
});

System = Backbone.Model.extend({
  el: '#sidepane-system',
  name: 'system',
  schema: {
    nb_method: {type: 'Select', options: ['NoCutoff', 'CutoffNonPeriodic',
                                          'CutoffPeriodic', 'Ewald', 'PME'],
                title: 'nonbonded method',
                help: 'Method for deailing with long range non-bondend \
                       interactions.'},
    constraints: {type: 'Select',
                  options: ['None', 'HBonds', 'HAngles', 'AllBonds'],
                  help: 'Applying constraints to some of the atoms can \
                         enable you to take longer timesteps.'},
    rigid_water: {type: 'Select', options: ['True', 'False'],
                  title: 'rigid water?'},
    nb_cutoff:   {type: 'Text', title: 'nonbonded cutoff',
                  validators: validators.units.distance,
                  help: 'Cutoff for long-range non-bonded interactions. \
                         This option is important for all non-bonded methods \
                         except for "nocutoff"'},
    gentemp:     {type: 'Text', title: 'generate temperature',
                  help: 'Specify temperature for generating velocities',
                  validators: validators.units.temperature}
  },

  visibility: {
    nb_cutoff: function(attrs) {
      return attrs.nb_method != 'NoCutoff'
    },
  },

  defaults: {
    nb_method: 'PME',
    constraints: 'HAngles',
    rigid_water: 'True',
    nb_cutoff: '1.0 nm',
    gentemp: '300 K',
  },

  jsonify: function () {
    raw = this.toJSON();
    raw.nb_cutoff = raw.nb_cutoff.replace('nm', '* nanometers');
    raw.nb_cutoff = raw.nb_cutoff.replace('A', '* angstroms');
    raw.has_cutoff = true;
    if (raw.nb_method == 'NoCutoff') {
      raw.has_cutoff = false;
    }
    return raw;
  }
});

Integrator = Backbone.Model.extend({
  el: '#sidepane-integrator',
  name: 'integrator',
  schema: {
    kind: {type: 'Select', options: ['Langevin', 'Brownian', 'Verlet'],
           title: 'integrator', help: 'Which integrator do you prefer?'},
    timestep: {type: 'Text', validators: validators.units.time,
               help: 'Timestep for the integrator!'},
    friction: {type: 'Text', validators: validators.units.friction, title: 'collision rate',
               help: 'Friction coefficient, for use with stochastic \
                      integrators or the Anderson thermostat'},
    temperature: {type: 'Text', validators: validators.units.temperature,
                  help: 'For use with stochastic integrators.'},
    barostat: {type: 'Select', options: ['None', 'Monte Carlo'],
               help: 'Activate pressure coupling (NPT)'},
    pressure: {type: 'Text', help: 'Pressure to use for pressure coupling',
               validators: validators.units.pressure},
    barostat_step: {type: 'Number', title: 'barostat interval',
              help:'Step interval for MC barostat volume adjustments.'},
    thermostat: {type: 'Select', options: ['None', 'Andersen']},
  },

  defaults: {
    kind: 'Langevin',
    timestep: '2.0 fs',
    friction: '91.0/ps',
    temperature: '300 K',
    barostat: 'None',
    barostat_step: '25',
    pressure: '1 atm',
  },

  visibility: {
    friction: function(attrs) {
      return _.contains(['Brownian', 'Langevin'], attrs.kind);
    },
    temperature: function(attrs) {
      return _.contains(['Brownian', 'Langevin'], attrs.kind) || attrs.thermostat == 'Andersen';
    },
    barostat_step: function(attrs) {
      return attrs.barostat == 'Monte Carlo';
    },
    pressure: function(attrs) {
      return attrs.barostat == 'Monte Carlo';
    },
    thermostat: function(attrs) {
      return attrs.kind == 'Verlet';
    }
  },

  jsonify: function () {
    raw = this.toJSON();
    raw.stochastic_active = true;
    raw.timestep = raw.timestep.replace('fs', '* femtoseconds');
    raw.timestep = raw.timestep.replace('ns', '* nanoseconds');
    raw.timestep = raw.timestep.replace('ps', '* picoseconds');
    raw.friction = raw.friction.replace('ps', 'picoseconds');
    raw.temperature = raw.temperature.replace('K', '* kelvin');

    if (raw.kind == 'Verlet') {
      raw.stochastic_active = false;
    }
    return raw;
  }
});



Simulation = Backbone.Model.extend({
  el: '#sidepane-simulation',
  name: 'simulation',
  schema: {
    equil_steps: {type: 'Number', title: 'equilibration steps',
                  validaotrs: validators.integer,
                  help: 'Number of steps for production'},
    prod_steps: {type: 'Number', title: 'production steps',
                 validators: validators.integer,
                 help: 'Number of steps to take in the simulation'},
    minimize: {type: 'Select', options: ['true', 'false'],
               title: 'minimize?',
               help: 'Should we run energy minimization first?'},
    minimize_iters: {type: 'Number', title: 'max minimize steps',
                     validators: validators.integer,
                     help: 'Maximum number of steps for the minimizer.'},
    dcd_reporter: {type: 'Select', options: ['true', 'false'],
                   title: 'DCD reporter?',
                   help: 'Attach a DCD Reporter, to save the trajectory'},
    dcd_freq: {type: 'Number', title: 'DCD freq [steps]',
               validators: validators.integer,
               help: 'Freqnency, in steps, with which to save the positions \
                      to the DCD file'},
    dcd_file: {type: 'Text', title: 'DCD filename',
               help: 'Filename for the DCD trajectory file'},
    statedata_reporter: {type: 'Select', options: ['true', 'false'],
                         title: 'StateData reporter?',
                         help: 'Attach a StateDataReporter to the simulation, \
                                to print some statistics to stdout as the \
                                simulation is running'},
    statedata_freq: {type: 'Number', title: 'StateData freq [steps]',
                     validators: validators.integer,
                     help: 'Frequency, in steps, to print the StateData \
                            statistics to stdout'},
  },

  defaults: {
    equil_steps: 100,
    prod_steps: 1000,
    minimize: 'true',
    minimize_iters: 100,
    dcd_reporter: 'true',
    dcd_freq: 100,
    dcd_file: 'output.dcd',
    statedata_reporter: 'true',
    statedata_freq: 100,
  },

  visibility: {
    minimize_iters: function(attrs) {
      return attrs.minimize == 'true';
    },
    dcd_freq: function(attrs) {
      return attrs.dcd_reporter == 'true';
    },
    dcd_file: function(attrs) {
      return attrs.dcd_reporter == 'true';
    },
    statedata_freq: function(attrs) {
      return attrs.statedata_reporter == 'true';
    },
  },

  jsonify: function () {
    raw = this.toJSON();
    // these need to be cast from strings to real t/f
    raw.dcd_reporter = (raw.dcd_reporter == 'true');
    raw.statedata_reporter = (raw.statedata_reporter == 'true')
    raw.minimize = (raw.minimize == 'true')
    return raw;
  }
});
