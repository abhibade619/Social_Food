SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'visited_restaurants';

SELECT * FROM visited_restaurants LIMIT 1;
