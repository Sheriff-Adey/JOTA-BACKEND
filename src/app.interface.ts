export interface ApiResponse {
    status: number;
    message: string;
    data?: any;
    pageInfo?:any
    error?:boolean;
  }
  