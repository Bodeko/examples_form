import {toast} from "vue3-toastify";
import MyLocalStorage from "@/services/myLocalStorage";

export default function (url, options = {}) {

    if (options.headers) {
        if (typeof options.headers.append === 'function') {
            // Если headers является объектом Headers, используем метод append
            options.headers.append('Authorization', `Bearer ${MyLocalStorage.getItem('token')}`);
        } else if (typeof options.headers.Authorization === 'undefined') {
            // Если headers не содержит заголовка Authorization, добавляем его
            options.headers.Authorization = `Bearer ${MyLocalStorage.getItem('token')}`;
        }
    } else {
        // Если headers не существует, создаем новый объект Headers
        options.headers = new Headers({
            'Authorization': `Bearer ${MyLocalStorage.getItem('token')}`,
        });
    }


    return new Promise( (resolve, reject) => {

        fetch(url, options)
            .then( res => {
                if(res.status === 200 || res.status === 201) {
                    try {
                        return res.json()
                    } catch (e) {
                        reject ({message: 'Error Json in Fetch'})
                    }
                }

                if(res.status === 404) {
                    toast.error("404")
                    reject({message: '404 - Not Found in BackEnd'})
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
