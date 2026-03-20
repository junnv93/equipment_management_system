(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([
  typeof document === 'object' ? document.currentScript : undefined,
  '[project]/apps/frontend/components/ui/card.tsx [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'Card',
      () => Card,
      'CardContent',
      () => CardContent,
      'CardDescription',
      () => CardDescription,
      'CardFooter',
      () => CardFooter,
      'CardHeader',
      () => CardHeader,
      'CardTitle',
      () => CardTitle,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/lib/utils.ts [app-client] (ecmascript) <locals>'
      );
    const Card =
      /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](
        (_c = ({ className, hoverable = false, ...props }, ref) =>
          /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            'div',
            {
              ref: ref,
              className: (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                'cn'
              ])(
                'rounded-lg border bg-card text-card-foreground shadow-sm motion-safe:transition-[box-shadow,border-color] motion-safe:duration-200 motion-reduce:transition-none dark:border-brand-border-subtle dark:bg-brand-bg-surface dark:shadow-md dark:shadow-black/20',
                hoverable &&
                  'hover:shadow-md hover:shadow-black/5 dark:hover:shadow-lg dark:hover:shadow-black/30 hover:border-brand-border-default dark:hover:border-brand-border-default',
                className
              ),
              ...props,
            },
            void 0,
            false,
            {
              fileName: '[project]/apps/frontend/components/ui/card.tsx',
              lineNumber: 9,
              columnNumber: 3,
            },
            ('TURBOPACK compile-time value', void 0)
          ))
      );
    _c1 = Card;
    Card.displayName = 'Card';
    const CardHeader =
      /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](
        (_c2 = ({ className, ...props }, ref) =>
          /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            'div',
            {
              ref: ref,
              className: (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                'cn'
              ])('flex flex-col space-y-1.5 p-6', className),
              ...props,
            },
            void 0,
            false,
            {
              fileName: '[project]/apps/frontend/components/ui/card.tsx',
              lineNumber: 24,
              columnNumber: 5,
            },
            ('TURBOPACK compile-time value', void 0)
          ))
      );
    _c3 = CardHeader;
    CardHeader.displayName = 'CardHeader';
    const CardTitle =
      /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](
        (_c4 = ({ className, ...props }, ref) =>
          /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            'h3',
            {
              ref: ref,
              className: (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                'cn'
              ])(
                'text-lg font-semibold leading-none tracking-tight dark:text-brand-text-primary',
                className
              ),
              role: 'heading',
              ...props,
            },
            void 0,
            false,
            {
              fileName: '[project]/apps/frontend/components/ui/card.tsx',
              lineNumber: 31,
              columnNumber: 5,
            },
            ('TURBOPACK compile-time value', void 0)
          ))
      );
    _c5 = CardTitle;
    CardTitle.displayName = 'CardTitle';
    const CardDescription =
      /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](
        (_c6 = ({ className, ...props }, ref) =>
          /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            'p',
            {
              ref: ref,
              className: (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                'cn'
              ])('text-sm text-muted-foreground', className),
              ...props,
            },
            void 0,
            false,
            {
              fileName: '[project]/apps/frontend/components/ui/card.tsx',
              lineNumber: 48,
              columnNumber: 3,
            },
            ('TURBOPACK compile-time value', void 0)
          ))
      );
    _c7 = CardDescription;
    CardDescription.displayName = 'CardDescription';
    const CardContent =
      /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](
        (_c8 = ({ className, ...props }, ref) =>
          /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            'div',
            {
              ref: ref,
              className: (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                'cn'
              ])('p-6 pt-0', className),
              ...props,
            },
            void 0,
            false,
            {
              fileName: '[project]/apps/frontend/components/ui/card.tsx',
              lineNumber: 54,
              columnNumber: 5,
            },
            ('TURBOPACK compile-time value', void 0)
          ))
      );
    _c9 = CardContent;
    CardContent.displayName = 'CardContent';
    const CardFooter =
      /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'forwardRef'
      ](
        (_c10 = ({ className, ...props }, ref) =>
          /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            'div',
            {
              ref: ref,
              className: (0,
              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__[
                'cn'
              ])('flex items-center p-6 pt-0 dark:border-t-brand-border-subtle', className),
              ...props,
            },
            void 0,
            false,
            {
              fileName: '[project]/apps/frontend/components/ui/card.tsx',
              lineNumber: 61,
              columnNumber: 5,
            },
            ('TURBOPACK compile-time value', void 0)
          ))
      );
    _c11 = CardFooter;
    CardFooter.displayName = 'CardFooter';
    var _c, _c1, _c2, _c3, _c4, _c5, _c6, _c7, _c8, _c9, _c10, _c11;
    __turbopack_context__.k.register(_c, 'Card$React.forwardRef');
    __turbopack_context__.k.register(_c1, 'Card');
    __turbopack_context__.k.register(_c2, 'CardHeader$React.forwardRef');
    __turbopack_context__.k.register(_c3, 'CardHeader');
    __turbopack_context__.k.register(_c4, 'CardTitle$React.forwardRef');
    __turbopack_context__.k.register(_c5, 'CardTitle');
    __turbopack_context__.k.register(_c6, 'CardDescription$React.forwardRef');
    __turbopack_context__.k.register(_c7, 'CardDescription');
    __turbopack_context__.k.register(_c8, 'CardContent$React.forwardRef');
    __turbopack_context__.k.register(_c9, 'CardContent');
    __turbopack_context__.k.register(_c10, 'CardFooter$React.forwardRef');
    __turbopack_context__.k.register(_c11, 'CardFooter');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/components/layout/RouteError.tsx [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['RouteError', () => RouteError]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      /*#__PURE__*/ __turbopack_context__.i(
        '[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next-intl/dist/esm/development/react-client/index.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/ui/button.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/ui/card.tsx [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/triangle-alert.js [app-client] (ecmascript) <export default as AlertTriangle>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/refresh-cw.js [app-client] (ecmascript) <export default as RefreshCw>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$house$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Home$3e$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/house.js [app-client] (ecmascript) <export default as Home>'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)'
      );
    var _s = __turbopack_context__.k.signature();
    ('use client');
    function RouteError({ error, reset, title, description }) {
      _s();
      const t = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useTranslations'
      ])('navigation');
      const displayTitle = title ?? t('layout.errorOccurred');
      const displayDescription = description ?? t('layout.errorDescription');
      (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'useEffect'
      ])(
        {
          'RouteError.useEffect': () => {
            // 에러 로깅 (프로덕션에서는 에러 추적 서비스로 전송)
            console.error('[RouteError]', error);
          },
        }['RouteError.useEffect'],
        [error]
      );
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        'div',
        {
          className: 'flex items-center justify-center min-h-[400px] p-4',
          children: /*#__PURE__*/ (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
            'jsxDEV'
          ])(
            __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
              'Card'
            ],
            {
              className: 'w-full max-w-md',
              children: [
                /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsxDEV'
                ])(
                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'CardHeader'
                  ],
                  {
                    className: 'text-center',
                    children: [
                      /*#__PURE__*/ (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'jsxDEV'
                      ])(
                        'div',
                        {
                          className:
                            'mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10',
                          children: /*#__PURE__*/ (0,
                          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                            'jsxDEV'
                          ])(
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__[
                              'AlertTriangle'
                            ],
                            {
                              className: 'h-6 w-6 text-destructive',
                            },
                            void 0,
                            false,
                            {
                              fileName: '[project]/apps/frontend/components/layout/RouteError.tsx',
                              lineNumber: 40,
                              columnNumber: 13,
                            },
                            this
                          ),
                        },
                        void 0,
                        false,
                        {
                          fileName: '[project]/apps/frontend/components/layout/RouteError.tsx',
                          lineNumber: 39,
                          columnNumber: 11,
                        },
                        this
                      ),
                      /*#__PURE__*/ (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'jsxDEV'
                      ])(
                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'CardTitle'
                        ],
                        {
                          children: displayTitle,
                        },
                        void 0,
                        false,
                        {
                          fileName: '[project]/apps/frontend/components/layout/RouteError.tsx',
                          lineNumber: 42,
                          columnNumber: 11,
                        },
                        this
                      ),
                      /*#__PURE__*/ (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'jsxDEV'
                      ])(
                        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'CardDescription'
                        ],
                        {
                          children: displayDescription,
                        },
                        void 0,
                        false,
                        {
                          fileName: '[project]/apps/frontend/components/layout/RouteError.tsx',
                          lineNumber: 43,
                          columnNumber: 11,
                        },
                        this
                      ),
                    ],
                  },
                  void 0,
                  true,
                  {
                    fileName: '[project]/apps/frontend/components/layout/RouteError.tsx',
                    lineNumber: 38,
                    columnNumber: 9,
                  },
                  this
                ),
                /*#__PURE__*/ (0,
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                  'jsxDEV'
                ])(
                  __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                    'CardContent'
                  ],
                  {
                    className: 'space-y-4',
                    children: [
                      ('TURBOPACK compile-time value', 'development') === 'development' &&
                        /*#__PURE__*/ (0,
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                          'jsxDEV'
                        ])(
                          'div',
                          {
                            className:
                              'rounded-md bg-muted p-3 text-xs font-mono text-muted-foreground overflow-auto max-h-32',
                            children: [
                              error.message,
                              error.digest &&
                                /*#__PURE__*/ (0,
                                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                  'jsxDEV'
                                ])(
                                  'div',
                                  {
                                    className: 'mt-1 text-xs opacity-50',
                                    children: ['Digest: ', error.digest],
                                  },
                                  void 0,
                                  true,
                                  {
                                    fileName:
                                      '[project]/apps/frontend/components/layout/RouteError.tsx',
                                    lineNumber: 50,
                                    columnNumber: 17,
                                  },
                                  this
                                ),
                            ],
                          },
                          void 0,
                          true,
                          {
                            fileName: '[project]/apps/frontend/components/layout/RouteError.tsx',
                            lineNumber: 47,
                            columnNumber: 13,
                          },
                          this
                        ),
                      /*#__PURE__*/ (0,
                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                        'jsxDEV'
                      ])(
                        'div',
                        {
                          className: 'flex flex-col sm:flex-row gap-2',
                          children: [
                            /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'Button'
                              ],
                              {
                                onClick: reset,
                                className: 'flex-1',
                                children: [
                                  /*#__PURE__*/ (0,
                                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                    'jsxDEV'
                                  ])(
                                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__[
                                      'RefreshCw'
                                    ],
                                    {
                                      className: 'mr-2 h-4 w-4',
                                    },
                                    void 0,
                                    false,
                                    {
                                      fileName:
                                        '[project]/apps/frontend/components/layout/RouteError.tsx',
                                      lineNumber: 56,
                                      columnNumber: 15,
                                    },
                                    this
                                  ),
                                  t('layout.retry'),
                                ],
                              },
                              void 0,
                              true,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/layout/RouteError.tsx',
                                lineNumber: 55,
                                columnNumber: 13,
                              },
                              this
                            ),
                            /*#__PURE__*/ (0,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                              'jsxDEV'
                            ])(
                              __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                'Button'
                              ],
                              {
                                variant: 'outline',
                                asChild: true,
                                className: 'flex-1',
                                children: /*#__PURE__*/ (0,
                                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                  'jsxDEV'
                                ])(
                                  __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                    'default'
                                  ],
                                  {
                                    href: '/',
                                    children: [
                                      /*#__PURE__*/ (0,
                                      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
                                        'jsxDEV'
                                      ])(
                                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$house$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Home$3e$__[
                                          'Home'
                                        ],
                                        {
                                          className: 'mr-2 h-4 w-4',
                                        },
                                        void 0,
                                        false,
                                        {
                                          fileName:
                                            '[project]/apps/frontend/components/layout/RouteError.tsx',
                                          lineNumber: 61,
                                          columnNumber: 17,
                                        },
                                        this
                                      ),
                                      t('layout.goToHome'),
                                    ],
                                  },
                                  void 0,
                                  true,
                                  {
                                    fileName:
                                      '[project]/apps/frontend/components/layout/RouteError.tsx',
                                    lineNumber: 60,
                                    columnNumber: 15,
                                  },
                                  this
                                ),
                              },
                              void 0,
                              false,
                              {
                                fileName:
                                  '[project]/apps/frontend/components/layout/RouteError.tsx',
                                lineNumber: 59,
                                columnNumber: 13,
                              },
                              this
                            ),
                          ],
                        },
                        void 0,
                        true,
                        {
                          fileName: '[project]/apps/frontend/components/layout/RouteError.tsx',
                          lineNumber: 54,
                          columnNumber: 11,
                        },
                        this
                      ),
                    ],
                  },
                  void 0,
                  true,
                  {
                    fileName: '[project]/apps/frontend/components/layout/RouteError.tsx',
                    lineNumber: 45,
                    columnNumber: 9,
                  },
                  this
                ),
              ],
            },
            void 0,
            true,
            {
              fileName: '[project]/apps/frontend/components/layout/RouteError.tsx',
              lineNumber: 37,
              columnNumber: 7,
            },
            this
          ),
        },
        void 0,
        false,
        {
          fileName: '[project]/apps/frontend/components/layout/RouteError.tsx',
          lineNumber: 36,
          columnNumber: 5,
        },
        this
      );
    }
    _s(RouteError, 'etYYvAa+NcFbn1DAUOfsAwohSEY=', false, function () {
      return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$intl$2f$dist$2f$esm$2f$development$2f$react$2d$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'useTranslations'
        ],
      ];
    });
    _c = RouteError;
    var _c;
    __turbopack_context__.k.register(_c, 'RouteError');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/apps/frontend/app/(dashboard)/admin/approvals/error.tsx [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['default', () => RouteErrorPage]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)'
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$layout$2f$RouteError$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/apps/frontend/components/layout/RouteError.tsx [app-client] (ecmascript)'
      );
    ('use client');
    function RouteErrorPage({ error, reset }) {
      return /*#__PURE__*/ (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
        'jsxDEV'
      ])(
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$frontend$2f$components$2f$layout$2f$RouteError$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'RouteError'
        ],
        {
          error: error,
          reset: reset,
        },
        void 0,
        false,
        {
          fileName: '[project]/apps/frontend/app/(dashboard)/admin/approvals/error.tsx',
          lineNumber: 11,
          columnNumber: 10,
        },
        this
      );
    }
    _c = RouteErrorPage;
    var _c;
    __turbopack_context__.k.register(_c, 'RouteErrorPage');
    if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
      __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
    }
  },
  '[project]/node_modules/lucide-react/dist/esm/icons/refresh-cw.js [app-client] (ecmascript)',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s(['default', () => RefreshCw]);
    /**
     * @license lucide-react v0.469.0 - ISC
     *
     * This source code is licensed under the ISC license.
     * See the LICENSE file in the root directory of this source tree.
     */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/createLucideIcon.js [app-client] (ecmascript)'
      );
    const RefreshCw = (0,
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$createLucideIcon$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
      'default'
    ])('RefreshCw', [
      [
        'path',
        {
          d: 'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8',
          key: 'v9h5vc',
        },
      ],
      [
        'path',
        {
          d: 'M21 3v5h-5',
          key: '1q7to0',
        },
      ],
      [
        'path',
        {
          d: 'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16',
          key: '3uifl3',
        },
      ],
      [
        'path',
        {
          d: 'M8 16H3v5',
          key: '1cv678',
        },
      ],
    ]);
    //# sourceMappingURL=refresh-cw.js.map
  },
  '[project]/node_modules/lucide-react/dist/esm/icons/refresh-cw.js [app-client] (ecmascript) <export default as RefreshCw>',
  (__turbopack_context__) => {
    'use strict';

    __turbopack_context__.s([
      'RefreshCw',
      () =>
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__[
          'default'
        ],
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        '[project]/node_modules/lucide-react/dist/esm/icons/refresh-cw.js [app-client] (ecmascript)'
      );
  },
]);

//# sourceMappingURL=_c8c4bf4f._.js.map
