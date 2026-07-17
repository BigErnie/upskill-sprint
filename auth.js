/* Site-wide authentication controller for UpSkill Sprint Consulting.
   Follows the /theme.js pattern: single IIFE, vanilla JS, no dependencies
   beyond the vendored Supabase client (/vendor/supabase.js) and
   /supabase-config.js, both loaded before this file by site-sections.js.

   Exposes window.UpskillAuth and injects the Account dropdown into the
   site header. If Supabase is not configured yet, the dropdown still
   renders (Sign in / Sign up links) and auth calls report a clear error. */
(function () {
  'use strict';

  var SIGN_IN_PATH = '/sign-in.html';
  var SIGN_UP_PATH = '/signup.html';
  var PLACEHOLDER = 'YOUR_SUPABASE';
  var NOT_CONFIGURED_MESSAGE = 'Accounts are not set up yet. Supabase credentials are missing from supabase-config.js.';

  var client = null;
  var currentSession = null;
  var sessionKnown = false;
  var listeners = [];

  function getConfig() {
    return window.UPSKILLSPRINT_SUPABASE_CONFIG || null;
  }

  function isConfigured() {
    var config = getConfig();
    return Boolean(
      config && config.url && config.anonKey &&
      config.url.indexOf(PLACEHOLDER) === -1 &&
      config.anonKey.indexOf(PLACEHOLDER) === -1 &&
      window.supabase && typeof window.supabase.createClient === 'function'
    );
  }

  function notifyListeners() {
    var user = getUser();
    listeners.forEach(function (listener) {
      try { listener(user); } catch (error) { /* listener errors stay local */ }
    });
  }

  function getClient() {
    if (client) return client;
    if (!isConfigured()) return null;
    var config = getConfig();
    client = window.supabase.createClient(config.url, config.anonKey);
    client.auth.onAuthStateChange(function (_event, session) {
      currentSession = session;
      sessionKnown = true;
      notifyListeners();
    });
    client.auth.getSession().then(function (result) {
      currentSession = result && result.data ? result.data.session : null;
      sessionKnown = true;
      notifyListeners();
    });
    return client;
  }

  function getUser() {
    return currentSession && currentSession.user ? currentSession.user : null;
  }

  function requireClient() {
    var authClient = getClient();
    if (!authClient) {
      return Promise.reject(new Error(NOT_CONFIGURED_MESSAGE));
    }
    return Promise.resolve(authClient);
  }

  function unwrap(result) {
    if (result && result.error) throw result.error;
    return result ? result.data : null;
  }

  window.UpskillAuth = {
    isConfigured: isConfigured,
    getClient: getClient,
    getUser: getUser,
    signUp: function (email, password) {
      return requireClient().then(function (authClient) {
        return authClient.auth.signUp({ email: email, password: password }).then(unwrap);
      });
    },
    signIn: function (email, password) {
      return requireClient().then(function (authClient) {
        return authClient.auth.signInWithPassword({ email: email, password: password }).then(unwrap);
      });
    },
    signOut: function () {
      return requireClient().then(function (authClient) {
        return authClient.auth.signOut().then(unwrap);
      });
    },
    resetPassword: function (email) {
      return requireClient().then(function (authClient) {
        return authClient.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/update-password.html'
        }).then(unwrap);
      });
    },
    updatePassword: function (newPassword) {
      return requireClient().then(function (authClient) {
        return authClient.auth.updateUser({ password: newPassword }).then(unwrap);
      });
    },
    onChange: function (listener) {
      if (typeof listener !== 'function') return;
      listeners.push(listener);
      if (sessionKnown) listener(getUser());
    }
  };

  /* ---------- Account dropdown ---------- */

  function injectStyles() {
    if (document.getElementById('account-menu-styles')) return;
    var style = document.createElement('style');
    style.id = 'account-menu-styles';
    style.textContent = [
      '.account-menu { position: relative; }',
      '.account-menu-btn { display: inline-flex; align-items: center; gap: 6px;',
      '  padding: 8px 14px; border-radius: var(--radius, 6px);',
      '  border: 1px solid var(--line, #e3e7ee); background: transparent;',
      '  color: var(--ink, #101828); font-family: inherit; font-size: 14px;',
      '  font-weight: 600; cursor: pointer;',
      '  transition: background-color .2s ease, color .2s ease, border-color .2s ease; }',
      '.account-menu-btn:hover { background: var(--tint, #f5f7fa); }',
      '.account-menu-btn svg { transition: transform .15s ease; }',
      '.account-menu-btn[aria-expanded="true"] svg { transform: rotate(180deg); }',
      '.account-menu-panel { position: absolute; right: 0; top: calc(100% + 8px);',
      '  min-width: 200px; padding: 8px; z-index: 80;',
      '  background: var(--card, #ffffff); border: 1px solid var(--line, #e3e7ee);',
      '  border-radius: var(--radius, 6px); box-shadow: 0 10px 28px rgba(16,24,40,.14); }',
      '.account-menu-label { font-size: 11.5px; font-weight: 700; letter-spacing: .06em;',
      '  text-transform: uppercase; color: var(--muted, #667085); margin: 4px 12px 6px; }',
      '.account-menu-email { font-size: 13px; color: var(--muted, #667085);',
      '  margin: 0; padding: 0 12px 8px; word-break: break-all; }',
      '.account-menu-panel a, .account-menu-panel button {',
      '  display: block; width: 100%; text-align: left; padding: 9px 12px;',
      '  border: none; border-radius: 4px; background: none; cursor: pointer;',
      '  color: var(--ink, #101828); font-family: inherit; font-size: 14.5px;',
      '  font-weight: 500; text-decoration: none; }',
      '.account-menu-panel a:hover, .account-menu-panel button:hover {',
      '  background: var(--tint, #f5f7fa); color: var(--ink, #101828); }'
    ].join('\n');
    document.head.appendChild(style);
  }

  function chevronSvg() {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '12');
    svg.setAttribute('height', '12');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2.5');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M6 9l6 6 6-6');
    svg.appendChild(path);
    return svg;
  }

  function renderPanel(panel, user) {
    panel.textContent = '';

    var label = document.createElement('p');
    label.className = 'account-menu-label';
    label.textContent = user ? 'Signed in' : 'Welcome';
    panel.appendChild(label);

    if (user) {
      var email = document.createElement('p');
      email.className = 'account-menu-email';
      email.id = 'account-menu-email';
      email.textContent = user.email || '';
      panel.appendChild(email);

      var signOut = document.createElement('button');
      signOut.type = 'button';
      signOut.id = 'account-menu-signout';
      signOut.textContent = 'Sign out';
      signOut.addEventListener('click', function () {
        window.UpskillAuth.signOut().catch(function () { /* stay signed in on failure */ });
      });
      panel.appendChild(signOut);
    } else {
      var signIn = document.createElement('a');
      signIn.href = SIGN_IN_PATH;
      signIn.id = 'account-menu-signin';
      signIn.textContent = 'Sign in';
      panel.appendChild(signIn);

      var signUp = document.createElement('a');
      signUp.href = SIGN_UP_PATH;
      signUp.id = 'account-menu-signup';
      signUp.textContent = 'Sign up';
      panel.appendChild(signUp);
    }
  }

  function findMenuMount() {
    /* index.html groups header controls in .header-actions; other pages
       place the CTA button directly in header.site. Support both. */
    var actions = document.querySelector('header.site .header-actions');
    if (actions) return { parent: actions, before: actions.firstChild };
    var header = document.querySelector('header.site');
    if (!header) return null;
    return { parent: header, before: header.querySelector('.header-cta') };
  }

  function buildAccountMenu() {
    var mount = findMenuMount();
    if (!mount || document.getElementById('account-menu')) return;

    injectStyles();

    var container = document.createElement('div');
    container.className = 'account-menu';
    container.id = 'account-menu';

    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'account-menu-btn';
    button.id = 'account-menu-btn';
    button.setAttribute('aria-haspopup', 'true');
    button.setAttribute('aria-expanded', 'false');
    button.appendChild(document.createTextNode('Account'));
    button.appendChild(chevronSvg());

    var panel = document.createElement('div');
    panel.className = 'account-menu-panel';
    panel.id = 'account-menu-panel';
    panel.hidden = true;

    function setOpen(open) {
      panel.hidden = !open;
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    button.addEventListener('click', function () {
      setOpen(panel.hidden);
    });
    document.addEventListener('click', function (event) {
      if (!panel.hidden && !container.contains(event.target)) setOpen(false);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !panel.hidden) {
        setOpen(false);
        button.focus();
      }
    });

    renderPanel(panel, getUser());
    window.UpskillAuth.onChange(function (user) {
      renderPanel(panel, user);
    });

    container.appendChild(button);
    container.appendChild(panel);
    mount.parent.insertBefore(container, mount.before);
  }

  function initialize() {
    getClient(); /* begins session restore when configured; harmless otherwise */
    buildAccountMenu();
    document.dispatchEvent(new CustomEvent('upskill-auth-ready'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
}());
