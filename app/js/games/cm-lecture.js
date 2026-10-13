// « Lire et comprendre », pour le cours moyen (programme de 2025) : des textes d'une dizaine de
// lignes, de genres différents (récit, conte, documentaire, poème, scène de théâtre, lettre), et des
// questions sur ce qui est écrit, sur ce qu'il faut deviner (l'implicite), sur le genre du texte, le
// sens d'un mot, qui parle, l'ordre des événements, le titre, ce que ressentent les personnages, et
// « vrai, faux ou on ne sait pas ». Textes écrits pour l'app, sans prénom.
// Chaque question : [genre de question, question, bonne réponse, mauvaises réponses].

import { pick, shuffle } from '../random.js';
import { textChoices } from './helpers.js';

const GENRES = { recit: 'un récit', poeme: 'un poème', theatre: 'une pièce de théâtre', documentaire: 'un texte documentaire', lettre: 'une lettre' };

export const TEXTES_CM = [
  {
    titre: 'Le gardien du phare', genre: 'recit',
    texte: 'Chaque soir, le vieux gardien montait les cent marches du phare pour allumer la grande lampe qui guidait les bateaux. '
      + 'Une nuit de tempête, la lampe s’éteignit d’un coup. Le gardien saisit sa lanterne, ouvrit la fenêtre malgré le vent et l’agita '
      + 'de toutes ses forces. Au loin, un petit bateau de pêche changea de cap juste avant les rochers. Le lendemain matin, un pêcheur '
      + 'trempé frappa à la porte du phare avec un panier de poissons.',
    questions: [
      ['explicite', 'Combien de marches le gardien montait-il chaque soir ?', 'cent', ['dix', 'mille']],
      ['implicite', 'Pourquoi le pêcheur apporte-t-il des poissons ?', 'pour remercier le gardien', ['pour les vendre au gardien', 'parce qu’il a trop pêché']],
      ['mot', 'Dans le texte, que veut dire « changea de cap » ?', 'changea de direction', ['s’arrêta', 'coula']],
      ['ordre', 'Que se passe-t-il juste après la panne de la lampe ?', 'Le gardien agite sa lanterne.', ['Le pêcheur frappe à la porte.', 'Le gardien monte les marches.']],
      ['sentiment', 'Que ressent sans doute le pêcheur pour le gardien ?', 'de la reconnaissance', ['de la colère', 'de l’ennui']],
      ['titre', 'Quel autre titre irait bien à ce texte ?', 'Une nuit de tempête', ['Le marché aux poissons', 'Des vacances au phare']],
      ['vf', 'Le gardien a un chien.', 'on ne sait pas', []], ['vf', 'La lampe s’est éteinte pendant une tempête.', 'vrai', []],
      ['vf', 'Le bateau de pêche a heurté les rochers.', 'faux', []],
      ['genre', '', 'recit', []],
      ['ordre', 'Que se passe-t-il le lendemain matin ?', 'Un pêcheur frappe à la porte du phare.', ['La lampe s’éteint.', 'Le gardien allume la grande lampe.']],
      ['sentiment', 'Que ressent sans doute le gardien quand la lampe s’éteint ?', 'de l’inquiétude', ['de la joie', 'de l’ennui']],
    ],
  },
  {
    titre: 'Le manchot empereur', genre: 'documentaire',
    texte: 'Le manchot empereur vit en Antarctique, l’endroit le plus froid de la planète. C’est le plus grand des manchots : il mesure '
      + 'plus d’un mètre. Il ne vole pas, mais il nage très bien et peut plonger à plus de cinq cents mètres de profondeur. En hiver, la '
      + 'femelle pond un seul œuf. Pendant deux mois, le mâle le garde au chaud sur ses pattes, sans manger, pendant que la femelle part '
      + 'chercher de la nourriture en mer.',
    questions: [
      ['explicite', 'Où vit le manchot empereur ?', 'en Antarctique', ['au pôle Nord', 'en Afrique']],
      ['explicite', 'Combien d’œufs la femelle pond-elle ?', 'un seul', ['deux', 'cinq']],
      ['implicite', 'Pourquoi le mâle maigrit-il pendant l’hiver ?', 'parce qu’il ne mange pas pendant deux mois', ['parce qu’il nage trop', 'parce qu’il a trop froid']],
      ['mot', 'Dans le texte, que veut dire « profondeur » ?', 'la distance sous la surface de l’eau', ['la longueur du manchot', 'la vitesse du manchot']],
      ['genre', '', 'documentaire', []],
      ['vf', 'Le manchot empereur sait voler.', 'faux', []], ['vf', 'Le mâle garde l’œuf sur ses pattes.', 'vrai', []],
      ['vf', 'Les manchots aiment jouer dans la neige.', 'on ne sait pas', []],
      ['titre', 'Quel autre titre irait bien à ce texte ?', 'Un oiseau du grand froid', ['Les poissons de l’Antarctique', 'Les oiseaux qui volent']],
      ['ordre', 'Que fait la femelle après avoir pondu ?', 'Elle part chercher de la nourriture en mer.', ['Elle garde l’œuf sur ses pattes.', 'Elle construit un nid.']],
    ],
  },
  {
    titre: 'Le vent d’automne', genre: 'poeme',
    lignes: [
      'Le vent d’automne fait la ronde,', 'Il emporte les feuilles blondes ;', 'Les arbres tendent leurs bras nus', 'Vers les oiseaux qu’on ne voit plus.',
      'Dans le jardin, la pluie fredonne', 'Une chanson pour les personnes', 'Qui restent au chaud près du feu', 'En attendant le ciel bleu.',
    ],
    questions: [
      ['genre', '', 'poeme', []],
      ['explicite', 'Qui fait la ronde ?', 'le vent d’automne', ['les oiseaux', 'la pluie']],
      ['mot', 'Dans le poème, que veut dire « fredonne » ?', 'chante doucement', ['crie très fort', 'tombe sans bruit']],
      ['implicite', 'Pourquoi les arbres ont-ils « les bras nus » ?', 'parce qu’ils ont perdu leurs feuilles', ['parce qu’il fait chaud', 'parce qu’on les a coupés']],
      ['implicite', 'Pourquoi ne voit-on plus les oiseaux ?', 'parce qu’ils sont partis vers des pays chauds', ['parce qu’ils dorment', 'parce qu’il fait nuit']],
      ['sentiment', 'Quelle impression donne ce poème ?', 'une impression calme et un peu triste', ['une impression de colère', 'une impression de peur']],
      ['titre', 'Quel autre titre irait bien à ce poème ?', 'La chanson de l’automne', ['Les vacances d’été', 'La neige de Noël']],
    ],
  },
  {
    titre: 'Le renard et la poule', genre: 'theatre',
    lignes: [
      'LE RENARD. — Bonjour, Madame la Poule ! Quelle belle journée !', 'LA POULE. — Bonjour, Monsieur le Renard. Que faites-vous si près de mon poulailler ?',
      'LE RENARD. — Je me promène, voyons ! Je cueille des fleurs pour vous.', 'LA POULE, derrière le grillage. — Des fleurs ? Avec ces grandes dents ?',
      'LE RENARD, souriant. — Ce sont des dents… pour mieux sentir les fleurs !', 'LA POULE. — Hum ! Je préfère rester derrière mon grillage.',
    ],
    questions: [
      ['genre', '', 'theatre', []],
      ['qui', 'Qui dit : « Je me promène, voyons ! » ?', 'le renard', ['la poule', 'le fermier']],
      ['qui', 'Qui dit : « Avec ces grandes dents ? » ?', 'la poule', ['le renard', 'le fermier']],
      ['implicite', 'Que veut vraiment le renard ?', 'manger la poule', ['offrir des fleurs', 'se promener']],
      ['sentiment', 'Que ressent la poule ?', 'de la méfiance', ['de la joie', 'de la tristesse']],
      ['explicite', 'Où reste la poule ?', 'derrière le grillage', ['dans les fleurs', 'chez le renard']],
      ['vf', 'Le renard apporte vraiment des fleurs.', 'on ne sait pas', []], ['vf', 'La poule sort du poulailler.', 'faux', []],
      ['qui', 'Qui dit : « Quelle belle journée ! » ?', 'le renard', ['la poule', 'le fermier']],
      ['qui', 'Qui dit : « Je préfère rester derrière mon grillage » ?', 'la poule', ['le renard', 'le fermier']],
      ['mot', 'Dans le texte, que veut dire « grillage » ?', 'une clôture en fils de fer', ['un mur de pierres', 'une porte en bois']],
      ['ordre', 'Que se passe-t-il en premier ?', 'Le renard dit bonjour à la poule.', ['La poule parle des grandes dents.', 'Le renard parle de ses dents.']],
      ['titre', 'Quel autre titre irait bien à ce texte ?', 'La poule ne se laisse pas tromper', ['Le renard et le loup', 'Une promenade en forêt']],
    ],
  },
  {
    titre: 'Le retour du seigneur', genre: 'recit',
    texte: 'Le guetteur aperçut un nuage de poussière sur la route. « Des cavaliers ! » cria-t-il. Aussitôt, les paysans quittèrent leurs '
      + 'champs et se réfugièrent derrière les remparts. On releva le pont-levis. Dans la cour, les forgerons distribuèrent des lances. '
      + 'Mais quand les cavaliers approchèrent, on reconnut les couleurs du seigneur, qui revenait de la croisade. Ce soir-là, un grand '
      + 'festin fut servi dans la salle du château.',
    questions: [
      ['explicite', 'Que fait-on pour protéger le château ?', 'on relève le pont-levis', ['on ouvre les portes', 'on allume un feu']],
      ['implicite', 'Pourquoi les paysans se réfugient-ils derrière les remparts ?', 'parce qu’ils ont peur d’une attaque', ['parce qu’il pleut', 'pour voir le seigneur']],
      ['ordre', 'Que se passe-t-il en dernier ?', 'Un festin est servi.', ['On relève le pont-levis.', 'Le guetteur crie.']],
      ['mot', 'Dans le texte, que veut dire « se réfugièrent » ?', 'allèrent se mettre à l’abri', ['allèrent se battre', 'allèrent se reposer']],
      ['qui', 'Qui crie : « Des cavaliers ! » ?', 'le guetteur', ['le seigneur', 'un paysan']],
      ['sentiment', 'Que ressentent sans doute les habitants à la fin ?', 'du soulagement', ['de la peur', 'de la colère']],
      ['vf', 'Les cavaliers étaient des ennemis.', 'faux', []], ['vf', 'Le seigneur revenait de la croisade.', 'vrai', []],
      ['vf', 'Le festin avait lieu dans la cour.', 'faux', []], ['vf', 'Le château avait trois tours.', 'on ne sait pas', []],
      ['genre', '', 'recit', []],
      ['ordre', 'Que se passe-t-il juste après le cri du guetteur ?', 'Les paysans se mettent à l’abri.', ['Un festin est servi.', 'On reconnaît le seigneur.']],
      ['titre', 'Quel autre titre irait bien à ce texte ?', 'Une fausse alerte au château', ['La bataille du château', 'Le seigneur et le dragon']],
      ['sentiment', 'Que ressentent sans doute les habitants quand le guetteur crie ?', 'de la peur', ['de la joie', 'de l’ennui']],
    ],
  },
  {
    titre: 'Une lettre de colonie', genre: 'lettre',
    lignes: [
      'Chers parents,', 'Je vous écris du chalet de la colonie. Hier, nous avons marché jusqu’au lac. L’eau était si froide que personne n’a osé se baigner, sauf le moniteur !',
      'Le soir, nous avons fait griller des châtaignes. Mon voisin de lit ronfle un peu, mais il est très drôle. Je dors bien quand même.',
      'Demain, nous visitons une fromagerie. Vous me manquez, mais je m’amuse beaucoup.', 'Je vous embrasse très fort.',
    ],
    questions: [
      ['genre', '', 'lettre', []],
      ['explicite', 'Qui s’est baigné dans le lac ?', 'le moniteur', ['personne', 'tous les enfants']],
      ['implicite', 'Où la colonie se trouve-t-elle sans doute ?', 'à la montagne', ['au bord de la mer', 'dans une grande ville']],
      ['sentiment', 'Comment se sent l’enfant qui écrit ?', 'heureux, même si ses parents lui manquent', ['très triste', 'en colère']],
      ['ordre', 'Qu’ont fait les enfants le soir ?', 'Ils ont grillé des châtaignes.', ['Ils ont visité une fromagerie.', 'Ils se sont baignés.']],
      ['vf', 'L’enfant n’arrive pas à dormir.', 'faux', []], ['vf', 'Demain, les enfants visitent une fromagerie.', 'vrai', []],
      ['vf', 'Le moniteur a eu froid.', 'on ne sait pas', []],
      ['mot', 'Dans la lettre, que veut dire « personne n’a osé » ?', 'personne n’a eu le courage', ['personne n’a eu le temps', 'personne n’a eu le droit']],
      ['ordre', 'Qu’ont fait les enfants avant de griller des châtaignes ?', 'Ils ont marché jusqu’au lac.', ['Ils ont visité une fromagerie.', 'Ils ont pris le car du retour.']],
      ['titre', 'Quel autre titre irait bien à ce texte ?', 'Des nouvelles de la colonie', ['Une journée à la plage', 'Une visite au zoo']],
    ],
  },
  {
    titre: 'Les volcans', genre: 'documentaire',
    texte: 'Un volcan est une montagne d’où sort parfois de la lave. Sous nos pieds, à plusieurs dizaines de kilomètres, les roches sont '
      + 'si chaudes qu’elles fondent : c’est le magma. Quand il remonte jusqu’à la surface, il s’appelle la lave. Certains volcans crachent '
      + 'des cendres et des blocs de lave : ce sont des volcans explosifs. D’autres laissent couler des rivières de lave. En France, les '
      + 'volcans d’Auvergne sont endormis depuis des milliers d’années.',
    questions: [
      ['explicite', 'Comment s’appelle la roche fondue sous la terre ?', 'le magma', ['la cendre', 'le sable']],
      ['genre', '', 'documentaire', []],
      ['implicite', 'Pourquoi les volcans d’Auvergne ne sont-ils pas dangereux aujourd’hui ?', 'parce qu’ils sont endormis depuis longtemps', ['parce qu’ils sont trop petits', 'parce qu’ils sont sous la mer']],
      ['mot', 'Dans le texte, que veut dire « crachent » ?', 'projettent avec force', ['avalent', 'cachent']],
      ['titre', 'Quel autre titre irait bien à ce texte ?', 'Des montagnes de feu', ['Les montagnes enneigées', 'Le voyage de l’eau']],
      ['vf', 'Les volcans d’Auvergne sont en éruption.', 'faux', []], ['vf', 'Le magma devient de la lave à la surface.', 'vrai', []],
      ['vf', 'Il y a des volcans sous la mer.', 'on ne sait pas', []],
    ],
  },
  {
    titre: 'La soupe au caillou', genre: 'recit',
    texte: 'Un soldat affamé arriva dans un village. Personne ne voulait partager son repas. Alors le soldat sortit un caillou de sa poche : '
      + '« Je vais vous préparer une soupe au caillou ! » Curieux, les villageois apportèrent une marmite d’eau. « Elle serait meilleure avec '
      + 'une carotte », dit le soldat. Une femme apporta des carottes. Un vieillard ajouta des poireaux, un enfant des pommes de terre. '
      + 'Bientôt, tout le village partagea la meilleure soupe de son histoire.',
    questions: [
      ['implicite', 'Pourquoi le soldat parle-t-il d’une soupe au caillou ?', 'pour que chacun apporte un peu de nourriture', ['parce que les cailloux sont bons', 'pour faire peur aux villageois']],
      ['implicite', 'Que nous apprend cette histoire ?', 'qu’en partageant, on a plus', ['qu’il faut garder sa nourriture', 'que les cailloux se mangent']],
      ['explicite', 'Qu’apporte la femme ?', 'des carottes', ['des poireaux', 'des pommes de terre']],
      ['ordre', 'Que se passe-t-il en premier ?', 'Le soldat arrive dans un village.', ['Une femme apporte des carottes.', 'Le village partage la soupe.']],
      ['sentiment', 'Que ressentent les villageois au début de l’histoire ?', 'de la méfiance', ['de la joie', 'de la peur du soldat']],
      ['qui', 'Qui dit : « Elle serait meilleure avec une carotte » ?', 'le soldat', ['la femme', 'un vieillard']],
      ['vf', 'Le soldat avait très faim.', 'vrai', []], ['vf', 'Le vieillard apporta des carottes.', 'faux', []],
      ['vf', 'Le soldat repartit le lendemain.', 'on ne sait pas', []],
      ['genre', '', 'recit', []],
      ['mot', 'Dans le texte, que veut dire « affamé » ?', 'qui a très faim', ['qui a très sommeil', 'qui est très en colère']],
      ['qui', 'Qui dit : « Je vais vous préparer une soupe au caillou ! » ?', 'le soldat', ['une femme', 'un enfant']],
      ['ordre', 'Que se passe-t-il juste après l’arrivée des carottes ?', 'Un vieillard ajoute des poireaux.', ['Le soldat sort un caillou.', 'Le soldat arrive au village.']],
      ['titre', 'Quel autre titre irait bien à ce texte ?', 'Une soupe pour tout le village', ['Le trésor du soldat', 'Le village sans eau']],
      ['sentiment', 'Que ressentent les villageois quand le soldat sort son caillou ?', 'de la curiosité', ['de la tristesse', 'de la colère']],
    ],
  },
  {
    titre: 'Le voyage de l’eau', genre: 'documentaire',
    texte: 'L’eau ne disparaît jamais vraiment : elle voyage. Chauffée par le Soleil, l’eau des océans s’évapore et monte dans le ciel '
      + 'sous forme de vapeur. En altitude, l’air est froid : la vapeur se transforme en minuscules gouttelettes qui forment les nuages. '
      + 'Quand les gouttes deviennent trop lourdes, elles tombent : c’est la pluie, ou la neige s’il fait très froid. L’eau ruisselle '
      + 'ensuite jusqu’aux rivières, qui la ramènent à la mer. Et le voyage recommence !',
    questions: [
      ['explicite', 'Qu’est-ce qui chauffe l’eau des océans ?', 'le Soleil', ['le vent', 'les nuages']],
      ['mot', 'Dans le texte, que veut dire « ruisselle » ?', 'coule sur le sol', ['s’évapore', 'gèle']],
      ['ordre', 'Que se passe-t-il juste après l’évaporation ?', 'La vapeur monte dans le ciel.', ['La pluie tombe.', 'Les rivières ramènent l’eau à la mer.']],
      ['titre', 'Quel autre titre irait bien à ce texte ?', 'Le cycle de l’eau', ['La pêche en mer', 'Les vacances à la plage']],
      ['genre', '', 'documentaire', []],
      ['vf', 'La pluie tombe quand les gouttes sont trop lourdes.', 'vrai', []], ['vf', 'Les nuages sont faits de fumée.', 'faux', []],
      ['vf', 'Il pleut plus en hiver qu’en été.', 'on ne sait pas', []],
    ],
  },
  {
    titre: 'La mer', genre: 'poeme',
    lignes: [
      'La mer est un grand drap bleu', 'Que le vent froisse un peu ;', 'Les mouettes y font des taches blanches,', 'Les bateaux y dorment le dimanche.',
      'Quand vient le soir, elle s’endort,', 'Et la lune y pose un bateau d’or.',
    ],
    questions: [
      ['genre', '', 'poeme', []],
      ['mot', 'Dans le poème, que veut dire « froisse » ?', 'fait des plis', ['repasse', 'colore']],
      ['implicite', 'Que peut être le « bateau d’or » posé par la lune ?', 'le reflet de la lune sur l’eau', ['un vrai bateau en or', 'un bateau de pêche']],
      ['explicite', 'Que font les mouettes ?', 'des taches blanches', ['des vagues', 'des nuages']],
      ['implicite', 'À quoi le poète compare-t-il la mer ?', 'à un grand drap', ['à un bateau', 'à une mouette']],
      ['vf', 'Dans le poème, les bateaux dorment le dimanche.', 'vrai', []], ['vf', 'Le poème parle d’une tempête.', 'faux', []],
      ['titre', 'Quel autre titre irait bien à ce poème ?', 'Un grand drap bleu', ['La forêt en hiver', 'Le vent dans les arbres']],
    ],
  },
  {
    titre: 'Le chat du tableau', genre: 'theatre',
    lignes: [
      'LE MAÎTRE. — Qui a dessiné ce chat sur le tableau ?', 'LA CLASSE, tous ensemble. — Ce n’est pas nous !',
      'LE MAÎTRE, sévère. — Alors, ce chat s’est dessiné tout seul ?', 'UNE ÉLÈVE, timidement. — Peut-être qu’il est magique…',
      'LE MAÎTRE, souriant malgré lui. — Magique ? Alors il pourra aussi s’effacer tout seul… pendant la récréation !', 'TOUS. — Oh non !',
    ],
    questions: [
      ['genre', '', 'theatre', []],
      ['qui', 'Qui dit : « Peut-être qu’il est magique… » ?', 'une élève', ['le maître', 'toute la classe']],
      ['qui', 'Qui dit : « Ce n’est pas nous ! » ?', 'toute la classe', ['le maître', 'une élève']],
      ['implicite', 'Que devront sans doute faire les élèves pendant la récréation ?', 'effacer le dessin', ['dessiner un chien', 'chercher un chat']],
      ['sentiment', 'Comment est le maître à la fin de la scène ?', 'amusé', ['furieux', 'effrayé']],
      ['vf', 'Le maître sait qui a dessiné le chat.', 'faux', []], ['vf', 'Le chat est vraiment magique.', 'on ne sait pas', []],
      ['qui', 'Qui dit : « Alors, ce chat s’est dessiné tout seul ? » ?', 'le maître', ['une élève', 'toute la classe']],
      ['mot', 'Dans le texte, que veut dire « timidement » ?', 'sans oser parler fort', ['en criant', 'en se moquant']],
      ['ordre', 'Que se passe-t-il en premier ?', 'Le maître demande qui a dessiné le chat.', ['Une élève parle de magie.', 'Le maître parle de la récréation.']],
      ['titre', 'Quel autre titre irait bien à ce texte ?', 'Un dessin mystérieux', ['Le chat perdu', 'Une sortie au musée']],
      ['sentiment', 'Comment se sentent sans doute les élèves à la fin ?', 'déçus', ['très fiers', 'très contents']],
    ],
  },
  {
    titre: 'Le nouveau', genre: 'recit',
    texte: 'Le jour de la rentrée, le nouveau resta seul près du portail. Il serrait les bretelles de son cartable et regardait ses '
      + 'chaussures. Personne ne le connaissait. Soudain, un ballon roula jusqu’à ses pieds. Une fille de la classe lui fit un signe : '
      + '« Tu viens jouer avec nous ? » Le garçon hésita, puis il donna un grand coup de pied dans le ballon. À la fin de la récréation, '
      + 'il avait déjà trois amis.',
    questions: [
      ['sentiment', 'Comment se sent le garçon au début ?', 'intimidé', ['joyeux', 'en colère']],
      ['sentiment', 'Comment se sent-il sans doute à la fin ?', 'content', ['inquiet', 'fâché']],
      ['implicite', 'Pourquoi regarde-t-il ses chaussures ?', 'parce qu’il est timide', ['parce qu’elles sont sales', 'parce qu’il a perdu un lacet']],
      ['explicite', 'Qu’est-ce qui roule jusqu’à ses pieds ?', 'un ballon', ['un cartable', 'une bille']],
      ['qui', 'Qui dit : « Tu viens jouer avec nous ? » ?', 'une fille de la classe', ['le maître', 'le nouveau']],
      ['titre', 'Quel autre titre irait bien à ce texte ?', 'Trois amis en une récréation', ['Le ballon perdu', 'Les chaussures neuves']],
      ['vf', 'Le garçon connaissait tout le monde.', 'faux', []], ['vf', 'À la fin, il a trois amis.', 'vrai', []],
      ['vf', 'Le garçon adore le football.', 'on ne sait pas', []],
      ['genre', '', 'recit', []],
      ['mot', 'Dans le texte, que veut dire « hésita » ?', 'attendit un peu avant de se décider', ['refusa tout de suite', 'partit en courant']],
      ['ordre', 'Que fait le garçon après l’invitation ?', 'Il donne un coup de pied dans le ballon.', ['Il serre les bretelles de son cartable.', 'Il rentre chez lui.']],
    ],
  },
  {
    titre: 'Le système solaire', genre: 'documentaire',
    texte: 'Le Soleil est une étoile. Huit planètes tournent autour de lui. Les quatre plus proches, Mercure, Vénus, la Terre et Mars, '
      + 'sont faites de roches. Les quatre plus lointaines, Jupiter, Saturne, Uranus et Neptune, sont des géantes faites surtout de gaz. '
      + 'La Terre met un an pour faire le tour du Soleil, et un jour pour tourner sur elle-même. C’est pour cela que nous avons le jour et la nuit.',
    questions: [
      ['explicite', 'Combien de planètes tournent autour du Soleil ?', 'huit', ['neuf', 'quatre']],
      ['explicite', 'Combien de temps la Terre met-elle pour faire le tour du Soleil ?', 'un an', ['un jour', 'un mois']],
      ['implicite', 'Pourquoi fait-il nuit chez nous chaque soir ?', 'parce que la Terre tourne sur elle-même', ['parce que le Soleil s’éteint', 'parce que la Lune cache le Soleil']],
      ['genre', '', 'documentaire', []],
      ['vf', 'Le Soleil est une planète.', 'faux', []], ['vf', 'Jupiter est faite surtout de gaz.', 'vrai', []], ['vf', 'Il y a de la vie sur Mars.', 'on ne sait pas', []],
      ['mot', 'Dans le texte, que veut dire « lointaines » ?', 'qui sont très loin', ['qui sont très chaudes', 'qui sont très petites']],
      ['titre', 'Quel autre titre irait bien à ce texte ?', 'Le Soleil et ses planètes', ['La vie sur Mars', 'Les saisons sur la Terre']],
    ],
  },
  {
    titre: 'Le cerf-volant', genre: 'recit',
    texte: 'Ce dimanche-là, le vent soufflait fort sur la plage. Le grand-père sortit un vieux cerf-volant rouge. « Tiens bien la ficelle '
      + 'et cours ! » dit-il à sa petite-fille. Le cerf-volant monta très haut. Soudain, une rafale arracha la ficelle '
      + 'des mains de la fillette. Le cerf-volant fila vers les dunes et disparut. La fillette avait les larmes aux yeux. Mais un garçon '
      + 'arriva en courant, le cerf-volant sous le bras : « Il est tombé juste à côté de moi ! »',
    questions: [
      ['explicite', 'De quelle couleur est le cerf-volant ?', 'rouge', ['bleu', 'jaune']],
      ['implicite', 'Pourquoi la fillette a-t-elle les larmes aux yeux ?', 'parce qu’elle croit le cerf-volant perdu', ['parce qu’elle a froid', 'parce que son grand-père la gronde']],
      ['genre', '', 'recit', []],
      ['mot', 'Dans le texte, que veut dire « une rafale » ?', 'un coup de vent soudain et fort', ['une grosse vague', 'un oiseau de mer']],
      ['qui', 'Qui dit : « Tiens bien la ficelle et cours ! » ?', 'le grand-père', ['la fillette', 'le garçon']],
      ['qui', 'Qui dit : « Il est tombé juste à côté de moi ! » ?', 'le garçon', ['le grand-père', 'la fillette']],
      ['ordre', 'Que se passe-t-il juste après la rafale ?', 'Le cerf-volant file vers les dunes.', ['Le grand-père sort le cerf-volant.', 'Un garçon arrive en courant.']],
      ['titre', 'Quel autre titre irait bien à ce texte ?', 'Le cerf-volant retrouvé', ['Une baignade en hiver', 'Le château de sable']],
      ['sentiment', 'Que ressent sans doute la fillette à la fin ?', 'de la joie', ['de la colère', 'de la peur']],
      ['vf', 'Le vent soufflait fort sur la plage.', 'vrai', []], ['vf', 'Le cerf-volant est tombé dans la mer.', 'faux', []],
      ['vf', 'Le garçon habite près de la plage.', 'on ne sait pas', []],
    ],
  },
  {
    titre: 'Les abeilles', genre: 'documentaire',
    texte: 'Les abeilles vivent dans une ruche, avec une seule reine et des milliers d’ouvrières. La reine pond tous les œufs. Les '
      + 'ouvrières travaillent sans arrêt : elles nettoient la ruche, nourrissent les larves et butinent les fleurs. En butinant, '
      + 'elles récoltent le nectar, un liquide sucré qu’elles transforment en miel. Le miel les nourrit pendant l’hiver. De fleur en '
      + 'fleur, les abeilles transportent aussi du pollen : elles aident les plantes à donner des fruits.',
    questions: [
      ['explicite', 'Qui pond les œufs dans la ruche ?', 'la reine', ['les ouvrières', 'les larves']],
      ['explicite', 'Avec quoi les abeilles fabriquent-elles le miel ?', 'avec le nectar des fleurs', ['avec de l’eau de pluie', 'avec des feuilles']],
      ['implicite', 'Pourquoi les abeilles ont-elles besoin de miel en hiver ?', 'parce qu’il n’y a presque pas de fleurs', ['parce qu’il fait trop chaud', 'parce que la reine a disparu']],
      ['mot', 'Dans le texte, que veut dire « butinent » ?', 'récoltent le nectar sur les fleurs', ['piquent les animaux', 'construisent la ruche']],
      ['genre', '', 'documentaire', []],
      ['titre', 'Quel autre titre irait bien à ce texte ?', 'La vie dans une ruche', ['Les fourmis au travail', 'Un jardin en hiver']],
      ['vf', 'Une ruche a plusieurs reines.', 'faux', []], ['vf', 'Le nectar est un liquide sucré.', 'vrai', []],
      ['vf', 'Les abeilles préfèrent les fleurs jaunes.', 'on ne sait pas', []],
    ],
  },
  {
    titre: 'La neige', genre: 'poeme',
    lignes: [
      'Toute la nuit, sans faire de bruit,', 'La neige est tombée sans répit.', 'Ce matin, la ville est toute blanche,', 'Des toits jusqu’au bout des branches.',
      'Les enfants sortent en riant,', 'Leurs bottes crissent dans le blanc ;', 'Un bonhomme au nez de carotte', 'Les attend, coiffé d’une vieille botte.',
    ],
    questions: [
      ['genre', '', 'poeme', []],
      ['mot', 'Dans le poème, que veut dire « sans répit » ?', 'sans s’arrêter', ['très doucement', 'en tournant']],
      ['explicite', 'Avec quoi a-t-on fait le nez du bonhomme ?', 'avec une carotte', ['avec une botte', 'avec un caillou']],
      ['implicite', 'Pourquoi les bottes des enfants crissent-elles ?', 'parce qu’ils marchent dans la neige', ['parce qu’elles sont neuves', 'parce qu’il pleut']],
      ['ordre', 'Que se passe-t-il en premier dans le poème ?', 'La neige tombe toute la nuit.', ['Les enfants sortent en riant.', 'Le bonhomme attend les enfants.']],
      ['sentiment', 'Comment sont les enfants dans ce poème ?', 'joyeux', ['tristes', 'effrayés']],
      ['titre', 'Quel autre titre irait bien à ce poème ?', 'Un matin d’hiver', ['Une journée à la plage', 'La rentrée des classes']],
      ['vf', 'Il a neigé pendant la nuit.', 'vrai', []], ['vf', 'Les enfants restent à la maison.', 'faux', []],
      ['vf', 'Les enfants vont ensuite à l’école.', 'on ne sait pas', []],
    ],
  },
  {
    titre: 'Le gâteau disparu', genre: 'theatre',
    lignes: [
      'LA MÈRE. — Qui a mangé la moitié du gâteau au chocolat ?', 'LE FRÈRE. — Ce n’est pas moi, je dormais !',
      'LA SŒUR. — Moi non plus, je lisais dans ma chambre.', 'LA MÈRE, regardant le frère. — Tiens, tu as du chocolat tout autour de la bouche…',
      'LE FRÈRE, s’essuyant vite. — C’est… c’est de la confiture !', 'LA SŒUR, en riant. — De la confiture marron ? Elle est bizarre, ta confiture !',
    ],
    questions: [
      ['genre', '', 'theatre', []],
      ['qui', 'Qui dit : « Ce n’est pas moi, je dormais ! » ?', 'le frère', ['la sœur', 'la mère']],
      ['qui', 'Qui dit : « Elle est bizarre, ta confiture ! » ?', 'la sœur', ['la mère', 'le frère']],
      ['qui', 'Qui dit : « Tiens, tu as du chocolat tout autour de la bouche… » ?', 'la mère', ['la sœur', 'le frère']],
      ['implicite', 'Qui a sans doute mangé le gâteau ?', 'le frère', ['la sœur', 'la mère']],
      ['sentiment', 'Comment se sent sans doute le frère quand sa mère le regarde ?', 'gêné', ['fier', 'très content']],
      ['ordre', 'Que se passe-t-il en dernier ?', 'La sœur se moque de la confiture.', ['La mère pose une question.', 'Le frère dit qu’il dormait.']],
      ['titre', 'Quel autre titre irait bien à ce texte ?', 'Un mensonge au chocolat', ['La recette du gâteau', 'Une nuit à la bibliothèque']],
      ['vf', 'Le gâteau était au chocolat.', 'vrai', []], ['vf', 'La mère a trouvé le gâteau entier.', 'faux', []],
      ['vf', 'Le père a aussi mangé du gâteau.', 'on ne sait pas', []],
    ],
  },
  {
    titre: 'Une lettre à ma marraine', genre: 'lettre',
    lignes: [
      'Chère marraine,', 'Merci beaucoup pour le livre sur les dinosaures que tu m’as offert pour mon anniversaire. Je l’ai déjà lu deux fois ! Mon préféré est le tricératops, avec ses trois cornes.',
      'Samedi, j’ai fêté mon anniversaire au parc avec mes copains. À la fin, il s’est mis à pleuvoir, alors nous avons mangé le gâteau sous le kiosque.',
      'J’espère que tu viendras nous voir pendant les vacances.', 'Gros bisous.',
    ],
    questions: [
      ['genre', '', 'lettre', []],
      ['explicite', 'Quel cadeau la marraine a-t-elle offert ?', 'un livre sur les dinosaures', ['un jeu de société', 'un ballon']],
      ['implicite', 'Pourquoi l’enfant écrit-il cette lettre ?', 'pour remercier sa marraine', ['pour l’inviter à son anniversaire', 'pour demander un cadeau']],
      ['implicite', 'Pourquoi a-t-on mangé le gâteau sous le kiosque ?', 'pour être à l’abri de la pluie', ['parce qu’il faisait trop chaud', 'parce que le parc était fermé']],
      ['mot', 'Dans la lettre, que veut dire « kiosque » ?', 'un petit abri avec un toit', ['un grand magasin', 'un toboggan géant']],
      ['ordre', 'Que s’est-il passé à la fin de la fête ?', 'Il s’est mis à pleuvoir.', ['Les copains sont arrivés.', 'Les enfants sont allés au cinéma.']],
      ['sentiment', 'Que pense l’enfant de son livre ?', 'il l’aime beaucoup', ['il le trouve ennuyeux', 'il en a peur']],
      ['titre', 'Quel autre titre irait bien à ce texte ?', 'Un cadeau qui a plu', ['Les dinosaures ont disparu', 'Une journée à la mer']],
      ['vf', 'L’enfant a déjà lu le livre deux fois.', 'vrai', []], ['vf', 'La fête a eu lieu à la piscine.', 'faux', []],
      ['vf', 'La marraine a un chien.', 'on ne sait pas', []],
    ],
  },
  {
    titre: 'Le hérisson', genre: 'documentaire',
    texte: 'Le hérisson est un petit mammifère couvert de piquants. Il vit dans les bois et les jardins. Le jour, il dort, '
      + 'caché sous les feuilles. La nuit, il part chercher sa nourriture : des vers, des insectes, des escargots et des limaces. C’est '
      + 'pourquoi les jardiniers l’aiment beaucoup. Quand il a peur, il se roule en boule et ses piquants le protègent. En hiver, quand '
      + 'la nourriture manque, il hiberne : il dort pendant plusieurs mois dans un nid de feuilles.',
    questions: [
      ['genre', '', 'documentaire', []],
      ['explicite', 'Que fait le hérisson quand il a peur ?', 'il se roule en boule', ['il creuse un trou', 'il grimpe dans un arbre']],
      ['implicite', 'Pourquoi les jardiniers aiment-ils le hérisson ?', 'parce qu’il mange les limaces', ['parce qu’il plante des fleurs', 'parce qu’il arrose le jardin']],
      ['mot', 'Dans le texte, que veut dire « hiberne » ?', 'passe l’hiver à dormir', ['part dans les pays chauds', 'change de couleur']],
      ['ordre', 'Que fait le hérisson après avoir dormi toute la journée ?', 'Il part chercher sa nourriture.', ['Il part dans les pays chauds.', 'Il hiberne.']],
      ['titre', 'Quel autre titre irait bien à ce texte ?', 'Un petit animal piquant', ['Le roi de la forêt', 'Les oiseaux du jardin']],
      ['vf', 'Le hérisson est un oiseau.', 'faux', []], ['vf', 'Le hérisson est couvert de piquants.', 'vrai', []],
      ['vf', 'Le hérisson a peur des chiens.', 'on ne sait pas', []],
    ],
  },
  {
    titre: 'Le lion et la souris', genre: 'recit',
    texte: 'Un jour, une petite souris passa par mégarde entre les pattes d’un lion endormi. Le lion se réveilla et l’attrapa. « Laissez-moi '
      + 'partir, je vous en prie ! Un jour, je pourrai peut-être vous aider », supplia la souris. Le lion éclata de rire, mais il la laissa '
      + 'filer. Plus tard, le lion se prit dans un filet tendu par des chasseurs. Il rugit et se débattit, sans pouvoir se libérer. La '
      + 'souris accourut et rongea les cordes une à une : le lion était libre !',
    questions: [
      ['genre', '', 'recit', []],
      ['qui', 'Qui dit : « Laissez-moi partir, je vous en prie ! » ?', 'la souris', ['le lion', 'un chasseur']],
      ['mot', 'Dans le texte, que veut dire « par mégarde » ?', 'sans faire exprès', ['en courant très vite', 'pour jouer']],
      ['mot', 'Dans le texte, que veut dire « rongea » ?', 'coupa petit à petit avec ses dents', ['dénoua avec ses pattes', 'tira très fort']],
      ['ordre', 'Que fait le lion juste après s’être pris dans le filet ?', 'Il rugit et se débat.', ['Il attrape la souris.', 'Il éclate de rire.']],
      ['ordre', 'Que se passe-t-il en dernier ?', 'La souris libère le lion.', ['Le lion attrape la souris.', 'Des chasseurs tendent un filet.']],
      ['sentiment', 'Que ressent sans doute le lion pour la souris à la fin ?', 'de la reconnaissance', ['de la colère', 'de la jalousie']],
      ['implicite', 'Que nous apprend cette histoire ?', 'qu’un petit peut aider un plus grand', ['que les lions sont méchants', 'qu’il faut se méfier des souris']],
      ['titre', 'Quel autre titre irait bien à ce texte ?', 'Une petite souris courageuse', ['Le roi des chasseurs', 'La souris et le fromage']],
      ['vf', 'Le lion a mangé la souris.', 'faux', []], ['vf', 'Des chasseurs avaient tendu un filet.', 'vrai', []],
      ['vf', 'Les chasseurs sont revenus le lendemain.', 'on ne sait pas', []],
    ],
  },
];

const TOUTES = ['explicite', 'implicite', 'genre', 'mot', 'qui', 'ordre', 'titre', 'sentiment', 'vf'];
// niveaux 1 à 9 : une sorte de question chacun ; niveau 10 : toutes
const NIVEAUX = [null, ...TOUTES.map((g) => [g]), TOUTES];
const VF = ['vrai', 'faux', 'on ne sait pas'];

function questionLecture(level, rng) {
  const genres = NIVEAUX[level];
  const candidats = TEXTES_CM.flatMap((t) => t.questions.filter(([g]) => genres.includes(g)).map((q) => [t, q]));
  const [t, [genre, question, reponse, autres]] = pick(rng, candidats);
  const stage = { type: 'text', title: genre === 'titre' ? null : t.titre, ...(t.lignes ? { lines: t.lignes } : { text: t.texte }) };
  const base = { key: `lecture-cm:${level}:${t.titre}:${genre}:${question}`, stage, short: { key: `lecture-cm:${genre}`, text: 'Lis le texte, puis réponds.' } };
  if (genre === 'genre') {
    const options = Object.keys(GENRES).filter((g) => g !== 'lettre' || t.genre === 'lettre');
    const consigne = 'Quel genre de texte est-ce ?';
    return {
      ...base,
      text: consigne,
      instruction: ['Lis le texte.', consigne],
      choices: options.map((g) => ({ value: g, label: GENRES[g] })),
      choiceStyle: 'sentences',
      answer: reponse,
      success: { speak: `Oui, c’est ${GENRES[reponse]}.` },
    };
  }
  if (genre === 'vf') {
    const consigne = 'Vrai, faux, ou on ne sait pas ?';
    return {
      ...base,
      text: `${question} ${consigne}`,
      instruction: ['Lis le texte, puis la phrase.', question, consigne],
      replay: [question, consigne],
      choices: textChoices(VF),
      choiceStyle: 'sentences',
      answer: reponse,
      success: { speak: reponse === 'vrai' ? 'Oui, c’est vrai : c’est écrit dans le texte.' : reponse === 'faux' ? 'Oui, c’est faux : le texte dit autre chose.' : 'Oui, on ne sait pas : le texte n’en parle pas.' },
    };
  }
  const options = shuffle(rng, [reponse, ...autres]);
  return {
    ...base,
    text: question,
    instruction: ['Lis le texte, puis réponds à la question.', question],
    replay: [question],
    choices: textChoices(options),
    choiceStyle: 'sentences',
    answer: reponse,
    success: { speak: `Oui : ${reponse}${/[.!?]$/.test(reponse) ? '' : '.'}` },
  };
}

export const lectureCm = {
  id: 'lecture-cm',
  domain: 'histoires',
  section: 'Lire',
  title: 'Lire et comprendre',
  icon: '📗',
  skill: 'Comprendre un texte : ce qui est écrit, ce qu’il faut deviner, le genre, le sens des mots, les personnages',
  levels: [
    'Ce que dit le texte', 'Lire entre les lignes', 'Quel genre de texte ?', 'Le sens d’un mot', 'Qui parle ?',
    'L’ordre des événements', 'Le titre du texte', 'Ce que ressent le personnage', 'Vrai, faux, on ne sait pas', 'Grand mélange',
  ],
  generate(level, rng) {
    return questionLecture(level, rng);
  },
};
