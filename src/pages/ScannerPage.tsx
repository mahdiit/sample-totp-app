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
} from '@ionic/react';
import { cameraOutline } from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { totpService } from '../services/totp';
import { storageService } from '../services/storage';
import { AuthenticatorAccount } from '../types';

const ScannerPage: React.FC = () => {
  const navigate = useNavigate();
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [manualEntry, setManualEntry] = useState({
    issuer: '',
    account: '',
    secret: '',
  });

  const handleScanBarcode = async () => {
    try {
      // In a real app, this would use @capacitor/barcode-scanner
      // For demo purposes, we'll simulate a scan
      const simulatedQRCode = 'otpauth://totp/Example:alice@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Example';
      
      const parsed = totpService.parseOTPAuthURI(simulatedQRCode);
      
      if (!parsed) {
        setAlertMessage('Invalid QR code format');
        setShowAlert(true);
        return;
      }

      const newAccount: AuthenticatorAccount = {
        ...parsed,
        id: Date.now().toString(),
        createdAt: Date.now(),
      };

      storageService.addAccount(newAccount);
      navigate('/');
    } catch (error) {
      setAlertMessage('Failed to scan QR code');
      setShowAlert(true);
    }
  };

  const handleManualEntry = () => {
    if (!manualEntry.secret || !manualEntry.issuer) {
      setAlertMessage('Please fill in all required fields');
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
          <IonTitle>Add Account</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonButton
          expand="block"
          onClick={handleScanBarcode}
          className="ion-margin-top"
        >
          <IonIcon slot="start" icon={cameraOutline} />
          Scan QR Code
        </IonButton>

        <div className="ion-margin-top ion-margin-bottom">
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
              placeholder="Enter secret key"
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