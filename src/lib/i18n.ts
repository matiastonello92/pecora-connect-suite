// Simple internationalization system for PecoraNegra
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
    chat: 'CHAT',
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
    'communication.selectChat': 'Select a conversation',
    'communication.selectChatDescription': 'Choose from your conversations to start messaging',
    'communication.typing': 'typing...',
    'communication.sending': 'Sending',
    'communication.chatTypes.private': 'Private Chat',
    'communication.chatTypes.group': 'Group Chat',
    'communication.chatTypes.global': 'General Discussion',
    'communication.chatTypes.announcements': 'Announcements',
    'communication.participantsCount': '{{count}} participants',
    
    // Messages
    'communication.messageInput': 'Type a message...',
    'communication.sendMessage': 'Send message',
    'communication.replyTo': 'Reply to {{name}}',
    'communication.editMessage': 'Edit message',
    'communication.deleteMessage': 'Delete message',
    'communication.messageDeleted': 'This message was deleted',
    'communication.messageEdited': 'edited',
    
    // Media
    'communication.uploadImage': 'Upload Image',
    'communication.uploadFile': 'Upload File',
    'communication.recordVoice': 'Record Voice',
    'communication.uploading': 'Uploading...',
    'communication.uploadFailed': 'Upload failed',
    'communication.retry': 'Retry',
    'communication.cancel': 'Cancel',
    
    // Emoji
    'communication.searchEmojis': 'Search emojis...',
    'communication.recentEmojis': 'Recently Used',
    'communication.frequentEmojis': 'Frequently Used',
    
    // Connection Requests
    'communication.connectionRequests': 'Connection Requests',
    'communication.sendRequest': 'Send Connection Request',
    'communication.acceptRequest': 'Accept',
    'communication.declineRequest': 'Decline',
    'communication.pending': 'Pending',
    'communication.accepted': 'Accepted',
    'communication.declined': 'Declined',
    'communication.recipientEmail': 'Recipient Email',
    'communication.requestMessage': 'Optional Message',
    'communication.sendConnectionRequest': 'Send Request',
    'communication.incomingRequests': 'Incoming',
    'communication.outgoingRequests': 'Outgoing',
    'communication.acceptedConnections': 'Connections',
    'communication.noRequests': 'No connection requests',
    'communication.requestSent': 'Connection request sent',
    'communication.requestAccepted': 'Connection request accepted',
    'communication.requestDeclined': 'Connection request declined',
    
    // Group Management  
    'communication.createGroup': 'Create Group',
    'communication.groupName': 'Group Name',
    'communication.groupDescription': 'Group Description (optional)',
    'communication.selectParticipants': 'Select Participants',
    'communication.createNewGroup': 'Create New Group',
    'communication.groupInfo': 'Group Info',
    'communication.participants': 'Participants',
    'communication.addParticipants': 'Add Participants',
    'communication.removeParticipant': 'Remove from group',
    'communication.makeAdmin': 'Make Admin',
    'communication.leaveGroup': 'Leave Group',
    'communication.deleteGroup': 'Delete Group',
    'communication.groupCreated': 'Group created successfully',
    'communication.groupUpdated': 'Group updated successfully',
    'communication.participantAdded': 'Participant added',
    'communication.participantRemoved': 'Participant removed',
    'communication.leftGroup': 'You left the group',
    'communication.groupDeleted': 'Group deleted',
    
    // Notifications
    'communication.newMessage': 'New message from {{name}}',
    'communication.newGroupMessage': 'New message in {{groupName}}',
    'communication.connectionRequestReceived': 'New connection request from {{name}}',
    'communication.muteChat': 'Mute notifications',
    'communication.unmuteChat': 'Unmute notifications',
    'communication.mutedUntil': 'Muted until {{time}}',
    
    // Status
    'communication.online': 'Online',
    'communication.offline': 'Offline',
    'communication.lastSeen': 'Last seen {{time}}',
    'communication.delivered': 'Delivered',
    'communication.read': 'Read',
    
    // Time formatting
    'communication.now': 'now',
    'communication.yesterday': 'yesterday',
    'communication.today': 'today',
    
    // Errors
    'communication.errorLoadingChats': 'Error loading chats',
    'communication.errorSendingMessage': 'Failed to send message',
    'communication.errorUploadingFile': 'Failed to upload file',
    'communication.errorCreatingGroup': 'Failed to create group',
    'communication.errorJoiningGroup': 'Failed to join group',
    'communication.connectionRequired': 'Connection required to start private chat'
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
    chat: 'CHAT',
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
    'communication.selectChat': 'Sélectionner une conversation',
    'communication.selectChatDescription': 'Choisissez parmi vos conversations pour commencer à échanger',
    'communication.typing': 'en train d\'écrire...',
    'communication.sending': 'Envoi en cours',
    'communication.chatTypes.private': 'Chat Privé',
    'communication.chatTypes.group': 'Chat de Groupe',
    'communication.chatTypes.global': 'Discussion Générale',
    'communication.chatTypes.announcements': 'Annonces',
    'communication.participantsCount': '{{count}} participants'
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
    chat: 'CHAT',
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
    'communication.selectChat': 'Seleziona una conversazione',
    'communication.selectChatDescription': 'Scegli tra le tue conversazioni per iniziare a messaggiare',
    'communication.typing': 'sta scrivendo...',
    'communication.sending': 'Invio in corso',
    'communication.chatTypes.private': 'Chat Privata',
    'communication.chatTypes.group': 'Chat di Gruppo',
    'communication.chatTypes.global': 'Discussione Generale',
    'communication.chatTypes.announcements': 'Annunci',
    'communication.participantsCount': '{{count}} partecipanti'
  }
};

// Simple translation hook
export const useTranslation = (language: Language = 'en') => {
  const t = (key: string, params?: Record<string, any>) => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    if (typeof value !== 'string') {
      // Fallback to English
      value = translations.en;
      for (const k of keys) {
        value = value?.[k];
      }
    }
    
    if (typeof value !== 'string') {
      return key; // Return the key if translation not found
    }
    
    // Simple template replacement
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (match: string, paramKey: string) => {
        return params[paramKey] || match;
      });
    }
    
    return value;
  };
  
  return { t };
};