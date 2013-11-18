var replace_unit = function(val) {
  var r = val.replace(/\s*nm/, '*unit.nanometers');
  r = r.replace(/\s*A/, '*unit.angstroms');

  r = r.replace(/\s*\/fs/, '/unit.femtoseconds');
  r = r.replace(/\s*\/ps/, '/unit.picoseconds');
  r = r.replace(/\s*\/ns/, '/unit.nanoseconds');

  r = r.replace(/\s*fs/, '*unit.femtoseconds');
  r = r.replace(/\s*ps/, '*unit.picoseconds');
  r = r.replace(/\s*ns/, '*unit.nanoseconds');

  r = r.replace(/\s*K/, '*unit.kelvin');

  r = r.replace(/\s*bar/, '*unit.bars');
  r = r.replace(/\s*atm/, '*unit.atmospheres');
  return r;
}

var protein_xml = function(protein_ff) {
    var xmls = {
        AMBER96: 'amber96.xml',
        AMBER99sb: 'amber99sb.xml',
        'AMBER99sb-ildn': 'amber99sbildn.xml',
        'AMBER99sb-nmr': 'amber99sbnmr.xml',
        AMBER03: 'amber03.xml',
        AMBER10: 'amber10.xml',
    };
    return xmls[protein_ff];
}

var water_xml = function(protein_ff, water_ff) {
    var explicit_xmls = {
        'SPC/E': 'spce.xml',
        TIP3P: 'tip3p.xml',
        'TIP4P-Ew': 'tip4pew.xml',
        TIP5P: 'tip5p.xml',
    };
    var implicit_xmls = {
        AMBER96: 'amber96_obc.xml',
        AMBER99sb: 'amber99_obc.xml',
        'AMBER99sb-ildn': 'amber99_obc.xml',
        'AMBER99sb-nmr': 'amber99_obc.xml',
        AMBER03: 'amber03_obc.xml',
        AMBER10: 'amber10_obc.xml',
    };
    
    if (water_ff in explicit_xmls) {
        return explicit_xmls[water_ff];
    }
        
    if (water_ff == 'Implicit Solvent (OBC)') {
        return implicit_xmls[protein_ff];
    }
    
    return null;
}

var OpenMMScriptView = Backbone.View.extend({
  initialize : function() {
    this.collection.bind('change', this.render);
    //setting the models attribute seems to be essential to getting
    // the initial render to go right, but gets overriden later...
    this.models = this.collection.models;
    this.render();

  },
  
  sanitycheck: function() {
    var d = {}
    for (var i=0; i < that.models.length; i++) {
      var name = that.models[i].name;
      d[name] = that.models[i].toJSON();
    }
    
    if (_.contains(['Langevin', 'Verlet'], d.integrator.kind) && d.system.constraints == 'None') {
        //if (d.integrator.timestep > 1) {
        //pass
        //}
        //return 'Are you sure you want to do that?'
    } else if (_.contains(['CUDA', 'OpenCL'], d.general.platform) && _.contains(['single', 'mixed'], d.general.precision) && d.system.nb_method == 'PME' && d.system.ewald_error_tolerance < 5e-5) {
        return 'In single or mixed precision, very low Ewald error tolerance (<5e-5) with PME \
                are likely to make the error bigger, not smaller, due to numerical issues. You \
                might want to switch to double precision.';
    } else if (d.general.water == 'Implicit Solvent (OBC)' && _.contains(['CutoffPeriodic', 'Ewald', 'PME'], d.system.nb_method)) {
        return 'I see that you\'re using implicit solvent with periodic boundary conditions.\
               That is a very strange choice, and might result in meaningless results. You \
               might instead use CutoffNonPeriodic, or NoCutoff to handle nonbonded interactions.';
    } else if (_.contains(['NoCutoff', 'CutoffNonPeriodic'], d.system.nb_method) && d.integrator.barostat == 'Monte Carlo') {
        return 'I see that you\'re not using periodic boundary conditions, yet you\'ve elected to add \
                a Barostat to the system. Since the Barostat works by changing the system\'s volume via \
                the periodic box vectors, it\'s only appropriate in periodic simulations.';
    }
    
    if (d.general.coords_fn.match(/\.gro$/) != null && d.general.topology_fn.match(/\.prmtop$/) != null) {
      bootbox.alert("Gromacs '.gro' coordinate files are only compatible with Gromacs '.top' topology files.\
                     You probably want to change Input Topology to a .top file?");
    } else if (d.general.coords_fn.match(/\.inpcrd$/) != null && d.general.topology_fn.match(/\.top$/) != null) {
      bootbox.alert("Amber '.inpcrd' coordinate files are only compatible with Amber '.prmtop' topology files.\
                     You probably want to change Input Topology to a .prmtop file?");
    }
    

    return null;
    //if (integrator is langevin or  verlet) and ((constraints is None and dt>1 fs) or (constraints is HBonds or AllBonds and dt>2 fs) or (constraints is HAngles and dt>4 fs)
  },

  render: function() {
    that = this;
    var d = {}
    for (var i=0; i < that.models.length; i++) {
      var name = that.models[i].name;
      d[name] = that.models[i].toJSON();
    }


    opt = {
      pdb: d.general.coords_fn.match(/\.pdb$/) != null,
      amber: d.general.coords_fn.match(/\.inpcrd$/) != null,
      gromacs: d.general.coords_fn.match(/\.gro$/) != null,
      nb_cutoff: d.system.nb_method != 'NoCutoff',
      cuda: d.general.platform == 'CUDA',
      open_cl: d.general.platform == 'OpenCL',
      variable_timestep: _.contains(['VariableLangevin', 'VariableVerlet'], d.integrator.kind),
    }
    
    
    // If you are reading this code below, I'm sincerely sorry.
    // There's no "elegant" way to create this script
    // I tried using a templating engine (mustache.js), but the problem
    // is that we NEED more logic than there is actual generated code...
    // -Robert

    var r = '##########################################################################\n';
    r += '# this script was generated by openmm-builder. to customize it further,\n'
    r += '# you can save the file to disk and edit it with your favorite editor.\n'
    r += '##########################################################################\n\n'
    r += 'from __future__ import print_function\n';
    r += 'from simtk.openmm import app\n';
    r += 'import simtk.openmm as mm\n';
    r += 'from simtk import unit\n';
    if (d.simulation.statedata_file.length == 0) {
      r += 'from sys import stdout\n';
    }
    
    // first two or three lines, that load up the FF and the pdb
    // these lines end with the start of the function something.createSystem(
    if (opt.pdb) {
      r += "\npdb = app.PDBFile('" + d.general.coords_fn + "')\n";
      r += "forcefield = app.ForceField('" + protein_xml(d.general.protein) + "'"
      r += ", '" + water_xml(d.general.protein, d.general.water) + "'";
      r += ')\n\n';
      r += 'system = forcefield.createSystem(pdb.topology, '
    } else if (opt.amber) {
      r += "\nprmtop = app.AmberPrmtopFile('" + d.general.topology_fn + "')\n";
      r += "inpcrd = app.AmberInpcrdFile('" + d.general.coords_fn + "')\n\n";
      r += 'system = prmtop.createSystem('
      if (d.general.water == 'Implicit Solvent (OBC)') {
          r += 'implicitSovlent=app.OBC2, '
      }
    } else if (opt.gromacs) {
      r += "\ngro = app.GromacsGroFile('" + d.general.coords_fn + "')\n";
      r += "top = app.GromacsTopFile('" + d.general.topology_fn + "')\n\n";
      r += 'system = top.createSystem('
      if (d.general.water == 'Implicit Solvent (OBC)') {
          r += 'implicitSovlent=app.OBC2, '
      }
    } else {
      bootbox.alert('Error!');
    }
    
    // options for the system
    r += 'nonbondedMethod=' + 'app.' + d.system.nb_method + ', ';
    if (opt.nb_cutoff) {
      r += 'nonbondedCutoff=' + replace_unit(d.system.nb_cutoff) + ',';
    }
    if (d.system.constraints == 'None') {
      r += ' constraints=' + d.system.constraints;
    } else {
      r += ' constraints=' + 'app.' + d.system.constraints;
    }
    r += ', rigidWater=' + d.system.rigid_water;
    if (_.contains(['Ewald', 'PME'], d.system.nb_method)) {
      r += ', ewaldErrorTolerance=' + d.system.ewald_error_tolerance;
    }
    r += ')\n';

    // set the integrator
    r += 'integrator = mm.' + d.integrator.kind + 'Integrator(';
    if (d.integrator.kind == 'Langevin' || d.integrator.kind == 'Brownian') {
      r += replace_unit(d.integrator.temperature) + ', '
      r += replace_unit(d.integrator.friction) + ', ';
    }
    if (opt.variable_timestep) {
      r += d.integrator.tolerance + ')\n'
    } else {
      r += replace_unit(d.integrator.timestep) + ')\n';
    }
    if (d.system.constraints != 'None' && d.system.constraint_error_tol.length > 0) {
      r += "integrator.setConstraintTolerance(" + d.system.constraint_error_tol + ")\n";
    } 

    // add a barostat
    if (d.integrator.barostat == 'Monte Carlo') {
      r += "system.addForce(mm.MonteCarloBarostat(" + replace_unit(d.integrator.pressure);
      r += ', ' + replace_unit(d.integrator.temperature);
      if (d.integrator.barostat_step.length > 0) {
        r += ', ' +  d.integrator.barostat_step;
      }
      r += "))\n";
    }

    // add a thermostat
    if (d.integrator.thermostat == 'Andersen') {
      r += 'system.addForce(mm.AndersenThermostat(' + replace_unit(d.integrator.temperature);
      r += ', ' + replace_unit(d.integrator.friction) + '))\n'
    }

    r += '\n';

    // set the platform options
    r += "platform = mm.Platform.getPlatformByName('" + d.general.platform + "')\n"
    if (opt.cuda) {
      r += "properties = {'CudaPrecision': '" + d.general.precision + "'";
      if (d.general.device.length > 0) {
        r += ", 'CudaDeviceIndex': '" + d.general.device + "'";
      }
      r += "}\n"

    } else if (opt.open_cl) {
      r += "properties = {'OpenCLPrecision': '" + d.general.precision + "'";
      if (d.general.opencl_plat_index.length > 0) {
        r += ", 'OpenCLPlatformIndex': '" + d.general.opencl_plat_index + "'";
      }
      if (d.general.device.length > 0) {
        r += ", ";
        if (d.general.opencl_plat_index.length > 0) {
          r += '\n              ';
        }
        r += "'OpenCLDeviceIndex': '" + d.general.device + "'";
      }
      r += "}\n"

    }

    // create the simulation object
    r += "simulation = app.Simulation(" + (opt.pdb ? "pdb" : "prmtop") + ".topology, system, integrator, platform";
    if (opt.cuda || opt.open_cl) {
      r += ', properties'
    }
    r += ')\n';

    if (opt.pdb) {
      r += 'simulation.context.setPositions(pdb.positions)\n\n'
    } else if (opt.amber) {
      r += 'simulation.context.setPositions(inpcrd.positions)\n\n'
    } else if (opt.gromacs) {
      r += 'simulation.context.setPositions(gro.positions)\n\n'
    } else {
      bootbox.alert('Error!!');
    }

    // minimize
    if (d.simulation.minimize == 'True') {
      r += "print('Minimizing...')\n"
      if (d.simulation.minimize_iters == '') {
        r += 'simulation.minimizeEnergy()\n'
      } else {
        r += 'simulation.minimizeEnergy(maxIterations=' + d.simulation.minimize_iters + ')\n';
      }
    }
    if (d.system.random_initial_velocities == 'True') {
      r += '\nsimulation.context.setVelocitiesToTemperature(' + replace_unit(d.system.gentemp) + ')\n';
    }

    // equilibrate
    if (d.simulation.equil_steps > 0) {
      r += "print('Equilibrating...')\n"
      r += 'simulation.step(' + d.simulation.equil_steps + ')\n\n'
    }

    // add reporters
    if (d.simulation.dcd_reporter == 'True' && d.simulation.statedata_opts.length > 0) {
      r += "simulation.reporters.append(app.DCDReporter('" + d.simulation.dcd_file + "'";
      r += ', ' + d.simulation.dcd_freq + "))\n"
    } if (d.simulation.statedata_reporter == 'True') {
       r += "simulation.reporters.append(app.StateDataReporter("
      if (d.simulation.statedata_file.length == 0) {
        r += 'stdout';
      } else {
        r += "'" + d.simulation.statedata_file + "'"
      }  
      r += ", " + d.simulation.statedata_freq
      if (_.contains(d.simulation.statedata_opts, 'Step index')) r += ', step=True'
      if (_.contains(d.simulation.statedata_opts, 'Time')) r += ', time=True'
      if (_.contains(d.simulation.statedata_opts, 'Potential energy')) r += ', potentialEnergy=True'
      if (_.contains(d.simulation.statedata_opts, 'Kinetic energy')) r += ', kineticEnergy=True'
      if (_.contains(d.simulation.statedata_opts, 'Total energy')) r += ', totalEnergy=True'
      if (_.contains(d.simulation.statedata_opts, 'Temperature')) r += ', temperature=True'
      if (_.contains(d.simulation.statedata_opts, 'Volume')) r += ', volume=True'
      if (_.contains(d.simulation.statedata_opts, 'Density')) r += ', density=True'
      r += '))\n'
    } if (d.simulation.dcd_reporter == 'True' || d.simulation.statedata_reporter == 'True') {
      r += '\n';
    }

    // run
    r += "print('Running Production...')\n";
    r += 'simulation.step(' + d.simulation.prod_steps + ')\n';
    r += "print('Done!')\n";
    
    $("#code").html(prettyPrintOne(split_to_80_chars(r)));


    // $("#code").html(prettyPrintOne(r));
  },
});
