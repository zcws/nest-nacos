export interface IOptions {
  server: string;
  namespace: string;
  accessKey?: string;
  secretKey?: string;
  logger?: typeof console;
  config?: {
    group: string;
    dataId: string;
    subscribe?: boolean;
    commons?: IConfig[];
  };
}

export interface IConfig {
  group: string;
  dataId: string;
}
