"use client";

import {
  DESIGN_SYSTEM_COOKIE_NAME,
  DESIGN_SYSTEM_STORAGE_KEY,
  DEFAULT_DESIGN_SYSTEM,
} from "@/lib/design-system";

/**
 * Blocking inline script that executes before layout paint (Zero-FOUC).
 * Reads localStorage/cookies, mirrors state, and normalizes body classes to
 * ensure exactly one `style-*` class exists on `<body>`.
 */
const bootstrapScript = `
(function() {
  try {
    var key = '${DESIGN_SYSTEM_STORAGE_KEY}';
    var cookieName = '${DESIGN_SYSTEM_COOKIE_NAME}';
    var defaultDs = '${DEFAULT_DESIGN_SYSTEM}';
    var map = {
      'default': 'style-nova',
      'comfort': 'style-vega',
      'glass': 'style-glass'
    };
    
    // 1. Read from cookie
    var cookieMatch = document.cookie.match(new RegExp('(?:^|; )' + cookieName + '=([^;]*)'));
    var fromCookie = cookieMatch ? decodeURIComponent(cookieMatch[1]) : '';
    
    // 2. Read from localStorage with fallback
    var fromLocal = '';
    try {
      fromLocal = localStorage.getItem(key) || '';
    } catch (_) {}
    
    var activeKey = fromLocal || fromCookie || defaultDs;
    if (!map[activeKey]) {
      activeKey = defaultDs;
    }
    
    // 3. Mirror to cookie and localStorage
    document.cookie = cookieName + '=' + activeKey + ';path=/;max-age=31536000;samesite=lax';
    try {
      localStorage.setItem(key, activeKey);
    } catch (_) {}
    
    // 4. Update body classList synchronously
    var styleClass = map[activeKey];
    var body = document.body;
    if (body) {
      var currentClasses = Array.prototype.slice.call(body.classList);
      for (var i = 0; i < currentClasses.length; i++) {
        var cls = currentClasses[i];
        if (cls.indexOf('style-') === 0) {
          body.classList.remove(cls);
        }
      }
      body.classList.add(styleClass);
    }
  } catch (_) {}
})();
`.trim();

export function DesignSystemBootstrap({ nonce }: { nonce?: string } = {}) {
  return (
    <script
      id="ds-bootstrap"
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: bootstrapScript }}
    />
  );
}

