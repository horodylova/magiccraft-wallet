<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="onCancel">Cancel</ion-button>
        </ion-buttons>
        <ion-title>Edit Wallet</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-item>
        <ion-input label="Name" labelPlacement="stacked" v-model="name"></ion-input>
      </ion-item>
      <ion-item>
        <ion-button @click="onCancel" color="light">Cancel</ion-button>
        <ion-button @click="onEditAccount">Edit Wallet</ion-button>
      </ion-item>
      <ion-alert
        :is-open="alertOpen"
        header="Error"
        :message="alertMsg"
        :buttons="['OK']"
        @didDismiss="alertOpen = false"
      ></ion-alert>
    </ion-content>
  </ion-page>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonAlert,
  IonIcon,
  onIonViewWillEnter,
  modalController,
  IonModal,
  IonButtons,
  IonTextarea,
} from "@ionic/vue";
import { ethers } from "ethers";
import {
  saveSelectedAccount,
  getAccounts,
  saveContact,
  smallRandomString,
  paste,
  getSettings,
  replaceAccounts,
} from "@/utils/platform";
import router from "@/router";
import { useRoute } from "vue-router";
import type { Account, Settings } from "@/extension/types";
import UnlockModal from "@/views/UnlockModal.vue";
import { encrypt, getCryptoParams } from "@/utils/webCrypto";

import { clipboardOutline } from "ionicons/icons";
import { getFromMnemonic, getRandomPk } from "@/utils/wallet";
import { setUnlockModalState } from "@/utils/unlockStore";

const name = ref("");
const alertOpen = ref(false);
const alertMsg = ref("");
const route = useRoute();
const paramAddress = route.params.address ?? "";

let accountsProm: Promise<Account[] | undefined>;
let settingsProm: Promise<Settings | undefined>;

const resetFields = () => {
  name.value = "";
};

const openModal = async () => {
  const modal = await modalController.create({
    component: UnlockModal,
    animated: true,
    focusTrap: false,
    backdropDismiss: false,
    componentProps: {
      unlockType: "addAccount",
    },
  });
  await modal.present();
  setUnlockModalState(true);
  const { role, data } = await modal.onWillDismiss();
  if (role === "confirm") return data;
  setUnlockModalState(false);
  return false;
};

onIonViewWillEnter(async () => {
  if (paramAddress) {
    accountsProm = getAccounts();
    settingsProm = getSettings();
    const accounts = (await accountsProm) as Account[];
    const acc = accounts.find((account) => account.address === paramAddress);
    if (acc) {
      name.value = acc.name;
    }
  }
});


const onEditAccount = async () => {
  console.log("??")
  if (name.value.length < 1) {
    alertMsg.value = "Name cannot be empty.";
    alertOpen.value = true;
    return;
  }
  const accounts = (await accountsProm) as Account[];
  const account = accounts.find((acc) => acc.address === paramAddress);
  if (!account) {
    alertMsg.value = "Account not found.";
    alertOpen.value = true;
    return;
  }
  const savedAcc = {
    address: account.address,
    name: name.value,
  };

  await saveContact(savedAcc);
  router.push("/tabs/accounts");
};



const getRandomName = () => {
  name.value = smallRandomString();
};

const onCancel = () => {
  router.push("/tabs/accounts");
};

</script>
