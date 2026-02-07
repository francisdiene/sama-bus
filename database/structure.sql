CREATE DATABASE IF NOT EXISTS sama_bus_db;

USE sama_bus_db;

CREATE TABLE IF NOT EXISTS bus_positions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bus_id VARCHAR(50) NOT NULL,
    ligne_no VARCHAR(10) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    derniere_maj TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insère le bus test
INSERT INTO bus_positions (bus_id, ligne_no, latitude, longitude) 
VALUES ('DDD-121-01', '121', 20.7167, -19.4594);
UPDATE bus_positions 
SET latitude = 14.7167, 
    longitude = -17.4677 
WHERE ligne_no = '121';