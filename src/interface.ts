interface IConfig {
  group: string;
  dataId: string;
}

export interface NacosOptions {
  server: string;
  namespace: string;
  accessKey?: string;
  secretKey?: string;
  config?: {
    group: string;
    dataId: string;
    subscribe?: boolean;
    commons?: IConfig[];
  };
}

export interface ClientOptions {
  serverAddr: string;
  namespace: string;
  accessKey?: string;
  secretKey?: string;
}
