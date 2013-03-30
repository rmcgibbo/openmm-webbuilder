// set of regular expressions to validate input forms
validators = {
  
  // these ones look for a number with units, like
  // "2.0 fs", "2 fs", "2.0  fs", etc.
  units: {
    'time': [/^\d+(\.\d+)?\s*(fs|ns|ps)$/],
    'friction': [/^\d+(\.\d+)?\s*\/(fs|ps|ns)$/],
    'distance': [/^\d+(\.\d+)?\s*(A|nm)$/],
    'temperature': [/^\d+(\.\d+)?\s*(K)$/],
  },
  integer: [/^\d+$/],
}

// Big chunk of JSON that describes each of the panels to appear on the 
// left side of the screen. These are rendered as forms using:
// https://github.com/powmedia/backbone-forms
models = {
  general: {
    el: '#sidepane-general',
    schema: {
      file:      {type: 'Text', title: 'input file',
                  help: 'OpenMM can take a PDB as input!'},
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
    },
    'default': {
      file : 'input.pdb',
      protein : 'amber99sb.xml',
      water : 'tip3p.xml',
      platform : 'CUDA',
    },
    
    jsonify : function (raw) {
      raw.explicit_water = true;
      if (raw.protein.indexOf('obc') != -1 || raw.protein.indexOf('gbvi') != -1) {
        raw.explicit_water = false;
      }


      return raw;
    }
  },
  
  system: {
    el: '#sidepane-system',
    schema: {
      nb_method: {type: 'Select', options: ['NoCutoff', 'CutoffNonPeriodic',
                                            'CutoffPeriodic', 'Ewald', 'PME'],
                  title: 'nb method', help: 'Method for deailing with long range \
                    non-bondend interactions.'},
      constraints: {type: 'Select', options: ['None', 'HBonds', 'HAngles', 'AllBonds'],
                    help: 'Applying constraints to some of the atoms can enable you \
                           to take longer timesteps.'},
      rigid_water: {type: 'Select', options: ['True', 'False'], title: 'rigid water'},
      nb_cutoff:   {type: 'Text', title: 'nb cutoff', validators: validators.units.distance,
                    help: 'Cutoff for long-range non-bonded interactions. This option is \
                           important for all non-bonded methods except for "nocutoff"'},
    },
    'default': {
      nb_method: 'PME',
      constraints: 'HAngles',
      rigid_water: 'True',
      nb_cutoff: '1.0 nm'
    },
    jsonify: function (raw) {
      raw.nb_cutoff = raw.nb_cutoff.replace('nm', '* nanometers');
      raw.has_cutoff = true;
      if (raw.nb_method == 'NoCutoff') {
        raw.has_cutoff = false;
      }
      return raw;
    }
  },
  
  integrator: {
    el: '#sidepane-integrator',
    schema: {
      kind: {type: 'Select', options: ['Langevin', 'Brownian', 'Verlet'],
             title: 'integrator', help: 'Which integrator do you prefer?'},
      timestep: {type: 'Text', validators: validators.units.time, 
                 help: 'Timestep for the integrator!'},
      friction: {type: 'Text', validators: validators.units.friction,
                 help: 'Friction coefficient, for use with stochastic integrators.'},
      temperature: {type: 'Text', validators: validators.units.temperature,
                    help: 'For use with stochastic integrators.'},
    },
    'default': {
      kind: 'Langevin',
      timestep: '2.0 fs',
      friction: '91.0/ps',
      temperature: '300 K'
    },
    jsonify: function (raw) {
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
  },
  
  simulation: {
    el: '#sidepane-simulation',
    schema: {
      n_steps: {type: 'Text', title: 'n steps', validators: validators.integer,
                help: 'Number of steps to take in the simulation'},
      minimize: {type: 'Select', options: ['true', 'false'],
                 help: 'Should we run energy minimization first?'},
      minimize_iters: {type: 'Text', title: 'max minimize steps', validators: validators.integer,
                       help: 'Maximum number of steps for the minimizer.'},
      dcd_reporter: {type: 'Select', options: ['true', 'false'], title: 'DCD reporter',
                     help: 'Attach a DCD Reporter, to save the trajectory'},
      dcd_freq: {type: 'Text', title: 'DCD freq [steps]', validators: validators.integer,
                 help: 'Freqnency, in steps, with which to save the positions to the DCD file'},
      dcd_file: {type: 'Text', title: 'DCD filename',
                 help: 'Filename for the DCD trajectory file'},
      statedata_reporter: {type: 'Select', options: ['true', 'false'], title: 'StateData reporter',
                           help: 'Attach a StateDataReporter to the simulation, to print some \
                                  statistics to stdout as the simulation is running'},
      statedata_freq: {type: 'Text', title: 'StateData freq [steps]',
                       validators: validators.integer, help: 'Frequency, in steps, to print \
                          the StateData statistics to stdout'},
    },
    'default': {
      n_steps: 1000,
      minimize: 'true',
      minimize_iters: 100,
      dcd_reporter: 'true',
      dcd_freq: 100,
      dcd_file: 'output.dcd',
      statedata_reporter: 'true',
      statedata_freq: 100,
    },
    jsonify: function (raw) {
      // these need to be cast from strings to real t/f
      raw.dcd_reporter = (raw.dcd_reporter == 'true');
      raw.statedata_reporter = (raw.statedata_reporter == 'true')
      raw.minimize = (raw.minimize == 'true')
      return raw;
    }
  }
  
}