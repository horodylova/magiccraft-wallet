<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="onCancel">Cancel</ion-button>
        </ion-buttons>
        <ion-title>{{ isEditing ? 'Edit Wallet' : 'Add Wallet' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-item>
        <ion-input label="Name" labelPlacement="stacked" v-model="name"></ion-input>
      </ion-item>

      <div v-if="!isEditing" class="wallet-options">
        <ion-button @click="createNewWallet" fill="solid" expand="block" class="create-button">
          <ion-icon :icon="addOutline" slot="start"></ion-icon>
          Create New Wallet
        </ion-button>

        <div class="divider">
          <span>OR</span>
        </div>

        <ion-item>
          <ion-textarea 
            label="Private Key" 
            labelPlacement="stacked" 
            v-model="privateKey"
            placeholder="Enter private key to import existing wallet"
            :rows="3"
          ></ion-textarea>
        </ion-item>
        
        <ion-button @click="importWallet" fill="outline" expand="block">
          <ion-icon :icon="downloadOutline" slot="start"></ion-icon>
          Import Wallet
        </ion-button>
      </div>

      <div v-if="isEditing">
        <ion-button @click="onEditAccount" expand="block">
          Save Changes
        </ion-button>
      </div>

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
import { ref, computed } from "vue";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonItem,
  IonInput,
  IonButton,
  IonAlert,
  IonIcon,
  onIonViewWillEnter,
  IonButtons,
  IonTextarea,
} from "@ionic/vue";
import { ethers } from "ethers";
import {
  saveSelectedAccount,
  getContacts,
  saveContact,
  getWalletPassword,
  saveEncryptedPrivateKey
} from "@/utils/platform";
import { encrypt, getCryptoParams } from '@/utils/webCrypto';
import router from "@/router";
import { useRoute } from "vue-router";
import type { Contact } from "@/extension/types";
import { addOutline, downloadOutline } from "ionicons/icons";

const name = ref("");
const privateKey = ref("");
const alertOpen = ref(false);
const alertMsg = ref("");
const route = useRoute();
const paramAddress = route.params.address ?? "";

const isEditing = computed(() => !!paramAddress);

let contactsProm: Promise<Contact[] | undefined>;

onIonViewWillEnter(async () => {
  if (paramAddress) {
    contactsProm = getContacts();
    const contacts = (await contactsProm) as Contact[];
    const contact = contacts.find((contact) => contact.address === paramAddress);
    if (contact) {
      name.value = contact.name;
    }
  } else {
    name.value = "";
  }
});

const createNewWallet = () => {
  router.push('/create-wallet');
};

const importWallet = async () => {
  if (name.value.length < 1) {
    alertMsg.value = "Name cannot be empty.";
    alertOpen.value = true;
    return;
  }

  if (!privateKey.value.trim()) {
    alertMsg.value = "Private key cannot be empty.";
    alertOpen.value = true;
    return;
  }

  try {
    const wallet = new ethers.Wallet(privateKey.value);
    
    const password = await getWalletPassword();
    
    if (!password) {
      alertMsg.value = "Please unlock your wallet first.";
      alertOpen.value = true;
      return;
    }
    
    const cryptoParams = await getCryptoParams(password);
    const encryptedPrivateKey = await encrypt(privateKey.value, cryptoParams);
    await saveEncryptedPrivateKey(wallet.address, encryptedPrivateKey);
    
    const contact = {
      address: wallet.address,
      name: name.value
    };
    
    await saveContact(contact);
    await saveSelectedAccount(contact);
    
    router.push('/tabs/home');
    
  } catch (error) {
    console.error('Import error:', error);
    alertMsg.value = "Invalid private key.";
    alertOpen.value = true;
  }
};

const onEditAccount = async () => {
  if (name.value.length < 1) {
    alertMsg.value = "Name cannot be empty.";
    alertOpen.value = true;
    return;
  }
  
  const contacts = (await contactsProm) as Contact[];
  const contact = contacts.find((contact) => contact.address === paramAddress);
  if (!contact) {
    alertMsg.value = "Account not found.";
    alertOpen.value = true;
    return;
  }
  
  const savedContact = {
    address: contact.address,
    name: name.value,
  };

  await saveContact(savedContact);
  router.push("/tabs/accounts");
};

const onCancel = () => {
  router.push("/tabs/accounts");
};
</script>

<style scoped>
.wallet-options {
  margin-top: 20px;
}

.create-button {
  margin-bottom: 20px;
}

.divider {
  text-align: center;
  margin: 20px 0;
  position: relative;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--ion-color-medium);
}

.divider span {
  background: var(--ion-background-color);
  padding: 0 15px;
  color: var(--ion-color-medium);
  font-size: 14px;
}
</style>
