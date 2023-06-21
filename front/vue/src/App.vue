<script setup>
import { RouterLink, RouterView } from 'vue-router'
import {onMounted} from "vue";
import {useSocketMainStore} from "@/stores/sockets/socket.main";

onMounted( () => {
  const socketsMainStore = useSocketMainStore()
  socketsMainStore.connect()
})
</script>

<template>
  <header> Hello User</header>
  <main id="main">
    <RouterView />
  </main>
  <footer> &copy; LAB325 2023 </footer>

</template>


<style scoped>
</style>
