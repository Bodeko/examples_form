import {toast} from "vue3-toastify";
import myLocalStorage from "@/helpers/myLocalStorage";
import myLog from "@/helpers/myLog";

export default function (url, options = {}) {

    if(options.body) {
        if (typeof (options.body) === 'object'){
            options.body = JSON.stringify(options.body)
        }
    }

    if (options.headers) {
        if (typeof options.headers.append === 'function') {
            // Если headers является объектом Headers, используем метод append
            options.headers.append('Authorization', `Bearer ${myLocalStorage.getItem('token')}`);
        } else if (typeof options.headers.Authorization === 'undefined') {
            // Если headers не содержит заголовка Authorization, добавляем его
            options.headers.Authorization = `Bearer ${myLocalStorage.getItem('token')}`;
        }
    } else {
        // Если headers не существует, создаем новый объект Headers
        options.headers = new Headers({
            'Authorization': `Bearer ${myLocalStorage.getItem('token')}`,
        });
    }


    return new Promise( (resolve, reject) => {

        fetch(url, options)
            .then( res => {
                myLog('Server Say')
                myLog(res)

                if(res.status === 404) {
                    toast.error("404")
                    reject({message: '404 - Not Found in BackEnd'})
                }

                if(res.status === 400) {
                    toast.error("400")
                    reject({message: '400 - Bad Request'})
                }

                if(res.status === 403 || res.status === 401) {
                    toast.error("Auth")
                    reject({message: 'Auth error'})
                }

                const contentType = res.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    return res.json();
                } else {
                    return res.text();
                }
            })
            .then(data => {
                resolve(data)
            })
            .catch(error => {
                toast.error(error.message)
                reject(error)
            })

    })
}
