import i18n from 'i18next';
import { initReactI18next, useTranslation as useTranslationOriginal } from 'react-i18next';

// Types
export type Language = 'en' | 'fr' | 'it';

export const languages: Record<Language, string> = {
  en: 'English',
  fr: 'Français', 
  it: 'Italiano'
};

// Translation resources
export const translations = {
  en: {
    // Auth
    login: 'Login',
    logout: 'Logout',
    email: 'Email',
    password: 'Password',
    forgotPassword: 'Forgot Password?',
    resetPassword: 'Reset Password',
    register: 'Register',
    firstName: 'First Name',
    lastName: 'Last Name',
    
    // Navigation
    navigation: 'Navigation',
    dashboard: 'Dashboard',
    inventory: 'Inventory',
    'kitchen-inventory': 'Kitchen Inventory',
    checklists: 'Checklists',
    communication: 'Communication',
    cashRegister: 'Cash Register',
    reports: 'Reports',
    equipment: 'Equipment',
    userManagement: 'User Management',
    suppliers: 'Suppliers',
    tasks: 'Tasks',
    finance: 'Finance',
    administration: 'Administration',
    maintenance: 'Maintenance',
    financial: 'Financial',
    
    // Common
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    add: 'Add',
    search: 'Search',
    filter: 'Filter',
    loading: 'Loading...',
    total: 'Total',
    date: 'Date',
    status: 'Status',
    name: 'Name',
    description: 'Description',
    quantity: 'Quantity',
    notes: 'Notes',
    welcome: 'Welcome',

    // Communication System
    communication: {
      selectChat: 'Select a conversation',
      selectChatDescription: 'Choose from your conversations to start messaging',
      typing: 'typing...',
      sending: 'Sending',
      chatTypes: {
        private: 'Private Chat',
        group: 'Group Chat',
        global: 'General Discussion',
        announcements: 'Announcements'
      },
      participantsCount: '{{count}} participants',
      
      // Messages
      messageInput: 'Type a message...',
      sendMessage: 'Send message',
      replyTo: 'Reply to {{name}}',
      editMessage: 'Edit message',
      deleteMessage: 'Delete message',
      messageDeleted: 'This message was deleted',
      messageEdited: 'edited',
      
      // Media
      uploadImage: 'Upload Image',
      uploadFile: 'Upload File',
      recordVoice: 'Record Voice',
      uploading: 'Uploading...',
      uploadFailed: 'Upload failed',
      retry: 'Retry',
      cancel: 'Cancel',
      
      // Emoji
      searchEmojis: 'Search emojis...',
      recentEmojis: 'Recently Used',
      frequentEmojis: 'Frequently Used',
      
      // Connection Requests
      connectionRequests: 'Connection Requests',
      sendRequest: 'Send Connection Request',
      acceptRequest: 'Accept',
      declineRequest: 'Decline',
      pending: 'Pending',
      accepted: 'Accepted',
      declined: 'Declined',
      recipientEmail: 'Recipient Email',
      requestMessage: 'Optional Message',
      sendConnectionRequest: 'Send Request',
      incomingRequests: 'Incoming',
      outgoingRequests: 'Outgoing',
      acceptedConnections: 'Connections',
      noRequests: 'No connection requests',
      requestSent: 'Connection request sent',
      requestAccepted: 'Connection request accepted',
      requestDeclined: 'Connection request declined',
      
      // Group Management  
      createGroup: 'Create Group',
      groupName: 'Group Name',
      groupDescription: 'Group Description (optional)',
      selectParticipants: 'Select Participants',
      createNewGroup: 'Create New Group',
      groupInfo: 'Group Info',
      participants: 'Participants',
      addParticipants: 'Add Participants',
      removeParticipant: 'Remove from group',
      makeAdmin: 'Make Admin',
      leaveGroup: 'Leave Group',
      deleteGroup: 'Delete Group',
      groupCreated: 'Group created successfully',
      groupUpdated: 'Group updated successfully',
      participantAdded: 'Participant added',
      participantRemoved: 'Participant removed',
      leftGroup: 'You left the group',
      groupDeleted: 'Group deleted',
      
      // Notifications
      newMessage: 'New message from {{name}}',
      newGroupMessage: 'New message in {{groupName}}',
      connectionRequestReceived: 'New connection request from {{name}}',
      muteChat: 'Mute notifications',
      unmuteChat: 'Unmute notifications',
      mutedUntil: 'Muted until {{time}}',
      
      // Status
      online: 'Online',
      offline: 'Offline',
      lastSeen: 'Last seen {{time}}',
      delivered: 'Delivered',
      read: 'Read',
      
      // Time formatting
      now: 'now',
      yesterday: 'yesterday',
      today: 'today',
      
      // Errors
      errorLoadingChats: 'Error loading chats',
      errorSendingMessage: 'Failed to send message',
      errorUploadingFile: 'Failed to upload file',
      errorCreatingGroup: 'Failed to create group',
      errorJoiningGroup: 'Failed to join group',
      connectionRequired: 'Connection required to start private chat'
    }
  },
  
  fr: {
    // Auth
    login: 'Connexion',
    logout: 'Déconnexion',
    email: 'Email',
    password: 'Mot de passe',
    forgotPassword: 'Mot de passe oublié ?',
    resetPassword: 'Réinitialiser le mot de passe',
    register: 'S\'inscrire',
    firstName: 'Prénom',
    lastName: 'Nom',
    
    // Navigation
    navigation: 'Navigation',
    dashboard: 'Tableau de bord',
    inventory: 'Inventaire',
    'kitchen-inventory': 'Inventaire Cuisine',
    checklists: 'Listes de contrôle',
    communication: 'Communication',
    cashRegister: 'Caisse',
    reports: 'Rapports',
    equipment: 'Équipement',
    userManagement: 'Gestion des utilisateurs',
    suppliers: 'Fournisseurs',
    tasks: 'Tâches',
    finance: 'Finance',
    administration: 'Administration',
    maintenance: 'Maintenance',
    financial: 'Financier',
    
    // Common
    save: 'Enregistrer',
    cancel: 'Annuler',
    edit: 'Modifier',
    delete: 'Supprimer',
    add: 'Ajouter',
    search: 'Rechercher',
    filter: 'Filtrer',
    loading: 'Chargement...',
    total: 'Total',
    date: 'Date',
    status: 'Statut',
    name: 'Nom',
    description: 'Description',
    quantity: 'Quantité',
    notes: 'Notes',
    welcome: 'Bienvenue',

    // Communication System - French translations
    communication: {
      selectChat: 'Sélectionner une conversation',
      selectChatDescription: 'Choisissez parmi vos conversations pour commencer à échanger',
      typing: 'en train d\'écrire...',
      sending: 'Envoi en cours',
      chatTypes: {
        private: 'Chat Privé',
        group: 'Chat de Groupe',
        global: 'Discussion Générale',
        announcements: 'Annonces'
      },
      participantsCount: '{{count}} participants',
      
      messageInput: 'Tapez un message...',
      sendMessage: 'Envoyer le message',
      replyTo: 'Répondre à {{name}}',
      editMessage: 'Modifier le message',
      deleteMessage: 'Supprimer le message',
      messageDeleted: 'Ce message a été supprimé',
      messageEdited: 'modifié',
      
      uploadImage: 'Télécharger une Image',
      uploadFile: 'Télécharger un Fichier',
      recordVoice: 'Enregistrer la Voix',
      uploading: 'Téléchargement...',
      uploadFailed: 'Échec du téléchargement',
      retry: 'Réessayer',
      cancel: 'Annuler',
      
      searchEmojis: 'Rechercher des emojis...',
      recentEmojis: 'Récemment Utilisés',
      frequentEmojis: 'Fréquemment Utilisés',
      
      connectionRequests: 'Demandes de Connexion',
      sendRequest: 'Envoyer une Demande',
      acceptRequest: 'Accepter',
      declineRequest: 'Refuser',
      pending: 'En attente',
      accepted: 'Accepté',
      declined: 'Refusé',
      recipientEmail: 'Email du Destinataire',
      requestMessage: 'Message Optionnel',
      sendConnectionRequest: 'Envoyer la Demande',
      incomingRequests: 'Reçues',
      outgoingRequests: 'Envoyées',
      acceptedConnections: 'Connexions',
      noRequests: 'Aucune demande de connexion',
      
      createGroup: 'Créer un Groupe',
      groupName: 'Nom du Groupe',
      groupDescription: 'Description du Groupe (optionnel)',
      selectParticipants: 'Sélectionner les Participants',
      createNewGroup: 'Créer un Nouveau Groupe',
      groupInfo: 'Infos du Groupe',
      participants: 'Participants',
      addParticipants: 'Ajouter des Participants',
      removeParticipant: 'Retirer du groupe',
      makeAdmin: 'Nommer Admin',
      leaveGroup: 'Quitter le Groupe',
      deleteGroup: 'Supprimer le Groupe',
      
      newMessage: 'Nouveau message de {{name}}',
      newGroupMessage: 'Nouveau message dans {{groupName}}',
      connectionRequestReceived: 'Nouvelle demande de connexion de {{name}}',
      muteChat: 'Couper les notifications',
      unmuteChat: 'Réactiver les notifications',
      
      online: 'En ligne',
      offline: 'Hors ligne',
      lastSeen: 'Vu pour la dernière fois {{time}}',
      delivered: 'Livré',
      read: 'Lu',
      
      now: 'maintenant',
      yesterday: 'hier',
      today: 'aujourd\'hui',
      
      errorLoadingChats: 'Erreur lors du chargement des chats',
      errorSendingMessage: 'Échec de l\'envoi du message',
      errorUploadingFile: 'Échec du téléchargement du fichier',
      connectionRequired: 'Connexion requise pour démarrer un chat privé'
    }
  },
  
  it: {
    // Auth
    login: 'Accedi',
    logout: 'Esci',
    email: 'Email',
    password: 'Password',
    forgotPassword: 'Password dimenticata?',
    resetPassword: 'Reimposta password',
    register: 'Registrati',
    firstName: 'Nome',
    lastName: 'Cognome',
    
    // Navigation
    navigation: 'Navigazione',
    dashboard: 'Dashboard',
    inventory: 'Inventario',
    'kitchen-inventory': 'Inventario Cucina',
    checklists: 'Liste di controllo',
    communication: 'Comunicazione',
    cashRegister: 'Cassa',
    reports: 'Report',
    equipment: 'Attrezzature',
    userManagement: 'Gestione utenti',
    suppliers: 'Fornitori',
    tasks: 'Compiti',
    finance: 'Finanza',
    administration: 'Amministrazione',
    maintenance: 'Manutenzione',
    financial: 'Finanziario',
    
    // Common
    save: 'Salva',
    cancel: 'Annulla',
    edit: 'Modifica',
    delete: 'Elimina',
    add: 'Aggiungi',
    search: 'Cerca',
    filter: 'Filtra',
    loading: 'Caricamento...',
    total: 'Totale',
    date: 'Data',
    status: 'Stato',
    name: 'Nome',
    description: 'Descrizione',
    quantity: 'Quantità',
    notes: 'Note',
    welcome: 'Benvenuto',

    // Communication System - Italian translations
    communication: {
      selectChat: 'Seleziona una conversazione',
      selectChatDescription: 'Scegli tra le tue conversazioni per iniziare a messaggiare',
      typing: 'sta scrivendo...',
      sending: 'Invio in corso',
      chatTypes: {
        private: 'Chat Privata',
        group: 'Chat di Gruppo',
        global: 'Discussione Generale',
        announcements: 'Annunci'
      },
      participantsCount: '{{count}} partecipanti',
      
      messageInput: 'Scrivi un messaggio...',
      sendMessage: 'Invia messaggio',
      replyTo: 'Rispondi a {{name}}',
      editMessage: 'Modifica messaggio',
      deleteMessage: 'Elimina messaggio',
      messageDeleted: 'Questo messaggio è stato eliminato',
      messageEdited: 'modificato',
      
      uploadImage: 'Carica Immagine',
      uploadFile: 'Carica File',
      recordVoice: 'Registra Voce',
      uploading: 'Caricamento...',
      uploadFailed: 'Caricamento fallito',
      retry: 'Riprova',
      cancel: 'Annulla',
      
      searchEmojis: 'Cerca emoji...',
      recentEmojis: 'Usati di Recente',
      frequentEmojis: 'Usati Frequentemente',
      
      connectionRequests: 'Richieste di Connessione',
      sendRequest: 'Invia Richiesta',
      acceptRequest: 'Accetta',
      declineRequest: 'Rifiuta',
      pending: 'In attesa',
      accepted: 'Accettato',
      declined: 'Rifiutato',
      recipientEmail: 'Email del Destinatario',
      requestMessage: 'Messaggio Opzionale',
      sendConnectionRequest: 'Invia Richiesta',
      incomingRequests: 'Ricevute',
      outgoingRequests: 'Inviate',
      acceptedConnections: 'Connessioni',
      noRequests: 'Nessuna richiesta di connessione',
      
      createGroup: 'Crea Gruppo',
      groupName: 'Nome del Gruppo',
      groupDescription: 'Descrizione del Gruppo (opzionale)',
      selectParticipants: 'Seleziona Partecipanti',
      createNewGroup: 'Crea Nuovo Gruppo',
      groupInfo: 'Info Gruppo',
      participants: 'Partecipanti',
      addParticipants: 'Aggiungi Partecipanti',
      removeParticipant: 'Rimuovi dal gruppo',
      makeAdmin: 'Rendi Admin',
      leaveGroup: 'Lascia il Gruppo',
      deleteGroup: 'Elimina Gruppo',
      
      newMessage: 'Nuovo messaggio da {{name}}',
      newGroupMessage: 'Nuovo messaggio in {{groupName}}',
      connectionRequestReceived: 'Nuova richiesta di connessione da {{name}}',
      muteChat: 'Silenzia notifiche',
      unmuteChat: 'Riattiva notifiche',
      
      online: 'Online',
      offline: 'Offline',
      lastSeen: 'Visto l\'ultima volta {{time}}',
      delivered: 'Consegnato',
      read: 'Letto',
      
      now: 'ora',
      yesterday: 'ieri',
      today: 'oggi',
      
      errorLoadingChats: 'Errore nel caricamento delle chat',
      errorSendingMessage: 'Invio messaggio fallito',
      errorUploadingFile: 'Caricamento file fallito',
      connectionRequired: 'Connessione richiesta per iniziare una chat privata'
    }
  }
};

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: translations.en },
      fr: { translation: translations.fr },
      it: { translation: translations.it }
    },
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React already escapes by default
    }
  });

// Custom hook for translations with language parameter
export const useTranslation = (language?: Language) => {
  // Update i18n language if provided
  if (language && i18n.language !== language) {
    i18n.changeLanguage(language);
  }
  
  return useTranslationOriginal();
};

export default i18n;