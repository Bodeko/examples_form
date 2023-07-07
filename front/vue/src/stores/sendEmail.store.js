import {defineStore} from "pinia";
import myFetch from "@/helpers/myFetch";
import {useSocketMainStore} from "@/stores/sockets/socket.main";
import myLog from "@/helpers/myLog";
import {toast} from "vue3-toastify";


export const useSendEmailStore = defineStore('sendEmail', {
    state: () =>({
        isPreload: false, // Флаг работы системы
        eventId: null,
        socket: null
    }),
    actions:{
        sendEmail(data){
            this.isPreload = true;
            const socketMainStore = useSocketMainStore()
            this.socket = socketMainStore.socket

            myFetch('/api/send/email', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    // 'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: JSON.stringify(data)
            }).then(data => {
                this.eventId = data;
                this.socket.on('send.mail.' + this.eventId, this.waitResponse);
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
        }

    }
})