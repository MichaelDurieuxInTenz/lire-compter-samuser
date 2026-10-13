// Lire à voix haute (fluence), comme aux évaluations nationales de CP et de CE1 : « Lis le plus de
// mots possible en 1 minute ». L'enfant lit à voix haute une liste (syllabes, puis mots) ou un petit
// texte ; un adulte assis à côté écoute, touche les mots ratés (barrés en rouge), puis le dernier mot
// lu. Le score est le nombre de mots correctement lus par minute (MCLM).
//
// Ce fichier ne contient que des données et des fonctions pures (testées dans tests/fluence.test.js) :
// les listes et les textes, le calcul du score, les étoiles, le niveau suivant, l'évolution semaine par
// semaine et les repères par classe. L'affichage est dans main.js (fluenceZone) et dans dashboard.js.
// Estelle ne lit jamais les mots (c'est l'enfant qui lit) : elle dit seulement la consigne.

import { pick, shuffle } from '../random.js';

/** Durée de la lecture chronométrée (secondes). */
export const FLUENCE_SECONDS = 60;

// ---------------------------------------------------------------- Listes de syllabes et de mots

const CONSONNES = ['b', 'd', 'f', 'j', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v'];
const VOYELLES = ['a', 'e', 'i', 'o', 'u', 'é'];

/** Syllabes simples : une consonne et une voyelle (ma, li, ro, té…). */
export const SYLLABES_SIMPLES = CONSONNES.flatMap((c) => VOYELLES.map((v) => c + v));

/** Syllabes plus difficiles : ch, ou, on, an, in, oi, deux consonnes, syllabes fermées. */
export const SYLLABES_COMPLEXES = [
  'cha', 'chi', 'cho', 'chu', 'ché',
  'bou', 'dou', 'fou', 'jou', 'lou', 'mou', 'pou', 'rou', 'sou', 'tou',
  'bon', 'don', 'fon', 'lon', 'mon', 'pon', 'ron', 'son', 'ton',
  'ban', 'dan', 'fan', 'lan', 'man', 'pan', 'ran', 'tan', 'van',
  'fin', 'lin', 'min', 'pin', 'rin', 'sin', 'vin',
  'boi', 'foi', 'loi', 'moi', 'noi', 'poi', 'roi', 'soi', 'toi', 'voi',
  'bla', 'bra', 'cla', 'cra', 'dra', 'fla', 'fra', 'gla', 'gra', 'pla', 'pra', 'tra', 'vra',
  'bri', 'cri', 'fri', 'gri', 'pri', 'tri', 'blo', 'bro', 'clo', 'cro', 'flo', 'gro', 'plo', 'pro', 'tro',
  'al', 'ar', 'il', 'ir', 'ol', 'or', 'ul', 'ur',
  'bal', 'bar', 'dor', 'fil', 'mal', 'mar', 'nor', 'par', 'sal', 'tir', 'vol',
];

/** Mots courts : une ou deux syllabes, des lettres qui se lisent comme elles s'écrivent. */
export const MOTS_COURTS = [
  'ami', 'bal', 'bol', 'bus', 'fil', 'lac', 'lit', 'mur', 'rat', 'sac', 'sel', 'sol', 'vélo', 'moto',
  'papa', 'lune', 'pile', 'robe', 'rire', 'lama', 'mari', 'midi', 'mule', 'pipe', 'rame', 'ride', 'rose',
  'sale', 'tipi', 'tube', 'vite', 'dame', 'date', 'dune', 'fée', 'lime', 'lire', 'loto', 'menu', 'mode',
  'salé', 'film', 'parc', 'fort', 'port', 'bord', 'car', 'mer', 'fer', 'ver', 'polo', 'judo', 'kilo',
  'vase', 'balle', 'bulle', 'patte', 'botte', 'pomme', 'tasse', 'bébé', 'café', 'purée', 'pâte', 'tête',
  'fête', 'rêve', 'lèvre', 'carte', 'porte', 'finir', 'mardi', 'sirop', 'repas', 'radis',
];

/** Mots fréquents : les petits mots des phrases et des mots de tous les jours. */
export const MOTS_FREQUENTS = [
  'le', 'la', 'les', 'un', 'une', 'des', 'du', 'au', 'et', 'est', 'il', 'elle', 'ils', 'on', 'je', 'tu',
  'nous', 'vous', 'dans', 'sur', 'sous', 'avec', 'pour', 'par', 'mais', 'chez', 'qui', 'que', 'son', 'mon',
  'ton', 'ses', 'mes', 'très', 'plus', 'bien', 'petit', 'grand', 'maison', 'école', 'chat', 'chien', 'jour',
  'nuit', 'matin', 'soir', 'beau', 'belle', 'voici', 'voilà', 'aussi', 'alors', 'après', 'avant', 'encore',
  'toujours', 'maman', 'enfant', 'amie', 'ville', 'rouge', 'vert', 'bleu', 'jaune', 'noir', 'blanc', 'livre',
  'table', 'lundi', 'demain', 'hier', 'gâteau', 'oiseau', 'jardin', 'classe', 'maître', 'jouer', 'manger',
];

/** Mots plus longs : trois syllabes, des sons fréquents. */
export const MOTS_LONGS = [
  'tomate', 'salade', 'domino', 'lavabo', 'banane', 'cabane', 'pyjama', 'animal', 'samedi', 'vipère',
  'tulipe', 'limace', 'pirate', 'caméra', 'cinéma', 'numéro', 'malade', 'carotte', 'chocolat', 'pantalon',
  'girafe', 'machine', 'marmite', 'mercredi', 'vendredi', 'parasol', 'cerise', 'sardine', 'tartine',
  'farine', 'cheminée', 'robinet', 'lunette', 'canapé', 'galette', 'raquette', 'brioche', 'abricot',
  'matelas', 'valise', 'chemise', 'minute', 'rivière', 'musique', 'camarade', 'confiture', 'tortue',
  'mouton', 'lapin', 'bateau', 'château', 'cadeau', 'chapeau', 'moulin', 'dessiner', 'regarder', 'découper',
  'colorier', 'policier', 'jardinier', 'boulanger', 'récréation', 'kangourou', 'tambour', 'facteur', 'vacances',
];

/** Mots difficiles : sons complexes (ill, gn, eu, oin…), lettres muettes, quatre syllabes. */
export const MOTS_DIFFICILES = [
  'papillon', 'grenouille', 'écureuil', 'champignon', 'parapluie', 'téléphone', 'hélicoptère', 'crocodile',
  'cartable', 'croissant', 'escargot', 'chaussette', 'ordinateur', 'éléphant', 'pharmacie', 'anniversaire',
  'citrouille', 'feuille', 'soleil', 'abeille', 'poisson', 'coquillage', 'montagne', 'dauphin', 'pingouin',
  'écharpe', 'trampoline', 'magicien', 'chaussure', 'toboggan', 'bouteille', 'ascenseur', 'aquarium',
  'gymnase', 'spectacle', 'orchestre', 'chevalier', 'princesse', 'sorcière', 'fourchette', 'grenier',
  'bonhomme', 'framboise', 'ampoule', 'cuillère', 'aspirateur', 'déguisement', 'champion', 'cigogne',
  'araignée', 'épouvantail', 'noisette', 'patinoire', 'balançoire', 'tournesol', 'coccinelle', 'hérisson',
  'baignoire', 'oreiller', 'chenille', 'campagne', 'brouillard', 'quatorze', 'printemps', 'automne',
];

// ---------------------------------------------------------------- Petits textes

/** Textes à lire, du plus court au plus long (niveau du jeu, titre, texte). */
export const TEXTES_FLUENCE = [
  {
    level: 7, id: 'petit-chat', title: 'Le petit chat',
    text: 'Le petit chat est dans le jardin. Il voit un oiseau sur le mur. Le chat saute, mais l’oiseau part vite. '
      + 'Le chat a raté ! Il va sous l’arbre. Il fait une sieste au soleil. Le soir, il rentre à la maison. Il a faim. '
      + 'Maman lui donne du lait. Le chat est content. Il dort sur le lit.',
  },
  {
    level: 7, id: 'plage', title: 'À la plage',
    text: 'Papa et moi, nous allons à la plage. Il fait beau et chaud. Je fais un château de sable avec ma pelle. '
      + 'Papa lit un livre. La mer est bleue. Je vais dans l’eau avec ma bouée. L’eau est froide ! Je ris très fort. '
      + 'Après, nous mangeons une glace à la fraise. Quelle belle journée !',
  },
  {
    level: 7, id: 'gateau', title: 'Le gâteau',
    text: 'Ce matin, mamie fait un gâteau. Je l’aide. Je casse les œufs dans le bol. Mamie met la farine et le sucre. '
      + 'Je tourne avec la cuillère. Nous ajoutons du chocolat. Le gâteau va dans le four. Ça sent bon dans la cuisine ! '
      + 'Après le repas, nous mangeons le gâteau. Il est délicieux. Papi en veut encore.',
  },
  {
    level: 7, id: 'pluie', title: 'Il pleut !',
    text: 'Ce matin, il pleut très fort. Je mets mes bottes rouges et mon manteau. Papa prend le grand parapluie. Dans la rue, il '
      + 'y a des flaques partout. Je saute dans une flaque. Plouf ! L’eau gicle sur papa. Il rit avec moi. À l’école, je range '
      + 'mes bottes. Mes pieds sont bien au sec. Vive la pluie !',
  },
  {
    level: 7, id: 'parc', title: 'Au parc',
    text: 'Après l’école, je vais au parc avec maman. Je cours vers le toboggan. Je monte l’échelle. Je glisse très vite. '
      + 'Ensuite, je vais sur la balançoire. Maman me pousse. Je vole haut dans le ciel ! Un petit garçon joue dans le sable. '
      + 'Nous faisons un gros pâté ensemble. Le soir, je rentre à la maison, tout content.',
  },
  {
    level: 7, id: 'lapin', title: 'Mon lapin',
    text: 'J’ai un petit lapin blanc. Il vit dans une cage. Le matin, je lui donne une carotte. Il mange très vite ! Ses longues '
      + 'oreilles bougent tout le temps. Le samedi, il sort dans le salon. Il court et il saute partout. Puis il se cache '
      + 'derrière le canapé. Je le caresse doucement. Il est tout doux.',
  },
  {
    level: 7, id: 'bonhomme', title: 'Le bonhomme de neige',
    text: 'Cette nuit, il a neigé. Le jardin est tout blanc ! Je mets mon bonnet et mes gants. Avec ma sœur, nous faisons une '
      + 'grosse boule. Puis une petite boule pour la tête. Papa nous donne une carotte. C’est le nez ! Ma sœur met deux '
      + 'cailloux pour les yeux. Notre bonhomme a froid. Je lui donne mon écharpe.',
  },
  {
    level: 7, id: 'au-lit', title: 'Au lit !',
    text: 'Le soir, je prends mon bain. Puis je mets mon pyjama bleu. Je me brosse les dents. Dans mon lit, maman me lit une '
      + 'histoire. C’est l’histoire d’un loup qui a peur du noir. Je ris beaucoup. Après, maman me fait un bisou. Elle éteint '
      + 'la lumière. Je serre mon doudou très fort. Bonne nuit !',
  },
  {
    level: 7, id: 'velo', title: 'Le vélo',
    text: 'Pour mon anniversaire, j’ai eu un vélo vert. Il n’a pas de petites roues. Papa tient la selle et je pédale. Le vélo '
      + 'penche à droite, puis à gauche. Je tombe dans l’herbe. Je n’ai pas mal. Je remonte sur le vélo. Cette fois, papa lâche '
      + 'la selle. Je roule tout seul ! Je suis très fier.',
  },
  {
    level: 7, id: 'pique-nique', title: 'Le pique-nique',
    text: 'Dimanche, nous faisons un pique-nique. Nous allons au bord de la rivière. Maman pose une nappe sur l’herbe. Il y a des '
      + 'sandwichs, des tomates et des fraises. Une fourmi monte sur mon pied. Elle veut une miette de pain ! Après le repas, '
      + 'nous jouons au ballon. Papi fait une sieste sous un arbre. Il ronfle très fort.',
  },
  {
    level: 7, id: 'ferme', title: 'À la ferme',
    text: 'Aujourd’hui, je vais à la ferme de tonton. Il y a des vaches, des cochons et des moutons. Le matin, je donne du grain '
      + 'aux poules. Elles courent vers moi ! Je ramasse les œufs dans la paille. Tonton trait la vache. Je bois un verre de '
      + 'lait. Le soir, je monte sur le tracteur avec lui.',
  },
  {
    level: 7, id: 'boulangerie', title: 'À la boulangerie',
    text: 'Avec papa, je vais à la boulangerie. Ça sent bon le pain chaud ! Il y a des baguettes, des croissants et des tartes. '
      + 'La boulangère sourit. Papa achète une baguette et deux pains au chocolat. Je donne la pièce. Je dis merci. Sur le '
      + 'chemin, je mange le bout de la baguette. Papa fait semblant de ne rien voir.',
  },
  {
    level: 8, id: 'cabane', title: 'La cabane',
    text: 'Avec mon frère, nous construisons une cabane au fond du jardin. Nous prenons des branches, des planches et '
      + 'une vieille couverture. Mon frère tient les planches et je plante les clous avec papa. Le toit est un peu tordu, '
      + 'mais il tient bien. Dans la cabane, nous mettons des coussins, une lampe et nos livres préférés. Le soir, nous '
      + 'mangeons une soupe dedans, comme des explorateurs. Soudain, il commence à pleuvoir. Les gouttes tapent sur le '
      + 'toit. Nous restons bien au sec et nous rions. Notre cabane est la plus belle du monde !',
  },
  {
    level: 8, id: 'marche', title: 'Le marché',
    text: 'Le samedi matin, je vais au marché avec maman. Il y a beaucoup de monde et beaucoup de bruit. Les marchands '
      + 'crient pour vendre leurs fruits et leurs légumes. Maman achète des tomates, des carottes et une salade. Moi, je '
      + 'choisis des cerises bien rouges. Le marchand de fromage nous fait goûter un petit morceau. C’est très bon ! Plus '
      + 'loin, une dame vend des fleurs. Maman prend un bouquet de tulipes jaunes pour mettre sur la table. Mon panier est '
      + 'lourd, mais je le porte tout seul jusqu’à la maison. Je suis fier de moi.',
  },
  {
    level: 8, id: 'chien-perdu', title: 'Le chien perdu',
    text: 'Ce matin, en allant à l’école, je vois un petit chien tout seul sur le trottoir. Il a l’air triste et il '
      + 'tremble. Il porte un collier rouge avec une médaille. Je m’approche doucement et je lis un numéro de téléphone. '
      + 'Maman appelle tout de suite. Une voix répond : c’est la dame qui habite au bout de la rue ! Son chien s’est '
      + 'sauvé hier soir. Elle arrive en courant et prend son chien dans ses bras. Le petit chien remue la queue. La dame '
      + 'nous remercie et me donne un gros bonbon. Je suis arrivé en retard à l’école, mais la maîtresse a bien compris.',
  },
  {
    level: 8, id: 'rentree', title: 'La rentrée',
    text: 'Ce matin, c’est la rentrée. J’ai un cartable neuf, une trousse pleine de crayons et des chaussures qui brillent. '
      + 'Devant l’école, je retrouve mes copains. Nous parlons de nos vacances : l’un est allé à la mer, l’autre à la montagne. '
      + 'La cloche sonne et nous entrons dans la classe. Notre nouvelle maîtresse a des lunettes rondes et une voix très douce. '
      + 'Elle nous montre nos places et les étiquettes avec nos prénoms. À midi, je mange à la cantine avec mon meilleur ami. '
      + 'Le soir, je raconte tout à maman. Cette année va être formidable !',
  },
  {
    level: 8, id: 'spectacle', title: 'Le spectacle',
    text: 'Ce soir, c’est le spectacle de fin d’année. Toute la classe va chanter et danser sur la scène de la salle des fêtes. '
      + 'Derrière le rideau, j’ai un peu peur et mon cœur bat très vite. Je porte un costume de papillon, avec de grandes ailes '
      + 'jaunes. La maîtresse nous fait un signe : c’est à nous ! Nous entrons en chantant. Dans la salle, je vois papa qui '
      + 'filme et mamie qui agite la main. Je ne me trompe pas une seule fois. À la fin, tout le monde applaudit très fort. Je '
      + 'suis si fière que j’ai envie de recommencer !',
  },
  {
    level: 8, id: 'foret', title: 'Promenade en forêt',
    text: 'Dimanche, nous partons nous promener en forêt. Les feuilles des arbres sont jaunes, rouges et orange. Elles craquent '
      + 'sous nos pieds. Papa nous apprend à reconnaître les arbres : le chêne a des glands, le châtaignier a des bogues qui '
      + 'piquent. Nous remplissons un panier de châtaignes. Soudain, ma sœur montre une branche du doigt : un écureuil roux '
      + 'nous regarde ! Il tient une noisette entre ses pattes, puis il disparaît en un éclair. Plus loin, nous trouvons des '
      + 'champignons, mais papa dit qu’il ne faut pas les toucher. Le soir, nous faisons griller les châtaignes.',
  },
  {
    level: 8, id: 'bibliotheque', title: 'À la bibliothèque',
    text: 'Le mercredi, je vais à la bibliothèque avec mon grand frère. On doit y parler tout bas, pour ne pas déranger les '
      + 'lecteurs. Dans le coin des enfants, il y a des coussins et des étagères pleines de livres. Je choisis un album sur les '
      + 'dinosaures et une bande dessinée de pirates. Mon frère prend un gros roman d’aventures. La bibliothécaire passe nos '
      + 'livres devant une machine qui fait bip. Nous avons trois semaines pour les lire. Sur le chemin du retour, je commence '
      + 'déjà à lire en marchant. Mon frère me tient la main pour traverser la rue.',
  },
  {
    level: 8, id: 'luge', title: 'La luge',
    text: 'Pendant les vacances d’hiver, nous allons à la montagne. Il y a beaucoup de neige ! Papa loue une grande luge rouge. '
      + 'Nous montons en haut d’une petite pente, en tirant la luge avec une corde. Je m’assois devant et papa derrière. Trois, '
      + 'deux, un, partez ! La luge glisse de plus en plus vite. Le vent froid me pique les joues et je crie de joie. En bas, '
      + 'nous tombons dans la neige et nous rions aux éclats. Nous remontons dix fois ! Le soir, au chalet, nous buvons un bon '
      + 'chocolat chaud près du feu.',
  },
  {
    level: 8, id: 'match', title: 'Le match',
    text: 'Samedi, mon équipe de football joue contre l’école voisine. Nous portons des maillots bleus avec un numéro dans le '
      + 'dos. L’entraîneur nous donne ses conseils : il faut se passer le ballon et ne jamais abandonner. Au début, les autres '
      + 'marquent un but. Nous sommes un peu tristes. Mais juste avant la mi-temps, ma copine tire très fort et le ballon entre '
      + 'dans la cage ! À la fin du match, il y a deux buts partout. Tout le monde se serre la main et les parents '
      + 'applaudissent les deux équipes. Nous fêtons ça avec un bon goûter.',
  },
  {
    level: 8, id: 'crepes', title: 'Les crêpes',
    text: 'Aujourd’hui, c’est la Chandeleur : à la maison, on fait des crêpes ! Je verse la farine dans un grand saladier. Papa '
      + 'ajoute les œufs, le lait et une pincée de sel. Je mélange doucement avec un fouet, jusqu’à ce que la pâte soit lisse. '
      + 'Ensuite, la pâte se repose une heure. Papa fait chauffer la poêle. Il verse une louche de pâte, attend un peu, puis il '
      + 'fait sauter la crêpe très haut. Elle retombe pile dans la poêle ! Moi, j’essaie aussi, mais ma crêpe atterrit sur le '
      + 'carrelage de la cuisine. Tout le monde éclate de rire, même moi !',
  },
  {
    level: 8, id: 'cirque', title: 'Le cirque',
    text: 'Ce soir, nous allons au cirque. Sous le grand chapiteau rouge et jaune, il fait chaud et ça sent le pop-corn. La '
      + 'musique commence et les lumières s’allument. D’abord, un jongleur lance six balles en l’air sans en faire tomber une '
      + 'seule. Ensuite, deux acrobates se balancent sur un trapèze, tout en haut. J’ai peur pour eux, mais ils ne tombent '
      + 'jamais. Puis les clowns arrivent avec une petite voiture qui perd ses roues. Toute la salle rit aux éclats. À la fin, '
      + 'tous les artistes reviennent saluer. Nous les applaudissons très longtemps.',
  },
  {
    level: 8, id: 'piscine', title: 'À la piscine',
    text: 'Le jeudi, toute la classe va à la piscine en car. Dans le vestiaire, je mets mon maillot et mon bonnet de bain. Avant '
      + 'd’entrer dans l’eau, il faut prendre une douche. Le moniteur nous attend au bord du bassin. Aujourd’hui, nous '
      + 'apprenons à faire la planche. Je m’allonge sur le dos, les bras écartés, et je regarde le plafond. Au début, j’ai peur '
      + 'de couler. Mais l’eau me porte, comme par magie ! Ensuite, nous allons chercher des anneaux au fond du petit bassin. '
      + 'J’en rapporte trois. Je suis vraiment fier de moi.',
  },
  {
    level: 9, id: 'zoo', title: 'La sortie au zoo',
    text: 'Aujourd’hui, toute la classe part au zoo en car. Nous avons chacun un sac avec un pique-nique et une gourde. '
      + 'Pendant le trajet, nous chantons des chansons avec la maîtresse. Dès l’entrée, nous entendons les singes qui crient '
      + 'dans les arbres. Ils sautent de branche en branche et font des grimaces. Plus loin, les girafes mangent les '
      + 'feuilles tout en haut des arbres, avec leur longue langue violette. Le gardien nous explique que l’éléphant boit '
      + 'plus de cent litres d’eau par jour. C’est incroyable ! À midi, nous pique-niquons sur l’herbe, près du bassin des '
      + 'otaries. Elles plongent, nagent très vite et attrapent les poissons que le soigneur leur lance. Tout le monde '
      + 'applaudit. L’après-midi, nous observons les lions qui dorment au soleil. Le plus gros ouvre un œil, bâille et se '
      + 'rendort. Dans le car du retour, beaucoup d’enfants s’endorment. Moi, je dessine dans mon carnet tous les animaux '
      + 'que j’ai vus, pour les montrer à mes parents.',
  },
  {
    level: 9, id: 'jardin-papi', title: 'Le jardin de papi',
    text: 'Pendant les vacances, je vais chez mon papi qui habite à la campagne. Derrière sa maison, il a un grand jardin '
      + 'avec des légumes, des fleurs et des arbres fruitiers. Chaque matin, nous mettons nos bottes et nous allons arroser '
      + 'les plantes avec un vieil arrosoir vert. Papi m’apprend à reconnaître les feuilles des carottes, des radis et des '
      + 'pommes de terre. Un jour, nous semons des graines de tournesol le long de la barrière. Il faut creuser un petit '
      + 'trou, poser la graine, la recouvrir de terre et arroser doucement. Papi dit qu’il faut être patient. Quelques '
      + 'jours plus tard, de petites pousses vertes sortent de la terre. Je suis tellement content que je cours le dire à '
      + 'mamie. À la fin des vacances, les tournesols sont plus grands que moi ! Avant de partir, papi me donne un sachet '
      + 'de graines, pour que je puisse en planter chez moi, sur le balcon.',
  },
  {
    level: 9, id: 'tempete', title: 'La tempête',
    text: 'Cette nuit, une grosse tempête a soufflé sur la ville. Le vent sifflait très fort et la pluie tapait contre les '
      + 'fenêtres. Je n’arrivais pas à dormir, alors je suis allé dans le lit de ma grande sœur. Elle m’a raconté une '
      + 'histoire de pirates pour me rassurer. Tout à coup, il y a eu un grand bruit dehors et la lumière s’est éteinte. '
      + 'Papa est arrivé avec une lampe de poche et des bougies. Nous nous sommes installés tous ensemble dans le salon, '
      + 'sous une grosse couverture. Papa a fait des ombres chinoises sur le mur avec ses mains : un lapin, un chien et '
      + 'même un dragon ! Nous avons beaucoup ri et j’ai fini par m’endormir. Le lendemain matin, le soleil brillait. Dans '
      + 'la rue, une branche d’arbre était tombée sur le trottoir. Les voisins sont sortis pour aider à la ranger. Tout le '
      + 'monde a eu peur, mais personne n’a été blessé.',
  },
  {
    level: 9, id: 'train', title: 'Le voyage en train',
    text: 'Pour les vacances, je pars chez mes grands-parents en train, avec maman. À la gare, il y a beaucoup de monde et de '
      + 'valises. Nous regardons le grand tableau pour trouver notre quai. Le train arrive en soufflant : il est long et tout '
      + 'blanc. Nous montons dans la voiture numéro huit et nous cherchons nos places. Moi, je suis côté fenêtre. Le train '
      + 'démarre doucement, puis il va de plus en plus vite. Dehors, les maisons, les champs et les vaches défilent à toute '
      + 'allure. Je compte les tunnels sur mes doigts : il y en a cinq ! Un contrôleur passe vérifier nos billets. Au milieu du '
      + 'voyage, nous mangeons nos sandwichs et une pomme. Ensuite, je fais des mots croisés avec maman. Au bout de trois '
      + 'heures, le train ralentit. J’aperçois déjà mes grands-parents sur le quai, qui nous font de grands signes. Je descends '
      + 'en courant pour les embrasser. Les vacances peuvent commencer !',
  },
  {
    level: 9, id: 'chateau-fort', title: 'Le château fort',
    text: 'Avec la classe, nous visitons un vrai château fort. Il est construit en haut d’une colline, pour voir arriver les '
      + 'ennemis de loin. Pour entrer, nous traversons un pont-levis au-dessus des douves. La guide nous explique qu’autrefois, '
      + 'on remontait ce pont avec de grosses chaînes pour bloquer l’entrée. Dans la cour, il y a un puits très profond, qui '
      + 'donnait de l’eau en cas d’attaque. Nous montons ensuite dans le donjon, par un escalier en colimaçon aux marches '
      + 'étroites et usées. Tout en haut, le vent souffle fort, mais la vue est magnifique : on voit la rivière, les forêts et '
      + 'les villages. La guide nous montre les meurtrières, ces fentes étroites dans les murs. Les soldats tiraient des '
      + 'flèches par là, sans être vus. Avant de partir, nous essayons un casque de chevalier, en métal. Il est très lourd et '
      + 'on y voit mal ! Je n’aurais pas aimé porter une armure toute la journée.',
  },
  {
    level: 9, id: 'classe-mer', title: 'La classe de mer',
    text: 'Cette semaine, toute la classe est partie en classe de mer, en Bretagne. Le premier jour, nous avons découvert la '
      + 'plage à marée basse : la mer était si loin qu’on la voyait à peine ! Avec des seaux et des épuisettes, nous avons '
      + 'cherché des animaux dans les rochers. Nous avons trouvé des crabes, des crevettes et même une étoile de mer. '
      + 'L’animateur nous a montré comment prendre un crabe sans se faire pincer. Ensuite, nous avons tout remis dans l’eau. Le '
      + 'mercredi, nous avons fait du char à voile sur le sable. C’était rapide et un peu effrayant ! Le soir, nous écrivions '
      + 'des cartes postales à nos familles, avant d’aller nous coucher. Le dernier jour, nous avons fabriqué des cerfs-volants '
      + 'et nous les avons fait voler au-dessus des dunes. Dans le car du retour, tout le monde chantait. J’ai rapporté un joli '
      + 'coquillage pour ma petite sœur, qui était restée à la maison.',
  },
  {
    level: 9, id: 'demenagement', title: 'Le déménagement',
    text: 'Le mois dernier, nous avons déménagé : notre nouvel appartement est plus grand, et j’ai enfin une chambre à moi. '
      + 'Pendant une semaine, nous avons rempli des dizaines de cartons avec toutes nos affaires. Sur chacun, papa a écrit au '
      + 'feutre ce qu’il y avait dedans : cuisine, livres, jouets. Le grand jour, deux déménageurs sont arrivés avec un énorme '
      + 'camion. Ils portaient l’armoire et le canapé dans l’escalier, comme si c’était léger. Moi, je portais mon carton de '
      + 'peluches avec beaucoup de précautions. Quand le camion est parti, notre ancien appartement était tout vide et ma voix '
      + 'résonnait dans les pièces. J’étais un peu triste de quitter nos voisins et notre quartier. Mais dans le nouvel '
      + 'appartement, ma chambre a une grande fenêtre qui donne sur un parc. Le soir, nous avons mangé des pizzas assis sur les '
      + 'cartons, parce que la table n’était pas encore montée. C’était le plus drôle des dîners de ma vie !',
  },
  {
    level: 9, id: 'surprise', title: 'La fête surprise',
    text: 'Samedi, c’est l’anniversaire de maman. Avec papa et mon petit frère, nous lui préparons une fête surprise. Le matin, '
      + 'papa l’emmène faire des courses, et moi, je reste à la maison avec mamie. Nous accrochons des guirlandes et des '
      + 'ballons dans le salon. Mon frère dessine une grande carte avec des fleurs, des cœurs et un soleil. Mamie sort du '
      + 'placard un gâteau aux fraises qu’elle a préparé la veille. Vers midi, les invités arrivent sans faire de bruit, en '
      + 'marchant sur la pointe des pieds. Nous fermons les volets et nous éteignons la lumière. Tout à coup, nous entendons la '
      + 'clé dans la serrure. Tout le monde retient son souffle. Quand maman entre, nous allumons la lumière et nous crions '
      + 'tous ensemble : surprise ! Maman sursaute, puis elle éclate de rire. Elle a les larmes aux yeux, tellement elle est '
      + 'émue. Elle dit que c’est le plus bel anniversaire de sa vie.',
  },
  {
    level: 9, id: 'camping', title: 'La nuit sous la tente',
    text: 'Cet été, nous avons dormi sous la tente pour la première fois, dans un camping au bord d’un lac. Papa a planté les '
      + 'piquets avec un maillet pendant que je dépliais la toile. Il a fallu une heure pour que la tente tienne debout ! Le '
      + 'soir, nous avons fait cuire des saucisses et des pommes de terre sur un petit réchaud. Ensuite, nous nous sommes '
      + 'allongés dans l’herbe pour regarder le ciel, rempli d’étoiles. Papa m’a montré la Grande Ourse, qui ressemble à une '
      + 'casserole. Dans mon sac de couchage, j’entendais des bruits bizarres : un hibou, le vent dans les arbres, des '
      + 'grenouilles près du lac. J’avais un peu peur, alors j’ai allumé ma lampe de poche. Mon frère, lui, ronflait déjà comme '
      + 'un ours ! Au matin, le soleil a réchauffé la tente et je me suis réveillé de bonne humeur. Nous avons pris notre petit '
      + 'déjeuner face au lac, en regardant les canards.',
  },
  {
    level: 9, id: 'chaton', title: 'Le chaton du jardin',
    text: 'Un soir d’automne, j’ai entendu de petits miaulements sous la haie du jardin. En écartant les branches, j’ai découvert '
      + 'un chaton gris, tout mouillé et très maigre. Il tremblait de froid. Je l’ai pris doucement dans mes mains et je l’ai '
      + 'porté jusqu’à la maison. Maman l’a enveloppé dans une serviette chaude, puis nous lui avons donné de l’eau et un peu '
      + 'de poulet. Il a tout mangé en ronronnant, puis il s’est endormi près du radiateur. Le lendemain, nous l’avons emmené '
      + 'chez la vétérinaire. Elle l’a pesé, l’a examiné et nous a expliqué qu’il ne fallait pas lui donner de lait de vache, '
      + 'car cela lui ferait mal au ventre. Nous avons collé des affiches dans le quartier pour retrouver ses maîtres, mais '
      + 'personne ne l’a réclamé. Alors mes parents ont accepté de le garder. Aujourd’hui, il a bien grandi et il adore jouer '
      + 'avec mes lacets. Chaque soir, il dort sur mon lit, roulé en boule.',
  },
  {
    level: 9, id: 'cross', title: 'Le cross de l’école',
    text: 'Aujourd’hui, c’est le cross de l’école. Depuis un mois, nous nous entraînons à courir dans la cour, chaque mardi. Le '
      + 'maître nous a appris à partir doucement, pour garder des forces jusqu’à la fin. Sur la ligne de départ, nous sommes '
      + 'une cinquantaine d’enfants, avec un dossard accroché au tee-shirt. Au coup de sifflet, tout le monde s’élance en même '
      + 'temps. Certains partent comme des fusées, mais moi, je cours à mon rythme, comme le maître l’a dit. Le parcours fait '
      + 'le tour du stade, puis il passe dans un petit bois. Au deuxième tour, j’ai un point de côté et mes jambes deviennent '
      + 'lourdes. Au bord du chemin, mes parents m’encouragent en criant mon prénom. Alors je serre les dents et je dépasse '
      + 'plusieurs coureurs qui marchent. Je franchis la ligne d’arrivée à la huitième place, tout essoufflé. Je n’ai pas '
      + 'gagné, mais j’ai couru sans jamais m’arrêter, et c’était mon but.',
  },
  {
    level: 9, id: 'museum', title: 'Au muséum',
    text: 'Mercredi, je suis allé au muséum d’histoire naturelle avec mon oncle. Dès l’entrée, un immense squelette de dinosaure '
      + 'nous attendait. Il était si grand que je devais lever la tête pour voir son crâne. Mon oncle m’a expliqué que les '
      + 'dinosaures ont disparu il y a très, très longtemps, bien avant l’arrivée des premiers humains. Dans une autre salle, '
      + 'nous avons vu des animaux empaillés : un ours brun, un loup, un renard et un aigle aux ailes déployées. On aurait dit '
      + 'qu’ils allaient bouger ! Il y avait aussi des vitrines remplies de papillons de toutes les couleurs et de coquillages '
      + 'venus du monde entier. J’ai même pu toucher une vraie dent de mammouth : elle était lourde comme une pierre. À la '
      + 'boutique, mon oncle m’a offert une petite figurine de dinosaure. Le soir, j’ai expliqué à mes parents tout ce que '
      + 'j’avais appris. Plus tard, je veux étudier les fossiles, comme les savants du muséum.',
  },
];

/**
 * Les mots d'un texte, dans l'ordre : un mot par espace (« l’oiseau » compte pour un mot) ; un signe
 * de ponctuation seul (« ! », « : ») est accroché au mot d'avant par une espace insécable fine.
 */
export function fluenceTokens(text) {
  const out = [];
  for (const part of String(text).trim().split(/\s+/)) {
    if (!part) continue;
    if (!/[\p{L}\p{N}]/u.test(part) && out.length) out[out.length - 1] += ` ${part}`;
    else out.push(part);
  }
  return out;
}

// ---------------------------------------------------------------- Niveaux

const LIST_LENGTH = 60; // assez pour qu'un bon lecteur ne finisse pas la liste en une minute

const LEVELS = [
  { label: 'Syllabes simples (ma, li, ro)', kind: 'syllabes', pool: SYLLABES_SIMPLES },
  { label: 'Syllabes plus difficiles (cha, on, pla)', kind: 'syllabes', pool: SYLLABES_COMPLEXES },
  { label: 'Mots courts', kind: 'mots', pool: MOTS_COURTS },
  { label: 'Petits mots et mots fréquents', kind: 'mots', pool: MOTS_FREQUENTS },
  { label: 'Mots plus longs', kind: 'mots', pool: MOTS_LONGS },
  { label: 'Mots difficiles', kind: 'mots', pool: MOTS_DIFFICILES },
  { label: 'Un petit texte', kind: 'texte' },
  { label: 'Un texte', kind: 'texte' },
  { label: 'Un long texte', kind: 'texte' },
];

/** Une liste de `length` éléments tirés d'un réservoir, sans répétition tant que c'est possible. */
export function fluenceList(rng, pool, length = LIST_LENGTH) {
  const out = [];
  while (out.length < length) {
    const batch = shuffle(rng, pool).filter((w, i) => i || w !== out.at(-1)); // jamais deux fois de suite
    out.push(...batch.slice(0, length - out.length));
  }
  return out;
}

const CONSIGNES = {
  syllabes: ['Lis les syllabes à voix haute, le mieux possible.', 'Si tu ne sais pas lire une syllabe, passe à la suivante.'],
  mots: ['Lis les mots à voix haute, le mieux possible.', 'Si tu ne sais pas lire un mot, passe au suivant.'],
  texte: ['Lis le texte à voix haute, le mieux possible.', 'Si tu ne sais pas lire un mot, passe au suivant.'],
};

export const fluence = {
  id: 'fluence',
  domain: 'francais',
  title: 'Lire à voix haute',
  icon: '🗣️',
  skill: 'Fluence : lire à voix haute le plus de mots possible en 1 minute, avec un adulte',
  levels: LEVELS.map((l) => l.label),
  questions: 1, // une partie = une lecture
  adult: true, // un adulte écoute et note : hors du défi du jour, des révisions et des parties à deux
  generate(level, rng) {
    const { kind, pool } = LEVELS[level - 1];
    let tokens;
    let title = null;
    let id;
    if (kind === 'texte') {
      const text = pick(rng, TEXTES_FLUENCE.filter((t) => t.level === level));
      tokens = fluenceTokens(text.text);
      ({ title, id } = text);
    } else {
      tokens = fluenceList(rng, pool);
      id = tokens.slice(0, 4).join('-');
    }
    const consigne = CONSIGNES[kind];
    return {
      key: `fluence:${level}:${id}`,
      interaction: 'fluence',
      text: consigne[0],
      instruction: consigne,
      replay: consigne,
      stage: { type: 'fluence', kind, title, tokens },
      choices: [],
      answer: null,
    };
  },
};

// ---------------------------------------------------------------- Score

/**
 * Le score d'une lecture. `last` est l'indice du dernier mot lu (-1 : aucun), `missed` les indices des
 * mots ratés (ceux après le dernier mot lu ne comptent pas), `seconds` la durée de lecture.
 * MCLM : mots correctement lus, ramenés à une minute (une lecture finie en 40 secondes compte pour
 * ce qu'elle aurait donné en une minute ; une lecture libre, sans chrono, aussi).
 */
export function fluenceScore({ total, missed = [], last, seconds = FLUENCE_SECONDS }) {
  const read = Math.max(0, Math.min(total, Math.floor(last) + 1));
  const errors = [...new Set(missed)].filter((i) => Number.isInteger(i) && i >= 0 && i < read).length;
  const correct = read - errors;
  const time = Math.max(1, Math.round(seconds));
  return {
    total, read, errors, correct, seconds: time,
    mclm: Math.round((correct * 60) / time),
    accuracy: read ? correct / read : 0,
    allRead: total > 0 && read === total,
  };
}

/**
 * Durée à compter : une minute pour une lecture chronométrée (arrêtée par le temps, ou par l'adulte
 * avant la fin), le temps réel si l'enfant a tout lu avant la minute ou s'il lisait sans chrono.
 */
export function fluenceSeconds({ timed, allRead, elapsed }) {
  if (!timed) return Math.max(1, elapsed);
  return allRead ? Math.min(FLUENCE_SECONDS, Math.max(1, elapsed)) : FLUENCE_SECONDS;
}

/** Durée écrite pour les parents : « 1 minute », « 45 s », « 1 min 20 s ». */
export function fluenceTime(seconds) {
  const s = Math.max(0, Math.round(seconds));
  const [min, sec] = [Math.floor(s / 60), s % 60];
  if (!min) return `${sec} s`;
  if (!sec) return min === 1 ? '1 minute' : `${min} minutes`;
  return `${min} min ${String(sec).padStart(2, '0')} s`;
}

/** Étoiles d'une lecture : toujours au moins 2 (l'effort de lire à voix haute), 3 sans presque aucune erreur. */
export function fluenceStars(score) {
  return score && score.read > 0 && score.accuracy >= 0.9 ? 3 : 2;
}

/**
 * Niveau de la prochaine lecture : on monte quand l'enfant lit presque sans erreur et avec aisance
 * (au moins 30 mots par minute, ou toute la liste) ; on redescend quand plus d'un mot sur quatre est raté.
 */
export function fluenceLevelAfter(level, score, min, max) {
  if (score.read > 0 && score.accuracy >= 0.95 && (score.allRead || score.mclm >= 30)) return Math.min(max, level + 1);
  if (score.read > 0 && score.accuracy < 0.75) return Math.max(min, level - 1);
  return level;
}

/** Ce qu'on garde d'une lecture sur le profil de l'enfant (child.fluence). */
export function fluenceEntry({ at, level, kind, timed, score }) {
  return {
    at, level, kind, timed: Boolean(timed),
    total: score.total, read: score.read, errors: score.errors, correct: score.correct, seconds: score.seconds, mclm: score.mclm,
  };
}

// ---------------------------------------------------------------- Suivi des parents

/** Lundi (0 h) de la semaine d'une date. */
export function weekStart(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

/** Seules les lectures de mots et de textes comptent dans le suivi (pas les listes de syllabes). */
export function wordReadings(scores) {
  return (scores || []).filter((s) => s.kind !== 'syllabes');
}

/** Dernier score, meilleur score et nombre de lectures (null s'il n'y en a pas). */
export function fluenceSummary(scores) {
  if (!scores?.length) return null;
  const best = scores.reduce((a, b) => (b.mclm > a.mclm ? b : a));
  return { last: scores.at(-1), best, count: scores.length };
}

/**
 * L'évolution semaine par semaine : les `count` dernières semaines (la plus ancienne d'abord), au plus
 * depuis la semaine de la première lecture. Pour chaque semaine : meilleur et dernier score, nombre de lectures.
 */
export function fluenceWeeks(scores, now = Date.now(), count = 8) {
  const list = scores || [];
  const current = weekStart(now);
  const first = list.length ? weekStart(Math.min(...list.map((s) => new Date(s.at).getTime()))) : current;
  const span = Math.round((current - first) / (7 * 24 * 3600 * 1000)) + 1;
  const n = Math.max(1, Math.min(count, span));
  return Array.from({ length: n }, (_, i) => {
    const start = new Date(current);
    start.setDate(start.getDate() - (n - 1 - i) * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const inWeek = list.filter((s) => new Date(s.at) >= start && new Date(s.at) < end);
    return {
      start,
      readings: inWeek.length,
      best: inWeek.length ? Math.max(...inWeek.map((s) => s.mclm)) : null,
      last: inWeek.length ? inWeek.at(-1).mclm : null,
    };
  });
}

// Repères de l'Éducation nationale (guides et évaluations de CP et de CE1 ; programmes du cycle 3
// de 2025 : « en ciblant 110 mots par minute en moyenne » au CM1, 120 au CM2), donnés à titre indicatif.
const REPERES = {
  CP: 'environ 50 mots par minute en fin de CP',
  CE1: 'environ 70 à 90 mots par minute en fin de CE1',
  CE2: 'environ 90 à 110 mots par minute en fin de CE2',
  CM1: 'environ 110 mots par minute en fin de CM1',
  CM2: 'environ 120 mots par minute en fin de CM2',
};

/**
 * Le repère de la classe, formulé avec prudence (null pour la maternelle) ; `short` : la version
 * courte de l'écran de fin de partie (la version longue est dans le suivi des parents).
 */
export function fluenceBenchmark(grade, { short = false } = {}) {
  if (!REPERES[grade]) return null;
  if (short) return `Repère : ${REPERES[grade]} (chacun avance à son rythme).`;
  return `Repère indicatif (Éducation nationale) : ${REPERES[grade]}. En cours d’année, c’est normal d’en lire moins : chaque enfant avance à son rythme.`;
}
