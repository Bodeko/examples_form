<script setup>
import { Form, Field } from 'vee-validate';
import * as Yup from 'yup';
import MyLog from "@/helpers/myLog";
import {useSendEmailStore} from "@/stores/sendEmail.store";

const schema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  email: Yup.string().email().required('Email is required'),
  message: Yup.string().required('Message is required')
});

const useSendEmail = useSendEmailStore()

async function onSubmit(data) {
  useSendEmail.sendEmail(data)

}
</script>

<template>
  <div v-if="useSendEmail.isPreload">
    Sending Email
  </div>

  <div v-else class="card m-3">
    <h4 class="card-header">Send Email</h4>
    <div class="card-body">
      <Form @submit="onSubmit" :validation-schema="schema" v-slot="{ errors, isSubmitting }">
        <div class="form-group">
          <label>Name</label>
          <Field name="name" type="text" class="form-control" :class="{ 'is-invalid': errors.name }" />
          <div class="invalid-feedback">{{ errors.name }}</div>
        </div>
        <div class="form-group">
          <label>Email</label>
          <Field name="email" type="email" class="form-control" :class="{ 'is-invalid': errors.email }" />
          <div class="invalid-feedback">{{ errors.email }}</div>
        </div>
        <div class="form-group">
          <label>Message</label>
          <Field as="textarea"  name="message" type="email" class="form-control" :class="{ 'is-invalid': errors.message }" />
          <div class="invalid-feedback">{{ errors.message }}</div>
        </div>
        <div class="form-group">
          <button class="btn btn-primary" :disabled="isSubmitting">
            <span v-show="isSubmitting" class="spinner-border spinner-border-sm mr-1"></span>
            Send
          </button>
        </div>
      </Form>
    </div>
  </div>
</template>

<style scoped>

</style>