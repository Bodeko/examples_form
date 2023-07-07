import {defineStore} from "pinia";
import myLog from "@/helpers/myLog";
import {toast} from "vue3-toastify";
import {useSocketMainStore} from "@/stores/sockets/socket.main";
import myFetch from "@/helpers/myFetch";

export const useSendImageStore = defineStore('sendImage', {
    state: () =>({
        isPreload: false, // Флаг работы системы
        eventId: null,
        socket: null
    }),
    actions: {
        sendImage(data){
            // this.isPreload = true;
            const socketMainStore = useSocketMainStore()
            this.socket = socketMainStore.socket

            // Создаем объект FormData
            const formData = new FormData();
            // Добавляем данные изображения в объект FormData
            formData.append('image', this.dataURItoBlob(data));
            myLog("FormData");
            myLog(data);
            myLog(formData.get('image'));

            myFetch('/api/send/image', {
                method: 'POST',
                body: formData
            }).then(data => {
                this.eventId = data;
                this.socket.on('send.image.' + this.eventId, this.waitResponse);
            }).catch(err => {
                myLog(err)
                toast.error("Error api")
                this.isPreload = false
            })
        },
        waitResponse (data) {
            myLog(data)
            this.isPreload = false
            this.socket.off('send.mail.' + this.eventId, this.waitResponse);
            if(data.status === 'success')
                toast.success("Email send")
            else
                toast.error('Email error')
        },
        dataURItoBlob(dataURI){
            // convert base64 to raw binary data held in a string
            // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
            let byteString = atob(dataURI.split(',')[1]);

            // separate out the mime component
            let mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

            // write the bytes of the string to an ArrayBuffer
            let ab = new ArrayBuffer(byteString.length);

            // create a view into the buffer
            let ia = new Uint8Array(ab);

            // set the bytes of the buffer to the correct values
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }

            // write the ArrayBuffer to a blob, and you're done
            return new Blob([ab], {type: mimeString});
        },
    }
});
