// Generated by CoffeeScript 1.8.0
(function() {
  var Promise, checkEquals, root, splitArgs,
    __slice = [].slice;

  root = typeof exports !== "undefined" && exports !== null ? exports : this;

  root.WsFarcall = (function() {
    WsFarcall.open = function(url) {
      return new WsFarcall(url);
    };

    function WsFarcall(url) {
      this.url = url;
      this.in_serial = 0;
      this.out_serial = 0;
      this.openHandlers = [];
      this.closeHandlers = [];
      this.ws = new WebSocket(this.url);
      this.connected = false;
      this.promises = {};
      this.commandHandlers = {};
      this.ws.onopen = (function(_this) {
        return function() {
          var cb, _i, _len, _ref, _results;
          _this.connected = true;
          _ref = _this.openHandlers;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            cb = _ref[_i];
            _results.push(cb(_this));
          }
          return _results;
        };
      })(this);
      this.ws.onclose = (function(_this) {
        return function() {
          var cb, _i, _len, _ref, _results;
          _this.connected = false;
          _ref = _this.closeHandlers;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            cb = _ref[_i];
            _results.push(cb(_this));
          }
          return _results;
        };
      })(this);
      this.ws.onmessage = (function(_this) {
        return function(message) {
          _this.trace && console.log(">>> " + message.data);
          return _this._receive(JSON.parse(message.data));
        };
      })(this);
    }

    WsFarcall.prototype.onopen = function(callback) {
      return this.openHandlers.push(callback);
    };

    WsFarcall.prototype.onclose = function(callback) {
      return this.closeHandlers.push(callback);
    };

    WsFarcall.prototype.close = function() {
      return this.ws.close();
    };

    WsFarcall.prototype.call = function() {
      var args, kwargs, name, promise, _ref;
      name = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      _ref = splitArgs(args), args = _ref[0], kwargs = _ref[1];
      promise = this.promises[this.out_serial] = new Promise();
      this._send({
        cmd: name,
        args: args,
        kwargs: kwargs
      });
      return promise;
    };

    WsFarcall.prototype.on = function(name, callback) {
      return this.commandHandlers[name] = callback;
    };

    WsFarcall.prototype._receive = function(data) {
      var promise;
      if (data.serial !== this.in_serial++) {
        console.error("farcall framing error");
        return this.close();
      } else {
        if (data.ref !== void 0) {
          promise = this.promises[data.ref];
          delete this.promises[data.ref];
          if (data.error === void 0) {
            return promise.setDone(data.result);
          } else {
            return promise.setFail(data.error);
          }
        } else {
          return this._processCall(data);
        }
      }
    };

    WsFarcall.prototype._send = function(params) {
      params.serial = this.out_serial++;
      params = JSON.stringify(params);
      this.trace && console.log("<<< " + params);
      return this.ws.send(params);
    };

    WsFarcall.prototype._processCall = function(data) {
      var e, handler;
      handler = this.commandHandlers[data.cmd];
      if (handler) {
        try {
          data.args.push(data.kwargs);
          return this._send({
            ref: data.serial,
            result: handler.apply(null, data.args)
          });
        } catch (_error) {
          e = _error;
          return this._send({
            ref: data.serial,
            error: {
              "class": 'RuntimeError',
              text: e.message
            }
          });
        }
      } else {
        return this._send({
          ref: data.serial,
          error: {
            "class": 'NoMethodError',
            text: "method not found: " + data.cmd
          }
        });
      }
    };

    WsFarcall.selfTest = function(url, callback) {
      var cb, cbr, done, p1, p2, p3;
      if (typeof _ !== "undefined" && _ !== null ? _.isEqual(1, 1) : void 0) {
        p1 = false;
        p2 = false;
        p3 = false;
        cb = false;
        cbr = false;
        done = false;
        WsFarcall.open(url + '/fartest').onopen(function(fcall) {
          fcall.call('ping', 1, 2, 3, {
            hello: 'world'
          }).done(function(data) {
            return p1 = checkEquals(data, {
              pong: [
                1, 2, 3, {
                  hello: 'world'
                }
              ]
            });
          });
          fcall.call('ping', 2, 2, 3, {
            hello: 'world'
          }).done(function(data) {
            return p2 = checkEquals(data, {
              pong: [
                2, 2, 3, {
                  hello: 'world'
                }
              ]
            });
          });
          fcall.call('ping', 3, 2, 3, {
            hello: 'world'
          }).done(function(data) {
            return p3 = checkEquals(data, {
              pong: [
                3, 2, 3, {
                  hello: 'world'
                }
              ]
            });
          });
          fcall.on('test_callback', function() {
            var args;
            args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
            cb = checkEquals(args, [
              5, 4, 3, {
                hello: 'world'
              }
            ]);
            return setTimeout(function() {
              var ok, text;
              done = true;
              ok = p1 && p2 && p3 && cb && cbr;
              text = (function() {
                switch (false) {
                  case !!cb:
                    return 'callback was not called or wrong data';
                  case !!cbr:
                    return 'callback request did not return';
                  default:
                    if (ok) {
                      return '';
                    } else {
                      return 'ping data wrong';
                    }
                }
              })();
              return callback(ok, text);
            }, 80);
          });
          return fcall.call('callback', 'test_callback', 5, 4, 3, {
            hello: 'world'
          }).done(function(data) {
            return cbr = true;
          });
        });
        return setTimeout(function() {
          if (!done) {
            return callback(false, 'timed out');
          }
        }, 5000);
      } else {
        return callback(false, "Can't test: need underscpre.js");
      }
    };

    return WsFarcall;

  })();

  root.WsFarcall.Promise = Promise = (function() {
    function Promise() {
      var i, _ref;
      _ref = (function() {
        var _i, _results;
        _results = [];
        for (i = _i = 1; _i <= 3; i = ++_i) {
          _results.push([]);
        }
        return _results;
      })(), this.done_handlers = _ref[0], this.fail_handlers = _ref[1], this.always_handlers = _ref[2];
      this.state = null;
      this.data = this.error = void 0;
    }

    Promise.prototype.done = function(callback) {
      if (this.state) {
        if (this.state === 'done') {
          callback(this.data);
        }
      } else {
        this.done_handlers.push(callback);
      }
      return this;
    };

    Promise.prototype.success = function(callback) {
      return this.done(callback);
    };

    Promise.prototype.fail = function(callback) {
      if (this.state) {
        if (this.state === 'fail') {
          callback(this.error);
        }
      } else {
        this.fail_handlers.push(callback);
      }
      return this;
    };

    Promise.prototype.always = function(callback) {
      if (this.state) {
        callback({
          data: this.data,
          error: this.error
        });
      } else {
        this.always_handlers.push(callback);
      }
      return this;
    };

    Promise.prototype.setSuccess = function(data) {
      var cb, _i, _len, _ref;
      if (!this.state) {
        this.state = 'done';
        this.data = data;
        _ref = this.done_handlers;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          cb = _ref[_i];
          cb(data);
        }
        this.done = null;
        this._fireAlways();
      }
      return this;
    };

    Promise.prototype.setDone = function(data) {
      return this.setSuccess(data);
    };

    Promise.prototype.setFail = function(error) {
      var cb, _i, _len, _ref;
      if (!this.state) {
        this.state = 'fail';
        this.error = error;
        _ref = this.fail_handlers;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          cb = _ref[_i];
          cb(error);
        }
        this.fail = null;
        this._fireAlways();
      }
      return this;
    };

    Promise.prototype.isSuccess = function() {
      return this.state === 'done';
    };

    Promise.prototype.isFail = function() {
      return this.state === 'fail';
    };

    Promise.prototype.isError = function() {
      return this.state === 'fail';
    };

    Promise.prototype.isCompleted = function() {
      return !!this.state;
    };

    Promise.prototype._fireAlways = function() {
      var cb, _i, _len, _ref;
      _ref = this.always_handlers;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        cb = _ref[_i];
        cb({
          error: this.error,
          data: this.data
        });
      }
      return this.always = null;
    };

    return Promise;

  })();

  splitArgs = function(args) {
    var last;
    last = args[args.length - 1];
    if (typeof last === 'object') {
      return [args.slice(0, -1), last];
    } else {
      return [args, {}];
    }
  };

  checkEquals = function(a, b, text) {
    if (_.isEqual(a, b)) {
      return true;
    } else {
      console.error("" + (text != null ? text : 'ERROR') + ": not equal:");
      console.error("expected: " + (JSON.stringify(b)));
      console.error("got:      " + (JSON.stringify(a)));
      return false;
    }
  };

}).call(this);
