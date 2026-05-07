export type ProfileSession = {
  mode: "account" | "guest";
  username: string;
};

type StoredAccount = {
  username: string;
  password: string;
  createdAt: string;
};

const accountsKey = "xianxia-text-adventure-accounts";
const sessionKey = "xianxia-text-adventure-session";

export function getStoredSession(): ProfileSession | null {
  const storedSession = localStorage.getItem(sessionKey);

  if (!storedSession) {
    return null;
  }

  try {
    return JSON.parse(storedSession) as ProfileSession;
  } catch {
    localStorage.removeItem(sessionKey);
    return null;
  }
}

export function registerProfile(
  username: string,
  password: string,
): { session: ProfileSession | null; message: string } {
  const normalizedUsername = normalizeUsername(username);

  if (!normalizedUsername || password.trim().length < 3) {
    return {
      session: null,
      message: "Enter a username and a password with at least 3 characters.",
    };
  }

  const accounts = getStoredAccounts();

  if (accounts.some((account) => account.username === normalizedUsername)) {
    return {
      session: null,
      message: "That username already exists on this device.",
    };
  }

  const nextAccounts = [
    ...accounts,
    {
      username: normalizedUsername,
      password,
      createdAt: new Date().toISOString(),
    },
  ];
  const session = setStoredSession({
    mode: "account",
    username: normalizedUsername,
  });

  localStorage.setItem(accountsKey, JSON.stringify(nextAccounts));

  return {
    session,
    message: "Account created. Create your character.",
  };
}

export function loginProfile(
  username: string,
  password: string,
): { session: ProfileSession | null; message: string } {
  const normalizedUsername = normalizeUsername(username);
  const account = getStoredAccounts().find(
    (candidate) => candidate.username === normalizedUsername,
  );

  if (!account || account.password !== password) {
    return {
      session: null,
      message: "Username or password was not found on this device.",
    };
  }

  return {
    session: setStoredSession({
      mode: "account",
      username: account.username,
    }),
    message: "Logged in.",
  };
}

export function continueAsGuest(): ProfileSession {
  return setStoredSession({
    mode: "guest",
    username: "guest",
  });
}

export function clearStoredSession(): void {
  localStorage.removeItem(sessionKey);
}

function getStoredAccounts(): StoredAccount[] {
  const storedAccounts = localStorage.getItem(accountsKey);

  if (!storedAccounts) {
    return [];
  }

  try {
    const parsedAccounts = JSON.parse(storedAccounts) as StoredAccount[];

    return Array.isArray(parsedAccounts) ? parsedAccounts : [];
  } catch {
    localStorage.removeItem(accountsKey);
    return [];
  }
}

function setStoredSession(session: ProfileSession): ProfileSession {
  localStorage.setItem(sessionKey, JSON.stringify(session));

  return session;
}

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}
