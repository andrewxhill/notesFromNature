// HerbariumWidget --------------------------------------

nfn.ui.model.HerbariumWidget = Backbone.Model.extend({ });

nfn.ui.view.HerbariumWidget = nfn.ui.view.Widget.extend({

  className: 'sernac-widget bar',

  events: {

    "click .btn.ok" :            "ok",
    'keypress input[type=text]': "onEnter",
    "click .step" :              "showStepTooltip",
    "click .btn.finish" :        "showFinishTooltip",
    "click .skip" :              "showSkipTooltip"

  },

  initialize: function() {

    _.bindAll( this, "toggle", "toggleOk", "onEnter", "updatePlaceholder", "updateValue", "updateType", "createStepTooltip", "closeTooltip", "closeErrorTooltip", "closeFinishTooltip", "closeStepTooltip", "gotoStep" );

    this.template = new nfn.core.Template({
      template: this.options.template
    });

    this.templates = [];

    this.templates["text"] = new nfn.core.Template({
      template: '<input type="text" placeholder="" />',
      type: 'mustache'
    });

    this.templates["location"] = new nfn.core.Template({
      template: '<input type="text" id="autocomplete" placeholder="" />',
      type: 'mustache'
    });

    this.templates["date"] = new nfn.core.Template({
      template: $("#date-input-template").html(),
      type: 'mustache'
    });

    this.add_related_model(this.model);

    this.model.bind("change:hidden",      this.toggle);
    this.model.bind("change:placeholder", this.updatePlaceholder);
    this.model.bind("change:type",        this.updateType);
    this.model.bind("change:value",       this.updateValue);

    this.model.bind("change:draggable",     this.toggleDraggable);
    this.model.bind("change:resizable",     this.toggleResizable);
    this.model.bind("change:ok_enabled",  this.toggleOk);

    this.parent = this.options.parent;

  },

  skip: function(e) {

    e && e.preventDefault();
    e && e.stopImmediatePropagation();

    this.closeTooltip();               // TODO: add test
    this.parent.helper.closeTooltip(); // TODO: add test

    this.clearInput();
    this.parent.nextStep();

  },

  onEnter: function(e) {
    if (e.keyCode != 13) return;

    this.ok();
  },

  ok: function(e) {

    e && e.preventDefault();
    e && e.stopImmediatePropagation();

    GOD.triggerCallbacks(); // this close the tooltips (TODO: add test)

    if (this.$input.val()) { // don't store or advance when the input field is empty

      this.parent.saveCurrentStep();

      this.clearInput();

      // Shall we go to the next record ord the next step?
      if (this.parent.getPendingFieldCount() == 0) {

        this.parent.finish();

      } else {

        this.parent.nextStep();

      }

    } else {

      this.showErrorTooltip("Empty field", "Please, write a value or use the skip field option below");

    }

  },

  toggleOk: function() {

    if (this.model.get("ok_enabled")) {

      this.$okButton.removeClass("disabled");

    } else {

      this.$okButton.addClass("disabled");

    }

  },

  enableOk: function(callback) {
    this.model.set("ok_enabled", true);

    callback && callback();

    return this;
  },

  disableOk: function(callback) {
    this.model.set("ok_enabled", false);

    callback && callback();

    return this;
  },

  gotoStep: function(e, i) {

    e && e.preventDefault();
    e && e.stopImmediatePropagation();

    this.closeStepTooltip();
    this.parent.model.set("currentStep", i);

    this.clearInput();
    this.focus();

  },

  showErrorTooltip: function(title, description) {

    this.closeTooltips();

    if (!this.errorTooltip) this.createErrorTooltip(title, description);

  },

  closeErrorTooltip: function(callback) {

    var that = this;

    if (!this.errorTooltip) return;

    this.errorTooltip.hide();
    this.errorTooltip.clean();
    delete this.errorTooltip;

    this.$errorIndicator.fadeOut(100, function() {
      that.$okButton.fadeIn(100);
    });

    callback && callback();

  },

  createErrorTooltip: function(title, description) {

    var
    main        = "Finish",
    secondary   = "Cancel";

    this.errorTooltip = new nfn.ui.view.Tooltip({

      className: "tooltip error",

      model: new nfn.ui.model.Tooltip({
        template: $("#tooltip-error-template").html(),
        title: title,
        description: description
      })

    });

    this.addView(this.errorTooltip);

    var that = this;

    this.errorTooltip.bind("onEscKey",         this.closeErrorTooltip);
    this.errorTooltip.bind("onSecondaryClick", this.closeErrorTooltip);
    this.errorTooltip.bind("onMainClick",      function() {

      that.closeErrorTooltip(function() {
        //that.finish();
      })

    });

    this.$okButton.fadeOut(100, function() {
      that.$errorIndicator.fadeIn(100);
    });

    this.$el.append(this.errorTooltip.render());

    this.errorTooltip.show();

    var
    $element    = this.$okButton,
    targetWidth = $element.width()/2,
    marginRight = 8,
    x           = Math.abs(this.$el.offset().left - $element.offset().left) - this.errorTooltip.width() / 2 + targetWidth - marginRight,
    y           = Math.abs(this.$el.offset().top  - $element.offset().top)  - this.errorTooltip.height() - 40

    this.errorTooltip.setPosition(x, y);
    GOD.add(this.errorTooltip, this.closeErrorTooltip);

  },

  showSkipTooltip: function(e) {

    e && e.preventDefault();
    e && e.stopImmediatePropagation();

    this.closeTooltips();

    if (!this.tooltip) this.createTooltip(e);

  },

  createTooltip: function(e) {

    var
    title       = "Are you sure?",
    description = "If you can’t find the value, you can see <a href='#'>examples</a> that surely will help you",
    main        = "Skip field",
    secondary   = "Cancel";

    this.tooltip = new nfn.ui.view.Tooltip({
      model: new nfn.ui.model.Tooltip({ title: title, description: description, main: main, secondary: secondary })
    });

    this.addView(this.tooltip);

    var that = this;

    this.tooltip.bind("onEscKey",         this.closeTooltip);
    this.tooltip.bind("onSecondaryClick", this.closeTooltip);
    this.tooltip.bind("onMainClick",      function() {

      that.closeTooltip(function() {
        that.skip();
      })

    });

    this.$el.append(this.tooltip.render());
    this.tooltip.show();

    var
    targetWidth   = $(e.target).width()/2,
    marginRight = parseInt($(e.target).css("margin-right").replace("px", ""), 10),
    x           = Math.abs(this.$el.offset().left - $(e.target).offset().left) - this.tooltip.width() / 2 + targetWidth - marginRight,
    y           = Math.abs(this.$el.offset().top  - $(e.target).offset().top)  - this.tooltip.height() - 40

    this.tooltip.setPosition(x, y);
    GOD.add(this.tooltip, this.closeTooltip);

  },

  closeTooltip: function(callback) {

    if (!this.tooltip) return;

    this.tooltip.hide();
    this.tooltip.clean();
    delete this.tooltip;

    callback && callback();

  },

  showStepTooltip: function(e) {

    e && e.preventDefault();
    e && e.stopImmediatePropagation();

    this.closeTooltips();

    if (!this.stepTooltip) this.createStepTooltip(e);

  },

  createStepTooltip: function(e) {

    var
    title       = "Are you sure?",
    description = "There are still <u> " + this.parent.getPendingFieldCount() + " empty fields</u> for this record that should be completed before finishing.",
    main        = "Finish",
    secondary   = "Cancel";

    this.stepTooltip = new nfn.ui.view.Tooltip({

      className: "tooltip step",

      model: new nfn.ui.model.Tooltip({
        template: $("#tooltip-step-template").html(),
        links: this.parent.guide
      })

    });

    this.addView(this.stepTooltip);

    var that = this;

    this.stepTooltip.bind("onEscKey", this.closeStepTooltip);

    this.$el.append(this.stepTooltip.render());
    this.stepTooltip.show();

    var
    $target     = this.$step,
    targetWidth = $target.width()/2,
    marginRight = parseInt($target.css("margin-right").replace("px", ""), 10),
    x           = Math.abs(this.$el.offset().left - $target.offset().left) - this.stepTooltip.width() + 30,
    y           = Math.abs(this.$el.offset().top  - $target.offset().top)  - this.stepTooltip.height() - 17

    this.stepTooltip.setPosition(x, y);

    this.parent.transcriptions.each(function(transcription) {

      if (transcription.get("value")) {
        that.stepTooltip.$el.find("li:nth-child(" + (transcription.get("step") + 1) + ")").addClass("completed");
      }

    });

    var currentStep = this.parent.model.get("currentStep");

    this.stepTooltip.$el.find("a").on("click", function(e) {
      var i = $(this).parent().index();
      that.gotoStep(e, i);
    });


    GOD.add(this.stepTooltip, this.closeStepTooltip);

  },

  closeStepTooltip: function(callback) {

    if (!this.stepTooltip) return;

    this.stepTooltip.hide();
    this.stepTooltip.clean();
    delete this.stepTooltip;

    this.focus();

    callback && callback();

  },

  showFinishTooltip: function(e) {

    e && e.preventDefault();
    e && e.stopImmediatePropagation();

    this.closeTooltips();

    if (!this.finishTooltip) this.createFinishTooltip(e);

  },

  closeTooltips: function() {

    GOD.triggerCallbacks();

  },

  createFinishTooltip: function(e) {

    var
    title       = "Are you sure?",
    description = "There are still <a href='#'> " + this.parent.getPendingFieldCount() + " empty fields</a> for this record that should be completed before finishing.",
    main        = "Finish",
    secondary   = "Cancel";

    this.finishTooltip = new nfn.ui.view.Tooltip({
      model: new nfn.ui.model.Tooltip({
        title: title,
        description: description,
        main: main,
        secondary: secondary
      })

    });

    this.addView(this.finishTooltip);

    var that = this;

    this.finishTooltip.bind("onEscKey",         this.closeFinishTooltip);
    this.finishTooltip.bind("onSecondaryClick", this.closeFinishTooltip);
    this.finishTooltip.bind("onMainClick",      function() {

      that.closeFinishTooltip(function() {
        that.finish();
      })

    });

    this.$el.append(this.finishTooltip.render());
    this.finishTooltip.show();

    this.finishTooltip.$el.find(".description > a").on("click", function(e) {
      e.preventDefault();
      e.stopPropagation();

      that.showStepTooltip();

    });

    var
    $target     = this.$finishButton,
    targetWidth = $target.width()/2,
    marginRight = parseInt($target.css("margin-right").replace("px", ""), 10),
    x           = Math.abs(this.$el.offset().left - $target.offset().left) - this.finishTooltip.width() / 2 + targetWidth - marginRight,
    y           = Math.abs(this.$el.offset().top  - $target.offset().top)  - this.finishTooltip.height() - 40

    this.finishTooltip.setPosition(x, y);
    GOD.add(this.finishTooltip, this.closeFinishTooltip);

  },

  closeFinishTooltip: function(callback) {

    if (!this.finishTooltip) return;

    this.finishTooltip.hide();
    this.finishTooltip.clean();
    delete this.finishTooltip;

    callback && callback();

  },

  finish: function(e) {

    e && e.preventDefault();
    e && e.stopImmediatePropagation();

    this.clearInput();
    this.parent.finish();

  },

  clearInput: function() {

    this.$input.val("");

  },

  resize: function() {

    var that = this;

    var type  = this.model.get("type");
    var width = this.model.get("inputWidth");

    // Centers the widget horizontally and resizes the input field
    if ( type == 'text' || type == 'location' ) {

      if (this.$input.parent().width() > width - 300) {

        this.$input.parent().animate({ width: width - 300  }, 200, function() {
          that.$input.width(width - 300 - 40);
          that.animate({ width: width, marginLeft: -1*width/2, left: "50%" }, true);
        });

      } else {

        this.animate({ width: width, marginLeft: -1*width/2, left: "50%" }, true);
        this.$input.parent().delay(50).animate({ width: width - 300  }, 200);
        this.$input.width(width - 300 - 40);

      }
    } else if ( type == 'date' ) {

      if ($(".input_field.date").width() > width - 290) {

        this.animate({ width: width, marginLeft: -1*width/2, left: "50%" }, true, function() {
          $(".input_field.date").delay(50).animate({ width: width - 290  }, 150);
        });

      } else {

        console.log('b');
        this.animate({ width: width, marginLeft: -1*width/2, left: "50%" }, true);
        $(".input_field.date").delay(50).animate({ width: width - 290  }, 150);


      }

    }

  },

  getValue: function() {
    var type = this.model.get("type");

    if ( type == 'text' || type == 'location' ) {

      return this.$input.val();

    } else if ( type == 'date') {

      var month = this.$el.find(".month").val();
      var day   = this.$el.find(".day").val();
      var year  = this.$el.find(".year").val();

      if (month && day && year) {
        return month + "/" + day + "/" + year;
      } else {
        return "";
      }

    }

  },

  updatePlaceholder: function() {

    var type = this.model.get("type");

    if ( type == 'text' || type == 'location' ) {

      this.$input.attr("placeholder", this.model.get("placeholder"));

    } else if ( type == 'date' ) {

      var placeholders = this.model.get("placeholder");

      this.$input.find(".day").attr("placeholder", placeholders[0]);
      this.$input.find(".month").attr("placeholder", placeholders[1]);
      this.$input.find(".year").attr("placeholder", placeholders[2]);

    }

    this.resize();
    this.focus();

  },

  focus: function() {

    var type = this.model.get("type");

    if ( type == 'text' || type == 'location' ) {

      this.$input.focus();

    } else if ( type == 'date' ) {

      this.$input[0].focus();

    }

  },

  updateValue: function() {

    this.$input.val("");

    var
    value = this.model.get("value"),
    type  = this.model.get("type");

    if ( type == 'text' || type == 'location' ) {

      this.$input.val(value);

    } else if ( type == 'date' ) {

      var date = value.split("/");

      var month = date[0];
      var day   = date[1];
      var year  = date[2];

      var month = this.$el.find(".month").val(month);
      var day   = this.$el.find(".day").val(day);
      var year  = this.$el.find(".year").val(year);

    }

  },

  updateType: function() {

    var type = this.model.get("type");

    this.$el.find(".input_field").removeClass("text");
    this.$el.find(".input_field").removeClass("date");
    this.$el.find(".input_field").removeClass("location");
    this.$el.find(".input_field").addClass(type);

    if ( type == 'text' ) {

      this.$el.find(".input_field input").remove();
      this.$el.find(".input_field .date_field").remove();

      this.$el.find(".input_field").append( this.templates[type].render() );
      this.$input = this.$el.find('.input_field input');

    } else if ( type == 'location' ) {

      this.$el.find(".input_field input").remove();
      this.$el.find(".input_field .date_field").remove();

      this.$el.find(".input_field").append( this.templates[type].render() );
      this.$input = this.$el.find('.input_field input');

      this.$input.addresspicker();

    } else if ( type == 'date' ) {

      this.$el.find(".input_field input").remove();
      this.$el.find(".input_field").append( this.templates[type].render() );
      this.$input = this.$el.find('.input_field input');

    }

  },

  render: function() {

    this.$el.append(this.template.render());

    this.$errorIndicator  = this.$el.find(".error");
    this.$okButton        = this.$el.find(".btn.ok");
    this.$skip            = this.$el.find(".skip");
    this.$finishButton    = this.$el.find(".btn.finish");
    this.$step            = this.$el.find(".step");
    this.$input           = this.$el.find('.input_field input[type="text"]');

    return this.$el;

  }

});


