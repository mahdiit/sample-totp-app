import { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonFab,
  IonFabButton,
  IonAlert,
  IonText,
} from '@ionic/react';
import { addOutline, trashOutline, timeOutline } from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../services/storage';
import { totpService } from '../services/totp';
import { AuthenticatorAccount } from '../types';

const AuthenticatorListPage: React.FC = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<AuthenticatorAccount[]>([]);
  const [totpCodes, setTotpCodes] = useState<Map<string, string>>(new Map());
  const [remainingTime, setRemainingTime] = useState(30);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      updateTOTPCodes();
    }, 1000);

    return () => clearInterval(interval);
  }, [accounts]);

  const loadAccounts = () => {
    const loadedAccounts = storageService.loadAccounts();
    setAccounts(loadedAccounts);
    updateTOTPCodes(loadedAccounts);
  };

  const updateTOTPCodes = (accountsList = accounts) => {
    const codes = new Map<string, string>();
    accountsList.forEach(account => {
      try {
        const code = totpService.generateTOTP(account);
        codes.set(account.id, code);
      } catch (error) {
        console.error(`Failed to generate TOTP for ${account.issuer}:`, error);
      }
    });
    setTotpCodes(codes);

    if (accountsList.length > 0) {
      const time = totpService.getRemainingTime(accountsList[0].period);
      setRemainingTime(time);
    }
  };

  const handleDeleteAccount = (id: string) => {
    setAccountToDelete(id);
    setShowDeleteAlert(true);
  };

  const confirmDelete = () => {
    if (accountToDelete) {
      const updatedAccounts = storageService.removeAccount(accountToDelete);
      setAccounts(updatedAccounts);
      updateTOTPCodes(updatedAccounts);
    }
  };

  const formatCode = (code: string): string => {
    if (code.length === 6) {
      return `${code.slice(0, 3)} ${code.slice(3)}`;
    }
    if (code.length === 8) {
      return `${code.slice(0, 4)} ${code.slice(4)}`;
    }
    return code;
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Authenticator</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {accounts.length === 0 ? (
          <div className="ion-text-center ion-padding-top">
            <IonText color="medium">
              <h2>No accounts yet</h2>
              <p>Tap the + button to add your first account</p>
            </IonText>
          </div>
        ) : (
          <>
            <div className="ion-padding-bottom ion-text-center">
              <IonText color="primary">
                <small>
                  <IonIcon icon={timeOutline} style={{ marginRight: '4px' }} />
                  Time remaining: {remainingTime}s
                </small>
              </IonText>
            </div>

            <IonList>
              {accounts.map(account => (
                <IonItem key={account.id} button>
                  <IonLabel>
                    <h2>{account.issuer}</h2>
                    <p>{account.account}</p>
                    <IonText color="primary">
                      <h1 style={{ fontSize: '24px', fontWeight: 'bold', letterSpacing: '2px' }}>
                        {formatCode(totpCodes.get(account.id) || '------')}
                      </h1>
                    </IonText>
                  </IonLabel>
                  <IonButton
                    fill="clear"
                    color="danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAccount(account.id);
                    }}
                  >
                    <IonIcon slot="icon-only" icon={trashOutline} />
                  </IonButton>
                </IonItem>
              ))}
            </IonList>
          </>
        )}

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => navigate('/scanner')}>
            <IonIcon icon={addOutline} />
          </IonFabButton>
        </IonFab>

        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header="Delete Account"
          message="Are you sure you want to delete this account? This action cannot be undone."
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
            },
            {
              text: 'Delete',
              role: 'destructive',
              handler: confirmDelete,
            },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default AuthenticatorListPage;