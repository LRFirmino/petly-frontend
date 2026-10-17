import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Fetches data from the backend and tracks loading/error state.
 * `deps` re-runs the loader (like a useEffect dependency list).
 */
export function useApi(loader, deps = []) {
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await loaderRef.current();
      setData(result);
    } catch (err) {
      setError(err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, reload: load };
}
