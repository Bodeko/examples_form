<template>
  <div v-if="useSendImage.isPreload">
    Sending Image
  </div>
  <div v-else>
    <input type="button" value="Send" @click="send">
    <input type="button" value="x" @click="clear">
    <input type="file" @change="handleFileChange" accept="image/*">
    <cropper
        class="cropper"
        :src="imageBody"
        :stencil-props="{aspectRatio: 10/12}"
        @change="handleCropperChange"
        ref="cropperRef"
        v-if="imageBody"
    />
    
    <img :src="imageFromCanvas" v-if="imageBody">
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';
import {useSendImageStore} from "@/stores/sendImage.store";

const imageBody = ref(null);
const imageFromCanvas = ref(null);
const cropperRef = ref(null);

const useSendImage = useSendImageStore();


const handleCropperChange = () => {
  const { canvas } = cropperRef.value.getResult();
  imageFromCanvas.value = canvas.toDataURL();
}

const send = () => {
  useSendImage.sendImage(imageFromCanvas.value);
}

const handleFileChange = (event) => {
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = (e) => {
    imageBody.value = e.target.result;
  };

  reader.readAsDataURL(file);
};

const clear = () => {
  imageBody.value = null;
  imageFromCanvas.value = null;
}
</script>
