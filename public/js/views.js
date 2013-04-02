var with_template = function(callback) {
  // Execute a callback with a dict containing the templates
  // (which are retreived via ajax and cached)
  
  if ('_template' in this) {
    callback(this._template);
  } else {
    this._template = {}
    var that = this
    $.get('templates/template.ejs', function(d) {
      that._template = d;
      callback(d);
    });
  }
}
  
  

var OpenMMScriptView = Backbone.View.extend({
  initialize : function() {
    this.collection.bind('change', this.render);
    //setting the models attribute seems to be essential to getting
    // the initial render to go right, but gets overriden later...
    this.models = this.collection.models;
    this.render();
  
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
      ex_water: d.general.protein.match(/_obc|_gbvi/) == null,
      nb_cutoff: d.system.nb_method != 'NoCutoff',
      cuda: d.general.platform == 'CUDA',
      open_cl: d.general.platform == 'OpenCL',
    }
    
    var r = '';
    if (opt.pdb) {
      r += "pdb = PDBFile('" + d.general.coords_fn + "')\n";
      r += "forcefield = ForceField('" + d.general.protein + "'"
      if (opt.ex_water) {
        r += ", '" + d.general.water + "'";
      }
      r += ')\n';
      r += 'system = forcefield.createSystem(pdb.topology, '
    } else if (opt.amber) {
      r += "prmtop = AmberPrmtopFile('" + d.general.topology_fn + "')\n";
      r += "inpcrd = AmberInpcrdFile('" + d.general.coords_fn + "')\n";
      r += 'prmtop.createSystem('
    }

    r += 'nonbondedMethod=' + d.system.nb_method + ',\n    '
    if (opt.nb_cutoff) {
      r += 'nonbondedCutoff=' + d.system.nb_cutoff + ',';
    }
    r += 'constraints=' + d.system.constraints;
    r += ', rigidWater=' + d.system.rigid_water;
    r += ')\n';
    
    r += "\nplatform = Platform.getPlatformByName('" + d.general.platform + "')\n"
    if (opt.cuda) {
      r += "properties = {'CudaDeviceIndex': '" + d.general.device + "', 'CudaPrecision': '" + d.general.cuda_precision + "'}\n";
    } else if (opt.open_cl) {
      r += "properties = {'OpenCLDeviceIndex': '" + d.general.device + "'}\n";
    }
    
    r += 'integrator = ' + d.integrator.kind + 'Integrator(';
    if (d.integrator.kind == 'Langevin' || d.integrator.kind == 'Brownian') {
      r += d.integrator.temperature + ', ' + d.integrator.friction + ', ';
    }
    r += d.integrator.timestep + ')\n';
    
    
    if (d.integrator.barostat == 'Monte Carlo') {
      r += "system.addForce(MonteCarloBarostat(" + d.integrator.pressure;
      r += ', ' + d.integrator.temperature + "))\n";
    }
    
    r += '\n';
    
    
    r += "simulation = Simulation(" + (opt.pdb ? "pdb" : "prmtop") + ".topology, system, integrator, platform";
    if (opt.cuda || opt.open_cl) {
      r += ', properties'
    }
    r += ')\n';
    
    
    

      
    
    $("#code").html(prettyPrintOne(r));
    
    
    
    // with_template(function(template) {
    //   var data = {};
    //   for (var i=0; i < that.models.length; i++) {
    //     var name = that.models[i].name;
    //     data[name] = that.models[i].toJSON();
    //   }
    // 
    //   script = ejs.render(template, data);
    //   $("#code").html(prettyPrintOne(script));
    // });
  },
});
