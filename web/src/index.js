import axios from 'axios'

async function main () {
    const result = await axios({
        method: 'get',
        url: "https://cheese.com",
        path:"/status",
        withCredentials: false
    })
}
main()