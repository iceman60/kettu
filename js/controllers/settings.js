Settings = function(sammy) { with(sammy) {
  updatable_settings = [
    'dht-enabled', 'pex-enabled', 'speed-limit-up', 'speed-limit-up-enabled', 'speed-limit-down',
    'speed-limit-down-enabled', 'peer-port', 'download-dir'
  ];
  
  get('#/settings', function() {
    var context = this;
    var request = {
      'method': 'session-get',
      'arguments': {}
    };
    rpc.query(request, function(response) {
      view = response;
      view['reload_interval'] = reload_interval / 1000;
      context.partial('./templates/settings/index.mustache', view, function(rendered_view) {
        context.openInfo(rendered_view);
        trigger('settings-refreshed', view);
      });
    });
  });
  
  put('#/settings', function() {
    var context = this;
    var arguments_hash = {}
    $.each(updatable_settings, function() {
      var setting = this;
      if(context.params[setting]) {
        arguments_hash[setting] = (context.params[setting] == "on") ? true : context.params[setting];
      } else {
        arguments_hash[setting] = false;
      }
    });
    var request = {
      'method': 'session-set',
      'arguments': arguments_hash
    };
    rpc.query(request, function(response) {
      trigger('flash', 'Settings updated successfully');
    });
  });
  
  bind('settings-refreshed', function(e, settings){ with(this) {
    this.trigger('changed');
    this.updateSettingsCheckboxes(settings);
  }});
}};