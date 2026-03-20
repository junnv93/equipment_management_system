(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([
  typeof document === 'object' ? document.currentScript : undefined,
  '[project]/node_modules/tslib/tslib.es6.mjs [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      '__addDisposableResource',
      () => __addDisposableResource,
      '__assign',
      () => __assign,
      '__asyncDelegator',
      () => __asyncDelegator,
      '__asyncGenerator',
      () => __asyncGenerator,
      '__asyncValues',
      () => __asyncValues,
      '__await',
      () => __await,
      '__awaiter',
      () => __awaiter,
      '__classPrivateFieldGet',
      () => __classPrivateFieldGet,
      '__classPrivateFieldIn',
      () => __classPrivateFieldIn,
      '__classPrivateFieldSet',
      () => __classPrivateFieldSet,
      '__createBinding',
      () => __createBinding,
      '__decorate',
      () => __decorate,
      '__disposeResources',
      () => __disposeResources,
      '__esDecorate',
      () => __esDecorate,
      '__exportStar',
      () => __exportStar,
      '__extends',
      () => __extends,
      '__generator',
      () => __generator,
      '__importDefault',
      () => __importDefault,
      '__importStar',
      () => __importStar,
      '__makeTemplateObject',
      () => __makeTemplateObject,
      '__metadata',
      () => __metadata,
      '__param',
      () => __param,
      '__propKey',
      () => __propKey,
      '__read',
      () => __read,
      '__rest',
      () => __rest,
      '__rewriteRelativeImportExtension',
      () => __rewriteRelativeImportExtension,
      '__runInitializers',
      () => __runInitializers,
      '__setFunctionName',
      () => __setFunctionName,
      '__spread',
      () => __spread,
      '__spreadArray',
      () => __spreadArray,
      '__spreadArrays',
      () => __spreadArrays,
      '__values',
      () => __values,
      'default',
      () => __TURBOPACK__default__export__,
    ]);
    /******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */ /* global Reflect, Promise, SuppressedError, Symbol, Iterator */ var extendStatics =
      function (d, b) {
        extendStatics =
          Object.setPrototypeOf ||
          ({
            __proto__: [],
          } instanceof Array &&
            function (d, b) {
              d.__proto__ = b;
            }) ||
          function (d, b) {
            for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
          };
        return extendStatics(d, b);
      };
    function __extends(d, b) {
      if (typeof b !== 'function' && b !== null)
        throw new TypeError('Class extends value ' + String(b) + ' is not a constructor or null');
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : ((__.prototype = b.prototype), new __());
    }
    var __assign = function () {
      __assign =
        Object.assign ||
        function __assign(t) {
          for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
          }
          return t;
        };
      return __assign.apply(this, arguments);
    };
    function __rest(s, e) {
      var t = {};
      for (var p in s)
        if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
      if (s != null && typeof Object.getOwnPropertySymbols === 'function')
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
          if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
            t[p[i]] = s[p[i]];
        }
      return t;
    }
    function __decorate(decorators, target, key, desc) {
      var c = arguments.length,
        r =
          c < 3
            ? target
            : desc === null
              ? (desc = Object.getOwnPropertyDescriptor(target, key))
              : desc,
        d;
      if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
        r = Reflect.decorate(decorators, target, key, desc);
      else
        for (var i = decorators.length - 1; i >= 0; i--)
          if ((d = decorators[i]))
            r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function __param(paramIndex, decorator) {
      return function (target, key) {
        decorator(target, key, paramIndex);
      };
    }
    function __esDecorate(
      ctor,
      descriptorIn,
      decorators,
      contextIn,
      initializers,
      extraInitializers
    ) {
      function accept(f) {
        if (f !== void 0 && typeof f !== 'function') throw new TypeError('Function expected');
        return f;
      }
      var kind = contextIn.kind,
        key = kind === 'getter' ? 'get' : kind === 'setter' ? 'set' : 'value';
      var target = !descriptorIn && ctor ? (contextIn['static'] ? ctor : ctor.prototype) : null;
      var descriptor =
        descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
      var _,
        done = false;
      for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === 'access' ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) {
          if (done) throw new TypeError('Cannot add initializers after decoration has completed');
          extraInitializers.push(accept(f || null));
        };
        var result = (0, decorators[i])(
          kind === 'accessor'
            ? {
                get: descriptor.get,
                set: descriptor.set,
              }
            : descriptor[key],
          context
        );
        if (kind === 'accessor') {
          if (result === void 0) continue;
          if (result === null || typeof result !== 'object') throw new TypeError('Object expected');
          if ((_ = accept(result.get))) descriptor.get = _;
          if ((_ = accept(result.set))) descriptor.set = _;
          if ((_ = accept(result.init))) initializers.unshift(_);
        } else if ((_ = accept(result))) {
          if (kind === 'field') initializers.unshift(_);
          else descriptor[key] = _;
        }
      }
      if (target) Object.defineProperty(target, contextIn.name, descriptor);
      done = true;
    }
    function __runInitializers(thisArg, initializers, value) {
      var useValue = arguments.length > 2;
      for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
      }
      return useValue ? value : void 0;
    }
    function __propKey(x) {
      return typeof x === 'symbol' ? x : ''.concat(x);
    }
    function __setFunctionName(f, name, prefix) {
      if (typeof name === 'symbol')
        name = name.description ? '['.concat(name.description, ']') : '';
      return Object.defineProperty(f, 'name', {
        configurable: true,
        value: prefix ? ''.concat(prefix, ' ', name) : name,
      });
    }
    function __metadata(metadataKey, metadataValue) {
      if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function')
        return Reflect.metadata(metadataKey, metadataValue);
    }
    function __awaiter(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P
          ? value
          : new P(function (resolve) {
              resolve(value);
            });
      }
      return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator['throw'](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    }
    function __generator(thisArg, body) {
      var _ = {
          label: 0,
          sent: function () {
            if (t[0] & 1) throw t[1];
            return t[1];
          },
          trys: [],
          ops: [],
        },
        f,
        y,
        t,
        g = Object.create((typeof Iterator === 'function' ? Iterator : Object).prototype);
      return (
        (g.next = verb(0)),
        (g['throw'] = verb(1)),
        (g['return'] = verb(2)),
        typeof Symbol === 'function' &&
          (g[Symbol.iterator] = function () {
            return this;
          }),
        g
      );
      //TURBOPACK unreachable
      function verb(n) {
        return function (v) {
          return step([n, v]);
        };
      }
      function step(op) {
        if (f) throw new TypeError('Generator is already executing.');
        while ((g && ((g = 0), op[0] && (_ = 0)), _))
          try {
            if (
              ((f = 1),
              y &&
                (t =
                  op[0] & 2
                    ? y['return']
                    : op[0]
                      ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                      : y.next) &&
                !(t = t.call(y, op[1])).done)
            )
              return t;
            if (((y = 0), t)) op = [op[0] & 2, t.value];
            switch (op[0]) {
              case 0:
              case 1:
                t = op;
                break;
              case 4:
                _.label++;
                return {
                  value: op[1],
                  done: false,
                };
              case 5:
                _.label++;
                y = op[1];
                op = [0];
                continue;
              case 7:
                op = _.ops.pop();
                _.trys.pop();
                continue;
              default:
                if (
                  !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                  (op[0] === 6 || op[0] === 2)
                ) {
                  _ = 0;
                  continue;
                }
                if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                  _.label = op[1];
                  break;
                }
                if (op[0] === 6 && _.label < t[1]) {
                  _.label = t[1];
                  t = op;
                  break;
                }
                if (t && _.label < t[2]) {
                  _.label = t[2];
                  _.ops.push(op);
                  break;
                }
                if (t[2]) _.ops.pop();
                _.trys.pop();
                continue;
            }
            op = body.call(thisArg, _);
          } catch (e) {
            op = [6, e];
            y = 0;
          } finally {
            f = t = 0;
          }
        if (op[0] & 5) throw op[1];
        return {
          value: op[0] ? op[1] : void 0,
          done: true,
        };
      }
    }
    var __createBinding = Object.create
      ? function (o, m, k, k2) {
          if (k2 === undefined) k2 = k;
          var desc = Object.getOwnPropertyDescriptor(m, k);
          if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
            desc = {
              enumerable: true,
              get: function () {
                return m[k];
              },
            };
          }
          Object.defineProperty(o, k2, desc);
        }
      : function (o, m, k, k2) {
          if (k2 === undefined) k2 = k;
          o[k2] = m[k];
        };
    function __exportStar(m, o) {
      for (var p in m)
        if (p !== 'default' && !Object.prototype.hasOwnProperty.call(o, p))
          __createBinding(o, m, p);
    }
    function __values(o) {
      var s = typeof Symbol === 'function' && Symbol.iterator,
        m = s && o[s],
        i = 0;
      if (m) return m.call(o);
      if (o && typeof o.length === 'number')
        return {
          next: function () {
            if (o && i >= o.length) o = void 0;
            return {
              value: o && o[i++],
              done: !o,
            };
          },
        };
      throw new TypeError(s ? 'Object is not iterable.' : 'Symbol.iterator is not defined.');
    }
    function __read(o, n) {
      var m = typeof Symbol === 'function' && o[Symbol.iterator];
      if (!m) return o;
      var i = m.call(o),
        r,
        ar = [],
        e;
      try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
      } catch (error) {
        e = {
          error: error,
        };
      } finally {
        try {
          if (r && !r.done && (m = i['return'])) m.call(i);
        } finally {
          if (e) throw e.error;
        }
      }
      return ar;
    }
    function __spread() {
      for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
      return ar;
    }
    function __spreadArrays() {
      for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
      for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++) r[k] = a[j];
      return r;
    }
    function __spreadArray(to, from, pack) {
      if (pack || arguments.length === 2)
        for (var i = 0, l = from.length, ar; i < l; i++) {
          if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
          }
        }
      return to.concat(ar || Array.prototype.slice.call(from));
    }
    function __await(v) {
      return this instanceof __await ? ((this.v = v), this) : new __await(v);
    }
    function __asyncGenerator(thisArg, _arguments, generator) {
      if (!Symbol.asyncIterator) throw new TypeError('Symbol.asyncIterator is not defined.');
      var g = generator.apply(thisArg, _arguments || []),
        i,
        q = [];
      return (
        (i = Object.create(
          (typeof AsyncIterator === 'function' ? AsyncIterator : Object).prototype
        )),
        verb('next'),
        verb('throw'),
        verb('return', awaitReturn),
        (i[Symbol.asyncIterator] = function () {
          return this;
        }),
        i
      );
      //TURBOPACK unreachable
      function awaitReturn(f) {
        return function (v) {
          return Promise.resolve(v).then(f, reject);
        };
      }
      function verb(n, f) {
        if (g[n]) {
          i[n] = function (v) {
            return new Promise(function (a, b) {
              q.push([n, v, a, b]) > 1 || resume(n, v);
            });
          };
          if (f) i[n] = f(i[n]);
        }
      }
      function resume(n, v) {
        try {
          step(g[n](v));
        } catch (e) {
          settle(q[0][3], e);
        }
      }
      function step(r) {
        r.value instanceof __await
          ? Promise.resolve(r.value.v).then(fulfill, reject)
          : settle(q[0][2], r);
      }
      function fulfill(value) {
        resume('next', value);
      }
      function reject(value) {
        resume('throw', value);
      }
      function settle(f, v) {
        if ((f(v), q.shift(), q.length)) resume(q[0][0], q[0][1]);
      }
    }
    function __asyncDelegator(o) {
      var i, p;
      return (
        (i = {}),
        verb('next'),
        verb('throw', function (e) {
          throw e;
        }),
        verb('return'),
        (i[Symbol.iterator] = function () {
          return this;
        }),
        i
      );
      //TURBOPACK unreachable
      function verb(n, f) {
        i[n] = o[n]
          ? function (v) {
              return (p = !p)
                ? {
                    value: __await(o[n](v)),
                    done: false,
                  }
                : f
                  ? f(v)
                  : v;
            }
          : f;
      }
    }
    function __asyncValues(o) {
      if (!Symbol.asyncIterator) throw new TypeError('Symbol.asyncIterator is not defined.');
      var m = o[Symbol.asyncIterator],
        i;
      return m
        ? m.call(o)
        : ((o = typeof __values === 'function' ? __values(o) : o[Symbol.iterator]()),
          (i = {}),
          verb('next'),
          verb('throw'),
          verb('return'),
          (i[Symbol.asyncIterator] = function () {
            return this;
          }),
          i);
      //TURBOPACK unreachable
      function verb(n) {
        i[n] =
          o[n] &&
          function (v) {
            return new Promise(function (resolve, reject) {
              (v = o[n](v)), settle(resolve, reject, v.done, v.value);
            });
          };
      }
      function settle(resolve, reject, d, v) {
        Promise.resolve(v).then(function (v) {
          resolve({
            value: v,
            done: d,
          });
        }, reject);
      }
    }
    function __makeTemplateObject(cooked, raw) {
      if (Object.defineProperty) {
        Object.defineProperty(cooked, 'raw', {
          value: raw,
        });
      } else {
        cooked.raw = raw;
      }
      return cooked;
    }
    var __setModuleDefault = Object.create
      ? function (o, v) {
          Object.defineProperty(o, 'default', {
            enumerable: true,
            value: v,
          });
        }
      : function (o, v) {
          o['default'] = v;
        };
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    function __importStar(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== 'default') __createBinding(result, mod, k[i]);
      }
      __setModuleDefault(result, mod);
      return result;
    }
    function __importDefault(mod) {
      return mod && mod.__esModule
        ? mod
        : {
            default: mod,
          };
    }
    function __classPrivateFieldGet(receiver, state, kind, f) {
      if (kind === 'a' && !f) throw new TypeError('Private accessor was defined without a getter');
      if (typeof state === 'function' ? receiver !== state || !f : !state.has(receiver))
        throw new TypeError(
          'Cannot read private member from an object whose class did not declare it'
        );
      return kind === 'm' ? f : kind === 'a' ? f.call(receiver) : f ? f.value : state.get(receiver);
    }
    function __classPrivateFieldSet(receiver, state, value, kind, f) {
      if (kind === 'm') throw new TypeError('Private method is not writable');
      if (kind === 'a' && !f) throw new TypeError('Private accessor was defined without a setter');
      if (typeof state === 'function' ? receiver !== state || !f : !state.has(receiver))
        throw new TypeError(
          'Cannot write private member to an object whose class did not declare it'
        );
      return (
        kind === 'a' ? f.call(receiver, value) : f ? (f.value = value) : state.set(receiver, value),
        value
      );
    }
    function __classPrivateFieldIn(state, receiver) {
      if (receiver === null || (typeof receiver !== 'object' && typeof receiver !== 'function'))
        throw new TypeError("Cannot use 'in' operator on non-object");
      return typeof state === 'function' ? receiver === state : state.has(receiver);
    }
    function __addDisposableResource(env, value, async) {
      if (value !== null && value !== void 0) {
        if (typeof value !== 'object' && typeof value !== 'function')
          throw new TypeError('Object expected.');
        var dispose, inner;
        if (async) {
          if (!Symbol.asyncDispose) throw new TypeError('Symbol.asyncDispose is not defined.');
          dispose = value[Symbol.asyncDispose];
        }
        if (dispose === void 0) {
          if (!Symbol.dispose) throw new TypeError('Symbol.dispose is not defined.');
          dispose = value[Symbol.dispose];
          if (async) inner = dispose;
        }
        if (typeof dispose !== 'function') throw new TypeError('Object not disposable.');
        if (inner)
          dispose = function () {
            try {
              inner.call(this);
            } catch (e) {
              return Promise.reject(e);
            }
          };
        env.stack.push({
          value: value,
          dispose: dispose,
          async: async,
        });
      } else if (async) {
        env.stack.push({
          async: true,
        });
      }
      return value;
    }
    var _SuppressedError =
      typeof SuppressedError === 'function'
        ? SuppressedError
        : function (error, suppressed, message) {
            var e = new Error(message);
            return (e.name = 'SuppressedError'), (e.error = error), (e.suppressed = suppressed), e;
          };
    function __disposeResources(env) {
      function fail(e) {
        env.error = env.hasError
          ? new _SuppressedError(e, env.error, 'An error was suppressed during disposal.')
          : e;
        env.hasError = true;
      }
      var r,
        s = 0;
      function next() {
        while ((r = env.stack.pop())) {
          try {
            if (!r.async && s === 1)
              return (s = 0), env.stack.push(r), Promise.resolve().then(next);
            if (r.dispose) {
              var result = r.dispose.call(r.value);
              if (r.async)
                return (
                  (s |= 2),
                  Promise.resolve(result).then(next, function (e) {
                    fail(e);
                    return next();
                  })
                );
            } else s |= 1;
          } catch (e) {
            fail(e);
          }
        }
        if (s === 1) return env.hasError ? Promise.reject(env.error) : Promise.resolve();
        if (env.hasError) throw env.error;
      }
      return next();
    }
    function __rewriteRelativeImportExtension(path, preserveJsx) {
      if (typeof path === 'string' && /^\.\.?\//.test(path)) {
        return path.replace(
          /\.(tsx)$|((?:\.d)?)((?:\.[^./]+?)?)\.([cm]?)ts$/i,
          function (m, tsx, d, ext, cm) {
            return tsx
              ? preserveJsx
                ? '.jsx'
                : '.js'
              : d && (!ext || !cm)
                ? m
                : d + ext + '.' + cm.toLowerCase() + 'js';
          }
        );
      }
      return path;
    }
    const __TURBOPACK__default__export__ = {
      __extends,
      __assign,
      __rest,
      __decorate,
      __param,
      __esDecorate,
      __runInitializers,
      __propKey,
      __setFunctionName,
      __metadata,
      __awaiter,
      __generator,
      __createBinding,
      __exportStar,
      __values,
      __read,
      __spread,
      __spreadArrays,
      __spreadArray,
      __await,
      __asyncGenerator,
      __asyncDelegator,
      __asyncValues,
      __makeTemplateObject,
      __importStar,
      __importDefault,
      __classPrivateFieldGet,
      __classPrivateFieldSet,
      __classPrivateFieldIn,
      __addDisposableResource,
      __disposeResources,
      __rewriteRelativeImportExtension,
    };
  },
  '[project]/node_modules/@formatjs/fast-memoize/lib/index.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    //
    // Main
    //
    __turbopack_context__.s(['memoize', () => memoize, 'strategies', () => strategies]);
    function memoize(fn, options) {
      var cache = options && options.cache ? options.cache : cacheDefault;
      var serializer = options && options.serializer ? options.serializer : serializerDefault;
      var strategy = options && options.strategy ? options.strategy : strategyDefault;
      return strategy(fn, {
        cache: cache,
        serializer: serializer,
      });
    }
    //
    // Strategy
    //
    function isPrimitive(value) {
      return value == null || typeof value === 'number' || typeof value === 'boolean'; // || typeof value === "string" 'unsafe' primitive for our needs
    }
    function monadic(fn, cache, serializer, arg) {
      var cacheKey = isPrimitive(arg) ? arg : serializer(arg);
      var computedValue = cache.get(cacheKey);
      if (typeof computedValue === 'undefined') {
        computedValue = fn.call(this, arg);
        cache.set(cacheKey, computedValue);
      }
      return computedValue;
    }
    function variadic(fn, cache, serializer) {
      var args = Array.prototype.slice.call(arguments, 3);
      var cacheKey = serializer(args);
      var computedValue = cache.get(cacheKey);
      if (typeof computedValue === 'undefined') {
        computedValue = fn.apply(this, args);
        cache.set(cacheKey, computedValue);
      }
      return computedValue;
    }
    function assemble(fn, context, strategy, cache, serialize) {
      return strategy.bind(context, fn, cache, serialize);
    }
    function strategyDefault(fn, options) {
      var strategy = fn.length === 1 ? monadic : variadic;
      return assemble(fn, this, strategy, options.cache.create(), options.serializer);
    }
    function strategyVariadic(fn, options) {
      return assemble(fn, this, variadic, options.cache.create(), options.serializer);
    }
    function strategyMonadic(fn, options) {
      return assemble(fn, this, monadic, options.cache.create(), options.serializer);
    }
    //
    // Serializer
    //
    var serializerDefault = function () {
      return JSON.stringify(arguments);
    };
    //
    // Cache
    //
    var ObjectWithoutPrototypeCache = (function () {
      function ObjectWithoutPrototypeCache() {
        this.cache = Object.create(null);
      }
      ObjectWithoutPrototypeCache.prototype.get = function (key) {
        return this.cache[key];
      };
      ObjectWithoutPrototypeCache.prototype.set = function (key, value) {
        this.cache[key] = value;
      };
      return ObjectWithoutPrototypeCache;
    })();
    var cacheDefault = {
      create: function create() {
        return new ObjectWithoutPrototypeCache();
      },
    };
    var strategies = {
      variadic: strategyVariadic,
      monadic: strategyMonadic,
    };
  },
  '[project]/node_modules/@formatjs/icu-messageformat-parser/lib/error.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['ErrorKind', () => ErrorKind]);
    var ErrorKind;
    (function (ErrorKind) {
      /** Argument is unclosed (e.g. `{0`) */ ErrorKind[
        (ErrorKind['EXPECT_ARGUMENT_CLOSING_BRACE'] = 1)
      ] = 'EXPECT_ARGUMENT_CLOSING_BRACE';
      /** Argument is empty (e.g. `{}`). */ ErrorKind[(ErrorKind['EMPTY_ARGUMENT'] = 2)] =
        'EMPTY_ARGUMENT';
      /** Argument is malformed (e.g. `{foo!}``) */ ErrorKind[
        (ErrorKind['MALFORMED_ARGUMENT'] = 3)
      ] = 'MALFORMED_ARGUMENT';
      /** Expect an argument type (e.g. `{foo,}`) */ ErrorKind[
        (ErrorKind['EXPECT_ARGUMENT_TYPE'] = 4)
      ] = 'EXPECT_ARGUMENT_TYPE';
      /** Unsupported argument type (e.g. `{foo,foo}`) */ ErrorKind[
        (ErrorKind['INVALID_ARGUMENT_TYPE'] = 5)
      ] = 'INVALID_ARGUMENT_TYPE';
      /** Expect an argument style (e.g. `{foo, number, }`) */ ErrorKind[
        (ErrorKind['EXPECT_ARGUMENT_STYLE'] = 6)
      ] = 'EXPECT_ARGUMENT_STYLE';
      /** The number skeleton is invalid. */ ErrorKind[(ErrorKind['INVALID_NUMBER_SKELETON'] = 7)] =
        'INVALID_NUMBER_SKELETON';
      /** The date time skeleton is invalid. */ ErrorKind[
        (ErrorKind['INVALID_DATE_TIME_SKELETON'] = 8)
      ] = 'INVALID_DATE_TIME_SKELETON';
      /** Exepct a number skeleton following the `::` (e.g. `{foo, number, ::}`) */ ErrorKind[
        (ErrorKind['EXPECT_NUMBER_SKELETON'] = 9)
      ] = 'EXPECT_NUMBER_SKELETON';
      /** Exepct a date time skeleton following the `::` (e.g. `{foo, date, ::}`) */ ErrorKind[
        (ErrorKind['EXPECT_DATE_TIME_SKELETON'] = 10)
      ] = 'EXPECT_DATE_TIME_SKELETON';
      /** Unmatched apostrophes in the argument style (e.g. `{foo, number, 'test`) */ ErrorKind[
        (ErrorKind['UNCLOSED_QUOTE_IN_ARGUMENT_STYLE'] = 11)
      ] = 'UNCLOSED_QUOTE_IN_ARGUMENT_STYLE';
      /** Missing select argument options (e.g. `{foo, select}`) */ ErrorKind[
        (ErrorKind['EXPECT_SELECT_ARGUMENT_OPTIONS'] = 12)
      ] = 'EXPECT_SELECT_ARGUMENT_OPTIONS';
      /** Expecting an offset value in `plural` or `selectordinal` argument (e.g `{foo, plural, offset}`) */ ErrorKind[
        (ErrorKind['EXPECT_PLURAL_ARGUMENT_OFFSET_VALUE'] = 13)
      ] = 'EXPECT_PLURAL_ARGUMENT_OFFSET_VALUE';
      /** Offset value in `plural` or `selectordinal` is invalid (e.g. `{foo, plural, offset: x}`) */ ErrorKind[
        (ErrorKind['INVALID_PLURAL_ARGUMENT_OFFSET_VALUE'] = 14)
      ] = 'INVALID_PLURAL_ARGUMENT_OFFSET_VALUE';
      /** Expecting a selector in `select` argument (e.g `{foo, select}`) */ ErrorKind[
        (ErrorKind['EXPECT_SELECT_ARGUMENT_SELECTOR'] = 15)
      ] = 'EXPECT_SELECT_ARGUMENT_SELECTOR';
      /** Expecting a selector in `plural` or `selectordinal` argument (e.g `{foo, plural}`) */ ErrorKind[
        (ErrorKind['EXPECT_PLURAL_ARGUMENT_SELECTOR'] = 16)
      ] = 'EXPECT_PLURAL_ARGUMENT_SELECTOR';
      /** Expecting a message fragment after the `select` selector (e.g. `{foo, select, apple}`) */ ErrorKind[
        (ErrorKind['EXPECT_SELECT_ARGUMENT_SELECTOR_FRAGMENT'] = 17)
      ] = 'EXPECT_SELECT_ARGUMENT_SELECTOR_FRAGMENT';
      /**
       * Expecting a message fragment after the `plural` or `selectordinal` selector
       * (e.g. `{foo, plural, one}`)
       */ ErrorKind[(ErrorKind['EXPECT_PLURAL_ARGUMENT_SELECTOR_FRAGMENT'] = 18)] =
        'EXPECT_PLURAL_ARGUMENT_SELECTOR_FRAGMENT';
      /** Selector in `plural` or `selectordinal` is malformed (e.g. `{foo, plural, =x {#}}`) */ ErrorKind[
        (ErrorKind['INVALID_PLURAL_ARGUMENT_SELECTOR'] = 19)
      ] = 'INVALID_PLURAL_ARGUMENT_SELECTOR';
      /**
       * Duplicate selectors in `plural` or `selectordinal` argument.
       * (e.g. {foo, plural, one {#} one {#}})
       */ ErrorKind[(ErrorKind['DUPLICATE_PLURAL_ARGUMENT_SELECTOR'] = 20)] =
        'DUPLICATE_PLURAL_ARGUMENT_SELECTOR';
      /** Duplicate selectors in `select` argument.
       * (e.g. {foo, select, apple {apple} apple {apple}})
       */ ErrorKind[(ErrorKind['DUPLICATE_SELECT_ARGUMENT_SELECTOR'] = 21)] =
        'DUPLICATE_SELECT_ARGUMENT_SELECTOR';
      /** Plural or select argument option must have `other` clause. */ ErrorKind[
        (ErrorKind['MISSING_OTHER_CLAUSE'] = 22)
      ] = 'MISSING_OTHER_CLAUSE';
      /** The tag is malformed. (e.g. `<bold!>foo</bold!>) */ ErrorKind[
        (ErrorKind['INVALID_TAG'] = 23)
      ] = 'INVALID_TAG';
      /** The tag name is invalid. (e.g. `<123>foo</123>`) */ ErrorKind[
        (ErrorKind['INVALID_TAG_NAME'] = 25)
      ] = 'INVALID_TAG_NAME';
      /** The closing tag does not match the opening tag. (e.g. `<bold>foo</italic>`) */ ErrorKind[
        (ErrorKind['UNMATCHED_CLOSING_TAG'] = 26)
      ] = 'UNMATCHED_CLOSING_TAG';
      /** The opening tag has unmatched closing tag. (e.g. `<bold>foo`) */ ErrorKind[
        (ErrorKind['UNCLOSED_TAG'] = 27)
      ] = 'UNCLOSED_TAG';
    })(ErrorKind || (ErrorKind = {}));
  },
  '[project]/node_modules/@formatjs/icu-messageformat-parser/lib/types.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'SKELETON_TYPE',
      () => SKELETON_TYPE,
      'TYPE',
      () => TYPE,
      'createLiteralElement',
      () => createLiteralElement,
      'createNumberElement',
      () => createNumberElement,
      'isArgumentElement',
      () => isArgumentElement,
      'isDateElement',
      () => isDateElement,
      'isDateTimeSkeleton',
      () => isDateTimeSkeleton,
      'isLiteralElement',
      () => isLiteralElement,
      'isNumberElement',
      () => isNumberElement,
      'isNumberSkeleton',
      () => isNumberSkeleton,
      'isPluralElement',
      () => isPluralElement,
      'isPoundElement',
      () => isPoundElement,
      'isSelectElement',
      () => isSelectElement,
      'isTagElement',
      () => isTagElement,
      'isTimeElement',
      () => isTimeElement,
    ]);
    var TYPE;
    (function (TYPE) {
      /**
       * Raw text
       */ TYPE[(TYPE['literal'] = 0)] = 'literal';
      /**
       * Variable w/o any format, e.g `var` in `this is a {var}`
       */ TYPE[(TYPE['argument'] = 1)] = 'argument';
      /**
       * Variable w/ number format
       */ TYPE[(TYPE['number'] = 2)] = 'number';
      /**
       * Variable w/ date format
       */ TYPE[(TYPE['date'] = 3)] = 'date';
      /**
       * Variable w/ time format
       */ TYPE[(TYPE['time'] = 4)] = 'time';
      /**
       * Variable w/ select format
       */ TYPE[(TYPE['select'] = 5)] = 'select';
      /**
       * Variable w/ plural format
       */ TYPE[(TYPE['plural'] = 6)] = 'plural';
      /**
       * Only possible within plural argument.
       * This is the `#` symbol that will be substituted with the count.
       */ TYPE[(TYPE['pound'] = 7)] = 'pound';
      /**
       * XML-like tag
       */ TYPE[(TYPE['tag'] = 8)] = 'tag';
    })(TYPE || (TYPE = {}));
    var SKELETON_TYPE;
    (function (SKELETON_TYPE) {
      SKELETON_TYPE[(SKELETON_TYPE['number'] = 0)] = 'number';
      SKELETON_TYPE[(SKELETON_TYPE['dateTime'] = 1)] = 'dateTime';
    })(SKELETON_TYPE || (SKELETON_TYPE = {}));
    function isLiteralElement(el) {
      return el.type === TYPE.literal;
    }
    function isArgumentElement(el) {
      return el.type === TYPE.argument;
    }
    function isNumberElement(el) {
      return el.type === TYPE.number;
    }
    function isDateElement(el) {
      return el.type === TYPE.date;
    }
    function isTimeElement(el) {
      return el.type === TYPE.time;
    }
    function isSelectElement(el) {
      return el.type === TYPE.select;
    }
    function isPluralElement(el) {
      return el.type === TYPE.plural;
    }
    function isPoundElement(el) {
      return el.type === TYPE.pound;
    }
    function isTagElement(el) {
      return el.type === TYPE.tag;
    }
    function isNumberSkeleton(el) {
      return !!(el && typeof el === 'object' && el.type === SKELETON_TYPE.number);
    }
    function isDateTimeSkeleton(el) {
      return !!(el && typeof el === 'object' && el.type === SKELETON_TYPE.dateTime);
    }
    function createLiteralElement(value) {
      return {
        type: TYPE.literal,
        value: value,
      };
    }
    function createNumberElement(value, style) {
      return {
        type: TYPE.number,
        value: value,
        style: style,
      };
    }
  },
  '[project]/node_modules/@formatjs/icu-messageformat-parser/lib/regex.generated.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    // @generated from regex-gen.ts
    __turbopack_context__.s([
      'SPACE_SEPARATOR_REGEX',
      () => SPACE_SEPARATOR_REGEX,
      'WHITE_SPACE_REGEX',
      () => WHITE_SPACE_REGEX,
    ]);
    var SPACE_SEPARATOR_REGEX = /[ \xA0\u1680\u2000-\u200A\u202F\u205F\u3000]/;
    var WHITE_SPACE_REGEX = /[\t-\r \x85\u200E\u200F\u2028\u2029]/;
  },
  '[project]/node_modules/@formatjs/icu-messageformat-parser/lib/time-data.generated.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    // @generated from time-data-gen.ts
    // prettier-ignore
    __turbopack_context__.s([
    "timeData",
    ()=>timeData
]);
    var timeData = {
      '001': ['H', 'h'],
      419: ['h', 'H', 'hB', 'hb'],
      AC: ['H', 'h', 'hb', 'hB'],
      AD: ['H', 'hB'],
      AE: ['h', 'hB', 'hb', 'H'],
      AF: ['H', 'hb', 'hB', 'h'],
      AG: ['h', 'hb', 'H', 'hB'],
      AI: ['H', 'h', 'hb', 'hB'],
      AL: ['h', 'H', 'hB'],
      AM: ['H', 'hB'],
      AO: ['H', 'hB'],
      AR: ['h', 'H', 'hB', 'hb'],
      AS: ['h', 'H'],
      AT: ['H', 'hB'],
      AU: ['h', 'hb', 'H', 'hB'],
      AW: ['H', 'hB'],
      AX: ['H'],
      AZ: ['H', 'hB', 'h'],
      BA: ['H', 'hB', 'h'],
      BB: ['h', 'hb', 'H', 'hB'],
      BD: ['h', 'hB', 'H'],
      BE: ['H', 'hB'],
      BF: ['H', 'hB'],
      BG: ['H', 'hB', 'h'],
      BH: ['h', 'hB', 'hb', 'H'],
      BI: ['H', 'h'],
      BJ: ['H', 'hB'],
      BL: ['H', 'hB'],
      BM: ['h', 'hb', 'H', 'hB'],
      BN: ['hb', 'hB', 'h', 'H'],
      BO: ['h', 'H', 'hB', 'hb'],
      BQ: ['H'],
      BR: ['H', 'hB'],
      BS: ['h', 'hb', 'H', 'hB'],
      BT: ['h', 'H'],
      BW: ['H', 'h', 'hb', 'hB'],
      BY: ['H', 'h'],
      BZ: ['H', 'h', 'hb', 'hB'],
      CA: ['h', 'hb', 'H', 'hB'],
      CC: ['H', 'h', 'hb', 'hB'],
      CD: ['hB', 'H'],
      CF: ['H', 'h', 'hB'],
      CG: ['H', 'hB'],
      CH: ['H', 'hB', 'h'],
      CI: ['H', 'hB'],
      CK: ['H', 'h', 'hb', 'hB'],
      CL: ['h', 'H', 'hB', 'hb'],
      CM: ['H', 'h', 'hB'],
      CN: ['H', 'hB', 'hb', 'h'],
      CO: ['h', 'H', 'hB', 'hb'],
      CP: ['H'],
      CR: ['h', 'H', 'hB', 'hb'],
      CU: ['h', 'H', 'hB', 'hb'],
      CV: ['H', 'hB'],
      CW: ['H', 'hB'],
      CX: ['H', 'h', 'hb', 'hB'],
      CY: ['h', 'H', 'hb', 'hB'],
      CZ: ['H'],
      DE: ['H', 'hB'],
      DG: ['H', 'h', 'hb', 'hB'],
      DJ: ['h', 'H'],
      DK: ['H'],
      DM: ['h', 'hb', 'H', 'hB'],
      DO: ['h', 'H', 'hB', 'hb'],
      DZ: ['h', 'hB', 'hb', 'H'],
      EA: ['H', 'h', 'hB', 'hb'],
      EC: ['h', 'H', 'hB', 'hb'],
      EE: ['H', 'hB'],
      EG: ['h', 'hB', 'hb', 'H'],
      EH: ['h', 'hB', 'hb', 'H'],
      ER: ['h', 'H'],
      ES: ['H', 'hB', 'h', 'hb'],
      ET: ['hB', 'hb', 'h', 'H'],
      FI: ['H'],
      FJ: ['h', 'hb', 'H', 'hB'],
      FK: ['H', 'h', 'hb', 'hB'],
      FM: ['h', 'hb', 'H', 'hB'],
      FO: ['H', 'h'],
      FR: ['H', 'hB'],
      GA: ['H', 'hB'],
      GB: ['H', 'h', 'hb', 'hB'],
      GD: ['h', 'hb', 'H', 'hB'],
      GE: ['H', 'hB', 'h'],
      GF: ['H', 'hB'],
      GG: ['H', 'h', 'hb', 'hB'],
      GH: ['h', 'H'],
      GI: ['H', 'h', 'hb', 'hB'],
      GL: ['H', 'h'],
      GM: ['h', 'hb', 'H', 'hB'],
      GN: ['H', 'hB'],
      GP: ['H', 'hB'],
      GQ: ['H', 'hB', 'h', 'hb'],
      GR: ['h', 'H', 'hb', 'hB'],
      GT: ['h', 'H', 'hB', 'hb'],
      GU: ['h', 'hb', 'H', 'hB'],
      GW: ['H', 'hB'],
      GY: ['h', 'hb', 'H', 'hB'],
      HK: ['h', 'hB', 'hb', 'H'],
      HN: ['h', 'H', 'hB', 'hb'],
      HR: ['H', 'hB'],
      HU: ['H', 'h'],
      IC: ['H', 'h', 'hB', 'hb'],
      ID: ['H'],
      IE: ['H', 'h', 'hb', 'hB'],
      IL: ['H', 'hB'],
      IM: ['H', 'h', 'hb', 'hB'],
      IN: ['h', 'H'],
      IO: ['H', 'h', 'hb', 'hB'],
      IQ: ['h', 'hB', 'hb', 'H'],
      IR: ['hB', 'H'],
      IS: ['H'],
      IT: ['H', 'hB'],
      JE: ['H', 'h', 'hb', 'hB'],
      JM: ['h', 'hb', 'H', 'hB'],
      JO: ['h', 'hB', 'hb', 'H'],
      JP: ['H', 'K', 'h'],
      KE: ['hB', 'hb', 'H', 'h'],
      KG: ['H', 'h', 'hB', 'hb'],
      KH: ['hB', 'h', 'H', 'hb'],
      KI: ['h', 'hb', 'H', 'hB'],
      KM: ['H', 'h', 'hB', 'hb'],
      KN: ['h', 'hb', 'H', 'hB'],
      KP: ['h', 'H', 'hB', 'hb'],
      KR: ['h', 'H', 'hB', 'hb'],
      KW: ['h', 'hB', 'hb', 'H'],
      KY: ['h', 'hb', 'H', 'hB'],
      KZ: ['H', 'hB'],
      LA: ['H', 'hb', 'hB', 'h'],
      LB: ['h', 'hB', 'hb', 'H'],
      LC: ['h', 'hb', 'H', 'hB'],
      LI: ['H', 'hB', 'h'],
      LK: ['H', 'h', 'hB', 'hb'],
      LR: ['h', 'hb', 'H', 'hB'],
      LS: ['h', 'H'],
      LT: ['H', 'h', 'hb', 'hB'],
      LU: ['H', 'h', 'hB'],
      LV: ['H', 'hB', 'hb', 'h'],
      LY: ['h', 'hB', 'hb', 'H'],
      MA: ['H', 'h', 'hB', 'hb'],
      MC: ['H', 'hB'],
      MD: ['H', 'hB'],
      ME: ['H', 'hB', 'h'],
      MF: ['H', 'hB'],
      MG: ['H', 'h'],
      MH: ['h', 'hb', 'H', 'hB'],
      MK: ['H', 'h', 'hb', 'hB'],
      ML: ['H'],
      MM: ['hB', 'hb', 'H', 'h'],
      MN: ['H', 'h', 'hb', 'hB'],
      MO: ['h', 'hB', 'hb', 'H'],
      MP: ['h', 'hb', 'H', 'hB'],
      MQ: ['H', 'hB'],
      MR: ['h', 'hB', 'hb', 'H'],
      MS: ['H', 'h', 'hb', 'hB'],
      MT: ['H', 'h'],
      MU: ['H', 'h'],
      MV: ['H', 'h'],
      MW: ['h', 'hb', 'H', 'hB'],
      MX: ['h', 'H', 'hB', 'hb'],
      MY: ['hb', 'hB', 'h', 'H'],
      MZ: ['H', 'hB'],
      NA: ['h', 'H', 'hB', 'hb'],
      NC: ['H', 'hB'],
      NE: ['H'],
      NF: ['H', 'h', 'hb', 'hB'],
      NG: ['H', 'h', 'hb', 'hB'],
      NI: ['h', 'H', 'hB', 'hb'],
      NL: ['H', 'hB'],
      NO: ['H', 'h'],
      NP: ['H', 'h', 'hB'],
      NR: ['H', 'h', 'hb', 'hB'],
      NU: ['H', 'h', 'hb', 'hB'],
      NZ: ['h', 'hb', 'H', 'hB'],
      OM: ['h', 'hB', 'hb', 'H'],
      PA: ['h', 'H', 'hB', 'hb'],
      PE: ['h', 'H', 'hB', 'hb'],
      PF: ['H', 'h', 'hB'],
      PG: ['h', 'H'],
      PH: ['h', 'hB', 'hb', 'H'],
      PK: ['h', 'hB', 'H'],
      PL: ['H', 'h'],
      PM: ['H', 'hB'],
      PN: ['H', 'h', 'hb', 'hB'],
      PR: ['h', 'H', 'hB', 'hb'],
      PS: ['h', 'hB', 'hb', 'H'],
      PT: ['H', 'hB'],
      PW: ['h', 'H'],
      PY: ['h', 'H', 'hB', 'hb'],
      QA: ['h', 'hB', 'hb', 'H'],
      RE: ['H', 'hB'],
      RO: ['H', 'hB'],
      RS: ['H', 'hB', 'h'],
      RU: ['H'],
      RW: ['H', 'h'],
      SA: ['h', 'hB', 'hb', 'H'],
      SB: ['h', 'hb', 'H', 'hB'],
      SC: ['H', 'h', 'hB'],
      SD: ['h', 'hB', 'hb', 'H'],
      SE: ['H'],
      SG: ['h', 'hb', 'H', 'hB'],
      SH: ['H', 'h', 'hb', 'hB'],
      SI: ['H', 'hB'],
      SJ: ['H'],
      SK: ['H'],
      SL: ['h', 'hb', 'H', 'hB'],
      SM: ['H', 'h', 'hB'],
      SN: ['H', 'h', 'hB'],
      SO: ['h', 'H'],
      SR: ['H', 'hB'],
      SS: ['h', 'hb', 'H', 'hB'],
      ST: ['H', 'hB'],
      SV: ['h', 'H', 'hB', 'hb'],
      SX: ['H', 'h', 'hb', 'hB'],
      SY: ['h', 'hB', 'hb', 'H'],
      SZ: ['h', 'hb', 'H', 'hB'],
      TA: ['H', 'h', 'hb', 'hB'],
      TC: ['h', 'hb', 'H', 'hB'],
      TD: ['h', 'H', 'hB'],
      TF: ['H', 'h', 'hB'],
      TG: ['H', 'hB'],
      TH: ['H', 'h'],
      TJ: ['H', 'h'],
      TL: ['H', 'hB', 'hb', 'h'],
      TM: ['H', 'h'],
      TN: ['h', 'hB', 'hb', 'H'],
      TO: ['h', 'H'],
      TR: ['H', 'hB'],
      TT: ['h', 'hb', 'H', 'hB'],
      TW: ['hB', 'hb', 'h', 'H'],
      TZ: ['hB', 'hb', 'H', 'h'],
      UA: ['H', 'hB', 'h'],
      UG: ['hB', 'hb', 'H', 'h'],
      UM: ['h', 'hb', 'H', 'hB'],
      US: ['h', 'hb', 'H', 'hB'],
      UY: ['h', 'H', 'hB', 'hb'],
      UZ: ['H', 'hB', 'h'],
      VA: ['H', 'h', 'hB'],
      VC: ['h', 'hb', 'H', 'hB'],
      VE: ['h', 'H', 'hB', 'hb'],
      VG: ['h', 'hb', 'H', 'hB'],
      VI: ['h', 'hb', 'H', 'hB'],
      VN: ['H', 'h'],
      VU: ['h', 'H'],
      WF: ['H', 'hB'],
      WS: ['h', 'H'],
      XK: ['H', 'hB', 'h'],
      YE: ['h', 'hB', 'hb', 'H'],
      YT: ['H', 'hB'],
      ZA: ['H', 'h', 'hb', 'hB'],
      ZM: ['h', 'hb', 'H', 'hB'],
      ZW: ['H', 'h'],
      'af-ZA': ['H', 'h', 'hB', 'hb'],
      'ar-001': ['h', 'hB', 'hb', 'H'],
      'ca-ES': ['H', 'h', 'hB'],
      'en-001': ['h', 'hb', 'H', 'hB'],
      'en-HK': ['h', 'hb', 'H', 'hB'],
      'en-IL': ['H', 'h', 'hb', 'hB'],
      'en-MY': ['h', 'hb', 'H', 'hB'],
      'es-BR': ['H', 'h', 'hB', 'hb'],
      'es-ES': ['H', 'h', 'hB', 'hb'],
      'es-GQ': ['H', 'h', 'hB', 'hb'],
      'fr-CA': ['H', 'h', 'hB'],
      'gl-ES': ['H', 'h', 'hB'],
      'gu-IN': ['hB', 'hb', 'h', 'H'],
      'hi-IN': ['hB', 'h', 'H'],
      'it-CH': ['H', 'h', 'hB'],
      'it-IT': ['H', 'h', 'hB'],
      'kn-IN': ['hB', 'h', 'H'],
      'ml-IN': ['hB', 'h', 'H'],
      'mr-IN': ['hB', 'hb', 'h', 'H'],
      'pa-IN': ['hB', 'hb', 'h', 'H'],
      'ta-IN': ['hB', 'h', 'hb', 'H'],
      'te-IN': ['hB', 'h', 'H'],
      'zu-ZA': ['H', 'hB', 'hb', 'h'],
    };
  },
  '[project]/node_modules/@formatjs/icu-messageformat-parser/lib/date-time-pattern-generator.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['getBestPattern', () => getBestPattern]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$time$2d$data$2e$generated$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@formatjs/icu-messageformat-parser/lib/time-data.generated.js [app-client] (ecmascript)'
      );
    function getBestPattern(skeleton, locale) {
      var skeletonCopy = '';
      for (var patternPos = 0; patternPos < skeleton.length; patternPos++) {
        var patternChar = skeleton.charAt(patternPos);
        if (patternChar === 'j') {
          var extraLength = 0;
          while (
            patternPos + 1 < skeleton.length &&
            skeleton.charAt(patternPos + 1) === patternChar
          ) {
            extraLength++;
            patternPos++;
          }
          var hourLen = 1 + (extraLength & 1);
          var dayPeriodLen = extraLength < 2 ? 1 : 3 + (extraLength >> 1);
          var dayPeriodChar = 'a';
          var hourChar = getDefaultHourSymbolFromLocale(locale);
          if (hourChar == 'H' || hourChar == 'k') {
            dayPeriodLen = 0;
          }
          while (dayPeriodLen-- > 0) {
            skeletonCopy += dayPeriodChar;
          }
          while (hourLen-- > 0) {
            skeletonCopy = hourChar + skeletonCopy;
          }
        } else if (patternChar === 'J') {
          skeletonCopy += 'H';
        } else {
          skeletonCopy += patternChar;
        }
      }
      return skeletonCopy;
    }
    /**
     * Maps the [hour cycle type](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Locale/hourCycle)
     * of the given `locale` to the corresponding time pattern.
     * @param locale
     */ function getDefaultHourSymbolFromLocale(locale) {
      var hourCycle = locale.hourCycle;
      if (
        hourCycle === undefined && // @ts-ignore hourCycle(s) is not identified yet
        locale.hourCycles && // @ts-ignore
        locale.hourCycles.length
      ) {
        // @ts-ignore
        hourCycle = locale.hourCycles[0];
      }
      if (hourCycle) {
        switch (hourCycle) {
          case 'h24':
            return 'k';
          case 'h23':
            return 'H';
          case 'h12':
            return 'h';
          case 'h11':
            return 'K';
          default:
            throw new Error('Invalid hourCycle');
        }
      }
      // TODO: Once hourCycle is fully supported remove the following with data generation
      var languageTag = locale.language;
      var regionTag;
      if (languageTag !== 'root') {
        regionTag = locale.maximize().region;
      }
      var hourCycles =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$time$2d$data$2e$generated$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'timeData'
        ][regionTag || ''] ||
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$time$2d$data$2e$generated$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'timeData'
        ][languageTag || ''] ||
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$time$2d$data$2e$generated$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'timeData'
        ][''.concat(languageTag, '-001')] ||
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$time$2d$data$2e$generated$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'timeData'
        ]['001'];
      return hourCycles[0];
    }
  },
  '[project]/node_modules/@formatjs/icu-messageformat-parser/lib/parser.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['Parser', () => Parser]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/tslib/tslib.es6.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$error$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@formatjs/icu-messageformat-parser/lib/error.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@formatjs/icu-messageformat-parser/lib/types.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$regex$2e$generated$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@formatjs/icu-messageformat-parser/lib/regex.generated.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$skeleton$2d$parser$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@formatjs/icu-skeleton-parser/lib/index.js [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$skeleton$2d$parser$2f$lib$2f$number$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@formatjs/icu-skeleton-parser/lib/number.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$skeleton$2d$parser$2f$lib$2f$date$2d$time$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@formatjs/icu-skeleton-parser/lib/date-time.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$date$2d$time$2d$pattern$2d$generator$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@formatjs/icu-messageformat-parser/lib/date-time-pattern-generator.js [app-client] (ecmascript)'
      );
    var _a;
    var SPACE_SEPARATOR_START_REGEX = new RegExp(
      '^'.concat(
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$regex$2e$generated$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'SPACE_SEPARATOR_REGEX'
        ].source,
        '*'
      )
    );
    var SPACE_SEPARATOR_END_REGEX = new RegExp(
      ''.concat(
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$regex$2e$generated$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'SPACE_SEPARATOR_REGEX'
        ].source,
        '*$'
      )
    );
    function createLocation(start, end) {
      return {
        start: start,
        end: end,
      };
    }
    // #region Ponyfills
    // Consolidate these variables up top for easier toggling during debugging
    var hasNativeStartsWith = !!String.prototype.startsWith && '_a'.startsWith('a', 1);
    var hasNativeFromCodePoint = !!String.fromCodePoint;
    var hasNativeFromEntries = !!Object.fromEntries;
    var hasNativeCodePointAt = !!String.prototype.codePointAt;
    var hasTrimStart = !!String.prototype.trimStart;
    var hasTrimEnd = !!String.prototype.trimEnd;
    var hasNativeIsSafeInteger = !!Number.isSafeInteger;
    var isSafeInteger = hasNativeIsSafeInteger
      ? Number.isSafeInteger
      : function (n) {
          return (
            typeof n === 'number' &&
            isFinite(n) &&
            Math.floor(n) === n &&
            Math.abs(n) <= 0x1fffffffffffff
          );
        };
    // IE11 does not support y and u.
    var REGEX_SUPPORTS_U_AND_Y = true;
    try {
      var re = RE('([^\\p{White_Space}\\p{Pattern_Syntax}]*)', 'yu');
      /**
       * legacy Edge or Xbox One browser
       * Unicode flag support: supported
       * Pattern_Syntax support: not supported
       * See https://github.com/formatjs/formatjs/issues/2822
       */ REGEX_SUPPORTS_U_AND_Y =
        ((_a = re.exec('a')) === null || _a === void 0 ? void 0 : _a[0]) === 'a';
    } catch (_) {
      REGEX_SUPPORTS_U_AND_Y = false;
    }
    var startsWith = hasNativeStartsWith
      ? function startsWith(s, search, position) {
          return s.startsWith(search, position);
        }
      : function startsWith(s, search, position) {
          return s.slice(position, position + search.length) === search;
        };
    var fromCodePoint = hasNativeFromCodePoint
      ? String.fromCodePoint
      : function fromCodePoint() {
          var codePoints = [];
          for (var _i = 0; _i < arguments.length; _i++) {
            codePoints[_i] = arguments[_i];
          }
          var elements = '';
          var length = codePoints.length;
          var i = 0;
          var code;
          while (length > i) {
            code = codePoints[i++];
            if (code > 0x10ffff) throw RangeError(code + ' is not a valid code point');
            elements +=
              code < 0x10000
                ? String.fromCharCode(code)
                : String.fromCharCode(((code -= 0x10000) >> 10) + 0xd800, (code % 0x400) + 0xdc00);
          }
          return elements;
        };
    var fromEntries = // native
      hasNativeFromEntries
        ? Object.fromEntries
        : function fromEntries(entries) {
            var obj = {};
            for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
              var _a = entries_1[_i],
                k = _a[0],
                v = _a[1];
              obj[k] = v;
            }
            return obj;
          };
    var codePointAt = hasNativeCodePointAt
      ? function codePointAt(s, index) {
          return s.codePointAt(index);
        }
      : function codePointAt(s, index) {
          var size = s.length;
          if (index < 0 || index >= size) {
            return undefined;
          }
          var first = s.charCodeAt(index);
          var second;
          return first < 0xd800 ||
            first > 0xdbff ||
            index + 1 === size ||
            (second = s.charCodeAt(index + 1)) < 0xdc00 ||
            second > 0xdfff
            ? first
            : ((first - 0xd800) << 10) + (second - 0xdc00) + 0x10000;
        };
    var trimStart = hasTrimStart
      ? function trimStart(s) {
          return s.trimStart();
        }
      : function trimStart(s) {
          return s.replace(SPACE_SEPARATOR_START_REGEX, '');
        };
    var trimEnd = hasTrimEnd
      ? function trimEnd(s) {
          return s.trimEnd();
        }
      : function trimEnd(s) {
          return s.replace(SPACE_SEPARATOR_END_REGEX, '');
        };
    // Prevent minifier to translate new RegExp to literal form that might cause syntax error on IE11.
    function RE(s, flag) {
      return new RegExp(s, flag);
    }
    // #endregion
    var matchIdentifierAtIndex;
    if (REGEX_SUPPORTS_U_AND_Y) {
      // Native
      var IDENTIFIER_PREFIX_RE_1 = RE('([^\\p{White_Space}\\p{Pattern_Syntax}]*)', 'yu');
      matchIdentifierAtIndex = function matchIdentifierAtIndex(s, index) {
        var _a;
        IDENTIFIER_PREFIX_RE_1.lastIndex = index;
        var match = IDENTIFIER_PREFIX_RE_1.exec(s);
        return (_a = match[1]) !== null && _a !== void 0 ? _a : '';
      };
    } else {
      // IE11
      matchIdentifierAtIndex = function matchIdentifierAtIndex(s, index) {
        var match = [];
        while (true) {
          var c = codePointAt(s, index);
          if (c === undefined || _isWhiteSpace(c) || _isPatternSyntax(c)) {
            break;
          }
          match.push(c);
          index += c >= 0x10000 ? 2 : 1;
        }
        return fromCodePoint.apply(void 0, match);
      };
    }
    var Parser = (function () {
      function Parser(message, options) {
        if (options === void 0) {
          options = {};
        }
        this.message = message;
        this.position = {
          offset: 0,
          line: 1,
          column: 1,
        };
        this.ignoreTag = !!options.ignoreTag;
        this.locale = options.locale;
        this.requiresOtherClause = !!options.requiresOtherClause;
        this.shouldParseSkeletons = !!options.shouldParseSkeletons;
      }
      Parser.prototype.parse = function () {
        if (this.offset() !== 0) {
          throw Error('parser can only be used once');
        }
        return this.parseMessage(0, '', false);
      };
      Parser.prototype.parseMessage = function (nestingLevel, parentArgType, expectingCloseTag) {
        var elements = [];
        while (!this.isEOF()) {
          var char = this.char();
          if (char === 123 /* `{` */) {
            var result = this.parseArgument(nestingLevel, expectingCloseTag);
            if (result.err) {
              return result;
            }
            elements.push(result.val);
          } else if (char === 125 /* `}` */ && nestingLevel > 0) {
            break;
          } else if (
            char === 35 /* `#` */ &&
            (parentArgType === 'plural' || parentArgType === 'selectordinal')
          ) {
            var position = this.clonePosition();
            this.bump();
            elements.push({
              type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'TYPE'
              ].pound,
              location: createLocation(position, this.clonePosition()),
            });
          } else if (
            char === 60 /* `<` */ &&
            !this.ignoreTag &&
            this.peek() === 47 // char code for '/'
          ) {
            if (expectingCloseTag) {
              break;
            } else {
              return this.error(
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$error$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'ErrorKind'
                ].UNMATCHED_CLOSING_TAG,
                createLocation(this.clonePosition(), this.clonePosition())
              );
            }
          } else if (char === 60 /* `<` */ && !this.ignoreTag && _isAlpha(this.peek() || 0)) {
            var result = this.parseTag(nestingLevel, parentArgType);
            if (result.err) {
              return result;
            }
            elements.push(result.val);
          } else {
            var result = this.parseLiteral(nestingLevel, parentArgType);
            if (result.err) {
              return result;
            }
            elements.push(result.val);
          }
        }
        return {
          val: elements,
          err: null,
        };
      };
      /**
       * A tag name must start with an ASCII lower/upper case letter. The grammar is based on the
       * [custom element name][] except that a dash is NOT always mandatory and uppercase letters
       * are accepted:
       *
       * ```
       * tag ::= "<" tagName (whitespace)* "/>" | "<" tagName (whitespace)* ">" message "</" tagName (whitespace)* ">"
       * tagName ::= [a-z] (PENChar)*
       * PENChar ::=
       *     "-" | "." | [0-9] | "_" | [a-z] | [A-Z] | #xB7 | [#xC0-#xD6] | [#xD8-#xF6] | [#xF8-#x37D] |
       *     [#x37F-#x1FFF] | [#x200C-#x200D] | [#x203F-#x2040] | [#x2070-#x218F] | [#x2C00-#x2FEF] |
       *     [#x3001-#xD7FF] | [#xF900-#xFDCF] | [#xFDF0-#xFFFD] | [#x10000-#xEFFFF]
       * ```
       *
       * [custom element name]: https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name
       * NOTE: We're a bit more lax here since HTML technically does not allow uppercase HTML element but we do
       * since other tag-based engines like React allow it
       */ Parser.prototype.parseTag = function (nestingLevel, parentArgType) {
        var startPosition = this.clonePosition();
        this.bump(); // `<`
        var tagName = this.parseTagName();
        this.bumpSpace();
        if (this.bumpIf('/>')) {
          // Self closing tag
          return {
            val: {
              type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'TYPE'
              ].literal,
              value: '<'.concat(tagName, '/>'),
              location: createLocation(startPosition, this.clonePosition()),
            },
            err: null,
          };
        } else if (this.bumpIf('>')) {
          var childrenResult = this.parseMessage(nestingLevel + 1, parentArgType, true);
          if (childrenResult.err) {
            return childrenResult;
          }
          var children = childrenResult.val;
          // Expecting a close tag
          var endTagStartPosition = this.clonePosition();
          if (this.bumpIf('</')) {
            if (this.isEOF() || !_isAlpha(this.char())) {
              return this.error(
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$error$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'ErrorKind'
                ].INVALID_TAG,
                createLocation(endTagStartPosition, this.clonePosition())
              );
            }
            var closingTagNameStartPosition = this.clonePosition();
            var closingTagName = this.parseTagName();
            if (tagName !== closingTagName) {
              return this.error(
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$error$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'ErrorKind'
                ].UNMATCHED_CLOSING_TAG,
                createLocation(closingTagNameStartPosition, this.clonePosition())
              );
            }
            this.bumpSpace();
            if (!this.bumpIf('>')) {
              return this.error(
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$error$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'ErrorKind'
                ].INVALID_TAG,
                createLocation(endTagStartPosition, this.clonePosition())
              );
            }
            return {
              val: {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'TYPE'
                ].tag,
                value: tagName,
                children: children,
                location: createLocation(startPosition, this.clonePosition()),
              },
              err: null,
            };
          } else {
            return this.error(
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$error$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'ErrorKind'
              ].UNCLOSED_TAG,
              createLocation(startPosition, this.clonePosition())
            );
          }
        } else {
          return this.error(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$error$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'ErrorKind'
            ].INVALID_TAG,
            createLocation(startPosition, this.clonePosition())
          );
        }
      };
      /**
       * This method assumes that the caller has peeked ahead for the first tag character.
       */ Parser.prototype.parseTagName = function () {
        var startOffset = this.offset();
        this.bump(); // the first tag name character
        while (!this.isEOF() && _isPotentialElementNameChar(this.char())) {
          this.bump();
        }
        return this.message.slice(startOffset, this.offset());
      };
      Parser.prototype.parseLiteral = function (nestingLevel, parentArgType) {
        var start = this.clonePosition();
        var value = '';
        while (true) {
          var parseQuoteResult = this.tryParseQuote(parentArgType);
          if (parseQuoteResult) {
            value += parseQuoteResult;
            continue;
          }
          var parseUnquotedResult = this.tryParseUnquoted(nestingLevel, parentArgType);
          if (parseUnquotedResult) {
            value += parseUnquotedResult;
            continue;
          }
          var parseLeftAngleResult = this.tryParseLeftAngleBracket();
          if (parseLeftAngleResult) {
            value += parseLeftAngleResult;
            continue;
          }
          break;
        }
        var location = createLocation(start, this.clonePosition());
        return {
          val: {
            type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'TYPE'
            ].literal,
            value: value,
            location: location,
          },
          err: null,
        };
      };
      Parser.prototype.tryParseLeftAngleBracket = function () {
        if (
          !this.isEOF() &&
          this.char() === 60 /* `<` */ &&
          (this.ignoreTag || // If at the opening tag or closing tag position, bail.
            !_isAlphaOrSlash(this.peek() || 0))
        ) {
          this.bump(); // `<`
          return '<';
        }
        return null;
      };
      /**
       * Starting with ICU 4.8, an ASCII apostrophe only starts quoted text if it immediately precedes
       * a character that requires quoting (that is, "only where needed"), and works the same in
       * nested messages as on the top level of the pattern. The new behavior is otherwise compatible.
       */ Parser.prototype.tryParseQuote = function (parentArgType) {
        if (this.isEOF() || this.char() !== 39 /* `'` */) {
          return null;
        }
        // Parse escaped char following the apostrophe, or early return if there is no escaped char.
        // Check if is valid escaped character
        switch (this.peek()) {
          case 39 /* `'` */:
            // double quote, should return as a single quote.
            this.bump();
            this.bump();
            return "'";
          // '{', '<', '>', '}'
          case 123:
          case 60:
          case 62:
          case 125:
            break;
          case 35:
            if (parentArgType === 'plural' || parentArgType === 'selectordinal') {
              break;
            }
            return null;
          default:
            return null;
        }
        this.bump(); // apostrophe
        var codePoints = [this.char()]; // escaped char
        this.bump();
        // read chars until the optional closing apostrophe is found
        while (!this.isEOF()) {
          var ch = this.char();
          if (ch === 39 /* `'` */) {
            if (this.peek() === 39 /* `'` */) {
              codePoints.push(39);
              // Bump one more time because we need to skip 2 characters.
              this.bump();
            } else {
              // Optional closing apostrophe.
              this.bump();
              break;
            }
          } else {
            codePoints.push(ch);
          }
          this.bump();
        }
        return fromCodePoint.apply(void 0, codePoints);
      };
      Parser.prototype.tryParseUnquoted = function (nestingLevel, parentArgType) {
        if (this.isEOF()) {
          return null;
        }
        var ch = this.char();
        if (
          ch === 60 /* `<` */ ||
          ch === 123 /* `{` */ ||
          (ch === 35 /* `#` */ &&
            (parentArgType === 'plural' || parentArgType === 'selectordinal')) ||
          (ch === 125 /* `}` */ && nestingLevel > 0)
        ) {
          return null;
        } else {
          this.bump();
          return fromCodePoint(ch);
        }
      };
      Parser.prototype.parseArgument = function (nestingLevel, expectingCloseTag) {
        var openingBracePosition = this.clonePosition();
        this.bump(); // `{`
        this.bumpSpace();
        if (this.isEOF()) {
          return this.error(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$error$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'ErrorKind'
            ].EXPECT_ARGUMENT_CLOSING_BRACE,
            createLocation(openingBracePosition, this.clonePosition())
          );
        }
        if (this.char() === 125 /* `}` */) {
          this.bump();
          return this.error(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$error$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'ErrorKind'
            ].EMPTY_ARGUMENT,
            createLocation(openingBracePosition, this.clonePosition())
          );
        }
        // argument name
        var value = this.parseIdentifierIfPossible().value;
        if (!value) {
          return this.error(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$error$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'ErrorKind'
            ].MALFORMED_ARGUMENT,
            createLocation(openingBracePosition, this.clonePosition())
          );
        }
        this.bumpSpace();
        if (this.isEOF()) {
          return this.error(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$error$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'ErrorKind'
            ].EXPECT_ARGUMENT_CLOSING_BRACE,
            createLocation(openingBracePosition, this.clonePosition())
          );
        }
        switch (this.char()) {
          // Simple argument: `{name}`
          case 125 /* `}` */: {
            this.bump(); // `}`
            return {
              val: {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'TYPE'
                ].argument,
                // value does not include the opening and closing braces.
                value: value,
                location: createLocation(openingBracePosition, this.clonePosition()),
              },
              err: null,
            };
          }
          // Argument with options: `{name, format, ...}`
          case 44 /* `,` */: {
            this.bump(); // `,`
            this.bumpSpace();
            if (this.isEOF()) {
              return this.error(
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$error$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'ErrorKind'
                ].EXPECT_ARGUMENT_CLOSING_BRACE,
                createLocation(openingBracePosition, this.clonePosition())
              );
            }
            return this.parseArgumentOptions(
              nestingLevel,
              expectingCloseTag,
              value,
              openingBracePosition
            );
          }
          default:
            return this.error(
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$error$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'ErrorKind'
              ].MALFORMED_ARGUMENT,
              createLocation(openingBracePosition, this.clonePosition())
            );
        }
      };
      /**
       * Advance the parser until the end of the identifier, if it is currently on
       * an identifier character. Return an empty string otherwise.
       */ Parser.prototype.parseIdentifierIfPossible = function () {
        var startingPosition = this.clonePosition();
        var startOffset = this.offset();
        var value = matchIdentifierAtIndex(this.message, startOffset);
        var endOffset = startOffset + value.length;
        this.bumpTo(endOffset);
        var endPosition = this.clonePosition();
        var location = createLocation(startingPosition, endPosition);
        return {
          value: value,
          location: location,
        };
      };
      Parser.prototype.parseArgumentOptions = function (
        nestingLevel,
        expectingCloseTag,
        value,
        openingBracePosition
      ) {
        var _a;
        // Parse this range:
        // {name, type, style}
        //        ^---^
        var typeStartPosition = this.clonePosition();
        var argType = this.parseIdentifierIfPossible().value;
        var typeEndPosition = this.clonePosition();
        switch (argType) {
          case '':
            // Expecting a style string number, date, time, plural, selectordinal, or select.
            return this.error(
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$error$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'ErrorKind'
              ].EXPECT_ARGUMENT_TYPE,
              createLocation(typeStartPosition, typeEndPosition)
            );
          case 'number':
          case 'date':
          case 'time': {
            // Parse this range:
            // {name, number, style}
            //              ^-------^
            this.bumpSpace();
            var styleAndLocation = null;
            if (this.bumpIf(',')) {
              this.bumpSpace();
              var styleStartPosition = this.clonePosition();
              var result = this.parseSimpleArgStyleIfPossible();
              if (result.err) {
                return result;
              }
              var style = trimEnd(result.val);
              if (style.length === 0) {
                return this.error(
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$error$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'ErrorKind'
                  ].EXPECT_ARGUMENT_STYLE,
                  createLocation(this.clonePosition(), this.clonePosition())
                );
              }
              var styleLocation = createLocation(styleStartPosition, this.clonePosition());
              styleAndLocation = {
                style: style,
                styleLocation: styleLocation,
              };
            }
            var argCloseResult = this.tryParseArgumentClose(openingBracePosition);
            if (argCloseResult.err) {
              return argCloseResult;
            }
            var location_1 = createLocation(openingBracePosition, this.clonePosition());
            // Extract style or skeleton
            if (
              styleAndLocation &&
              startsWith(
                styleAndLocation === null || styleAndLocation === void 0
                  ? void 0
                  : styleAndLocation.style,
                '::',
                0
              )
            ) {
              // Skeleton starts with `::`.
              var skeleton = trimStart(styleAndLocation.style.slice(2));
              if (argType === 'number') {
                var result = this.parseNumberSkeletonFromString(
                  skeleton,
                  styleAndLocation.styleLocation
                );
                if (result.err) {
                  return result;
                }
                return {
                  val: {
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'TYPE'
                    ].number,
                    value: value,
                    location: location_1,
                    style: result.val,
                  },
                  err: null,
                };
              } else {
                if (skeleton.length === 0) {
                  return this.error(
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$error$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'ErrorKind'
                    ].EXPECT_DATE_TIME_SKELETON,
                    location_1
                  );
                }
                var dateTimePattern = skeleton;
                // Get "best match" pattern only if locale is passed, if not, let it
                // pass as-is where `parseDateTimeSkeleton()` will throw an error
                // for unsupported patterns.
                if (this.locale) {
                  dateTimePattern = (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$date$2d$time$2d$pattern$2d$generator$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'getBestPattern'
                  ])(skeleton, this.locale);
                }
                var style = {
                  type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'SKELETON_TYPE'
                  ].dateTime,
                  pattern: dateTimePattern,
                  location: styleAndLocation.styleLocation,
                  parsedOptions: this.shouldParseSkeletons
                    ? (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$skeleton$2d$parser$2f$lib$2f$date$2d$time$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'parseDateTimeSkeleton'
                      ])(dateTimePattern)
                    : {},
                };
                var type =
                  argType === 'date'
                    ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'TYPE'
                      ].date
                    : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'TYPE'
                      ].time;
                return {
                  val: {
                    type: type,
                    value: value,
                    location: location_1,
                    style: style,
                  },
                  err: null,
                };
              }
            }
            // Regular style or no style.
            return {
              val: {
                type:
                  argType === 'number'
                    ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'TYPE'
                      ].number
                    : argType === 'date'
                      ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'TYPE'
                        ].date
                      : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'TYPE'
                        ].time,
                value: value,
                location: location_1,
                style:
                  (_a =
                    styleAndLocation === null || styleAndLocation === void 0
                      ? void 0
                      : styleAndLocation.style) !== null && _a !== void 0
                    ? _a
                    : null,
              },
              err: null,
            };
          }
          case 'plural':
          case 'selectordinal':
          case 'select': {
            // Parse this range:
            // {name, plural, options}
            //              ^---------^
            var typeEndPosition_1 = this.clonePosition();
            this.bumpSpace();
            if (!this.bumpIf(',')) {
              return this.error(
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$error$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'ErrorKind'
                ].EXPECT_SELECT_ARGUMENT_OPTIONS,
                createLocation(
                  typeEndPosition_1,
                  (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    '__assign'
                  ])({}, typeEndPosition_1)
                )
              );
            }
            this.bumpSpace();
            // Parse offset:
            // {name, plural, offset:1, options}
            //                ^-----^
            //
            // or the first option:
            //
            // {name, plural, one {...} other {...}}
            //                ^--^
            var identifierAndLocation = this.parseIdentifierIfPossible();
            var pluralOffset = 0;
            if (argType !== 'select' && identifierAndLocation.value === 'offset') {
              if (!this.bumpIf(':')) {
                return this.error(
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$error$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'ErrorKind'
                  ].EXPECT_PLURAL_ARGUMENT_OFFSET_VALUE,
                  createLocation(this.clonePosition(), this.clonePosition())
                );
              }
              this.bumpSpace();
              var result = this.tryParseDecimalInteger(
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$error$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'ErrorKind'
                ].EXPECT_PLURAL_ARGUMENT_OFFSET_VALUE,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$error$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'ErrorKind'
                ].INVALID_PLURAL_ARGUMENT_OFFSET_VALUE
              );
              if (result.err) {
                return result;
              }
              // Parse another identifier for option parsing
              this.bumpSpace();
              identifierAndLocation = this.parseIdentifierIfPossible();
              pluralOffset = result.val;
            }
            var optionsResult = this.tryParsePluralOrSelectOptions(
              nestingLevel,
              argType,
              expectingCloseTag,
              identifierAndLocation
            );
            if (optionsResult.err) {
              return optionsResult;
            }
            var argCloseResult = this.tryParseArgumentClose(openingBracePosition);
            if (argCloseResult.err) {
              return argCloseResult;
            }
            var location_2 = createLocation(openingBracePosition, this.clonePosition());
            if (argType === 'select') {
              return {
                val: {
                  type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'TYPE'
                  ].select,
                  value: value,
                  options: fromEntries(optionsResult.val),
                  location: location_2,
                },
                err: null,
              };
            } else {
              return {
                val: {
                  type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'TYPE'
                  ].plural,
                  value: value,
                  options: fromEntries(optionsResult.val),
                  offset: pluralOffset,
                  pluralType: argType === 'plural' ? 'cardinal' : 'ordinal',
                  location: location_2,
                },
                err: null,
              };
            }
          }
          default:
            return this.error(
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$error$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'ErrorKind'
              ].INVALID_ARGUMENT_TYPE,
              createLocation(typeStartPosition, typeEndPosition)
            );
        }
      };
      Parser.prototype.tryParseArgumentClose = function (openingBracePosition) {
        // Parse: {value, number, ::currency/GBP }
        //
        if (this.isEOF() || this.char() !== 125 /* `}` */) {
          return this.error(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$error$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'ErrorKind'
            ].EXPECT_ARGUMENT_CLOSING_BRACE,
            createLocation(openingBracePosition, this.clonePosition())
          );
        }
        this.bump(); // `}`
        return {
          val: true,
          err: null,
        };
      };
      /**
       * See: https://github.com/unicode-org/icu/blob/af7ed1f6d2298013dc303628438ec4abe1f16479/icu4c/source/common/messagepattern.cpp#L659
       */ Parser.prototype.parseSimpleArgStyleIfPossible = function () {
        var nestedBraces = 0;
        var startPosition = this.clonePosition();
        while (!this.isEOF()) {
          var ch = this.char();
          switch (ch) {
            case 39 /* `'` */: {
              // Treat apostrophe as quoting but include it in the style part.
              // Find the end of the quoted literal text.
              this.bump();
              var apostrophePosition = this.clonePosition();
              if (!this.bumpUntil("'")) {
                return this.error(
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$error$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'ErrorKind'
                  ].UNCLOSED_QUOTE_IN_ARGUMENT_STYLE,
                  createLocation(apostrophePosition, this.clonePosition())
                );
              }
              this.bump();
              break;
            }
            case 123 /* `{` */: {
              nestedBraces += 1;
              this.bump();
              break;
            }
            case 125 /* `}` */: {
              if (nestedBraces > 0) {
                nestedBraces -= 1;
              } else {
                return {
                  val: this.message.slice(startPosition.offset, this.offset()),
                  err: null,
                };
              }
              break;
            }
            default:
              this.bump();
              break;
          }
        }
        return {
          val: this.message.slice(startPosition.offset, this.offset()),
          err: null,
        };
      };
      Parser.prototype.parseNumberSkeletonFromString = function (skeleton, location) {
        var tokens = [];
        try {
          tokens = (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$skeleton$2d$parser$2f$lib$2f$number$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'parseNumberSkeletonFromString'
          ])(skeleton);
        } catch (e) {
          return this.error(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$error$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'ErrorKind'
            ].INVALID_NUMBER_SKELETON,
            location
          );
        }
        return {
          val: {
            type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'SKELETON_TYPE'
            ].number,
            tokens: tokens,
            location: location,
            parsedOptions: this.shouldParseSkeletons
              ? (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$skeleton$2d$parser$2f$lib$2f$number$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'parseNumberSkeleton'
                ])(tokens)
              : {},
          },
          err: null,
        };
      };
      /**
       * @param nesting_level The current nesting level of messages.
       *     This can be positive when parsing message fragment in select or plural argument options.
       * @param parent_arg_type The parent argument's type.
       * @param parsed_first_identifier If provided, this is the first identifier-like selector of
       *     the argument. It is a by-product of a previous parsing attempt.
       * @param expecting_close_tag If true, this message is directly or indirectly nested inside
       *     between a pair of opening and closing tags. The nested message will not parse beyond
       *     the closing tag boundary.
       */ Parser.prototype.tryParsePluralOrSelectOptions = function (
        nestingLevel,
        parentArgType,
        expectCloseTag,
        parsedFirstIdentifier
      ) {
        var _a;
        var hasOtherClause = false;
        var options = [];
        var parsedSelectors = new Set();
        var selector = parsedFirstIdentifier.value,
          selectorLocation = parsedFirstIdentifier.location;
        // Parse:
        // one {one apple}
        // ^--^
        while (true) {
          if (selector.length === 0) {
            var startPosition = this.clonePosition();
            if (parentArgType !== 'select' && this.bumpIf('=')) {
              // Try parse `={number}` selector
              var result = this.tryParseDecimalInteger(
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$error$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'ErrorKind'
                ].EXPECT_PLURAL_ARGUMENT_SELECTOR,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$error$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'ErrorKind'
                ].INVALID_PLURAL_ARGUMENT_SELECTOR
              );
              if (result.err) {
                return result;
              }
              selectorLocation = createLocation(startPosition, this.clonePosition());
              selector = this.message.slice(startPosition.offset, this.offset());
            } else {
              break;
            }
          }
          // Duplicate selector clauses
          if (parsedSelectors.has(selector)) {
            return this.error(
              parentArgType === 'select'
                ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$error$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'ErrorKind'
                  ].DUPLICATE_SELECT_ARGUMENT_SELECTOR
                : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$error$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'ErrorKind'
                  ].DUPLICATE_PLURAL_ARGUMENT_SELECTOR,
              selectorLocation
            );
          }
          if (selector === 'other') {
            hasOtherClause = true;
          }
          // Parse:
          // one {one apple}
          //     ^----------^
          this.bumpSpace();
          var openingBracePosition = this.clonePosition();
          if (!this.bumpIf('{')) {
            return this.error(
              parentArgType === 'select'
                ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$error$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'ErrorKind'
                  ].EXPECT_SELECT_ARGUMENT_SELECTOR_FRAGMENT
                : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$error$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'ErrorKind'
                  ].EXPECT_PLURAL_ARGUMENT_SELECTOR_FRAGMENT,
              createLocation(this.clonePosition(), this.clonePosition())
            );
          }
          var fragmentResult = this.parseMessage(nestingLevel + 1, parentArgType, expectCloseTag);
          if (fragmentResult.err) {
            return fragmentResult;
          }
          var argCloseResult = this.tryParseArgumentClose(openingBracePosition);
          if (argCloseResult.err) {
            return argCloseResult;
          }
          options.push([
            selector,
            {
              value: fragmentResult.val,
              location: createLocation(openingBracePosition, this.clonePosition()),
            },
          ]);
          // Keep track of the existing selectors
          parsedSelectors.add(selector);
          // Prep next selector clause.
          this.bumpSpace();
          (_a = this.parseIdentifierIfPossible()),
            (selector = _a.value),
            (selectorLocation = _a.location);
        }
        if (options.length === 0) {
          return this.error(
            parentArgType === 'select'
              ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$error$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'ErrorKind'
                ].EXPECT_SELECT_ARGUMENT_SELECTOR
              : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$error$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'ErrorKind'
                ].EXPECT_PLURAL_ARGUMENT_SELECTOR,
            createLocation(this.clonePosition(), this.clonePosition())
          );
        }
        if (this.requiresOtherClause && !hasOtherClause) {
          return this.error(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$error$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'ErrorKind'
            ].MISSING_OTHER_CLAUSE,
            createLocation(this.clonePosition(), this.clonePosition())
          );
        }
        return {
          val: options,
          err: null,
        };
      };
      Parser.prototype.tryParseDecimalInteger = function (expectNumberError, invalidNumberError) {
        var sign = 1;
        var startingPosition = this.clonePosition();
        if (this.bumpIf('+')) {
        } else if (this.bumpIf('-')) {
          sign = -1;
        }
        var hasDigits = false;
        var decimal = 0;
        while (!this.isEOF()) {
          var ch = this.char();
          if (ch >= 48 /* `0` */ && ch <= 57 /* `9` */) {
            hasDigits = true;
            decimal = decimal * 10 + (ch - 48);
            this.bump();
          } else {
            break;
          }
        }
        var location = createLocation(startingPosition, this.clonePosition());
        if (!hasDigits) {
          return this.error(expectNumberError, location);
        }
        decimal *= sign;
        if (!isSafeInteger(decimal)) {
          return this.error(invalidNumberError, location);
        }
        return {
          val: decimal,
          err: null,
        };
      };
      Parser.prototype.offset = function () {
        return this.position.offset;
      };
      Parser.prototype.isEOF = function () {
        return this.offset() === this.message.length;
      };
      Parser.prototype.clonePosition = function () {
        // This is much faster than `Object.assign` or spread.
        return {
          offset: this.position.offset,
          line: this.position.line,
          column: this.position.column,
        };
      };
      /**
       * Return the code point at the current position of the parser.
       * Throws if the index is out of bound.
       */ Parser.prototype.char = function () {
        var offset = this.position.offset;
        if (offset >= this.message.length) {
          throw Error('out of bound');
        }
        var code = codePointAt(this.message, offset);
        if (code === undefined) {
          throw Error('Offset '.concat(offset, ' is at invalid UTF-16 code unit boundary'));
        }
        return code;
      };
      Parser.prototype.error = function (kind, location) {
        return {
          val: null,
          err: {
            kind: kind,
            message: this.message,
            location: location,
          },
        };
      };
      /** Bump the parser to the next UTF-16 code unit. */ Parser.prototype.bump = function () {
        if (this.isEOF()) {
          return;
        }
        var code = this.char();
        if (code === 10 /* '\n' */) {
          this.position.line += 1;
          this.position.column = 1;
          this.position.offset += 1;
        } else {
          this.position.column += 1;
          // 0 ~ 0x10000 -> unicode BMP, otherwise skip the surrogate pair.
          this.position.offset += code < 0x10000 ? 1 : 2;
        }
      };
      /**
       * If the substring starting at the current position of the parser has
       * the given prefix, then bump the parser to the character immediately
       * following the prefix and return true. Otherwise, don't bump the parser
       * and return false.
       */ Parser.prototype.bumpIf = function (prefix) {
        if (startsWith(this.message, prefix, this.offset())) {
          for (var i = 0; i < prefix.length; i++) {
            this.bump();
          }
          return true;
        }
        return false;
      };
      /**
       * Bump the parser until the pattern character is found and return `true`.
       * Otherwise bump to the end of the file and return `false`.
       */ Parser.prototype.bumpUntil = function (pattern) {
        var currentOffset = this.offset();
        var index = this.message.indexOf(pattern, currentOffset);
        if (index >= 0) {
          this.bumpTo(index);
          return true;
        } else {
          this.bumpTo(this.message.length);
          return false;
        }
      };
      /**
       * Bump the parser to the target offset.
       * If target offset is beyond the end of the input, bump the parser to the end of the input.
       */ Parser.prototype.bumpTo = function (targetOffset) {
        if (this.offset() > targetOffset) {
          throw Error(
            'targetOffset '
              .concat(targetOffset, ' must be greater than or equal to the current offset ')
              .concat(this.offset())
          );
        }
        targetOffset = Math.min(targetOffset, this.message.length);
        while (true) {
          var offset = this.offset();
          if (offset === targetOffset) {
            break;
          }
          if (offset > targetOffset) {
            throw Error(
              'targetOffset '.concat(targetOffset, ' is at invalid UTF-16 code unit boundary')
            );
          }
          this.bump();
          if (this.isEOF()) {
            break;
          }
        }
      };
      /** advance the parser through all whitespace to the next non-whitespace code unit. */ Parser.prototype.bumpSpace =
        function () {
          while (!this.isEOF() && _isWhiteSpace(this.char())) {
            this.bump();
          }
        };
      /**
       * Peek at the *next* Unicode codepoint in the input without advancing the parser.
       * If the input has been exhausted, then this returns null.
       */ Parser.prototype.peek = function () {
        if (this.isEOF()) {
          return null;
        }
        var code = this.char();
        var offset = this.offset();
        var nextCode = this.message.charCodeAt(offset + (code >= 0x10000 ? 2 : 1));
        return nextCode !== null && nextCode !== void 0 ? nextCode : null;
      };
      return Parser;
    })();
    /**
     * This check if codepoint is alphabet (lower & uppercase)
     * @param codepoint
     * @returns
     */ function _isAlpha(codepoint) {
      return (codepoint >= 97 && codepoint <= 122) || (codepoint >= 65 && codepoint <= 90);
    }
    function _isAlphaOrSlash(codepoint) {
      return _isAlpha(codepoint) || codepoint === 47; /* '/' */
    }
    /** See `parseTag` function docs. */ function _isPotentialElementNameChar(c) {
      return (
        c === 45 /* '-' */ ||
        c === 46 /* '.' */ ||
        (c >= 48 && c <= 57) ||
        c === 95 /* '_' */ ||
        (c >= 97 && c <= 122) ||
        (c >= 65 && c <= 90) ||
        c == 0xb7 ||
        (c >= 0xc0 && c <= 0xd6) ||
        (c >= 0xd8 && c <= 0xf6) ||
        (c >= 0xf8 && c <= 0x37d) ||
        (c >= 0x37f && c <= 0x1fff) ||
        (c >= 0x200c && c <= 0x200d) ||
        (c >= 0x203f && c <= 0x2040) ||
        (c >= 0x2070 && c <= 0x218f) ||
        (c >= 0x2c00 && c <= 0x2fef) ||
        (c >= 0x3001 && c <= 0xd7ff) ||
        (c >= 0xf900 && c <= 0xfdcf) ||
        (c >= 0xfdf0 && c <= 0xfffd) ||
        (c >= 0x10000 && c <= 0xeffff)
      );
    }
    /**
     * Code point equivalent of regex `\p{White_Space}`.
     * From: https://www.unicode.org/Public/UCD/latest/ucd/PropList.txt
     */ function _isWhiteSpace(c) {
      return (
        (c >= 0x0009 && c <= 0x000d) ||
        c === 0x0020 ||
        c === 0x0085 ||
        (c >= 0x200e && c <= 0x200f) ||
        c === 0x2028 ||
        c === 0x2029
      );
    }
    /**
     * Code point equivalent of regex `\p{Pattern_Syntax}`.
     * See https://www.unicode.org/Public/UCD/latest/ucd/PropList.txt
     */ function _isPatternSyntax(c) {
      return (
        (c >= 0x0021 && c <= 0x0023) ||
        c === 0x0024 ||
        (c >= 0x0025 && c <= 0x0027) ||
        c === 0x0028 ||
        c === 0x0029 ||
        c === 0x002a ||
        c === 0x002b ||
        c === 0x002c ||
        c === 0x002d ||
        (c >= 0x002e && c <= 0x002f) ||
        (c >= 0x003a && c <= 0x003b) ||
        (c >= 0x003c && c <= 0x003e) ||
        (c >= 0x003f && c <= 0x0040) ||
        c === 0x005b ||
        c === 0x005c ||
        c === 0x005d ||
        c === 0x005e ||
        c === 0x0060 ||
        c === 0x007b ||
        c === 0x007c ||
        c === 0x007d ||
        c === 0x007e ||
        c === 0x00a1 ||
        (c >= 0x00a2 && c <= 0x00a5) ||
        c === 0x00a6 ||
        c === 0x00a7 ||
        c === 0x00a9 ||
        c === 0x00ab ||
        c === 0x00ac ||
        c === 0x00ae ||
        c === 0x00b0 ||
        c === 0x00b1 ||
        c === 0x00b6 ||
        c === 0x00bb ||
        c === 0x00bf ||
        c === 0x00d7 ||
        c === 0x00f7 ||
        (c >= 0x2010 && c <= 0x2015) ||
        (c >= 0x2016 && c <= 0x2017) ||
        c === 0x2018 ||
        c === 0x2019 ||
        c === 0x201a ||
        (c >= 0x201b && c <= 0x201c) ||
        c === 0x201d ||
        c === 0x201e ||
        c === 0x201f ||
        (c >= 0x2020 && c <= 0x2027) ||
        (c >= 0x2030 && c <= 0x2038) ||
        c === 0x2039 ||
        c === 0x203a ||
        (c >= 0x203b && c <= 0x203e) ||
        (c >= 0x2041 && c <= 0x2043) ||
        c === 0x2044 ||
        c === 0x2045 ||
        c === 0x2046 ||
        (c >= 0x2047 && c <= 0x2051) ||
        c === 0x2052 ||
        c === 0x2053 ||
        (c >= 0x2055 && c <= 0x205e) ||
        (c >= 0x2190 && c <= 0x2194) ||
        (c >= 0x2195 && c <= 0x2199) ||
        (c >= 0x219a && c <= 0x219b) ||
        (c >= 0x219c && c <= 0x219f) ||
        c === 0x21a0 ||
        (c >= 0x21a1 && c <= 0x21a2) ||
        c === 0x21a3 ||
        (c >= 0x21a4 && c <= 0x21a5) ||
        c === 0x21a6 ||
        (c >= 0x21a7 && c <= 0x21ad) ||
        c === 0x21ae ||
        (c >= 0x21af && c <= 0x21cd) ||
        (c >= 0x21ce && c <= 0x21cf) ||
        (c >= 0x21d0 && c <= 0x21d1) ||
        c === 0x21d2 ||
        c === 0x21d3 ||
        c === 0x21d4 ||
        (c >= 0x21d5 && c <= 0x21f3) ||
        (c >= 0x21f4 && c <= 0x22ff) ||
        (c >= 0x2300 && c <= 0x2307) ||
        c === 0x2308 ||
        c === 0x2309 ||
        c === 0x230a ||
        c === 0x230b ||
        (c >= 0x230c && c <= 0x231f) ||
        (c >= 0x2320 && c <= 0x2321) ||
        (c >= 0x2322 && c <= 0x2328) ||
        c === 0x2329 ||
        c === 0x232a ||
        (c >= 0x232b && c <= 0x237b) ||
        c === 0x237c ||
        (c >= 0x237d && c <= 0x239a) ||
        (c >= 0x239b && c <= 0x23b3) ||
        (c >= 0x23b4 && c <= 0x23db) ||
        (c >= 0x23dc && c <= 0x23e1) ||
        (c >= 0x23e2 && c <= 0x2426) ||
        (c >= 0x2427 && c <= 0x243f) ||
        (c >= 0x2440 && c <= 0x244a) ||
        (c >= 0x244b && c <= 0x245f) ||
        (c >= 0x2500 && c <= 0x25b6) ||
        c === 0x25b7 ||
        (c >= 0x25b8 && c <= 0x25c0) ||
        c === 0x25c1 ||
        (c >= 0x25c2 && c <= 0x25f7) ||
        (c >= 0x25f8 && c <= 0x25ff) ||
        (c >= 0x2600 && c <= 0x266e) ||
        c === 0x266f ||
        (c >= 0x2670 && c <= 0x2767) ||
        c === 0x2768 ||
        c === 0x2769 ||
        c === 0x276a ||
        c === 0x276b ||
        c === 0x276c ||
        c === 0x276d ||
        c === 0x276e ||
        c === 0x276f ||
        c === 0x2770 ||
        c === 0x2771 ||
        c === 0x2772 ||
        c === 0x2773 ||
        c === 0x2774 ||
        c === 0x2775 ||
        (c >= 0x2794 && c <= 0x27bf) ||
        (c >= 0x27c0 && c <= 0x27c4) ||
        c === 0x27c5 ||
        c === 0x27c6 ||
        (c >= 0x27c7 && c <= 0x27e5) ||
        c === 0x27e6 ||
        c === 0x27e7 ||
        c === 0x27e8 ||
        c === 0x27e9 ||
        c === 0x27ea ||
        c === 0x27eb ||
        c === 0x27ec ||
        c === 0x27ed ||
        c === 0x27ee ||
        c === 0x27ef ||
        (c >= 0x27f0 && c <= 0x27ff) ||
        (c >= 0x2800 && c <= 0x28ff) ||
        (c >= 0x2900 && c <= 0x2982) ||
        c === 0x2983 ||
        c === 0x2984 ||
        c === 0x2985 ||
        c === 0x2986 ||
        c === 0x2987 ||
        c === 0x2988 ||
        c === 0x2989 ||
        c === 0x298a ||
        c === 0x298b ||
        c === 0x298c ||
        c === 0x298d ||
        c === 0x298e ||
        c === 0x298f ||
        c === 0x2990 ||
        c === 0x2991 ||
        c === 0x2992 ||
        c === 0x2993 ||
        c === 0x2994 ||
        c === 0x2995 ||
        c === 0x2996 ||
        c === 0x2997 ||
        c === 0x2998 ||
        (c >= 0x2999 && c <= 0x29d7) ||
        c === 0x29d8 ||
        c === 0x29d9 ||
        c === 0x29da ||
        c === 0x29db ||
        (c >= 0x29dc && c <= 0x29fb) ||
        c === 0x29fc ||
        c === 0x29fd ||
        (c >= 0x29fe && c <= 0x2aff) ||
        (c >= 0x2b00 && c <= 0x2b2f) ||
        (c >= 0x2b30 && c <= 0x2b44) ||
        (c >= 0x2b45 && c <= 0x2b46) ||
        (c >= 0x2b47 && c <= 0x2b4c) ||
        (c >= 0x2b4d && c <= 0x2b73) ||
        (c >= 0x2b74 && c <= 0x2b75) ||
        (c >= 0x2b76 && c <= 0x2b95) ||
        c === 0x2b96 ||
        (c >= 0x2b97 && c <= 0x2bff) ||
        (c >= 0x2e00 && c <= 0x2e01) ||
        c === 0x2e02 ||
        c === 0x2e03 ||
        c === 0x2e04 ||
        c === 0x2e05 ||
        (c >= 0x2e06 && c <= 0x2e08) ||
        c === 0x2e09 ||
        c === 0x2e0a ||
        c === 0x2e0b ||
        c === 0x2e0c ||
        c === 0x2e0d ||
        (c >= 0x2e0e && c <= 0x2e16) ||
        c === 0x2e17 ||
        (c >= 0x2e18 && c <= 0x2e19) ||
        c === 0x2e1a ||
        c === 0x2e1b ||
        c === 0x2e1c ||
        c === 0x2e1d ||
        (c >= 0x2e1e && c <= 0x2e1f) ||
        c === 0x2e20 ||
        c === 0x2e21 ||
        c === 0x2e22 ||
        c === 0x2e23 ||
        c === 0x2e24 ||
        c === 0x2e25 ||
        c === 0x2e26 ||
        c === 0x2e27 ||
        c === 0x2e28 ||
        c === 0x2e29 ||
        (c >= 0x2e2a && c <= 0x2e2e) ||
        c === 0x2e2f ||
        (c >= 0x2e30 && c <= 0x2e39) ||
        (c >= 0x2e3a && c <= 0x2e3b) ||
        (c >= 0x2e3c && c <= 0x2e3f) ||
        c === 0x2e40 ||
        c === 0x2e41 ||
        c === 0x2e42 ||
        (c >= 0x2e43 && c <= 0x2e4f) ||
        (c >= 0x2e50 && c <= 0x2e51) ||
        c === 0x2e52 ||
        (c >= 0x2e53 && c <= 0x2e7f) ||
        (c >= 0x3001 && c <= 0x3003) ||
        c === 0x3008 ||
        c === 0x3009 ||
        c === 0x300a ||
        c === 0x300b ||
        c === 0x300c ||
        c === 0x300d ||
        c === 0x300e ||
        c === 0x300f ||
        c === 0x3010 ||
        c === 0x3011 ||
        (c >= 0x3012 && c <= 0x3013) ||
        c === 0x3014 ||
        c === 0x3015 ||
        c === 0x3016 ||
        c === 0x3017 ||
        c === 0x3018 ||
        c === 0x3019 ||
        c === 0x301a ||
        c === 0x301b ||
        c === 0x301c ||
        c === 0x301d ||
        (c >= 0x301e && c <= 0x301f) ||
        c === 0x3020 ||
        c === 0x3030 ||
        c === 0xfd3e ||
        c === 0xfd3f ||
        (c >= 0xfe45 && c <= 0xfe46)
      );
    }
  },
  '[project]/node_modules/@formatjs/icu-messageformat-parser/lib/manipulator.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'hoistSelectors',
      () => hoistSelectors,
      'isStructurallySame',
      () => isStructurallySame,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/tslib/tslib.es6.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@formatjs/icu-messageformat-parser/lib/types.js [app-client] (ecmascript)'
      );
    function cloneDeep(obj) {
      if (Array.isArray(obj)) {
        // @ts-expect-error meh
        return (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          '__spreadArray'
        ])([], obj.map(cloneDeep), true);
      }
      if (obj !== null && typeof obj === 'object') {
        // @ts-expect-error meh
        return Object.keys(obj).reduce(function (cloned, k) {
          // @ts-expect-error meh
          cloned[k] = cloneDeep(obj[k]);
          return cloned;
        }, {});
      }
      return obj;
    }
    function hoistPluralOrSelectElement(ast, el, positionToInject) {
      // pull this out of the ast and move it to the top
      var cloned = cloneDeep(el);
      var options = cloned.options;
      cloned.options = Object.keys(options).reduce(function (all, k) {
        var newValue = hoistSelectors(
          (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            '__spreadArray'
          ])(
            (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              '__spreadArray'
            ])(
              (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                '__spreadArray'
              ])([], ast.slice(0, positionToInject), true),
              options[k].value,
              true
            ),
            ast.slice(positionToInject + 1),
            true
          )
        );
        all[k] = {
          value: newValue,
        };
        return all;
      }, {});
      return cloned;
    }
    function isPluralOrSelectElement(el) {
      return (
        (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'isPluralElement'
        ])(el) ||
        (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'isSelectElement'
        ])(el)
      );
    }
    function findPluralOrSelectElement(ast) {
      return !!ast.find(function (el) {
        if (isPluralOrSelectElement(el)) {
          return true;
        }
        if (
          (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'isTagElement'
          ])(el)
        ) {
          return findPluralOrSelectElement(el.children);
        }
        return false;
      });
    }
    function hoistSelectors(ast) {
      for (var i = 0; i < ast.length; i++) {
        var el = ast[i];
        if (isPluralOrSelectElement(el)) {
          return [hoistPluralOrSelectElement(ast, el, i)];
        }
        if (
          (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'isTagElement'
          ])(el) &&
          findPluralOrSelectElement([el])
        ) {
          throw new Error(
            'Cannot hoist plural/select within a tag element. Please put the tag element inside each plural/select option'
          );
        }
      }
      return ast;
    }
    /**
     * Collect all variables in an AST to Record<string, TYPE>
     * @param ast AST to collect variables from
     * @param vars Record of variable name to variable type
     */ function collectVariables(ast, vars) {
      if (vars === void 0) {
        vars = new Map();
      }
      ast.forEach(function (el) {
        if (
          (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'isArgumentElement'
          ])(el) ||
          (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'isDateElement'
          ])(el) ||
          (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'isTimeElement'
          ])(el) ||
          (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'isNumberElement'
          ])(el)
        ) {
          if (el.value in vars && vars.get(el.value) !== el.type) {
            throw new Error('Variable '.concat(el.value, ' has conflicting types'));
          }
          vars.set(el.value, el.type);
        }
        if (
          (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'isPluralElement'
          ])(el) ||
          (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'isSelectElement'
          ])(el)
        ) {
          vars.set(el.value, el.type);
          Object.keys(el.options).forEach(function (k) {
            collectVariables(el.options[k].value, vars);
          });
        }
        if (
          (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'isTagElement'
          ])(el)
        ) {
          vars.set(el.value, el.type);
          collectVariables(el.children, vars);
        }
      });
    }
    function isStructurallySame(a, b) {
      var aVars = new Map();
      var bVars = new Map();
      collectVariables(a, aVars);
      collectVariables(b, bVars);
      if (aVars.size !== bVars.size) {
        return {
          success: false,
          error: new Error(
            'Different number of variables: ['
              .concat(Array.from(aVars.keys()).join(', '), '] vs [')
              .concat(Array.from(bVars.keys()).join(', '), ']')
          ),
        };
      }
      return Array.from(aVars.entries()).reduce(
        function (result, _a) {
          var key = _a[0],
            type = _a[1];
          if (!result.success) {
            return result;
          }
          var bType = bVars.get(key);
          if (bType == null) {
            return {
              success: false,
              error: new Error('Missing variable '.concat(key, ' in message')),
            };
          }
          if (bType !== type) {
            return {
              success: false,
              error: new Error(
                'Variable '
                  .concat(key, ' has conflicting types: ')
                  .concat(
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'TYPE'
                    ][type],
                    ' vs '
                  )
                  .concat(
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'TYPE'
                    ][bType]
                  )
              ),
            };
          }
          return result;
        },
        {
          success: true,
        }
      );
    }
  },
  '[project]/node_modules/@formatjs/icu-messageformat-parser/lib/index.js [app-client] (ecmascript) <locals>',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['_Parser', () => _Parser, 'parse', () => parse]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/tslib/tslib.es6.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$error$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@formatjs/icu-messageformat-parser/lib/error.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$parser$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@formatjs/icu-messageformat-parser/lib/parser.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@formatjs/icu-messageformat-parser/lib/types.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$manipulator$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@formatjs/icu-messageformat-parser/lib/manipulator.js [app-client] (ecmascript)'
      );
    function pruneLocation(els) {
      els.forEach(function (el) {
        delete el.location;
        if (
          (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'isSelectElement'
          ])(el) ||
          (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'isPluralElement'
          ])(el)
        ) {
          for (var k in el.options) {
            delete el.options[k].location;
            pruneLocation(el.options[k].value);
          }
        } else if (
          (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'isNumberElement'
          ])(el) &&
          (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'isNumberSkeleton'
          ])(el.style)
        ) {
          delete el.style.location;
        } else if (
          ((0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'isDateElement'
          ])(el) ||
            (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'isTimeElement'
            ])(el)) &&
          (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'isDateTimeSkeleton'
          ])(el.style)
        ) {
          delete el.style.location;
        } else if (
          (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'isTagElement'
          ])(el)
        ) {
          pruneLocation(el.children);
        }
      });
    }
    function parse(message, opts) {
      if (opts === void 0) {
        opts = {};
      }
      opts = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        '__assign'
      ])(
        {
          shouldParseSkeletons: true,
          requiresOtherClause: true,
        },
        opts
      );
      var result =
        new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$parser$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Parser'
        ](message, opts).parse();
      if (result.err) {
        var error = SyntaxError(
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$error$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'ErrorKind'
          ][result.err.kind]
        );
        // @ts-expect-error Assign to error object
        error.location = result.err.location;
        // @ts-expect-error Assign to error object
        error.originalMessage = result.err.message;
        throw error;
      }
      if (!(opts === null || opts === void 0 ? void 0 : opts.captureLocation)) {
        pruneLocation(result.val);
      }
      return result.val;
    }
    var _Parser =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$parser$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'Parser'
      ];
  },
  '[project]/node_modules/@formatjs/icu-skeleton-parser/lib/date-time.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['parseDateTimeSkeleton', () => parseDateTimeSkeleton]);
    /**
     * https://unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
     * Credit: https://github.com/caridy/intl-datetimeformat-pattern/blob/master/index.js
     * with some tweaks
     */ var DATE_TIME_REGEX =
      /(?:[Eec]{1,6}|G{1,5}|[Qq]{1,5}|(?:[yYur]+|U{1,5})|[ML]{1,5}|d{1,2}|D{1,3}|F{1}|[abB]{1,5}|[hkHK]{1,2}|w{1,2}|W{1}|m{1,2}|s{1,2}|[zZOvVxX]{1,4})(?=([^']*'[^']*')*[^']*$)/g;
    function parseDateTimeSkeleton(skeleton) {
      var result = {};
      skeleton.replace(DATE_TIME_REGEX, function (match) {
        var len = match.length;
        switch (match[0]) {
          // Era
          case 'G':
            result.era = len === 4 ? 'long' : len === 5 ? 'narrow' : 'short';
            break;
          // Year
          case 'y':
            result.year = len === 2 ? '2-digit' : 'numeric';
            break;
          case 'Y':
          case 'u':
          case 'U':
          case 'r':
            throw new RangeError('`Y/u/U/r` (year) patterns are not supported, use `y` instead');
          // Quarter
          case 'q':
          case 'Q':
            throw new RangeError('`q/Q` (quarter) patterns are not supported');
          // Month
          case 'M':
          case 'L':
            result.month = ['numeric', '2-digit', 'short', 'long', 'narrow'][len - 1];
            break;
          // Week
          case 'w':
          case 'W':
            throw new RangeError('`w/W` (week) patterns are not supported');
          case 'd':
            result.day = ['numeric', '2-digit'][len - 1];
            break;
          case 'D':
          case 'F':
          case 'g':
            throw new RangeError('`D/F/g` (day) patterns are not supported, use `d` instead');
          // Weekday
          case 'E':
            result.weekday = len === 4 ? 'long' : len === 5 ? 'narrow' : 'short';
            break;
          case 'e':
            if (len < 4) {
              throw new RangeError('`e..eee` (weekday) patterns are not supported');
            }
            result.weekday = ['short', 'long', 'narrow', 'short'][len - 4];
            break;
          case 'c':
            if (len < 4) {
              throw new RangeError('`c..ccc` (weekday) patterns are not supported');
            }
            result.weekday = ['short', 'long', 'narrow', 'short'][len - 4];
            break;
          // Period
          case 'a':
            result.hour12 = true;
            break;
          case 'b':
          case 'B':
            throw new RangeError('`b/B` (period) patterns are not supported, use `a` instead');
          // Hour
          case 'h':
            result.hourCycle = 'h12';
            result.hour = ['numeric', '2-digit'][len - 1];
            break;
          case 'H':
            result.hourCycle = 'h23';
            result.hour = ['numeric', '2-digit'][len - 1];
            break;
          case 'K':
            result.hourCycle = 'h11';
            result.hour = ['numeric', '2-digit'][len - 1];
            break;
          case 'k':
            result.hourCycle = 'h24';
            result.hour = ['numeric', '2-digit'][len - 1];
            break;
          case 'j':
          case 'J':
          case 'C':
            throw new RangeError(
              '`j/J/C` (hour) patterns are not supported, use `h/H/K/k` instead'
            );
          // Minute
          case 'm':
            result.minute = ['numeric', '2-digit'][len - 1];
            break;
          // Second
          case 's':
            result.second = ['numeric', '2-digit'][len - 1];
            break;
          case 'S':
          case 'A':
            throw new RangeError('`S/A` (second) patterns are not supported, use `s` instead');
          // Zone
          case 'z':
            result.timeZoneName = len < 4 ? 'short' : 'long';
            break;
          case 'Z':
          case 'O':
          case 'v':
          case 'V':
          case 'X':
          case 'x':
            throw new RangeError(
              '`Z/O/v/V/X/x` (timeZone) patterns are not supported, use `z` instead'
            );
        }
        return '';
      });
      return result;
    }
  },
  '[project]/node_modules/@formatjs/icu-skeleton-parser/lib/regex.generated.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    // @generated from regex-gen.ts
    __turbopack_context__.s(['WHITE_SPACE_REGEX', () => WHITE_SPACE_REGEX]);
    var WHITE_SPACE_REGEX = /[\t-\r \x85\u200E\u200F\u2028\u2029]/i;
  },
  '[project]/node_modules/@formatjs/icu-skeleton-parser/lib/number.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'parseNumberSkeleton',
      () => parseNumberSkeleton,
      'parseNumberSkeletonFromString',
      () => parseNumberSkeletonFromString,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/tslib/tslib.es6.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$skeleton$2d$parser$2f$lib$2f$regex$2e$generated$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@formatjs/icu-skeleton-parser/lib/regex.generated.js [app-client] (ecmascript)'
      );
    function parseNumberSkeletonFromString(skeleton) {
      if (skeleton.length === 0) {
        throw new Error('Number skeleton cannot be empty');
      }
      // Parse the skeleton
      var stringTokens = skeleton
        .split(
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$skeleton$2d$parser$2f$lib$2f$regex$2e$generated$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'WHITE_SPACE_REGEX'
          ]
        )
        .filter(function (x) {
          return x.length > 0;
        });
      var tokens = [];
      for (var _i = 0, stringTokens_1 = stringTokens; _i < stringTokens_1.length; _i++) {
        var stringToken = stringTokens_1[_i];
        var stemAndOptions = stringToken.split('/');
        if (stemAndOptions.length === 0) {
          throw new Error('Invalid number skeleton');
        }
        var stem = stemAndOptions[0],
          options = stemAndOptions.slice(1);
        for (var _a = 0, options_1 = options; _a < options_1.length; _a++) {
          var option = options_1[_a];
          if (option.length === 0) {
            throw new Error('Invalid number skeleton');
          }
        }
        tokens.push({
          stem: stem,
          options: options,
        });
      }
      return tokens;
    }
    function icuUnitToEcma(unit) {
      return unit.replace(/^(.*?)-/, '');
    }
    var FRACTION_PRECISION_REGEX = /^\.(?:(0+)(\*)?|(#+)|(0+)(#+))$/g;
    var SIGNIFICANT_PRECISION_REGEX = /^(@+)?(\+|#+)?[rs]?$/g;
    var INTEGER_WIDTH_REGEX = /(\*)(0+)|(#+)(0+)|(0+)/g;
    var CONCISE_INTEGER_WIDTH_REGEX = /^(0+)$/;
    function parseSignificantPrecision(str) {
      var result = {};
      if (str[str.length - 1] === 'r') {
        result.roundingPriority = 'morePrecision';
      } else if (str[str.length - 1] === 's') {
        result.roundingPriority = 'lessPrecision';
      }
      str.replace(SIGNIFICANT_PRECISION_REGEX, function (_, g1, g2) {
        // @@@ case
        if (typeof g2 !== 'string') {
          result.minimumSignificantDigits = g1.length;
          result.maximumSignificantDigits = g1.length;
        } else if (g2 === '+') {
          result.minimumSignificantDigits = g1.length;
        } else if (g1[0] === '#') {
          result.maximumSignificantDigits = g1.length;
        } else {
          result.minimumSignificantDigits = g1.length;
          result.maximumSignificantDigits = g1.length + (typeof g2 === 'string' ? g2.length : 0);
        }
        return '';
      });
      return result;
    }
    function parseSign(str) {
      switch (str) {
        case 'sign-auto':
          return {
            signDisplay: 'auto',
          };
        case 'sign-accounting':
        case '()':
          return {
            currencySign: 'accounting',
          };
        case 'sign-always':
        case '+!':
          return {
            signDisplay: 'always',
          };
        case 'sign-accounting-always':
        case '()!':
          return {
            signDisplay: 'always',
            currencySign: 'accounting',
          };
        case 'sign-except-zero':
        case '+?':
          return {
            signDisplay: 'exceptZero',
          };
        case 'sign-accounting-except-zero':
        case '()?':
          return {
            signDisplay: 'exceptZero',
            currencySign: 'accounting',
          };
        case 'sign-never':
        case '+_':
          return {
            signDisplay: 'never',
          };
      }
    }
    function parseConciseScientificAndEngineeringStem(stem) {
      // Engineering
      var result;
      if (stem[0] === 'E' && stem[1] === 'E') {
        result = {
          notation: 'engineering',
        };
        stem = stem.slice(2);
      } else if (stem[0] === 'E') {
        result = {
          notation: 'scientific',
        };
        stem = stem.slice(1);
      }
      if (result) {
        var signDisplay = stem.slice(0, 2);
        if (signDisplay === '+!') {
          result.signDisplay = 'always';
          stem = stem.slice(2);
        } else if (signDisplay === '+?') {
          result.signDisplay = 'exceptZero';
          stem = stem.slice(2);
        }
        if (!CONCISE_INTEGER_WIDTH_REGEX.test(stem)) {
          throw new Error('Malformed concise eng/scientific notation');
        }
        result.minimumIntegerDigits = stem.length;
      }
      return result;
    }
    function parseNotationOptions(opt) {
      var result = {};
      var signOpts = parseSign(opt);
      if (signOpts) {
        return signOpts;
      }
      return result;
    }
    function parseNumberSkeleton(tokens) {
      var result = {};
      for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
        var token = tokens_1[_i];
        switch (token.stem) {
          case 'percent':
          case '%':
            result.style = 'percent';
            continue;
          case '%x100':
            result.style = 'percent';
            result.scale = 100;
            continue;
          case 'currency':
            result.style = 'currency';
            result.currency = token.options[0];
            continue;
          case 'group-off':
          case ',_':
            result.useGrouping = false;
            continue;
          case 'precision-integer':
          case '.':
            result.maximumFractionDigits = 0;
            continue;
          case 'measure-unit':
          case 'unit':
            result.style = 'unit';
            result.unit = icuUnitToEcma(token.options[0]);
            continue;
          case 'compact-short':
          case 'K':
            result.notation = 'compact';
            result.compactDisplay = 'short';
            continue;
          case 'compact-long':
          case 'KK':
            result.notation = 'compact';
            result.compactDisplay = 'long';
            continue;
          case 'scientific':
            result = (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              '__assign'
            ])(
              (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                '__assign'
              ])(
                (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  '__assign'
                ])({}, result),
                {
                  notation: 'scientific',
                }
              ),
              token.options.reduce(function (all, opt) {
                return (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  '__assign'
                ])(
                  (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    '__assign'
                  ])({}, all),
                  parseNotationOptions(opt)
                );
              }, {})
            );
            continue;
          case 'engineering':
            result = (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              '__assign'
            ])(
              (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                '__assign'
              ])(
                (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  '__assign'
                ])({}, result),
                {
                  notation: 'engineering',
                }
              ),
              token.options.reduce(function (all, opt) {
                return (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  '__assign'
                ])(
                  (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    '__assign'
                  ])({}, all),
                  parseNotationOptions(opt)
                );
              }, {})
            );
            continue;
          case 'notation-simple':
            result.notation = 'standard';
            continue;
          // https://github.com/unicode-org/icu/blob/master/icu4c/source/i18n/unicode/unumberformatter.h
          case 'unit-width-narrow':
            result.currencyDisplay = 'narrowSymbol';
            result.unitDisplay = 'narrow';
            continue;
          case 'unit-width-short':
            result.currencyDisplay = 'code';
            result.unitDisplay = 'short';
            continue;
          case 'unit-width-full-name':
            result.currencyDisplay = 'name';
            result.unitDisplay = 'long';
            continue;
          case 'unit-width-iso-code':
            result.currencyDisplay = 'symbol';
            continue;
          case 'scale':
            result.scale = parseFloat(token.options[0]);
            continue;
          case 'rounding-mode-floor':
            result.roundingMode = 'floor';
            continue;
          case 'rounding-mode-ceiling':
            result.roundingMode = 'ceil';
            continue;
          case 'rounding-mode-down':
            result.roundingMode = 'trunc';
            continue;
          case 'rounding-mode-up':
            result.roundingMode = 'expand';
            continue;
          case 'rounding-mode-half-even':
            result.roundingMode = 'halfEven';
            continue;
          case 'rounding-mode-half-down':
            result.roundingMode = 'halfTrunc';
            continue;
          case 'rounding-mode-half-up':
            result.roundingMode = 'halfExpand';
            continue;
          // https://unicode-org.github.io/icu/userguide/format_parse/numbers/skeletons.html#integer-width
          case 'integer-width':
            if (token.options.length > 1) {
              throw new RangeError('integer-width stems only accept a single optional option');
            }
            token.options[0].replace(INTEGER_WIDTH_REGEX, function (_, g1, g2, g3, g4, g5) {
              if (g1) {
                result.minimumIntegerDigits = g2.length;
              } else if (g3 && g4) {
                throw new Error('We currently do not support maximum integer digits');
              } else if (g5) {
                throw new Error('We currently do not support exact integer digits');
              }
              return '';
            });
            continue;
        }
        // https://unicode-org.github.io/icu/userguide/format_parse/numbers/skeletons.html#integer-width
        if (CONCISE_INTEGER_WIDTH_REGEX.test(token.stem)) {
          result.minimumIntegerDigits = token.stem.length;
          continue;
        }
        if (FRACTION_PRECISION_REGEX.test(token.stem)) {
          // Precision
          // https://unicode-org.github.io/icu/userguide/format_parse/numbers/skeletons.html#fraction-precision
          // precision-integer case
          if (token.options.length > 1) {
            throw new RangeError('Fraction-precision stems only accept a single optional option');
          }
          token.stem.replace(FRACTION_PRECISION_REGEX, function (_, g1, g2, g3, g4, g5) {
            // .000* case (before ICU67 it was .000+)
            if (g2 === '*') {
              result.minimumFractionDigits = g1.length;
            } else if (g3 && g3[0] === '#') {
              result.maximumFractionDigits = g3.length;
            } else if (g4 && g5) {
              result.minimumFractionDigits = g4.length;
              result.maximumFractionDigits = g4.length + g5.length;
            } else {
              result.minimumFractionDigits = g1.length;
              result.maximumFractionDigits = g1.length;
            }
            return '';
          });
          var opt = token.options[0];
          // https://unicode-org.github.io/icu/userguide/format_parse/numbers/skeletons.html#trailing-zero-display
          if (opt === 'w') {
            result = (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              '__assign'
            ])(
              (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                '__assign'
              ])({}, result),
              {
                trailingZeroDisplay: 'stripIfInteger',
              }
            );
          } else if (opt) {
            result = (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              '__assign'
            ])(
              (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                '__assign'
              ])({}, result),
              parseSignificantPrecision(opt)
            );
          }
          continue;
        }
        // https://unicode-org.github.io/icu/userguide/format_parse/numbers/skeletons.html#significant-digits-precision
        if (SIGNIFICANT_PRECISION_REGEX.test(token.stem)) {
          result = (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            '__assign'
          ])(
            (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              '__assign'
            ])({}, result),
            parseSignificantPrecision(token.stem)
          );
          continue;
        }
        var signOpts = parseSign(token.stem);
        if (signOpts) {
          result = (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            '__assign'
          ])(
            (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              '__assign'
            ])({}, result),
            signOpts
          );
        }
        var conciseScientificAndEngineeringOpts = parseConciseScientificAndEngineeringStem(
          token.stem
        );
        if (conciseScientificAndEngineeringOpts) {
          result = (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            '__assign'
          ])(
            (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              '__assign'
            ])({}, result),
            conciseScientificAndEngineeringOpts
          );
        }
      }
      return result;
    }
  },
  '[project]/node_modules/@formatjs/icu-skeleton-parser/lib/index.js [app-client] (ecmascript) <locals>',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$skeleton$2d$parser$2f$lib$2f$date$2d$time$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@formatjs/icu-skeleton-parser/lib/date-time.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$skeleton$2d$parser$2f$lib$2f$number$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@formatjs/icu-skeleton-parser/lib/number.js [app-client] (ecmascript)'
      );
  },
  '[project]/node_modules/intl-messageformat/lib/src/error.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'ErrorCode',
      () => ErrorCode,
      'FormatError',
      () => FormatError,
      'InvalidValueError',
      () => InvalidValueError,
      'InvalidValueTypeError',
      () => InvalidValueTypeError,
      'MissingValueError',
      () => MissingValueError,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/tslib/tslib.es6.mjs [app-client] (ecmascript)'
      );
    var ErrorCode;
    (function (ErrorCode) {
      // When we have a placeholder but no value to format
      ErrorCode['MISSING_VALUE'] = 'MISSING_VALUE';
      // When value supplied is invalid
      ErrorCode['INVALID_VALUE'] = 'INVALID_VALUE';
      // When we need specific Intl API but it's not available
      ErrorCode['MISSING_INTL_API'] = 'MISSING_INTL_API';
    })(ErrorCode || (ErrorCode = {}));
    var FormatError = (function (_super) {
      (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        '__extends'
      ])(FormatError, _super);
      function FormatError(msg, code, originalMessage) {
        var _this = _super.call(this, msg) || this;
        _this.code = code;
        _this.originalMessage = originalMessage;
        return _this;
      }
      FormatError.prototype.toString = function () {
        return '[formatjs Error: '.concat(this.code, '] ').concat(this.message);
      };
      return FormatError;
    })(Error);
    var InvalidValueError = (function (_super) {
      (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        '__extends'
      ])(InvalidValueError, _super);
      function InvalidValueError(variableId, value, options, originalMessage) {
        return (
          _super.call(
            this,
            'Invalid values for "'
              .concat(variableId, '": "')
              .concat(value, '". Options are "')
              .concat(Object.keys(options).join('", "'), '"'),
            ErrorCode.INVALID_VALUE,
            originalMessage
          ) || this
        );
      }
      return InvalidValueError;
    })(FormatError);
    var InvalidValueTypeError = (function (_super) {
      (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        '__extends'
      ])(InvalidValueTypeError, _super);
      function InvalidValueTypeError(value, type, originalMessage) {
        return (
          _super.call(
            this,
            'Value for "'.concat(value, '" must be of type ').concat(type),
            ErrorCode.INVALID_VALUE,
            originalMessage
          ) || this
        );
      }
      return InvalidValueTypeError;
    })(FormatError);
    var MissingValueError = (function (_super) {
      (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        '__extends'
      ])(MissingValueError, _super);
      function MissingValueError(variableId, originalMessage) {
        return (
          _super.call(
            this,
            'The intl string context variable "'
              .concat(variableId, '" was not provided to the string "')
              .concat(originalMessage, '"'),
            ErrorCode.MISSING_VALUE,
            originalMessage
          ) || this
        );
      }
      return MissingValueError;
    })(FormatError);
  },
  '[project]/node_modules/intl-messageformat/lib/src/formatters.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'PART_TYPE',
      () => PART_TYPE,
      'formatToParts',
      () => formatToParts,
      'isFormatXMLElementFn',
      () => isFormatXMLElementFn,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@formatjs/icu-messageformat-parser/lib/index.js [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@formatjs/icu-messageformat-parser/lib/types.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$intl$2d$messageformat$2f$lib$2f$src$2f$error$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/intl-messageformat/lib/src/error.js [app-client] (ecmascript)'
      );
    var PART_TYPE;
    (function (PART_TYPE) {
      PART_TYPE[(PART_TYPE['literal'] = 0)] = 'literal';
      PART_TYPE[(PART_TYPE['object'] = 1)] = 'object';
    })(PART_TYPE || (PART_TYPE = {}));
    function mergeLiteral(parts) {
      if (parts.length < 2) {
        return parts;
      }
      return parts.reduce(function (all, part) {
        var lastPart = all[all.length - 1];
        if (!lastPart || lastPart.type !== PART_TYPE.literal || part.type !== PART_TYPE.literal) {
          all.push(part);
        } else {
          lastPart.value += part.value;
        }
        return all;
      }, []);
    }
    function isFormatXMLElementFn(el) {
      return typeof el === 'function';
    }
    function formatToParts(
      els,
      locales,
      formatters,
      formats,
      values,
      currentPluralValue, // For debugging
      originalMessage
    ) {
      // Hot path for straight simple msg translations
      if (
        els.length === 1 &&
        (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'isLiteralElement'
        ])(els[0])
      ) {
        return [
          {
            type: PART_TYPE.literal,
            value: els[0].value,
          },
        ];
      }
      var result = [];
      for (var _i = 0, els_1 = els; _i < els_1.length; _i++) {
        var el = els_1[_i];
        // Exit early for string parts.
        if (
          (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'isLiteralElement'
          ])(el)
        ) {
          result.push({
            type: PART_TYPE.literal,
            value: el.value,
          });
          continue;
        }
        // TODO: should this part be literal type?
        // Replace `#` in plural rules with the actual numeric value.
        if (
          (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'isPoundElement'
          ])(el)
        ) {
          if (typeof currentPluralValue === 'number') {
            result.push({
              type: PART_TYPE.literal,
              value: formatters.getNumberFormat(locales).format(currentPluralValue),
            });
          }
          continue;
        }
        var varName = el.value;
        // Enforce that all required values are provided by the caller.
        if (!(values && varName in values)) {
          throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$intl$2d$messageformat$2f$lib$2f$src$2f$error$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'MissingValueError'
          ](varName, originalMessage);
        }
        var value = values[varName];
        if (
          (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'isArgumentElement'
          ])(el)
        ) {
          if (!value || typeof value === 'string' || typeof value === 'number') {
            value = typeof value === 'string' || typeof value === 'number' ? String(value) : '';
          }
          result.push({
            type: typeof value === 'string' ? PART_TYPE.literal : PART_TYPE.object,
            value: value,
          });
          continue;
        }
        // Recursively format plural and select parts' option — which can be a
        // nested pattern structure. The choosing of the option to use is
        // abstracted-by and delegated-to the part helper object.
        if (
          (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'isDateElement'
          ])(el)
        ) {
          var style =
            typeof el.style === 'string'
              ? formats.date[el.style]
              : (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'isDateTimeSkeleton'
                  ])(el.style)
                ? el.style.parsedOptions
                : undefined;
          result.push({
            type: PART_TYPE.literal,
            value: formatters.getDateTimeFormat(locales, style).format(value),
          });
          continue;
        }
        if (
          (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'isTimeElement'
          ])(el)
        ) {
          var style =
            typeof el.style === 'string'
              ? formats.time[el.style]
              : (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'isDateTimeSkeleton'
                  ])(el.style)
                ? el.style.parsedOptions
                : formats.time.medium;
          result.push({
            type: PART_TYPE.literal,
            value: formatters.getDateTimeFormat(locales, style).format(value),
          });
          continue;
        }
        if (
          (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'isNumberElement'
          ])(el)
        ) {
          var style =
            typeof el.style === 'string'
              ? formats.number[el.style]
              : (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'isNumberSkeleton'
                  ])(el.style)
                ? el.style.parsedOptions
                : undefined;
          if (style && style.scale) {
            value = value * (style.scale || 1);
          }
          result.push({
            type: PART_TYPE.literal,
            value: formatters.getNumberFormat(locales, style).format(value),
          });
          continue;
        }
        if (
          (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'isTagElement'
          ])(el)
        ) {
          var children = el.children,
            value_1 = el.value;
          var formatFn = values[value_1];
          if (!isFormatXMLElementFn(formatFn)) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$intl$2d$messageformat$2f$lib$2f$src$2f$error$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'InvalidValueTypeError'
            ](value_1, 'function', originalMessage);
          }
          var parts = formatToParts(
            children,
            locales,
            formatters,
            formats,
            values,
            currentPluralValue
          );
          var chunks = formatFn(
            parts.map(function (p) {
              return p.value;
            })
          );
          if (!Array.isArray(chunks)) {
            chunks = [chunks];
          }
          result.push.apply(
            result,
            chunks.map(function (c) {
              return {
                type: typeof c === 'string' ? PART_TYPE.literal : PART_TYPE.object,
                value: c,
              };
            })
          );
        }
        if (
          (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'isSelectElement'
          ])(el)
        ) {
          var opt = el.options[value] || el.options.other;
          if (!opt) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$intl$2d$messageformat$2f$lib$2f$src$2f$error$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'InvalidValueError'
            ](el.value, value, Object.keys(el.options), originalMessage);
          }
          result.push.apply(result, formatToParts(opt.value, locales, formatters, formats, values));
          continue;
        }
        if (
          (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$types$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'isPluralElement'
          ])(el)
        ) {
          var opt = el.options['='.concat(value)];
          if (!opt) {
            if (!Intl.PluralRules) {
              throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$intl$2d$messageformat$2f$lib$2f$src$2f$error$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'FormatError'
              ](
                'Intl.PluralRules is not available in this environment.\nTry polyfilling it using "@formatjs/intl-pluralrules"\n',
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$intl$2d$messageformat$2f$lib$2f$src$2f$error$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'ErrorCode'
                ].MISSING_INTL_API,
                originalMessage
              );
            }
            var rule = formatters
              .getPluralRules(locales, {
                type: el.pluralType,
              })
              .select(value - (el.offset || 0));
            opt = el.options[rule] || el.options.other;
          }
          if (!opt) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$intl$2d$messageformat$2f$lib$2f$src$2f$error$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'InvalidValueError'
            ](el.value, value, Object.keys(el.options), originalMessage);
          }
          result.push.apply(
            result,
            formatToParts(opt.value, locales, formatters, formats, values, value - (el.offset || 0))
          );
          continue;
        }
      }
      return mergeLiteral(result);
    }
  },
  '[project]/node_modules/intl-messageformat/lib/src/core.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['IntlMessageFormat', () => IntlMessageFormat]);
    /*
Copyright (c) 2014, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/tslib/tslib.es6.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$fast$2d$memoize$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@formatjs/fast-memoize/lib/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@formatjs/icu-messageformat-parser/lib/index.js [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$intl$2d$messageformat$2f$lib$2f$src$2f$formatters$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/intl-messageformat/lib/src/formatters.js [app-client] (ecmascript)'
      );
    // -- MessageFormat --------------------------------------------------------
    function mergeConfig(c1, c2) {
      if (!c2) {
        return c1;
      }
      return (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        '__assign'
      ])(
        (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          '__assign'
        ])(
          (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            '__assign'
          ])({}, c1 || {}),
          c2 || {}
        ),
        Object.keys(c1).reduce(function (all, k) {
          all[k] = (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            '__assign'
          ])(
            (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              '__assign'
            ])({}, c1[k]),
            c2[k] || {}
          );
          return all;
        }, {})
      );
    }
    function mergeConfigs(defaultConfig, configs) {
      if (!configs) {
        return defaultConfig;
      }
      return Object.keys(defaultConfig).reduce(
        function (all, k) {
          all[k] = mergeConfig(defaultConfig[k], configs[k]);
          return all;
        },
        (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          '__assign'
        ])({}, defaultConfig)
      );
    }
    function createFastMemoizeCache(store) {
      return {
        create: function () {
          return {
            get: function (key) {
              return store[key];
            },
            set: function (key, value) {
              store[key] = value;
            },
          };
        },
      };
    }
    function createDefaultFormatters(cache) {
      if (cache === void 0) {
        cache = {
          number: {},
          dateTime: {},
          pluralRules: {},
        };
      }
      return {
        getNumberFormat: (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$fast$2d$memoize$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'memoize'
        ])(
          function () {
            var _a;
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
              args[_i] = arguments[_i];
            }
            return new ((_a = Intl.NumberFormat).bind.apply(
              _a,
              (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                '__spreadArray'
              ])([void 0], args, false)
            ))();
          },
          {
            cache: createFastMemoizeCache(cache.number),
            strategy:
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$fast$2d$memoize$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'strategies'
              ].variadic,
          }
        ),
        getDateTimeFormat: (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$fast$2d$memoize$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'memoize'
        ])(
          function () {
            var _a;
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
              args[_i] = arguments[_i];
            }
            return new ((_a = Intl.DateTimeFormat).bind.apply(
              _a,
              (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                '__spreadArray'
              ])([void 0], args, false)
            ))();
          },
          {
            cache: createFastMemoizeCache(cache.dateTime),
            strategy:
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$fast$2d$memoize$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'strategies'
              ].variadic,
          }
        ),
        getPluralRules: (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$fast$2d$memoize$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'memoize'
        ])(
          function () {
            var _a;
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
              args[_i] = arguments[_i];
            }
            return new ((_a = Intl.PluralRules).bind.apply(
              _a,
              (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                '__spreadArray'
              ])([void 0], args, false)
            ))();
          },
          {
            cache: createFastMemoizeCache(cache.pluralRules),
            strategy:
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$fast$2d$memoize$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'strategies'
              ].variadic,
          }
        ),
      };
    }
    var IntlMessageFormat = (function () {
      function IntlMessageFormat(message, locales, overrideFormats, opts) {
        if (locales === void 0) {
          locales = IntlMessageFormat.defaultLocale;
        }
        var _this = this;
        this.formatterCache = {
          number: {},
          dateTime: {},
          pluralRules: {},
        };
        this.format = function (values) {
          var parts = _this.formatToParts(values);
          // Hot path for straight simple msg translations
          if (parts.length === 1) {
            return parts[0].value;
          }
          var result = parts.reduce(function (all, part) {
            if (
              !all.length ||
              part.type !==
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$intl$2d$messageformat$2f$lib$2f$src$2f$formatters$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'PART_TYPE'
                ].literal ||
              typeof all[all.length - 1] !== 'string'
            ) {
              all.push(part.value);
            } else {
              all[all.length - 1] += part.value;
            }
            return all;
          }, []);
          if (result.length <= 1) {
            return result[0] || '';
          }
          return result;
        };
        this.formatToParts = function (values) {
          return (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$intl$2d$messageformat$2f$lib$2f$src$2f$formatters$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'formatToParts'
          ])(
            _this.ast,
            _this.locales,
            _this.formatters,
            _this.formats,
            values,
            undefined,
            _this.message
          );
        };
        this.resolvedOptions = function () {
          var _a;
          return {
            locale:
              ((_a = _this.resolvedLocale) === null || _a === void 0 ? void 0 : _a.toString()) ||
              Intl.NumberFormat.supportedLocalesOf(_this.locales)[0],
          };
        };
        this.getAst = function () {
          return _this.ast;
        };
        // Defined first because it's used to build the format pattern.
        this.locales = locales;
        this.resolvedLocale = IntlMessageFormat.resolveLocale(locales);
        if (typeof message === 'string') {
          this.message = message;
          if (!IntlMessageFormat.__parse) {
            throw new TypeError(
              'IntlMessageFormat.__parse must be set to process `message` of type `string`'
            );
          }
          var _a = opts || {},
            formatters = _a.formatters,
            parseOpts = (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              '__rest'
            ])(_a, ['formatters']);
          // Parse string messages into an AST.
          this.ast = IntlMessageFormat.__parse(
            message,
            (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              '__assign'
            ])(
              (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                '__assign'
              ])({}, parseOpts),
              {
                locale: this.resolvedLocale,
              }
            )
          );
        } else {
          this.ast = message;
        }
        if (!Array.isArray(this.ast)) {
          throw new TypeError('A message must be provided as a String or AST.');
        }
        // Creates a new object with the specified `formats` merged with the default
        // formats.
        this.formats = mergeConfigs(IntlMessageFormat.formats, overrideFormats);
        this.formatters = (opts && opts.formatters) || createDefaultFormatters(this.formatterCache);
      }
      Object.defineProperty(IntlMessageFormat, 'defaultLocale', {
        get: function () {
          if (!IntlMessageFormat.memoizedDefaultLocale) {
            IntlMessageFormat.memoizedDefaultLocale =
              new Intl.NumberFormat().resolvedOptions().locale;
          }
          return IntlMessageFormat.memoizedDefaultLocale;
        },
        enumerable: false,
        configurable: true,
      });
      IntlMessageFormat.memoizedDefaultLocale = null;
      IntlMessageFormat.resolveLocale = function (locales) {
        if (typeof Intl.Locale === 'undefined') {
          return;
        }
        var supportedLocales = Intl.NumberFormat.supportedLocalesOf(locales);
        if (supportedLocales.length > 0) {
          return new Intl.Locale(supportedLocales[0]);
        }
        return new Intl.Locale(typeof locales === 'string' ? locales : locales[0]);
      };
      IntlMessageFormat.__parse =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$icu$2d$messageformat$2d$parser$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
          'parse'
        ];
      // Default format options used as the prototype of the `formats` provided to the
      // constructor. These are used when constructing the internal Intl.NumberFormat
      // and Intl.DateTimeFormat instances.
      IntlMessageFormat.formats = {
        number: {
          integer: {
            maximumFractionDigits: 0,
          },
          currency: {
            style: 'currency',
          },
          percent: {
            style: 'percent',
          },
        },
        date: {
          short: {
            month: 'numeric',
            day: 'numeric',
            year: '2-digit',
          },
          medium: {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          },
          long: {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          },
          full: {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          },
        },
        time: {
          short: {
            hour: 'numeric',
            minute: 'numeric',
          },
          medium: {
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
          },
          long: {
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            timeZoneName: 'short',
          },
          full: {
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            timeZoneName: 'short',
          },
        },
      };
      return IntlMessageFormat;
    })();
  },
  '[project]/node_modules/use-intl/dist/esm/development/initializeConfig-CIDVMS2E.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'I',
      () => IntlError,
      'a',
      () => IntlErrorCode,
      'b',
      () => createIntlFormatters,
      'c',
      () => createFormatter,
      'd',
      () => createCache,
      'e',
      () => createBaseTranslator,
      'f',
      () => defaultGetMessageFallback,
      'g',
      () => defaultOnError,
      'i',
      () => initializeConfig,
      'r',
      () => resolveNamespace,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$intl$2d$messageformat$2f$lib$2f$src$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/intl-messageformat/lib/src/core.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$fast$2d$memoize$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@formatjs/fast-memoize/lib/index.js [app-client] (ecmascript)'
      );
    class IntlError extends Error {
      constructor(code, originalMessage) {
        let message = code;
        if (originalMessage) {
          message += ': ' + originalMessage;
        }
        super(message);
        this.code = code;
        if (originalMessage) {
          this.originalMessage = originalMessage;
        }
      }
    }
    var IntlErrorCode = /*#__PURE__*/ (function (IntlErrorCode) {
      IntlErrorCode['MISSING_MESSAGE'] = 'MISSING_MESSAGE';
      IntlErrorCode['MISSING_FORMAT'] = 'MISSING_FORMAT';
      IntlErrorCode['ENVIRONMENT_FALLBACK'] = 'ENVIRONMENT_FALLBACK';
      IntlErrorCode['INSUFFICIENT_PATH'] = 'INSUFFICIENT_PATH';
      IntlErrorCode['INVALID_MESSAGE'] = 'INVALID_MESSAGE';
      IntlErrorCode['INVALID_KEY'] = 'INVALID_KEY';
      IntlErrorCode['FORMATTING_ERROR'] = 'FORMATTING_ERROR';
      return IntlErrorCode;
    })(IntlErrorCode || {});
    /**
     * `intl-messageformat` uses separate keys for `date` and `time`, but there's
     * only one native API: `Intl.DateTimeFormat`. Additionally you might want to
     * include both a time and a date in a value, therefore the separation doesn't
     * seem so useful. We offer a single `dateTime` namespace instead, but we have
     * to convert the format before `intl-messageformat` can be used.
     */ function convertFormatsToIntlMessageFormat(globalFormats, inlineFormats, timeZone) {
      const mfDateDefaults =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$intl$2d$messageformat$2f$lib$2f$src$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'IntlMessageFormat'
        ].formats.date;
      const mfTimeDefaults =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$intl$2d$messageformat$2f$lib$2f$src$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'IntlMessageFormat'
        ].formats.time;
      const dateTimeFormats = {
        ...globalFormats?.dateTime,
        ...inlineFormats?.dateTime,
      };
      const allFormats = {
        date: {
          ...mfDateDefaults,
          ...dateTimeFormats,
        },
        time: {
          ...mfTimeDefaults,
          ...dateTimeFormats,
        },
        number: {
          ...globalFormats?.number,
          ...inlineFormats?.number,
        },
      };
      if (timeZone) {
        // The only way to set a time zone with `intl-messageformat` is to merge it into the formats
        // https://github.com/formatjs/formatjs/blob/8256c5271505cf2606e48e3c97ecdd16ede4f1b5/packages/intl/src/message.ts#L15
        ['date', 'time'].forEach((property) => {
          const formats = allFormats[property];
          for (const [key, value] of Object.entries(formats)) {
            formats[key] = {
              timeZone,
              ...value,
            };
          }
        });
      }
      return allFormats;
    }
    function joinPath(...parts) {
      return parts.filter(Boolean).join('.');
    }
    /**
     * Contains defaults that are used for all entry points into the core.
     * See also `InitializedIntlConfiguration`.
     */ function defaultGetMessageFallback(props) {
      return joinPath(props.namespace, props.key);
    }
    function defaultOnError(error) {
      console.error(error);
    }
    function createCache() {
      return {
        dateTime: {},
        number: {},
        message: {},
        relativeTime: {},
        pluralRules: {},
        list: {},
        displayNames: {},
      };
    }
    function createMemoCache(store) {
      return {
        create() {
          return {
            get(key) {
              return store[key];
            },
            set(key, value) {
              store[key] = value;
            },
          };
        },
      };
    }
    function memoFn(fn, cache) {
      return (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$fast$2d$memoize$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'memoize'
      ])(fn, {
        cache: createMemoCache(cache),
        strategy:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$formatjs$2f$fast$2d$memoize$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'strategies'
          ].variadic,
      });
    }
    function memoConstructor(ConstructorFn, cache) {
      return memoFn((...args) => new ConstructorFn(...args), cache);
    }
    function createIntlFormatters(cache) {
      const getDateTimeFormat = memoConstructor(Intl.DateTimeFormat, cache.dateTime);
      const getNumberFormat = memoConstructor(Intl.NumberFormat, cache.number);
      const getPluralRules = memoConstructor(Intl.PluralRules, cache.pluralRules);
      const getRelativeTimeFormat = memoConstructor(Intl.RelativeTimeFormat, cache.relativeTime);
      const getListFormat = memoConstructor(Intl.ListFormat, cache.list);
      const getDisplayNames = memoConstructor(Intl.DisplayNames, cache.displayNames);
      return {
        getDateTimeFormat,
        getNumberFormat,
        getPluralRules,
        getRelativeTimeFormat,
        getListFormat,
        getDisplayNames,
      };
    }
    // Placed here for improved tree shaking. Somehow when this is placed in
    // `formatters.tsx`, then it can't be shaken off from `next-intl`.
    function createMessageFormatter(cache, intlFormatters) {
      const getMessageFormat = memoFn(
        (...args) =>
          new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$intl$2d$messageformat$2f$lib$2f$src$2f$core$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'IntlMessageFormat'
          ](args[0], args[1], args[2], {
            formatters: intlFormatters,
            ...args[3],
          }),
        cache.message
      );
      return getMessageFormat;
    }
    function resolvePath(locale, messages, key, namespace) {
      const fullKey = joinPath(namespace, key);
      if (!messages) {
        throw new Error(`No messages available at \`${namespace}\`.`);
      }
      let message = messages;
      key.split('.').forEach((part) => {
        const next = message[part];
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (part == null || next == null) {
          throw new Error(`Could not resolve \`${fullKey}\` in messages for locale \`${locale}\`.`);
        }
        message = next;
      });
      return message;
    }
    function prepareTranslationValues(values) {
      // Workaround for https://github.com/formatjs/formatjs/issues/1467
      const transformedValues = {};
      Object.keys(values).forEach((key) => {
        let index = 0;
        const value = values[key];
        let transformed;
        if (typeof value === 'function') {
          transformed = (chunks) => {
            const result = value(chunks);
            return /*#__PURE__*/ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'isValidElement'
            ])(result)
              ? /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'cloneElement'
                ])(result, {
                  key: key + index++,
                })
              : result;
          };
        } else {
          transformed = value;
        }
        transformedValues[key] = transformed;
      });
      return transformedValues;
    }
    function getMessagesOrError(locale, messages, namespace) {
      try {
        if (!messages) {
          throw new Error(`No messages were configured.`);
        }
        const retrievedMessages = namespace ? resolvePath(locale, messages, namespace) : messages;
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!retrievedMessages) {
          throw new Error(`No messages for namespace \`${namespace}\` found.`);
        }
        return retrievedMessages;
      } catch (error) {
        const intlError = new IntlError(IntlErrorCode.MISSING_MESSAGE, error.message);
        return intlError;
      }
    }
    function getPlainMessage(candidate, values) {
      // To improve runtime performance, only compile message if:
      return (
        // 1. Values are provided
        values || // 2. There are escaped braces (e.g. "'{name'}")
          /'[{}]/.test(candidate) || // 3. There are missing arguments or tags (dev-only error handling)
          /<|{/.test(candidate)
          ? undefined // Compile
          : candidate // Don't compile
      );
    }
    function createBaseTranslator(config) {
      const messagesOrError = getMessagesOrError(config.locale, config.messages, config.namespace);
      return createBaseTranslatorImpl({
        ...config,
        messagesOrError,
      });
    }
    function createBaseTranslatorImpl({
      cache,
      formats: globalFormats,
      formatters,
      getMessageFallback = defaultGetMessageFallback,
      locale,
      messagesOrError,
      namespace,
      onError,
      timeZone,
    }) {
      const hasMessagesError = messagesOrError instanceof IntlError;
      function getFallbackFromErrorAndNotify(key, code, message, fallback) {
        const error = new IntlError(code, message);
        onError(error);
        return (
          fallback ??
          getMessageFallback({
            error,
            key,
            namespace,
          })
        );
      }
      function translateBaseFn(
        /** Use a dot to indicate a level of nesting (e.g. `namespace.nestedLabel`). */ key,
        /** Key value pairs for values to interpolate into the message. */ values,
        /** Provide custom formats for numbers, dates and times. */ formats,
        _fallback
      ) {
        const fallback = _fallback;
        let message;
        if (hasMessagesError) {
          if (fallback) {
            message = fallback;
          } else {
            onError(messagesOrError);
            return getMessageFallback({
              error: messagesOrError,
              key,
              namespace,
            });
          }
        } else {
          const messages = messagesOrError;
          try {
            message = resolvePath(locale, messages, key, namespace);
          } catch (error) {
            if (fallback) {
              message = fallback;
            } else {
              return getFallbackFromErrorAndNotify(
                key,
                IntlErrorCode.MISSING_MESSAGE,
                error.message,
                fallback
              );
            }
          }
        }
        if (typeof message === 'object') {
          let code, errorMessage;
          if (Array.isArray(message)) {
            code = IntlErrorCode.INVALID_MESSAGE;
            {
              errorMessage = `Message at \`${joinPath(namespace, key)}\` resolved to an array, but only strings are supported. See https://next-intl.dev/docs/usage/translations#arrays-of-messages`;
            }
          } else {
            code = IntlErrorCode.INSUFFICIENT_PATH;
            {
              errorMessage = `Message at \`${joinPath(namespace, key)}\` resolved to an object, but only strings are supported. Use a \`.\` to retrieve nested messages. See https://next-intl.dev/docs/usage/translations#structuring-messages`;
            }
          }
          return getFallbackFromErrorAndNotify(key, code, errorMessage);
        }
        let messageFormat;
        // Hot path that avoids creating an `IntlMessageFormat` instance
        const plainMessage = getPlainMessage(message, values);
        if (plainMessage) return plainMessage;
        // Lazy init the message formatter for better tree
        // shaking in case message formatting is not used.
        if (!formatters.getMessageFormat) {
          formatters.getMessageFormat = createMessageFormatter(cache, formatters);
        }
        try {
          messageFormat = formatters.getMessageFormat(
            message,
            locale,
            convertFormatsToIntlMessageFormat(globalFormats, formats, timeZone),
            {
              formatters: {
                ...formatters,
                getDateTimeFormat(locales, options) {
                  // Workaround for https://github.com/formatjs/formatjs/issues/4279
                  return formatters.getDateTimeFormat(locales, {
                    timeZone,
                    ...options,
                  });
                },
              },
            }
          );
        } catch (error) {
          const thrownError = error;
          return getFallbackFromErrorAndNotify(
            key,
            IntlErrorCode.INVALID_MESSAGE,
            thrownError.message +
              ('originalMessage' in thrownError ? ` (${thrownError.originalMessage})` : ''),
            fallback
          );
        }
        try {
          const formattedMessage = messageFormat.format(
            // @ts-expect-error `intl-messageformat` expects a different format
            // for rich text elements since a recent minor update. This
            // needs to be evaluated in detail, possibly also in regards
            // to be able to format to parts.
            values ? prepareTranslationValues(values) : values
          );
          if (formattedMessage == null) {
            throw new Error(
              `Unable to format \`${key}\` in ${namespace ? `namespace \`${namespace}\`` : 'messages'}`
            );
          }
          // Limit the function signature to return strings or React elements
          return /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'isValidElement'
          ])(formattedMessage) || // Arrays of React elements
            Array.isArray(formattedMessage) ||
            typeof formattedMessage === 'string'
            ? formattedMessage
            : String(formattedMessage);
        } catch (error) {
          return getFallbackFromErrorAndNotify(
            key,
            IntlErrorCode.FORMATTING_ERROR,
            error.message,
            fallback
          );
        }
      }
      function translateFn(
        /** Use a dot to indicate a level of nesting (e.g. `namespace.nestedLabel`). */ key,
        /** Key value pairs for values to interpolate into the message. */ values,
        /** Custom formats for numbers, dates and times. */ formats,
        _fallback
      ) {
        const result = translateBaseFn(key, values, formats, _fallback);
        if (typeof result !== 'string') {
          return getFallbackFromErrorAndNotify(
            key,
            IntlErrorCode.INVALID_MESSAGE,
            `The message \`${key}\` in ${namespace ? `namespace \`${namespace}\`` : 'messages'} didn't resolve to a string. If you want to format rich text, use \`t.rich\` instead.`
          );
        }
        return result;
      }
      translateFn.rich = translateBaseFn;
      // Augment `translateBaseFn` to return plain strings
      translateFn.markup = (key, values, formats, _fallback) => {
        const result = translateBaseFn(
          key, // @ts-expect-error -- `MarkupTranslationValues` is practically a sub type
          // of `RichTranslationValues` but TypeScript isn't smart enough here.
          values,
          formats,
          _fallback
        );
        if (typeof result !== 'string') {
          const error = new IntlError(
            IntlErrorCode.FORMATTING_ERROR,
            "`t.markup` only accepts functions for formatting that receive and return strings.\n\nE.g. t.markup('markup', {b: (chunks) => `<b>${chunks}</b>`})"
          );
          onError(error);
          return getMessageFallback({
            error,
            key,
            namespace,
          });
        }
        return result;
      };
      translateFn.raw = (key) => {
        if (hasMessagesError) {
          onError(messagesOrError);
          return getMessageFallback({
            error: messagesOrError,
            key,
            namespace,
          });
        }
        const messages = messagesOrError;
        try {
          return resolvePath(locale, messages, key, namespace);
        } catch (error) {
          return getFallbackFromErrorAndNotify(key, IntlErrorCode.MISSING_MESSAGE, error.message);
        }
      };
      translateFn.has = (key) => {
        if (hasMessagesError) {
          return false;
        }
        try {
          resolvePath(locale, messagesOrError, key, namespace);
          return true;
        } catch {
          return false;
        }
      };
      return translateFn;
    }
    /**
     * For the strictly typed messages to work we have to wrap the namespace into
     * a mandatory prefix. See https://stackoverflow.com/a/71529575/343045
     */ function resolveNamespace(namespace, namespacePrefix) {
      return namespace === namespacePrefix
        ? undefined
        : namespace.slice((namespacePrefix + '.').length);
    }
    const SECOND = 1;
    const MINUTE = SECOND * 60;
    const HOUR = MINUTE * 60;
    const DAY = HOUR * 24;
    const WEEK = DAY * 7;
    const MONTH = DAY * (365 / 12); // Approximation
    const QUARTER = MONTH * 3;
    const YEAR = DAY * 365;
    const UNIT_SECONDS = {
      second: SECOND,
      seconds: SECOND,
      minute: MINUTE,
      minutes: MINUTE,
      hour: HOUR,
      hours: HOUR,
      day: DAY,
      days: DAY,
      week: WEEK,
      weeks: WEEK,
      month: MONTH,
      months: MONTH,
      quarter: QUARTER,
      quarters: QUARTER,
      year: YEAR,
      years: YEAR,
    };
    function resolveRelativeTimeUnit(seconds) {
      const absValue = Math.abs(seconds);
      if (absValue < MINUTE) {
        return 'second';
      } else if (absValue < HOUR) {
        return 'minute';
      } else if (absValue < DAY) {
        return 'hour';
      } else if (absValue < WEEK) {
        return 'day';
      } else if (absValue < MONTH) {
        return 'week';
      } else if (absValue < YEAR) {
        return 'month';
      }
      return 'year';
    }
    function calculateRelativeTimeValue(seconds, unit) {
      // We have to round the resulting values, as `Intl.RelativeTimeFormat`
      // will include fractions like '2.1 hours ago'.
      return Math.round(seconds / UNIT_SECONDS[unit]);
    }
    function createFormatter(props) {
      const {
        _cache: cache = createCache(),
        _formatters: formatters = createIntlFormatters(cache),
        formats,
        locale,
        onError = defaultOnError,
        timeZone: globalTimeZone,
      } = props;
      function applyTimeZone(options) {
        if (!options?.timeZone) {
          if (globalTimeZone) {
            options = {
              ...options,
              timeZone: globalTimeZone,
            };
          } else {
            onError(
              new IntlError(
                IntlErrorCode.ENVIRONMENT_FALLBACK,
                `The \`timeZone\` parameter wasn't provided and there is no global default configured. Consider adding a global default to avoid markup mismatches caused by environment differences. Learn more: https://next-intl.dev/docs/configuration#time-zone`
              )
            );
          }
        }
        return options;
      }
      function resolveFormatOrOptions(typeFormats, formatOrOptions, overrides) {
        let options;
        if (typeof formatOrOptions === 'string') {
          const formatName = formatOrOptions;
          options = typeFormats?.[formatName];
          if (!options) {
            const error = new IntlError(
              IntlErrorCode.MISSING_FORMAT,
              `Format \`${formatName}\` is not available.`
            );
            onError(error);
            throw error;
          }
        } else {
          options = formatOrOptions;
        }
        if (overrides) {
          options = {
            ...options,
            ...overrides,
          };
        }
        return options;
      }
      function getFormattedValue(formatOrOptions, overrides, typeFormats, formatter, getFallback) {
        let options;
        try {
          options = resolveFormatOrOptions(typeFormats, formatOrOptions, overrides);
        } catch {
          return getFallback();
        }
        try {
          return formatter(options);
        } catch (error) {
          onError(new IntlError(IntlErrorCode.FORMATTING_ERROR, error.message));
          return getFallback();
        }
      }
      function dateTime(value, formatOrOptions, overrides) {
        return getFormattedValue(
          formatOrOptions,
          overrides,
          formats?.dateTime,
          (options) => {
            options = applyTimeZone(options);
            return formatters.getDateTimeFormat(locale, options).format(value);
          },
          () => String(value)
        );
      }
      function dateTimeRange(start, end, formatOrOptions, overrides) {
        return getFormattedValue(
          formatOrOptions,
          overrides,
          formats?.dateTime,
          (options) => {
            options = applyTimeZone(options);
            return formatters.getDateTimeFormat(locale, options).formatRange(start, end);
          },
          () => [dateTime(start), dateTime(end)].join(' – ')
        );
      }
      function number(value, formatOrOptions, overrides) {
        return getFormattedValue(
          formatOrOptions,
          overrides,
          formats?.number,
          (options) => formatters.getNumberFormat(locale, options).format(value),
          () => String(value)
        );
      }
      function getGlobalNow() {
        // Only read when necessary to avoid triggering a `dynamicIO` error
        // unnecessarily (`now` is only needed for `format.relativeTime`)
        if (props.now) {
          return props.now;
        } else {
          onError(
            new IntlError(
              IntlErrorCode.ENVIRONMENT_FALLBACK,
              `The \`now\` parameter wasn't provided to \`relativeTime\` and there is no global default configured, therefore the current time will be used as a fallback. See https://next-intl.dev/docs/usage/dates-times#relative-times-usenow`
            )
          );
          return new Date();
        }
      }
      function relativeTime(date, nowOrOptions) {
        try {
          let nowDate, unit;
          const opts = {};
          if (nowOrOptions instanceof Date || typeof nowOrOptions === 'number') {
            nowDate = new Date(nowOrOptions);
          } else if (nowOrOptions) {
            if (nowOrOptions.now != null) {
              nowDate = new Date(nowOrOptions.now);
            } else {
              nowDate = getGlobalNow();
            }
            unit = nowOrOptions.unit;
            opts.style = nowOrOptions.style;
            // @ts-expect-error -- Types are slightly outdated
            opts.numberingSystem = nowOrOptions.numberingSystem;
          }
          if (!nowDate) {
            nowDate = getGlobalNow();
          }
          const dateDate = new Date(date);
          const seconds = (dateDate.getTime() - nowDate.getTime()) / 1000;
          if (!unit) {
            unit = resolveRelativeTimeUnit(seconds);
          }
          // `numeric: 'auto'` can theoretically produce output like "yesterday",
          // but it only works with integers. E.g. -1 day will produce "yesterday",
          // but -1.1 days will produce "-1.1 days". Rounding before formatting is
          // not desired, as the given dates might cross a threshold were the
          // output isn't correct anymore. Example: 2024-01-08T23:00:00.000Z and
          // 2024-01-08T01:00:00.000Z would produce "yesterday", which is not the
          // case. By using `always` we can ensure correct output. The only exception
          // is the formatting of times <1 second as "now".
          opts.numeric = unit === 'second' ? 'auto' : 'always';
          const value = calculateRelativeTimeValue(seconds, unit);
          return formatters.getRelativeTimeFormat(locale, opts).format(value, unit);
        } catch (error) {
          onError(new IntlError(IntlErrorCode.FORMATTING_ERROR, error.message));
          return String(date);
        }
      }
      function list(value, formatOrOptions, overrides) {
        const serializedValue = [];
        const richValues = new Map();
        // `formatToParts` only accepts strings, therefore we have to temporarily
        // replace React elements with a placeholder ID that can be used to retrieve
        // the original value afterwards.
        let index = 0;
        for (const item of value) {
          let serializedItem;
          if (typeof item === 'object') {
            serializedItem = String(index);
            richValues.set(serializedItem, item);
          } else {
            serializedItem = String(item);
          }
          serializedValue.push(serializedItem);
          index++;
        }
        return getFormattedValue(
          formatOrOptions,
          overrides,
          formats?.list, // @ts-expect-error -- `richValues.size` is used to determine the return type, but TypeScript can't infer the meaning of this correctly
          (options) => {
            const result = formatters
              .getListFormat(locale, options)
              .formatToParts(serializedValue)
              .map((part) =>
                part.type === 'literal' ? part.value : richValues.get(part.value) || part.value
              );
            if (richValues.size > 0) {
              return result;
            } else {
              return result.join('');
            }
          },
          () => String(value)
        );
      }
      return {
        dateTime,
        number,
        relativeTime,
        list,
        dateTimeRange,
      };
    }
    function validateMessagesSegment(messages, invalidKeyLabels, parentPath) {
      Object.entries(messages).forEach(([key, messageOrMessages]) => {
        if (key.includes('.')) {
          let keyLabel = key;
          if (parentPath) keyLabel += ` (at ${parentPath})`;
          invalidKeyLabels.push(keyLabel);
        }
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (messageOrMessages != null && typeof messageOrMessages === 'object') {
          validateMessagesSegment(messageOrMessages, invalidKeyLabels, joinPath(parentPath, key));
        }
      });
    }
    function validateMessages(messages, onError) {
      const invalidKeyLabels = [];
      validateMessagesSegment(messages, invalidKeyLabels);
      if (invalidKeyLabels.length > 0) {
        onError(
          new IntlError(
            IntlErrorCode.INVALID_KEY,
            `Namespace keys can not contain the character "." as this is used to express nesting. Please remove it or replace it with another character.

Invalid ${invalidKeyLabels.length === 1 ? 'key' : 'keys'}: ${invalidKeyLabels.join(', ')}

If you're migrating from a flat structure, you can convert your messages as follows:

import {set} from "lodash";

const input = {
  "one.one": "1.1",
  "one.two": "1.2",
  "two.one.one": "2.1.1"
};

const output = Object.entries(input).reduce(
  (acc, [key, value]) => set(acc, key, value),
  {}
);

// Output:
//
// {
//   "one": {
//     "one": "1.1",
//     "two": "1.2"
//   },
//   "two": {
//     "one": {
//       "one": "2.1.1"
//     }
//   }
// }
`
          )
        );
      }
    }
    /**
     * Enhances the incoming props with defaults.
     */ function initializeConfig({ formats, getMessageFallback, messages, onError, ...rest }) {
      const finalOnError = onError || defaultOnError;
      const finalGetMessageFallback = getMessageFallback || defaultGetMessageFallback;
      {
        if (messages) {
          validateMessages(messages, finalOnError);
        }
      }
      return {
        ...rest,
        formats: formats || undefined,
        messages: messages || undefined,
        onError: finalOnError,
        getMessageFallback: finalGetMessageFallback,
      };
    }
  },
  '[project]/node_modules/use-intl/dist/esm/development/react.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'IntlProvider',
      () => IntlProvider,
      '_useExtracted',
      () => useExtracted,
      'useFormatter',
      () => useFormatter,
      'useLocale',
      () => useLocale,
      'useMessages',
      () => useMessages,
      'useNow',
      () => useNow,
      'useTimeZone',
      () => useTimeZone,
      'useTranslations',
      () => useTranslations,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$use$2d$intl$2f$dist$2f$esm$2f$development$2f$initializeConfig$2d$CIDVMS2E$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/use-intl/dist/esm/development/initializeConfig-CIDVMS2E.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-runtime.js [app-client] (ecmascript)'
      );
    const IntlContext = /*#__PURE__*/ (0,
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
      'createContext'
    ])(undefined);
    function IntlProvider({
      children,
      formats,
      getMessageFallback,
      locale,
      messages,
      now,
      onError,
      timeZone,
    }) {
      const prevContext = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useContext'
      ])(IntlContext);
      // The formatter cache is released when the locale changes. For
      // long-running apps with a persistent `IntlProvider` at the root,
      // this can reduce the memory footprint (e.g. in React Native).
      const cache = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useMemo'
      ])(
        {
          'IntlProvider.useMemo[cache]': () => {
            return (
              prevContext?.cache ||
              (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$use$2d$intl$2f$dist$2f$esm$2f$development$2f$initializeConfig$2d$CIDVMS2E$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'd'
              ])()
            );
          },
        }['IntlProvider.useMemo[cache]'],
        [locale, prevContext?.cache]
      );
      const formatters = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useMemo'
      ])(
        {
          'IntlProvider.useMemo[formatters]': () =>
            prevContext?.formatters ||
            (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$use$2d$intl$2f$dist$2f$esm$2f$development$2f$initializeConfig$2d$CIDVMS2E$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'b'
            ])(cache),
        }['IntlProvider.useMemo[formatters]'],
        [cache, prevContext?.formatters]
      );
      // Memoizing this value helps to avoid triggering a re-render of all
      // context consumers in case the configuration didn't change. However,
      // if some of the non-primitive values change, a re-render will still
      // be triggered. Note that there's no need to put `memo` on `IntlProvider`
      // itself, because the `children` typically change on every render.
      // There's some burden on the consumer side if it's important to reduce
      // re-renders, put that's how React works.
      // See: https://blog.isquaredsoftware.com/2020/05/blogged-answers-a-mostly-complete-guide-to-react-rendering-behavior/#context-updates-and-render-optimizations
      const value = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useMemo'
      ])(
        {
          'IntlProvider.useMemo[value]': () => ({
            ...(0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$use$2d$intl$2f$dist$2f$esm$2f$development$2f$initializeConfig$2d$CIDVMS2E$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'i'
            ])({
              locale,
              // (required by provider)
              formats: formats === undefined ? prevContext?.formats : formats,
              getMessageFallback: getMessageFallback || prevContext?.getMessageFallback,
              messages: messages === undefined ? prevContext?.messages : messages,
              now: now || prevContext?.now,
              onError: onError || prevContext?.onError,
              timeZone: timeZone || prevContext?.timeZone,
            }),
            formatters,
            cache,
          }),
        }['IntlProvider.useMemo[value]'],
        [
          cache,
          formats,
          formatters,
          getMessageFallback,
          locale,
          messages,
          now,
          onError,
          prevContext,
          timeZone,
        ]
      );
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsx'
      ])(IntlContext.Provider, {
        value: value,
        children: children,
      });
    }
    function useIntlContext() {
      const context = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useContext'
      ])(IntlContext);
      if (!context) {
        throw new Error(
          'No intl context found. Have you configured the provider? See https://next-intl.dev/docs/usage/configuration#server-client-components'
        );
      }
      return context;
    }
    let hasWarnedForMissingTimezone = false;
    const isServer = typeof window === 'undefined';
    function useTranslationsImpl(allMessagesPrefixed, namespacePrefixed, namespacePrefix) {
      const {
        cache,
        formats: globalFormats,
        formatters,
        getMessageFallback,
        locale,
        onError,
        timeZone,
      } = useIntlContext();
      // The `namespacePrefix` is part of the type system.
      // See the comment in the hook invocation.
      const allMessages = allMessagesPrefixed[namespacePrefix];
      const namespace = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$use$2d$intl$2f$dist$2f$esm$2f$development$2f$initializeConfig$2d$CIDVMS2E$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'r'
      ])(namespacePrefixed, namespacePrefix);
      if (!timeZone && !hasWarnedForMissingTimezone && isServer) {
        // eslint-disable-next-line react-compiler/react-compiler
        hasWarnedForMissingTimezone = true;
        onError(
          new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$use$2d$intl$2f$dist$2f$esm$2f$development$2f$initializeConfig$2d$CIDVMS2E$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'I'
          ](
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$use$2d$intl$2f$dist$2f$esm$2f$development$2f$initializeConfig$2d$CIDVMS2E$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'a'
            ].ENVIRONMENT_FALLBACK,
            `There is no \`timeZone\` configured, this can lead to markup mismatches caused by environment differences. Consider adding a global default: https://next-intl.dev/docs/configuration#time-zone`
          )
        );
      }
      const translate = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useMemo'
      ])(
        {
          'useTranslationsImpl.useMemo[translate]': () =>
            (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$use$2d$intl$2f$dist$2f$esm$2f$development$2f$initializeConfig$2d$CIDVMS2E$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'e'
            ])({
              cache,
              formatters,
              getMessageFallback,
              messages: allMessages,
              namespace,
              onError,
              formats: globalFormats,
              locale,
              timeZone,
            }),
        }['useTranslationsImpl.useMemo[translate]'],
        [
          cache,
          formatters,
          getMessageFallback,
          allMessages,
          namespace,
          onError,
          globalFormats,
          locale,
          timeZone,
        ]
      );
      return translate;
    }
    /**
     * Translates messages from the given namespace by using the ICU syntax.
     * See https://formatjs.io/docs/core-concepts/icu-syntax.
     *
     * If no namespace is provided, all available messages are returned.
     * The namespace can also indicate nesting by using a dot
     * (e.g. `namespace.Component`).
     */ function useTranslations(namespace) {
      const context = useIntlContext();
      const messages = context.messages;
      // We have to wrap the actual hook so the type inference for the optional
      // namespace works correctly. See https://stackoverflow.com/a/71529575/343045
      // The prefix ("!") is arbitrary.
      // @ts-expect-error Use the explicit annotation instead
      return useTranslationsImpl(
        {
          '!': messages,
        }, // @ts-expect-error
        namespace ? `!.${namespace}` : '!',
        '!'
      );
    }
    function useLocale() {
      return useIntlContext().locale;
    }
    function getNow() {
      return new Date();
    }
    /**
     * @see https://next-intl.dev/docs/usage/dates-times#relative-times-usenow
     */ function useNow(options) {
      const updateInterval = options?.updateInterval;
      const { now: globalNow } = useIntlContext();
      const [now, setNow] = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useState'
      ])(globalNow || getNow());
      (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useEffect'
      ])(
        {
          'useNow.useEffect': () => {
            if (!updateInterval) return;
            const intervalId = setInterval(
              {
                'useNow.useEffect.intervalId': () => {
                  setNow(getNow());
                },
              }['useNow.useEffect.intervalId'],
              updateInterval
            );
            return {
              'useNow.useEffect': () => {
                clearInterval(intervalId);
              },
            }['useNow.useEffect'];
          },
        }['useNow.useEffect'],
        [globalNow, updateInterval]
      );
      return updateInterval == null && globalNow ? globalNow : now;
    }
    function useTimeZone() {
      return useIntlContext().timeZone;
    }
    function useMessages() {
      const context = useIntlContext();
      if (!context.messages) {
        throw new Error(
          'No messages found. Have you configured them correctly? See https://next-intl.dev/docs/configuration#messages'
        );
      }
      return context.messages;
    }
    function useFormatter() {
      const { formats, formatters, locale, now: globalNow, onError, timeZone } = useIntlContext();
      return (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useMemo'
      ])(
        {
          'useFormatter.useMemo': () =>
            (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$use$2d$intl$2f$dist$2f$esm$2f$development$2f$initializeConfig$2d$CIDVMS2E$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'c'
            ])({
              formats,
              locale,
              now: globalNow,
              onError,
              timeZone,
              _formatters: formatters,
            }),
        }['useFormatter.useMemo'],
        [formats, formatters, globalNow, locale, onError, timeZone]
      );
    }
    function getArgs(messageOrParams, ...rest) {
      let message, values, formats;
      if (typeof messageOrParams === 'string') {
        message = messageOrParams;
        values = rest[0];
        formats = rest[1];
      } else {
        message = messageOrParams.message;
        values = messageOrParams.values;
        formats = messageOrParams.formats;
        // `description` is is not used at runtime
      }
      // @ts-expect-error -- Secret fallback parameter
      return [
        undefined,
        // Always use fallback if not compiled
        values,
        formats,
        message,
      ];
    }
    // Note: This API is usually compiled into `useTranslations`,
    // but there is some fallback handling which allows this hook
    // to still work when not being compiled.
    //
    // This is relevant for:
    // - Isolated environments like tests, Storybook, etc.
    // - Fallbacks in case an extracted message is not yet available
    function useExtracted(namespace) {
      const t = useTranslations(namespace);
      function translateFn(...params) {
        // @ts-expect-error -- Passing `undefined` as an ID is secretly allowed here
        return t(...getArgs(...params));
      }
      translateFn.rich = (
        ...params // @ts-expect-error -- Passing `undefined` as an ID is secretly allowed here
      ) => t.rich(...getArgs(...params));
      translateFn.markup = (
        ...params // @ts-expect-error -- Passing `undefined` as an ID is secretly allowed here
      ) => t.markup(...getArgs(...params));
      translateFn.has = function translateHasFn(message) { // eslint-disable-next-line @typescript-eslint/no-unused-vars
        // Not really something better we can do here
        return true;
      };
      return translateFn;
    }
  },
  '[project]/node_modules/next-intl/dist/esm/development/shared/NextIntlClientProvider.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['default', () => NextIntlClientProvider]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$use$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/use-intl/dist/esm/development/react.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-runtime.js [app-client] (ecmascript)'
      );
    ('use client');
    function NextIntlClientProvider({ locale, ...rest }) {
      if (!locale) {
        throw new Error(
          "Couldn't infer the `locale` prop in `NextIntlClientProvider`, please provide it explicitly.\n\nSee https://next-intl.dev/docs/configuration#locale"
        );
      }
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsx'
      ])(
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$use$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'IntlProvider'
        ],
        {
          locale: locale,
          ...rest,
        }
      );
    }
  },
  '[project]/node_modules/next-intl/dist/esm/development/react-client/index.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'useFormatter',
      () => useFormatter,
      'useTranslations',
      () => useTranslations,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$use$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/use-intl/dist/esm/development/react.js [app-client] (ecmascript)'
      );
    /**
     * This is the main entry file when non-'react-server'
     * environments import from 'next-intl'.
     *
     * Maintainer notes:
     * - Make sure this mirrors the API from 'react-server'.
     * - Make sure everything exported from this module is
     *   supported in all Next.js versions that are supported.
     */ // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    function callHook(name, hook) {
      return (...args) => {
        try {
          return hook(...args);
        } catch {
          throw new Error(`Failed to call \`${name}\` because the context from \`NextIntlClientProvider\` was not found.

This can happen because:
1) You intended to render this component as a Server Component, the render
   failed, and therefore React attempted to render the component on the client
   instead. If this is the case, check the console for server errors.
2) You intended to render this component on the client side, but no context was found.
   Learn more about this error here: https://next-intl.dev/docs/environments/server-client-components#missing-context`);
        }
      };
    }
    const useTranslations = callHook(
      'useTranslations',
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$use$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useTranslations'
      ]
    );
    const useFormatter = callHook(
      'useFormatter',
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$use$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useFormatter'
      ]
    );
  },
  '[project]/node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js [app-client] (ecmascript)',
  (__turbopack_context__, module, exports) => {
    'use strict';

    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      /*#__PURE__*/ __turbopack_context__.i(
        '[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)'
      );
    /**
     * @license React
     * react-jsx-dev-runtime.development.js
     *
     * Copyright (c) Meta Platforms, Inc. and affiliates.
     *
     * This source code is licensed under the MIT license found in the
     * LICENSE file in the root directory of this source tree.
     */ ('use strict');
    'production' !== ('TURBOPACK compile-time value', 'development') &&
      (function () {
        function getComponentNameFromType(type) {
          if (null == type) return null;
          if ('function' === typeof type)
            return type.$$typeof === REACT_CLIENT_REFERENCE
              ? null
              : type.displayName || type.name || null;
          if ('string' === typeof type) return type;
          switch (type) {
            case REACT_FRAGMENT_TYPE:
              return 'Fragment';
            case REACT_PROFILER_TYPE:
              return 'Profiler';
            case REACT_STRICT_MODE_TYPE:
              return 'StrictMode';
            case REACT_SUSPENSE_TYPE:
              return 'Suspense';
            case REACT_SUSPENSE_LIST_TYPE:
              return 'SuspenseList';
            case REACT_ACTIVITY_TYPE:
              return 'Activity';
            case REACT_VIEW_TRANSITION_TYPE:
              return 'ViewTransition';
          }
          if ('object' === typeof type)
            switch (
              ('number' === typeof type.tag &&
                console.error(
                  'Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue.'
                ),
              type.$$typeof)
            ) {
              case REACT_PORTAL_TYPE:
                return 'Portal';
              case REACT_CONTEXT_TYPE:
                return type.displayName || 'Context';
              case REACT_CONSUMER_TYPE:
                return (type._context.displayName || 'Context') + '.Consumer';
              case REACT_FORWARD_REF_TYPE:
                var innerType = type.render;
                type = type.displayName;
                type ||
                  ((type = innerType.displayName || innerType.name || ''),
                  (type = '' !== type ? 'ForwardRef(' + type + ')' : 'ForwardRef'));
                return type;
              case REACT_MEMO_TYPE:
                return (
                  (innerType = type.displayName || null),
                  null !== innerType ? innerType : getComponentNameFromType(type.type) || 'Memo'
                );
              case REACT_LAZY_TYPE:
                innerType = type._payload;
                type = type._init;
                try {
                  return getComponentNameFromType(type(innerType));
                } catch (x) {}
            }
          return null;
        }
        function testStringCoercion(value) {
          return '' + value;
        }
        function checkKeyStringCoercion(value) {
          try {
            testStringCoercion(value);
            var JSCompiler_inline_result = !1;
          } catch (e) {
            JSCompiler_inline_result = !0;
          }
          if (JSCompiler_inline_result) {
            JSCompiler_inline_result = console;
            var JSCompiler_temp_const = JSCompiler_inline_result.error;
            var JSCompiler_inline_result$jscomp$0 =
              ('function' === typeof Symbol && Symbol.toStringTag && value[Symbol.toStringTag]) ||
              value.constructor.name ||
              'Object';
            JSCompiler_temp_const.call(
              JSCompiler_inline_result,
              'The provided key is an unsupported type %s. This value must be coerced to a string before using it here.',
              JSCompiler_inline_result$jscomp$0
            );
            return testStringCoercion(value);
          }
        }
        function getTaskName(type) {
          if (type === REACT_FRAGMENT_TYPE) return '<>';
          if ('object' === typeof type && null !== type && type.$$typeof === REACT_LAZY_TYPE)
            return '<...>';
          try {
            var name = getComponentNameFromType(type);
            return name ? '<' + name + '>' : '<...>';
          } catch (x) {
            return '<...>';
          }
        }
        function getOwner() {
          var dispatcher = ReactSharedInternals.A;
          return null === dispatcher ? null : dispatcher.getOwner();
        }
        function UnknownOwner() {
          return Error('react-stack-top-frame');
        }
        function hasValidKey(config) {
          if (hasOwnProperty.call(config, 'key')) {
            var getter = Object.getOwnPropertyDescriptor(config, 'key').get;
            if (getter && getter.isReactWarning) return !1;
          }
          return void 0 !== config.key;
        }
        function defineKeyPropWarningGetter(props, displayName) {
          function warnAboutAccessingKey() {
            specialPropKeyWarningShown ||
              ((specialPropKeyWarningShown = !0),
              console.error(
                '%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)',
                displayName
              ));
          }
          warnAboutAccessingKey.isReactWarning = !0;
          Object.defineProperty(props, 'key', {
            get: warnAboutAccessingKey,
            configurable: !0,
          });
        }
        function elementRefGetterWithDeprecationWarning() {
          var componentName = getComponentNameFromType(this.type);
          didWarnAboutElementRef[componentName] ||
            ((didWarnAboutElementRef[componentName] = !0),
            console.error(
              'Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release.'
            ));
          componentName = this.props.ref;
          return void 0 !== componentName ? componentName : null;
        }
        function ReactElement(type, key, props, owner, debugStack, debugTask) {
          var refProp = props.ref;
          type = {
            $$typeof: REACT_ELEMENT_TYPE,
            type: type,
            key: key,
            props: props,
            _owner: owner,
          };
          null !== (void 0 !== refProp ? refProp : null)
            ? Object.defineProperty(type, 'ref', {
                enumerable: !1,
                get: elementRefGetterWithDeprecationWarning,
              })
            : Object.defineProperty(type, 'ref', {
                enumerable: !1,
                value: null,
              });
          type._store = {};
          Object.defineProperty(type._store, 'validated', {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: 0,
          });
          Object.defineProperty(type, '_debugInfo', {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: null,
          });
          Object.defineProperty(type, '_debugStack', {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: debugStack,
          });
          Object.defineProperty(type, '_debugTask', {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: debugTask,
          });
          Object.freeze && (Object.freeze(type.props), Object.freeze(type));
          return type;
        }
        function jsxDEVImpl(type, config, maybeKey, isStaticChildren, debugStack, debugTask) {
          var children = config.children;
          if (void 0 !== children)
            if (isStaticChildren)
              if (isArrayImpl(children)) {
                for (isStaticChildren = 0; isStaticChildren < children.length; isStaticChildren++)
                  validateChildKeys(children[isStaticChildren]);
                Object.freeze && Object.freeze(children);
              } else
                console.error(
                  'React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead.'
                );
            else validateChildKeys(children);
          if (hasOwnProperty.call(config, 'key')) {
            children = getComponentNameFromType(type);
            var keys = Object.keys(config).filter(function (k) {
              return 'key' !== k;
            });
            isStaticChildren =
              0 < keys.length
                ? '{key: someKey, ' + keys.join(': ..., ') + ': ...}'
                : '{key: someKey}';
            didWarnAboutKeySpread[children + isStaticChildren] ||
              ((keys = 0 < keys.length ? '{' + keys.join(': ..., ') + ': ...}' : '{}'),
              console.error(
                'A props object containing a "key" prop is being spread into JSX:\n  let props = %s;\n  <%s {...props} />\nReact keys must be passed directly to JSX without using spread:\n  let props = %s;\n  <%s key={someKey} {...props} />',
                isStaticChildren,
                children,
                keys,
                children
              ),
              (didWarnAboutKeySpread[children + isStaticChildren] = !0));
          }
          children = null;
          void 0 !== maybeKey && (checkKeyStringCoercion(maybeKey), (children = '' + maybeKey));
          hasValidKey(config) && (checkKeyStringCoercion(config.key), (children = '' + config.key));
          if ('key' in config) {
            maybeKey = {};
            for (var propName in config)
              'key' !== propName && (maybeKey[propName] = config[propName]);
          } else maybeKey = config;
          children &&
            defineKeyPropWarningGetter(
              maybeKey,
              'function' === typeof type ? type.displayName || type.name || 'Unknown' : type
            );
          return ReactElement(type, children, maybeKey, getOwner(), debugStack, debugTask);
        }
        function validateChildKeys(node) {
          isValidElement(node)
            ? node._store && (node._store.validated = 1)
            : 'object' === typeof node &&
              null !== node &&
              node.$$typeof === REACT_LAZY_TYPE &&
              ('fulfilled' === node._payload.status
                ? isValidElement(node._payload.value) &&
                  node._payload.value._store &&
                  (node._payload.value._store.validated = 1)
                : node._store && (node._store.validated = 1));
        }
        function isValidElement(object) {
          return (
            'object' === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE
          );
        }
        var React = __turbopack_context__.r(
            '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
          ),
          REACT_ELEMENT_TYPE = Symbol.for('react.transitional.element'),
          REACT_PORTAL_TYPE = Symbol.for('react.portal'),
          REACT_FRAGMENT_TYPE = Symbol.for('react.fragment'),
          REACT_STRICT_MODE_TYPE = Symbol.for('react.strict_mode'),
          REACT_PROFILER_TYPE = Symbol.for('react.profiler'),
          REACT_CONSUMER_TYPE = Symbol.for('react.consumer'),
          REACT_CONTEXT_TYPE = Symbol.for('react.context'),
          REACT_FORWARD_REF_TYPE = Symbol.for('react.forward_ref'),
          REACT_SUSPENSE_TYPE = Symbol.for('react.suspense'),
          REACT_SUSPENSE_LIST_TYPE = Symbol.for('react.suspense_list'),
          REACT_MEMO_TYPE = Symbol.for('react.memo'),
          REACT_LAZY_TYPE = Symbol.for('react.lazy'),
          REACT_ACTIVITY_TYPE = Symbol.for('react.activity'),
          REACT_VIEW_TRANSITION_TYPE = Symbol.for('react.view_transition'),
          REACT_CLIENT_REFERENCE = Symbol.for('react.client.reference'),
          ReactSharedInternals =
            React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,
          hasOwnProperty = Object.prototype.hasOwnProperty,
          isArrayImpl = Array.isArray,
          createTask = console.createTask
            ? console.createTask
            : function () {
                return null;
              };
        React = {
          react_stack_bottom_frame: function (callStackForError) {
            return callStackForError();
          },
        };
        var specialPropKeyWarningShown;
        var didWarnAboutElementRef = {};
        var unknownOwnerDebugStack = React.react_stack_bottom_frame.bind(React, UnknownOwner)();
        var unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
        var didWarnAboutKeySpread = {};
        exports.Fragment = REACT_FRAGMENT_TYPE;
        exports.jsxDEV = function (type, config, maybeKey, isStaticChildren) {
          var trackActualOwner = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
          if (trackActualOwner) {
            var previousStackTraceLimit = Error.stackTraceLimit;
            Error.stackTraceLimit = 10;
            var debugStackDEV = Error('react-stack-top-frame');
            Error.stackTraceLimit = previousStackTraceLimit;
          } else debugStackDEV = unknownOwnerDebugStack;
          return jsxDEVImpl(
            type,
            config,
            maybeKey,
            isStaticChildren,
            debugStackDEV,
            trackActualOwner ? createTask(getTaskName(type)) : unknownOwnerDebugTask
          );
        };
      })();
  },
  '[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)',
  (__turbopack_context__, module, exports) => {
    'use strict';

    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      /*#__PURE__*/ __turbopack_context__.i(
        '[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)'
      );
    ('use strict');
    if (('TURBOPACK compile-time falsy', 0));
    else {
      //TURBOPACK unreachable
      module.exports = __turbopack_context__.r(
        '[project]/node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js [app-client] (ecmascript)'
      );
    }
  },
  '[project]/node_modules/next/dist/compiled/buffer/index.js [app-client] (ecmascript)',
  (__turbopack_context__, module, exports) => {
    (function () {
      var e = {
        675: function (e, r) {
          'use strict';
          r.byteLength = byteLength;
          r.toByteArray = toByteArray;
          r.fromByteArray = fromByteArray;
          var t = [];
          var f = [];
          var n = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;
          var i = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
          for (var o = 0, u = i.length; o < u; ++o) {
            t[o] = i[o];
            f[i.charCodeAt(o)] = o;
          }
          f['-'.charCodeAt(0)] = 62;
          f['_'.charCodeAt(0)] = 63;
          function getLens(e) {
            var r = e.length;
            if (r % 4 > 0) {
              throw new Error('Invalid string. Length must be a multiple of 4');
            }
            var t = e.indexOf('=');
            if (t === -1) t = r;
            var f = t === r ? 0 : 4 - (t % 4);
            return [t, f];
          }
          function byteLength(e) {
            var r = getLens(e);
            var t = r[0];
            var f = r[1];
            return ((t + f) * 3) / 4 - f;
          }
          function _byteLength(e, r, t) {
            return ((r + t) * 3) / 4 - t;
          }
          function toByteArray(e) {
            var r;
            var t = getLens(e);
            var i = t[0];
            var o = t[1];
            var u = new n(_byteLength(e, i, o));
            var a = 0;
            var s = o > 0 ? i - 4 : i;
            var h;
            for (h = 0; h < s; h += 4) {
              r =
                (f[e.charCodeAt(h)] << 18) |
                (f[e.charCodeAt(h + 1)] << 12) |
                (f[e.charCodeAt(h + 2)] << 6) |
                f[e.charCodeAt(h + 3)];
              u[a++] = (r >> 16) & 255;
              u[a++] = (r >> 8) & 255;
              u[a++] = r & 255;
            }
            if (o === 2) {
              r = (f[e.charCodeAt(h)] << 2) | (f[e.charCodeAt(h + 1)] >> 4);
              u[a++] = r & 255;
            }
            if (o === 1) {
              r =
                (f[e.charCodeAt(h)] << 10) |
                (f[e.charCodeAt(h + 1)] << 4) |
                (f[e.charCodeAt(h + 2)] >> 2);
              u[a++] = (r >> 8) & 255;
              u[a++] = r & 255;
            }
            return u;
          }
          function tripletToBase64(e) {
            return t[(e >> 18) & 63] + t[(e >> 12) & 63] + t[(e >> 6) & 63] + t[e & 63];
          }
          function encodeChunk(e, r, t) {
            var f;
            var n = [];
            for (var i = r; i < t; i += 3) {
              f = ((e[i] << 16) & 16711680) + ((e[i + 1] << 8) & 65280) + (e[i + 2] & 255);
              n.push(tripletToBase64(f));
            }
            return n.join('');
          }
          function fromByteArray(e) {
            var r;
            var f = e.length;
            var n = f % 3;
            var i = [];
            var o = 16383;
            for (var u = 0, a = f - n; u < a; u += o) {
              i.push(encodeChunk(e, u, u + o > a ? a : u + o));
            }
            if (n === 1) {
              r = e[f - 1];
              i.push(t[r >> 2] + t[(r << 4) & 63] + '==');
            } else if (n === 2) {
              r = (e[f - 2] << 8) + e[f - 1];
              i.push(t[r >> 10] + t[(r >> 4) & 63] + t[(r << 2) & 63] + '=');
            }
            return i.join('');
          }
        },
        72: function (e, r, t) {
          'use strict';
          /*!
           * The buffer module from node.js, for the browser.
           *
           * @author   Feross Aboukhadijeh <https://feross.org>
           * @license  MIT
           */ var f = t(675);
          var n = t(783);
          var i =
            typeof Symbol === 'function' && typeof Symbol.for === 'function'
              ? Symbol.for('nodejs.util.inspect.custom')
              : null;
          r.Buffer = Buffer;
          r.SlowBuffer = SlowBuffer;
          r.INSPECT_MAX_BYTES = 50;
          var o = 2147483647;
          r.kMaxLength = o;
          Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport();
          if (
            !Buffer.TYPED_ARRAY_SUPPORT &&
            typeof console !== 'undefined' &&
            typeof console.error === 'function'
          ) {
            console.error(
              'This browser lacks typed array (Uint8Array) support which is required by ' +
                '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
            );
          }
          function typedArraySupport() {
            try {
              var e = new Uint8Array(1);
              var r = {
                foo: function () {
                  return 42;
                },
              };
              Object.setPrototypeOf(r, Uint8Array.prototype);
              Object.setPrototypeOf(e, r);
              return e.foo() === 42;
            } catch (e) {
              return false;
            }
          }
          Object.defineProperty(Buffer.prototype, 'parent', {
            enumerable: true,
            get: function () {
              if (!Buffer.isBuffer(this)) return undefined;
              return this.buffer;
            },
          });
          Object.defineProperty(Buffer.prototype, 'offset', {
            enumerable: true,
            get: function () {
              if (!Buffer.isBuffer(this)) return undefined;
              return this.byteOffset;
            },
          });
          function createBuffer(e) {
            if (e > o) {
              throw new RangeError('The value "' + e + '" is invalid for option "size"');
            }
            var r = new Uint8Array(e);
            Object.setPrototypeOf(r, Buffer.prototype);
            return r;
          }
          function Buffer(e, r, t) {
            if (typeof e === 'number') {
              if (typeof r === 'string') {
                throw new TypeError(
                  'The "string" argument must be of type string. Received type number'
                );
              }
              return allocUnsafe(e);
            }
            return from(e, r, t);
          }
          Buffer.poolSize = 8192;
          function from(e, r, t) {
            if (typeof e === 'string') {
              return fromString(e, r);
            }
            if (ArrayBuffer.isView(e)) {
              return fromArrayLike(e);
            }
            if (e == null) {
              throw new TypeError(
                'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
                  'or Array-like Object. Received type ' +
                  typeof e
              );
            }
            if (isInstance(e, ArrayBuffer) || (e && isInstance(e.buffer, ArrayBuffer))) {
              return fromArrayBuffer(e, r, t);
            }
            if (
              typeof SharedArrayBuffer !== 'undefined' &&
              (isInstance(e, SharedArrayBuffer) || (e && isInstance(e.buffer, SharedArrayBuffer)))
            ) {
              return fromArrayBuffer(e, r, t);
            }
            if (typeof e === 'number') {
              throw new TypeError(
                'The "value" argument must not be of type number. Received type number'
              );
            }
            var f = e.valueOf && e.valueOf();
            if (f != null && f !== e) {
              return Buffer.from(f, r, t);
            }
            var n = fromObject(e);
            if (n) return n;
            if (
              typeof Symbol !== 'undefined' &&
              Symbol.toPrimitive != null &&
              typeof e[Symbol.toPrimitive] === 'function'
            ) {
              return Buffer.from(e[Symbol.toPrimitive]('string'), r, t);
            }
            throw new TypeError(
              'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
                'or Array-like Object. Received type ' +
                typeof e
            );
          }
          Buffer.from = function (e, r, t) {
            return from(e, r, t);
          };
          Object.setPrototypeOf(Buffer.prototype, Uint8Array.prototype);
          Object.setPrototypeOf(Buffer, Uint8Array);
          function assertSize(e) {
            if (typeof e !== 'number') {
              throw new TypeError('"size" argument must be of type number');
            } else if (e < 0) {
              throw new RangeError('The value "' + e + '" is invalid for option "size"');
            }
          }
          function alloc(e, r, t) {
            assertSize(e);
            if (e <= 0) {
              return createBuffer(e);
            }
            if (r !== undefined) {
              return typeof t === 'string' ? createBuffer(e).fill(r, t) : createBuffer(e).fill(r);
            }
            return createBuffer(e);
          }
          Buffer.alloc = function (e, r, t) {
            return alloc(e, r, t);
          };
          function allocUnsafe(e) {
            assertSize(e);
            return createBuffer(e < 0 ? 0 : checked(e) | 0);
          }
          Buffer.allocUnsafe = function (e) {
            return allocUnsafe(e);
          };
          Buffer.allocUnsafeSlow = function (e) {
            return allocUnsafe(e);
          };
          function fromString(e, r) {
            if (typeof r !== 'string' || r === '') {
              r = 'utf8';
            }
            if (!Buffer.isEncoding(r)) {
              throw new TypeError('Unknown encoding: ' + r);
            }
            var t = byteLength(e, r) | 0;
            var f = createBuffer(t);
            var n = f.write(e, r);
            if (n !== t) {
              f = f.slice(0, n);
            }
            return f;
          }
          function fromArrayLike(e) {
            var r = e.length < 0 ? 0 : checked(e.length) | 0;
            var t = createBuffer(r);
            for (var f = 0; f < r; f += 1) {
              t[f] = e[f] & 255;
            }
            return t;
          }
          function fromArrayBuffer(e, r, t) {
            if (r < 0 || e.byteLength < r) {
              throw new RangeError('"offset" is outside of buffer bounds');
            }
            if (e.byteLength < r + (t || 0)) {
              throw new RangeError('"length" is outside of buffer bounds');
            }
            var f;
            if (r === undefined && t === undefined) {
              f = new Uint8Array(e);
            } else if (t === undefined) {
              f = new Uint8Array(e, r);
            } else {
              f = new Uint8Array(e, r, t);
            }
            Object.setPrototypeOf(f, Buffer.prototype);
            return f;
          }
          function fromObject(e) {
            if (Buffer.isBuffer(e)) {
              var r = checked(e.length) | 0;
              var t = createBuffer(r);
              if (t.length === 0) {
                return t;
              }
              e.copy(t, 0, 0, r);
              return t;
            }
            if (e.length !== undefined) {
              if (typeof e.length !== 'number' || numberIsNaN(e.length)) {
                return createBuffer(0);
              }
              return fromArrayLike(e);
            }
            if (e.type === 'Buffer' && Array.isArray(e.data)) {
              return fromArrayLike(e.data);
            }
          }
          function checked(e) {
            if (e >= o) {
              throw new RangeError(
                'Attempt to allocate Buffer larger than maximum ' +
                  'size: 0x' +
                  o.toString(16) +
                  ' bytes'
              );
            }
            return e | 0;
          }
          function SlowBuffer(e) {
            if (+e != e) {
              e = 0;
            }
            return Buffer.alloc(+e);
          }
          Buffer.isBuffer = function isBuffer(e) {
            return e != null && e._isBuffer === true && e !== Buffer.prototype;
          };
          Buffer.compare = function compare(e, r) {
            if (isInstance(e, Uint8Array)) e = Buffer.from(e, e.offset, e.byteLength);
            if (isInstance(r, Uint8Array)) r = Buffer.from(r, r.offset, r.byteLength);
            if (!Buffer.isBuffer(e) || !Buffer.isBuffer(r)) {
              throw new TypeError(
                'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
              );
            }
            if (e === r) return 0;
            var t = e.length;
            var f = r.length;
            for (var n = 0, i = Math.min(t, f); n < i; ++n) {
              if (e[n] !== r[n]) {
                t = e[n];
                f = r[n];
                break;
              }
            }
            if (t < f) return -1;
            if (f < t) return 1;
            return 0;
          };
          Buffer.isEncoding = function isEncoding(e) {
            switch (String(e).toLowerCase()) {
              case 'hex':
              case 'utf8':
              case 'utf-8':
              case 'ascii':
              case 'latin1':
              case 'binary':
              case 'base64':
              case 'ucs2':
              case 'ucs-2':
              case 'utf16le':
              case 'utf-16le':
                return true;
              default:
                return false;
            }
          };
          Buffer.concat = function concat(e, r) {
            if (!Array.isArray(e)) {
              throw new TypeError('"list" argument must be an Array of Buffers');
            }
            if (e.length === 0) {
              return Buffer.alloc(0);
            }
            var t;
            if (r === undefined) {
              r = 0;
              for (t = 0; t < e.length; ++t) {
                r += e[t].length;
              }
            }
            var f = Buffer.allocUnsafe(r);
            var n = 0;
            for (t = 0; t < e.length; ++t) {
              var i = e[t];
              if (isInstance(i, Uint8Array)) {
                i = Buffer.from(i);
              }
              if (!Buffer.isBuffer(i)) {
                throw new TypeError('"list" argument must be an Array of Buffers');
              }
              i.copy(f, n);
              n += i.length;
            }
            return f;
          };
          function byteLength(e, r) {
            if (Buffer.isBuffer(e)) {
              return e.length;
            }
            if (ArrayBuffer.isView(e) || isInstance(e, ArrayBuffer)) {
              return e.byteLength;
            }
            if (typeof e !== 'string') {
              throw new TypeError(
                'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
                  'Received type ' +
                  typeof e
              );
            }
            var t = e.length;
            var f = arguments.length > 2 && arguments[2] === true;
            if (!f && t === 0) return 0;
            var n = false;
            for (;;) {
              switch (r) {
                case 'ascii':
                case 'latin1':
                case 'binary':
                  return t;
                case 'utf8':
                case 'utf-8':
                  return utf8ToBytes(e).length;
                case 'ucs2':
                case 'ucs-2':
                case 'utf16le':
                case 'utf-16le':
                  return t * 2;
                case 'hex':
                  return t >>> 1;
                case 'base64':
                  return base64ToBytes(e).length;
                default:
                  if (n) {
                    return f ? -1 : utf8ToBytes(e).length;
                  }
                  r = ('' + r).toLowerCase();
                  n = true;
              }
            }
          }
          Buffer.byteLength = byteLength;
          function slowToString(e, r, t) {
            var f = false;
            if (r === undefined || r < 0) {
              r = 0;
            }
            if (r > this.length) {
              return '';
            }
            if (t === undefined || t > this.length) {
              t = this.length;
            }
            if (t <= 0) {
              return '';
            }
            t >>>= 0;
            r >>>= 0;
            if (t <= r) {
              return '';
            }
            if (!e) e = 'utf8';
            while (true) {
              switch (e) {
                case 'hex':
                  return hexSlice(this, r, t);
                case 'utf8':
                case 'utf-8':
                  return utf8Slice(this, r, t);
                case 'ascii':
                  return asciiSlice(this, r, t);
                case 'latin1':
                case 'binary':
                  return latin1Slice(this, r, t);
                case 'base64':
                  return base64Slice(this, r, t);
                case 'ucs2':
                case 'ucs-2':
                case 'utf16le':
                case 'utf-16le':
                  return utf16leSlice(this, r, t);
                default:
                  if (f) throw new TypeError('Unknown encoding: ' + e);
                  e = (e + '').toLowerCase();
                  f = true;
              }
            }
          }
          Buffer.prototype._isBuffer = true;
          function swap(e, r, t) {
            var f = e[r];
            e[r] = e[t];
            e[t] = f;
          }
          Buffer.prototype.swap16 = function swap16() {
            var e = this.length;
            if (e % 2 !== 0) {
              throw new RangeError('Buffer size must be a multiple of 16-bits');
            }
            for (var r = 0; r < e; r += 2) {
              swap(this, r, r + 1);
            }
            return this;
          };
          Buffer.prototype.swap32 = function swap32() {
            var e = this.length;
            if (e % 4 !== 0) {
              throw new RangeError('Buffer size must be a multiple of 32-bits');
            }
            for (var r = 0; r < e; r += 4) {
              swap(this, r, r + 3);
              swap(this, r + 1, r + 2);
            }
            return this;
          };
          Buffer.prototype.swap64 = function swap64() {
            var e = this.length;
            if (e % 8 !== 0) {
              throw new RangeError('Buffer size must be a multiple of 64-bits');
            }
            for (var r = 0; r < e; r += 8) {
              swap(this, r, r + 7);
              swap(this, r + 1, r + 6);
              swap(this, r + 2, r + 5);
              swap(this, r + 3, r + 4);
            }
            return this;
          };
          Buffer.prototype.toString = function toString() {
            var e = this.length;
            if (e === 0) return '';
            if (arguments.length === 0) return utf8Slice(this, 0, e);
            return slowToString.apply(this, arguments);
          };
          Buffer.prototype.toLocaleString = Buffer.prototype.toString;
          Buffer.prototype.equals = function equals(e) {
            if (!Buffer.isBuffer(e)) throw new TypeError('Argument must be a Buffer');
            if (this === e) return true;
            return Buffer.compare(this, e) === 0;
          };
          Buffer.prototype.inspect = function inspect() {
            var e = '';
            var t = r.INSPECT_MAX_BYTES;
            e = this.toString('hex', 0, t)
              .replace(/(.{2})/g, '$1 ')
              .trim();
            if (this.length > t) e += ' ... ';
            return '<Buffer ' + e + '>';
          };
          if (i) {
            Buffer.prototype[i] = Buffer.prototype.inspect;
          }
          Buffer.prototype.compare = function compare(e, r, t, f, n) {
            if (isInstance(e, Uint8Array)) {
              e = Buffer.from(e, e.offset, e.byteLength);
            }
            if (!Buffer.isBuffer(e)) {
              throw new TypeError(
                'The "target" argument must be one of type Buffer or Uint8Array. ' +
                  'Received type ' +
                  typeof e
              );
            }
            if (r === undefined) {
              r = 0;
            }
            if (t === undefined) {
              t = e ? e.length : 0;
            }
            if (f === undefined) {
              f = 0;
            }
            if (n === undefined) {
              n = this.length;
            }
            if (r < 0 || t > e.length || f < 0 || n > this.length) {
              throw new RangeError('out of range index');
            }
            if (f >= n && r >= t) {
              return 0;
            }
            if (f >= n) {
              return -1;
            }
            if (r >= t) {
              return 1;
            }
            r >>>= 0;
            t >>>= 0;
            f >>>= 0;
            n >>>= 0;
            if (this === e) return 0;
            var i = n - f;
            var o = t - r;
            var u = Math.min(i, o);
            var a = this.slice(f, n);
            var s = e.slice(r, t);
            for (var h = 0; h < u; ++h) {
              if (a[h] !== s[h]) {
                i = a[h];
                o = s[h];
                break;
              }
            }
            if (i < o) return -1;
            if (o < i) return 1;
            return 0;
          };
          function bidirectionalIndexOf(e, r, t, f, n) {
            if (e.length === 0) return -1;
            if (typeof t === 'string') {
              f = t;
              t = 0;
            } else if (t > 2147483647) {
              t = 2147483647;
            } else if (t < -2147483648) {
              t = -2147483648;
            }
            t = +t;
            if (numberIsNaN(t)) {
              t = n ? 0 : e.length - 1;
            }
            if (t < 0) t = e.length + t;
            if (t >= e.length) {
              if (n) return -1;
              else t = e.length - 1;
            } else if (t < 0) {
              if (n) t = 0;
              else return -1;
            }
            if (typeof r === 'string') {
              r = Buffer.from(r, f);
            }
            if (Buffer.isBuffer(r)) {
              if (r.length === 0) {
                return -1;
              }
              return arrayIndexOf(e, r, t, f, n);
            } else if (typeof r === 'number') {
              r = r & 255;
              if (typeof Uint8Array.prototype.indexOf === 'function') {
                if (n) {
                  return Uint8Array.prototype.indexOf.call(e, r, t);
                } else {
                  return Uint8Array.prototype.lastIndexOf.call(e, r, t);
                }
              }
              return arrayIndexOf(e, [r], t, f, n);
            }
            throw new TypeError('val must be string, number or Buffer');
          }
          function arrayIndexOf(e, r, t, f, n) {
            var i = 1;
            var o = e.length;
            var u = r.length;
            if (f !== undefined) {
              f = String(f).toLowerCase();
              if (f === 'ucs2' || f === 'ucs-2' || f === 'utf16le' || f === 'utf-16le') {
                if (e.length < 2 || r.length < 2) {
                  return -1;
                }
                i = 2;
                o /= 2;
                u /= 2;
                t /= 2;
              }
            }
            function read(e, r) {
              if (i === 1) {
                return e[r];
              } else {
                return e.readUInt16BE(r * i);
              }
            }
            var a;
            if (n) {
              var s = -1;
              for (a = t; a < o; a++) {
                if (read(e, a) === read(r, s === -1 ? 0 : a - s)) {
                  if (s === -1) s = a;
                  if (a - s + 1 === u) return s * i;
                } else {
                  if (s !== -1) a -= a - s;
                  s = -1;
                }
              }
            } else {
              if (t + u > o) t = o - u;
              for (a = t; a >= 0; a--) {
                var h = true;
                for (var c = 0; c < u; c++) {
                  if (read(e, a + c) !== read(r, c)) {
                    h = false;
                    break;
                  }
                }
                if (h) return a;
              }
            }
            return -1;
          }
          Buffer.prototype.includes = function includes(e, r, t) {
            return this.indexOf(e, r, t) !== -1;
          };
          Buffer.prototype.indexOf = function indexOf(e, r, t) {
            return bidirectionalIndexOf(this, e, r, t, true);
          };
          Buffer.prototype.lastIndexOf = function lastIndexOf(e, r, t) {
            return bidirectionalIndexOf(this, e, r, t, false);
          };
          function hexWrite(e, r, t, f) {
            t = Number(t) || 0;
            var n = e.length - t;
            if (!f) {
              f = n;
            } else {
              f = Number(f);
              if (f > n) {
                f = n;
              }
            }
            var i = r.length;
            if (f > i / 2) {
              f = i / 2;
            }
            for (var o = 0; o < f; ++o) {
              var u = parseInt(r.substr(o * 2, 2), 16);
              if (numberIsNaN(u)) return o;
              e[t + o] = u;
            }
            return o;
          }
          function utf8Write(e, r, t, f) {
            return blitBuffer(utf8ToBytes(r, e.length - t), e, t, f);
          }
          function asciiWrite(e, r, t, f) {
            return blitBuffer(asciiToBytes(r), e, t, f);
          }
          function latin1Write(e, r, t, f) {
            return asciiWrite(e, r, t, f);
          }
          function base64Write(e, r, t, f) {
            return blitBuffer(base64ToBytes(r), e, t, f);
          }
          function ucs2Write(e, r, t, f) {
            return blitBuffer(utf16leToBytes(r, e.length - t), e, t, f);
          }
          Buffer.prototype.write = function write(e, r, t, f) {
            if (r === undefined) {
              f = 'utf8';
              t = this.length;
              r = 0;
            } else if (t === undefined && typeof r === 'string') {
              f = r;
              t = this.length;
              r = 0;
            } else if (isFinite(r)) {
              r = r >>> 0;
              if (isFinite(t)) {
                t = t >>> 0;
                if (f === undefined) f = 'utf8';
              } else {
                f = t;
                t = undefined;
              }
            } else {
              throw new Error(
                'Buffer.write(string, encoding, offset[, length]) is no longer supported'
              );
            }
            var n = this.length - r;
            if (t === undefined || t > n) t = n;
            if ((e.length > 0 && (t < 0 || r < 0)) || r > this.length) {
              throw new RangeError('Attempt to write outside buffer bounds');
            }
            if (!f) f = 'utf8';
            var i = false;
            for (;;) {
              switch (f) {
                case 'hex':
                  return hexWrite(this, e, r, t);
                case 'utf8':
                case 'utf-8':
                  return utf8Write(this, e, r, t);
                case 'ascii':
                  return asciiWrite(this, e, r, t);
                case 'latin1':
                case 'binary':
                  return latin1Write(this, e, r, t);
                case 'base64':
                  return base64Write(this, e, r, t);
                case 'ucs2':
                case 'ucs-2':
                case 'utf16le':
                case 'utf-16le':
                  return ucs2Write(this, e, r, t);
                default:
                  if (i) throw new TypeError('Unknown encoding: ' + f);
                  f = ('' + f).toLowerCase();
                  i = true;
              }
            }
          };
          Buffer.prototype.toJSON = function toJSON() {
            return {
              type: 'Buffer',
              data: Array.prototype.slice.call(this._arr || this, 0),
            };
          };
          function base64Slice(e, r, t) {
            if (r === 0 && t === e.length) {
              return f.fromByteArray(e);
            } else {
              return f.fromByteArray(e.slice(r, t));
            }
          }
          function utf8Slice(e, r, t) {
            t = Math.min(e.length, t);
            var f = [];
            var n = r;
            while (n < t) {
              var i = e[n];
              var o = null;
              var u = i > 239 ? 4 : i > 223 ? 3 : i > 191 ? 2 : 1;
              if (n + u <= t) {
                var a, s, h, c;
                switch (u) {
                  case 1:
                    if (i < 128) {
                      o = i;
                    }
                    break;
                  case 2:
                    a = e[n + 1];
                    if ((a & 192) === 128) {
                      c = ((i & 31) << 6) | (a & 63);
                      if (c > 127) {
                        o = c;
                      }
                    }
                    break;
                  case 3:
                    a = e[n + 1];
                    s = e[n + 2];
                    if ((a & 192) === 128 && (s & 192) === 128) {
                      c = ((i & 15) << 12) | ((a & 63) << 6) | (s & 63);
                      if (c > 2047 && (c < 55296 || c > 57343)) {
                        o = c;
                      }
                    }
                    break;
                  case 4:
                    a = e[n + 1];
                    s = e[n + 2];
                    h = e[n + 3];
                    if ((a & 192) === 128 && (s & 192) === 128 && (h & 192) === 128) {
                      c = ((i & 15) << 18) | ((a & 63) << 12) | ((s & 63) << 6) | (h & 63);
                      if (c > 65535 && c < 1114112) {
                        o = c;
                      }
                    }
                }
              }
              if (o === null) {
                o = 65533;
                u = 1;
              } else if (o > 65535) {
                o -= 65536;
                f.push(((o >>> 10) & 1023) | 55296);
                o = 56320 | (o & 1023);
              }
              f.push(o);
              n += u;
            }
            return decodeCodePointsArray(f);
          }
          var u = 4096;
          function decodeCodePointsArray(e) {
            var r = e.length;
            if (r <= u) {
              return String.fromCharCode.apply(String, e);
            }
            var t = '';
            var f = 0;
            while (f < r) {
              t += String.fromCharCode.apply(String, e.slice(f, (f += u)));
            }
            return t;
          }
          function asciiSlice(e, r, t) {
            var f = '';
            t = Math.min(e.length, t);
            for (var n = r; n < t; ++n) {
              f += String.fromCharCode(e[n] & 127);
            }
            return f;
          }
          function latin1Slice(e, r, t) {
            var f = '';
            t = Math.min(e.length, t);
            for (var n = r; n < t; ++n) {
              f += String.fromCharCode(e[n]);
            }
            return f;
          }
          function hexSlice(e, r, t) {
            var f = e.length;
            if (!r || r < 0) r = 0;
            if (!t || t < 0 || t > f) t = f;
            var n = '';
            for (var i = r; i < t; ++i) {
              n += s[e[i]];
            }
            return n;
          }
          function utf16leSlice(e, r, t) {
            var f = e.slice(r, t);
            var n = '';
            for (var i = 0; i < f.length; i += 2) {
              n += String.fromCharCode(f[i] + f[i + 1] * 256);
            }
            return n;
          }
          Buffer.prototype.slice = function slice(e, r) {
            var t = this.length;
            e = ~~e;
            r = r === undefined ? t : ~~r;
            if (e < 0) {
              e += t;
              if (e < 0) e = 0;
            } else if (e > t) {
              e = t;
            }
            if (r < 0) {
              r += t;
              if (r < 0) r = 0;
            } else if (r > t) {
              r = t;
            }
            if (r < e) r = e;
            var f = this.subarray(e, r);
            Object.setPrototypeOf(f, Buffer.prototype);
            return f;
          };
          function checkOffset(e, r, t) {
            if (e % 1 !== 0 || e < 0) throw new RangeError('offset is not uint');
            if (e + r > t) throw new RangeError('Trying to access beyond buffer length');
          }
          Buffer.prototype.readUIntLE = function readUIntLE(e, r, t) {
            e = e >>> 0;
            r = r >>> 0;
            if (!t) checkOffset(e, r, this.length);
            var f = this[e];
            var n = 1;
            var i = 0;
            while (++i < r && (n *= 256)) {
              f += this[e + i] * n;
            }
            return f;
          };
          Buffer.prototype.readUIntBE = function readUIntBE(e, r, t) {
            e = e >>> 0;
            r = r >>> 0;
            if (!t) {
              checkOffset(e, r, this.length);
            }
            var f = this[e + --r];
            var n = 1;
            while (r > 0 && (n *= 256)) {
              f += this[e + --r] * n;
            }
            return f;
          };
          Buffer.prototype.readUInt8 = function readUInt8(e, r) {
            e = e >>> 0;
            if (!r) checkOffset(e, 1, this.length);
            return this[e];
          };
          Buffer.prototype.readUInt16LE = function readUInt16LE(e, r) {
            e = e >>> 0;
            if (!r) checkOffset(e, 2, this.length);
            return this[e] | (this[e + 1] << 8);
          };
          Buffer.prototype.readUInt16BE = function readUInt16BE(e, r) {
            e = e >>> 0;
            if (!r) checkOffset(e, 2, this.length);
            return (this[e] << 8) | this[e + 1];
          };
          Buffer.prototype.readUInt32LE = function readUInt32LE(e, r) {
            e = e >>> 0;
            if (!r) checkOffset(e, 4, this.length);
            return (this[e] | (this[e + 1] << 8) | (this[e + 2] << 16)) + this[e + 3] * 16777216;
          };
          Buffer.prototype.readUInt32BE = function readUInt32BE(e, r) {
            e = e >>> 0;
            if (!r) checkOffset(e, 4, this.length);
            return this[e] * 16777216 + ((this[e + 1] << 16) | (this[e + 2] << 8) | this[e + 3]);
          };
          Buffer.prototype.readIntLE = function readIntLE(e, r, t) {
            e = e >>> 0;
            r = r >>> 0;
            if (!t) checkOffset(e, r, this.length);
            var f = this[e];
            var n = 1;
            var i = 0;
            while (++i < r && (n *= 256)) {
              f += this[e + i] * n;
            }
            n *= 128;
            if (f >= n) f -= Math.pow(2, 8 * r);
            return f;
          };
          Buffer.prototype.readIntBE = function readIntBE(e, r, t) {
            e = e >>> 0;
            r = r >>> 0;
            if (!t) checkOffset(e, r, this.length);
            var f = r;
            var n = 1;
            var i = this[e + --f];
            while (f > 0 && (n *= 256)) {
              i += this[e + --f] * n;
            }
            n *= 128;
            if (i >= n) i -= Math.pow(2, 8 * r);
            return i;
          };
          Buffer.prototype.readInt8 = function readInt8(e, r) {
            e = e >>> 0;
            if (!r) checkOffset(e, 1, this.length);
            if (!(this[e] & 128)) return this[e];
            return (255 - this[e] + 1) * -1;
          };
          Buffer.prototype.readInt16LE = function readInt16LE(e, r) {
            e = e >>> 0;
            if (!r) checkOffset(e, 2, this.length);
            var t = this[e] | (this[e + 1] << 8);
            return t & 32768 ? t | 4294901760 : t;
          };
          Buffer.prototype.readInt16BE = function readInt16BE(e, r) {
            e = e >>> 0;
            if (!r) checkOffset(e, 2, this.length);
            var t = this[e + 1] | (this[e] << 8);
            return t & 32768 ? t | 4294901760 : t;
          };
          Buffer.prototype.readInt32LE = function readInt32LE(e, r) {
            e = e >>> 0;
            if (!r) checkOffset(e, 4, this.length);
            return this[e] | (this[e + 1] << 8) | (this[e + 2] << 16) | (this[e + 3] << 24);
          };
          Buffer.prototype.readInt32BE = function readInt32BE(e, r) {
            e = e >>> 0;
            if (!r) checkOffset(e, 4, this.length);
            return (this[e] << 24) | (this[e + 1] << 16) | (this[e + 2] << 8) | this[e + 3];
          };
          Buffer.prototype.readFloatLE = function readFloatLE(e, r) {
            e = e >>> 0;
            if (!r) checkOffset(e, 4, this.length);
            return n.read(this, e, true, 23, 4);
          };
          Buffer.prototype.readFloatBE = function readFloatBE(e, r) {
            e = e >>> 0;
            if (!r) checkOffset(e, 4, this.length);
            return n.read(this, e, false, 23, 4);
          };
          Buffer.prototype.readDoubleLE = function readDoubleLE(e, r) {
            e = e >>> 0;
            if (!r) checkOffset(e, 8, this.length);
            return n.read(this, e, true, 52, 8);
          };
          Buffer.prototype.readDoubleBE = function readDoubleBE(e, r) {
            e = e >>> 0;
            if (!r) checkOffset(e, 8, this.length);
            return n.read(this, e, false, 52, 8);
          };
          function checkInt(e, r, t, f, n, i) {
            if (!Buffer.isBuffer(e))
              throw new TypeError('"buffer" argument must be a Buffer instance');
            if (r > n || r < i) throw new RangeError('"value" argument is out of bounds');
            if (t + f > e.length) throw new RangeError('Index out of range');
          }
          Buffer.prototype.writeUIntLE = function writeUIntLE(e, r, t, f) {
            e = +e;
            r = r >>> 0;
            t = t >>> 0;
            if (!f) {
              var n = Math.pow(2, 8 * t) - 1;
              checkInt(this, e, r, t, n, 0);
            }
            var i = 1;
            var o = 0;
            this[r] = e & 255;
            while (++o < t && (i *= 256)) {
              this[r + o] = (e / i) & 255;
            }
            return r + t;
          };
          Buffer.prototype.writeUIntBE = function writeUIntBE(e, r, t, f) {
            e = +e;
            r = r >>> 0;
            t = t >>> 0;
            if (!f) {
              var n = Math.pow(2, 8 * t) - 1;
              checkInt(this, e, r, t, n, 0);
            }
            var i = t - 1;
            var o = 1;
            this[r + i] = e & 255;
            while (--i >= 0 && (o *= 256)) {
              this[r + i] = (e / o) & 255;
            }
            return r + t;
          };
          Buffer.prototype.writeUInt8 = function writeUInt8(e, r, t) {
            e = +e;
            r = r >>> 0;
            if (!t) checkInt(this, e, r, 1, 255, 0);
            this[r] = e & 255;
            return r + 1;
          };
          Buffer.prototype.writeUInt16LE = function writeUInt16LE(e, r, t) {
            e = +e;
            r = r >>> 0;
            if (!t) checkInt(this, e, r, 2, 65535, 0);
            this[r] = e & 255;
            this[r + 1] = e >>> 8;
            return r + 2;
          };
          Buffer.prototype.writeUInt16BE = function writeUInt16BE(e, r, t) {
            e = +e;
            r = r >>> 0;
            if (!t) checkInt(this, e, r, 2, 65535, 0);
            this[r] = e >>> 8;
            this[r + 1] = e & 255;
            return r + 2;
          };
          Buffer.prototype.writeUInt32LE = function writeUInt32LE(e, r, t) {
            e = +e;
            r = r >>> 0;
            if (!t) checkInt(this, e, r, 4, 4294967295, 0);
            this[r + 3] = e >>> 24;
            this[r + 2] = e >>> 16;
            this[r + 1] = e >>> 8;
            this[r] = e & 255;
            return r + 4;
          };
          Buffer.prototype.writeUInt32BE = function writeUInt32BE(e, r, t) {
            e = +e;
            r = r >>> 0;
            if (!t) checkInt(this, e, r, 4, 4294967295, 0);
            this[r] = e >>> 24;
            this[r + 1] = e >>> 16;
            this[r + 2] = e >>> 8;
            this[r + 3] = e & 255;
            return r + 4;
          };
          Buffer.prototype.writeIntLE = function writeIntLE(e, r, t, f) {
            e = +e;
            r = r >>> 0;
            if (!f) {
              var n = Math.pow(2, 8 * t - 1);
              checkInt(this, e, r, t, n - 1, -n);
            }
            var i = 0;
            var o = 1;
            var u = 0;
            this[r] = e & 255;
            while (++i < t && (o *= 256)) {
              if (e < 0 && u === 0 && this[r + i - 1] !== 0) {
                u = 1;
              }
              this[r + i] = (((e / o) >> 0) - u) & 255;
            }
            return r + t;
          };
          Buffer.prototype.writeIntBE = function writeIntBE(e, r, t, f) {
            e = +e;
            r = r >>> 0;
            if (!f) {
              var n = Math.pow(2, 8 * t - 1);
              checkInt(this, e, r, t, n - 1, -n);
            }
            var i = t - 1;
            var o = 1;
            var u = 0;
            this[r + i] = e & 255;
            while (--i >= 0 && (o *= 256)) {
              if (e < 0 && u === 0 && this[r + i + 1] !== 0) {
                u = 1;
              }
              this[r + i] = (((e / o) >> 0) - u) & 255;
            }
            return r + t;
          };
          Buffer.prototype.writeInt8 = function writeInt8(e, r, t) {
            e = +e;
            r = r >>> 0;
            if (!t) checkInt(this, e, r, 1, 127, -128);
            if (e < 0) e = 255 + e + 1;
            this[r] = e & 255;
            return r + 1;
          };
          Buffer.prototype.writeInt16LE = function writeInt16LE(e, r, t) {
            e = +e;
            r = r >>> 0;
            if (!t) checkInt(this, e, r, 2, 32767, -32768);
            this[r] = e & 255;
            this[r + 1] = e >>> 8;
            return r + 2;
          };
          Buffer.prototype.writeInt16BE = function writeInt16BE(e, r, t) {
            e = +e;
            r = r >>> 0;
            if (!t) checkInt(this, e, r, 2, 32767, -32768);
            this[r] = e >>> 8;
            this[r + 1] = e & 255;
            return r + 2;
          };
          Buffer.prototype.writeInt32LE = function writeInt32LE(e, r, t) {
            e = +e;
            r = r >>> 0;
            if (!t) checkInt(this, e, r, 4, 2147483647, -2147483648);
            this[r] = e & 255;
            this[r + 1] = e >>> 8;
            this[r + 2] = e >>> 16;
            this[r + 3] = e >>> 24;
            return r + 4;
          };
          Buffer.prototype.writeInt32BE = function writeInt32BE(e, r, t) {
            e = +e;
            r = r >>> 0;
            if (!t) checkInt(this, e, r, 4, 2147483647, -2147483648);
            if (e < 0) e = 4294967295 + e + 1;
            this[r] = e >>> 24;
            this[r + 1] = e >>> 16;
            this[r + 2] = e >>> 8;
            this[r + 3] = e & 255;
            return r + 4;
          };
          function checkIEEE754(e, r, t, f, n, i) {
            if (t + f > e.length) throw new RangeError('Index out of range');
            if (t < 0) throw new RangeError('Index out of range');
          }
          function writeFloat(e, r, t, f, i) {
            r = +r;
            t = t >>> 0;
            if (!i) {
              checkIEEE754(e, r, t, 4, 34028234663852886e22, -34028234663852886e22);
            }
            n.write(e, r, t, f, 23, 4);
            return t + 4;
          }
          Buffer.prototype.writeFloatLE = function writeFloatLE(e, r, t) {
            return writeFloat(this, e, r, true, t);
          };
          Buffer.prototype.writeFloatBE = function writeFloatBE(e, r, t) {
            return writeFloat(this, e, r, false, t);
          };
          function writeDouble(e, r, t, f, i) {
            r = +r;
            t = t >>> 0;
            if (!i) {
              checkIEEE754(e, r, t, 8, 17976931348623157e292, -17976931348623157e292);
            }
            n.write(e, r, t, f, 52, 8);
            return t + 8;
          }
          Buffer.prototype.writeDoubleLE = function writeDoubleLE(e, r, t) {
            return writeDouble(this, e, r, true, t);
          };
          Buffer.prototype.writeDoubleBE = function writeDoubleBE(e, r, t) {
            return writeDouble(this, e, r, false, t);
          };
          Buffer.prototype.copy = function copy(e, r, t, f) {
            if (!Buffer.isBuffer(e)) throw new TypeError('argument should be a Buffer');
            if (!t) t = 0;
            if (!f && f !== 0) f = this.length;
            if (r >= e.length) r = e.length;
            if (!r) r = 0;
            if (f > 0 && f < t) f = t;
            if (f === t) return 0;
            if (e.length === 0 || this.length === 0) return 0;
            if (r < 0) {
              throw new RangeError('targetStart out of bounds');
            }
            if (t < 0 || t >= this.length) throw new RangeError('Index out of range');
            if (f < 0) throw new RangeError('sourceEnd out of bounds');
            if (f > this.length) f = this.length;
            if (e.length - r < f - t) {
              f = e.length - r + t;
            }
            var n = f - t;
            if (this === e && typeof Uint8Array.prototype.copyWithin === 'function') {
              this.copyWithin(r, t, f);
            } else if (this === e && t < r && r < f) {
              for (var i = n - 1; i >= 0; --i) {
                e[i + r] = this[i + t];
              }
            } else {
              Uint8Array.prototype.set.call(e, this.subarray(t, f), r);
            }
            return n;
          };
          Buffer.prototype.fill = function fill(e, r, t, f) {
            if (typeof e === 'string') {
              if (typeof r === 'string') {
                f = r;
                r = 0;
                t = this.length;
              } else if (typeof t === 'string') {
                f = t;
                t = this.length;
              }
              if (f !== undefined && typeof f !== 'string') {
                throw new TypeError('encoding must be a string');
              }
              if (typeof f === 'string' && !Buffer.isEncoding(f)) {
                throw new TypeError('Unknown encoding: ' + f);
              }
              if (e.length === 1) {
                var n = e.charCodeAt(0);
                if ((f === 'utf8' && n < 128) || f === 'latin1') {
                  e = n;
                }
              }
            } else if (typeof e === 'number') {
              e = e & 255;
            } else if (typeof e === 'boolean') {
              e = Number(e);
            }
            if (r < 0 || this.length < r || this.length < t) {
              throw new RangeError('Out of range index');
            }
            if (t <= r) {
              return this;
            }
            r = r >>> 0;
            t = t === undefined ? this.length : t >>> 0;
            if (!e) e = 0;
            var i;
            if (typeof e === 'number') {
              for (i = r; i < t; ++i) {
                this[i] = e;
              }
            } else {
              var o = Buffer.isBuffer(e) ? e : Buffer.from(e, f);
              var u = o.length;
              if (u === 0) {
                throw new TypeError('The value "' + e + '" is invalid for argument "value"');
              }
              for (i = 0; i < t - r; ++i) {
                this[i + r] = o[i % u];
              }
            }
            return this;
          };
          var a = /[^+/0-9A-Za-z-_]/g;
          function base64clean(e) {
            e = e.split('=')[0];
            e = e.trim().replace(a, '');
            if (e.length < 2) return '';
            while (e.length % 4 !== 0) {
              e = e + '=';
            }
            return e;
          }
          function utf8ToBytes(e, r) {
            r = r || Infinity;
            var t;
            var f = e.length;
            var n = null;
            var i = [];
            for (var o = 0; o < f; ++o) {
              t = e.charCodeAt(o);
              if (t > 55295 && t < 57344) {
                if (!n) {
                  if (t > 56319) {
                    if ((r -= 3) > -1) i.push(239, 191, 189);
                    continue;
                  } else if (o + 1 === f) {
                    if ((r -= 3) > -1) i.push(239, 191, 189);
                    continue;
                  }
                  n = t;
                  continue;
                }
                if (t < 56320) {
                  if ((r -= 3) > -1) i.push(239, 191, 189);
                  n = t;
                  continue;
                }
                t = (((n - 55296) << 10) | (t - 56320)) + 65536;
              } else if (n) {
                if ((r -= 3) > -1) i.push(239, 191, 189);
              }
              n = null;
              if (t < 128) {
                if ((r -= 1) < 0) break;
                i.push(t);
              } else if (t < 2048) {
                if ((r -= 2) < 0) break;
                i.push((t >> 6) | 192, (t & 63) | 128);
              } else if (t < 65536) {
                if ((r -= 3) < 0) break;
                i.push((t >> 12) | 224, ((t >> 6) & 63) | 128, (t & 63) | 128);
              } else if (t < 1114112) {
                if ((r -= 4) < 0) break;
                i.push(
                  (t >> 18) | 240,
                  ((t >> 12) & 63) | 128,
                  ((t >> 6) & 63) | 128,
                  (t & 63) | 128
                );
              } else {
                throw new Error('Invalid code point');
              }
            }
            return i;
          }
          function asciiToBytes(e) {
            var r = [];
            for (var t = 0; t < e.length; ++t) {
              r.push(e.charCodeAt(t) & 255);
            }
            return r;
          }
          function utf16leToBytes(e, r) {
            var t, f, n;
            var i = [];
            for (var o = 0; o < e.length; ++o) {
              if ((r -= 2) < 0) break;
              t = e.charCodeAt(o);
              f = t >> 8;
              n = t % 256;
              i.push(n);
              i.push(f);
            }
            return i;
          }
          function base64ToBytes(e) {
            return f.toByteArray(base64clean(e));
          }
          function blitBuffer(e, r, t, f) {
            for (var n = 0; n < f; ++n) {
              if (n + t >= r.length || n >= e.length) break;
              r[n + t] = e[n];
            }
            return n;
          }
          function isInstance(e, r) {
            return (
              e instanceof r ||
              (e != null &&
                e.constructor != null &&
                e.constructor.name != null &&
                e.constructor.name === r.name)
            );
          }
          function numberIsNaN(e) {
            return e !== e;
          }
          var s = (function () {
            var e = '0123456789abcdef';
            var r = new Array(256);
            for (var t = 0; t < 16; ++t) {
              var f = t * 16;
              for (var n = 0; n < 16; ++n) {
                r[f + n] = e[t] + e[n];
              }
            }
            return r;
          })();
        },
        783: function (e, r) {
          /*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */ r.read =
            function (e, r, t, f, n) {
              var i, o;
              var u = n * 8 - f - 1;
              var a = (1 << u) - 1;
              var s = a >> 1;
              var h = -7;
              var c = t ? n - 1 : 0;
              var l = t ? -1 : 1;
              var p = e[r + c];
              c += l;
              i = p & ((1 << -h) - 1);
              p >>= -h;
              h += u;
              for (; h > 0; i = i * 256 + e[r + c], c += l, h -= 8) {}
              o = i & ((1 << -h) - 1);
              i >>= -h;
              h += f;
              for (; h > 0; o = o * 256 + e[r + c], c += l, h -= 8) {}
              if (i === 0) {
                i = 1 - s;
              } else if (i === a) {
                return o ? NaN : (p ? -1 : 1) * Infinity;
              } else {
                o = o + Math.pow(2, f);
                i = i - s;
              }
              return (p ? -1 : 1) * o * Math.pow(2, i - f);
            };
          r.write = function (e, r, t, f, n, i) {
            var o, u, a;
            var s = i * 8 - n - 1;
            var h = (1 << s) - 1;
            var c = h >> 1;
            var l = n === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
            var p = f ? 0 : i - 1;
            var y = f ? 1 : -1;
            var g = r < 0 || (r === 0 && 1 / r < 0) ? 1 : 0;
            r = Math.abs(r);
            if (isNaN(r) || r === Infinity) {
              u = isNaN(r) ? 1 : 0;
              o = h;
            } else {
              o = Math.floor(Math.log(r) / Math.LN2);
              if (r * (a = Math.pow(2, -o)) < 1) {
                o--;
                a *= 2;
              }
              if (o + c >= 1) {
                r += l / a;
              } else {
                r += l * Math.pow(2, 1 - c);
              }
              if (r * a >= 2) {
                o++;
                a /= 2;
              }
              if (o + c >= h) {
                u = 0;
                o = h;
              } else if (o + c >= 1) {
                u = (r * a - 1) * Math.pow(2, n);
                o = o + c;
              } else {
                u = r * Math.pow(2, c - 1) * Math.pow(2, n);
                o = 0;
              }
            }
            for (; n >= 8; e[t + p] = u & 255, p += y, u /= 256, n -= 8) {}
            o = (o << n) | u;
            s += n;
            for (; s > 0; e[t + p] = o & 255, p += y, o /= 256, s -= 8) {}
            e[t + p - y] |= g * 128;
          };
        },
      };
      var r = {};
      function __nccwpck_require__(t) {
        var f = r[t];
        if (f !== undefined) {
          return f.exports;
        }
        var n = (r[t] = {
          exports: {},
        });
        var i = true;
        try {
          e[t](n, n.exports, __nccwpck_require__);
          i = false;
        } finally {
          if (i) delete r[t];
        }
        return n.exports;
      }
      if (typeof __nccwpck_require__ !== 'undefined')
        __nccwpck_require__.ab =
          ('TURBOPACK compile-time value', '/ROOT/node_modules/next/dist/compiled/buffer') + '/';
      var t = __nccwpck_require__(72);
      module.exports = t;
    })();
  },
  '[project]/node_modules/@tanstack/query-core/build/modern/utils.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'addToEnd',
      () => addToEnd,
      'addToStart',
      () => addToStart,
      'ensureQueryFn',
      () => ensureQueryFn,
      'functionalUpdate',
      () => functionalUpdate,
      'hashKey',
      () => hashKey,
      'hashQueryKeyByOptions',
      () => hashQueryKeyByOptions,
      'isPlainArray',
      () => isPlainArray,
      'isPlainObject',
      () => isPlainObject,
      'isServer',
      () => isServer,
      'isValidTimeout',
      () => isValidTimeout,
      'keepPreviousData',
      () => keepPreviousData,
      'matchMutation',
      () => matchMutation,
      'matchQuery',
      () => matchQuery,
      'noop',
      () => noop,
      'partialMatchKey',
      () => partialMatchKey,
      'replaceData',
      () => replaceData,
      'replaceEqualDeep',
      () => replaceEqualDeep,
      'resolveEnabled',
      () => resolveEnabled,
      'resolveStaleTime',
      () => resolveStaleTime,
      'shallowEqualObjects',
      () => shallowEqualObjects,
      'skipToken',
      () => skipToken,
      'sleep',
      () => sleep,
      'timeUntilStale',
      () => timeUntilStale,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      /*#__PURE__*/ __turbopack_context__.i(
        '[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)'
      );
    // src/utils.ts
    var isServer = typeof window === 'undefined' || 'Deno' in globalThis;
    function noop() {}
    function functionalUpdate(updater, input) {
      return typeof updater === 'function' ? updater(input) : updater;
    }
    function isValidTimeout(value) {
      return typeof value === 'number' && value >= 0 && value !== Infinity;
    }
    function timeUntilStale(updatedAt, staleTime) {
      return Math.max(updatedAt + (staleTime || 0) - Date.now(), 0);
    }
    function resolveStaleTime(staleTime, query) {
      return typeof staleTime === 'function' ? staleTime(query) : staleTime;
    }
    function resolveEnabled(enabled, query) {
      return typeof enabled === 'function' ? enabled(query) : enabled;
    }
    function matchQuery(filters, query) {
      const { type = 'all', exact, fetchStatus, predicate, queryKey, stale } = filters;
      if (queryKey) {
        if (exact) {
          if (query.queryHash !== hashQueryKeyByOptions(queryKey, query.options)) {
            return false;
          }
        } else if (!partialMatchKey(query.queryKey, queryKey)) {
          return false;
        }
      }
      if (type !== 'all') {
        const isActive = query.isActive();
        if (type === 'active' && !isActive) {
          return false;
        }
        if (type === 'inactive' && isActive) {
          return false;
        }
      }
      if (typeof stale === 'boolean' && query.isStale() !== stale) {
        return false;
      }
      if (fetchStatus && fetchStatus !== query.state.fetchStatus) {
        return false;
      }
      if (predicate && !predicate(query)) {
        return false;
      }
      return true;
    }
    function matchMutation(filters, mutation) {
      const { exact, status, predicate, mutationKey } = filters;
      if (mutationKey) {
        if (!mutation.options.mutationKey) {
          return false;
        }
        if (exact) {
          if (hashKey(mutation.options.mutationKey) !== hashKey(mutationKey)) {
            return false;
          }
        } else if (!partialMatchKey(mutation.options.mutationKey, mutationKey)) {
          return false;
        }
      }
      if (status && mutation.state.status !== status) {
        return false;
      }
      if (predicate && !predicate(mutation)) {
        return false;
      }
      return true;
    }
    function hashQueryKeyByOptions(queryKey, options) {
      const hashFn = options?.queryKeyHashFn || hashKey;
      return hashFn(queryKey);
    }
    function hashKey(queryKey) {
      return JSON.stringify(queryKey, (_, val) =>
        isPlainObject(val)
          ? Object.keys(val)
              .sort()
              .reduce((result, key) => {
                result[key] = val[key];
                return result;
              }, {})
          : val
      );
    }
    function partialMatchKey(a, b) {
      if (a === b) {
        return true;
      }
      if (typeof a !== typeof b) {
        return false;
      }
      if (a && b && typeof a === 'object' && typeof b === 'object') {
        return !Object.keys(b).some((key) => !partialMatchKey(a[key], b[key]));
      }
      return false;
    }
    function replaceEqualDeep(a, b) {
      if (a === b) {
        return a;
      }
      const array = isPlainArray(a) && isPlainArray(b);
      if (array || (isPlainObject(a) && isPlainObject(b))) {
        const aItems = array ? a : Object.keys(a);
        const aSize = aItems.length;
        const bItems = array ? b : Object.keys(b);
        const bSize = bItems.length;
        const copy = array ? [] : {};
        let equalItems = 0;
        for (let i = 0; i < bSize; i++) {
          const key = array ? i : bItems[i];
          if (
            ((!array && aItems.includes(key)) || array) &&
            a[key] === void 0 &&
            b[key] === void 0
          ) {
            copy[key] = void 0;
            equalItems++;
          } else {
            copy[key] = replaceEqualDeep(a[key], b[key]);
            if (copy[key] === a[key] && a[key] !== void 0) {
              equalItems++;
            }
          }
        }
        return aSize === bSize && equalItems === aSize ? a : copy;
      }
      return b;
    }
    function shallowEqualObjects(a, b) {
      if (!b || Object.keys(a).length !== Object.keys(b).length) {
        return false;
      }
      for (const key in a) {
        if (a[key] !== b[key]) {
          return false;
        }
      }
      return true;
    }
    function isPlainArray(value) {
      return Array.isArray(value) && value.length === Object.keys(value).length;
    }
    function isPlainObject(o) {
      if (!hasObjectPrototype(o)) {
        return false;
      }
      const ctor = o.constructor;
      if (ctor === void 0) {
        return true;
      }
      const prot = ctor.prototype;
      if (!hasObjectPrototype(prot)) {
        return false;
      }
      if (!prot.hasOwnProperty('isPrototypeOf')) {
        return false;
      }
      if (Object.getPrototypeOf(o) !== Object.prototype) {
        return false;
      }
      return true;
    }
    function hasObjectPrototype(o) {
      return Object.prototype.toString.call(o) === '[object Object]';
    }
    function sleep(timeout) {
      return new Promise((resolve) => {
        setTimeout(resolve, timeout);
      });
    }
    function replaceData(prevData, data, options) {
      if (typeof options.structuralSharing === 'function') {
        return options.structuralSharing(prevData, data);
      } else if (options.structuralSharing !== false) {
        if (('TURBOPACK compile-time truthy', 1)) {
          try {
            return replaceEqualDeep(prevData, data);
          } catch (error) {
            console.error(
              `Structural sharing requires data to be JSON serializable. To fix this, turn off structuralSharing or return JSON-serializable data from your queryFn. [${options.queryHash}]: ${error}`
            );
          }
        }
        return replaceEqualDeep(prevData, data);
      }
      return data;
    }
    function keepPreviousData(previousData) {
      return previousData;
    }
    function addToEnd(items, item, max = 0) {
      const newItems = [...items, item];
      return max && newItems.length > max ? newItems.slice(1) : newItems;
    }
    function addToStart(items, item, max = 0) {
      const newItems = [item, ...items];
      return max && newItems.length > max ? newItems.slice(0, -1) : newItems;
    }
    var skipToken = Symbol();
    function ensureQueryFn(options, fetchOptions) {
      if (('TURBOPACK compile-time truthy', 1)) {
        if (options.queryFn === skipToken) {
          console.error(
            `Attempted to invoke queryFn when set to skipToken. This is likely a configuration error. Query hash: '${options.queryHash}'`
          );
        }
      }
      if (!options.queryFn && fetchOptions?.initialPromise) {
        return () => fetchOptions.initialPromise;
      }
      if (!options.queryFn || options.queryFn === skipToken) {
        return () => Promise.reject(new Error(`Missing queryFn: '${options.queryHash}'`));
      }
      return options.queryFn;
    }
    //# sourceMappingURL=utils.js.map
  },
  '[project]/node_modules/@tanstack/query-core/build/modern/notifyManager.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'createNotifyManager',
      () => createNotifyManager,
      'notifyManager',
      () => notifyManager,
    ]);
    // src/notifyManager.ts
    function createNotifyManager() {
      let queue = [];
      let transactions = 0;
      let notifyFn = (callback) => {
        callback();
      };
      let batchNotifyFn = (callback) => {
        callback();
      };
      let scheduleFn = (cb) => setTimeout(cb, 0);
      const schedule = (callback) => {
        if (transactions) {
          queue.push(callback);
        } else {
          scheduleFn(() => {
            notifyFn(callback);
          });
        }
      };
      const flush = () => {
        const originalQueue = queue;
        queue = [];
        if (originalQueue.length) {
          scheduleFn(() => {
            batchNotifyFn(() => {
              originalQueue.forEach((callback) => {
                notifyFn(callback);
              });
            });
          });
        }
      };
      return {
        batch: (callback) => {
          let result;
          transactions++;
          try {
            result = callback();
          } finally {
            transactions--;
            if (!transactions) {
              flush();
            }
          }
          return result;
        },
        /**
         * All calls to the wrapped function will be batched.
         */ batchCalls: (callback) => {
          return (...args) => {
            schedule(() => {
              callback(...args);
            });
          };
        },
        schedule,
        /**
         * Use this method to set a custom notify function.
         * This can be used to for example wrap notifications with `React.act` while running tests.
         */ setNotifyFunction: (fn) => {
          notifyFn = fn;
        },
        /**
         * Use this method to set a custom function to batch notifications together into a single tick.
         * By default React Query will use the batch function provided by ReactDOM or React Native.
         */ setBatchNotifyFunction: (fn) => {
          batchNotifyFn = fn;
        },
        setScheduler: (fn) => {
          scheduleFn = fn;
        },
      };
    }
    var notifyManager = createNotifyManager();
    //# sourceMappingURL=notifyManager.js.map
  },
  '[project]/node_modules/@tanstack/query-core/build/modern/subscribable.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['Subscribable', () => Subscribable]);
    // src/subscribable.ts
    var Subscribable = class {
      constructor() {
        this.listeners = /* @__PURE__ */ new Set();
        this.subscribe = this.subscribe.bind(this);
      }
      subscribe(listener) {
        this.listeners.add(listener);
        this.onSubscribe();
        return () => {
          this.listeners.delete(listener);
          this.onUnsubscribe();
        };
      }
      hasListeners() {
        return this.listeners.size > 0;
      }
      onSubscribe() {}
      onUnsubscribe() {}
    };
    //# sourceMappingURL=subscribable.js.map
  },
  '[project]/node_modules/@tanstack/query-core/build/modern/focusManager.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'FocusManager',
      () => FocusManager,
      'focusManager',
      () => focusManager,
    ]);
    // src/focusManager.ts
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$subscribable$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@tanstack/query-core/build/modern/subscribable.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@tanstack/query-core/build/modern/utils.js [app-client] (ecmascript)'
      );
    var FocusManager = class extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$subscribable$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
      'Subscribable'
    ] {
      #focused;
      #cleanup;
      #setup;
      constructor() {
        super();
        this.#setup = (onFocus) => {
          if (
            !__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'isServer'
            ] &&
            window.addEventListener
          ) {
            const listener = () => onFocus();
            window.addEventListener('visibilitychange', listener, false);
            return () => {
              window.removeEventListener('visibilitychange', listener);
            };
          }
          return;
        };
      }
      onSubscribe() {
        if (!this.#cleanup) {
          this.setEventListener(this.#setup);
        }
      }
      onUnsubscribe() {
        if (!this.hasListeners()) {
          this.#cleanup?.();
          this.#cleanup = void 0;
        }
      }
      setEventListener(setup) {
        this.#setup = setup;
        this.#cleanup?.();
        this.#cleanup = setup((focused) => {
          if (typeof focused === 'boolean') {
            this.setFocused(focused);
          } else {
            this.onFocus();
          }
        });
      }
      setFocused(focused) {
        const changed = this.#focused !== focused;
        if (changed) {
          this.#focused = focused;
          this.onFocus();
        }
      }
      onFocus() {
        const isFocused = this.isFocused();
        this.listeners.forEach((listener) => {
          listener(isFocused);
        });
      }
      isFocused() {
        if (typeof this.#focused === 'boolean') {
          return this.#focused;
        }
        return globalThis.document?.visibilityState !== 'hidden';
      }
    };
    var focusManager = new FocusManager();
    //# sourceMappingURL=focusManager.js.map
  },
  '[project]/node_modules/@tanstack/query-core/build/modern/onlineManager.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'OnlineManager',
      () => OnlineManager,
      'onlineManager',
      () => onlineManager,
    ]);
    // src/onlineManager.ts
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$subscribable$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@tanstack/query-core/build/modern/subscribable.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@tanstack/query-core/build/modern/utils.js [app-client] (ecmascript)'
      );
    var OnlineManager = class extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$subscribable$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
      'Subscribable'
    ] {
      #online = true;
      #cleanup;
      #setup;
      constructor() {
        super();
        this.#setup = (onOnline) => {
          if (
            !__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'isServer'
            ] &&
            window.addEventListener
          ) {
            const onlineListener = () => onOnline(true);
            const offlineListener = () => onOnline(false);
            window.addEventListener('online', onlineListener, false);
            window.addEventListener('offline', offlineListener, false);
            return () => {
              window.removeEventListener('online', onlineListener);
              window.removeEventListener('offline', offlineListener);
            };
          }
          return;
        };
      }
      onSubscribe() {
        if (!this.#cleanup) {
          this.setEventListener(this.#setup);
        }
      }
      onUnsubscribe() {
        if (!this.hasListeners()) {
          this.#cleanup?.();
          this.#cleanup = void 0;
        }
      }
      setEventListener(setup) {
        this.#setup = setup;
        this.#cleanup?.();
        this.#cleanup = setup(this.setOnline.bind(this));
      }
      setOnline(online) {
        const changed = this.#online !== online;
        if (changed) {
          this.#online = online;
          this.listeners.forEach((listener) => {
            listener(online);
          });
        }
      }
      isOnline() {
        return this.#online;
      }
    };
    var onlineManager = new OnlineManager();
    //# sourceMappingURL=onlineManager.js.map
  },
  '[project]/node_modules/@tanstack/query-core/build/modern/thenable.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['pendingThenable', () => pendingThenable]);
    // src/thenable.ts
    function pendingThenable() {
      let resolve;
      let reject;
      const thenable = new Promise((_resolve, _reject) => {
        resolve = _resolve;
        reject = _reject;
      });
      thenable.status = 'pending';
      thenable.catch(() => {});
      function finalize(data) {
        Object.assign(thenable, data);
        delete thenable.resolve;
        delete thenable.reject;
      }
      thenable.resolve = (value) => {
        finalize({
          status: 'fulfilled',
          value,
        });
        resolve(value);
      };
      thenable.reject = (reason) => {
        finalize({
          status: 'rejected',
          reason,
        });
        reject(reason);
      };
      return thenable;
    }
    //# sourceMappingURL=thenable.js.map
  },
  '[project]/node_modules/@tanstack/query-core/build/modern/retryer.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'CancelledError',
      () => CancelledError,
      'canFetch',
      () => canFetch,
      'createRetryer',
      () => createRetryer,
      'isCancelledError',
      () => isCancelledError,
    ]);
    // src/retryer.ts
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$focusManager$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@tanstack/query-core/build/modern/focusManager.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$onlineManager$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@tanstack/query-core/build/modern/onlineManager.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$thenable$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@tanstack/query-core/build/modern/thenable.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@tanstack/query-core/build/modern/utils.js [app-client] (ecmascript)'
      );
    function defaultRetryDelay(failureCount) {
      return Math.min(1e3 * 2 ** failureCount, 3e4);
    }
    function canFetch(networkMode) {
      return (networkMode ?? 'online') === 'online'
        ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$onlineManager$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'onlineManager'
          ].isOnline()
        : true;
    }
    var CancelledError = class extends Error {
      constructor(options) {
        super('CancelledError');
        this.revert = options?.revert;
        this.silent = options?.silent;
      }
    };
    function isCancelledError(value) {
      return value instanceof CancelledError;
    }
    function createRetryer(config) {
      let isRetryCancelled = false;
      let failureCount = 0;
      let isResolved = false;
      let continueFn;
      const thenable = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$thenable$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'pendingThenable'
      ])();
      const cancel = (cancelOptions) => {
        if (!isResolved) {
          reject(new CancelledError(cancelOptions));
          config.abort?.();
        }
      };
      const cancelRetry = () => {
        isRetryCancelled = true;
      };
      const continueRetry = () => {
        isRetryCancelled = false;
      };
      const canContinue = () =>
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$focusManager$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'focusManager'
        ].isFocused() &&
        (config.networkMode === 'always' ||
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$onlineManager$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'onlineManager'
          ].isOnline()) &&
        config.canRun();
      const canStart = () => canFetch(config.networkMode) && config.canRun();
      const resolve = (value) => {
        if (!isResolved) {
          isResolved = true;
          config.onSuccess?.(value);
          continueFn?.();
          thenable.resolve(value);
        }
      };
      const reject = (value) => {
        if (!isResolved) {
          isResolved = true;
          config.onError?.(value);
          continueFn?.();
          thenable.reject(value);
        }
      };
      const pause = () => {
        return new Promise((continueResolve) => {
          continueFn = (value) => {
            if (isResolved || canContinue()) {
              continueResolve(value);
            }
          };
          config.onPause?.();
        }).then(() => {
          continueFn = void 0;
          if (!isResolved) {
            config.onContinue?.();
          }
        });
      };
      const run = () => {
        if (isResolved) {
          return;
        }
        let promiseOrValue;
        const initialPromise = failureCount === 0 ? config.initialPromise : void 0;
        try {
          promiseOrValue = initialPromise ?? config.fn();
        } catch (error) {
          promiseOrValue = Promise.reject(error);
        }
        Promise.resolve(promiseOrValue)
          .then(resolve)
          .catch((error) => {
            if (isResolved) {
              return;
            }
            const retry =
              config.retry ??
              (__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'isServer'
              ]
                ? 0
                : 3);
            const retryDelay = config.retryDelay ?? defaultRetryDelay;
            const delay =
              typeof retryDelay === 'function' ? retryDelay(failureCount, error) : retryDelay;
            const shouldRetry =
              retry === true ||
              (typeof retry === 'number' && failureCount < retry) ||
              (typeof retry === 'function' && retry(failureCount, error));
            if (isRetryCancelled || !shouldRetry) {
              reject(error);
              return;
            }
            failureCount++;
            config.onFail?.(failureCount, error);
            (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'sleep'
            ])(delay)
              .then(() => {
                return canContinue() ? void 0 : pause();
              })
              .then(() => {
                if (isRetryCancelled) {
                  reject(error);
                } else {
                  run();
                }
              });
          });
      };
      return {
        promise: thenable,
        cancel,
        continue: () => {
          continueFn?.();
          return thenable;
        },
        cancelRetry,
        continueRetry,
        canStart,
        start: () => {
          if (canStart()) {
            run();
          } else {
            pause().then(run);
          }
          return thenable;
        },
      };
    }
    //# sourceMappingURL=retryer.js.map
  },
  '[project]/node_modules/@tanstack/query-core/build/modern/removable.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['Removable', () => Removable]);
    // src/removable.ts
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@tanstack/query-core/build/modern/utils.js [app-client] (ecmascript)'
      );
    var Removable = class {
      #gcTimeout;
      destroy() {
        this.clearGcTimeout();
      }
      scheduleGc() {
        this.clearGcTimeout();
        if (
          (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'isValidTimeout'
          ])(this.gcTime)
        ) {
          this.#gcTimeout = setTimeout(() => {
            this.optionalRemove();
          }, this.gcTime);
        }
      }
      updateGcTime(newGcTime) {
        this.gcTime = Math.max(
          this.gcTime || 0,
          newGcTime ??
            (__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'isServer'
            ]
              ? Infinity
              : 5 * 60 * 1e3)
        );
      }
      clearGcTimeout() {
        if (this.#gcTimeout) {
          clearTimeout(this.#gcTimeout);
          this.#gcTimeout = void 0;
        }
      }
    };
    //# sourceMappingURL=removable.js.map
  },
  '[project]/node_modules/@tanstack/query-core/build/modern/query.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['Query', () => Query, 'fetchState', () => fetchState]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      /*#__PURE__*/ __turbopack_context__.i(
        '[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)'
      );
    // src/query.ts
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@tanstack/query-core/build/modern/utils.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$notifyManager$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@tanstack/query-core/build/modern/notifyManager.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$retryer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@tanstack/query-core/build/modern/retryer.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$removable$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@tanstack/query-core/build/modern/removable.js [app-client] (ecmascript)'
      );
    var Query = class extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$removable$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
      'Removable'
    ] {
      #initialState;
      #revertState;
      #cache;
      #client;
      #retryer;
      #defaultOptions;
      #abortSignalConsumed;
      constructor(config) {
        super();
        this.#abortSignalConsumed = false;
        this.#defaultOptions = config.defaultOptions;
        this.setOptions(config.options);
        this.observers = [];
        this.#client = config.client;
        this.#cache = this.#client.getQueryCache();
        this.queryKey = config.queryKey;
        this.queryHash = config.queryHash;
        this.#initialState = getDefaultState(this.options);
        this.state = config.state ?? this.#initialState;
        this.scheduleGc();
      }
      get meta() {
        return this.options.meta;
      }
      get promise() {
        return this.#retryer?.promise;
      }
      setOptions(options) {
        this.options = {
          ...this.#defaultOptions,
          ...options,
        };
        this.updateGcTime(this.options.gcTime);
      }
      optionalRemove() {
        if (!this.observers.length && this.state.fetchStatus === 'idle') {
          this.#cache.remove(this);
        }
      }
      setData(newData, options) {
        const data = (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'replaceData'
        ])(this.state.data, newData, this.options);
        this.#dispatch({
          data,
          type: 'success',
          dataUpdatedAt: options?.updatedAt,
          manual: options?.manual,
        });
        return data;
      }
      setState(state, setStateOptions) {
        this.#dispatch({
          type: 'setState',
          state,
          setStateOptions,
        });
      }
      cancel(options) {
        const promise = this.#retryer?.promise;
        this.#retryer?.cancel(options);
        return promise
          ? promise
              .then(
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'noop'
                ]
              )
              .catch(
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'noop'
                ]
              )
          : Promise.resolve();
      }
      destroy() {
        super.destroy();
        this.cancel({
          silent: true,
        });
      }
      reset() {
        this.destroy();
        this.setState(this.#initialState);
      }
      isActive() {
        return this.observers.some(
          (observer) =>
            (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'resolveEnabled'
            ])(observer.options.enabled, this) !== false
        );
      }
      isDisabled() {
        if (this.getObserversCount() > 0) {
          return !this.isActive();
        }
        return (
          this.options.queryFn ===
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'skipToken'
            ] || this.state.dataUpdateCount + this.state.errorUpdateCount === 0
        );
      }
      isStale() {
        if (this.state.isInvalidated) {
          return true;
        }
        if (this.getObserversCount() > 0) {
          return this.observers.some((observer) => observer.getCurrentResult().isStale);
        }
        return this.state.data === void 0;
      }
      isStaleByTime(staleTime = 0) {
        return (
          this.state.isInvalidated ||
          this.state.data === void 0 ||
          !(0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'timeUntilStale'
          ])(this.state.dataUpdatedAt, staleTime)
        );
      }
      onFocus() {
        const observer = this.observers.find((x) => x.shouldFetchOnWindowFocus());
        observer?.refetch({
          cancelRefetch: false,
        });
        this.#retryer?.continue();
      }
      onOnline() {
        const observer = this.observers.find((x) => x.shouldFetchOnReconnect());
        observer?.refetch({
          cancelRefetch: false,
        });
        this.#retryer?.continue();
      }
      addObserver(observer) {
        if (!this.observers.includes(observer)) {
          this.observers.push(observer);
          this.clearGcTimeout();
          this.#cache.notify({
            type: 'observerAdded',
            query: this,
            observer,
          });
        }
      }
      removeObserver(observer) {
        if (this.observers.includes(observer)) {
          this.observers = this.observers.filter((x) => x !== observer);
          if (!this.observers.length) {
            if (this.#retryer) {
              if (this.#abortSignalConsumed) {
                this.#retryer.cancel({
                  revert: true,
                });
              } else {
                this.#retryer.cancelRetry();
              }
            }
            this.scheduleGc();
          }
          this.#cache.notify({
            type: 'observerRemoved',
            query: this,
            observer,
          });
        }
      }
      getObserversCount() {
        return this.observers.length;
      }
      invalidate() {
        if (!this.state.isInvalidated) {
          this.#dispatch({
            type: 'invalidate',
          });
        }
      }
      fetch(options, fetchOptions) {
        if (this.state.fetchStatus !== 'idle') {
          if (this.state.data !== void 0 && fetchOptions?.cancelRefetch) {
            this.cancel({
              silent: true,
            });
          } else if (this.#retryer) {
            this.#retryer.continueRetry();
            return this.#retryer.promise;
          }
        }
        if (options) {
          this.setOptions(options);
        }
        if (!this.options.queryFn) {
          const observer = this.observers.find((x) => x.options.queryFn);
          if (observer) {
            this.setOptions(observer.options);
          }
        }
        if (('TURBOPACK compile-time truthy', 1)) {
          if (!Array.isArray(this.options.queryKey)) {
            console.error(
              `As of v4, queryKey needs to be an Array. If you are using a string like 'repoData', please change it to an Array, e.g. ['repoData']`
            );
          }
        }
        const abortController = new AbortController();
        const addSignalProperty = (object) => {
          Object.defineProperty(object, 'signal', {
            enumerable: true,
            get: () => {
              this.#abortSignalConsumed = true;
              return abortController.signal;
            },
          });
        };
        const fetchFn = () => {
          const queryFn = (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'ensureQueryFn'
          ])(this.options, fetchOptions);
          const queryFnContext = {
            client: this.#client,
            queryKey: this.queryKey,
            meta: this.meta,
          };
          addSignalProperty(queryFnContext);
          this.#abortSignalConsumed = false;
          if (this.options.persister) {
            return this.options.persister(queryFn, queryFnContext, this);
          }
          return queryFn(queryFnContext);
        };
        const context = {
          fetchOptions,
          options: this.options,
          queryKey: this.queryKey,
          client: this.#client,
          state: this.state,
          fetchFn,
        };
        addSignalProperty(context);
        this.options.behavior?.onFetch(context, this);
        this.#revertState = this.state;
        if (
          this.state.fetchStatus === 'idle' ||
          this.state.fetchMeta !== context.fetchOptions?.meta
        ) {
          this.#dispatch({
            type: 'fetch',
            meta: context.fetchOptions?.meta,
          });
        }
        const onError = (error) => {
          if (
            !(
              (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$retryer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'isCancelledError'
              ])(error) && error.silent
            )
          ) {
            this.#dispatch({
              type: 'error',
              error,
            });
          }
          if (
            !(0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$retryer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'isCancelledError'
            ])(error)
          ) {
            this.#cache.config.onError?.(error, this);
            this.#cache.config.onSettled?.(this.state.data, error, this);
          }
          this.scheduleGc();
        };
        this.#retryer = (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$retryer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'createRetryer'
        ])({
          initialPromise: fetchOptions?.initialPromise,
          fn: context.fetchFn,
          abort: abortController.abort.bind(abortController),
          onSuccess: (data) => {
            if (data === void 0) {
              if (('TURBOPACK compile-time truthy', 1)) {
                console.error(
                  `Query data cannot be undefined. Please make sure to return a value other than undefined from your query function. Affected query key: ${this.queryHash}`
                );
              }
              onError(new Error(`${this.queryHash} data is undefined`));
              return;
            }
            try {
              this.setData(data);
            } catch (error) {
              onError(error);
              return;
            }
            this.#cache.config.onSuccess?.(data, this);
            this.#cache.config.onSettled?.(data, this.state.error, this);
            this.scheduleGc();
          },
          onError,
          onFail: (failureCount, error) => {
            this.#dispatch({
              type: 'failed',
              failureCount,
              error,
            });
          },
          onPause: () => {
            this.#dispatch({
              type: 'pause',
            });
          },
          onContinue: () => {
            this.#dispatch({
              type: 'continue',
            });
          },
          retry: context.options.retry,
          retryDelay: context.options.retryDelay,
          networkMode: context.options.networkMode,
          canRun: () => true,
        });
        return this.#retryer.start();
      }
      #dispatch(action) {
        const reducer = (state) => {
          switch (action.type) {
            case 'failed':
              return {
                ...state,
                fetchFailureCount: action.failureCount,
                fetchFailureReason: action.error,
              };
            case 'pause':
              return {
                ...state,
                fetchStatus: 'paused',
              };
            case 'continue':
              return {
                ...state,
                fetchStatus: 'fetching',
              };
            case 'fetch':
              return {
                ...state,
                ...fetchState(state.data, this.options),
                fetchMeta: action.meta ?? null,
              };
            case 'success':
              return {
                ...state,
                data: action.data,
                dataUpdateCount: state.dataUpdateCount + 1,
                dataUpdatedAt: action.dataUpdatedAt ?? Date.now(),
                error: null,
                isInvalidated: false,
                status: 'success',
                ...(!action.manual && {
                  fetchStatus: 'idle',
                  fetchFailureCount: 0,
                  fetchFailureReason: null,
                }),
              };
            case 'error':
              const error = action.error;
              if (
                (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$retryer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'isCancelledError'
                ])(error) &&
                error.revert &&
                this.#revertState
              ) {
                return {
                  ...this.#revertState,
                  fetchStatus: 'idle',
                };
              }
              return {
                ...state,
                error,
                errorUpdateCount: state.errorUpdateCount + 1,
                errorUpdatedAt: Date.now(),
                fetchFailureCount: state.fetchFailureCount + 1,
                fetchFailureReason: error,
                fetchStatus: 'idle',
                status: 'error',
              };
            case 'invalidate':
              return {
                ...state,
                isInvalidated: true,
              };
            case 'setState':
              return {
                ...state,
                ...action.state,
              };
          }
        };
        this.state = reducer(this.state);
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$notifyManager$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'notifyManager'
        ].batch(() => {
          this.observers.forEach((observer) => {
            observer.onQueryUpdate();
          });
          this.#cache.notify({
            query: this,
            type: 'updated',
            action,
          });
        });
      }
    };
    function fetchState(data, options) {
      return {
        fetchFailureCount: 0,
        fetchFailureReason: null,
        fetchStatus: (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$retryer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'canFetch'
        ])(options.networkMode)
          ? 'fetching'
          : 'paused',
        ...(data === void 0 && {
          error: null,
          status: 'pending',
        }),
      };
    }
    function getDefaultState(options) {
      const data =
        typeof options.initialData === 'function' ? options.initialData() : options.initialData;
      const hasData = data !== void 0;
      const initialDataUpdatedAt = hasData
        ? typeof options.initialDataUpdatedAt === 'function'
          ? options.initialDataUpdatedAt()
          : options.initialDataUpdatedAt
        : 0;
      return {
        data,
        dataUpdateCount: 0,
        dataUpdatedAt: hasData ? (initialDataUpdatedAt ?? Date.now()) : 0,
        error: null,
        errorUpdateCount: 0,
        errorUpdatedAt: 0,
        fetchFailureCount: 0,
        fetchFailureReason: null,
        fetchMeta: null,
        isInvalidated: false,
        status: hasData ? 'success' : 'pending',
        fetchStatus: 'idle',
      };
    }
    //# sourceMappingURL=query.js.map
  },
  '[project]/node_modules/@tanstack/query-core/build/modern/queryCache.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['QueryCache', () => QueryCache]);
    // src/queryCache.ts
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@tanstack/query-core/build/modern/utils.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$query$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@tanstack/query-core/build/modern/query.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$notifyManager$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@tanstack/query-core/build/modern/notifyManager.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$subscribable$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@tanstack/query-core/build/modern/subscribable.js [app-client] (ecmascript)'
      );
    var QueryCache = class extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$subscribable$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
      'Subscribable'
    ] {
      constructor(config = {}) {
        super();
        this.config = config;
        this.#queries = /* @__PURE__ */ new Map();
      }
      #queries;
      build(client, options, state) {
        const queryKey = options.queryKey;
        const queryHash =
          options.queryHash ??
          (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'hashQueryKeyByOptions'
          ])(queryKey, options);
        let query = this.get(queryHash);
        if (!query) {
          query =
            new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$query$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'Query'
            ]({
              client,
              queryKey,
              queryHash,
              options: client.defaultQueryOptions(options),
              state,
              defaultOptions: client.getQueryDefaults(queryKey),
            });
          this.add(query);
        }
        return query;
      }
      add(query) {
        if (!this.#queries.has(query.queryHash)) {
          this.#queries.set(query.queryHash, query);
          this.notify({
            type: 'added',
            query,
          });
        }
      }
      remove(query) {
        const queryInMap = this.#queries.get(query.queryHash);
        if (queryInMap) {
          query.destroy();
          if (queryInMap === query) {
            this.#queries.delete(query.queryHash);
          }
          this.notify({
            type: 'removed',
            query,
          });
        }
      }
      clear() {
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$notifyManager$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'notifyManager'
        ].batch(() => {
          this.getAll().forEach((query) => {
            this.remove(query);
          });
        });
      }
      get(queryHash) {
        return this.#queries.get(queryHash);
      }
      getAll() {
        return [...this.#queries.values()];
      }
      find(filters) {
        const defaultedFilters = {
          exact: true,
          ...filters,
        };
        return this.getAll().find((query) =>
          (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'matchQuery'
          ])(defaultedFilters, query)
        );
      }
      findAll(filters = {}) {
        const queries = this.getAll();
        return Object.keys(filters).length > 0
          ? queries.filter((query) =>
              (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'matchQuery'
              ])(filters, query)
            )
          : queries;
      }
      notify(event) {
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$notifyManager$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'notifyManager'
        ].batch(() => {
          this.listeners.forEach((listener) => {
            listener(event);
          });
        });
      }
      onFocus() {
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$notifyManager$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'notifyManager'
        ].batch(() => {
          this.getAll().forEach((query) => {
            query.onFocus();
          });
        });
      }
      onOnline() {
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$notifyManager$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'notifyManager'
        ].batch(() => {
          this.getAll().forEach((query) => {
            query.onOnline();
          });
        });
      }
    };
    //# sourceMappingURL=queryCache.js.map
  },
  '[project]/node_modules/@tanstack/query-core/build/modern/mutation.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['Mutation', () => Mutation, 'getDefaultState', () => getDefaultState]);
    // src/mutation.ts
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$notifyManager$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@tanstack/query-core/build/modern/notifyManager.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$removable$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@tanstack/query-core/build/modern/removable.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$retryer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@tanstack/query-core/build/modern/retryer.js [app-client] (ecmascript)'
      );
    var Mutation = class extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$removable$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
      'Removable'
    ] {
      #observers;
      #mutationCache;
      #retryer;
      constructor(config) {
        super();
        this.mutationId = config.mutationId;
        this.#mutationCache = config.mutationCache;
        this.#observers = [];
        this.state = config.state || getDefaultState();
        this.setOptions(config.options);
        this.scheduleGc();
      }
      setOptions(options) {
        this.options = options;
        this.updateGcTime(this.options.gcTime);
      }
      get meta() {
        return this.options.meta;
      }
      addObserver(observer) {
        if (!this.#observers.includes(observer)) {
          this.#observers.push(observer);
          this.clearGcTimeout();
          this.#mutationCache.notify({
            type: 'observerAdded',
            mutation: this,
            observer,
          });
        }
      }
      removeObserver(observer) {
        this.#observers = this.#observers.filter((x) => x !== observer);
        this.scheduleGc();
        this.#mutationCache.notify({
          type: 'observerRemoved',
          mutation: this,
          observer,
        });
      }
      optionalRemove() {
        if (!this.#observers.length) {
          if (this.state.status === 'pending') {
            this.scheduleGc();
          } else {
            this.#mutationCache.remove(this);
          }
        }
      }
      continue() {
        return (
          this.#retryer?.continue() ?? // continuing a mutation assumes that variables are set, mutation must have been dehydrated before
          this.execute(this.state.variables)
        );
      }
      async execute(variables) {
        this.#retryer = (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$retryer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'createRetryer'
        ])({
          fn: () => {
            if (!this.options.mutationFn) {
              return Promise.reject(new Error('No mutationFn found'));
            }
            return this.options.mutationFn(variables);
          },
          onFail: (failureCount, error) => {
            this.#dispatch({
              type: 'failed',
              failureCount,
              error,
            });
          },
          onPause: () => {
            this.#dispatch({
              type: 'pause',
            });
          },
          onContinue: () => {
            this.#dispatch({
              type: 'continue',
            });
          },
          retry: this.options.retry ?? 0,
          retryDelay: this.options.retryDelay,
          networkMode: this.options.networkMode,
          canRun: () => this.#mutationCache.canRun(this),
        });
        const restored = this.state.status === 'pending';
        const isPaused = !this.#retryer.canStart();
        try {
          if (!restored) {
            this.#dispatch({
              type: 'pending',
              variables,
              isPaused,
            });
            await this.#mutationCache.config.onMutate?.(variables, this);
            const context = await this.options.onMutate?.(variables);
            if (context !== this.state.context) {
              this.#dispatch({
                type: 'pending',
                context,
                variables,
                isPaused,
              });
            }
          }
          const data = await this.#retryer.start();
          await this.#mutationCache.config.onSuccess?.(data, variables, this.state.context, this);
          await this.options.onSuccess?.(data, variables, this.state.context);
          await this.#mutationCache.config.onSettled?.(
            data,
            null,
            this.state.variables,
            this.state.context,
            this
          );
          await this.options.onSettled?.(data, null, variables, this.state.context);
          this.#dispatch({
            type: 'success',
            data,
          });
          return data;
        } catch (error) {
          try {
            await this.#mutationCache.config.onError?.(error, variables, this.state.context, this);
            await this.options.onError?.(error, variables, this.state.context);
            await this.#mutationCache.config.onSettled?.(
              void 0,
              error,
              this.state.variables,
              this.state.context,
              this
            );
            await this.options.onSettled?.(void 0, error, variables, this.state.context);
            throw error;
          } finally {
            this.#dispatch({
              type: 'error',
              error,
            });
          }
        } finally {
          this.#mutationCache.runNext(this);
        }
      }
      #dispatch(action) {
        const reducer = (state) => {
          switch (action.type) {
            case 'failed':
              return {
                ...state,
                failureCount: action.failureCount,
                failureReason: action.error,
              };
            case 'pause':
              return {
                ...state,
                isPaused: true,
              };
            case 'continue':
              return {
                ...state,
                isPaused: false,
              };
            case 'pending':
              return {
                ...state,
                context: action.context,
                data: void 0,
                failureCount: 0,
                failureReason: null,
                error: null,
                isPaused: action.isPaused,
                status: 'pending',
                variables: action.variables,
                submittedAt: Date.now(),
              };
            case 'success':
              return {
                ...state,
                data: action.data,
                failureCount: 0,
                failureReason: null,
                error: null,
                status: 'success',
                isPaused: false,
              };
            case 'error':
              return {
                ...state,
                data: void 0,
                error: action.error,
                failureCount: state.failureCount + 1,
                failureReason: action.error,
                isPaused: false,
                status: 'error',
              };
          }
        };
        this.state = reducer(this.state);
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$notifyManager$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'notifyManager'
        ].batch(() => {
          this.#observers.forEach((observer) => {
            observer.onMutationUpdate(action);
          });
          this.#mutationCache.notify({
            mutation: this,
            type: 'updated',
            action,
          });
        });
      }
    };
    function getDefaultState() {
      return {
        context: void 0,
        data: void 0,
        error: null,
        failureCount: 0,
        failureReason: null,
        isPaused: false,
        status: 'idle',
        variables: void 0,
        submittedAt: 0,
      };
    }
    //# sourceMappingURL=mutation.js.map
  },
  '[project]/node_modules/@tanstack/query-core/build/modern/mutationCache.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['MutationCache', () => MutationCache]);
    // src/mutationCache.ts
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$notifyManager$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@tanstack/query-core/build/modern/notifyManager.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$mutation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@tanstack/query-core/build/modern/mutation.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@tanstack/query-core/build/modern/utils.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$subscribable$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@tanstack/query-core/build/modern/subscribable.js [app-client] (ecmascript)'
      );
    var MutationCache = class extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$subscribable$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
      'Subscribable'
    ] {
      constructor(config = {}) {
        super();
        this.config = config;
        this.#mutations = /* @__PURE__ */ new Set();
        this.#scopes = /* @__PURE__ */ new Map();
        this.#mutationId = 0;
      }
      #mutations;
      #scopes;
      #mutationId;
      build(client, options, state) {
        const mutation =
          new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$mutation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'Mutation'
          ]({
            mutationCache: this,
            mutationId: ++this.#mutationId,
            options: client.defaultMutationOptions(options),
            state,
          });
        this.add(mutation);
        return mutation;
      }
      add(mutation) {
        this.#mutations.add(mutation);
        const scope = scopeFor(mutation);
        if (typeof scope === 'string') {
          const scopedMutations = this.#scopes.get(scope);
          if (scopedMutations) {
            scopedMutations.push(mutation);
          } else {
            this.#scopes.set(scope, [mutation]);
          }
        }
        this.notify({
          type: 'added',
          mutation,
        });
      }
      remove(mutation) {
        if (this.#mutations.delete(mutation)) {
          const scope = scopeFor(mutation);
          if (typeof scope === 'string') {
            const scopedMutations = this.#scopes.get(scope);
            if (scopedMutations) {
              if (scopedMutations.length > 1) {
                const index = scopedMutations.indexOf(mutation);
                if (index !== -1) {
                  scopedMutations.splice(index, 1);
                }
              } else if (scopedMutations[0] === mutation) {
                this.#scopes.delete(scope);
              }
            }
          }
        }
        this.notify({
          type: 'removed',
          mutation,
        });
      }
      canRun(mutation) {
        const scope = scopeFor(mutation);
        if (typeof scope === 'string') {
          const mutationsWithSameScope = this.#scopes.get(scope);
          const firstPendingMutation = mutationsWithSameScope?.find(
            (m) => m.state.status === 'pending'
          );
          return !firstPendingMutation || firstPendingMutation === mutation;
        } else {
          return true;
        }
      }
      runNext(mutation) {
        const scope = scopeFor(mutation);
        if (typeof scope === 'string') {
          const foundMutation = this.#scopes
            .get(scope)
            ?.find((m) => m !== mutation && m.state.isPaused);
          return foundMutation?.continue() ?? Promise.resolve();
        } else {
          return Promise.resolve();
        }
      }
      clear() {
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$notifyManager$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'notifyManager'
        ].batch(() => {
          this.#mutations.forEach((mutation) => {
            this.notify({
              type: 'removed',
              mutation,
            });
          });
          this.#mutations.clear();
          this.#scopes.clear();
        });
      }
      getAll() {
        return Array.from(this.#mutations);
      }
      find(filters) {
        const defaultedFilters = {
          exact: true,
          ...filters,
        };
        return this.getAll().find((mutation) =>
          (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'matchMutation'
          ])(defaultedFilters, mutation)
        );
      }
      findAll(filters = {}) {
        return this.getAll().filter((mutation) =>
          (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'matchMutation'
          ])(filters, mutation)
        );
      }
      notify(event) {
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$notifyManager$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'notifyManager'
        ].batch(() => {
          this.listeners.forEach((listener) => {
            listener(event);
          });
        });
      }
      resumePausedMutations() {
        const pausedMutations = this.getAll().filter((x) => x.state.isPaused);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$notifyManager$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'notifyManager'
        ].batch(() =>
          Promise.all(
            pausedMutations.map((mutation) =>
              mutation
                .continue()
                .catch(
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'noop'
                  ]
                )
            )
          )
        );
      }
    };
    function scopeFor(mutation) {
      return mutation.options.scope?.id;
    }
    //# sourceMappingURL=mutationCache.js.map
  },
  '[project]/node_modules/@tanstack/query-core/build/modern/infiniteQueryBehavior.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'hasNextPage',
      () => hasNextPage,
      'hasPreviousPage',
      () => hasPreviousPage,
      'infiniteQueryBehavior',
      () => infiniteQueryBehavior,
    ]);
    // src/infiniteQueryBehavior.ts
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@tanstack/query-core/build/modern/utils.js [app-client] (ecmascript)'
      );
    function infiniteQueryBehavior(pages) {
      return {
        onFetch: (context, query) => {
          const options = context.options;
          const direction = context.fetchOptions?.meta?.fetchMore?.direction;
          const oldPages = context.state.data?.pages || [];
          const oldPageParams = context.state.data?.pageParams || [];
          let result = {
            pages: [],
            pageParams: [],
          };
          let currentPage = 0;
          const fetchFn = async () => {
            let cancelled = false;
            const addSignalProperty = (object) => {
              Object.defineProperty(object, 'signal', {
                enumerable: true,
                get: () => {
                  if (context.signal.aborted) {
                    cancelled = true;
                  } else {
                    context.signal.addEventListener('abort', () => {
                      cancelled = true;
                    });
                  }
                  return context.signal;
                },
              });
            };
            const queryFn = (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'ensureQueryFn'
            ])(context.options, context.fetchOptions);
            const fetchPage = async (data, param, previous) => {
              if (cancelled) {
                return Promise.reject();
              }
              if (param == null && data.pages.length) {
                return Promise.resolve(data);
              }
              const queryFnContext = {
                client: context.client,
                queryKey: context.queryKey,
                pageParam: param,
                direction: previous ? 'backward' : 'forward',
                meta: context.options.meta,
              };
              addSignalProperty(queryFnContext);
              const page = await queryFn(queryFnContext);
              const { maxPages } = context.options;
              const addTo = previous
                ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'addToStart'
                  ]
                : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'addToEnd'
                  ];
              return {
                pages: addTo(data.pages, page, maxPages),
                pageParams: addTo(data.pageParams, param, maxPages),
              };
            };
            if (direction && oldPages.length) {
              const previous = direction === 'backward';
              const pageParamFn = previous ? getPreviousPageParam : getNextPageParam;
              const oldData = {
                pages: oldPages,
                pageParams: oldPageParams,
              };
              const param = pageParamFn(options, oldData);
              result = await fetchPage(oldData, param, previous);
            } else {
              const remainingPages = pages ?? oldPages.length;
              do {
                const param =
                  currentPage === 0
                    ? (oldPageParams[0] ?? options.initialPageParam)
                    : getNextPageParam(options, result);
                if (currentPage > 0 && param == null) {
                  break;
                }
                result = await fetchPage(result, param);
                currentPage++;
              } while (currentPage < remainingPages);
            }
            return result;
          };
          if (context.options.persister) {
            context.fetchFn = () => {
              return context.options.persister?.(
                fetchFn,
                {
                  client: context.client,
                  queryKey: context.queryKey,
                  meta: context.options.meta,
                  signal: context.signal,
                },
                query
              );
            };
          } else {
            context.fetchFn = fetchFn;
          }
        },
      };
    }
    function getNextPageParam(options, { pages, pageParams }) {
      const lastIndex = pages.length - 1;
      return pages.length > 0
        ? options.getNextPageParam(pages[lastIndex], pages, pageParams[lastIndex], pageParams)
        : void 0;
    }
    function getPreviousPageParam(options, { pages, pageParams }) {
      return pages.length > 0
        ? options.getPreviousPageParam?.(pages[0], pages, pageParams[0], pageParams)
        : void 0;
    }
    function hasNextPage(options, data) {
      if (!data) return false;
      return getNextPageParam(options, data) != null;
    }
    function hasPreviousPage(options, data) {
      if (!data || !options.getPreviousPageParam) return false;
      return getPreviousPageParam(options, data) != null;
    }
    //# sourceMappingURL=infiniteQueryBehavior.js.map
  },
  '[project]/node_modules/@tanstack/query-core/build/modern/queryClient.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['QueryClient', () => QueryClient]);
    // src/queryClient.ts
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@tanstack/query-core/build/modern/utils.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$queryCache$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@tanstack/query-core/build/modern/queryCache.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$mutationCache$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@tanstack/query-core/build/modern/mutationCache.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$focusManager$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@tanstack/query-core/build/modern/focusManager.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$onlineManager$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@tanstack/query-core/build/modern/onlineManager.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$notifyManager$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@tanstack/query-core/build/modern/notifyManager.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$infiniteQueryBehavior$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@tanstack/query-core/build/modern/infiniteQueryBehavior.js [app-client] (ecmascript)'
      );
    var QueryClient = class {
      #queryCache;
      #mutationCache;
      #defaultOptions;
      #queryDefaults;
      #mutationDefaults;
      #mountCount;
      #unsubscribeFocus;
      #unsubscribeOnline;
      constructor(config = {}) {
        this.#queryCache =
          config.queryCache ||
          new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$queryCache$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'QueryCache'
          ]();
        this.#mutationCache =
          config.mutationCache ||
          new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$mutationCache$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'MutationCache'
          ]();
        this.#defaultOptions = config.defaultOptions || {};
        this.#queryDefaults = /* @__PURE__ */ new Map();
        this.#mutationDefaults = /* @__PURE__ */ new Map();
        this.#mountCount = 0;
      }
      mount() {
        this.#mountCount++;
        if (this.#mountCount !== 1) return;
        this.#unsubscribeFocus =
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$focusManager$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'focusManager'
          ].subscribe(async (focused) => {
            if (focused) {
              await this.resumePausedMutations();
              this.#queryCache.onFocus();
            }
          });
        this.#unsubscribeOnline =
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$onlineManager$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'onlineManager'
          ].subscribe(async (online) => {
            if (online) {
              await this.resumePausedMutations();
              this.#queryCache.onOnline();
            }
          });
      }
      unmount() {
        this.#mountCount--;
        if (this.#mountCount !== 0) return;
        this.#unsubscribeFocus?.();
        this.#unsubscribeFocus = void 0;
        this.#unsubscribeOnline?.();
        this.#unsubscribeOnline = void 0;
      }
      isFetching(filters) {
        return this.#queryCache.findAll({
          ...filters,
          fetchStatus: 'fetching',
        }).length;
      }
      isMutating(filters) {
        return this.#mutationCache.findAll({
          ...filters,
          status: 'pending',
        }).length;
      }
      getQueryData(queryKey) {
        const options = this.defaultQueryOptions({
          queryKey,
        });
        return this.#queryCache.get(options.queryHash)?.state.data;
      }
      ensureQueryData(options) {
        const defaultedOptions = this.defaultQueryOptions(options);
        const query = this.#queryCache.build(this, defaultedOptions);
        const cachedData = query.state.data;
        if (cachedData === void 0) {
          return this.fetchQuery(options);
        }
        if (
          options.revalidateIfStale &&
          query.isStaleByTime(
            (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'resolveStaleTime'
            ])(defaultedOptions.staleTime, query)
          )
        ) {
          void this.prefetchQuery(defaultedOptions);
        }
        return Promise.resolve(cachedData);
      }
      getQueriesData(filters) {
        return this.#queryCache.findAll(filters).map(({ queryKey, state }) => {
          const data = state.data;
          return [queryKey, data];
        });
      }
      setQueryData(queryKey, updater, options) {
        const defaultedOptions = this.defaultQueryOptions({
          queryKey,
        });
        const query = this.#queryCache.get(defaultedOptions.queryHash);
        const prevData = query?.state.data;
        const data = (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'functionalUpdate'
        ])(updater, prevData);
        if (data === void 0) {
          return void 0;
        }
        return this.#queryCache.build(this, defaultedOptions).setData(data, {
          ...options,
          manual: true,
        });
      }
      setQueriesData(filters, updater, options) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$notifyManager$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'notifyManager'
        ].batch(() =>
          this.#queryCache
            .findAll(filters)
            .map(({ queryKey }) => [queryKey, this.setQueryData(queryKey, updater, options)])
        );
      }
      getQueryState(queryKey) {
        const options = this.defaultQueryOptions({
          queryKey,
        });
        return this.#queryCache.get(options.queryHash)?.state;
      }
      removeQueries(filters) {
        const queryCache = this.#queryCache;
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$notifyManager$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'notifyManager'
        ].batch(() => {
          queryCache.findAll(filters).forEach((query) => {
            queryCache.remove(query);
          });
        });
      }
      resetQueries(filters, options) {
        const queryCache = this.#queryCache;
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$notifyManager$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'notifyManager'
        ].batch(() => {
          queryCache.findAll(filters).forEach((query) => {
            query.reset();
          });
          return this.refetchQueries(
            {
              type: 'active',
              ...filters,
            },
            options
          );
        });
      }
      cancelQueries(filters, cancelOptions = {}) {
        const defaultedCancelOptions = {
          revert: true,
          ...cancelOptions,
        };
        const promises =
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$notifyManager$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'notifyManager'
          ].batch(() =>
            this.#queryCache.findAll(filters).map((query) => query.cancel(defaultedCancelOptions))
          );
        return Promise.all(promises)
          .then(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'noop'
            ]
          )
          .catch(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'noop'
            ]
          );
      }
      invalidateQueries(filters, options = {}) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$notifyManager$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'notifyManager'
        ].batch(() => {
          this.#queryCache.findAll(filters).forEach((query) => {
            query.invalidate();
          });
          if (filters?.refetchType === 'none') {
            return Promise.resolve();
          }
          return this.refetchQueries(
            {
              ...filters,
              type: filters?.refetchType ?? filters?.type ?? 'active',
            },
            options
          );
        });
      }
      refetchQueries(filters, options = {}) {
        const fetchOptions = {
          ...options,
          cancelRefetch: options.cancelRefetch ?? true,
        };
        const promises =
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$notifyManager$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'notifyManager'
          ].batch(() =>
            this.#queryCache
              .findAll(filters)
              .filter((query) => !query.isDisabled())
              .map((query) => {
                let promise = query.fetch(void 0, fetchOptions);
                if (!fetchOptions.throwOnError) {
                  promise = promise.catch(
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'noop'
                    ]
                  );
                }
                return query.state.fetchStatus === 'paused' ? Promise.resolve() : promise;
              })
          );
        return Promise.all(promises).then(
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'noop'
          ]
        );
      }
      fetchQuery(options) {
        const defaultedOptions = this.defaultQueryOptions(options);
        if (defaultedOptions.retry === void 0) {
          defaultedOptions.retry = false;
        }
        const query = this.#queryCache.build(this, defaultedOptions);
        return query.isStaleByTime(
          (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'resolveStaleTime'
          ])(defaultedOptions.staleTime, query)
        )
          ? query.fetch(defaultedOptions)
          : Promise.resolve(query.state.data);
      }
      prefetchQuery(options) {
        return this.fetchQuery(options)
          .then(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'noop'
            ]
          )
          .catch(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'noop'
            ]
          );
      }
      fetchInfiniteQuery(options) {
        options.behavior = (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$infiniteQueryBehavior$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'infiniteQueryBehavior'
        ])(options.pages);
        return this.fetchQuery(options);
      }
      prefetchInfiniteQuery(options) {
        return this.fetchInfiniteQuery(options)
          .then(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'noop'
            ]
          )
          .catch(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'noop'
            ]
          );
      }
      ensureInfiniteQueryData(options) {
        options.behavior = (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$infiniteQueryBehavior$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'infiniteQueryBehavior'
        ])(options.pages);
        return this.ensureQueryData(options);
      }
      resumePausedMutations() {
        if (
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$onlineManager$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'onlineManager'
          ].isOnline()
        ) {
          return this.#mutationCache.resumePausedMutations();
        }
        return Promise.resolve();
      }
      getQueryCache() {
        return this.#queryCache;
      }
      getMutationCache() {
        return this.#mutationCache;
      }
      getDefaultOptions() {
        return this.#defaultOptions;
      }
      setDefaultOptions(options) {
        this.#defaultOptions = options;
      }
      setQueryDefaults(queryKey, options) {
        this.#queryDefaults.set(
          (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'hashKey'
          ])(queryKey),
          {
            queryKey,
            defaultOptions: options,
          }
        );
      }
      getQueryDefaults(queryKey) {
        const defaults = [...this.#queryDefaults.values()];
        const result = {};
        defaults.forEach((queryDefault) => {
          if (
            (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'partialMatchKey'
            ])(queryKey, queryDefault.queryKey)
          ) {
            Object.assign(result, queryDefault.defaultOptions);
          }
        });
        return result;
      }
      setMutationDefaults(mutationKey, options) {
        this.#mutationDefaults.set(
          (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'hashKey'
          ])(mutationKey),
          {
            mutationKey,
            defaultOptions: options,
          }
        );
      }
      getMutationDefaults(mutationKey) {
        const defaults = [...this.#mutationDefaults.values()];
        const result = {};
        defaults.forEach((queryDefault) => {
          if (
            (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'partialMatchKey'
            ])(mutationKey, queryDefault.mutationKey)
          ) {
            Object.assign(result, queryDefault.defaultOptions);
          }
        });
        return result;
      }
      defaultQueryOptions(options) {
        if (options._defaulted) {
          return options;
        }
        const defaultedOptions = {
          ...this.#defaultOptions.queries,
          ...this.getQueryDefaults(options.queryKey),
          ...options,
          _defaulted: true,
        };
        if (!defaultedOptions.queryHash) {
          defaultedOptions.queryHash = (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'hashQueryKeyByOptions'
          ])(defaultedOptions.queryKey, defaultedOptions);
        }
        if (defaultedOptions.refetchOnReconnect === void 0) {
          defaultedOptions.refetchOnReconnect = defaultedOptions.networkMode !== 'always';
        }
        if (defaultedOptions.throwOnError === void 0) {
          defaultedOptions.throwOnError = !!defaultedOptions.suspense;
        }
        if (!defaultedOptions.networkMode && defaultedOptions.persister) {
          defaultedOptions.networkMode = 'offlineFirst';
        }
        if (
          defaultedOptions.queryFn ===
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'skipToken'
          ]
        ) {
          defaultedOptions.enabled = false;
        }
        return defaultedOptions;
      }
      defaultMutationOptions(options) {
        if (options?._defaulted) {
          return options;
        }
        return {
          ...this.#defaultOptions.mutations,
          ...(options?.mutationKey && this.getMutationDefaults(options.mutationKey)),
          ...options,
          _defaulted: true,
        };
      }
      clear() {
        this.#queryCache.clear();
        this.#mutationCache.clear();
      }
    };
    //# sourceMappingURL=queryClient.js.map
  },
  '[project]/node_modules/@tanstack/react-query/build/modern/QueryClientProvider.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'QueryClientContext',
      () => QueryClientContext,
      'QueryClientProvider',
      () => QueryClientProvider,
      'useQueryClient',
      () => useQueryClient,
    ]);
    // src/QueryClientProvider.tsx
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-runtime.js [app-client] (ecmascript)'
      );
    ('use client');
    var QueryClientContext =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'createContext'
      ](void 0);
    var useQueryClient = (queryClient) => {
      const client =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useContext'
        ](QueryClientContext);
      if (queryClient) {
        return queryClient;
      }
      if (!client) {
        throw new Error('No QueryClient set, use QueryClientProvider to set one');
      }
      return client;
    };
    var QueryClientProvider = ({ client, children }) => {
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useEffect'
      ](
        {
          'QueryClientProvider.useEffect': () => {
            client.mount();
            return {
              'QueryClientProvider.useEffect': () => {
                client.unmount();
              },
            }['QueryClientProvider.useEffect'];
          },
        }['QueryClientProvider.useEffect'],
        [client]
      );
      return /* @__PURE__ */ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsx'
      ])(QueryClientContext.Provider, {
        value: client,
        children,
      });
    };
    //# sourceMappingURL=QueryClientProvider.js.map
  },
  '[project]/node_modules/@babel/runtime/helpers/interopRequireDefault.js [app-client] (ecmascript)',
  (__turbopack_context__, module, exports) => {
    function _interopRequireDefault(e) {
      return e && e.__esModule
        ? e
        : {
            default: e,
          };
    }
    (module.exports = _interopRequireDefault),
      (module.exports.__esModule = true),
      (module.exports['default'] = module.exports);
  },
  '[project]/node_modules/@babel/runtime/helpers/typeof.js [app-client] (ecmascript)',
  (__turbopack_context__, module, exports) => {
    function _typeof(o) {
      '@babel/helpers - typeof';
      return (
        (module.exports = _typeof =
          'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
            ? function (o) {
                return typeof o;
              }
            : function (o) {
                return o &&
                  'function' == typeof Symbol &&
                  o.constructor === Symbol &&
                  o !== Symbol.prototype
                  ? 'symbol'
                  : typeof o;
              }),
        (module.exports.__esModule = true),
        (module.exports['default'] = module.exports),
        _typeof(o)
      );
    }
    (module.exports = _typeof),
      (module.exports.__esModule = true),
      (module.exports['default'] = module.exports);
  },
  '[project]/node_modules/@babel/runtime/helpers/regeneratorRuntime.js [app-client] (ecmascript)',
  (__turbopack_context__, module, exports) => {
    var _typeof = __turbopack_context__.r(
      '[project]/node_modules/@babel/runtime/helpers/typeof.js [app-client] (ecmascript)'
    )['default'];
    function _regeneratorRuntime() {
      'use strict'; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */
      (module.exports = _regeneratorRuntime =
        function _regeneratorRuntime() {
          return e;
        }),
        (module.exports.__esModule = true),
        (module.exports['default'] = module.exports);
      var t,
        e = {},
        r = Object.prototype,
        n = r.hasOwnProperty,
        o =
          Object.defineProperty ||
          function (t, e, r) {
            t[e] = r.value;
          },
        i = 'function' == typeof Symbol ? Symbol : {},
        a = i.iterator || '@@iterator',
        c = i.asyncIterator || '@@asyncIterator',
        u = i.toStringTag || '@@toStringTag';
      function define(t, e, r) {
        return (
          Object.defineProperty(t, e, {
            value: r,
            enumerable: !0,
            configurable: !0,
            writable: !0,
          }),
          t[e]
        );
      }
      try {
        define({}, '');
      } catch (t) {
        define = function define(t, e, r) {
          return (t[e] = r);
        };
      }
      function wrap(t, e, r, n) {
        var i = e && e.prototype instanceof Generator ? e : Generator,
          a = Object.create(i.prototype),
          c = new Context(n || []);
        return (
          o(a, '_invoke', {
            value: makeInvokeMethod(t, r, c),
          }),
          a
        );
      }
      function tryCatch(t, e, r) {
        try {
          return {
            type: 'normal',
            arg: t.call(e, r),
          };
        } catch (t) {
          return {
            type: 'throw',
            arg: t,
          };
        }
      }
      e.wrap = wrap;
      var h = 'suspendedStart',
        l = 'suspendedYield',
        f = 'executing',
        s = 'completed',
        y = {};
      function Generator() {}
      function GeneratorFunction() {}
      function GeneratorFunctionPrototype() {}
      var p = {};
      define(p, a, function () {
        return this;
      });
      var d = Object.getPrototypeOf,
        v = d && d(d(values([])));
      v && v !== r && n.call(v, a) && (p = v);
      var g = (GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p));
      function defineIteratorMethods(t) {
        ['next', 'throw', 'return'].forEach(function (e) {
          define(t, e, function (t) {
            return this._invoke(e, t);
          });
        });
      }
      function AsyncIterator(t, e) {
        function invoke(r, o, i, a) {
          var c = tryCatch(t[r], t, o);
          if ('throw' !== c.type) {
            var u = c.arg,
              h = u.value;
            return h && 'object' == _typeof(h) && n.call(h, '__await')
              ? e.resolve(h.__await).then(
                  function (t) {
                    invoke('next', t, i, a);
                  },
                  function (t) {
                    invoke('throw', t, i, a);
                  }
                )
              : e.resolve(h).then(
                  function (t) {
                    (u.value = t), i(u);
                  },
                  function (t) {
                    return invoke('throw', t, i, a);
                  }
                );
          }
          a(c.arg);
        }
        var r;
        o(this, '_invoke', {
          value: function value(t, n) {
            function callInvokeWithMethodAndArg() {
              return new e(function (e, r) {
                invoke(t, n, e, r);
              });
            }
            return (r = r
              ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg)
              : callInvokeWithMethodAndArg());
          },
        });
      }
      function makeInvokeMethod(e, r, n) {
        var o = h;
        return function (i, a) {
          if (o === f) throw Error('Generator is already running');
          if (o === s) {
            if ('throw' === i) throw a;
            return {
              value: t,
              done: !0,
            };
          }
          for (n.method = i, n.arg = a; ; ) {
            var c = n.delegate;
            if (c) {
              var u = maybeInvokeDelegate(c, n);
              if (u) {
                if (u === y) continue;
                return u;
              }
            }
            if ('next' === n.method) n.sent = n._sent = n.arg;
            else if ('throw' === n.method) {
              if (o === h) throw ((o = s), n.arg);
              n.dispatchException(n.arg);
            } else 'return' === n.method && n.abrupt('return', n.arg);
            o = f;
            var p = tryCatch(e, r, n);
            if ('normal' === p.type) {
              if (((o = n.done ? s : l), p.arg === y)) continue;
              return {
                value: p.arg,
                done: n.done,
              };
            }
            'throw' === p.type && ((o = s), (n.method = 'throw'), (n.arg = p.arg));
          }
        };
      }
      function maybeInvokeDelegate(e, r) {
        var n = r.method,
          o = e.iterator[n];
        if (o === t)
          return (
            (r.delegate = null),
            ('throw' === n &&
              e.iterator['return'] &&
              ((r.method = 'return'),
              (r.arg = t),
              maybeInvokeDelegate(e, r),
              'throw' === r.method)) ||
              ('return' !== n &&
                ((r.method = 'throw'),
                (r.arg = new TypeError("The iterator does not provide a '" + n + "' method")))),
            y
          );
        var i = tryCatch(o, e.iterator, r.arg);
        if ('throw' === i.type)
          return (r.method = 'throw'), (r.arg = i.arg), (r.delegate = null), y;
        var a = i.arg;
        return a
          ? a.done
            ? ((r[e.resultName] = a.value),
              (r.next = e.nextLoc),
              'return' !== r.method && ((r.method = 'next'), (r.arg = t)),
              (r.delegate = null),
              y)
            : a
          : ((r.method = 'throw'),
            (r.arg = new TypeError('iterator result is not an object')),
            (r.delegate = null),
            y);
      }
      function pushTryEntry(t) {
        var e = {
          tryLoc: t[0],
        };
        1 in t && (e.catchLoc = t[1]),
          2 in t && ((e.finallyLoc = t[2]), (e.afterLoc = t[3])),
          this.tryEntries.push(e);
      }
      function resetTryEntry(t) {
        var e = t.completion || {};
        (e.type = 'normal'), delete e.arg, (t.completion = e);
      }
      function Context(t) {
        (this.tryEntries = [
          {
            tryLoc: 'root',
          },
        ]),
          t.forEach(pushTryEntry, this),
          this.reset(!0);
      }
      function values(e) {
        if (e || '' === e) {
          var r = e[a];
          if (r) return r.call(e);
          if ('function' == typeof e.next) return e;
          if (!isNaN(e.length)) {
            var o = -1,
              i = function next() {
                for (; ++o < e.length; )
                  if (n.call(e, o)) return (next.value = e[o]), (next.done = !1), next;
                return (next.value = t), (next.done = !0), next;
              };
            return (i.next = i);
          }
        }
        throw new TypeError(_typeof(e) + ' is not iterable');
      }
      return (
        (GeneratorFunction.prototype = GeneratorFunctionPrototype),
        o(g, 'constructor', {
          value: GeneratorFunctionPrototype,
          configurable: !0,
        }),
        o(GeneratorFunctionPrototype, 'constructor', {
          value: GeneratorFunction,
          configurable: !0,
        }),
        (GeneratorFunction.displayName = define(
          GeneratorFunctionPrototype,
          u,
          'GeneratorFunction'
        )),
        (e.isGeneratorFunction = function (t) {
          var e = 'function' == typeof t && t.constructor;
          return (
            !!e && (e === GeneratorFunction || 'GeneratorFunction' === (e.displayName || e.name))
          );
        }),
        (e.mark = function (t) {
          return (
            Object.setPrototypeOf
              ? Object.setPrototypeOf(t, GeneratorFunctionPrototype)
              : ((t.__proto__ = GeneratorFunctionPrototype), define(t, u, 'GeneratorFunction')),
            (t.prototype = Object.create(g)),
            t
          );
        }),
        (e.awrap = function (t) {
          return {
            __await: t,
          };
        }),
        defineIteratorMethods(AsyncIterator.prototype),
        define(AsyncIterator.prototype, c, function () {
          return this;
        }),
        (e.AsyncIterator = AsyncIterator),
        (e.async = function (t, r, n, o, i) {
          void 0 === i && (i = Promise);
          var a = new AsyncIterator(wrap(t, r, n, o), i);
          return e.isGeneratorFunction(r)
            ? a
            : a.next().then(function (t) {
                return t.done ? t.value : a.next();
              });
        }),
        defineIteratorMethods(g),
        define(g, u, 'Generator'),
        define(g, a, function () {
          return this;
        }),
        define(g, 'toString', function () {
          return '[object Generator]';
        }),
        (e.keys = function (t) {
          var e = Object(t),
            r = [];
          for (var n in e) r.push(n);
          return (
            r.reverse(),
            function next() {
              for (; r.length; ) {
                var t = r.pop();
                if (t in e) return (next.value = t), (next.done = !1), next;
              }
              return (next.done = !0), next;
            }
          );
        }),
        (e.values = values),
        (Context.prototype = {
          constructor: Context,
          reset: function reset(e) {
            if (
              ((this.prev = 0),
              (this.next = 0),
              (this.sent = this._sent = t),
              (this.done = !1),
              (this.delegate = null),
              (this.method = 'next'),
              (this.arg = t),
              this.tryEntries.forEach(resetTryEntry),
              !e)
            )
              for (var r in this)
                't' === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t);
          },
          stop: function stop() {
            this.done = !0;
            var t = this.tryEntries[0].completion;
            if ('throw' === t.type) throw t.arg;
            return this.rval;
          },
          dispatchException: function dispatchException(e) {
            if (this.done) throw e;
            var r = this;
            function handle(n, o) {
              return (
                (a.type = 'throw'),
                (a.arg = e),
                (r.next = n),
                o && ((r.method = 'next'), (r.arg = t)),
                !!o
              );
            }
            for (var o = this.tryEntries.length - 1; o >= 0; --o) {
              var i = this.tryEntries[o],
                a = i.completion;
              if ('root' === i.tryLoc) return handle('end');
              if (i.tryLoc <= this.prev) {
                var c = n.call(i, 'catchLoc'),
                  u = n.call(i, 'finallyLoc');
                if (c && u) {
                  if (this.prev < i.catchLoc) return handle(i.catchLoc, !0);
                  if (this.prev < i.finallyLoc) return handle(i.finallyLoc);
                } else if (c) {
                  if (this.prev < i.catchLoc) return handle(i.catchLoc, !0);
                } else {
                  if (!u) throw Error('try statement without catch or finally');
                  if (this.prev < i.finallyLoc) return handle(i.finallyLoc);
                }
              }
            }
          },
          abrupt: function abrupt(t, e) {
            for (var r = this.tryEntries.length - 1; r >= 0; --r) {
              var o = this.tryEntries[r];
              if (o.tryLoc <= this.prev && n.call(o, 'finallyLoc') && this.prev < o.finallyLoc) {
                var i = o;
                break;
              }
            }
            i &&
              ('break' === t || 'continue' === t) &&
              i.tryLoc <= e &&
              e <= i.finallyLoc &&
              (i = null);
            var a = i ? i.completion : {};
            return (
              (a.type = t),
              (a.arg = e),
              i ? ((this.method = 'next'), (this.next = i.finallyLoc), y) : this.complete(a)
            );
          },
          complete: function complete(t, e) {
            if ('throw' === t.type) throw t.arg;
            return (
              'break' === t.type || 'continue' === t.type
                ? (this.next = t.arg)
                : 'return' === t.type
                  ? ((this.rval = this.arg = t.arg), (this.method = 'return'), (this.next = 'end'))
                  : 'normal' === t.type && e && (this.next = e),
              y
            );
          },
          finish: function finish(t) {
            for (var e = this.tryEntries.length - 1; e >= 0; --e) {
              var r = this.tryEntries[e];
              if (r.finallyLoc === t)
                return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y;
            }
          },
          catch: function _catch(t) {
            for (var e = this.tryEntries.length - 1; e >= 0; --e) {
              var r = this.tryEntries[e];
              if (r.tryLoc === t) {
                var n = r.completion;
                if ('throw' === n.type) {
                  var o = n.arg;
                  resetTryEntry(r);
                }
                return o;
              }
            }
            throw Error('illegal catch attempt');
          },
          delegateYield: function delegateYield(e, r, n) {
            return (
              (this.delegate = {
                iterator: values(e),
                resultName: r,
                nextLoc: n,
              }),
              'next' === this.method && (this.arg = t),
              y
            );
          },
        }),
        e
      );
    }
    (module.exports = _regeneratorRuntime),
      (module.exports.__esModule = true),
      (module.exports['default'] = module.exports);
  },
  '[project]/node_modules/@babel/runtime/regenerator/index.js [app-client] (ecmascript)',
  (__turbopack_context__, module, exports) => {
    // TODO(Babel 8): Remove this file.
    var runtime = __turbopack_context__.r(
      '[project]/node_modules/@babel/runtime/helpers/regeneratorRuntime.js [app-client] (ecmascript)'
    )();
    module.exports = runtime;
    // Copied from https://github.com/facebook/regenerator/blob/main/packages/runtime/runtime.js#L736=
    try {
      regeneratorRuntime = runtime;
    } catch (accidentalStrictMode) {
      if (typeof globalThis === 'object') {
        globalThis.regeneratorRuntime = runtime;
      } else {
        Function('r', 'regeneratorRuntime = r')(runtime);
      }
    }
  },
  '[project]/node_modules/@babel/runtime/helpers/toPrimitive.js [app-client] (ecmascript)',
  (__turbopack_context__, module, exports) => {
    var _typeof = __turbopack_context__.r(
      '[project]/node_modules/@babel/runtime/helpers/typeof.js [app-client] (ecmascript)'
    )['default'];
    function toPrimitive(t, r) {
      if ('object' != _typeof(t) || !t) return t;
      var e = t[Symbol.toPrimitive];
      if (void 0 !== e) {
        var i = e.call(t, r || 'default');
        if ('object' != _typeof(i)) return i;
        throw new TypeError('@@toPrimitive must return a primitive value.');
      }
      return ('string' === r ? String : Number)(t);
    }
    (module.exports = toPrimitive),
      (module.exports.__esModule = true),
      (module.exports['default'] = module.exports);
  },
  '[project]/node_modules/@babel/runtime/helpers/toPropertyKey.js [app-client] (ecmascript)',
  (__turbopack_context__, module, exports) => {
    var _typeof = __turbopack_context__.r(
      '[project]/node_modules/@babel/runtime/helpers/typeof.js [app-client] (ecmascript)'
    )['default'];
    var toPrimitive = __turbopack_context__.r(
      '[project]/node_modules/@babel/runtime/helpers/toPrimitive.js [app-client] (ecmascript)'
    );
    function toPropertyKey(t) {
      var i = toPrimitive(t, 'string');
      return 'symbol' == _typeof(i) ? i : i + '';
    }
    (module.exports = toPropertyKey),
      (module.exports.__esModule = true),
      (module.exports['default'] = module.exports);
  },
  '[project]/node_modules/@babel/runtime/helpers/defineProperty.js [app-client] (ecmascript)',
  (__turbopack_context__, module, exports) => {
    var toPropertyKey = __turbopack_context__.r(
      '[project]/node_modules/@babel/runtime/helpers/toPropertyKey.js [app-client] (ecmascript)'
    );
    function _defineProperty(e, r, t) {
      return (
        (r = toPropertyKey(r)) in e
          ? Object.defineProperty(e, r, {
              value: t,
              enumerable: !0,
              configurable: !0,
              writable: !0,
            })
          : (e[r] = t),
        e
      );
    }
    (module.exports = _defineProperty),
      (module.exports.__esModule = true),
      (module.exports['default'] = module.exports);
  },
  '[project]/node_modules/@babel/runtime/helpers/asyncToGenerator.js [app-client] (ecmascript)',
  (__turbopack_context__, module, exports) => {
    function asyncGeneratorStep(n, t, e, r, o, a, c) {
      try {
        var i = n[a](c),
          u = i.value;
      } catch (n) {
        return void e(n);
      }
      i.done ? t(u) : Promise.resolve(u).then(r, o);
    }
    function _asyncToGenerator(n) {
      return function () {
        var t = this,
          e = arguments;
        return new Promise(function (r, o) {
          var a = n.apply(t, e);
          function _next(n) {
            asyncGeneratorStep(a, r, o, _next, _throw, 'next', n);
          }
          function _throw(n) {
            asyncGeneratorStep(a, r, o, _next, _throw, 'throw', n);
          }
          _next(void 0);
        });
      };
    }
    (module.exports = _asyncToGenerator),
      (module.exports.__esModule = true),
      (module.exports['default'] = module.exports);
  },
  '[project]/node_modules/@babel/runtime/helpers/arrayWithHoles.js [app-client] (ecmascript)',
  (__turbopack_context__, module, exports) => {
    function _arrayWithHoles(r) {
      if (Array.isArray(r)) return r;
    }
    (module.exports = _arrayWithHoles),
      (module.exports.__esModule = true),
      (module.exports['default'] = module.exports);
  },
  '[project]/node_modules/@babel/runtime/helpers/iterableToArrayLimit.js [app-client] (ecmascript)',
  (__turbopack_context__, module, exports) => {
    function _iterableToArrayLimit(r, l) {
      var t =
        null == r ? null : ('undefined' != typeof Symbol && r[Symbol.iterator]) || r['@@iterator'];
      if (null != t) {
        var e,
          n,
          i,
          u,
          a = [],
          f = !0,
          o = !1;
        try {
          if (((i = (t = t.call(r)).next), 0 === l)) {
            if (Object(t) !== t) return;
            f = !1;
          } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0);
        } catch (r) {
          (o = !0), (n = r);
        } finally {
          try {
            if (!f && null != t['return'] && ((u = t['return']()), Object(u) !== u)) return;
          } finally {
            if (o) throw n;
          }
        }
        return a;
      }
    }
    (module.exports = _iterableToArrayLimit),
      (module.exports.__esModule = true),
      (module.exports['default'] = module.exports);
  },
  '[project]/node_modules/@babel/runtime/helpers/arrayLikeToArray.js [app-client] (ecmascript)',
  (__turbopack_context__, module, exports) => {
    function _arrayLikeToArray(r, a) {
      (null == a || a > r.length) && (a = r.length);
      for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
      return n;
    }
    (module.exports = _arrayLikeToArray),
      (module.exports.__esModule = true),
      (module.exports['default'] = module.exports);
  },
  '[project]/node_modules/@babel/runtime/helpers/unsupportedIterableToArray.js [app-client] (ecmascript)',
  (__turbopack_context__, module, exports) => {
    var arrayLikeToArray = __turbopack_context__.r(
      '[project]/node_modules/@babel/runtime/helpers/arrayLikeToArray.js [app-client] (ecmascript)'
    );
    function _unsupportedIterableToArray(r, a) {
      if (r) {
        if ('string' == typeof r) return arrayLikeToArray(r, a);
        var t = {}.toString.call(r).slice(8, -1);
        return (
          'Object' === t && r.constructor && (t = r.constructor.name),
          'Map' === t || 'Set' === t
            ? Array.from(r)
            : 'Arguments' === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t)
              ? arrayLikeToArray(r, a)
              : void 0
        );
      }
    }
    (module.exports = _unsupportedIterableToArray),
      (module.exports.__esModule = true),
      (module.exports['default'] = module.exports);
  },
  '[project]/node_modules/@babel/runtime/helpers/nonIterableRest.js [app-client] (ecmascript)',
  (__turbopack_context__, module, exports) => {
    function _nonIterableRest() {
      throw new TypeError(
        'Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.'
      );
    }
    (module.exports = _nonIterableRest),
      (module.exports.__esModule = true),
      (module.exports['default'] = module.exports);
  },
  '[project]/node_modules/@babel/runtime/helpers/slicedToArray.js [app-client] (ecmascript)',
  (__turbopack_context__, module, exports) => {
    var arrayWithHoles = __turbopack_context__.r(
      '[project]/node_modules/@babel/runtime/helpers/arrayWithHoles.js [app-client] (ecmascript)'
    );
    var iterableToArrayLimit = __turbopack_context__.r(
      '[project]/node_modules/@babel/runtime/helpers/iterableToArrayLimit.js [app-client] (ecmascript)'
    );
    var unsupportedIterableToArray = __turbopack_context__.r(
      '[project]/node_modules/@babel/runtime/helpers/unsupportedIterableToArray.js [app-client] (ecmascript)'
    );
    var nonIterableRest = __turbopack_context__.r(
      '[project]/node_modules/@babel/runtime/helpers/nonIterableRest.js [app-client] (ecmascript)'
    );
    function _slicedToArray(r, e) {
      return (
        arrayWithHoles(r) ||
        iterableToArrayLimit(r, e) ||
        unsupportedIterableToArray(r, e) ||
        nonIterableRest()
      );
    }
    (module.exports = _slicedToArray),
      (module.exports.__esModule = true),
      (module.exports['default'] = module.exports);
  },
  '[project]/node_modules/@babel/runtime/helpers/classCallCheck.js [app-client] (ecmascript)',
  (__turbopack_context__, module, exports) => {
    function _classCallCheck(a, n) {
      if (!(a instanceof n)) throw new TypeError('Cannot call a class as a function');
    }
    (module.exports = _classCallCheck),
      (module.exports.__esModule = true),
      (module.exports['default'] = module.exports);
  },
  '[project]/node_modules/@babel/runtime/helpers/createClass.js [app-client] (ecmascript)',
  (__turbopack_context__, module, exports) => {
    var toPropertyKey = __turbopack_context__.r(
      '[project]/node_modules/@babel/runtime/helpers/toPropertyKey.js [app-client] (ecmascript)'
    );
    function _defineProperties(e, r) {
      for (var t = 0; t < r.length; t++) {
        var o = r[t];
        (o.enumerable = o.enumerable || !1),
          (o.configurable = !0),
          'value' in o && (o.writable = !0),
          Object.defineProperty(e, toPropertyKey(o.key), o);
      }
    }
    function _createClass(e, r, t) {
      return (
        r && _defineProperties(e.prototype, r),
        t && _defineProperties(e, t),
        Object.defineProperty(e, 'prototype', {
          writable: !1,
        }),
        e
      );
    }
    (module.exports = _createClass),
      (module.exports.__esModule = true),
      (module.exports['default'] = module.exports);
  },
  '[project]/node_modules/@babel/runtime/helpers/assertThisInitialized.js [app-client] (ecmascript)',
  (__turbopack_context__, module, exports) => {
    function _assertThisInitialized(e) {
      if (void 0 === e)
        throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
      return e;
    }
    (module.exports = _assertThisInitialized),
      (module.exports.__esModule = true),
      (module.exports['default'] = module.exports);
  },
  '[project]/node_modules/@babel/runtime/helpers/possibleConstructorReturn.js [app-client] (ecmascript)',
  (__turbopack_context__, module, exports) => {
    var _typeof = __turbopack_context__.r(
      '[project]/node_modules/@babel/runtime/helpers/typeof.js [app-client] (ecmascript)'
    )['default'];
    var assertThisInitialized = __turbopack_context__.r(
      '[project]/node_modules/@babel/runtime/helpers/assertThisInitialized.js [app-client] (ecmascript)'
    );
    function _possibleConstructorReturn(t, e) {
      if (e && ('object' == _typeof(e) || 'function' == typeof e)) return e;
      if (void 0 !== e)
        throw new TypeError('Derived constructors may only return object or undefined');
      return assertThisInitialized(t);
    }
    (module.exports = _possibleConstructorReturn),
      (module.exports.__esModule = true),
      (module.exports['default'] = module.exports);
  },
  '[project]/node_modules/@babel/runtime/helpers/getPrototypeOf.js [app-client] (ecmascript)',
  (__turbopack_context__, module, exports) => {
    function _getPrototypeOf(t) {
      return (
        (module.exports = _getPrototypeOf =
          Object.setPrototypeOf
            ? Object.getPrototypeOf.bind()
            : function (t) {
                return t.__proto__ || Object.getPrototypeOf(t);
              }),
        (module.exports.__esModule = true),
        (module.exports['default'] = module.exports),
        _getPrototypeOf(t)
      );
    }
    (module.exports = _getPrototypeOf),
      (module.exports.__esModule = true),
      (module.exports['default'] = module.exports);
  },
  '[project]/node_modules/@babel/runtime/helpers/setPrototypeOf.js [app-client] (ecmascript)',
  (__turbopack_context__, module, exports) => {
    function _setPrototypeOf(t, e) {
      return (
        (module.exports = _setPrototypeOf =
          Object.setPrototypeOf
            ? Object.setPrototypeOf.bind()
            : function (t, e) {
                return (t.__proto__ = e), t;
              }),
        (module.exports.__esModule = true),
        (module.exports['default'] = module.exports),
        _setPrototypeOf(t, e)
      );
    }
    (module.exports = _setPrototypeOf),
      (module.exports.__esModule = true),
      (module.exports['default'] = module.exports);
  },
  '[project]/node_modules/@babel/runtime/helpers/inherits.js [app-client] (ecmascript)',
  (__turbopack_context__, module, exports) => {
    var setPrototypeOf = __turbopack_context__.r(
      '[project]/node_modules/@babel/runtime/helpers/setPrototypeOf.js [app-client] (ecmascript)'
    );
    function _inherits(t, e) {
      if ('function' != typeof e && null !== e)
        throw new TypeError('Super expression must either be null or a function');
      (t.prototype = Object.create(e && e.prototype, {
        constructor: {
          value: t,
          writable: !0,
          configurable: !0,
        },
      })),
        Object.defineProperty(t, 'prototype', {
          writable: !1,
        }),
        e && setPrototypeOf(t, e);
    }
    (module.exports = _inherits),
      (module.exports.__esModule = true),
      (module.exports['default'] = module.exports);
  },
  '[project]/node_modules/@babel/runtime/helpers/isNativeFunction.js [app-client] (ecmascript)',
  (__turbopack_context__, module, exports) => {
    function _isNativeFunction(t) {
      try {
        return -1 !== Function.toString.call(t).indexOf('[native code]');
      } catch (n) {
        return 'function' == typeof t;
      }
    }
    (module.exports = _isNativeFunction),
      (module.exports.__esModule = true),
      (module.exports['default'] = module.exports);
  },
  '[project]/node_modules/@babel/runtime/helpers/isNativeReflectConstruct.js [app-client] (ecmascript)',
  (__turbopack_context__, module, exports) => {
    function _isNativeReflectConstruct() {
      try {
        var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
      } catch (t) {}
      return ((module.exports = _isNativeReflectConstruct =
        function _isNativeReflectConstruct() {
          return !!t;
        }),
      (module.exports.__esModule = true),
      (module.exports['default'] = module.exports))();
    }
    (module.exports = _isNativeReflectConstruct),
      (module.exports.__esModule = true),
      (module.exports['default'] = module.exports);
  },
  '[project]/node_modules/@babel/runtime/helpers/construct.js [app-client] (ecmascript)',
  (__turbopack_context__, module, exports) => {
    var isNativeReflectConstruct = __turbopack_context__.r(
      '[project]/node_modules/@babel/runtime/helpers/isNativeReflectConstruct.js [app-client] (ecmascript)'
    );
    var setPrototypeOf = __turbopack_context__.r(
      '[project]/node_modules/@babel/runtime/helpers/setPrototypeOf.js [app-client] (ecmascript)'
    );
    function _construct(t, e, r) {
      if (isNativeReflectConstruct()) return Reflect.construct.apply(null, arguments);
      var o = [null];
      o.push.apply(o, e);
      var p = new (t.bind.apply(t, o))();
      return r && setPrototypeOf(p, r.prototype), p;
    }
    (module.exports = _construct),
      (module.exports.__esModule = true),
      (module.exports['default'] = module.exports);
  },
  '[project]/node_modules/@babel/runtime/helpers/wrapNativeSuper.js [app-client] (ecmascript)',
  (__turbopack_context__, module, exports) => {
    var getPrototypeOf = __turbopack_context__.r(
      '[project]/node_modules/@babel/runtime/helpers/getPrototypeOf.js [app-client] (ecmascript)'
    );
    var setPrototypeOf = __turbopack_context__.r(
      '[project]/node_modules/@babel/runtime/helpers/setPrototypeOf.js [app-client] (ecmascript)'
    );
    var isNativeFunction = __turbopack_context__.r(
      '[project]/node_modules/@babel/runtime/helpers/isNativeFunction.js [app-client] (ecmascript)'
    );
    var construct = __turbopack_context__.r(
      '[project]/node_modules/@babel/runtime/helpers/construct.js [app-client] (ecmascript)'
    );
    function _wrapNativeSuper(t) {
      var r = 'function' == typeof Map ? new Map() : void 0;
      return (
        (module.exports = _wrapNativeSuper =
          function _wrapNativeSuper(t) {
            if (null === t || !isNativeFunction(t)) return t;
            if ('function' != typeof t)
              throw new TypeError('Super expression must either be null or a function');
            if (void 0 !== r) {
              if (r.has(t)) return r.get(t);
              r.set(t, Wrapper);
            }
            function Wrapper() {
              return construct(t, arguments, getPrototypeOf(this).constructor);
            }
            return (
              (Wrapper.prototype = Object.create(t.prototype, {
                constructor: {
                  value: Wrapper,
                  enumerable: !1,
                  writable: !0,
                  configurable: !0,
                },
              })),
              setPrototypeOf(Wrapper, t)
            );
          }),
        (module.exports.__esModule = true),
        (module.exports['default'] = module.exports),
        _wrapNativeSuper(t)
      );
    }
    (module.exports = _wrapNativeSuper),
      (module.exports.__esModule = true),
      (module.exports['default'] = module.exports);
  },
  '[project]/node_modules/next-auth/core/errors.js [app-client] (ecmascript)',
  (__turbopack_context__, module, exports) => {
    'use strict';

    var _interopRequireDefault = __turbopack_context__.r(
      '[project]/node_modules/@babel/runtime/helpers/interopRequireDefault.js [app-client] (ecmascript)'
    );
    Object.defineProperty(exports, '__esModule', {
      value: true,
    });
    exports.UnsupportedStrategy =
      exports.UnknownError =
      exports.OAuthCallbackError =
      exports.MissingSecret =
      exports.MissingAuthorize =
      exports.MissingAdapterMethods =
      exports.MissingAdapter =
      exports.MissingAPIRoute =
      exports.InvalidCallbackUrl =
      exports.AccountNotLinkedError =
        void 0;
    exports.adapterErrorHandler = adapterErrorHandler;
    exports.capitalize = capitalize;
    exports.eventsErrorHandler = eventsErrorHandler;
    exports.upperSnake = upperSnake;
    var _regenerator = _interopRequireDefault(
      __turbopack_context__.r(
        '[project]/node_modules/@babel/runtime/regenerator/index.js [app-client] (ecmascript)'
      )
    );
    var _asyncToGenerator2 = _interopRequireDefault(
      __turbopack_context__.r(
        '[project]/node_modules/@babel/runtime/helpers/asyncToGenerator.js [app-client] (ecmascript)'
      )
    );
    var _defineProperty2 = _interopRequireDefault(
      __turbopack_context__.r(
        '[project]/node_modules/@babel/runtime/helpers/defineProperty.js [app-client] (ecmascript)'
      )
    );
    var _classCallCheck2 = _interopRequireDefault(
      __turbopack_context__.r(
        '[project]/node_modules/@babel/runtime/helpers/classCallCheck.js [app-client] (ecmascript)'
      )
    );
    var _createClass2 = _interopRequireDefault(
      __turbopack_context__.r(
        '[project]/node_modules/@babel/runtime/helpers/createClass.js [app-client] (ecmascript)'
      )
    );
    var _possibleConstructorReturn2 = _interopRequireDefault(
      __turbopack_context__.r(
        '[project]/node_modules/@babel/runtime/helpers/possibleConstructorReturn.js [app-client] (ecmascript)'
      )
    );
    var _getPrototypeOf2 = _interopRequireDefault(
      __turbopack_context__.r(
        '[project]/node_modules/@babel/runtime/helpers/getPrototypeOf.js [app-client] (ecmascript)'
      )
    );
    var _inherits2 = _interopRequireDefault(
      __turbopack_context__.r(
        '[project]/node_modules/@babel/runtime/helpers/inherits.js [app-client] (ecmascript)'
      )
    );
    var _wrapNativeSuper2 = _interopRequireDefault(
      __turbopack_context__.r(
        '[project]/node_modules/@babel/runtime/helpers/wrapNativeSuper.js [app-client] (ecmascript)'
      )
    );
    function _callSuper(t, o, e) {
      return (
        (o = (0, _getPrototypeOf2.default)(o)),
        (0, _possibleConstructorReturn2.default)(
          t,
          _isNativeReflectConstruct()
            ? Reflect.construct(o, e || [], (0, _getPrototypeOf2.default)(t).constructor)
            : o.apply(t, e)
        )
      );
    }
    function _isNativeReflectConstruct() {
      try {
        var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
      } catch (t) {}
      return (_isNativeReflectConstruct = function _isNativeReflectConstruct() {
        return !!t;
      })();
    }
    var UnknownError = (exports.UnknownError = (function (_Error) {
      function UnknownError(error) {
        var _message;
        var _this;
        (0, _classCallCheck2.default)(this, UnknownError);
        _this = _callSuper(this, UnknownError, [
          (_message = error === null || error === void 0 ? void 0 : error.message) !== null &&
          _message !== void 0
            ? _message
            : error,
        ]);
        _this.name = 'UnknownError';
        _this.code = error.code;
        if (error instanceof Error) {
          _this.stack = error.stack;
        }
        return _this;
      }
      (0, _inherits2.default)(UnknownError, _Error);
      return (0, _createClass2.default)(UnknownError, [
        {
          key: 'toJSON',
          value: function toJSON() {
            return {
              name: this.name,
              message: this.message,
              stack: this.stack,
            };
          },
        },
      ]);
    })((0, _wrapNativeSuper2.default)(Error)));
    var OAuthCallbackError = (exports.OAuthCallbackError = (function (_UnknownError) {
      function OAuthCallbackError() {
        var _this2;
        (0, _classCallCheck2.default)(this, OAuthCallbackError);
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }
        _this2 = _callSuper(this, OAuthCallbackError, [].concat(args));
        (0, _defineProperty2.default)(_this2, 'name', 'OAuthCallbackError');
        return _this2;
      }
      (0, _inherits2.default)(OAuthCallbackError, _UnknownError);
      return (0, _createClass2.default)(OAuthCallbackError);
    })(UnknownError));
    var AccountNotLinkedError = (exports.AccountNotLinkedError = (function (_UnknownError2) {
      function AccountNotLinkedError() {
        var _this3;
        (0, _classCallCheck2.default)(this, AccountNotLinkedError);
        for (
          var _len2 = arguments.length, args = new Array(_len2), _key2 = 0;
          _key2 < _len2;
          _key2++
        ) {
          args[_key2] = arguments[_key2];
        }
        _this3 = _callSuper(this, AccountNotLinkedError, [].concat(args));
        (0, _defineProperty2.default)(_this3, 'name', 'AccountNotLinkedError');
        return _this3;
      }
      (0, _inherits2.default)(AccountNotLinkedError, _UnknownError2);
      return (0, _createClass2.default)(AccountNotLinkedError);
    })(UnknownError));
    var MissingAPIRoute = (exports.MissingAPIRoute = (function (_UnknownError3) {
      function MissingAPIRoute() {
        var _this4;
        (0, _classCallCheck2.default)(this, MissingAPIRoute);
        for (
          var _len3 = arguments.length, args = new Array(_len3), _key3 = 0;
          _key3 < _len3;
          _key3++
        ) {
          args[_key3] = arguments[_key3];
        }
        _this4 = _callSuper(this, MissingAPIRoute, [].concat(args));
        (0, _defineProperty2.default)(_this4, 'name', 'MissingAPIRouteError');
        (0, _defineProperty2.default)(_this4, 'code', 'MISSING_NEXTAUTH_API_ROUTE_ERROR');
        return _this4;
      }
      (0, _inherits2.default)(MissingAPIRoute, _UnknownError3);
      return (0, _createClass2.default)(MissingAPIRoute);
    })(UnknownError));
    var MissingSecret = (exports.MissingSecret = (function (_UnknownError4) {
      function MissingSecret() {
        var _this5;
        (0, _classCallCheck2.default)(this, MissingSecret);
        for (
          var _len4 = arguments.length, args = new Array(_len4), _key4 = 0;
          _key4 < _len4;
          _key4++
        ) {
          args[_key4] = arguments[_key4];
        }
        _this5 = _callSuper(this, MissingSecret, [].concat(args));
        (0, _defineProperty2.default)(_this5, 'name', 'MissingSecretError');
        (0, _defineProperty2.default)(_this5, 'code', 'NO_SECRET');
        return _this5;
      }
      (0, _inherits2.default)(MissingSecret, _UnknownError4);
      return (0, _createClass2.default)(MissingSecret);
    })(UnknownError));
    var MissingAuthorize = (exports.MissingAuthorize = (function (_UnknownError5) {
      function MissingAuthorize() {
        var _this6;
        (0, _classCallCheck2.default)(this, MissingAuthorize);
        for (
          var _len5 = arguments.length, args = new Array(_len5), _key5 = 0;
          _key5 < _len5;
          _key5++
        ) {
          args[_key5] = arguments[_key5];
        }
        _this6 = _callSuper(this, MissingAuthorize, [].concat(args));
        (0, _defineProperty2.default)(_this6, 'name', 'MissingAuthorizeError');
        (0, _defineProperty2.default)(_this6, 'code', 'CALLBACK_CREDENTIALS_HANDLER_ERROR');
        return _this6;
      }
      (0, _inherits2.default)(MissingAuthorize, _UnknownError5);
      return (0, _createClass2.default)(MissingAuthorize);
    })(UnknownError));
    var MissingAdapter = (exports.MissingAdapter = (function (_UnknownError6) {
      function MissingAdapter() {
        var _this7;
        (0, _classCallCheck2.default)(this, MissingAdapter);
        for (
          var _len6 = arguments.length, args = new Array(_len6), _key6 = 0;
          _key6 < _len6;
          _key6++
        ) {
          args[_key6] = arguments[_key6];
        }
        _this7 = _callSuper(this, MissingAdapter, [].concat(args));
        (0, _defineProperty2.default)(_this7, 'name', 'MissingAdapterError');
        (0, _defineProperty2.default)(_this7, 'code', 'EMAIL_REQUIRES_ADAPTER_ERROR');
        return _this7;
      }
      (0, _inherits2.default)(MissingAdapter, _UnknownError6);
      return (0, _createClass2.default)(MissingAdapter);
    })(UnknownError));
    var MissingAdapterMethods = (exports.MissingAdapterMethods = (function (_UnknownError7) {
      function MissingAdapterMethods() {
        var _this8;
        (0, _classCallCheck2.default)(this, MissingAdapterMethods);
        for (
          var _len7 = arguments.length, args = new Array(_len7), _key7 = 0;
          _key7 < _len7;
          _key7++
        ) {
          args[_key7] = arguments[_key7];
        }
        _this8 = _callSuper(this, MissingAdapterMethods, [].concat(args));
        (0, _defineProperty2.default)(_this8, 'name', 'MissingAdapterMethodsError');
        (0, _defineProperty2.default)(_this8, 'code', 'MISSING_ADAPTER_METHODS_ERROR');
        return _this8;
      }
      (0, _inherits2.default)(MissingAdapterMethods, _UnknownError7);
      return (0, _createClass2.default)(MissingAdapterMethods);
    })(UnknownError));
    var UnsupportedStrategy = (exports.UnsupportedStrategy = (function (_UnknownError8) {
      function UnsupportedStrategy() {
        var _this9;
        (0, _classCallCheck2.default)(this, UnsupportedStrategy);
        for (
          var _len8 = arguments.length, args = new Array(_len8), _key8 = 0;
          _key8 < _len8;
          _key8++
        ) {
          args[_key8] = arguments[_key8];
        }
        _this9 = _callSuper(this, UnsupportedStrategy, [].concat(args));
        (0, _defineProperty2.default)(_this9, 'name', 'UnsupportedStrategyError');
        (0, _defineProperty2.default)(_this9, 'code', 'CALLBACK_CREDENTIALS_JWT_ERROR');
        return _this9;
      }
      (0, _inherits2.default)(UnsupportedStrategy, _UnknownError8);
      return (0, _createClass2.default)(UnsupportedStrategy);
    })(UnknownError));
    var InvalidCallbackUrl = (exports.InvalidCallbackUrl = (function (_UnknownError9) {
      function InvalidCallbackUrl() {
        var _this10;
        (0, _classCallCheck2.default)(this, InvalidCallbackUrl);
        for (
          var _len9 = arguments.length, args = new Array(_len9), _key9 = 0;
          _key9 < _len9;
          _key9++
        ) {
          args[_key9] = arguments[_key9];
        }
        _this10 = _callSuper(this, InvalidCallbackUrl, [].concat(args));
        (0, _defineProperty2.default)(_this10, 'name', 'InvalidCallbackUrl');
        (0, _defineProperty2.default)(_this10, 'code', 'INVALID_CALLBACK_URL_ERROR');
        return _this10;
      }
      (0, _inherits2.default)(InvalidCallbackUrl, _UnknownError9);
      return (0, _createClass2.default)(InvalidCallbackUrl);
    })(UnknownError));
    function upperSnake(s) {
      return s.replace(/([A-Z])/g, '_$1').toUpperCase();
    }
    function capitalize(s) {
      return ''.concat(s[0].toUpperCase()).concat(s.slice(1));
    }
    function eventsErrorHandler(methods, logger) {
      return Object.keys(methods).reduce(function (acc, name) {
        acc[name] = (0, _asyncToGenerator2.default)(
          _regenerator.default.mark(function _callee() {
            var method,
              _args = arguments;
            return _regenerator.default.wrap(
              function _callee$(_context) {
                while (1)
                  switch ((_context.prev = _context.next)) {
                    case 0:
                      _context.prev = 0;
                      method = methods[name];
                      _context.next = 4;
                      return method.apply(void 0, _args);
                    case 4:
                      return _context.abrupt('return', _context.sent);
                    case 7:
                      _context.prev = 7;
                      _context.t0 = _context['catch'](0);
                      logger.error(''.concat(upperSnake(name), '_EVENT_ERROR'), _context.t0);
                    case 10:
                    case 'end':
                      return _context.stop();
                  }
              },
              _callee,
              null,
              [[0, 7]]
            );
          })
        );
        return acc;
      }, {});
    }
    function adapterErrorHandler(adapter, logger) {
      if (!adapter) return;
      return Object.keys(adapter).reduce(function (acc, name) {
        acc[name] = (0, _asyncToGenerator2.default)(
          _regenerator.default.mark(function _callee2() {
            var _len10,
              args,
              _key10,
              method,
              e,
              _args2 = arguments;
            return _regenerator.default.wrap(
              function _callee2$(_context2) {
                while (1)
                  switch ((_context2.prev = _context2.next)) {
                    case 0:
                      _context2.prev = 0;
                      for (
                        _len10 = _args2.length, args = new Array(_len10), _key10 = 0;
                        _key10 < _len10;
                        _key10++
                      ) {
                        args[_key10] = _args2[_key10];
                      }
                      logger.debug('adapter_'.concat(name), {
                        args: args,
                      });
                      method = adapter[name];
                      _context2.next = 6;
                      return method.apply(void 0, args);
                    case 6:
                      return _context2.abrupt('return', _context2.sent);
                    case 9:
                      _context2.prev = 9;
                      _context2.t0 = _context2['catch'](0);
                      logger.error('adapter_error_'.concat(name), _context2.t0);
                      e = new UnknownError(_context2.t0);
                      e.name = ''.concat(capitalize(name), 'Error');
                      throw e;
                    case 15:
                    case 'end':
                      return _context2.stop();
                  }
              },
              _callee2,
              null,
              [[0, 9]]
            );
          })
        );
        return acc;
      }, {});
    }
  },
  '[project]/node_modules/next-auth/utils/logger.js [app-client] (ecmascript)',
  (__turbopack_context__, module, exports) => {
    'use strict';

    var _interopRequireDefault = __turbopack_context__.r(
      '[project]/node_modules/@babel/runtime/helpers/interopRequireDefault.js [app-client] (ecmascript)'
    );
    Object.defineProperty(exports, '__esModule', {
      value: true,
    });
    exports.default = void 0;
    exports.proxyLogger = proxyLogger;
    exports.setLogger = setLogger;
    var _regenerator = _interopRequireDefault(
      __turbopack_context__.r(
        '[project]/node_modules/@babel/runtime/regenerator/index.js [app-client] (ecmascript)'
      )
    );
    var _defineProperty2 = _interopRequireDefault(
      __turbopack_context__.r(
        '[project]/node_modules/@babel/runtime/helpers/defineProperty.js [app-client] (ecmascript)'
      )
    );
    var _asyncToGenerator2 = _interopRequireDefault(
      __turbopack_context__.r(
        '[project]/node_modules/@babel/runtime/helpers/asyncToGenerator.js [app-client] (ecmascript)'
      )
    );
    var _errors = __turbopack_context__.r(
      '[project]/node_modules/next-auth/core/errors.js [app-client] (ecmascript)'
    );
    function ownKeys(e, r) {
      var t = Object.keys(e);
      if (Object.getOwnPropertySymbols) {
        var o = Object.getOwnPropertySymbols(e);
        r &&
          (o = o.filter(function (r) {
            return Object.getOwnPropertyDescriptor(e, r).enumerable;
          })),
          t.push.apply(t, o);
      }
      return t;
    }
    function _objectSpread(e) {
      for (var r = 1; r < arguments.length; r++) {
        var t = null != arguments[r] ? arguments[r] : {};
        r % 2
          ? ownKeys(Object(t), !0).forEach(function (r) {
              (0, _defineProperty2.default)(e, r, t[r]);
            })
          : Object.getOwnPropertyDescriptors
            ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t))
            : ownKeys(Object(t)).forEach(function (r) {
                Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
              });
      }
      return e;
    }
    function formatError(o) {
      if (o instanceof Error && !(o instanceof _errors.UnknownError)) {
        return {
          message: o.message,
          stack: o.stack,
          name: o.name,
        };
      }
      if (hasErrorProperty(o)) {
        var _o$message;
        o.error = formatError(o.error);
        o.message =
          (_o$message = o.message) !== null && _o$message !== void 0 ? _o$message : o.error.message;
      }
      return o;
    }
    function hasErrorProperty(x) {
      return !!(x !== null && x !== void 0 && x.error);
    }
    var _logger = {
      error: function error(code, metadata) {
        metadata = formatError(metadata);
        console.error(
          '[next-auth][error]['.concat(code, ']'),
          '\nhttps://next-auth.js.org/errors#'.concat(code.toLowerCase()),
          metadata.message,
          metadata
        );
      },
      warn: function warn(code) {
        console.warn(
          '[next-auth][warn]['.concat(code, ']'),
          '\nhttps://next-auth.js.org/warnings#'.concat(code.toLowerCase())
        );
      },
      debug: function debug(code, metadata) {
        console.log('[next-auth][debug]['.concat(code, ']'), metadata);
      },
    };
    function setLogger() {
      var newLogger = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var debug = arguments.length > 1 ? arguments[1] : undefined;
      if (!debug) _logger.debug = function () {};
      if (newLogger.error) _logger.error = newLogger.error;
      if (newLogger.warn) _logger.warn = newLogger.warn;
      if (newLogger.debug) _logger.debug = newLogger.debug;
    }
    var _default = (exports.default = _logger);
    function proxyLogger() {
      var logger = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _logger;
      var basePath = arguments.length > 1 ? arguments[1] : undefined;
      try {
        if (typeof window === 'undefined') {
          return logger;
        }
        var clientLogger = {};
        var _loop = function _loop(level) {
          clientLogger[level] = (function () {
            var _ref = (0, _asyncToGenerator2.default)(
              _regenerator.default.mark(function _callee(code, metadata) {
                var url, body;
                return _regenerator.default.wrap(function _callee$(_context) {
                  while (1)
                    switch ((_context.prev = _context.next)) {
                      case 0:
                        _logger[level](code, metadata);
                        if (level === 'error') {
                          metadata = formatError(metadata);
                        }
                        metadata.client = true;
                        url = ''.concat(basePath, '/_log');
                        body = new URLSearchParams(
                          _objectSpread(
                            {
                              level: level,
                              code: code,
                            },
                            metadata
                          )
                        );
                        if (!navigator.sendBeacon) {
                          _context.next = 8;
                          break;
                        }
                        return _context.abrupt('return', navigator.sendBeacon(url, body));
                      case 8:
                        _context.next = 10;
                        return fetch(url, {
                          method: 'POST',
                          body: body,
                          keepalive: true,
                        });
                      case 10:
                        return _context.abrupt('return', _context.sent);
                      case 11:
                      case 'end':
                        return _context.stop();
                    }
                }, _callee);
              })
            );
            return function (_x, _x2) {
              return _ref.apply(this, arguments);
            };
          })();
        };
        for (var level in logger) {
          _loop(level);
        }
        return clientLogger;
      } catch (_unused) {
        return _logger;
      }
    }
  },
  '[project]/node_modules/next-auth/utils/parse-url.js [app-client] (ecmascript)',
  (__turbopack_context__, module, exports) => {
    'use strict';

    Object.defineProperty(exports, '__esModule', {
      value: true,
    });
    exports.default = parseUrl;
    function parseUrl(url) {
      var _url2;
      const defaultUrl = new URL('http://localhost:3000/api/auth');
      if (url && !url.startsWith('http')) {
        url = `https://${url}`;
      }
      const _url = new URL((_url2 = url) !== null && _url2 !== void 0 ? _url2 : defaultUrl);
      const path = (_url.pathname === '/' ? defaultUrl.pathname : _url.pathname).replace(/\/$/, '');
      const base = `${_url.origin}${path}`;
      return {
        origin: _url.origin,
        host: _url.host,
        path,
        base,
        toString: () => base,
      };
    }
  },
  '[project]/node_modules/next-auth/client/_utils.js [app-client] (ecmascript)',
  (__turbopack_context__, module, exports) => {
    'use strict';

    var _interopRequireDefault = __turbopack_context__.r(
      '[project]/node_modules/@babel/runtime/helpers/interopRequireDefault.js [app-client] (ecmascript)'
    );
    Object.defineProperty(exports, '__esModule', {
      value: true,
    });
    exports.BroadcastChannel = BroadcastChannel;
    exports.apiBaseUrl = apiBaseUrl;
    exports.fetchData = fetchData;
    exports.now = now;
    var _regenerator = _interopRequireDefault(
      __turbopack_context__.r(
        '[project]/node_modules/@babel/runtime/regenerator/index.js [app-client] (ecmascript)'
      )
    );
    var _defineProperty2 = _interopRequireDefault(
      __turbopack_context__.r(
        '[project]/node_modules/@babel/runtime/helpers/defineProperty.js [app-client] (ecmascript)'
      )
    );
    var _asyncToGenerator2 = _interopRequireDefault(
      __turbopack_context__.r(
        '[project]/node_modules/@babel/runtime/helpers/asyncToGenerator.js [app-client] (ecmascript)'
      )
    );
    function ownKeys(e, r) {
      var t = Object.keys(e);
      if (Object.getOwnPropertySymbols) {
        var o = Object.getOwnPropertySymbols(e);
        r &&
          (o = o.filter(function (r) {
            return Object.getOwnPropertyDescriptor(e, r).enumerable;
          })),
          t.push.apply(t, o);
      }
      return t;
    }
    function _objectSpread(e) {
      for (var r = 1; r < arguments.length; r++) {
        var t = null != arguments[r] ? arguments[r] : {};
        r % 2
          ? ownKeys(Object(t), !0).forEach(function (r) {
              (0, _defineProperty2.default)(e, r, t[r]);
            })
          : Object.getOwnPropertyDescriptors
            ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t))
            : ownKeys(Object(t)).forEach(function (r) {
                Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
              });
      }
      return e;
    }
    function fetchData(_x, _x2, _x3) {
      return _fetchData.apply(this, arguments);
    }
    function _fetchData() {
      _fetchData = (0, _asyncToGenerator2.default)(
        _regenerator.default.mark(function _callee(path, __NEXTAUTH, logger) {
          var _ref,
            ctx,
            _ref$req,
            req,
            url,
            _req$headers,
            options,
            res,
            data,
            _args = arguments;
          return _regenerator.default.wrap(
            function _callee$(_context) {
              while (1)
                switch ((_context.prev = _context.next)) {
                  case 0:
                    (_ref = _args.length > 3 && _args[3] !== undefined ? _args[3] : {}),
                      (ctx = _ref.ctx),
                      (_ref$req = _ref.req),
                      (req =
                        _ref$req === void 0
                          ? ctx === null || ctx === void 0
                            ? void 0
                            : ctx.req
                          : _ref$req);
                    url = ''.concat(apiBaseUrl(__NEXTAUTH), '/').concat(path);
                    _context.prev = 2;
                    options = {
                      headers: _objectSpread(
                        {
                          'Content-Type': 'application/json',
                        },
                        req !== null &&
                          req !== void 0 &&
                          (_req$headers = req.headers) !== null &&
                          _req$headers !== void 0 &&
                          _req$headers.cookie
                          ? {
                              cookie: req.headers.cookie,
                            }
                          : {}
                      ),
                    };
                    if (req !== null && req !== void 0 && req.body) {
                      options.body = JSON.stringify(req.body);
                      options.method = 'POST';
                    }
                    _context.next = 7;
                    return fetch(url, options);
                  case 7:
                    res = _context.sent;
                    _context.next = 10;
                    return res.json();
                  case 10:
                    data = _context.sent;
                    if (res.ok) {
                      _context.next = 13;
                      break;
                    }
                    throw data;
                  case 13:
                    return _context.abrupt('return', Object.keys(data).length > 0 ? data : null);
                  case 16:
                    _context.prev = 16;
                    _context.t0 = _context['catch'](2);
                    logger.error('CLIENT_FETCH_ERROR', {
                      error: _context.t0,
                      url: url,
                    });
                    return _context.abrupt('return', null);
                  case 20:
                  case 'end':
                    return _context.stop();
                }
            },
            _callee,
            null,
            [[2, 16]]
          );
        })
      );
      return _fetchData.apply(this, arguments);
    }
    function apiBaseUrl(__NEXTAUTH) {
      if (typeof window === 'undefined') {
        return ''.concat(__NEXTAUTH.baseUrlServer).concat(__NEXTAUTH.basePathServer);
      }
      return __NEXTAUTH.basePath;
    }
    function now() {
      return Math.floor(Date.now() / 1000);
    }
    function BroadcastChannel() {
      var name =
        arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'nextauth.message';
      return {
        receive: function receive(onReceive) {
          var handler = function handler(event) {
            var _event$newValue;
            if (event.key !== name) return;
            var message = JSON.parse(
              (_event$newValue = event.newValue) !== null && _event$newValue !== void 0
                ? _event$newValue
                : '{}'
            );
            if (
              (message === null || message === void 0 ? void 0 : message.event) !== 'session' ||
              !(message !== null && message !== void 0 && message.data)
            )
              return;
            onReceive(message);
          };
          window.addEventListener('storage', handler);
          return function () {
            return window.removeEventListener('storage', handler);
          };
        },
        post: function post(message) {
          if (typeof window === 'undefined') return;
          try {
            localStorage.setItem(
              name,
              JSON.stringify(
                _objectSpread(
                  _objectSpread({}, message),
                  {},
                  {
                    timestamp: now(),
                  }
                )
              )
            );
          } catch (_unused) {}
        },
      };
    }
  },
  '[project]/node_modules/next-auth/react/types.js [app-client] (ecmascript)',
  (__turbopack_context__, module, exports) => {
    'use strict';

    Object.defineProperty(exports, '__esModule', {
      value: true,
    });
  },
  '[project]/node_modules/next-auth/react/index.js [app-client] (ecmascript)',
  (__turbopack_context__, module, exports) => {
    'use strict';

    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      /*#__PURE__*/ __turbopack_context__.i(
        '[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)'
      );
    ('use strict');
    var _interopRequireDefault = __turbopack_context__.r(
      '[project]/node_modules/@babel/runtime/helpers/interopRequireDefault.js [app-client] (ecmascript)'
    );
    var _typeof = __turbopack_context__.r(
      '[project]/node_modules/@babel/runtime/helpers/typeof.js [app-client] (ecmascript)'
    );
    Object.defineProperty(exports, '__esModule', {
      value: true,
    });
    var _exportNames = {
      SessionContext: true,
      useSession: true,
      getSession: true,
      getCsrfToken: true,
      getProviders: true,
      signIn: true,
      signOut: true,
      SessionProvider: true,
    };
    exports.SessionContext = void 0;
    exports.SessionProvider = SessionProvider;
    exports.getCsrfToken = getCsrfToken;
    exports.getProviders = getProviders;
    exports.getSession = getSession;
    exports.signIn = signIn;
    exports.signOut = signOut;
    exports.useSession = useSession;
    var _regenerator = _interopRequireDefault(
      __turbopack_context__.r(
        '[project]/node_modules/@babel/runtime/regenerator/index.js [app-client] (ecmascript)'
      )
    );
    var _defineProperty2 = _interopRequireDefault(
      __turbopack_context__.r(
        '[project]/node_modules/@babel/runtime/helpers/defineProperty.js [app-client] (ecmascript)'
      )
    );
    var _asyncToGenerator2 = _interopRequireDefault(
      __turbopack_context__.r(
        '[project]/node_modules/@babel/runtime/helpers/asyncToGenerator.js [app-client] (ecmascript)'
      )
    );
    var _slicedToArray2 = _interopRequireDefault(
      __turbopack_context__.r(
        '[project]/node_modules/@babel/runtime/helpers/slicedToArray.js [app-client] (ecmascript)'
      )
    );
    var React = _interopRequireWildcard(
      __turbopack_context__.r(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      )
    );
    var _logger2 = _interopRequireWildcard(
      __turbopack_context__.r(
        '[project]/node_modules/next-auth/utils/logger.js [app-client] (ecmascript)'
      )
    );
    var _parseUrl = _interopRequireDefault(
      __turbopack_context__.r(
        '[project]/node_modules/next-auth/utils/parse-url.js [app-client] (ecmascript)'
      )
    );
    var _utils = __turbopack_context__.r(
      '[project]/node_modules/next-auth/client/_utils.js [app-client] (ecmascript)'
    );
    var _jsxRuntime = __turbopack_context__.r(
      '[project]/node_modules/next/dist/compiled/react/jsx-runtime.js [app-client] (ecmascript)'
    );
    var _types = __turbopack_context__.r(
      '[project]/node_modules/next-auth/react/types.js [app-client] (ecmascript)'
    );
    Object.keys(_types).forEach(function (key) {
      if (key === 'default' || key === '__esModule') return;
      if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
      if (key in exports && exports[key] === _types[key]) return;
      Object.defineProperty(exports, key, {
        enumerable: true,
        get: function get() {
          return _types[key];
        },
      });
    });
    var _process$env$NEXTAUTH,
      _ref,
      _process$env$NEXTAUTH2,
      _process$env$NEXTAUTH3,
      _React$createContext;
    function _getRequireWildcardCache(e) {
      if ('function' != typeof WeakMap) return null;
      var r = new WeakMap(),
        t = new WeakMap();
      return (_getRequireWildcardCache = function _getRequireWildcardCache(e) {
        return e ? t : r;
      })(e);
    }
    function _interopRequireWildcard(e, r) {
      if (!r && e && e.__esModule) return e;
      if (null === e || ('object' != _typeof(e) && 'function' != typeof e))
        return {
          default: e,
        };
      var t = _getRequireWildcardCache(r);
      if (t && t.has(e)) return t.get(e);
      var n = {
          __proto__: null,
        },
        a = Object.defineProperty && Object.getOwnPropertyDescriptor;
      for (var u in e)
        if ('default' !== u && {}.hasOwnProperty.call(e, u)) {
          var i = a ? Object.getOwnPropertyDescriptor(e, u) : null;
          i && (i.get || i.set) ? Object.defineProperty(n, u, i) : (n[u] = e[u]);
        }
      return (n.default = e), t && t.set(e, n), n;
    }
    function ownKeys(e, r) {
      var t = Object.keys(e);
      if (Object.getOwnPropertySymbols) {
        var o = Object.getOwnPropertySymbols(e);
        r &&
          (o = o.filter(function (r) {
            return Object.getOwnPropertyDescriptor(e, r).enumerable;
          })),
          t.push.apply(t, o);
      }
      return t;
    }
    function _objectSpread(e) {
      for (var r = 1; r < arguments.length; r++) {
        var t = null != arguments[r] ? arguments[r] : {};
        r % 2
          ? ownKeys(Object(t), !0).forEach(function (r) {
              (0, _defineProperty2.default)(e, r, t[r]);
            })
          : Object.getOwnPropertyDescriptors
            ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t))
            : ownKeys(Object(t)).forEach(function (r) {
                Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
              });
      }
      return e;
    }
    var __NEXTAUTH = {
      baseUrl: (0, _parseUrl.default)(
        (_process$env$NEXTAUTH =
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'default'
          ].env.NEXTAUTH_URL) !== null && _process$env$NEXTAUTH !== void 0
          ? _process$env$NEXTAUTH
          : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'default'
            ].env.VERCEL_URL
      ).origin,
      basePath: (0, _parseUrl.default)(
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'default'
        ].env.NEXTAUTH_URL
      ).path,
      baseUrlServer: (0, _parseUrl.default)(
        (_ref =
          (_process$env$NEXTAUTH2 =
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'default'
            ].env.NEXTAUTH_URL_INTERNAL) !== null && _process$env$NEXTAUTH2 !== void 0
            ? _process$env$NEXTAUTH2
            : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'default'
              ].env.NEXTAUTH_URL) !== null && _ref !== void 0
          ? _ref
          : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'default'
            ].env.VERCEL_URL
      ).origin,
      basePathServer: (0, _parseUrl.default)(
        (_process$env$NEXTAUTH3 =
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'default'
          ].env.NEXTAUTH_URL_INTERNAL) !== null && _process$env$NEXTAUTH3 !== void 0
          ? _process$env$NEXTAUTH3
          : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'default'
            ].env.NEXTAUTH_URL
      ).path,
      _lastSync: 0,
      _session: undefined,
      _getSession: function _getSession() {},
    };
    var broadcast = (0, _utils.BroadcastChannel)();
    var logger = (0, _logger2.proxyLogger)(_logger2.default, __NEXTAUTH.basePath);
    function useOnline() {
      var _React$useState = React.useState(
          typeof navigator !== 'undefined' ? navigator.onLine : false
        ),
        _React$useState2 = (0, _slicedToArray2.default)(_React$useState, 2),
        isOnline = _React$useState2[0],
        setIsOnline = _React$useState2[1];
      var setOnline = function setOnline() {
        return setIsOnline(true);
      };
      var setOffline = function setOffline() {
        return setIsOnline(false);
      };
      React.useEffect(
        {
          'useOnline.useEffect': function () {
            window.addEventListener('online', setOnline);
            window.addEventListener('offline', setOffline);
            return {
              'useOnline.useEffect': function () {
                window.removeEventListener('online', setOnline);
                window.removeEventListener('offline', setOffline);
              },
            }['useOnline.useEffect'];
          },
        }['useOnline.useEffect'],
        []
      );
      return isOnline;
    }
    var SessionContext = (exports.SessionContext =
      (_React$createContext = React.createContext) === null || _React$createContext === void 0
        ? void 0
        : _React$createContext.call(React, undefined));
    function useSession(options) {
      if (!SessionContext) {
        throw new Error('React Context is unavailable in Server Components');
      }
      var value = React.useContext(SessionContext);
      if (!value && ('TURBOPACK compile-time value', 'development') !== 'production') {
        throw new Error('[next-auth]: `useSession` must be wrapped in a <SessionProvider />');
      }
      var _ref2 = options !== null && options !== void 0 ? options : {},
        required = _ref2.required,
        onUnauthenticated = _ref2.onUnauthenticated;
      var requiredAndNotLoading = required && value.status === 'unauthenticated';
      React.useEffect(
        {
          'useSession.useEffect': function () {
            if (requiredAndNotLoading) {
              var url = '/api/auth/signin?'.concat(
                new URLSearchParams({
                  error: 'SessionRequired',
                  callbackUrl: window.location.href,
                })
              );
              if (onUnauthenticated) onUnauthenticated();
              else window.location.href = url;
            }
          },
        }['useSession.useEffect'],
        [requiredAndNotLoading, onUnauthenticated]
      );
      if (requiredAndNotLoading) {
        return {
          data: value.data,
          update: value.update,
          status: 'loading',
        };
      }
      return value;
    }
    function getSession(_x) {
      return _getSession2.apply(this, arguments);
    }
    function _getSession2() {
      _getSession2 = (0, _asyncToGenerator2.default)(
        _regenerator.default.mark(function _callee3(params) {
          var _params$broadcast;
          var session;
          return _regenerator.default.wrap(function _callee3$(_context3) {
            while (1)
              switch ((_context3.prev = _context3.next)) {
                case 0:
                  _context3.next = 2;
                  return (0, _utils.fetchData)('session', __NEXTAUTH, logger, params);
                case 2:
                  session = _context3.sent;
                  if (
                    (_params$broadcast =
                      params === null || params === void 0 ? void 0 : params.broadcast) !== null &&
                    _params$broadcast !== void 0
                      ? _params$broadcast
                      : true
                  ) {
                    broadcast.post({
                      event: 'session',
                      data: {
                        trigger: 'getSession',
                      },
                    });
                  }
                  return _context3.abrupt('return', session);
                case 5:
                case 'end':
                  return _context3.stop();
              }
          }, _callee3);
        })
      );
      return _getSession2.apply(this, arguments);
    }
    function getCsrfToken(_x2) {
      return _getCsrfToken.apply(this, arguments);
    }
    function _getCsrfToken() {
      _getCsrfToken = (0, _asyncToGenerator2.default)(
        _regenerator.default.mark(function _callee4(params) {
          var response;
          return _regenerator.default.wrap(function _callee4$(_context4) {
            while (1)
              switch ((_context4.prev = _context4.next)) {
                case 0:
                  _context4.next = 2;
                  return (0, _utils.fetchData)('csrf', __NEXTAUTH, logger, params);
                case 2:
                  response = _context4.sent;
                  return _context4.abrupt(
                    'return',
                    response === null || response === void 0 ? void 0 : response.csrfToken
                  );
                case 4:
                case 'end':
                  return _context4.stop();
              }
          }, _callee4);
        })
      );
      return _getCsrfToken.apply(this, arguments);
    }
    function getProviders() {
      return _getProviders.apply(this, arguments);
    }
    function _getProviders() {
      _getProviders = (0, _asyncToGenerator2.default)(
        _regenerator.default.mark(function _callee5() {
          return _regenerator.default.wrap(function _callee5$(_context5) {
            while (1)
              switch ((_context5.prev = _context5.next)) {
                case 0:
                  _context5.next = 2;
                  return (0, _utils.fetchData)('providers', __NEXTAUTH, logger);
                case 2:
                  return _context5.abrupt('return', _context5.sent);
                case 3:
                case 'end':
                  return _context5.stop();
              }
          }, _callee5);
        })
      );
      return _getProviders.apply(this, arguments);
    }
    function signIn(_x3, _x4, _x5) {
      return _signIn.apply(this, arguments);
    }
    function _signIn() {
      _signIn = (0, _asyncToGenerator2.default)(
        _regenerator.default.mark(function _callee6(provider, options, authorizationParams) {
          var _ref5,
            _ref5$callbackUrl,
            callbackUrl,
            _ref5$redirect,
            redirect,
            baseUrl,
            providers,
            isCredentials,
            isEmail,
            isSupportingReturn,
            signInUrl,
            _signInUrl,
            res,
            data,
            _data$url,
            url,
            error;
          return _regenerator.default.wrap(function _callee6$(_context6) {
            while (1)
              switch ((_context6.prev = _context6.next)) {
                case 0:
                  (_ref5 = options !== null && options !== void 0 ? options : {}),
                    (_ref5$callbackUrl = _ref5.callbackUrl),
                    (callbackUrl =
                      _ref5$callbackUrl === void 0 ? window.location.href : _ref5$callbackUrl),
                    (_ref5$redirect = _ref5.redirect),
                    (redirect = _ref5$redirect === void 0 ? true : _ref5$redirect);
                  baseUrl = (0, _utils.apiBaseUrl)(__NEXTAUTH);
                  _context6.next = 4;
                  return getProviders();
                case 4:
                  providers = _context6.sent;
                  if (providers) {
                    _context6.next = 8;
                    break;
                  }
                  window.location.href = ''.concat(baseUrl, '/error');
                  return _context6.abrupt('return');
                case 8:
                  if (!(!provider || !(provider in providers))) {
                    _context6.next = 11;
                    break;
                  }
                  window.location.href = ''.concat(baseUrl, '/signin?').concat(
                    new URLSearchParams({
                      callbackUrl: callbackUrl,
                    })
                  );
                  return _context6.abrupt('return');
                case 11:
                  isCredentials = providers[provider].type === 'credentials';
                  isEmail = providers[provider].type === 'email';
                  isSupportingReturn = isCredentials || isEmail;
                  signInUrl = ''
                    .concat(baseUrl, '/')
                    .concat(isCredentials ? 'callback' : 'signin', '/')
                    .concat(provider);
                  _signInUrl = ''
                    .concat(signInUrl)
                    .concat(
                      authorizationParams
                        ? '?'.concat(new URLSearchParams(authorizationParams))
                        : ''
                    );
                  _context6.t0 = fetch;
                  _context6.t1 = _signInUrl;
                  _context6.t2 = {
                    'Content-Type': 'application/x-www-form-urlencoded',
                  };
                  _context6.t3 = URLSearchParams;
                  _context6.t4 = _objectSpread;
                  _context6.t5 = _objectSpread({}, options);
                  _context6.t6 = {};
                  _context6.next = 25;
                  return getCsrfToken();
                case 25:
                  _context6.t7 = _context6.sent;
                  _context6.t8 = callbackUrl;
                  _context6.t9 = {
                    csrfToken: _context6.t7,
                    callbackUrl: _context6.t8,
                    json: true,
                  };
                  _context6.t10 = (0, _context6.t4)(_context6.t5, _context6.t6, _context6.t9);
                  _context6.t11 = new _context6.t3(_context6.t10);
                  _context6.t12 = {
                    method: 'post',
                    headers: _context6.t2,
                    body: _context6.t11,
                  };
                  _context6.next = 33;
                  return (0, _context6.t0)(_context6.t1, _context6.t12);
                case 33:
                  res = _context6.sent;
                  _context6.next = 36;
                  return res.json();
                case 36:
                  data = _context6.sent;
                  if (!(redirect || !isSupportingReturn)) {
                    _context6.next = 42;
                    break;
                  }
                  url =
                    (_data$url = data.url) !== null && _data$url !== void 0
                      ? _data$url
                      : callbackUrl;
                  window.location.href = url;
                  if (url.includes('#')) window.location.reload();
                  return _context6.abrupt('return');
                case 42:
                  error = new URL(data.url).searchParams.get('error');
                  if (!res.ok) {
                    _context6.next = 46;
                    break;
                  }
                  _context6.next = 46;
                  return __NEXTAUTH._getSession({
                    event: 'storage',
                  });
                case 46:
                  return _context6.abrupt('return', {
                    error: error,
                    status: res.status,
                    ok: res.ok,
                    url: error ? null : data.url,
                  });
                case 47:
                case 'end':
                  return _context6.stop();
              }
          }, _callee6);
        })
      );
      return _signIn.apply(this, arguments);
    }
    function signOut(_x6) {
      return _signOut.apply(this, arguments);
    }
    function _signOut() {
      _signOut = (0, _asyncToGenerator2.default)(
        _regenerator.default.mark(function _callee7(options) {
          var _options$redirect;
          var _ref6,
            _ref6$callbackUrl,
            callbackUrl,
            baseUrl,
            fetchOptions,
            res,
            data,
            _data$url2,
            url;
          return _regenerator.default.wrap(function _callee7$(_context7) {
            while (1)
              switch ((_context7.prev = _context7.next)) {
                case 0:
                  (_ref6 = options !== null && options !== void 0 ? options : {}),
                    (_ref6$callbackUrl = _ref6.callbackUrl),
                    (callbackUrl =
                      _ref6$callbackUrl === void 0 ? window.location.href : _ref6$callbackUrl);
                  baseUrl = (0, _utils.apiBaseUrl)(__NEXTAUTH);
                  _context7.t0 = {
                    'Content-Type': 'application/x-www-form-urlencoded',
                  };
                  _context7.t1 = URLSearchParams;
                  _context7.next = 6;
                  return getCsrfToken();
                case 6:
                  _context7.t2 = _context7.sent;
                  _context7.t3 = callbackUrl;
                  _context7.t4 = {
                    csrfToken: _context7.t2,
                    callbackUrl: _context7.t3,
                    json: true,
                  };
                  _context7.t5 = new _context7.t1(_context7.t4);
                  fetchOptions = {
                    method: 'post',
                    headers: _context7.t0,
                    body: _context7.t5,
                  };
                  _context7.next = 13;
                  return fetch(''.concat(baseUrl, '/signout'), fetchOptions);
                case 13:
                  res = _context7.sent;
                  _context7.next = 16;
                  return res.json();
                case 16:
                  data = _context7.sent;
                  broadcast.post({
                    event: 'session',
                    data: {
                      trigger: 'signout',
                    },
                  });
                  if (
                    !((_options$redirect =
                      options === null || options === void 0 ? void 0 : options.redirect) !==
                      null && _options$redirect !== void 0
                      ? _options$redirect
                      : true)
                  ) {
                    _context7.next = 23;
                    break;
                  }
                  url =
                    (_data$url2 = data.url) !== null && _data$url2 !== void 0
                      ? _data$url2
                      : callbackUrl;
                  window.location.href = url;
                  if (url.includes('#')) window.location.reload();
                  return _context7.abrupt('return');
                case 23:
                  _context7.next = 25;
                  return __NEXTAUTH._getSession({
                    event: 'storage',
                  });
                case 25:
                  return _context7.abrupt('return', data);
                case 26:
                case 'end':
                  return _context7.stop();
              }
          }, _callee7);
        })
      );
      return _signOut.apply(this, arguments);
    }
    function SessionProvider(props) {
      if (!SessionContext) {
        throw new Error('React Context is unavailable in Server Components');
      }
      var children = props.children,
        basePath = props.basePath,
        refetchInterval = props.refetchInterval,
        refetchWhenOffline = props.refetchWhenOffline;
      if (basePath) __NEXTAUTH.basePath = basePath;
      var hasInitialSession = props.session !== undefined;
      __NEXTAUTH._lastSync = hasInitialSession ? (0, _utils.now)() : 0;
      var _React$useState3 = React.useState(
          {
            'SessionProvider.useState[_React$useState3]': function () {
              if (hasInitialSession) __NEXTAUTH._session = props.session;
              return props.session;
            },
          }['SessionProvider.useState[_React$useState3]']
        ),
        _React$useState4 = (0, _slicedToArray2.default)(_React$useState3, 2),
        session = _React$useState4[0],
        setSession = _React$useState4[1];
      var _React$useState5 = React.useState(!hasInitialSession),
        _React$useState6 = (0, _slicedToArray2.default)(_React$useState5, 2),
        loading = _React$useState6[0],
        setLoading = _React$useState6[1];
      React.useEffect(
        {
          'SessionProvider.useEffect': function () {
            __NEXTAUTH._getSession = (0, _asyncToGenerator2.default)(
              _regenerator.default.mark(function _callee() {
                var _ref4,
                  event,
                  storageEvent,
                  _args = arguments;
                return _regenerator.default.wrap(
                  function _callee$(_context) {
                    while (1)
                      switch ((_context.prev = _context.next)) {
                        case 0:
                          (_ref4 = _args.length > 0 && _args[0] !== undefined ? _args[0] : {}),
                            (event = _ref4.event);
                          _context.prev = 1;
                          storageEvent = event === 'storage';
                          if (!(storageEvent || __NEXTAUTH._session === undefined)) {
                            _context.next = 10;
                            break;
                          }
                          __NEXTAUTH._lastSync = (0, _utils.now)();
                          _context.next = 7;
                          return getSession({
                            broadcast: !storageEvent,
                          });
                        case 7:
                          __NEXTAUTH._session = _context.sent;
                          setSession(__NEXTAUTH._session);
                          return _context.abrupt('return');
                        case 10:
                          if (
                            !(
                              !event ||
                              __NEXTAUTH._session === null ||
                              (0, _utils.now)() < __NEXTAUTH._lastSync
                            )
                          ) {
                            _context.next = 12;
                            break;
                          }
                          return _context.abrupt('return');
                        case 12:
                          __NEXTAUTH._lastSync = (0, _utils.now)();
                          _context.next = 15;
                          return getSession();
                        case 15:
                          __NEXTAUTH._session = _context.sent;
                          setSession(__NEXTAUTH._session);
                          _context.next = 22;
                          break;
                        case 19:
                          _context.prev = 19;
                          _context.t0 = _context['catch'](1);
                          logger.error('CLIENT_SESSION_ERROR', _context.t0);
                        case 22:
                          _context.prev = 22;
                          setLoading(false);
                          return _context.finish(22);
                        case 25:
                        case 'end':
                          return _context.stop();
                      }
                  },
                  _callee,
                  null,
                  [[1, 19, 22, 25]]
                );
              })
            );
            __NEXTAUTH._getSession();
            return {
              'SessionProvider.useEffect': function () {
                __NEXTAUTH._lastSync = 0;
                __NEXTAUTH._session = undefined;
                __NEXTAUTH._getSession = {
                  'SessionProvider.useEffect': function () {},
                }['SessionProvider.useEffect'];
              },
            }['SessionProvider.useEffect'];
          },
        }['SessionProvider.useEffect'],
        []
      );
      React.useEffect(
        {
          'SessionProvider.useEffect': function () {
            var unsubscribe = broadcast.receive(
              {
                'SessionProvider.useEffect.unsubscribe': function () {
                  return __NEXTAUTH._getSession({
                    event: 'storage',
                  });
                },
              }['SessionProvider.useEffect.unsubscribe']
            );
            return {
              'SessionProvider.useEffect': function () {
                return unsubscribe();
              },
            }['SessionProvider.useEffect'];
          },
        }['SessionProvider.useEffect'],
        []
      );
      React.useEffect(
        {
          'SessionProvider.useEffect': function () {
            var _props$refetchOnWindo = props.refetchOnWindowFocus,
              refetchOnWindowFocus =
                _props$refetchOnWindo === void 0 ? true : _props$refetchOnWindo;
            var visibilityHandler = function visibilityHandler() {
              if (refetchOnWindowFocus && document.visibilityState === 'visible')
                __NEXTAUTH._getSession({
                  event: 'visibilitychange',
                });
            };
            document.addEventListener('visibilitychange', visibilityHandler, false);
            return {
              'SessionProvider.useEffect': function () {
                return document.removeEventListener('visibilitychange', visibilityHandler, false);
              },
            }['SessionProvider.useEffect'];
          },
        }['SessionProvider.useEffect'],
        [props.refetchOnWindowFocus]
      );
      var isOnline = useOnline();
      var shouldRefetch = refetchWhenOffline !== false || isOnline;
      React.useEffect(
        {
          'SessionProvider.useEffect': function () {
            if (refetchInterval && shouldRefetch) {
              var refetchIntervalTimer = setInterval(
                {
                  'SessionProvider.useEffect.refetchIntervalTimer': function () {
                    if (__NEXTAUTH._session) {
                      __NEXTAUTH._getSession({
                        event: 'poll',
                      });
                    }
                  },
                }['SessionProvider.useEffect.refetchIntervalTimer'],
                refetchInterval * 1000
              );
              return {
                'SessionProvider.useEffect': function () {
                  return clearInterval(refetchIntervalTimer);
                },
              }['SessionProvider.useEffect'];
            }
          },
        }['SessionProvider.useEffect'],
        [refetchInterval, shouldRefetch]
      );
      var value = React.useMemo(
        {
          'SessionProvider.useMemo[value]': function () {
            return {
              data: session,
              status: loading ? 'loading' : session ? 'authenticated' : 'unauthenticated',
              update: function update(data) {
                return (0, _asyncToGenerator2.default)(
                  _regenerator.default.mark(function _callee2() {
                    var newSession;
                    return _regenerator.default.wrap(function _callee2$(_context2) {
                      while (1)
                        switch ((_context2.prev = _context2.next)) {
                          case 0:
                            if (!(loading || !session)) {
                              _context2.next = 2;
                              break;
                            }
                            return _context2.abrupt('return');
                          case 2:
                            setLoading(true);
                            _context2.t0 = _utils.fetchData;
                            _context2.t1 = __NEXTAUTH;
                            _context2.t2 = logger;
                            _context2.next = 8;
                            return getCsrfToken();
                          case 8:
                            _context2.t3 = _context2.sent;
                            _context2.t4 = data;
                            _context2.t5 = {
                              csrfToken: _context2.t3,
                              data: _context2.t4,
                            };
                            _context2.t6 = {
                              body: _context2.t5,
                            };
                            _context2.t7 = {
                              req: _context2.t6,
                            };
                            _context2.next = 15;
                            return (0, _context2.t0)(
                              'session',
                              _context2.t1,
                              _context2.t2,
                              _context2.t7
                            );
                          case 15:
                            newSession = _context2.sent;
                            setLoading(false);
                            if (newSession) {
                              setSession(newSession);
                              broadcast.post({
                                event: 'session',
                                data: {
                                  trigger: 'getSession',
                                },
                              });
                            }
                            return _context2.abrupt('return', newSession);
                          case 19:
                          case 'end':
                            return _context2.stop();
                        }
                    }, _callee2);
                  })
                )();
              },
            };
          },
        }['SessionProvider.useMemo[value]'],
        [session, loading]
      );
      return (0, _jsxRuntime.jsx)(SessionContext.Provider, {
        value: value,
        children: children,
      });
    }
  },
  '[project]/node_modules/next-themes/dist/index.mjs [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['ThemeProvider', () => J, 'useTheme', () => z]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    ('use client');
    var M = (e, i, s, u, m, a, l, h) => {
      let d = document.documentElement,
        w = ['light', 'dark'];
      function p(n) {
        (Array.isArray(e) ? e : [e]).forEach((y) => {
          let k = y === 'class',
            S = k && a ? m.map((f) => a[f] || f) : m;
          k
            ? (d.classList.remove(...S), d.classList.add(a && a[n] ? a[n] : n))
            : d.setAttribute(y, n);
        }),
          R(n);
      }
      function R(n) {
        h && w.includes(n) && (d.style.colorScheme = n);
      }
      function c() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      if (u) p(u);
      else
        try {
          let n = localStorage.getItem(i) || s,
            y = l && n === 'system' ? c() : n;
          p(y);
        } catch (n) {}
    };
    var b = ['light', 'dark'],
      I = '(prefers-color-scheme: dark)',
      O = typeof window == 'undefined',
      x =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'createContext'
        ](void 0),
      U = {
        setTheme: (e) => {},
        themes: [],
      },
      z = () => {
        var e;
        return (e =
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'useContext'
          ](x)) != null
          ? e
          : U;
      },
      J = (e) =>
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useContext'
        ](x)
          ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'createElement'
            ](
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'Fragment'
              ],
              null,
              e.children
            )
          : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'createElement'
            ](V, {
              ...e,
            }),
      N = ['light', 'dark'],
      V = ({
        forcedTheme: e,
        disableTransitionOnChange: i = !1,
        enableSystem: s = !0,
        enableColorScheme: u = !0,
        storageKey: m = 'theme',
        themes: a = N,
        defaultTheme: l = s ? 'system' : 'light',
        attribute: h = 'data-theme',
        value: d,
        children: w,
        nonce: p,
        scriptProps: R,
      }) => {
        let [c, n] =
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'useState'
            ](
              {
                'V.useState': () => H(m, l),
              }['V.useState']
            ),
          [T, y] =
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'useState'
            ](
              {
                'V.useState': () => (c === 'system' ? E() : c),
              }['V.useState']
            ),
          k = d ? Object.values(d) : a,
          S =
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'useCallback'
            ](
              {
                'V.useCallback[S]': (o) => {
                  let r = o;
                  if (!r) return;
                  o === 'system' && s && (r = E());
                  let v = d ? d[r] : r,
                    C = i ? W(p) : null,
                    P = document.documentElement,
                    L = {
                      'V.useCallback[S].L': (g) => {
                        g === 'class'
                          ? (P.classList.remove(...k), v && P.classList.add(v))
                          : g.startsWith('data-') &&
                            (v ? P.setAttribute(g, v) : P.removeAttribute(g));
                      },
                    }['V.useCallback[S].L'];
                  if ((Array.isArray(h) ? h.forEach(L) : L(h), u)) {
                    let g = b.includes(l) ? l : null,
                      D = b.includes(r) ? r : g;
                    P.style.colorScheme = D;
                  }
                  C == null || C();
                },
              }['V.useCallback[S]'],
              [p]
            ),
          f =
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'useCallback'
            ](
              {
                'V.useCallback[f]': (o) => {
                  let r = typeof o == 'function' ? o(c) : o;
                  n(r);
                  try {
                    localStorage.setItem(m, r);
                  } catch (v) {}
                },
              }['V.useCallback[f]'],
              [c]
            ),
          A =
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'useCallback'
            ](
              {
                'V.useCallback[A]': (o) => {
                  let r = E(o);
                  y(r), c === 'system' && s && !e && S('system');
                },
              }['V.useCallback[A]'],
              [c, e]
            );
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useEffect'
        ](
          {
            'V.useEffect': () => {
              let o = window.matchMedia(I);
              return (
                o.addListener(A),
                A(o),
                {
                  'V.useEffect': () => o.removeListener(A),
                }['V.useEffect']
              );
            },
          }['V.useEffect'],
          [A]
        ),
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'useEffect'
          ](
            {
              'V.useEffect': () => {
                let o = {
                  'V.useEffect.o': (r) => {
                    r.key === m && (r.newValue ? n(r.newValue) : f(l));
                  },
                }['V.useEffect.o'];
                return (
                  window.addEventListener('storage', o),
                  {
                    'V.useEffect': () => window.removeEventListener('storage', o),
                  }['V.useEffect']
                );
              },
            }['V.useEffect'],
            [f]
          ),
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'useEffect'
          ](
            {
              'V.useEffect': () => {
                S(e != null ? e : c);
              },
            }['V.useEffect'],
            [e, c]
          );
        let Q =
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'useMemo'
          ](
            {
              'V.useMemo[Q]': () => ({
                theme: c,
                setTheme: f,
                forcedTheme: e,
                resolvedTheme: c === 'system' ? T : c,
                themes: s ? [...a, 'system'] : a,
                systemTheme: s ? T : void 0,
              }),
            }['V.useMemo[Q]'],
            [c, f, e, T, s, a]
          );
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'createElement'
        ](
          x.Provider,
          {
            value: Q,
          },
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'createElement'
          ](_, {
            forcedTheme: e,
            storageKey: m,
            attribute: h,
            enableSystem: s,
            enableColorScheme: u,
            defaultTheme: l,
            value: d,
            themes: a,
            nonce: p,
            scriptProps: R,
          }),
          w
        );
      },
      _ =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'memo'
        ](
          ({
            forcedTheme: e,
            storageKey: i,
            attribute: s,
            enableSystem: u,
            enableColorScheme: m,
            defaultTheme: a,
            value: l,
            themes: h,
            nonce: d,
            scriptProps: w,
          }) => {
            let p = JSON.stringify([s, i, a, e, h, l, u, m]).slice(1, -1);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'createElement'
            ]('script', {
              ...w,
              suppressHydrationWarning: !0,
              nonce: typeof window == 'undefined' ? d : '',
              dangerouslySetInnerHTML: {
                __html: `(${M.toString()})(${p})`,
              },
            });
          }
        ),
      H = (e, i) => {
        if (O) return;
        let s;
        try {
          s = localStorage.getItem(e) || void 0;
        } catch (u) {}
        return s || i;
      },
      W = (e) => {
        let i = document.createElement('style');
        return (
          e && i.setAttribute('nonce', e),
          i.appendChild(
            document.createTextNode(
              '*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}'
            )
          ),
          document.head.appendChild(i),
          () => {
            window.getComputedStyle(document.body),
              setTimeout(() => {
                document.head.removeChild(i);
              }, 1);
          }
        );
      },
      E = (e) => (e || (e = window.matchMedia(I)), e.matches ? 'dark' : 'light');
  },
  '[project]/node_modules/@radix-ui/react-context/dist/index.mjs [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'createContext',
      () => createContext2,
      'createContextScope',
      () => createContextScope,
    ]);
    // packages/react/context/src/create-context.tsx
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-runtime.js [app-client] (ecmascript)'
      );
    function createContext2(rootComponentName, defaultContext) {
      const Context =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'createContext'
        ](defaultContext);
      const Provider = (props) => {
        const { children, ...context } = props;
        const value =
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'useMemo'
          ](
            {
              'createContext2.Provider.useMemo[value]': () => context,
            }['createContext2.Provider.useMemo[value]'],
            Object.values(context)
          );
        return /* @__PURE__ */ (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'jsx'
        ])(Context.Provider, {
          value,
          children,
        });
      };
      Provider.displayName = rootComponentName + 'Provider';
      function useContext2(consumerName) {
        const context =
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'useContext'
          ](Context);
        if (context) return context;
        if (defaultContext !== void 0) return defaultContext;
        throw new Error(`\`${consumerName}\` must be used within \`${rootComponentName}\``);
      }
      return [Provider, useContext2];
    }
    function createContextScope(scopeName, createContextScopeDeps = []) {
      let defaultContexts = [];
      function createContext3(rootComponentName, defaultContext) {
        const BaseContext =
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'createContext'
          ](defaultContext);
        const index = defaultContexts.length;
        defaultContexts = [...defaultContexts, defaultContext];
        const Provider = (props) => {
          const { scope, children, ...context } = props;
          const Context = scope?.[scopeName]?.[index] || BaseContext;
          const value =
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'useMemo'
            ](
              {
                'createContextScope.createContext3.Provider.useMemo[value]': () => context,
              }['createContextScope.createContext3.Provider.useMemo[value]'],
              Object.values(context)
            );
          return /* @__PURE__ */ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsx'
          ])(Context.Provider, {
            value,
            children,
          });
        };
        Provider.displayName = rootComponentName + 'Provider';
        function useContext2(consumerName, scope) {
          const Context = scope?.[scopeName]?.[index] || BaseContext;
          const context =
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'useContext'
            ](Context);
          if (context) return context;
          if (defaultContext !== void 0) return defaultContext;
          throw new Error(`\`${consumerName}\` must be used within \`${rootComponentName}\``);
        }
        return [Provider, useContext2];
      }
      const createScope = () => {
        const scopeContexts = defaultContexts.map((defaultContext) => {
          return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'createContext'
          ](defaultContext);
        });
        return function useScope(scope) {
          const contexts = scope?.[scopeName] || scopeContexts;
          return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'useMemo'
          ](
            {
              'createContextScope.createScope.useScope.useMemo': () => ({
                [`__scope${scopeName}`]: {
                  ...scope,
                  [scopeName]: contexts,
                },
              }),
            }['createContextScope.createScope.useScope.useMemo'],
            [scope, contexts]
          );
        };
      };
      createScope.scopeName = scopeName;
      return [createContext3, composeContextScopes(createScope, ...createContextScopeDeps)];
    }
    function composeContextScopes(...scopes) {
      const baseScope = scopes[0];
      if (scopes.length === 1) return baseScope;
      const createScope = () => {
        const scopeHooks = scopes.map((createScope2) => ({
          useScope: createScope2(),
          scopeName: createScope2.scopeName,
        }));
        return function useComposedScopes(overrideScopes) {
          const nextScopes = scopeHooks.reduce((nextScopes2, { useScope, scopeName }) => {
            const scopeProps = useScope(overrideScopes);
            const currentScope = scopeProps[`__scope${scopeName}`];
            return {
              ...nextScopes2,
              ...currentScope,
            };
          }, {});
          return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'useMemo'
          ](
            {
              'composeContextScopes.createScope.useComposedScopes.useMemo': () => ({
                [`__scope${baseScope.scopeName}`]: nextScopes,
              }),
            }['composeContextScopes.createScope.useComposedScopes.useMemo'],
            [nextScopes]
          );
        };
      };
      createScope.scopeName = baseScope.scopeName;
      return createScope;
    }
    //# sourceMappingURL=index.mjs.map
  },
  '[project]/node_modules/@radix-ui/react-compose-refs/dist/index.mjs [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'composeRefs',
      () => composeRefs,
      'useComposedRefs',
      () => useComposedRefs,
    ]);
    // packages/react/compose-refs/src/compose-refs.tsx
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    function setRef(ref, value) {
      if (typeof ref === 'function') {
        return ref(value);
      } else if (ref !== null && ref !== void 0) {
        ref.current = value;
      }
    }
    function composeRefs(...refs) {
      return (node) => {
        let hasCleanup = false;
        const cleanups = refs.map((ref) => {
          const cleanup = setRef(ref, node);
          if (!hasCleanup && typeof cleanup == 'function') {
            hasCleanup = true;
          }
          return cleanup;
        });
        if (hasCleanup) {
          return () => {
            for (let i = 0; i < cleanups.length; i++) {
              const cleanup = cleanups[i];
              if (typeof cleanup == 'function') {
                cleanup();
              } else {
                setRef(refs[i], null);
              }
            }
          };
        }
      };
    }
    function useComposedRefs(...refs) {
      return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useCallback'
      ](composeRefs(...refs), refs);
    }
    //# sourceMappingURL=index.mjs.map
  },
  '[project]/apps/frontend/node_modules/@radix-ui/react-compose-refs/dist/index.mjs [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'composeRefs',
      () => composeRefs,
      'useComposedRefs',
      () => useComposedRefs,
    ]);
    // packages/react/compose-refs/src/composeRefs.tsx
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    function setRef(ref, value) {
      if (typeof ref === 'function') {
        return ref(value);
      } else if (ref !== null && ref !== void 0) {
        ref.current = value;
      }
    }
    function composeRefs(...refs) {
      return (node) => {
        let hasCleanup = false;
        const cleanups = refs.map((ref) => {
          const cleanup = setRef(ref, node);
          if (!hasCleanup && typeof cleanup == 'function') {
            hasCleanup = true;
          }
          return cleanup;
        });
        if (hasCleanup) {
          return () => {
            for (let i = 0; i < cleanups.length; i++) {
              const cleanup = cleanups[i];
              if (typeof cleanup == 'function') {
                cleanup();
              } else {
                setRef(refs[i], null);
              }
            }
          };
        }
      };
    }
    function useComposedRefs(...refs) {
      return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useCallback'
      ](composeRefs(...refs), refs);
    }
    //# sourceMappingURL=index.mjs.map
  },
  '[project]/node_modules/@radix-ui/primitive/dist/index.mjs [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'canUseDOM',
      () => canUseDOM,
      'composeEventHandlers',
      () => composeEventHandlers,
      'getActiveElement',
      () => getActiveElement,
      'getOwnerDocument',
      () => getOwnerDocument,
      'getOwnerWindow',
      () => getOwnerWindow,
      'isFrame',
      () => isFrame,
    ]);
    // src/primitive.tsx
    var canUseDOM = !!(
      typeof window !== 'undefined' &&
      window.document &&
      window.document.createElement
    );
    function composeEventHandlers(
      originalEventHandler,
      ourEventHandler,
      { checkForDefaultPrevented = true } = {}
    ) {
      return function handleEvent(event) {
        originalEventHandler?.(event);
        if (checkForDefaultPrevented === false || !event.defaultPrevented) {
          return ourEventHandler?.(event);
        }
      };
    }
    function getOwnerWindow(element) {
      if (!canUseDOM) {
        throw new Error('Cannot access window outside of the DOM');
      }
      return element?.ownerDocument?.defaultView ?? window;
    }
    function getOwnerDocument(element) {
      if (!canUseDOM) {
        throw new Error('Cannot access document outside of the DOM');
      }
      return element?.ownerDocument ?? document;
    }
    function getActiveElement(node, activeDescendant = false) {
      const { activeElement } = getOwnerDocument(node);
      if (!activeElement?.nodeName) {
        return null;
      }
      if (isFrame(activeElement) && activeElement.contentDocument) {
        return getActiveElement(activeElement.contentDocument.body, activeDescendant);
      }
      if (activeDescendant) {
        const id = activeElement.getAttribute('aria-activedescendant');
        if (id) {
          const element = getOwnerDocument(activeElement).getElementById(id);
          if (element) {
            return element;
          }
        }
      }
      return activeElement;
    }
    function isFrame(element) {
      return element.tagName === 'IFRAME';
    }
    //# sourceMappingURL=index.mjs.map
  },
  '[project]/node_modules/@radix-ui/react-use-layout-effect/dist/index.mjs [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['useLayoutEffect', () => useLayoutEffect2]);
    // packages/react/use-layout-effect/src/use-layout-effect.tsx
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var useLayoutEffect2 = globalThis?.document
      ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useLayoutEffect'
        ]
      : () => {};
    //# sourceMappingURL=index.mjs.map
  },
  '[project]/node_modules/@radix-ui/react-id/dist/index.mjs [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['useId', () => useId]);
    // packages/react/id/src/id.tsx
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$use$2d$layout$2d$effect$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-use-layout-effect/dist/index.mjs [app-client] (ecmascript)'
      );
    var useReactId =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        ' useId '.trim().toString()
      ] || (() => void 0);
    var count = 0;
    function useId(deterministicId) {
      const [id, setId] =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__.useState(
          useReactId()
        );
      (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$use$2d$layout$2d$effect$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useLayoutEffect'
      ])(
        {
          'useId.useLayoutEffect': () => {
            if (!deterministicId)
              setId(
                {
                  'useId.useLayoutEffect': (reactId) => reactId ?? String(count++),
                }['useId.useLayoutEffect']
              );
          },
        }['useId.useLayoutEffect'],
        [deterministicId]
      );
      return deterministicId || (id ? `radix-${id}` : '');
    }
    //# sourceMappingURL=index.mjs.map
  },
  '[project]/node_modules/@radix-ui/react-use-effect-event/dist/index.mjs [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['useEffectEvent', () => useEffectEvent]);
    // src/use-effect-event.tsx
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$use$2d$layout$2d$effect$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-use-layout-effect/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var useReactEffectEvent =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        ' useEffectEvent '.trim().toString()
      ];
    var useReactInsertionEffect =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        ' useInsertionEffect '.trim().toString()
      ];
    function useEffectEvent(callback) {
      if (typeof useReactEffectEvent === 'function') {
        return useReactEffectEvent(callback);
      }
      const ref =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__.useRef(
          {
            'useEffectEvent.useRef[ref]': () => {
              throw new Error('Cannot call an event handler while rendering.');
            },
          }['useEffectEvent.useRef[ref]']
        );
      if (typeof useReactInsertionEffect === 'function') {
        useReactInsertionEffect(
          {
            'useEffectEvent.useReactInsertionEffect': () => {
              ref.current = callback;
            },
          }['useEffectEvent.useReactInsertionEffect']
        );
      } else {
        (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$use$2d$layout$2d$effect$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useLayoutEffect'
        ])(
          {
            'useEffectEvent.useLayoutEffect': () => {
              ref.current = callback;
            },
          }['useEffectEvent.useLayoutEffect']
        );
      }
      return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__.useMemo(
        {
          'useEffectEvent.useMemo': () =>
            ({
              'useEffectEvent.useMemo': (...args) => ref.current?.(...args),
            })['useEffectEvent.useMemo'],
        }['useEffectEvent.useMemo'],
        []
      );
    }
    //# sourceMappingURL=index.mjs.map
  },
  '[project]/node_modules/@radix-ui/react-use-controllable-state/dist/index.mjs [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'useControllableState',
      () => useControllableState,
      'useControllableStateReducer',
      () => useControllableStateReducer,
    ]);
    // src/use-controllable-state.tsx
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$use$2d$layout$2d$effect$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-use-layout-effect/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$use$2d$effect$2d$event$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-use-effect-event/dist/index.mjs [app-client] (ecmascript)'
      );
    var useInsertionEffect =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        ' useInsertionEffect '.trim().toString()
      ] ||
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$use$2d$layout$2d$effect$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useLayoutEffect'
      ];
    function useControllableState({ prop, defaultProp, onChange = () => {}, caller }) {
      const [uncontrolledProp, setUncontrolledProp, onChangeRef] = useUncontrolledState({
        defaultProp,
        onChange,
      });
      const isControlled = prop !== void 0;
      const value = isControlled ? prop : uncontrolledProp;
      if (('TURBOPACK compile-time truthy', 1)) {
        const isControlledRef =
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__.useRef(
            prop !== void 0
          );
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__.useEffect(
          {
            'useControllableState.useEffect': () => {
              const wasControlled = isControlledRef.current;
              if (wasControlled !== isControlled) {
                const from = wasControlled ? 'controlled' : 'uncontrolled';
                const to = isControlled ? 'controlled' : 'uncontrolled';
                console.warn(
                  `${caller} is changing from ${from} to ${to}. Components should not switch from controlled to uncontrolled (or vice versa). Decide between using a controlled or uncontrolled value for the lifetime of the component.`
                );
              }
              isControlledRef.current = isControlled;
            },
          }['useControllableState.useEffect'],
          [isControlled, caller]
        );
      }
      const setValue =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__.useCallback(
          {
            'useControllableState.useCallback[setValue]': (nextValue) => {
              if (isControlled) {
                const value2 = isFunction(nextValue) ? nextValue(prop) : nextValue;
                if (value2 !== prop) {
                  onChangeRef.current?.(value2);
                }
              } else {
                setUncontrolledProp(nextValue);
              }
            },
          }['useControllableState.useCallback[setValue]'],
          [isControlled, prop, setUncontrolledProp, onChangeRef]
        );
      return [value, setValue];
    }
    function useUncontrolledState({ defaultProp, onChange }) {
      const [value, setValue] =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__.useState(
          defaultProp
        );
      const prevValueRef =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__.useRef(
          value
        );
      const onChangeRef =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__.useRef(
          onChange
        );
      useInsertionEffect(
        {
          'useUncontrolledState.useInsertionEffect': () => {
            onChangeRef.current = onChange;
          },
        }['useUncontrolledState.useInsertionEffect'],
        [onChange]
      );
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__.useEffect(
        {
          'useUncontrolledState.useEffect': () => {
            if (prevValueRef.current !== value) {
              onChangeRef.current?.(value);
              prevValueRef.current = value;
            }
          },
        }['useUncontrolledState.useEffect'],
        [value, prevValueRef]
      );
      return [value, setValue, onChangeRef];
    }
    function isFunction(value) {
      return typeof value === 'function';
    }
    var SYNC_STATE = Symbol('RADIX:SYNC_STATE');
    function useControllableStateReducer(reducer, userArgs, initialArg, init) {
      const { prop: controlledState, defaultProp, onChange: onChangeProp, caller } = userArgs;
      const isControlled = controlledState !== void 0;
      const onChange = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$use$2d$effect$2d$event$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useEffectEvent'
      ])(onChangeProp);
      if (('TURBOPACK compile-time truthy', 1)) {
        const isControlledRef =
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__.useRef(
            controlledState !== void 0
          );
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__.useEffect(
          {
            'useControllableStateReducer.useEffect': () => {
              const wasControlled = isControlledRef.current;
              if (wasControlled !== isControlled) {
                const from = wasControlled ? 'controlled' : 'uncontrolled';
                const to = isControlled ? 'controlled' : 'uncontrolled';
                console.warn(
                  `${caller} is changing from ${from} to ${to}. Components should not switch from controlled to uncontrolled (or vice versa). Decide between using a controlled or uncontrolled value for the lifetime of the component.`
                );
              }
              isControlledRef.current = isControlled;
            },
          }['useControllableStateReducer.useEffect'],
          [isControlled, caller]
        );
      }
      const args = [
        {
          ...initialArg,
          state: defaultProp,
        },
      ];
      if (init) {
        args.push(init);
      }
      const [internalState, dispatch] =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__.useReducer(
          {
            'useControllableStateReducer.useReducer': (state2, action) => {
              if (action.type === SYNC_STATE) {
                return {
                  ...state2,
                  state: action.state,
                };
              }
              const next = reducer(state2, action);
              if (isControlled && !Object.is(next.state, state2.state)) {
                onChange(next.state);
              }
              return next;
            },
          }['useControllableStateReducer.useReducer'],
          ...args
        );
      const uncontrolledState = internalState.state;
      const prevValueRef =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__.useRef(
          uncontrolledState
        );
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__.useEffect(
        {
          'useControllableStateReducer.useEffect': () => {
            if (prevValueRef.current !== uncontrolledState) {
              prevValueRef.current = uncontrolledState;
              if (!isControlled) {
                onChange(uncontrolledState);
              }
            }
          },
        }['useControllableStateReducer.useEffect'],
        [onChange, uncontrolledState, prevValueRef, isControlled]
      );
      const state =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__.useMemo(
          {
            'useControllableStateReducer.useMemo[state]': () => {
              const isControlled2 = controlledState !== void 0;
              if (isControlled2) {
                return {
                  ...internalState,
                  state: controlledState,
                };
              }
              return internalState;
            },
          }['useControllableStateReducer.useMemo[state]'],
          [internalState, controlledState]
        );
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__.useEffect(
        {
          'useControllableStateReducer.useEffect': () => {
            if (isControlled && !Object.is(controlledState, internalState.state)) {
              dispatch({
                type: SYNC_STATE,
                state: controlledState,
              });
            }
          },
        }['useControllableStateReducer.useEffect'],
        [controlledState, internalState.state, isControlled]
      );
      return [state, dispatch];
    }
    //# sourceMappingURL=index.mjs.map
  },
  '[project]/node_modules/@radix-ui/react-slot/dist/index.mjs [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'Root',
      () => Slot,
      'Slot',
      () => Slot,
      'Slottable',
      () => Slottable,
      'createSlot',
      () => createSlot,
      'createSlottable',
      () => createSlottable,
    ]);
    // src/slot.tsx
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$compose$2d$refs$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-compose-refs/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-runtime.js [app-client] (ecmascript)'
      );
    // @__NO_SIDE_EFFECTS__
    function createSlot(ownerName) {
      const SlotClone = /* @__PURE__ */ createSlotClone(ownerName);
      const Slot2 =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'forwardRef'
        ]((props, forwardedRef) => {
          const { children, ...slotProps } = props;
          const childrenArray =
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'Children'
            ].toArray(children);
          const slottable = childrenArray.find(isSlottable);
          if (slottable) {
            const newElement = slottable.props.children;
            const newChildren = childrenArray.map((child) => {
              if (child === slottable) {
                if (
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'Children'
                  ].count(newElement) > 1
                )
                  return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'Children'
                  ].only(null);
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'isValidElement'
                ](newElement)
                  ? newElement.props.children
                  : null;
              } else {
                return child;
              }
            });
            return /* @__PURE__ */ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsx'
            ])(SlotClone, {
              ...slotProps,
              ref: forwardedRef,
              children:
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'isValidElement'
                ](newElement)
                  ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'cloneElement'
                    ](newElement, void 0, newChildren)
                  : null,
            });
          }
          return /* @__PURE__ */ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsx'
          ])(SlotClone, {
            ...slotProps,
            ref: forwardedRef,
            children,
          });
        });
      Slot2.displayName = `${ownerName}.Slot`;
      return Slot2;
    }
    var Slot = /* @__PURE__ */ createSlot('Slot');
    // @__NO_SIDE_EFFECTS__
    function createSlotClone(ownerName) {
      const SlotClone =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'forwardRef'
        ]((props, forwardedRef) => {
          const { children, ...slotProps } = props;
          if (
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'isValidElement'
            ](children)
          ) {
            const childrenRef = getElementRef(children);
            const props2 = mergeProps(slotProps, children.props);
            if (
              children.type !==
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'Fragment'
              ]
            ) {
              props2.ref = forwardedRef
                ? (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$compose$2d$refs$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'composeRefs'
                  ])(forwardedRef, childrenRef)
                : childrenRef;
            }
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'cloneElement'
            ](children, props2);
          }
          return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'Children'
          ].count(children) > 1
            ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'Children'
              ].only(null)
            : null;
        });
      SlotClone.displayName = `${ownerName}.SlotClone`;
      return SlotClone;
    }
    var SLOTTABLE_IDENTIFIER = Symbol('radix.slottable');
    // @__NO_SIDE_EFFECTS__
    function createSlottable(ownerName) {
      const Slottable2 = ({ children }) => {
        return /* @__PURE__ */ (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'jsx'
        ])(
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'Fragment'
          ],
          {
            children,
          }
        );
      };
      Slottable2.displayName = `${ownerName}.Slottable`;
      Slottable2.__radixId = SLOTTABLE_IDENTIFIER;
      return Slottable2;
    }
    var Slottable = /* @__PURE__ */ createSlottable('Slottable');
    function isSlottable(child) {
      return (
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'isValidElement'
        ](child) &&
        typeof child.type === 'function' &&
        '__radixId' in child.type &&
        child.type.__radixId === SLOTTABLE_IDENTIFIER
      );
    }
    function mergeProps(slotProps, childProps) {
      const overrideProps = {
        ...childProps,
      };
      for (const propName in childProps) {
        const slotPropValue = slotProps[propName];
        const childPropValue = childProps[propName];
        const isHandler = /^on[A-Z]/.test(propName);
        if (isHandler) {
          if (slotPropValue && childPropValue) {
            overrideProps[propName] = (...args) => {
              const result = childPropValue(...args);
              slotPropValue(...args);
              return result;
            };
          } else if (slotPropValue) {
            overrideProps[propName] = slotPropValue;
          }
        } else if (propName === 'style') {
          overrideProps[propName] = {
            ...slotPropValue,
            ...childPropValue,
          };
        } else if (propName === 'className') {
          overrideProps[propName] = [slotPropValue, childPropValue].filter(Boolean).join(' ');
        }
      }
      return {
        ...slotProps,
        ...overrideProps,
      };
    }
    function getElementRef(element) {
      let getter = Object.getOwnPropertyDescriptor(element.props, 'ref')?.get;
      let mayWarn = getter && 'isReactWarning' in getter && getter.isReactWarning;
      if (mayWarn) {
        return element.ref;
      }
      getter = Object.getOwnPropertyDescriptor(element, 'ref')?.get;
      mayWarn = getter && 'isReactWarning' in getter && getter.isReactWarning;
      if (mayWarn) {
        return element.props.ref;
      }
      return element.props.ref || element.ref;
    }
    //# sourceMappingURL=index.mjs.map
  },
  '[project]/apps/frontend/node_modules/@radix-ui/react-slot/dist/index.mjs [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['Root', () => Root, 'Slot', () => Slot, 'Slottable', () => Slottable]);
    // packages/react/slot/src/slot.tsx
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$compose$2d$refs$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/node_modules/@radix-ui/react-compose-refs/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-runtime.js [app-client] (ecmascript)'
      );
    var Slot =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ]((props, forwardedRef) => {
        const { children, ...slotProps } = props;
        const childrenArray =
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'Children'
          ].toArray(children);
        const slottable = childrenArray.find(isSlottable);
        if (slottable) {
          const newElement = slottable.props.children;
          const newChildren = childrenArray.map((child) => {
            if (child === slottable) {
              if (
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'Children'
                ].count(newElement) > 1
              )
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'Children'
                ].only(null);
              return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'isValidElement'
              ](newElement)
                ? newElement.props.children
                : null;
            } else {
              return child;
            }
          });
          return /* @__PURE__ */ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsx'
          ])(SlotClone, {
            ...slotProps,
            ref: forwardedRef,
            children:
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'isValidElement'
              ](newElement)
                ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'cloneElement'
                  ](newElement, void 0, newChildren)
                : null,
          });
        }
        return /* @__PURE__ */ (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'jsx'
        ])(SlotClone, {
          ...slotProps,
          ref: forwardedRef,
          children,
        });
      });
    Slot.displayName = 'Slot';
    var SlotClone =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ]((props, forwardedRef) => {
        const { children, ...slotProps } = props;
        if (
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'isValidElement'
          ](children)
        ) {
          const childrenRef = getElementRef(children);
          const props2 = mergeProps(slotProps, children.props);
          if (
            children.type !==
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'Fragment'
            ]
          ) {
            props2.ref = forwardedRef
              ? (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$compose$2d$refs$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'composeRefs'
                ])(forwardedRef, childrenRef)
              : childrenRef;
          }
          return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'cloneElement'
          ](children, props2);
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Children'
        ].count(children) > 1
          ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'Children'
            ].only(null)
          : null;
      });
    SlotClone.displayName = 'SlotClone';
    var Slottable = ({ children }) => {
      return /* @__PURE__ */ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsx'
      ])(
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Fragment'
        ],
        {
          children,
        }
      );
    };
    function isSlottable(child) {
      return (
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'isValidElement'
        ](child) && child.type === Slottable
      );
    }
    function mergeProps(slotProps, childProps) {
      const overrideProps = {
        ...childProps,
      };
      for (const propName in childProps) {
        const slotPropValue = slotProps[propName];
        const childPropValue = childProps[propName];
        const isHandler = /^on[A-Z]/.test(propName);
        if (isHandler) {
          if (slotPropValue && childPropValue) {
            overrideProps[propName] = (...args) => {
              childPropValue(...args);
              slotPropValue(...args);
            };
          } else if (slotPropValue) {
            overrideProps[propName] = slotPropValue;
          }
        } else if (propName === 'style') {
          overrideProps[propName] = {
            ...slotPropValue,
            ...childPropValue,
          };
        } else if (propName === 'className') {
          overrideProps[propName] = [slotPropValue, childPropValue].filter(Boolean).join(' ');
        }
      }
      return {
        ...slotProps,
        ...overrideProps,
      };
    }
    function getElementRef(element) {
      let getter = Object.getOwnPropertyDescriptor(element.props, 'ref')?.get;
      let mayWarn = getter && 'isReactWarning' in getter && getter.isReactWarning;
      if (mayWarn) {
        return element.ref;
      }
      getter = Object.getOwnPropertyDescriptor(element, 'ref')?.get;
      mayWarn = getter && 'isReactWarning' in getter && getter.isReactWarning;
      if (mayWarn) {
        return element.props.ref;
      }
      return element.props.ref || element.ref;
    }
    var Root = Slot;
    //# sourceMappingURL=index.mjs.map
  },
  '[project]/node_modules/@radix-ui/react-primitive/dist/index.mjs [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'Primitive',
      () => Primitive,
      'Root',
      () => Root,
      'dispatchDiscreteCustomEvent',
      () => dispatchDiscreteCustomEvent,
    ]);
    // src/primitive.tsx
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2d$dom$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react-dom/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-slot/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-runtime.js [app-client] (ecmascript)'
      );
    var NODES = [
      'a',
      'button',
      'div',
      'form',
      'h2',
      'h3',
      'img',
      'input',
      'label',
      'li',
      'nav',
      'ol',
      'p',
      'select',
      'span',
      'svg',
      'ul',
    ];
    var Primitive = NODES.reduce((primitive, node) => {
      const Slot = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'createSlot'
      ])(`Primitive.${node}`);
      const Node =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'forwardRef'
        ]((props, forwardedRef) => {
          const { asChild, ...primitiveProps } = props;
          const Comp = asChild ? Slot : node;
          if (typeof window !== 'undefined') {
            window[Symbol.for('radix-ui')] = true;
          }
          return /* @__PURE__ */ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsx'
          ])(Comp, {
            ...primitiveProps,
            ref: forwardedRef,
          });
        });
      Node.displayName = `Primitive.${node}`;
      return {
        ...primitive,
        [node]: Node,
      };
    }, {});
    function dispatchDiscreteCustomEvent(target, event) {
      if (target)
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2d$dom$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'flushSync'
        ](() => target.dispatchEvent(event));
    }
    var Root = Primitive;
    //# sourceMappingURL=index.mjs.map
  },
  '[project]/node_modules/@radix-ui/react-use-callback-ref/dist/index.mjs [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['useCallbackRef', () => useCallbackRef]);
    // packages/react/use-callback-ref/src/use-callback-ref.tsx
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    function useCallbackRef(callback) {
      const callbackRef =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useRef'
        ](callback);
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useEffect'
      ](
        {
          'useCallbackRef.useEffect': () => {
            callbackRef.current = callback;
          },
        }['useCallbackRef.useEffect']
      );
      return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useMemo'
      ](
        {
          'useCallbackRef.useMemo': () =>
            ({
              'useCallbackRef.useMemo': (...args) => callbackRef.current?.(...args),
            })['useCallbackRef.useMemo'],
        }['useCallbackRef.useMemo'],
        []
      );
    }
    //# sourceMappingURL=index.mjs.map
  },
  '[project]/node_modules/@radix-ui/react-use-escape-keydown/dist/index.mjs [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['useEscapeKeydown', () => useEscapeKeydown]);
    // packages/react/use-escape-keydown/src/use-escape-keydown.tsx
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$use$2d$callback$2d$ref$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-use-callback-ref/dist/index.mjs [app-client] (ecmascript)'
      );
    function useEscapeKeydown(onEscapeKeyDownProp, ownerDocument = globalThis?.document) {
      const onEscapeKeyDown = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$use$2d$callback$2d$ref$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useCallbackRef'
      ])(onEscapeKeyDownProp);
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useEffect'
      ](
        {
          'useEscapeKeydown.useEffect': () => {
            const handleKeyDown = {
              'useEscapeKeydown.useEffect.handleKeyDown': (event) => {
                if (event.key === 'Escape') {
                  onEscapeKeyDown(event);
                }
              },
            }['useEscapeKeydown.useEffect.handleKeyDown'];
            ownerDocument.addEventListener('keydown', handleKeyDown, {
              capture: true,
            });
            return {
              'useEscapeKeydown.useEffect': () =>
                ownerDocument.removeEventListener('keydown', handleKeyDown, {
                  capture: true,
                }),
            }['useEscapeKeydown.useEffect'];
          },
        }['useEscapeKeydown.useEffect'],
        [onEscapeKeyDown, ownerDocument]
      );
    }
    //# sourceMappingURL=index.mjs.map
  },
  '[project]/node_modules/@radix-ui/react-dismissable-layer/dist/index.mjs [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'Branch',
      () => Branch,
      'DismissableLayer',
      () => DismissableLayer,
      'DismissableLayerBranch',
      () => DismissableLayerBranch,
      'Root',
      () => Root,
    ]);
    // src/dismissable-layer.tsx
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$primitive$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/primitive/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$primitive$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-primitive/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$compose$2d$refs$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-compose-refs/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$use$2d$callback$2d$ref$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-use-callback-ref/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$use$2d$escape$2d$keydown$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-use-escape-keydown/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-runtime.js [app-client] (ecmascript)'
      );
    ('use client');
    var DISMISSABLE_LAYER_NAME = 'DismissableLayer';
    var CONTEXT_UPDATE = 'dismissableLayer.update';
    var POINTER_DOWN_OUTSIDE = 'dismissableLayer.pointerDownOutside';
    var FOCUS_OUTSIDE = 'dismissableLayer.focusOutside';
    var originalBodyPointerEvents;
    var DismissableLayerContext =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'createContext'
      ]({
        layers: /* @__PURE__ */ new Set(),
        layersWithOutsidePointerEventsDisabled: /* @__PURE__ */ new Set(),
        branches: /* @__PURE__ */ new Set(),
      });
    var DismissableLayer =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ]((props, forwardedRef) => {
        const {
          disableOutsidePointerEvents = false,
          onEscapeKeyDown,
          onPointerDownOutside,
          onFocusOutside,
          onInteractOutside,
          onDismiss,
          ...layerProps
        } = props;
        const context =
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'useContext'
          ](DismissableLayerContext);
        const [node, setNode] =
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'useState'
          ](null);
        const ownerDocument = node?.ownerDocument ?? globalThis?.document;
        const [, force] =
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'useState'
          ]({});
        const composedRefs = (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$compose$2d$refs$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useComposedRefs'
        ])(
          forwardedRef,
          {
            'DismissableLayer.useComposedRefs[composedRefs]': (node2) => setNode(node2),
          }['DismissableLayer.useComposedRefs[composedRefs]']
        );
        const layers = Array.from(context.layers);
        const [highestLayerWithOutsidePointerEventsDisabled] = [
          ...context.layersWithOutsidePointerEventsDisabled,
        ].slice(-1);
        const highestLayerWithOutsidePointerEventsDisabledIndex = layers.indexOf(
          highestLayerWithOutsidePointerEventsDisabled
        );
        const index = node ? layers.indexOf(node) : -1;
        const isBodyPointerEventsDisabled = context.layersWithOutsidePointerEventsDisabled.size > 0;
        const isPointerEventsEnabled = index >= highestLayerWithOutsidePointerEventsDisabledIndex;
        const pointerDownOutside = usePointerDownOutside(
          {
            'DismissableLayer.usePointerDownOutside[pointerDownOutside]': (event) => {
              const target = event.target;
              const isPointerDownOnBranch = [...context.branches].some(
                {
                  'DismissableLayer.usePointerDownOutside[pointerDownOutside].isPointerDownOnBranch':
                    (branch) => branch.contains(target),
                }[
                  'DismissableLayer.usePointerDownOutside[pointerDownOutside].isPointerDownOnBranch'
                ]
              );
              if (!isPointerEventsEnabled || isPointerDownOnBranch) return;
              onPointerDownOutside?.(event);
              onInteractOutside?.(event);
              if (!event.defaultPrevented) onDismiss?.();
            },
          }['DismissableLayer.usePointerDownOutside[pointerDownOutside]'],
          ownerDocument
        );
        const focusOutside = useFocusOutside(
          {
            'DismissableLayer.useFocusOutside[focusOutside]': (event) => {
              const target = event.target;
              const isFocusInBranch = [...context.branches].some(
                {
                  'DismissableLayer.useFocusOutside[focusOutside].isFocusInBranch': (branch) =>
                    branch.contains(target),
                }['DismissableLayer.useFocusOutside[focusOutside].isFocusInBranch']
              );
              if (isFocusInBranch) return;
              onFocusOutside?.(event);
              onInteractOutside?.(event);
              if (!event.defaultPrevented) onDismiss?.();
            },
          }['DismissableLayer.useFocusOutside[focusOutside]'],
          ownerDocument
        );
        (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$use$2d$escape$2d$keydown$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useEscapeKeydown'
        ])(
          {
            'DismissableLayer.useEscapeKeydown': (event) => {
              const isHighestLayer = index === context.layers.size - 1;
              if (!isHighestLayer) return;
              onEscapeKeyDown?.(event);
              if (!event.defaultPrevented && onDismiss) {
                event.preventDefault();
                onDismiss();
              }
            },
          }['DismissableLayer.useEscapeKeydown'],
          ownerDocument
        );
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useEffect'
        ](
          {
            'DismissableLayer.useEffect': () => {
              if (!node) return;
              if (disableOutsidePointerEvents) {
                if (context.layersWithOutsidePointerEventsDisabled.size === 0) {
                  originalBodyPointerEvents = ownerDocument.body.style.pointerEvents;
                  ownerDocument.body.style.pointerEvents = 'none';
                }
                context.layersWithOutsidePointerEventsDisabled.add(node);
              }
              context.layers.add(node);
              dispatchUpdate();
              return {
                'DismissableLayer.useEffect': () => {
                  if (
                    disableOutsidePointerEvents &&
                    context.layersWithOutsidePointerEventsDisabled.size === 1
                  ) {
                    ownerDocument.body.style.pointerEvents = originalBodyPointerEvents;
                  }
                },
              }['DismissableLayer.useEffect'];
            },
          }['DismissableLayer.useEffect'],
          [node, ownerDocument, disableOutsidePointerEvents, context]
        );
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useEffect'
        ](
          {
            'DismissableLayer.useEffect': () => {
              return {
                'DismissableLayer.useEffect': () => {
                  if (!node) return;
                  context.layers.delete(node);
                  context.layersWithOutsidePointerEventsDisabled.delete(node);
                  dispatchUpdate();
                },
              }['DismissableLayer.useEffect'];
            },
          }['DismissableLayer.useEffect'],
          [node, context]
        );
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useEffect'
        ](
          {
            'DismissableLayer.useEffect': () => {
              const handleUpdate = {
                'DismissableLayer.useEffect.handleUpdate': () => force({}),
              }['DismissableLayer.useEffect.handleUpdate'];
              document.addEventListener(CONTEXT_UPDATE, handleUpdate);
              return {
                'DismissableLayer.useEffect': () =>
                  document.removeEventListener(CONTEXT_UPDATE, handleUpdate),
              }['DismissableLayer.useEffect'];
            },
          }['DismissableLayer.useEffect'],
          []
        );
        return /* @__PURE__ */ (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'jsx'
        ])(
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$primitive$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'Primitive'
          ].div,
          {
            ...layerProps,
            ref: composedRefs,
            style: {
              pointerEvents: isBodyPointerEventsDisabled
                ? isPointerEventsEnabled
                  ? 'auto'
                  : 'none'
                : void 0,
              ...props.style,
            },
            onFocusCapture: (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$primitive$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'composeEventHandlers'
            ])(props.onFocusCapture, focusOutside.onFocusCapture),
            onBlurCapture: (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$primitive$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'composeEventHandlers'
            ])(props.onBlurCapture, focusOutside.onBlurCapture),
            onPointerDownCapture: (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$primitive$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'composeEventHandlers'
            ])(props.onPointerDownCapture, pointerDownOutside.onPointerDownCapture),
          }
        );
      });
    DismissableLayer.displayName = DISMISSABLE_LAYER_NAME;
    var BRANCH_NAME = 'DismissableLayerBranch';
    var DismissableLayerBranch =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ]((props, forwardedRef) => {
        const context =
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'useContext'
          ](DismissableLayerContext);
        const ref =
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'useRef'
          ](null);
        const composedRefs = (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$compose$2d$refs$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useComposedRefs'
        ])(forwardedRef, ref);
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useEffect'
        ](
          {
            'DismissableLayerBranch.useEffect': () => {
              const node = ref.current;
              if (node) {
                context.branches.add(node);
                return {
                  'DismissableLayerBranch.useEffect': () => {
                    context.branches.delete(node);
                  },
                }['DismissableLayerBranch.useEffect'];
              }
            },
          }['DismissableLayerBranch.useEffect'],
          [context.branches]
        );
        return /* @__PURE__ */ (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'jsx'
        ])(
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$primitive$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'Primitive'
          ].div,
          {
            ...props,
            ref: composedRefs,
          }
        );
      });
    DismissableLayerBranch.displayName = BRANCH_NAME;
    function usePointerDownOutside(onPointerDownOutside, ownerDocument = globalThis?.document) {
      const handlePointerDownOutside = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$use$2d$callback$2d$ref$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useCallbackRef'
      ])(onPointerDownOutside);
      const isPointerInsideReactTreeRef =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useRef'
        ](false);
      const handleClickRef =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useRef'
        ](
          {
            'usePointerDownOutside.useRef[handleClickRef]': () => {},
          }['usePointerDownOutside.useRef[handleClickRef]']
        );
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useEffect'
      ](
        {
          'usePointerDownOutside.useEffect': () => {
            const handlePointerDown = {
              'usePointerDownOutside.useEffect.handlePointerDown': (event) => {
                if (event.target && !isPointerInsideReactTreeRef.current) {
                  let handleAndDispatchPointerDownOutsideEvent2 = {
                    'usePointerDownOutside.useEffect.handlePointerDown.handleAndDispatchPointerDownOutsideEvent2':
                      function () {
                        handleAndDispatchCustomEvent(
                          POINTER_DOWN_OUTSIDE,
                          handlePointerDownOutside,
                          eventDetail,
                          {
                            discrete: true,
                          }
                        );
                      },
                  }[
                    'usePointerDownOutside.useEffect.handlePointerDown.handleAndDispatchPointerDownOutsideEvent2'
                  ];
                  var handleAndDispatchPointerDownOutsideEvent =
                    handleAndDispatchPointerDownOutsideEvent2;
                  const eventDetail = {
                    originalEvent: event,
                  };
                  if (event.pointerType === 'touch') {
                    ownerDocument.removeEventListener('click', handleClickRef.current);
                    handleClickRef.current = handleAndDispatchPointerDownOutsideEvent2;
                    ownerDocument.addEventListener('click', handleClickRef.current, {
                      once: true,
                    });
                  } else {
                    handleAndDispatchPointerDownOutsideEvent2();
                  }
                } else {
                  ownerDocument.removeEventListener('click', handleClickRef.current);
                }
                isPointerInsideReactTreeRef.current = false;
              },
            }['usePointerDownOutside.useEffect.handlePointerDown'];
            const timerId = window.setTimeout(
              {
                'usePointerDownOutside.useEffect.timerId': () => {
                  ownerDocument.addEventListener('pointerdown', handlePointerDown);
                },
              }['usePointerDownOutside.useEffect.timerId'],
              0
            );
            return {
              'usePointerDownOutside.useEffect': () => {
                window.clearTimeout(timerId);
                ownerDocument.removeEventListener('pointerdown', handlePointerDown);
                ownerDocument.removeEventListener('click', handleClickRef.current);
              },
            }['usePointerDownOutside.useEffect'];
          },
        }['usePointerDownOutside.useEffect'],
        [ownerDocument, handlePointerDownOutside]
      );
      return {
        // ensures we check React component tree (not just DOM tree)
        onPointerDownCapture: () => (isPointerInsideReactTreeRef.current = true),
      };
    }
    function useFocusOutside(onFocusOutside, ownerDocument = globalThis?.document) {
      const handleFocusOutside = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$use$2d$callback$2d$ref$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useCallbackRef'
      ])(onFocusOutside);
      const isFocusInsideReactTreeRef =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useRef'
        ](false);
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useEffect'
      ](
        {
          'useFocusOutside.useEffect': () => {
            const handleFocus = {
              'useFocusOutside.useEffect.handleFocus': (event) => {
                if (event.target && !isFocusInsideReactTreeRef.current) {
                  const eventDetail = {
                    originalEvent: event,
                  };
                  handleAndDispatchCustomEvent(FOCUS_OUTSIDE, handleFocusOutside, eventDetail, {
                    discrete: false,
                  });
                }
              },
            }['useFocusOutside.useEffect.handleFocus'];
            ownerDocument.addEventListener('focusin', handleFocus);
            return {
              'useFocusOutside.useEffect': () =>
                ownerDocument.removeEventListener('focusin', handleFocus),
            }['useFocusOutside.useEffect'];
          },
        }['useFocusOutside.useEffect'],
        [ownerDocument, handleFocusOutside]
      );
      return {
        onFocusCapture: () => (isFocusInsideReactTreeRef.current = true),
        onBlurCapture: () => (isFocusInsideReactTreeRef.current = false),
      };
    }
    function dispatchUpdate() {
      const event = new CustomEvent(CONTEXT_UPDATE);
      document.dispatchEvent(event);
    }
    function handleAndDispatchCustomEvent(name, handler, detail, { discrete }) {
      const target = detail.originalEvent.target;
      const event = new CustomEvent(name, {
        bubbles: false,
        cancelable: true,
        detail,
      });
      if (handler)
        target.addEventListener(name, handler, {
          once: true,
        });
      if (discrete) {
        (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$primitive$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'dispatchDiscreteCustomEvent'
        ])(target, event);
      } else {
        target.dispatchEvent(event);
      }
    }
    var Root = DismissableLayer;
    var Branch = DismissableLayerBranch;
    //# sourceMappingURL=index.mjs.map
  },
  '[project]/node_modules/@radix-ui/react-focus-scope/dist/index.mjs [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['FocusScope', () => FocusScope, 'Root', () => Root]);
    // src/focus-scope.tsx
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$compose$2d$refs$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-compose-refs/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$primitive$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-primitive/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$use$2d$callback$2d$ref$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-use-callback-ref/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-runtime.js [app-client] (ecmascript)'
      );
    ('use client');
    var AUTOFOCUS_ON_MOUNT = 'focusScope.autoFocusOnMount';
    var AUTOFOCUS_ON_UNMOUNT = 'focusScope.autoFocusOnUnmount';
    var EVENT_OPTIONS = {
      bubbles: false,
      cancelable: true,
    };
    var FOCUS_SCOPE_NAME = 'FocusScope';
    var FocusScope =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ]((props, forwardedRef) => {
        const {
          loop = false,
          trapped = false,
          onMountAutoFocus: onMountAutoFocusProp,
          onUnmountAutoFocus: onUnmountAutoFocusProp,
          ...scopeProps
        } = props;
        const [container, setContainer] =
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'useState'
          ](null);
        const onMountAutoFocus = (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$use$2d$callback$2d$ref$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useCallbackRef'
        ])(onMountAutoFocusProp);
        const onUnmountAutoFocus = (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$use$2d$callback$2d$ref$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useCallbackRef'
        ])(onUnmountAutoFocusProp);
        const lastFocusedElementRef =
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'useRef'
          ](null);
        const composedRefs = (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$compose$2d$refs$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useComposedRefs'
        ])(
          forwardedRef,
          {
            'FocusScope.useComposedRefs[composedRefs]': (node) => setContainer(node),
          }['FocusScope.useComposedRefs[composedRefs]']
        );
        const focusScope =
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'useRef'
          ]({
            paused: false,
            pause() {
              this.paused = true;
            },
            resume() {
              this.paused = false;
            },
          }).current;
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useEffect'
        ](
          {
            'FocusScope.useEffect': () => {
              if (trapped) {
                let handleFocusIn2 = {
                    'FocusScope.useEffect.handleFocusIn2': function (event) {
                      if (focusScope.paused || !container) return;
                      const target = event.target;
                      if (container.contains(target)) {
                        lastFocusedElementRef.current = target;
                      } else {
                        focus(lastFocusedElementRef.current, {
                          select: true,
                        });
                      }
                    },
                  }['FocusScope.useEffect.handleFocusIn2'],
                  handleFocusOut2 = {
                    'FocusScope.useEffect.handleFocusOut2': function (event) {
                      if (focusScope.paused || !container) return;
                      const relatedTarget = event.relatedTarget;
                      if (relatedTarget === null) return;
                      if (!container.contains(relatedTarget)) {
                        focus(lastFocusedElementRef.current, {
                          select: true,
                        });
                      }
                    },
                  }['FocusScope.useEffect.handleFocusOut2'],
                  handleMutations2 = {
                    'FocusScope.useEffect.handleMutations2': function (mutations) {
                      const focusedElement = document.activeElement;
                      if (focusedElement !== document.body) return;
                      for (const mutation of mutations) {
                        if (mutation.removedNodes.length > 0) focus(container);
                      }
                    },
                  }['FocusScope.useEffect.handleMutations2'];
                var handleFocusIn = handleFocusIn2,
                  handleFocusOut = handleFocusOut2,
                  handleMutations = handleMutations2;
                document.addEventListener('focusin', handleFocusIn2);
                document.addEventListener('focusout', handleFocusOut2);
                const mutationObserver = new MutationObserver(handleMutations2);
                if (container)
                  mutationObserver.observe(container, {
                    childList: true,
                    subtree: true,
                  });
                return {
                  'FocusScope.useEffect': () => {
                    document.removeEventListener('focusin', handleFocusIn2);
                    document.removeEventListener('focusout', handleFocusOut2);
                    mutationObserver.disconnect();
                  },
                }['FocusScope.useEffect'];
              }
            },
          }['FocusScope.useEffect'],
          [trapped, container, focusScope.paused]
        );
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useEffect'
        ](
          {
            'FocusScope.useEffect': () => {
              if (container) {
                focusScopesStack.add(focusScope);
                const previouslyFocusedElement = document.activeElement;
                const hasFocusedCandidate = container.contains(previouslyFocusedElement);
                if (!hasFocusedCandidate) {
                  const mountEvent = new CustomEvent(AUTOFOCUS_ON_MOUNT, EVENT_OPTIONS);
                  container.addEventListener(AUTOFOCUS_ON_MOUNT, onMountAutoFocus);
                  container.dispatchEvent(mountEvent);
                  if (!mountEvent.defaultPrevented) {
                    focusFirst(removeLinks(getTabbableCandidates(container)), {
                      select: true,
                    });
                    if (document.activeElement === previouslyFocusedElement) {
                      focus(container);
                    }
                  }
                }
                return {
                  'FocusScope.useEffect': () => {
                    container.removeEventListener(AUTOFOCUS_ON_MOUNT, onMountAutoFocus);
                    setTimeout(
                      {
                        'FocusScope.useEffect': () => {
                          const unmountEvent = new CustomEvent(AUTOFOCUS_ON_UNMOUNT, EVENT_OPTIONS);
                          container.addEventListener(AUTOFOCUS_ON_UNMOUNT, onUnmountAutoFocus);
                          container.dispatchEvent(unmountEvent);
                          if (!unmountEvent.defaultPrevented) {
                            focus(previouslyFocusedElement ?? document.body, {
                              select: true,
                            });
                          }
                          container.removeEventListener(AUTOFOCUS_ON_UNMOUNT, onUnmountAutoFocus);
                          focusScopesStack.remove(focusScope);
                        },
                      }['FocusScope.useEffect'],
                      0
                    );
                  },
                }['FocusScope.useEffect'];
              }
            },
          }['FocusScope.useEffect'],
          [container, onMountAutoFocus, onUnmountAutoFocus, focusScope]
        );
        const handleKeyDown =
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'useCallback'
          ](
            {
              'FocusScope.useCallback[handleKeyDown]': (event) => {
                if (!loop && !trapped) return;
                if (focusScope.paused) return;
                const isTabKey =
                  event.key === 'Tab' && !event.altKey && !event.ctrlKey && !event.metaKey;
                const focusedElement = document.activeElement;
                if (isTabKey && focusedElement) {
                  const container2 = event.currentTarget;
                  const [first, last] = getTabbableEdges(container2);
                  const hasTabbableElementsInside = first && last;
                  if (!hasTabbableElementsInside) {
                    if (focusedElement === container2) event.preventDefault();
                  } else {
                    if (!event.shiftKey && focusedElement === last) {
                      event.preventDefault();
                      if (loop)
                        focus(first, {
                          select: true,
                        });
                    } else if (event.shiftKey && focusedElement === first) {
                      event.preventDefault();
                      if (loop)
                        focus(last, {
                          select: true,
                        });
                    }
                  }
                }
              },
            }['FocusScope.useCallback[handleKeyDown]'],
            [loop, trapped, focusScope.paused]
          );
        return /* @__PURE__ */ (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'jsx'
        ])(
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$primitive$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'Primitive'
          ].div,
          {
            tabIndex: -1,
            ...scopeProps,
            ref: composedRefs,
            onKeyDown: handleKeyDown,
          }
        );
      });
    FocusScope.displayName = FOCUS_SCOPE_NAME;
    function focusFirst(candidates, { select = false } = {}) {
      const previouslyFocusedElement = document.activeElement;
      for (const candidate of candidates) {
        focus(candidate, {
          select,
        });
        if (document.activeElement !== previouslyFocusedElement) return;
      }
    }
    function getTabbableEdges(container) {
      const candidates = getTabbableCandidates(container);
      const first = findVisible(candidates, container);
      const last = findVisible(candidates.reverse(), container);
      return [first, last];
    }
    function getTabbableCandidates(container) {
      const nodes = [];
      const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT, {
        acceptNode: (node) => {
          const isHiddenInput = node.tagName === 'INPUT' && node.type === 'hidden';
          if (node.disabled || node.hidden || isHiddenInput) return NodeFilter.FILTER_SKIP;
          return node.tabIndex >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
        },
      });
      while (walker.nextNode()) nodes.push(walker.currentNode);
      return nodes;
    }
    function findVisible(elements, container) {
      for (const element of elements) {
        if (
          !isHidden(element, {
            upTo: container,
          })
        )
          return element;
      }
    }
    function isHidden(node, { upTo }) {
      if (getComputedStyle(node).visibility === 'hidden') return true;
      while (node) {
        if (upTo !== void 0 && node === upTo) return false;
        if (getComputedStyle(node).display === 'none') return true;
        node = node.parentElement;
      }
      return false;
    }
    function isSelectableInput(element) {
      return element instanceof HTMLInputElement && 'select' in element;
    }
    function focus(element, { select = false } = {}) {
      if (element && element.focus) {
        const previouslyFocusedElement = document.activeElement;
        element.focus({
          preventScroll: true,
        });
        if (element !== previouslyFocusedElement && isSelectableInput(element) && select)
          element.select();
      }
    }
    var focusScopesStack = createFocusScopesStack();
    function createFocusScopesStack() {
      let stack = [];
      return {
        add(focusScope) {
          const activeFocusScope = stack[0];
          if (focusScope !== activeFocusScope) {
            activeFocusScope?.pause();
          }
          stack = arrayRemove(stack, focusScope);
          stack.unshift(focusScope);
        },
        remove(focusScope) {
          stack = arrayRemove(stack, focusScope);
          stack[0]?.resume();
        },
      };
    }
    function arrayRemove(array, item) {
      const updatedArray = [...array];
      const index = updatedArray.indexOf(item);
      if (index !== -1) {
        updatedArray.splice(index, 1);
      }
      return updatedArray;
    }
    function removeLinks(items) {
      return items.filter((item) => item.tagName !== 'A');
    }
    var Root = FocusScope;
    //# sourceMappingURL=index.mjs.map
  },
  '[project]/node_modules/@radix-ui/react-portal/dist/index.mjs [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['Portal', () => Portal, 'Root', () => Root]);
    // src/portal.tsx
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2d$dom$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react-dom/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$primitive$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-primitive/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$use$2d$layout$2d$effect$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-use-layout-effect/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-runtime.js [app-client] (ecmascript)'
      );
    ('use client');
    var PORTAL_NAME = 'Portal';
    var Portal =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ]((props, forwardedRef) => {
        const { container: containerProp, ...portalProps } = props;
        const [mounted, setMounted] =
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'useState'
          ](false);
        (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$use$2d$layout$2d$effect$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useLayoutEffect'
        ])(
          {
            'Portal.useLayoutEffect': () => setMounted(true),
          }['Portal.useLayoutEffect'],
          []
        );
        const container = containerProp || (mounted && globalThis?.document?.body);
        return container
          ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2d$dom$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'default'
            ].createPortal(
              /* @__PURE__ */ (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'jsx'
              ])(
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$primitive$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'Primitive'
                ].div,
                {
                  ...portalProps,
                  ref: forwardedRef,
                }
              ),
              container
            )
          : null;
      });
    Portal.displayName = PORTAL_NAME;
    var Root = Portal;
    //# sourceMappingURL=index.mjs.map
  },
  '[project]/node_modules/@radix-ui/react-presence/dist/index.mjs [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['Presence', () => Presence, 'Root', () => Root]);
    // src/presence.tsx
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$compose$2d$refs$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-compose-refs/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$use$2d$layout$2d$effect$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-use-layout-effect/dist/index.mjs [app-client] (ecmascript)'
      );
    ('use client');
    function useStateMachine(initialState, machine) {
      return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useReducer'
      ](
        {
          'useStateMachine.useReducer': (state, event) => {
            const nextState = machine[state][event];
            return nextState ?? state;
          },
        }['useStateMachine.useReducer'],
        initialState
      );
    }
    // src/presence.tsx
    var Presence = (props) => {
      const { present, children } = props;
      const presence = usePresence(present);
      const child =
        typeof children === 'function'
          ? children({
              present: presence.isPresent,
            })
          : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'Children'
            ].only(children);
      const ref = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$compose$2d$refs$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useComposedRefs'
      ])(presence.ref, getElementRef(child));
      const forceMount = typeof children === 'function';
      return forceMount || presence.isPresent
        ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'cloneElement'
          ](child, {
            ref,
          })
        : null;
    };
    Presence.displayName = 'Presence';
    function usePresence(present) {
      const [node, setNode] =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useState'
        ]();
      const stylesRef =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useRef'
        ](null);
      const prevPresentRef =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useRef'
        ](present);
      const prevAnimationNameRef =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useRef'
        ]('none');
      const initialState = present ? 'mounted' : 'unmounted';
      const [state, send] = useStateMachine(initialState, {
        mounted: {
          UNMOUNT: 'unmounted',
          ANIMATION_OUT: 'unmountSuspended',
        },
        unmountSuspended: {
          MOUNT: 'mounted',
          ANIMATION_END: 'unmounted',
        },
        unmounted: {
          MOUNT: 'mounted',
        },
      });
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useEffect'
      ](
        {
          'usePresence.useEffect': () => {
            const currentAnimationName = getAnimationName(stylesRef.current);
            prevAnimationNameRef.current = state === 'mounted' ? currentAnimationName : 'none';
          },
        }['usePresence.useEffect'],
        [state]
      );
      (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$use$2d$layout$2d$effect$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useLayoutEffect'
      ])(
        {
          'usePresence.useLayoutEffect': () => {
            const styles = stylesRef.current;
            const wasPresent = prevPresentRef.current;
            const hasPresentChanged = wasPresent !== present;
            if (hasPresentChanged) {
              const prevAnimationName = prevAnimationNameRef.current;
              const currentAnimationName = getAnimationName(styles);
              if (present) {
                send('MOUNT');
              } else if (currentAnimationName === 'none' || styles?.display === 'none') {
                send('UNMOUNT');
              } else {
                const isAnimating = prevAnimationName !== currentAnimationName;
                if (wasPresent && isAnimating) {
                  send('ANIMATION_OUT');
                } else {
                  send('UNMOUNT');
                }
              }
              prevPresentRef.current = present;
            }
          },
        }['usePresence.useLayoutEffect'],
        [present, send]
      );
      (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$use$2d$layout$2d$effect$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useLayoutEffect'
      ])(
        {
          'usePresence.useLayoutEffect': () => {
            if (node) {
              let timeoutId;
              const ownerWindow = node.ownerDocument.defaultView ?? window;
              const handleAnimationEnd = {
                'usePresence.useLayoutEffect.handleAnimationEnd': (event) => {
                  const currentAnimationName = getAnimationName(stylesRef.current);
                  const isCurrentAnimation = currentAnimationName.includes(
                    CSS.escape(event.animationName)
                  );
                  if (event.target === node && isCurrentAnimation) {
                    send('ANIMATION_END');
                    if (!prevPresentRef.current) {
                      const currentFillMode = node.style.animationFillMode;
                      node.style.animationFillMode = 'forwards';
                      timeoutId = ownerWindow.setTimeout(
                        {
                          'usePresence.useLayoutEffect.handleAnimationEnd': () => {
                            if (node.style.animationFillMode === 'forwards') {
                              node.style.animationFillMode = currentFillMode;
                            }
                          },
                        }['usePresence.useLayoutEffect.handleAnimationEnd']
                      );
                    }
                  }
                },
              }['usePresence.useLayoutEffect.handleAnimationEnd'];
              const handleAnimationStart = {
                'usePresence.useLayoutEffect.handleAnimationStart': (event) => {
                  if (event.target === node) {
                    prevAnimationNameRef.current = getAnimationName(stylesRef.current);
                  }
                },
              }['usePresence.useLayoutEffect.handleAnimationStart'];
              node.addEventListener('animationstart', handleAnimationStart);
              node.addEventListener('animationcancel', handleAnimationEnd);
              node.addEventListener('animationend', handleAnimationEnd);
              return {
                'usePresence.useLayoutEffect': () => {
                  ownerWindow.clearTimeout(timeoutId);
                  node.removeEventListener('animationstart', handleAnimationStart);
                  node.removeEventListener('animationcancel', handleAnimationEnd);
                  node.removeEventListener('animationend', handleAnimationEnd);
                },
              }['usePresence.useLayoutEffect'];
            } else {
              send('ANIMATION_END');
            }
          },
        }['usePresence.useLayoutEffect'],
        [node, send]
      );
      return {
        isPresent: ['mounted', 'unmountSuspended'].includes(state),
        ref: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useCallback'
        ](
          {
            'usePresence.useCallback': (node2) => {
              stylesRef.current = node2 ? getComputedStyle(node2) : null;
              setNode(node2);
            },
          }['usePresence.useCallback'],
          []
        ),
      };
    }
    function getAnimationName(styles) {
      return styles?.animationName || 'none';
    }
    function getElementRef(element) {
      let getter = Object.getOwnPropertyDescriptor(element.props, 'ref')?.get;
      let mayWarn = getter && 'isReactWarning' in getter && getter.isReactWarning;
      if (mayWarn) {
        return element.ref;
      }
      getter = Object.getOwnPropertyDescriptor(element, 'ref')?.get;
      mayWarn = getter && 'isReactWarning' in getter && getter.isReactWarning;
      if (mayWarn) {
        return element.props.ref;
      }
      return element.props.ref || element.ref;
    }
    var Root = Presence;
    //# sourceMappingURL=index.mjs.map
  },
  '[project]/node_modules/@radix-ui/react-focus-guards/dist/index.mjs [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'FocusGuards',
      () => FocusGuards,
      'Root',
      () => FocusGuards,
      'useFocusGuards',
      () => useFocusGuards,
    ]);
    // src/focus-guards.tsx
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    ('use client');
    var count = 0;
    function FocusGuards(props) {
      useFocusGuards();
      return props.children;
    }
    function useFocusGuards() {
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useEffect'
      ](
        {
          'useFocusGuards.useEffect': () => {
            const edgeGuards = document.querySelectorAll('[data-radix-focus-guard]');
            document.body.insertAdjacentElement('afterbegin', edgeGuards[0] ?? createFocusGuard());
            document.body.insertAdjacentElement('beforeend', edgeGuards[1] ?? createFocusGuard());
            count++;
            return {
              'useFocusGuards.useEffect': () => {
                if (count === 1) {
                  document.querySelectorAll('[data-radix-focus-guard]').forEach(
                    {
                      'useFocusGuards.useEffect': (node) => node.remove(),
                    }['useFocusGuards.useEffect']
                  );
                }
                count--;
              },
            }['useFocusGuards.useEffect'];
          },
        }['useFocusGuards.useEffect'],
        []
      );
    }
    function createFocusGuard() {
      const element = document.createElement('span');
      element.setAttribute('data-radix-focus-guard', '');
      element.tabIndex = 0;
      element.style.outline = 'none';
      element.style.opacity = '0';
      element.style.position = 'fixed';
      element.style.pointerEvents = 'none';
      return element;
    }
    //# sourceMappingURL=index.mjs.map
  },
  '[project]/node_modules/react-remove-scroll-bar/dist/es2015/constants.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'fullWidthClassName',
      () => fullWidthClassName,
      'noScrollbarsClassName',
      () => noScrollbarsClassName,
      'removedBarSizeVariable',
      () => removedBarSizeVariable,
      'zeroRightClassName',
      () => zeroRightClassName,
    ]);
    var zeroRightClassName = 'right-scroll-bar-position';
    var fullWidthClassName = 'width-before-scroll-bar';
    var noScrollbarsClassName = 'with-scroll-bars-hidden';
    var removedBarSizeVariable = '--removed-body-scroll-bar-size';
  },
  '[project]/node_modules/react-remove-scroll-bar/dist/es2015/utils.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['getGapWidth', () => getGapWidth, 'zeroGap', () => zeroGap]);
    var zeroGap = {
      left: 0,
      top: 0,
      right: 0,
      gap: 0,
    };
    var parse = function (x) {
      return parseInt(x || '', 10) || 0;
    };
    var getOffset = function (gapMode) {
      var cs = window.getComputedStyle(document.body);
      var left = cs[gapMode === 'padding' ? 'paddingLeft' : 'marginLeft'];
      var top = cs[gapMode === 'padding' ? 'paddingTop' : 'marginTop'];
      var right = cs[gapMode === 'padding' ? 'paddingRight' : 'marginRight'];
      return [parse(left), parse(top), parse(right)];
    };
    var getGapWidth = function (gapMode) {
      if (gapMode === void 0) {
        gapMode = 'margin';
      }
      if (typeof window === 'undefined') {
        return zeroGap;
      }
      var offsets = getOffset(gapMode);
      var documentWidth = document.documentElement.clientWidth;
      var windowWidth = window.innerWidth;
      return {
        left: offsets[0],
        top: offsets[1],
        right: offsets[2],
        gap: Math.max(0, windowWidth - documentWidth + offsets[2] - offsets[0]),
      };
    };
  },
  '[project]/node_modules/react-remove-scroll-bar/dist/es2015/component.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'RemoveScrollBar',
      () => RemoveScrollBar,
      'lockAttribute',
      () => lockAttribute,
      'useLockAttribute',
      () => useLockAttribute,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$style$2d$singleton$2f$dist$2f$es2015$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/react-style-singleton/dist/es2015/index.js [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$style$2d$singleton$2f$dist$2f$es2015$2f$component$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/react-style-singleton/dist/es2015/component.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$remove$2d$scroll$2d$bar$2f$dist$2f$es2015$2f$constants$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/react-remove-scroll-bar/dist/es2015/constants.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$remove$2d$scroll$2d$bar$2f$dist$2f$es2015$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/react-remove-scroll-bar/dist/es2015/utils.js [app-client] (ecmascript)'
      );
    var Style = (0,
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$style$2d$singleton$2f$dist$2f$es2015$2f$component$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
      'styleSingleton'
    ])();
    var lockAttribute = 'data-scroll-locked';
    // important tip - once we measure scrollBar width and remove them
    // we could not repeat this operation
    // thus we are using style-singleton - only the first "yet correct" style will be applied.
    var getStyles = function (_a, allowRelative, gapMode, important) {
      var left = _a.left,
        top = _a.top,
        right = _a.right,
        gap = _a.gap;
      if (gapMode === void 0) {
        gapMode = 'margin';
      }
      return '\n  .'
        .concat(
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$remove$2d$scroll$2d$bar$2f$dist$2f$es2015$2f$constants$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'noScrollbarsClassName'
          ],
          ' {\n   overflow: hidden '
        )
        .concat(important, ';\n   padding-right: ')
        .concat(gap, 'px ')
        .concat(important, ';\n  }\n  body[')
        .concat(lockAttribute, '] {\n    overflow: hidden ')
        .concat(important, ';\n    overscroll-behavior: contain;\n    ')
        .concat(
          [
            allowRelative && 'position: relative '.concat(important, ';'),
            gapMode === 'margin' &&
              '\n    padding-left: '
                .concat(left, 'px;\n    padding-top: ')
                .concat(top, 'px;\n    padding-right: ')
                .concat(right, 'px;\n    margin-left:0;\n    margin-top:0;\n    margin-right: ')
                .concat(gap, 'px ')
                .concat(important, ';\n    '),
            gapMode === 'padding' && 'padding-right: '.concat(gap, 'px ').concat(important, ';'),
          ]
            .filter(Boolean)
            .join(''),
          '\n  }\n  \n  .'
        )
        .concat(
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$remove$2d$scroll$2d$bar$2f$dist$2f$es2015$2f$constants$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'zeroRightClassName'
          ],
          ' {\n    right: '
        )
        .concat(gap, 'px ')
        .concat(important, ';\n  }\n  \n  .')
        .concat(
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$remove$2d$scroll$2d$bar$2f$dist$2f$es2015$2f$constants$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'fullWidthClassName'
          ],
          ' {\n    margin-right: '
        )
        .concat(gap, 'px ')
        .concat(important, ';\n  }\n  \n  .')
        .concat(
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$remove$2d$scroll$2d$bar$2f$dist$2f$es2015$2f$constants$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'zeroRightClassName'
          ],
          ' .'
        )
        .concat(
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$remove$2d$scroll$2d$bar$2f$dist$2f$es2015$2f$constants$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'zeroRightClassName'
          ],
          ' {\n    right: 0 '
        )
        .concat(important, ';\n  }\n  \n  .')
        .concat(
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$remove$2d$scroll$2d$bar$2f$dist$2f$es2015$2f$constants$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'fullWidthClassName'
          ],
          ' .'
        )
        .concat(
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$remove$2d$scroll$2d$bar$2f$dist$2f$es2015$2f$constants$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'fullWidthClassName'
          ],
          ' {\n    margin-right: 0 '
        )
        .concat(important, ';\n  }\n  \n  body[')
        .concat(lockAttribute, '] {\n    ')
        .concat(
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$remove$2d$scroll$2d$bar$2f$dist$2f$es2015$2f$constants$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'removedBarSizeVariable'
          ],
          ': '
        )
        .concat(gap, 'px;\n  }\n');
    };
    var getCurrentUseCounter = function () {
      var counter = parseInt(document.body.getAttribute(lockAttribute) || '0', 10);
      return isFinite(counter) ? counter : 0;
    };
    var useLockAttribute = function () {
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useEffect'
      ](
        {
          'useLockAttribute.useEffect': function () {
            document.body.setAttribute(lockAttribute, (getCurrentUseCounter() + 1).toString());
            return {
              'useLockAttribute.useEffect': function () {
                var newCounter = getCurrentUseCounter() - 1;
                if (newCounter <= 0) {
                  document.body.removeAttribute(lockAttribute);
                } else {
                  document.body.setAttribute(lockAttribute, newCounter.toString());
                }
              },
            }['useLockAttribute.useEffect'];
          },
        }['useLockAttribute.useEffect'],
        []
      );
    };
    var RemoveScrollBar = function (_a) {
      var noRelative = _a.noRelative,
        noImportant = _a.noImportant,
        _b = _a.gapMode,
        gapMode = _b === void 0 ? 'margin' : _b;
      useLockAttribute();
      /*
     gap will be measured on every component mount
     however it will be used only by the "first" invocation
     due to singleton nature of <Style
     */ var gap =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useMemo'
        ](
          {
            'RemoveScrollBar.useMemo[gap]': function () {
              return (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$remove$2d$scroll$2d$bar$2f$dist$2f$es2015$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'getGapWidth'
              ])(gapMode);
            },
          }['RemoveScrollBar.useMemo[gap]'],
          [gapMode]
        );
      return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'createElement'
      ](Style, {
        styles: getStyles(gap, !noRelative, gapMode, !noImportant ? '!important' : ''),
      });
    };
  },
  '[project]/node_modules/react-remove-scroll-bar/dist/es2015/index.js [app-client] (ecmascript) <locals>',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$remove$2d$scroll$2d$bar$2f$dist$2f$es2015$2f$component$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/react-remove-scroll-bar/dist/es2015/component.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$remove$2d$scroll$2d$bar$2f$dist$2f$es2015$2f$constants$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/react-remove-scroll-bar/dist/es2015/constants.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$remove$2d$scroll$2d$bar$2f$dist$2f$es2015$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/react-remove-scroll-bar/dist/es2015/utils.js [app-client] (ecmascript)'
      );
  },
  '[project]/node_modules/use-callback-ref/dist/es2015/assignRef.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    /**
     * Assigns a value for a given ref, no matter of the ref format
     * @param {RefObject} ref - a callback function or ref object
     * @param value - a new value
     *
     * @see https://github.com/theKashey/use-callback-ref#assignref
     * @example
     * const refObject = useRef();
     * const refFn = (ref) => {....}
     *
     * assignRef(refObject, "refValue");
     * assignRef(refFn, "refValue");
     */ __turbopack_context__.s(['assignRef', () => assignRef]);
    function assignRef(ref, value) {
      if (typeof ref === 'function') {
        ref(value);
      } else if (ref) {
        ref.current = value;
      }
      return ref;
    }
  },
  '[project]/node_modules/use-callback-ref/dist/es2015/useRef.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['useCallbackRef', () => useCallbackRef]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    function useCallbackRef(initialValue, callback) {
      var ref = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useState'
      ])(
        {
          'useCallbackRef.useState': function () {
            return {
              // value
              value: initialValue,
              // last callback
              callback: callback,
              // "memoized" public interface
              facade: {
                get current() {
                  return ref.value;
                },
                set current(value) {
                  var last = ref.value;
                  if (last !== value) {
                    ref.value = value;
                    ref.callback(value, last);
                  }
                },
              },
            };
          },
        }['useCallbackRef.useState']
      )[0];
      // update callback
      ref.callback = callback;
      return ref.facade;
    }
  },
  '[project]/node_modules/use-callback-ref/dist/es2015/useMergeRef.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['useMergeRefs', () => useMergeRefs]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$use$2d$callback$2d$ref$2f$dist$2f$es2015$2f$assignRef$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/use-callback-ref/dist/es2015/assignRef.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$use$2d$callback$2d$ref$2f$dist$2f$es2015$2f$useRef$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/use-callback-ref/dist/es2015/useRef.js [app-client] (ecmascript)'
      );
    var useIsomorphicLayoutEffect =
      typeof window !== 'undefined'
        ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'useLayoutEffect'
          ]
        : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'useEffect'
          ];
    var currentValues = new WeakMap();
    function useMergeRefs(refs, defaultValue) {
      var callbackRef = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$use$2d$callback$2d$ref$2f$dist$2f$es2015$2f$useRef$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useCallbackRef'
      ])(
        defaultValue || null,
        {
          'useMergeRefs.useCallbackRef[callbackRef]': function (newValue) {
            return refs.forEach(
              {
                'useMergeRefs.useCallbackRef[callbackRef]': function (ref) {
                  return (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$use$2d$callback$2d$ref$2f$dist$2f$es2015$2f$assignRef$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'assignRef'
                  ])(ref, newValue);
                },
              }['useMergeRefs.useCallbackRef[callbackRef]']
            );
          },
        }['useMergeRefs.useCallbackRef[callbackRef]']
      );
      // handle refs changes - added or removed
      useIsomorphicLayoutEffect(
        {
          'useMergeRefs.useIsomorphicLayoutEffect': function () {
            var oldValue = currentValues.get(callbackRef);
            if (oldValue) {
              var prevRefs_1 = new Set(oldValue);
              var nextRefs_1 = new Set(refs);
              var current_1 = callbackRef.current;
              prevRefs_1.forEach(
                {
                  'useMergeRefs.useIsomorphicLayoutEffect': function (ref) {
                    if (!nextRefs_1.has(ref)) {
                      (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$use$2d$callback$2d$ref$2f$dist$2f$es2015$2f$assignRef$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'assignRef'
                      ])(ref, null);
                    }
                  },
                }['useMergeRefs.useIsomorphicLayoutEffect']
              );
              nextRefs_1.forEach(
                {
                  'useMergeRefs.useIsomorphicLayoutEffect': function (ref) {
                    if (!prevRefs_1.has(ref)) {
                      (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$use$2d$callback$2d$ref$2f$dist$2f$es2015$2f$assignRef$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'assignRef'
                      ])(ref, current_1);
                    }
                  },
                }['useMergeRefs.useIsomorphicLayoutEffect']
              );
            }
            currentValues.set(callbackRef, refs);
          },
        }['useMergeRefs.useIsomorphicLayoutEffect'],
        [refs]
      );
      return callbackRef;
    }
  },
  '[project]/node_modules/use-sidecar/dist/es2015/medium.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'createMedium',
      () => createMedium,
      'createSidecarMedium',
      () => createSidecarMedium,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/tslib/tslib.es6.mjs [app-client] (ecmascript)'
      );
    function ItoI(a) {
      return a;
    }
    function innerCreateMedium(defaults, middleware) {
      if (middleware === void 0) {
        middleware = ItoI;
      }
      var buffer = [];
      var assigned = false;
      var medium = {
        read: function () {
          if (assigned) {
            throw new Error(
              'Sidecar: could not `read` from an `assigned` medium. `read` could be used only with `useMedium`.'
            );
          }
          if (buffer.length) {
            return buffer[buffer.length - 1];
          }
          return defaults;
        },
        useMedium: function (data) {
          var item = middleware(data, assigned);
          buffer.push(item);
          return function () {
            buffer = buffer.filter(function (x) {
              return x !== item;
            });
          };
        },
        assignSyncMedium: function (cb) {
          assigned = true;
          while (buffer.length) {
            var cbs = buffer;
            buffer = [];
            cbs.forEach(cb);
          }
          buffer = {
            push: function (x) {
              return cb(x);
            },
            filter: function () {
              return buffer;
            },
          };
        },
        assignMedium: function (cb) {
          assigned = true;
          var pendingQueue = [];
          if (buffer.length) {
            var cbs = buffer;
            buffer = [];
            cbs.forEach(cb);
            pendingQueue = buffer;
          }
          var executeQueue = function () {
            var cbs = pendingQueue;
            pendingQueue = [];
            cbs.forEach(cb);
          };
          var cycle = function () {
            return Promise.resolve().then(executeQueue);
          };
          cycle();
          buffer = {
            push: function (x) {
              pendingQueue.push(x);
              cycle();
            },
            filter: function (filter) {
              pendingQueue = pendingQueue.filter(filter);
              return buffer;
            },
          };
        },
      };
      return medium;
    }
    function createMedium(defaults, middleware) {
      if (middleware === void 0) {
        middleware = ItoI;
      }
      return innerCreateMedium(defaults, middleware);
    }
    function createSidecarMedium(options) {
      if (options === void 0) {
        options = {};
      }
      var medium = innerCreateMedium(null);
      medium.options = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        '__assign'
      ])(
        {
          async: true,
          ssr: false,
        },
        options
      );
      return medium;
    }
  },
  '[project]/node_modules/use-sidecar/dist/es2015/exports.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['exportSidecar', () => exportSidecar]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/tslib/tslib.es6.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var SideCar = function (_a) {
      var sideCar = _a.sideCar,
        rest = (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          '__rest'
        ])(_a, ['sideCar']);
      if (!sideCar) {
        throw new Error('Sidecar: please provide `sideCar` property to import the right car');
      }
      var Target = sideCar.read();
      if (!Target) {
        throw new Error('Sidecar medium not found');
      }
      return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'createElement'
      ](
        Target,
        (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          '__assign'
        ])({}, rest)
      );
    };
    SideCar.isSideCarExport = true;
    function exportSidecar(medium, exported) {
      medium.useMedium(exported);
      return SideCar;
    }
  },
  '[project]/node_modules/react-remove-scroll/dist/es2015/medium.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['effectCar', () => effectCar]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$use$2d$sidecar$2f$dist$2f$es2015$2f$medium$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/use-sidecar/dist/es2015/medium.js [app-client] (ecmascript)'
      );
    var effectCar = (0,
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$use$2d$sidecar$2f$dist$2f$es2015$2f$medium$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
      'createSidecarMedium'
    ])();
  },
  '[project]/node_modules/react-remove-scroll/dist/es2015/UI.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['RemoveScroll', () => RemoveScroll]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/tslib/tslib.es6.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$remove$2d$scroll$2d$bar$2f$dist$2f$es2015$2f$constants$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/react-remove-scroll-bar/dist/es2015/constants.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$use$2d$callback$2d$ref$2f$dist$2f$es2015$2f$useMergeRef$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/use-callback-ref/dist/es2015/useMergeRef.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$remove$2d$scroll$2f$dist$2f$es2015$2f$medium$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/react-remove-scroll/dist/es2015/medium.js [app-client] (ecmascript)'
      );
    var nothing = function () {
      return;
    };
    /**
     * Removes scrollbar from the page and contain the scroll within the Lock
     */ var RemoveScroll =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](function (props, parentRef) {
        var ref =
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'useRef'
          ](null);
        var _a =
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'useState'
            ]({
              onScrollCapture: nothing,
              onWheelCapture: nothing,
              onTouchMoveCapture: nothing,
            }),
          callbacks = _a[0],
          setCallbacks = _a[1];
        var forwardProps = props.forwardProps,
          children = props.children,
          className = props.className,
          removeScrollBar = props.removeScrollBar,
          enabled = props.enabled,
          shards = props.shards,
          sideCar = props.sideCar,
          noRelative = props.noRelative,
          noIsolation = props.noIsolation,
          inert = props.inert,
          allowPinchZoom = props.allowPinchZoom,
          _b = props.as,
          Container = _b === void 0 ? 'div' : _b,
          gapMode = props.gapMode,
          rest = (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            '__rest'
          ])(props, [
            'forwardProps',
            'children',
            'className',
            'removeScrollBar',
            'enabled',
            'shards',
            'sideCar',
            'noRelative',
            'noIsolation',
            'inert',
            'allowPinchZoom',
            'as',
            'gapMode',
          ]);
        var SideCar = sideCar;
        var containerRef = (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$use$2d$callback$2d$ref$2f$dist$2f$es2015$2f$useMergeRef$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useMergeRefs'
        ])([ref, parentRef]);
        var containerProps = (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          '__assign'
        ])(
          (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            '__assign'
          ])({}, rest),
          callbacks
        );
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'createElement'
        ](
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'Fragment'
          ],
          null,
          enabled &&
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'createElement'
            ](SideCar, {
              sideCar:
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$remove$2d$scroll$2f$dist$2f$es2015$2f$medium$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'effectCar'
                ],
              removeScrollBar: removeScrollBar,
              shards: shards,
              noRelative: noRelative,
              noIsolation: noIsolation,
              inert: inert,
              setCallbacks: setCallbacks,
              allowPinchZoom: !!allowPinchZoom,
              lockRef: ref,
              gapMode: gapMode,
            }),
          forwardProps
            ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'cloneElement'
              ](
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'Children'
                ].only(children),
                (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  '__assign'
                ])(
                  (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    '__assign'
                  ])({}, containerProps),
                  {
                    ref: containerRef,
                  }
                )
              )
            : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'createElement'
              ](
                Container,
                (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  '__assign'
                ])({}, containerProps, {
                  className: className,
                  ref: containerRef,
                }),
                children
              )
        );
      });
    RemoveScroll.defaultProps = {
      enabled: true,
      removeScrollBar: true,
      inert: false,
    };
    RemoveScroll.classNames = {
      fullWidth:
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$remove$2d$scroll$2d$bar$2f$dist$2f$es2015$2f$constants$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'fullWidthClassName'
        ],
      zeroRight:
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$remove$2d$scroll$2d$bar$2f$dist$2f$es2015$2f$constants$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'zeroRightClassName'
        ],
    };
  },
  '[project]/node_modules/react-remove-scroll/dist/es2015/aggresiveCapture.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['nonPassive', () => nonPassive]);
    var passiveSupported = false;
    if (typeof window !== 'undefined') {
      try {
        var options = Object.defineProperty({}, 'passive', {
          get: function () {
            passiveSupported = true;
            return true;
          },
        });
        // @ts-ignore
        window.addEventListener('test', options, options);
        // @ts-ignore
        window.removeEventListener('test', options, options);
      } catch (err) {
        passiveSupported = false;
      }
    }
    var nonPassive = passiveSupported
      ? {
          passive: false,
        }
      : false;
  },
  '[project]/node_modules/react-remove-scroll/dist/es2015/handleScroll.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'handleScroll',
      () => handleScroll,
      'locationCouldBeScrolled',
      () => locationCouldBeScrolled,
    ]);
    var alwaysContainsScroll = function (node) {
      // textarea will always _contain_ scroll inside self. It only can be hidden
      return node.tagName === 'TEXTAREA';
    };
    var elementCanBeScrolled = function (node, overflow) {
      if (!(node instanceof Element)) {
        return false;
      }
      var styles = window.getComputedStyle(node);
      return (
        // not-not-scrollable
        styles[overflow] !== 'hidden' && // contains scroll inside self
        !(
          styles.overflowY === styles.overflowX &&
          !alwaysContainsScroll(node) &&
          styles[overflow] === 'visible'
        )
      );
    };
    var elementCouldBeVScrolled = function (node) {
      return elementCanBeScrolled(node, 'overflowY');
    };
    var elementCouldBeHScrolled = function (node) {
      return elementCanBeScrolled(node, 'overflowX');
    };
    var locationCouldBeScrolled = function (axis, node) {
      var ownerDocument = node.ownerDocument;
      var current = node;
      do {
        // Skip over shadow root
        if (typeof ShadowRoot !== 'undefined' && current instanceof ShadowRoot) {
          current = current.host;
        }
        var isScrollable = elementCouldBeScrolled(axis, current);
        if (isScrollable) {
          var _a = getScrollVariables(axis, current),
            scrollHeight = _a[1],
            clientHeight = _a[2];
          if (scrollHeight > clientHeight) {
            return true;
          }
        }
        current = current.parentNode;
      } while (current && current !== ownerDocument.body);
      return false;
    };
    var getVScrollVariables = function (_a) {
      var scrollTop = _a.scrollTop,
        scrollHeight = _a.scrollHeight,
        clientHeight = _a.clientHeight;
      return [scrollTop, scrollHeight, clientHeight];
    };
    var getHScrollVariables = function (_a) {
      var scrollLeft = _a.scrollLeft,
        scrollWidth = _a.scrollWidth,
        clientWidth = _a.clientWidth;
      return [scrollLeft, scrollWidth, clientWidth];
    };
    var elementCouldBeScrolled = function (axis, node) {
      return axis === 'v' ? elementCouldBeVScrolled(node) : elementCouldBeHScrolled(node);
    };
    var getScrollVariables = function (axis, node) {
      return axis === 'v' ? getVScrollVariables(node) : getHScrollVariables(node);
    };
    var getDirectionFactor = function (axis, direction) {
      /**
       * If the element's direction is rtl (right-to-left), then scrollLeft is 0 when the scrollbar is at its rightmost position,
       * and then increasingly negative as you scroll towards the end of the content.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollLeft
       */ return axis === 'h' && direction === 'rtl' ? -1 : 1;
    };
    var handleScroll = function (axis, endTarget, event, sourceDelta, noOverscroll) {
      var directionFactor = getDirectionFactor(axis, window.getComputedStyle(endTarget).direction);
      var delta = directionFactor * sourceDelta;
      // find scrollable target
      var target = event.target;
      var targetInLock = endTarget.contains(target);
      var shouldCancelScroll = false;
      var isDeltaPositive = delta > 0;
      var availableScroll = 0;
      var availableScrollTop = 0;
      do {
        if (!target) {
          break;
        }
        var _a = getScrollVariables(axis, target),
          position = _a[0],
          scroll_1 = _a[1],
          capacity = _a[2];
        var elementScroll = scroll_1 - capacity - directionFactor * position;
        if (position || elementScroll) {
          if (elementCouldBeScrolled(axis, target)) {
            availableScroll += elementScroll;
            availableScrollTop += position;
          }
        }
        var parent_1 = target.parentNode;
        // we will "bubble" from ShadowDom in case we are, or just to the parent in normal case
        // this is the same logic used in focus-lock
        target =
          parent_1 && parent_1.nodeType === Node.DOCUMENT_FRAGMENT_NODE ? parent_1.host : parent_1;
      } while ( // portaled content
        (!targetInLock && target !== document.body) ||
        (targetInLock && (endTarget.contains(target) || endTarget === target))
      );
      // handle epsilon around 0 (non standard zoom levels)
      if (
        isDeltaPositive &&
        ((noOverscroll && Math.abs(availableScroll) < 1) ||
          (!noOverscroll && delta > availableScroll))
      ) {
        shouldCancelScroll = true;
      } else if (
        !isDeltaPositive &&
        ((noOverscroll && Math.abs(availableScrollTop) < 1) ||
          (!noOverscroll && -delta > availableScrollTop))
      ) {
        shouldCancelScroll = true;
      }
      return shouldCancelScroll;
    };
  },
  '[project]/node_modules/react-remove-scroll/dist/es2015/SideEffect.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'RemoveScrollSideCar',
      () => RemoveScrollSideCar,
      'getDeltaXY',
      () => getDeltaXY,
      'getTouchXY',
      () => getTouchXY,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/tslib/tslib.es6.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$remove$2d$scroll$2d$bar$2f$dist$2f$es2015$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/react-remove-scroll-bar/dist/es2015/index.js [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$remove$2d$scroll$2d$bar$2f$dist$2f$es2015$2f$component$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/react-remove-scroll-bar/dist/es2015/component.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$style$2d$singleton$2f$dist$2f$es2015$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/react-style-singleton/dist/es2015/index.js [app-client] (ecmascript) <locals>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$style$2d$singleton$2f$dist$2f$es2015$2f$component$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/react-style-singleton/dist/es2015/component.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$remove$2d$scroll$2f$dist$2f$es2015$2f$aggresiveCapture$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/react-remove-scroll/dist/es2015/aggresiveCapture.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$remove$2d$scroll$2f$dist$2f$es2015$2f$handleScroll$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/react-remove-scroll/dist/es2015/handleScroll.js [app-client] (ecmascript)'
      );
    var getTouchXY = function (event) {
      return 'changedTouches' in event
        ? [event.changedTouches[0].clientX, event.changedTouches[0].clientY]
        : [0, 0];
    };
    var getDeltaXY = function (event) {
      return [event.deltaX, event.deltaY];
    };
    var extractRef = function (ref) {
      return ref && 'current' in ref ? ref.current : ref;
    };
    var deltaCompare = function (x, y) {
      return x[0] === y[0] && x[1] === y[1];
    };
    var generateStyle = function (id) {
      return '\n  .block-interactivity-'
        .concat(id, ' {pointer-events: none;}\n  .allow-interactivity-')
        .concat(id, ' {pointer-events: all;}\n');
    };
    var idCounter = 0;
    var lockStack = [];
    function RemoveScrollSideCar(props) {
      var shouldPreventQueue =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useRef'
        ]([]);
      var touchStartRef =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useRef'
        ]([0, 0]);
      var activeAxis =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useRef'
        ]();
      var id =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useState'
        ](idCounter++)[0];
      var Style =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useState'
        ](
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$style$2d$singleton$2f$dist$2f$es2015$2f$component$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'styleSingleton'
          ]
        )[0];
      var lastProps =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useRef'
        ](props);
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useEffect'
      ](
        {
          'RemoveScrollSideCar.useEffect': function () {
            lastProps.current = props;
          },
        }['RemoveScrollSideCar.useEffect'],
        [props]
      );
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useEffect'
      ](
        {
          'RemoveScrollSideCar.useEffect': function () {
            if (props.inert) {
              document.body.classList.add('block-interactivity-'.concat(id));
              var allow_1 = (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                '__spreadArray'
              ])([props.lockRef.current], (props.shards || []).map(extractRef), true).filter(
                Boolean
              );
              allow_1.forEach(
                {
                  'RemoveScrollSideCar.useEffect': function (el) {
                    return el.classList.add('allow-interactivity-'.concat(id));
                  },
                }['RemoveScrollSideCar.useEffect']
              );
              return {
                'RemoveScrollSideCar.useEffect': function () {
                  document.body.classList.remove('block-interactivity-'.concat(id));
                  allow_1.forEach(
                    {
                      'RemoveScrollSideCar.useEffect': function (el) {
                        return el.classList.remove('allow-interactivity-'.concat(id));
                      },
                    }['RemoveScrollSideCar.useEffect']
                  );
                },
              }['RemoveScrollSideCar.useEffect'];
            }
            return;
          },
        }['RemoveScrollSideCar.useEffect'],
        [props.inert, props.lockRef.current, props.shards]
      );
      var shouldCancelEvent =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useCallback'
        ](
          {
            'RemoveScrollSideCar.useCallback[shouldCancelEvent]': function (event, parent) {
              if (
                ('touches' in event && event.touches.length === 2) ||
                (event.type === 'wheel' && event.ctrlKey)
              ) {
                return !lastProps.current.allowPinchZoom;
              }
              var touch = getTouchXY(event);
              var touchStart = touchStartRef.current;
              var deltaX = 'deltaX' in event ? event.deltaX : touchStart[0] - touch[0];
              var deltaY = 'deltaY' in event ? event.deltaY : touchStart[1] - touch[1];
              var currentAxis;
              var target = event.target;
              var moveDirection = Math.abs(deltaX) > Math.abs(deltaY) ? 'h' : 'v';
              // allow horizontal touch move on Range inputs. They will not cause any scroll
              if ('touches' in event && moveDirection === 'h' && target.type === 'range') {
                return false;
              }
              // allow drag selection (iOS); check if selection's anchorNode is the same as target or contains target
              var selection = window.getSelection();
              var anchorNode = selection && selection.anchorNode;
              var isTouchingSelection = anchorNode
                ? anchorNode === target || anchorNode.contains(target)
                : false;
              if (isTouchingSelection) {
                return false;
              }
              var canBeScrolledInMainDirection = (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$remove$2d$scroll$2f$dist$2f$es2015$2f$handleScroll$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'locationCouldBeScrolled'
              ])(moveDirection, target);
              if (!canBeScrolledInMainDirection) {
                return true;
              }
              if (canBeScrolledInMainDirection) {
                currentAxis = moveDirection;
              } else {
                currentAxis = moveDirection === 'v' ? 'h' : 'v';
                canBeScrolledInMainDirection = (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$remove$2d$scroll$2f$dist$2f$es2015$2f$handleScroll$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'locationCouldBeScrolled'
                ])(moveDirection, target);
                // other axis might be not scrollable
              }
              if (!canBeScrolledInMainDirection) {
                return false;
              }
              if (!activeAxis.current && 'changedTouches' in event && (deltaX || deltaY)) {
                activeAxis.current = currentAxis;
              }
              if (!currentAxis) {
                return true;
              }
              var cancelingAxis = activeAxis.current || currentAxis;
              return (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$remove$2d$scroll$2f$dist$2f$es2015$2f$handleScroll$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'handleScroll'
              ])(cancelingAxis, parent, event, cancelingAxis === 'h' ? deltaX : deltaY, true);
            },
          }['RemoveScrollSideCar.useCallback[shouldCancelEvent]'],
          []
        );
      var shouldPrevent =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useCallback'
        ](
          {
            'RemoveScrollSideCar.useCallback[shouldPrevent]': function (_event) {
              var event = _event;
              if (!lockStack.length || lockStack[lockStack.length - 1] !== Style) {
                // not the last active
                return;
              }
              var delta = 'deltaY' in event ? getDeltaXY(event) : getTouchXY(event);
              var sourceEvent = shouldPreventQueue.current.filter(
                {
                  'RemoveScrollSideCar.useCallback[shouldPrevent]': function (e) {
                    return (
                      e.name === event.type &&
                      (e.target === event.target || event.target === e.shadowParent) &&
                      deltaCompare(e.delta, delta)
                    );
                  },
                }['RemoveScrollSideCar.useCallback[shouldPrevent]']
              )[0];
              // self event, and should be canceled
              if (sourceEvent && sourceEvent.should) {
                if (event.cancelable) {
                  event.preventDefault();
                }
                return;
              }
              // outside or shard event
              if (!sourceEvent) {
                var shardNodes = (lastProps.current.shards || [])
                  .map(extractRef)
                  .filter(Boolean)
                  .filter(
                    {
                      'RemoveScrollSideCar.useCallback[shouldPrevent].shardNodes': function (node) {
                        return node.contains(event.target);
                      },
                    }['RemoveScrollSideCar.useCallback[shouldPrevent].shardNodes']
                  );
                var shouldStop =
                  shardNodes.length > 0
                    ? shouldCancelEvent(event, shardNodes[0])
                    : !lastProps.current.noIsolation;
                if (shouldStop) {
                  if (event.cancelable) {
                    event.preventDefault();
                  }
                }
              }
            },
          }['RemoveScrollSideCar.useCallback[shouldPrevent]'],
          []
        );
      var shouldCancel =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useCallback'
        ](
          {
            'RemoveScrollSideCar.useCallback[shouldCancel]': function (
              name,
              delta,
              target,
              should
            ) {
              var event = {
                name: name,
                delta: delta,
                target: target,
                should: should,
                shadowParent: getOutermostShadowParent(target),
              };
              shouldPreventQueue.current.push(event);
              setTimeout(
                {
                  'RemoveScrollSideCar.useCallback[shouldCancel]': function () {
                    shouldPreventQueue.current = shouldPreventQueue.current.filter(
                      {
                        'RemoveScrollSideCar.useCallback[shouldCancel]': function (e) {
                          return e !== event;
                        },
                      }['RemoveScrollSideCar.useCallback[shouldCancel]']
                    );
                  },
                }['RemoveScrollSideCar.useCallback[shouldCancel]'],
                1
              );
            },
          }['RemoveScrollSideCar.useCallback[shouldCancel]'],
          []
        );
      var scrollTouchStart =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useCallback'
        ](
          {
            'RemoveScrollSideCar.useCallback[scrollTouchStart]': function (event) {
              touchStartRef.current = getTouchXY(event);
              activeAxis.current = undefined;
            },
          }['RemoveScrollSideCar.useCallback[scrollTouchStart]'],
          []
        );
      var scrollWheel =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useCallback'
        ](
          {
            'RemoveScrollSideCar.useCallback[scrollWheel]': function (event) {
              shouldCancel(
                event.type,
                getDeltaXY(event),
                event.target,
                shouldCancelEvent(event, props.lockRef.current)
              );
            },
          }['RemoveScrollSideCar.useCallback[scrollWheel]'],
          []
        );
      var scrollTouchMove =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useCallback'
        ](
          {
            'RemoveScrollSideCar.useCallback[scrollTouchMove]': function (event) {
              shouldCancel(
                event.type,
                getTouchXY(event),
                event.target,
                shouldCancelEvent(event, props.lockRef.current)
              );
            },
          }['RemoveScrollSideCar.useCallback[scrollTouchMove]'],
          []
        );
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useEffect'
      ](
        {
          'RemoveScrollSideCar.useEffect': function () {
            lockStack.push(Style);
            props.setCallbacks({
              onScrollCapture: scrollWheel,
              onWheelCapture: scrollWheel,
              onTouchMoveCapture: scrollTouchMove,
            });
            document.addEventListener(
              'wheel',
              shouldPrevent,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$remove$2d$scroll$2f$dist$2f$es2015$2f$aggresiveCapture$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'nonPassive'
              ]
            );
            document.addEventListener(
              'touchmove',
              shouldPrevent,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$remove$2d$scroll$2f$dist$2f$es2015$2f$aggresiveCapture$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'nonPassive'
              ]
            );
            document.addEventListener(
              'touchstart',
              scrollTouchStart,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$remove$2d$scroll$2f$dist$2f$es2015$2f$aggresiveCapture$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'nonPassive'
              ]
            );
            return {
              'RemoveScrollSideCar.useEffect': function () {
                lockStack = lockStack.filter(
                  {
                    'RemoveScrollSideCar.useEffect': function (inst) {
                      return inst !== Style;
                    },
                  }['RemoveScrollSideCar.useEffect']
                );
                document.removeEventListener(
                  'wheel',
                  shouldPrevent,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$remove$2d$scroll$2f$dist$2f$es2015$2f$aggresiveCapture$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'nonPassive'
                  ]
                );
                document.removeEventListener(
                  'touchmove',
                  shouldPrevent,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$remove$2d$scroll$2f$dist$2f$es2015$2f$aggresiveCapture$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'nonPassive'
                  ]
                );
                document.removeEventListener(
                  'touchstart',
                  scrollTouchStart,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$remove$2d$scroll$2f$dist$2f$es2015$2f$aggresiveCapture$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'nonPassive'
                  ]
                );
              },
            }['RemoveScrollSideCar.useEffect'];
          },
        }['RemoveScrollSideCar.useEffect'],
        []
      );
      var removeScrollBar = props.removeScrollBar,
        inert = props.inert;
      return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'createElement'
      ](
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Fragment'
        ],
        null,
        inert
          ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'createElement'
            ](Style, {
              styles: generateStyle(id),
            })
          : null,
        removeScrollBar
          ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'createElement'
            ](
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$remove$2d$scroll$2d$bar$2f$dist$2f$es2015$2f$component$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'RemoveScrollBar'
              ],
              {
                noRelative: props.noRelative,
                gapMode: props.gapMode,
              }
            )
          : null
      );
    }
    function getOutermostShadowParent(node) {
      var shadowParent = null;
      while (node !== null) {
        if (node instanceof ShadowRoot) {
          shadowParent = node.host;
          node = node.host;
        }
        node = node.parentNode;
      }
      return shadowParent;
    }
  },
  '[project]/node_modules/react-remove-scroll/dist/es2015/sidecar.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['default', () => __TURBOPACK__default__export__]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$use$2d$sidecar$2f$dist$2f$es2015$2f$exports$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/use-sidecar/dist/es2015/exports.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$remove$2d$scroll$2f$dist$2f$es2015$2f$SideEffect$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/react-remove-scroll/dist/es2015/SideEffect.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$remove$2d$scroll$2f$dist$2f$es2015$2f$medium$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/react-remove-scroll/dist/es2015/medium.js [app-client] (ecmascript)'
      );
    const __TURBOPACK__default__export__ = (0,
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$use$2d$sidecar$2f$dist$2f$es2015$2f$exports$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
      'exportSidecar'
    ])(
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$remove$2d$scroll$2f$dist$2f$es2015$2f$medium$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'effectCar'
      ],
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$remove$2d$scroll$2f$dist$2f$es2015$2f$SideEffect$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'RemoveScrollSideCar'
      ]
    );
  },
  '[project]/node_modules/react-remove-scroll/dist/es2015/Combination.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['default', () => __TURBOPACK__default__export__]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/tslib/tslib.es6.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$remove$2d$scroll$2f$dist$2f$es2015$2f$UI$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/react-remove-scroll/dist/es2015/UI.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$remove$2d$scroll$2f$dist$2f$es2015$2f$sidecar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/react-remove-scroll/dist/es2015/sidecar.js [app-client] (ecmascript)'
      );
    var ReactRemoveScroll =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](function (props, ref) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'createElement'
        ](
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$remove$2d$scroll$2f$dist$2f$es2015$2f$UI$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'RemoveScroll'
          ],
          (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tslib$2f$tslib$2e$es6$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            '__assign'
          ])({}, props, {
            ref: ref,
            sideCar:
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$remove$2d$scroll$2f$dist$2f$es2015$2f$sidecar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'default'
              ],
          })
        );
      });
    ReactRemoveScroll.classNames =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$remove$2d$scroll$2f$dist$2f$es2015$2f$UI$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'RemoveScroll'
      ].classNames;
    const __TURBOPACK__default__export__ = ReactRemoveScroll;
  },
  '[project]/node_modules/react-remove-scroll/dist/es2015/Combination.js [app-client] (ecmascript) <export default as RemoveScroll>',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'RemoveScroll',
      () =>
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$remove$2d$scroll$2f$dist$2f$es2015$2f$Combination$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'default'
        ],
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$remove$2d$scroll$2f$dist$2f$es2015$2f$Combination$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/react-remove-scroll/dist/es2015/Combination.js [app-client] (ecmascript)'
      );
  },
  '[project]/node_modules/get-nonce/dist/es2015/index.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['getNonce', () => getNonce, 'setNonce', () => setNonce]);
    var currentNonce;
    var setNonce = function (nonce) {
      currentNonce = nonce;
    };
    var getNonce = function () {
      if (currentNonce) {
        return currentNonce;
      }
      if (typeof __webpack_nonce__ !== 'undefined') {
        return __webpack_nonce__;
      }
      return undefined;
    };
  },
  '[project]/node_modules/react-style-singleton/dist/es2015/singleton.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['stylesheetSingleton', () => stylesheetSingleton]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$get$2d$nonce$2f$dist$2f$es2015$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/get-nonce/dist/es2015/index.js [app-client] (ecmascript)'
      );
    function makeStyleTag() {
      if (!document) return null;
      var tag = document.createElement('style');
      tag.type = 'text/css';
      var nonce = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$get$2d$nonce$2f$dist$2f$es2015$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'getNonce'
      ])();
      if (nonce) {
        tag.setAttribute('nonce', nonce);
      }
      return tag;
    }
    function injectStyles(tag, css) {
      // @ts-ignore
      if (tag.styleSheet) {
        // @ts-ignore
        tag.styleSheet.cssText = css;
      } else {
        tag.appendChild(document.createTextNode(css));
      }
    }
    function insertStyleTag(tag) {
      var head = document.head || document.getElementsByTagName('head')[0];
      head.appendChild(tag);
    }
    var stylesheetSingleton = function () {
      var counter = 0;
      var stylesheet = null;
      return {
        add: function (style) {
          if (counter == 0) {
            if ((stylesheet = makeStyleTag())) {
              injectStyles(stylesheet, style);
              insertStyleTag(stylesheet);
            }
          }
          counter++;
        },
        remove: function () {
          counter--;
          if (!counter && stylesheet) {
            stylesheet.parentNode && stylesheet.parentNode.removeChild(stylesheet);
            stylesheet = null;
          }
        },
      };
    };
  },
  '[project]/node_modules/react-style-singleton/dist/es2015/hook.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['styleHookSingleton', () => styleHookSingleton]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$style$2d$singleton$2f$dist$2f$es2015$2f$singleton$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/react-style-singleton/dist/es2015/singleton.js [app-client] (ecmascript)'
      );
    var styleHookSingleton = function () {
      var sheet = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$style$2d$singleton$2f$dist$2f$es2015$2f$singleton$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'stylesheetSingleton'
      ])();
      return function (styles, isDynamic) {
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useEffect'
        ](
          {
            'styleHookSingleton.useEffect': function () {
              sheet.add(styles);
              return {
                'styleHookSingleton.useEffect': function () {
                  sheet.remove();
                },
              }['styleHookSingleton.useEffect'];
            },
          }['styleHookSingleton.useEffect'],
          [styles && isDynamic]
        );
      };
    };
  },
  '[project]/node_modules/react-style-singleton/dist/es2015/component.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['styleSingleton', () => styleSingleton]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$style$2d$singleton$2f$dist$2f$es2015$2f$hook$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/react-style-singleton/dist/es2015/hook.js [app-client] (ecmascript)'
      );
    var styleSingleton = function () {
      var useStyle = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$style$2d$singleton$2f$dist$2f$es2015$2f$hook$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'styleHookSingleton'
      ])();
      var Sheet = function (_a) {
        var styles = _a.styles,
          dynamic = _a.dynamic;
        useStyle(styles, dynamic);
        return null;
      };
      return Sheet;
    };
  },
  '[project]/node_modules/react-style-singleton/dist/es2015/index.js [app-client] (ecmascript) <locals>',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$style$2d$singleton$2f$dist$2f$es2015$2f$component$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/react-style-singleton/dist/es2015/component.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$style$2d$singleton$2f$dist$2f$es2015$2f$singleton$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/react-style-singleton/dist/es2015/singleton.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$style$2d$singleton$2f$dist$2f$es2015$2f$hook$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/react-style-singleton/dist/es2015/hook.js [app-client] (ecmascript)'
      );
  },
  '[project]/node_modules/aria-hidden/dist/es2015/index.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'hideOthers',
      () => hideOthers,
      'inertOthers',
      () => inertOthers,
      'supportsInert',
      () => supportsInert,
      'suppressOthers',
      () => suppressOthers,
    ]);
    var getDefaultParent = function (originalTarget) {
      if (typeof document === 'undefined') {
        return null;
      }
      var sampleTarget = Array.isArray(originalTarget) ? originalTarget[0] : originalTarget;
      return sampleTarget.ownerDocument.body;
    };
    var counterMap = new WeakMap();
    var uncontrolledNodes = new WeakMap();
    var markerMap = {};
    var lockCount = 0;
    var unwrapHost = function (node) {
      return node && (node.host || unwrapHost(node.parentNode));
    };
    var correctTargets = function (parent, targets) {
      return targets
        .map(function (target) {
          if (parent.contains(target)) {
            return target;
          }
          var correctedTarget = unwrapHost(target);
          if (correctedTarget && parent.contains(correctedTarget)) {
            return correctedTarget;
          }
          console.error(
            'aria-hidden',
            target,
            'in not contained inside',
            parent,
            '. Doing nothing'
          );
          return null;
        })
        .filter(function (x) {
          return Boolean(x);
        });
    };
    /**
     * Marks everything except given node(or nodes) as aria-hidden
     * @param {Element | Element[]} originalTarget - elements to keep on the page
     * @param [parentNode] - top element, defaults to document.body
     * @param {String} [markerName] - a special attribute to mark every node
     * @param {String} [controlAttribute] - html Attribute to control
     * @return {Undo} undo command
     */ var applyAttributeToOthers = function (
      originalTarget,
      parentNode,
      markerName,
      controlAttribute
    ) {
      var targets = correctTargets(
        parentNode,
        Array.isArray(originalTarget) ? originalTarget : [originalTarget]
      );
      if (!markerMap[markerName]) {
        markerMap[markerName] = new WeakMap();
      }
      var markerCounter = markerMap[markerName];
      var hiddenNodes = [];
      var elementsToKeep = new Set();
      var elementsToStop = new Set(targets);
      var keep = function (el) {
        if (!el || elementsToKeep.has(el)) {
          return;
        }
        elementsToKeep.add(el);
        keep(el.parentNode);
      };
      targets.forEach(keep);
      var deep = function (parent) {
        if (!parent || elementsToStop.has(parent)) {
          return;
        }
        Array.prototype.forEach.call(parent.children, function (node) {
          if (elementsToKeep.has(node)) {
            deep(node);
          } else {
            try {
              var attr = node.getAttribute(controlAttribute);
              var alreadyHidden = attr !== null && attr !== 'false';
              var counterValue = (counterMap.get(node) || 0) + 1;
              var markerValue = (markerCounter.get(node) || 0) + 1;
              counterMap.set(node, counterValue);
              markerCounter.set(node, markerValue);
              hiddenNodes.push(node);
              if (counterValue === 1 && alreadyHidden) {
                uncontrolledNodes.set(node, true);
              }
              if (markerValue === 1) {
                node.setAttribute(markerName, 'true');
              }
              if (!alreadyHidden) {
                node.setAttribute(controlAttribute, 'true');
              }
            } catch (e) {
              console.error('aria-hidden: cannot operate on ', node, e);
            }
          }
        });
      };
      deep(parentNode);
      elementsToKeep.clear();
      lockCount++;
      return function () {
        hiddenNodes.forEach(function (node) {
          var counterValue = counterMap.get(node) - 1;
          var markerValue = markerCounter.get(node) - 1;
          counterMap.set(node, counterValue);
          markerCounter.set(node, markerValue);
          if (!counterValue) {
            if (!uncontrolledNodes.has(node)) {
              node.removeAttribute(controlAttribute);
            }
            uncontrolledNodes.delete(node);
          }
          if (!markerValue) {
            node.removeAttribute(markerName);
          }
        });
        lockCount--;
        if (!lockCount) {
          // clear
          counterMap = new WeakMap();
          counterMap = new WeakMap();
          uncontrolledNodes = new WeakMap();
          markerMap = {};
        }
      };
    };
    var hideOthers = function (originalTarget, parentNode, markerName) {
      if (markerName === void 0) {
        markerName = 'data-aria-hidden';
      }
      var targets = Array.from(Array.isArray(originalTarget) ? originalTarget : [originalTarget]);
      var activeParentNode = parentNode || getDefaultParent(originalTarget);
      if (!activeParentNode) {
        return function () {
          return null;
        };
      }
      // we should not hide aria-live elements - https://github.com/theKashey/aria-hidden/issues/10
      // and script elements, as they have no impact on accessibility.
      targets.push.apply(
        targets,
        Array.from(activeParentNode.querySelectorAll('[aria-live], script'))
      );
      return applyAttributeToOthers(targets, activeParentNode, markerName, 'aria-hidden');
    };
    var inertOthers = function (originalTarget, parentNode, markerName) {
      if (markerName === void 0) {
        markerName = 'data-inert-ed';
      }
      var activeParentNode = parentNode || getDefaultParent(originalTarget);
      if (!activeParentNode) {
        return function () {
          return null;
        };
      }
      return applyAttributeToOthers(originalTarget, activeParentNode, markerName, 'inert');
    };
    var supportsInert = function () {
      return typeof HTMLElement !== 'undefined' && HTMLElement.prototype.hasOwnProperty('inert');
    };
    var suppressOthers = function (originalTarget, parentNode, markerName) {
      if (markerName === void 0) {
        markerName = 'data-suppressed';
      }
      return (supportsInert() ? inertOthers : hideOthers)(originalTarget, parentNode, markerName);
    };
  },
  '[project]/node_modules/@radix-ui/react-dialog/dist/index.mjs [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'Close',
      () => Close,
      'Content',
      () => Content,
      'Description',
      () => Description,
      'Dialog',
      () => Dialog,
      'DialogClose',
      () => DialogClose,
      'DialogContent',
      () => DialogContent,
      'DialogDescription',
      () => DialogDescription,
      'DialogOverlay',
      () => DialogOverlay,
      'DialogPortal',
      () => DialogPortal,
      'DialogTitle',
      () => DialogTitle,
      'DialogTrigger',
      () => DialogTrigger,
      'Overlay',
      () => Overlay,
      'Portal',
      () => Portal,
      'Root',
      () => Root,
      'Title',
      () => Title,
      'Trigger',
      () => Trigger,
      'WarningProvider',
      () => WarningProvider,
      'createDialogScope',
      () => createDialogScope,
    ]);
    // src/dialog.tsx
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$primitive$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/primitive/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$compose$2d$refs$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-compose-refs/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$context$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-context/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$id$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-id/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$use$2d$controllable$2d$state$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-use-controllable-state/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dismissable$2d$layer$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-dismissable-layer/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$focus$2d$scope$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-focus-scope/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$portal$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-portal/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$presence$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-presence/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$primitive$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-primitive/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$focus$2d$guards$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-focus-guards/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$remove$2d$scroll$2f$dist$2f$es2015$2f$Combination$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RemoveScroll$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/react-remove-scroll/dist/es2015/Combination.js [app-client] (ecmascript) <export default as RemoveScroll>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$aria$2d$hidden$2f$dist$2f$es2015$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/aria-hidden/dist/es2015/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-slot/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-runtime.js [app-client] (ecmascript)'
      );
    ('use client');
    var DIALOG_NAME = 'Dialog';
    var [createDialogContext, createDialogScope] = (0,
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$context$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
      'createContextScope'
    ])(DIALOG_NAME);
    var [DialogProvider, useDialogContext] = createDialogContext(DIALOG_NAME);
    var Dialog = (props) => {
      const {
        __scopeDialog,
        children,
        open: openProp,
        defaultOpen,
        onOpenChange,
        modal = true,
      } = props;
      const triggerRef =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useRef'
        ](null);
      const contentRef =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useRef'
        ](null);
      const [open, setOpen] = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$use$2d$controllable$2d$state$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useControllableState'
      ])({
        prop: openProp,
        defaultProp: defaultOpen ?? false,
        onChange: onOpenChange,
        caller: DIALOG_NAME,
      });
      return /* @__PURE__ */ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsx'
      ])(DialogProvider, {
        scope: __scopeDialog,
        triggerRef,
        contentRef,
        contentId: (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$id$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useId'
        ])(),
        titleId: (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$id$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useId'
        ])(),
        descriptionId: (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$id$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useId'
        ])(),
        open,
        onOpenChange: setOpen,
        onOpenToggle:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'useCallback'
          ](
            {
              'Dialog.useCallback': () =>
                setOpen(
                  {
                    'Dialog.useCallback': (prevOpen) => !prevOpen,
                  }['Dialog.useCallback']
                ),
            }['Dialog.useCallback'],
            [setOpen]
          ),
        modal,
        children,
      });
    };
    Dialog.displayName = DIALOG_NAME;
    var TRIGGER_NAME = 'DialogTrigger';
    var DialogTrigger =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ]((props, forwardedRef) => {
        const { __scopeDialog, ...triggerProps } = props;
        const context = useDialogContext(TRIGGER_NAME, __scopeDialog);
        const composedTriggerRef = (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$compose$2d$refs$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useComposedRefs'
        ])(forwardedRef, context.triggerRef);
        return /* @__PURE__ */ (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'jsx'
        ])(
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$primitive$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'Primitive'
          ].button,
          {
            type: 'button',
            'aria-haspopup': 'dialog',
            'aria-expanded': context.open,
            'aria-controls': context.contentId,
            'data-state': getState(context.open),
            ...triggerProps,
            ref: composedTriggerRef,
            onClick: (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$primitive$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'composeEventHandlers'
            ])(props.onClick, context.onOpenToggle),
          }
        );
      });
    DialogTrigger.displayName = TRIGGER_NAME;
    var PORTAL_NAME = 'DialogPortal';
    var [PortalProvider, usePortalContext] = createDialogContext(PORTAL_NAME, {
      forceMount: void 0,
    });
    var DialogPortal = (props) => {
      const { __scopeDialog, forceMount, children, container } = props;
      const context = useDialogContext(PORTAL_NAME, __scopeDialog);
      return /* @__PURE__ */ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsx'
      ])(PortalProvider, {
        scope: __scopeDialog,
        forceMount,
        children:
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'Children'
          ].map(children, (child) =>
            /* @__PURE__ */ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsx'
            ])(
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$presence$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'Presence'
              ],
              {
                present: forceMount || context.open,
                children: /* @__PURE__ */ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsx'
                ])(
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$portal$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'Portal'
                  ],
                  {
                    asChild: true,
                    container,
                    children: child,
                  }
                ),
              }
            )
          ),
      });
    };
    DialogPortal.displayName = PORTAL_NAME;
    var OVERLAY_NAME = 'DialogOverlay';
    var DialogOverlay =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ]((props, forwardedRef) => {
        const portalContext = usePortalContext(OVERLAY_NAME, props.__scopeDialog);
        const { forceMount = portalContext.forceMount, ...overlayProps } = props;
        const context = useDialogContext(OVERLAY_NAME, props.__scopeDialog);
        return context.modal
          ? /* @__PURE__ */ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsx'
            ])(
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$presence$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'Presence'
              ],
              {
                present: forceMount || context.open,
                children: /* @__PURE__ */ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsx'
                ])(DialogOverlayImpl, {
                  ...overlayProps,
                  ref: forwardedRef,
                }),
              }
            )
          : null;
      });
    DialogOverlay.displayName = OVERLAY_NAME;
    var Slot = (0,
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
      'createSlot'
    ])('DialogOverlay.RemoveScroll');
    var DialogOverlayImpl =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ]((props, forwardedRef) => {
        const { __scopeDialog, ...overlayProps } = props;
        const context = useDialogContext(OVERLAY_NAME, __scopeDialog);
        return (
          // Make sure `Content` is scrollable even when it doesn't live inside `RemoveScroll`
          // ie. when `Overlay` and `Content` are siblings
          /* @__PURE__ */ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsx'
          ])(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$remove$2d$scroll$2f$dist$2f$es2015$2f$Combination$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RemoveScroll$3e$__[
              'RemoveScroll'
            ],
            {
              as: Slot,
              allowPinchZoom: true,
              shards: [context.contentRef],
              children: /* @__PURE__ */ (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'jsx'
              ])(
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$primitive$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'Primitive'
                ].div,
                {
                  'data-state': getState(context.open),
                  ...overlayProps,
                  ref: forwardedRef,
                  style: {
                    pointerEvents: 'auto',
                    ...overlayProps.style,
                  },
                }
              ),
            }
          )
        );
      });
    var CONTENT_NAME = 'DialogContent';
    var DialogContent =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ]((props, forwardedRef) => {
        const portalContext = usePortalContext(CONTENT_NAME, props.__scopeDialog);
        const { forceMount = portalContext.forceMount, ...contentProps } = props;
        const context = useDialogContext(CONTENT_NAME, props.__scopeDialog);
        return /* @__PURE__ */ (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'jsx'
        ])(
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$presence$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'Presence'
          ],
          {
            present: forceMount || context.open,
            children: context.modal
              ? /* @__PURE__ */ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsx'
                ])(DialogContentModal, {
                  ...contentProps,
                  ref: forwardedRef,
                })
              : /* @__PURE__ */ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsx'
                ])(DialogContentNonModal, {
                  ...contentProps,
                  ref: forwardedRef,
                }),
          }
        );
      });
    DialogContent.displayName = CONTENT_NAME;
    var DialogContentModal =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ]((props, forwardedRef) => {
        const context = useDialogContext(CONTENT_NAME, props.__scopeDialog);
        const contentRef =
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'useRef'
          ](null);
        const composedRefs = (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$compose$2d$refs$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useComposedRefs'
        ])(forwardedRef, context.contentRef, contentRef);
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useEffect'
        ](
          {
            'DialogContentModal.useEffect': () => {
              const content = contentRef.current;
              if (content)
                return (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$aria$2d$hidden$2f$dist$2f$es2015$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'hideOthers'
                ])(content);
            },
          }['DialogContentModal.useEffect'],
          []
        );
        return /* @__PURE__ */ (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'jsx'
        ])(DialogContentImpl, {
          ...props,
          ref: composedRefs,
          trapFocus: context.open,
          disableOutsidePointerEvents: true,
          onCloseAutoFocus: (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$primitive$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'composeEventHandlers'
          ])(props.onCloseAutoFocus, (event) => {
            event.preventDefault();
            context.triggerRef.current?.focus();
          }),
          onPointerDownOutside: (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$primitive$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'composeEventHandlers'
          ])(props.onPointerDownOutside, (event) => {
            const originalEvent = event.detail.originalEvent;
            const ctrlLeftClick = originalEvent.button === 0 && originalEvent.ctrlKey === true;
            const isRightClick = originalEvent.button === 2 || ctrlLeftClick;
            if (isRightClick) event.preventDefault();
          }),
          onFocusOutside: (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$primitive$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'composeEventHandlers'
          ])(props.onFocusOutside, (event) => event.preventDefault()),
        });
      });
    var DialogContentNonModal =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ]((props, forwardedRef) => {
        const context = useDialogContext(CONTENT_NAME, props.__scopeDialog);
        const hasInteractedOutsideRef =
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'useRef'
          ](false);
        const hasPointerDownOutsideRef =
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'useRef'
          ](false);
        return /* @__PURE__ */ (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'jsx'
        ])(DialogContentImpl, {
          ...props,
          ref: forwardedRef,
          trapFocus: false,
          disableOutsidePointerEvents: false,
          onCloseAutoFocus: (event) => {
            props.onCloseAutoFocus?.(event);
            if (!event.defaultPrevented) {
              if (!hasInteractedOutsideRef.current) context.triggerRef.current?.focus();
              event.preventDefault();
            }
            hasInteractedOutsideRef.current = false;
            hasPointerDownOutsideRef.current = false;
          },
          onInteractOutside: (event) => {
            props.onInteractOutside?.(event);
            if (!event.defaultPrevented) {
              hasInteractedOutsideRef.current = true;
              if (event.detail.originalEvent.type === 'pointerdown') {
                hasPointerDownOutsideRef.current = true;
              }
            }
            const target = event.target;
            const targetIsTrigger = context.triggerRef.current?.contains(target);
            if (targetIsTrigger) event.preventDefault();
            if (event.detail.originalEvent.type === 'focusin' && hasPointerDownOutsideRef.current) {
              event.preventDefault();
            }
          },
        });
      });
    var DialogContentImpl =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ]((props, forwardedRef) => {
        const { __scopeDialog, trapFocus, onOpenAutoFocus, onCloseAutoFocus, ...contentProps } =
          props;
        const context = useDialogContext(CONTENT_NAME, __scopeDialog);
        const contentRef =
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'useRef'
          ](null);
        const composedRefs = (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$compose$2d$refs$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useComposedRefs'
        ])(forwardedRef, contentRef);
        (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$focus$2d$guards$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useFocusGuards'
        ])();
        return /* @__PURE__ */ (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'jsxs'
        ])(
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'Fragment'
          ],
          {
            children: [
              /* @__PURE__ */ (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'jsx'
              ])(
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$focus$2d$scope$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'FocusScope'
                ],
                {
                  asChild: true,
                  loop: true,
                  trapped: trapFocus,
                  onMountAutoFocus: onOpenAutoFocus,
                  onUnmountAutoFocus: onCloseAutoFocus,
                  children: /* @__PURE__ */ (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'jsx'
                  ])(
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dismissable$2d$layer$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'DismissableLayer'
                    ],
                    {
                      role: 'dialog',
                      id: context.contentId,
                      'aria-describedby': context.descriptionId,
                      'aria-labelledby': context.titleId,
                      'data-state': getState(context.open),
                      ...contentProps,
                      ref: composedRefs,
                      onDismiss: () => context.onOpenChange(false),
                    }
                  ),
                }
              ),
              /* @__PURE__ */ (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'jsxs'
              ])(
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'Fragment'
                ],
                {
                  children: [
                    /* @__PURE__ */ (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'jsx'
                    ])(TitleWarning, {
                      titleId: context.titleId,
                    }),
                    /* @__PURE__ */ (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'jsx'
                    ])(DescriptionWarning, {
                      contentRef,
                      descriptionId: context.descriptionId,
                    }),
                  ],
                }
              ),
            ],
          }
        );
      });
    var TITLE_NAME = 'DialogTitle';
    var DialogTitle =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ]((props, forwardedRef) => {
        const { __scopeDialog, ...titleProps } = props;
        const context = useDialogContext(TITLE_NAME, __scopeDialog);
        return /* @__PURE__ */ (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'jsx'
        ])(
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$primitive$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'Primitive'
          ].h2,
          {
            id: context.titleId,
            ...titleProps,
            ref: forwardedRef,
          }
        );
      });
    DialogTitle.displayName = TITLE_NAME;
    var DESCRIPTION_NAME = 'DialogDescription';
    var DialogDescription =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ]((props, forwardedRef) => {
        const { __scopeDialog, ...descriptionProps } = props;
        const context = useDialogContext(DESCRIPTION_NAME, __scopeDialog);
        return /* @__PURE__ */ (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'jsx'
        ])(
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$primitive$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'Primitive'
          ].p,
          {
            id: context.descriptionId,
            ...descriptionProps,
            ref: forwardedRef,
          }
        );
      });
    DialogDescription.displayName = DESCRIPTION_NAME;
    var CLOSE_NAME = 'DialogClose';
    var DialogClose =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ]((props, forwardedRef) => {
        const { __scopeDialog, ...closeProps } = props;
        const context = useDialogContext(CLOSE_NAME, __scopeDialog);
        return /* @__PURE__ */ (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'jsx'
        ])(
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$primitive$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'Primitive'
          ].button,
          {
            type: 'button',
            ...closeProps,
            ref: forwardedRef,
            onClick: (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$primitive$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'composeEventHandlers'
            ])(props.onClick, () => context.onOpenChange(false)),
          }
        );
      });
    DialogClose.displayName = CLOSE_NAME;
    function getState(open) {
      return open ? 'open' : 'closed';
    }
    var TITLE_WARNING_NAME = 'DialogTitleWarning';
    var [WarningProvider, useWarningContext] = (0,
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$context$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
      'createContext'
    ])(TITLE_WARNING_NAME, {
      contentName: CONTENT_NAME,
      titleName: TITLE_NAME,
      docsSlug: 'dialog',
    });
    var TitleWarning = ({ titleId }) => {
      const titleWarningContext = useWarningContext(TITLE_WARNING_NAME);
      const MESSAGE = `\`${titleWarningContext.contentName}\` requires a \`${titleWarningContext.titleName}\` for the component to be accessible for screen reader users.

If you want to hide the \`${titleWarningContext.titleName}\`, you can wrap it with our VisuallyHidden component.

For more information, see https://radix-ui.com/primitives/docs/components/${titleWarningContext.docsSlug}`;
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useEffect'
      ](
        {
          'TitleWarning.useEffect': () => {
            if (titleId) {
              const hasTitle = document.getElementById(titleId);
              if (!hasTitle) console.error(MESSAGE);
            }
          },
        }['TitleWarning.useEffect'],
        [MESSAGE, titleId]
      );
      return null;
    };
    var DESCRIPTION_WARNING_NAME = 'DialogDescriptionWarning';
    var DescriptionWarning = ({ contentRef, descriptionId }) => {
      const descriptionWarningContext = useWarningContext(DESCRIPTION_WARNING_NAME);
      const MESSAGE = `Warning: Missing \`Description\` or \`aria-describedby={undefined}\` for {${descriptionWarningContext.contentName}}.`;
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useEffect'
      ](
        {
          'DescriptionWarning.useEffect': () => {
            const describedById = contentRef.current?.getAttribute('aria-describedby');
            if (descriptionId && describedById) {
              const hasDescription = document.getElementById(descriptionId);
              if (!hasDescription) console.warn(MESSAGE);
            }
          },
        }['DescriptionWarning.useEffect'],
        [MESSAGE, contentRef, descriptionId]
      );
      return null;
    };
    var Root = Dialog;
    var Trigger = DialogTrigger;
    var Portal = DialogPortal;
    var Overlay = DialogOverlay;
    var Content = DialogContent;
    var Title = DialogTitle;
    var Description = DialogDescription;
    var Close = DialogClose;
    //# sourceMappingURL=index.mjs.map
  },
  '[project]/node_modules/@radix-ui/react-alert-dialog/dist/index.mjs [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'Action',
      () => Action,
      'AlertDialog',
      () => AlertDialog,
      'AlertDialogAction',
      () => AlertDialogAction,
      'AlertDialogCancel',
      () => AlertDialogCancel,
      'AlertDialogContent',
      () => AlertDialogContent,
      'AlertDialogDescription',
      () => AlertDialogDescription,
      'AlertDialogOverlay',
      () => AlertDialogOverlay,
      'AlertDialogPortal',
      () => AlertDialogPortal,
      'AlertDialogTitle',
      () => AlertDialogTitle,
      'AlertDialogTrigger',
      () => AlertDialogTrigger,
      'Cancel',
      () => Cancel,
      'Content',
      () => Content2,
      'Description',
      () => Description2,
      'Overlay',
      () => Overlay2,
      'Portal',
      () => Portal2,
      'Root',
      () => Root2,
      'Title',
      () => Title2,
      'Trigger',
      () => Trigger2,
      'createAlertDialogScope',
      () => createAlertDialogScope,
    ]);
    // src/alert-dialog.tsx
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$context$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-context/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$compose$2d$refs$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-compose-refs/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-dialog/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$primitive$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/primitive/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-slot/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-runtime.js [app-client] (ecmascript)'
      );
    ('use client');
    var ROOT_NAME = 'AlertDialog';
    var [createAlertDialogContext, createAlertDialogScope] = (0,
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$context$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
      'createContextScope'
    ])(ROOT_NAME, [
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'createDialogScope'
      ],
    ]);
    var useDialogScope = (0,
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
      'createDialogScope'
    ])();
    var AlertDialog = (props) => {
      const { __scopeAlertDialog, ...alertDialogProps } = props;
      const dialogScope = useDialogScope(__scopeAlertDialog);
      return /* @__PURE__ */ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsx'
      ])(
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Root'
        ],
        {
          ...dialogScope,
          ...alertDialogProps,
          modal: true,
        }
      );
    };
    AlertDialog.displayName = ROOT_NAME;
    var TRIGGER_NAME = 'AlertDialogTrigger';
    var AlertDialogTrigger =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ]((props, forwardedRef) => {
        const { __scopeAlertDialog, ...triggerProps } = props;
        const dialogScope = useDialogScope(__scopeAlertDialog);
        return /* @__PURE__ */ (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'jsx'
        ])(
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'Trigger'
          ],
          {
            ...dialogScope,
            ...triggerProps,
            ref: forwardedRef,
          }
        );
      });
    AlertDialogTrigger.displayName = TRIGGER_NAME;
    var PORTAL_NAME = 'AlertDialogPortal';
    var AlertDialogPortal = (props) => {
      const { __scopeAlertDialog, ...portalProps } = props;
      const dialogScope = useDialogScope(__scopeAlertDialog);
      return /* @__PURE__ */ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsx'
      ])(
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'Portal'
        ],
        {
          ...dialogScope,
          ...portalProps,
        }
      );
    };
    AlertDialogPortal.displayName = PORTAL_NAME;
    var OVERLAY_NAME = 'AlertDialogOverlay';
    var AlertDialogOverlay =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ]((props, forwardedRef) => {
        const { __scopeAlertDialog, ...overlayProps } = props;
        const dialogScope = useDialogScope(__scopeAlertDialog);
        return /* @__PURE__ */ (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'jsx'
        ])(
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'Overlay'
          ],
          {
            ...dialogScope,
            ...overlayProps,
            ref: forwardedRef,
          }
        );
      });
    AlertDialogOverlay.displayName = OVERLAY_NAME;
    var CONTENT_NAME = 'AlertDialogContent';
    var [AlertDialogContentProvider, useAlertDialogContentContext] =
      createAlertDialogContext(CONTENT_NAME);
    var Slottable = (0,
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
      'createSlottable'
    ])('AlertDialogContent');
    var AlertDialogContent =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ]((props, forwardedRef) => {
        const { __scopeAlertDialog, children, ...contentProps } = props;
        const dialogScope = useDialogScope(__scopeAlertDialog);
        const contentRef =
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'useRef'
          ](null);
        const composedRefs = (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$compose$2d$refs$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useComposedRefs'
        ])(forwardedRef, contentRef);
        const cancelRef =
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'useRef'
          ](null);
        return /* @__PURE__ */ (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'jsx'
        ])(
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'WarningProvider'
          ],
          {
            contentName: CONTENT_NAME,
            titleName: TITLE_NAME,
            docsSlug: 'alert-dialog',
            children: /* @__PURE__ */ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsx'
            ])(AlertDialogContentProvider, {
              scope: __scopeAlertDialog,
              cancelRef,
              children: /* @__PURE__ */ (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'jsxs'
              ])(
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'Content'
                ],
                {
                  role: 'alertdialog',
                  ...dialogScope,
                  ...contentProps,
                  ref: composedRefs,
                  onOpenAutoFocus: (0,
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$primitive$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'composeEventHandlers'
                  ])(contentProps.onOpenAutoFocus, (event) => {
                    event.preventDefault();
                    cancelRef.current?.focus({
                      preventScroll: true,
                    });
                  }),
                  onPointerDownOutside: (event) => event.preventDefault(),
                  onInteractOutside: (event) => event.preventDefault(),
                  children: [
                    /* @__PURE__ */ (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'jsx'
                    ])(Slottable, {
                      children,
                    }),
                    /* @__PURE__ */ (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'jsx'
                    ])(DescriptionWarning, {
                      contentRef,
                    }),
                  ],
                }
              ),
            }),
          }
        );
      });
    AlertDialogContent.displayName = CONTENT_NAME;
    var TITLE_NAME = 'AlertDialogTitle';
    var AlertDialogTitle =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ]((props, forwardedRef) => {
        const { __scopeAlertDialog, ...titleProps } = props;
        const dialogScope = useDialogScope(__scopeAlertDialog);
        return /* @__PURE__ */ (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'jsx'
        ])(
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'Title'
          ],
          {
            ...dialogScope,
            ...titleProps,
            ref: forwardedRef,
          }
        );
      });
    AlertDialogTitle.displayName = TITLE_NAME;
    var DESCRIPTION_NAME = 'AlertDialogDescription';
    var AlertDialogDescription =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ]((props, forwardedRef) => {
        const { __scopeAlertDialog, ...descriptionProps } = props;
        const dialogScope = useDialogScope(__scopeAlertDialog);
        return /* @__PURE__ */ (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'jsx'
        ])(
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'Description'
          ],
          {
            ...dialogScope,
            ...descriptionProps,
            ref: forwardedRef,
          }
        );
      });
    AlertDialogDescription.displayName = DESCRIPTION_NAME;
    var ACTION_NAME = 'AlertDialogAction';
    var AlertDialogAction =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ]((props, forwardedRef) => {
        const { __scopeAlertDialog, ...actionProps } = props;
        const dialogScope = useDialogScope(__scopeAlertDialog);
        return /* @__PURE__ */ (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'jsx'
        ])(
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'Close'
          ],
          {
            ...dialogScope,
            ...actionProps,
            ref: forwardedRef,
          }
        );
      });
    AlertDialogAction.displayName = ACTION_NAME;
    var CANCEL_NAME = 'AlertDialogCancel';
    var AlertDialogCancel =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ]((props, forwardedRef) => {
        const { __scopeAlertDialog, ...cancelProps } = props;
        const { cancelRef } = useAlertDialogContentContext(CANCEL_NAME, __scopeAlertDialog);
        const dialogScope = useDialogScope(__scopeAlertDialog);
        const ref = (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$compose$2d$refs$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useComposedRefs'
        ])(forwardedRef, cancelRef);
        return /* @__PURE__ */ (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'jsx'
        ])(
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'Close'
          ],
          {
            ...dialogScope,
            ...cancelProps,
            ref,
          }
        );
      });
    AlertDialogCancel.displayName = CANCEL_NAME;
    var DescriptionWarning = ({ contentRef }) => {
      const MESSAGE = `\`${CONTENT_NAME}\` requires a description for the component to be accessible for screen reader users.

You can add a description to the \`${CONTENT_NAME}\` by passing a \`${DESCRIPTION_NAME}\` component as a child, which also benefits sighted users by adding visible context to the dialog.

Alternatively, you can use your own component as a description by assigning it an \`id\` and passing the same value to the \`aria-describedby\` prop in \`${CONTENT_NAME}\`. If the description is confusing or duplicative for sighted users, you can use the \`@radix-ui/react-visually-hidden\` primitive as a wrapper around your description component.

For more information, see https://radix-ui.com/primitives/docs/components/alert-dialog`;
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useEffect'
      ](
        {
          'DescriptionWarning.useEffect': () => {
            const hasDescription = document.getElementById(
              contentRef.current?.getAttribute('aria-describedby')
            );
            if (!hasDescription) console.warn(MESSAGE);
          },
        }['DescriptionWarning.useEffect'],
        [MESSAGE, contentRef]
      );
      return null;
    };
    var Root2 = AlertDialog;
    var Trigger2 = AlertDialogTrigger;
    var Portal2 = AlertDialogPortal;
    var Overlay2 = AlertDialogOverlay;
    var Content2 = AlertDialogContent;
    var Action = AlertDialogAction;
    var Cancel = AlertDialogCancel;
    var Title2 = AlertDialogTitle;
    var Description2 = AlertDialogDescription;
    //# sourceMappingURL=index.mjs.map
  },
  '[project]/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['clsx', () => clsx, 'default', () => __TURBOPACK__default__export__]);
    function r(e) {
      var t,
        f,
        n = '';
      if ('string' == typeof e || 'number' == typeof e) n += e;
      else if ('object' == typeof e)
        if (Array.isArray(e)) {
          var o = e.length;
          for (t = 0; t < o; t++) e[t] && (f = r(e[t])) && (n && (n += ' '), (n += f));
        } else for (f in e) e[f] && (n && (n += ' '), (n += f));
      return n;
    }
    function clsx() {
      for (var e, t, f = 0, n = '', o = arguments.length; f < o; f++)
        (e = arguments[f]) && (t = r(e)) && (n && (n += ' '), (n += t));
      return n;
    }
    const __TURBOPACK__default__export__ = clsx;
  },
  '[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'createTailwindMerge',
      () => createTailwindMerge,
      'extendTailwindMerge',
      () => extendTailwindMerge,
      'fromTheme',
      () => fromTheme,
      'getDefaultConfig',
      () => getDefaultConfig,
      'mergeConfigs',
      () => mergeConfigs,
      'twJoin',
      () => twJoin,
      'twMerge',
      () => twMerge,
      'validators',
      () => validators,
    ]);
    const CLASS_PART_SEPARATOR = '-';
    const createClassGroupUtils = (config) => {
      const classMap = createClassMap(config);
      const { conflictingClassGroups, conflictingClassGroupModifiers } = config;
      const getClassGroupId = (className) => {
        const classParts = className.split(CLASS_PART_SEPARATOR);
        // Classes like `-inset-1` produce an empty string as first classPart. We assume that classes for negative values are used correctly and remove it from classParts.
        if (classParts[0] === '' && classParts.length !== 1) {
          classParts.shift();
        }
        return getGroupRecursive(classParts, classMap) || getGroupIdForArbitraryProperty(className);
      };
      const getConflictingClassGroupIds = (classGroupId, hasPostfixModifier) => {
        const conflicts = conflictingClassGroups[classGroupId] || [];
        if (hasPostfixModifier && conflictingClassGroupModifiers[classGroupId]) {
          return [...conflicts, ...conflictingClassGroupModifiers[classGroupId]];
        }
        return conflicts;
      };
      return {
        getClassGroupId,
        getConflictingClassGroupIds,
      };
    };
    const getGroupRecursive = (classParts, classPartObject) => {
      if (classParts.length === 0) {
        return classPartObject.classGroupId;
      }
      const currentClassPart = classParts[0];
      const nextClassPartObject = classPartObject.nextPart.get(currentClassPart);
      const classGroupFromNextClassPart = nextClassPartObject
        ? getGroupRecursive(classParts.slice(1), nextClassPartObject)
        : undefined;
      if (classGroupFromNextClassPart) {
        return classGroupFromNextClassPart;
      }
      if (classPartObject.validators.length === 0) {
        return undefined;
      }
      const classRest = classParts.join(CLASS_PART_SEPARATOR);
      return classPartObject.validators.find(({ validator }) => validator(classRest))?.classGroupId;
    };
    const arbitraryPropertyRegex = /^\[(.+)\]$/;
    const getGroupIdForArbitraryProperty = (className) => {
      if (arbitraryPropertyRegex.test(className)) {
        const arbitraryPropertyClassName = arbitraryPropertyRegex.exec(className)[1];
        const property = arbitraryPropertyClassName?.substring(
          0,
          arbitraryPropertyClassName.indexOf(':')
        );
        if (property) {
          // I use two dots here because one dot is used as prefix for class groups in plugins
          return 'arbitrary..' + property;
        }
      }
    };
    /**
     * Exported for testing only
     */ const createClassMap = (config) => {
      const { theme, prefix } = config;
      const classMap = {
        nextPart: new Map(),
        validators: [],
      };
      const prefixedClassGroupEntries = getPrefixedClassGroupEntries(
        Object.entries(config.classGroups),
        prefix
      );
      prefixedClassGroupEntries.forEach(([classGroupId, classGroup]) => {
        processClassesRecursively(classGroup, classMap, classGroupId, theme);
      });
      return classMap;
    };
    const processClassesRecursively = (classGroup, classPartObject, classGroupId, theme) => {
      classGroup.forEach((classDefinition) => {
        if (typeof classDefinition === 'string') {
          const classPartObjectToEdit =
            classDefinition === '' ? classPartObject : getPart(classPartObject, classDefinition);
          classPartObjectToEdit.classGroupId = classGroupId;
          return;
        }
        if (typeof classDefinition === 'function') {
          if (isThemeGetter(classDefinition)) {
            processClassesRecursively(classDefinition(theme), classPartObject, classGroupId, theme);
            return;
          }
          classPartObject.validators.push({
            validator: classDefinition,
            classGroupId,
          });
          return;
        }
        Object.entries(classDefinition).forEach(([key, classGroup]) => {
          processClassesRecursively(classGroup, getPart(classPartObject, key), classGroupId, theme);
        });
      });
    };
    const getPart = (classPartObject, path) => {
      let currentClassPartObject = classPartObject;
      path.split(CLASS_PART_SEPARATOR).forEach((pathPart) => {
        if (!currentClassPartObject.nextPart.has(pathPart)) {
          currentClassPartObject.nextPart.set(pathPart, {
            nextPart: new Map(),
            validators: [],
          });
        }
        currentClassPartObject = currentClassPartObject.nextPart.get(pathPart);
      });
      return currentClassPartObject;
    };
    const isThemeGetter = (func) => func.isThemeGetter;
    const getPrefixedClassGroupEntries = (classGroupEntries, prefix) => {
      if (!prefix) {
        return classGroupEntries;
      }
      return classGroupEntries.map(([classGroupId, classGroup]) => {
        const prefixedClassGroup = classGroup.map((classDefinition) => {
          if (typeof classDefinition === 'string') {
            return prefix + classDefinition;
          }
          if (typeof classDefinition === 'object') {
            return Object.fromEntries(
              Object.entries(classDefinition).map(([key, value]) => [prefix + key, value])
            );
          }
          return classDefinition;
        });
        return [classGroupId, prefixedClassGroup];
      });
    };
    // LRU cache inspired from hashlru (https://github.com/dominictarr/hashlru/blob/v1.0.4/index.js) but object replaced with Map to improve performance
    const createLruCache = (maxCacheSize) => {
      if (maxCacheSize < 1) {
        return {
          get: () => undefined,
          set: () => {},
        };
      }
      let cacheSize = 0;
      let cache = new Map();
      let previousCache = new Map();
      const update = (key, value) => {
        cache.set(key, value);
        cacheSize++;
        if (cacheSize > maxCacheSize) {
          cacheSize = 0;
          previousCache = cache;
          cache = new Map();
        }
      };
      return {
        get(key) {
          let value = cache.get(key);
          if (value !== undefined) {
            return value;
          }
          if ((value = previousCache.get(key)) !== undefined) {
            update(key, value);
            return value;
          }
        },
        set(key, value) {
          if (cache.has(key)) {
            cache.set(key, value);
          } else {
            update(key, value);
          }
        },
      };
    };
    const IMPORTANT_MODIFIER = '!';
    const createParseClassName = (config) => {
      const { separator, experimentalParseClassName } = config;
      const isSeparatorSingleCharacter = separator.length === 1;
      const firstSeparatorCharacter = separator[0];
      const separatorLength = separator.length;
      // parseClassName inspired by https://github.com/tailwindlabs/tailwindcss/blob/v3.2.2/src/util/splitAtTopLevelOnly.js
      const parseClassName = (className) => {
        const modifiers = [];
        let bracketDepth = 0;
        let modifierStart = 0;
        let postfixModifierPosition;
        for (let index = 0; index < className.length; index++) {
          let currentCharacter = className[index];
          if (bracketDepth === 0) {
            if (
              currentCharacter === firstSeparatorCharacter &&
              (isSeparatorSingleCharacter ||
                className.slice(index, index + separatorLength) === separator)
            ) {
              modifiers.push(className.slice(modifierStart, index));
              modifierStart = index + separatorLength;
              continue;
            }
            if (currentCharacter === '/') {
              postfixModifierPosition = index;
              continue;
            }
          }
          if (currentCharacter === '[') {
            bracketDepth++;
          } else if (currentCharacter === ']') {
            bracketDepth--;
          }
        }
        const baseClassNameWithImportantModifier =
          modifiers.length === 0 ? className : className.substring(modifierStart);
        const hasImportantModifier =
          baseClassNameWithImportantModifier.startsWith(IMPORTANT_MODIFIER);
        const baseClassName = hasImportantModifier
          ? baseClassNameWithImportantModifier.substring(1)
          : baseClassNameWithImportantModifier;
        const maybePostfixModifierPosition =
          postfixModifierPosition && postfixModifierPosition > modifierStart
            ? postfixModifierPosition - modifierStart
            : undefined;
        return {
          modifiers,
          hasImportantModifier,
          baseClassName,
          maybePostfixModifierPosition,
        };
      };
      if (experimentalParseClassName) {
        return (className) =>
          experimentalParseClassName({
            className,
            parseClassName,
          });
      }
      return parseClassName;
    };
    /**
     * Sorts modifiers according to following schema:
     * - Predefined modifiers are sorted alphabetically
     * - When an arbitrary variant appears, it must be preserved which modifiers are before and after it
     */ const sortModifiers = (modifiers) => {
      if (modifiers.length <= 1) {
        return modifiers;
      }
      const sortedModifiers = [];
      let unsortedModifiers = [];
      modifiers.forEach((modifier) => {
        const isArbitraryVariant = modifier[0] === '[';
        if (isArbitraryVariant) {
          sortedModifiers.push(...unsortedModifiers.sort(), modifier);
          unsortedModifiers = [];
        } else {
          unsortedModifiers.push(modifier);
        }
      });
      sortedModifiers.push(...unsortedModifiers.sort());
      return sortedModifiers;
    };
    const createConfigUtils = (config) => ({
      cache: createLruCache(config.cacheSize),
      parseClassName: createParseClassName(config),
      ...createClassGroupUtils(config),
    });
    const SPLIT_CLASSES_REGEX = /\s+/;
    const mergeClassList = (classList, configUtils) => {
      const { parseClassName, getClassGroupId, getConflictingClassGroupIds } = configUtils;
      /**
       * Set of classGroupIds in following format:
       * `{importantModifier}{variantModifiers}{classGroupId}`
       * @example 'float'
       * @example 'hover:focus:bg-color'
       * @example 'md:!pr'
       */ const classGroupsInConflict = [];
      const classNames = classList.trim().split(SPLIT_CLASSES_REGEX);
      let result = '';
      for (let index = classNames.length - 1; index >= 0; index -= 1) {
        const originalClassName = classNames[index];
        const { modifiers, hasImportantModifier, baseClassName, maybePostfixModifierPosition } =
          parseClassName(originalClassName);
        let hasPostfixModifier = Boolean(maybePostfixModifierPosition);
        let classGroupId = getClassGroupId(
          hasPostfixModifier
            ? baseClassName.substring(0, maybePostfixModifierPosition)
            : baseClassName
        );
        if (!classGroupId) {
          if (!hasPostfixModifier) {
            // Not a Tailwind class
            result = originalClassName + (result.length > 0 ? ' ' + result : result);
            continue;
          }
          classGroupId = getClassGroupId(baseClassName);
          if (!classGroupId) {
            // Not a Tailwind class
            result = originalClassName + (result.length > 0 ? ' ' + result : result);
            continue;
          }
          hasPostfixModifier = false;
        }
        const variantModifier = sortModifiers(modifiers).join(':');
        const modifierId = hasImportantModifier
          ? variantModifier + IMPORTANT_MODIFIER
          : variantModifier;
        const classId = modifierId + classGroupId;
        if (classGroupsInConflict.includes(classId)) {
          continue;
        }
        classGroupsInConflict.push(classId);
        const conflictGroups = getConflictingClassGroupIds(classGroupId, hasPostfixModifier);
        for (let i = 0; i < conflictGroups.length; ++i) {
          const group = conflictGroups[i];
          classGroupsInConflict.push(modifierId + group);
        }
        // Tailwind class not in conflict
        result = originalClassName + (result.length > 0 ? ' ' + result : result);
      }
      return result;
    };
    /**
     * The code in this file is copied from https://github.com/lukeed/clsx and modified to suit the needs of tailwind-merge better.
     *
     * Specifically:
     * - Runtime code from https://github.com/lukeed/clsx/blob/v1.2.1/src/index.js
     * - TypeScript types from https://github.com/lukeed/clsx/blob/v1.2.1/clsx.d.ts
     *
     * Original code has MIT license: Copyright (c) Luke Edwards <luke.edwards05@gmail.com> (lukeed.com)
     */ function twJoin() {
      let index = 0;
      let argument;
      let resolvedValue;
      let string = '';
      while (index < arguments.length) {
        if ((argument = arguments[index++])) {
          if ((resolvedValue = toValue(argument))) {
            string && (string += ' ');
            string += resolvedValue;
          }
        }
      }
      return string;
    }
    const toValue = (mix) => {
      if (typeof mix === 'string') {
        return mix;
      }
      let resolvedValue;
      let string = '';
      for (let k = 0; k < mix.length; k++) {
        if (mix[k]) {
          if ((resolvedValue = toValue(mix[k]))) {
            string && (string += ' ');
            string += resolvedValue;
          }
        }
      }
      return string;
    };
    function createTailwindMerge(createConfigFirst, ...createConfigRest) {
      let configUtils;
      let cacheGet;
      let cacheSet;
      let functionToCall = initTailwindMerge;
      function initTailwindMerge(classList) {
        const config = createConfigRest.reduce(
          (previousConfig, createConfigCurrent) => createConfigCurrent(previousConfig),
          createConfigFirst()
        );
        configUtils = createConfigUtils(config);
        cacheGet = configUtils.cache.get;
        cacheSet = configUtils.cache.set;
        functionToCall = tailwindMerge;
        return tailwindMerge(classList);
      }
      function tailwindMerge(classList) {
        const cachedResult = cacheGet(classList);
        if (cachedResult) {
          return cachedResult;
        }
        const result = mergeClassList(classList, configUtils);
        cacheSet(classList, result);
        return result;
      }
      return function callTailwindMerge() {
        return functionToCall(twJoin.apply(null, arguments));
      };
    }
    const fromTheme = (key) => {
      const themeGetter = (theme) => theme[key] || [];
      themeGetter.isThemeGetter = true;
      return themeGetter;
    };
    const arbitraryValueRegex = /^\[(?:([a-z-]+):)?(.+)\]$/i;
    const fractionRegex = /^\d+\/\d+$/;
    const stringLengths = /*#__PURE__*/ new Set(['px', 'full', 'screen']);
    const tshirtUnitRegex = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/;
    const lengthUnitRegex =
      /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/;
    const colorFunctionRegex = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/;
    // Shadow always begins with x and y offset separated by underscore optionally prepended by inset
    const shadowRegex = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/;
    const imageRegex =
      /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/;
    const isLength = (value) =>
      isNumber(value) || stringLengths.has(value) || fractionRegex.test(value);
    const isArbitraryLength = (value) => getIsArbitraryValue(value, 'length', isLengthOnly);
    const isNumber = (value) => Boolean(value) && !Number.isNaN(Number(value));
    const isArbitraryNumber = (value) => getIsArbitraryValue(value, 'number', isNumber);
    const isInteger = (value) => Boolean(value) && Number.isInteger(Number(value));
    const isPercent = (value) => value.endsWith('%') && isNumber(value.slice(0, -1));
    const isArbitraryValue = (value) => arbitraryValueRegex.test(value);
    const isTshirtSize = (value) => tshirtUnitRegex.test(value);
    const sizeLabels = /*#__PURE__*/ new Set(['length', 'size', 'percentage']);
    const isArbitrarySize = (value) => getIsArbitraryValue(value, sizeLabels, isNever);
    const isArbitraryPosition = (value) => getIsArbitraryValue(value, 'position', isNever);
    const imageLabels = /*#__PURE__*/ new Set(['image', 'url']);
    const isArbitraryImage = (value) => getIsArbitraryValue(value, imageLabels, isImage);
    const isArbitraryShadow = (value) => getIsArbitraryValue(value, '', isShadow);
    const isAny = () => true;
    const getIsArbitraryValue = (value, label, testValue) => {
      const result = arbitraryValueRegex.exec(value);
      if (result) {
        if (result[1]) {
          return typeof label === 'string' ? result[1] === label : label.has(result[1]);
        }
        return testValue(result[2]);
      }
      return false;
    };
    const isLengthOnly = (
      value // `colorFunctionRegex` check is necessary because color functions can have percentages in them which which would be incorrectly classified as lengths.
    ) =>
      // For example, `hsl(0 0% 0%)` would be classified as a length without this check.
      // I could also use lookbehind assertion in `lengthUnitRegex` but that isn't supported widely enough.
      lengthUnitRegex.test(value) && !colorFunctionRegex.test(value);
    const isNever = () => false;
    const isShadow = (value) => shadowRegex.test(value);
    const isImage = (value) => imageRegex.test(value);
    const validators = /*#__PURE__*/ Object.defineProperty(
      {
        __proto__: null,
        isAny,
        isArbitraryImage,
        isArbitraryLength,
        isArbitraryNumber,
        isArbitraryPosition,
        isArbitraryShadow,
        isArbitrarySize,
        isArbitraryValue,
        isInteger,
        isLength,
        isNumber,
        isPercent,
        isTshirtSize,
      },
      Symbol.toStringTag,
      {
        value: 'Module',
      }
    );
    const getDefaultConfig = () => {
      const colors = fromTheme('colors');
      const spacing = fromTheme('spacing');
      const blur = fromTheme('blur');
      const brightness = fromTheme('brightness');
      const borderColor = fromTheme('borderColor');
      const borderRadius = fromTheme('borderRadius');
      const borderSpacing = fromTheme('borderSpacing');
      const borderWidth = fromTheme('borderWidth');
      const contrast = fromTheme('contrast');
      const grayscale = fromTheme('grayscale');
      const hueRotate = fromTheme('hueRotate');
      const invert = fromTheme('invert');
      const gap = fromTheme('gap');
      const gradientColorStops = fromTheme('gradientColorStops');
      const gradientColorStopPositions = fromTheme('gradientColorStopPositions');
      const inset = fromTheme('inset');
      const margin = fromTheme('margin');
      const opacity = fromTheme('opacity');
      const padding = fromTheme('padding');
      const saturate = fromTheme('saturate');
      const scale = fromTheme('scale');
      const sepia = fromTheme('sepia');
      const skew = fromTheme('skew');
      const space = fromTheme('space');
      const translate = fromTheme('translate');
      const getOverscroll = () => ['auto', 'contain', 'none'];
      const getOverflow = () => ['auto', 'hidden', 'clip', 'visible', 'scroll'];
      const getSpacingWithAutoAndArbitrary = () => ['auto', isArbitraryValue, spacing];
      const getSpacingWithArbitrary = () => [isArbitraryValue, spacing];
      const getLengthWithEmptyAndArbitrary = () => ['', isLength, isArbitraryLength];
      const getNumberWithAutoAndArbitrary = () => ['auto', isNumber, isArbitraryValue];
      const getPositions = () => [
        'bottom',
        'center',
        'left',
        'left-bottom',
        'left-top',
        'right',
        'right-bottom',
        'right-top',
        'top',
      ];
      const getLineStyles = () => ['solid', 'dashed', 'dotted', 'double', 'none'];
      const getBlendModes = () => [
        'normal',
        'multiply',
        'screen',
        'overlay',
        'darken',
        'lighten',
        'color-dodge',
        'color-burn',
        'hard-light',
        'soft-light',
        'difference',
        'exclusion',
        'hue',
        'saturation',
        'color',
        'luminosity',
      ];
      const getAlign = () => ['start', 'end', 'center', 'between', 'around', 'evenly', 'stretch'];
      const getZeroAndEmpty = () => ['', '0', isArbitraryValue];
      const getBreaks = () => [
        'auto',
        'avoid',
        'all',
        'avoid-page',
        'page',
        'left',
        'right',
        'column',
      ];
      const getNumberAndArbitrary = () => [isNumber, isArbitraryValue];
      return {
        cacheSize: 500,
        separator: ':',
        theme: {
          colors: [isAny],
          spacing: [isLength, isArbitraryLength],
          blur: ['none', '', isTshirtSize, isArbitraryValue],
          brightness: getNumberAndArbitrary(),
          borderColor: [colors],
          borderRadius: ['none', '', 'full', isTshirtSize, isArbitraryValue],
          borderSpacing: getSpacingWithArbitrary(),
          borderWidth: getLengthWithEmptyAndArbitrary(),
          contrast: getNumberAndArbitrary(),
          grayscale: getZeroAndEmpty(),
          hueRotate: getNumberAndArbitrary(),
          invert: getZeroAndEmpty(),
          gap: getSpacingWithArbitrary(),
          gradientColorStops: [colors],
          gradientColorStopPositions: [isPercent, isArbitraryLength],
          inset: getSpacingWithAutoAndArbitrary(),
          margin: getSpacingWithAutoAndArbitrary(),
          opacity: getNumberAndArbitrary(),
          padding: getSpacingWithArbitrary(),
          saturate: getNumberAndArbitrary(),
          scale: getNumberAndArbitrary(),
          sepia: getZeroAndEmpty(),
          skew: getNumberAndArbitrary(),
          space: getSpacingWithArbitrary(),
          translate: getSpacingWithArbitrary(),
        },
        classGroups: {
          // Layout
          /**
           * Aspect Ratio
           * @see https://tailwindcss.com/docs/aspect-ratio
           */ aspect: [
            {
              aspect: ['auto', 'square', 'video', isArbitraryValue],
            },
          ],
          /**
           * Container
           * @see https://tailwindcss.com/docs/container
           */ container: ['container'],
          /**
           * Columns
           * @see https://tailwindcss.com/docs/columns
           */ columns: [
            {
              columns: [isTshirtSize],
            },
          ],
          /**
           * Break After
           * @see https://tailwindcss.com/docs/break-after
           */ 'break-after': [
            {
              'break-after': getBreaks(),
            },
          ],
          /**
           * Break Before
           * @see https://tailwindcss.com/docs/break-before
           */ 'break-before': [
            {
              'break-before': getBreaks(),
            },
          ],
          /**
           * Break Inside
           * @see https://tailwindcss.com/docs/break-inside
           */ 'break-inside': [
            {
              'break-inside': ['auto', 'avoid', 'avoid-page', 'avoid-column'],
            },
          ],
          /**
           * Box Decoration Break
           * @see https://tailwindcss.com/docs/box-decoration-break
           */ 'box-decoration': [
            {
              'box-decoration': ['slice', 'clone'],
            },
          ],
          /**
           * Box Sizing
           * @see https://tailwindcss.com/docs/box-sizing
           */ box: [
            {
              box: ['border', 'content'],
            },
          ],
          /**
           * Display
           * @see https://tailwindcss.com/docs/display
           */ display: [
            'block',
            'inline-block',
            'inline',
            'flex',
            'inline-flex',
            'table',
            'inline-table',
            'table-caption',
            'table-cell',
            'table-column',
            'table-column-group',
            'table-footer-group',
            'table-header-group',
            'table-row-group',
            'table-row',
            'flow-root',
            'grid',
            'inline-grid',
            'contents',
            'list-item',
            'hidden',
          ],
          /**
           * Floats
           * @see https://tailwindcss.com/docs/float
           */ float: [
            {
              float: ['right', 'left', 'none', 'start', 'end'],
            },
          ],
          /**
           * Clear
           * @see https://tailwindcss.com/docs/clear
           */ clear: [
            {
              clear: ['left', 'right', 'both', 'none', 'start', 'end'],
            },
          ],
          /**
           * Isolation
           * @see https://tailwindcss.com/docs/isolation
           */ isolation: ['isolate', 'isolation-auto'],
          /**
           * Object Fit
           * @see https://tailwindcss.com/docs/object-fit
           */ 'object-fit': [
            {
              object: ['contain', 'cover', 'fill', 'none', 'scale-down'],
            },
          ],
          /**
           * Object Position
           * @see https://tailwindcss.com/docs/object-position
           */ 'object-position': [
            {
              object: [...getPositions(), isArbitraryValue],
            },
          ],
          /**
           * Overflow
           * @see https://tailwindcss.com/docs/overflow
           */ overflow: [
            {
              overflow: getOverflow(),
            },
          ],
          /**
           * Overflow X
           * @see https://tailwindcss.com/docs/overflow
           */ 'overflow-x': [
            {
              'overflow-x': getOverflow(),
            },
          ],
          /**
           * Overflow Y
           * @see https://tailwindcss.com/docs/overflow
           */ 'overflow-y': [
            {
              'overflow-y': getOverflow(),
            },
          ],
          /**
           * Overscroll Behavior
           * @see https://tailwindcss.com/docs/overscroll-behavior
           */ overscroll: [
            {
              overscroll: getOverscroll(),
            },
          ],
          /**
           * Overscroll Behavior X
           * @see https://tailwindcss.com/docs/overscroll-behavior
           */ 'overscroll-x': [
            {
              'overscroll-x': getOverscroll(),
            },
          ],
          /**
           * Overscroll Behavior Y
           * @see https://tailwindcss.com/docs/overscroll-behavior
           */ 'overscroll-y': [
            {
              'overscroll-y': getOverscroll(),
            },
          ],
          /**
           * Position
           * @see https://tailwindcss.com/docs/position
           */ position: ['static', 'fixed', 'absolute', 'relative', 'sticky'],
          /**
           * Top / Right / Bottom / Left
           * @see https://tailwindcss.com/docs/top-right-bottom-left
           */ inset: [
            {
              inset: [inset],
            },
          ],
          /**
           * Right / Left
           * @see https://tailwindcss.com/docs/top-right-bottom-left
           */ 'inset-x': [
            {
              'inset-x': [inset],
            },
          ],
          /**
           * Top / Bottom
           * @see https://tailwindcss.com/docs/top-right-bottom-left
           */ 'inset-y': [
            {
              'inset-y': [inset],
            },
          ],
          /**
           * Start
           * @see https://tailwindcss.com/docs/top-right-bottom-left
           */ start: [
            {
              start: [inset],
            },
          ],
          /**
           * End
           * @see https://tailwindcss.com/docs/top-right-bottom-left
           */ end: [
            {
              end: [inset],
            },
          ],
          /**
           * Top
           * @see https://tailwindcss.com/docs/top-right-bottom-left
           */ top: [
            {
              top: [inset],
            },
          ],
          /**
           * Right
           * @see https://tailwindcss.com/docs/top-right-bottom-left
           */ right: [
            {
              right: [inset],
            },
          ],
          /**
           * Bottom
           * @see https://tailwindcss.com/docs/top-right-bottom-left
           */ bottom: [
            {
              bottom: [inset],
            },
          ],
          /**
           * Left
           * @see https://tailwindcss.com/docs/top-right-bottom-left
           */ left: [
            {
              left: [inset],
            },
          ],
          /**
           * Visibility
           * @see https://tailwindcss.com/docs/visibility
           */ visibility: ['visible', 'invisible', 'collapse'],
          /**
           * Z-Index
           * @see https://tailwindcss.com/docs/z-index
           */ z: [
            {
              z: ['auto', isInteger, isArbitraryValue],
            },
          ],
          // Flexbox and Grid
          /**
           * Flex Basis
           * @see https://tailwindcss.com/docs/flex-basis
           */ basis: [
            {
              basis: getSpacingWithAutoAndArbitrary(),
            },
          ],
          /**
           * Flex Direction
           * @see https://tailwindcss.com/docs/flex-direction
           */ 'flex-direction': [
            {
              flex: ['row', 'row-reverse', 'col', 'col-reverse'],
            },
          ],
          /**
           * Flex Wrap
           * @see https://tailwindcss.com/docs/flex-wrap
           */ 'flex-wrap': [
            {
              flex: ['wrap', 'wrap-reverse', 'nowrap'],
            },
          ],
          /**
           * Flex
           * @see https://tailwindcss.com/docs/flex
           */ flex: [
            {
              flex: ['1', 'auto', 'initial', 'none', isArbitraryValue],
            },
          ],
          /**
           * Flex Grow
           * @see https://tailwindcss.com/docs/flex-grow
           */ grow: [
            {
              grow: getZeroAndEmpty(),
            },
          ],
          /**
           * Flex Shrink
           * @see https://tailwindcss.com/docs/flex-shrink
           */ shrink: [
            {
              shrink: getZeroAndEmpty(),
            },
          ],
          /**
           * Order
           * @see https://tailwindcss.com/docs/order
           */ order: [
            {
              order: ['first', 'last', 'none', isInteger, isArbitraryValue],
            },
          ],
          /**
           * Grid Template Columns
           * @see https://tailwindcss.com/docs/grid-template-columns
           */ 'grid-cols': [
            {
              'grid-cols': [isAny],
            },
          ],
          /**
           * Grid Column Start / End
           * @see https://tailwindcss.com/docs/grid-column
           */ 'col-start-end': [
            {
              col: [
                'auto',
                {
                  span: ['full', isInteger, isArbitraryValue],
                },
                isArbitraryValue,
              ],
            },
          ],
          /**
           * Grid Column Start
           * @see https://tailwindcss.com/docs/grid-column
           */ 'col-start': [
            {
              'col-start': getNumberWithAutoAndArbitrary(),
            },
          ],
          /**
           * Grid Column End
           * @see https://tailwindcss.com/docs/grid-column
           */ 'col-end': [
            {
              'col-end': getNumberWithAutoAndArbitrary(),
            },
          ],
          /**
           * Grid Template Rows
           * @see https://tailwindcss.com/docs/grid-template-rows
           */ 'grid-rows': [
            {
              'grid-rows': [isAny],
            },
          ],
          /**
           * Grid Row Start / End
           * @see https://tailwindcss.com/docs/grid-row
           */ 'row-start-end': [
            {
              row: [
                'auto',
                {
                  span: [isInteger, isArbitraryValue],
                },
                isArbitraryValue,
              ],
            },
          ],
          /**
           * Grid Row Start
           * @see https://tailwindcss.com/docs/grid-row
           */ 'row-start': [
            {
              'row-start': getNumberWithAutoAndArbitrary(),
            },
          ],
          /**
           * Grid Row End
           * @see https://tailwindcss.com/docs/grid-row
           */ 'row-end': [
            {
              'row-end': getNumberWithAutoAndArbitrary(),
            },
          ],
          /**
           * Grid Auto Flow
           * @see https://tailwindcss.com/docs/grid-auto-flow
           */ 'grid-flow': [
            {
              'grid-flow': ['row', 'col', 'dense', 'row-dense', 'col-dense'],
            },
          ],
          /**
           * Grid Auto Columns
           * @see https://tailwindcss.com/docs/grid-auto-columns
           */ 'auto-cols': [
            {
              'auto-cols': ['auto', 'min', 'max', 'fr', isArbitraryValue],
            },
          ],
          /**
           * Grid Auto Rows
           * @see https://tailwindcss.com/docs/grid-auto-rows
           */ 'auto-rows': [
            {
              'auto-rows': ['auto', 'min', 'max', 'fr', isArbitraryValue],
            },
          ],
          /**
           * Gap
           * @see https://tailwindcss.com/docs/gap
           */ gap: [
            {
              gap: [gap],
            },
          ],
          /**
           * Gap X
           * @see https://tailwindcss.com/docs/gap
           */ 'gap-x': [
            {
              'gap-x': [gap],
            },
          ],
          /**
           * Gap Y
           * @see https://tailwindcss.com/docs/gap
           */ 'gap-y': [
            {
              'gap-y': [gap],
            },
          ],
          /**
           * Justify Content
           * @see https://tailwindcss.com/docs/justify-content
           */ 'justify-content': [
            {
              justify: ['normal', ...getAlign()],
            },
          ],
          /**
           * Justify Items
           * @see https://tailwindcss.com/docs/justify-items
           */ 'justify-items': [
            {
              'justify-items': ['start', 'end', 'center', 'stretch'],
            },
          ],
          /**
           * Justify Self
           * @see https://tailwindcss.com/docs/justify-self
           */ 'justify-self': [
            {
              'justify-self': ['auto', 'start', 'end', 'center', 'stretch'],
            },
          ],
          /**
           * Align Content
           * @see https://tailwindcss.com/docs/align-content
           */ 'align-content': [
            {
              content: ['normal', ...getAlign(), 'baseline'],
            },
          ],
          /**
           * Align Items
           * @see https://tailwindcss.com/docs/align-items
           */ 'align-items': [
            {
              items: ['start', 'end', 'center', 'baseline', 'stretch'],
            },
          ],
          /**
           * Align Self
           * @see https://tailwindcss.com/docs/align-self
           */ 'align-self': [
            {
              self: ['auto', 'start', 'end', 'center', 'stretch', 'baseline'],
            },
          ],
          /**
           * Place Content
           * @see https://tailwindcss.com/docs/place-content
           */ 'place-content': [
            {
              'place-content': [...getAlign(), 'baseline'],
            },
          ],
          /**
           * Place Items
           * @see https://tailwindcss.com/docs/place-items
           */ 'place-items': [
            {
              'place-items': ['start', 'end', 'center', 'baseline', 'stretch'],
            },
          ],
          /**
           * Place Self
           * @see https://tailwindcss.com/docs/place-self
           */ 'place-self': [
            {
              'place-self': ['auto', 'start', 'end', 'center', 'stretch'],
            },
          ],
          // Spacing
          /**
           * Padding
           * @see https://tailwindcss.com/docs/padding
           */ p: [
            {
              p: [padding],
            },
          ],
          /**
           * Padding X
           * @see https://tailwindcss.com/docs/padding
           */ px: [
            {
              px: [padding],
            },
          ],
          /**
           * Padding Y
           * @see https://tailwindcss.com/docs/padding
           */ py: [
            {
              py: [padding],
            },
          ],
          /**
           * Padding Start
           * @see https://tailwindcss.com/docs/padding
           */ ps: [
            {
              ps: [padding],
            },
          ],
          /**
           * Padding End
           * @see https://tailwindcss.com/docs/padding
           */ pe: [
            {
              pe: [padding],
            },
          ],
          /**
           * Padding Top
           * @see https://tailwindcss.com/docs/padding
           */ pt: [
            {
              pt: [padding],
            },
          ],
          /**
           * Padding Right
           * @see https://tailwindcss.com/docs/padding
           */ pr: [
            {
              pr: [padding],
            },
          ],
          /**
           * Padding Bottom
           * @see https://tailwindcss.com/docs/padding
           */ pb: [
            {
              pb: [padding],
            },
          ],
          /**
           * Padding Left
           * @see https://tailwindcss.com/docs/padding
           */ pl: [
            {
              pl: [padding],
            },
          ],
          /**
           * Margin
           * @see https://tailwindcss.com/docs/margin
           */ m: [
            {
              m: [margin],
            },
          ],
          /**
           * Margin X
           * @see https://tailwindcss.com/docs/margin
           */ mx: [
            {
              mx: [margin],
            },
          ],
          /**
           * Margin Y
           * @see https://tailwindcss.com/docs/margin
           */ my: [
            {
              my: [margin],
            },
          ],
          /**
           * Margin Start
           * @see https://tailwindcss.com/docs/margin
           */ ms: [
            {
              ms: [margin],
            },
          ],
          /**
           * Margin End
           * @see https://tailwindcss.com/docs/margin
           */ me: [
            {
              me: [margin],
            },
          ],
          /**
           * Margin Top
           * @see https://tailwindcss.com/docs/margin
           */ mt: [
            {
              mt: [margin],
            },
          ],
          /**
           * Margin Right
           * @see https://tailwindcss.com/docs/margin
           */ mr: [
            {
              mr: [margin],
            },
          ],
          /**
           * Margin Bottom
           * @see https://tailwindcss.com/docs/margin
           */ mb: [
            {
              mb: [margin],
            },
          ],
          /**
           * Margin Left
           * @see https://tailwindcss.com/docs/margin
           */ ml: [
            {
              ml: [margin],
            },
          ],
          /**
           * Space Between X
           * @see https://tailwindcss.com/docs/space
           */ 'space-x': [
            {
              'space-x': [space],
            },
          ],
          /**
           * Space Between X Reverse
           * @see https://tailwindcss.com/docs/space
           */ 'space-x-reverse': ['space-x-reverse'],
          /**
           * Space Between Y
           * @see https://tailwindcss.com/docs/space
           */ 'space-y': [
            {
              'space-y': [space],
            },
          ],
          /**
           * Space Between Y Reverse
           * @see https://tailwindcss.com/docs/space
           */ 'space-y-reverse': ['space-y-reverse'],
          // Sizing
          /**
           * Width
           * @see https://tailwindcss.com/docs/width
           */ w: [
            {
              w: ['auto', 'min', 'max', 'fit', 'svw', 'lvw', 'dvw', isArbitraryValue, spacing],
            },
          ],
          /**
           * Min-Width
           * @see https://tailwindcss.com/docs/min-width
           */ 'min-w': [
            {
              'min-w': [isArbitraryValue, spacing, 'min', 'max', 'fit'],
            },
          ],
          /**
           * Max-Width
           * @see https://tailwindcss.com/docs/max-width
           */ 'max-w': [
            {
              'max-w': [
                isArbitraryValue,
                spacing,
                'none',
                'full',
                'min',
                'max',
                'fit',
                'prose',
                {
                  screen: [isTshirtSize],
                },
                isTshirtSize,
              ],
            },
          ],
          /**
           * Height
           * @see https://tailwindcss.com/docs/height
           */ h: [
            {
              h: [isArbitraryValue, spacing, 'auto', 'min', 'max', 'fit', 'svh', 'lvh', 'dvh'],
            },
          ],
          /**
           * Min-Height
           * @see https://tailwindcss.com/docs/min-height
           */ 'min-h': [
            {
              'min-h': [isArbitraryValue, spacing, 'min', 'max', 'fit', 'svh', 'lvh', 'dvh'],
            },
          ],
          /**
           * Max-Height
           * @see https://tailwindcss.com/docs/max-height
           */ 'max-h': [
            {
              'max-h': [isArbitraryValue, spacing, 'min', 'max', 'fit', 'svh', 'lvh', 'dvh'],
            },
          ],
          /**
           * Size
           * @see https://tailwindcss.com/docs/size
           */ size: [
            {
              size: [isArbitraryValue, spacing, 'auto', 'min', 'max', 'fit'],
            },
          ],
          // Typography
          /**
           * Font Size
           * @see https://tailwindcss.com/docs/font-size
           */ 'font-size': [
            {
              text: ['base', isTshirtSize, isArbitraryLength],
            },
          ],
          /**
           * Font Smoothing
           * @see https://tailwindcss.com/docs/font-smoothing
           */ 'font-smoothing': ['antialiased', 'subpixel-antialiased'],
          /**
           * Font Style
           * @see https://tailwindcss.com/docs/font-style
           */ 'font-style': ['italic', 'not-italic'],
          /**
           * Font Weight
           * @see https://tailwindcss.com/docs/font-weight
           */ 'font-weight': [
            {
              font: [
                'thin',
                'extralight',
                'light',
                'normal',
                'medium',
                'semibold',
                'bold',
                'extrabold',
                'black',
                isArbitraryNumber,
              ],
            },
          ],
          /**
           * Font Family
           * @see https://tailwindcss.com/docs/font-family
           */ 'font-family': [
            {
              font: [isAny],
            },
          ],
          /**
           * Font Variant Numeric
           * @see https://tailwindcss.com/docs/font-variant-numeric
           */ 'fvn-normal': ['normal-nums'],
          /**
           * Font Variant Numeric
           * @see https://tailwindcss.com/docs/font-variant-numeric
           */ 'fvn-ordinal': ['ordinal'],
          /**
           * Font Variant Numeric
           * @see https://tailwindcss.com/docs/font-variant-numeric
           */ 'fvn-slashed-zero': ['slashed-zero'],
          /**
           * Font Variant Numeric
           * @see https://tailwindcss.com/docs/font-variant-numeric
           */ 'fvn-figure': ['lining-nums', 'oldstyle-nums'],
          /**
           * Font Variant Numeric
           * @see https://tailwindcss.com/docs/font-variant-numeric
           */ 'fvn-spacing': ['proportional-nums', 'tabular-nums'],
          /**
           * Font Variant Numeric
           * @see https://tailwindcss.com/docs/font-variant-numeric
           */ 'fvn-fraction': ['diagonal-fractions', 'stacked-fractions'],
          /**
           * Letter Spacing
           * @see https://tailwindcss.com/docs/letter-spacing
           */ tracking: [
            {
              tracking: ['tighter', 'tight', 'normal', 'wide', 'wider', 'widest', isArbitraryValue],
            },
          ],
          /**
           * Line Clamp
           * @see https://tailwindcss.com/docs/line-clamp
           */ 'line-clamp': [
            {
              'line-clamp': ['none', isNumber, isArbitraryNumber],
            },
          ],
          /**
           * Line Height
           * @see https://tailwindcss.com/docs/line-height
           */ leading: [
            {
              leading: [
                'none',
                'tight',
                'snug',
                'normal',
                'relaxed',
                'loose',
                isLength,
                isArbitraryValue,
              ],
            },
          ],
          /**
           * List Style Image
           * @see https://tailwindcss.com/docs/list-style-image
           */ 'list-image': [
            {
              'list-image': ['none', isArbitraryValue],
            },
          ],
          /**
           * List Style Type
           * @see https://tailwindcss.com/docs/list-style-type
           */ 'list-style-type': [
            {
              list: ['none', 'disc', 'decimal', isArbitraryValue],
            },
          ],
          /**
           * List Style Position
           * @see https://tailwindcss.com/docs/list-style-position
           */ 'list-style-position': [
            {
              list: ['inside', 'outside'],
            },
          ],
          /**
           * Placeholder Color
           * @deprecated since Tailwind CSS v3.0.0
           * @see https://tailwindcss.com/docs/placeholder-color
           */ 'placeholder-color': [
            {
              placeholder: [colors],
            },
          ],
          /**
           * Placeholder Opacity
           * @see https://tailwindcss.com/docs/placeholder-opacity
           */ 'placeholder-opacity': [
            {
              'placeholder-opacity': [opacity],
            },
          ],
          /**
           * Text Alignment
           * @see https://tailwindcss.com/docs/text-align
           */ 'text-alignment': [
            {
              text: ['left', 'center', 'right', 'justify', 'start', 'end'],
            },
          ],
          /**
           * Text Color
           * @see https://tailwindcss.com/docs/text-color
           */ 'text-color': [
            {
              text: [colors],
            },
          ],
          /**
           * Text Opacity
           * @see https://tailwindcss.com/docs/text-opacity
           */ 'text-opacity': [
            {
              'text-opacity': [opacity],
            },
          ],
          /**
           * Text Decoration
           * @see https://tailwindcss.com/docs/text-decoration
           */ 'text-decoration': ['underline', 'overline', 'line-through', 'no-underline'],
          /**
           * Text Decoration Style
           * @see https://tailwindcss.com/docs/text-decoration-style
           */ 'text-decoration-style': [
            {
              decoration: [...getLineStyles(), 'wavy'],
            },
          ],
          /**
           * Text Decoration Thickness
           * @see https://tailwindcss.com/docs/text-decoration-thickness
           */ 'text-decoration-thickness': [
            {
              decoration: ['auto', 'from-font', isLength, isArbitraryLength],
            },
          ],
          /**
           * Text Underline Offset
           * @see https://tailwindcss.com/docs/text-underline-offset
           */ 'underline-offset': [
            {
              'underline-offset': ['auto', isLength, isArbitraryValue],
            },
          ],
          /**
           * Text Decoration Color
           * @see https://tailwindcss.com/docs/text-decoration-color
           */ 'text-decoration-color': [
            {
              decoration: [colors],
            },
          ],
          /**
           * Text Transform
           * @see https://tailwindcss.com/docs/text-transform
           */ 'text-transform': ['uppercase', 'lowercase', 'capitalize', 'normal-case'],
          /**
           * Text Overflow
           * @see https://tailwindcss.com/docs/text-overflow
           */ 'text-overflow': ['truncate', 'text-ellipsis', 'text-clip'],
          /**
           * Text Wrap
           * @see https://tailwindcss.com/docs/text-wrap
           */ 'text-wrap': [
            {
              text: ['wrap', 'nowrap', 'balance', 'pretty'],
            },
          ],
          /**
           * Text Indent
           * @see https://tailwindcss.com/docs/text-indent
           */ indent: [
            {
              indent: getSpacingWithArbitrary(),
            },
          ],
          /**
           * Vertical Alignment
           * @see https://tailwindcss.com/docs/vertical-align
           */ 'vertical-align': [
            {
              align: [
                'baseline',
                'top',
                'middle',
                'bottom',
                'text-top',
                'text-bottom',
                'sub',
                'super',
                isArbitraryValue,
              ],
            },
          ],
          /**
           * Whitespace
           * @see https://tailwindcss.com/docs/whitespace
           */ whitespace: [
            {
              whitespace: ['normal', 'nowrap', 'pre', 'pre-line', 'pre-wrap', 'break-spaces'],
            },
          ],
          /**
           * Word Break
           * @see https://tailwindcss.com/docs/word-break
           */ break: [
            {
              break: ['normal', 'words', 'all', 'keep'],
            },
          ],
          /**
           * Hyphens
           * @see https://tailwindcss.com/docs/hyphens
           */ hyphens: [
            {
              hyphens: ['none', 'manual', 'auto'],
            },
          ],
          /**
           * Content
           * @see https://tailwindcss.com/docs/content
           */ content: [
            {
              content: ['none', isArbitraryValue],
            },
          ],
          // Backgrounds
          /**
           * Background Attachment
           * @see https://tailwindcss.com/docs/background-attachment
           */ 'bg-attachment': [
            {
              bg: ['fixed', 'local', 'scroll'],
            },
          ],
          /**
           * Background Clip
           * @see https://tailwindcss.com/docs/background-clip
           */ 'bg-clip': [
            {
              'bg-clip': ['border', 'padding', 'content', 'text'],
            },
          ],
          /**
           * Background Opacity
           * @deprecated since Tailwind CSS v3.0.0
           * @see https://tailwindcss.com/docs/background-opacity
           */ 'bg-opacity': [
            {
              'bg-opacity': [opacity],
            },
          ],
          /**
           * Background Origin
           * @see https://tailwindcss.com/docs/background-origin
           */ 'bg-origin': [
            {
              'bg-origin': ['border', 'padding', 'content'],
            },
          ],
          /**
           * Background Position
           * @see https://tailwindcss.com/docs/background-position
           */ 'bg-position': [
            {
              bg: [...getPositions(), isArbitraryPosition],
            },
          ],
          /**
           * Background Repeat
           * @see https://tailwindcss.com/docs/background-repeat
           */ 'bg-repeat': [
            {
              bg: [
                'no-repeat',
                {
                  repeat: ['', 'x', 'y', 'round', 'space'],
                },
              ],
            },
          ],
          /**
           * Background Size
           * @see https://tailwindcss.com/docs/background-size
           */ 'bg-size': [
            {
              bg: ['auto', 'cover', 'contain', isArbitrarySize],
            },
          ],
          /**
           * Background Image
           * @see https://tailwindcss.com/docs/background-image
           */ 'bg-image': [
            {
              bg: [
                'none',
                {
                  'gradient-to': ['t', 'tr', 'r', 'br', 'b', 'bl', 'l', 'tl'],
                },
                isArbitraryImage,
              ],
            },
          ],
          /**
           * Background Color
           * @see https://tailwindcss.com/docs/background-color
           */ 'bg-color': [
            {
              bg: [colors],
            },
          ],
          /**
           * Gradient Color Stops From Position
           * @see https://tailwindcss.com/docs/gradient-color-stops
           */ 'gradient-from-pos': [
            {
              from: [gradientColorStopPositions],
            },
          ],
          /**
           * Gradient Color Stops Via Position
           * @see https://tailwindcss.com/docs/gradient-color-stops
           */ 'gradient-via-pos': [
            {
              via: [gradientColorStopPositions],
            },
          ],
          /**
           * Gradient Color Stops To Position
           * @see https://tailwindcss.com/docs/gradient-color-stops
           */ 'gradient-to-pos': [
            {
              to: [gradientColorStopPositions],
            },
          ],
          /**
           * Gradient Color Stops From
           * @see https://tailwindcss.com/docs/gradient-color-stops
           */ 'gradient-from': [
            {
              from: [gradientColorStops],
            },
          ],
          /**
           * Gradient Color Stops Via
           * @see https://tailwindcss.com/docs/gradient-color-stops
           */ 'gradient-via': [
            {
              via: [gradientColorStops],
            },
          ],
          /**
           * Gradient Color Stops To
           * @see https://tailwindcss.com/docs/gradient-color-stops
           */ 'gradient-to': [
            {
              to: [gradientColorStops],
            },
          ],
          // Borders
          /**
           * Border Radius
           * @see https://tailwindcss.com/docs/border-radius
           */ rounded: [
            {
              rounded: [borderRadius],
            },
          ],
          /**
           * Border Radius Start
           * @see https://tailwindcss.com/docs/border-radius
           */ 'rounded-s': [
            {
              'rounded-s': [borderRadius],
            },
          ],
          /**
           * Border Radius End
           * @see https://tailwindcss.com/docs/border-radius
           */ 'rounded-e': [
            {
              'rounded-e': [borderRadius],
            },
          ],
          /**
           * Border Radius Top
           * @see https://tailwindcss.com/docs/border-radius
           */ 'rounded-t': [
            {
              'rounded-t': [borderRadius],
            },
          ],
          /**
           * Border Radius Right
           * @see https://tailwindcss.com/docs/border-radius
           */ 'rounded-r': [
            {
              'rounded-r': [borderRadius],
            },
          ],
          /**
           * Border Radius Bottom
           * @see https://tailwindcss.com/docs/border-radius
           */ 'rounded-b': [
            {
              'rounded-b': [borderRadius],
            },
          ],
          /**
           * Border Radius Left
           * @see https://tailwindcss.com/docs/border-radius
           */ 'rounded-l': [
            {
              'rounded-l': [borderRadius],
            },
          ],
          /**
           * Border Radius Start Start
           * @see https://tailwindcss.com/docs/border-radius
           */ 'rounded-ss': [
            {
              'rounded-ss': [borderRadius],
            },
          ],
          /**
           * Border Radius Start End
           * @see https://tailwindcss.com/docs/border-radius
           */ 'rounded-se': [
            {
              'rounded-se': [borderRadius],
            },
          ],
          /**
           * Border Radius End End
           * @see https://tailwindcss.com/docs/border-radius
           */ 'rounded-ee': [
            {
              'rounded-ee': [borderRadius],
            },
          ],
          /**
           * Border Radius End Start
           * @see https://tailwindcss.com/docs/border-radius
           */ 'rounded-es': [
            {
              'rounded-es': [borderRadius],
            },
          ],
          /**
           * Border Radius Top Left
           * @see https://tailwindcss.com/docs/border-radius
           */ 'rounded-tl': [
            {
              'rounded-tl': [borderRadius],
            },
          ],
          /**
           * Border Radius Top Right
           * @see https://tailwindcss.com/docs/border-radius
           */ 'rounded-tr': [
            {
              'rounded-tr': [borderRadius],
            },
          ],
          /**
           * Border Radius Bottom Right
           * @see https://tailwindcss.com/docs/border-radius
           */ 'rounded-br': [
            {
              'rounded-br': [borderRadius],
            },
          ],
          /**
           * Border Radius Bottom Left
           * @see https://tailwindcss.com/docs/border-radius
           */ 'rounded-bl': [
            {
              'rounded-bl': [borderRadius],
            },
          ],
          /**
           * Border Width
           * @see https://tailwindcss.com/docs/border-width
           */ 'border-w': [
            {
              border: [borderWidth],
            },
          ],
          /**
           * Border Width X
           * @see https://tailwindcss.com/docs/border-width
           */ 'border-w-x': [
            {
              'border-x': [borderWidth],
            },
          ],
          /**
           * Border Width Y
           * @see https://tailwindcss.com/docs/border-width
           */ 'border-w-y': [
            {
              'border-y': [borderWidth],
            },
          ],
          /**
           * Border Width Start
           * @see https://tailwindcss.com/docs/border-width
           */ 'border-w-s': [
            {
              'border-s': [borderWidth],
            },
          ],
          /**
           * Border Width End
           * @see https://tailwindcss.com/docs/border-width
           */ 'border-w-e': [
            {
              'border-e': [borderWidth],
            },
          ],
          /**
           * Border Width Top
           * @see https://tailwindcss.com/docs/border-width
           */ 'border-w-t': [
            {
              'border-t': [borderWidth],
            },
          ],
          /**
           * Border Width Right
           * @see https://tailwindcss.com/docs/border-width
           */ 'border-w-r': [
            {
              'border-r': [borderWidth],
            },
          ],
          /**
           * Border Width Bottom
           * @see https://tailwindcss.com/docs/border-width
           */ 'border-w-b': [
            {
              'border-b': [borderWidth],
            },
          ],
          /**
           * Border Width Left
           * @see https://tailwindcss.com/docs/border-width
           */ 'border-w-l': [
            {
              'border-l': [borderWidth],
            },
          ],
          /**
           * Border Opacity
           * @see https://tailwindcss.com/docs/border-opacity
           */ 'border-opacity': [
            {
              'border-opacity': [opacity],
            },
          ],
          /**
           * Border Style
           * @see https://tailwindcss.com/docs/border-style
           */ 'border-style': [
            {
              border: [...getLineStyles(), 'hidden'],
            },
          ],
          /**
           * Divide Width X
           * @see https://tailwindcss.com/docs/divide-width
           */ 'divide-x': [
            {
              'divide-x': [borderWidth],
            },
          ],
          /**
           * Divide Width X Reverse
           * @see https://tailwindcss.com/docs/divide-width
           */ 'divide-x-reverse': ['divide-x-reverse'],
          /**
           * Divide Width Y
           * @see https://tailwindcss.com/docs/divide-width
           */ 'divide-y': [
            {
              'divide-y': [borderWidth],
            },
          ],
          /**
           * Divide Width Y Reverse
           * @see https://tailwindcss.com/docs/divide-width
           */ 'divide-y-reverse': ['divide-y-reverse'],
          /**
           * Divide Opacity
           * @see https://tailwindcss.com/docs/divide-opacity
           */ 'divide-opacity': [
            {
              'divide-opacity': [opacity],
            },
          ],
          /**
           * Divide Style
           * @see https://tailwindcss.com/docs/divide-style
           */ 'divide-style': [
            {
              divide: getLineStyles(),
            },
          ],
          /**
           * Border Color
           * @see https://tailwindcss.com/docs/border-color
           */ 'border-color': [
            {
              border: [borderColor],
            },
          ],
          /**
           * Border Color X
           * @see https://tailwindcss.com/docs/border-color
           */ 'border-color-x': [
            {
              'border-x': [borderColor],
            },
          ],
          /**
           * Border Color Y
           * @see https://tailwindcss.com/docs/border-color
           */ 'border-color-y': [
            {
              'border-y': [borderColor],
            },
          ],
          /**
           * Border Color S
           * @see https://tailwindcss.com/docs/border-color
           */ 'border-color-s': [
            {
              'border-s': [borderColor],
            },
          ],
          /**
           * Border Color E
           * @see https://tailwindcss.com/docs/border-color
           */ 'border-color-e': [
            {
              'border-e': [borderColor],
            },
          ],
          /**
           * Border Color Top
           * @see https://tailwindcss.com/docs/border-color
           */ 'border-color-t': [
            {
              'border-t': [borderColor],
            },
          ],
          /**
           * Border Color Right
           * @see https://tailwindcss.com/docs/border-color
           */ 'border-color-r': [
            {
              'border-r': [borderColor],
            },
          ],
          /**
           * Border Color Bottom
           * @see https://tailwindcss.com/docs/border-color
           */ 'border-color-b': [
            {
              'border-b': [borderColor],
            },
          ],
          /**
           * Border Color Left
           * @see https://tailwindcss.com/docs/border-color
           */ 'border-color-l': [
            {
              'border-l': [borderColor],
            },
          ],
          /**
           * Divide Color
           * @see https://tailwindcss.com/docs/divide-color
           */ 'divide-color': [
            {
              divide: [borderColor],
            },
          ],
          /**
           * Outline Style
           * @see https://tailwindcss.com/docs/outline-style
           */ 'outline-style': [
            {
              outline: ['', ...getLineStyles()],
            },
          ],
          /**
           * Outline Offset
           * @see https://tailwindcss.com/docs/outline-offset
           */ 'outline-offset': [
            {
              'outline-offset': [isLength, isArbitraryValue],
            },
          ],
          /**
           * Outline Width
           * @see https://tailwindcss.com/docs/outline-width
           */ 'outline-w': [
            {
              outline: [isLength, isArbitraryLength],
            },
          ],
          /**
           * Outline Color
           * @see https://tailwindcss.com/docs/outline-color
           */ 'outline-color': [
            {
              outline: [colors],
            },
          ],
          /**
           * Ring Width
           * @see https://tailwindcss.com/docs/ring-width
           */ 'ring-w': [
            {
              ring: getLengthWithEmptyAndArbitrary(),
            },
          ],
          /**
           * Ring Width Inset
           * @see https://tailwindcss.com/docs/ring-width
           */ 'ring-w-inset': ['ring-inset'],
          /**
           * Ring Color
           * @see https://tailwindcss.com/docs/ring-color
           */ 'ring-color': [
            {
              ring: [colors],
            },
          ],
          /**
           * Ring Opacity
           * @see https://tailwindcss.com/docs/ring-opacity
           */ 'ring-opacity': [
            {
              'ring-opacity': [opacity],
            },
          ],
          /**
           * Ring Offset Width
           * @see https://tailwindcss.com/docs/ring-offset-width
           */ 'ring-offset-w': [
            {
              'ring-offset': [isLength, isArbitraryLength],
            },
          ],
          /**
           * Ring Offset Color
           * @see https://tailwindcss.com/docs/ring-offset-color
           */ 'ring-offset-color': [
            {
              'ring-offset': [colors],
            },
          ],
          // Effects
          /**
           * Box Shadow
           * @see https://tailwindcss.com/docs/box-shadow
           */ shadow: [
            {
              shadow: ['', 'inner', 'none', isTshirtSize, isArbitraryShadow],
            },
          ],
          /**
           * Box Shadow Color
           * @see https://tailwindcss.com/docs/box-shadow-color
           */ 'shadow-color': [
            {
              shadow: [isAny],
            },
          ],
          /**
           * Opacity
           * @see https://tailwindcss.com/docs/opacity
           */ opacity: [
            {
              opacity: [opacity],
            },
          ],
          /**
           * Mix Blend Mode
           * @see https://tailwindcss.com/docs/mix-blend-mode
           */ 'mix-blend': [
            {
              'mix-blend': [...getBlendModes(), 'plus-lighter', 'plus-darker'],
            },
          ],
          /**
           * Background Blend Mode
           * @see https://tailwindcss.com/docs/background-blend-mode
           */ 'bg-blend': [
            {
              'bg-blend': getBlendModes(),
            },
          ],
          // Filters
          /**
           * Filter
           * @deprecated since Tailwind CSS v3.0.0
           * @see https://tailwindcss.com/docs/filter
           */ filter: [
            {
              filter: ['', 'none'],
            },
          ],
          /**
           * Blur
           * @see https://tailwindcss.com/docs/blur
           */ blur: [
            {
              blur: [blur],
            },
          ],
          /**
           * Brightness
           * @see https://tailwindcss.com/docs/brightness
           */ brightness: [
            {
              brightness: [brightness],
            },
          ],
          /**
           * Contrast
           * @see https://tailwindcss.com/docs/contrast
           */ contrast: [
            {
              contrast: [contrast],
            },
          ],
          /**
           * Drop Shadow
           * @see https://tailwindcss.com/docs/drop-shadow
           */ 'drop-shadow': [
            {
              'drop-shadow': ['', 'none', isTshirtSize, isArbitraryValue],
            },
          ],
          /**
           * Grayscale
           * @see https://tailwindcss.com/docs/grayscale
           */ grayscale: [
            {
              grayscale: [grayscale],
            },
          ],
          /**
           * Hue Rotate
           * @see https://tailwindcss.com/docs/hue-rotate
           */ 'hue-rotate': [
            {
              'hue-rotate': [hueRotate],
            },
          ],
          /**
           * Invert
           * @see https://tailwindcss.com/docs/invert
           */ invert: [
            {
              invert: [invert],
            },
          ],
          /**
           * Saturate
           * @see https://tailwindcss.com/docs/saturate
           */ saturate: [
            {
              saturate: [saturate],
            },
          ],
          /**
           * Sepia
           * @see https://tailwindcss.com/docs/sepia
           */ sepia: [
            {
              sepia: [sepia],
            },
          ],
          /**
           * Backdrop Filter
           * @deprecated since Tailwind CSS v3.0.0
           * @see https://tailwindcss.com/docs/backdrop-filter
           */ 'backdrop-filter': [
            {
              'backdrop-filter': ['', 'none'],
            },
          ],
          /**
           * Backdrop Blur
           * @see https://tailwindcss.com/docs/backdrop-blur
           */ 'backdrop-blur': [
            {
              'backdrop-blur': [blur],
            },
          ],
          /**
           * Backdrop Brightness
           * @see https://tailwindcss.com/docs/backdrop-brightness
           */ 'backdrop-brightness': [
            {
              'backdrop-brightness': [brightness],
            },
          ],
          /**
           * Backdrop Contrast
           * @see https://tailwindcss.com/docs/backdrop-contrast
           */ 'backdrop-contrast': [
            {
              'backdrop-contrast': [contrast],
            },
          ],
          /**
           * Backdrop Grayscale
           * @see https://tailwindcss.com/docs/backdrop-grayscale
           */ 'backdrop-grayscale': [
            {
              'backdrop-grayscale': [grayscale],
            },
          ],
          /**
           * Backdrop Hue Rotate
           * @see https://tailwindcss.com/docs/backdrop-hue-rotate
           */ 'backdrop-hue-rotate': [
            {
              'backdrop-hue-rotate': [hueRotate],
            },
          ],
          /**
           * Backdrop Invert
           * @see https://tailwindcss.com/docs/backdrop-invert
           */ 'backdrop-invert': [
            {
              'backdrop-invert': [invert],
            },
          ],
          /**
           * Backdrop Opacity
           * @see https://tailwindcss.com/docs/backdrop-opacity
           */ 'backdrop-opacity': [
            {
              'backdrop-opacity': [opacity],
            },
          ],
          /**
           * Backdrop Saturate
           * @see https://tailwindcss.com/docs/backdrop-saturate
           */ 'backdrop-saturate': [
            {
              'backdrop-saturate': [saturate],
            },
          ],
          /**
           * Backdrop Sepia
           * @see https://tailwindcss.com/docs/backdrop-sepia
           */ 'backdrop-sepia': [
            {
              'backdrop-sepia': [sepia],
            },
          ],
          // Tables
          /**
           * Border Collapse
           * @see https://tailwindcss.com/docs/border-collapse
           */ 'border-collapse': [
            {
              border: ['collapse', 'separate'],
            },
          ],
          /**
           * Border Spacing
           * @see https://tailwindcss.com/docs/border-spacing
           */ 'border-spacing': [
            {
              'border-spacing': [borderSpacing],
            },
          ],
          /**
           * Border Spacing X
           * @see https://tailwindcss.com/docs/border-spacing
           */ 'border-spacing-x': [
            {
              'border-spacing-x': [borderSpacing],
            },
          ],
          /**
           * Border Spacing Y
           * @see https://tailwindcss.com/docs/border-spacing
           */ 'border-spacing-y': [
            {
              'border-spacing-y': [borderSpacing],
            },
          ],
          /**
           * Table Layout
           * @see https://tailwindcss.com/docs/table-layout
           */ 'table-layout': [
            {
              table: ['auto', 'fixed'],
            },
          ],
          /**
           * Caption Side
           * @see https://tailwindcss.com/docs/caption-side
           */ caption: [
            {
              caption: ['top', 'bottom'],
            },
          ],
          // Transitions and Animation
          /**
           * Tranisition Property
           * @see https://tailwindcss.com/docs/transition-property
           */ transition: [
            {
              transition: [
                'none',
                'all',
                '',
                'colors',
                'opacity',
                'shadow',
                'transform',
                isArbitraryValue,
              ],
            },
          ],
          /**
           * Transition Duration
           * @see https://tailwindcss.com/docs/transition-duration
           */ duration: [
            {
              duration: getNumberAndArbitrary(),
            },
          ],
          /**
           * Transition Timing Function
           * @see https://tailwindcss.com/docs/transition-timing-function
           */ ease: [
            {
              ease: ['linear', 'in', 'out', 'in-out', isArbitraryValue],
            },
          ],
          /**
           * Transition Delay
           * @see https://tailwindcss.com/docs/transition-delay
           */ delay: [
            {
              delay: getNumberAndArbitrary(),
            },
          ],
          /**
           * Animation
           * @see https://tailwindcss.com/docs/animation
           */ animate: [
            {
              animate: ['none', 'spin', 'ping', 'pulse', 'bounce', isArbitraryValue],
            },
          ],
          // Transforms
          /**
           * Transform
           * @see https://tailwindcss.com/docs/transform
           */ transform: [
            {
              transform: ['', 'gpu', 'none'],
            },
          ],
          /**
           * Scale
           * @see https://tailwindcss.com/docs/scale
           */ scale: [
            {
              scale: [scale],
            },
          ],
          /**
           * Scale X
           * @see https://tailwindcss.com/docs/scale
           */ 'scale-x': [
            {
              'scale-x': [scale],
            },
          ],
          /**
           * Scale Y
           * @see https://tailwindcss.com/docs/scale
           */ 'scale-y': [
            {
              'scale-y': [scale],
            },
          ],
          /**
           * Rotate
           * @see https://tailwindcss.com/docs/rotate
           */ rotate: [
            {
              rotate: [isInteger, isArbitraryValue],
            },
          ],
          /**
           * Translate X
           * @see https://tailwindcss.com/docs/translate
           */ 'translate-x': [
            {
              'translate-x': [translate],
            },
          ],
          /**
           * Translate Y
           * @see https://tailwindcss.com/docs/translate
           */ 'translate-y': [
            {
              'translate-y': [translate],
            },
          ],
          /**
           * Skew X
           * @see https://tailwindcss.com/docs/skew
           */ 'skew-x': [
            {
              'skew-x': [skew],
            },
          ],
          /**
           * Skew Y
           * @see https://tailwindcss.com/docs/skew
           */ 'skew-y': [
            {
              'skew-y': [skew],
            },
          ],
          /**
           * Transform Origin
           * @see https://tailwindcss.com/docs/transform-origin
           */ 'transform-origin': [
            {
              origin: [
                'center',
                'top',
                'top-right',
                'right',
                'bottom-right',
                'bottom',
                'bottom-left',
                'left',
                'top-left',
                isArbitraryValue,
              ],
            },
          ],
          // Interactivity
          /**
           * Accent Color
           * @see https://tailwindcss.com/docs/accent-color
           */ accent: [
            {
              accent: ['auto', colors],
            },
          ],
          /**
           * Appearance
           * @see https://tailwindcss.com/docs/appearance
           */ appearance: [
            {
              appearance: ['none', 'auto'],
            },
          ],
          /**
           * Cursor
           * @see https://tailwindcss.com/docs/cursor
           */ cursor: [
            {
              cursor: [
                'auto',
                'default',
                'pointer',
                'wait',
                'text',
                'move',
                'help',
                'not-allowed',
                'none',
                'context-menu',
                'progress',
                'cell',
                'crosshair',
                'vertical-text',
                'alias',
                'copy',
                'no-drop',
                'grab',
                'grabbing',
                'all-scroll',
                'col-resize',
                'row-resize',
                'n-resize',
                'e-resize',
                's-resize',
                'w-resize',
                'ne-resize',
                'nw-resize',
                'se-resize',
                'sw-resize',
                'ew-resize',
                'ns-resize',
                'nesw-resize',
                'nwse-resize',
                'zoom-in',
                'zoom-out',
                isArbitraryValue,
              ],
            },
          ],
          /**
           * Caret Color
           * @see https://tailwindcss.com/docs/just-in-time-mode#caret-color-utilities
           */ 'caret-color': [
            {
              caret: [colors],
            },
          ],
          /**
           * Pointer Events
           * @see https://tailwindcss.com/docs/pointer-events
           */ 'pointer-events': [
            {
              'pointer-events': ['none', 'auto'],
            },
          ],
          /**
           * Resize
           * @see https://tailwindcss.com/docs/resize
           */ resize: [
            {
              resize: ['none', 'y', 'x', ''],
            },
          ],
          /**
           * Scroll Behavior
           * @see https://tailwindcss.com/docs/scroll-behavior
           */ 'scroll-behavior': [
            {
              scroll: ['auto', 'smooth'],
            },
          ],
          /**
           * Scroll Margin
           * @see https://tailwindcss.com/docs/scroll-margin
           */ 'scroll-m': [
            {
              'scroll-m': getSpacingWithArbitrary(),
            },
          ],
          /**
           * Scroll Margin X
           * @see https://tailwindcss.com/docs/scroll-margin
           */ 'scroll-mx': [
            {
              'scroll-mx': getSpacingWithArbitrary(),
            },
          ],
          /**
           * Scroll Margin Y
           * @see https://tailwindcss.com/docs/scroll-margin
           */ 'scroll-my': [
            {
              'scroll-my': getSpacingWithArbitrary(),
            },
          ],
          /**
           * Scroll Margin Start
           * @see https://tailwindcss.com/docs/scroll-margin
           */ 'scroll-ms': [
            {
              'scroll-ms': getSpacingWithArbitrary(),
            },
          ],
          /**
           * Scroll Margin End
           * @see https://tailwindcss.com/docs/scroll-margin
           */ 'scroll-me': [
            {
              'scroll-me': getSpacingWithArbitrary(),
            },
          ],
          /**
           * Scroll Margin Top
           * @see https://tailwindcss.com/docs/scroll-margin
           */ 'scroll-mt': [
            {
              'scroll-mt': getSpacingWithArbitrary(),
            },
          ],
          /**
           * Scroll Margin Right
           * @see https://tailwindcss.com/docs/scroll-margin
           */ 'scroll-mr': [
            {
              'scroll-mr': getSpacingWithArbitrary(),
            },
          ],
          /**
           * Scroll Margin Bottom
           * @see https://tailwindcss.com/docs/scroll-margin
           */ 'scroll-mb': [
            {
              'scroll-mb': getSpacingWithArbitrary(),
            },
          ],
          /**
           * Scroll Margin Left
           * @see https://tailwindcss.com/docs/scroll-margin
           */ 'scroll-ml': [
            {
              'scroll-ml': getSpacingWithArbitrary(),
            },
          ],
          /**
           * Scroll Padding
           * @see https://tailwindcss.com/docs/scroll-padding
           */ 'scroll-p': [
            {
              'scroll-p': getSpacingWithArbitrary(),
            },
          ],
          /**
           * Scroll Padding X
           * @see https://tailwindcss.com/docs/scroll-padding
           */ 'scroll-px': [
            {
              'scroll-px': getSpacingWithArbitrary(),
            },
          ],
          /**
           * Scroll Padding Y
           * @see https://tailwindcss.com/docs/scroll-padding
           */ 'scroll-py': [
            {
              'scroll-py': getSpacingWithArbitrary(),
            },
          ],
          /**
           * Scroll Padding Start
           * @see https://tailwindcss.com/docs/scroll-padding
           */ 'scroll-ps': [
            {
              'scroll-ps': getSpacingWithArbitrary(),
            },
          ],
          /**
           * Scroll Padding End
           * @see https://tailwindcss.com/docs/scroll-padding
           */ 'scroll-pe': [
            {
              'scroll-pe': getSpacingWithArbitrary(),
            },
          ],
          /**
           * Scroll Padding Top
           * @see https://tailwindcss.com/docs/scroll-padding
           */ 'scroll-pt': [
            {
              'scroll-pt': getSpacingWithArbitrary(),
            },
          ],
          /**
           * Scroll Padding Right
           * @see https://tailwindcss.com/docs/scroll-padding
           */ 'scroll-pr': [
            {
              'scroll-pr': getSpacingWithArbitrary(),
            },
          ],
          /**
           * Scroll Padding Bottom
           * @see https://tailwindcss.com/docs/scroll-padding
           */ 'scroll-pb': [
            {
              'scroll-pb': getSpacingWithArbitrary(),
            },
          ],
          /**
           * Scroll Padding Left
           * @see https://tailwindcss.com/docs/scroll-padding
           */ 'scroll-pl': [
            {
              'scroll-pl': getSpacingWithArbitrary(),
            },
          ],
          /**
           * Scroll Snap Align
           * @see https://tailwindcss.com/docs/scroll-snap-align
           */ 'snap-align': [
            {
              snap: ['start', 'end', 'center', 'align-none'],
            },
          ],
          /**
           * Scroll Snap Stop
           * @see https://tailwindcss.com/docs/scroll-snap-stop
           */ 'snap-stop': [
            {
              snap: ['normal', 'always'],
            },
          ],
          /**
           * Scroll Snap Type
           * @see https://tailwindcss.com/docs/scroll-snap-type
           */ 'snap-type': [
            {
              snap: ['none', 'x', 'y', 'both'],
            },
          ],
          /**
           * Scroll Snap Type Strictness
           * @see https://tailwindcss.com/docs/scroll-snap-type
           */ 'snap-strictness': [
            {
              snap: ['mandatory', 'proximity'],
            },
          ],
          /**
           * Touch Action
           * @see https://tailwindcss.com/docs/touch-action
           */ touch: [
            {
              touch: ['auto', 'none', 'manipulation'],
            },
          ],
          /**
           * Touch Action X
           * @see https://tailwindcss.com/docs/touch-action
           */ 'touch-x': [
            {
              'touch-pan': ['x', 'left', 'right'],
            },
          ],
          /**
           * Touch Action Y
           * @see https://tailwindcss.com/docs/touch-action
           */ 'touch-y': [
            {
              'touch-pan': ['y', 'up', 'down'],
            },
          ],
          /**
           * Touch Action Pinch Zoom
           * @see https://tailwindcss.com/docs/touch-action
           */ 'touch-pz': ['touch-pinch-zoom'],
          /**
           * User Select
           * @see https://tailwindcss.com/docs/user-select
           */ select: [
            {
              select: ['none', 'text', 'all', 'auto'],
            },
          ],
          /**
           * Will Change
           * @see https://tailwindcss.com/docs/will-change
           */ 'will-change': [
            {
              'will-change': ['auto', 'scroll', 'contents', 'transform', isArbitraryValue],
            },
          ],
          // SVG
          /**
           * Fill
           * @see https://tailwindcss.com/docs/fill
           */ fill: [
            {
              fill: [colors, 'none'],
            },
          ],
          /**
           * Stroke Width
           * @see https://tailwindcss.com/docs/stroke-width
           */ 'stroke-w': [
            {
              stroke: [isLength, isArbitraryLength, isArbitraryNumber],
            },
          ],
          /**
           * Stroke
           * @see https://tailwindcss.com/docs/stroke
           */ stroke: [
            {
              stroke: [colors, 'none'],
            },
          ],
          // Accessibility
          /**
           * Screen Readers
           * @see https://tailwindcss.com/docs/screen-readers
           */ sr: ['sr-only', 'not-sr-only'],
          /**
           * Forced Color Adjust
           * @see https://tailwindcss.com/docs/forced-color-adjust
           */ 'forced-color-adjust': [
            {
              'forced-color-adjust': ['auto', 'none'],
            },
          ],
        },
        conflictingClassGroups: {
          overflow: ['overflow-x', 'overflow-y'],
          overscroll: ['overscroll-x', 'overscroll-y'],
          inset: ['inset-x', 'inset-y', 'start', 'end', 'top', 'right', 'bottom', 'left'],
          'inset-x': ['right', 'left'],
          'inset-y': ['top', 'bottom'],
          flex: ['basis', 'grow', 'shrink'],
          gap: ['gap-x', 'gap-y'],
          p: ['px', 'py', 'ps', 'pe', 'pt', 'pr', 'pb', 'pl'],
          px: ['pr', 'pl'],
          py: ['pt', 'pb'],
          m: ['mx', 'my', 'ms', 'me', 'mt', 'mr', 'mb', 'ml'],
          mx: ['mr', 'ml'],
          my: ['mt', 'mb'],
          size: ['w', 'h'],
          'font-size': ['leading'],
          'fvn-normal': [
            'fvn-ordinal',
            'fvn-slashed-zero',
            'fvn-figure',
            'fvn-spacing',
            'fvn-fraction',
          ],
          'fvn-ordinal': ['fvn-normal'],
          'fvn-slashed-zero': ['fvn-normal'],
          'fvn-figure': ['fvn-normal'],
          'fvn-spacing': ['fvn-normal'],
          'fvn-fraction': ['fvn-normal'],
          'line-clamp': ['display', 'overflow'],
          rounded: [
            'rounded-s',
            'rounded-e',
            'rounded-t',
            'rounded-r',
            'rounded-b',
            'rounded-l',
            'rounded-ss',
            'rounded-se',
            'rounded-ee',
            'rounded-es',
            'rounded-tl',
            'rounded-tr',
            'rounded-br',
            'rounded-bl',
          ],
          'rounded-s': ['rounded-ss', 'rounded-es'],
          'rounded-e': ['rounded-se', 'rounded-ee'],
          'rounded-t': ['rounded-tl', 'rounded-tr'],
          'rounded-r': ['rounded-tr', 'rounded-br'],
          'rounded-b': ['rounded-br', 'rounded-bl'],
          'rounded-l': ['rounded-tl', 'rounded-bl'],
          'border-spacing': ['border-spacing-x', 'border-spacing-y'],
          'border-w': [
            'border-w-s',
            'border-w-e',
            'border-w-t',
            'border-w-r',
            'border-w-b',
            'border-w-l',
          ],
          'border-w-x': ['border-w-r', 'border-w-l'],
          'border-w-y': ['border-w-t', 'border-w-b'],
          'border-color': [
            'border-color-s',
            'border-color-e',
            'border-color-t',
            'border-color-r',
            'border-color-b',
            'border-color-l',
          ],
          'border-color-x': ['border-color-r', 'border-color-l'],
          'border-color-y': ['border-color-t', 'border-color-b'],
          'scroll-m': [
            'scroll-mx',
            'scroll-my',
            'scroll-ms',
            'scroll-me',
            'scroll-mt',
            'scroll-mr',
            'scroll-mb',
            'scroll-ml',
          ],
          'scroll-mx': ['scroll-mr', 'scroll-ml'],
          'scroll-my': ['scroll-mt', 'scroll-mb'],
          'scroll-p': [
            'scroll-px',
            'scroll-py',
            'scroll-ps',
            'scroll-pe',
            'scroll-pt',
            'scroll-pr',
            'scroll-pb',
            'scroll-pl',
          ],
          'scroll-px': ['scroll-pr', 'scroll-pl'],
          'scroll-py': ['scroll-pt', 'scroll-pb'],
          touch: ['touch-x', 'touch-y', 'touch-pz'],
          'touch-x': ['touch'],
          'touch-y': ['touch'],
          'touch-pz': ['touch'],
        },
        conflictingClassGroupModifiers: {
          'font-size': ['leading'],
        },
      };
    };
    /**
     * @param baseConfig Config where other config will be merged into. This object will be mutated.
     * @param configExtension Partial config to merge into the `baseConfig`.
     */ const mergeConfigs = (
      baseConfig,
      { cacheSize, prefix, separator, experimentalParseClassName, extend = {}, override = {} }
    ) => {
      overrideProperty(baseConfig, 'cacheSize', cacheSize);
      overrideProperty(baseConfig, 'prefix', prefix);
      overrideProperty(baseConfig, 'separator', separator);
      overrideProperty(baseConfig, 'experimentalParseClassName', experimentalParseClassName);
      for (const configKey in override) {
        overrideConfigProperties(baseConfig[configKey], override[configKey]);
      }
      for (const key in extend) {
        mergeConfigProperties(baseConfig[key], extend[key]);
      }
      return baseConfig;
    };
    const overrideProperty = (baseObject, overrideKey, overrideValue) => {
      if (overrideValue !== undefined) {
        baseObject[overrideKey] = overrideValue;
      }
    };
    const overrideConfigProperties = (baseObject, overrideObject) => {
      if (overrideObject) {
        for (const key in overrideObject) {
          overrideProperty(baseObject, key, overrideObject[key]);
        }
      }
    };
    const mergeConfigProperties = (baseObject, mergeObject) => {
      if (mergeObject) {
        for (const key in mergeObject) {
          const mergeValue = mergeObject[key];
          if (mergeValue !== undefined) {
            baseObject[key] = (baseObject[key] || []).concat(mergeValue);
          }
        }
      }
    };
    const extendTailwindMerge = (configExtension, ...createConfig) =>
      typeof configExtension === 'function'
        ? createTailwindMerge(getDefaultConfig, configExtension, ...createConfig)
        : createTailwindMerge(
            () => mergeConfigs(getDefaultConfig(), configExtension),
            ...createConfig
          );
    const twMerge = /*#__PURE__*/ createTailwindMerge(getDefaultConfig);
    //# sourceMappingURL=bundle-mjs.mjs.map
  },
  '[project]/node_modules/class-variance-authority/dist/index.mjs [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['cva', () => cva, 'cx', () => cx]);
    /**
     * Copyright 2022 Joe Bell. All rights reserved.
     *
     * This file is licensed to you under the Apache License, Version 2.0
     * (the "License"); you may not use this file except in compliance with the
     * License. You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
     * WARRANTIES OR REPRESENTATIONS OF ANY KIND, either express or implied. See the
     * License for the specific language governing permissions and limitations under
     * the License.
     */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)'
      );
    const falsyToString = (value) =>
      typeof value === 'boolean' ? `${value}` : value === 0 ? '0' : value;
    const cx =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'clsx'
      ];
    const cva = (base, config) => (props) => {
      var _config_compoundVariants;
      if ((config === null || config === void 0 ? void 0 : config.variants) == null)
        return cx(
          base,
          props === null || props === void 0 ? void 0 : props.class,
          props === null || props === void 0 ? void 0 : props.className
        );
      const { variants, defaultVariants } = config;
      const getVariantClassNames = Object.keys(variants).map((variant) => {
        const variantProp = props === null || props === void 0 ? void 0 : props[variant];
        const defaultVariantProp =
          defaultVariants === null || defaultVariants === void 0
            ? void 0
            : defaultVariants[variant];
        if (variantProp === null) return null;
        const variantKey = falsyToString(variantProp) || falsyToString(defaultVariantProp);
        return variants[variant][variantKey];
      });
      const propsWithoutUndefined =
        props &&
        Object.entries(props).reduce((acc, param) => {
          let [key, value] = param;
          if (value === undefined) {
            return acc;
          }
          acc[key] = value;
          return acc;
        }, {});
      const getCompoundVariantClassNames =
        config === null || config === void 0
          ? void 0
          : (_config_compoundVariants = config.compoundVariants) === null ||
              _config_compoundVariants === void 0
            ? void 0
            : _config_compoundVariants.reduce((acc, param) => {
                let { class: cvClass, className: cvClassName, ...compoundVariantOptions } = param;
                return Object.entries(compoundVariantOptions).every((param) => {
                  let [key, value] = param;
                  return Array.isArray(value)
                    ? value.includes(
                        {
                          ...defaultVariants,
                          ...propsWithoutUndefined,
                        }[key]
                      )
                    : {
                        ...defaultVariants,
                        ...propsWithoutUndefined,
                      }[key] === value;
                })
                  ? [...acc, cvClass, cvClassName]
                  : acc;
              }, []);
      return cx(
        base,
        getVariantClassNames,
        getCompoundVariantClassNames,
        props === null || props === void 0 ? void 0 : props.class,
        props === null || props === void 0 ? void 0 : props.className
      );
    };
  },
  '[project]/node_modules/lucide-react/dist/esm/shared/src/utils.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['mergeClasses', () => mergeClasses, 'toKebabCase', () => toKebabCase]);
    /**
     * @license lucide-react v0.469.0 - ISC
     *
     * This source code is licensed under the ISC license.
     * See the LICENSE file in the root directory of this source tree.
     */ const toKebabCase = (string) => string.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    const mergeClasses = (...classes) =>
      classes
        .filter((className, index, array) => {
          return (
            Boolean(className) && className.trim() !== '' && array.indexOf(className) === index
          );
        })
        .join(' ')
        .trim();
    //# sourceMappingURL=utils.js.map
  },
  '[project]/node_modules/lucide-react/dist/esm/defaultAttributes.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['default', () => defaultAttributes]);
    /**
     * @license lucide-react v0.469.0 - ISC
     *
     * This source code is licensed under the ISC license.
     * See the LICENSE file in the root directory of this source tree.
     */ var defaultAttributes = {
      xmlns: 'http://www.w3.org/2000/svg',
      width: 24,
      height: 24,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    };
    //# sourceMappingURL=defaultAttributes.js.map
  },
  '[project]/node_modules/lucide-react/dist/esm/Icon.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['default', () => Icon]);
    /**
     * @license lucide-react v0.469.0 - ISC
     *
     * This source code is licensed under the ISC license.
     * See the LICENSE file in the root directory of this source tree.
     */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$defaultAttributes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/defaultAttributes.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$shared$2f$src$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/shared/src/utils.js [app-client] (ecmascript)'
      );
    const Icon = (0,
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
      'forwardRef'
    ])(
      (
        {
          color = 'currentColor',
          size = 24,
          strokeWidth = 2,
          absoluteStrokeWidth,
          className = '',
          children,
          iconNode,
          ...rest
        },
        ref
      ) => {
        return (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'createElement'
        ])(
          'svg',
          {
            ref,
            ...__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$defaultAttributes$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'default'
            ],
            width: size,
            height: size,
            stroke: color,
            strokeWidth: absoluteStrokeWidth
              ? (Number(strokeWidth) * 24) / Number(size)
              : strokeWidth,
            className: (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$shared$2f$src$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'mergeClasses'
            ])('lucide', className),
            ...rest,
          },
          [
            ...iconNode.map(([tag, attrs]) =>
              (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'createElement'
              ])(tag, attrs)
            ),
            ...(Array.isArray(children) ? children : [children]),
          ]
        );
      }
    );
    //# sourceMappingURL=Icon.js.map
  },
  '[project]/node_modules/lucide-react/dist/esm/createLucideIcon.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['default', () => createLucideIcon]);
    /**
     * @license lucide-react v0.469.0 - ISC
     *
     * This source code is licensed under the ISC license.
     * See the LICENSE file in the root directory of this source tree.
     */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$shared$2f$src$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/shared/src/utils.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$Icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/Icon.js [app-client] (ecmascript)'
      );
    const createLucideIcon = (iconName, iconNode) => {
      const Component = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ])(({ className, ...props }, ref) =>
        (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'createElement'
        ])(
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$Icon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'default'
          ],
          {
            ref,
            iconNode,
            className: (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$shared$2f$src$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'mergeClasses'
            ])(
              `lucide-${(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$shared$2f$src$2f$utils$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__['toKebabCase'])(iconName)}`,
              className
            ),
            ...props,
          }
        )
      );
      Component.displayName = `${iconName}`;
      return Component;
    };
    //# sourceMappingURL=createLucideIcon.js.map
  },
  '[project]/node_modules/lucide-react/dist/esm/icons/clock.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['default', () => Clock]);
    /**
     * @license lucide-react v0.469.0 - ISC
     *
     * This source code is licensed under the ISC license.
     * See the LICENSE file in the root directory of this source tree.
     */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/createLucideIcon.js [app-client] (ecmascript)'
      );
    const Clock = (0,
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
      'default'
    ])('Clock', [
      [
        'circle',
        {
          cx: '12',
          cy: '12',
          r: '10',
          key: '1mglay',
        },
      ],
      [
        'polyline',
        {
          points: '12 6 12 12 16 14',
          key: '68esgv',
        },
      ],
    ]);
    //# sourceMappingURL=clock.js.map
  },
  '[project]/node_modules/lucide-react/dist/esm/icons/clock.js [app-client] (ecmascript) <export default as Clock>',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'Clock',
      () =>
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'default'
        ],
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/clock.js [app-client] (ecmascript)'
      );
  },
  '[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['default', () => X]);
    /**
     * @license lucide-react v0.469.0 - ISC
     *
     * This source code is licensed under the ISC license.
     * See the LICENSE file in the root directory of this source tree.
     */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/createLucideIcon.js [app-client] (ecmascript)'
      );
    const X = (0,
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
      'default'
    ])('X', [
      [
        'path',
        {
          d: 'M18 6 6 18',
          key: '1bl5f8',
        },
      ],
      [
        'path',
        {
          d: 'm6 6 12 12',
          key: 'd8bk6v',
        },
      ],
    ]);
    //# sourceMappingURL=x.js.map
  },
  '[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'X',
      () =>
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'default'
        ],
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript)'
      );
  },
  '[project]/node_modules/@radix-ui/react-collection/dist/index.mjs [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'createCollection',
      () => createCollection,
      'unstable_createCollection',
      () => createCollection2,
    ]);
    // src/collection-legacy.tsx
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$context$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-context/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$compose$2d$refs$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-compose-refs/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-slot/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-runtime.js [app-client] (ecmascript)'
      );
    ('use client');
    function createCollection(name) {
      const PROVIDER_NAME = name + 'CollectionProvider';
      const [createCollectionContext, createCollectionScope] = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$context$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'createContextScope'
      ])(PROVIDER_NAME);
      const [CollectionProviderImpl, useCollectionContext] = createCollectionContext(
        PROVIDER_NAME,
        {
          collectionRef: {
            current: null,
          },
          itemMap: /* @__PURE__ */ new Map(),
        }
      );
      const CollectionProvider = (props) => {
        const { scope, children } = props;
        const ref =
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'default'
          ].useRef(null);
        const itemMap =
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'default'
          ].useRef(/* @__PURE__ */ new Map()).current;
        return /* @__PURE__ */ (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'jsx'
        ])(CollectionProviderImpl, {
          scope,
          itemMap,
          collectionRef: ref,
          children,
        });
      };
      CollectionProvider.displayName = PROVIDER_NAME;
      const COLLECTION_SLOT_NAME = name + 'CollectionSlot';
      const CollectionSlotImpl = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'createSlot'
      ])(COLLECTION_SLOT_NAME);
      const CollectionSlot =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'default'
        ].forwardRef((props, forwardedRef) => {
          const { scope, children } = props;
          const context = useCollectionContext(COLLECTION_SLOT_NAME, scope);
          const composedRefs = (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$compose$2d$refs$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'useComposedRefs'
          ])(forwardedRef, context.collectionRef);
          return /* @__PURE__ */ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsx'
          ])(CollectionSlotImpl, {
            ref: composedRefs,
            children,
          });
        });
      CollectionSlot.displayName = COLLECTION_SLOT_NAME;
      const ITEM_SLOT_NAME = name + 'CollectionItemSlot';
      const ITEM_DATA_ATTR = 'data-radix-collection-item';
      const CollectionItemSlotImpl = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'createSlot'
      ])(ITEM_SLOT_NAME);
      const CollectionItemSlot =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'default'
        ].forwardRef((props, forwardedRef) => {
          const { scope, children, ...itemData } = props;
          const ref =
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'default'
            ].useRef(null);
          const composedRefs = (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$compose$2d$refs$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'useComposedRefs'
          ])(forwardedRef, ref);
          const context = useCollectionContext(ITEM_SLOT_NAME, scope);
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'default'
          ].useEffect(
            {
              'createCollection.CollectionItemSlot.useEffect': () => {
                context.itemMap.set(ref, {
                  ref,
                  ...itemData,
                });
                return {
                  'createCollection.CollectionItemSlot.useEffect': () =>
                    void context.itemMap.delete(ref),
                }['createCollection.CollectionItemSlot.useEffect'];
              },
            }['createCollection.CollectionItemSlot.useEffect']
          );
          return /* @__PURE__ */ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsx'
          ])(CollectionItemSlotImpl, {
            ...{
              [ITEM_DATA_ATTR]: '',
            },
            ref: composedRefs,
            children,
          });
        });
      CollectionItemSlot.displayName = ITEM_SLOT_NAME;
      function useCollection(scope) {
        const context = useCollectionContext(name + 'CollectionConsumer', scope);
        const getItems =
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'default'
          ].useCallback(
            {
              'createCollection.useCollection.useCallback[getItems]': () => {
                const collectionNode = context.collectionRef.current;
                if (!collectionNode) return [];
                const orderedNodes = Array.from(
                  collectionNode.querySelectorAll(`[${ITEM_DATA_ATTR}]`)
                );
                const items = Array.from(context.itemMap.values());
                const orderedItems = items.sort(
                  {
                    'createCollection.useCollection.useCallback[getItems].orderedItems': (a, b) =>
                      orderedNodes.indexOf(a.ref.current) - orderedNodes.indexOf(b.ref.current),
                  }['createCollection.useCollection.useCallback[getItems].orderedItems']
                );
                return orderedItems;
              },
            }['createCollection.useCollection.useCallback[getItems]'],
            [context.collectionRef, context.itemMap]
          );
        return getItems;
      }
      return [
        {
          Provider: CollectionProvider,
          Slot: CollectionSlot,
          ItemSlot: CollectionItemSlot,
        },
        useCollection,
        createCollectionScope,
      ];
    }
    // src/ordered-dictionary.ts
    var __instanciated = /* @__PURE__ */ new WeakMap();
    var OrderedDict = class _OrderedDict extends Map {
      #keys;
      constructor(entries) {
        super(entries);
        this.#keys = [...super.keys()];
        __instanciated.set(this, true);
      }
      set(key, value) {
        if (__instanciated.get(this)) {
          if (this.has(key)) {
            this.#keys[this.#keys.indexOf(key)] = key;
          } else {
            this.#keys.push(key);
          }
        }
        super.set(key, value);
        return this;
      }
      insert(index, key, value) {
        const has = this.has(key);
        const length = this.#keys.length;
        const relativeIndex = toSafeInteger(index);
        let actualIndex = relativeIndex >= 0 ? relativeIndex : length + relativeIndex;
        const safeIndex = actualIndex < 0 || actualIndex >= length ? -1 : actualIndex;
        if (safeIndex === this.size || (has && safeIndex === this.size - 1) || safeIndex === -1) {
          this.set(key, value);
          return this;
        }
        const size = this.size + (has ? 0 : 1);
        if (relativeIndex < 0) {
          actualIndex++;
        }
        const keys = [...this.#keys];
        let nextValue;
        let shouldSkip = false;
        for (let i = actualIndex; i < size; i++) {
          if (actualIndex === i) {
            let nextKey = keys[i];
            if (keys[i] === key) {
              nextKey = keys[i + 1];
            }
            if (has) {
              this.delete(key);
            }
            nextValue = this.get(nextKey);
            this.set(key, value);
          } else {
            if (!shouldSkip && keys[i - 1] === key) {
              shouldSkip = true;
            }
            const currentKey = keys[shouldSkip ? i : i - 1];
            const currentValue = nextValue;
            nextValue = this.get(currentKey);
            this.delete(currentKey);
            this.set(currentKey, currentValue);
          }
        }
        return this;
      }
      with(index, key, value) {
        const copy = new _OrderedDict(this);
        copy.insert(index, key, value);
        return copy;
      }
      before(key) {
        const index = this.#keys.indexOf(key) - 1;
        if (index < 0) {
          return void 0;
        }
        return this.entryAt(index);
      }
      /**
       * Sets a new key-value pair at the position before the given key.
       */ setBefore(key, newKey, value) {
        const index = this.#keys.indexOf(key);
        if (index === -1) {
          return this;
        }
        return this.insert(index, newKey, value);
      }
      after(key) {
        let index = this.#keys.indexOf(key);
        index = index === -1 || index === this.size - 1 ? -1 : index + 1;
        if (index === -1) {
          return void 0;
        }
        return this.entryAt(index);
      }
      /**
       * Sets a new key-value pair at the position after the given key.
       */ setAfter(key, newKey, value) {
        const index = this.#keys.indexOf(key);
        if (index === -1) {
          return this;
        }
        return this.insert(index + 1, newKey, value);
      }
      first() {
        return this.entryAt(0);
      }
      last() {
        return this.entryAt(-1);
      }
      clear() {
        this.#keys = [];
        return super.clear();
      }
      delete(key) {
        const deleted = super.delete(key);
        if (deleted) {
          this.#keys.splice(this.#keys.indexOf(key), 1);
        }
        return deleted;
      }
      deleteAt(index) {
        const key = this.keyAt(index);
        if (key !== void 0) {
          return this.delete(key);
        }
        return false;
      }
      at(index) {
        const key = at(this.#keys, index);
        if (key !== void 0) {
          return this.get(key);
        }
      }
      entryAt(index) {
        const key = at(this.#keys, index);
        if (key !== void 0) {
          return [key, this.get(key)];
        }
      }
      indexOf(key) {
        return this.#keys.indexOf(key);
      }
      keyAt(index) {
        return at(this.#keys, index);
      }
      from(key, offset) {
        const index = this.indexOf(key);
        if (index === -1) {
          return void 0;
        }
        let dest = index + offset;
        if (dest < 0) dest = 0;
        if (dest >= this.size) dest = this.size - 1;
        return this.at(dest);
      }
      keyFrom(key, offset) {
        const index = this.indexOf(key);
        if (index === -1) {
          return void 0;
        }
        let dest = index + offset;
        if (dest < 0) dest = 0;
        if (dest >= this.size) dest = this.size - 1;
        return this.keyAt(dest);
      }
      find(predicate, thisArg) {
        let index = 0;
        for (const entry of this) {
          if (Reflect.apply(predicate, thisArg, [entry, index, this])) {
            return entry;
          }
          index++;
        }
        return void 0;
      }
      findIndex(predicate, thisArg) {
        let index = 0;
        for (const entry of this) {
          if (Reflect.apply(predicate, thisArg, [entry, index, this])) {
            return index;
          }
          index++;
        }
        return -1;
      }
      filter(predicate, thisArg) {
        const entries = [];
        let index = 0;
        for (const entry of this) {
          if (Reflect.apply(predicate, thisArg, [entry, index, this])) {
            entries.push(entry);
          }
          index++;
        }
        return new _OrderedDict(entries);
      }
      map(callbackfn, thisArg) {
        const entries = [];
        let index = 0;
        for (const entry of this) {
          entries.push([entry[0], Reflect.apply(callbackfn, thisArg, [entry, index, this])]);
          index++;
        }
        return new _OrderedDict(entries);
      }
      reduce(...args) {
        const [callbackfn, initialValue] = args;
        let index = 0;
        let accumulator = initialValue ?? this.at(0);
        for (const entry of this) {
          if (index === 0 && args.length === 1) {
            accumulator = entry;
          } else {
            accumulator = Reflect.apply(callbackfn, this, [accumulator, entry, index, this]);
          }
          index++;
        }
        return accumulator;
      }
      reduceRight(...args) {
        const [callbackfn, initialValue] = args;
        let accumulator = initialValue ?? this.at(-1);
        for (let index = this.size - 1; index >= 0; index--) {
          const entry = this.at(index);
          if (index === this.size - 1 && args.length === 1) {
            accumulator = entry;
          } else {
            accumulator = Reflect.apply(callbackfn, this, [accumulator, entry, index, this]);
          }
        }
        return accumulator;
      }
      toSorted(compareFn) {
        const entries = [...this.entries()].sort(compareFn);
        return new _OrderedDict(entries);
      }
      toReversed() {
        const reversed = new _OrderedDict();
        for (let index = this.size - 1; index >= 0; index--) {
          const key = this.keyAt(index);
          const element = this.get(key);
          reversed.set(key, element);
        }
        return reversed;
      }
      toSpliced(...args) {
        const entries = [...this.entries()];
        entries.splice(...args);
        return new _OrderedDict(entries);
      }
      slice(start, end) {
        const result = new _OrderedDict();
        let stop = this.size - 1;
        if (start === void 0) {
          return result;
        }
        if (start < 0) {
          start = start + this.size;
        }
        if (end !== void 0 && end > 0) {
          stop = end - 1;
        }
        for (let index = start; index <= stop; index++) {
          const key = this.keyAt(index);
          const element = this.get(key);
          result.set(key, element);
        }
        return result;
      }
      every(predicate, thisArg) {
        let index = 0;
        for (const entry of this) {
          if (!Reflect.apply(predicate, thisArg, [entry, index, this])) {
            return false;
          }
          index++;
        }
        return true;
      }
      some(predicate, thisArg) {
        let index = 0;
        for (const entry of this) {
          if (Reflect.apply(predicate, thisArg, [entry, index, this])) {
            return true;
          }
          index++;
        }
        return false;
      }
    };
    function at(array, index) {
      if ('at' in Array.prototype) {
        return Array.prototype.at.call(array, index);
      }
      const actualIndex = toSafeIndex(array, index);
      return actualIndex === -1 ? void 0 : array[actualIndex];
    }
    function toSafeIndex(array, index) {
      const length = array.length;
      const relativeIndex = toSafeInteger(index);
      const actualIndex = relativeIndex >= 0 ? relativeIndex : length + relativeIndex;
      return actualIndex < 0 || actualIndex >= length ? -1 : actualIndex;
    }
    function toSafeInteger(number) {
      return number !== number || number === 0 ? 0 : Math.trunc(number);
    }
    function createCollection2(name) {
      const PROVIDER_NAME = name + 'CollectionProvider';
      const [createCollectionContext, createCollectionScope] = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$context$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'createContextScope'
      ])(PROVIDER_NAME);
      const [CollectionContextProvider, useCollectionContext] = createCollectionContext(
        PROVIDER_NAME,
        {
          collectionElement: null,
          collectionRef: {
            current: null,
          },
          collectionRefObject: {
            current: null,
          },
          itemMap: new OrderedDict(),
          setItemMap: () => void 0,
        }
      );
      const CollectionProvider = ({ state, ...props }) => {
        return state
          ? /* @__PURE__ */ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsx'
            ])(CollectionProviderImpl, {
              ...props,
              state,
            })
          : /* @__PURE__ */ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsx'
            ])(CollectionInit, {
              ...props,
            });
      };
      CollectionProvider.displayName = PROVIDER_NAME;
      const CollectionInit = (props) => {
        const state = useInitCollection();
        return /* @__PURE__ */ (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'jsx'
        ])(CollectionProviderImpl, {
          ...props,
          state,
        });
      };
      CollectionInit.displayName = PROVIDER_NAME + 'Init';
      const CollectionProviderImpl = (props) => {
        const { scope, children, state } = props;
        const ref =
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'default'
          ].useRef(null);
        const [collectionElement, setCollectionElement] =
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'default'
          ].useState(null);
        const composeRefs = (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$compose$2d$refs$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useComposedRefs'
        ])(ref, setCollectionElement);
        const [itemMap, setItemMap] = state;
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'default'
        ].useEffect(
          {
            'createCollection2.CollectionProviderImpl.useEffect': () => {
              if (!collectionElement) return;
              const observer = getChildListObserver(
                {
                  'createCollection2.CollectionProviderImpl.useEffect.observer': () => {},
                }['createCollection2.CollectionProviderImpl.useEffect.observer']
              );
              observer.observe(collectionElement, {
                childList: true,
                subtree: true,
              });
              return {
                'createCollection2.CollectionProviderImpl.useEffect': () => {
                  observer.disconnect();
                },
              }['createCollection2.CollectionProviderImpl.useEffect'];
            },
          }['createCollection2.CollectionProviderImpl.useEffect'],
          [collectionElement]
        );
        return /* @__PURE__ */ (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'jsx'
        ])(CollectionContextProvider, {
          scope,
          itemMap,
          setItemMap,
          collectionRef: composeRefs,
          collectionRefObject: ref,
          collectionElement,
          children,
        });
      };
      CollectionProviderImpl.displayName = PROVIDER_NAME + 'Impl';
      const COLLECTION_SLOT_NAME = name + 'CollectionSlot';
      const CollectionSlotImpl = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'createSlot'
      ])(COLLECTION_SLOT_NAME);
      const CollectionSlot =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'default'
        ].forwardRef((props, forwardedRef) => {
          const { scope, children } = props;
          const context = useCollectionContext(COLLECTION_SLOT_NAME, scope);
          const composedRefs = (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$compose$2d$refs$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'useComposedRefs'
          ])(forwardedRef, context.collectionRef);
          return /* @__PURE__ */ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsx'
          ])(CollectionSlotImpl, {
            ref: composedRefs,
            children,
          });
        });
      CollectionSlot.displayName = COLLECTION_SLOT_NAME;
      const ITEM_SLOT_NAME = name + 'CollectionItemSlot';
      const ITEM_DATA_ATTR = 'data-radix-collection-item';
      const CollectionItemSlotImpl = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'createSlot'
      ])(ITEM_SLOT_NAME);
      const CollectionItemSlot =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'default'
        ].forwardRef((props, forwardedRef) => {
          const { scope, children, ...itemData } = props;
          const ref =
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'default'
            ].useRef(null);
          const [element, setElement] =
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'default'
            ].useState(null);
          const composedRefs = (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$compose$2d$refs$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'useComposedRefs'
          ])(forwardedRef, ref, setElement);
          const context = useCollectionContext(ITEM_SLOT_NAME, scope);
          const { setItemMap } = context;
          const itemDataRef =
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'default'
            ].useRef(itemData);
          if (!shallowEqual(itemDataRef.current, itemData)) {
            itemDataRef.current = itemData;
          }
          const memoizedItemData = itemDataRef.current;
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'default'
          ].useEffect(
            {
              'createCollection2.CollectionItemSlot.useEffect': () => {
                const itemData2 = memoizedItemData;
                setItemMap(
                  {
                    'createCollection2.CollectionItemSlot.useEffect': (map) => {
                      if (!element) {
                        return map;
                      }
                      if (!map.has(element)) {
                        map.set(element, {
                          ...itemData2,
                          element,
                        });
                        return map.toSorted(sortByDocumentPosition);
                      }
                      return map
                        .set(element, {
                          ...itemData2,
                          element,
                        })
                        .toSorted(sortByDocumentPosition);
                    },
                  }['createCollection2.CollectionItemSlot.useEffect']
                );
                return {
                  'createCollection2.CollectionItemSlot.useEffect': () => {
                    setItemMap(
                      {
                        'createCollection2.CollectionItemSlot.useEffect': (map) => {
                          if (!element || !map.has(element)) {
                            return map;
                          }
                          map.delete(element);
                          return new OrderedDict(map);
                        },
                      }['createCollection2.CollectionItemSlot.useEffect']
                    );
                  },
                }['createCollection2.CollectionItemSlot.useEffect'];
              },
            }['createCollection2.CollectionItemSlot.useEffect'],
            [element, memoizedItemData, setItemMap]
          );
          return /* @__PURE__ */ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsx'
          ])(CollectionItemSlotImpl, {
            ...{
              [ITEM_DATA_ATTR]: '',
            },
            ref: composedRefs,
            children,
          });
        });
      CollectionItemSlot.displayName = ITEM_SLOT_NAME;
      function useInitCollection() {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'default'
        ].useState(new OrderedDict());
      }
      function useCollection(scope) {
        const { itemMap } = useCollectionContext(name + 'CollectionConsumer', scope);
        return itemMap;
      }
      const functions = {
        createCollectionScope,
        useCollection,
        useInitCollection,
      };
      return [
        {
          Provider: CollectionProvider,
          Slot: CollectionSlot,
          ItemSlot: CollectionItemSlot,
        },
        functions,
      ];
    }
    function shallowEqual(a, b) {
      if (a === b) return true;
      if (typeof a !== 'object' || typeof b !== 'object') return false;
      if (a == null || b == null) return false;
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;
      for (const key of keysA) {
        if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
        if (a[key] !== b[key]) return false;
      }
      return true;
    }
    function isElementPreceding(a, b) {
      return !!(b.compareDocumentPosition(a) & Node.DOCUMENT_POSITION_PRECEDING);
    }
    function sortByDocumentPosition(a, b) {
      return !a[1].element || !b[1].element
        ? 0
        : isElementPreceding(a[1].element, b[1].element)
          ? -1
          : 1;
    }
    function getChildListObserver(callback) {
      const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
          if (mutation.type === 'childList') {
            callback();
            return;
          }
        }
      });
      return observer;
    }
    //# sourceMappingURL=index.mjs.map
  },
  '[project]/node_modules/@radix-ui/react-visually-hidden/dist/index.mjs [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'Root',
      () => Root,
      'VISUALLY_HIDDEN_STYLES',
      () => VISUALLY_HIDDEN_STYLES,
      'VisuallyHidden',
      () => VisuallyHidden,
    ]);
    // src/visually-hidden.tsx
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$primitive$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-primitive/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-runtime.js [app-client] (ecmascript)'
      );
    var VISUALLY_HIDDEN_STYLES = Object.freeze({
      // See: https://github.com/twbs/bootstrap/blob/main/scss/mixins/_visually-hidden.scss
      position: 'absolute',
      border: 0,
      width: 1,
      height: 1,
      padding: 0,
      margin: -1,
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      wordWrap: 'normal',
    });
    var NAME = 'VisuallyHidden';
    var VisuallyHidden =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ]((props, forwardedRef) => {
        return /* @__PURE__ */ (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'jsx'
        ])(
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$primitive$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'Primitive'
          ].span,
          {
            ...props,
            ref: forwardedRef,
            style: {
              ...VISUALLY_HIDDEN_STYLES,
              ...props.style,
            },
          }
        );
      });
    VisuallyHidden.displayName = NAME;
    var Root = VisuallyHidden;
    //# sourceMappingURL=index.mjs.map
  },
  '[project]/node_modules/@radix-ui/react-toast/dist/index.mjs [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'Action',
      () => Action,
      'Close',
      () => Close,
      'Description',
      () => Description,
      'Provider',
      () => Provider,
      'Root',
      () => Root2,
      'Title',
      () => Title,
      'Toast',
      () => Toast,
      'ToastAction',
      () => ToastAction,
      'ToastClose',
      () => ToastClose,
      'ToastDescription',
      () => ToastDescription,
      'ToastProvider',
      () => ToastProvider,
      'ToastTitle',
      () => ToastTitle,
      'ToastViewport',
      () => ToastViewport,
      'Viewport',
      () => Viewport,
      'createToastScope',
      () => createToastScope,
    ]);
    // src/toast.tsx
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2d$dom$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react-dom/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$primitive$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/primitive/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$compose$2d$refs$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-compose-refs/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$collection$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-collection/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$context$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-context/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dismissable$2d$layer$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-dismissable-layer/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$portal$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-portal/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$presence$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-presence/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$primitive$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-primitive/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$use$2d$callback$2d$ref$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-use-callback-ref/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$use$2d$controllable$2d$state$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-use-controllable-state/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$use$2d$layout$2d$effect$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-use-layout-effect/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$visually$2d$hidden$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/@radix-ui/react-visually-hidden/dist/index.mjs [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-runtime.js [app-client] (ecmascript)'
      );
    ('use client');
    var PROVIDER_NAME = 'ToastProvider';
    var [Collection, useCollection, createCollectionScope] = (0,
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$collection$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
      'createCollection'
    ])('Toast');
    var [createToastContext, createToastScope] = (0,
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$context$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
      'createContextScope'
    ])('Toast', [createCollectionScope]);
    var [ToastProviderProvider, useToastProviderContext] = createToastContext(PROVIDER_NAME);
    var ToastProvider = (props) => {
      const {
        __scopeToast,
        label = 'Notification',
        duration = 5e3,
        swipeDirection = 'right',
        swipeThreshold = 50,
        children,
      } = props;
      const [viewport, setViewport] =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useState'
        ](null);
      const [toastCount, setToastCount] =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useState'
        ](0);
      const isFocusedToastEscapeKeyDownRef =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useRef'
        ](false);
      const isClosePausedRef =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useRef'
        ](false);
      if (!label.trim()) {
        console.error(
          `Invalid prop \`label\` supplied to \`${PROVIDER_NAME}\`. Expected non-empty \`string\`.`
        );
      }
      return /* @__PURE__ */ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsx'
      ])(Collection.Provider, {
        scope: __scopeToast,
        children: /* @__PURE__ */ (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'jsx'
        ])(ToastProviderProvider, {
          scope: __scopeToast,
          label,
          duration,
          swipeDirection,
          swipeThreshold,
          toastCount,
          viewport,
          onViewportChange: setViewport,
          onToastAdd:
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'useCallback'
            ](
              {
                'ToastProvider.useCallback': () =>
                  setToastCount(
                    {
                      'ToastProvider.useCallback': (prevCount) => prevCount + 1,
                    }['ToastProvider.useCallback']
                  ),
              }['ToastProvider.useCallback'],
              []
            ),
          onToastRemove:
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'useCallback'
            ](
              {
                'ToastProvider.useCallback': () =>
                  setToastCount(
                    {
                      'ToastProvider.useCallback': (prevCount) => prevCount - 1,
                    }['ToastProvider.useCallback']
                  ),
              }['ToastProvider.useCallback'],
              []
            ),
          isFocusedToastEscapeKeyDownRef,
          isClosePausedRef,
          children,
        }),
      });
    };
    ToastProvider.displayName = PROVIDER_NAME;
    var VIEWPORT_NAME = 'ToastViewport';
    var VIEWPORT_DEFAULT_HOTKEY = ['F8'];
    var VIEWPORT_PAUSE = 'toast.viewportPause';
    var VIEWPORT_RESUME = 'toast.viewportResume';
    var ToastViewport =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ]((props, forwardedRef) => {
        const {
          __scopeToast,
          hotkey = VIEWPORT_DEFAULT_HOTKEY,
          label = 'Notifications ({hotkey})',
          ...viewportProps
        } = props;
        const context = useToastProviderContext(VIEWPORT_NAME, __scopeToast);
        const getItems = useCollection(__scopeToast);
        const wrapperRef =
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'useRef'
          ](null);
        const headFocusProxyRef =
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'useRef'
          ](null);
        const tailFocusProxyRef =
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'useRef'
          ](null);
        const ref =
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'useRef'
          ](null);
        const composedRefs = (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$compose$2d$refs$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useComposedRefs'
        ])(forwardedRef, ref, context.onViewportChange);
        const hotkeyLabel = hotkey.join('+').replace(/Key/g, '').replace(/Digit/g, '');
        const hasToasts = context.toastCount > 0;
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useEffect'
        ](
          {
            'ToastViewport.useEffect': () => {
              const handleKeyDown = {
                'ToastViewport.useEffect.handleKeyDown': (event) => {
                  const isHotkeyPressed =
                    hotkey.length !== 0 &&
                    hotkey.every(
                      {
                        'ToastViewport.useEffect.handleKeyDown': (key) =>
                          event[key] || event.code === key,
                      }['ToastViewport.useEffect.handleKeyDown']
                    );
                  if (isHotkeyPressed) ref.current?.focus();
                },
              }['ToastViewport.useEffect.handleKeyDown'];
              document.addEventListener('keydown', handleKeyDown);
              return {
                'ToastViewport.useEffect': () =>
                  document.removeEventListener('keydown', handleKeyDown),
              }['ToastViewport.useEffect'];
            },
          }['ToastViewport.useEffect'],
          [hotkey]
        );
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useEffect'
        ](
          {
            'ToastViewport.useEffect': () => {
              const wrapper = wrapperRef.current;
              const viewport = ref.current;
              if (hasToasts && wrapper && viewport) {
                const handlePause = {
                  'ToastViewport.useEffect.handlePause': () => {
                    if (!context.isClosePausedRef.current) {
                      const pauseEvent = new CustomEvent(VIEWPORT_PAUSE);
                      viewport.dispatchEvent(pauseEvent);
                      context.isClosePausedRef.current = true;
                    }
                  },
                }['ToastViewport.useEffect.handlePause'];
                const handleResume = {
                  'ToastViewport.useEffect.handleResume': () => {
                    if (context.isClosePausedRef.current) {
                      const resumeEvent = new CustomEvent(VIEWPORT_RESUME);
                      viewport.dispatchEvent(resumeEvent);
                      context.isClosePausedRef.current = false;
                    }
                  },
                }['ToastViewport.useEffect.handleResume'];
                const handleFocusOutResume = {
                  'ToastViewport.useEffect.handleFocusOutResume': (event) => {
                    const isFocusMovingOutside = !wrapper.contains(event.relatedTarget);
                    if (isFocusMovingOutside) handleResume();
                  },
                }['ToastViewport.useEffect.handleFocusOutResume'];
                const handlePointerLeaveResume = {
                  'ToastViewport.useEffect.handlePointerLeaveResume': () => {
                    const isFocusInside = wrapper.contains(document.activeElement);
                    if (!isFocusInside) handleResume();
                  },
                }['ToastViewport.useEffect.handlePointerLeaveResume'];
                wrapper.addEventListener('focusin', handlePause);
                wrapper.addEventListener('focusout', handleFocusOutResume);
                wrapper.addEventListener('pointermove', handlePause);
                wrapper.addEventListener('pointerleave', handlePointerLeaveResume);
                window.addEventListener('blur', handlePause);
                window.addEventListener('focus', handleResume);
                return {
                  'ToastViewport.useEffect': () => {
                    wrapper.removeEventListener('focusin', handlePause);
                    wrapper.removeEventListener('focusout', handleFocusOutResume);
                    wrapper.removeEventListener('pointermove', handlePause);
                    wrapper.removeEventListener('pointerleave', handlePointerLeaveResume);
                    window.removeEventListener('blur', handlePause);
                    window.removeEventListener('focus', handleResume);
                  },
                }['ToastViewport.useEffect'];
              }
            },
          }['ToastViewport.useEffect'],
          [hasToasts, context.isClosePausedRef]
        );
        const getSortedTabbableCandidates =
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'useCallback'
          ](
            {
              'ToastViewport.useCallback[getSortedTabbableCandidates]': ({ tabbingDirection }) => {
                const toastItems = getItems();
                const tabbableCandidates = toastItems.map(
                  {
                    'ToastViewport.useCallback[getSortedTabbableCandidates].tabbableCandidates': (
                      toastItem
                    ) => {
                      const toastNode = toastItem.ref.current;
                      const toastTabbableCandidates = [
                        toastNode,
                        ...getTabbableCandidates(toastNode),
                      ];
                      return tabbingDirection === 'forwards'
                        ? toastTabbableCandidates
                        : toastTabbableCandidates.reverse();
                    },
                  }['ToastViewport.useCallback[getSortedTabbableCandidates].tabbableCandidates']
                );
                return (
                  tabbingDirection === 'forwards'
                    ? tabbableCandidates.reverse()
                    : tabbableCandidates
                ).flat();
              },
            }['ToastViewport.useCallback[getSortedTabbableCandidates]'],
            [getItems]
          );
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useEffect'
        ](
          {
            'ToastViewport.useEffect': () => {
              const viewport = ref.current;
              if (viewport) {
                const handleKeyDown = {
                  'ToastViewport.useEffect.handleKeyDown': (event) => {
                    const isMetaKey = event.altKey || event.ctrlKey || event.metaKey;
                    const isTabKey = event.key === 'Tab' && !isMetaKey;
                    if (isTabKey) {
                      const focusedElement = document.activeElement;
                      const isTabbingBackwards = event.shiftKey;
                      const targetIsViewport = event.target === viewport;
                      if (targetIsViewport && isTabbingBackwards) {
                        headFocusProxyRef.current?.focus();
                        return;
                      }
                      const tabbingDirection = isTabbingBackwards ? 'backwards' : 'forwards';
                      const sortedCandidates = getSortedTabbableCandidates({
                        tabbingDirection,
                      });
                      const index = sortedCandidates.findIndex(
                        {
                          'ToastViewport.useEffect.handleKeyDown.index': (candidate) =>
                            candidate === focusedElement,
                        }['ToastViewport.useEffect.handleKeyDown.index']
                      );
                      if (focusFirst(sortedCandidates.slice(index + 1))) {
                        event.preventDefault();
                      } else {
                        isTabbingBackwards
                          ? headFocusProxyRef.current?.focus()
                          : tailFocusProxyRef.current?.focus();
                      }
                    }
                  },
                }['ToastViewport.useEffect.handleKeyDown'];
                viewport.addEventListener('keydown', handleKeyDown);
                return {
                  'ToastViewport.useEffect': () =>
                    viewport.removeEventListener('keydown', handleKeyDown),
                }['ToastViewport.useEffect'];
              }
            },
          }['ToastViewport.useEffect'],
          [getItems, getSortedTabbableCandidates]
        );
        return /* @__PURE__ */ (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'jsxs'
        ])(
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dismissable$2d$layer$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'Branch'
          ],
          {
            ref: wrapperRef,
            role: 'region',
            'aria-label': label.replace('{hotkey}', hotkeyLabel),
            tabIndex: -1,
            style: {
              pointerEvents: hasToasts ? void 0 : 'none',
            },
            children: [
              hasToasts &&
                /* @__PURE__ */ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsx'
                ])(FocusProxy, {
                  ref: headFocusProxyRef,
                  onFocusFromOutsideViewport: () => {
                    const tabbableCandidates = getSortedTabbableCandidates({
                      tabbingDirection: 'forwards',
                    });
                    focusFirst(tabbableCandidates);
                  },
                }),
              /* @__PURE__ */ (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'jsx'
              ])(Collection.Slot, {
                scope: __scopeToast,
                children: /* @__PURE__ */ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsx'
                ])(
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$primitive$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'Primitive'
                  ].ol,
                  {
                    tabIndex: -1,
                    ...viewportProps,
                    ref: composedRefs,
                  }
                ),
              }),
              hasToasts &&
                /* @__PURE__ */ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsx'
                ])(FocusProxy, {
                  ref: tailFocusProxyRef,
                  onFocusFromOutsideViewport: () => {
                    const tabbableCandidates = getSortedTabbableCandidates({
                      tabbingDirection: 'backwards',
                    });
                    focusFirst(tabbableCandidates);
                  },
                }),
            ],
          }
        );
      });
    ToastViewport.displayName = VIEWPORT_NAME;
    var FOCUS_PROXY_NAME = 'ToastFocusProxy';
    var FocusProxy =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ]((props, forwardedRef) => {
        const { __scopeToast, onFocusFromOutsideViewport, ...proxyProps } = props;
        const context = useToastProviderContext(FOCUS_PROXY_NAME, __scopeToast);
        return /* @__PURE__ */ (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'jsx'
        ])(
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$visually$2d$hidden$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'VisuallyHidden'
          ],
          {
            tabIndex: 0,
            ...proxyProps,
            ref: forwardedRef,
            style: {
              position: 'fixed',
            },
            onFocus: (event) => {
              const prevFocusedElement = event.relatedTarget;
              const isFocusFromOutsideViewport = !context.viewport?.contains(prevFocusedElement);
              if (isFocusFromOutsideViewport) onFocusFromOutsideViewport();
            },
          }
        );
      });
    FocusProxy.displayName = FOCUS_PROXY_NAME;
    var TOAST_NAME = 'Toast';
    var TOAST_SWIPE_START = 'toast.swipeStart';
    var TOAST_SWIPE_MOVE = 'toast.swipeMove';
    var TOAST_SWIPE_CANCEL = 'toast.swipeCancel';
    var TOAST_SWIPE_END = 'toast.swipeEnd';
    var Toast =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ]((props, forwardedRef) => {
        const { forceMount, open: openProp, defaultOpen, onOpenChange, ...toastProps } = props;
        const [open, setOpen] = (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$use$2d$controllable$2d$state$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useControllableState'
        ])({
          prop: openProp,
          defaultProp: defaultOpen ?? true,
          onChange: onOpenChange,
          caller: TOAST_NAME,
        });
        return /* @__PURE__ */ (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'jsx'
        ])(
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$presence$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'Presence'
          ],
          {
            present: forceMount || open,
            children: /* @__PURE__ */ (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'jsx'
            ])(ToastImpl, {
              open,
              ...toastProps,
              ref: forwardedRef,
              onClose: () => setOpen(false),
              onPause: (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$use$2d$callback$2d$ref$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'useCallbackRef'
              ])(props.onPause),
              onResume: (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$use$2d$callback$2d$ref$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'useCallbackRef'
              ])(props.onResume),
              onSwipeStart: (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$primitive$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'composeEventHandlers'
              ])(props.onSwipeStart, (event) => {
                event.currentTarget.setAttribute('data-swipe', 'start');
              }),
              onSwipeMove: (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$primitive$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'composeEventHandlers'
              ])(props.onSwipeMove, (event) => {
                const { x, y } = event.detail.delta;
                event.currentTarget.setAttribute('data-swipe', 'move');
                event.currentTarget.style.setProperty('--radix-toast-swipe-move-x', `${x}px`);
                event.currentTarget.style.setProperty('--radix-toast-swipe-move-y', `${y}px`);
              }),
              onSwipeCancel: (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$primitive$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'composeEventHandlers'
              ])(props.onSwipeCancel, (event) => {
                event.currentTarget.setAttribute('data-swipe', 'cancel');
                event.currentTarget.style.removeProperty('--radix-toast-swipe-move-x');
                event.currentTarget.style.removeProperty('--radix-toast-swipe-move-y');
                event.currentTarget.style.removeProperty('--radix-toast-swipe-end-x');
                event.currentTarget.style.removeProperty('--radix-toast-swipe-end-y');
              }),
              onSwipeEnd: (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$primitive$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'composeEventHandlers'
              ])(props.onSwipeEnd, (event) => {
                const { x, y } = event.detail.delta;
                event.currentTarget.setAttribute('data-swipe', 'end');
                event.currentTarget.style.removeProperty('--radix-toast-swipe-move-x');
                event.currentTarget.style.removeProperty('--radix-toast-swipe-move-y');
                event.currentTarget.style.setProperty('--radix-toast-swipe-end-x', `${x}px`);
                event.currentTarget.style.setProperty('--radix-toast-swipe-end-y', `${y}px`);
                setOpen(false);
              }),
            }),
          }
        );
      });
    Toast.displayName = TOAST_NAME;
    var [ToastInteractiveProvider, useToastInteractiveContext] = createToastContext(TOAST_NAME, {
      onClose() {},
    });
    var ToastImpl =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ]((props, forwardedRef) => {
        const {
          __scopeToast,
          type = 'foreground',
          duration: durationProp,
          open,
          onClose,
          onEscapeKeyDown,
          onPause,
          onResume,
          onSwipeStart,
          onSwipeMove,
          onSwipeCancel,
          onSwipeEnd,
          ...toastProps
        } = props;
        const context = useToastProviderContext(TOAST_NAME, __scopeToast);
        const [node, setNode] =
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'useState'
          ](null);
        const composedRefs = (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$compose$2d$refs$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useComposedRefs'
        ])(
          forwardedRef,
          {
            'ToastImpl.useComposedRefs[composedRefs]': (node2) => setNode(node2),
          }['ToastImpl.useComposedRefs[composedRefs]']
        );
        const pointerStartRef =
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'useRef'
          ](null);
        const swipeDeltaRef =
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'useRef'
          ](null);
        const duration = durationProp || context.duration;
        const closeTimerStartTimeRef =
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'useRef'
          ](0);
        const closeTimerRemainingTimeRef =
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'useRef'
          ](duration);
        const closeTimerRef =
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'useRef'
          ](0);
        const { onToastAdd, onToastRemove } = context;
        const handleClose = (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$use$2d$callback$2d$ref$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useCallbackRef'
        ])(
          {
            'ToastImpl.useCallbackRef[handleClose]': () => {
              const isFocusInToast = node?.contains(document.activeElement);
              if (isFocusInToast) context.viewport?.focus();
              onClose();
            },
          }['ToastImpl.useCallbackRef[handleClose]']
        );
        const startTimer =
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'useCallback'
          ](
            {
              'ToastImpl.useCallback[startTimer]': (duration2) => {
                if (!duration2 || duration2 === Infinity) return;
                window.clearTimeout(closeTimerRef.current);
                closeTimerStartTimeRef.current = /* @__PURE__ */ new Date().getTime();
                closeTimerRef.current = window.setTimeout(handleClose, duration2);
              },
            }['ToastImpl.useCallback[startTimer]'],
            [handleClose]
          );
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useEffect'
        ](
          {
            'ToastImpl.useEffect': () => {
              const viewport = context.viewport;
              if (viewport) {
                const handleResume = {
                  'ToastImpl.useEffect.handleResume': () => {
                    startTimer(closeTimerRemainingTimeRef.current);
                    onResume?.();
                  },
                }['ToastImpl.useEffect.handleResume'];
                const handlePause = {
                  'ToastImpl.useEffect.handlePause': () => {
                    const elapsedTime =
                      /* @__PURE__ */ new Date().getTime() - closeTimerStartTimeRef.current;
                    closeTimerRemainingTimeRef.current =
                      closeTimerRemainingTimeRef.current - elapsedTime;
                    window.clearTimeout(closeTimerRef.current);
                    onPause?.();
                  },
                }['ToastImpl.useEffect.handlePause'];
                viewport.addEventListener(VIEWPORT_PAUSE, handlePause);
                viewport.addEventListener(VIEWPORT_RESUME, handleResume);
                return {
                  'ToastImpl.useEffect': () => {
                    viewport.removeEventListener(VIEWPORT_PAUSE, handlePause);
                    viewport.removeEventListener(VIEWPORT_RESUME, handleResume);
                  },
                }['ToastImpl.useEffect'];
              }
            },
          }['ToastImpl.useEffect'],
          [context.viewport, duration, onPause, onResume, startTimer]
        );
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useEffect'
        ](
          {
            'ToastImpl.useEffect': () => {
              if (open && !context.isClosePausedRef.current) startTimer(duration);
            },
          }['ToastImpl.useEffect'],
          [open, duration, context.isClosePausedRef, startTimer]
        );
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useEffect'
        ](
          {
            'ToastImpl.useEffect': () => {
              onToastAdd();
              return {
                'ToastImpl.useEffect': () => onToastRemove(),
              }['ToastImpl.useEffect'];
            },
          }['ToastImpl.useEffect'],
          [onToastAdd, onToastRemove]
        );
        const announceTextContent =
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'useMemo'
          ](
            {
              'ToastImpl.useMemo[announceTextContent]': () => {
                return node ? getAnnounceTextContent(node) : null;
              },
            }['ToastImpl.useMemo[announceTextContent]'],
            [node]
          );
        if (!context.viewport) return null;
        return /* @__PURE__ */ (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'jsxs'
        ])(
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'Fragment'
          ],
          {
            children: [
              announceTextContent &&
                /* @__PURE__ */ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsx'
                ])(ToastAnnounce, {
                  __scopeToast,
                  role: 'status',
                  'aria-live': type === 'foreground' ? 'assertive' : 'polite',
                  children: announceTextContent,
                }),
              /* @__PURE__ */ (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'jsx'
              ])(ToastInteractiveProvider, {
                scope: __scopeToast,
                onClose: handleClose,
                children:
                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2d$dom$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'createPortal'
                  ](
                    /* @__PURE__ */ (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'jsx'
                    ])(Collection.ItemSlot, {
                      scope: __scopeToast,
                      children: /* @__PURE__ */ (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'jsx'
                      ])(
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dismissable$2d$layer$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'Root'
                        ],
                        {
                          asChild: true,
                          onEscapeKeyDown: (0,
                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$primitive$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                            'composeEventHandlers'
                          ])(onEscapeKeyDown, () => {
                            if (!context.isFocusedToastEscapeKeyDownRef.current) handleClose();
                            context.isFocusedToastEscapeKeyDownRef.current = false;
                          }),
                          children: /* @__PURE__ */ (0,
                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                            'jsx'
                          ])(
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$primitive$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'Primitive'
                            ].li,
                            {
                              tabIndex: 0,
                              'data-state': open ? 'open' : 'closed',
                              'data-swipe-direction': context.swipeDirection,
                              ...toastProps,
                              ref: composedRefs,
                              style: {
                                userSelect: 'none',
                                touchAction: 'none',
                                ...props.style,
                              },
                              onKeyDown: (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$primitive$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'composeEventHandlers'
                              ])(props.onKeyDown, (event) => {
                                if (event.key !== 'Escape') return;
                                onEscapeKeyDown?.(event.nativeEvent);
                                if (!event.nativeEvent.defaultPrevented) {
                                  context.isFocusedToastEscapeKeyDownRef.current = true;
                                  handleClose();
                                }
                              }),
                              onPointerDown: (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$primitive$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'composeEventHandlers'
                              ])(props.onPointerDown, (event) => {
                                if (event.button !== 0) return;
                                pointerStartRef.current = {
                                  x: event.clientX,
                                  y: event.clientY,
                                };
                              }),
                              onPointerMove: (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$primitive$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'composeEventHandlers'
                              ])(props.onPointerMove, (event) => {
                                if (!pointerStartRef.current) return;
                                const x = event.clientX - pointerStartRef.current.x;
                                const y = event.clientY - pointerStartRef.current.y;
                                const hasSwipeMoveStarted = Boolean(swipeDeltaRef.current);
                                const isHorizontalSwipe = ['left', 'right'].includes(
                                  context.swipeDirection
                                );
                                const clamp = ['left', 'up'].includes(context.swipeDirection)
                                  ? Math.min
                                  : Math.max;
                                const clampedX = isHorizontalSwipe ? clamp(0, x) : 0;
                                const clampedY = !isHorizontalSwipe ? clamp(0, y) : 0;
                                const moveStartBuffer = event.pointerType === 'touch' ? 10 : 2;
                                const delta = {
                                  x: clampedX,
                                  y: clampedY,
                                };
                                const eventDetail = {
                                  originalEvent: event,
                                  delta,
                                };
                                if (hasSwipeMoveStarted) {
                                  swipeDeltaRef.current = delta;
                                  handleAndDispatchCustomEvent(
                                    TOAST_SWIPE_MOVE,
                                    onSwipeMove,
                                    eventDetail,
                                    {
                                      discrete: false,
                                    }
                                  );
                                } else if (
                                  isDeltaInDirection(delta, context.swipeDirection, moveStartBuffer)
                                ) {
                                  swipeDeltaRef.current = delta;
                                  handleAndDispatchCustomEvent(
                                    TOAST_SWIPE_START,
                                    onSwipeStart,
                                    eventDetail,
                                    {
                                      discrete: false,
                                    }
                                  );
                                  event.target.setPointerCapture(event.pointerId);
                                } else if (
                                  Math.abs(x) > moveStartBuffer ||
                                  Math.abs(y) > moveStartBuffer
                                ) {
                                  pointerStartRef.current = null;
                                }
                              }),
                              onPointerUp: (0,
                              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$primitive$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'composeEventHandlers'
                              ])(props.onPointerUp, (event) => {
                                const delta = swipeDeltaRef.current;
                                const target = event.target;
                                if (target.hasPointerCapture(event.pointerId)) {
                                  target.releasePointerCapture(event.pointerId);
                                }
                                swipeDeltaRef.current = null;
                                pointerStartRef.current = null;
                                if (delta) {
                                  const toast = event.currentTarget;
                                  const eventDetail = {
                                    originalEvent: event,
                                    delta,
                                  };
                                  if (
                                    isDeltaInDirection(
                                      delta,
                                      context.swipeDirection,
                                      context.swipeThreshold
                                    )
                                  ) {
                                    handleAndDispatchCustomEvent(
                                      TOAST_SWIPE_END,
                                      onSwipeEnd,
                                      eventDetail,
                                      {
                                        discrete: true,
                                      }
                                    );
                                  } else {
                                    handleAndDispatchCustomEvent(
                                      TOAST_SWIPE_CANCEL,
                                      onSwipeCancel,
                                      eventDetail,
                                      {
                                        discrete: true,
                                      }
                                    );
                                  }
                                  toast.addEventListener(
                                    'click',
                                    (event2) => event2.preventDefault(),
                                    {
                                      once: true,
                                    }
                                  );
                                }
                              }),
                            }
                          ),
                        }
                      ),
                    }),
                    context.viewport
                  ),
              }),
            ],
          }
        );
      });
    var ToastAnnounce = (props) => {
      const { __scopeToast, children, ...announceProps } = props;
      const context = useToastProviderContext(TOAST_NAME, __scopeToast);
      const [renderAnnounceText, setRenderAnnounceText] =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useState'
        ](false);
      const [isAnnounced, setIsAnnounced] =
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useState'
        ](false);
      useNextFrame(
        {
          'ToastAnnounce.useNextFrame': () => setRenderAnnounceText(true),
        }['ToastAnnounce.useNextFrame']
      );
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useEffect'
      ](
        {
          'ToastAnnounce.useEffect': () => {
            const timer = window.setTimeout(
              {
                'ToastAnnounce.useEffect.timer': () => setIsAnnounced(true),
              }['ToastAnnounce.useEffect.timer'],
              1e3
            );
            return {
              'ToastAnnounce.useEffect': () => window.clearTimeout(timer),
            }['ToastAnnounce.useEffect'];
          },
        }['ToastAnnounce.useEffect'],
        []
      );
      return isAnnounced
        ? null
        : /* @__PURE__ */ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsx'
          ])(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$portal$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'Portal'
            ],
            {
              asChild: true,
              children: /* @__PURE__ */ (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'jsx'
              ])(
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$visually$2d$hidden$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'VisuallyHidden'
                ],
                {
                  ...announceProps,
                  children:
                    renderAnnounceText &&
                    /* @__PURE__ */ (0,
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                      'jsxs'
                    ])(
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'Fragment'
                      ],
                      {
                        children: [context.label, ' ', children],
                      }
                    ),
                }
              ),
            }
          );
    };
    var TITLE_NAME = 'ToastTitle';
    var ToastTitle =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ]((props, forwardedRef) => {
        const { __scopeToast, ...titleProps } = props;
        return /* @__PURE__ */ (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'jsx'
        ])(
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$primitive$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'Primitive'
          ].div,
          {
            ...titleProps,
            ref: forwardedRef,
          }
        );
      });
    ToastTitle.displayName = TITLE_NAME;
    var DESCRIPTION_NAME = 'ToastDescription';
    var ToastDescription =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ]((props, forwardedRef) => {
        const { __scopeToast, ...descriptionProps } = props;
        return /* @__PURE__ */ (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'jsx'
        ])(
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$primitive$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'Primitive'
          ].div,
          {
            ...descriptionProps,
            ref: forwardedRef,
          }
        );
      });
    ToastDescription.displayName = DESCRIPTION_NAME;
    var ACTION_NAME = 'ToastAction';
    var ToastAction =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ]((props, forwardedRef) => {
        const { altText, ...actionProps } = props;
        if (!altText.trim()) {
          console.error(
            `Invalid prop \`altText\` supplied to \`${ACTION_NAME}\`. Expected non-empty \`string\`.`
          );
          return null;
        }
        return /* @__PURE__ */ (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'jsx'
        ])(ToastAnnounceExclude, {
          altText,
          asChild: true,
          children: /* @__PURE__ */ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsx'
          ])(ToastClose, {
            ...actionProps,
            ref: forwardedRef,
          }),
        });
      });
    ToastAction.displayName = ACTION_NAME;
    var CLOSE_NAME = 'ToastClose';
    var ToastClose =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ]((props, forwardedRef) => {
        const { __scopeToast, ...closeProps } = props;
        const interactiveContext = useToastInteractiveContext(CLOSE_NAME, __scopeToast);
        return /* @__PURE__ */ (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'jsx'
        ])(ToastAnnounceExclude, {
          asChild: true,
          children: /* @__PURE__ */ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsx'
          ])(
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$primitive$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'Primitive'
            ].button,
            {
              type: 'button',
              ...closeProps,
              ref: forwardedRef,
              onClick: (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$primitive$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                'composeEventHandlers'
              ])(props.onClick, interactiveContext.onClose),
            }
          ),
        });
      });
    ToastClose.displayName = CLOSE_NAME;
    var ToastAnnounceExclude =
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ]((props, forwardedRef) => {
        const { __scopeToast, altText, ...announceExcludeProps } = props;
        return /* @__PURE__ */ (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'jsx'
        ])(
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$primitive$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'Primitive'
          ].div,
          {
            'data-radix-toast-announce-exclude': '',
            'data-radix-toast-announce-alt': altText || void 0,
            ...announceExcludeProps,
            ref: forwardedRef,
          }
        );
      });
    function getAnnounceTextContent(container) {
      const textContent = [];
      const childNodes = Array.from(container.childNodes);
      childNodes.forEach((node) => {
        if (node.nodeType === node.TEXT_NODE && node.textContent)
          textContent.push(node.textContent);
        if (isHTMLElement(node)) {
          const isHidden = node.ariaHidden || node.hidden || node.style.display === 'none';
          const isExcluded = node.dataset.radixToastAnnounceExclude === '';
          if (!isHidden) {
            if (isExcluded) {
              const altText = node.dataset.radixToastAnnounceAlt;
              if (altText) textContent.push(altText);
            } else {
              textContent.push(...getAnnounceTextContent(node));
            }
          }
        }
      });
      return textContent;
    }
    function handleAndDispatchCustomEvent(name, handler, detail, { discrete }) {
      const currentTarget = detail.originalEvent.currentTarget;
      const event = new CustomEvent(name, {
        bubbles: true,
        cancelable: true,
        detail,
      });
      if (handler)
        currentTarget.addEventListener(name, handler, {
          once: true,
        });
      if (discrete) {
        (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$primitive$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'dispatchDiscreteCustomEvent'
        ])(currentTarget, event);
      } else {
        currentTarget.dispatchEvent(event);
      }
    }
    var isDeltaInDirection = (delta, direction, threshold = 0) => {
      const deltaX = Math.abs(delta.x);
      const deltaY = Math.abs(delta.y);
      const isDeltaX = deltaX > deltaY;
      if (direction === 'left' || direction === 'right') {
        return isDeltaX && deltaX > threshold;
      } else {
        return !isDeltaX && deltaY > threshold;
      }
    };
    function useNextFrame(callback = () => {}) {
      const fn = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$use$2d$callback$2d$ref$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useCallbackRef'
      ])(callback);
      (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$use$2d$layout$2d$effect$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useLayoutEffect'
      ])(
        {
          'useNextFrame.useLayoutEffect': () => {
            let raf1 = 0;
            let raf2 = 0;
            raf1 = window.requestAnimationFrame(
              {
                'useNextFrame.useLayoutEffect': () => (raf2 = window.requestAnimationFrame(fn)),
              }['useNextFrame.useLayoutEffect']
            );
            return {
              'useNextFrame.useLayoutEffect': () => {
                window.cancelAnimationFrame(raf1);
                window.cancelAnimationFrame(raf2);
              },
            }['useNextFrame.useLayoutEffect'];
          },
        }['useNextFrame.useLayoutEffect'],
        [fn]
      );
    }
    function isHTMLElement(node) {
      return node.nodeType === node.ELEMENT_NODE;
    }
    function getTabbableCandidates(container) {
      const nodes = [];
      const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT, {
        acceptNode: (node) => {
          const isHiddenInput = node.tagName === 'INPUT' && node.type === 'hidden';
          if (node.disabled || node.hidden || isHiddenInput) return NodeFilter.FILTER_SKIP;
          return node.tabIndex >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
        },
      });
      while (walker.nextNode()) nodes.push(walker.currentNode);
      return nodes;
    }
    function focusFirst(candidates) {
      const previouslyFocusedElement = document.activeElement;
      return candidates.some((candidate) => {
        if (candidate === previouslyFocusedElement) return true;
        candidate.focus();
        return document.activeElement !== previouslyFocusedElement;
      });
    }
    var Provider = ToastProvider;
    var Viewport = ToastViewport;
    var Root2 = Toast;
    var Title = ToastTitle;
    var Description = ToastDescription;
    var Action = ToastAction;
    var Close = ToastClose;
    //# sourceMappingURL=index.mjs.map
  },
]);

//# sourceMappingURL=_1825797c._.js.map
