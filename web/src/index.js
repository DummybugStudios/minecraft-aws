import axios from 'axios'

async function main () {
    const result = await axios({
        method: 'get',
        url: __API__,
        path:"/status",
        withCredentials: false
    })
}
main()