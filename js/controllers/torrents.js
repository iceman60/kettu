Torrents = function(sammy) { with(sammy) {
  var context;
  
  get('#/torrents', function() {
    context = this;
    getAndRenderTorrents();
    setInterval('getAndRenderTorrents()', reload_interval);
  });
  
  get('#/torrents/new', function() {
    context = this;
    this.partial('./templates/torrents/new.mustache', {}, function(rendered_view) {
      context.openInfo(rendered_view);
    });
  });
  
  post('#/torrents', function() {
    context = this;
    var paused = (this.params['start_when_added'] != "on");
    if(this.params['url'].length > 0) {
      var request = {
        'method': 'torrent-add',
        'arguments': {'filename': this.params['url'], 'paused': paused}
      };
      rpc.query(request, function(response) {
        torrentUploaded(response['torrent-added']);
      });      
    } else {
      $('#add_torrent_form').ajaxSubmit({
    		'url': 'http://localhost:9091/transmission/upload?paused=' + paused,
    		'type': 'POST',
    		'data': { 'X-Transmission-Session-Id' : rpc.session_id },
    		'dataType': 'xml',
        'iframe': true,
    		'success': function(response) {
    		  torrentUploaded($(response).children(':first').text().match(/200/));
    		}
  		});
    }    
  });
  
  get('#/torrents/:id', function() {
    context = this;
    var id = parseInt(context.params['id']);
    
    getTorrent(id, function(torrent) {
      context.partial('./templates/torrents/show_info.mustache', torrent, function(rendered_view) {
        context.openInfo(rendered_view);
      });
    });
  });
  
  put('#/torrents/:id', function() {
    context = this;
    var id = parseInt(context.params['id']);
    var request = {
      'method': context.params['method'],
      'arguments': {'ids': id}
    };
    rpc.query(request, function(response) {
      getTorrent(id, renderTorrent);
    });
  });
  
  getTorrent = function(id, callback) {
    var request = {
      'method': 'torrent-get',
      'arguments': {'ids': id, 'fields': Torrent({})['fields'].concat(Torrent({})['info_fields'])}
    };
    rpc.query(request, function(response) {
      if(callback) {
        callback(response['torrents'].map( function(row) {return Torrent(row);} )[0]);
      }
    });
  }
    
  renderTorrent = function(torrent) {
    context.partial('./templates/torrents/show.mustache', TorrentView(torrent, context), function(rendered_view) {
      $(element_selector).find('#' + torrent.id).replaceWith(rendered_view);
      trigger('torrent-refreshed', torrent);
    });    
  };
  
  getAndRenderTorrents = function() {
    var request = {
      method: 'torrent-get',
      arguments: {fields:Torrent({})['fields']}
    };
    rpc.query(request, function(response) {
      var torrents = response['torrents'].map( function(row) {return Torrent(row)} );
      trigger('torrents-refreshed', torrents);
    });    
  };
  
  torrentUploaded = function(torrent_added) {
    var message = (torrent_added) ? 'Torrent added successfully.' : 'Torrent could not be added.';
    context.trigger('flash', message);
    context.closeInfo();
    getAndRenderTorrents();
  };
  
  // TODO: find a way to put this into the appropriate helper files
  bind('torrents-refreshed', function(e, torrents) { with(this) {
    this.updateViewElements(torrents);
  }});
  
  bind('torrent-refreshed', function(e, torrent) { with(this) {
    this.updateInfo(torrent);
    this.cycleTorrents();    
  }});
}};