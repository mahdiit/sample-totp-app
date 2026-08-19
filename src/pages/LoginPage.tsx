import { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonInput,
  IonAlert,
  IonText,
  IonIcon,
  IonCheckbox,
  IonLabel,
  IonItem,
} from '@ionic/react';
import { fingerPrintOutline, lockClosedOutline } from 'ionicons/icons';
import { authService } from '../services/authService';

interface LoginPageProps {
  onUnlock: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onUnlock }) => {
  const [mode, setMode] = useState<'setup' | 'unlock'>('unlock');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [enableBiometric, setEnableBiometric] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [busy, setBusy] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    authService
      .isBiometricSupported()
      .then(setBiometricSupported)
      .catch(() => setBiometricSupported(false));

    if (authService.hasSecuritySetup()) {
      setMode('unlock');
    } else {
      setMode('setup');
    }
  }, []);

  const err = (message: string) => {
    setAlertMessage(message);
    setShowAlert(true);
  };

  const handleSetup = async () => {
    if (pin.length < 4) return err('Please choose a PIN with at least 4 digits');
    if (pin !== confirmPin) return err('PINs do not match');
    if (enableBiometric && !biometricSupported) {
      return err('Biometrics are not available on this device. Set a PIN only.');
    }

    setBusy(true);
    try {
      await authService.setup(pin, enableBiometric);
      onUnlock();
    } catch (error: any) {
      setEnableBiometric(false);
      err(error?.message || 'Biometric setup failed. Please set a PIN only.');
    } finally {
      setBusy(false);
    }
  };

  const handleBiometricUnlock = async () => {
    setBusy(true);
    try {
      const ok = await authService.verifyBiometric();
      if (ok) {
        onUnlock();
      } else {
        err('Biometric verification failed');
      }
    } catch (error: any) {
      err(error?.message || 'Biometric verification failed');
    } finally {
      setBusy(false);
    }
  };

  const handlePinUnlock = async () => {
    setBusy(true);
    try {
      const ok = await authService.verifyPin(pin);
      if (ok) {
        onUnlock();
      } else {
        err('Incorrect PIN');
        setPin('');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Authenticator</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="ion-text-center ion-padding-top">
          <IonIcon
            icon={lockClosedOutline}
            color="primary"
            style={{ fontSize: '64px' }}
          />
          <h2>{mode === 'setup' ? 'Set Up Security' : 'Welcome Back'}</h2>
          <p>
            <IonText color="medium">
              {mode === 'setup'
                ? 'Protect your authenticator accounts with a PIN and optional biometric unlock.'
                : 'Unlock to view your accounts.'}
            </IonText>
          </p>
        </div>

        {mode === 'setup' ? (
          <div className="ion-padding-top">
            <IonLabel position="stacked">Create a PIN (at least 4 digits)</IonLabel>
            <IonInput
              type="password"
              inputmode="numeric"
              value={pin}
              placeholder="Enter PIN"
              onIonInput={(e) => setPin(e.detail.value!)}
            />
            <IonLabel position="stacked">Confirm PIN</IonLabel>
            <IonInput
              type="password"
              inputmode="numeric"
              value={confirmPin}
              placeholder="Confirm PIN"
              onIonInput={(e) => setConfirmPin(e.detail.value!)}
            />

            {biometricSupported && (
              <IonItem
                lines="none"
                className="ion-margin-top"
              >
                <IonIcon slot="start" icon={fingerPrintOutline} />
                <IonLabel>Enable biometric unlock</IonLabel>
                <IonCheckbox
                  slot="end"
                  checked={enableBiometric}
                  onIonChange={(e) => setEnableBiometric(e.detail.checked)}
                />
              </IonItem>
            )}

            <IonButton
              expand="block"
              onClick={handleSetup}
              disabled={busy}
              className="ion-margin-top"
            >
              Set Up &amp; Unlock
            </IonButton>
          </div>
        ) : (
          <div className="ion-padding-top">
            <IonLabel position="stacked">Enter PIN</IonLabel>
            <IonInput
              type="password"
              inputmode="numeric"
              value={pin}
              placeholder="Enter PIN"
              onIonInput={(e) => setPin(e.detail.value!)}
            />
            <IonButton
              expand="block"
              onClick={handlePinUnlock}
              disabled={busy}
              className="ion-margin-top"
            >
              Unlock
            </IonButton>

            {authService.getSecurityState().hasBiometric ? (
              <IonButton
                expand="block"
                fill="outline"
                onClick={handleBiometricUnlock}
                disabled={busy}
                className="ion-margin-top"
              >
                <IonIcon slot="start" icon={fingerPrintOutline} />
                Unlock with Biometrics
              </IonButton>
            ) : (
              <p className="ion-text-center">
                <IonText color="medium">
                  <small>Biometrics not configured — use your PIN.</small>
                </IonText>
              </p>
            )}
          </div>
        )}

        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          message={alertMessage}
          buttons={['OK']}
        />
      </IonContent>
    </IonPage>
  );
};

export default LoginPage;
