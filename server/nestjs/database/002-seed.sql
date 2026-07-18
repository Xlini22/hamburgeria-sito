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
INSERT INTO `allergens` (`id`, `name`, `description`) VALUES (1,'Glutine','Cereali contenenti glutine'),(2,'Latte','Latte e derivati'),(3,'Uova','Uova e prodotti a base di uova'),(4,'Soia','Soia e derivati'),(5,'Senape','Senape e derivati'),(6,'Sesamo','Semi di sesamo'),(7,'Frutta a Guscio','Mandorle, nocciole, noci ecc'),(8,'Arachidi','Arachidi e derivati');
/*!40000 ALTER TABLE `allergens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` (`id`, `name`, `slug`, `description`, `is_active`, `created_at`, `updated_at`) VALUES (1,'Burger Classici','burger-classici','I grandi classici della tradizione americana',1,'2026-02-11 08:40:37','2026-02-11 08:40:37'),(2,'Special Burger','special-burger','Ricette gourmet e stagionali',1,'2026-02-11 08:40:37','2026-02-11 08:40:37'),(3,'Vegetariani','vegetariani','Burger senza carne',1,'2026-02-11 08:40:37','2026-02-11 08:40:37'),(4,'Vegani','vegani','Proposte 100% vegetali',1,'2026-02-11 08:40:37','2026-02-11 08:40:37'),(5,'Gluten Free','gluten-free','Burger senza glutine',1,'2026-02-11 08:40:37','2026-02-11 08:40:37'),(6,'Menù Completi','menu-completi','Burger + patatine + bibita',1,'2026-02-11 08:40:37','2026-02-11 08:40:37'),(7,'Limited Edition','limited-edition','Edizioni limitate e speciali',1,'2026-02-11 08:40:37','2026-02-11 08:40:37'),(11,'nome 99','cat-99',NULL,0,NULL,NULL),(12,'nome 99','cat-99',NULL,0,NULL,NULL);
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
-- Dumping data for table `ingredient_allergen`
--

LOCK TABLES `ingredient_allergen` WRITE;
/*!40000 ALTER TABLE `ingredient_allergen` DISABLE KEYS */;
INSERT INTO `ingredient_allergen` (`ingredient_id`, `allergen_id`) VALUES (1,1),(1,3),(5,4),(6,2),(15,5);
/*!40000 ALTER TABLE `ingredient_allergen` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `ingredients`
--

LOCK TABLES `ingredients` WRITE;
/*!40000 ALTER TABLE `ingredients` DISABLE KEYS */;
INSERT INTO `ingredients` (`id`, `name`, `description`, `is_active`) VALUES (1,'Pane Brioche','Pane morbido con burro e uova',1),(2,'Pane Senza Glutine','Pane certificato gluten free',1),(3,'Hamburger Manzo 150gr','Carne bovina 100% italiana',1),(4,'Hamburger Manzo 250gr','Carne bovina 100% italiana',1),(5,'Burger Vegetale','Burger a base di proteine vegetali',1),(6,'Cheddar','Formaggio cheddar fuso',1),(7,'Bacon','Pancetta croccante',1),(8,'Insalata','Lattuga fresca',1),(9,'Pomodoro','Pomodoro fresco a fette',1),(10,'Cipolla','Cipolla fresca',1),(11,'Cipolla Caramellata','Cipolla stufata con zucchero di canna',1),(12,'Salsa BBQ','Salsa barbecue affumicata',1),(13,'Maionese','Maionese classica',1),(14,'Ketchup','Salsa ketchup',1),(15,'Senape','Senape delicata',1),(16,'Jalapeños','Peperoncini piccanti messicani',1),(17,'Uovo','Uovo fresco alla piastra',1),(18,'Avocado','Fette di avocado fresco',1);
/*!40000 ALTER TABLE `ingredients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `log_data`
--

LOCK TABLES `log_data` WRITE;
/*!40000 ALTER TABLE `log_data` DISABLE KEYS */;
INSERT INTO `log_data` (`created_at`, `id`) VALUES ('2026-03-22 14:34:53',0),('2026-06-13 15:38:15',0),('2026-06-13 15:41:13',0),('2026-06-15 07:58:11',0),('2026-06-15 07:59:04',0);
/*!40000 ALTER TABLE `log_data` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` (`id`, `timestamp`, `name`) VALUES (1,1776627040822,'Init1776627040822'),(2,1776627117511,'Init1776627117511');
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `product_category`
--

LOCK TABLES `product_category` WRITE;
/*!40000 ALTER TABLE `product_category` DISABLE KEYS */;
INSERT INTO `product_category` (`product_id`, `category_id`) VALUES (1,1),(2,1),(3,1),(3,2),(4,1),(4,2),(5,1),(5,2),(6,1),(6,3),(7,1),(7,4),(8,1),(8,2),(9,1),(9,2),(10,1),(11,1),(12,1),(13,1),(14,1),(14,5),(15,1),(16,1),(16,2),(17,1),(17,2),(18,1),(18,2),(19,1),(20,1),(20,7);
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
INSERT INTO `product_images` (`id`, `product_id`, `image_path`, `alt_text`, `sort_order`, `created_at`, `updated_at`) VALUES (1,1,'images/burgers/classico-italiano.jpg','Classico Italiano',1,'2026-02-11 08:59:12','2026-02-11 08:59:12'),(2,2,'images/burgers/doppio-bbq.jpg','Doppio BBQ',1,'2026-02-11 08:59:12','2026-02-11 08:59:12'),(3,3,'images/burgers/esplosione-formaggi.jpg','Esplosione di Formaggi',1,'2026-02-11 08:59:12','2026-02-11 08:59:12'),(4,4,'images/burgers/messicano-piccante.jpg','Messicano Piccante',1,'2026-02-11 08:59:12','2026-02-11 08:59:12'),(5,5,'images/burgers/gourmet-tricolore.jpg','Gourmet Tricolore',1,'2026-02-11 08:59:12','2026-02-11 08:59:12'),(6,6,'images/burgers/vegetariano-verde.jpg','Vegetariano Verde',1,'2026-02-11 08:59:12','2026-02-11 08:59:12'),(7,7,'images/burgers/vegano-mediterraneo.jpg','Vegano Mediterraneo',1,'2026-02-11 08:59:12','2026-02-11 08:59:12'),(8,8,'images/burgers/amante-del-bacon.jpg','Amante del Bacon',1,'2026-02-11 08:59:12','2026-02-11 08:59:12'),(9,9,'images/burgers/affumicato-americano.jpg','Affumicato Americano',1,'2026-02-11 08:59:12','2026-02-11 08:59:12'),(10,10,'images/burgers/tradizionale-americano.jpg','Tradizionale Americano',1,'2026-02-11 08:59:12','2026-02-11 08:59:12'),(11,11,'images/burgers/croccante-di-pollo.jpg','Croccante di Pollo',1,'2026-02-11 08:59:12','2026-02-11 08:59:12'),(12,12,'images/burgers/diavolo-rosso.jpg','Diavolo Rosso',1,'2026-02-11 08:59:12','2026-02-11 08:59:12'),(13,13,'images/burgers/keto-protein.jpg','Keto Protein',1,'2026-02-11 08:59:12','2026-02-11 08:59:12'),(14,14,'images/burgers/senza-glutine-speciale.jpg','Senza Glutine Speciale',1,'2026-02-11 08:59:12','2026-02-11 08:59:12'),(15,15,'images/burgers/smash-halal.jpg','Smash Halal',1,'2026-02-11 08:59:12','2026-02-11 08:59:12'),(16,16,'images/burgers/avocado-deluxe.jpg','Avocado Deluxe',1,'2026-02-11 08:59:12','2026-02-11 08:59:12'),(17,17,'images/burgers/torre-tripla.jpg','Torre Tripla',1,'2026-02-11 08:59:12','2026-02-11 08:59:12'),(18,18,'images/burgers/street-bbq.jpg','Street BBQ',1,'2026-02-11 08:59:12','2026-02-11 08:59:12'),(19,19,'images/burgers/fit-proteico.jpg','Fit Proteico',1,'2026-02-11 08:59:12','2026-02-11 08:59:12'),(20,20,'images/burgers/black-edition-limitata.jpg','Black Edition Limitata',1,'2026-02-11 08:59:12','2026-02-11 08:59:12');
/*!40000 ALTER TABLE `product_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `product_ingredient`
--

LOCK TABLES `product_ingredient` WRITE;
/*!40000 ALTER TABLE `product_ingredient` DISABLE KEYS */;
INSERT INTO `product_ingredient` (`product_id`, `ingredient_id`, `is_optional`) VALUES (1,1,0),(1,3,0),(1,6,0),(1,8,0),(1,9,0),(2,1,0),(2,3,0),(2,6,0),(2,8,0),(2,9,0),(3,1,0),(3,3,0),(3,6,0),(3,8,0),(3,9,0),(4,1,0),(4,3,0),(4,6,0),(4,8,0),(4,9,0),(4,12,0),(4,16,0),(5,1,0),(5,3,0),(5,6,0),(5,8,0),(5,9,0),(6,1,0),(6,5,0),(6,8,0),(6,9,0),(6,18,0),(7,5,0),(7,8,0),(7,9,0),(8,1,0),(8,3,0),(8,6,0),(8,7,0),(8,8,0),(8,9,0),(9,1,0),(9,3,0),(9,6,0),(9,8,0),(9,9,0),(10,1,0),(10,3,0),(10,6,0),(10,8,0),(10,9,0),(11,1,0),(11,3,0),(11,6,0),(11,8,0),(11,9,0),(12,1,0),(12,3,0),(12,6,0),(12,8,0),(12,9,0),(13,1,0),(13,3,0),(13,6,0),(13,8,0),(13,9,0),(14,2,0),(14,3,0),(14,6,0),(14,8,0),(14,9,0),(15,1,0),(15,3,0),(15,6,0),(15,8,0),(15,9,0),(16,1,0),(16,3,0),(16,6,0),(16,8,0),(16,9,0),(17,1,0),(17,3,0),(17,6,0),(17,8,0),(17,9,0),(18,1,0),(18,3,0),(18,6,0),(18,8,0),(18,9,0),(19,1,0),(19,3,0),(19,6,0),(19,8,0),(19,9,0),(20,1,0),(20,3,0),(20,6,0),(20,8,0),(20,9,0);
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

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` (`id`, `name`, `slug`, `description`, `base_price`, `sku`, `is_active`, `created_at`, `updated_at`, `sale_price`) VALUES (1,'Classico Italiano','classico-italiano','Hamburger tradizionale con cheddar e salsa burger',8.90,'BUR001',1,'2026-02-11 08:45:19','2026-02-11 08:45:19',0.00),(2,'Doppio BBQ','doppio-bbq','Doppio hamburger con bacon croccante e salsa BBQ',11.90,'BUR002',1,'2026-02-11 08:45:19','2026-02-11 08:45:19',0.00),(3,'Esplosione di Formaggi','esplosione-formaggi','Triplo formaggio filante',10.50,'BUR003',1,'2026-02-11 08:45:19','2026-02-11 08:45:19',0.00),(4,'Messicano Piccante','messicano-piccante','Jalapeños e salsa piccante',9.90,'BUR004',1,'2026-02-11 08:45:19','2026-02-11 08:45:19',0.00),(5,'Gourmet Tricolore','gourmet-tricolore','Mozzarella, pomodoro e rucola',10.90,'BUR005',1,'2026-02-11 08:45:19','2026-02-11 08:45:19',0.00),(6,'Vegetariano Verde','vegetariano-verde','Burger vegetale con avocado',9.50,'BUR006',1,'2026-02-11 08:45:19','2026-02-11 08:45:19',0.00),(7,'Vegano Mediterraneo','vegano-mediterraneo','Burger vegano con verdure grigliate',9.90,'BUR007',1,'2026-02-11 08:45:19','2026-02-11 08:45:19',0.00),(8,'Amante del Bacon','amante-del-bacon','Extra bacon croccante',11.50,'BUR008',1,'2026-02-11 08:45:19','2026-02-11 08:45:19',0.00),(9,'Affumicato Americano','affumicato-americano','Salsa BBQ affumicata',10.90,'BUR009',1,'2026-02-11 08:45:19','2026-02-11 08:45:19',0.00),(10,'Tradizionale Americano','tradizionale-americano','Pane brioche e manzo 100%',8.50,'BUR010',1,'2026-02-11 08:45:19','2026-02-11 08:45:19',0.00),(11,'Croccante di Pollo','croccante-di-pollo','Petto di pollo panato e croccante',8.90,'BUR011',1,'2026-02-11 08:45:19','2026-02-11 08:45:19',0.00),(12,'Diavolo Rosso','diavolo-rosso','Piccantezza estrema',10.90,'BUR012',1,'2026-02-11 08:45:19','2026-02-11 08:45:19',0.00),(13,'Keto Protein','keto-protein','Senza pane, low carb',9.90,'BUR013',1,'2026-02-11 08:45:19','2026-02-11 08:45:19',0.00),(14,'Senza Glutine Speciale','senza-glutine-speciale','Pane certificato gluten free',10.90,'BUR014',1,'2026-02-11 08:45:19','2026-02-11 08:45:19',0.00),(15,'Smash Halal','smash-halal','Carne certificata Halal',9.90,'BUR015',1,'2026-02-11 08:45:19','2026-02-11 08:45:19',0.00),(16,'Avocado Deluxe','avocado-deluxe','Avocado fresco e cheddar premium',11.90,'BUR016',1,'2026-02-11 08:45:19','2026-02-11 08:45:19',0.00),(17,'Torre Tripla','torre-tripla','Tre hamburger e triplo formaggio',14.90,'BUR017',1,'2026-02-11 08:45:19','2026-02-11 08:45:19',0.00),(18,'Street BBQ','street-bbq','Stile street food affumicato',9.90,'BUR018',1,'2026-02-11 08:45:19','2026-02-11 08:45:19',0.00),(19,'Fit Proteico','fit-proteico','Hamburger leggero e proteico',9.50,'BUR019',1,'2026-02-11 08:45:19','2026-02-11 08:45:19',0.00),(20,'Black Edition Limitata','black-edition-limitata','Pane nero al carbone',12.90,'BUR020',1,'2026-02-11 08:45:19','2026-02-11 08:45:19',0.00),(21,'Double Cheese with Chili','double-cheese-with-chili','Hamburger piccante con formaggio',13.20,'BUR21',1,NULL,NULL,0.00),(22,'aaaa','ddd','adada',1.00,NULL,1,NULL,NULL,0.00),(23,'vvv b da canc123','myprod','desc',13.20,NULL,1,NULL,NULL,0.00),(24,'vvv b da canc123','myprod','desc',13.20,NULL,1,NULL,NULL,0.00),(25,'vvv b da canc123','myprod','desc',13.20,NULL,1,NULL,NULL,0.00),(26,'vvv b da canc123','myprod','desc',13.20,NULL,1,NULL,NULL,0.00);
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` (`id`, `username`, `password`, `refresh_token`, `created_at`, `updated_at`) VALUES (1,'admin','$2a$12$OrlLfbDmP0V4XSHuXWq4Ru/D026D00r2uQLs0x3hyySQVo6O4vqQq','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJpYXQiOjE3ODE5Njg2NTYsImV4cCI6MTc4MjU3MzQ1Nn0.5eTPmbFaDtJOgTs7J2kFR6meDo0UtFjppQkoqX1_S9w','2026-06-20 14:55:04','2026-06-30 08:07:11');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-17 13:22:50
