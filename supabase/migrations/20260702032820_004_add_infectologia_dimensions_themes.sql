-- Criar dimensões para Infectologia
INSERT INTO dimensions (discipline_id, name, description) VALUES
('5a52368a-0339-4bc3-b060-8f301706ae5b', 'Doenças Infecciosas e Parasitárias', 'Doenças causadas por agentes infecciosos e parasitas'),
('5a52368a-0339-4bc3-b060-8f301706ae5b', 'Antimicrobianos', 'Antibióticos, antivirais, antifúngicos e antiparasitários'),
('5a52368a-0339-4bc3-b060-8f301706ae5b', 'Imunizações', 'Vacinas e imunoprofilaxia'),
('5a52368a-0339-4bc3-b060-8f301706ae5b', 'Infecções Hospitalares', 'Infecções relacionadas à assistência à saúde'),
('5a52368a-0339-4bc3-b060-8f301706ae5b', 'Doenças Emergentes', 'Doenças infecciosas emergentes e reemergentes'),
('5a52368a-0339-4bc3-b060-8f301706ae5b', 'Zoonoses', 'Doenças transmitidas por animais');

-- Criar temas para cada dimensão
-- Doenças Infecciosas e Parasitárias
INSERT INTO themes (dimension_id, name) VALUES
((SELECT id FROM dimensions WHERE discipline_id = '5a52368a-0339-4bc3-b060-8f301706ae5b' AND name = 'Doenças Infecciosas e Parasitárias'), 'Dengue'),
((SELECT id FROM dimensions WHERE discipline_id = '5a52368a-0339-4bc3-b060-8f301706ae5b' AND name = 'Doenças Infecciosas e Parasitárias'), 'Tuberculose'),
((SELECT id FROM dimensions WHERE discipline_id = '5a52368a-0339-4bc3-b060-8f301706ae5b' AND name = 'Doenças Infecciosas e Parasitárias'), 'HIV/AIDS'),
((SELECT id FROM dimensions WHERE discipline_id = '5a52368a-0339-4bc3-b060-8f301706ae5b' AND name = 'Doenças Infecciosas e Parasitárias'), 'Hepatites Virais'),
((SELECT id FROM dimensions WHERE discipline_id = '5a52368a-0339-4bc3-b060-8f301706ae5b' AND name = 'Doenças Infecciosas e Parasitárias'), 'Malaria'),
((SELECT id FROM dimensions WHERE discipline_id = '5a52368a-0339-4bc3-b060-8f301706ae5b' AND name = 'Doenças Infecciosas e Parasitárias'), 'Doença de Chagas'),
((SELECT id FROM dimensions WHERE discipline_id = '5a52368a-0339-4bc3-b060-8f301706ae5b' AND name = 'Doenças Infecciosas e Parasitárias'), 'Leishmaniose'),
((SELECT id FROM dimensions WHERE discipline_id = '5a52368a-0339-4bc3-b060-8f301706ae5b' AND name = 'Doenças Infecciosas e Parasitárias'), 'Esquistossomose'),
((SELECT id FROM dimensions WHERE discipline_id = '5a52368a-0339-4bc3-b060-8f301706ae5b' AND name = 'Doenças Infecciosas e Parasitárias'), 'Febre Amarela'),
((SELECT id FROM dimensions WHERE discipline_id = '5a52368a-0339-4bc3-b060-8f301706ae5b' AND name = 'Doenças Infecciosas e Parasitárias'), 'Leptospirose'),
((SELECT id FROM dimensions WHERE discipline_id = '5a52368a-0339-4bc3-b060-8f301706ae5b' AND name = 'Doenças Infecciosas e Parasitárias'), 'Meningites'),
((SELECT id FROM dimensions WHERE discipline_id = '5a52368a-0339-4bc3-b060-8f301706ae5b' AND name = 'Doenças Infecciosas e Parasitárias'), 'Pneumonias'),
((SELECT id FROM dimensions WHERE discipline_id = '5a52368a-0339-4bc3-b060-8f301706ae5b' AND name = 'Doenças Infecciosas e Parasitárias'), 'Infecção Urinária'),
((SELECT id FROM dimensions WHERE discipline_id = '5a52368a-0339-4bc3-b060-8f301706ae5b' AND name = 'Doenças Infecciosas e Parasitárias'), 'Septicemia'),
((SELECT id FROM dimensions WHERE discipline_id = '5a52368a-0339-4bc3-b060-8f301706ae5b' AND name = 'Doenças Infecciosas e Parasitárias'), 'Endocardite Infecciosa'),
((SELECT id FROM dimensions WHERE discipline_id = '5a52368a-0339-4bc3-b060-8f301706ae5b' AND name = 'Doenças Infecciosas e Parasitárias'), 'Raiva'),
((SELECT id FROM dimensions WHERE discipline_id = '5a52368a-0339-4bc3-b060-8f301706ae5b' AND name = 'Doenças Infecciosas e Parasitárias'), 'Tétano'),
((SELECT id FROM dimensions WHERE discipline_id = '5a52368a-0339-4bc3-b060-8f301706ae5b' AND name = 'Doenças Infecciosas e Parasitárias'), 'Difteria'),
((SELECT id FROM dimensions WHERE discipline_id = '5a52368a-0339-4bc3-b060-8f301706ae5b' AND name = 'Doenças Infecciosas e Parasitárias'), 'Coqueluche'),
((SELECT id FROM dimensions WHERE discipline_id = '5a52368a-0339-4bc3-b060-8f301706ae5b' AND name = 'Doenças Infecciosas e Parasitárias'), 'Sarampo'),
((SELECT id FROM dimensions WHERE discipline_id = '5a52368a-0339-4bc3-b060-8f301706ae5b' AND name = 'Doenças Infecciosas e Parasitárias'), 'Rubéola'),
((SELECT id FROM dimensions WHERE discipline_id = '5a52368a-0339-4bc3-b060-8f301706ae5b' AND name = 'Doenças Infecciosas e Parasitárias'), 'Caxumba'),
((SELECT id FROM dimensions WHERE discipline_id = '5a52368a-0339-4bc3-b060-8f301706ae5b' AND name = 'Doenças Infecciosas e Parasitárias'), 'Varicela'),
((SELECT id FROM dimensions WHERE discipline_id = '5a52368a-0339-4bc3-b060-8f301706ae5b' AND name = 'Doenças Infecciosas e Parasitárias'), 'Influenza'),
((SELECT id FROM dimensions WHERE discipline_id = '5a52368a-0339-4bc3-b060-8f301706ae5b' AND name = 'Doenças Infecciosas e Parasitárias'), 'COVID-19');

-- Antimicrobianos
INSERT INTO themes (dimension_id, name) VALUES
((SELECT id FROM dimensions WHERE discipline_id = '5a52368a-0339-4bc3-b060-8f301706ae5b' AND name = 'Antimicrobianos'), 'Antibióticos'),
((SELECT id FROM dimensions WHERE discipline_id = '5a52368a-0339-4bc3-b060-8f301706ae5b' AND name = 'Antimicrobianos'), 'Antivirais'),
((SELECT id FROM dimensions WHERE discipline_id = '5a52368a-0339-4bc3-b060-8f301706ae5b' AND name = 'Antimicrobianos'), 'Antifúngicos'),
((SELECT id FROM dimensions WHERE discipline_id = '5a52368a-0339-4bc3-b060-8f301706ae5b' AND name = 'Antimicrobianos'), 'Antiparasitários'),
((SELECT id FROM dimensions WHERE discipline_id = '5a52368a-0339-4bc3-b060-8f301706ae5b' AND name = 'Antimicrobianos'), 'Resistência Bacteriana');

-- Imunizações
INSERT INTO themes (dimension_id, name) VALUES
((SELECT id FROM dimensions WHERE discipline_id = '5a52368a-0339-4bc3-b060-8f301706ae5b' AND name = 'Imunizações'), 'Calendário Vacinal'),
((SELECT id FROM dimensions WHERE discipline_id = '5a52368a-0339-4bc3-b060-8f301706ae5b' AND name = 'Imunizações'), 'Vacinas Bacterianas'),
((SELECT id FROM dimensions WHERE discipline_id = '5a52368a-0339-4bc3-b060-8f301706ae5b' AND name = 'Imunizações'), 'Vacinas Virais'),
((SELECT id FROM dimensions WHERE discipline_id = '5a52368a-0339-4bc3-b060-8f301706ae5b' AND name = 'Imunizações'), 'Imunoprofilaxia');

-- Infecções Hospitalares
INSERT INTO themes (dimension_id, name) VALUES
((SELECT id FROM dimensions WHERE discipline_id = '5a52368a-0339-4bc3-b060-8f301706ae5b' AND name = 'Infecções Hospitalares'), 'Infecção do Sítio Cirúrgico'),
((SELECT id FROM dimensions WHERE discipline_id = '5a52368a-0339-4bc3-b060-8f301706ae5b' AND name = 'Infecções Hospitalares'), 'Pneumonia Associada à Ventilação'),
((SELECT id FROM dimensions WHERE discipline_id = '5a52368a-0339-4bc3-b060-8f301706ae5b' AND name = 'Infecções Hospitalares'), 'Infecção de Corrente Sanguínea'),
((SELECT id FROM dimensions WHERE discipline_id = '5a52368a-0339-4bc3-b060-8f301706ae5b' AND name = 'Infecções Hospitalares'), 'Infecção Urinária Associada a Cateter'),
((SELECT id FROM dimensions WHERE discipline_id = '5a52368a-0339-4bc3-b060-8f301706ae5b' AND name = 'Infecções Hospitalares'), 'MRSA'),
((SELECT id FROM dimensions WHERE discipline_id = '5a52368a-0339-4bc3-b060-8f301706ae5b' AND name = 'Infecções Hospitalares'), 'Acinetobacter');

-- Doenças Emergentes
INSERT INTO themes (dimension_id, name) VALUES
((SELECT id FROM dimensions WHERE discipline_id = '5a52368a-0339-4bc3-b060-8f301706ae5b' AND name = 'Doenças Emergentes'), 'Arboviroses'),
((SELECT id FROM dimensions WHERE discipline_id = '5a52368a-0339-4bc3-b060-8f301706ae5b' AND name = 'Doenças Emergentes'), 'Pandemias'),
((SELECT id FROM dimensions WHERE discipline_id = '5a52368a-0339-4bc3-b060-8f301706ae5b' AND name = 'Doenças Emergentes'), 'Vigilância Epidemiológica');

-- Zoonoses
INSERT INTO themes (dimension_id, name) VALUES
((SELECT id FROM dimensions WHERE discipline_id = '5a52368a-0339-4bc3-b060-8f301706ae5b' AND name = 'Zoonoses'), 'Brucelose'),
((SELECT id FROM dimensions WHERE discipline_id = '5a52368a-0339-4bc3-b060-8f301706ae5b' AND name = 'Zoonoses'), 'Hantavirose'),
((SELECT id FROM dimensions WHERE discipline_id = '5a52368a-0339-4bc3-b060-8f301706ae5b' AND name = 'Zoonoses'), 'Toxoplasmose'),
((SELECT id FROM dimensions WHERE discipline_id = '5a52368a-0339-4bc3-b060-8f301706ae5b' AND name = 'Zoonoses'), 'Erisipeloide');
