import { useState, useEffect, useCallback } from 'react';
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
  IonProgressBar,
} from '@ionic/react';
import { addOutline, trashOutline, timeOutline } from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../services/storage';
import { totpService } from '../services/totp';
import { AuthenticatorAccount } from '../types';

const AuthenticatorListPage: React.FC = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<AuthenticatorAccount[]>([]);
  const [codes, setCodes] = useState<Map<string, string>>(new Map());
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);

  useEffect(() => {
    setAccounts(storageService.loadAccounts());
  }, []);

  const refresh = useCallback(
    (list: AuthenticatorAccount[] = accounts) => {
      const next = new Map<string, string>();
      for (const account of list) {
        try {
          next.set(account.id, totpService.generateTOTP(account));
        } catch (error) {
          console.error(`Failed to generate TOTP for ${account.issuer}:`, error);
        }
      }
      setCodes(next);
      const first = list[0];
      if (first) {
        setSecondsLeft(totpService.getRemainingTime(first.period));
      }
    },
    [accounts]
  );

  useEffect(() => {
    refresh();
    const interval = setInterval(() => refresh(), 1000);
    return () => clearInterval(interval);
  }, [refresh]);

  const handleDeleteClick = (id: string) => {
    setAccountToDelete(id);
    setShowDeleteAlert(true);
  };

  const confirmDelete = () => {
    if (accountToDelete) {
      const updated = storageService.removeAccount(accountToDelete);
      setAccounts(updated);
      refresh(updated);
    }
  };

  const formatCode = (code: string): string => {
    if (code.length === 6) return `${code.slice(0, 3)} ${code.slice(3)}`;
    if (code.length === 8) return `${code.slice(0, 4)} ${code.slice(4)}`;
    return code;
  };

  const period = accounts[0]?.period || 30;
  const progress = secondsLeft / period;

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
                  <IonIcon
                    icon={timeOutline}
                    style={{ verticalAlign: 'middle', marginRight: '4px' }}
                  />
                  Time remaining: {secondsLeft}s
                </small>
              </IonText>
              <IonProgressBar
                value={progress}
                color="primary"
                style={{ margin: '8px 0' }}
              />
            </div>

            <IonList>
              {accounts.map(account => (
                <IonItem key={account.id}>
                  <IonLabel>
                    <h2>{account.issuer}</h2>
                    <p>{account.account}</p>
                    <h1
                      style={{
                        fontSize: '28px',
                        fontWeight: 'bold',
                        letterSpacing: '3px',
                        color: '#3880ff',
                      }}
                    >
                      {formatCode(codes.get(account.id) || '------')}
                    </h1>
                  </IonLabel>
                  <IonButton
                    fill="clear"
                    color="danger"
                    onClick={() => handleDeleteClick(account.id)}
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
            { text: 'Cancel', role: 'cancel' },
            { text: 'Delete', role: 'destructive', handler: confirmDelete },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default AuthenticatorListPage;
