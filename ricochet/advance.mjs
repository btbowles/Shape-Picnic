export function createAdvance(schedule, cancel, load) {
  let pending;
  let revision = 0;

  function clear() {
    revision++;
    if (pending !== undefined) cancel(pending);
    pending = undefined;
  }

  function queue(index) {
    clear();
    const current = revision;
    pending = schedule(() => {
      if (revision !== current) return;
      pending = undefined;
      revision++;
      load(index);
    }, 1200);
  }

  return {queue, clear};
}
