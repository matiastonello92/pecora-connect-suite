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
    'unit-price': 'Unit Price',
    'total-price': 'Total Price',
    notes: 'Notes',
    favorite: 'Favorite',
    
    // Kitchen Inventory
    'kitchen-inventory-title': 'Kitchen Inventory',
    'kitchen-inventory-description': 'Monthly kitchen inventory management for PecoraNegra',
    'monthly-inventory': 'Monthly Inventory',
    'save-inventory': 'Save Inventory',
    'approve-inventory': 'Approve Inventory',
    'export-csv': 'Export CSV',
    'export-pdf': 'Export PDF',
    'inventory-not-available': 'Inventory is only available from the last day of the month to the first day of the following month',
    'inventory-completed': 'Inventory completed and locked for approval',
    'inventory-approved': 'Inventory approved and archived',
    'current-inventory': 'Current Inventory',
    'historical-inventories': 'Historical Inventories',
    'anomalies-detected': 'Anomalies Detected',
    'detect-anomalies': 'Detect Anomalies',
    'last-order-date': 'Last Order Date',
    'never-ordered': 'Never ordered',
    
    // Product Categories
    'category.dairy-derivatives': 'Dairy and Derivatives',
    'category.meats-cold-cuts': 'Meats and Cold Cuts',
    'category.fish': 'Fish',
    'category.spices-seasonings': 'Spices and Seasonings',
    'category.preserves-oils-pickles': 'Preserves, Oils and Pickles',
    'category.nuts': 'Nuts',
    'category.fresh-fruits-vegetables': 'Fresh Fruits and Vegetables',
    'category.flours': 'Flours',
    'category.fruits': 'Fruits',
    
    // Products (partial list - full list included in previous implementation)
    'products.burrata': 'Burrata',
    'products.buffalo_mozzarella': 'Buffalo mozzarella',
    'products.pizza_mozzarella': 'Pizza mozzarella',
    'products.goat_cheese': 'Goat cheese',
    'products.grana_padano_eighth': 'Grana Padano 1/8',
    'products.grana_padano_shavings': 'Grana Padano shavings',
    'products.comte': 'Comté',
    'products.taleggio': 'Taleggio',
    'products.gorgonzola': 'Gorgonzola',
    'products.truffle_pecorino': 'Truffle pecorino',
    'products.primo_sale': 'Primo sale',
    'products.mascarpone': 'Mascarpone',
    'products.ricotta': 'Ricotta',
    'products.butter': 'Butter',
    'products.cream': 'Cream',
    'products.alberti_cream': 'Alberti cream',
    'products.milk': 'Milk',
    'products.white_ham': 'White ham',
    'products.parma_ham': 'Parma ham',
    'products.spicy_spianata': 'Spicy spianata',
    'products.mortadella': 'Mortadella',
    'products.speck': 'Speck',
    'products.bresaola': 'Bresaola',
    'products.veal': 'Veal',
    'products.tuna_pizzeria': 'Tuna pizzeria',
    'products.tuna_kitchen': 'Tuna kitchen',
    'products.anchovies': 'Anchovies',
    'products.basil': 'Basil',
    'products.oregano': 'Oregano',
    'products.pepper': 'Pepper',
    'products.salt': 'Salt',
    'products.red_chili': 'Red chili',
    'products.mint': 'Mint',
    'products.sugar': 'Sugar',
    'products.eggs': 'Eggs',
    'products.dijon_mustard': 'Dijon mustard',
    'products.salad': 'Salad',
    'products.rocket': 'Rocket',
    'products.lemon': 'Lemon',
    'products.beef_heart_tomato': 'Beef heart tomato',
    'products.cherry_tomato': 'Cherry tomato',
    'products.zucchini': 'Zucchini',
    'products.yellow_onion': 'Yellow onion',
    'products.garlic': 'Garlic',
    'products.mushroom': 'Mushroom',
    'products.type_00_flour': 'Type 00 flour',
    'products.peaches': 'Peaches',
    
    // Inventory specific
    'low-stock': 'Low Stock',
    'expiring-soon': 'Expiring Soon',
    'total-value': 'Total Value',
    'start-count': 'Start Count Session',
    'add-item': 'Add Item',
    
    // Financial
    'cash-closure': 'Cash Closure',
    'financial-reports': 'Financial Reports',
    opening: 'Opening',
    closing: 'Closing',
    sales: 'Sales',
    expenses: 'Expenses'
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
    'unit-price': 'Prix unitaire',
    'total-price': 'Prix total',
    notes: 'Notes',
    favorite: 'Favori'
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
    'unit-price': 'Prezzo unitario',
    'total-price': 'Prezzo totale',
    notes: 'Note',
    favorite: 'Preferito'
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