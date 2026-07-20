-- MySQL dump 10.13  Distrib 8.4.10, for Linux (x86_64)
--
-- Host: localhost    Database: hamburgeria
-- ------------------------------------------------------
-- Server version	8.4.10

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Dumping data for table `allergens`
--

LOCK TABLES `allergens` WRITE;
/*!40000 ALTER TABLE `allergens` DISABLE KEYS */;
INSERT INTO `allergens` (`id`, `name`, `description`) VALUES (1,'Glutine','Cereali contenenti glutine'),(2,'Latte','Latte e derivati'),(3,'Uova','Uova e prodotti a base di uova'),(4,'Soia','Soia e derivati'),(5,'Senape','Senape e derivati'),(6,'Sesamo','Semi di sesamo'),(7,'Frutta a Guscio','Mandorle, nocciole, noci ecc'),(8,'Arachidi','Arachidi e derivati'),(9,'ciao','boohhh');
/*!40000 ALTER TABLE `allergens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` (`id`, `name`, `slug`, `description`, `is_active`, `theme`, `display_order`, `created_at`, `updated_at`) VALUES (1,'Hamburgers','burger-classici','I grandi classici della tradizione americana',1,'burgers',10,'2026-02-11 08:40:37','2026-07-19 00:59:53'),(2,'Special Burger','special-burger','Ricette gourmet e stagionali',1,NULL,0,'2026-02-11 08:40:37','2026-02-11 08:40:37'),(3,'Vegetariani','vegetariani','Burger senza carne',1,NULL,0,'2026-02-11 08:40:37','2026-02-11 08:40:37'),(4,'Vegani','vegani','Proposte 100% vegetali',1,NULL,0,'2026-02-11 08:40:37','2026-02-11 08:40:37'),(5,'Gluten Free','gluten-free','Burger senza glutine',1,NULL,0,'2026-02-11 08:40:37','2026-02-11 08:40:37'),(6,'Menù Completi','menu-completi','Burger + patatine + bibita',1,NULL,0,'2026-02-11 08:40:37','2026-02-11 08:40:37'),(7,'Limited Edition','limited-edition','Edizioni limitate e speciali',1,NULL,0,'2026-02-11 08:40:37','2026-02-11 08:40:37'),(13,'Fritti e insalatone','fritti-insalatone','Fritti preparati al momento e insalatone.',1,'sides',20,'2026-07-18 14:15:36','2026-07-18 14:15:36'),(14,'Dolci','dolci','I dessert della cucina Bourmet.',1,'desserts',30,'2026-07-18 14:15:36','2026-07-18 14:15:36'),(15,'Bibite','bibite','Bevande fresche per accompagnare il menu.',1,'drinks',40,'2026-07-18 14:15:36','2026-07-18 14:15:36'),(16,'Ciao','ciao',NULL,1,'burgers',50,'2026-07-19 01:01:43','2026-07-19 01:01:43');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `dietary_preferences`
--

LOCK TABLES `dietary_preferences` WRITE;
/*!40000 ALTER TABLE `dietary_preferences` DISABLE KEYS */;
INSERT INTO `dietary_preferences` (`id`, `name`, `slug`, `description`) VALUES (1,'Vegetariano','vegetariano','Non contiene carne o pesce'),(2,'Vegano','vegano','Non contiene ingredienti di origine animale'),(3,'Gluten Free','gluten-free','Senza glutine'),(4,'Lactose Free','lactose-free','Senza lattosio'),(5,'Halal','halal','Carne certificata Halal'),(6,'Keto','keto','Basso contenuto di carboidrati'),(7,'High Protein','high-protein','Alto contenuto proteico');
/*!40000 ALTER TABLE `dietary_preferences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `ingredients`
--

LOCK TABLES `ingredients` WRITE;
/*!40000 ALTER TABLE `ingredients` DISABLE KEYS */;
INSERT INTO `ingredients` (`id`, `name`, `description`, `is_active`) VALUES (1,'Pane Brioche','Pane morbido con burro e uova',1),(2,'Pane Senza Glutine','Pane certificato gluten free',1),(3,'Hamburger Manzo 150gr','Carne bovina 100% italiana',1),(4,'Hamburger Manzo 250gr','Carne bovina 100% italiana',1),(5,'Burger Vegetale','Burger a base di proteine vegetali',1),(6,'Cheddar','Formaggio cheddar fuso',1),(7,'Bacon','Pancetta croccante',1),(8,'Insalata','Lattuga fresca',1),(9,'Pomodoro','Pomodoro fresco a fette',1),(10,'Cipolla','Cipolla fresca',1),(11,'Cipolla Caramellata','Cipolla stufata con zucchero di canna',1),(12,'Salsa BBQ','Salsa barbecue affumicata',1),(13,'Maionese','Maionese classica',1),(14,'Ketchup','Salsa ketchup',1),(15,'Senape','Senape delicata',1),(16,'Jalapeños','Peperoncini piccanti messicani',1),(17,'Uovo','Uovo fresco alla piastra',1),(18,'Avocado','Fette di avocado fresco',1),(19,'Pastella croccante',NULL,1),(20,'Salsa Bourmet',NULL,1),(21,'Fiori di zucca',NULL,1),(22,'Pastella',NULL,1),(23,'Olio di semi',NULL,1),(24,'Salvia',NULL,1),(25,'Sale',NULL,1),(26,'Pollo',NULL,1),(27,'Verdure',NULL,1),(28,'Verdure di stagione',NULL,1),(29,'Selezione di fritti',NULL,1),(30,'Salse della casa',NULL,1),(31,'Crema al formaggio',NULL,1),(32,'Biscotto',NULL,1),(33,'Amarene',NULL,1),(34,'Crema al cioccolato',NULL,1),(35,'Pistacchio',NULL,1),(36,'Crema',NULL,1),(37,'Base soffice',NULL,1),(38,'ing ciao',NULL,1);
/*!40000 ALTER TABLE `ingredients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` (`id`, `name`, `slug`, `description`, `base_price`, `sku`, `is_active`, `is_available`, `is_best_seller`, `best_seller_order`, `display_order`, `created_at`, `updated_at`, `sale_price`) VALUES (1,'Classico Italiano','classico-italiano','Hamburger tradizionale con cheddar e salsa burger',8.90,'BUR001',1,1,0,0,0,'2026-02-11 08:45:19','2026-02-11 08:45:19',0.00),(2,'Doppio BBQ','doppio-bbq','Doppio hamburger con bacon croccante e salsa BBQ',11.90,'BUR002',1,1,0,0,0,'2026-02-11 08:45:19','2026-02-11 08:45:19',0.00),(3,'Esplosione di Formaggi','esplosione-formaggi','Triplo formaggio filante',10.50,'BUR003',1,1,1,2,0,'2026-02-11 08:45:19','2026-07-19 10:24:31',0.00),(4,'Messicano Piccante','messicano-piccante','Jalapeños e salsa piccante',9.90,'BUR004',1,1,0,0,0,'2026-02-11 08:45:19','2026-02-11 08:45:19',0.00),(5,'Gourmet Tricolore','gourmet-tricolore','Mozzarella, pomodoro e rucola',10.90,'BUR005',1,1,0,0,0,'2026-02-11 08:45:19','2026-02-11 08:45:19',0.00),(6,'Vegetariano Verde','vegetariano-verde','Burger vegetale con avocado',9.50,'BUR006',1,1,0,0,0,'2026-02-11 08:45:19','2026-02-11 08:45:19',0.00),(7,'Vegano Mediterraneo','vegano-mediterraneo','Burger vegano con verdure grigliate',9.90,'BUR007',1,1,1,5,0,'2026-02-11 08:45:19','2026-07-19 10:24:31',0.00),(8,'Amante del Bacon','amante-del-bacon','Extra bacon croccante',11.50,'BUR008',1,1,1,1,0,'2026-02-11 08:45:19','2026-07-19 10:24:31',0.00),(9,'Affumicato Americano','affumicato-americano','Salsa BBQ affumicata',10.90,'BUR009',1,1,0,0,0,'2026-02-11 08:45:19','2026-07-20 06:07:22',0.00),(10,'Tradizionale Americano','tradizionale-americano','Pane brioche e manzo 100%',8.50,'BUR010',1,1,0,0,0,'2026-02-11 08:45:19','2026-02-11 08:45:19',0.00),(11,'Croccante di Pollo','croccante-di-pollo','Petto di pollo panato e croccante',8.90,'BUR011',1,1,1,9,0,'2026-02-11 08:45:19','2026-07-19 10:24:31',0.00),(12,'Diavolo Rosso','diavolo-rosso','Piccantezza estrema',10.90,'BUR012',1,1,0,0,0,'2026-02-11 08:45:19','2026-02-11 08:45:19',0.00),(13,'Keto Protein','keto-protein','Senza pane, low carb',9.90,'BUR013',1,1,0,0,0,'2026-02-11 08:45:19','2026-07-18 18:26:46',0.00),(14,'Senza Glutine Speciale','senza-glutine-speciale','Pane certificato gluten free',10.90,'BUR014',1,1,0,0,0,'2026-02-11 08:45:19','2026-02-11 08:45:19',0.00),(15,'Smash Halal','smash-halal','Carne certificata Halal',9.90,'BUR015',1,1,0,0,0,'2026-02-11 08:45:19','2026-02-11 08:45:19',0.00),(16,'Avocado Deluxe','avocado-deluxe','Avocado fresco e cheddar premium',11.90,'BUR016',1,1,1,8,0,'2026-02-11 08:45:19','2026-07-19 10:24:31',0.00),(17,'Torre Tripla','torre-tripla','Tre hamburger e triplo formaggio',14.90,'BUR017',1,1,0,0,0,'2026-02-11 08:45:19','2026-02-11 08:45:19',0.00),(18,'Street BBQ','street-bbq','Stile street food affumicato',9.90,'BUR018',1,1,0,0,0,'2026-02-11 08:45:19','2026-02-11 08:45:19',0.00),(19,'Fit Proteico','fit-proteico','Hamburger leggero e proteico',9.50,'BUR019',1,0,1,11,0,'2026-02-11 08:45:19','2026-07-19 18:24:33',0.00),(20,'Black Edition Limitata','black-edition-limitata','Pane nero al carbone',12.90,'BUR020',1,0,1,3,0,'2026-02-11 08:45:19','2026-07-19 11:00:31',0.00),(21,'Double Cheese with Chili','double-cheese-with-chili','Hamburger piccante con formaggio',13.20,'BUR21',0,1,0,0,0,NULL,'2026-07-18 18:15:50',0.00),(27,'Onion rings','onion-rings','Anelli di cipolla dorati e croccanti, serviti caldi con la nostra salsa.',6.00,'SIDE-ONION-RINGS',1,1,1,7,10,'2026-07-18 14:15:36','2026-07-19 10:24:31',0.00),(28,'Fiori fritti','fiori-fritti','Fiori di zucca avvolti in una pastella leggera e fritti al momento.',7.00,'SIDE-FIORI-FRITTI',1,1,0,0,20,'2026-07-18 14:15:36','2026-07-18 14:15:36',0.00),(29,'Salvia crunch','salvia-crunch','Foglie di salvia croccanti, profumate e perfette da condividere.',6.50,'SIDE-SALVIA-CRUNCH',1,1,0,0,30,'2026-07-18 14:15:36','2026-07-18 14:15:36',0.00),(30,'Chick salad','chick-salad','Unâ€™insalata fresca e completa con pollo, verdure e condimento della casa.',10.00,'SIDE-CHICK-SALAD',1,1,0,0,40,'2026-07-18 14:15:36','2026-07-18 14:15:36',0.00),(31,'Veggie mix','veggie-mix','Una selezione di verdure croccanti preparate al momento.',7.50,'SIDE-VEGGIE-MIX',1,1,1,6,50,'2026-07-18 14:15:36','2026-07-19 10:24:31',0.00),(32,'Fritto Bourmet','fritto-bourmet','Il nostro fritto misto: sfizioso, abbondante e ideale da condividere.',9.00,'SIDE-FRITTO-BOURMET',1,1,1,12,60,'2026-07-18 14:15:36','2026-07-19 10:24:31',0.00),(33,'Amarena cake','amarena-cake','Cheesecake cremosa con amarene, dolce e piacevolmente acidula.',6.00,'DESSERT-AMARENA',1,1,0,0,10,'2026-07-18 14:15:36','2026-07-18 14:15:36',0.00),(34,'Choco cake','choco-cake','Una cheesecake golosa ricoperta da una generosa crema al cioccolato.',6.00,'DESSERT-CHOCO',1,1,0,0,20,'2026-07-18 14:15:36','2026-07-18 14:15:36',0.00),(35,'Pistacchio cake','pistacchio-cake','Cheesecake vellutata con crema e granella di pistacchio.',6.50,'DESSERT-PISTACCHIO',1,1,1,10,30,'2026-07-18 14:15:36','2026-07-19 10:24:31',0.00),(36,'Pistacchio pop','pistacchio-pop','Un dessert al pistacchio dal cuore morbido e dal gusto intenso.',6.50,'DESSERT-PISTACCHIO-POP',1,1,0,0,40,'2026-07-18 14:15:36','2026-07-18 14:15:36',0.00),(37,'Coca-Cola','coca-cola','Coca-Cola servita fresca.',3.50,'DRINK-COCA-COLA',1,1,1,4,10,'2026-07-18 14:15:36','2026-07-19 10:24:31',0.00),(38,'Coca-Cola Zero','coca-cola-zero','Coca-Cola Zero servita fresca.',3.50,'DRINK-COCA-ZERO',1,1,0,0,20,'2026-07-18 14:15:36','2026-07-18 14:15:36',0.00),(39,'Fanta','fanta','Bibita allâ€™arancia servita fresca.',3.50,'DRINK-FANTA',1,1,0,0,30,'2026-07-18 14:15:36','2026-07-18 14:15:36',0.00),(40,'Sprite','sprite','Bibita al gusto limone e lime servita fresca.',3.50,'DRINK-SPRITE',1,1,0,0,40,'2026-07-18 14:15:36','2026-07-18 14:15:36',0.00),(41,'Acqua naturale','acqua-naturale','Acqua minerale naturale.',1.50,'DRINK-WATER-STILL',1,1,0,0,50,'2026-07-18 14:15:36','2026-07-18 14:15:36',0.00),(42,'Acqua frizzante','acqua-frizzante','Acqua minerale frizzante.',1.50,'DRINK-WATER-SPARKLING',1,1,0,0,60,'2026-07-18 14:15:36','2026-07-18 14:15:36',0.00),(43,'Té al limone','te-limone','Té freddo al limone.',3.50,'DRINK-TEA-LEMON',1,1,0,0,70,'2026-07-18 14:15:36','2026-07-19 10:02:50',0.00),(44,'Birra bionda','birra-bionda','Birra bionda fresca.',5.00,'DRINK-BEER-BLONDE',1,1,0,0,80,'2026-07-18 14:15:36','2026-07-18 14:15:36',0.00),(45,'Ciao','ciao','ciao',1.00,NULL,1,1,0,0,0,'2026-07-19 01:02:44','2026-07-20 06:05:24',0.00);
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `ingredient_allergen`
--

LOCK TABLES `ingredient_allergen` WRITE;
/*!40000 ALTER TABLE `ingredient_allergen` DISABLE KEYS */;
INSERT INTO `ingredient_allergen` (`ingredient_id`, `allergen_id`) VALUES (1,1),(1,3),(5,4),(6,2),(15,5),(19,1),(19,3),(20,3),(20,5),(22,1),(30,1),(30,2),(30,3),(31,2),(32,1),(32,3),(34,2),(34,7),(35,7),(36,2),(37,1),(37,3),(38,9);
/*!40000 ALTER TABLE `ingredient_allergen` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `product_category`
--

LOCK TABLES `product_category` WRITE;
/*!40000 ALTER TABLE `product_category` DISABLE KEYS */;
INSERT INTO `product_category` (`product_id`, `category_id`) VALUES (1,1),(2,1),(3,1),(3,2),(4,1),(4,2),(5,1),(5,2),(6,1),(6,3),(7,1),(7,4),(8,1),(8,2),(9,1),(9,2),(10,1),(11,1),(12,1),(13,1),(14,1),(14,5),(15,1),(16,1),(16,2),(17,1),(17,2),(18,1),(18,2),(19,1),(20,1),(20,7),(27,13),(28,13),(29,13),(30,13),(31,13),(32,13),(33,14),(34,14),(35,14),(36,14),(37,15),(38,15),(39,15),(40,15),(41,15),(42,15),(43,15),(44,15),(45,1),(45,16);
/*!40000 ALTER TABLE `product_category` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `product_dietary_preference`
--

LOCK TABLES `product_dietary_preference` WRITE;
/*!40000 ALTER TABLE `product_dietary_preference` DISABLE KEYS */;
INSERT INTO `product_dietary_preference` (`product_id`, `dietary_preference_id`) VALUES (6,1),(7,1),(7,2),(13,6),(14,3),(15,5),(19,7);
/*!40000 ALTER TABLE `product_dietary_preference` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `product_images`
--

LOCK TABLES `product_images` WRITE;
/*!40000 ALTER TABLE `product_images` DISABLE KEYS */;
INSERT INTO `product_images` (`id`, `product_id`, `image_path`, `alt_text`, `sort_order`, `is_visible`, `created_at`, `updated_at`) VALUES (1,1,'images/burgers/classico-italiano.jpg','Classico Italiano',1,1,'2026-02-11 08:59:12','2026-02-11 08:59:12'),(2,2,'images/burgers/doppio-bbq.jpg','Doppio BBQ',1,1,'2026-02-11 08:59:12','2026-02-11 08:59:12'),(3,3,'images/burgers/esplosione-formaggi.jpg','Esplosione di Formaggi',1,1,'2026-02-11 08:59:12','2026-02-11 08:59:12'),(4,4,'images/burgers/messicano-piccante.jpg','Messicano Piccante',1,1,'2026-02-11 08:59:12','2026-02-11 08:59:12'),(5,5,'images/burgers/gourmet-tricolore.jpg','Gourmet Tricolore',1,1,'2026-02-11 08:59:12','2026-02-11 08:59:12'),(6,6,'images/burgers/vegetariano-verde.jpg','Vegetariano Verde',1,1,'2026-02-11 08:59:12','2026-02-11 08:59:12'),(7,7,'images/burgers/vegano-mediterraneo.jpg','Vegano Mediterraneo',1,1,'2026-02-11 08:59:12','2026-02-11 08:59:12'),(8,8,'images/burgers/amante-del-bacon.jpg','Amante del Bacon',1,1,'2026-02-11 08:59:12','2026-02-11 08:59:12'),(9,9,'images/burgers/affumicato-americano.jpg','Affumicato Americano',0,1,'2026-02-11 08:59:12','2026-07-20 06:07:22'),(10,10,'images/burgers/tradizionale-americano.jpg','Tradizionale Americano',1,1,'2026-02-11 08:59:12','2026-02-11 08:59:12'),(11,11,'images/burgers/croccante-di-pollo.jpg','Croccante di Pollo',1,1,'2026-02-11 08:59:12','2026-02-11 08:59:12'),(12,12,'images/burgers/diavolo-rosso.jpg','Diavolo Rosso',1,1,'2026-02-11 08:59:12','2026-02-11 08:59:12'),(13,13,'images/burgers/keto-protein.jpg','Keto Protein',1,1,'2026-02-11 08:59:12','2026-02-11 08:59:12'),(14,14,'images/burgers/senza-glutine-speciale.jpg','Senza Glutine Speciale',1,1,'2026-02-11 08:59:12','2026-02-11 08:59:12'),(15,15,'images/burgers/smash-halal.jpg','Smash Halal',1,1,'2026-02-11 08:59:12','2026-02-11 08:59:12'),(16,16,'images/burgers/avocado-deluxe.jpg','Avocado Deluxe',1,1,'2026-02-11 08:59:12','2026-02-11 08:59:12'),(17,17,'images/burgers/torre-tripla.jpg','Torre Tripla',1,1,'2026-02-11 08:59:12','2026-02-11 08:59:12'),(18,18,'images/burgers/street-bbq.jpg','Street BBQ',1,1,'2026-02-11 08:59:12','2026-02-11 08:59:12'),(19,19,'images/burgers/fit-proteico.jpg','Fit Proteico',1,1,'2026-02-11 08:59:12','2026-02-11 08:59:12'),(20,20,'images/burgers/black-edition-limitata.jpg','Black Edition Limitata',1,1,'2026-02-11 08:59:12','2026-02-11 08:59:12'),(21,27,'images/catalog/sides/onion-rings.jpg','Anelli di cipolla',0,1,'2026-07-18 14:15:36','2026-07-18 14:15:36'),(22,28,'images/catalog/sides/fiori-fritti.jpeg','Fiori di zucca fritti',0,1,'2026-07-18 14:15:36','2026-07-18 14:15:36'),(23,29,'images/catalog/sides/salvia-crunch.jpg','Salvia fritta croccante',0,1,'2026-07-18 14:15:36','2026-07-18 14:15:36'),(24,30,'images/catalog/sides/chick-salad.jpg','Insalata di pollo',0,1,'2026-07-18 14:15:36','2026-07-18 14:15:36'),(25,31,'images/catalog/sides/veggie-mix.jpeg','Verdure fritte',0,1,'2026-07-18 14:15:36','2026-07-18 14:15:36'),(26,32,'images/catalog/sides/fritto-bourmet.jpeg','Fritto misto Bourmet',0,1,'2026-07-18 14:15:36','2026-07-18 14:15:36'),(27,33,'images/catalog/desserts/amarena-cake.jpg','Cheesecake alle amarene',0,1,'2026-07-18 14:15:36','2026-07-18 14:15:36'),(28,34,'images/catalog/desserts/choco-cake.jpg','Cheesecake al cioccolato',0,1,'2026-07-18 14:15:36','2026-07-18 14:15:36'),(29,35,'images/catalog/desserts/pistacchio-cake.jpg','Cheesecake al pistacchio',0,1,'2026-07-18 14:15:36','2026-07-18 14:15:36'),(30,36,'images/catalog/desserts/pistacchio-pop.jpg','Dolce al pistacchio',0,1,'2026-07-18 14:15:36','2026-07-18 14:15:36'),(36,45,'images/catalog/uploads/3951e42c-38f4-4d8f-b1f3-b0e3b7044ff8.webp','agmDe5K_700bwp.webp',0,1,'2026-07-19 01:03:21','2026-07-20 06:05:24'),(37,37,'images/catalog/uploads/ca95b7d6-c454-405f-b8b2-86b0fc71a1e5.jpg','cocacola.jpg',0,1,'2026-07-19 10:01:28','2026-07-19 10:01:28'),(38,45,'images/catalog/uploads/a5d80e7a-4439-4c48-8330-5dfdcb372565.png','LockScreen.png',1,1,'2026-07-19 10:03:48','2026-07-20 06:05:24');
/*!40000 ALTER TABLE `product_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `product_ingredient`
--

LOCK TABLES `product_ingredient` WRITE;
/*!40000 ALTER TABLE `product_ingredient` DISABLE KEYS */;
INSERT INTO `product_ingredient` (`product_id`, `ingredient_id`, `is_optional`) VALUES (1,1,0),(1,3,0),(1,6,0),(1,8,0),(1,9,0),(2,1,0),(2,3,0),(2,6,0),(2,8,0),(2,9,0),(3,1,0),(3,3,0),(3,6,0),(3,8,0),(3,9,0),(4,1,0),(4,3,0),(4,6,0),(4,8,0),(4,9,0),(4,12,0),(4,16,0),(5,1,0),(5,3,0),(5,6,0),(5,8,0),(5,9,0),(6,1,0),(6,5,0),(6,8,0),(6,9,0),(6,18,0),(7,5,0),(7,8,0),(7,9,0),(8,1,0),(8,3,0),(8,6,0),(8,7,0),(8,8,0),(8,9,0),(9,1,0),(9,3,0),(9,6,0),(9,8,0),(9,9,0),(10,1,0),(10,3,0),(10,6,0),(10,8,0),(10,9,0),(11,1,0),(11,3,0),(11,6,0),(11,8,0),(11,9,0),(12,1,0),(12,3,0),(12,6,0),(12,8,0),(12,9,0),(13,1,0),(13,3,0),(13,6,0),(13,8,0),(13,9,0),(14,2,0),(14,3,0),(14,6,0),(14,8,0),(14,9,0),(15,1,0),(15,3,0),(15,6,0),(15,8,0),(15,9,0),(16,1,0),(16,3,0),(16,6,0),(16,8,0),(16,9,0),(17,1,0),(17,3,0),(17,6,0),(17,8,0),(17,9,0),(18,1,0),(18,3,0),(18,6,0),(18,8,0),(18,9,0),(19,1,0),(19,3,0),(19,6,0),(19,8,0),(19,9,0),(20,1,0),(20,3,0),(20,6,0),(20,8,0),(20,9,0),(27,10,0),(27,19,0),(27,20,0),(28,21,0),(28,22,0),(28,23,0),(29,22,0),(29,24,0),(29,25,0),(30,8,0),(30,20,0),(30,26,0),(30,27,0),(31,22,0),(31,23,0),(31,28,0),(32,27,0),(32,29,0),(32,30,0),(33,31,0),(33,32,0),(33,33,0),(34,31,0),(34,32,0),(34,34,0),(35,31,0),(35,32,0),(35,35,0),(36,35,0),(36,36,0),(36,37,0),(45,5,0),(45,18,0),(45,38,0);
/*!40000 ALTER TABLE `product_ingredient` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `product_variant`
--

LOCK TABLES `product_variant` WRITE;
/*!40000 ALTER TABLE `product_variant` DISABLE KEYS */;
INSERT INTO `product_variant` (`id`, `product_id`, `sku`, `price`, `weight_grams`, `is_default`, `is_active`, `created_at`, `updated_at`) VALUES (1,1,'BUR001-150',8.90,150,1,1,'2026-02-11 08:46:06','2026-02-11 08:46:06'),(2,2,'BUR002-150',11.90,150,1,1,'2026-02-11 08:46:06','2026-02-11 08:46:06'),(3,3,'BUR003-150',10.50,150,1,1,'2026-02-11 08:46:06','2026-02-11 08:46:06'),(4,4,'BUR004-150',9.90,150,1,1,'2026-02-11 08:46:06','2026-02-11 08:46:06'),(5,5,'BUR005-150',10.90,150,1,1,'2026-02-11 08:46:06','2026-02-11 08:46:06'),(6,8,'BUR008-150',11.50,150,1,1,'2026-02-11 08:46:06','2026-02-11 08:46:06'),(7,9,'BUR009-150',10.90,150,1,1,'2026-02-11 08:46:06','2026-02-11 08:46:06'),(8,10,'BUR010-150',8.50,150,1,1,'2026-02-11 08:46:06','2026-02-11 08:46:06'),(9,11,'BUR011-150',8.90,150,1,1,'2026-02-11 08:46:06','2026-02-11 08:46:06'),(10,12,'BUR012-150',10.90,150,1,1,'2026-02-11 08:46:06','2026-02-11 08:46:06'),(11,13,'BUR013-150',9.90,150,1,1,'2026-02-11 08:46:06','2026-02-11 08:46:06'),(12,14,'BUR014-150',10.90,150,1,1,'2026-02-11 08:46:06','2026-02-11 08:46:06'),(13,15,'BUR015-150',9.90,150,1,1,'2026-02-11 08:46:06','2026-02-11 08:46:06'),(14,16,'BUR016-150',11.90,150,1,1,'2026-02-11 08:46:06','2026-02-11 08:46:06'),(15,18,'BUR018-150',9.90,150,1,1,'2026-02-11 08:46:06','2026-02-11 08:46:06'),(16,19,'BUR019-150',9.50,150,1,1,'2026-02-11 08:46:06','2026-02-11 08:46:06'),(17,20,'BUR020-150',12.90,150,1,1,'2026-02-11 08:46:06','2026-02-11 08:46:06'),(32,1,'BUR001-250',11.90,250,0,1,'2026-02-11 08:46:09','2026-02-11 08:46:09'),(33,2,'BUR002-250',14.90,250,0,1,'2026-02-11 08:46:09','2026-02-11 08:46:09'),(34,3,'BUR003-250',13.50,250,0,1,'2026-02-11 08:46:09','2026-02-11 08:46:09'),(35,4,'BUR004-250',12.90,250,0,1,'2026-02-11 08:46:09','2026-02-11 08:46:09'),(36,5,'BUR005-250',13.90,250,0,1,'2026-02-11 08:46:09','2026-02-11 08:46:09'),(37,8,'BUR008-250',14.50,250,0,1,'2026-02-11 08:46:09','2026-02-11 08:46:09'),(38,9,'BUR009-250',13.90,250,0,1,'2026-02-11 08:46:09','2026-02-11 08:46:09'),(39,10,'BUR010-250',11.50,250,0,1,'2026-02-11 08:46:09','2026-02-11 08:46:09'),(40,11,'BUR011-250',11.90,250,0,1,'2026-02-11 08:46:09','2026-02-11 08:46:09'),(41,12,'BUR012-250',13.90,250,0,1,'2026-02-11 08:46:09','2026-02-11 08:46:09'),(42,13,'BUR013-250',12.90,250,0,1,'2026-02-11 08:46:09','2026-02-11 08:46:09'),(43,14,'BUR014-250',13.90,250,0,1,'2026-02-11 08:46:09','2026-02-11 08:46:09'),(44,15,'BUR015-250',12.90,250,0,1,'2026-02-11 08:46:09','2026-02-11 08:46:09'),(45,16,'BUR016-250',14.90,250,0,1,'2026-02-11 08:46:09','2026-02-11 08:46:09'),(46,18,'BUR018-250',12.90,250,0,1,'2026-02-11 08:46:09','2026-02-11 08:46:09'),(47,19,'BUR019-250',12.50,250,0,1,'2026-02-11 08:46:09','2026-02-11 08:46:09'),(48,20,'BUR020-250',15.90,250,0,1,'2026-02-11 08:46:09','2026-02-11 08:46:09'),(63,6,'BUR006-150',9.50,150,1,1,'2026-02-11 08:46:14','2026-02-11 08:46:14'),(64,7,'BUR007-150',9.90,150,1,1,'2026-02-11 08:46:14','2026-02-11 08:46:14'),(66,17,'BUR017-350',16.90,350,1,1,'2026-02-11 08:46:19','2026-02-11 08:46:19');
/*!40000 ALTER TABLE `product_variant` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-20  6:24:56
