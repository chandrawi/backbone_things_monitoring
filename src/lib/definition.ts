export type AuthSchema = {
  address: string;
};

export type AuthServer = {
  address: string;
  auth_token: string;
};

export type ResourceSchema = {
  address: string;
  api_id: string;
};

export type ResourceServer = {
  address: string;
  access_token: string;
  refresh_token: string;
};

export type TokenMap = {
  api_id: string;
  access_token: string;
  refresh_token: string;
};

export type DashboardPath = {
  name: string;
  menu: string;
  submenu: string;
  item: string;
};

export type DashboardMenu = {
  id: number;
  parent_id: number;
  name: string;
  text: string;
  icon: string;
  link: string;
};

export type BasicSchema = {
  name: string;
  text: string;
  icon: string;
};

export type OverviewCardsSchema = BasicSchema & {
  set: {
    id: string;
    name: string;
  };
  config: {
    live_range: number;
    live_ranges: number[];
    float_precission: number[];
  };
};

export type OverviewCardGroupSchema = BasicSchema & {
  sets: {
    id: string;
    name: string;
  }[];
  config: {
    live_range: number;
    live_ranges: number[];
    float_precission: number[];
  };
};

export type OverviewSchema = OverviewCardsSchema | OverviewCardGroupSchema;

export type InformationDescriptionSchema = BasicSchema & {
  component: string;
};

export type InformationSpecificationSchema = BasicSchema & {
  component: string;
  table: {
    title: string;
    rows: string[][];
  }[];
};

export type InformationChildSchema = InformationDescriptionSchema | InformationSpecificationSchema;

export type InformationSchema = BasicSchema & {
  children: InformationChildSchema[];
};

export type DataLogViewSchema = BasicSchema & {
  model_id: string;
  model_index: number[];
  devices: {
    id: string;
    name: string;
  }[];
  config: {
    live_ranges: number[];
    live_range: number;
    view_mode: "table" | "graph";
    time_mode: "live" | "history";
    float_precission?: number[];
    chart_value_range?: number[][];
  };
};

export type DatasetLogViewSchema = BasicSchema & {
  sets: {
    id: string;
    name: string;
  }[];
  config: {
    live_ranges: number[];
    live_range: number;
    view_mode: "table" | "graph";
    time_mode: "live" | "history";
    float_precission?: number[];
    chart_value_range?: number[][];
  };
};

export type DataLogChildSchema = DataLogViewSchema | DatasetLogViewSchema;

export type DataLogSchema = {
  name: string;
  text: string;
  icon: string;
  mode: "single" | "flat" | "nested";
  children: DataLogChildSchema[];
};
