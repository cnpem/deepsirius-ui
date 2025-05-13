/** The ISC License

Copyright (c) 2010-2023 Isaac Z. Schlueter and Contributors

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR
IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE. */

import type { NodeSSH } from "node-ssh";

export const cache = {
  data: new Map<PropertyKey, NodeSSH>(),
  timers: new Map<PropertyKey, ReturnType<typeof setTimeout>>(),
  set: (k: PropertyKey, v: NodeSSH, ttl: number) => {
    if (cache.timers.has(k)) {
      clearTimeout(cache.timers.get(k));
    }
    cache.timers.set(
      k,
      setTimeout(() => cache.delete(k), ttl),
    );
    cache.data.set(k, v);
  },
  get: (k: PropertyKey) => cache.data.get(k),
  has: (k: PropertyKey) => cache.data.has(k),
  delete: (k: PropertyKey) => {
    if (cache.timers.has(k)) {
      clearTimeout(cache.timers.get(k));
    }
    cache.timers.delete(k);
    cache.data.get(k)?.dispose();
    return cache.data.delete(k);
  },
  clear: () => {
    cache.data.clear();
    for (const v of cache.timers.values()) {
      clearTimeout(v);
    }
    cache.timers.clear();
  },
};
