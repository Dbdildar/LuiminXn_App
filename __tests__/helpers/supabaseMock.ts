type Result = {data: unknown; error: unknown; count?: number | null};

/**
 * A chainable, awaitable stand-in for a Supabase query builder.
 * Every method call is recorded in `calls` and returns the same builder;
 * awaiting it resolves to `result`.
 */
export function createBuilder(result: Result) {
  const calls: Array<[string, unknown[]]> = [];
  const builder: any = new Proxy(
    {},
    {
      get(_target, prop) {
        if (typeof prop === 'symbol') {
          return undefined;
        }
        if (prop === 'then') {
          return (resolve: (v: Result) => unknown, reject: (e: unknown) => unknown) =>
            Promise.resolve(result).then(resolve, reject);
        }
        if (prop === 'calls') {
          return calls;
        }
        return (...args: unknown[]) => {
          calls.push([prop, args]);
          return builder;
        };
      },
    },
  );
  return builder as {calls: Array<[string, unknown[]]>} & PromiseLike<Result>;
}
