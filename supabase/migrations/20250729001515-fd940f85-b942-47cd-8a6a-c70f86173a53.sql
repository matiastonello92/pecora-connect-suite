-- Update kitchen_products table to replace translation keys with actual English product names

UPDATE public.kitchen_products SET name = 'Burrata' WHERE name = 'products.burrata';
UPDATE public.kitchen_products SET name = 'Buffalo Mozzarella' WHERE name = 'products.buffalo_mozzarella';
UPDATE public.kitchen_products SET name = 'Pizza Mozzarella' WHERE name = 'products.pizza_mozzarella';
UPDATE public.kitchen_products SET name = 'Goat Cheese' WHERE name = 'products.goat_cheese';
UPDATE public.kitchen_products SET name = 'Grana Padano 1/8' WHERE name = 'products.grana_padano_eighth';
UPDATE public.kitchen_products SET name = 'Grana Padano Shavings' WHERE name = 'products.grana_padano_shavings';
UPDATE public.kitchen_products SET name = 'Comté' WHERE name = 'products.comte';
UPDATE public.kitchen_products SET name = 'Taleggio' WHERE name = 'products.taleggio';
UPDATE public.kitchen_products SET name = 'Gorgonzola' WHERE name = 'products.gorgonzola';
UPDATE public.kitchen_products SET name = 'Truffle Pecorino' WHERE name = 'products.truffle_pecorino';
UPDATE public.kitchen_products SET name = 'Primo Sale' WHERE name = 'products.primo_sale';
UPDATE public.kitchen_products SET name = 'Mascarpone' WHERE name = 'products.mascarpone';
UPDATE public.kitchen_products SET name = 'Ricotta' WHERE name = 'products.ricotta';
UPDATE public.kitchen_products SET name = 'Butter' WHERE name = 'products.butter';
UPDATE public.kitchen_products SET name = 'Cream' WHERE name = 'products.cream';
UPDATE public.kitchen_products SET name = 'Alberti Cream' WHERE name = 'products.alberti_cream';
UPDATE public.kitchen_products SET name = 'Milk' WHERE name = 'products.milk';

-- Meats and cold cuts
UPDATE public.kitchen_products SET name = 'White Ham' WHERE name = 'products.white_ham';
UPDATE public.kitchen_products SET name = 'Parma Ham' WHERE name = 'products.parma_ham';
UPDATE public.kitchen_products SET name = 'Spicy Spianata' WHERE name = 'products.spicy_spianata';
UPDATE public.kitchen_products SET name = 'Mortadella' WHERE name = 'products.mortadella';
UPDATE public.kitchen_products SET name = 'Speck' WHERE name = 'products.speck';
UPDATE public.kitchen_products SET name = 'Bresaola' WHERE name = 'products.bresaola';
UPDATE public.kitchen_products SET name = 'Veal' WHERE name = 'products.veal';

-- Fish
UPDATE public.kitchen_products SET name = 'Tuna Pizzeria' WHERE name = 'products.tuna_pizzeria';
UPDATE public.kitchen_products SET name = 'Tuna Kitchen' WHERE name = 'products.tuna_kitchen';
UPDATE public.kitchen_products SET name = 'Anchovies' WHERE name = 'products.anchovies';

-- Spices and seasonings
UPDATE public.kitchen_products SET name = 'Basil' WHERE name = 'products.basil';
UPDATE public.kitchen_products SET name = 'Oregano' WHERE name = 'products.oregano';
UPDATE public.kitchen_products SET name = 'Pepper' WHERE name = 'products.pepper';
UPDATE public.kitchen_products SET name = 'Salt' WHERE name = 'products.salt';
UPDATE public.kitchen_products SET name = 'Red Chili' WHERE name = 'products.red_chili';
UPDATE public.kitchen_products SET name = 'Mint' WHERE name = 'products.mint';
UPDATE public.kitchen_products SET name = 'Sugar' WHERE name = 'products.sugar';
UPDATE public.kitchen_products SET name = 'Eggs' WHERE name = 'products.eggs';
UPDATE public.kitchen_products SET name = 'Dijon Mustard' WHERE name = 'products.dijon_mustard';

-- Preserves, oils and pickles
UPDATE public.kitchen_products SET name = 'Artichokes' WHERE name = 'products.artichokes';
UPDATE public.kitchen_products SET name = 'Sun-dried Tomatoes' WHERE name = 'products.sun_dried_tomatoes';
UPDATE public.kitchen_products SET name = 'Caper Flowers' WHERE name = 'products.caper_flowers';
UPDATE public.kitchen_products SET name = 'Pizza Olives' WHERE name = 'products.pizza_olives';
UPDATE public.kitchen_products SET name = 'Extra Virgin Olive Oil' WHERE name = 'products.olive_oil';
UPDATE public.kitchen_products SET name = 'Pistachio Oil' WHERE name = 'products.pistachio_oil';
UPDATE public.kitchen_products SET name = 'Balsamic Vinegar' WHERE name = 'products.balsamic_vinegar';
UPDATE public.kitchen_products SET name = 'White Balsamic Vinegar' WHERE name = 'products.white_balsamic_vinegar';
UPDATE public.kitchen_products SET name = 'Sherry Vinegar' WHERE name = 'products.sherry_vinegar';
UPDATE public.kitchen_products SET name = 'Small Capers' WHERE name = 'products.small_capers';

-- Nuts
UPDATE public.kitchen_products SET name = 'Pine Nuts' WHERE name = 'products.pine_nuts';
UPDATE public.kitchen_products SET name = 'Almonds' WHERE name = 'products.almonds';
UPDATE public.kitchen_products SET name = 'Hazelnuts' WHERE name = 'products.hazelnuts';
UPDATE public.kitchen_products SET name = 'Hazelnut Cream' WHERE name = 'products.hazelnut_cream';
UPDATE public.kitchen_products SET name = 'Pistachios' WHERE name = 'products.pistachios';

-- Fresh fruits and vegetables
UPDATE public.kitchen_products SET name = 'Salad' WHERE name = 'products.salad';
UPDATE public.kitchen_products SET name = 'Rocket' WHERE name = 'products.rocket';
UPDATE public.kitchen_products SET name = 'Lemon' WHERE name = 'products.lemon';
UPDATE public.kitchen_products SET name = 'Orange' WHERE name = 'products.orange';
UPDATE public.kitchen_products SET name = 'Beef Heart Tomato' WHERE name = 'products.beef_heart_tomato';
UPDATE public.kitchen_products SET name = 'Cherry Tomato' WHERE name = 'products.cherry_tomato';
UPDATE public.kitchen_products SET name = 'Yellow Pepper' WHERE name = 'products.yellow_pepper';
UPDATE public.kitchen_products SET name = 'Red Pepper' WHERE name = 'products.red_pepper';
UPDATE public.kitchen_products SET name = 'Zucchini' WHERE name = 'products.zucchini';
UPDATE public.kitchen_products SET name = 'Eggplants' WHERE name = 'products.eggplants';
UPDATE public.kitchen_products SET name = 'Yellow Onion' WHERE name = 'products.yellow_onion';
UPDATE public.kitchen_products SET name = 'Red Onion' WHERE name = 'products.red_onion';
UPDATE public.kitchen_products SET name = 'Garlic' WHERE name = 'products.garlic';
UPDATE public.kitchen_products SET name = 'Cucumber' WHERE name = 'products.cucumber';
UPDATE public.kitchen_products SET name = 'Mushroom' WHERE name = 'products.mushroom';

-- Flours
UPDATE public.kitchen_products SET name = 'Type 00 Flour' WHERE name = 'products.type_00_flour';
UPDATE public.kitchen_products SET name = 'Stone-ground Flour' WHERE name = 'products.stone_ground_flour';
UPDATE public.kitchen_products SET name = 'Chickpea Flour' WHERE name = 'products.chickpea_flour';

-- Fruits
UPDATE public.kitchen_products SET name = 'Peaches' WHERE name = 'products.peaches';