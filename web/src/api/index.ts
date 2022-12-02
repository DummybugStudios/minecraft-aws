declare var __DEV__ : boolean
import realAPI from './real'
import mockAPI from './mock'
import { IApi } from './IApi'

let api : IApi

if (__DEV__)
    api = new mockAPI()
else 
    api = new realAPI()

export default api