export interface APIStatus {
    status: string,
    ip: string
}

export interface IApi {
    getServerStatus() : Promise<APIStatus>,
    startServer(): Promise<void>,
    stopServer(): Promise<void>,
}