INSERT INTO wanted_criminals (name, nickname, reward, last_lat, last_lon, last_location_note, difficulty, armed, has_crew, escape_master) VALUES
  ('Vex Morrow',   'Black Comet',  25000, 34.05,  -118.24, NULL,                         8, true,  true,  true),
  (NULL,           'The Ghost',    50000, NULL,   NULL,    'Last seen near Titan station', 10, true,  false, true),
  ('Ilya Kross',   'Iron Jaw',      7500, 51.50,  -0.12,   NULL,                         5, true,  true,  false),
  ('Mara Quill',   'Silk',          3000, 35.68,  139.69,  NULL,                         3, false, false, true),
  (NULL,           'Dust Devil',    1200, NULL,   NULL,    'Mars colony, sector 7',       2, false, false, false),
  ('Rho Daken',    'Void Shark',   15000, -33.86, 151.21,  NULL,                         7, true,  true,  false);

INSERT INTO hunt_logs (criminal_id, success, notes) VALUES
  (1, false, 'Target escaped through an asteroid field.'),
  (1, false, 'Ambushed at the docking bay, lost the trail.'),
  (2, false, 'Only a hologram was found at the location.'),
  (3, true,  'Captured after a short chase on Europa.'),
  (3, false, 'Crew interfered, target slipped away.'),
  (4, true,  'Caught at the spaceport customs.'),
  (4, false, 'Escaped via cargo shuttle.'),
  (5, true,  'Surrendered without a fight.'),
  (6, false, 'Heavily armed escort, retreated.'),
  (6, true,  'Captured while refueling at the outer ring.'),
  (1, true,  'Finally cornered in a derelict freighter.');
