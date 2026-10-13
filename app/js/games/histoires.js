// Histoires lues à voix haute en karaoké : le mot lu s'allume. Puis une question.
// Niveau 1 : écouter (réponses en images) ; niveaux 2 et 3 : lire en suivant ; niveau 4 :
// deviner ce qui n'est pas dit ; niveau 5 : 6 phrases ; niveau 6 : remettre les images dans l'ordre ;
// niveau 7 : le sens d'un mot ; niveau 8 : vrai, faux, ou l'histoire ne le dit pas.
// Chaque histoire a un identifiant stable (`id`) : un parent peut l'enregistrer de sa voix
// (recordings.js), et l'enregistrement remplace alors la voix de synthèse.

import { shuffle } from '../random.js';
import { pickSeasonal } from './helpers.js';
import { sonsActifs, texteDechiffrable } from '../graphemes.js';

const STORIES = [
  // ---- Niveau 1 : écouter une histoire (maternelle), réponses en images
  { id: 'chat-pelote', level: 1, title: 'Le chat et la pelote', emoji: '🐱', sentences: ['Minou est un petit chat.', 'Il joue avec une pelote de laine.', 'La pelote roule sous le lit !'],
    question: 'Avec quoi joue Minou ?', answer: '🧶', others: ['⚽', '🦴'] },
  { id: 'pluie', level: 1, title: 'La pluie', emoji: '🌧️', sentences: ['Il pleut très fort.', 'Léo met ses bottes et prend son parapluie.', 'Il saute dans les flaques !'],
    question: 'Que prend Léo ?', answer: '☂️', others: ['🕶️', '🧢'] },
  { id: 'gateau', level: 1, title: 'Le gâteau', emoji: '🎂', sentences: ['C’est l’anniversaire de Zoé.', 'Maman a fait un gros gâteau au chocolat.', 'Zoé souffle les bougies.'],
    question: 'C’est l’anniversaire de qui ?', answer: '👧', others: ['👴', '🐶'] },
  { id: 'petit-poisson', level: 1, title: 'Le petit poisson', emoji: '🐟', sentences: ['Un petit poisson nage dans la mer.', 'Il rencontre une grosse baleine.', 'Ils deviennent amis.'],
    question: 'Qui le poisson rencontre-t-il ?', answer: '🐳', others: ['🐱', '🐦'] },
  { id: 'au-parc', level: 1, title: 'Au parc', emoji: '🌳', sentences: ['Sami va au parc avec papi.', 'Il fait du toboggan.', 'Puis il mange une glace.'],
    question: 'Que mange Sami ?', answer: '🍦', others: ['🍕', '🍌'] },
  { id: 'ferme', level: 1, title: 'La ferme', emoji: '🚜', sentences: ['À la ferme, la vache fait meuh.', 'Le cochon se roule dans la boue.', 'La poule pond un œuf.'],
    question: 'Qui pond un œuf ?', answer: '🐔', others: ['🐄', '🐷'] },
  { id: 'bonne-nuit', level: 1, title: 'Bonne nuit', emoji: '🌙', sentences: ['Le soir, Lina met son pyjama.', 'Papa lui lit une histoire.', 'Lina s’endort avec son doudou lapin.'],
    question: 'Quel est le doudou de Lina ?', answer: '🐰', others: ['🐻', '🐶'] },
  { id: 'neige', level: 1, title: 'La neige', emoji: '❄️', sentences: ['Ce matin, tout est blanc.', 'Il a neigé toute la nuit.', 'Hugo fait un bonhomme de neige.'],
    question: 'Que fait Hugo ?', answer: '⛄', others: ['🏰', '🪁'] },

  // ---- Niveau 2 : lire en suivant (CP)
  { id: 'velo-rouge', level: 2, title: 'Le vélo rouge', emoji: '🚲', sentences: ['Tom a un vélo rouge.', 'Il roule vite dans la rue.', 'Oh non ! Il tombe.', 'Il a mal au genou, mais il repart.'],
    question: 'De quelle couleur est le vélo ?', answer: 'rouge', others: ['bleu', 'vert'] },
  { id: 'loup-gourmand', level: 2, title: 'Le loup gourmand', emoji: '🐺', sentences: ['Le loup a très faim.', 'Il voit un pot de miel.', 'Il le mange en entier.', 'Maintenant, il a mal au ventre !'],
    question: 'Que mange le loup ?', answer: 'du miel', others: ['une pomme', 'du pain'] },
  { id: 'sortie-mer', level: 2, title: 'La sortie à la mer', emoji: '🏖️', sentences: ['Samedi, Lou va à la mer.', 'Elle ramasse des coquillages.', 'Elle les met dans son seau.', 'Le soir, elle les montre à mamie.'],
    question: 'Que ramasse Lou ?', answer: 'des coquillages', others: ['des fleurs', 'des cailloux'] },
  { id: 'chien-perdu', level: 2, title: 'Le chien perdu', emoji: '🐶', sentences: ['Un petit chien pleure dans la rue.', 'Nina le prend dans ses bras.', 'Sur son collier, il y a un nom : Pilou.', 'Nina le ramène chez lui.'],
    question: 'Comment s’appelle le chien ?', answer: 'Pilou', others: ['Nina', 'Médor'] },
  { id: 'cabane', level: 2, title: 'La cabane', emoji: '🛖', sentences: ['Dans le jardin, Max fait une cabane.', 'Il prend des branches et une vieille couverture.', 'Sa sœur l’aide.', 'Ils y mangent leur goûter.'],
    question: 'Qui aide Max ?', answer: 'sa sœur', others: ['son papa', 'son chien'] },
  { id: 'fusee', level: 2, title: 'La fusée', emoji: '🚀', sentences: ['Léa construit une fusée en carton.', 'Elle la peint en jaune.', 'Elle met un casque sur sa tête.', 'Cinq, quatre, trois, deux, un… décollage !'],
    question: 'En quoi est la fusée ?', answer: 'en carton', others: ['en bois', 'en fer'] },

  // ---- Niveau 3 : histoires plus longues (CE1)
  { id: 'tresor-grenier', level: 3, title: 'Le trésor du grenier', emoji: '🗝️', sentences: ['Un jour de pluie, Arthur monte au grenier.', 'Sous une couverture, il trouve un vieux coffre.', 'Il l’ouvre doucement : dedans, il y a des photos de son grand-père enfant.', 'Le soir, son grand-père lui raconte ses souvenirs.'],
    question: 'Qu’y a-t-il dans le coffre ?', answer: 'des photos', others: ['de l’or', 'des jouets'] },
  { id: 'course-escargots', level: 3, title: 'La course des escargots', emoji: '🐌', sentences: ['Dans le potager, deux escargots font la course.', 'Le premier part très vite, puis s’endort sous une feuille de salade.', 'Le second avance lentement, sans jamais s’arrêter.', 'C’est lui qui gagne la course !'],
    question: 'Pourquoi le premier escargot perd-il ?', answer: 'il s’endort', others: ['il se perd', 'il a peur'] },
  { id: 'cerf-volant', level: 3, title: 'Le cerf-volant', emoji: '🪁', sentences: ['Chloé et son père vont sur la colline avec un cerf-volant.', 'Le vent souffle fort, le cerf-volant monte très haut.', 'Soudain, la ficelle casse !', 'Le cerf-volant atterrit dans un arbre, et un pompier vient le chercher.'],
    question: 'Qui va chercher le cerf-volant ?', answer: 'un pompier', others: ['le père de Chloé', 'un oiseau'] },
  { id: 'boulangerie', level: 3, title: 'La boulangerie', emoji: '🥐', sentences: ['Tous les dimanches, Malo achète le pain.', 'Il demande une baguette et trois croissants.', 'La boulangère lui rend la monnaie en souriant.', 'Sur le chemin, Malo croque un petit bout de baguette !'],
    question: 'Combien de croissants Malo achète-t-il ?', answer: 'trois', others: ['deux', 'cinq'] },

  // ---- Niveau 4 : pourquoi ? comment se sent-il ? (la réponse n'est pas écrite dans l'histoire)
  { id: 'parapluie-oublie', level: 4, title: 'Le parapluie oublié', emoji: '🌂', sentences: ['Ce matin, le ciel est tout gris.', 'Maman dit à Tom de prendre son parapluie, mais il l’oublie.', 'À midi, Tom rentre de l’école.', 'Il est trempé de la tête aux pieds !'],
    question: 'Pourquoi Tom est-il trempé ?', answer: 'il a plu', others: ['il a nagé', 'il a couru'] },
  { id: 'paquet-dore', level: 4, title: 'Le paquet doré', emoji: '🎁', sentences: ['Lila emballe une boîte dans du papier doré.', 'Elle dessine des cœurs sur une carte.', 'Demain, c’est la fête des mères.', 'Vite, Lila cache la boîte sous son lit !'],
    question: 'Pour qui est le cadeau ?', answer: 'pour maman', others: ['pour papa', 'pour Lila'] },
  { id: 'glace-fraise', level: 4, title: 'La glace à la fraise', emoji: '🍦', sentences: ['Il fait très chaud.', 'Hugo achète une glace à la fraise.', 'Il parle longtemps avec son copain.', 'Quand il veut la manger, sa main est toute collante !'],
    question: 'Pourquoi la main d’Hugo colle-t-elle ?', answer: 'la glace a fondu', others: ['il a du miel', 'il a peint'] },
  { id: 'pirate-attend', level: 4, title: 'Pirate attend', emoji: '🐕', sentences: ['À quatre heures, Pirate s’assoit devant la porte.', 'Il remue la queue en regardant la rue.', 'Quand le bus jaune s’arrête, il aboie de joie.', 'Emma descend du bus et court le caresser.'],
    question: 'Qui Pirate attend-il ?', answer: 'Emma', others: ['le facteur', 'le chat'] },
  { id: 'tour-cubes', level: 4, title: 'La tour de cubes', emoji: '🧱', sentences: ['Nina construit une très haute tour.', 'Son petit frère arrive en courant.', 'Boum ! La tour tombe par terre.', 'Nina croise les bras et fronce les sourcils.'],
    question: 'Comment se sent Nina ?', answer: 'elle est fâchée', others: ['elle est contente', 'elle a faim'] },
  { id: 'traces', level: 4, title: 'Les traces', emoji: '🐾', sentences: ['Ce matin, il y a de la neige dans le jardin.', 'Léon voit de petites traces de pattes.', 'Elles vont jusqu’à la cabane du lapin.', 'La porte de la cabane est ouverte !'],
    question: 'Qui a laissé les traces ?', answer: 'le lapin', others: ['un ours', 'le facteur'] },

  // ---- Niveau 5 : histoires en 6 phrases (plus de détails à retenir, l'ordre des événements)
  { id: 'pique-nique', level: 5, title: 'Le pique-nique', emoji: '🧺', sentences: ['Dimanche, la famille part pique-niquer.', 'Papa porte le grand panier.', 'Les enfants posent une nappe sur l’herbe.', 'Oh ! Une fourmi grimpe sur le sandwich de Léa.', 'Tout le monde rit.', 'Après le repas, ils jouent au ballon.'],
    question: 'Que font-ils après le repas ?', answer: 'ils jouent au ballon', others: ['ils dorment', 'ils nagent'] },
  { id: 'spectacle', level: 5, title: 'Le spectacle', emoji: '🎭', sentences: ['Ce soir, Clara joue au spectacle.', 'Elle porte un costume de papillon.', 'Avant de monter sur scène, elle a peur.', 'Elle cherche ses parents dans la salle.', 'Quand elle les voit, elle se sent mieux.', 'À la fin, tout le monde applaudit.'],
    question: 'Qu’est-ce qui rassure Clara ?', answer: 'voir ses parents', others: ['son costume', 'la musique'] },
  { id: 'petit-bateau', level: 5, title: 'Le petit bateau', emoji: '⛵', sentences: ['Malo et papi fabriquent un bateau en bois.', 'Ils peignent la voile en blanc.', 'Puis ils vont à la rivière.', 'Malo pose le bateau sur l’eau.', 'Oh non ! Le courant l’emporte.', 'Papi le rattrape juste avant le pont.'],
    question: 'Qui rattrape le bateau ?', answer: 'papi', others: ['Malo', 'un pêcheur'] },
  { id: 'dent-qui-bouge', level: 5, title: 'La dent qui bouge', emoji: '🦷', sentences: ['Une dent de Sofia bouge.', 'Au dîner, elle croque une pomme.', 'Crac ! La dent tombe dans l’assiette.', 'Sofia la range dans une petite boîte.', 'Le soir, elle la glisse sous l’oreiller.', 'Le matin, il y a une pièce à la place !'],
    question: 'Quand la dent tombe-t-elle ?', answer: 'au dîner', others: ['le matin', 'à l’école'] },
  { id: 'herisson', level: 5, title: 'Le hérisson', emoji: '🦔', sentences: ['Un soir, Jules entend du bruit dehors.', 'Il prend sa lampe et s’approche.', 'C’est un petit hérisson qui a faim !', 'Jules lui apporte un bol d’eau.', 'Le hérisson boit, puis il repart.', 'Depuis, Jules le guette chaque soir.'],
    question: 'Que donne Jules au hérisson ?', answer: 'de l’eau', others: ['du lait', 'du pain'] },
  { id: 'marche', level: 5, title: 'Le marché', emoji: '🍅', sentences: ['Rose va au marché avec mamie.', 'Elles achètent des tomates et du fromage.', 'Le marchand donne une pomme à Rose.', 'Sur le chemin, il se met à pleuvoir.', 'Elles courent sous un grand arbre.', 'Rose croque sa pomme en attendant.'],
    question: 'Que se passe-t-il sur le chemin ?', answer: 'il pleut', others: ['il neige', 'Rose tombe'] },

  // ---- Niveau 6 : remettre les images dans l'ordre de l'histoire (début, milieu, fin)
  { id: 'fleur-zoe', level: 6, title: 'La fleur de Zoé', emoji: '🌱', sentences: ['Zoé plante une graine.', 'Elle l’arrose tous les jours.', 'Une petite pousse sort de la terre.', 'Bientôt, une belle fleur s’ouvre !'],
    steps: [['💧', 'Zoé arrose'], ['🌱', 'la pousse sort'], ['🌻', 'la fleur s’ouvre']] },
  { id: 'bonhomme', level: 6, title: 'Le bonhomme', emoji: '⛄', sentences: ['Il neige toute la nuit.', 'Le matin, Max fait un bonhomme de neige.', 'Puis le soleil se met à briller.', 'Le bonhomme fond…'],
    steps: [['🌨️', 'il neige'], ['⛄', 'le bonhomme de neige'], ['☀️', 'le soleil brille']] },
  { id: 'poussin', level: 6, title: 'Le poussin', emoji: '🐣', sentences: ['La poule couve son œuf.', 'Crac ! La coquille se casse.', 'Un petit poussin sort.', 'Il suit sa maman partout.'],
    steps: [['🥚', 'l’œuf'], ['🐣', 'le poussin sort'], ['🐔', 'avec sa maman']] },
  { id: 'chenille', level: 6, title: 'La chenille', emoji: '🐛', sentences: ['Sur une feuille, il y a un petit œuf.', 'Une chenille en sort et mange.', 'Elle dort dans un cocon.', 'Un matin, un papillon s’envole !'],
    steps: [['🥚', 'l’œuf'], ['🐛', 'la chenille'], ['🦋', 'le papillon']] },
  { id: 'gateau-ines', level: 6, title: 'Le gâteau d’Inès', emoji: '🎂', sentences: ['Papa et Inès cassent des œufs.', 'Ils mélangent tout dans un bol.', 'Le gâteau cuit dans le four.', 'Le soir, Inès souffle les bougies !'],
    steps: [['🥚', 'les œufs'], ['🥣', 'on mélange'], ['🎂', 'les bougies']] },
  { id: 'journee-leo', level: 6, title: 'La journée de Léo', emoji: '🕗', sentences: ['Léo prend son petit déjeuner.', 'Ensuite, il va à l’école à vélo.', 'Le soir, il prend son bain.', 'Puis il s’endort.'],
    steps: [['🥣', 'le petit déjeuner'], ['🚲', 'à vélo'], ['🛁', 'le bain']] },

  // ---- Histoires de saison (identifiants de themes.js) : pendant leur saison, une histoire
  // sur deux en est une ; hors saison, elles ne sont jamais proposées. Ajoutées à la fin
  // pour ne rien changer au tirage des autres histoires.
  { id: 'sapin', season: 'noel', level: 1, title: 'Le sapin', emoji: '🎄', sentences: ['C’est bientôt Noël.', 'Papa et Jade décorent le sapin.', 'Jade met une étoile tout en haut !'],
    question: 'Que met Jade en haut du sapin ?', answer: '⭐', others: ['🎈', '🧦'] },
  { id: 'lettre-pere-noel', season: 'noel', level: 2, title: 'La lettre au père Noël', emoji: '✉️', sentences: ['Malo écrit une lettre au père Noël.', 'Il demande un petit train rouge.', 'Il dessine un renne dessus.', 'Puis il la poste avec maman.'],
    question: 'Que demande Malo ?', answer: 'un train', others: ['un ballon', 'une poupée'] },
  { id: 'matin-noel', season: 'noel', level: 4, title: 'Le matin de Noël', emoji: '🎁', sentences: ['Ce matin, Léna se lève très tôt.', 'Elle descend l’escalier sans faire de bruit.', 'Sous le sapin, il y a plein de paquets !', 'Le verre de lait est vide et les biscuits ont disparu.'],
    question: 'Qui a mangé les biscuits ?', answer: 'le père Noël', others: ['le chat', 'Léna'] },
  { id: 'citrouille', season: 'halloween', level: 1, title: 'La citrouille', emoji: '🎃', sentences: ['C’est bientôt Halloween.', 'Papi et Lou creusent une citrouille.', 'Ils mettent une bougie dedans.'],
    question: 'Que mettent-ils dans la citrouille ?', answer: '🕯️', others: ['🍬', '🧸'] },
  { id: 'soir-halloween', season: 'halloween', level: 5, title: 'Le soir d’Halloween', emoji: '🦇', sentences: ['Ce soir, c’est Halloween.', 'Adam se déguise en fantôme.', 'Avec sa sœur, il sonne chez les voisins.', 'Madame Rose leur donne des sucettes.', 'Sur le chemin, un chat noir passe devant eux.', 'Adam sursaute, puis il éclate de rire.'],
    question: 'En quoi Adam est-il déguisé ?', answer: 'en fantôme', others: ['en sorcier', 'en vampire'] },
  { id: 'luge', season: 'hiver', level: 1, title: 'La luge', emoji: '🏔️', sentences: ['Il a neigé sur la colline.', 'Tom s’assoit sur sa luge.', 'Hop ! Il glisse jusqu’en bas.'],
    question: 'Sur quoi glisse Tom ?', answer: '🛷', others: ['🚲', '🛴'] },
  { id: 'galette-rois', season: 'hiver', level: 3, title: 'La galette des rois', emoji: '👑', sentences: ['En janvier, on partage la galette des rois.', 'Sous la table, le plus jeune dit à qui donner chaque part.', 'Dans sa part, Inès sent quelque chose de dur : c’est la fève !', 'Elle devient la reine et porte la couronne.'],
    question: 'Que trouve Inès dans sa part ?', answer: 'la fève', others: ['une bague', 'une pièce'] },
  { id: 'chasse-oeufs', season: 'printemps', level: 1, title: 'La chasse aux œufs', emoji: '🥚', sentences: ['C’est Pâques !', 'Lucas cherche des œufs dans le jardin.', 'Il en trouve un sous une fleur.'],
    question: 'Où Lucas trouve-t-il un œuf ?', answer: '🌷', others: ['🚗', '🛁'] },
  { id: 'hirondelles', season: 'printemps', level: 4, title: 'Les hirondelles', emoji: '🌸', sentences: ['Les jours sont plus longs et plus doux.', 'Les arbres du jardin se couvrent de fleurs.', 'Les hirondelles reviennent faire leur nid.', 'Papi range les gros manteaux au grenier.'],
    question: 'Quelle saison commence ?', answer: 'le printemps', others: ['l’hiver', 'l’automne'] },
  { id: 'pasteque', season: 'ete', level: 1, title: 'La pastèque', emoji: '☀️', sentences: ['C’est l’été.', 'Mamie coupe une grosse pastèque.', 'Rayan croque une tranche bien fraîche.'],
    question: 'Que coupe mamie ?', answer: '🍉', others: ['🍞', '🎂'] },
  { id: 'feu-artifice', season: 'ete', level: 4, title: 'Le feu d’artifice', emoji: '🎆', sentences: ['Ce soir, c’est le 14 Juillet.', 'Il fait nuit et tout le monde regarde le ciel.', 'Boum ! Des étoiles de toutes les couleurs éclatent.', 'Le petit chien de Léo se cache sous le banc.'],
    question: 'Pourquoi le chien se cache-t-il ?', answer: 'il a peur', others: ['il a froid', 'il a faim'] },
  { id: 'foret-automne', season: 'automne', level: 1, title: 'Dans la forêt', emoji: '🍂', sentences: ['C’est l’automne.', 'Maya ramasse des châtaignes.', 'Dans un arbre, un écureuil la regarde.'],
    question: 'Qui regarde Maya ?', answer: '🐿️', others: ['🐻', '🦉'] },
  { id: 'pomme-papi', season: 'automne', level: 6, title: 'La pomme de papi', emoji: '🍎', sentences: ['Le pommier de papi est en fleurs.', 'Une petite pomme verte pousse.', 'Elle grandit tout l’été.', 'En automne, elle est toute rouge !'],
    steps: [['🌸', 'les fleurs'], ['🍏', 'la pomme verte'], ['🍎', 'la pomme rouge']] },

  // ---- Niveau 7 : le sens d'un mot nouveau, deviné grâce à l'histoire (vocabulaire)
  { id: 'bonnet-perdu', level: 7, title: 'Le bonnet perdu', emoji: '🧣', sentences: ['Il neige et Paul a perdu son bonnet.', 'Dans la cour, il grelotte.', 'Son amie Inès lui prête son écharpe.', 'Paul se sent tout de suite mieux.'],
    question: 'Que veut dire « il grelotte » ?', answer: 'il tremble de froid', others: ['il chante fort', 'il court vite'] },
  { id: 'gros-orage', level: 7, title: 'Le gros orage', emoji: '⛈️', sentences: ['Le ciel devient tout noir.', 'Un éclair traverse le ciel, puis le tonnerre gronde.', 'Le petit chat est terrifié.', 'Il file se cacher sous le lit.'],
    question: 'Que veut dire « terrifié » ?', answer: 'il a très peur', others: ['il est très content', 'il a très faim'] },
  { id: 'soupe-mamie', level: 7, title: 'La soupe de mamie', emoji: '🥣', sentences: ['Mamie sert une soupe de légumes.', 'Attention, elle est brûlante !', 'Léo souffle doucement sur sa cuillère.', 'Puis il la boit à petites gorgées.'],
    question: 'Que veut dire « brûlante » ?', answer: 'très chaude', others: ['très froide', 'très sucrée'] },
  { id: 'grand-menage', level: 7, title: 'Le grand ménage', emoji: '🧹', sentences: ['Samedi, toute la famille range la maison.', 'Lou passe le balai et papa lave les vitres.', 'Le soir, tout le monde est épuisé.', 'Ils s’endorment très vite !'],
    question: 'Que veut dire « épuisé » ?', answer: 'très fatigué', others: ['très sale', 'très joyeux'] },
  { id: 'provisions-ecureuil', level: 7, title: 'Les provisions', emoji: '🐿️', sentences: ['En automne, l’écureuil ramasse des noisettes.', 'Il les cache dans le creux d’un arbre.', 'Ce sont ses provisions pour l’hiver.', 'Quand il fera froid, il aura de quoi manger.'],
    question: 'Que sont des « provisions » ?', answer: 'de la nourriture', others: ['des jouets', 'des vêtements'] },
  { id: 'secret-zoe', level: 7, title: 'Le secret', emoji: '🤫', sentences: ['Zoé a un secret pour son amie Léna.', 'Elle se penche vers elle et lui chuchote quelque chose.', 'Personne d’autre ne peut entendre.', 'Léna sourit.'],
    question: 'Que veut dire « chuchoter » ?', answer: 'parler tout bas', others: ['crier très fort', 'chanter'] },

  // ---- Niveau 8 : vrai, faux, ou l'histoire ne le dit pas ? (la question est une phrase à juger)
  { id: 'rex-balle', level: 8, title: 'Rex et la balle', emoji: '🐕', sentences: ['Rex est le chien de Malik.', 'Chaque soir, ils jouent à la balle dans le jardin.', 'Ce soir, la balle passe par-dessus la haie.', 'Rex va la chercher chez la voisine.'],
    question: 'Rex et Malik jouent le matin.', answer: 'faux', others: ['vrai', 'on ne sait pas'] },
  { id: 'piscine-jade', level: 8, title: 'À la piscine', emoji: '🏊', sentences: ['Mercredi, Jade va à la piscine avec son père.', 'Elle met ses lunettes et saute dans l’eau.', 'Elle nage jusqu’au bout du bassin.', 'Son père l’applaudit.'],
    question: 'Jade sait nager.', answer: 'vrai', others: ['faux', 'on ne sait pas'] },
  { id: 'gouter-lea', level: 8, title: 'Le goûter de Léa', emoji: '🍪', sentences: ['À quatre heures, Léa ouvre son sac.', 'Elle a des biscuits et une pomme.', 'Elle partage ses biscuits avec Sami.', 'Sami lui dit merci.'],
    question: 'Sami aime les pommes.', answer: 'on ne sait pas', others: ['vrai', 'faux'] },
  { id: 'train-papi', level: 8, title: 'Le train de papi', emoji: '🚂', sentences: ['Papi offre un petit train à Hugo.', 'Le train a trois wagons rouges.', 'Hugo construit un grand circuit dans sa chambre.', 'Le train fait le tour du lit !'],
    question: 'Le train a trois wagons.', answer: 'vrai', others: ['faux', 'on ne sait pas'] },
  { id: 'dessin-nina', level: 8, title: 'Le dessin de Nina', emoji: '🎨', sentences: ['En classe, Nina dessine une maison.', 'Elle peint le toit en rouge et la porte en bleu.', 'La maîtresse accroche le dessin au mur.'],
    question: 'La porte de la maison est rouge.', answer: 'faux', others: ['vrai', 'on ne sait pas'] },
  { id: 'sans-roulettes', level: 8, title: 'Sans les roulettes', emoji: '🚲', sentences: ['Aujourd’hui, Adam enlève les roulettes de son vélo.', 'Maman tient la selle, puis elle la lâche.', 'Adam roule tout seul jusqu’au portail !'],
    question: 'Le vélo d’Adam est bleu.', answer: 'on ne sait pas', others: ['vrai', 'faux'] },

  // ---- Histoires ajoutées pour que chaque niveau en ait au moins 15 (une partie de 10 questions
  // ne repose pas deux fois la même). Ajoutées à la fin : le tirage des autres ne change pas d'ordre.
  // Niveau 1 : écouter, réponses en images
  { id: 'bain-canard', level: 1, title: 'Le bain', emoji: '🛁', sentences: ['Ce soir, Noé prend son bain.', 'Il joue avec un petit canard.', 'Le canard flotte sur l’eau.'],
    question: 'Avec quoi joue Noé ?', answer: '🦆', others: ['⚽', '🧸'] },
  { id: 'tambour', level: 1, title: 'La musique', emoji: '🎵', sentences: ['Léna aime la musique.', 'Elle tape très fort sur son tambour.', 'Boum, boum, boum !'],
    question: 'Sur quoi tape Léna ?', answer: '🥁', others: ['🎸', '🎺'] },
  { id: 'train-mamie', level: 1, title: 'Le train', emoji: '🚉', sentences: ['Adam va chez mamie.', 'Il prend le train avec papa.', 'Le train roule très vite !'],
    question: 'Que prend Adam ?', answer: '🚂', others: ['🚌', '✈️'] },
  { id: 'dessin-soleil', level: 1, title: 'Le beau dessin', emoji: '🖍️', sentences: ['Malo prend ses crayons.', 'Il dessine un gros soleil.', 'Il offre son dessin à maman.'],
    question: 'Que dessine Malo ?', answer: '☀️', others: ['🌙', '🏠'] },
  { id: 'escargot', level: 1, title: 'Au jardin', emoji: '🌿', sentences: ['Rose va au jardin.', 'Sur une feuille, elle voit un escargot.', 'Il avance tout doucement.'],
    question: 'Que voit Rose sur la feuille ?', answer: '🐌', others: ['🐞', '🐝'] },
  { id: 'balle-filou', level: 1, title: 'Filou', emoji: '🐕', sentences: ['Filou est un petit chien.', 'Il court après sa balle.', 'Il la rapporte à Tom.'],
    question: 'Que rapporte Filou ?', answer: '🎾', others: ['🦴', '👟'] },
  { id: 'cueillette-fraises', level: 1, title: 'La cueillette', emoji: '🧺', sentences: ['Mamie et Lou vont au jardin.', 'Elles cueillent des fraises.', 'Miam, elles sont bien sucrées !'],
    question: 'Que ramassent-elles ?', answer: '🍓', others: ['🍎', '🍇'] },
  { id: 'hibou', level: 1, title: 'La nuit', emoji: '🌙', sentences: ['La nuit, tout le monde dort.', 'Dans un arbre, un hibou ouvre les yeux.', 'Il fait : hou, hou !'],
    question: 'Quel animal est dans l’arbre ?', answer: '🦉', others: ['🐶', '🐄'] },

  // Niveau 2 : lire en suivant
  { id: 'pizza', level: 2, title: 'La pizza', emoji: '🍕', sentences: ['Ce soir, Sacha fait une pizza avec papa.', 'Il met de la tomate et du fromage.', 'Papa la fait cuire dans le four.', 'Miam, elle est prête !'],
    question: 'Que met Sacha sur la pizza ?', answer: 'du fromage', others: ['du chocolat', 'des fraises'] },
  { id: 'nid', level: 2, title: 'Le nid', emoji: '🐦', sentences: ['Dans le jardin, Malo regarde un arbre.', 'Il voit un nid sur une branche.', 'Dans le nid, il y a trois oisillons.', 'Ils ouvrent grand le bec.'],
    question: 'Combien y a-t-il d’oisillons ?', answer: 'trois', others: ['deux', 'cinq'] },
  { id: 'cadeau-lili', level: 2, title: 'Le cadeau de Lili', emoji: '🎁', sentences: ['C’est l’anniversaire de Lili.', 'Elle ouvre un gros paquet.', 'Dedans, il y a une poupée.', 'Lili lui fait un bisou.'],
    question: 'Qu’y a-t-il dans le paquet ?', answer: 'une poupée', others: ['un ballon', 'un livre'] },
  { id: 'pompier', level: 2, title: 'Le casque rouge', emoji: '🚒', sentences: ['Jules veut être pompier.', 'Il met un casque rouge.', 'Il prend le tuyau d’arrosage.', 'Il arrose toutes les fleurs du jardin !'],
    question: 'Que veut être Jules ?', answer: 'pompier', others: ['boulanger', 'docteur'] },
  { id: 'chaton-flocon', level: 2, title: 'Flocon', emoji: '🐱', sentences: ['Rose a un chaton tout blanc.', 'Il s’appelle Flocon.', 'Il dort dans un petit panier.', 'Le matin, il mange ses croquettes.'],
    question: 'Où dort le chaton ?', answer: 'dans un panier', others: ['sur le toit', 'dans la baignoire'] },
  { id: 'cirque', level: 2, title: 'Au cirque', emoji: '🤡', sentences: ['Ce soir, Nora va au cirque.', 'Un clown fait des grimaces.', 'Puis il jongle avec trois balles.', 'Nora rit très fort !'],
    question: 'Que fait le clown ?', answer: 'des grimaces', others: ['des crêpes', 'des dessins'] },
  { id: 'tortue-pistache', level: 2, title: 'Pistache', emoji: '🐢', sentences: ['Mamie a une tortue.', 'Elle s’appelle Pistache.', 'Elle mange de la salade.', 'Elle marche très lentement.'],
    question: 'Que mange la tortue ?', answer: 'de la salade', others: ['du pain', 'des bonbons'] },
  { id: 'coiffeur', level: 2, title: 'Chez le coiffeur', emoji: '💇', sentences: ['Aujourd’hui, Tom va chez le coiffeur.', 'Il s’assoit sur un grand fauteuil.', 'Le coiffeur coupe ses cheveux.', 'Tom se trouve très beau !'],
    question: 'Qui coupe les cheveux de Tom ?', answer: 'le coiffeur', others: ['le docteur', 'le boulanger'] },
  { id: 'girafe', level: 2, title: 'La sortie au zoo', emoji: '🦒', sentences: ['Avec l’école, Lina va au zoo.', 'Elle voit une girafe au long cou.', 'La girafe mange des feuilles.', 'Lina prend une photo.'],
    question: 'Quel animal voit Lina ?', answer: 'une girafe', others: ['un éléphant', 'un lion'] },

  // Niveau 3 : histoires plus longues
  { id: 'potager-papi', level: 3, title: 'Le potager de papi', emoji: '🥕', sentences: ['Au printemps, Lucas aide papi dans son potager.', 'Ensemble, ils sèment des graines de carottes.', 'Tout l’été, Lucas arrose les petites pousses.', 'En automne, ils récoltent les carottes et font une bonne soupe.'],
    question: 'Que sèment Lucas et papi ?', answer: 'des carottes', others: ['des tomates', 'des fraises'] },
  { id: 'tente', level: 3, title: 'Une nuit dans le jardin', emoji: '⛺', sentences: ['Ce soir, Léo et sa sœur dorment sous une tente dans le jardin.', 'Ils emportent des coussins, une lampe et des biscuits.', 'Par la porte ouverte, ils regardent les étoiles.', 'Puis ils s’endorment en écoutant les grillons.'],
    question: 'Où dorment Léo et sa sœur ?', answer: 'sous une tente', others: ['dans un bateau', 'chez mamie'] },
  { id: 'bibliotheque', level: 3, title: 'La bibliothèque', emoji: '📚', sentences: ['Le mercredi, Emma va à la bibliothèque avec maman.', 'Elle choisit un livre sur les dinosaures.', 'La bibliothécaire lui dit de le rendre dans trois semaines.', 'Le soir même, Emma le lit en entier !'],
    question: 'De quoi parle le livre d’Emma ?', answer: 'des dinosaures', others: ['des chevaux', 'des pirates'] },
  { id: 'match-foot', level: 3, title: 'Le match de foot', emoji: '⚽', sentences: ['Samedi, l’équipe de Nassim joue un match de foot.', 'Il pleut et le terrain est plein de boue.', 'À la dernière minute, Nassim passe le ballon à son amie Jeanne.', 'Jeanne tire et marque le but de la victoire !'],
    question: 'Qui marque le but de la victoire ?', answer: 'Jeanne', others: ['Nassim', 'l’arbitre'] },
  { id: 'chat-voisine', level: 3, title: 'Le chat de la voisine', emoji: '🐈', sentences: ['Chaque matin, un gros chat gris vient dans le jardin d’Anaïs.', 'Il s’assoit sur le muret et la regarde.', 'Anaïs l’appelle Nuage, car il est tout doux.', 'Un jour, la voisine lui dit en riant que son chat s’appelle Gaston !'],
    question: 'Comment s’appelle vraiment le chat ?', answer: 'Gaston', others: ['Nuage', 'Anaïs'] },
  { id: 'gateau-yaourt', level: 3, title: 'Le gâteau au yaourt', emoji: '🍰', sentences: ['Mamie apprend à Louna à faire un gâteau au yaourt.', 'Le pot de yaourt vide sert à mesurer la farine et le sucre.', 'Louna casse les œufs toute seule.', 'Pendant la cuisson, toute la maison sent bon !'],
    question: 'À quoi sert le pot de yaourt ?', answer: 'à mesurer', others: ['à boire', 'à décorer'] },
  { id: 'dauphins-bateau', level: 3, title: 'La promenade en bateau', emoji: '⛵', sentences: ['Pendant les vacances, Léon fait une promenade en bateau.', 'Le capitaine montre une petite île avec un phare.', 'Soudain, des dauphins sautent à côté du bateau.', 'Léon les regarde jusqu’à ce qu’ils disparaissent.'],
    question: 'Quels animaux sautent à côté du bateau ?', answer: 'des dauphins', others: ['des baleines', 'des mouettes'] },
  { id: 'pull-mamie', level: 3, title: 'Le pull de mamie', emoji: '🧶', sentences: ['Mamie tricote un pull vert pour Arthur.', 'Elle y travaille tous les soirs pendant un mois.', 'Quand Arthur l’essaie, les manches sont beaucoup trop longues !', 'Mamie rit : « Tu le porteras l’année prochaine. »'],
    question: 'Quand Arthur mettra-t-il le pull ?', answer: 'l’année prochaine', others: ['demain', 'ce soir'] },
  { id: 'concours-dessin', level: 3, title: 'Le concours de dessin', emoji: '🎨', sentences: ['À l’école, il y a un concours de dessin sur la mer.', 'Inès dessine une pieuvre avec huit bras de toutes les couleurs.', 'Son ami Hugo dessine un sous-marin jaune.', 'C’est Inès qui gagne le premier prix !'],
    question: 'Que dessine Inès ?', answer: 'une pieuvre', others: ['un sous-marin', 'un requin'] },
  { id: 'panne-courant', level: 3, title: 'La panne', emoji: '🕯️', sentences: ['Un soir, toutes les lumières de la maison s’éteignent.', 'Papa allume des bougies sur la table.', 'Toute la famille joue aux cartes.', 'Quand la lumière revient, personne ne veut arrêter la partie !'],
    question: 'À quoi joue la famille ?', answer: 'aux cartes', others: ['au ballon', 'à cache-cache'] },
  { id: 'carnaval', level: 3, title: 'Le carnaval', emoji: '🎭', sentences: ['Aujourd’hui, c’est le carnaval de l’école.', 'Malia est déguisée en lion, avec une crinière en laine.', 'Son ami Paul a un costume de chevalier.', 'Tous les enfants défilent dans la rue en chantant.'],
    question: 'En quoi Malia est-elle déguisée ?', answer: 'en lion', others: ['en chevalier', 'en princesse'] },

  // Niveau 4 : pourquoi ? (la réponse n'est pas écrite dans l'histoire)
  { id: 'pansement', level: 4, title: 'Dans la cour', emoji: '🩹', sentences: ['Jade court très vite dans la cour.', 'Elle ne voit pas la grosse pierre.', 'La maîtresse lui met un pansement sur le genou.', 'Jade essuie ses larmes et repart jouer.'],
    question: 'Pourquoi Jade a-t-elle un pansement ?', answer: 'elle est tombée', others: ['elle a froid', 'elle a gagné'] },
  { id: 'gateau-brule', level: 4, title: 'Une drôle d’odeur', emoji: '👃', sentences: ['Papa met un gâteau au four et va lire.', 'Il oublie de surveiller la cuisson.', 'Une drôle d’odeur arrive de la cuisine.', 'Papa ouvre le four : oh non, tout est noir !'],
    question: 'Qu’est-il arrivé au gâteau ?', answer: 'il a brûlé', others: ['il a gelé', 'il est tombé'] },
  { id: 'facteur', level: 4, title: 'On sonne', emoji: '🔔', sentences: ['Un monsieur avec une grosse sacoche sonne à la porte.', 'Il tend une enveloppe à Chloé.', 'Dessus, il y a un timbre et le nom de Chloé.', 'C’est une carte de sa cousine !'],
    question: 'Qui sonne à la porte ?', answer: 'le facteur', others: ['le boulanger', 'le pompier'] },
  { id: 'papi-cherche', level: 4, title: 'Papi cherche partout', emoji: '👴', sentences: ['Papi veut lire son journal.', 'Il cherche sous les coussins et dans ses poches.', 'Lina éclate de rire et montre le haut de sa tête.', 'Papi rit aussi : elles étaient là depuis le début !'],
    question: 'Que cherche papi ?', answer: 'ses lunettes', others: ['son journal', 'ses clés'] },
  { id: 'bebe-dort', level: 4, title: 'Sur la pointe des pieds', emoji: '👶', sentences: ['Maman pose un doigt sur sa bouche : « Chut ! »', 'Dans la chambre, le bébé a enfin fermé les yeux.', 'Alors Malo marche sur la pointe des pieds.', 'Il ferme la porte tout doucement.'],
    question: 'Pourquoi Malo marche-t-il doucement ?', answer: 'le bébé dort', others: ['il a mal au pied', 'il joue au loup'] },
  { id: 'laisse-oscar', level: 4, title: 'La laisse', emoji: '🐕', sentences: ['Oscar prend sa laisse dans sa gueule.', 'Il la pose aux pieds de papa.', 'Puis il gratte à la porte en remuant la queue.', 'Papa sourit et met son manteau.'],
    question: 'Que veut faire Oscar ?', answer: 'se promener', others: ['dormir', 'prendre un bain'] },
  { id: 'sac-ines', level: 4, title: 'Le sac d’Inès', emoji: '🎒', sentences: ['Inès prend son maillot, sa serviette et son bonnet.', 'Elle met aussi ses lunettes dans son sac.', 'Dans le bus, elle pense déjà au grand plongeoir.', 'Elle a hâte de sauter dans l’eau !'],
    question: 'Où va Inès ?', answer: 'à la piscine', others: ['à l’école', 'à la montagne'] },
  { id: 'doigts-collants', level: 4, title: 'Les doigts collants', emoji: '🍞', sentences: ['Noé a les doigts tout collants.', 'Il y a une tache rouge sur son tee-shirt.', 'Sur la table, le pot de confiture de fraises est ouvert.', 'Une cuillère est posée juste à côté.'],
    question: 'Qu’a mangé Noé ?', answer: 'de la confiture', others: ['de la soupe', 'du fromage'] },
  { id: 'train-parti', level: 4, title: 'Sur le quai', emoji: '🚉', sentences: ['Papa et Jade courent sur le quai de la gare.', 'Ils arrivent juste quand les portes se ferment.', 'Le train démarre sans eux.', 'Papa sourit : « Nous prendrons le suivant ! »'],
    question: 'Pourquoi le train part-il sans eux ?', answer: 'ils sont en retard', others: ['il est en panne', 'il est vide'] },

  // Niveau 5 : histoires en 6 phrases
  { id: 'nichoir', level: 5, title: 'Le nichoir', emoji: '🐦', sentences: ['Ilan et papa fabriquent un nichoir.', 'Ils le peignent en bleu.', 'Puis ils l’accrochent dans le cerisier.', 'Pendant des jours, rien ne se passe.', 'Un matin, une mésange entre dedans.', 'Ilan saute de joie !'],
    question: 'Où accrochent-ils le nichoir ?', answer: 'dans le cerisier', others: ['sur la porte', 'dans le garage'] },
  { id: 'balade-velo', level: 5, title: 'La balade à vélo', emoji: '🚲', sentences: ['Dimanche, Anna fait du vélo avec maman.', 'Elles roulent sur un petit chemin.', 'Soudain, le pneu d’Anna se dégonfle.', 'Maman sort une pompe de son sac.', 'Elle regonfle vite le pneu.', 'Elles repartent en chantant.'],
    question: 'Que sort maman de son sac ?', answer: 'une pompe', others: ['un sandwich', 'un parapluie'] },
  { id: 'peche', level: 5, title: 'La pêche', emoji: '🐟', sentences: ['Papi emmène Lou à la pêche.', 'Ils s’assoient au bord de l’étang.', 'Lou attend longtemps sans bouger.', 'Tout à coup, le bouchon s’enfonce !', 'Elle remonte un petit poisson.', 'Elle le remet doucement dans l’eau.'],
    question: 'Que fait Lou avec le poisson ?', answer: 'elle le remet à l’eau', others: ['elle le mange', 'elle le garde'] },
  { id: 'cinema', level: 5, title: 'Au cinéma', emoji: '🎞️', sentences: ['Hugo va au cinéma avec sa tante.', 'Elle lui achète du pop-corn.', 'Dans la salle, les lumières s’éteignent.', 'Le film raconte l’histoire d’un ours.', 'Hugo rit beaucoup.', 'À la sortie, il veut déjà y retourner !'],
    question: 'Avec qui Hugo va-t-il au cinéma ?', answer: 'avec sa tante', others: ['avec sa mamie', 'avec son frère'] },
  { id: 'demenagement', level: 5, title: 'Le déménagement', emoji: '📦', sentences: ['La famille de Sarah déménage.', 'Des déménageurs portent les cartons.', 'Sarah garde son doudou dans ses bras.', 'La nouvelle maison a un grand jardin.', 'Sarah choisit la chambre du haut.', 'Le soir, elle colle ses dessins au mur.'],
    question: 'Que garde Sarah dans ses bras ?', answer: 'son doudou', others: ['un carton', 'son chat'] },
  { id: 'anniversaire-papi', level: 5, title: 'L’anniversaire de papi', emoji: '🎂', sentences: ['Papi a soixante-dix ans.', 'Toute la famille vient déjeuner.', 'Maëlle lui offre une carte avec des étoiles.', 'Sur le gâteau, il y a plein de bougies.', 'Papi souffle, mais trois restent allumées.', 'Maëlle l’aide à les éteindre.'],
    question: 'Qui aide papi à éteindre les bougies ?', answer: 'Maëlle', others: ['mamie', 'le chien'] },
  { id: 'chasse-tresor', level: 5, title: 'La chasse au trésor', emoji: '🗺️', sentences: ['Rayan fait une chasse au trésor.', 'Le premier indice est sous le tapis.', 'Le deuxième est dans la boîte aux lettres.', 'Le dernier l’envoie au jardin.', 'Sous un arbre, il trouve une boîte.', 'Dedans, il y a des bonbons pour tous !'],
    question: 'Où est le premier indice ?', answer: 'sous le tapis', others: ['au jardin', 'sous le lit'] },
  { id: 'biscuit-chiot', level: 5, title: 'Biscuit', emoji: '🐶', sentences: ['Lucie a un nouveau chiot.', 'Il s’appelle Biscuit.', 'Le premier jour, il mordille une chaussette.', 'Lucie lui achète un jouet en caoutchouc.', 'Biscuit le mordille toute la journée.', 'Les chaussettes sont sauvées !'],
    question: 'Que mordille Biscuit le premier jour ?', answer: 'une chaussette', others: ['un jouet', 'un os'] },
  { id: 'sortie-foret', level: 5, title: 'La sortie en forêt', emoji: '🌲', sentences: ['La classe de Lina va en forêt.', 'Les enfants suivent un sentier.', 'Ils ramassent des feuilles.', 'Lina trouve une grosse pomme de pin.', 'Puis ils pique-niquent sous les arbres.', 'Le soir, Lina la montre à papa.'],
    question: 'Que trouve Lina ?', answer: 'une pomme de pin', others: ['une plume', 'un champignon'] },

  // Niveau 6 : remettre les images dans l'ordre de l'histoire
  { id: 'tartine-lili', level: 6, title: 'La tartine de Lili', emoji: '🍞', sentences: ['Lili prend une tranche de pain.', 'Elle étale du beurre dessus.', 'Puis elle ajoute du miel.', 'Miam, elle croque sa tartine !'],
    steps: [['🍞', 'le pain'], ['🧈', 'le beurre'], ['🍯', 'le miel']] },
  { id: 'lettre-papi', level: 6, title: 'La lettre à papi', emoji: '📬', sentences: ['Inès écrit à papi.', 'Elle met la lettre dans une enveloppe.', 'Puis elle la poste.', 'Papi l’appelle pour dire merci.'],
    steps: [['✍️', 'elle écrit'], ['✉️', 'l’enveloppe'], ['📮', 'elle la poste']] },
  { id: 'plage-maya', level: 6, title: 'La plage de Maya', emoji: '🏖️', sentences: ['Maya se baigne dans la mer.', 'Ensuite, elle fait un château de sable.', 'Le soir, la lune se lève.', 'Maya rentre en bâillant.'],
    steps: [['🌊', 'la baignade'], ['🏰', 'le château de sable'], ['🌙', 'la lune']] },
  { id: 'crepes-tom', level: 6, title: 'Les crêpes de Tom', emoji: '🥞', sentences: ['Tom prépare la pâte avec papa.', 'Papa fait cuire les crêpes dans la poêle.', 'Tom met du chocolat dessus.', 'Puis il les mange en riant.'],
    steps: [['🥣', 'la pâte'], ['🍳', 'la cuisson'], ['🥞', 'les crêpes']] },
  { id: 'nuages-pluie', level: 6, title: 'L’arc-en-ciel', emoji: '🌈', sentences: ['Le ciel se couvre de nuages.', 'Il pleut très fort.', 'Puis le soleil revient.', 'Un bel arc-en-ciel apparaît !'],
    steps: [['☁️', 'les nuages'], ['🌧️', 'la pluie'], ['🌈', 'l’arc-en-ciel']] },
  { id: 'voyage-lina', level: 6, title: 'Le voyage de Lina', emoji: '🧳', sentences: ['Lina fait sa valise.', 'Elle monte dans l’avion avec maman.', 'L’avion vole au-dessus des nuages.', 'À l’arrivée, elle court sur la plage.'],
    steps: [['🧳', 'la valise'], ['✈️', 'l’avion'], ['🏖️', 'la plage']] },
  { id: 'matin-hugo', level: 6, title: 'Le matin d’Hugo', emoji: '⏰', sentences: ['Le réveil sonne.', 'Hugo se lève et se brosse les dents.', 'Il s’habille et prend son cartable.', 'Puis il part à l’école.'],
    steps: [['⏰', 'le réveil sonne'], ['🪥', 'les dents'], ['🏫', 'l’école']] },
  { id: 'soupe-legumes', level: 6, title: 'La soupe de légumes', emoji: '🥕', sentences: ['Mamie épluche des carottes.', 'Elle les fait cuire dans la marmite.', 'Toute la cuisine sent bon.', 'Le soir, on mange la soupe.'],
    steps: [['🥕', 'les carottes'], ['🍲', 'la cuisson'], ['🥣', 'on mange']] },
  { id: 'course-malik', level: 6, title: 'La course de Malik', emoji: '🏟️', sentences: ['Malik met ses baskets.', 'Il court autour du stade.', 'Il passe la ligne d’arrivée le premier.', 'On lui donne une médaille !'],
    steps: [['👟', 'les baskets'], ['🏃', 'la course'], ['🏅', 'la médaille']] },
  { id: 'tomate-papi', level: 6, title: 'La tomate de papi', emoji: '🌱', sentences: ['Papi plante un pied de tomate.', 'Une petite tomate verte pousse.', 'Au soleil, elle devient bien rouge.', 'Papi en fait une salade.'],
    steps: [['🌱', 'la plante'], ['🍅', 'la tomate rouge'], ['🥗', 'la salade']] },

  // Niveau 7 : le sens d'un mot nouveau
  { id: 'ours-affame', level: 7, title: 'Le réveil de l’ours', emoji: '🐻', sentences: ['Le petit ours sort de sa tanière.', 'Il a dormi tout l’hiver et il est affamé !', 'Il mange des racines, de l’herbe et des insectes.', 'Enfin, son ventre est bien plein.'],
    question: 'Que veut dire « affamé » ?', answer: 'il a très faim', others: ['il a très froid', 'il est très sale'] },
  { id: 'fourmi', level: 7, title: 'La fourmi', emoji: '🐜', sentences: ['Dans l’herbe, Lou observe une fourmi minuscule.', 'Elle porte une miette de pain plus grosse qu’elle.', 'Lou se penche pour la voir.', 'La fourmi file sous une pierre.'],
    question: 'Que veut dire « minuscule » ?', answer: 'toute petite', others: ['très rapide', 'très bruyante'] },
  { id: 'baleine', level: 7, title: 'La baleine', emoji: '🐋', sentences: ['Sur le bateau, Malo regarde la mer.', 'Soudain, une baleine gigantesque sort de l’eau.', 'Elle est bien plus longue que le bateau !', 'Puis elle replonge en agitant sa queue.'],
    question: 'Que veut dire « gigantesque » ?', answer: 'très grande', others: ['très petite', 'très lente'] },
  { id: 'livre-ravi', level: 7, title: 'Le beau livre', emoji: '📖', sentences: ['Pour son anniversaire, Adam reçoit le livre qu’il voulait tant.', 'Il est ravi !', 'Il saute partout en riant.', 'Puis il commence à le lire tout de suite.'],
    question: 'Que veut dire « ravi » ?', answer: 'très content', others: ['très fâché', 'très fatigué'] },
  { id: 'devorer-crepes', level: 7, title: 'Après le foot', emoji: '🥞', sentences: ['Après le foot, Noé rentre à la maison.', 'Maman a préparé des crêpes.', 'Noé en dévore trois en une minute !', 'Il ne reste que des miettes dans l’assiette.'],
    question: 'Que veut dire « dévorer » ?', answer: 'manger très vite', others: ['cuisiner', 'jeter par terre'] },
  { id: 'ballon-envole', level: 7, title: 'Le ballon envolé', emoji: '🎈', sentences: ['Au parc, le ballon de Zoé s’envole.', 'Il monte, monte, jusqu’aux nuages.', 'Zoé sanglote dans les bras de papa.', 'Papa la console et lui promet un autre ballon.'],
    question: 'Que veut dire « sangloter » ?', answer: 'pleurer très fort', others: ['rire très fort', 'courir très vite'] },
  { id: 'randonnee', level: 7, title: 'La randonnée', emoji: '⛰️', sentences: ['Papa et Bastien marchent longtemps dans la montagne.', 'Il fait chaud, et Bastien est assoiffé.', 'Il boit toute sa gourde d’un coup.', 'À la fontaine, papa la remplit de nouveau.'],
    question: 'Que veut dire « assoiffé » ?', answer: 'il a très soif', others: ['il a très faim', 'il a sommeil'] },
  { id: 'surprise-lina', level: 7, title: 'La surprise de Lina', emoji: '🎁', sentences: ['Dimanche, c’est la fête des pères.', 'Lina prépare un dessin pour papa.', 'Elle le fait en cachette, dans sa chambre.', 'Papa ne doit rien savoir !'],
    question: 'Que veut dire « en cachette » ?', answer: 'sans être vue', others: ['en chantant', 'très vite'] },
  { id: 'stade', level: 7, title: 'Au stade', emoji: '🏟️', sentences: ['Rayan regarde un match de foot avec son oncle.', 'Son équipe marque un but !', 'Tout le monde hurle de joie.', 'Rayan crie si fort qu’il n’a plus de voix.'],
    question: 'Que veut dire « hurler » ?', answer: 'crier très fort', others: ['parler tout bas', 'dormir'] },
  { id: 'kangourou', level: 7, title: 'Le kangourou', emoji: '🦘', sentences: ['Au zoo, Léo regarde un kangourou.', 'Le kangourou bondit très haut.', 'Il traverse tout son enclos en trois bonds.', 'Léo essaie de faire pareil !'],
    question: 'Que veut dire « bondir » ?', answer: 'sauter', others: ['nager', 'se cacher'] },

  // Niveau 8 : vrai, faux, ou l'histoire ne le dit pas ?
  { id: 'tarte-sacha', level: 8, title: 'La tarte de Sacha', emoji: '🥧', sentences: ['Sacha prépare une tarte aux pommes avec son papa.', 'Sacha épluche les pommes et papa étale la pâte.', 'La tarte cuit pendant une demi-heure.'],
    question: 'Sacha étale la pâte.', answer: 'faux', others: ['vrai', 'on ne sait pas'] },
  { id: 'poules-mamie', level: 8, title: 'Les poules de mamie', emoji: '🐔', sentences: ['Mamie a quatre poules dans son jardin.', 'Chaque matin, Nour va chercher les œufs.', 'Aujourd’hui, elle en trouve trois dans le poulailler.'],
    question: 'Nour trouve trois œufs.', answer: 'vrai', others: ['faux', 'on ne sait pas'] },
  { id: 'cours-danse', level: 8, title: 'Le cours de danse', emoji: '💃', sentences: ['Le samedi, Mia va au cours de danse.', 'Elle met un tutu rose et des chaussons.', 'Aujourd’hui, elle apprend à tourner sur un pied.'],
    question: 'Les chaussons de Mia sont blancs.', answer: 'on ne sait pas', others: ['vrai', 'faux'] },
  { id: 'moustache', level: 8, title: 'Moustache', emoji: '🛋️', sentences: ['Moustache est le chat de Lucas.', 'Il est tout noir, avec une tache blanche sur le nez.', 'Il adore dormir sur le canapé.'],
    question: 'Moustache est tout blanc.', answer: 'faux', others: ['vrai', 'on ne sait pas'] },
  { id: 'pompiers-ecole', level: 8, title: 'Les pompiers', emoji: '🚒', sentences: ['Ce matin, les pompiers visitent l’école.', 'Ils montrent leur grand camion rouge.', 'Chaque enfant monte à son tour dans la cabine.'],
    question: 'Les enfants montent dans le camion.', answer: 'vrai', others: ['faux', 'on ne sait pas'] },
  { id: 'cerises-papi', level: 8, title: 'Les cerises', emoji: '🍒', sentences: ['Dans le jardin de papi, il y a un grand cerisier.', 'Tom monte sur l’échelle, et papi la tient.', 'Ils remplissent un panier de cerises bien rouges.'],
    question: 'Tom mange des cerises.', answer: 'on ne sait pas', others: ['vrai', 'faux'] },
  { id: 'photo-classe', level: 8, title: 'La photo de classe', emoji: '📷', sentences: ['Aujourd’hui, c’est la photo de classe.', 'Le photographe dit : « Souriez ! »', 'Tout le monde sourit, sauf Léo, qui éternue !'],
    question: 'Léo sourit sur la photo.', answer: 'faux', others: ['vrai', 'on ne sait pas'] },
  { id: 'manege', level: 8, title: 'Le manège', emoji: '🎠', sentences: ['À la fête foraine, Anna fait un tour de manège.', 'Elle choisit le cheval blanc.', 'Son petit frère monte dans la voiture de pompiers.'],
    question: 'Anna monte sur un cheval.', answer: 'vrai', others: ['faux', 'on ne sait pas'] },
  { id: 'bac-a-sable', level: 8, title: 'Au bac à sable', emoji: '🌳', sentences: ['Au parc, Hugo fait du toboggan.', 'Puis il joue dans le bac à sable avec Malo.', 'À cinq heures, maman l’appelle pour rentrer.'],
    question: 'Malo est le frère d’Hugo.', answer: 'on ne sait pas', others: ['vrai', 'faux'] },
  { id: 'hamster', level: 8, title: 'Noisette', emoji: '🐹', sentences: ['Lou a un hamster qui s’appelle Noisette.', 'Le jour, il dort dans sa petite maison.', 'Le soir, il court dans sa roue.'],
    question: 'Noisette dort le soir.', answer: 'faux', others: ['vrai', 'on ne sait pas'] },
];

/** Niveau 8 : les trois réponses, toujours dans le même ordre. */
const TRUE_FALSE = ['vrai', 'faux', 'on ne sait pas'];
const TRUE_FALSE_QUESTION = 'Vrai, faux, ou on ne sait pas ?';

/**
 * Textes déchiffrables (ctx.sons) : les histoires dont le titre, les phrases, la question et les réponses
 * écrites se lisent avec les sons vus (vrai, faux, on ne sait pas : toujours les mêmes, non comptés).
 * Il en faut au moins deux hors saison ; sinon, toutes.
 */
function readableStories(stories, sons) {
  if (!sonsActifs(sons)) return stories;
  const known = stories.filter((s) => [s.title, ...s.sentences, s.question, s.answer, ...(s.others || []), ...(s.steps || []).map(([, label]) => label)]
    .every((t) => !t || texteDechiffrable(t, sons)));
  return known.filter((s) => !s.season).length >= 2 ? known : stories;
}

/** Le décor d'une histoire : titre, image, phrases, et son identifiant (voix enregistrée). */
function storyStage(story) {
  return { type: 'karaoke', storyId: story.id, title: story.title, emoji: story.emoji, sentences: story.sentences };
}

/** Niveau 6 : après l'histoire, toucher les images dans l'ordre (jamais déjà rangées). */
function orderStory(rng, story) {
  let order = shuffle(rng, story.steps.map((_, i) => i));
  if (order.every((v, i) => v === i)) order = [...order.slice(1), order[0]];
  const text = 'Remets les images dans l’ordre de l’histoire.';
  return {
    key: `histoires:${story.title}`,
    karaoke: true,
    interaction: 'order',
    text,
    instruction: [text],
    replay: [text],
    stage: storyStage(story),
    items: order.map((i) => ({ value: i, emoji: story.steps[i][0], label: story.steps[i][1] })),
    order: 'asc',
    choices: [],
    answer: story.steps.map(([, label]) => label).join(', '),
    success: { speak: 'Bravo, tu as remis l’histoire dans l’ordre !' },
  };
}

/** Niveau 8 : la phrase est-elle vraie, fausse, ou l'histoire ne le dit-elle pas ? */
function trueFalseStory(story) {
  const { answer } = story;
  return {
    key: `histoires:${story.title}`,
    karaoke: true,
    text: `${story.question} ${TRUE_FALSE_QUESTION}`,
    instruction: [story.question, TRUE_FALSE_QUESTION],
    replay: [story.question, TRUE_FALSE_QUESTION],
    stage: storyStage(story),
    choices: TRUE_FALSE.map((o) => ({ value: o, label: o })),
    choiceStyle: 'answers',
    answer,
    success: { speak: answer === 'on ne sait pas' ? 'Bravo, l’histoire ne le dit pas !' : `C’est ${answer}, bravo !` },
  };
}

export const histoires = {
  id: 'histoires',
  domain: 'francais',
  section: 'Lire',
  title: 'Histoires lues',
  icon: '📖',
  skill: 'Écouter et suivre une histoire lue (karaoké), la comprendre et la raconter dans l’ordre',
  levels: [
    'Écoute une histoire', 'Lis en suivant', 'Histoires plus longues', 'Pourquoi ? (inférence)', 'Histoires en 6 phrases',
    'Remets dans l’ordre', 'Le sens des mots', 'Vrai, faux, on ne sait pas',
  ],
  // context.season : la saison du moment (seasonOf), pour les histoires de saison ;
  // context.sons : les sons vus en classe (textes déchiffrables, voir graphemes.js)
  generate(level, rng, _index, context = {}) {
    const story = pickSeasonal(rng, readableStories(STORIES.filter((s) => s.level === level), context.sons), context.season);
    if (level === 6) return orderStory(rng, story);
    if (level === 8) return trueFalseStory(story);
    const pictures = level === 1;
    const options = shuffle(rng, [story.answer, ...story.others]);
    return {
      key: `histoires:${story.title}`,
      karaoke: true,
      text: story.question,
      instruction: [story.question],
      replay: [story.question],
      stage: storyStage(story),
      choices: options.map((o) => ({ value: o, label: o })),
      choiceStyle: pictures ? 'pictures' : 'answers',
      answer: story.answer,
      success: { speak: pictures ? 'Bravo, tu as bien écouté l’histoire !' : `${story.answer[0].toUpperCase()}${story.answer.slice(1)}, bravo !` },
    };
  },
};

export const STORY_DATA = STORIES;
