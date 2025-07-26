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
    overview: 'Overview',
    recentActivity: 'Recent Activity',
    inventories: 'Inventories',
    kitchenInventory: 'Kitchen Inventory',
    pizzeriaInventory: 'Pizzeria Inventory',
    salaBarInventory: 'Sala/Bar Inventory',
    equipmentInventory: 'Equipment Inventory',
    suppliers: 'Suppliers',
    sentOrders: 'Sent Orders',
    createNewOrder: 'Create New Order',
    orderHistory: 'Order History',
    chat: 'CHAT',
    checklists: 'Checklists',
    miseEnPlace: 'Mise en Place',
    serviceChecklists: 'Service Checklists',
    completedChecklists: 'Completed Checklists',
    tasks: 'Tasks',
    dailyTasks: 'Daily Tasks',
    assignedTasks: 'Assigned Tasks',
    completedTasks: 'Completed Tasks',
    finance: 'Finance',
    cashRegisterClosure: 'Cash Register Closure',
    financialReports: 'Financial Reports',
    cashHistory: 'Cash History',
    users: 'Users',
    userManagement: 'User Management',
    invitations: 'Invitations',
    rolesPermissions: 'Roles & Permissions',
    maintenance: 'Maintenance',
    techniciansList: 'Technicians List',
    scheduledInterventions: 'Scheduled Interventions',
    faultReports: 'Fault Reports',
    settings: 'Settings',
    language: 'Language',
    activeLocation: 'Active Location',
    notificationSettings: 'Notification Settings',
    userPreferences: 'User Preferences',
    reports: 'Reports',
    equipment: 'Equipment',
    
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
    profile: 'Profile',
    
    // Missing common translations
    common: {
      allLocations: 'All Locations',
      yesterday: 'Yesterday'
    },

    communication: {
      dashboard: {
        title: 'Chat'
      },
      chatTypes: {
        private: 'Private Chat',
        group: 'Group Chat',
        global: 'General',
        announcements: 'Announcements'
      },
      messageTypes: {
        image: 'Image',
        voice: 'Voice message',
        document: 'Document'
      },
      searchChats: 'Search chats...',
      createGroupChat: 'Create group',
      newPrivateChat: 'New private chat',
      newGroupChat: 'New Group',
      noChats: 'No chats yet',
      noChatsFound: 'No chats found',
      noMessages: 'No messages yet',
      startConversation: 'Send a message to start the conversation',
      selectChat: 'Select a chat',
      selectChatDescription: 'Choose a conversation to start messaging',
      participantsCount: '{{count}} participants',
      typing: 'typing...',
      sending: 'Sending',
      sent: 'Sent',
      delivered: 'Delivered',
      read: 'Read',
      edited: 'edited',
      online: 'Online',
      offline: 'Offline',
      globalChatSubtitle: 'Everyone in your location',
      announcementChatSubtitle: 'Important announcements',
      onlyAdminsCanSend: 'Only administrators can send announcements',
      chatMuted: 'This chat is muted',
      chatInfo: 'Chat Info',
      typeMessage: 'Type a message...',
      image: 'Image',
      document: 'Document',
      voice: 'Voice',
      connectionRequests: 'Connection Requests',
      connections: 'Connections',
      sendRequest: 'Send Request',
      searchConnections: 'Search connections...',
      incoming: 'Incoming',
      outgoing: 'Outgoing',
      accept: 'Accept',
      decline: 'Decline',
      pending: 'Pending',
      message: 'Message',
      send: 'Send',
      sendConnectionRequest: 'Send Connection Request',
      recipientEmail: 'Recipient email',
      optionalMessage: 'Optional message...',
      noIncomingRequests: 'No incoming requests',
      noOutgoingRequests: 'No outgoing requests', 
      noConnections: 'No connections yet',
      requestSent: 'Request sent',
      requestAccepted: 'Request accepted',
      requestDeclined: 'Request declined',
      groupCreated: 'Group created',
      errorLoadingChats: 'Error loading chats',
      errorCreatingGroup: 'Error creating group',
      errorSendingMessage: 'Error sending message',
      errorUploadingFile: 'Error uploading file',
      unknownSender: 'Unknown'
    },
    
    // Legacy communication keys for backward compatibility
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
    overview: 'Vue d\'ensemble',
    recentActivity: 'Activité récente',
    inventories: 'Inventaires',
    kitchenInventory: 'Inventaire Cuisine',
    pizzeriaInventory: 'Inventaire Pizzeria',
    salaBarInventory: 'Inventaire Sala/Bar',
    equipmentInventory: 'Inventaire Équipement',
    suppliers: 'Fournisseurs',
    sentOrders: 'Commandes envoyées',
    createNewOrder: 'Nouvelle commande',
    orderHistory: 'Historique commandes',
    chat: 'CHAT',
    checklists: 'Listes de contrôle',
    miseEnPlace: 'Mise en place',
    serviceChecklists: 'Listes service',
    completedChecklists: 'Listes terminées',
    tasks: 'Tâches',
    dailyTasks: 'Tâches quotidiennes',
    assignedTasks: 'Tâches assignées',
    completedTasks: 'Tâches terminées',
    finance: 'Finance',
    cashRegisterClosure: 'Fermeture caisse',
    financialReports: 'Rapports financiers',
    cashHistory: 'Historique caisse',
    users: 'Utilisateurs',
    userManagement: 'Gestion utilisateurs',
    invitations: 'Invitations',
    rolesPermissions: 'Rôles & Permissions',
    maintenance: 'Maintenance',
    techniciansList: 'Liste techniciens',
    scheduledInterventions: 'Interventions programmées',
    faultReports: 'Rapports de panne',
    settings: 'Paramètres',
    language: 'Langue',
    activeLocation: 'Lieu actif',
    notificationSettings: 'Paramètres notifications',
    userPreferences: 'Préférences utilisateur',
    reports: 'Rapports',
    equipment: 'Équipement',
    
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
    profile: 'Profil',
    
    // Missing common translations
    common: {
      allLocations: 'Tous les emplacements',
      yesterday: 'Hier'
    },

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
    overview: 'Panoramica',
    recentActivity: 'Attività recente',
    inventories: 'Inventari',
    kitchenInventory: 'Inventario Cucina',
    pizzeriaInventory: 'Inventario Pizzeria',
    salaBarInventory: 'Inventario Sala/Bar',
    equipmentInventory: 'Inventario Attrezzature',
    suppliers: 'Fornitori',
    sentOrders: 'Ordini inviati',
    createNewOrder: 'Nuovo ordine',
    orderHistory: 'Storico ordini',
    chat: 'CHAT',
    checklists: 'Liste di controllo',
    miseEnPlace: 'Mise en place',
    serviceChecklists: 'Liste servizio',
    completedChecklists: 'Liste completate',
    tasks: 'Compiti',
    dailyTasks: 'Compiti giornalieri',
    assignedTasks: 'Compiti assegnati',
    completedTasks: 'Compiti completati',
    finance: 'Finanza',
    cashRegisterClosure: 'Chiusura cassa',
    financialReports: 'Rapporti finanziari',
    cashHistory: 'Storico cassa',
    users: 'Utenti',
    userManagement: 'Gestione utenti',
    invitations: 'Inviti',
    rolesPermissions: 'Ruoli e Permessi',
    maintenance: 'Manutenzione',
    techniciansList: 'Lista tecnici',
    scheduledInterventions: 'Interventi programmati',
    faultReports: 'Rapporti guasti',
    settings: 'Impostazioni',
    language: 'Lingua',
    activeLocation: 'Posizione attiva',
    notificationSettings: 'Impostazioni notifiche',
    userPreferences: 'Preferenze utente',
    reports: 'Rapporti',
    equipment: 'Attrezzatura',
    
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
    profile: 'Profilo',
    
    // Missing common translations
    common: {
      allLocations: 'Tutte le Posizioni',
      yesterday: 'Ieri'
    },

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