import axios from 'axios'
import { APIStatus, IApi } from './IApi'

declare var __API__ : string
var url = __API__

export default class RealAPI implements IApi {

    async getServerStatus() : Promise<APIStatus>{ 
        let { status, ip } = await axios({
            method: 'get',
            url: `${url}/status`,
            withCredentials: false,
        }).then(x => x.data)
        
        return { status: status, ip: ip }
    }

    async startServer() : Promise<void> {
        await axios({
            method: 'get',
            url: `${url}/start`
        })
    }

    async stopServer() : Promise<void> {
        await axios({
            method: 'get',
            url: `${url}/stop`
        })
    }
}