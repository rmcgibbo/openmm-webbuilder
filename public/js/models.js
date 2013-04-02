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
                  help: 'OpenMM can take a .pdb, providing both coordinates\
                         and topology or an AMBER .inpcrd, specifying just the \
                         coordinates (in which case a .prmtop is requred too).',
                  validators: ['required', /\.pdb$|\.inpcrd$/]},
    topology_fn: {type: 'Text', title: 'Input topology',
                  help: '.prmtop file, specifiying the system topology. This\
                         is only required if the coordinate file is in the \
                         AMBER .inpcrd format',
                  validators: ['prmtop', 'required']},
    protein:   {type: 'Select', title: 'Protein forcefield',
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
                title: 'Water forcefield',
                help: 'Forcefield to use for water, for explicit solvent \
                       calculations. If you\'re using implicit solvent, \
                       that needs to be set in the protein forcefield option.'},
    platform:  {type: 'Select', options: ['Reference', 'OpenCL', 'CUDA'],
                help: 'GPUs are awesome!', title: 'Platform'},
    precision: {type: 'Select', options: ['single', 'mixed', 'double'],
                     title: 'Precision',
                     help: 'This selects what numeric precision to use for \
                            calculations. Theallowed values are “single”, \
                            “mixed”, and “double”. If it is set to “single”, \
                            nearly all calculations are done in single precision.\
                            This is the fastest option but also the least \
                            accurate. If it is set to “mixed”, forces are \
                            computed in single precision but integration is \
                            done in double precision. This gives much better \
                            energy conservation with only a slightly decrease \
                            in speed. If it is set to “double”, all \
                            calculations are done in double precision. This is \
                            the most accurate option, but is usually much \
                            slower than the others'},
    device: {type: 'Text', title: 'Device index',
             validators: [/^\d+(,\d+)*$/],
             help: 'When multiple CUDA/OpenCL devices are available on your \
                    computer, this is used to select which one to use. \
                    The value is the zero-based index of the device to use, \
                    in the order they are returned by the CUDA/OpenCL device API.\
                    The GPU platforms also supports parallelizing a simulation\
                    across multiple GPUs. To dothat, set the device index \
                    to a comma separated list of values. For example “0,1” \
                    tells it to use both devices 0 and 1, splitting the work \
                    between them.'},
      opencl_plat_index: {type: 'Text', title: 'OpenCL platform indx',
                          validators: ['pos_integer'],
                          help: 'When multiple OpenCL implementations are \
                          installed on your computer, this is used to select \
                          which one to use. The value is the zero-based index \
                          of the platform (in the OpenCL sense, not the OpenMM \
                          sense) to use, in the order they are returned by the \
                          OpenCL platform API. This is useful, for example, \
                          in selecting whether to use a GPU or CPU based \
                          penCL implementation.'},
  },

  visibility: {
    protein: function(attrs) {
      return !(attrs.coords_fn.match(/\.inpcrd$/) && attrs.topology_fn.match(/\.prmtop$/))
    },
    water: function(attrs) {
      if (attrs.protein.match(/_obc|_gbvi/) == null) {
        return false;
      } else if (attrs.coords_fn.match(/\.inpcrd$/) && attrs.topology_fn.match(/\.prmtop$/)) {
        return false;
      }
      return true;
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
                title: 'Nonbonded method',
                help: 'Method for dealing with long range non-bondend \
                       interactions. Refer to the user guide for a detailed discussion.'},
    constraints: {type: 'Select', title: 'Constraints',
                  options: ['None', 'HBonds', 'HAngles', 'AllBonds'],
                  help: 'Applying constraints to some of the atoms can \
                         enable you to take longer timesteps.'},
    rigid_water: {type: 'Select', options: ['True', 'False'],
                  title: 'Rigid water?',
                  help: 'Be aware that flexible water may require you to \
                         further reduce the integration step size, typically \
                         to about 0.5 fs.'},
    nb_cutoff:   {type: 'Text', title: 'Nonbonded cutoff',
                  validators: ['distance'],
                  help: 'Cutoff for long-range non-bonded interactions. \
                         This option is important for all non-bonded methods \
                         except for "NoCutoff"'},
    random_initial_velocities:    {type: 'Select', title: 'Random init vels.',
                                   options: ['True', 'False'],
                                   help: 'Initialize the system with random \
                                          initial velocities, drawn from the \
                                          Maxwell Boltzmann distribution'},
    gentemp:     {type: 'Text', title: 'Generation temp.',
                  help: 'Specify temperature for generating initial velocities',
                  validators: ['temperature']}
  },

  visibility: {
    nb_cutoff: function(attrs) {
      return attrs.nb_method != 'NoCutoff';
    },
    gentemp: function(attrs) {
      return attrs.random_initial_velocities == 'True';
    }
  },

  defaults: {
    nb_method: 'PME',
    constraints: 'HAngles',
    rigid_water: 'True',
    nb_cutoff: '1.0 nm',
    rnd_init: 'True',
    gentemp: '300 K',
  },
});

Integrator = Backbone.Model.extend({
  el: '#sidepane-integrator',
  name: 'integrator',
  schema: {
    kind: {type: 'Select',
           options: ['Langevin', 'VariableLangevin', 'Brownian',
                     'Verlet', 'VariableVerlet'],
           title: 'Integrator',
           help: 'OpenMM offers a choice of several different integration \
                  methods. Refer to the user guide for details.'},
    timestep: {type: 'Text', validators: ['time'], title: 'Timestep',
               help: 'Step size for the integrator.'},
    tolerance: {type: 'Text', title: 'Error tolerance',
                validators: ['pos_float', 'required'],
                help: 'It is best not to think of this value as having any \
                       absolute meaning. Just think of it as an adjustable \
                       parameter that affects the step size and integration \
                       accuracy. Smaller values will produce a smaller average \
                       step size. You should try different values to find the \
                       largest one that produces a trajectory sufficiently \
                       accurate for your purposes.'},
    friction: {type: 'Text', validators: ['friction'], title: 'collision rate',
               help: 'Friction coefficient, for use with stochastic \
                      integrators or the Anderson thermostat'},
    temperature: {type: 'Text', validators: ['temperature'],
                  help: 'For use with stochastic integrators.'},
    barostat: {type: 'Select', options: ['None', 'Monte Carlo'],
               help: 'Activate pressure coupling (NPT)'},
    pressure: {type: 'Text', help: 'Pressure target to use for pressure coupling',
               validators: ['pressure']},
    barostat_step: {type: 'Text', title: 'Barostat interval',
                    validators: ['pos_integer'],
                    help:'Step interval for MC barostat volume adjustments.'},
    thermostat: {type: 'Select', options: ['None', 'Andersen']},
  },

  defaults: {
    kind: 'Langevin',
    timestep: '2.0 fs',
    tolerance: '0.001',
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
    equil_steps: {type: 'Text', title: 'Equilibration steps',
                  validators: ['pos_integer'],
                  help: 'Number of steps for equilibration'},
    prod_steps: {type: 'Text', title: 'Production steps',
                 validators: ['pos_integer', 'required'],
                 help: 'Number of steps to take in the simulation, in production.'},
    minimize: {type: 'Select', options: ['True', 'False'],
               title: 'Minimize?',
               help: 'Should we run energy minimization first?'},
    minimize_iters: {type: 'Text', title: 'Max minimize steps',
                     validators: ['pos_integer'],
                     help: 'The minimizer will exit once the specified number \
                            of iterations is reached, even if the energy has \
                            not yet converged. If you do not specify this \
                            parameter, the minimizer will continue until \
                            convergence is reached, no matter how many \
                            iterations it takes.'},
    dcd_reporter: {type: 'Select', options: ['True', 'False'],
                   title: 'DCD reporter?',
                   help: 'Attach a DCD Reporter, to save the trajectory'},
    dcd_freq: {type: 'Text', title: 'DCD freq [steps]',
               validators: ['pos_integer', 'required'],
               help: 'Freqnency, in steps, with which to save the positions \
                      to the DCD file'},
    dcd_file: {type: 'Text', title: 'DCD filename',
               help: 'Filename for the DCD trajectory file'},
    statedata_reporter: {type: 'Select', options: ['True', 'False'],
                         title: 'StateData reporter?',
                         help: 'Attach a StateDataReporter to the simulation, \
                                to print some statistics to stdout as the \
                                simulation is running'},
    statedata_freq: {type: 'Text', title: 'StateData freq [steps]',
                     validators: ['pos_integer', 'required'],
                     help: 'Frequency, in steps, to print the StateData \
                            statistics to stdout'},
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
  },
});
