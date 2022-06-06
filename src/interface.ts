export interface IConfig {
  server: string;
  namespace: string;
  group?: string;
  dataId?: string;
  accessKey?: string;
  secretKey?: string;
  subscribe?: boolean;
}
