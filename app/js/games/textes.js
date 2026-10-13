// Petits textes à lire (CP, CE1) : un court texte, puis une question de compréhension.
// Le bouton « Écouter le texte » aide l'enfant qui bloque ; la question est toujours lue.
// Niveaux 7 et 8 (CE1) : textes documentaires, puis consignes et recettes à suivre.
// Niveaux 9 et 10 (CE1) : pourquoi ? (cause, intention), puis ce que pense ou ressent le personnage.

import { pick, shuffle } from '../random.js';
import { pickSeasonal } from './helpers.js';
import { sonsActifs, texteDechiffrable } from '../graphemes.js';

// [question, bonne réponse, autre réponse, autre réponse]
const TEXTS = [
  // ---- Niveau 1 : 3 phrases courtes, sons simples
  { level: 1, title: 'Le chat de Léo', text: 'Léo a un chat. Le chat est roux. Il dort sur le lit.', questions: [
    ['Qui a un chat ?', 'Léo', 'Lili', 'Papa'],
    ['Où dort le chat ?', 'sur le lit', 'sous la table', 'dans le jardin'],
    ['De quelle couleur est le chat ?', 'roux', 'noir', 'blanc']] },
  { level: 1, title: 'À la mare', text: 'Lili va à la mare. Elle voit une tortue. La tortue nage.', questions: [
    ['Où va Lili ?', 'à la mare', 'à l’école', 'au parc'],
    ['Que voit Lili ?', 'une tortue', 'un lapin', 'un chat'],
    ['Que fait la tortue ?', 'elle nage', 'elle dort', 'elle mange']] },
  { level: 1, title: 'La tarte', text: 'Papa fait une tarte. Il met des pommes. La tarte est bonne !', questions: [
    ['Qui fait la tarte ?', 'Papa', 'Maman', 'Lili'],
    ['Que met papa dans la tarte ?', 'des pommes', 'des fraises', 'des poires']] },
  { level: 1, title: 'Le ballon', text: 'Tom a un ballon rouge. Il joue avec Sami. Le ballon va sur le toit !', questions: [
    ['De quelle couleur est le ballon ?', 'rouge', 'bleu', 'vert'],
    ['Avec qui joue Tom ?', 'Sami', 'Léo', 'Mila'],
    ['Où va le ballon ?', 'sur le toit', 'dans l’eau', 'dans la rue']] },
  { level: 1, title: 'La fête', text: 'Mila a une robe. La robe est jolie. Mila va à la fête.', questions: [
    ['Qu’a Mila ?', 'une robe', 'un vélo', 'un chat'],
    ['Où va Mila ?', 'à la fête', 'à la mer', 'au lit']] },
  { level: 1, title: 'Le lapin', text: 'Le petit lapin a faim. Il mange une carotte. Puis il fait dodo.', questions: [
    ['Que mange le lapin ?', 'une carotte', 'une pomme', 'du pain'],
    ['Que fait le lapin après ?', 'il fait dodo', 'il court', 'il nage']] },
  { level: 1, title: 'La moto', text: 'Papi a une moto. La moto va vite. Papi a un casque bleu.', questions: [
    ['Qui a une moto ?', 'Papi', 'Mamie', 'Tom'],
    ['De quelle couleur est le casque ?', 'bleu', 'rouge', 'jaune']] },
  { level: 1, title: 'Le vélo', text: 'Rémi a un vélo. Le vélo est vert. Rémi va très vite !', questions: [
    ['Qui a un vélo ?', 'Rémi', 'Lola', 'Papi'],
    ['De quelle couleur est le vélo ?', 'vert', 'rouge', 'bleu']] },
  { level: 1, title: 'La pomme', text: 'Lola a une pomme. La pomme est rouge. Lola la mange.', questions: [
    ['Qu’a Lola ?', 'une pomme', 'une poire', 'une prune'],
    ['De quelle couleur est la pomme ?', 'rouge', 'verte', 'jaune']] },
  { level: 1, title: 'La lune', text: 'Il fait nuit. La lune est ronde. Tom dort dans son lit.', questions: [
    ['Comment est la lune ?', 'ronde', 'carrée', 'rouge'],
    ['Que fait Tom ?', 'il dort', 'il lit', 'il court']] },
  { level: 1, title: 'Le panda', text: 'Le panda est noir et blanc. Il mange du bambou. Il est rigolo !', questions: [
    ['Que mange le panda ?', 'du bambou', 'du riz', 'du pain'],
    ['De quelle couleur est le panda ?', 'noir et blanc', 'rouge et vert', 'tout bleu']] },
  { level: 1, title: 'Le pull', text: 'Mila a un pull. Le pull est rose. Il est tout doux.', questions: [
    ['Qui a un pull ?', 'Mila', 'Papa', 'Léo'],
    ['De quelle couleur est le pull ?', 'rose', 'vert', 'noir']] },
  { level: 1, title: 'Le robot', text: 'Sami a un robot. Le robot marche. Il fait bip bip !', questions: [
    ['Qui a un robot ?', 'Sami', 'Mila', 'Papa'],
    ['Que fait le robot ?', 'il marche', 'il nage', 'il dort']] },
  { level: 1, title: 'La mer', text: 'Léa va à la mer. Elle a un seau et une pelle. Elle fait un pâté de sable.', questions: [
    ['Où va Léa ?', 'à la mer', 'au zoo', 'à l’école'],
    ['Qu’a Léa ?', 'un seau', 'un vélo', 'un livre'],
    ['Que fait Léa ?', 'un pâté de sable', 'un gâteau', 'un dessin']] },
  { level: 1, title: 'Le cadeau', text: 'Lili a un cadeau. Elle ouvre le papier. C’est une poupée !', questions: [
    ['Qui a un cadeau ?', 'Lili', 'Papi', 'Léo'],
    ['Qu’y a-t-il dans le cadeau ?', 'une poupée', 'un vélo', 'un livre']] },

  // ---- Niveau 2 : 3 phrases plus longues (ch, ou, on, an, oi…)
  { level: 2, title: 'Sur le chemin', text: 'Ce matin, Chloé part à l’école. Elle prend son cartable et son goûter. Sur le chemin, elle voit un chien qui court.', questions: [
    ['Où va Chloé ?', 'à l’école', 'au marché', 'chez mamie'],
    ['Que prend Chloé ?', 'son goûter', 'son vélo', 'sa poupée'],
    ['Que voit-elle sur le chemin ?', 'un chien', 'un oiseau', 'un chat']] },
  { level: 2, title: 'Chez mamie', text: 'Le dimanche, Hugo va chez sa mamie. Ils font un gâteau au chocolat. Hugo lèche la cuillère !', questions: [
    ['Chez qui va Hugo ?', 'chez sa mamie', 'chez son ami', 'chez le docteur'],
    ['Quel gâteau font-ils ?', 'au chocolat', 'aux fraises', 'au citron'],
    ['Quel jour va-t-il chez sa mamie ?', 'le dimanche', 'le lundi', 'le mercredi']] },
  { level: 2, title: 'La neige', text: 'Il neige ! Inès met son bonnet et ses gants. Avec son frère, elle fait un bonhomme de neige.', questions: [
    ['Quel temps fait-il ?', 'il neige', 'il pleut', 'il fait chaud'],
    ['Que met Inès ?', 'son bonnet', 'son maillot', 'sa robe'],
    ['Que fait-elle avec son frère ?', 'un bonhomme de neige', 'un château de sable', 'une cabane']] },
  { level: 2, title: 'Au zoo', text: 'Au zoo, Noé regarde les singes. Un singe mange une banane. Noé rit très fort.', questions: [
    ['Où est Noé ?', 'au zoo', 'à la ferme', 'à la plage'],
    ['Que mange le singe ?', 'une banane', 'une pomme', 'du pain'],
    ['Que fait Noé ?', 'il rit', 'il pleure', 'il dort']] },
  { level: 2, title: 'L’histoire du soir', text: 'Ce soir, papa lit une histoire à Jade. C’est l’histoire d’un dragon gentil. Jade s’endort avant la fin.', questions: [
    ['Qui lit l’histoire ?', 'papa', 'maman', 'Jade'],
    ['L’histoire parle…', 'd’un dragon', 'd’un loup', 'd’une fée'],
    ['Que fait Jade avant la fin ?', 'elle s’endort', 'elle chante', 'elle mange']] },
  { level: 2, title: 'Bulle', text: 'Le poisson rouge de Louis s’appelle Bulle. Il tourne dans son bocal. Louis lui donne à manger tous les matins.', questions: [
    ['Comment s’appelle le poisson ?', 'Bulle', 'Plouf', 'Nemo'],
    ['Quand Louis lui donne-t-il à manger ?', 'le matin', 'le soir', 'à midi']] },
  { level: 2, title: 'Le marché', text: 'Le samedi, Lucie va au marché avec papa. Ils achètent du fromage et des poires. Lucie porte le panier.', questions: [
    ['Quel jour Lucie va-t-elle au marché ?', 'le samedi', 'le lundi', 'le jeudi'],
    ['Avec qui va-t-elle au marché ?', 'avec papa', 'avec mamie', 'avec son frère'],
    ['Qui porte le panier ?', 'Lucie', 'papa', 'le marchand']] },
  { level: 2, title: 'Le pique-nique', text: 'À midi, la famille de Tom mange dans l’herbe. Il y a des sandwichs et des tomates. Une fourmi monte sur la nappe !', questions: [
    ['Où mange la famille ?', 'dans l’herbe', 'à la cantine', 'dans la voiture'],
    ['Qui monte sur la nappe ?', 'une fourmi', 'un chien', 'un chat']] },
  { level: 2, title: 'La piscine', text: 'Le mercredi, Adèle va à la piscine. Elle met son bonnet et ses lunettes. Elle nage comme un petit poisson.', questions: [
    ['Quel jour Adèle va-t-elle à la piscine ?', 'le mercredi', 'le dimanche', 'le vendredi'],
    ['Que met Adèle ?', 'son bonnet', 'son manteau', 'ses bottes']] },
  { level: 2, title: 'Moka', text: 'Moka est un chat tout noir. Il dort sur le canapé toute la journée. Le soir, il joue avec une balle.', questions: [
    ['De quelle couleur est Moka ?', 'noir', 'blanc', 'roux'],
    ['Où dort Moka ?', 'sur le canapé', 'dans le jardin', 'sous la table'],
    ['Avec quoi joue-t-il le soir ?', 'une balle', 'une souris', 'un os']] },
  { level: 2, title: 'Le cirque', text: 'Ce soir, Nino va au cirque. Il voit un clown avec un gros nez rouge. Le clown fait rire tous les enfants.', questions: [
    ['Où va Nino ?', 'au cirque', 'au cinéma', 'au parc'],
    ['Que voit Nino ?', 'un clown', 'un lion', 'un pirate'],
    ['De quelle couleur est le nez du clown ?', 'rouge', 'vert', 'bleu']] },
  { level: 2, title: 'La cabane', text: 'Avec son frère, Lou fait une cabane dans le jardin. Ils prennent des branches et une couverture. Dedans, ils lisent des livres.', questions: [
    ['Avec qui Lou fait-elle une cabane ?', 'avec son frère', 'avec sa mamie', 'avec son chien'],
    ['Où est la cabane ?', 'dans le jardin', 'dans la cuisine', 'à l’école'],
    ['Que font-ils dans la cabane ?', 'ils lisent', 'ils dorment', 'ils mangent']] },
  { level: 2, title: 'Le train', text: 'Pour les vacances, Malo prend le train. Il regarde les vaches par la fenêtre. Mamie l’attend à la gare.', questions: [
    ['Que prend Malo ?', 'le train', 'le bus', 'l’avion'],
    ['Que regarde-t-il par la fenêtre ?', 'les vaches', 'les avions', 'les bateaux'],
    ['Qui l’attend à la gare ?', 'mamie', 'papa', 'sa sœur']] },
  { level: 2, title: 'Le jardin de papi', text: 'Papi a un grand jardin. Il y fait pousser des tomates et des salades. Rose l’aide à arroser.', questions: [
    ['Qui a un jardin ?', 'papi', 'Rose', 'maman'],
    ['Que fait pousser papi ?', 'des tomates', 'des bananes', 'des bonbons'],
    ['Que fait Rose ?', 'elle arrose', 'elle dort', 'elle chante']] },
  { level: 2, title: 'La glace', text: 'Cet après-midi, il fait très chaud. Ali achète une glace au citron. Elle coule sur ses doigts !', questions: [
    ['Quel temps fait-il ?', 'il fait chaud', 'il pleut', 'il neige'],
    ['Quelle glace achète Ali ?', 'au citron', 'à la fraise', 'au chocolat']] },

  // ---- Niveau 3 : textes de 4 phrases (CE1)
  { level: 3, title: 'Le château de sable', text: 'Pendant les vacances, Emma part à la mer. Chaque matin, elle construit un château de sable. Un jour, une grosse vague le détruit. Emma n’est pas triste : elle en construit un plus grand !', questions: [
    ['Où part Emma ?', 'à la mer', 'à la montagne', 'à la campagne'],
    ['Qu’est-ce qui détruit le château ?', 'une vague', 'son frère', 'le vent'],
    ['Que fait Emma ensuite ?', 'un château plus grand', 'elle pleure', 'elle rentre']] },
  { level: 3, title: 'Où est Pacha ?', text: 'Le chat de Malik a disparu. Malik le cherche dans le jardin, puis dans le garage. Il appelle : « Pacha ! » Finalement, il le trouve endormi dans le panier à linge !', questions: [
    ['Comment s’appelle le chat ?', 'Pacha', 'Malik', 'Minou'],
    ['Où Malik cherche-t-il d’abord ?', 'dans le jardin', 'dans le garage', 'dans sa chambre'],
    ['Où est le chat ?', 'dans le panier à linge', 'sous le lit', 'sur le toit']] },
  { level: 3, title: 'À la ferme', text: 'Aujourd’hui, la classe de Lucie visite une ferme. Les enfants donnent du foin aux chèvres. Le fermier leur montre les petits cochons. Au retour, tout le monde chante dans le bus.', questions: [
    ['Que visite la classe ?', 'une ferme', 'un musée', 'un zoo'],
    ['Que mangent les chèvres ?', 'du foin', 'du pain', 'des pommes'],
    ['Comment rentrent les enfants ?', 'en bus', 'à pied', 'en train']] },
  { level: 3, title: 'La petite souris', text: 'Nathan a perdu une dent ce matin. Le soir, il la met sous son oreiller. Le lendemain, à la place de la dent, il trouve une pièce. Qui est passé pendant la nuit ?', questions: [
    ['Qu’a perdu Nathan ?', 'une dent', 'un jouet', 'une chaussure'],
    ['Où met-il sa dent ?', 'sous son oreiller', 'dans une boîte', 'dans sa poche'],
    ['Que trouve-t-il le lendemain ?', 'une pièce', 'un bonbon', 'une lettre']] },
  { level: 3, title: 'La graine', text: 'Sarah a planté une graine dans un pot. Elle l’arrose tous les jours. Elle met le pot près de la fenêtre. Au bout d’une semaine, une petite tige verte sort de la terre.', questions: [
    ['Qu’a planté Sarah ?', 'une graine', 'un arbre', 'une fleur'],
    ['Où met-elle le pot ?', 'près de la fenêtre', 'dans le noir', 'dans le jardin'],
    ['Quand la tige sort-elle ?', 'au bout d’une semaine', 'le lendemain', 'au bout d’un mois']] },
  { level: 3, title: 'Le judo', text: 'Le mercredi, Adam va au judo. Il met son kimono blanc et sa ceinture jaune. Aujourd’hui, le professeur lui apprend une nouvelle prise. Adam est fier de lui.', questions: [
    ['Quel sport fait Adam ?', 'du judo', 'du foot', 'de la danse'],
    ['De quelle couleur est sa ceinture ?', 'jaune', 'blanche', 'noire'],
    ['Quel jour va-t-il au judo ?', 'le mercredi', 'le samedi', 'le lundi']] },
  { level: 3, title: 'Le piano', text: 'Le jeudi, Lina a son cours de piano. Son professeur est très patient. Aujourd’hui, Lina apprend une chanson sur la pluie. Le soir, elle la joue pour ses parents.', questions: [
    ['De quel instrument joue Lina ?', 'du piano', 'de la guitare', 'du violon'],
    ['Quel jour a-t-elle son cours ?', 'le jeudi', 'le mardi', 'le samedi'],
    ['Pour qui joue-t-elle le soir ?', 'pour ses parents', 'pour son professeur', 'pour sa classe']] },
  { level: 3, title: 'Le poney', text: 'Pendant les vacances, Jules monte sur un poney. Le poney s’appelle Caramel. Il est marron, avec une crinière blonde. Jules lui donne une carotte pour le remercier.', questions: [
    ['Comment s’appelle le poney ?', 'Caramel', 'Jules', 'Biscuit'],
    ['De quelle couleur est le poney ?', 'marron', 'blanc', 'noir'],
    ['Que donne Jules au poney ?', 'une carotte', 'une pomme', 'du pain']] },
  { level: 3, title: 'Le spectacle', text: 'À la fin de l’année, la classe de Noé prépare un spectacle. Noé joue le rôle d’un roi. Il porte une couronne en carton doré. À la fin, les parents applaudissent très fort.', questions: [
    ['Quel rôle joue Noé ?', 'un roi', 'un pirate', 'un lapin'],
    ['En quoi est la couronne ?', 'en carton', 'en or', 'en bois']] },
  { level: 3, title: 'Le vélo d’Inès', text: 'Pour son anniversaire, Inès a reçu un vélo violet. Il a encore ses petites roues. Tous les jours, elle roule dans la cour avec papa. Bientôt, elle saura rouler sans les petites roues !', questions: [
    ['De quelle couleur est le vélo ?', 'violet', 'rouge', 'vert'],
    ['Où roule Inès ?', 'dans la cour', 'sur la route', 'à la plage'],
    ['Avec qui roule-t-elle ?', 'avec papa', 'avec mamie', 'toute seule']] },
  { level: 3, title: 'Au musée', text: 'Mardi, la classe de Sacha visite un musée. Dans une grande salle, il y a un squelette de dinosaure. Il est plus haut que la maison de Sacha ! Le guide explique que ce dinosaure mangeait des plantes.', questions: [
    ['Que visite la classe ?', 'un musée', 'une ferme', 'un zoo'],
    ['De quel animal est le squelette ?', 'un dinosaure', 'un éléphant', 'une baleine'],
    ['Que mangeait le dinosaure ?', 'des plantes', 'des poissons', 'des gâteaux']] },
  { level: 3, title: 'Le nouveau voisin', text: 'Une nouvelle famille arrive dans la maison d’à côté. Il y a un garçon qui s’appelle Karim. Il a le même âge que Lou. Dès le premier jour, ils jouent ensemble au ballon.', questions: [
    ['Comment s’appelle le garçon ?', 'Karim', 'Lou', 'Paul'],
    ['À quoi jouent-ils ?', 'au ballon', 'aux cartes', 'à la poupée']] },
  { level: 3, title: 'La barque', text: 'Dimanche, Tom fait une balade en barque sur le lac avec son papi. Papi rame doucement. Tom voit des canards et un cygne blanc. Il leur dit bonjour de la main.', questions: [
    ['Avec qui Tom fait-il de la barque ?', 'avec son papi', 'avec son papa', 'avec sa sœur'],
    ['Qui rame ?', 'papi', 'Tom', 'maman'],
    ['Quel oiseau blanc voit Tom ?', 'un cygne', 'une poule', 'un pigeon']] },
  { level: 3, title: 'L’anniversaire de Zoé', text: 'Samedi, Zoé fête ses huit ans. Elle invite cinq amies à la maison. Elles font un concours de déguisements dans le jardin. Zoé est déguisée en sirène, avec une longue queue bleue.', questions: [
    ['Quel âge a Zoé ?', 'huit ans', 'six ans', 'dix ans'],
    ['Combien d’amies invite-t-elle ?', 'cinq', 'deux', 'dix'],
    ['En quoi Zoé est-elle déguisée ?', 'en sirène', 'en sorcière', 'en princesse']] },
  { level: 3, title: 'Le ski', text: 'Cet hiver, Mila apprend à skier. Elle met un casque et de grosses chaussures. Le moniteur lui montre comment s’arrêter. À la fin de la semaine, elle gagne une médaille !', questions: [
    ['Qu’apprend Mila ?', 'à skier', 'à nager', 'à lire'],
    ['Qui lui montre comment s’arrêter ?', 'le moniteur', 'sa maman', 'son frère'],
    ['Que gagne-t-elle ?', 'une médaille', 'un vélo', 'une coupe']] },

  // ---- Niveau 4 : lire entre les lignes (la réponse n'est pas écrite, il faut la deviner)
  { level: 4, title: 'Le grand jour', text: 'Ce matin, Lina a un cartable tout neuf. Elle serre fort la main de papa. Devant la grille, il y a plein d’enfants qu’elle ne connaît pas. Son cœur bat très vite. Papa lui dit : « À ce soir ! »', questions: [
    ['Où va Lina ?', 'à l’école', 'au parc', 'chez mamie'],
    ['Comment se sent Lina ?', 'un peu inquiète', 'en colère', 'fatiguée'],
    ['C’est quel jour pour Lina ?', 'la rentrée', 'Noël', 'les vacances']] },
  { level: 4, title: 'Les flaques', text: 'Sami met ses bottes et son ciré jaune. Dehors, le ciel est gris et il saute dans toutes les flaques. Plouf ! Quand il rentre, maman lui dit en riant : « Va vite te changer ! »', questions: [
    ['Quel temps fait-il ?', 'il pleut', 'il neige', 'il fait chaud'],
    ['Pourquoi Sami doit-il se changer ?', 'il est mouillé', 'il va au lit', 'il a chaud']] },
  { level: 4, title: 'Les biscuits', text: 'Max ouvre le placard : la boîte de biscuits est vide ! Sur le tapis, il y a plein de miettes. Dans son panier, son chien Filou se lèche les babines et remue la queue.', questions: [
    ['Qui a mangé les biscuits ?', 'le chien', 'Max', 'papa'],
    ['Que cherchait Max dans le placard ?', 'des biscuits', 'son chien', 'un tapis']] },
  { level: 4, title: 'La surprise', text: 'Papa cache un paquet derrière son dos. Sur la table, il y a un gâteau avec sept bougies. Tout le monde chante pour Jules. Jules ferme les yeux et souffle très fort.', questions: [
    ['Quel âge a Jules aujourd’hui ?', 'sept ans', 'six ans', 'huit ans'],
    ['Que cache papa ?', 'un cadeau', 'une bougie', 'un ballon']] },
  { level: 4, title: 'Dans la nuit', text: 'Il fait noir et tout le monde dort. Soudain, Hugo entend « hou hou » dans le jardin. Il allume sa lampe et voit deux grands yeux ronds sur une branche. Il sourit : ce n’est pas un monstre !', questions: [
    ['Quel animal voit Hugo ?', 'un hibou', 'un chat', 'un loup'],
    ['Quand se passe l’histoire ?', 'la nuit', 'le matin', 'à midi']] },
  { level: 4, title: 'À la caisse', text: 'Maman pose les pommes, le lait et le pain sur le tapis qui avance. La dame dit : « Bonjour ! Ça fait douze euros. » Maman paie, puis range tout dans son grand sac.', questions: [
    ['Où sont-ils ?', 'au magasin', 'à l’école', 'à la plage'],
    ['Que fait maman ?', 'des courses', 'la cuisine', 'du sport']] },
  { level: 4, title: 'Le bonhomme', text: 'Ce matin, tout le jardin est blanc. Zoé et son frère roulent deux grosses boules. Ils ajoutent une carotte pour le nez et une écharpe. À midi, le soleil brille fort et le nez tombe…', questions: [
    ['Que fabriquent les enfants ?', 'un bonhomme de neige', 'un château de sable', 'une cabane'],
    ['Pourquoi le nez tombe-t-il ?', 'la neige fond', 'le vent souffle', 'un chien le prend']] },
  { level: 4, title: 'La valise', text: 'Maman remplit une grosse valise : des maillots, de la crème solaire et des lunettes de soleil. Lou glisse son seau et sa pelle dans un coin. Demain matin, ils partent tôt en voiture.', questions: [
    ['Où va partir la famille ?', 'à la plage', 'à la montagne', 'à l’école'],
    ['Quand partent-ils ?', 'demain matin', 'ce soir', 'dans un mois']] },
  { level: 4, title: 'Après la nuit', text: 'Ce matin, Arthur regarde par la fenêtre. Le jardin est plein de flaques et les fleurs sont toutes mouillées. Mais maintenant, le ciel est bleu et les oiseaux chantent.', questions: [
    ['Qu’est-il arrivé pendant la nuit ?', 'il a plu', 'il a neigé', 'il a fait chaud'],
    ['Quel temps fait-il maintenant ?', 'il fait beau', 'il pleut', 'il neige']] },
  { level: 4, title: 'L’eau par terre', text: 'Quand Inès rentre de l’école, il y a de l’eau partout par terre. Le vase de fleurs est renversé sur la table. Le chat, tout mouillé, se cache sous le canapé.', questions: [
    ['Qui a renversé le vase ?', 'le chat', 'Inès', 'maman'],
    ['Pourquoi le chat est-il mouillé ?', 'il a renversé le vase', 'il a pris un bain', 'il a nagé']] },
  { level: 4, title: 'Le grand écran', text: 'Les lumières s’éteignent. Tout le monde s’assoit dans de grands fauteuils rouges. Sur l’écran géant, le film commence. Nathan plonge la main dans son paquet de pop-corn.', questions: [
    ['Où est Nathan ?', 'au cinéma', 'à l’école', 'à la piscine'],
    ['Que va faire Nathan ?', 'regarder un film', 'dormir', 'nager']] },
  { level: 4, title: 'Les baskets', text: 'Ce matin, Ilyes n’arrive pas à mettre ses baskets. Il pousse, il tire, mais son pied ne rentre pas. Maman sourit : « Tu as encore grandi ! Il faut en acheter d’autres. »', questions: [
    ['Comment sont les baskets d’Ilyes ?', 'trop petites', 'trop grandes', 'toutes neuves'],
    ['Que vont-ils acheter ?', 'des baskets', 'un pull', 'un ballon']] },
  { level: 4, title: 'Le fauteuil de papi', text: 'Après le repas, papi s’assoit dans son fauteuil avec son journal. Au bout de cinq minutes, le journal glisse par terre. Papi a les yeux fermés et il ronfle doucement.', questions: [
    ['Que fait papi ?', 'il dort', 'il lit', 'il mange'],
    ['Pourquoi le journal tombe-t-il ?', 'papi s’endort', 'le chat le pousse', 'il y a du vent']] },
  { level: 4, title: 'Debout !', text: 'Le réveil sonne. Dehors, il fait encore noir. Maman allume la lumière et dit : « Debout, mon grand ! » Paul se cache sous la couette et grogne.', questions: [
    ['Quand se passe l’histoire ?', 'le matin', 'le soir', 'à midi'],
    ['Comment se sent Paul ?', 'il a sommeil', 'il a faim', 'il est malade']] },
  { level: 4, title: 'Le ciel noir', text: 'Dans le jardin, papi rentre vite le linge. Le ciel est devenu tout noir et le vent souffle fort. Les oiseaux se cachent dans les arbres.', questions: [
    ['Quel temps va-t-il faire ?', 'il va pleuvoir', 'il va faire beau', 'il va faire chaud'],
    ['Pourquoi papi rentre-t-il le linge ?', 'pour qu’il reste sec', 'pour le laver', 'pour le salir']] },

  // ---- Niveau 5 : qui parle ? qui est « il », « elle », « lui » ?
  { level: 5, title: 'Coco', text: 'Lucas a un perroquet vert. Il s’appelle Coco. Chaque matin, Coco crie : « Bonjour Lucas ! » Alors Lucas lui donne des graines, et l’oiseau les mange une à une.', questions: [
    ['Qui dit « Bonjour Lucas ! » ?', 'le perroquet', 'Lucas', 'maman'],
    ['Dans « Lucas lui donne », « lui », c’est…', 'Coco', 'Lucas', 'maman']] },
  { level: 5, title: 'À la boulangerie', text: '« Bonjour, je voudrais deux croissants », dit Inès. La boulangère les met dans un sac. « Ça fait deux euros », répond-elle. Inès lui donne une pièce.', questions: [
    ['Qui dit « Ça fait deux euros » ?', 'la boulangère', 'Inès', 'sa maman'],
    ['Dans « les met dans un sac », « les », c’est…', 'les croissants', 'les euros', 'les pièces']] },
  { level: 5, title: 'Le chaton', text: 'Nora trouve un chaton sous la pluie. Elle le prend dans ses bras. Le petit animal tremble. Nora l’enveloppe dans une serviette bien chaude.', questions: [
    ['Qui est « le petit animal » ?', 'le chaton', 'Nora', 'un oiseau'],
    ['Dans « Elle le prend », « elle », c’est…', 'Nora', 'la pluie', 'la serviette']] },
  { level: 5, title: 'Le match', text: 'Léo et Adam jouent au foot. Léo tire très fort, mais le ballon passe au-dessus du but. « Raté ! » crie Adam en riant. Léo, lui, est un peu vexé.', questions: [
    ['Qui crie « Raté ! » ?', 'Adam', 'Léo', 'l’arbitre'],
    ['Qui est vexé ?', 'Léo', 'Adam', 'le ballon']] },
  { level: 5, title: 'Allô ?', text: 'Le téléphone sonne. « Allô, c’est mamie ! » Jade est très contente. Elle lui raconte sa journée. Mamie promet de venir dimanche.', questions: [
    ['Qui téléphone ?', 'mamie', 'Jade', 'papa'],
    ['Dans « Elle lui raconte », « lui », c’est…', 'mamie', 'Jade', 'le téléphone']] },
  { level: 5, title: 'Le petit frère', text: 'Paul a un petit frère qui s’appelle Théo. Théo ne sait pas encore marcher. Paul lui montre comment empiler des cubes. Le bébé tape dans ses mains et rit très fort.', questions: [
    ['Qui est « le bébé » ?', 'Théo', 'Paul', 'papa'],
    ['Qui montre les cubes ?', 'Paul', 'Théo', 'maman']] },
  { level: 5, title: 'Une part de gâteau', text: '« Tu veux une part de gâteau ? » demande mamie. « Oh oui, merci ! » répond Lucas. Mamie lui coupe une grosse part. Lucas la mange en souriant.', questions: [
    ['Qui dit « Oh oui, merci ! » ?', 'Lucas', 'mamie', 'papa'],
    ['Dans « Mamie lui coupe », « lui », c’est…', 'Lucas', 'mamie', 'le gâteau'],
    ['Dans « Lucas la mange », « la », c’est…', 'la part', 'mamie', 'la table']] },
  { level: 5, title: 'La promenade', text: 'Sami promène son chien Rocky. Soudain, Rocky tire sur sa laisse : il a vu un chat ! « Doucement, Rocky ! » dit Sami. Le chien s’arrête et s’assoit.', questions: [
    ['Qui dit « Doucement, Rocky ! » ?', 'Sami', 'Rocky', 'le chat'],
    ['Dans « il a vu un chat », « il », c’est…', 'Rocky', 'Sami', 'le chat']] },
  { level: 5, title: 'En classe', text: 'La maîtresse montre un livre à la classe. « Qui veut lire la première page ? » demande-t-elle. Nina lève le doigt. La maîtresse lui donne le livre.', questions: [
    ['Qui pose la question ?', 'la maîtresse', 'Nina', 'la directrice'],
    ['Qui lève le doigt ?', 'Nina', 'la maîtresse', 'Paul'],
    ['Dans « lui donne le livre », « lui », c’est…', 'Nina', 'la maîtresse', 'la classe']] },
  { level: 5, title: 'Le marchand de glaces', text: '« Une glace à la vanille, s’il vous plaît ! » dit Maël. Le marchand la lui tend. « Attention, elle coule ! » ajoute-t-il. Maël la lèche bien vite.', questions: [
    ['Qui dit « Attention, elle coule ! » ?', 'le marchand', 'Maël', 'sa maman'],
    ['Dans « Maël la lèche », « la », c’est…', 'la glace', 'la cuillère', 'la main'],
    ['Quel parfum choisit Maël ?', 'la vanille', 'la fraise', 'le chocolat']] },
  { level: 5, title: 'La poupée', text: 'Emma et sa petite sœur Jeanne jouent ensemble. Jeanne prend la poupée d’Emma. « Rends-la-moi ! » crie Emma. Alors Jeanne la lui rend en riant.', questions: [
    ['Qui crie « Rends-la-moi ! » ?', 'Emma', 'Jeanne', 'maman'],
    ['Qui est la petite sœur ?', 'Jeanne', 'Emma', 'maman'],
    ['Dans « Jeanne la lui rend », « la », c’est…', 'la poupée', 'Emma', 'Jeanne']] },
  { level: 5, title: 'Chez le docteur', text: 'Hugo tousse beaucoup. Le docteur écoute son cœur et ses poumons. « Respire bien fort ! » lui dit-il. Puis il donne une ordonnance à maman.', questions: [
    ['Qui dit « Respire bien fort ! » ?', 'le docteur', 'Hugo', 'maman'],
    ['Dans « lui dit-il », « lui », c’est…', 'Hugo', 'maman', 'le docteur'],
    ['Qui tousse ?', 'Hugo', 'le docteur', 'maman']] },
  { level: 5, title: 'Par-dessus la haie', text: 'Le ballon de Lina passe par-dessus la haie. Paul, le voisin, le lui renvoie. « Merci beaucoup ! » dit Lina. « De rien, et bon match ! » répond-il.', questions: [
    ['Qui dit « Merci beaucoup ! » ?', 'Lina', 'le voisin', 'maman'],
    ['Qui est Paul ?', 'le voisin', 'le papa de Lina', 'le facteur'],
    ['Dans « le lui renvoie », « le », c’est…', 'le ballon', 'le voisin', 'le match']] },
  { level: 5, title: 'La lettre de mamie', text: 'Ce matin, Théo reçoit une lettre. Elle vient de sa mamie, qui habite loin. Il la lit à voix haute à sa petite sœur. Puis il répond à mamie avec un beau dessin.', questions: [
    ['Qui a écrit la lettre ?', 'mamie', 'Théo', 'sa sœur'],
    ['Dans « Il la lit », « la », c’est…', 'la lettre', 'mamie', 'sa sœur']] },
  { level: 5, title: 'Pompon', text: 'Dans la classe, il y a un lapin qui s’appelle Pompon. Chaque vendredi, un élève l’emporte chez lui. Cette semaine, c’est Rayan. Il est très fier de garder la petite boule de poils.', questions: [
    ['Qui est « la petite boule de poils » ?', 'Pompon', 'Rayan', 'la maîtresse'],
    ['Qui emporte le lapin cette semaine ?', 'Rayan', 'la maîtresse', 'Pompon']] },

  // ---- Niveau 6 : le bon titre (le texte est montré sans son titre) et l'ordre des faits
  { level: 6, title: 'Le chat perché', text: 'Le chat de Lou grimpe dans un grand arbre. Il miaule : il n’ose plus descendre. Papa prend l’échelle et monte doucement. Il redescend avec le chat dans les bras.', questions: [
    ['Quel est le meilleur titre ?', 'Le chat perché', 'Le chien perdu', 'Une belle fleur'],
    ['Que se passe-t-il en premier ?', 'le chat grimpe', 'papa monte', 'le chat miaule']] },
  { level: 6, title: 'La tarte aux pommes', text: 'Ce matin, Noé veut faire une tarte. D’abord, il épluche les pommes avec maman. Ensuite, il étale la pâte. Enfin, il met la tarte au four. Ça sent bon !', questions: [
    ['Quel est le meilleur titre ?', 'La tarte aux pommes', 'Le jardin', 'La piscine'],
    ['Que fait Noé en premier ?', 'il épluche les pommes', 'il étale la pâte', 'il allume le four']] },
  { level: 6, title: 'Une amie gentille', text: 'Pendant la récréation, Mia tombe et se fait mal au genou. Elle pleure. Son amie Rose l’aide à se relever. La maîtresse met un pansement, et Mia sourit à nouveau.', questions: [
    ['Quel est le meilleur titre ?', 'Une amie gentille', 'Le gâteau raté', 'Vive la neige'],
    ['Comment finit l’histoire ?', 'Mia sourit', 'Mia pleure', 'Mia tombe']] },
  { level: 6, title: 'La tempête', text: 'Le vent souffle très fort. Les arbres se penchent et la pluie tape aux fenêtres. Toute la famille reste à l’abri. Le lendemain, des branches sont tombées dans le jardin.', questions: [
    ['Quel est le meilleur titre ?', 'La tempête', 'Le beau temps', 'La neige'],
    ['Que voit-on le lendemain ?', 'des branches', 'de la neige', 'des fleurs']] },
  { level: 6, title: 'Le tournesol', text: 'Lucie plante une graine de tournesol. Chaque jour, elle l’arrose. Une tige verte sort de la terre. Elle grandit, grandit… À la fin de l’été, une grande fleur jaune regarde le soleil.', questions: [
    ['Quel est le meilleur titre ?', 'Le tournesol', 'La mer', 'Le chat'],
    ['Que se passe-t-il à la fin ?', 'la fleur pousse', 'Lucie plante', 'la tige casse']] },
  { level: 6, title: 'La fête du village', text: 'Ce soir, c’est la fête au village. Il y a des lampions et de la musique. Ethan danse avec sa sœur. À dix heures, un feu d’artifice illumine le ciel.', questions: [
    ['Quel est le meilleur titre ?', 'La fête du village', 'Un jour d’école', 'Le loup'],
    ['Que se passe-t-il à dix heures ?', 'un feu d’artifice', 'un orage', 'un concert']] },
  { level: 6, title: 'Le bain de Rex', text: 'Rex, le chien de Malo, s’est roulé dans la boue. Papa le met dans la baignoire. Malo le frotte avec du savon. Ensuite, ils le sèchent avec une grande serviette. Rex est tout propre !', questions: [
    ['Quel est le meilleur titre ?', 'Le bain de Rex', 'La fête de Malo', 'Le grand voyage'],
    ['Que se passe-t-il en premier ?', 'Rex se salit', 'Malo le frotte', 'Rex est séché']] },
  { level: 6, title: 'Une journée à la mer', text: 'Le matin, la famille arrive à la plage. Les enfants construisent un château de sable. À midi, tout le monde pique-nique sous le parasol. L’après-midi, ils se baignent. Le soir, ils rentrent fatigués.', questions: [
    ['Quel est le meilleur titre ?', 'Une journée à la mer', 'La rentrée', 'Le marché'],
    ['Que font-ils à midi ?', 'ils mangent', 'ils se baignent', 'ils rentrent']] },
  { level: 6, title: 'Le pain perdu', text: 'D’abord, Sarah casse deux œufs dans un bol. Ensuite, elle ajoute du lait. Elle trempe des tranches de pain dedans. Papa les fait dorer dans la poêle. Enfin, Sarah ajoute un peu de sucre.', questions: [
    ['Quel est le meilleur titre ?', 'Le pain perdu', 'La soupe', 'Le goûter au parc'],
    ['Que fait Sarah en premier ?', 'elle casse des œufs', 'elle ajoute du lait', 'elle ajoute du sucre']] },
  { level: 6, title: 'Le potager de l’école', text: 'Au printemps, la classe de Yanis sème des radis dans le potager de l’école. Chaque jour, un élève les arrose. Quatre semaines plus tard, les radis sont prêts. Les enfants les mangent avec du beurre.', questions: [
    ['Quel est le meilleur titre ?', 'Le potager de l’école', 'La sortie au cinéma', 'Le match de foot'],
    ['Que se passe-t-il à la fin ?', 'on mange les radis', 'on sème les radis', 'on arrose les radis']] },
  { level: 6, title: 'Le magicien', text: 'Pour la fête de Lina, un magicien est venu. D’abord, il fait disparaître une pièce. Ensuite, il sort un lapin de son chapeau. Pour finir, il transforme un foulard en colombe. Les enfants applaudissent !', questions: [
    ['Quel est le meilleur titre ?', 'Le magicien', 'La tempête', 'Le petit chien'],
    ['Que se passe-t-il en premier ?', 'une pièce disparaît', 'un lapin sort', 'une colombe apparaît']] },
  { level: 6, title: 'La première neige', text: 'Ce matin, Hugo ouvre les volets : tout est blanc ! Il met vite son manteau et ses bottes. Dans le jardin, il fait un bonhomme de neige. Puis il rentre boire un chocolat chaud.', questions: [
    ['Quel est le meilleur titre ?', 'La première neige', 'Le jour de la plage', 'La fête des fleurs'],
    ['Que fait Hugo en dernier ?', 'il boit un chocolat', 'il met ses bottes', 'il ouvre les volets']] },
  { level: 6, title: 'Un cadeau pour papa', text: 'Pour la fête des pères, Lou fabrique un pot à crayons. D’abord, elle peint une boîte de conserve en bleu. Puis elle colle des étoiles dorées dessus. Dimanche, papa le pose fièrement sur son bureau.', questions: [
    ['Quel est le meilleur titre ?', 'Un cadeau pour papa', 'Une nuit de tempête', 'Le jardin de mamie'],
    ['Que fait Lou en premier ?', 'elle peint la boîte', 'elle colle des étoiles', 'elle l’offre à papa']] },
  { level: 6, title: 'Une voiture toute propre', text: 'Il fait beau. Papa et Inès lavent la voiture. D’abord, ils la mouillent avec le tuyau. Puis ils la frottent avec une éponge pleine de mousse. Enfin, ils la rincent. La voiture brille !', questions: [
    ['Quel est le meilleur titre ?', 'Une voiture toute propre', 'La course de voitures', 'Un jour de pluie'],
    ['Que font-ils en dernier ?', 'ils la rincent', 'ils la frottent', 'ils la mouillent']] },
  { level: 6, title: 'La nouvelle maison', text: 'Les déménageurs arrivent à huit heures. Ils portent tous les cartons dans le camion. Puis la famille part vers sa nouvelle maison. Le soir, Adam dort dans sa nouvelle chambre.', questions: [
    ['Quel est le meilleur titre ?', 'La nouvelle maison', 'Le camion de pompiers', 'Une nuit au camping'],
    ['Que se passe-t-il le soir ?', 'Adam dort', 'on remplit le camion', 'la famille part']] },

  // ---- Textes de saison (identifiants de themes.js) : pendant leur saison, un texte sur deux
  // en est un ; hors saison, ils ne sont jamais proposés. Ajoutés à la fin pour ne rien
  // changer au tirage des autres textes.
  { season: 'noel', level: 1, title: 'Le sac du père Noël', text: 'Le père Noël a un sac. Le sac est lourd. Il est plein de cadeaux !', questions: [
    ['Qu’a le père Noël ?', 'un sac', 'un vélo', 'un chat'],
    ['Comment est le sac ?', 'lourd', 'petit', 'vide'],
    ['Le sac est plein de…', 'cadeaux', 'pommes', 'livres']] },
  { season: 'noel', level: 3, title: 'Le marché de Noël', text: 'Samedi, Léo va au marché de Noël avec sa mamie. Il y a des chalets en bois et des guirlandes partout. Mamie achète du pain d’épices. Léo boit un chocolat chaud qui fume.', questions: [
    ['Avec qui Léo va-t-il au marché ?', 'sa mamie', 'son papa', 'sa sœur'],
    ['Qu’achète mamie ?', 'du pain d’épices', 'des bonbons', 'un sapin'],
    ['Que boit Léo ?', 'un chocolat chaud', 'un jus d’orange', 'un verre de lait']] },
  { season: 'halloween', level: 2, title: 'La petite sorcière', text: 'À Halloween, Lina se déguise en sorcière. Elle met un chapeau noir. Avec son panier, elle va chercher des bonbons.', questions: [
    ['En quoi se déguise Lina ?', 'en sorcière', 'en princesse', 'en pirate'],
    ['De quelle couleur est son chapeau ?', 'noir', 'rouge', 'vert'],
    ['Que va-t-elle chercher ?', 'des bonbons', 'des fleurs', 'des jouets']] },
  { season: 'halloween', level: 4, title: 'Le petit fantôme', text: 'On sonne à la porte. Papa ouvre : un petit fantôme blanc est là ! Sous le drap, on voit deux baskets roses. « Des bonbons ou un sort ! » dit une voix que papa connaît bien.', questions: [
    ['Quelle fête est-ce ?', 'Halloween', 'Noël', 'Pâques'],
    ['Qui est sous le drap ?', 'un enfant', 'un vrai fantôme', 'un chat']] },
  { season: 'hiver', level: 2, title: 'La Chandeleur', text: 'C’est la Chandeleur. Papa fait des crêpes. Il fait sauter une crêpe très haut… et elle reste collée au plafond !', questions: [
    ['Que fait papa ?', 'des crêpes', 'un gâteau', 'une soupe'],
    ['Où reste la crêpe ?', 'au plafond', 'dans la poêle', 'par terre'],
    ['Quelle fête est-ce ?', 'la Chandeleur', 'Noël', 'Pâques']] },
  { season: 'hiver', level: 5, title: 'Les moufles', text: 'Il neige. Maman tend des moufles à Nathan : « Mets-les, il fait froid ! » Nathan les enfile vite. Puis il rejoint Léa, qui l’attend dehors avec la luge.', questions: [
    ['Qui dit « Mets-les, il fait froid ! » ?', 'maman', 'Nathan', 'Léa'],
    ['Dans « Nathan les enfile », « les », c’est…', 'les moufles', 'les luges', 'les bottes'],
    ['Qui attend dehors avec la luge ?', 'Léa', 'maman', 'Nathan']] },
  { season: 'printemps', level: 1, title: 'La fleur rose', text: 'Lola a une fleur. La fleur est rose. Une abeille se pose dessus.', questions: [
    ['Qu’a Lola ?', 'une fleur', 'un ballon', 'un chat'],
    ['De quelle couleur est la fleur ?', 'rose', 'bleue', 'jaune'],
    ['Qui se pose sur la fleur ?', 'une abeille', 'un oiseau', 'un papillon']] },
  { season: 'printemps', level: 6, title: 'Le printemps est là', text: 'Ce matin, Jade ouvre la fenêtre : il fait doux. Dans le jardin, les tulipes sont ouvertes. Une hirondelle passe dans le ciel. Jade range son bonnet et sort en tee-shirt.', questions: [
    ['Quel est le meilleur titre ?', 'Le printemps est là', 'Une nuit d’hiver', 'La fête de Noël'],
    ['Que fait Jade en premier ?', 'elle ouvre la fenêtre', 'elle sort', 'elle range son bonnet']] },
  { season: 'ete', level: 2, title: 'À la plage', text: 'Cet été, Sacha va à la plage. Il fait un grand château de sable. Puis il mange une glace à la vanille.', questions: [
    ['Où va Sacha ?', 'à la plage', 'à la piscine', 'au zoo'],
    ['Que fait Sacha ?', 'un château de sable', 'un bonhomme de neige', 'un gâteau'],
    ['Quelle glace mange-t-il ?', 'à la vanille', 'à la fraise', 'au chocolat']] },
  { season: 'ete', level: 4, title: 'Le coup de soleil', text: 'Tout l’après-midi, Tom joue sur la plage sans chapeau. Il ne veut pas mettre de crème. Le soir, son nez et ses épaules sont tout rouges, et ça pique !', questions: [
    ['Pourquoi le nez de Tom est-il rouge ?', 'un coup de soleil', 'il a froid', 'il est tombé'],
    ['Quel temps fait-il sur la plage ?', 'il fait beau', 'il pleut', 'il neige']] },
  { season: 'automne', level: 1, title: 'Au bois', text: 'Rémi va au bois. Il ramasse des feuilles. Les feuilles sont rousses.', questions: [
    ['Où va Rémi ?', 'au bois', 'à la mer', 'au zoo'],
    ['Que ramasse Rémi ?', 'des feuilles', 'des fleurs', 'des cailloux'],
    ['De quelle couleur sont les feuilles ?', 'rousses', 'bleues', 'roses']] },
  { season: 'automne', level: 3, title: 'Le verger', text: 'En automne, Lison et son papa cueillent des pommes dans le verger. Ils remplissent deux grands paniers. À la maison, ils préparent une compote. Toute la cuisine sent bon !', questions: [
    ['Que cueillent-ils ?', 'des pommes', 'des poires', 'des prunes'],
    ['Combien de paniers remplissent-ils ?', 'deux', 'trois', 'un'],
    ['Que préparent-ils ?', 'une compote', 'une tarte', 'un jus']] },

  // ---- Niveau 7 : textes documentaires (on y apprend quelque chose sur le monde)
  { level: 7, title: 'Le hérisson', text: 'Le hérisson est un petit animal couvert de piquants. Il dort le jour et se promène la nuit. Il mange des vers, des limaces et des insectes. En hiver, il hiberne : il dort jusqu’au printemps.', questions: [
    ['Quand le hérisson se promène-t-il ?', 'la nuit', 'le matin', 'à midi'],
    ['Que mange le hérisson ?', 'des insectes', 'des carottes', 'du pain'],
    ['Que fait le hérisson en hiver ?', 'il dort', 'il nage', 'il chante']] },
  { level: 7, title: 'Les abeilles', text: 'Les abeilles vivent ensemble dans une ruche. Elles volent de fleur en fleur pour récolter le nectar. Avec ce nectar, elles fabriquent le miel. Une seule ruche peut abriter des milliers d’abeilles.', questions: [
    ['Où vivent les abeilles ?', 'dans une ruche', 'dans un nid', 'sous la terre'],
    ['Avec quoi fabriquent-elles le miel ?', 'le nectar', 'les feuilles', 'l’eau'],
    ['Combien d’abeilles vivent dans une ruche ?', 'des milliers', 'une seule', 'deux ou trois']] },
  { level: 7, title: 'La grenouille', text: 'La grenouille pond ses œufs dans l’eau de la mare. Des œufs sortent des têtards : ils ont une queue, mais pas de pattes. Peu à peu, les pattes poussent et la queue disparaît.', questions: [
    ['Où la grenouille pond-elle ses œufs ?', 'dans l’eau', 'dans un arbre', 'dans le sable'],
    ['Qu’est-ce qui sort des œufs ?', 'des têtards', 'des poussins', 'des poissons'],
    ['Que perd le têtard en grandissant ?', 'sa queue', 'ses pattes', 'ses yeux']] },
  { level: 7, title: 'Le manchot', text: 'Le manchot est un oiseau, mais il ne vole pas. Il vit sur la glace, là où il fait très froid. Il nage très bien et attrape des poissons dans la mer. Ses plumes serrées le protègent du froid.', questions: [
    ['Le manchot sait-il voler ?', 'non', 'oui', 'un peu'],
    ['Que mange le manchot ?', 'des poissons', 'de l’herbe', 'des fruits'],
    ['Qu’est-ce qui le protège du froid ?', 'ses plumes', 'sa maison', 'la glace']] },
  { level: 7, title: 'Les dents', text: 'Les enfants ont d’abord des dents de lait. Vers six ans, elles commencent à tomber. De nouvelles dents poussent à leur place : elles doivent durer toute la vie. On les brosse matin et soir.', questions: [
    ['Vers quel âge les dents de lait tombent-elles ?', 'vers six ans', 'vers deux ans', 'vers dix ans'],
    ['Quand faut-il se brosser les dents ?', 'matin et soir', 'le dimanche', 'à midi'],
    ['Combien de temps durent les nouvelles dents ?', 'toute la vie', 'un an', 'un mois']] },
  { level: 7, title: 'La Lune', text: 'La Lune tourne autour de la Terre. Elle ne fait pas de lumière : c’est le Soleil qui l’éclaire. Selon les jours, on la voit ronde ou en croissant. En 1969, des astronautes ont marché sur la Lune.', questions: [
    ['Autour de quoi tourne la Lune ?', 'la Terre', 'le Soleil', 'une étoile'],
    ['Qui éclaire la Lune ?', 'le Soleil', 'la Terre', 'les nuages'],
    ['Qui a marché sur la Lune ?', 'des astronautes', 'des pilotes', 'des enfants']] },
  { level: 7, title: 'L’écureuil', text: 'L’écureuil vit dans les arbres. Sa grande queue touffue l’aide à garder l’équilibre quand il saute de branche en branche. En automne, il cache des noisettes et des glands. En hiver, il les retrouve pour manger.', questions: [
    ['Où vit l’écureuil ?', 'dans les arbres', 'dans l’eau', 'sous la terre'],
    ['Que cache-t-il en automne ?', 'des noisettes', 'des cailloux', 'des poissons'],
    ['À quoi lui sert sa queue ?', 'à garder l’équilibre', 'à creuser', 'à nager']] },
  { level: 7, title: 'Le papillon', text: 'Le papillon commence sa vie dans un œuf. Une chenille en sort et mange beaucoup de feuilles. Puis elle s’enferme dans une chrysalide. Plus tard, un papillon en sort et s’envole.', questions: [
    ['Qu’est-ce qui sort de l’œuf ?', 'une chenille', 'un papillon', 'un oiseau'],
    ['Que mange la chenille ?', 'des feuilles', 'des insectes', 'des graines'],
    ['Où s’enferme la chenille ?', 'dans une chrysalide', 'dans un nid', 'dans une coquille']] },
  { level: 7, title: 'Le Soleil', text: 'Le Soleil est une étoile. Il est beaucoup plus gros que la Terre. Il nous donne de la lumière et de la chaleur. Sans lui, les plantes ne pourraient pas pousser. Il ne faut jamais le regarder en face.', questions: [
    ['Qu’est-ce que le Soleil ?', 'une étoile', 'une planète', 'un nuage'],
    ['Que nous donne le Soleil ?', 'de la lumière', 'de la pluie', 'de la neige'],
    ['Que ne faut-il jamais faire ?', 'le regarder en face', 'sortir le jour', 'mettre un chapeau']] },
  { level: 7, title: 'La vache', text: 'La vache mange de l’herbe dans les prés. Son estomac a quatre parties. Elle donne du lait, avec lequel on fabrique du beurre, des yaourts et du fromage. Le petit de la vache s’appelle le veau.', questions: [
    ['Que mange la vache ?', 'de l’herbe', 'de la viande', 'des poissons'],
    ['Que fabrique-t-on avec son lait ?', 'du fromage', 'du pain', 'de la confiture'],
    ['Comment s’appelle le petit de la vache ?', 'le veau', 'le poulain', 'l’agneau']] },
  { level: 7, title: 'L’eau', text: 'L’eau n’est pas toujours liquide. Quand il fait très froid, elle gèle et devient de la glace. Quand on la chauffe très fort, elle bout et devient de la vapeur. Les plantes et les animaux ont tous besoin d’eau.', questions: [
    ['Que devient l’eau quand elle gèle ?', 'de la glace', 'du sable', 'du lait'],
    ['Que devient l’eau qui bout ?', 'de la vapeur', 'de la glace', 'de la neige']] },
  { level: 7, title: 'Le dauphin', text: 'Le dauphin vit dans la mer, mais ce n’est pas un poisson : c’est un mammifère, comme nous. Il doit remonter à la surface pour respirer. Il vit en groupe et il communique avec les autres par des sifflements.', questions: [
    ['Le dauphin est-il un poisson ?', 'non', 'oui', 'parfois'],
    ['Pourquoi remonte-t-il à la surface ?', 'pour respirer', 'pour dormir', 'pour manger'],
    ['Comment communique-t-il ?', 'par des sifflements', 'par des gestes', 'en écrivant']] },
  { level: 7, title: 'Le cœur', text: 'Le cœur est un muscle, à peu près gros comme ton poing. Il bat sans jamais s’arrêter, pour envoyer le sang dans tout le corps. Quand tu cours, il bat plus vite. Pose ta main sur ta poitrine : tu le sens battre !', questions: [
    ['Quelle est la taille du cœur ?', 'comme un poing', 'comme une tête', 'comme un pois'],
    ['Que fait le cœur ?', 'il envoie le sang', 'il digère', 'il voit'],
    ['Quand bat-il plus vite ?', 'quand on court', 'quand on dort', 'quand on lit']] },
  { level: 7, title: 'La chouette', text: 'La chouette est un oiseau de nuit. Elle voit très bien dans le noir. Elle vole sans faire de bruit pour attraper des souris. Le jour, elle dort, cachée dans un arbre creux ou dans une grange.', questions: [
    ['Quand la chouette chasse-t-elle ?', 'la nuit', 'le matin', 'à midi'],
    ['Que mange la chouette ?', 'des souris', 'de l’herbe', 'des fruits'],
    ['Comment vole-t-elle ?', 'sans bruit', 'en criant', 'en chantant']] },
  { level: 7, title: 'Le pain', text: 'Le pain est fait avec de la farine. La farine vient du blé, qui pousse dans les champs. Le meunier écrase les grains pour faire la farine. Le boulanger la mélange avec de l’eau, du sel et de la levure.', questions: [
    ['D’où vient la farine ?', 'du blé', 'du lait', 'des pommes'],
    ['Qui écrase les grains de blé ?', 'le meunier', 'le boulanger', 'le facteur'],
    ['Où pousse le blé ?', 'dans les champs', 'dans la mer', 'dans le four']] },

  // ---- Niveau 8 : consignes et recettes (dans quel ordre ? avec quoi ?)
  { level: 8, title: 'La salade de fruits', text: 'D’abord, lave une pomme et une poire. Ensuite, épluche une banane. Coupe tous les fruits en petits morceaux. Mets-les dans un saladier avec un peu de jus d’orange. Pour finir, mélange doucement.', questions: [
    ['Que faut-il faire en premier ?', 'laver les fruits', 'couper les fruits', 'mélanger'],
    ['Où met-on les morceaux ?', 'dans un saladier', 'dans un verre', 'dans le four'],
    ['Quel fruit faut-il éplucher ?', 'la banane', 'la pomme', 'la poire']] },
  { level: 8, title: 'Faire pousser un haricot', text: 'Prends un pot de yaourt et remplis-le de terre. Fais un petit trou avec ton doigt. Pose un haricot dedans et recouvre-le de terre. Arrose un peu. Place le pot près d’une fenêtre.', questions: [
    ['Que met-on dans le pot de yaourt ?', 'de la terre', 'du sable', 'de l’eau'],
    ['Avec quoi fait-on le trou ?', 'avec le doigt', 'avec une pelle', 'avec un crayon'],
    ['Où faut-il placer le pot ?', 'près d’une fenêtre', 'dans le noir', 'dans le frigo']] },
  { level: 8, title: 'Le jeu du loup', text: 'Un enfant est le loup. Les autres courent pour lui échapper. Quand le loup touche un enfant, cet enfant devient le loup à son tour. Attention : il est interdit de sortir de la cour !', questions: [
    ['Que font les autres enfants ?', 'ils courent', 'ils se cachent', 'ils chantent'],
    ['Qui devient le loup ?', 'l’enfant touché', 'le plus grand', 'la maîtresse'],
    ['Qu’est-ce qui est interdit ?', 'sortir de la cour', 'courir vite', 'toucher un enfant']] },
  { level: 8, title: 'Le masque de chat', text: 'Découpe un rond dans du carton. Fais deux trous pour les yeux. Colle deux triangles en haut pour les oreilles. Dessine des moustaches. Attache un élastique de chaque côté.', questions: [
    ['Quelle forme faut-il découper ?', 'un rond', 'un carré', 'une étoile'],
    ['À quoi servent les deux trous ?', 'à voir', 'à respirer', 'à manger'],
    ['Que colle-t-on en haut du masque ?', 'deux triangles', 'deux ronds', 'un élastique']] },
  { level: 8, title: 'Traverser la rue', text: 'Arrête-toi au bord du trottoir, sur le passage piéton. Regarde à gauche, puis à droite, puis encore à gauche. Si le petit bonhomme est vert et qu’aucune voiture n’arrive, traverse sans courir.', questions: [
    ['Où faut-il traverser ?', 'au passage piéton', 'entre les voitures', 'au milieu de la rue'],
    ['De quel côté regarde-t-on d’abord ?', 'à gauche', 'à droite', 'en haut'],
    ['De quelle couleur doit être le bonhomme ?', 'vert', 'rouge', 'orange']] },
  { level: 8, title: 'Le chocolat chaud', text: 'Verse du lait dans une casserole. Demande à un adulte de le faire chauffer. Ajoute deux cuillères de chocolat en poudre et mélange bien. Attends un peu avant de boire : c’est chaud !', questions: [
    ['Qui fait chauffer le lait ?', 'un adulte', 'l’enfant', 'le chat'],
    ['Combien de cuillères de chocolat faut-il ?', 'deux', 'une', 'cinq'],
    ['Pourquoi faut-il attendre avant de boire ?', 'c’est chaud', 'c’est froid', 'c’est sucré']] },
  { level: 8, title: 'Les crêpes', text: 'Verse la farine dans un saladier. Ajoute trois œufs et mélange. Verse le lait petit à petit. Laisse reposer la pâte une heure. Demande à un adulte de cuire les crêpes dans une poêle bien chaude.', questions: [
    ['Que met-on en premier dans le saladier ?', 'la farine', 'le lait', 'les œufs'],
    ['Combien d’œufs faut-il ?', 'trois', 'un', 'six'],
    ['Combien de temps la pâte repose-t-elle ?', 'une heure', 'une minute', 'une semaine']] },
  { level: 8, title: 'Se laver les mains', text: 'Mouille tes mains sous l’eau. Prends du savon et frotte bien : les paumes, le dessus des mains, entre les doigts et les ongles. Rince sous l’eau. Pour finir, sèche-les avec une serviette propre.', questions: [
    ['Que fait-on en premier ?', 'on mouille ses mains', 'on prend du savon', 'on les sèche'],
    ['Avec quoi sèche-t-on ses mains ?', 'une serviette', 'un mouchoir', 'du savon']] },
  { level: 8, title: 'La marelle', text: 'Dessine la marelle à la craie. Lance un caillou dans la première case. Saute à cloche-pied dans les autres cases, sans toucher les traits. Au retour, ramasse ton caillou. Ensuite, lance-le dans la deuxième case.', questions: [
    ['Comment dessine-t-on la marelle ?', 'à la craie', 'au feutre', 'à la peinture'],
    ['Comment saute-t-on ?', 'à cloche-pied', 'à pieds joints', 'en arrière'],
    ['Que ne faut-il pas toucher ?', 'les traits', 'le caillou', 'la craie']] },
  { level: 8, title: 'La pâte à sel', text: 'Mélange deux verres de farine avec un verre de sel. Ajoute un verre d’eau tiède, petit à petit. Pétris la pâte avec tes mains. Fabrique des formes. Laisse-les sécher plusieurs jours avant de les peindre.', questions: [
    ['Combien de verres de farine faut-il ?', 'deux', 'un', 'trois'],
    ['Que fait-on avant de peindre ?', 'on laisse sécher', 'on les mange', 'on les mouille'],
    ['Avec quoi pétrit-on la pâte ?', 'avec les mains', 'avec une fourchette', 'avec les pieds']] },
  { level: 8, title: 'Le cartable', text: 'Le soir, regarde ce dont tu auras besoin le lendemain. Range tes cahiers et tes livres dans ton cartable. Vérifie que ta trousse est complète. Pose ton cartable près de la porte pour ne pas l’oublier.', questions: [
    ['Quand prépare-t-on son cartable ?', 'le soir', 'le matin', 'à midi'],
    ['Où pose-t-on le cartable ?', 'près de la porte', 'sous le lit', 'dans la cuisine'],
    ['Pourquoi le poser près de la porte ?', 'pour ne pas l’oublier', 'pour le cacher', 'pour qu’il sèche']] },
  { level: 8, title: 'Cache-cache', text: 'Un enfant compte jusqu’à vingt contre un arbre, les yeux fermés. Pendant ce temps, les autres se cachent. Puis il crie : « J’arrive ! » et il part les chercher. Le premier trouvé comptera à la partie suivante.', questions: [
    ['Jusqu’à combien compte l’enfant ?', 'vingt', 'cinq', 'cent'],
    ['Que font les autres pendant ce temps ?', 'ils se cachent', 'ils comptent', 'ils dorment'],
    ['Qui comptera à la partie suivante ?', 'le premier trouvé', 'le dernier trouvé', 'le plus petit']] },
  { level: 8, title: 'Pour les mésanges', text: 'Prends une pomme de pin. Recouvre-la de graisse végétale. Roule-la dans des graines de tournesol. Accroche-la à une branche avec une ficelle. Les mésanges viendront picorer tout l’hiver !', questions: [
    ['Dans quoi roule-t-on la pomme de pin ?', 'des graines', 'du sable', 'du sucre'],
    ['Où l’accroche-t-on ?', 'à une branche', 'à la porte', 'au plafond'],
    ['Qui viendra picorer ?', 'les mésanges', 'les chats', 'les poissons']] },
  { level: 8, title: 'La citronnade', text: 'Presse deux citrons et verse le jus dans une carafe. Ajoute un litre d’eau fraîche et trois cuillères de sucre. Mélange bien, jusqu’à ce que le sucre disparaisse. Ajoute des glaçons, puis sers aussitôt.', questions: [
    ['Combien de citrons faut-il ?', 'deux', 'un', 'cinq'],
    ['Que met-on à la fin ?', 'des glaçons', 'du sucre', 'le jus'],
    ['Où verse-t-on le jus ?', 'dans une carafe', 'dans un bol', 'dans une casserole']] },
  { level: 8, title: 'Le bonhomme en cresson', text: 'Pose du coton au fond d’une coquille d’œuf vide. Mouille-le bien. Sème des graines de cresson dessus. Dessine un visage sur la coquille. Dans quelques jours, ton bonhomme aura des cheveux verts !', questions: [
    ['Que met-on au fond de la coquille ?', 'du coton', 'de la terre', 'du sable'],
    ['Que sème-t-on ?', 'du cresson', 'des radis', 'des fleurs'],
    ['Où dessine-t-on le visage ?', 'sur la coquille', 'sur le coton', 'sur une feuille']] },

  // ---- Niveau 9 : pourquoi ? (la cause, ce que veut faire le personnage : c'est écrit dans le texte)
  { level: 9, title: 'Le goûter partagé', text: 'À la récré, Anna voit que Malo n’a pas de goûter : il a oublié son sac à la maison. Anna coupe sa brioche en deux et lui en donne la moitié. Malo la remercie avec un grand sourire.', questions: [
    ['Pourquoi Malo n’a-t-il pas de goûter ?', 'il a oublié son sac', 'il n’a pas faim', 'il est malade'],
    ['Pourquoi Anna coupe-t-elle sa brioche ?', 'pour la partager', 'pour la cacher', 'pour la jeter'],
    ['Pourquoi Malo sourit-il ?', 'Anna l’aide', 'il a gagné', 'il rentre chez lui']] },
  { level: 9, title: 'Le gros pull', text: 'Ce matin, Hugo sort en short et en tee-shirt. Dehors, le vent est glacé. Au bout de cinq minutes, Hugo tremble de froid. Il remonte vite dans sa chambre pour mettre un gros pull.', questions: [
    ['Pourquoi Hugo tremble-t-il ?', 'il a froid', 'il a peur', 'il a couru'],
    ['Pourquoi Hugo a-t-il froid ?', 'il est en short', 'il est mouillé', 'il est malade'],
    ['Pourquoi remonte-t-il dans sa chambre ?', 'pour mettre un pull', 'pour dormir', 'pour jouer']] },
  { level: 9, title: 'Le vase', text: 'Lou joue au ballon dans le salon. Paf ! Le ballon renverse le vase, qui se casse. Lou ramasse les morceaux et va voir maman : « Pardon, je n’aurais pas dû jouer ici. » Maman l’embrasse, car Lou a dit la vérité.', questions: [
    ['Pourquoi le vase est-il cassé ?', 'le ballon l’a renversé', 'le chat l’a poussé', 'maman l’a lâché'],
    ['Pourquoi Lou dit-elle pardon ?', 'elle a cassé le vase', 'elle est en retard', 'elle a crié'],
    ['Pourquoi maman embrasse-t-elle Lou ?', 'Lou a dit la vérité', 'Lou a gagné', 'c’est sa fête']] },
  { level: 9, title: 'Le chien des voisins', text: 'Toute la nuit, le chien des voisins aboie. Personne ne peut dormir. Au matin, on comprend tout : un chaton est coincé en haut de l’arbre ! Le chien voulait prévenir ses maîtres.', questions: [
    ['Pourquoi personne ne peut-il dormir ?', 'le chien aboie', 'il y a un orage', 'il fait trop chaud'],
    ['Pourquoi le chien aboie-t-il ?', 'pour prévenir', 'il a faim', 'il veut jouer']] },
  { level: 9, title: 'Les radis', text: 'Margot sème des graines de radis. Mais elle oublie de les arroser pendant toute une semaine. La terre devient sèche et rien ne pousse. Alors Margot dessine un arrosoir sur son calendrier pour ne plus oublier.', questions: [
    ['Pourquoi rien ne pousse-t-il ?', 'la terre est sèche', 'il fait trop froid', 'un oiseau a tout mangé'],
    ['Pourquoi la terre est-elle sèche ?', 'Margot n’a pas arrosé', 'il pleut trop', 'le soleil est caché'],
    ['Pourquoi Margot dessine-t-elle un arrosoir ?', 'pour ne plus oublier', 'pour faire joli', 'pour son frère']] },
  { level: 9, title: 'La course de l’école', text: 'Tous les soirs, Théo court avec son papa pour s’entraîner. Le jour de la course de l’école, il part doucement pour garder des forces. Dans le dernier tour, il double tout le monde et il gagne !', questions: [
    ['Pourquoi Théo court-il tous les soirs ?', 'pour s’entraîner', 'pour aller à l’école', 'pour promener le chien'],
    ['Pourquoi Théo part-il doucement ?', 'pour garder des forces', 'il a mal au pied', 'il est tombé'],
    ['Pourquoi Théo peut-il doubler tout le monde ?', 'il a gardé des forces', 'les autres dorment', 'il triche']] },
  { level: 9, title: 'La tirelire', text: 'Depuis des semaines, Mila garde ses pièces dans sa tirelire. Samedi, elle l’ouvre et court au magasin. Elle achète un livre sur les chevaux, car c’est l’animal préféré de son frère. Demain, c’est son anniversaire !', questions: [
    ['Pourquoi Mila ouvre-t-elle sa tirelire ?', 'pour acheter un cadeau', 'pour compter', 'pour la ranger'],
    ['Pourquoi choisit-elle un livre sur les chevaux ?', 'son frère les adore', 'il est gratuit', 'elle a un cheval']] },
  { level: 9, title: 'Les bottes', text: 'Ce matin, Elsa met ses bottes en caoutchouc, alors qu’il fait grand soleil. Maman s’étonne. Elsa lui explique que sa classe va planter des arbres dans un champ plein de boue.', questions: [
    ['Pourquoi Elsa met-elle ses bottes ?', 'le champ est boueux', 'il pleut', 'elle a froid'],
    ['Pourquoi maman s’étonne-t-elle ?', 'il fait soleil', 'Elsa est en retard', 'les bottes sont neuves'],
    ['Pourquoi la classe va-t-elle dans un champ ?', 'pour planter des arbres', 'pour jouer au foot', 'pour un goûter']] },
  { level: 9, title: 'La lampe de poche', text: 'Ce soir, il y a une panne d’électricité dans tout le quartier. La maison est plongée dans le noir. Lucas va chercher sa lampe de poche dans le tiroir pour aider papa à trouver des bougies.', questions: [
    ['Pourquoi la maison est-elle dans le noir ?', 'il y a une panne', 'il est midi', 'les volets sont ouverts'],
    ['Pourquoi Lucas prend-il sa lampe ?', 'pour aider papa', 'pour jouer dehors', 'pour la réparer']] },
  { level: 9, title: 'Merci, maîtresse', text: 'Noa prépare un gâteau pour sa maîtresse, qui quitte l’école à la fin de l’année. Elle se lève très tôt pour qu’il soit prêt avant la classe. Dessus, elle écrit « Merci » avec du chocolat fondu.', questions: [
    ['Pourquoi Noa fait-elle un gâteau ?', 'sa maîtresse s’en va', 'c’est Noël', 'elle a faim'],
    ['Pourquoi Noa se lève-t-elle très tôt ?', 'pour finir le gâteau', 'pour jouer', 'elle est malade']] },
  { level: 9, title: 'Les feuilles mortes', text: 'Papi ramasse les feuilles mortes dans le jardin. Il ne les jette pas : il les étale au pied des arbustes. En pourrissant, elles nourriront la terre. Elles protégeront aussi les racines du froid.', questions: [
    ['Pourquoi papi garde-t-il les feuilles ?', 'pour nourrir la terre', 'pour faire du feu', 'pour les vendre'],
    ['Pourquoi les racines auront-elles moins froid ?', 'les feuilles les couvrent', 'il fait chaud', 'papi les arrose']] },
  { level: 9, title: 'Pique-nique au salon', text: 'Dimanche, la famille devait pique-niquer au bord du lac. Mais le matin, un gros orage éclate. Alors papa étale une nappe sur le tapis du salon, et tout le monde pique-nique à la maison !', questions: [
    ['Pourquoi la famille ne va-t-elle pas au lac ?', 'il y a un orage', 'la voiture est en panne', 'il fait trop chaud'],
    ['Pourquoi papa étale-t-il une nappe ?', 'pour y manger', 'pour faire le ménage', 'pour dormir']] },
  { level: 9, title: 'La plante de Mehdi', text: 'La plante verte de Mehdi a des feuilles toutes jaunes. Elle est posée dans un coin sombre, loin de la fenêtre. Maman explique qu’une plante a besoin de lumière pour vivre. Alors Mehdi la met près de la fenêtre.', questions: [
    ['Pourquoi les feuilles sont-elles jaunes ?', 'elle manque de lumière', 'il fait trop chaud', 'c’est l’automne'],
    ['Pourquoi Mehdi déplace-t-il la plante ?', 'elle a besoin de lumière', 'elle est trop lourde', 'il veut la jeter']] },
  { level: 9, title: 'Le bus raté', text: 'Ce matin, le réveil de Jade n’a pas sonné : sa pile était vide. Jade s’est réveillée en retard et elle a raté le bus. Papa a dû la conduire à l’école en voiture.', questions: [
    ['Pourquoi le réveil n’a-t-il pas sonné ?', 'la pile était vide', 'il était cassé', 'Jade l’a éteint'],
    ['Pourquoi Jade a-t-elle raté le bus ?', 'elle était en retard', 'le bus était plein', 'elle était malade'],
    ['Pourquoi papa l’emmène-t-il en voiture ?', 'elle a raté le bus', 'il pleut', 'elle est malade']] },
  { level: 9, title: 'Le gâteau de Sami', text: 'Théo invite son ami Sami pour le goûter. Sami est allergique aux œufs. Alors papa prépare un gâteau sans œufs, avec de la compote de pommes à la place. Sami se régale, comme tout le monde !', questions: [
    ['Pourquoi papa fait-il un gâteau sans œufs ?', 'Sami est allergique', 'il n’a plus d’œufs', 'il aime la compote'],
    ['Pourquoi y a-t-il de la compote dans le gâteau ?', 'pour remplacer les œufs', 'pour le décorer', 'pour le colorer']] },

  // ---- Niveau 10 : ce que pense ou ressent le personnage (on le devine à ce qu'il fait ou dit)
  { level: 10, title: 'Le dessin', text: 'Jules montre son dessin à la maîtresse. Elle dit : « Bravo, il est magnifique ! » et elle l’accroche au mur de la classe. Jules rougit et ne peut pas s’empêcher de sourire.', questions: [
    ['Comment se sent Jules ?', 'fier', 'triste', 'en colère'],
    ['Que pense la maîtresse du dessin ?', 'il est très beau', 'il est raté', 'il est trop petit'],
    ['Pourquoi Jules sourit-il ?', 'on l’a félicité', 'il a gagné', 'il a faim']] },
  { level: 10, title: 'Le doudou', text: 'Le soir, Nina cherche partout son doudou. Elle a les larmes aux yeux. Enfin, papa le trouve sous le canapé. Nina le serre très fort contre elle et lui fait un gros bisou.', questions: [
    ['Comment se sent Nina quand elle cherche ?', 'triste', 'joyeuse', 'fière'],
    ['Comment se sent Nina à la fin ?', 'heureuse', 'triste', 'fâchée'],
    ['Pourquoi Nina a-t-elle les larmes aux yeux ?', 'son doudou est perdu', 'elle a mal', 'elle a sommeil']] },
  { level: 10, title: 'L’orage', text: 'Dehors, le tonnerre gronde très fort. Sacha se cache sous sa couette et ferme les yeux. Sa grande sœur vient s’asseoir près de lui et lui tient la main. Peu à peu, Sacha se calme.', questions: [
    ['Comment se sent Sacha pendant l’orage ?', 'il a peur', 'il s’amuse', 'il est fâché'],
    ['Pourquoi sa sœur lui tient-elle la main ?', 'pour le rassurer', 'pour jouer', 'pour partir'],
    ['Comment se sent Sacha à la fin ?', 'plus calme', 'plus en colère', 'plus triste']] },
  { level: 10, title: 'La tour de cubes', text: 'Léna construit une tour de cubes très haute. Son petit frère arrive en courant et la fait tomber. Léna croise les bras et fronce les sourcils. « Ce n’est pas juste ! » crie-t-elle.', questions: [
    ['Comment se sent Léna ?', 'en colère', 'joyeuse', 'fatiguée'],
    ['Pourquoi Léna crie-t-elle ?', 'sa tour est tombée', 'elle a gagné', 'elle a mal']] },
  { level: 10, title: 'Le nouveau', text: 'Omar arrive dans une nouvelle école. Il ne connaît personne. À la récré, il reste seul près du mur. Zoé s’approche : « Tu veux jouer avec nous ? » Omar sourit enfin.', questions: [
    ['Comment se sent Omar près du mur ?', 'un peu triste', 'très joyeux', 'en colère'],
    ['Pourquoi Zoé s’approche-t-elle ?', 'pour l’inviter', 'pour le gronder', 'pour son goûter'],
    ['Pourquoi Omar sourit-il enfin ?', 'Zoé l’invite', 'il rentre', 'il a gagné']] },
  { level: 10, title: 'La fête de mamie', text: 'Mamie ouvre la porte. Toute la famille est là, avec des ballons et un gros gâteau ! Mamie met les mains sur sa bouche. Elle ne savait pas du tout qu’on lui préparait une fête.', questions: [
    ['Comment se sent mamie ?', 'surprise', 'fâchée', 'fatiguée'],
    ['Pourquoi la famille est-elle là ?', 'pour fêter mamie', 'pour dormir', 'pour travailler'],
    ['Mamie savait-elle qu’il y aurait une fête ?', 'non', 'oui', 'un peu']] },
  { level: 10, title: 'Le plongeoir', text: 'Au bord du grand plongeoir, Elio regarde l’eau tout en bas. Ses jambes tremblent. Il recule d’un pas, puis il saute ! En remontant, il crie : « Je l’ai fait ! » et il lève les bras.', questions: [
    ['Comment se sent Elio en haut du plongeoir ?', 'il a peur', 'il s’ennuie', 'il est fâché'],
    ['Comment se sent Elio à la fin ?', 'fier', 'triste', 'fatigué']] },
  { level: 10, title: 'La boîte aux lettres', text: 'Malo attend une lettre de son cousin, qui habite très loin. Chaque matin, il court voir la boîte aux lettres, mais elle est vide. Aujourd’hui enfin, une enveloppe l’attend ! Malo sautille jusqu’à sa chambre.', questions: [
    ['Comment se sent Malo quand la boîte est vide ?', 'déçu', 'en colère', 'soulagé'],
    ['Comment se sent Malo à la fin ?', 'très content', 'triste', 'inquiet']] },
  { level: 10, title: 'Le gâteau pour papi', text: 'Lisa porte fièrement le gâteau qu’elle a fait pour papi. Mais elle trébuche, et le gâteau tombe par terre. Lisa reste immobile, les yeux pleins de larmes. Papi la prend dans ses bras : « Ce n’est pas grave. »', questions: [
    ['Comment se sent Lisa quand le gâteau tombe ?', 'très triste', 'joyeuse', 'amusée'],
    ['Pourquoi papi la prend-il dans ses bras ?', 'pour la consoler', 'pour danser', 'pour la gronder'],
    ['Comment se sent Lisa au début ?', 'fière', 'triste', 'malade']] },
  { level: 10, title: 'Le retour de papa', text: 'Ce soir, papa rentre d’un long voyage. Toute la soirée, Inès regarde par la fenêtre. Elle ne tient pas en place. Quand elle entend la clé dans la porte, elle court dans l’entrée en criant : « Papa ! »', questions: [
    ['Comment se sent Inès en attendant ?', 'impatiente', 'fatiguée', 'fâchée'],
    ['Comment se sent Inès quand papa arrive ?', 'heureuse', 'triste', 'en colère']] },
  { level: 10, title: 'La partie de cartes', text: 'Léon perd aux cartes pour la troisième fois. Il jette ses cartes sur la table et croise les bras. « Je ne joue plus ! » dit-il. Sa sœur lui propose de choisir le jeu suivant, et Léon finit par sourire.', questions: [
    ['Comment se sent Léon quand il perd ?', 'en colère', 'joyeux', 'fier'],
    ['Pourquoi jette-t-il ses cartes ?', 'il a perdu', 'il a gagné', 'il a sommeil'],
    ['Pourquoi Léon sourit-il à la fin ?', 'il peut choisir le jeu', 'il a gagné', 'il a faim']] },
  { level: 10, title: 'La poésie', text: 'C’est au tour d’Anaïs de réciter sa poésie devant la classe. Au début, sa voix tremble un peu. Puis elle regarde son amie Lou, qui lui fait un clin d’œil. Anaïs termine sa poésie sans se tromper.', questions: [
    ['Comment se sent Anaïs au début ?', 'intimidée', 'en colère', 'endormie'],
    ['Pourquoi Lou fait-elle un clin d’œil ?', 'pour l’aider', 'pour se moquer', 'pour la gêner'],
    ['Comment se sent Anaïs à la fin ?', 'fière', 'triste', 'fâchée']] },
  { level: 10, title: 'La surprise de Rose', text: 'Quand Rose rentre de l’école, un petit chiot l’attend dans le salon. Rose pousse un cri, met ses mains sur ses joues, puis éclate de rire. Elle n’arrive pas à y croire !', questions: [
    ['Comment se sent Rose ?', 'folle de joie', 'triste', 'fâchée'],
    ['Rose s’attendait-elle à avoir un chiot ?', 'non', 'oui', 'un peu']] },
  { level: 10, title: 'Le meilleur ami', text: 'Hugo apprend que son meilleur ami, Tim, va déménager très loin. Il ne dit rien pendant tout le repas et il ne finit pas son assiette. Le soir, maman vient s’asseoir sur son lit pour parler avec lui.', questions: [
    ['Comment se sent Hugo ?', 'triste', 'joyeux', 'fier'],
    ['Pourquoi maman vient-elle le voir ?', 'pour le consoler', 'pour le gronder', 'pour ranger']] },
  { level: 10, title: 'La médaille', text: 'À la fin du tournoi de judo, Yanis monte sur le podium. Il reçoit une médaille d’argent. Il la montre à tout le monde et il ne la quitte plus, même pour dormir !', questions: [
    ['Comment se sent Yanis ?', 'fier', 'déçu', 'en colère'],
    ['Que fait Yanis de sa médaille ?', 'il la montre', 'il la cache', 'il la jette']] },
];

/**
 * Textes déchiffrables (ctx.sons) : les textes qui se lisent avec les sons vus, avec seulement leurs
 * questions déchiffrables (question et réponses). Il en faut au moins deux hors saison ; sinon, tous.
 */
function readableTexts(texts, sons) {
  if (!sonsActifs(sons)) return texts;
  const ok = (t) => texteDechiffrable(t, sons);
  const known = texts
    .filter((t) => ok(t.title) && ok(t.text))
    .map((t) => ({ ...t, questions: t.questions.filter((q) => q.every(ok)) }))
    .filter((t) => t.questions.length);
  return known.filter((t) => !t.season).length >= 2 ? known : texts;
}

export const petitsTextes = {
  id: 'petits-textes',
  domain: 'francais',
  section: 'Lire',
  title: 'Petits textes',
  icon: '📚',
  skill: 'Lire un petit texte et le comprendre (y compris ce qui n’est pas écrit, pourquoi, ce que ressent un personnage)',
  levels: [
    'Textes très courts', 'Petits textes', 'Textes de 4 phrases', 'Lire entre les lignes', 'Dialogues et pronoms',
    'Titre et ordre des faits', 'Textes documentaires', 'Consignes et recettes', 'Pourquoi ?',
    'Ce que pense le personnage',
  ],
  // context.season : la saison du moment (seasonOf), pour les textes de saison ;
  // context.sons : les sons vus en classe (textes déchiffrables, voir graphemes.js)
  generate(level, rng, _index, context = {}) {
    const story = pickSeasonal(rng, readableTexts(TEXTS.filter((t) => t.level === level), context.sons), context.season);
    const [question, answer, ...others] = pick(rng, story.questions);
    return {
      key: `petits-textes:${story.title}`,
      text: question,
      instruction: ['Lis le petit texte, puis réponds à la question.', question],
      short: { key: 'petits-textes', text: question },
      replay: [question],
      // niveau 6 : le titre est une des réponses, il n'est donc pas montré
      stage: { type: 'text', title: level === 6 ? null : story.title, text: story.text },
      choices: shuffle(rng, [answer, ...others]).map((value) => ({ value, label: value })),
      choiceStyle: 'answers',
      answer,
      success: { speak: `${answer[0].toUpperCase()}${answer.slice(1)} !` },
    };
  },
};

export const TEXT_DATA = TEXTS;
