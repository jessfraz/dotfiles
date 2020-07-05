import { URLSearchParams } from "url";
export { URL, URLSearchParams } from "url";

export type URLSearchParamsInit =
  | URLSearchParams
  | string
  | { [key: string]: Object | Object[] | undefined }
  | Iterable<[string, Object]>
  | Array<[string, Object]>;
