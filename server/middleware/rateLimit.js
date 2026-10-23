function secondsUntil(timestamp) {
  return Math.max(1, Math.ceil((timestamp - Date.now()) / 1000));
}

function requestKey(req) {
  return req.ip || req.socket?.remoteAddress || "unknown";
}

export function createRateLimiter({ windowMs, limit, message }) {
  const clients = new Map();
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of clients) {
      if (entry.resetAt <= now) clients.delete(key);
    }
  }, Math.min(windowMs, 10 * 60 * 1000));
  cleanup.unref?.();

  return (req, res, next) => {
    const now = Date.now();
    const key = requestKey(req);
    let entry = clients.get(key);

    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      clients.set(key, entry);
    }

    res.set("RateLimit-Limit", String(limit));
    res.set("RateLimit-Reset", String(secondsUntil(entry.resetAt)));
    if (entry.count >= limit) {
      const retryAfterSeconds = secondsUntil(entry.resetAt);
      res.set("RateLimit-Remaining", "0");
      res.set("Retry-After", String(retryAfterSeconds));
      return res.status(429).json({ error: message, retryAfterSeconds });
    }

    entry.count += 1;
    res.set("RateLimit-Remaining", String(Math.max(0, limit - entry.count)));
    next();
  };
}

export function createConcurrencyLimiter({ limit, message }) {
  let activeRequests = 0;
  return (req, res, next) => {
    if (activeRequests >= limit) {
      return res.status(503).json({ error: message });
    }

    activeRequests += 1;
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      activeRequests = Math.max(0, activeRequests - 1);
    };
    res.once("finish", release);
    res.once("close", release);
    next();
  };
}
