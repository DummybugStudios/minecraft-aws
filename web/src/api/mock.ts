import { APIStatus, IApi } from "./IApi"; 
export default class MockAPI implements IApi {

    async getServerStatus(): Promise<APIStatus> {
        return {
            status: "Running",
            ip: "90.90.90.90"
        }
    }

    async stopServer(): Promise<void> {
    }

    async startServer(): Promise<void> {
    }
} 