// custom-ws-exception.ts

export class CustomWsException {
    constructor(public message: string, public status: number,public error:boolean=true) {}
  }
  