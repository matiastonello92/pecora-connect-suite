// Internationalization system for PecoraNegra
export type Language = 'en' | 'fr' | 'it';

export const languages: Record<Language, string> = {
  en: 'English',
  fr: 'Français', 
  it: 'Italiano'
};

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
    
    // Inventory Submenu
    inventoryCucina: 'Kitchen Inventory',
    inventoryPizzeria: 'Pizzeria Inventory',
    inventorySala: 'Service/Bar Inventory',
    equipmentInventory: 'Equipment Inventory',
    
    // Suppliers Submenu
    orderManagement: 'Order Management',
    supplierList: 'Supplier List',
    orderStatus: 'Order Status',
    archivedOrders: 'Archived Orders',
    
    // Checklists Submenu
    miseEnPlace: 'Mise en Place',
    serviceOpening: 'Service Opening',
    serviceClosing: 'Service Closing',
    globalChecklists: 'Global Overview',
    
    // Communication Submenu
    globalChat: 'Global Chat',
    groupChats: 'Group Chats',
    privateMessages: 'Private Messages',
    announcementBoard: 'Announcement Board',
    
    // Tasks Submenu
    assignedTasks: 'Assigned Tasks',
    createTask: 'Create Task',
    taskHistory: 'Task History',
    
    // Finance Submenu
    dailyCashClosure: 'Daily Cash Closure',
    financialReports: 'Financial Reports',
    coverAnalytics: 'Cover Analytics',
    exportCenter: 'Export Center',
    
    // Administration Submenu
    notificationSettings: 'Notification Settings',
    departmentSettings: 'Department Settings',
    technicalStaff: 'Technical Staff',
    
    // Maintenance Submenu
    reportMalfunction: 'Report Malfunction',
    malfunctionHistory: 'Malfunction History',
    scheduledMaintenance: 'Scheduled Maintenance',
    
    // Departments
    kitchen: 'Kitchen',
    pizzeria: 'Pizzeria',
    service: 'Service/Bar',
    financeDepart: 'Finance Department',
    manager: 'Manager',
    super_manager: 'Super Manager',
    general_manager: 'General Manager',
    
    // Common
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    filter: 'Filter',
    export: 'Export',
    settings: 'Settings',
    profile: 'Profile',
    language: 'Language',
    
    // Welcome & Dashboard
    welcome: 'Welcome',
    welcomeMessage: 'Professional restaurant management system',
    openFinancialSection: 'Open Financial Section',
    viewReports: 'View Reports',
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
    
    // Inventory Submenu
    inventoryCucina: 'Inventaire Cuisine',
    inventoryPizzeria: 'Inventaire Pizzeria',
    inventorySala: 'Inventaire Service/Bar',
    equipmentInventory: 'Inventaire Équipement',
    
    // Suppliers Submenu
    orderManagement: 'Gestion des commandes',
    supplierList: 'Liste des fournisseurs',
    orderStatus: 'Statut des commandes',
    archivedOrders: 'Commandes archivées',
    
    // Checklists Submenu
    miseEnPlace: 'Mise en Place',
    serviceOpening: 'Ouverture du service',
    serviceClosing: 'Fermeture du service',
    globalChecklists: 'Vue d\'ensemble globale',
    
    // Communication Submenu
    globalChat: 'Chat global',
    groupChats: 'Chats de groupe',
    privateMessages: 'Messages privés',
    announcementBoard: 'Tableau d\'annonces',
    
    // Tasks Submenu
    assignedTasks: 'Tâches assignées',
    createTask: 'Créer une tâche',
    taskHistory: 'Historique des tâches',
    
    // Finance Submenu
    dailyCashClosure: 'Clôture journalière',
    financialReports: 'Rapports financiers',
    coverAnalytics: 'Analyse des couverts',
    exportCenter: 'Centre d\'export',
    
    // Administration Submenu
    notificationSettings: 'Paramètres de notification',
    departmentSettings: 'Paramètres de département',
    technicalStaff: 'Personnel technique',
    
    // Maintenance Submenu
    reportMalfunction: 'Signaler un dysfonctionnement',
    malfunctionHistory: 'Historique des dysfonctionnements',
    scheduledMaintenance: 'Maintenance programmée',
    
    // Departments
    kitchen: 'Cuisine',
    pizzeria: 'Pizzeria',
    service: 'Service/Bar',
    financeDepart: 'Département Finance',
    manager: 'Manager',
    super_manager: 'Super Manager',
    general_manager: 'Directeur Général',
    
    // Common
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    add: 'Ajouter',
    search: 'Rechercher',
    filter: 'Filtrer',
    export: 'Exporter',
    settings: 'Paramètres',
    profile: 'Profil',
    language: 'Langue',
    
    // Welcome & Dashboard
    welcome: 'Bienvenue',
    welcomeMessage: 'Système de gestion de restaurant professionnel',
    openFinancialSection: 'Ouvrir la section financière',
    viewReports: 'Voir les rapports',
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
    
    // Inventory Submenu
    inventoryCucina: 'Inventario Cucina',
    inventoryPizzeria: 'Inventario Pizzeria',
    inventorySala: 'Inventario Servizio/Bar',
    equipmentInventory: 'Inventario Attrezzature',
    
    // Suppliers Submenu
    orderManagement: 'Gestione ordini',
    supplierList: 'Lista fornitori',
    orderStatus: 'Stato ordini',
    archivedOrders: 'Ordini archiviati',
    
    // Checklists Submenu
    miseEnPlace: 'Mise en Place',
    serviceOpening: 'Apertura servizio',
    serviceClosing: 'Chiusura servizio',
    globalChecklists: 'Panoramica globale',
    
    // Communication Submenu
    globalChat: 'Chat globale',
    groupChats: 'Chat di gruppo',
    privateMessages: 'Messaggi privati',
    announcementBoard: 'Bacheca annunci',
    
    // Tasks Submenu
    assignedTasks: 'Compiti assegnati',
    createTask: 'Crea compito',
    taskHistory: 'Storico compiti',
    
    // Finance Submenu
    dailyCashClosure: 'Chiusura cassa giornaliera',
    financialReports: 'Report finanziari',
    coverAnalytics: 'Analisi coperti',
    exportCenter: 'Centro esportazione',
    
    // Administration Submenu
    notificationSettings: 'Impostazioni notifiche',
    departmentSettings: 'Impostazioni reparto',
    technicalStaff: 'Staff tecnico',
    
    // Maintenance Submenu
    reportMalfunction: 'Segnala malfunzionamento',
    malfunctionHistory: 'Storico malfunzionamenti',
    scheduledMaintenance: 'Manutenzione programmata',
    
    // Departments
    kitchen: 'Cucina',
    pizzeria: 'Pizzeria',
    service: 'Servizio/Bar',
    financeDepart: 'Dipartimento Finanza',
    manager: 'Manager',
    super_manager: 'Super Manager',
    general_manager: 'Direttore Generale',
    
    // Common
    save: 'Salva',
    cancel: 'Annulla',
    delete: 'Elimina',
    edit: 'Modifica',
    add: 'Aggiungi',
    search: 'Cerca',
    filter: 'Filtra',
    export: 'Esporta',
    settings: 'Impostazioni',
    profile: 'Profilo',
    language: 'Lingua',
    
    // Welcome & Dashboard
    welcome: 'Benvenuto',
    welcomeMessage: 'Sistema di gestione ristorante professionale',
    openFinancialSection: 'Apri sezione finanziaria',
    viewReports: 'Visualizza report',
  }
};

export const useTranslation = (language: Language) => {
  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  };
  
  return { t };
};