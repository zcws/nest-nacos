export interface IOptions {
  debug?: boolean;
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


export interface ClientOptions {
  serverPort?: number;
  serverAddr: string;
  namespace: string;
  accessKey?: string;
  secretKey?: string;
}
