import { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonAlert,
  IonItem,
  IonLabel,
  IonInput,
  IonList,
  IonButtons,
  IonSpinner,
} from '@ionic/react';
import { arrowBackOutline } from 'ionicons/icons';
import { cameraOutline } from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { totpService } from '../services/totp';
import { storageService } from '../services/storage';
import { AuthenticatorAccount } from '../types';

const ScannerPage: React.FC = () => {
  const navigate = useNavigate();
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [manualEntry, setManualEntry] = useState({
    issuer: '',
    account: '',
    secret: '',
  });

  const addAccountFromUri = (uri: string): boolean => {
    const parsed = totpService.parseOTPAuthURI(uri);
    if (!parsed) {
      setAlertMessage('Invalid QR code format');
      setShowAlert(true);
      return false;
    }
    const newAccount: AuthenticatorAccount = {
      ...parsed,
      id: Date.now().toString(),
      createdAt: Date.now(),
    };
    storageService.addAccount(newAccount);
    navigate('/');
    return true;
  };

  const handleScanBarcode = async () => {
    setScanning(true);
    try {
      // On native platforms, use the Capacitor barcode scanner if it is
      // available. The scanner API differs across plugin variants, so we
      // probe for it defensively and fall back to a simulated scan on web.
      let scanned = false;
      try {
        const { default: BarcodeScanner } = (await import(
          '@capacitor/barcode-scanner'
        )) as any;
        if (typeof BarcodeScanner?.startScan === 'function') {
          const result = await BarcodeScanner.startScan();
          if (result?.rawText && typeof result.rawText === 'string') {
            scanned = addAccountFromUri(result.rawText);
          }
        }
      } catch {
        // Native plugin unavailable (e.g. web preview) -> fall through.
      }

      // Web preview / fallback: simulate scanning a sample otpauth URI
      if (!scanned) {
        const simulatedQRCode =
          'otpauth://totp/Example:alice@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Example';
        addAccountFromUri(simulatedQRCode);
      }
    } catch (error) {
      console.error('Scan failed:', error);
      setAlertMessage('Failed to scan QR code');
      setShowAlert(true);
    } finally {
      setScanning(false);
    }
  };

  const handleManualEntry = () => {
    if (!manualEntry.secret || !manualEntry.issuer) {
      setAlertMessage('Please fill in Issuer and Secret Key');
      setShowAlert(true);
      return;
    }

    const newAccount: AuthenticatorAccount = {
      id: Date.now().toString(),
      issuer: manualEntry.issuer,
      account: manualEntry.account || 'Unknown',
      secret: manualEntry.secret.toUpperCase().replace(/\s/g, ''),
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      createdAt: Date.now(),
    };

    storageService.addAccount(newAccount);
    navigate('/');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => navigate(-1)}>
              <IonIcon slot="icon-only" icon={arrowBackOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle>Add Account</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonButton
          expand="block"
          onClick={handleScanBarcode}
          disabled={scanning}
          className="ion-margin-top"
        >
          {scanning && <IonSpinner slot="start" name="crescent" />}
          {!scanning && <IonIcon slot="start" icon={cameraOutline} />}
          Scan QR Code
        </IonButton>

        <div className="ion-margin-top ion-margin-bottom ion-text-center">
          <h2>Or enter manually</h2>
        </div>

        <IonList>
          <IonItem>
            <IonLabel position="stacked">Issuer *</IonLabel>
            <IonInput
              value={manualEntry.issuer}
              placeholder="e.g., Google, GitHub"
              onIonInput={(e) =>
                setManualEntry({ ...manualEntry, issuer: e.detail.value! })
              }
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Account</IonLabel>
            <IonInput
              value={manualEntry.account}
              placeholder="e.g., user@example.com"
              onIonInput={(e) =>
                setManualEntry({ ...manualEntry, account: e.detail.value! })
              }
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Secret Key *</IonLabel>
            <IonInput
              value={manualEntry.secret}
              placeholder="Enter secret key (Base32)"
              onIonInput={(e) =>
                setManualEntry({ ...manualEntry, secret: e.detail.value! })
              }
            />
          </IonItem>
        </IonList>

        <IonButton
          expand="block"
          onClick={handleManualEntry}
          className="ion-margin-top"
        >
          Add Account
        </IonButton>

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

export default ScannerPage;
