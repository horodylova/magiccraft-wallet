<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Create Wallet</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div v-if="currentStep === 1" class="step-container">
        <div class="icon-container">
          <ion-icon :icon="keyOutline" size="large" color="primary"></ion-icon>
        </div>
        
        <h2>Secret Recovery Phrase</h2>
        <p class="description">
          Your secret recovery phrase is a 12-word phrase that is the "master key" to your wallet and your funds.
        </p>

        <ion-card class="warning-card">
          <ion-card-content>
            <div class="warning-header">
              <ion-icon :icon="warningOutline" color="warning"></ion-icon>
              <strong>Important!</strong>
            </div>
            <ul class="warning-list">
              <li>Write down your secret phrase in the correct order</li>
              <li>Store it in a safe place</li>
              <li>Never share it with anyone</li>
              <li>If you lose it, you cannot recover your wallet</li>
            </ul>
          </ion-card-content>
        </ion-card>

        <ion-button 
          expand="block" 
          @click="generateMnemonic"
          :disabled="isGenerating"
        >
          <ion-spinner v-if="isGenerating" name="crescent"></ion-spinner>
          <span v-else>Generate Secret Phrase</span>
        </ion-button>
      </div>

      <div v-if="currentStep === 2" class="step-container">
        <div class="icon-container">
          <ion-icon :icon="eyeOutline" size="large" color="primary"></ion-icon>
        </div>
        
        <h2>Your Secret Recovery Phrase</h2>
        <p class="description">
          Write down these 12 words in the exact order shown. You will need them to verify in the next step.
        </p>

        <div v-if="showMnemonic" class="mnemonic-grid">
          <div 
            v-for="(word, index) in mnemonicWords" 
            :key="index"
            class="mnemonic-word"
          >
            <span class="word-number">{{ index + 1 }}.</span>
            <span class="word-text">{{ word }}</span>
          </div>
        </div>

        <div v-else class="mnemonic-hidden">
          <ion-icon :icon="eyeOffOutline" size="large" color="medium"></ion-icon>
          <p>Secret phrase is hidden</p>
        </div>

        <div class="action-buttons">
          <ion-button 
            fill="outline" 
            @click="showMnemonic = !showMnemonic"
          >
            <ion-icon :icon="showMnemonic ? eyeOffOutline : eyeOutline" slot="start"></ion-icon>
            {{ showMnemonic ? 'Hide' : 'Show' }}
          </ion-button>
          
          <ion-button 
            fill="outline" 
            @click="copyMnemonic"
            :color="copied ? 'success' : 'primary'"
          >
            <ion-icon :icon="copied ? checkmarkOutline : copyOutline" slot="start"></ion-icon>
            {{ copied ? 'Copied!' : 'Copy' }}
          </ion-button>
        </div>

        <div class="confirmation-checkbox">
          <ion-checkbox v-model="confirmedSaved"></ion-checkbox>
          <label>I have written down my secret recovery phrase in a safe place</label>
        </div>

        <ion-button 
          expand="block" 
          @click="nextStep"
          :disabled="!confirmedSaved"
          class="continue-button"
        >
          Continue
        </ion-button>
      </div>

      <div v-if="currentStep === 3" class="step-container">
        <div class="icon-container">
          <ion-icon :icon="checkboxOutline" size="large" color="primary"></ion-icon>
        </div>
        
        <h2>Verify Your Secret Phrase</h2>
        <p class="description">
          Select the correct words for the positions shown below to verify you have written down your secret phrase correctly.
        </p>

        <div class="verification-container">
          <div 
            v-for="position in verificationPositions" 
            :key="position"
            class="verification-item"
          >
            <label>Word #{{ position + 1 }}</label>
            <ion-item>
              <ion-select 
                v-model="verificationAnswers[position]"
                placeholder="Select word"
                interface="popover"
              >
                <ion-select-option 
                  v-for="word in shuffledWords" 
                  :key="word"
                  :value="word"
                >
                  {{ word }}
                </ion-select-option>
              </ion-select>
            </ion-item>
          </div>
        </div>

        <ion-button 
          expand="block" 
          @click="verifyMnemonic"
          :disabled="!allVerificationFieldsFilled"
        >
          Verify
        </ion-button>
      </div>

      <div v-if="currentStep === 4" class="step-container">
        <div class="icon-container">
          <ion-icon :icon="lockClosedOutline" size="large" color="primary"></ion-icon>
        </div>
        
        <h2>Create Password</h2>
        <p class="description">
          Create a strong password to secure your wallet. This password will be used to unlock your wallet.
        </p>

        <ion-item>
          <ion-input
            v-model="password"
            type="password"
            placeholder="Enter password"
            required
          ></ion-input>
        </ion-item>

        <ion-item>
          <ion-input
            v-model="confirmPassword"
            type="password"
            placeholder="Confirm password"
            required
          ></ion-input>
        </ion-item>

        <div class="password-strength">
          <div class="strength-label">Password Strength</div>
          <div class="strength-bar">
            <div 
              class="strength-fill"
              :class="passwordStrengthClass"
              :style="{ width: passwordStrengthPercent + '%' }"
            ></div>
          </div>
          <div class="strength-text" :class="passwordStrengthClass">
            {{ passwordStrengthText }}
          </div>
        </div>

        <ion-button 
          expand="block" 
          @click="createWallet"
          :disabled="!canCreateWallet || isCreating"
        >
          <ion-spinner v-if="isCreating" name="crescent"></ion-spinner>
          <span v-else>Create Wallet</span>
        </ion-button>
      </div>

      <ion-alert
        :is-open="alertOpen"
        header="Error"
        :message="alertMsg"
        :buttons="['OK']"
        @didDismiss="alertOpen = false"
      ></ion-alert>

      <ion-alert
        :is-open="successAlertOpen"
        header="Success!"
        message="Wallet created successfully! Welcome to MagicCraft Wallet!"
        :buttons="['Continue']"
        @didDismiss="onWalletCreated"
      ></ion-alert>
    </ion-content>
  </ion-page>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCheckbox,
  IonSelect,
  IonSelectOption,
  IonItem,
  IonInput,
  IonAlert,
  IonSpinner
} from '@ionic/vue';
import {
  keyOutline,
  warningOutline,
  eyeOutline,
  eyeOffOutline,
  copyOutline,
  checkmarkOutline,
  checkboxOutline,
  lockClosedOutline
} from 'ionicons/icons';
import { ethers } from 'ethers';
import { encrypt, getCryptoParams } from '@/utils/webCrypto';
import { saveContact, setSettings, saveEncryptedPrivateKey, saveWalletPassword } from '@/utils/platform';
import router from '@/router';

const currentStep = ref(1);
const isGenerating = ref(false);
const isCreating = ref(false);

const mnemonic = ref('');
const mnemonicWords = ref<string[]>([]);
const showMnemonic = ref(false);
const copied = ref(false);
const confirmedSaved = ref(false);

const verificationPositions = ref<number[]>([]);
const verificationAnswers = ref<{[key: number]: string}>({});
const shuffledWords = ref<string[]>([]);

const password = ref('');
const confirmPassword = ref('');

const alertOpen = ref(false);
const alertMsg = ref('');
const successAlertOpen = ref(false);

const generateMnemonic = async () => {
  isGenerating.value = true;
  
  try {
    const wallet = ethers.Wallet.createRandom();
    mnemonic.value = wallet.mnemonic!.phrase;
    mnemonicWords.value = mnemonic.value.split(' ');
    currentStep.value = 2;
  } catch (error) {
    alertMsg.value = 'Error generating mnemonic. Please try again.';
    alertOpen.value = true;
  } finally {
    isGenerating.value = false;
  }
};

const copyMnemonic = async () => {
  try {
    await navigator.clipboard.writeText(mnemonic.value);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (error) {
    alertMsg.value = 'Failed to copy to clipboard';
    alertOpen.value = true;
  }
};

const nextStep = () => {
  setupVerification();
  currentStep.value = 3;
};

const setupVerification = () => {
  const positions = [];
  while (positions.length < 3) {
    const pos = Math.floor(Math.random() * 12);
    if (!positions.includes(pos)) {
      positions.push(pos);
    }
  }
  verificationPositions.value = positions.sort((a, b) => a - b);
  shuffledWords.value = [...mnemonicWords.value].sort(() => Math.random() - 0.5);
  verificationAnswers.value = {};
};

const verifyMnemonic = () => {
  let isCorrect = true;
  
  for (const position of verificationPositions.value) {
    if (verificationAnswers.value[position] !== mnemonicWords.value[position]) {
      isCorrect = false;
      break;
    }
  }
  
  if (isCorrect) {
    currentStep.value = 4;
  } else {
    alertMsg.value = 'Incorrect words. Please check your secret phrase and try again.';
    alertOpen.value = true;
  }
};

const passwordStrength = computed(() => {
  const pwd = password.value;
  if (!pwd) return 0;
  
  let score = 0;
  
  if (pwd.length >= 8) score += 25;
  if (pwd.length >= 12) score += 25;
  if (/\d/.test(pwd)) score += 25;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score += 25;
  
  return score;
});

const passwordStrengthPercent = computed(() => passwordStrength.value);

const passwordStrengthClass = computed(() => {
  const strength = passwordStrength.value;
  if (strength < 25) return 'weak';
  if (strength < 50) return 'fair';
  if (strength < 75) return 'good';
  return 'strong';
});

const passwordStrengthText = computed(() => {
  const strength = passwordStrength.value;
  if (strength < 25) return 'Weak';
  if (strength < 50) return 'Fair';
  if (strength < 75) return 'Good';
  return 'Strong';
});

const canCreateWallet = computed(() => {
  return password.value.length >= 8 && 
         password.value === confirmPassword.value &&
         passwordStrength.value >= 50;
});

const allVerificationFieldsFilled = computed(() => {
  return verificationPositions.value.every(pos => 
    verificationAnswers.value[pos] && verificationAnswers.value[pos].trim() !== ''
  );
});

const createWallet = async () => {
  isCreating.value = true;
  
  try {
    const wallet = ethers.Wallet.fromPhrase(mnemonic.value);
    const cryptoParams = await getCryptoParams(password.value);
    const encryptedMnemonic = await encrypt(mnemonic.value, cryptoParams);
    
    await saveWalletPassword(password.value);
    
    const encryptedPrivateKey = await encrypt(wallet.privateKey, cryptoParams);
    await saveEncryptedPrivateKey(wallet.address, encryptedPrivateKey);
    
    const account = {
      address: wallet.address,
      name: 'Account 1'
    };
    
    await saveContact(account);
    
    const settings = {
      encryptedMnemonic,
      isFirstTime: false,
      selectedAccount: wallet.address,
      selectedNetwork: 1,
      enableStorageEnctyption: false,
      encryptAfterEveryTx: false,
      lockOutEnabled: false,
      lockOutPeriod: 2,
      lockOutBlocked: false,
      theme: 'system' as const,
      lastLock: Date.now(),
      copyLowerCaseAddress: false,
      UUID: crypto.randomUUID()
    };
    
    await setSettings(settings);
    successAlertOpen.value = true;
    
  } catch (error) {
    console.error('Wallet creation error:', error);
    alertMsg.value = 'Error creating wallet. Please try again.';
    alertOpen.value = true;
  } finally {
    isCreating.value = false;
  }
};

const onWalletCreated = () => {
  successAlertOpen.value = false;
  router.push('/tabs/home');
};
</script>

<style scoped>
.step-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 500px;
  margin: 0 auto;
  padding: 0 8px;
}

.icon-container {
  margin-bottom: 12px;
}

h2 {
  color: var(--ion-color-primary);
  margin-bottom: 8px;
  font-size: 1.4rem;
}

.description {
  color: var(--ion-color-medium);
  margin-bottom: 16px;
  line-height: 1.4;
  font-size: 0.9rem;
}

.warning-card {
  margin: 12px 0;
  background: #fff3cd;
  border-left: 4px solid #ffc107;
  border-radius: 8px;
}

.warning-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: #856404;
  font-weight: 600;
}

.warning-list {
  margin: 0;
  padding-left: 20px;
  text-align: left;
}

.warning-list li {
  margin-bottom: 4px;
  color: #856404;
  font-size: 0.9rem;
  line-height: 1.3;
}

.mnemonic-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin: 16px 0;
  width: 100%;
}

.mnemonic-word {
  display: flex;
  align-items: center;
  padding: 8px;
  background: var(--ion-color-light);
  border-radius: 6px;
  border: 1px solid var(--ion-color-medium);
}

.word-number {
  font-size: 11px;
  color: var(--ion-color-medium);
  margin-right: 6px;
  min-width: 18px;
}

.word-text {
  font-weight: 500;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
}

.mnemonic-hidden {
  margin: 24px 0;
  padding: 24px;
  background: var(--ion-color-light);
  border-radius: 8px;
  color: var(--ion-color-medium);
}

.action-buttons {
  display: flex;
  gap: 8px;
  margin: 16px 0;
}

.confirmation-checkbox {
  margin: 16px 0;
  text-align: left;
  font-size: 0.9rem;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.confirmation-checkbox ion-checkbox {
  margin-top: 2px;
  flex-shrink: 0;
}

.confirmation-checkbox label {
  flex: 1;
  line-height: 1.4;
}

.continue-button {
  margin-top: 16px;
}

.verification-container {
  width: 100%;
  margin: 16px 0;
}

.verification-item {
  margin-bottom: 12px;
  text-align: left;
}

.verification-item label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
  color: var(--ion-color-primary);
  font-size: 0.9rem;
}

.password-strength {
  margin: 12px 0;
  text-align: left;
}

.strength-label {
  font-size: 0.85rem;
  margin-bottom: 4px;
  color: var(--ion-color-medium);
}

.strength-bar {
  height: 4px;
  background: var(--ion-color-light);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 4px;
}

.strength-fill {
  height: 100%;
  transition: width 0.3s ease, background-color 0.3s ease;
}

.strength-fill.weak {
  background-color: var(--ion-color-danger);
}

.strength-fill.fair {
  background-color: var(--ion-color-warning);
}

.strength-fill.good {
  background-color: var(--ion-color-secondary);
}

.strength-fill.strong {
  background-color: var(--ion-color-success);
}

.strength-text {
  font-size: 0.8rem;
  font-weight: 500;
}

ion-item {
  margin-bottom: 12px;
  --padding-start: 0;
  --padding-end: 0;
}

ion-button {
  margin-top: 8px;
  height: 44px;
}

ion-card-content {
  padding: 12px;
}

ion-content {
  --padding-top: 8px;
  --padding-bottom: 8px;
  --padding-start: 12px;
  --padding-end: 12px;
}

.action-buttons ion-button {
  height: 40px;
  font-size: 0.9rem;
}
</style>