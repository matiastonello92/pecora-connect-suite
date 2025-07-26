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
    dashboard: 'Dashboard',
    inventory: 'Inventory',
    checklists: 'Checklists',
    communication: 'Communication',
    cashRegister: 'Cash Register',
    reports: 'Reports',
    equipment: 'Equipment',
    userManagement: 'User Management',
    
    // Departments
    kitchen: 'Kitchen',
    pizzeria: 'Pizzeria',
    service: 'Service/Bar',
    finance: 'Finance',
    manager: 'Manager',
    superManager: 'Super Manager',
    
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
    
    // Welcome
    welcome: 'Welcome to PecoraNegra',
    welcomeMessage: 'Professional restaurant management system',
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
    dashboard: 'Tableau de bord',
    inventory: 'Inventaire',
    checklists: 'Listes de contrôle',
    communication: 'Communication',
    cashRegister: 'Caisse',
    reports: 'Rapports',
    equipment: 'Équipement',
    userManagement: 'Gestion des utilisateurs',
    
    // Departments
    kitchen: 'Cuisine',
    pizzeria: 'Pizzeria',
    service: 'Service/Bar',
    finance: 'Finance',
    manager: 'Manager',
    superManager: 'Super Manager',
    
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
    
    // Welcome
    welcome: 'Bienvenue chez PecoraNegra',
    welcomeMessage: 'Système de gestion de restaurant professionnel',
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
    dashboard: 'Dashboard',
    inventory: 'Inventario',
    checklists: 'Liste di controllo',
    communication: 'Comunicazione',
    cashRegister: 'Cassa',
    reports: 'Report',
    equipment: 'Attrezzature',
    userManagement: 'Gestione utenti',
    
    // Departments
    kitchen: 'Cucina',
    pizzeria: 'Pizzeria',
    service: 'Servizio/Bar',
    finance: 'Finanza',
    manager: 'Manager',
    superManager: 'Super Manager',
    
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
    
    // Welcome
    welcome: 'Benvenuto in PecoraNegra',
    welcomeMessage: 'Sistema di gestione ristorante professionale',
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