(() => {
  'use strict';
  let e,
    t,
    a,
    s,
    r,
    n = {
      googleAnalytics: 'googleAnalytics',
      precache: 'precache-v2',
      prefix: 'serwist',
      runtime: 'runtime',
      suffix: 'u' > typeof registration ? registration.scope : '',
    },
    i = (e) => [n.prefix, e, n.suffix].filter((e) => e && e.length > 0).join('-'),
    c = (e) => e || i(n.precache),
    o = (e) => e || i(n.runtime);
  class l extends Error {
    details;
    constructor(e, t) {
      (super(
        ((e, ...t) => {
          let a = e;
          return (t.length > 0 && (a += ` :: ${JSON.stringify(t)}`), a);
        })(e, t)
      ),
        (this.name = e),
        (this.details = t));
    }
  }
  function h(e) {
    return new Promise((t) => setTimeout(t, e));
  }
  let u = new Set();
  function d(e, t) {
    let a = new URL(e);
    for (let e of t) a.searchParams.delete(e);
    return a.href;
  }
  async function m(e, t, a, s) {
    let r = d(t.url, a);
    if (t.url === r) return e.match(t, s);
    let n = { ...s, ignoreSearch: !0 };
    for (let i of await e.keys(t, n)) if (r === d(i.url, a)) return e.match(i, s);
  }
  class f {
    promise;
    resolve;
    reject;
    constructor() {
      this.promise = new Promise((e, t) => {
        ((this.resolve = e), (this.reject = t));
      });
    }
  }
  let g = async () => {
      for (let e of u) await e();
    },
    w = '-precache-',
    p = async (e, t = w) => {
      let a = (await self.caches.keys()).filter(
        (a) => a.includes(t) && a.includes(self.registration.scope) && a !== e
      );
      return (await Promise.all(a.map((e) => self.caches.delete(e))), a);
    },
    y = (e, t) => {
      let a = t();
      return (e.waitUntil(a), a);
    },
    _ = (e, t) => t.some((t) => e instanceof t),
    x = new WeakMap(),
    b = new WeakMap(),
    E = new WeakMap(),
    R = {
      get(e, t, a) {
        if (e instanceof IDBTransaction) {
          if ('done' === t) return x.get(e);
          if ('store' === t)
            return a.objectStoreNames[1] ? void 0 : a.objectStore(a.objectStoreNames[0]);
        }
        return v(e[t]);
      },
      set: (e, t, a) => ((e[t] = a), !0),
      has: (e, t) => (e instanceof IDBTransaction && ('done' === t || 'store' === t)) || t in e,
    };
  function v(e) {
    if (e instanceof IDBRequest) {
      let t;
      return (
        (t = new Promise((t, a) => {
          let s = () => {
              (e.removeEventListener('success', r), e.removeEventListener('error', n));
            },
            r = () => {
              (t(v(e.result)), s());
            },
            n = () => {
              (a(e.error), s());
            };
          (e.addEventListener('success', r), e.addEventListener('error', n));
        })),
        E.set(t, e),
        t
      );
    }
    if (b.has(e)) return b.get(e);
    let t = (function (e) {
      if ('function' == typeof e)
        return (
          r ||
          (r = [
            IDBCursor.prototype.advance,
            IDBCursor.prototype.continue,
            IDBCursor.prototype.continuePrimaryKey,
          ])
        ).includes(e)
          ? function (...t) {
              return (e.apply(q(this), t), v(this.request));
            }
          : function (...t) {
              return v(e.apply(q(this), t));
            };
      return (e instanceof IDBTransaction &&
        (function (e) {
          if (x.has(e)) return;
          let t = new Promise((t, a) => {
            let s = () => {
                (e.removeEventListener('complete', r),
                  e.removeEventListener('error', n),
                  e.removeEventListener('abort', n));
              },
              r = () => {
                (t(), s());
              },
              n = () => {
                (a(e.error || new DOMException('AbortError', 'AbortError')), s());
              };
            (e.addEventListener('complete', r),
              e.addEventListener('error', n),
              e.addEventListener('abort', n));
          });
          x.set(e, t);
        })(e),
      _(e, s || (s = [IDBDatabase, IDBObjectStore, IDBIndex, IDBCursor, IDBTransaction])))
        ? new Proxy(e, R)
        : e;
    })(e);
    return (t !== e && (b.set(e, t), E.set(t, e)), t);
  }
  let q = (e) => E.get(e);
  function S(e, t, { blocked: a, upgrade: s, blocking: r, terminated: n } = {}) {
    let i = indexedDB.open(e, t),
      c = v(i);
    return (
      s &&
        i.addEventListener('upgradeneeded', (e) => {
          s(v(i.result), e.oldVersion, e.newVersion, v(i.transaction), e);
        }),
      a && i.addEventListener('blocked', (e) => a(e.oldVersion, e.newVersion, e)),
      c
        .then((e) => {
          (n && e.addEventListener('close', () => n()),
            r && e.addEventListener('versionchange', (e) => r(e.oldVersion, e.newVersion, e)));
        })
        .catch(() => {}),
      c
    );
  }
  let D = ['get', 'getKey', 'getAll', 'getAllKeys', 'count'],
    N = ['put', 'add', 'delete', 'clear'],
    C = new Map();
  function T(e, t) {
    if (!(e instanceof IDBDatabase && !(t in e) && 'string' == typeof t)) return;
    if (C.get(t)) return C.get(t);
    let a = t.replace(/FromIndex$/, ''),
      s = t !== a,
      r = N.includes(a);
    if (!(a in (s ? IDBIndex : IDBObjectStore).prototype) || !(r || D.includes(a))) return;
    let n = async function (e, ...t) {
      let n = this.transaction(e, r ? 'readwrite' : 'readonly'),
        i = n.store;
      return (s && (i = i.index(t.shift())), (await Promise.all([i[a](...t), r && n.done]))[0]);
    };
    return (C.set(t, n), n);
  }
  R = {
    ...(e = R),
    get: (t, a, s) => T(t, a) || e.get(t, a, s),
    has: (t, a) => !!T(t, a) || e.has(t, a),
  };
  let P = ['continue', 'continuePrimaryKey', 'advance'],
    k = {},
    A = new WeakMap(),
    I = new WeakMap(),
    U = {
      get(e, t) {
        if (!P.includes(t)) return e[t];
        let a = k[t];
        return (
          a ||
            (a = k[t] =
              function (...e) {
                A.set(this, I.get(this)[t](...e));
              }),
          a
        );
      },
    };
  async function* L(...e) {
    let t = this;
    if ((t instanceof IDBCursor || (t = await t.openCursor(...e)), !t)) return;
    let a = new Proxy(t, U);
    for (I.set(a, t), E.set(a, q(t)); t; )
      (yield a, (t = await (A.get(a) || t.continue())), A.delete(a));
  }
  function F(e, t) {
    return (
      (t === Symbol.asyncIterator && _(e, [IDBIndex, IDBObjectStore, IDBCursor])) ||
      ('iterate' === t && _(e, [IDBIndex, IDBObjectStore]))
    );
  }
  R = {
    ...(t = R),
    get: (e, a, s) => (F(e, a) ? L : t.get(e, a, s)),
    has: (e, a) => F(e, a) || t.has(e, a),
  };
  let M = async (e, t) => {
      let s = null;
      if ((e.url && (s = new URL(e.url).origin), s !== self.location.origin))
        throw new l('cross-origin-copy-response', { origin: s });
      let r = e.clone(),
        n = { headers: new Headers(r.headers), status: r.status, statusText: r.statusText },
        i = t ? t(n) : n,
        c = !(function () {
          if (void 0 === a) {
            let e = new Response('');
            if ('body' in e)
              try {
                (new Response(e.body), (a = !0));
              } catch {
                a = !1;
              }
            a = !1;
          }
          return a;
        })()
          ? await r.blob()
          : r.body;
      return new Response(c, i);
    },
    O = 'requests',
    B = 'queueName';
  class K {
    _db = null;
    async addEntry(e) {
      let t = (await this.getDb()).transaction(O, 'readwrite', { durability: 'relaxed' });
      (await t.store.add(e), await t.done);
    }
    async getFirstEntryId() {
      let e = await this.getDb(),
        t = await e.transaction(O).store.openCursor();
      return t?.value.id;
    }
    async getAllEntriesByQueueName(e) {
      let t = await this.getDb();
      return (await t.getAllFromIndex(O, B, IDBKeyRange.only(e))) || [];
    }
    async getEntryCountByQueueName(e) {
      return (await this.getDb()).countFromIndex(O, B, IDBKeyRange.only(e));
    }
    async deleteEntry(e) {
      let t = await this.getDb();
      await t.delete(O, e);
    }
    async getFirstEntryByQueueName(e) {
      return await this.getEndEntryFromIndex(IDBKeyRange.only(e), 'next');
    }
    async getLastEntryByQueueName(e) {
      return await this.getEndEntryFromIndex(IDBKeyRange.only(e), 'prev');
    }
    async getEndEntryFromIndex(e, t) {
      let a = await this.getDb(),
        s = await a.transaction(O).store.index(B).openCursor(e, t);
      return s?.value;
    }
    async getDb() {
      return (
        this._db ||
          (this._db = await S('serwist-background-sync', 3, { upgrade: this._upgradeDb })),
        this._db
      );
    }
    _upgradeDb(e, t) {
      (t > 0 && t < 3 && e.objectStoreNames.contains(O) && e.deleteObjectStore(O),
        e
          .createObjectStore(O, { autoIncrement: !0, keyPath: 'id' })
          .createIndex(B, B, { unique: !1 }));
    }
  }
  class W {
    _queueName;
    _queueDb;
    constructor(e) {
      ((this._queueName = e), (this._queueDb = new K()));
    }
    async pushEntry(e) {
      (delete e.id, (e.queueName = this._queueName), await this._queueDb.addEntry(e));
    }
    async unshiftEntry(e) {
      let t = await this._queueDb.getFirstEntryId();
      (t ? (e.id = t - 1) : delete e.id,
        (e.queueName = this._queueName),
        await this._queueDb.addEntry(e));
    }
    async popEntry() {
      return this._removeEntry(await this._queueDb.getLastEntryByQueueName(this._queueName));
    }
    async shiftEntry() {
      return this._removeEntry(await this._queueDb.getFirstEntryByQueueName(this._queueName));
    }
    async getAll() {
      return await this._queueDb.getAllEntriesByQueueName(this._queueName);
    }
    async size() {
      return await this._queueDb.getEntryCountByQueueName(this._queueName);
    }
    async deleteEntry(e) {
      await this._queueDb.deleteEntry(e);
    }
    async _removeEntry(e) {
      return (e && (await this.deleteEntry(e.id)), e);
    }
  }
  let j = [
    'method',
    'referrer',
    'referrerPolicy',
    'mode',
    'credentials',
    'cache',
    'redirect',
    'integrity',
    'keepalive',
  ];
  class $ {
    _requestData;
    static async fromRequest(e) {
      let t = { url: e.url, headers: {} };
      for (let a of ('GET' !== e.method && (t.body = await e.clone().arrayBuffer()),
      e.headers.forEach((e, a) => {
        t.headers[a] = e;
      }),
      j))
        void 0 !== e[a] && (t[a] = e[a]);
      return new $(t);
    }
    constructor(e) {
      ('navigate' === e.mode && (e.mode = 'same-origin'), (this._requestData = e));
    }
    toObject() {
      let e = Object.assign({}, this._requestData);
      return (
        (e.headers = Object.assign({}, this._requestData.headers)),
        e.body && (e.body = e.body.slice(0)),
        e
      );
    }
    toRequest() {
      return new Request(this._requestData.url, this._requestData);
    }
    clone() {
      return new $(this.toObject());
    }
  }
  let H = 'serwist-background-sync',
    G = new Set(),
    Q = (e) => {
      let t = { request: new $(e.requestData).toRequest(), timestamp: e.timestamp };
      return (e.metadata && (t.metadata = e.metadata), t);
    };
  class V {
    _name;
    _onSync;
    _maxRetentionTime;
    _queueStore;
    _forceSyncFallback;
    _syncInProgress = !1;
    _requestsAddedDuringSync = !1;
    constructor(e, { forceSyncFallback: t, onSync: a, maxRetentionTime: s } = {}) {
      if (G.has(e)) throw new l('duplicate-queue-name', { name: e });
      (G.add(e),
        (this._name = e),
        (this._onSync = a || this.replayRequests),
        (this._maxRetentionTime = s || 10080),
        (this._forceSyncFallback = !!t),
        (this._queueStore = new W(this._name)),
        this._addSyncListener());
    }
    get name() {
      return this._name;
    }
    async pushRequest(e) {
      await this._addRequest(e, 'push');
    }
    async unshiftRequest(e) {
      await this._addRequest(e, 'unshift');
    }
    async popRequest() {
      return this._removeRequest('pop');
    }
    async shiftRequest() {
      return this._removeRequest('shift');
    }
    async getAll() {
      let e = await this._queueStore.getAll(),
        t = Date.now(),
        a = [];
      for (let s of e) {
        let e = 60 * this._maxRetentionTime * 1e3;
        t - s.timestamp > e ? await this._queueStore.deleteEntry(s.id) : a.push(Q(s));
      }
      return a;
    }
    async size() {
      return await this._queueStore.size();
    }
    async _addRequest({ request: e, metadata: t, timestamp: a = Date.now() }, s) {
      let r = { requestData: (await $.fromRequest(e.clone())).toObject(), timestamp: a };
      switch ((t && (r.metadata = t), s)) {
        case 'push':
          await this._queueStore.pushEntry(r);
          break;
        case 'unshift':
          await this._queueStore.unshiftEntry(r);
      }
      this._syncInProgress ? (this._requestsAddedDuringSync = !0) : await this.registerSync();
    }
    async _removeRequest(e) {
      let t,
        a = Date.now();
      switch (e) {
        case 'pop':
          t = await this._queueStore.popEntry();
          break;
        case 'shift':
          t = await this._queueStore.shiftEntry();
      }
      if (t) {
        let s = 60 * this._maxRetentionTime * 1e3;
        return a - t.timestamp > s ? this._removeRequest(e) : Q(t);
      }
    }
    async replayRequests() {
      let e;
      for (; (e = await this.shiftRequest()); )
        try {
          await fetch(e.request.clone());
        } catch {
          throw (await this.unshiftRequest(e), new l('queue-replay-failed', { name: this._name }));
        }
    }
    async registerSync() {
      if ('sync' in self.registration && !this._forceSyncFallback)
        try {
          await self.registration.sync.register(`${H}:${this._name}`);
        } catch (e) {}
    }
    _addSyncListener() {
      'sync' in self.registration && !this._forceSyncFallback
        ? self.addEventListener('sync', (e) => {
            if (e.tag === `${H}:${this._name}`) {
              let t = async () => {
                let t;
                this._syncInProgress = !0;
                try {
                  await this._onSync({ queue: this });
                } catch (e) {
                  if (e instanceof Error) throw e;
                } finally {
                  (this._requestsAddedDuringSync &&
                    !(t && !e.lastChance) &&
                    (await this.registerSync()),
                    (this._syncInProgress = !1),
                    (this._requestsAddedDuringSync = !1));
                }
              };
              e.waitUntil(t());
            }
          })
        : this._onSync({ queue: this });
    }
    static get _queueNames() {
      return G;
    }
  }
  class z {
    _queue;
    constructor(e, t) {
      this._queue = new V(e, t);
    }
    async fetchDidFail({ request: e }) {
      await this._queue.pushRequest({ request: e });
    }
  }
  let J = {
    cacheWillUpdate: async ({ response: e }) => (200 === e.status || 0 === e.status ? e : null),
  };
  function X(e) {
    return 'string' == typeof e ? new Request(e) : e;
  }
  class Y {
    event;
    request;
    url;
    params;
    _cacheKeys = {};
    _strategy;
    _handlerDeferred;
    _extendLifetimePromises;
    _plugins;
    _pluginStateMap;
    constructor(e, t) {
      for (const a of ((this.event = t.event),
      (this.request = t.request),
      t.url && ((this.url = t.url), (this.params = t.params)),
      (this._strategy = e),
      (this._handlerDeferred = new f()),
      (this._extendLifetimePromises = []),
      (this._plugins = [...e.plugins]),
      (this._pluginStateMap = new Map()),
      this._plugins))
        this._pluginStateMap.set(a, {});
      this.event.waitUntil(this._handlerDeferred.promise);
    }
    async fetch(e) {
      let { event: t } = this,
        a = X(e),
        s = await this.getPreloadResponse();
      if (s) return s;
      let r = this.hasCallback('fetchDidFail') ? a.clone() : null;
      try {
        for (let e of this.iterateCallbacks('requestWillFetch'))
          a = await e({ request: a.clone(), event: t });
      } catch (e) {
        if (e instanceof Error)
          throw new l('plugin-error-request-will-fetch', { thrownErrorMessage: e.message });
      }
      let n = a.clone();
      try {
        let e;
        for (let s of ((e = await fetch(
          a,
          'navigate' === a.mode ? void 0 : this._strategy.fetchOptions
        )),
        this.iterateCallbacks('fetchDidSucceed')))
          e = await s({ event: t, request: n, response: e });
        return e;
      } catch (e) {
        throw (
          r &&
            (await this.runCallbacks('fetchDidFail', {
              error: e,
              event: t,
              originalRequest: r.clone(),
              request: n.clone(),
            })),
          e
        );
      }
    }
    async fetchAndCachePut(e) {
      let t = await this.fetch(e),
        a = t.clone();
      return (this.waitUntil(this.cachePut(e, a)), t);
    }
    async cacheMatch(e) {
      let t,
        a = X(e),
        { cacheName: s, matchOptions: r } = this._strategy,
        n = await this.getCacheKey(a, 'read'),
        i = { ...r, cacheName: s };
      for (let e of ((t = await caches.match(n, i)),
      this.iterateCallbacks('cachedResponseWillBeUsed')))
        t =
          (await e({
            cacheName: s,
            matchOptions: r,
            cachedResponse: t,
            request: n,
            event: this.event,
          })) || void 0;
      return t;
    }
    async cachePut(e, t) {
      let a = X(e);
      await h(0);
      let s = await this.getCacheKey(a, 'write');
      if (!t)
        throw new l('cache-put-with-no-response', {
          url: new URL(String(s.url), location.href).href.replace(
            RegExp(`^${location.origin}`),
            ''
          ),
        });
      let r = await this._ensureResponseSafeToCache(t);
      if (!r) return !1;
      let { cacheName: n, matchOptions: i } = this._strategy,
        c = await self.caches.open(n),
        o = this.hasCallback('cacheDidUpdate'),
        u = o ? await m(c, s.clone(), ['__WB_REVISION__'], i) : null;
      try {
        await c.put(s, o ? r.clone() : r);
      } catch (e) {
        if (e instanceof Error) throw ('QuotaExceededError' === e.name && (await g()), e);
      }
      for (let e of this.iterateCallbacks('cacheDidUpdate'))
        await e({
          cacheName: n,
          oldResponse: u,
          newResponse: r.clone(),
          request: s,
          event: this.event,
        });
      return !0;
    }
    async getCacheKey(e, t) {
      let a = `${e.url} | ${t}`;
      if (!this._cacheKeys[a]) {
        let s = e;
        for (let e of this.iterateCallbacks('cacheKeyWillBeUsed'))
          s = X(await e({ mode: t, request: s, event: this.event, params: this.params }));
        this._cacheKeys[a] = s;
      }
      return this._cacheKeys[a];
    }
    hasCallback(e) {
      for (let t of this._strategy.plugins) if (e in t) return !0;
      return !1;
    }
    async runCallbacks(e, t) {
      for (let a of this.iterateCallbacks(e)) await a(t);
    }
    *iterateCallbacks(e) {
      for (let t of this._strategy.plugins)
        if ('function' == typeof t[e]) {
          let a = this._pluginStateMap.get(t),
            s = (s) => {
              let r = { ...s, state: a };
              return t[e](r);
            };
          yield s;
        }
    }
    waitUntil(e) {
      return (this._extendLifetimePromises.push(e), e);
    }
    async doneWaiting() {
      let e;
      for (; (e = this._extendLifetimePromises.shift()); ) await e;
    }
    destroy() {
      this._handlerDeferred.resolve(null);
    }
    async getPreloadResponse() {
      if (
        this.event instanceof FetchEvent &&
        'navigate' === this.event.request.mode &&
        'preloadResponse' in this.event
      )
        try {
          let e = await this.event.preloadResponse;
          if (e) return e;
        } catch (e) {}
    }
    async _ensureResponseSafeToCache(e) {
      let t = e,
        a = !1;
      for (let e of this.iterateCallbacks('cacheWillUpdate'))
        if (
          ((t = (await e({ request: this.request, response: t, event: this.event })) || void 0),
          (a = !0),
          !t)
        )
          break;
      return (!a && t && 200 !== t.status && (t = void 0), t);
    }
  }
  class Z {
    cacheName;
    plugins;
    fetchOptions;
    matchOptions;
    constructor(e = {}) {
      ((this.cacheName = o(e.cacheName)),
        (this.plugins = e.plugins || []),
        (this.fetchOptions = e.fetchOptions),
        (this.matchOptions = e.matchOptions));
    }
    handle(e) {
      let [t] = this.handleAll(e);
      return t;
    }
    handleAll(e) {
      e instanceof FetchEvent && (e = { event: e, request: e.request });
      let t = e.event,
        a = 'string' == typeof e.request ? new Request(e.request) : e.request,
        s = new Y(
          this,
          e.url ? { event: t, request: a, url: e.url, params: e.params } : { event: t, request: a }
        ),
        r = this._getResponse(s, a, t),
        n = this._awaitComplete(r, s, a, t);
      return [r, n];
    }
    async _getResponse(e, t, a) {
      let s;
      await e.runCallbacks('handlerWillStart', { event: a, request: t });
      try {
        if (((s = await this._handle(t, e)), void 0 === s || 'error' === s.type))
          throw new l('no-response', { url: t.url });
      } catch (r) {
        if (r instanceof Error) {
          for (let n of e.iterateCallbacks('handlerDidError'))
            if (void 0 !== (s = await n({ error: r, event: a, request: t }))) break;
        }
        if (!s) throw r;
      }
      for (let r of e.iterateCallbacks('handlerWillRespond'))
        s = await r({ event: a, request: t, response: s });
      return s;
    }
    async _awaitComplete(e, t, a, s) {
      let r, n;
      try {
        r = await e;
      } catch {}
      try {
        (await t.runCallbacks('handlerDidRespond', { event: s, request: a, response: r }),
          await t.doneWaiting());
      } catch (e) {
        e instanceof Error && (n = e);
      }
      if (
        (await t.runCallbacks('handlerDidComplete', {
          event: s,
          request: a,
          response: r,
          error: n,
        }),
        t.destroy(),
        n)
      )
        throw n;
    }
  }
  class ee extends Z {
    _networkTimeoutSeconds;
    constructor(e = {}) {
      (super(e),
        this.plugins.some((e) => 'cacheWillUpdate' in e) || this.plugins.unshift(J),
        (this._networkTimeoutSeconds = e.networkTimeoutSeconds || 0));
    }
    async _handle(e, t) {
      let a,
        s = [],
        r = [];
      if (this._networkTimeoutSeconds) {
        let { id: n, promise: i } = this._getTimeoutPromise({ request: e, logs: s, handler: t });
        ((a = n), r.push(i));
      }
      let n = this._getNetworkPromise({ timeoutId: a, request: e, logs: s, handler: t });
      r.push(n);
      let i = await t.waitUntil((async () => (await t.waitUntil(Promise.race(r))) || (await n))());
      if (!i) throw new l('no-response', { url: e.url });
      return i;
    }
    _getTimeoutPromise({ request: e, logs: t, handler: a }) {
      let s;
      return {
        promise: new Promise((t) => {
          s = setTimeout(async () => {
            t(await a.cacheMatch(e));
          }, 1e3 * this._networkTimeoutSeconds);
        }),
        id: s,
      };
    }
    async _getNetworkPromise({ timeoutId: e, request: t, logs: a, handler: s }) {
      let r, n;
      try {
        n = await s.fetchAndCachePut(t);
      } catch (e) {
        e instanceof Error && (r = e);
      }
      return (e && clearTimeout(e), (r || !n) && (n = await s.cacheMatch(t)), n);
    }
  }
  class et extends Z {
    _networkTimeoutSeconds;
    constructor(e = {}) {
      (super(e), (this._networkTimeoutSeconds = e.networkTimeoutSeconds || 0));
    }
    async _handle(e, t) {
      let a, s;
      try {
        let a = [t.fetch(e)];
        if (this._networkTimeoutSeconds) {
          let e = h(1e3 * this._networkTimeoutSeconds);
          a.push(e);
        }
        if (!(s = await Promise.race(a)))
          throw Error(
            `Timed out the network response after ${this._networkTimeoutSeconds} seconds.`
          );
      } catch (e) {
        e instanceof Error && (a = e);
      }
      if (!s) throw new l('no-response', { url: e.url, error: a });
      return s;
    }
  }
  let ea = (e) => (e && 'object' == typeof e ? e : { handle: e });
  class es {
    handler;
    match;
    method;
    catchHandler;
    constructor(e, t, a = 'GET') {
      ((this.handler = ea(t)), (this.match = e), (this.method = a));
    }
    setCatchHandler(e) {
      this.catchHandler = ea(e);
    }
  }
  class er extends Z {
    _fallbackToNetwork;
    static defaultPrecacheCacheabilityPlugin = {
      cacheWillUpdate: async ({ response: e }) => (!e || e.status >= 400 ? null : e),
    };
    static copyRedirectedCacheableResponsesPlugin = {
      cacheWillUpdate: async ({ response: e }) => (e.redirected ? await M(e) : e),
    };
    constructor(e = {}) {
      ((e.cacheName = c(e.cacheName)),
        super(e),
        (this._fallbackToNetwork = !1 !== e.fallbackToNetwork),
        this.plugins.push(er.copyRedirectedCacheableResponsesPlugin));
    }
    async _handle(e, t) {
      let a = await t.getPreloadResponse();
      if (a) return a;
      let s = await t.cacheMatch(e);
      return (
        s ||
        (t.event && 'install' === t.event.type
          ? await this._handleInstall(e, t)
          : await this._handleFetch(e, t))
      );
    }
    async _handleFetch(e, t) {
      let a,
        s = t.params || {};
      if (this._fallbackToNetwork) {
        let r = s.integrity,
          n = e.integrity,
          i = !n || n === r;
        ((a = await t.fetch(new Request(e, { integrity: 'no-cors' !== e.mode ? n || r : void 0 }))),
          r &&
            i &&
            'no-cors' !== e.mode &&
            (this._useDefaultCacheabilityPluginIfNeeded(), await t.cachePut(e, a.clone())));
      } else throw new l('missing-precache-entry', { cacheName: this.cacheName, url: e.url });
      return a;
    }
    async _handleInstall(e, t) {
      this._useDefaultCacheabilityPluginIfNeeded();
      let a = await t.fetch(e);
      if (!(await t.cachePut(e, a.clone())))
        throw new l('bad-precaching-response', { url: e.url, status: a.status });
      return a;
    }
    _useDefaultCacheabilityPluginIfNeeded() {
      let e = null,
        t = 0;
      for (let [a, s] of this.plugins.entries())
        s !== er.copyRedirectedCacheableResponsesPlugin &&
          (s === er.defaultPrecacheCacheabilityPlugin && (e = a), s.cacheWillUpdate && t++);
      0 === t
        ? this.plugins.push(er.defaultPrecacheCacheabilityPlugin)
        : t > 1 && null !== e && this.plugins.splice(e, 1);
    }
  }
  class en extends es {
    _allowlist;
    _denylist;
    constructor(e, { allowlist: t = [/./], denylist: a = [] } = {}) {
      (super((e) => this._match(e), e), (this._allowlist = t), (this._denylist = a));
    }
    _match({ url: e, request: t }) {
      if (t && 'navigate' !== t.mode) return !1;
      let a = e.pathname + e.search;
      for (let e of this._denylist) if (e.test(a)) return !1;
      return !!this._allowlist.some((e) => e.test(a));
    }
  }
  class ei extends es {
    constructor(e, t, a) {
      super(
        ({ url: t }) => {
          let a = e.exec(t.href);
          if (a) return t.origin !== location.origin && 0 !== a.index ? void 0 : a.slice(1);
        },
        t,
        a
      );
    }
  }
  let ec = (e) => {
    if (!e) throw new l('add-to-cache-list-unexpected-type', { entry: e });
    if ('string' == typeof e) {
      let t = new URL(e, location.href);
      return { cacheKey: t.href, url: t.href };
    }
    let { revision: t, url: a } = e;
    if (!a) throw new l('add-to-cache-list-unexpected-type', { entry: e });
    if (!t) {
      let e = new URL(a, location.href);
      return { cacheKey: e.href, url: e.href };
    }
    let s = new URL(a, location.href),
      r = new URL(a, location.href);
    return (s.searchParams.set('__WB_REVISION__', t), { cacheKey: s.href, url: r.href });
  };
  class eo {
    updatedURLs = [];
    notUpdatedURLs = [];
    handlerWillStart = async ({ request: e, state: t }) => {
      t && (t.originalRequest = e);
    };
    cachedResponseWillBeUsed = async ({ event: e, state: t, cachedResponse: a }) => {
      if ('install' === e.type && t?.originalRequest && t.originalRequest instanceof Request) {
        let e = t.originalRequest.url;
        a ? this.notUpdatedURLs.push(e) : this.updatedURLs.push(e);
      }
      return a;
    };
  }
  let el = async (e, t, a) => {
    let s = t.map((e, t) => ({ index: t, item: e })),
      r = async (e) => {
        let t = [];
        for (;;) {
          let r = s.pop();
          if (!r) return e(t);
          let n = await a(r.item);
          t.push({ result: n, index: r.index });
        }
      },
      n = Array.from({ length: e }, () => new Promise(r));
    return (await Promise.all(n))
      .flat()
      .sort((e, t) => (e.index < t.index ? -1 : 1))
      .map((e) => e.result);
  };
  'u' > typeof navigator && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  let eh = 'cache-entries',
    eu = (e) => {
      let t = new URL(e, location.href);
      return ((t.hash = ''), t.href);
    };
  class ed {
    _cacheName;
    _db = null;
    constructor(e) {
      this._cacheName = e;
    }
    _getId(e) {
      return `${this._cacheName}|${eu(e)}`;
    }
    _upgradeDb(e) {
      let t = e.createObjectStore(eh, { keyPath: 'id' });
      (t.createIndex('cacheName', 'cacheName', { unique: !1 }),
        t.createIndex('timestamp', 'timestamp', { unique: !1 }));
    }
    _upgradeDbAndDeleteOldDbs(e) {
      (this._upgradeDb(e),
        this._cacheName &&
          (function (e, { blocked: t } = {}) {
            let a = indexedDB.deleteDatabase(e);
            (t && a.addEventListener('blocked', (e) => t(e.oldVersion, e)),
              v(a).then(() => void 0));
          })(this._cacheName));
    }
    async setTimestamp(e, t) {
      e = eu(e);
      let a = { id: this._getId(e), cacheName: this._cacheName, url: e, timestamp: t },
        s = (await this.getDb()).transaction(eh, 'readwrite', { durability: 'relaxed' });
      (await s.store.put(a), await s.done);
    }
    async getTimestamp(e) {
      let t = await this.getDb(),
        a = await t.get(eh, this._getId(e));
      return a?.timestamp;
    }
    async expireEntries(e, t) {
      let a = await this.getDb(),
        s = await a.transaction(eh, 'readwrite').store.index('timestamp').openCursor(null, 'prev'),
        r = [],
        n = 0;
      for (; s; ) {
        let a = s.value;
        (a.cacheName === this._cacheName &&
          ((e && a.timestamp < e) || (t && n >= t) ? (s.delete(), r.push(a.url)) : n++),
          (s = await s.continue()));
      }
      return r;
    }
    async getDb() {
      return (
        this._db ||
          (this._db = await S('serwist-expiration', 1, {
            upgrade: this._upgradeDbAndDeleteOldDbs.bind(this),
          })),
        this._db
      );
    }
  }
  class em {
    _isRunning = !1;
    _rerunRequested = !1;
    _maxEntries;
    _maxAgeSeconds;
    _matchOptions;
    _cacheName;
    _timestampModel;
    constructor(e, t = {}) {
      ((this._maxEntries = t.maxEntries),
        (this._maxAgeSeconds = t.maxAgeSeconds),
        (this._matchOptions = t.matchOptions),
        (this._cacheName = e),
        (this._timestampModel = new ed(e)));
    }
    async expireEntries() {
      if (this._isRunning) {
        this._rerunRequested = !0;
        return;
      }
      this._isRunning = !0;
      let e = this._maxAgeSeconds ? Date.now() - 1e3 * this._maxAgeSeconds : 0,
        t = await this._timestampModel.expireEntries(e, this._maxEntries),
        a = await self.caches.open(this._cacheName);
      for (let e of t) await a.delete(e, this._matchOptions);
      ((this._isRunning = !1),
        this._rerunRequested && ((this._rerunRequested = !1), this.expireEntries()));
    }
    async updateTimestamp(e) {
      await this._timestampModel.setTimestamp(e, Date.now());
    }
    async isURLExpired(e) {
      if (!this._maxAgeSeconds) return !1;
      let t = await this._timestampModel.getTimestamp(e),
        a = Date.now() - 1e3 * this._maxAgeSeconds;
      return void 0 === t || t < a;
    }
    async delete() {
      ((this._rerunRequested = !1), await this._timestampModel.expireEntries(1 / 0));
    }
  }
  class ef {
    _config;
    _cacheExpirations;
    constructor(e = {}) {
      ((this._config = e),
        (this._cacheExpirations = new Map()),
        this._config.maxAgeFrom || (this._config.maxAgeFrom = 'last-fetched'),
        this._config.purgeOnQuotaError &&
          ((e) => {
            u.add(e);
          })(() => this.deleteCacheAndMetadata()));
    }
    _getCacheExpiration(e) {
      if (e === o()) throw new l('expire-custom-caches-only');
      let t = this._cacheExpirations.get(e);
      return (t || ((t = new em(e, this._config)), this._cacheExpirations.set(e, t)), t);
    }
    cachedResponseWillBeUsed({ event: e, cacheName: t, request: a, cachedResponse: s }) {
      if (!s) return null;
      let r = this._isResponseDateFresh(s),
        n = this._getCacheExpiration(t),
        i = 'last-used' === this._config.maxAgeFrom,
        c = (async () => {
          (i && (await n.updateTimestamp(a.url)), await n.expireEntries());
        })();
      try {
        e.waitUntil(c);
      } catch {}
      return r ? s : null;
    }
    _isResponseDateFresh(e) {
      if ('last-used' === this._config.maxAgeFrom) return !0;
      let t = Date.now();
      if (!this._config.maxAgeSeconds) return !0;
      let a = this._getDateHeaderTimestamp(e);
      return null === a || a >= t - 1e3 * this._config.maxAgeSeconds;
    }
    _getDateHeaderTimestamp(e) {
      if (!e.headers.has('date')) return null;
      let t = new Date(e.headers.get('date')).getTime();
      return Number.isNaN(t) ? null : t;
    }
    async cacheDidUpdate({ cacheName: e, request: t }) {
      let a = this._getCacheExpiration(e);
      (await a.updateTimestamp(t.url), await a.expireEntries());
    }
    async deleteCacheAndMetadata() {
      for (let [e, t] of this._cacheExpirations) (await self.caches.delete(e), await t.delete());
      this._cacheExpirations = new Map();
    }
  }
  let eg = 'www.google-analytics.com',
    ew = 'www.googletagmanager.com',
    ep = /^\/(\w+\/)?collect/,
    ey = ({ serwist: e, cacheName: t, ...a }) => {
      let s,
        r,
        c = t || i(n.googleAnalytics),
        o = new z('serwist-google-analytics', {
          maxRetentionTime: 2880,
          onSync: async ({ queue: e }) => {
            let t;
            for (; (t = await e.shiftRequest()); ) {
              let { request: s, timestamp: r } = t,
                n = new URL(s.url);
              try {
                let e =
                    'POST' === s.method
                      ? new URLSearchParams(await s.clone().text())
                      : n.searchParams,
                  t = r - (Number(e.get('qt')) || 0),
                  i = Date.now() - t;
                if ((e.set('qt', String(i)), a.parameterOverrides))
                  for (let t of Object.keys(a.parameterOverrides)) {
                    let s = a.parameterOverrides[t];
                    e.set(t, s);
                  }
                ('function' == typeof a.hitFilter && a.hitFilter.call(null, e),
                  await fetch(
                    new Request(n.origin + n.pathname, {
                      body: e.toString(),
                      method: 'POST',
                      mode: 'cors',
                      credentials: 'omit',
                      headers: { 'Content-Type': 'text/plain' },
                    })
                  ));
              } catch (a) {
                throw (await e.unshiftRequest(t), a);
              }
            }
          },
        });
      for (let t of [
        new es(
          ({ url: e }) => e.hostname === ew && '/gtm.js' === e.pathname,
          new ee({ cacheName: c }),
          'GET'
        ),
        new es(
          ({ url: e }) => e.hostname === eg && '/analytics.js' === e.pathname,
          new ee({ cacheName: c }),
          'GET'
        ),
        new es(
          ({ url: e }) => e.hostname === ew && '/gtag/js' === e.pathname,
          new ee({ cacheName: c }),
          'GET'
        ),
        new es(
          (s = ({ url: e }) => e.hostname === eg && ep.test(e.pathname)),
          (r = new et({ plugins: [o] })),
          'GET'
        ),
        new es(s, r, 'POST'),
      ])
        e.registerRoute(t);
    };
  class e_ {
    _fallbackUrls;
    _serwist;
    constructor({ fallbackUrls: e, serwist: t }) {
      ((this._fallbackUrls = e), (this._serwist = t));
    }
    async handlerDidError(e) {
      for (let t of this._fallbackUrls)
        if ('string' == typeof t) {
          let e = await this._serwist.matchPrecache(t);
          if (void 0 !== e) return e;
        } else if (t.matcher(e)) {
          let e = await this._serwist.matchPrecache(t.url);
          if (void 0 !== e) return e;
        }
    }
  }
  let ex = async (e, t) => {
    try {
      if (206 === t.status) return t;
      let a = e.headers.get('range');
      if (!a) throw new l('no-range-header');
      let s = ((e) => {
          let t = e.trim().toLowerCase();
          if (!t.startsWith('bytes='))
            throw new l('unit-must-be-bytes', { normalizedRangeHeader: t });
          if (t.includes(',')) throw new l('single-range-only', { normalizedRangeHeader: t });
          let a = /(\d*)-(\d*)/.exec(t);
          if (!a || !(a[1] || a[2]))
            throw new l('invalid-range-values', { normalizedRangeHeader: t });
          return {
            start: '' === a[1] ? void 0 : Number(a[1]),
            end: '' === a[2] ? void 0 : Number(a[2]),
          };
        })(a),
        r = await t.blob(),
        n = ((e, t, a) => {
          let s,
            r,
            n = e.size;
          if ((a && a > n) || (t && t < 0))
            throw new l('range-not-satisfiable', { size: n, end: a, start: t });
          return (
            void 0 !== t && void 0 !== a
              ? ((s = t), (r = a + 1))
              : void 0 !== t && void 0 === a
                ? ((s = t), (r = n))
                : void 0 !== a && void 0 === t && ((s = n - a), (r = n)),
            { start: s, end: r }
          );
        })(r, s.start, s.end),
        i = r.slice(n.start, n.end),
        c = i.size,
        o = new Response(i, { status: 206, statusText: 'Partial Content', headers: t.headers });
      return (
        o.headers.set('Content-Length', String(c)),
        o.headers.set('Content-Range', `bytes ${n.start}-${n.end - 1}/${r.size}`),
        o
      );
    } catch (e) {
      return new Response('', { status: 416, statusText: 'Range Not Satisfiable' });
    }
  };
  class eb {
    cachedResponseWillBeUsed = async ({ request: e, cachedResponse: t }) =>
      t && e.headers.has('range') ? await ex(e, t) : t;
  }
  class eE extends Z {
    async _handle(e, t) {
      let a,
        s = await t.cacheMatch(e);
      if (!s)
        try {
          s = await t.fetchAndCachePut(e);
        } catch (e) {
          e instanceof Error && (a = e);
        }
      if (!s) throw new l('no-response', { url: e.url, error: a });
      return s;
    }
  }
  class eR extends Z {
    constructor(e = {}) {
      (super(e), this.plugins.some((e) => 'cacheWillUpdate' in e) || this.plugins.unshift(J));
    }
    async _handle(e, t) {
      let a,
        s = t.fetchAndCachePut(e).catch(() => {});
      t.waitUntil(s);
      let r = await t.cacheMatch(e);
      if (r);
      else
        try {
          r = await s;
        } catch (e) {
          e instanceof Error && (a = e);
        }
      if (!r) throw new l('no-response', { url: e.url, error: a });
      return r;
    }
  }
  class ev extends es {
    constructor(e, t) {
      super(({ request: a }) => {
        let s = e.getUrlsToPrecacheKeys();
        for (let r of (function* (
          e,
          {
            directoryIndex: t = 'index.html',
            ignoreURLParametersMatching: a = [/^utm_/, /^fbclid$/],
            cleanURLs: s = !0,
            urlManipulation: r,
          } = {}
        ) {
          let n = new URL(e, location.href);
          ((n.hash = ''), yield n.href);
          let i = ((e, t = []) => {
            for (let a of [...e.searchParams.keys()])
              t.some((e) => e.test(a)) && e.searchParams.delete(a);
            return e;
          })(n, a);
          if ((yield i.href, t && i.pathname.endsWith('/'))) {
            let e = new URL(i.href);
            ((e.pathname += t), yield e.href);
          }
          if (s) {
            let e = new URL(i.href);
            ((e.pathname += '.html'), yield e.href);
          }
          if (r) for (let e of r({ url: n })) yield e.href;
        })(a.url, t)) {
          let t = s.get(r);
          if (t) {
            let a = e.getIntegrityForPrecacheKey(t);
            return { cacheKey: t, integrity: a };
          }
        }
      }, e.precacheStrategy);
    }
  }
  class eq {
    _precacheController;
    constructor({ precacheController: e }) {
      this._precacheController = e;
    }
    cacheKeyWillBeUsed = async ({ request: e, params: t }) => {
      let a = t?.cacheKey || this._precacheController.getPrecacheKeyForUrl(e.url);
      return a ? new Request(a, { headers: e.headers }) : e;
    };
  }
  class eS {
    _urlsToCacheKeys = new Map();
    _urlsToCacheModes = new Map();
    _cacheKeysToIntegrities = new Map();
    _concurrentPrecaching;
    _precacheStrategy;
    _routes;
    _defaultHandlerMap;
    _catchHandler;
    _requestRules;
    constructor({
      precacheEntries: e,
      precacheOptions: t,
      skipWaiting: a = !1,
      importScripts: s,
      navigationPreload: r = !1,
      cacheId: i,
      clientsClaim: o = !1,
      runtimeCaching: l,
      offlineAnalyticsConfig: h,
      disableDevLogs: u = !1,
      fallbacks: d,
      requestRules: m,
    } = {}) {
      const {
        precacheStrategyOptions: f,
        precacheRouteOptions: g,
        precacheMiscOptions: w,
      } = ((e, t = {}) => {
        let {
          cacheName: a,
          plugins: s = [],
          fetchOptions: r,
          matchOptions: n,
          fallbackToNetwork: i,
          directoryIndex: o,
          ignoreURLParametersMatching: l,
          cleanURLs: h,
          urlManipulation: u,
          cleanupOutdatedCaches: d,
          concurrency: m = 10,
          navigateFallback: f,
          navigateFallbackAllowlist: g,
          navigateFallbackDenylist: w,
        } = t ?? {};
        return {
          precacheStrategyOptions: {
            cacheName: c(a),
            plugins: [...s, new eq({ precacheController: e })],
            fetchOptions: r,
            matchOptions: n,
            fallbackToNetwork: i,
          },
          precacheRouteOptions: {
            directoryIndex: o,
            ignoreURLParametersMatching: l,
            cleanURLs: h,
            urlManipulation: u,
          },
          precacheMiscOptions: {
            cleanupOutdatedCaches: d,
            concurrency: m,
            navigateFallback: f,
            navigateFallbackAllowlist: g,
            navigateFallbackDenylist: w,
          },
        };
      })(this, t);
      if (
        ((this._concurrentPrecaching = w.concurrency),
        (this._precacheStrategy = new er(f)),
        (this._routes = new Map()),
        (this._defaultHandlerMap = new Map()),
        (this._requestRules = m),
        (this.handleInstall = this.handleInstall.bind(this)),
        (this.handleActivate = this.handleActivate.bind(this)),
        (this.handleFetch = this.handleFetch.bind(this)),
        (this.handleCache = this.handleCache.bind(this)),
        s && s.length > 0 && self.importScripts(...s),
        r &&
          self.registration?.navigationPreload &&
          self.addEventListener('activate', (e) => {
            e.waitUntil(self.registration.navigationPreload.enable().then(() => {}));
          }),
        void 0 !== i &&
          ((e) => {
            var t = e;
            for (let e of Object.keys(n))
              ((e) => {
                let a = t[e];
                'string' == typeof a && (n[e] = a);
              })(e);
          })({ prefix: i }),
        a
          ? self.skipWaiting()
          : self.addEventListener('message', (e) => {
              e.data && 'SKIP_WAITING' === e.data.type && self.skipWaiting();
            }),
        o && self.addEventListener('activate', () => self.clients.claim()),
        e && e.length > 0 && this.addToPrecacheList(e),
        w.cleanupOutdatedCaches &&
          ((e) => {
            self.addEventListener('activate', (t) => {
              t.waitUntil(p(c(e)).then((e) => {}));
            });
          })(f.cacheName),
        this.registerRoute(new ev(this, g)),
        w.navigateFallback &&
          this.registerRoute(
            new en(this.createHandlerBoundToUrl(w.navigateFallback), {
              allowlist: w.navigateFallbackAllowlist,
              denylist: w.navigateFallbackDenylist,
            })
          ),
        void 0 !== h &&
          ('boolean' == typeof h ? h && ey({ serwist: this }) : ey({ ...h, serwist: this })),
        void 0 !== l)
      ) {
        if (void 0 !== d) {
          const e = new e_({ fallbackUrls: d.entries, serwist: this });
          l.forEach((t) => {
            t.handler instanceof Z &&
              !t.handler.plugins.some((e) => 'handlerDidError' in e) &&
              t.handler.plugins.push(e);
          });
        }
        for (const e of l) this.registerCapture(e.matcher, e.handler, e.method);
      }
      u && (self.__WB_DISABLE_DEV_LOGS = !0);
    }
    get precacheStrategy() {
      return this._precacheStrategy;
    }
    get routes() {
      return this._routes;
    }
    addEventListeners() {
      (self.addEventListener('install', this.handleInstall),
        self.addEventListener('activate', this.handleActivate),
        self.addEventListener('fetch', this.handleFetch),
        self.addEventListener('message', this.handleCache));
    }
    addToPrecacheList(e) {
      let t = [];
      for (let a of e) {
        'string' == typeof a
          ? t.push(a)
          : a && !a.integrity && void 0 === a.revision && t.push(a.url);
        let { cacheKey: e, url: s } = ec(a),
          r = 'string' != typeof a && a.revision ? 'reload' : 'default';
        if (this._urlsToCacheKeys.has(s) && this._urlsToCacheKeys.get(s) !== e)
          throw new l('add-to-cache-list-conflicting-entries', {
            firstEntry: this._urlsToCacheKeys.get(s),
            secondEntry: e,
          });
        if ('string' != typeof a && a.integrity) {
          if (
            this._cacheKeysToIntegrities.has(e) &&
            this._cacheKeysToIntegrities.get(e) !== a.integrity
          )
            throw new l('add-to-cache-list-conflicting-integrities', { url: s });
          this._cacheKeysToIntegrities.set(e, a.integrity);
        }
        (this._urlsToCacheKeys.set(s, e), this._urlsToCacheModes.set(s, r));
      }
      t.length > 0 &&
        console.warn(`Serwist is precaching URLs without revision info: ${t.join(', ')}
This is generally NOT safe. Learn more at https://bit.ly/wb-precache`);
    }
    handleInstall(e) {
      return (
        this.registerRequestRules(e),
        y(e, async () => {
          let t = new eo();
          (this.precacheStrategy.plugins.push(t),
            await el(
              this._concurrentPrecaching,
              Array.from(this._urlsToCacheKeys.entries()),
              async ([t, a]) => {
                let s = this._cacheKeysToIntegrities.get(a),
                  r = this._urlsToCacheModes.get(t),
                  n = new Request(t, { integrity: s, cache: r, credentials: 'same-origin' });
                await Promise.all(
                  this.precacheStrategy.handleAll({
                    event: e,
                    request: n,
                    url: new URL(n.url),
                    params: { cacheKey: a },
                  })
                );
              }
            ));
          let { updatedURLs: a, notUpdatedURLs: s } = t;
          return { updatedURLs: a, notUpdatedURLs: s };
        })
      );
    }
    async registerRequestRules(e) {
      if (this._requestRules && e?.addRoutes)
        try {
          (await e.addRoutes(this._requestRules), (this._requestRules = void 0));
        } catch (e) {
          throw e;
        }
    }
    handleActivate(e) {
      return y(e, async () => {
        let e = await self.caches.open(this.precacheStrategy.cacheName),
          t = await e.keys(),
          a = new Set(this._urlsToCacheKeys.values()),
          s = [];
        for (let r of t) a.has(r.url) || (await e.delete(r), s.push(r.url));
        return { deletedCacheRequests: s };
      });
    }
    handleFetch(e) {
      let { request: t } = e,
        a = this.handleRequest({ request: t, event: e });
      a && e.respondWith(a);
    }
    handleCache(e) {
      if (e.data && 'CACHE_URLS' === e.data.type) {
        let { payload: t } = e.data,
          a = Promise.all(
            t.urlsToCache.map((t) => {
              let a;
              return (
                (a = 'string' == typeof t ? new Request(t) : new Request(...t)),
                this.handleRequest({ request: a, event: e })
              );
            })
          );
        (e.waitUntil(a), e.ports?.[0] && a.then(() => e.ports[0].postMessage(!0)));
      }
    }
    setDefaultHandler(e, t = 'GET') {
      this._defaultHandlerMap.set(t, ea(e));
    }
    setCatchHandler(e) {
      this._catchHandler = ea(e);
    }
    registerCapture(e, t, a) {
      let s = ((e, t, a) => {
        if ('string' == typeof e) {
          let s = new URL(e, location.href);
          return new es(({ url: e }) => e.href === s.href, t, a);
        }
        if (e instanceof RegExp) return new ei(e, t, a);
        if ('function' == typeof e) return new es(e, t, a);
        if (e instanceof es) return e;
        throw new l('unsupported-route-type', {
          moduleName: 'serwist',
          funcName: 'parseRoute',
          paramName: 'capture',
        });
      })(e, t, a);
      return (this.registerRoute(s), s);
    }
    registerRoute(e) {
      (this._routes.has(e.method) || this._routes.set(e.method, []),
        this._routes.get(e.method).push(e));
    }
    unregisterRoute(e) {
      if (!this._routes.has(e.method))
        throw new l('unregister-route-but-not-found-with-method', { method: e.method });
      let t = this._routes.get(e.method).indexOf(e);
      if (t > -1) this._routes.get(e.method).splice(t, 1);
      else throw new l('unregister-route-route-not-registered');
    }
    getUrlsToPrecacheKeys() {
      return this._urlsToCacheKeys;
    }
    getPrecachedUrls() {
      return [...this._urlsToCacheKeys.keys()];
    }
    getPrecacheKeyForUrl(e) {
      let t = new URL(e, location.href);
      return this._urlsToCacheKeys.get(t.href);
    }
    getIntegrityForPrecacheKey(e) {
      return this._cacheKeysToIntegrities.get(e);
    }
    async matchPrecache(e) {
      let t = e instanceof Request ? e.url : e,
        a = this.getPrecacheKeyForUrl(t);
      if (a) return (await self.caches.open(this.precacheStrategy.cacheName)).match(a);
    }
    createHandlerBoundToUrl(e) {
      let t = this.getPrecacheKeyForUrl(e);
      if (!t) throw new l('non-precached-url', { url: e });
      return (a) => (
        (a.request = new Request(e)),
        (a.params = { cacheKey: t, ...a.params }),
        this.precacheStrategy.handle(a)
      );
    }
    handleRequest({ request: e, event: t }) {
      let a,
        s = new URL(e.url, location.href);
      if (!s.protocol.startsWith('http')) return;
      let r = s.origin === location.origin,
        { params: n, route: i } = this.findMatchingRoute({
          event: t,
          request: e,
          sameOrigin: r,
          url: s,
        }),
        c = i?.handler,
        o = e.method;
      if ((!c && this._defaultHandlerMap.has(o) && (c = this._defaultHandlerMap.get(o)), !c))
        return;
      try {
        a = c.handle({ url: s, request: e, event: t, params: n });
      } catch (e) {
        a = Promise.reject(e);
      }
      let l = i?.catchHandler;
      return (
        a instanceof Promise &&
          (this._catchHandler || l) &&
          (a = a.catch(async (a) => {
            if (l)
              try {
                return await l.handle({ url: s, request: e, event: t, params: n });
              } catch (e) {
                e instanceof Error && (a = e);
              }
            if (this._catchHandler)
              return this._catchHandler.handle({ url: s, request: e, event: t });
            throw a;
          })),
        a
      );
    }
    findMatchingRoute({ url: e, sameOrigin: t, request: a, event: s }) {
      for (let r of this._routes.get(a.method) || []) {
        let n,
          i = r.match({ url: e, sameOrigin: t, request: a, event: s });
        if (i)
          return (
            (Array.isArray((n = i)) && 0 === n.length) ||
            (i.constructor === Object && 0 === Object.keys(i).length)
              ? (n = void 0)
              : 'boolean' == typeof i && (n = void 0),
            { route: r, params: n }
          );
      }
      return {};
    }
  }
  let eD = [
      {
        matcher: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
        handler: new eE({
          cacheName: 'google-fonts-webfonts',
          plugins: [new ef({ maxEntries: 4, maxAgeSeconds: 31536e3, maxAgeFrom: 'last-used' })],
        }),
      },
      {
        matcher: /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
        handler: new eR({
          cacheName: 'google-fonts-stylesheets',
          plugins: [new ef({ maxEntries: 4, maxAgeSeconds: 604800, maxAgeFrom: 'last-used' })],
        }),
      },
      {
        matcher: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
        handler: new eR({
          cacheName: 'static-font-assets',
          plugins: [new ef({ maxEntries: 4, maxAgeSeconds: 604800, maxAgeFrom: 'last-used' })],
        }),
      },
      {
        matcher: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
        handler: new eR({
          cacheName: 'static-image-assets',
          plugins: [new ef({ maxEntries: 64, maxAgeSeconds: 2592e3, maxAgeFrom: 'last-used' })],
        }),
      },
      {
        matcher: /\/_next\/static.+\.js$/i,
        handler: new eE({
          cacheName: 'next-static-js-assets',
          plugins: [new ef({ maxEntries: 64, maxAgeSeconds: 86400, maxAgeFrom: 'last-used' })],
        }),
      },
      {
        matcher: /\/_next\/image\?url=.+$/i,
        handler: new eR({
          cacheName: 'next-image',
          plugins: [new ef({ maxEntries: 64, maxAgeSeconds: 86400, maxAgeFrom: 'last-used' })],
        }),
      },
      {
        matcher: /\.(?:mp3|wav|ogg)$/i,
        handler: new eE({
          cacheName: 'static-audio-assets',
          plugins: [
            new ef({ maxEntries: 32, maxAgeSeconds: 86400, maxAgeFrom: 'last-used' }),
            new eb(),
          ],
        }),
      },
      {
        matcher: /\.(?:mp4|webm)$/i,
        handler: new eE({
          cacheName: 'static-video-assets',
          plugins: [
            new ef({ maxEntries: 32, maxAgeSeconds: 86400, maxAgeFrom: 'last-used' }),
            new eb(),
          ],
        }),
      },
      {
        matcher: /\.(?:js)$/i,
        handler: new eR({
          cacheName: 'static-js-assets',
          plugins: [new ef({ maxEntries: 48, maxAgeSeconds: 86400, maxAgeFrom: 'last-used' })],
        }),
      },
      {
        matcher: /\.(?:css|less)$/i,
        handler: new eR({
          cacheName: 'static-style-assets',
          plugins: [new ef({ maxEntries: 32, maxAgeSeconds: 86400, maxAgeFrom: 'last-used' })],
        }),
      },
      {
        matcher: /\/_next\/data\/.+\/.+\.json$/i,
        handler: new ee({
          cacheName: 'next-data',
          plugins: [new ef({ maxEntries: 32, maxAgeSeconds: 86400, maxAgeFrom: 'last-used' })],
        }),
      },
      {
        matcher: /\.(?:json|xml|csv)$/i,
        handler: new ee({
          cacheName: 'static-data-assets',
          plugins: [new ef({ maxEntries: 32, maxAgeSeconds: 86400, maxAgeFrom: 'last-used' })],
        }),
      },
      { matcher: /\/api\/auth\/.*/, handler: new et({ networkTimeoutSeconds: 10 }) },
      {
        matcher: ({ sameOrigin: e, url: { pathname: t } }) => e && t.startsWith('/api/'),
        method: 'GET',
        handler: new ee({
          cacheName: 'apis',
          plugins: [new ef({ maxEntries: 16, maxAgeSeconds: 86400, maxAgeFrom: 'last-used' })],
          networkTimeoutSeconds: 10,
        }),
      },
      {
        matcher: ({ request: e, url: { pathname: t }, sameOrigin: a }) =>
          '1' === e.headers.get('RSC') &&
          '1' === e.headers.get('Next-Router-Prefetch') &&
          a &&
          !t.startsWith('/api/'),
        handler: new ee({
          cacheName: 'pages-rsc-prefetch',
          plugins: [new ef({ maxEntries: 32, maxAgeSeconds: 86400 })],
        }),
      },
      {
        matcher: ({ request: e, url: { pathname: t }, sameOrigin: a }) =>
          '1' === e.headers.get('RSC') && a && !t.startsWith('/api/'),
        handler: new ee({
          cacheName: 'pages-rsc',
          plugins: [new ef({ maxEntries: 32, maxAgeSeconds: 86400 })],
        }),
      },
      {
        matcher: ({ request: e, url: { pathname: t }, sameOrigin: a }) =>
          e.headers.get('Content-Type')?.includes('text/html') && a && !t.startsWith('/api/'),
        handler: new ee({
          cacheName: 'pages',
          plugins: [new ef({ maxEntries: 32, maxAgeSeconds: 86400 })],
        }),
      },
      {
        matcher: ({ url: { pathname: e }, sameOrigin: t }) => t && !e.startsWith('/api/'),
        handler: new ee({
          cacheName: 'others',
          plugins: [new ef({ maxEntries: 32, maxAgeSeconds: 86400 })],
        }),
      },
      {
        matcher: ({ sameOrigin: e }) => !e,
        handler: new ee({
          cacheName: 'cross-origin',
          plugins: [new ef({ maxEntries: 32, maxAgeSeconds: 3600 })],
          networkTimeoutSeconds: 10,
        }),
      },
      { matcher: /.*/i, method: 'GET', handler: new et() },
    ],
    eN = { matcher: ({ url: e }) => e.pathname.startsWith('/api/'), handler: new et() };
  new eS({
    precacheEntries: [
      {
        revision: '586148b661c36e625fb4dcfbc6bf64bc',
        url: '/_next/static/Tq17fr0naObAGiV7OJR2L/_buildManifest.js',
      },
      {
        revision: 'b6652df95db52feb4daf4eca35380933',
        url: '/_next/static/Tq17fr0naObAGiV7OJR2L/_ssgManifest.js',
      },
      { revision: null, url: '/_next/static/chunks/1049-933379f08aa6573a.js' },
      { revision: null, url: '/_next/static/chunks/1116.42926ab7b2cafce3.js' },
      { revision: null, url: '/_next/static/chunks/1133-e617cfd83574b83f.js' },
      { revision: null, url: '/_next/static/chunks/1171-0cee3acc1acd80d5.js' },
      { revision: null, url: '/_next/static/chunks/1240-46f94e6148e4a243.js' },
      { revision: null, url: '/_next/static/chunks/1380-c61d6e9850247eac.js' },
      { revision: null, url: '/_next/static/chunks/1398-90b5ee3e0fa56edc.js' },
      { revision: null, url: '/_next/static/chunks/1422-2778922e122556a0.js' },
      { revision: null, url: '/_next/static/chunks/1438.157fa2bfa1dfa085.js' },
      { revision: null, url: '/_next/static/chunks/1475-bcfeddccfedffa7d.js' },
      { revision: null, url: '/_next/static/chunks/1478-5bfc7147487feeb2.js' },
      { revision: null, url: '/_next/static/chunks/1503.5906fb6cf2462f7f.js' },
      { revision: null, url: '/_next/static/chunks/1561-8d395206716b3967.js' },
      { revision: null, url: '/_next/static/chunks/1646-ac7b6e55668c65df.js' },
      { revision: null, url: '/_next/static/chunks/1694-761662c9c0e1fb71.js' },
      { revision: null, url: '/_next/static/chunks/1703-cf69db580fd1fcf6.js' },
      { revision: null, url: '/_next/static/chunks/1800-af9ac07eccadc361.js' },
      { revision: null, url: '/_next/static/chunks/1802.483663d78b2d48e0.js' },
      { revision: null, url: '/_next/static/chunks/1834-2c232c0956fae0c9.js' },
      { revision: null, url: '/_next/static/chunks/1852.c54af012f92d6ccc.js' },
      { revision: null, url: '/_next/static/chunks/1901.a745ad5585f2b3aa.js' },
      { revision: null, url: '/_next/static/chunks/2006-d0ea433eccdab9ab.js' },
      { revision: null, url: '/_next/static/chunks/2084-d92537b77d30ee17.js' },
      { revision: null, url: '/_next/static/chunks/216-4bd80a148bdf4798.js' },
      { revision: null, url: '/_next/static/chunks/2175-ce85e90e18dfc1ef.js' },
      { revision: null, url: '/_next/static/chunks/2235.44f2985c39837dcf.js' },
      { revision: null, url: '/_next/static/chunks/2364-c0f36cc053663b6e.js' },
      { revision: null, url: '/_next/static/chunks/2584-f0387a060bd11325.js' },
      { revision: null, url: '/_next/static/chunks/2696.12c03583ab4a2d3a.js' },
      { revision: null, url: '/_next/static/chunks/273-24c7603c7e794bd3.js' },
      { revision: null, url: '/_next/static/chunks/2750-9520e7f2a07bbe09.js' },
      { revision: null, url: '/_next/static/chunks/2766-4aa4a817a259f707.js' },
      { revision: null, url: '/_next/static/chunks/2787.13f0b3a1c4416c1e.js' },
      { revision: null, url: '/_next/static/chunks/2796-68fcdd85d45c4476.js' },
      { revision: null, url: '/_next/static/chunks/2798.e15aa95d5b6241cf.js' },
      { revision: null, url: '/_next/static/chunks/2803-d741ec70edbf8b23.js' },
      { revision: null, url: '/_next/static/chunks/2855.929cfe631e04010d.js' },
      { revision: null, url: '/_next/static/chunks/3052-bfe44508140c7736.js' },
      { revision: null, url: '/_next/static/chunks/3191-9cf858c755de0392.js' },
      { revision: null, url: '/_next/static/chunks/3348-58f4bc69c1d6c0c2.js' },
      { revision: null, url: '/_next/static/chunks/3387.7bc3a69e141ab2e2.js' },
      { revision: null, url: '/_next/static/chunks/3403.0c62cc632fb9de59.js' },
      { revision: null, url: '/_next/static/chunks/3422-30788f564d5d9f66.js' },
      { revision: null, url: '/_next/static/chunks/353.abec7b87d7a0d2ec.js' },
      { revision: null, url: '/_next/static/chunks/3552-91b39009ced38339.js' },
      { revision: null, url: '/_next/static/chunks/3699.6a60c1949f18a3eb.js' },
      { revision: null, url: '/_next/static/chunks/3710-91baf8b86e150de4.js' },
      { revision: null, url: '/_next/static/chunks/3901.d40c8f39c7e39a50.js' },
      { revision: null, url: '/_next/static/chunks/3943.ebeda1574a131502.js' },
      { revision: null, url: '/_next/static/chunks/4096-2f91433be4548298.js' },
      { revision: null, url: '/_next/static/chunks/4126-9281d612afc155ea.js' },
      { revision: null, url: '/_next/static/chunks/4183-06d8ddc0f300a525.js' },
      { revision: null, url: '/_next/static/chunks/4189-13281c68a284aa68.js' },
      { revision: null, url: '/_next/static/chunks/4231-5ea40ac40f5146e5.js' },
      { revision: null, url: '/_next/static/chunks/4250-58c124813837f326.js' },
      { revision: null, url: '/_next/static/chunks/425a1fef.f24b3df0f604b1b9.js' },
      { revision: null, url: '/_next/static/chunks/4412-3f1ac736152ac570.js' },
      { revision: null, url: '/_next/static/chunks/4490-42dc62725587b4dd.js' },
      { revision: null, url: '/_next/static/chunks/462.e526f432a0fd8ef3.js' },
      { revision: null, url: '/_next/static/chunks/4672.38c3c4ec765bc58f.js' },
      { revision: null, url: '/_next/static/chunks/4707-fce4a336a3c56054.js' },
      { revision: null, url: '/_next/static/chunks/4711.fb9504b2e6b8d716.js' },
      { revision: null, url: '/_next/static/chunks/4784-764976d2021bc1c3.js' },
      { revision: null, url: '/_next/static/chunks/479.b0cbdbed3eea0f15.js' },
      { revision: null, url: '/_next/static/chunks/4808-56ce7e422adf7589.js' },
      { revision: null, url: '/_next/static/chunks/4827-c5070ae2838f31e6.js' },
      { revision: null, url: '/_next/static/chunks/4917.33ab234b560b395e.js' },
      { revision: null, url: '/_next/static/chunks/4973-2094314716853b46.js' },
      { revision: null, url: '/_next/static/chunks/4982-34fefa534e4d0886.js' },
      { revision: null, url: '/_next/static/chunks/4987-62ee3d6bc6ccc4b6.js' },
      { revision: null, url: '/_next/static/chunks/4ff7191e.d68cdd8504937de5.js' },
      { revision: null, url: '/_next/static/chunks/5012-de8c46ad500032ee.js' },
      { revision: null, url: '/_next/static/chunks/504-b008f8aabeccb588.js' },
      { revision: null, url: '/_next/static/chunks/5054-5248b7af8b252abb.js' },
      { revision: null, url: '/_next/static/chunks/5086-6c30c017a73c634d.js' },
      { revision: null, url: '/_next/static/chunks/50f238d9.0f3d35bee963f64a.js' },
      { revision: null, url: '/_next/static/chunks/5209.16a7df8e46e9a808.js' },
      { revision: null, url: '/_next/static/chunks/5215-1a8fbadd1ac19461.js' },
      { revision: null, url: '/_next/static/chunks/5421.342397de171c021c.js' },
      { revision: null, url: '/_next/static/chunks/5451-dc180eaac65d17c5.js' },
      { revision: null, url: '/_next/static/chunks/5570-3a40a4af25f78cf0.js' },
      { revision: null, url: '/_next/static/chunks/5587-0563b87102797d1d.js' },
      { revision: null, url: '/_next/static/chunks/5628-1e4b354309eb72e7.js' },
      { revision: null, url: '/_next/static/chunks/5669-fa6d84651f6cbf38.js' },
      { revision: null, url: '/_next/static/chunks/568-7f08adda6a57fc64.js' },
      { revision: null, url: '/_next/static/chunks/5710-d668edb8f6689f0e.js' },
      { revision: null, url: '/_next/static/chunks/5766-8b529106a800704f.js' },
      { revision: null, url: '/_next/static/chunks/5772-1c244331d11a181c.js' },
      { revision: null, url: '/_next/static/chunks/5782-009728a3f174a509.js' },
      { revision: null, url: '/_next/static/chunks/5820-0a4fe0e562bcd096.js' },
      { revision: null, url: '/_next/static/chunks/5878-e6ad6a057dc5dcad.js' },
      { revision: null, url: '/_next/static/chunks/5895.ab1e1d5ab8608a34.js' },
      { revision: null, url: '/_next/static/chunks/5951-a5bb57b786dbb6d8.js' },
      { revision: null, url: '/_next/static/chunks/596-9fcc7e0652b83104.js' },
      { revision: null, url: '/_next/static/chunks/6.c194955259b80d3b.js' },
      { revision: null, url: '/_next/static/chunks/6056-5159125dd9f7d8a8.js' },
      { revision: null, url: '/_next/static/chunks/6070-89afb628abbabd47.js' },
      { revision: null, url: '/_next/static/chunks/6080.0b793f8332c26303.js' },
      { revision: null, url: '/_next/static/chunks/6132.e09e092584d9030d.js' },
      { revision: null, url: '/_next/static/chunks/6137.6d4bb8ab506793c4.js' },
      { revision: null, url: '/_next/static/chunks/6155.0cb9d626e881f713.js' },
      { revision: null, url: '/_next/static/chunks/6163-8861c868bdaaaba9.js' },
      { revision: null, url: '/_next/static/chunks/6216.1a033ee493535930.js' },
      { revision: null, url: '/_next/static/chunks/6355-7a8ebc75d707de90.js' },
      { revision: null, url: '/_next/static/chunks/660-d078c1d50ea3af7c.js' },
      { revision: null, url: '/_next/static/chunks/7031-09a472a2314739ed.js' },
      { revision: null, url: '/_next/static/chunks/7040.cf3ad3d47a8e5157.js' },
      { revision: null, url: '/_next/static/chunks/7067.2982cb7920196d48.js' },
      { revision: null, url: '/_next/static/chunks/7068-fb7367a28141fd29.js' },
      { revision: null, url: '/_next/static/chunks/719-29e6b8afbc7910e2.js' },
      { revision: null, url: '/_next/static/chunks/7213-a48469096790e325.js' },
      { revision: null, url: '/_next/static/chunks/7383-dabe5823d76cb9e8.js' },
      { revision: null, url: '/_next/static/chunks/7412-ec86d9da40738512.js' },
      { revision: null, url: '/_next/static/chunks/7488-85b1e705f140a13e.js' },
      { revision: null, url: '/_next/static/chunks/7537-5e40096df61c2e81.js' },
      { revision: null, url: '/_next/static/chunks/781-ad83fda3a7466c53.js' },
      { revision: null, url: '/_next/static/chunks/7860-b1fac6364c691de4.js' },
      { revision: null, url: '/_next/static/chunks/7914-129fcf18d0db5609.js' },
      { revision: null, url: '/_next/static/chunks/7993-e376dee09d1f2fa7.js' },
      { revision: null, url: '/_next/static/chunks/7c09d4dc.639114c15b1d138a.js' },
      { revision: null, url: '/_next/static/chunks/8190-cab5ebff7e4e4066.js' },
      { revision: null, url: '/_next/static/chunks/8219-fcf092cc246e5541.js' },
      { revision: null, url: '/_next/static/chunks/831.0da118dc0ec87b85.js' },
      { revision: null, url: '/_next/static/chunks/8329.2b2615f0f774c290.js' },
      { revision: null, url: '/_next/static/chunks/8363.93fc4c2a2121104d.js' },
      { revision: null, url: '/_next/static/chunks/8412-f2ee5d3b41e0dc21.js' },
      { revision: null, url: '/_next/static/chunks/8459.698858d07d2466de.js' },
      { revision: null, url: '/_next/static/chunks/8528.066e7eec3e103994.js' },
      { revision: null, url: '/_next/static/chunks/8650-7739ab407f4d41bf.js' },
      { revision: null, url: '/_next/static/chunks/8678.fa76a53e9e7337cf.js' },
      { revision: null, url: '/_next/static/chunks/8739-9c8e86b4ef19ac11.js' },
      { revision: null, url: '/_next/static/chunks/8744-3ed8aba5461df4dc.js' },
      { revision: null, url: '/_next/static/chunks/87c73c54-e11922cda838f8cc.js' },
      { revision: null, url: '/_next/static/chunks/8808-455c5201c18570ea.js' },
      { revision: null, url: '/_next/static/chunks/8845-6395e8a3e70eec8f.js' },
      { revision: null, url: '/_next/static/chunks/8912.164e32d78f351d0d.js' },
      { revision: null, url: '/_next/static/chunks/8920-e67afb7a254db167.js' },
      { revision: null, url: '/_next/static/chunks/8927.c746ce950de818b3.js' },
      { revision: null, url: '/_next/static/chunks/8932-7994267349a226cc.js' },
      { revision: null, url: '/_next/static/chunks/8962.09d06794e0175f35.js' },
      { revision: null, url: '/_next/static/chunks/8982.82db3486742a05d3.js' },
      { revision: null, url: '/_next/static/chunks/8988-203b0e1866f6e99f.js' },
      { revision: null, url: '/_next/static/chunks/89ddd23d.6e33b623cf49f13f.js' },
      { revision: null, url: '/_next/static/chunks/9004.ee4198f1e3d84979.js' },
      { revision: null, url: '/_next/static/chunks/9099.47c38921d6541f21.js' },
      { revision: null, url: '/_next/static/chunks/910-7baea97d0f651a27.js' },
      { revision: null, url: '/_next/static/chunks/9143-af7906f8faa625f0.js' },
      { revision: null, url: '/_next/static/chunks/9155.46cd0de11733d785.js' },
      { revision: null, url: '/_next/static/chunks/9181-ffa8a35e3fa97d2b.js' },
      { revision: null, url: '/_next/static/chunks/9215-81355b187393bff3.js' },
      { revision: null, url: '/_next/static/chunks/9466-2dbe8af0308cf743.js' },
      { revision: null, url: '/_next/static/chunks/9700.c47024f592537718.js' },
      { revision: null, url: '/_next/static/chunks/9713-792f159e720a6baa.js' },
      { revision: null, url: '/_next/static/chunks/9770.d1594803ef0d5a0d.js' },
      { revision: null, url: '/_next/static/chunks/990a3170.eba902f222671b2f.js' },
      { revision: null, url: '/_next/static/chunks/9925-3fb5214b32cef6d5.js' },
      { revision: null, url: '/_next/static/chunks/9959.012c4fc5a215d274.js' },
      { revision: null, url: '/_next/static/chunks/9998-66ce04a512368af3.js' },
      { revision: null, url: '/_next/static/chunks/app/(auth)/error-09146177cd47d9db.js' },
      { revision: null, url: '/_next/static/chunks/app/(auth)/error/page-e075ea00844e6424.js' },
      { revision: null, url: '/_next/static/chunks/app/(auth)/layout-31ad927f52802008.js' },
      { revision: null, url: '/_next/static/chunks/app/(auth)/loading-6da09f5ba9dc9540.js' },
      { revision: null, url: '/_next/static/chunks/app/(auth)/login/page-0805d8d3e8b13790.js' },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/admin/approvals/error-b0042d04add35b7f.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/admin/approvals/layout-31ad927f52802008.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/admin/approvals/loading-6da09f5ba9dc9540.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/admin/approvals/page-312db702fa7e03f3.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/admin/audit-logs/error-8728251b467a6d12.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/admin/audit-logs/loading-6da09f5ba9dc9540.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/admin/audit-logs/page-eabc29d27975893d.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/admin/calibration-approvals/page-31ad927f52802008.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/admin/calibration-factor-approvals/page-31ad927f52802008.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/admin/calibration-plan-approvals/page-31ad927f52802008.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/admin/data-migration/page-8df1cee063da4dc3.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/admin/equipment-approvals/page-31ad927f52802008.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/admin/error-df3d270654ded081.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/admin/loading-6da09f5ba9dc9540.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/admin/monitoring/error-ebeebfd7f2546693.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/admin/monitoring/loading-6da09f5ba9dc9540.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/admin/monitoring/page-50866693c2aacc9a.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/admin/non-conformance-approvals/page-31ad927f52802008.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/admin/return-approvals/page-31ad927f52802008.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/admin/software-approvals/page-31ad927f52802008.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/alerts/error-0a0c23d49e58cac8.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/alerts/loading-6da09f5ba9dc9540.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/alerts/page-24476b0c8a3fb5fa.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/cables/%5Bid%5D/error-2a55a70db9533a2c.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/cables/%5Bid%5D/loading-6da09f5ba9dc9540.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/cables/%5Bid%5D/page-652f78e9c5167d62.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/cables/create/error-2e9825ae0b9e2ff3.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/cables/create/loading-6da09f5ba9dc9540.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/cables/create/page-5d8fdd410a2e9b35.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/cables/error-d5402f8efe07a815.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/cables/loading-6da09f5ba9dc9540.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/cables/page-08757d7451b77a93.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/calibration-plans/%5Buuid%5D/error-798ab457961cf523.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/calibration-plans/%5Buuid%5D/loading-6da09f5ba9dc9540.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/calibration-plans/%5Buuid%5D/not-found-a74b7c96ecaa3cad.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/calibration-plans/%5Buuid%5D/page-132aacd9dbee98ef.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/calibration-plans/create/error-e0bd6a1c3a94cabd.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/calibration-plans/create/loading-6da09f5ba9dc9540.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/calibration-plans/create/page-2de7620ddaefa001.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/calibration-plans/error-713a99dc24729ca8.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/calibration-plans/loading-6da09f5ba9dc9540.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/calibration-plans/page-018d97122bde7187.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/calibration/error-2d75ebbe710d05e7.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/calibration/loading-6da09f5ba9dc9540.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/calibration/page-504e2f5799adec91.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/calibration/register/loading-6da09f5ba9dc9540.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/calibration/register/page-e52775389f14bd73.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/checkouts/%5Bid%5D/check/error-a547054dbc26d135.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/checkouts/%5Bid%5D/check/loading-6da09f5ba9dc9540.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/checkouts/%5Bid%5D/check/page-5f1c07ae2a39cb30.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/checkouts/%5Bid%5D/error-e7a3798148350d04.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/checkouts/%5Bid%5D/loading-6da09f5ba9dc9540.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/checkouts/%5Bid%5D/page-7014801be6c33c5a.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/checkouts/%5Bid%5D/return/error-ccd8d337e9ceb8f2.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/checkouts/%5Bid%5D/return/loading-6da09f5ba9dc9540.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/checkouts/%5Bid%5D/return/page-8f2be5d0dc7b2f90.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/checkouts/create/error-c2c57f9b7c328e81.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/checkouts/create/loading-6da09f5ba9dc9540.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/checkouts/create/page-8ffb3dde54d2bbbf.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/checkouts/error-f45a5f6e2091053d.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/checkouts/import/%5Bid%5D/error-ee2925bfb99cd9ea.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/checkouts/import/%5Bid%5D/page-91b9a76b5bd5d430.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/checkouts/import/%5Bid%5D/receive/page-54ffc3a9f2cbdb3f.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/checkouts/import/loading-6da09f5ba9dc9540.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/checkouts/import/page-31ad927f52802008.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/checkouts/import/rental/page-c5f9b570ccb4a853.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/checkouts/import/shared/page-8aba799af4888968.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/checkouts/loading-6da09f5ba9dc9540.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/checkouts/manage/page-31ad927f52802008.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/checkouts/page-1ab9d0af906f4d7d.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/checkouts/pending-checks/loading-6da09f5ba9dc9540.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/checkouts/pending-checks/page-985582ca37566a9f.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/e/%5BmanagementNumber%5D/loading-6da09f5ba9dc9540.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/e/%5BmanagementNumber%5D/not-found-c7d6fbb2961f3381.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/e/%5BmanagementNumber%5D/page-1993cf5ebda82796.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/equipment/%5Bid%5D/calibration-factors/loading-6da09f5ba9dc9540.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/equipment/%5Bid%5D/calibration-factors/page-1bd52d67a4254127.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/equipment/%5Bid%5D/edit/loading-6da09f5ba9dc9540.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/equipment/%5Bid%5D/edit/page-59daaad6bff9c8a9.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/equipment/%5Bid%5D/error-54db99f703e05bfb.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/equipment/%5Bid%5D/loading-6da09f5ba9dc9540.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/equipment/%5Bid%5D/non-conformance/loading-6da09f5ba9dc9540.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/equipment/%5Bid%5D/non-conformance/page-23e4f8c987eb6481.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/equipment/%5Bid%5D/not-found-ab824d1ee09474d5.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/equipment/%5Bid%5D/page-c3b4cd4a5712eeff.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/equipment/%5Bid%5D/repair-history/loading-6da09f5ba9dc9540.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/equipment/%5Bid%5D/repair-history/page-b8a1c18047083ef4.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/equipment/create/error-f0095d8e9662a77e.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/equipment/create/loading-6da09f5ba9dc9540.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/equipment/create/page-9d3d65a8a20eb7a4.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/equipment/error-89bb96d18525698b.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/equipment/loading-6da09f5ba9dc9540.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/equipment/page-e48d317472357acd.js',
      },
      { revision: null, url: '/_next/static/chunks/app/(dashboard)/error-d3c4fdb7c83fcc79.js' },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/form-templates/error-d08db4b436d9a057.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/form-templates/loading-6da09f5ba9dc9540.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/form-templates/page-4db6d4bac6973121.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/handover/page-5cca13afa94cfa27.js',
      },
      { revision: null, url: '/_next/static/chunks/app/(dashboard)/help/page-6da09f5ba9dc9540.js' },
      { revision: null, url: '/_next/static/chunks/app/(dashboard)/layout-b02abff0c09b12e4.js' },
      { revision: null, url: '/_next/static/chunks/app/(dashboard)/loading-6da09f5ba9dc9540.js' },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/non-conformances/%5Bid%5D/error-693ada5a626fd8b0.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/non-conformances/%5Bid%5D/loading-6da09f5ba9dc9540.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/non-conformances/%5Bid%5D/not-found-7d03b53bfa94486b.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/non-conformances/%5Bid%5D/page-b4e85a6e12a06b66.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/non-conformances/error-7c8e33c85ce4cc11.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/non-conformances/loading-6da09f5ba9dc9540.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/non-conformances/page-1f8581e6dcc00a9a.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/notifications/error-41f6192d1365eb1e.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/notifications/loading-6da09f5ba9dc9540.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/notifications/page-80064ecc567938c7.js',
      },
      { revision: null, url: '/_next/static/chunks/app/(dashboard)/page-2873b1680ab1309b.js' },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/reports/calibration-factors/loading-6da09f5ba9dc9540.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/reports/calibration-factors/page-294b8493624b10da.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/reports/error-39f35cee648664fc.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/reports/loading-6da09f5ba9dc9540.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/reports/page-82bf66bc222d57f0.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/scan/loading-6da09f5ba9dc9540.js',
      },
      { revision: null, url: '/_next/static/chunks/app/(dashboard)/scan/page-4c325682b56fb501.js' },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/settings/admin/calibration/loading-6da09f5ba9dc9540.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/settings/admin/calibration/page-c9a00d93e019f3c7.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/settings/admin/system/loading-6da09f5ba9dc9540.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/settings/admin/system/page-5c2fc32ef11e4fbe.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/settings/display/loading-6da09f5ba9dc9540.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/settings/display/page-9b714aa066807fef.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/settings/error-c9b87f42277deb8c.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/settings/layout-0172a8bc2a8ed181.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/settings/loading-6da09f5ba9dc9540.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/settings/notifications/loading-6da09f5ba9dc9540.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/settings/notifications/page-1d1ab84bfc92094a.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/settings/page-31ad927f52802008.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/settings/profile/loading-6da09f5ba9dc9540.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/settings/profile/page-8044548dee82ce64.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/software-validations/error-a0bd663a0acb0401.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/software-validations/loading-6da09f5ba9dc9540.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/software-validations/not-found-7b9677057a146c89.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/software-validations/page-217df927ae372f67.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/software/%5Bid%5D/error-96a4f3e542b691f4.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/software/%5Bid%5D/loading-6da09f5ba9dc9540.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/software/%5Bid%5D/page-b1406f50d9e8f206.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/software/%5Bid%5D/validation/%5BvalidationId%5D/error-7944603700273233.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/software/%5Bid%5D/validation/%5BvalidationId%5D/loading-6da09f5ba9dc9540.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/software/%5Bid%5D/validation/%5BvalidationId%5D/page-a903d4ab7abad934.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/software/%5Bid%5D/validation/error-19050b4a57147ceb.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/software/%5Bid%5D/validation/loading-6da09f5ba9dc9540.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/software/%5Bid%5D/validation/page-eadce9a62f95f7c9.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/software/create/error-5a3df9384471de26.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/software/create/loading-6da09f5ba9dc9540.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/software/create/page-6702368347be0cc2.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/software/error-2b68b630409109e9.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/software/layout-31ad927f52802008.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/software/loading-6da09f5ba9dc9540.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/software/page-61de4dbd95cd885a.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/teams/%5Bid%5D/edit/error-80036ad1d8c3da86.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/teams/%5Bid%5D/edit/page-d8abb045655280b2.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/teams/%5Bid%5D/error-34b40ed01e391b5f.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/teams/%5Bid%5D/loading-6da09f5ba9dc9540.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/teams/%5Bid%5D/not-found-c7b261dca80d8d2e.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/teams/%5Bid%5D/page-f2eb540cb64cd6ef.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/teams/create/error-3d9b755923d1e281.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/teams/create/loading-6da09f5ba9dc9540.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/teams/create/page-41c9772b689eb4f6.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/teams/error-b34ac74b6507c920.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/teams/loading-6da09f5ba9dc9540.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/teams/not-found-ba5265467094bf5e.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/app/(dashboard)/teams/page-dba7168509b2e3b3.js',
      },
      { revision: null, url: '/_next/static/chunks/app/_global-error/page-31ad927f52802008.js' },
      { revision: null, url: '/_next/static/chunks/app/_not-found/page-31ad927f52802008.js' },
      {
        revision: null,
        url: '/_next/static/chunks/app/api/auth/%5B...nextauth%5D/route-31ad927f52802008.js',
      },
      { revision: null, url: '/_next/static/chunks/app/api/health/route-31ad927f52802008.js' },
      { revision: null, url: '/_next/static/chunks/app/error-17111967ea930a23.js' },
      { revision: null, url: '/_next/static/chunks/app/layout-75aeaeb22636818f.js' },
      { revision: null, url: '/_next/static/chunks/app/not-found-d97752c86917be97.js' },
      { revision: null, url: '/_next/static/chunks/app/~offline/page-852440cc6ede3977.js' },
      { revision: null, url: '/_next/static/chunks/da458701.46a0b4ea33bb863d.js' },
      { revision: null, url: '/_next/static/chunks/f0d8567a.1134e0c754cff2b2.js' },
      { revision: null, url: '/_next/static/chunks/framework-b879567b90d34fb5.js' },
      { revision: null, url: '/_next/static/chunks/main-01caeaff57b0182f.js' },
      { revision: null, url: '/_next/static/chunks/main-app-14b9b6ba1a267733.js' },
      {
        revision: null,
        url: '/_next/static/chunks/next/dist/client/components/builtin/app-error-31ad927f52802008.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/next/dist/client/components/builtin/forbidden-31ad927f52802008.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/next/dist/client/components/builtin/global-error-3c6c588f5aeb5b51.js',
      },
      {
        revision: null,
        url: '/_next/static/chunks/next/dist/client/components/builtin/unauthorized-31ad927f52802008.js',
      },
      {
        revision: '846118c33b2c0e922d7b3a7676f81f6f',
        url: '/_next/static/chunks/polyfills-42372ed130431b0a.js',
      },
      { revision: null, url: '/_next/static/chunks/webpack-da8ed5e0e5b94963.js' },
      { revision: null, url: '/_next/static/css/d29c947efe6be73b.css' },
      { revision: null, url: '/_next/static/css/e3089749e542846f.css' },
      { revision: 'ed92b727cfd597773e76ade0074832e3', url: '/icons/manifest-192.png' },
      { revision: 'c7d82bedc7dccf670bf48ff02c668099', url: '/icons/manifest-512.png' },
      { revision: 'c2e78969a63af6bb6956ffac0a44df7e', url: '/images/ul-logo.svg' },
      { revision: '0acf2e7c2787246a0c1e98c03fd1c931', url: '/index.html' },
      { revision: 'ccfb7dbd07f924b03dabcd032178e43c', url: '/manifest.json' },
    ],
    skipWaiting: !0,
    clientsClaim: !0,
    navigationPreload: !0,
    runtimeCaching: [eN, ...eD],
    fallbacks: {
      entries: [{ url: '/~offline', matcher: ({ request: e }) => 'document' === e.destination }],
    },
  }).addEventListeners();
})();
