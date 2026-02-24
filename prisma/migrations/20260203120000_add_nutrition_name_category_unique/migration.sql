-- Déduplication préalable : on conserve la ligne avec l'id le plus faible
DELETE n1
FROM `Nutrition` n1
JOIN `Nutrition` n2
  ON n1.`name` = n2.`name`
 AND n1.`category` = n2.`category`
 AND n1.`id` > n2.`id`;

-- CreateIndex
CREATE UNIQUE INDEX `Nutrition_name_category_key`
  ON `Nutrition`(`name`, `category`);
