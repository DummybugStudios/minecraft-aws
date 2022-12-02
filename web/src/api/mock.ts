import { APIStatus, IApi } from "./IApi"; 

async function wait(ms : number) : Promise<void> {
        return new Promise((resolve)=>{
        setTimeout(resolve, ms)
    })
}

export default class MockAPI implements IApi {

    status: string
    ip: string
    constructor() {
        this.status = "Stopped",
        this.ip = "90.90.90.90"
    }

    async getServerStatus(): Promise<APIStatus> {
        await wait(200);
        return {
            status: this.status,
            ip: this.ip
        }
    }

    async stopServer(): Promise<void> {
        this.status = "Stopping"
        setTimeout(()=>{this.status = "Stopped"}, 4000)
    }

    async startServer(): Promise<void> {
        this.status = "Starting"
        setTimeout(()=>{this.status="Running"}, 4000)
    }
} 