import axios from 'axios'

declare var __API__ : string
var url = __API__

export async function getServerStatus() { 
    let { status, ip } = await axios({
        method: 'get',
        url: `${url}/status`,
        withCredentials: false,
    }).then(x => x.data)
    
    return { status: status, ip: ip }
}

export async function startServer(){
    await axios({
        method: 'get',
        url: `${url}/stop`
    })
}

export async function stopServer() {

}