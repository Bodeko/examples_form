<script setup>

import FormRegister from "@/components/MyAuth/Forms/FormRegister.vue";
import SiteBreadcrumbs from "@/layout/SiteBreadcrumbs.vue";
import {onMounted} from "vue";
import {useAuthStore} from "@/stores/auth/auth";
import {toast} from "vue3-toastify";
import { useRouter } from 'vue-router';
const router = useRouter();

const pageTitle = "Страница регистрации"

const authStore = useAuthStore()

onMounted(() =>{
  // Проверим - нахожусь ли я уже в системе. Если да - перейти на главную
  if(authStore.isLogin) {
    toast.error('Вы уже в системе')
    router.push('/');
  }
})
</script>

<template>
  <SiteBreadcrumbs :pageTitle=pageTitle></SiteBreadcrumbs>
  <section class="inner-page">
    <div class="container">

      <FormRegister></FormRegister>

    </div>
  </section><!-- End Inner Page -->
</template>

<style scoped>

</style>
