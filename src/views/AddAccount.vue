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

        <div class="wallet-options">
          <ion-segment v-model="importMethod" @ionChange="onImportMethodChange">
            <ion-segment-button value="privateKey">
              <ion-label>Private Key</ion-label>
            </ion-segment-button>
            <ion-segment-button value="mnemonic">
              <ion-label>Seed Phrase</ion-label>
            </ion-segment-button>
          </ion-segment>

          <div v-if="importMethod === 'privateKey'">
            <ion-item>
              <ion-textarea 
                label="Private Key" 
                labelPlacement="stacked" 
                v-model="privateKey"
                placeholder="Enter private key (64 hex characters)"
                :rows="3"
              ></ion-textarea>
            </ion-item>
          </div>

          <div v-if="importMethod === 'mnemonic'">
            <ion-item>
              <ion-textarea 
                label="Seed Phrase" 
                labelPlacement="stacked" 
                v-model="mnemonicPhrase"
                placeholder="Enter 12 or 24 word seed phrase"
                :rows="4"
              ></ion-textarea>
            </ion-item>
          </div>
          
          <ion-button @click="importWallet" fill="outline" expand="block">
            <ion-icon :icon="downloadOutline" slot="start"></ion-icon>
            Import Wallet
          </ion-button>
        </div>
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
import { ref, computed, watch } from "vue";
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
  IonSegment,
  IonSegmentButton,
  IonLabel,
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

const importMethod = ref('privateKey');
const mnemonicPhrase = ref('');

watch(name, (newValue) => {
  localStorage.setItem('addAccount_name', newValue);
});

watch(privateKey, (newValue) => {
  localStorage.setItem('addAccount_privateKey', newValue);
});

watch(mnemonicPhrase, (newValue) => {
  localStorage.setItem('addAccount_mnemonicPhrase', newValue);
});

watch(importMethod, (newValue) => {
  localStorage.setItem('addAccount_importMethod', newValue);
});

onIonViewWillEnter(async () => {
  const savedName = localStorage.getItem('addAccount_name');
  const savedPrivateKey = localStorage.getItem('addAccount_privateKey');
  const savedMnemonicPhrase = localStorage.getItem('addAccount_mnemonicPhrase');
  const savedImportMethod = localStorage.getItem('addAccount_importMethod');
  
  if (savedName) name.value = savedName;
  if (savedPrivateKey) privateKey.value = savedPrivateKey;
  if (savedMnemonicPhrase) mnemonicPhrase.value = savedMnemonicPhrase;
  if (savedImportMethod) importMethod.value = savedImportMethod;

  if (paramAddress) {
    contactsProm = getContacts();
    const contacts = (await contactsProm) as Contact[];
    const contact = contacts.find((contact) => contact.address === paramAddress);
    if (contact) {
      name.value = contact.name;
    }
  } else if (!savedName) {
    name.value = "";
  }
});

const createNewWallet = () => {
  router.push('/create-wallet');
};

const onImportMethodChange = () => {
};

const importWallet = async () => {
  if (name.value.length < 1) {
    alertMsg.value = "Name cannot be empty.";
    alertOpen.value = true;
    return;
  }

  try {
    let wallet: ethers.Wallet | ethers.HDNodeWallet;

    if (importMethod.value === 'privateKey') {
      if (!privateKey.value.trim()) {
        alertMsg.value = "Private key cannot be empty.";
        alertOpen.value = true;
        return;
      }
      wallet = new ethers.Wallet(privateKey.value);
    } else {
      if (!mnemonicPhrase.value.trim()) {
        alertMsg.value = "Seed phrase cannot be empty.";
        alertOpen.value = true;
        return;
      }
      wallet = ethers.Wallet.fromPhrase(mnemonicPhrase.value);
    }
    
    const password = await getWalletPassword();
    
    if (!password) {
      alertMsg.value = "Please unlock your wallet first.";
      alertOpen.value = true;
      return;
    }
    
    const cryptoParams = await getCryptoParams(password);
    const encryptedPrivateKey = await encrypt(wallet.privateKey, cryptoParams);
    await saveEncryptedPrivateKey(wallet.address, encryptedPrivateKey);
    
    const contact = {
      address: wallet.address,
      name: name.value
    };
    
    await saveContact(contact);
    await saveSelectedAccount(contact);
    
    localStorage.removeItem('addAccount_name');
    localStorage.removeItem('addAccount_privateKey');
    localStorage.removeItem('addAccount_mnemonicPhrase');
    localStorage.removeItem('addAccount_importMethod');
    
    router.push('/tabs/home');
    
  } catch (error) {
    console.error('Import error:', error);
    alertMsg.value = `Invalid ${importMethod.value}. Please check your input.`;
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
  localStorage.removeItem('addAccount_name');
  localStorage.removeItem('addAccount_privateKey');
  localStorage.removeItem('addAccount_mnemonicPhrase');
  localStorage.removeItem('addAccount_importMethod');
  router.push("/tabs/accounts");
};
</script>

<style scoped>
.wallet-options {
  margin-top: 12px;
}

.create-button {
  margin-bottom: 12px;
  height: 40px;
}

.divider {
  text-align: center;
  margin: 12px 0;
  position: relative;
}

.divider span {
  background: var(--ion-background-color);
  padding: 0 12px;
  color: var(--ion-color-dark);
  font-size: 16px;
  font-weight: 600;
}
 
.divider::before {
  display: none;
}

/* Делаем контент максимально компактным */
ion-content {
  --padding-top: 4px;
  --padding-bottom: 4px;
  --padding-start: 12px;
  --padding-end: 12px;
}

ion-item {
  --padding-start: 0;
  --padding-end: 0;
  margin-bottom: 8px;
  --min-height: 44px;
}

ion-button {
  margin: 6px 0;
  height: 40px;
  font-size: 0.9rem;
}

ion-textarea {
  --padding-top: 6px;
  --padding-bottom: 6px;
}

 
ion-textarea::part(native) {
  min-height: 60px !important;
}

 
ion-header ion-toolbar {
  --min-height: 44px;
}

ion-title {
  font-size: 1.1rem;
}

 
ion-input {
  --padding-top: 8px;
  --padding-bottom: 8px;
}

 
ion-buttons ion-button {
  font-size: 0.9rem;
}
</style>
