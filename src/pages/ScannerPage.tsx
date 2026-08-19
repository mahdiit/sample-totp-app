import { useState, useRef, useEffect } from 'react';
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
} from '@ionic/react';
import { arrowBackOutline, cameraOutline, closeOutline } from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { totpService } from '../services/totp';
import { storageService } from '../services/storage';
import { AuthenticatorAccount } from '../types';

const QR_READER_ID = 'qr-reader';

const ScannerPage: React.FC = () => {
  const navigate = useNavigate();
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [scannerStarting, setScannerStarting] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [manualEntry, setManualEntry] = useState({
    issuer: '',
    account: '',
    secret: '',
  });

  const addAccountFromUri = (uri: string): boolean => {
    const parsed = totpService.parseOTPAuthURI(uri);
    if (!parsed) {
      setAlertMessage('Invalid QR code format. Please scan an otpauth:// QR or add it manually.');
      setShowAlert(true);
      return false;
    }
    const newAccount: AuthenticatorAccount = {
      ...parsed,
      id: Date.now().toString(),
      createdAt: Date.now(),
    };
    storageService.addAccount(newAccount);
    return true;
  };

  // Clean up the camera when the page is left
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const stopScanner = async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (scanner) {
      try {
        await scanner.stop();
        scanner.clear();
      } catch (error) {
        console.warn('Error stopping scanner:', error);
      }
    }
  };

  const handleScanBarcode = async () => {
    setScannerActive(true);
    setScannerStarting(true);
  };

  // Start the camera once the reader div is rendered
  useEffect(() => {
    if (!scannerActive) return;

    let cancelled = false;

    const start = async () => {
      setScannerStarting(true);
      try {
        const scanner = new Html5Qrcode(QR_READER_ID);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          async (decodedText) => {
            if (cancelled) return;
            const added = addAccountFromUri(decodedText.trim());
            if (added) {
              await stopScanner();
              setScannerActive(false);
              navigate('/');
            }
          },
          () => {
            // Decode error callback - ignore individual frame failures
          }
        );
      } catch (error) {
        console.error('Failed to start camera:', error);
        setAlertMessage(
          'Could not access the camera. Please allow camera permission or add the account manually.'
        );
        setShowAlert(true);
        setScannerActive(false);
      } finally {
        if (!cancelled) setScannerStarting(false);
      }
    };

    start();

    return () => {
      cancelled = true;
      stopScanner();
    };
  }, [scannerActive]);

  const handleCloseScanner = async () => {
    await stopScanner();
    setScannerActive(false);
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
            <IonButton onClick={scannerActive ? handleCloseScanner : () => navigate(-1)}>
              <IonIcon slot="icon-only" icon={scannerActive ? closeOutline : arrowBackOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle>{scannerActive ? 'Scan QR Code' : 'Add Account'}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {scannerActive ? (
          <div className="ion-text-center">
            <p color="medium">Point your camera at a TOTP QR code (otpauth://)</p>
            <div
              id={QR_READER_ID}
              style={{
                width: '100%',
                maxWidth: '360px',
                margin: '0 auto',
              }}
            />
            {scannerStarting && (
              <p>
                <IonLabel color="medium">Starting camera...</IonLabel>
              </p>
            )}
            <IonButton onClick={handleCloseScanner} color="medium">
              {' '}
              <IonIcon slot="start" icon={closeOutline} />
              Cancel
            </IonButton>
          </div>
        ) : (
          <>
            <IonButton
              expand="block"
              onClick={handleScanBarcode}
              className="ion-margin-top"
            >
              <IonIcon slot="start" icon={cameraOutline} />
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
          </>
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

export default ScannerPage;
