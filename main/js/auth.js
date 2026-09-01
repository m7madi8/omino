(function (global) {
  const USERS_KEY = 'omino.founding.users';
  const SESSION_KEY = 'omino.session';
  const CAP = 50;

  const text = (s) => new TextEncoder().encode(s);

  async function sha256(value) {
    const buf = await crypto.subtle.digest('SHA-256', text(value));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  function readUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); }
    catch { return []; }
  }
  function writeUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
  function session() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
    catch { return null; }
  }
  function setSession(user) {
    const next = { email: user.email, business: user.business, at: Date.now() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    return next;
  }

  async function signIn(email, password) {
    const endpoint = global.OMINO_AUTH_ENDPOINT;
    if (endpoint) {
      const res = await fetch(endpoint + '/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'SIGNIN_FAILED');
      return setSession(data);
    }
    const users = readUsers();
    const user = users.find((u) => u.email === email.toLowerCase().trim());
    if (!user) throw new Error('NOT_FOUND');
    const hash = await sha256(user.salt + password);
    if (hash !== user.hash) throw new Error('INVALID');
    return setSession(user);
  }

  async function signUp({ email, password, business }) {
    const endpoint = global.OMINO_AUTH_ENDPOINT;
    if (endpoint) {
      const res = await fetch(endpoint + '/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, business })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'SIGNUP_FAILED');
      return setSession(data);
    }
    const users = readUsers();
    const clean = email.toLowerCase().trim();
    if (users.some((u) => u.email === clean)) throw new Error('EXISTS');
    if (users.length >= CAP) throw new Error('CAP');
    const salt = crypto.randomUUID();
    const user = {
      email: clean,
      business: business.trim(),
      salt,
      hash: await sha256(salt + password),
      created: Date.now()
    };
    users.push(user);
    writeUsers(users);
    return setSession(user);
  }

  async function resetPassword(email, password) {
    const users = readUsers();
    const user = users.find((u) => u.email === email.toLowerCase().trim());
    if (!user) return true;
    user.salt = crypto.randomUUID();
    user.hash = await sha256(user.salt + password);
    writeUsers(users);
    return true;
  }

  function signOut() {
    localStorage.removeItem(SESSION_KEY);
  }

  async function google() {
    if (global.OMINO_GOOGLE_CLIENT_ID) {
      throw new Error('GOOGLE_UNWIRED');
    }
    throw new Error('GOOGLE_UNAVAILABLE');
  }

  global.OminoAuth = {
    session, signIn, signUp, resetPassword, signOut, google, foundingCount: () => readUsers().length
  };
})(window);
