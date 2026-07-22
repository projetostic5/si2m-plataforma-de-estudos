/*
# Populate topics table with subtopics derived from question content

1. Purpose
   The `topics` table was empty (0 rows). No question had a `topic_id` set.
   This migration creates one subtopic per question (84 total), derived from
   analyzing the clinical scenario of each question. Each subtopic belongs
   to its question's `theme_id` (parent theme).

2. Changes
   - Inserts 84 rows into `topics` (id, theme_id, name).
   - Updates `questions.topic_id` to link each question to its new subtopic.

3. Security
   - No RLS policy changes. `topics` already has RLS enabled.
   - No new tables or columns.

4. Notes
   - Subtopic names are clinical descriptors (e.g., "PEP apos acidente
     percutaneo de alto risco") derived from each question's content.
   - For themes with 2 questions, each question gets a distinct subtopic
     that differentiates the specific clinical scenario.
*/

INSERT INTO topics (id, theme_id, name) VALUES
('a0000001-0000-0000-0000-000000000001', 'f9fce66a-4141-46fa-96c1-fe83c2c926fc', 'Identificacao do genero da serpente e indicacao de soro anticrotalico'),
('a0000002-0000-0000-0000-000000000002', '0cb7d32f-b41d-4b7c-8944-18cb1a44c6ba', 'Diagnostico clinico em veterinario (zoonose ocupacional)'),
('a0000003-0000-0000-0000-000000000003', '870377b2-7748-4d78-b5c4-330c27cdc50c', 'Manejo da interacao Dolutegravir e Rifampicina'),
('a0000004-0000-0000-0000-000000000004', '9cb5081a-01d5-4254-b19e-bfb16c89f5bb', 'SIRI em neurotoxoplasmose: hipotese e conduta'),
('a0000005-0000-0000-0000-000000000005', '9cb5081a-01d5-4254-b19e-bfb16c89f5bb', 'SIRI em tuberculose pulmonar: diagnostico'),
('a0000006-0000-0000-0000-000000000006', 'b4a6d055-2690-4d65-8e5b-3b311ab26dd5', 'Classificacao de dengue com sinais de alarme e conduta imediata'),
('a0000007-0000-0000-0000-000000000007', 'e4996730-870e-4abb-be2d-74dbb8600d48', 'Interpretacao de plaquetopenia estavel e conduta ambulatorial'),
('a0000008-0000-0000-0000-000000000008', 'f3721327-ca9c-40c8-b375-094838acf792', 'Diagnostico etiologico de cardiomiopatia chagasica cronica'),
('a0000009-0000-0000-0000-000000000009', '6ec997b3-31d8-4492-98b4-89e90af0880d', 'Orientacao inicial em gastroenterite aguda sem desidratacao'),
('a000000a-0000-0000-0000-00000000000a', 'ebf12675-b31b-4358-824d-3dcf4d2eccc0', 'Complicacoes da caxumba em homens pos-puberes'),
('a000000b-0000-0000-0000-00000000000b', '975e6c81-38fa-4ed0-8d88-c4a31ea9f8ce', 'Identificacao do agente etiologico do eritema infeccioso (parvovirus B19)'),
('a000000c-0000-0000-0000-00000000000c', '5292268c-45b1-4f5a-ad6d-6fecd699f3b1', 'Diagnostico clinico e tratamento da escarlatina'),
('a000000d-0000-0000-0000-00000000000d', '9e0b209b-a871-4cfd-9f39-0013d9086b81', 'Diagnostico clinico da roseola infantil (HHV-6)'),
('a000000e-0000-0000-0000-00000000000e', 'c59e4397-ec40-4a88-9530-3c8537466a43', 'Diagnostico e prevencao de neuralgia pos-herpetica'),
('a000000f-0000-0000-0000-00000000000f', 'd0d74795-5c77-4e9a-91d8-3f4835d5c2a8', 'Diagnostico diferencial de mononucleose infecciosa'),
('a0000010-0000-0000-0000-000000000010', 'aa6e38a3-e2ba-4dc4-9902-c2d07733dfcd', 'Diagnostico clinico da rubeola (linfadenopatia retroauricular)'),
('a0000011-0000-0000-0000-000000000011', 'bd658b13-a696-4631-8be0-7a5ee2043df7', 'Diagnostico clinico do sarampo e sinais de Koplik'),
('a0000012-0000-0000-0000-000000000012', '9e206655-f5cc-4716-8b4c-c71df83836e3', 'Profilaxia antitetanica em ferimento corto-contuso (esquema desconhecido)'),
('a0000013-0000-0000-0000-000000000013', '4adbdbb1-1d89-4b43-9f53-e3b7ce532145', 'Diagnostico e manejo de contatos na escabiose'),
('a0000014-0000-0000-0000-000000000014', 'c605e8c5-1ab7-41f0-a68d-8dfb124da1d8', 'Tratamento da endocardite por MSSA (oxacilina sensivel)'),
('a0000015-0000-0000-0000-000000000015', '3a2573e8-7f5f-432f-9bae-da43587a4525', 'Diagnostico histopatologico da esquistossomose (granulomas periovulares)'),
('a0000016-0000-0000-0000-000000000016', '2c99783e-a015-4dd1-8631-e77d5660cc08', 'Forma grave de febre amarela: diagnostico clinico'),
('a0000017-0000-0000-0000-000000000017', '089fb94e-c9b6-41cd-8b72-b57afb49b704', 'Proximo passo na investigacao de febre de origem indeterminada'),
('a0000018-0000-0000-0000-000000000018', '65afceae-6cfe-4a07-8b1b-64cc10575ec5', 'Diagnostico clinico da hanseniase tuberculoide (hipoestesia e espessamento neural)'),
('a0000019-0000-0000-0000-000000000019', '7ea98c3c-e97a-4125-8e8a-f6aae4ccd9bf', 'Interpretacao sorologica da hepatite B aguda'),
('a000001a-0000-0000-0000-00000000001a', '9fd62522-4c44-484e-8d49-bba7835a51f6', 'Profilaxia de reativacao do HBV antes de anti-TNF (Anti-HBc positivo)'),
('a000001b-0000-0000-0000-00000000001b', '8e706739-d989-4ddd-ba8a-cbbef460da48', 'Esquema de primeira linha com DAA para hepatite C (genotipo 1)'),
('a000001c-0000-0000-0000-00000000001c', '27b3424e-30ee-4ab5-9d7c-b86a80172644', 'Profilaxia pos-exposicao sexual para hepatite B (nao vacinado)'),
('a000001d-0000-0000-0000-00000000001d', '30240b65-da71-4877-9c59-328e73228b8f', 'Diagnostico e epidemiologia da histoplasmose (exposicao a galinheiro)'),
('a000001e-0000-0000-0000-00000000001e', '81586c8b-c7f4-48fc-887d-f1aaa029dd19', 'Investigacao de falha virologica do HIV (genotipagem)'),
('a000001f-0000-0000-0000-00000000001f', '7c905567-e6ea-4601-a126-0b3e7e2ce50b', 'Diagnostico da sindrome retroviral aguda (teste negativo inicial)'),
('a0000020-0000-0000-0000-000000000020', 'db3c4d1e-9f1a-4b22-a967-3a2765633a23', 'Inicio de TARV na gestacao (profilaxia da transmissao vertical)'),
('a0000021-0000-0000-0000-000000000021', '9ae9b9bb-e869-4132-b292-9001c68616ec', 'Diagnostico e tratamento empirico da neurotoxoplasmose (lesoes anelares)'),
('a0000022-0000-0000-0000-000000000022', '6b82d51c-581d-4e31-a9ea-d59c8e66587f', 'Profilaxia da transmissao vertical do HIV no recem-nascido (CV materna detectavel)'),
('a0000023-0000-0000-0000-000000000023', '1eac33c0-1860-4ca4-9a0b-9eeb415061b2', 'PEP apos acidente percutaneo de alto risco (agulha contaminada)'),
('a0000024-0000-0000-0000-000000000024', '1eac33c0-1860-4ca4-9a0b-9eeb415061b2', 'PEP apos exposicao sexual anal desprotegida (parceiro status desconhecido)'),
('a0000025-0000-0000-0000-000000000025', '0d4c8819-29f1-413c-a832-5e8f3a2ba0ce', 'Indicacao de PrEP para HSH (multiplos parceiros, uso inconsistente de preservativos)'),
('a0000026-0000-0000-0000-000000000026', 'cff15e46-c804-4f47-9572-752c3c0e5f98', 'Terapia de resgate para HIV com resistencia extensa (genotipagem)'),
('a0000027-0000-0000-0000-000000000027', '870c0e4d-cf08-4053-976d-c2d73306b906', 'Manejo de atrasos vacinais na infancia (esquema catch-up)'),
('a0000028-0000-0000-0000-000000000028', '10b6b243-6266-46f0-a887-5ebff678ba02', 'Manejo de eventos adversos pos-vacinacao (reacao local da pentavalente)'),
('a0000029-0000-0000-0000-000000000029', 'ac01aa6a-9435-451a-841a-815793767325', 'Recomendacoes vacinais para viajante ao Sudeste Asiatico'),
('a000002a-0000-0000-0000-00000000002a', 'ec46f082-d01e-493b-a3f2-c495b3cf5a69', 'Vacina triplice viral e alergia ao ovo (falsa contraindicacao)'),
('a000002b-0000-0000-0000-00000000002b', '0fd8e074-7495-47d7-870f-8cb3330b9c66', 'Vacinacao contra febre amarela em paciente com HIV (CD4 adequado)'),
('a000002c-0000-0000-0000-00000000002c', '8f744a55-a1bf-4c90-873e-76a2506a1cdf', 'Manejo de suscetibilidade a rubeola na gestacao (vacinacao no puerperio)'),
('a000002d-0000-0000-0000-00000000002d', '195aecb3-1e4f-4cdc-b93e-6a2cf35d2aa3', 'Recomendacao de vacina pneumococica conjugada apos VPP23 (adulto com comorbidades)'),
('a000002e-0000-0000-0000-00000000002e', '3847dc45-66c4-40b4-a954-b909a70a0c8f', 'Contraindicacao de vacina de virus vivo em uso de infliximabe'),
('a000002f-0000-0000-0000-00000000002f', 'fdefd19c-5e21-4e1c-bab2-47fbdcde77ba', 'Efeito rebanho da VPC20 na saude coletiva'),
('a0000030-0000-0000-0000-000000000030', '91393ab6-c9a9-414e-b50d-fcd64834de35', 'Profilaxia pos-exposicao a varicela em profissional de saude (IgG negativo)'),
('a0000031-0000-0000-0000-000000000031', '7f6f4bdd-faac-4f38-b9f6-7d486df259f0', 'Diagnostico e tratamento do impetigo nao bolhoso (lesoes melicericas)'),
('a0000032-0000-0000-0000-000000000032', '537690c7-5f4a-492d-aaa7-7310e4694d02', 'Tratamento empirico de cistite aguda nao complicada em mulher jovem'),
('a0000033-0000-0000-0000-000000000033', '5d499ad2-18db-4209-8e90-081ee7a12374', 'Diagnostico e conduta inicial da colangite aguda (triade de Charcot)'),
('a0000034-0000-0000-0000-000000000034', 'b166b657-4dcf-46af-a571-2ae270eb21a9', 'Diagnostico da infeccao por MAC em AIDS (CD4 baixo, fosfatase alcalina elevada)'),
('a0000035-0000-0000-0000-000000000035', '702c0f0e-9f50-45c1-a04c-3aff2c620360', 'Diagnostico e tratamento da neurocriptococose (tinta da China positiva)'),
('a0000036-0000-0000-0000-000000000036', 'fe530339-c3e5-4ca5-8a23-4a68f76752ee', 'Tratamento da pneumonia por Pneumocystis jirovecii (transplantado renal)'),
('a0000037-0000-0000-0000-000000000037', '9de9620a-4d32-4e4c-b011-1f01b0d686d0', 'Profilaxia primaria de infeccoes oportunistas em HIV (CD4 180)'),
('a0000038-0000-0000-0000-000000000038', '19ab5039-4052-4545-8ed1-03c662c4df86', 'Antibioticoterapia empirica para osteomielite em pe diabetico'),
('a0000039-0000-0000-0000-000000000039', '7eaada85-0de0-4c08-961c-8f7f62f320fa', 'Pneumonia bacteriana secundaria a influenza (piora apos melhora inicial)'),
('a000003a-0000-0000-0000-00000000003a', '26afa290-ae17-495f-ac1c-fe78c305ef90', 'Diagnostico e tratamento do cancro mole (Haemophilus ducreyi)'),
('a000003b-0000-0000-0000-00000000003b', '20e7f489-e66e-4d8e-9d94-c1e7ba51dcc4', 'Diagnostico clinico da donovanose (ulceras granulomatosas indolores)'),
('a000003c-0000-0000-0000-00000000003c', '0489b18f-fefb-47a6-8dd2-c811f8410991', 'Diagnostico clinico do linfogranuloma venereo (sinal do sulco)'),
('a000003d-0000-0000-0000-00000000003d', 'fd34412d-fb88-40db-abca-583dff47db38', 'Diagnostico clinico do calazar (hepatoesplenomegalia e pancitopenia)'),
('a000003e-0000-0000-0000-00000000003e', '4c327c29-d760-4bfe-8c98-9f517c3540b3', 'Diagnostico clinico e epidemiologico da leptospirose (sufusao conjuntival)'),
('a000003f-0000-0000-0000-00000000003f', 'ed48b9a5-ad67-41e2-9b4a-71aaf32adfd2', 'Doenca de Weil: forma grave da leptospirose (IRA e hemorragia)'),
('a0000040-0000-0000-0000-000000000040', '1e68682e-cc76-4968-9057-902beb31a27a', 'Diagnostico laboratorial da malaria (esquema de picos febris)'),
('a0000041-0000-0000-0000-000000000041', 'b2d175f9-1b95-47c5-b8cd-8565a615eccb', 'Diagnostico e tratamento da meningite por meningococo (diplococos GN)'),
('a0000042-0000-0000-0000-000000000042', 'f2915739-3572-49e7-b168-a16f0e1d9695', 'Diagnostico da paracoccidioidomicose (padrao asa de borboleta e mucosa oral)'),
('a0000043-0000-0000-0000-000000000043', 'a31acd58-e127-4aae-ae29-92ce8b1ffc67', 'Manejo de empiema pleural (derrame complicado: drenagem mandatoria)'),
('a0000044-0000-0000-0000-000000000044', 'e0ea7405-11fa-4a9c-8d4e-dda66ca200b1', 'Profilaxia da raiva apos mordida de morcego (nao vacinado)'),
('a0000045-0000-0000-0000-000000000045', 'e0ea7405-11fa-4a9c-8d4e-dda66ca200b1', 'Profilaxia da raiva apos mordida de cao de rua (animal nao observavel)'),
('a0000046-0000-0000-0000-000000000046', '4a85dd2b-047a-4b44-b836-0df2f52e05dc', 'Antibioticoterapia empirica no choque septico de foco urinario'),
('a0000047-0000-0000-0000-000000000047', 'f7b867b7-73cd-40c2-ab44-7df5ca895470', 'Diagnostico e tratamento da sifilis congenita (periostite e rinite)'),
('a0000048-0000-0000-0000-000000000048', 'a9b2aae7-e44e-4eca-967b-3138bdf0192b', 'Interpretacao do VDRL pos-tratamento (queda de titulo 1:32 para 1:8)'),
('a0000049-0000-0000-0000-000000000049', '858a89cc-eb05-4d25-bc98-4f9dfa96efd2', 'Tratamento da sifilis latente na gestacao (prevencao da forma congenita)'),
('a000004a-0000-0000-0000-00000000004a', '6ec32224-6af4-4514-a598-66dd2a1c0088', 'Interpretacao do PPD em contato domiciliar com BCG (8 mm)'),
('a000004b-0000-0000-0000-00000000004b', '6ec32224-6af4-4514-a598-66dd2a1c0088', 'Interpretacao do PPD em profissional de saude (12 mm, sem BCG)'),
('a000004c-0000-0000-0000-00000000004c', '2c0e6a67-5845-43f4-9d6d-f6db464ab06a', 'Hiperuricemia e artrite por pirazinamida: diagnostico e conduta'),
('a000004d-0000-0000-0000-00000000004d', '3804aeb9-3c0f-4d1c-96aa-80bb425399d9', 'Neurite optica por etambutol: suspensao imediata'),
('a000004e-0000-0000-0000-00000000004e', 'd35ceadd-6a96-4e7f-81ff-f9a1b17a0c31', 'Interacao rifampicina e anticoncepcional oral: orientacao contraceptiva'),
('a000004f-0000-0000-0000-00000000004f', 'b9c4f9a8-40e0-4fc3-82f4-1e70d7e20dfc', 'Baciloscopia positiva no 2o mes: suspeita de falha terapeutica'),
('a0000050-0000-0000-0000-000000000050', '3b13fd1f-49f0-4eeb-9128-3cbd55f3baee', 'Diagnostico e tratamento da meningoencefalite tuberculosa'),
('a0000051-0000-0000-0000-000000000051', 'd188467c-85bd-4b35-abc3-81895e6a40fe', 'Resistencia a rifampicina no TRM-TB: manejo da TB-MDR'),
('a0000052-0000-0000-0000-000000000052', 'b2756d3c-b06f-48b1-949f-fa502db89850', 'Esquema basico de tratamento da TB pulmonar (RIPE)'),
('a0000053-0000-0000-0000-000000000053', '767f4827-e8a9-4eb7-9c0c-b91f4679edda', 'Hiperuricemia por pirazinamida no tratamento da TB: identificacao do farmaco'),
('a0000054-0000-0000-0000-000000000054', '70bc7a7d-4e8e-4ac0-a7bd-66f00576b2ee', 'Falha terapeutica da TB: baciloscopia positiva apos 2 meses de RIPE')
ON CONFLICT DO NOTHING;

UPDATE questions SET topic_id = 'a0000001-0000-0000-0000-000000000001' WHERE id = '3be99c68-939a-4286-9712-2b46af81dbe5';
UPDATE questions SET topic_id = 'a0000002-0000-0000-0000-000000000002' WHERE id = '1af5bc71-b998-45cb-a4c5-a7d697ac926d';
UPDATE questions SET topic_id = 'a0000003-0000-0000-0000-000000000003' WHERE id = '6a5d470c-b3d3-46d7-bcfd-d086b54add28';
UPDATE questions SET topic_id = 'a0000004-0000-0000-0000-000000000004' WHERE id = '0f1229eb-49f2-42cc-957a-6dc404f24bfe';
UPDATE questions SET topic_id = 'a0000005-0000-0000-0000-000000000005' WHERE id = '54b2e3c8-326b-42d2-bff6-7ad99d99cb75';
UPDATE questions SET topic_id = 'a0000006-0000-0000-0000-000000000006' WHERE id = '1ce41fe9-332c-4b25-8c9b-c89122cc5043';
UPDATE questions SET topic_id = 'a0000007-0000-0000-0000-000000000007' WHERE id = 'eb87e0d1-70d8-4f52-92ad-03d77794922c';
UPDATE questions SET topic_id = 'a0000008-0000-0000-0000-000000000008' WHERE id = '42f81812-9da5-44c1-b0de-03f5659e9c67';
UPDATE questions SET topic_id = 'a0000009-0000-0000-0000-000000000009' WHERE id = 'ea884aaa-b230-4b17-8dbb-7c92b876bb96';
UPDATE questions SET topic_id = 'a000000a-0000-0000-0000-00000000000a' WHERE id = 'e9bf478a-9890-485c-aa32-a9ec7941aef6';
UPDATE questions SET topic_id = 'a000000b-0000-0000-0000-00000000000b' WHERE id = '9a78ba90-827c-4a7a-9f81-4761f5684ea6';
UPDATE questions SET topic_id = 'a000000c-0000-0000-0000-00000000000c' WHERE id = 'c51007b8-2571-49c4-8bcb-c5d3535ab84c';
UPDATE questions SET topic_id = 'a000000d-0000-0000-0000-00000000000d' WHERE id = '04dfac77-be0b-430c-95ed-353e04c20f75';
UPDATE questions SET topic_id = 'a000000e-0000-0000-0000-00000000000e' WHERE id = '92e54f53-98aa-414c-8add-79716a16ef00';
UPDATE questions SET topic_id = 'a000000f-0000-0000-0000-00000000000f' WHERE id = '5c23d1c4-b1e6-4f2b-b5a4-5f2a4847c0cd';
UPDATE questions SET topic_id = 'a0000010-0000-0000-0000-000000000010' WHERE id = 'efdd26a6-1912-4773-93f3-3dd254f4034c';
UPDATE questions SET topic_id = 'a0000011-0000-0000-0000-000000000011' WHERE id = 'f50cb9ee-ccdb-4bba-a71d-23f9ec86d6e4';
UPDATE questions SET topic_id = 'a0000012-0000-0000-0000-000000000012' WHERE id = '31d48b25-44ea-4d7e-905c-6cfc2ec76e41';
UPDATE questions SET topic_id = 'a0000013-0000-0000-0000-000000000013' WHERE id = '3c7eb203-d917-4fb2-8dad-787bbbd51f2e';
UPDATE questions SET topic_id = 'a0000014-0000-0000-0000-000000000014' WHERE id = '1b4ed28d-11e3-417e-9d19-576adc98420d';
UPDATE questions SET topic_id = 'a0000015-0000-0000-0000-000000000015' WHERE id = '234dc1e1-bafd-4bd8-beb4-52c6dfb4e230';
UPDATE questions SET topic_id = 'a0000016-0000-0000-0000-000000000016' WHERE id = '623f3132-1d41-43c2-bb83-272095efd761';
UPDATE questions SET topic_id = 'a0000017-0000-0000-0000-000000000017' WHERE id = '93531a49-576a-4ca1-ac1d-8619535fc816';
UPDATE questions SET topic_id = 'a0000018-0000-0000-0000-000000000018' WHERE id = 'd8ce691a-e026-4f24-b430-903ee6637cde';
UPDATE questions SET topic_id = 'a0000019-0000-0000-0000-000000000019' WHERE id = '0cfe34bb-cf86-4c69-92da-811f9faf873a';
UPDATE questions SET topic_id = 'a000001a-0000-0000-0000-00000000001a' WHERE id = '14a012c3-b272-4603-bbdb-42a9a1c0f5f8';
UPDATE questions SET topic_id = 'a000001b-0000-0000-0000-00000000001b' WHERE id = '27cde2bf-023b-4139-b9f4-356a362392eb';
UPDATE questions SET topic_id = 'a000001c-0000-0000-0000-00000000001c' WHERE id = 'b2f37f12-e40f-4e48-9ead-0db354172289';
UPDATE questions SET topic_id = 'a000001d-0000-0000-0000-00000000001d' WHERE id = '2419e1d8-8d88-4f01-aa9e-f3684a6dddd7';
UPDATE questions SET topic_id = 'a000001e-0000-0000-0000-00000000001e' WHERE id = 'a7bad839-0769-4c08-b28c-2fa021e53f87';
UPDATE questions SET topic_id = 'a000001f-0000-0000-0000-00000000001f' WHERE id = '663d8049-3f53-461f-aab2-f10b1516b7eb';
UPDATE questions SET topic_id = 'a0000020-0000-0000-0000-000000000020' WHERE id = '2a987abb-9d8a-4398-9d78-c1a902ecfa07';
UPDATE questions SET topic_id = 'a0000021-0000-0000-0000-000000000021' WHERE id = '7ad6a220-469c-4313-872e-1245e2457340';
UPDATE questions SET topic_id = 'a0000022-0000-0000-0000-000000000022' WHERE id = 'd7769530-14b6-4783-90f1-893313d5ea36';
UPDATE questions SET topic_id = 'a0000023-0000-0000-0000-000000000023' WHERE id = 'eb8b15a8-3314-48ee-8ca4-b4c396bd0067';
UPDATE questions SET topic_id = 'a0000024-0000-0000-0000-000000000024' WHERE id = 'f12b0345-3397-4bf2-a4c6-97c302abcde4';
UPDATE questions SET topic_id = 'a0000025-0000-0000-0000-000000000025' WHERE id = 'a650b537-c1f0-45b4-8b7d-890eae286501';
UPDATE questions SET topic_id = 'a0000026-0000-0000-0000-000000000026' WHERE id = '9c83aee9-d8dd-4129-856c-f4dd32bb2d16';
UPDATE questions SET topic_id = 'a0000027-0000-0000-0000-000000000027' WHERE id = '25936be0-edcc-4c20-a0ea-ef45b78bfb5d';
UPDATE questions SET topic_id = 'a0000028-0000-0000-0000-000000000028' WHERE id = '640e6cd2-23d6-4c95-aa9f-4661a162d32f';
UPDATE questions SET topic_id = 'a0000029-0000-0000-0000-000000000029' WHERE id = '25ad4f5f-195b-4340-92d1-7ec1d8441e85';
UPDATE questions SET topic_id = 'a000002a-0000-0000-0000-00000000002a' WHERE id = 'd21b6f40-f605-453a-9052-9b263b094bf5';
UPDATE questions SET topic_id = 'a000002b-0000-0000-0000-00000000002b' WHERE id = '697c99a8-99c8-4b40-a94e-674e5e670e42';
UPDATE questions SET topic_id = 'a000002c-0000-0000-0000-00000000002c' WHERE id = 'd3fcf7e3-e99d-4eec-a933-f09d8d1f73a3';
UPDATE questions SET topic_id = 'a000002d-0000-0000-0000-00000000002d' WHERE id = 'ee1a6030-e8d9-4b10-9772-9df33417903a';
UPDATE questions SET topic_id = 'a000002e-0000-0000-0000-00000000002e' WHERE id = 'd5f6ec95-ddc1-4eae-bfe7-c9e30c777879';
UPDATE questions SET topic_id = 'a000002f-0000-0000-0000-00000000002f' WHERE id = '16f16b82-7143-4d99-bb0b-48d937a99831';
UPDATE questions SET topic_id = 'a0000030-0000-0000-0000-000000000030' WHERE id = '2c9eae76-1cc2-4cba-8c75-d8370bef6a8e';
UPDATE questions SET topic_id = 'a0000031-0000-0000-0000-000000000031' WHERE id = '12b1bd67-a2b0-4d79-ae03-94186232783e';
UPDATE questions SET topic_id = 'a0000032-0000-0000-0000-000000000032' WHERE id = 'c80d8f16-d522-4ad8-8525-794f7990bdec';
UPDATE questions SET topic_id = 'a0000033-0000-0000-0000-000000000033' WHERE id = '7c19fe9e-534d-4675-86b8-6554431663bb';
UPDATE questions SET topic_id = 'a0000034-0000-0000-0000-000000000034' WHERE id = 'a2260884-f535-47a7-b5ea-a06d9cfe7c2a';
UPDATE questions SET topic_id = 'a0000035-0000-0000-0000-000000000035' WHERE id = '119eed33-1727-40ad-b3d9-6fa59c644499';
UPDATE questions SET topic_id = 'a0000036-0000-0000-0000-000000000036' WHERE id = '0735289a-5af5-4586-b4bc-d451f9b8ae47';
UPDATE questions SET topic_id = 'a0000037-0000-0000-0000-000000000037' WHERE id = '0c14bf68-2fe8-4196-8fea-91b4f2310140';
UPDATE questions SET topic_id = 'a0000038-0000-0000-0000-000000000038' WHERE id = '899ac66b-4cfb-467e-bbaa-a0c24838c2bf';
UPDATE questions SET topic_id = 'a0000039-0000-0000-0000-000000000039' WHERE id = 'df589baa-aa27-46d6-9dd9-dcbb60add67a';
UPDATE questions SET topic_id = 'a000003a-0000-0000-0000-00000000003a' WHERE id = '580797dc-262c-44ff-bab1-a6142fd63441';
UPDATE questions SET topic_id = 'a000003b-0000-0000-0000-00000000003b' WHERE id = 'dab8afae-293c-4f7e-9201-efa719f7f287';
UPDATE questions SET topic_id = 'a000003c-0000-0000-0000-00000000003c' WHERE id = '891e83a6-fa22-4562-bfd8-a52501231e92';
UPDATE questions SET topic_id = 'a000003d-0000-0000-0000-00000000003d' WHERE id = 'd62c9565-ba30-4a65-8b9d-26a1877aee12';
UPDATE questions SET topic_id = 'a000003e-0000-0000-0000-00000000003e' WHERE id = '8b5db9f5-dc40-4ab0-9a03-1d05d8119a98';
UPDATE questions SET topic_id = 'a000003f-0000-0000-0000-00000000003f' WHERE id = '2169b903-1e80-41cc-9b97-b4397a254805';
UPDATE questions SET topic_id = 'a0000040-0000-0000-0000-000000000040' WHERE id = '12aefb20-1e3d-4bfa-925b-0c73be64006d';
UPDATE questions SET topic_id = 'a0000041-0000-0000-0000-000000000041' WHERE id = '17738696-3fbe-4728-8d40-d35a8e189918';
UPDATE questions SET topic_id = 'a0000042-0000-0000-0000-000000000042' WHERE id = '0e367169-20c2-4f03-815d-33ac708d82f8';
UPDATE questions SET topic_id = 'a0000043-0000-0000-0000-000000000043' WHERE id = '744a89c8-ffcd-49ab-b8f0-12930eb0ef19';
UPDATE questions SET topic_id = 'a0000044-0000-0000-0000-000000000044' WHERE id = '19b834d8-12c2-453f-bca7-0326f3f165df';
UPDATE questions SET topic_id = 'a0000045-0000-0000-0000-000000000045' WHERE id = 'a1f5ac01-2102-49be-8f47-69efba83cb63';
UPDATE questions SET topic_id = 'a0000046-0000-0000-0000-000000000046' WHERE id = 'fb52dded-0d66-48e7-b0f4-bbbdfc56a2d3';
UPDATE questions SET topic_id = 'a0000047-0000-0000-0000-000000000047' WHERE id = '6db40f68-aed2-4aed-aca7-6e2116b2c4c1';
UPDATE questions SET topic_id = 'a0000048-0000-0000-0000-000000000048' WHERE id = '1f58142d-9be6-42ff-a11a-183c21452da7';
UPDATE questions SET topic_id = 'a0000049-0000-0000-0000-000000000049' WHERE id = 'bbd7c0b1-7a86-4871-9866-250ba44281d4';
UPDATE questions SET topic_id = 'a000004a-0000-0000-0000-00000000004a' WHERE id = '10d77773-ea3f-409a-b181-8f05e5460cc9';
UPDATE questions SET topic_id = 'a000004b-0000-0000-0000-00000000004b' WHERE id = '970a9fdc-c0af-4fe0-93c1-797959a28272';
UPDATE questions SET topic_id = 'a000004c-0000-0000-0000-00000000004c' WHERE id = 'b63a2889-94cf-4c46-97fc-59162472a67f';
UPDATE questions SET topic_id = 'a000004d-0000-0000-0000-00000000004d' WHERE id = 'fedaccbd-147e-4ca4-9724-03c550e453cc';
UPDATE questions SET topic_id = 'a000004e-0000-0000-0000-00000000004e' WHERE id = '213b082d-d1ff-4a72-97ef-5dc6300f838d';
UPDATE questions SET topic_id = 'a000004f-0000-0000-0000-00000000004f' WHERE id = 'd110fcd9-8b9a-4658-94ee-20cc54363e0b';
UPDATE questions SET topic_id = 'a0000050-0000-0000-0000-000000000050' WHERE id = '774ae82a-be23-42be-9886-a6c6ffa8b84a';
UPDATE questions SET topic_id = 'a0000051-0000-0000-0000-000000000051' WHERE id = '626599df-f3a8-42a7-bd9a-f7e8d1d7847f';
UPDATE questions SET topic_id = 'a0000052-0000-0000-0000-000000000052' WHERE id = '4cccd878-2980-46ee-a406-bfb6b5a2f885';
UPDATE questions SET topic_id = 'a0000053-0000-0000-0000-000000000053' WHERE id = '3efb747c-1feb-4bdc-9228-4eb26727b51a';
UPDATE questions SET topic_id = 'a0000054-0000-0000-0000-000000000054' WHERE id = '278c5ff2-4f0d-4206-a363-c51a3aa9e153';
