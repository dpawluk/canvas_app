(function() {
  /*global atob:true, Uint8Array: true, Blob: true*/

  return {
    canvas: this.$("#sketchpad")[0],
    lastMousePoint: {x:0,y:0},
    requests: {
      uploadFile: function(file) {
        return {
          url: '/api/v2/uploads.json?filename=doodle.png',
          type: 'POST',
          dataType: 'json',
          processData: false, //if we don't do this jQuery decideds to unicode shit up and we don't want that.
          contentType: 'application/binary',
          proxy_v2: true,
          data: file
        };
      },
      addToTicket: function(token) {
        var ticket_id = this.ticket().id();
        return {
          url: helpers.fmt('/api/v2/tickets/%@.json', ticket_id),
          type: 'PUT',
          dataType: 'json',
          contentType: 'application/json',
          data: JSON.stringify({ticket:{comment:{public: false, body: "attaching doodle...", uploads:[token]}}})
        };
      }
    },

    events: {
      'app.activated':'init',
      'click #clear_sketch': 'clearCanvas',
      'click #save_sketch': 'saveImage'
    },

    init: function() {
      this.switchTo('canvas');
      var canvas = this.$('#sketchpad')[0];
      
      var context = canvas.getContext('2d');

      context.strokeStyle = "#000000";
      context.lineWidth = 1;
      var lastMousePoint = {x:0, y:0};
        this.$(canvas).on('mousedown',  _.bind(function(event){
          this.onMouseDown(event);
        }, this));  

    },

    onMouseDown: function(event) {
        var canvas = this.canvas;
        console.log('mouse is down!');
        this.$(canvas).on('mousemove', _.bind(function(e){
          this.onMouseMove(e);
        }, this));

        this.$(canvas).on('mouseup', _.bind(function(e){
          this.onMouseUp(e);
        }, this));
        this.updateMousePosition(event);
    },

    onMouseMove: function(event) {
        this.updateCanvas(event);
        event.preventDefault();
        return false;
    },

    onMouseUp: function(event) {
      var canvas = this.canvas;
      this.$(canvas).off('mousemove');
      this.$(canvas).off('mouseup');
    },

    updateCanvas: function(event) {
      var canvas = this.$('#sketchpad')[0];
      
      var context = canvas.getContext('2d');
      context.beginPath();
      context.moveTo( this.lastMousePoint.x, this.lastMousePoint.y );
      this.updateMousePosition( event );
      context.lineTo( this.lastMousePoint.x, this.lastMousePoint.y );
      context.stroke();
    },

    updateMousePosition: function(event) {
      var canvas = this.canvas;
      var offset = this.$(canvas).offset();
      if(event !== undefined){
        var target = event.originalEvent;
        this.lastMousePoint.x = target.layerX;
        this.lastMousePoint.y = target.layerY;
      }
    },

    clearCanvas: function(event) {
      if(event !== undefined) event.preventDefault();
      var canvas = this.$('#sketchpad')[0];
      var context = canvas.getContext('2d');
      context.clearRect(0,0,canvas.width, canvas.height);
    },

    saveImage: function(event) {
      event.preventDefault();
      var canvas = this.$('#sketchpad')[0];
      var context = canvas.getContext('2d');
      var dataString = canvas.toDataURL("image/png");

      var base64 = dataString.split('base64,')[1];
      var byteCharacters = atob(base64);
      var byteNumbers = new Array(byteCharacters.length);
        for (var i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
      var byteArray = new Uint8Array(byteNumbers);
      var blob = new Blob([byteArray], {type: 'image/png'});
      this.ajax('uploadFile', blob).done(function(data){
        this.ajax('addToTicket', data.upload.token).done(function(){
          this.clearCanvas();
        });
      });
    }
      
  };

}());
