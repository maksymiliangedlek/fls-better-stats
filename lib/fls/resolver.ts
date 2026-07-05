/* eslint-disable @typescript-eslint/no-explicit-any */

export type ApolloState = Record<string, any>;

export interface NextDataResponse {
  pageProps: {
    __APOLLO_STATE__: ApolloState;
    [key: string]: unknown;
  };
}

/** Expand an Apollo `__ref` pointer into the full cached object (mirrors main.py resolve()). */
export function resolve(apollo: ApolloState, refOrObj: any): any {
  if (refOrObj && typeof refOrObj === "object" && "__ref" in refOrObj) {
    return apollo[refOrObj.__ref] ?? {};
  }
  return refOrObj ?? {};
}
