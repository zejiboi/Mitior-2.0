import React, { createContext, useContext, useState, useEffect } from 'react';

export type SupportedLanguage = 'en' | 'es' | 'fr' | 'sw' | 'pt' | 'de' | 'ar';

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English (Simple)', nativeName: 'English (Plain)', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇰🇪' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' }
];

export const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    // Navigation (Simple plain words)
    'nav.home': 'Home',
    'nav.engines': '1. How It Works (Flow)',
    'nav.playbooks': '2. Checklists & SOPs',
    'nav.team': '3. Team & Roles',
    'nav.scorecard': '4. Weekly Numbers',
    'nav.sprint': '5. 90-Day Goals',
    'nav.compass': '6. Company Vision',
    'nav.settings': '7. Settings & Backup',
    'nav.enquiries': '8. Customer Messages',
    'nav.srs': '10. System Specs',

    // Headers & Subtitles
    'header.home.title': 'Home Overview',
    'header.home.sub': 'See company numbers, recent activity, and quick shortcuts.',
    'header.engines.title': 'How Business Works (Flow)',
    'header.engines.sub': 'Map how you get customers and how you deliver your work.',
    'header.playbooks.title': 'Checklists & Guides (SOPs)',
    'header.playbooks.sub': 'Simple step-by-step instructions so work is done right every time.',
    'header.team.title': 'Team & Roles',
    'header.team.sub': 'See who is responsible for what job in the company.',
    'header.scorecard.title': 'Weekly Numbers (Scorecard)',
    'header.scorecard.sub': 'Track your most important numbers each week to stay on target.',
    'header.sprint.title': '90-Day Goals & Meetings',
    'header.sprint.sub': 'Focus on key quarterly goals and simple weekly team check-ins.',
    'header.compass.title': 'Company Vision (Compass)',
    'header.compass.sub': 'Your big 3-year goal, purpose, values, and why customers choose you.',
    'header.enquiries.title': 'Customer Messages',
    'header.enquiries.sub': 'Incoming requests, questions, and customer contact notes.',
    'header.settings.title': 'Settings & Backup',
    'header.settings.sub': 'Save your data, change workspaces, and manage your account.',

    // Common Buttons & Actions
    'action.save': 'Save',
    'action.cancel': 'Cancel',
    'action.delete': 'Delete',
    'action.edit': 'Edit',
    'action.add': 'Add',
    'action.add_step': 'Add Step',
    'action.add_step_quick': '+ Add Next Step',
    'action.search': 'Search...',
    'action.clear': 'Clear',
    'action.filter': 'Filter',
    'action.reset_filter': 'Reset Filter',
    'action.expand': 'Expand',
    'action.collapse': 'Collapse',
    'action.undo': 'Undo',
    'action.redo': 'Redo',
    'action.close': 'Close',

    // SOP & Checklist
    'sop.manual_details': 'SOP Guide & Instructions',
    'sop.checklist_title': 'Step-by-Step Checklist',
    'sop.unlock_condition': 'Must complete first:',
    'sop.none_always_open': 'None (Start anytime)',
    'sop.requires': 'Requires:',
    'sop.step_placeholder': 'Type what to do in this step...',
    'sop.blocked_by': 'Wait for:',
    'sop.unlocked': 'Ready to start',
    'sop.progress': 'Progress:',
    'sop.video_walkthrough': 'Video Guide',
    'sop.watch_video': 'Watch Video Guide',
    'sop.no_video': 'No video link added yet',
    'sop.edit_manual': 'Edit Guide',
    'sop.save_changes': 'Save Changes',
    'sop.create_sop': 'Create New SOP',

    // Scorecard & Filters
    'scorecard.filter_title': 'Filter Numbers',
    'scorecard.category_all': 'All Categories',
    'scorecard.category_evergreen': '🌲 Daily Operations',
    'scorecard.category_northstar': '⭐ Main Company Goals',
    'scorecard.category_marketing': '📣 Marketing (Leads)',
    'scorecard.category_sales': '💼 Sales (Deals)',
    'scorecard.status_all': 'All Health Statuses',
    'scorecard.status_green': '🟢 On Track (Good)',
    'scorecard.status_yellow': '🟡 At Risk (Need Plan)',
    'scorecard.status_red': '🔴 Behind (Take Action)',
    'scorecard.search_placeholder': 'Search by number name or owner...',
    'scorecard.showing': 'Showing',
    'scorecard.of': 'of',
    'scorecard.metrics': 'numbers',
    'scorecard.add_metric': 'Add New Number to Track',
    'scorecard.rule_note': 'Simple Rule: Enter your actual numbers every Monday morning.',
    'scorecard.col_name': 'Number to Track (KPI)',
    'scorecard.col_unit': 'Unit',
    'scorecard.col_w1': 'Week 1',
    'scorecard.col_w2': 'Week 2',
    'scorecard.col_w3': 'Week 3',
    'scorecard.col_w4': 'Week 4',
    'scorecard.col_target': 'Goal Target',
    'scorecard.col_status': 'Health (Click to change)',
    'scorecard.col_owner': 'Owner',
    'scorecard.col_sop': 'Linked Guide (SOP)',
    'scorecard.col_action': 'Action',

    // Language Selector
    'lang.choose': 'Language',
    'lang.change_tooltip': 'Change application language'
  },

  es: {
    // Navigation
    'nav.home': 'Inicio',
    'nav.engines': '1. Flujo de Trabajo',
    'nav.playbooks': '2. Guías y Pasos (SOP)',
    'nav.team': '3. Equipo y Roles',
    'nav.scorecard': '4. Números Semanales',
    'nav.sprint': '5. Metas de 90 Días',
    'nav.compass': '6. Visión de Empresa',
    'nav.settings': '7. Ajustes y Copia',
    'nav.enquiries': '8. Mensajes Clientes',
    'nav.srs': '10. Especificaciones',

    // Headers & Subtitles
    'header.home.title': 'Panel de Inicio',
    'header.home.sub': 'Vea los números de la empresa, actividad reciente y accesos directos.',
    'header.engines.title': 'Flujo del Negocio (Motores)',
    'header.engines.sub': 'Diseñe cómo consigue clientes y cómo entrega su trabajo.',
    'header.playbooks.title': 'Guías de Trabajo y Pasos (SOP)',
    'header.playbooks.sub': 'Instrucciones paso a paso para hacer el trabajo bien siempre.',
    'header.team.title': 'Equipo y Responsabilidades',
    'header.team.sub': 'Vea quién es responsable de cada tarea en la empresa.',
    'header.scorecard.title': 'Números Semanales (Scorecard)',
    'header.scorecard.sub': 'Siga sus números más importantes cada semana.',
    'header.sprint.title': 'Metas de 90 Días y Reuniones',
    'header.sprint.sub': 'Enfóquese en metas clave y revisiones semanales simples.',
    'header.compass.title': 'Visión de Empresa (Brújula)',
    'header.compass.sub': 'Su meta a 3 años, propósito, valores y por qué lo eligen.',
    'header.enquiries.title': 'Mensajes de Clientes',
    'header.enquiries.sub': 'Mensajes entrantes, dudas y notas de clientes.',
    'header.settings.title': 'Ajustes y Copia de Seguridad',
    'header.settings.sub': 'Guarde sus datos, cambie de espacio y gestione su cuenta.',

    // Common Buttons & Actions
    'action.save': 'Guardar',
    'action.cancel': 'Cancelar',
    'action.delete': 'Eliminar',
    'action.edit': 'Editar',
    'action.add': 'Añadir',
    'action.add_step': 'Añadir Paso',
    'action.add_step_quick': '+ Añadir Siguiente Paso',
    'action.search': 'Buscar...',
    'action.clear': 'Limpiar',
    'action.filter': 'Filtrar',
    'action.reset_filter': 'Quitar Filtros',
    'action.expand': 'Expandir',
    'action.collapse': 'Plegar',
    'action.undo': 'Deshacer',
    'action.redo': 'Rehacer',
    'action.close': 'Cerrar',

    // SOP & Checklist
    'sop.manual_details': 'Guía del Procedimiento e Instrucciones',
    'sop.checklist_title': 'Lista de Pasos (Checklist)',
    'sop.unlock_condition': 'Hacer primero:',
    'sop.none_always_open': 'Ninguno (Empezar cuando quiera)',
    'sop.requires': 'Requiere:',
    'sop.step_placeholder': 'Escriba lo que hay que hacer en este paso...',
    'sop.blocked_by': 'Esperar por:',
    'sop.unlocked': 'Listo para iniciar',
    'sop.progress': 'Progreso:',
    'sop.video_walkthrough': 'Video Guía',
    'sop.watch_video': 'Ver Video Guía',
    'sop.no_video': 'Sin enlace de video todavía',
    'sop.edit_manual': 'Editar Guía',
    'sop.save_changes': 'Guardar Cambios',
    'sop.create_sop': 'Crear Nueva Guía (SOP)',

    // Scorecard & Filters
    'scorecard.filter_title': 'Filtrar Números',
    'scorecard.category_all': 'Todas las Categorías',
    'scorecard.category_evergreen': '🌲 Operaciones Diarias',
    'scorecard.category_northstar': '⭐ Metas Principales',
    'scorecard.category_marketing': '📣 Marketing (Prospectos)',
    'scorecard.category_sales': '💼 Ventas (Cierres)',
    'scorecard.status_all': 'Todos los Estados',
    'scorecard.status_green': '🟢 Bien (En camino)',
    'scorecard.status_yellow': '🟡 Alerta (Requiere plan)',
    'scorecard.status_red': '🔴 Crítico (Tomar acción)',
    'scorecard.search_placeholder': 'Buscar por nombre o responsable...',
    'scorecard.showing': 'Mostrando',
    'scorecard.of': 'de',
    'scorecard.metrics': 'números',
    'scorecard.add_metric': 'Añadir Nuevo Número',
    'scorecard.rule_note': 'Regla Simple: Ingrese sus números reales cada lunes por la mañana.',
    'scorecard.col_name': 'Número a Seguir (KPI)',
    'scorecard.col_unit': 'Unidad',
    'scorecard.col_w1': 'Semana 1',
    'scorecard.col_w2': 'Semana 2',
    'scorecard.col_w3': 'Semana 3',
    'scorecard.col_w4': 'Semana 4',
    'scorecard.col_target': 'Meta',
    'scorecard.col_status': 'Estado (Clic para cambiar)',
    'scorecard.col_owner': 'Responsable',
    'scorecard.col_sop': 'Guía Vinculada (SOP)',
    'scorecard.col_action': 'Acción',

    // Language Selector
    'lang.choose': 'Idioma',
    'lang.change_tooltip': 'Cambiar idioma de la aplicación'
  },

  fr: {
    // Navigation
    'nav.home': 'Accueil',
    'nav.engines': '1. Fonctionnement (Flux)',
    'nav.playbooks': '2. Guides & Fiches (SOP)',
    'nav.team': '3. Équipe & Rôles',
    'nav.scorecard': '4. Chiffres Hebdo',
    'nav.sprint': '5. Objectifs 90 Jours',
    'nav.compass': '6. Vision d\'Entreprise',
    'nav.settings': '7. Paramètres & Sauvegarde',
    'nav.enquiries': '8. Messages Clients',
    'nav.srs': '10. Spécifications',

    // Headers & Subtitles
    'header.home.title': 'Vue Générale',
    'header.home.sub': 'Consultez les chiffres clés, les activités récentes et les raccourcis.',
    'header.engines.title': 'Comment Tourne l\'Entreprise',
    'header.engines.sub': 'Cartographiez vos étapes pour trouver des clients et livrer vos services.',
    'header.playbooks.title': 'Guides & Fiches Pratiques (SOP)',
    'header.playbooks.sub': 'Des étapes claires pour réussir chaque tâche sans erreur.',
    'header.team.title': 'Équipe et Rôles',
    'header.team.sub': 'Identifiez clairement qui est responsable de quoi.',
    'header.scorecard.title': 'Chiffres de la Semaine (Scorecard)',
    'header.scorecard.sub': 'Suivez vos indicateurs essentiels chaque semaine.',
    'header.sprint.title': 'Objectifs 90 Jours & Rituels',
    'header.sprint.sub': 'Concentrez-vous sur l\'essentiel et vos points hebdomadaires simples.',
    'header.compass.title': 'Vision d\'Entreprise (Boussole)',
    'header.compass.sub': 'Votre cap à 3 ans, vos valeurs et votre promesse client.',
    'header.enquiries.title': 'Messages Clients',
    'header.enquiries.sub': 'Demandes entrantes, contacts et retours clients.',
    'header.settings.title': 'Paramètres & Sauvegardes',
    'header.settings.sub': 'Gérez vos données, changez d\'espace et gérez votre compte.',

    // Common Buttons & Actions
    'action.save': 'Enregistrer',
    'action.cancel': 'Annuler',
    'action.delete': 'Supprimer',
    'action.edit': 'Modifier',
    'action.add': 'Ajouter',
    'action.add_step': 'Ajouter Étape',
    'action.add_step_quick': '+ Ajouter l\'Étape Suivante',
    'action.search': 'Rechercher...',
    'action.clear': 'Effacer',
    'action.filter': 'Filtrer',
    'action.reset_filter': 'Réinitialiser Filtres',
    'action.expand': 'Ouvrir',
    'action.collapse': 'Fermer',
    'action.undo': 'Annuler',
    'action.redo': 'Rétablir',
    'action.close': 'Fermer',

    // SOP & Checklist
    'sop.manual_details': 'Guide Pratique & Consignes',
    'sop.checklist_title': 'Liste des Étapes (Checklist)',
    'sop.unlock_condition': 'À faire avant :',
    'sop.none_always_open': 'Aucun (Commencer quand vous voulez)',
    'sop.requires': 'Nécessite :',
    'sop.step_placeholder': 'Écrivez ce qu\'il faut faire...',
    'sop.blocked_by': 'En attente de :',
    'sop.unlocked': 'Prêt à démarrer',
    'sop.progress': 'Progression :',
    'sop.video_walkthrough': 'Vidéo Explicative',
    'sop.watch_video': 'Voir la Vidéo',
    'sop.no_video': 'Pas de lien vidéo pour l\'instant',
    'sop.edit_manual': 'Modifier le Guide',
    'sop.save_changes': 'Enregistrer les Modifications',
    'sop.create_sop': 'Créer une Fiche (SOP)',

    // Scorecard & Filters
    'scorecard.filter_title': 'Filtrer les Chiffres',
    'scorecard.category_all': 'Toutes Catégories',
    'scorecard.category_evergreen': '🌲 Quotidien & Opérations',
    'scorecard.category_northstar': '⭐ Objectifs Principaux',
    'scorecard.category_marketing': '📣 Marketing (Prospects)',
    'scorecard.category_sales': '💼 Ventes (Contrats)',
    'scorecard.status_all': 'Tous les États',
    'scorecard.status_green': '🟢 En Bonne Voie',
    'scorecard.status_yellow': '🟡 Attention (Plan requis)',
    'scorecard.status_red': '🔴 En Retard (Agir vite)',
    'scorecard.search_placeholder': 'Chercher par nom ou responsable...',
    'scorecard.showing': 'Affichage de',
    'scorecard.of': 'sur',
    'scorecard.metrics': 'chiffres',
    'scorecard.add_metric': 'Ajouter un Chiffre',
    'scorecard.rule_note': 'Règle Simple : Renseignez vos vrais chiffres chaque lundi matin.',
    'scorecard.col_name': 'Indicateur Clé (KPI)',
    'scorecard.col_unit': 'Unité',
    'scorecard.col_w1': 'Semaine 1',
    'scorecard.col_w2': 'Semana 2',
    'scorecard.col_w3': 'Semana 3',
    'scorecard.col_w4': 'Semana 4',
    'scorecard.col_target': 'Cible',
    'scorecard.col_status': 'État (Cliquer pour changer)',
    'scorecard.col_owner': 'Responsable',
    'scorecard.col_sop': 'Guide Associé (SOP)',
    'scorecard.col_action': 'Action',

    // Language Selector
    'lang.choose': 'Langue',
    'lang.change_tooltip': 'Changer la langue de l\'application'
  },

  sw: {
    // Navigation (Kiswahili)
    'nav.home': 'Mwanzo',
    'nav.engines': '1. Mfumo wa Kazi',
    'nav.playbooks': '2. Miongozo na Hatua (SOP)',
    'nav.team': '3. Timu na Majukumu',
    'nav.scorecard': '4. Takwimu za Wiki',
    'nav.sprint': '5. Malengo ya Siku 90',
    'nav.compass': '6. Dira ya Biashara',
    'nav.settings': '7. Mipangilio na Nakala',
    'nav.enquiries': '8. Ujumbe wa Wateja',
    'nav.srs': '10. Nyaraka za Mfumo',

    // Headers & Subtitles
    'header.home.title': 'Muhtasari wa Mwanzo',
    'header.home.sub': 'Tazama namba za biashara, mambo yaliyofanyika hivi karibuni na njia za mkato.',
    'header.engines.title': 'Jinsi Biashara Inavyofanya Kazi',
    'header.engines.sub': 'Panga hatua za kupata wateja na kuwahudumia kwa ufanisi mkubwa.',
    'header.playbooks.title': 'Miongozo ya Hatua kwa Hatua (SOP)',
    'header.playbooks.sub': 'Maelekezo rahisi ili kazi ifanyike vizuri na bila makosa kila mara.',
    'header.team.title': 'Timu na Majukumu ya Kila Mtu',
    'header.team.sub': 'Fahamu wazi nani anawajibika kwa jukumu gani kwenye kampuni.',
    'header.scorecard.title': 'Takwimu Muhimu za Kila Wiki',
    'header.scorecard.sub': 'Fuatilia namba zako muhimu kila wiki ili kufikia malengo.',
    'header.sprint.title': 'Malengo ya Siku 90 na Mikutano',
    'header.sprint.sub': 'Zingatia malengo makuu ya robo mwaka na vikao rahisi vya kila wiki.',
    'header.compass.title': 'Dira ya Biashara (Compass)',
    'header.compass.sub': 'Lengo lako la miaka 3, kusudi, maadili na sababu za wateja kukuchagua.',
    'header.enquiries.title': 'Ujumbe kutoka kwa Wateja',
    'header.enquiries.sub': 'Maswali, maombi mapya na mawasiliano ya wateja.',
    'header.settings.title': 'Mipangilio na Hifadhi ya Data',
    'header.settings.sub': 'Hifadhi data zako, badili ofisi na simamia akaunti yako.',

    // Common Buttons & Actions
    'action.save': 'Hifadhi',
    'action.cancel': 'Ghairi',
    'action.delete': 'Futa',
    'action.edit': 'Badili',
    'action.add': 'Ongeza',
    'action.add_step': 'Ongeza Hatua',
    'action.add_step_quick': '+ Ongeza Hatua Inayofuata',
    'action.search': 'Tafuta...',
    'action.clear': 'Safisha',
    'action.filter': 'Chuja',
    'action.reset_filter': 'Ondoa Vichungi',
    'action.expand': 'Fungua',
    'action.collapse': 'Funga',
    'action.undo': 'Rudisha Nyuma',
    'action.redo': 'Rudia',
    'action.close': 'Funga',

    // SOP & Checklist
    'sop.manual_details': 'Mwongozo na Maelekezo Kamili',
    'sop.checklist_title': 'Orodha ya Hatua za Kufuata',
    'sop.unlock_condition': 'Lazima ukamilishe kwanza:',
    'sop.none_always_open': 'Hakuna (Unaweza kuanza moja kwa moja)',
    'sop.requires': 'Inahitaji:',
    'sop.step_placeholder': 'Andika nini kifanyike kwenye hatua hii...',
    'sop.blocked_by': 'Inasubiri:',
    'sop.unlocked': 'Tayari Kuanza',
    'sop.progress': 'Maendeleo:',
    'sop.video_walkthrough': 'Mwongozo wa Video',
    'sop.watch_video': 'Tazama Video',
    'sop.no_video': 'Bado hakuna video iliyounganishwa',
    'sop.edit_manual': 'Hariri Mwongozo',
    'sop.save_changes': 'Hifadhi Mabadiliko',
    'sop.create_sop': 'Tengeneza SOP Mpya',

    // Scorecard & Filters
    'scorecard.filter_title': 'Chuja Takwimu Hapa',
    'scorecard.category_all': 'Kategoria Zote',
    'scorecard.category_evergreen': '🌲 Kazi za Kila Siku',
    'scorecard.category_northstar': '⭐ Malengo Makuu',
    'scorecard.category_marketing': '📣 Masoko (Wateja Watarajiwa)',
    'scorecard.category_sales': '💼 Mauzo (Mikakati)',
    'scorecard.status_all': 'Hali Zote',
    'scorecard.status_green': '🟢 Nzuri (Tupo Sawa)',
    'scorecard.status_yellow': '🟡 Tahadhari (Inahitaji Mpango)',
    'scorecard.status_red': '🔴 Hatari (Chukua Hatua)',
    'scorecard.search_placeholder': 'Tafuta kwa jina la namba au mtu...',
    'scorecard.showing': 'Inaonyesha',
    'scorecard.of': 'kati ya',
    'scorecard.metrics': 'takwimu',
    'scorecard.add_metric': 'Ongeza Namba Mpya ya Kufuatilia',
    'scorecard.rule_note': 'Kanuni Rahisi: Weka namba zako halisi kila Jumatatu asubuhi.',
    'scorecard.col_name': 'Kipimo cha Kufuatilia (KPI)',
    'scorecard.col_unit': 'Kipimo',
    'scorecard.col_w1': 'Wiki 1',
    'scorecard.col_w2': 'Wiki 2',
    'scorecard.col_w3': 'Wiki 3',
    'scorecard.col_w4': 'Wiki 4',
    'scorecard.col_target': 'Lengo',
    'scorecard.col_status': 'Hali (Bonyeza Kubadili)',
    'scorecard.col_owner': 'Msimamizi',
    'scorecard.col_sop': 'Mwongozo Uliounganishwa (SOP)',
    'scorecard.col_action': 'Kitendo',

    // Language Selector
    'lang.choose': 'Lugha',
    'lang.change_tooltip': 'Badili lugha ya mfumo'
  },

  pt: {
    // Navigation
    'nav.home': 'Início',
    'nav.engines': '1. Fluxo de Trabalho',
    'nav.playbooks': '2. Guias e Passos (SOP)',
    'nav.team': '3. Equipe e Funções',
    'nav.scorecard': '4. Números Semanais',
    'nav.sprint': '5. Metas de 90 Dias',
    'nav.compass': '6. Visão da Empresa',
    'nav.settings': '7. Configurações e Backup',
    'nav.enquiries': '8. Mensagens de Clientes',
    'nav.srs': '10. Especificações',

    // Headers & Subtitles
    'header.home.title': 'Visão Geral',
    'header.home.sub': 'Acompanhe os números da empresa, atividades recentes e atalhos rápidos.',
    'header.engines.title': 'Como a Empresa Funciona',
    'header.engines.sub': 'Mapeie as etapas para conquistar clientes e entregar seu trabalho.',
    'header.playbooks.title': 'Guias e Passos Práticos (SOP)',
    'header.playbooks.sub': 'Instruções simples passo a passo para fazer o trabalho certo sempre.',
    'header.team.title': 'Equipe e Responsabilidades',
    'header.team.sub': 'Veja claramente quem é responsável por cada tarefa.',
    'header.scorecard.title': 'Números Semanais (Scorecard)',
    'header.scorecard.sub': 'Acompanhe seus números mais importantes toda semana.',
    'header.sprint.title': 'Metas de 90 Dias e Rituais',
    'header.sprint.sub': 'Foque nos objetivos do trimestre e reuniões semanais simples.',
    'header.compass.title': 'Visão da Empresa (Bússola)',
    'header.compass.sub': 'Sua meta para 3 anos, propósito, valores e motivos de escolha do cliente.',
    'header.enquiries.title': 'Mensagens de Clientes',
    'header.enquiries.sub': 'Novos contatos, dúvidas e notas de atendimento.',
    'header.settings.title': 'Configurações e Backup',
    'header.settings.sub': 'Guarde seus dados, alterne espaços de trabalho e gerencie sua conta.',

    // Common Buttons & Actions
    'action.save': 'Salvar',
    'action.cancel': 'Cancelar',
    'action.delete': 'Excluir',
    'action.edit': 'Editar',
    'action.add': 'Adicionar',
    'action.add_step': 'Adicionar Passo',
    'action.add_step_quick': '+ Adicionar Próximo Passo',
    'action.search': 'Pesquisar...',
    'action.clear': 'Limpar',
    'action.filter': 'Filtrar',
    'action.reset_filter': 'Limpar Filtros',
    'action.expand': 'Expandir',
    'action.collapse': 'Recolher',
    'action.undo': 'Desfazer',
    'action.redo': 'Refazer',
    'action.close': 'Fechar',

    // SOP & Checklist
    'sop.manual_details': 'Guia de Procedimentos e Instruções',
    'sop.checklist_title': 'Lista de Passos (Checklist)',
    'sop.unlock_condition': 'Concluir primeiro:',
    'sop.none_always_open': 'Nenhum (Comece quando quiser)',
    'sop.requires': 'Requer:',
    'sop.step_placeholder': 'Digite o que deve ser feito neste passo...',
    'sop.blocked_by': 'Aguardando:',
    'sop.unlocked': 'Pronto para iniciar',
    'sop.progress': 'Progresso:',
    'sop.video_walkthrough': 'Vídeo Explicativo',
    'sop.watch_video': 'Assistir Vídeo',
    'sop.no_video': 'Nenhum vídeo vinculado ainda',
    'sop.edit_manual': 'Editar Guia',
    'sop.save_changes': 'Salvar Alterações',
    'sop.create_sop': 'Criar Novo Procedimento (SOP)',

    // Scorecard & Filters
    'scorecard.filter_title': 'Filtrar Números',
    'scorecard.category_all': 'Todas as Categorias',
    'scorecard.category_evergreen': '🌲 Operações Diárias',
    'scorecard.category_northstar': '⭐ Metas Principais',
    'scorecard.category_marketing': '📣 Marketing (Leads)',
    'scorecard.category_sales': '💼 Vendas (Fechamentos)',
    'scorecard.status_all': 'Todos os Estados',
    'scorecard.status_green': '🟢 No Alvo (Tudo Bem)',
    'scorecard.status_yellow': '🟡 Atenção (Precisa Plano)',
    'scorecard.status_red': '🔴 Crítico (Ação Imediata)',
    'scorecard.search_placeholder': 'Pesquisar por nome ou responsável...',
    'scorecard.showing': 'Exibindo',
    'scorecard.of': 'de',
    'scorecard.metrics': 'números',
    'scorecard.add_metric': 'Adicionar Novo Número',
    'scorecard.rule_note': 'Regra Simples: Atualize seus números reais toda segunda-feira de manhã.',
    'scorecard.col_name': 'Métrica a Seguir (KPI)',
    'scorecard.col_unit': 'Unidade',
    'scorecard.col_w1': 'Semana 1',
    'scorecard.col_w2': 'Semana 2',
    'scorecard.col_w3': 'Semana 3',
    'scorecard.col_w4': 'Semana 4',
    'scorecard.col_target': 'Meta',
    'scorecard.col_status': 'Saúde (Clique p/ alternar)',
    'scorecard.col_owner': 'Responsável',
    'scorecard.col_sop': 'Guia Vinculado (SOP)',
    'scorecard.col_action': 'Ação',

    // Language Selector
    'lang.choose': 'Idioma',
    'lang.change_tooltip': 'Mudar idioma do aplicativo'
  },

  de: {
    // Navigation
    'nav.home': 'Übersicht',
    'nav.engines': '1. Arbeitsablauf',
    'nav.playbooks': '2. Anleitungen & Schritte (SOP)',
    'nav.team': '3. Team & Rollen',
    'nav.scorecard': '4. Wochenzahlen',
    'nav.sprint': '5. 90-Tage-Ziele',
    'nav.compass': '6. Unternehmensvision',
    'nav.settings': '7. Einstellungen & Backup',
    'nav.enquiries': '8. Kundenanfragen',
    'nav.srs': '10. Systemspezifikationen',

    // Headers & Subtitles
    'header.home.title': 'Start-Übersicht',
    'header.home.sub': 'Wichtige Kennzahlen, Aktivitäten und Schnellzugriffe auf einen Blick.',
    'header.engines.title': 'Wie das Geschäft Funktioniert',
    'header.engines.sub': 'Kunden gewinnen und Aufträge zuverlässig ausführen.',
    'header.playbooks.title': 'Schritt-für-Schritt-Anleitungen (SOP)',
    'header.playbooks.sub': 'Einfache Checklisten für fehlerfreie Arbeit zu jeder Zeit.',
    'header.team.title': 'Team und Zuständigkeiten',
    'header.team.sub': 'Klarheit darüber, wer wofür im Unternehmen verantwortlich ist.',
    'header.scorecard.title': 'Wöchentliche Kennzahlen (Scorecard)',
    'header.scorecard.sub': 'Die wichtigsten Unternehmenszahlen jede Woche im Blick behalten.',
    'header.sprint.title': '90-Tage-Ziele & Meetings',
    'header.sprint.sub': 'Fokus auf Quartalsziele und einfache wöchentliche Abstimmungen.',
    'header.compass.title': 'Unternehmensvision (Kompass)',
    'header.compass.sub': 'Ihr 3-Jahres-Ziel, Sinn, Werte und Kundennutzen.',
    'header.enquiries.title': 'Kundenanfragen',
    'header.enquiries.sub': 'Eingehende Nachrichten, Rückfragen und Kundennotizen.',
    'header.settings.title': 'Einstellungen & Datensicherung',
    'header.settings.sub': 'Daten sichern, Arbeitsbereiche wechseln und Konto verwalten.',

    // Common Buttons & Actions
    'action.save': 'Speichern',
    'action.cancel': 'Abbrechen',
    'action.delete': 'Löschen',
    'action.edit': 'Bearbeiten',
    'action.add': 'Hinzufügen',
    'action.add_step': 'Schritt Hinzufügen',
    'action.add_step_quick': '+ Nächsten Schritt Hinzufügen',
    'action.search': 'Suchen...',
    'action.clear': 'Leeren',
    'action.filter': 'Filtern',
    'action.reset_filter': 'Filter Zurücksetzen',
    'action.expand': 'Aufklappen',
    'action.collapse': 'Zuklappen',
    'action.undo': 'Rückgängig',
    'action.redo': 'Wiederholen',
    'action.close': 'Schließen',

    // SOP & Checklist
    'sop.manual_details': 'Anleitung & Richtlinien',
    'sop.checklist_title': 'Schritt-für-Schritt-Checkliste',
    'sop.unlock_condition': 'Zuerst abschließen:',
    'sop.none_always_open': 'Keine (Sofort starten)',
    'sop.requires': 'Erfordert:',
    'sop.step_placeholder': 'Was ist in diesem Schritt zu tun...',
    'sop.blocked_by': 'Wartet auf:',
    'sop.unlocked': 'Bereit zum Start',
    'sop.progress': 'Fortschritt:',
    'sop.video_walkthrough': 'Videoanleitung',
    'sop.watch_video': 'Video Ansehen',
    'sop.no_video': 'Noch kein Videolink hinterlegt',
    'sop.edit_manual': 'Anleitung Bearbeiten',
    'sop.save_changes': 'Änderungen Speichern',
    'sop.create_sop': 'Neue SOP Erstellen',

    // Scorecard & Filters
    'scorecard.filter_title': 'Zahlen Filtern',
    'scorecard.category_all': 'Alle Kategorien',
    'scorecard.category_evergreen': '🌲 Täglicher Betrieb',
    'scorecard.category_northstar': '⭐ Hauptziele',
    'scorecard.category_marketing': '📣 Marketing (Leads)',
    'scorecard.category_sales': '💼 Vertrieb (Abschlüsse)',
    'scorecard.status_all': 'Alle Status',
    'scorecard.status_green': '🟢 Auf Kurs (Gut)',
    'scorecard.status_yellow': '🟡 Achtung (Plan nötig)',
    'scorecard.status_red': '🔴 Kritisch (Handeln)',
    'scorecard.search_placeholder': 'Nach Name oder Verantwortlichem suchen...',
    'scorecard.showing': 'Zeige',
    'scorecard.of': 'von',
    'scorecard.metrics': 'Zahlen',
    'scorecard.add_metric': 'Neue Zahl Hinzufügen',
    'scorecard.rule_note': 'Einfache Regel: Immer montags morgens echte Zahlen eintragen.',
    'scorecard.col_name': 'Kennzahl (KPI)',
    'scorecard.col_unit': 'Einheit',
    'scorecard.col_w1': 'Woche 1',
    'scorecard.col_w2': 'Woche 2',
    'scorecard.col_w3': 'Woche 3',
    'scorecard.col_w4': 'Woche 4',
    'scorecard.col_target': 'Ziel',
    'scorecard.col_status': 'Status (Klicken zum Ändern)',
    'scorecard.col_owner': 'Verantwortlich',
    'scorecard.col_sop': 'Verknüpfte Anleitung (SOP)',
    'scorecard.col_action': 'Aktion',

    // Language Selector
    'lang.choose': 'Sprache',
    'lang.change_tooltip': 'App-Sprache ändern'
  },

  ar: {
    // Navigation (Arabic)
    'nav.home': 'الرئيسية',
    'nav.engines': '1. مسار العمل',
    'nav.playbooks': '2. قوائم الخطوات (SOP)',
    'nav.team': '3. الفريق والمسؤوليات',
    'nav.scorecard': '4. الأرقام الأسبوعية',
    'nav.sprint': '5. أهداف 90 يوماً',
    'nav.compass': '6. رؤية الشركة',
    'nav.settings': '7. الإعدادات والنسخ',
    'nav.enquiries': '8. رسائل العملاء',
    'nav.srs': '10. مواصفات النظام',

    // Headers & Subtitles
    'header.home.title': 'لوحة التحكم العامة',
    'header.home.sub': 'أرقام الشركة، والنشاطات الأخيرة، والاختصارات السريعة.',
    'header.engines.title': 'كيف يدار العمل',
    'header.engines.sub': 'خطوات كسب العملاء وتنفيذ الخدمات بكل وضوح.',
    'header.playbooks.title': 'أدلة وقوائم العمل (SOP)',
    'header.playbooks.sub': 'خطوات بسيطة ومباشرة لإنجاز كل مهمة بشكل صحيح.',
    'header.team.title': 'الفريق وتوزيع المهام',
    'header.team.sub': 'معرفة مسؤولية كل شخص داخل الشركة بدقة.',
    'header.scorecard.title': 'الأرقام الأسبوعية (Scorecard)',
    'header.scorecard.sub': 'متابعة الأرقام الأهم أسبوعياً للبقاء على المسار الصحيح.',
    'header.sprint.title': 'أهداف 90 يوماً والاجتماعات',
    'header.sprint.sub': 'التركيز على الأهداف الربعية ومراجعات العمل السريعة.',
    'header.compass.title': 'بوصلة الشركة والرؤية',
    'header.compass.sub': 'الهدف لثلاث سنوات، والقيم، وسبب اختيار العملاء لكم.',
    'header.enquiries.title': 'رسائل العملاء',
    'header.enquiries.sub': 'الطلبات الواردة، والملاحظات، والتواصل مع العملاء.',
    'header.settings.title': 'الإعدادات والنسخ الاحتياطي',
    'header.settings.sub': 'حفظ البيانات، وتغيير مساحات العمل، وإدارة الحساب.',

    // Common Buttons & Actions
    'action.save': 'حفظ',
    'action.cancel': 'إلغاء',
    'action.delete': 'حذف',
    'action.edit': 'تعديل',
    'action.add': 'إضافة',
    'action.add_step': 'إضافة خطوة',
    'action.add_step_quick': '+ إضافة الخطوة التالية',
    'action.search': 'بحث...',
    'action.clear': 'مسح',
    'action.filter': 'تصفية',
    'action.reset_filter': 'إعادة ضبط الفلاتر',
    'action.expand': 'توسيع',
    'action.collapse': 'طي',
    'action.undo': 'تراجع',
    'action.redo': 'إعادة',
    'action.close': 'إغلاق',

    // SOP & Checklist
    'sop.manual_details': 'دليل الإجراء والتعليمات',
    'sop.checklist_title': 'قائمة الخطوات المنفذة',
    'sop.unlock_condition': 'يجب إكماله أولاً:',
    'sop.none_always_open': 'لا يوجد (ابدأ في أي وقت)',
    'sop.requires': 'يتطلب:',
    'sop.step_placeholder': 'اكتب ما يجب فعله في هذه الخطوة...',
    'sop.blocked_by': 'في انتظار:',
    'sop.unlocked': 'جاهز للبدء',
    'sop.progress': 'الإنجاز:',
    'sop.video_walkthrough': 'دليل الفيديو',
    'sop.watch_video': 'مشاهدة الفيديو',
    'sop.no_video': 'لا يوجد رابط فيديو حالياً',
    'sop.edit_manual': 'تعديل الدليل',
    'sop.save_changes': 'حفظ التعديلات',
    'sop.create_sop': 'إنشاء SOP جديد',

    // Scorecard & Filters
    'scorecard.filter_title': 'تصفية الأرقام',
    'scorecard.category_all': 'جميع الفئات',
    'scorecard.category_evergreen': '🌲 العمليات اليومية',
    'scorecard.category_northstar': '⭐ الأهداف الأساسية',
    'scorecard.category_marketing': '📣 التسويق (العملاء المحتملون)',
    'scorecard.category_sales': '💼 المبيعات والصفقات',
    'scorecard.status_all': 'جميع الحالات',
    'scorecard.status_green': '🟢 ممتاز (على المسار)',
    'scorecard.status_yellow': '🟡 تنبيه (بحاجة لخطة)',
    'scorecard.status_red': '🔴 خطر (تحرك فوري)',
    'scorecard.search_placeholder': 'ابحث باسم الرقم أو المسؤول...',
    'scorecard.showing': 'عرض',
    'scorecard.of': 'من',
    'scorecard.metrics': 'أرقام',
    'scorecard.add_metric': 'إضافة رقم جديد للمتابعة',
    'scorecard.rule_note': 'قاعدة بسيطة: أدخل الأرقام الحقيقية صباح كل يوم إثنين.',
    'scorecard.col_name': 'الرقم المتابع (KPI)',
    'scorecard.col_unit': 'الوحدة',
    'scorecard.col_w1': 'الأسبوع 1',
    'scorecard.col_w2': 'الأسبوع 2',
    'scorecard.col_w3': 'الأسبوع 3',
    'scorecard.col_w4': 'الأسبوع 4',
    'scorecard.col_target': 'الهدف',
    'scorecard.col_status': 'الحالة (انقر للتغيير)',
    'scorecard.col_owner': 'المسؤول',
    'scorecard.col_sop': 'الدليل المرتبط (SOP)',
    'scorecard.col_action': 'إجراء',

    // Language Selector
    'lang.choose': 'اللغة',
    'lang.change_tooltip': 'تغيير لغة التطبيق'
  }
};

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, defaultText?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key, defaultText) => defaultText || key
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    try {
      const saved = localStorage.getItem('sOS_app_language') as SupportedLanguage;
      if (saved && TRANSLATIONS[saved]) return saved;
      // Auto-detect browser language if available
      const navLang = navigator.language?.slice(0, 2).toLowerCase();
      if (navLang === 'es' || navLang === 'fr' || navLang === 'sw' || navLang === 'pt' || navLang === 'de' || navLang === 'ar') {
        return navLang;
      }
    } catch {}
    return 'en';
  });

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('sOS_app_language', lang);
      if (lang === 'ar') {
        document.documentElement.dir = 'rtl';
      } else {
        document.documentElement.dir = 'ltr';
      }
    } catch {}
  };

  useEffect(() => {
    if (language === 'ar') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  }, [language]);

  const t = (key: string, defaultText?: string): string => {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS.en;
    if (langDict[key]) return langDict[key];
    const enDict = TRANSLATIONS.en;
    if (enDict[key]) return enDict[key];
    return defaultText || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
