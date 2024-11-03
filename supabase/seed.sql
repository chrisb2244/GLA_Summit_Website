SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', '343887db-f290-47dd-91b6-05a9d06bff3a', 'authenticated', 'authenticated', 'Mark12@test.email', '$2a$10$9stC9M/jkoGLuDj3owuvGOGfrxdgKlAEy4zJ3L3kSEBZiUOgT2sIO', '2022-10-20 15:05:08.842024+00', NULL, '', '2022-10-20 14:58:15.514761+00', '', NULL, '', '', NULL, '2022-10-20 15:05:08.842998+00', '{"provider": "email", "providers": ["email"]}', '{"lastname": "Ramsdale", "firstname": "Mark"}', NULL, '2022-10-20 14:58:15.599239+00', '2022-10-25 13:33:15.089234+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '35f8287d-8b9e-47f1-bc9e-afdacad6f32a', 'authenticated', 'authenticated', 'Anton4@test.email', '$2a$10$bqBf.nyCjAZ6wFsey.3lBeSD5Ltq8LPy5tpCBl5PhU05a7jJsYw7.', NULL, NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"lastname": "Sundqvist", "firstname": "Anton"}', false, '2022-04-15 12:47:17.606789+00', '2022-04-15 12:47:17.606796+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'cd331c15-4611-4c70-be54-096af5ccdf78', 'authenticated', 'authenticated', 'Sreejith19@test.email', '$2a$10$e5hAxrMR5ukbw4qeB8a/7es5/XXoBnrO90m2mDqqiVKpsBwvyvy2W', '2022-05-25 09:27:51.322878+00', NULL, '', '2022-05-25 09:27:35.465666+00', '', '2022-05-26 22:32:57.615693+00', '', '', NULL, '2022-05-26 22:33:19.227465+00', '{"provider": "email", "providers": ["email"]}', '{"lastname": "S", "firstname": "S"}', false, '2022-05-25 09:27:35.457789+00', '2022-05-26 22:33:19.229124+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'f3142ed8-c853-43e5-8383-c32ab5b964aa', 'authenticated', 'authenticated', 'Michael11@test.email', '$2a$10$l598ybfK4l/tPXKe6n3rQ.TB.nG4FfMFhqvuRvYrPgYdF/7BbLVkW', '2022-10-19 01:10:01.41009+00', NULL, '', '2022-10-19 01:09:13.187418+00', '', NULL, '', '', NULL, '2022-10-19 01:10:01.411338+00', '{"provider": "email", "providers": ["email"]}', '{"lastname": "Balzer", "firstname": "Michael"}', NULL, '2022-10-19 01:09:13.268845+00', '2022-10-27 07:41:46.328804+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '1a40f5c5-3bb2-4808-90ec-cbb10011d3df', 'authenticated', 'authenticated', 'Michal5@test.email', '$2a$10$otBMcdvNUj8/bH1CRmLQm.yTN.AoNIoZoKVRl8CYMeuAoB6gXW7Y6', '2022-06-07 13:16:57.311217+00', NULL, '', NULL, '8c7c12e9f9fd0f9c6a8dd316b234d2a61c8ae09406de32e5f01c2a36', '2022-11-01 20:23:36.205882+00', '', '', NULL, '2022-06-07 13:16:57.31212+00', '{"provider": "email", "providers": ["email"]}', '{"lastname": "Radziwon", "firstname": "Michal"}', false, '2022-04-15 12:47:17.805439+00', '2022-11-01 20:23:36.207867+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'ea1961e7-800e-4ba5-a4b8-bcfcf83b93e1', 'authenticated', 'authenticated', 'Enrique8@test.email', '$2a$10$9IuZrDrAJ7fRZJtSrDMMDeLlwXC6o/zZGopzPV4QlT4KX5Z3svxgS', '2022-09-20 22:08:23.744387+00', NULL, '', '2022-09-20 22:05:09.865316+00', '', '2022-10-10 17:47:45.72953+00', '', '', NULL, '2022-10-10 17:48:58.891503+00', '{"provider": "email", "providers": ["email"]}', '{"lastname": "Noe Arias", "firstname": "Enrique"}', NULL, '2022-09-20 22:05:09.949229+00', '2022-10-17 18:30:28.769471+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'e0083ca5-6bc7-4e8b-aaf0-ce6381d1d445', 'authenticated', 'authenticated', 'Alfredo13@test.email', '$2a$10$he4.lO9flanjTA1376aVC.uEE807QmZlsH3.jb19g1utT3HWwF2te', '2022-10-20 22:08:00.55384+00', NULL, '', '2022-10-20 21:51:48.756804+00', '', NULL, '', '', NULL, '2022-10-20 22:08:00.555003+00', '{"provider": "email", "providers": ["email"]}', '{"lastname": "Figueroa", "firstname": "Alfredo "}', NULL, '2022-10-20 21:51:48.838993+00', '2022-10-20 22:08:00.558613+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '6b4e3fe8-74d2-4ee4-aef9-58c1a05fd2a7', 'authenticated', 'authenticated', 'KeerthiVarman2@test.email', '$2a$10$GoY0qNiOGRKtVqgda52YXeTKHdPR/Pz25j6ITXe76O0DqFb5vlTVO', '2022-11-10 09:52:11.826437+00', NULL, '', '2022-11-10 09:04:23.296128+00', '', '2022-11-15 05:34:20.406892+00', '', '', NULL, '2022-11-15 05:34:48.789178+00', '{"provider": "email", "providers": ["email"]}', '{"lastname": "Nageshwaran", "firstname": "Keerthi Varman"}', NULL, '2022-11-10 09:04:23.37758+00', '2022-11-15 05:34:48.792128+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '9151f9ed-1654-4607-9d80-8887f5430556', 'authenticated', 'authenticated', 'Ricardo14@test.email', '$2a$10$yMfM7q6aT.6lIN4LCeNiDetznQfUycWXvAMhYMwLvXmbBRQOlbWuq', '2022-10-21 02:28:11.032793+00', NULL, '', '2022-10-21 02:27:27.315778+00', 'a8af327cc8b5a376202251c504b4d41c307c45ffb3320fa45bd9843f', '2024-03-28 18:04:57.064338+00', '', '', NULL, '2022-10-21 02:28:11.033714+00', '{"provider": "email", "providers": ["email"]}', '{"lastname": "Otake", "firstname": "Ricardo"}', NULL, '2022-10-21 02:27:27.403678+00', '2024-03-28 18:04:57.065977+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '9197afc4-322d-4c3c-ac65-4ae98825fa30', 'authenticated', 'authenticated', 'Matthieu10@test.email', '$2a$10$9r7b0AvkR2nLQ0WhkdyadO6T0D16vQu2LGGDbgrxc8M.hRwJXmBpq', '2022-10-18 11:45:20.392234+00', NULL, '', '2022-10-18 11:45:01.407984+00', '', NULL, '', '', NULL, '2022-10-18 11:45:20.393368+00', '{"provider": "email", "providers": ["email"]}', '{"lastname": "Poncet", "firstname": "Matthieu"}', NULL, '2022-10-18 11:45:01.489618+00', '2022-10-18 11:45:49.908988+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '9f3bf5d5-f663-4997-bf5e-a3c868292987', 'authenticated', 'authenticated', 'Maciej6@test.email', '$2a$10$6LVZ3srHTytj/U/RsAc48eF7KptwwjyqZtScpKjaywDjEQ9FFz542', '2022-10-17 14:31:34.212653+00', NULL, '', '2022-10-17 14:30:24.797859+00', '', NULL, '', '', NULL, '2022-10-17 14:31:34.213543+00', '{"provider": "email", "providers": ["email"]}', '{"lastname": "Kolosko", "firstname": "Maciej"}', NULL, '2022-10-17 14:30:24.879307+00', '2022-11-10 00:12:51.29929+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '9556bc08-b216-4263-b97e-cdcbce35ac16', 'authenticated', 'authenticated', 'Clay17@test.email', '$2a$10$fI97zkOhban5fHHYF95ZZuIHrg6cDG2UvlMus5kjUjj33yluU193O', '2022-10-21 13:42:52.389604+00', NULL, '', '2022-10-21 13:42:28.915191+00', '', '2022-11-15 03:22:50.162738+00', '', '', NULL, '2022-11-15 03:23:14.665767+00', '{"provider": "email", "providers": ["email"]}', '{"lastname": "Barbee", "firstname": "Clay"}', NULL, '2022-10-21 13:42:28.996747+00', '2022-11-15 03:23:14.668984+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '3a1dce05-2678-497f-bd30-584bb3a4c6c0', 'authenticated', 'authenticated', 'James31@test.email', '$2a$10$dyaVta9Gb9SmPi55lIr5Zu19FTJWuSiIugSHbwLAiU.H4d3304iue', '2022-09-01 10:04:44.856951+00', NULL, '', '2022-09-01 10:02:42.175565+00', '', '2024-03-19 07:01:57.519665+00', '', '', NULL, '2024-03-19 07:13:42.204561+00', '{"provider": "email", "providers": ["email"]}', '{"lastname": "McNally", "firstname": "James"}', false, '2022-09-01 10:02:42.261956+00', '2024-03-25 08:33:19.383855+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '22d95e65-8f2d-4735-87e8-005afc8c3323', 'authenticated', 'authenticated', 'Matthias0@test.email', '$2a$10$gsVxgo1BUQNAoOsxEhp4musuefpNVNQeIgnVsxSisxWisXcR4ER3e', '2022-08-30 17:04:24.114184+00', NULL, '', '2022-08-30 17:04:06.17876+00', '', '2024-03-08 13:37:13.455456+00', '', '', NULL, '2024-03-08 13:37:24.27883+00', '{"provider": "email", "providers": ["email"]}', '{"lastname": "Baudot", "firstname": "Matthias"}', false, '2022-08-30 17:04:06.264657+00', '2024-03-25 11:06:12.323298+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'e1f51a05-8854-444e-915d-b65d66994d05', 'authenticated', 'authenticated', 'Patrik7@test.email', '$2a$10$Q2y7FGzQp7tfUF5VT.5lHuzNDTR3k3.u4YJL.MRqxBm7kxVUfWrX6', '2022-10-05 07:00:50.145391+00', NULL, '', '2022-10-05 07:00:29.982307+00', '', '2024-03-11 11:58:30.273469+00', '', '', NULL, '2024-03-11 11:58:42.353353+00', '{"provider": "email", "providers": ["email"]}', '{"lastname": "Karandusovsky", "firstname": "Patrik"}', NULL, '2022-10-05 07:00:30.06408+00', '2024-03-27 13:33:24.013123+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '28786347-fdc5-4bb3-bbcf-166347523f78', 'authenticated', 'authenticated', 'Eric26@test.email', '$2a$10$TMTSwfnxSS1vzqeIVsOA8.Vzt7g/9Vk5Jih80rE1lf7RuzyPFfqXi', '2022-11-11 19:15:56.478255+00', NULL, '', NULL, '', '2022-11-14 19:30:56.760749+00', '', '', NULL, '2022-11-14 19:31:28.397375+00', '{"provider": "email", "providers": ["email"]}', '{"lastname": "Reffett", "firstname": "Eric"}', false, '2022-04-15 12:47:17.573653+00', '2022-11-14 19:31:28.400753+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '0eae4c37-4af5-4b92-ae90-615facddad49', 'authenticated', 'authenticated', 'Derrick32@test.email', '$2a$10$xfGr959ltdWWzrFDDoCtlus9uBkAHaBsCS7HrAFfpHMPLOJzxWeAG', '2024-02-28 04:52:12.064117+00', NULL, '', '2024-02-28 04:47:52.842457+00', '', '2024-03-08 23:46:33.221989+00', '', '', NULL, '2024-03-08 23:46:58.742032+00', '{"provider": "email", "providers": ["email"]}', '{"lastname": "Bommarito", "firstname": "Derrick"}', NULL, '2024-02-28 04:47:52.923827+00', '2024-03-22 22:58:33.476021+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '2b792f1d-5698-4d09-b507-0305831d9c18', 'authenticated', 'authenticated', 'Nancy21@test.email', '$2a$10$06yEt/LC5UeVYEZBRhzYKeFFs6A2/DK1FFilC6J5Jt4pD0IZIWwDe', '2022-10-19 17:30:44.776961+00', NULL, '', '2022-10-06 16:32:12.188066+00', '', '2022-10-25 04:04:21.199417+00', '', '', NULL, '2022-10-25 04:04:35.731657+00', '{"provider": "email", "providers": ["email"]}', '{"lastname": "Henson", "firstname": "Nancy"}', NULL, '2022-10-06 16:32:12.269617+00', '2023-09-07 00:35:34.324721+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'e35c59b6-3e66-4f61-bb03-163f5cea59aa', 'authenticated', 'authenticated', 'Peter9@test.email', '$2a$10$e0CK3COaSh2LUIDFjU.wVuL29CXuLcEINU3oQDGDPcLrm440K5PBG', '2022-10-27 19:07:08.905421+00', NULL, '', '2022-10-27 19:04:44.943716+00', '', NULL, '', '', NULL, '2022-10-27 19:07:08.906552+00', '{"provider": "email", "providers": ["email"]}', '{"lastname": "Foerster", "firstname": "Peter"}', NULL, '2022-10-27 19:04:45.025222+00', '2023-01-31 21:31:15.510551+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '2b298be5-ae99-492e-9edd-1349f1f783c4', 'authenticated', 'authenticated', 'Sam33@test.email', '$2a$10$nKGmlOempnLKX85cNWXbr.pm18dIY.tIKKuqZRKvSK5cLHW3jHtum', '2022-08-30 20:15:44.170992+00', NULL, '', NULL, '', '2024-03-09 04:31:34.688222+00', '', '', NULL, '2024-03-09 04:31:50.353579+00', '{"provider": "email", "providers": ["email"]}', '{"lastname": "Roundy", "firstname": "Sam"}', false, '2022-04-15 12:47:16.700803+00', '2024-03-25 18:50:52.984801+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '38e0c6d3-8996-4073-887b-6fb7e73979b3', 'authenticated', 'authenticated', 'Sairam18@test.email', '$2a$10$dilcYQ1WKcO/lCPjycQdbu.1meW61HKiOBGETkbR4KsFNCuGwY8hO', '2022-11-10 16:48:52.989604+00', NULL, '', '2022-11-10 09:04:38.98534+00', '', '2024-03-10 03:46:56.975546+00', '', '', NULL, '2024-03-10 03:47:24.369678+00', '{"provider": "email", "providers": ["email"]}', '{"lastname": "S", "firstname": " Sairam"}', NULL, '2022-11-10 09:04:39.067416+00', '2024-03-23 03:16:56.82098+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '215a93cc-4901-4338-b8c2-ccfc662f21c1', 'authenticated', 'authenticated', 'Muruganandhan3@test.email', '$2a$10$5GamFqUf5tJHX6kKP1wcW.KRaWrYpPKpsPstYBi9qBTAAyC7ojzu6', '2022-10-08 13:01:06.402649+00', NULL, '', NULL, '', '2024-03-11 09:29:34.19003+00', '', '', NULL, '2024-03-11 09:30:07.260892+00', '{"provider": "email", "providers": ["email"]}', '{"lastname": "Subramaniam", "firstname": "Muruganandhan"}', false, '2022-04-15 12:47:17.571713+00', '2024-03-11 13:03:36.76672+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '341b2c2b-adc2-4ae6-ae71-a473c78b4de7', 'authenticated', 'authenticated', 'Ricardo15@test.email', '$2a$10$Ogooyg.3mC73j/QDDlCffeTipwrhLhunuPgSCJS1ZphBUXNDuVTG.', '2022-10-21 02:28:03.510438+00', NULL, '', '2022-10-21 02:27:39.819194+00', '', '2024-03-28 18:05:05.415011+00', '', '', NULL, '2024-03-28 18:05:25.85236+00', '{"provider": "email", "providers": ["email"]}', '{"lastname": "Otake", "firstname": "Ricardo"}', NULL, '2022-10-21 02:27:39.900778+00', '2024-03-28 18:05:25.87144+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'cd64f560-306b-4de0-80a3-469eaac6b61e', 'authenticated', 'authenticated', 'Thyagu24@test.email', '$2a$10$QWmP7wicamjkluNa3rprHeGNU6KElkAeoDK9eGlJDpnJM2nFCj0Tq', '2024-02-23 05:45:23.524683+00', NULL, '', '2024-02-23 05:44:38.311357+00', '', '2024-03-10 13:33:07.758678+00', '', '', NULL, '2024-03-10 13:33:20.16548+00', '{"provider": "email", "providers": ["email"]}', '{"lastname": "Soundar", "firstname": "Thyagu"}', NULL, '2024-02-23 05:44:38.39348+00', '2024-03-25 04:11:24.820731+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'f9132cdb-daf3-4729-a2f4-f2f49bd190cf', 'authenticated', 'authenticated', 'Kamalakannan35@test.email', '$2a$10$VCLQVwZ1BipGKJv7RJ3GWOVMK4Se5EtMMoGVFlbILFXGjNfhL09KG', '2024-02-22 10:22:47.857873+00', NULL, '', '2024-02-22 10:22:14.194793+00', '', '2024-03-20 06:19:33.392942+00', '', '', NULL, '2024-03-20 06:20:25.228934+00', '{"provider": "email", "providers": ["email"]}', '{"lastname": "Rajan", "firstname": "Kamalakannan"}', NULL, '2024-02-22 10:22:14.276393+00', '2024-03-29 07:54:38.770769+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '35f03917-dd1c-4a4d-88c4-1cd3b8996d27', 'authenticated', 'authenticated', 'Karthik20@test.email', '$2a$10$3BXwvLCLsnG3zdxUomSraOVSzeXcfAO5.qXv9xvx3AtfOFklMtVxO', '2022-10-15 07:30:32.937349+00', NULL, '', NULL, '', '2024-03-21 19:25:36.024182+00', '', '', NULL, '2024-03-21 19:25:56.159163+00', '{"provider": "email", "providers": ["email"]}', '{"lastname": "Abiram", "firstname": "Karthik"}', false, '2022-04-15 12:47:17.57573+00', '2024-03-28 15:23:35.104271+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '0f6dd438-ed5e-4d6b-a89a-2c0a08dc3e9d', 'authenticated', 'authenticated', 'VaraPrasad16@test.email', '$2a$10$nK7wq.UHS95Gfdr3M4F1X.3MiwcS4bQGlFgj2nM9fKvlJz.wEUz1a', '2024-03-06 16:12:16.809155+00', NULL, '', '2024-03-06 16:11:22.466623+00', '', '2024-03-25 15:33:01.364197+00', '', '', NULL, '2024-03-25 15:35:23.972916+00', '{"provider": "email", "providers": ["email"]}', '{"lastname": "Adhepalli", "firstname": "Vara Prasad"}', NULL, '2024-03-06 16:11:22.550701+00', '2024-03-25 15:35:23.974727+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '4671cf60-ae64-46c0-b3a5-fc934cf1bd8a', 'authenticated', 'authenticated', 'Akshata29@test.email', '$2a$10$Yl4vB7.dJhHkyn20/pBLTeOFZ.k90SParCxamjYYe9zi95vOo3jOq', '2022-10-11 05:54:06.01079+00', NULL, '', '2022-10-11 05:53:53.015693+00', '', '2024-03-08 06:15:39.932867+00', '', '', NULL, '2024-03-08 06:15:57.904803+00', '{"provider": "email", "providers": ["email"]}', '{"lastname": "Nayak", "firstname": "Akshata"}', NULL, '2022-10-11 05:53:53.097119+00', '2024-03-26 13:14:00.278157+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'c16e01cb-c802-4fa9-b48a-f91bb787a264', 'authenticated', 'authenticated', 'William22@test.email', '$2a$10$AwzeFDbD8.wZFoNKhDmFAu4fbKo0ys1cNn.d086PUqLOPnu5AKg5u', '2023-11-25 16:43:30.114736+00', NULL, '', '2023-11-25 16:40:16.646747+00', '', '2024-03-07 23:01:23.199542+00', '', '', NULL, '2024-03-07 23:01:45.800432+00', '{"provider": "email", "providers": ["email"]}', '{"lastname": "Richards", "firstname": "William"}', NULL, '2023-11-25 16:40:16.75791+00', '2024-03-25 22:15:51.640676+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'c87226b4-564d-4fce-b8bc-d4f806b4f927', 'authenticated', 'authenticated', 'Quentin25@test.email', '$2a$10$J0imcjNLAFdjp5msvLR57OAfUEZNRUkhUurnAHJr9p.igKVLbOK.2', '2022-07-12 14:23:42.40883+00', NULL, '', NULL, '', '2024-03-25 05:08:48.087564+00', '', '', NULL, '2024-03-25 05:09:25.327253+00', '{"provider": "email", "providers": ["email"]}', '{"lastname": "Alldredge", "firstname": "Quentin"}', false, '2022-04-15 12:47:17.922912+00', '2024-03-25 05:09:25.32909+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '06ab35dd-6fcb-49a6-a85f-0b0bf9cbcc62', 'authenticated', 'authenticated', 'Jason34@test.email', '$2a$10$qpae.n71alPictKmZDU64eh2LXfE8kiaUD9ONGc8CJWpOELqpUY8a', '2024-03-05 18:51:41.046585+00', NULL, '', '2024-02-18 04:20:06.962681+00', '', '2024-03-05 18:52:13.203171+00', '', '', NULL, '2024-03-05 18:52:23.707471+00', '{"provider": "email", "providers": ["email"]}', '{"lastname": "", "firstname": ""}', NULL, '2024-02-18 04:20:07.047428+00', '2024-03-26 19:05:36.476171+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'ef21a78e-9e42-47ba-9e22-1707c3ad1e43', 'authenticated', 'authenticated', 'Ashish1@test.email', '$2a$10$qpae.n71alPictKmZDU64eh2LXfE8kiaUD9ONGc8CJWpOELqpUY8a', '2022-10-13 15:08:27.412558+00', '2022-10-12 06:33:02.676443+00', '', '2022-10-12 06:33:02.676443+00', '', '2024-02-19 01:32:33.030524+00', '', '', NULL, '2024-02-19 01:32:47.023404+00', '{"provider": "email", "providers": ["email"]}', '{"lastname": "", "firstname": ""}', NULL, '2022-10-12 06:33:02.758413+00', '2024-03-13 04:42:46.107752+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'c647680a-2919-4b36-b167-ed88a612cb99', 'authenticated', 'authenticated', 'Sreejith28@test.email', '$2a$10$JoCmlceO7AlieUlfnnqfo.Y1PIZjO19236Q0bsXzCo0KGPv25Z0je', '2022-05-19 16:24:38.936842+00', NULL, '', '2022-05-19 16:24:09.891558+00', '', '2024-03-22 22:46:02.858981+00', '', '', NULL, '2024-03-22 22:46:17.392138+00', '{"provider": "email", "providers": ["email"]}', '{"lastname": "S", "firstname": "S"}', false, '2022-05-19 16:24:09.877802+00', '2024-03-22 22:46:17.394185+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '0aab4c3b-1415-4871-943a-5c377c9158e9', 'authenticated', 'authenticated', 'Felipe23@test.email', '$2a$10$Ta2vKCEpAVOMxQ7U9UWW5OtC5QdatvFl1nN05iegAHsd5GkCwgi9m', '2022-10-27 19:17:53.651387+00', NULL, '', NULL, '', '2024-03-06 21:56:39.425734+00', '', '', NULL, '2024-03-06 21:56:58.058053+00', '{"provider": "email", "providers": ["email"]}', '{"lastname": "Pinheiro", "firstname": "Felipe"}', false, '2022-04-15 12:47:17.805173+00', '2024-03-12 20:33:20.946685+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '8a52cd4e-a250-4dba-b799-f38b6e34c75f', 'authenticated', 'authenticated', 'Christian27@test.email', '$2a$10$U57xuJnDa0pBqDqrqcJGMeYwP/aC7CINd2XQkL6/944Wlc5HcUFWe', '2022-04-04 13:50:20.136132+00', NULL, '', '2022-04-04 13:50:08.696827+00', '', '2024-10-22 15:47:50.020431+00', '', '', NULL, '2024-10-22 15:47:51.13661+00', '{"provider": "email", "providers": ["email"]}', '{"lastName": "Butcher", "firstName": "Christian"}', false, '2022-04-04 13:50:08.689164+00', '2024-10-22 15:47:51.138218+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('8a52cd4e-a250-4dba-b799-f38b6e34c75f', '8a52cd4e-a250-4dba-b799-f38b6e34c75f', '{"sub": "8a52cd4e-a250-4dba-b799-f38b6e34c75f", "email": "Christian27@test.email"}', 'email', '2022-04-04 13:50:08.693986+00', '2022-04-04 13:50:08.694035+00', '2022-11-25 00:00:00+00', '23303c83-541d-4927-a922-1f1770faacad'),
	('c647680a-2919-4b36-b167-ed88a612cb99', 'c647680a-2919-4b36-b167-ed88a612cb99', '{"sub": "c647680a-2919-4b36-b167-ed88a612cb99", "email": "Sreejith28@test.email"}', 'email', '2022-05-19 16:24:09.886683+00', '2022-05-19 16:24:09.886734+00', '2022-11-25 00:00:00+00', '71956b03-8c9f-4302-9e55-f4509f271dfe'),
	('cd331c15-4611-4c70-be54-096af5ccdf78', 'cd331c15-4611-4c70-be54-096af5ccdf78', '{"sub": "cd331c15-4611-4c70-be54-096af5ccdf78", "email": "Sreejith19@test.email"}', 'email', '2022-05-25 09:27:35.461536+00', '2022-05-25 09:27:35.461582+00', '2022-11-25 00:00:00+00', '3f47ed43-0d9c-4e73-a7c5-67428c807d01'),
	('6b4e3fe8-74d2-4ee4-aef9-58c1a05fd2a7', '6b4e3fe8-74d2-4ee4-aef9-58c1a05fd2a7', '{"sub": "6b4e3fe8-74d2-4ee4-aef9-58c1a05fd2a7", "email": "KeerthiVarman2@test.email"}', 'email', '2022-11-10 09:04:23.382615+00', '2022-11-10 09:04:23.382656+00', '2022-11-25 00:00:00+00', '254a7025-e1ee-48ca-84ab-6628c527c62f'),
	('38e0c6d3-8996-4073-887b-6fb7e73979b3', '38e0c6d3-8996-4073-887b-6fb7e73979b3', '{"sub": "38e0c6d3-8996-4073-887b-6fb7e73979b3", "email": "Sairam18@test.email"}', 'email', '2022-11-10 09:04:39.072101+00', '2022-11-10 09:04:39.072138+00', '2022-11-25 00:00:00+00', 'ae267a01-dc5b-4d5b-9695-eef9c681e779'),
	('343887db-f290-47dd-91b6-05a9d06bff3a', '343887db-f290-47dd-91b6-05a9d06bff3a', '{"sub": "343887db-f290-47dd-91b6-05a9d06bff3a", "email": "Mark12@test.email"}', 'email', '2022-11-25 00:00:00+00', '2022-11-25 00:00:00+00', '2022-11-25 00:00:00+00', '48898538-1e57-4656-8d5b-cd439f54032a'),
	('2b298be5-ae99-492e-9edd-1349f1f783c4', '2b298be5-ae99-492e-9edd-1349f1f783c4', '{"sub": "2b298be5-ae99-492e-9edd-1349f1f783c4", "email": "Sam33@test.email"}', 'email', '2022-11-25 00:00:00+00', '2022-11-25 00:00:00+00', '2022-11-25 00:00:00+00', 'b15d9f89-01c7-4f30-a109-9a13eb02ed47'),
	('341b2c2b-adc2-4ae6-ae71-a473c78b4de7', '341b2c2b-adc2-4ae6-ae71-a473c78b4de7', '{"sub": "341b2c2b-adc2-4ae6-ae71-a473c78b4de7", "email": "Ricardo15@test.email"}', 'email', '2022-11-25 00:00:00+00', '2022-11-25 00:00:00+00', '2022-11-25 00:00:00+00', '6be1ffed-7cc9-4629-8688-8877d4b585fa'),
	('35f8287d-8b9e-47f1-bc9e-afdacad6f32a', '35f8287d-8b9e-47f1-bc9e-afdacad6f32a', '{"sub": "35f8287d-8b9e-47f1-bc9e-afdacad6f32a", "email": "Anton4@test.email"}', 'email', '2022-11-25 00:00:00+00', '2022-11-25 00:00:00+00', '2022-11-25 00:00:00+00', '3d732905-c26b-4e4b-883d-498e0699c0dc'),
	('22d95e65-8f2d-4735-87e8-005afc8c3323', '22d95e65-8f2d-4735-87e8-005afc8c3323', '{"sub": "22d95e65-8f2d-4735-87e8-005afc8c3323", "email": "Matthias0@test.email"}', 'email', '2022-11-25 00:00:00+00', '2022-11-25 00:00:00+00', '2022-11-25 00:00:00+00', '7879f434-4346-43f3-8cbd-dae510be7518'),
	('f3142ed8-c853-43e5-8383-c32ab5b964aa', 'f3142ed8-c853-43e5-8383-c32ab5b964aa', '{"sub": "f3142ed8-c853-43e5-8383-c32ab5b964aa", "email": "Michael11@test.email"}', 'email', '2022-11-25 00:00:00+00', '2022-11-25 00:00:00+00', '2022-11-25 00:00:00+00', 'f0cbf1f2-8cc4-4efa-ae20-106b5ad67bdc'),
	('3a1dce05-2678-497f-bd30-584bb3a4c6c0', '3a1dce05-2678-497f-bd30-584bb3a4c6c0', '{"sub": "3a1dce05-2678-497f-bd30-584bb3a4c6c0", "email": "James31@test.email"}', 'email', '2022-11-25 00:00:00+00', '2022-11-25 00:00:00+00', '2022-11-25 00:00:00+00', '49d1b523-c832-403e-968d-a8d2aa29c407'),
	('1a40f5c5-3bb2-4808-90ec-cbb10011d3df', '1a40f5c5-3bb2-4808-90ec-cbb10011d3df', '{"sub": "1a40f5c5-3bb2-4808-90ec-cbb10011d3df", "email": "Michal5@test.email"}', 'email', '2022-11-25 00:00:00+00', '2022-11-25 00:00:00+00', '2022-11-25 00:00:00+00', 'ba954f64-22eb-4470-8a3f-78f2820d7fbb'),
	('ea1961e7-800e-4ba5-a4b8-bcfcf83b93e1', 'ea1961e7-800e-4ba5-a4b8-bcfcf83b93e1', '{"sub": "ea1961e7-800e-4ba5-a4b8-bcfcf83b93e1", "email": "Enrique8@test.email"}', 'email', '2022-11-25 00:00:00+00', '2022-11-25 00:00:00+00', '2022-11-25 00:00:00+00', '44cd14a8-6fb9-4efd-89a8-5549d8aaec74'),
	('e1f51a05-8854-444e-915d-b65d66994d05', 'e1f51a05-8854-444e-915d-b65d66994d05', '{"sub": "e1f51a05-8854-444e-915d-b65d66994d05", "email": "Patrik7@test.email"}', 'email', '2022-11-25 00:00:00+00', '2022-11-25 00:00:00+00', '2022-11-25 00:00:00+00', '59b1b127-55bd-4480-bf47-98a5989e8574'),
	('e0083ca5-6bc7-4e8b-aaf0-ce6381d1d445', 'e0083ca5-6bc7-4e8b-aaf0-ce6381d1d445', '{"sub": "e0083ca5-6bc7-4e8b-aaf0-ce6381d1d445", "email": "Alfredo13@test.email"}', 'email', '2022-11-25 00:00:00+00', '2022-11-25 00:00:00+00', '2022-11-25 00:00:00+00', '1ac510bd-d1b5-4a99-84ee-084107cf4ac0'),
	('4671cf60-ae64-46c0-b3a5-fc934cf1bd8a', '4671cf60-ae64-46c0-b3a5-fc934cf1bd8a', '{"sub": "4671cf60-ae64-46c0-b3a5-fc934cf1bd8a", "email": "Akshata29@test.email"}', 'email', '2022-11-25 00:00:00+00', '2022-11-25 00:00:00+00', '2022-11-25 00:00:00+00', 'e2e6f749-3c2a-4d93-8758-b36e4f407541'),
	('9151f9ed-1654-4607-9d80-8887f5430556', '9151f9ed-1654-4607-9d80-8887f5430556', '{"sub": "9151f9ed-1654-4607-9d80-8887f5430556", "email": "Ricardo14@test.email"}', 'email', '2022-11-25 00:00:00+00', '2022-11-25 00:00:00+00', '2022-11-25 00:00:00+00', '62b38955-6c6e-4486-b6b6-18a01f7c9165'),
	('2b792f1d-5698-4d09-b507-0305831d9c18', '2b792f1d-5698-4d09-b507-0305831d9c18', '{"sub": "2b792f1d-5698-4d09-b507-0305831d9c18", "email": "Nancy21@test.email"}', 'email', '2022-11-25 00:00:00+00', '2022-11-25 00:00:00+00', '2022-11-25 00:00:00+00', 'e5c52c47-d1da-497f-9321-e4e4f2340f39'),
	('9197afc4-322d-4c3c-ac65-4ae98825fa30', '9197afc4-322d-4c3c-ac65-4ae98825fa30', '{"sub": "9197afc4-322d-4c3c-ac65-4ae98825fa30", "email": "Matthieu10@test.email"}', 'email', '2022-11-25 00:00:00+00', '2022-11-25 00:00:00+00', '2022-11-25 00:00:00+00', 'ecf1659c-cca1-4b9a-b837-1a177da78802'),
	('0aab4c3b-1415-4871-943a-5c377c9158e9', '0aab4c3b-1415-4871-943a-5c377c9158e9', '{"sub": "0aab4c3b-1415-4871-943a-5c377c9158e9", "email": "Felipe23@test.email"}', 'email', '2022-11-25 00:00:00+00', '2022-11-25 00:00:00+00', '2022-11-25 00:00:00+00', 'fbc6f374-eb43-4f29-9b9b-8793a7162e9a'),
	('9f3bf5d5-f663-4997-bf5e-a3c868292987', '9f3bf5d5-f663-4997-bf5e-a3c868292987', '{"sub": "9f3bf5d5-f663-4997-bf5e-a3c868292987", "email": "Maciej6@test.email"}', 'email', '2022-11-25 00:00:00+00', '2022-11-25 00:00:00+00', '2022-11-25 00:00:00+00', '73225bb2-2f54-4e0a-bf78-5781199b96a9'),
	('c87226b4-564d-4fce-b8bc-d4f806b4f927', 'c87226b4-564d-4fce-b8bc-d4f806b4f927', '{"sub": "c87226b4-564d-4fce-b8bc-d4f806b4f927", "email": "Quentin25@test.email"}', 'email', '2022-11-25 00:00:00+00', '2022-11-25 00:00:00+00', '2022-11-25 00:00:00+00', '55b274f5-389d-4667-9628-e4548e86bd17'),
	('35f03917-dd1c-4a4d-88c4-1cd3b8996d27', '35f03917-dd1c-4a4d-88c4-1cd3b8996d27', '{"sub": "35f03917-dd1c-4a4d-88c4-1cd3b8996d27", "email": "Karthik20@test.email"}', 'email', '2022-11-25 00:00:00+00', '2022-11-25 00:00:00+00', '2022-11-25 00:00:00+00', '61625099-e12b-406f-b8df-e999f5847003'),
	('9556bc08-b216-4263-b97e-cdcbce35ac16', '9556bc08-b216-4263-b97e-cdcbce35ac16', '{"sub": "9556bc08-b216-4263-b97e-cdcbce35ac16", "email": "Clay17@test.email"}', 'email', '2022-11-25 00:00:00+00', '2022-11-25 00:00:00+00', '2022-11-25 00:00:00+00', '9b2064a7-5d8d-4693-b9fe-ed2e11fc0b53'),
	('215a93cc-4901-4338-b8c2-ccfc662f21c1', '215a93cc-4901-4338-b8c2-ccfc662f21c1', '{"sub": "215a93cc-4901-4338-b8c2-ccfc662f21c1", "email": "Muruganandhan3@test.email"}', 'email', '2022-11-25 00:00:00+00', '2022-11-25 00:00:00+00', '2022-11-25 00:00:00+00', '43f6e5ba-3964-4a5d-934d-aadaa70cef33'),
	('28786347-fdc5-4bb3-bbcf-166347523f78', '28786347-fdc5-4bb3-bbcf-166347523f78', '{"sub": "28786347-fdc5-4bb3-bbcf-166347523f78", "email": "Eric26@test.email"}', 'email', '2022-11-25 00:00:00+00', '2022-11-25 00:00:00+00', '2022-11-25 00:00:00+00', '9ea09909-faa3-4736-b7fe-4dacba619cb2'),
	('e35c59b6-3e66-4f61-bb03-163f5cea59aa', 'e35c59b6-3e66-4f61-bb03-163f5cea59aa', '{"sub": "e35c59b6-3e66-4f61-bb03-163f5cea59aa", "email": "Peter9@test.email"}', 'email', '2022-11-25 00:00:00+00', '2022-11-25 00:00:00+00', '2022-11-25 00:00:00+00', '689bf3fd-e8f7-4cd7-97cc-38d0d1ab3ecf'),
	('ef21a78e-9e42-47ba-9e22-1707c3ad1e43', 'ef21a78e-9e42-47ba-9e22-1707c3ad1e43', '{"sub": "ef21a78e-9e42-47ba-9e22-1707c3ad1e43", "email": "Ashish1@test.email"}', 'email', NULL, '2023-01-25 00:00:00+00', '2023-01-25 00:00:00+00', 'a6959127-72b2-402e-a5ec-2038db4a72a5'),
	('c16e01cb-c802-4fa9-b48a-f91bb787a264', 'c16e01cb-c802-4fa9-b48a-f91bb787a264', '{"sub": "c16e01cb-c802-4fa9-b48a-f91bb787a264", "email": "William22@test.email", "email_verified": false, "phone_verified": false}', 'email', '2023-11-25 16:40:16.769991+00', '2023-11-25 16:40:16.770033+00', '2023-11-25 16:40:16.770033+00', '299e8021-d7d9-4ff5-b71a-cfed1fdd8640'),
	('0eae4c37-4af5-4b92-ae90-615facddad49', '0eae4c37-4af5-4b92-ae90-615facddad49', '{"sub": "0eae4c37-4af5-4b92-ae90-615facddad49", "email": "Derrick32@test.email", "email_verified": false, "phone_verified": false}', 'email', '2024-02-28 04:47:52.927061+00', '2024-02-28 04:47:52.927108+00', '2024-02-28 04:47:52.927108+00', 'd73b013e-e815-4273-81a1-356b8eaa0f7d'),
	('0f6dd438-ed5e-4d6b-a89a-2c0a08dc3e9d', '0f6dd438-ed5e-4d6b-a89a-2c0a08dc3e9d', '{"sub": "0f6dd438-ed5e-4d6b-a89a-2c0a08dc3e9d", "email": "VaraPrasad16@test.email", "email_verified": false, "phone_verified": false}', 'email', '2024-03-06 16:11:22.554308+00', '2024-03-06 16:11:22.554363+00', '2024-03-06 16:11:22.554363+00', '37944074-c5fb-491f-ba2e-5bed68f31e64'),
	('cd64f560-306b-4de0-80a3-469eaac6b61e', 'cd64f560-306b-4de0-80a3-469eaac6b61e', '{"sub": "cd64f560-306b-4de0-80a3-469eaac6b61e", "email": "Thyagu24@test.email", "email_verified": false, "phone_verified": false}', 'email', '2024-02-23 05:44:38.396603+00', '2024-02-23 05:44:38.39665+00', '2024-02-23 05:44:38.39665+00', '04d27dd7-3b93-4b4b-ad2a-8de75ca9d1a3'),
	('06ab35dd-6fcb-49a6-a85f-0b0bf9cbcc62', '06ab35dd-6fcb-49a6-a85f-0b0bf9cbcc62', '{"sub": "06ab35dd-6fcb-49a6-a85f-0b0bf9cbcc62", "email": "Jason34@test.email", "email_verified": false, "phone_verified": false}', 'email', '2024-02-18 04:20:07.049694+00', '2024-02-18 04:20:07.049737+00', '2024-02-18 04:20:07.049737+00', '3721fc8d-9c61-4c35-8643-780f6aa93fa4'),
	('f9132cdb-daf3-4729-a2f4-f2f49bd190cf', 'f9132cdb-daf3-4729-a2f4-f2f49bd190cf', '{"sub": "f9132cdb-daf3-4729-a2f4-f2f49bd190cf", "email": "Kamalakannan35@test.email", "email_verified": false, "phone_verified": false}', 'email', '2024-02-22 10:22:14.28379+00', '2024-02-22 10:22:14.283838+00', '2024-02-22 10:22:14.283838+00', '8f8b443d-c137-44e9-8778-706a3f6b972b');

--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."profiles" ("id", "updated_at", "firstname", "lastname", "avatar_url", "website", "bio") VALUES
	('22d95e65-8f2d-4735-87e8-005afc8c3323', '2022-08-30 17:16:14.208752+00', 'Matthias', 'Baudot', '22d95e65-8f2d-4735-87e8-005afc8c3323_0.6130562687859158.png', NULL, 'Matthias Baudot has been working with LabVIEW for over ten years and is a worldwide leading expert in LabVIEW applications deployment and remote management. He is a LabVIEW Champion, presents regularly at NI Week, and has been awarded “World’s Fastest LabVIEW Programmer” in 2015.'),
	('ef21a78e-9e42-47ba-9e22-1707c3ad1e43', '2022-10-22 06:55:31.492752+00', 'Ashish', 'Uttarwar', 'ef21a78e-9e42-47ba-9e22-1707c3ad1e43_0.9865504085138412.png', NULL, NULL),
	('6b4e3fe8-74d2-4ee4-aef9-58c1a05fd2a7', '2022-11-10 09:04:23.296341+00', 'Keerthi Varman', 'Nageshwaran', NULL, NULL, NULL),
	('215a93cc-4901-4338-b8c2-ccfc662f21c1', '2020-09-26 05:44:53.330816+00', 'Muruganandhan', 'Subramaniam', 'presenter_49.jpg', NULL, NULL),
	('35f8287d-8b9e-47f1-bc9e-afdacad6f32a', '2020-09-26 05:44:53.330816+00', 'Anton', 'Sundqvist', 'presenter_23.jpg', NULL, 'Anton Sundqvist started his professional career at NI Sweden after finishing his masters degree in physics. Most recently he has been working as department manager and systems architect at Novator Solutions, an NI Gold Alliance Partner and NI Center of Excellence located in Stockholm. Anton is passionate about software design, and craftmanship and is currently in the process of moving to Finland where he will start up a LabVIEW consultancy company. Away from the computer Anton enjoys long distance running and cooking.'),
	('1a40f5c5-3bb2-4808-90ec-cbb10011d3df', '2022-06-07 12:35:25.458835+00', 'Michal', 'Radziwon', 'presenter_51.jpg', NULL, 'Michal (aka Mike) is a test environment architect working at Siemens Gamesa Renewable Energy. There, he takes care of the fleet of Hardware in the Loop simulators for wind turbines. Besides the technical role, he is also an advocate of good engineering practice coaching developers in writing testable code and using conventional commits and semantic versioning.

Mike''s adventure with LabVIEW started in 2009 in academia, where he was developing controllers for excimer lasers and incubators of organic crystals. Before settling in the wind industry he worked in plenty of green-energy projects together with CCM-EE consultancy.

He is a CLD, active member of ADVANCED LABVIEW USER GROUP DENMARK, and presenter from the first VI week. Mike lives in Denmark, plays a hang drum, and can bake the yummiest chocolate cake ever!'),
	('9f3bf5d5-f663-4997-bf5e-a3c868292987', '2022-10-17 14:30:24.797733+00', 'Maciej', 'Kolosko', NULL, NULL, NULL),
	('e1f51a05-8854-444e-915d-b65d66994d05', '2022-10-05 07:00:29.982159+00', 'Patrik', 'Karandusovsky', NULL, NULL, NULL),
	('ea1961e7-800e-4ba5-a4b8-bcfcf83b93e1', '2022-10-17 17:30:56.451834+00', 'Enrique', 'Noe Arias', 'ea1961e7-800e-4ba5-a4b8-bcfcf83b93e1_0.17697691211485256.png', NULL, 'I fell in love with LabVIEW since I was a Student 23 year ago, LabVIEW allowed me to draw my toughts, eventually I became ''The LabVIEW Teacher'', then I spent 13 year doing LabVIEW for a research Institute, doing Scientific setups, Industrial projects, I had a lot of fun, eventually I worked as a Software Contractor for Delacor, currently I''m running PantherLAB, a Software development and software consultancy Business in México, every day I''m doing what I love, ''solving problems with LabVIEW''.
'),
	('e35c59b6-3e66-4f61-bb03-163f5cea59aa', '2022-10-27 19:04:44.943964+00', 'Peter', 'Foerster', NULL, NULL, NULL),
	('9197afc4-322d-4c3c-ac65-4ae98825fa30', '2022-10-18 11:45:01.408154+00', 'Matthieu', 'Poncet', NULL, NULL, NULL),
	('f3142ed8-c853-43e5-8383-c32ab5b964aa', '2022-10-19 01:09:13.18749+00', 'Michael', 'Balzer', NULL, NULL, NULL),
	('343887db-f290-47dd-91b6-05a9d06bff3a', '2022-10-20 14:58:15.515271+00', 'Mark', 'Ramsdale', NULL, NULL, NULL),
	('e0083ca5-6bc7-4e8b-aaf0-ce6381d1d445', '2022-10-20 21:51:48.756835+00', 'Alfredo ', 'Figueroa', NULL, NULL, NULL),
	('9151f9ed-1654-4607-9d80-8887f5430556', '2022-10-21 02:27:27.316038+00', 'Ricardo', 'Otake', NULL, NULL, NULL),
	('341b2c2b-adc2-4ae6-ae71-a473c78b4de7', '2022-10-21 02:27:39.819412+00', 'Ricardo', 'Otake', NULL, NULL, NULL),
	('0f6dd438-ed5e-4d6b-a89a-2c0a08dc3e9d', '2024-03-06 16:17:26.878411+00', 'Vara Prasad', 'Adhepalli', NULL, NULL, NULL),
	('9556bc08-b216-4263-b97e-cdcbce35ac16', '2022-10-21 13:42:28.913392+00', 'Clay', 'Barbee', NULL, NULL, NULL),
	('38e0c6d3-8996-4073-887b-6fb7e73979b3', '2024-03-10 03:46:47.55077+00', ' Sairam', 'S', NULL, NULL, 'Lead - L&D @ Soliton Technologies, 
Training fresh recruits in LabVIEW'),
	('cd331c15-4611-4c70-be54-096af5ccdf78', '2022-05-25 09:27:35.374291+00', 'Sreejith', 'Sreenivasan', 'cd331c15-4611-4c70-be54-096af5ccdf78_0.5257607329285943.png', NULL, NULL),
	('35f03917-dd1c-4a4d-88c4-1cd3b8996d27', '2024-03-24 05:22:08.197355+00', 'Karthik', 'Abiram', 'presenter_27.jpg', NULL, 'Karthik Abiram is a Solutions Architect at Soliton Technologies and a LabVIEW user since 2012. He is a LabVIEW Champion, Certified LabVIEW Architect (CLA) and a Certified TestStand Architect (CTA) with experience in architecting Test Automation and GUI Frameworks. He is a strong believer of automating routine tasks and passionate about improving the developer experience (DX).'),
	('2b792f1d-5698-4d09-b507-0305831d9c18', '2022-10-06 16:32:12.188172+00', 'Nancy', 'Henson', NULL, NULL, NULL),
	('c16e01cb-c802-4fa9-b48a-f91bb787a264', '2023-11-25 16:40:16.648218+00', 'William', 'Richards', NULL, NULL, NULL),
	('0aab4c3b-1415-4871-943a-5c377c9158e9', '2024-03-12 20:34:11.921275+00', 'Felipe', 'Pinheiro Silva', 'presenter_50.jpg', NULL, 'My name is Felipe Pinheiro Silva and currently I am a software developer at Siemens Gamesa. I am from Brazil but I am currently living in Denmark.
I''ve been developing with LabVIEW since 2013, but my history with programming dates to web pages at Geocities. I am really interested in software engineering topics where we seek solutions to improve team performance and efficiency through the newest tools in the programming world. I have interest in other languages such as Python and Golang. If something can be automated, that should be our goal, so we can focus on what really matters, programming and discussing solutions.
With LabVIEW I achieved the CLA certification, and I am glad to be part of the LabVIEW Champions Group.
You can follow some of my ideas and discoveries at my blog: https://felipekb.com'),
	('cd64f560-306b-4de0-80a3-469eaac6b61e', '2024-02-23 06:01:25.716206+00', 'Thyagu', 'Soundar', 'cd64f560-306b-4de0-80a3-469eaac6b61e_0.11762083973803139.png', NULL, 'Thyagu Soundar, a distinguished engineer with over a decade of experience in Automotive and Aerospace industries. Armed with NI CLD Certification, Thyagu brings unparalleled expertise in Hardware-in-the-Loop (HIL) development for Advanced Driver Assistance Systems (ADAS), as well as Automated Test Equipment (ATE) development for safety critical functions in Aerospace. With a proven track record of piloting and delivering successful projects worldwide.'),
	('c87226b4-564d-4fce-b8bc-d4f806b4f927', '2022-07-12 14:20:30.957358+00', 'Quentin', 'Alldredge', 'presenter_13.png', NULL, 'Quentin "Q" Alldredge goes by "Q" and welcomes anyone to use that nickname.  He goes by that nickname for both the Star Trek and James Bond references.  Q received his B.S. and M.S. degrees in Mechanical Engineering from Utah State University in 2007.  His first job out of school was with ATK (now Northrop Grumman) in Northern Utah where the Space Shuttle rocket boosters were made.  They sent him to all of the NI training which he has since turned into his career.  Later, he joined the US Air Force as a civilian. While there he earned his CLA certification and led his team to become one of the first LabVIEW Centers of Excellence.  He worked on many projects including the A-10 aircraft developing ground support testing equipment.  In 2018, Q was inducted into the LabVIEW Champions and loves to share his love of the G language.  Q is currently a board member for GCentral, to promote community G programming efforts; an admin for the LabVIEW Wiki (labviewwiki.org); and works for Testeract,'),
	('28786347-fdc5-4bb3-bbcf-166347523f78', '2022-11-11 19:15:34.676576+00', 'Eric', 'Reffet', 'presenter_8.png', NULL, 'Eric Reffett has worked at NI for 23 years in multiple roles including Applications Engineering, Software Development, Software Marketing, Engineering Management and Software Planning. In his current role as a Software Planner, Eric is responsible for the product roadmap for LabVIEW.  Eric has met with hundreds of NI''s customers during his career at NI and he uses their feedback to improve the products NI creates. Before NI, Eric worked at Motorola developing satellite communication systems for worldwide radio systems.

Eric holds a BS in Computer Science from the University of Illinois and an MBA and MIS degree from Washington University. He enjoys playing games with his kids, planning his next Disney vacation, and learning to play the Ukulele from his wife.'),
	('8a52cd4e-a250-4dba-b799-f38b6e34c75f', '2024-03-20 17:10:24.465322+00', 'Christian', 'Butcher', '8a52cd4e-a250-4dba-b799-f38b6e34c75f_0.0416639872467679.png', NULL, 'Christian Butcher works as a research technician at the Okinawa Institute of Science and Technology. At work, he is focused on integrating and automating hardware and software systems to provide a smooth workflow for various fluid mechanics experiments.

Christian is a LabVIEW Champion and one of the GLA Summit Organizers, and has presented at several NI Week conferences and GDevCon events, most recently regarding CI/CD with Docker for LabVIEW PPLs.

His recent out-of-office programming has been mostly for this GLA Summit website - so for all the problems, bugs and slow TTFBs, he apologises! (If you''d like to join in next year - get in touch!)'),
	('c647680a-2919-4b36-b167-ed88a612cb99', '2024-03-20 13:10:58.903978+00', 'Sreejith', 'Sreenivasan', 'c647680a-2919-4b36-b167-ed88a612cb99_0.5872537914578637.png', NULL, 'Sreejith is a Systems Architect and is passionate about Software Engineering best practices, CI, UML and Test Automation.

He is a LabVIEW Champion, Certified LabVIEW Architect and Certified TestStand Architect. He co-hosts the GLA Summit and is a regular presenter and participant at NI Week, NI Days, user groups and CLA summits.'),
	('4671cf60-ae64-46c0-b3a5-fc934cf1bd8a', '2022-11-07 13:52:49.579738+00', 'Akshata', 'Nayak', '4671cf60-ae64-46c0-b3a5-fc934cf1bd8a_0.2408562387793467.png', NULL, 'Akshata Nayak is a LabVIEW developer working in ARAV Systems as Senior System Engineer. '),
	('3a1dce05-2678-497f-bd30-584bb3a4c6c0', '2024-03-19 07:01:58.02245+00', 'James', 'McNally', NULL, NULL, NULL),
	('0eae4c37-4af5-4b92-ae90-615facddad49', '2024-03-10 07:35:30.924958+00', 'Derrick', 'Bommarito', NULL, NULL, 'I like playing with all the LabVIEW features DNatt says to avoid which hopefully makes me chaotic good. I like making tooling for developers, poking at the darker corners of LabVIEW (Channels, XNodes, VIMs) and generating the eventual bug reports, and experimenting with architecture and API design in LabVIEW.

Currently work at NI in the support organization providing assistance on cases for LabVIEW, TestStand, RIO, RT, Web, and a smattering of other products.'),
	('2b298be5-ae99-492e-9edd-1349f1f783c4', '2024-02-13 15:35:14.581406+00', 'Sam', 'Roundy', '2b298be5-ae99-492e-9edd-1349f1f783c4_0.4568684144444122.png', NULL, 'With a degree in Computer Engineering, Sam has spent his 20-year career studying and architecting automated test frameworks. Having trained and mentored hundreds of test and measurement engineers, Sam has a passion for helping others grow. Sam prides himself in being a thought leader in the test and measurement community and is the most recognized author on TestStand forums. He helped architect and write the Certified TestStand Developer exam for NI. In 2015, Sam co-founded Testeract, with a mission to progress the automated test industry. He currently serves as its President. Sam is a LabVIEW Champion, Certified LabVIEW Architect, Certified TestStand Architect, and a Certified Professional Instructor.'),
	('06ab35dd-6fcb-49a6-a85f-0b0bf9cbcc62', '2024-03-05 18:56:56.565321+00', 'Jason', 'Orr', '06ab35dd-6fcb-49a6-a85f-0b0bf9cbcc62_0.520491895767367.png', NULL, 'loves automation, interfacing with hardware, and writing software to solve challenging real-world problems. Jason has been involved in writing LabVIEW and TestStand code since 2016 and has written software for industrial robotics, automation, manufacturing, and test in a wide variety of industries. Jason enjoys 3D modeling and printing, reading, and playing volleyball whenever he can.'),
	('f9132cdb-daf3-4729-a2f4-f2f49bd190cf', '2024-03-20 06:21:07.396964+00', 'Kamalakannan', 'Rajan', 'f9132cdb-daf3-4729-a2f4-f2f49bd190cf_0.06020185280937418.png', NULL, '
Kamalakannan Rajan serves as the R&D Lead at Valeo, where he plays a pivotal role in bolstering the Global Camera Acquisition system and Hardware-in-Loop Architectures. With extensive experience in the automotive industry, he specializes in in-vehicle testing tools, ADAS validation tools, and has a strong command of LabVIEW, TestStand, and FPGA-based developments since 2010, starting from LabVIEW 2009 version. He has collaborated closely with academic institutions, mentoring students, and fostering partnerships with NI alliance partners. With over 11 years of industrial expertise, he brings a wealth of knowledge and experience to his role.');


--
-- Data for Name: presentation_submissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."presentation_submissions" ("id", "submitter_id", "updated_at", "title", "abstract", "is_submitted", "presentation_type", "learning_points", "year") VALUES
	('3c94aaa4-336d-428f-a71f-baabf12d8a1b', '2b298be5-ae99-492e-9edd-1349f1f783c4', '2024-02-18 04:20:06.776487+00', 'Create Custom Report Plugins for TestStand', 'Ever wonder what it would take to push your TestStand data to Excel or TDMS?  This presentation shows how to create a custom report plugin for TestStand.  A simple step by step guide with tips and tricks.', true, 'full length', 'Students will learn what a report plugin in TestStand is and how to create one.', '2024'),
	('53fc93a2-3262-4e17-b9da-b35c03d34d4f', '215a93cc-4901-4338-b8c2-ccfc662f21c1', '2022-04-23 06:39:42.887+00', 'Enhancing User Experience with UI Design', 'User Experience has evolved not just over decades but over centuries and the magical journey continues. And it is directly connected with User Interface design. LabVIEW is one of the best tools around for helping scientists and engineers build incredibly innovative systems. When we create such applications, we need to give equal importance to UX and UI design along with the other functionality aspects to make the product useful and beautiful. That will enhance the user experience. This presentation aims to discuss the foundations of UX and UI design and tips to improve LabVIEW UI to better User experience.', true, 'full length', NULL, '2021'),
	('01bf337a-de97-491a-bd0e-448f83e909ba', 'f9132cdb-daf3-4729-a2f4-f2f49bd190cf', '2024-02-22 10:51:15.524066+00', 'Memory Handling on HIL System', 'HIL systems are widely used for testing and validation of complex control algorithms in various industries. Leveraging DVRs in LabVIEW, engineers can efficiently manage data communication between real-time controllers and simulation models, enhancing system performance and flexibility. Also highlights the benefits and implementation strategies of DVRs in HIL setups, emphasizing improved data handling, reduced latency, and simplified code maintenance. ', true, '15 minutes', '1. Understanding the concept and advantages of LabVIEW Data Value References (DVR).\\r\\n2. Implementing DVRs in National Instruments (NI) Hardware-in-the-Loop (HIL) systems.\\r\\n3. Enhancing data communication efficiency between real-time controllers and simulation models.\\r\\n4. Reducing latency and improving system performance\\r\\nSimplifying code maintenance and troubleshooting processes.\\r\\n5. Practical examples and case studies demonstrating DVR integration in HIL setups.\\r\\n6. Strategies for optimizing HIL development workflows with DVRs.\\r\\n7. Achieving robust system integration and validation through DVR utilization.', '2024'),
	('557a400b-6e2d-477b-be96-abe40f72a4e9', '35f8287d-8b9e-47f1-bc9e-afdacad6f32a', '2022-04-23 06:39:43.076+00', 'Introducing LUnit Unit Test Framework', 'Unit testing is a fundamental routine in software development. To effectively use unit tests for test driving LabVIEW development, good tools which integrate well into the workflow are essential. In this presentation a new open source tool is introduced and its key features are demonstrated. You will learn how you can reduce code duplication when testing class hierarchies and how to quickly run tests from the LabVIEW project explorer. You will also get an introduction to how execution of unit tests may be parallelized and run in a continuous integration environment.', true, 'full length', NULL, '2021'),
	('19bee03e-11bc-4685-97ec-b5839a4147ae', '0aab4c3b-1415-4871-943a-5c377c9158e9', '2022-04-23 06:39:42.88+00', 'Automatic versioning with Gitlab', 'The objective of this presentation is to show how to obtain the needed knowledge to automate your versioning and all the steps you must go through to achieve that, and automate your releases within Gitlab. This presentation is based on series of posts from my blog: https://felipekb.com', true, '7x7', NULL, '2021'),
	('56f56493-1ea9-49ef-b819-016cdf2f660f', 'cd64f560-306b-4de0-80a3-469eaac6b61e', '2024-02-23 06:19:27.857508+00', 'Building Robust Applications with LabVIEW Actor Framework', 'LabVIEW Actor Framework by itself is a very robust framework for a variety of reasons like Encapsulation, Modularity, Scalability & so on. In this presentation, we would be driving in on Scalability aspect & how it can help in building a robust applications. ', true, '15 minutes', 'Attendees would be learning on the Actor Framework & application scalability.', '2024'),
	('7d0d2aad-1d1e-4608-866e-a4dd0bf62588', '4671cf60-ae64-46c0-b3a5-fc934cf1bd8a', '2022-10-12 06:33:02.273405+00', 'FlexTest 2.0 using Actor Framework', 'History of FlexTest 1.0 with problem statements and challenges faced during feature development. Motivation for FlexTest 2.0 by adding features to the existing software by using Actor framework for effective solution. Using multilayer architecture for design processes with low level driver and framework development.', true, 'full length', '1. Using UML for design\n2. Multilayer architecture', '2022'),
	('c942eeb5-3288-4408-b677-1cf9b8bfd50e', '0eae4c37-4af5-4b92-ae90-615facddad49', '2024-02-28 06:39:32.862664+00', 'LabVIEW is a game: HiFi Graphics and Web UIs in LabVIEW Apps', 'Continuing my trend of "Why do that in LabVIEW?" I''ll be showing off some demos of how I''m aiming to make Summer of LabVIEW challenges more engaging and fun that can also be used to elevate GUIs for LabVIEW applications and the adventurous. See how to integrate web builds from the Godot game engine (and other web exports) with a LabVIEW application. This also opens to door for more tightly integrating web UIs into LabVIEW applications.', true, 'full length', 'Using the WebVIEW2 VIPM package along with the IG HTTP Server package to build more flexible UIs for LabVIEW applications.', '2024'),
	('80786956-4ecc-455a-91ca-3b6faeb99eb9', '22d95e65-8f2d-4735-87e8-005afc8c3323', '2022-08-30 17:09:33.442373+00', 'All you wanted to know about LabVIEW and Web Services but feared to ask - Part 2', 'We live in a connected world and with the Internet of Things (IoT), it is crucial to have our LabVIEW applications leveraging existing pieces of software and services available out there.\n\nDid you know LabVIEW can interact with your Office 365 or Google account? Did you know LabVIEW can programmatically use Google Translate, Geolocation, Text-to-speech, Artificial Intelligence, etc.?\n\nAny time you think something might be difficult to achieve with LabVIEW, there is probably an alternative available with a cloud services provider that you can leverage directly from your LabVIEW code.\n\nIn this presentation, we will give you all the keys, tips and tricks to have your LabVIEW application communicating with the most popular cloud services, achieving different kinds of popular authentication methods and leveraging the incredible quantity of APIs available on the web!\n\nWe will also show you how you can implement your own secured cloud services with LabVIEW Web Services and have other programmers interact with your API using any programming language they want!', true, 'full length', 'Attendees will learn how to call popular Web Services from their LabVIEW app, and how to develop their own Web Services API with LabVIEW. The first part of this presentation will be given in Amsterdam during GDevCon #3. Since the whole presentation is too long to cover both topics, I decided to divide it into 2 separate presentations, one for GDevCon, and hopefully one for GLA Summit.', '2022'),
	('faf2e77a-3229-4103-91d5-e48cf151fc8c', '3a1dce05-2678-497f-bd30-584bb3a4c6c0', '2022-09-01 10:12:55.344673+00', 'RAM: Understanding Memory Perfomance and LabVIEW', '"It''s LabVIEW, you don''t have to worry about memory management!"\n\nThis is true, until you need to squeeze more performance out of your application. This session will cover an understanding of memory performance in a modern PC and how that translates into LabVIEW.', true, 'full length', 'How memory layout and hardware design affects performance in LabVIEW', '2022'),
	('a25fc975-9268-4264-85a9-4d6d4735ad27', '35f03917-dd1c-4a4d-88c4-1cd3b8996d27', '2022-10-15 07:40:43.611828+00', 'SLL Drona - Open Source LabVIEW UI Testing Framework', 'An early preview of SLL Drona - an open source LabVIEW UI Testing Framework. The presentation will cover SLL Drona APIs and will walkthrough on how to write UI tests for a sample LabVIEW application.', true, 'full length', 'Apart from unit tests, a new way for developers to write UI Tests for their LabVIEW application', '2022'),
	('f9967c12-09cb-4de7-a3db-67742d969d22', '28786347-fdc5-4bb3-bbcf-166347523f78', '2022-11-13 05:26:34.119194+00', 'NI Keynote', 'NI Keynote - more information coming soon.', true, 'full length', NULL, '2022');


--
-- Data for Name: accepted_presentations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."accepted_presentations" ("id", "accepted_at", "scheduled_for", "year") VALUES
	('557a400b-6e2d-477b-be96-abe40f72a4e9', '2022-04-23 07:02:51.122782+00', '2021-11-16 11:00:00+00', '2021'),
	('19bee03e-11bc-4685-97ec-b5839a4147ae', '2022-04-23 07:02:51.122782+00', '2021-11-15 12:24:00+00', '2021'),
	('53fc93a2-3262-4e17-b9da-b35c03d34d4f', '2022-04-23 07:02:51.122782+00', '2021-11-16 10:00:00+00', '2021'),
	('faf2e77a-3229-4103-91d5-e48cf151fc8c', '2022-10-18 02:50:43+00', '2022-11-14 14:00:00+00', '2022'),
	('80786956-4ecc-455a-91ca-3b6faeb99eb9', '2022-10-18 07:30:11.684274+00', '2022-11-14 23:00:00+00', '2022'),
	('7d0d2aad-1d1e-4608-866e-a4dd0bf62588', '2022-10-21 10:10:10.340299+00', '2022-11-15 03:00:00+00', '2022'),
	('a25fc975-9268-4264-85a9-4d6d4735ad27', '2022-10-30 03:54:03.360991+00', '2022-11-15 07:00:00+00', '2022'),
	('f9967c12-09cb-4de7-a3db-67742d969d22', '2022-11-13 05:27:53.510913+00', '2022-11-14 15:00:00+00', '2022'),
	('3c94aaa4-336d-428f-a71f-baabf12d8a1b', '2024-03-09 10:18:16.601502+00', '2024-03-25 19:00:00+00', '2024'),
	('c942eeb5-3288-4408-b677-1cf9b8bfd50e', '2024-03-09 10:20:18.49099+00', '2024-03-26 02:00:00+00', '2024'),
	('56f56493-1ea9-49ef-b819-016cdf2f660f', '2024-03-09 10:19:27.623193+00', '2024-03-26 06:00:00+00', '2024'),
	('01bf337a-de97-491a-bd0e-448f83e909ba', '2024-03-12 08:08:50.864505+00', '2024-03-26 06:40:00+00', '2024');


--
-- Data for Name: agenda_favourites; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."agenda_favourites" ("user_id", "presentation_id", "updated_at") VALUES
	('8a52cd4e-a250-4dba-b799-f38b6e34c75f', '80786956-4ecc-455a-91ca-3b6faeb99eb9', '2022-11-14 05:38:04.341538+00'),
	('8a52cd4e-a250-4dba-b799-f38b6e34c75f', 'faf2e77a-3229-4103-91d5-e48cf151fc8c', '2022-11-14 05:44:32.530671+00'),
	('8a52cd4e-a250-4dba-b799-f38b6e34c75f', 'f9967c12-09cb-4de7-a3db-67742d969d22', '2022-11-14 05:44:40.665418+00'),
	('8a52cd4e-a250-4dba-b799-f38b6e34c75f', 'a001b085-e1c0-4840-8d61-3516d7c38d47', '2022-11-14 05:44:51.552871+00'),
	('8a52cd4e-a250-4dba-b799-f38b6e34c75f', 'cf20d1d4-5f0a-4c6b-98ba-cf57b038cef6', '2022-11-14 08:05:13.901984+00');


--
-- Data for Name: confirmed_presentations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."confirmed_presentations" ("id", "created_at") VALUES
	('56f56493-1ea9-49ef-b819-016cdf2f660f', '2024-03-20 02:11:33.953063+00');


--
-- Data for Name: container_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."container_groups" ("container_id", "presentation_id") VALUES
	('7c681885-09c7-41fa-88f9-673bcb000984', '19bee03e-11bc-4685-97ec-b5839a4147ae');


--
-- Data for Name: email_lookup; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."email_lookup" ("id", "email") VALUES
	('06ab35dd-6fcb-49a6-a85f-0b0bf9cbcc62', 'Jason34@test.email'),
	('0aab4c3b-1415-4871-943a-5c377c9158e9', 'Felipe23@test.email'),
	('0eae4c37-4af5-4b92-ae90-615facddad49', 'Derrick32@test.email'),
	('215a93cc-4901-4338-b8c2-ccfc662f21c1', 'Muruganandhan3@test.email'),
	('22d95e65-8f2d-4735-87e8-005afc8c3323', 'Matthias0@test.email'),
	('28786347-fdc5-4bb3-bbcf-166347523f78', 'Eric26@test.email'),
	('2b298be5-ae99-492e-9edd-1349f1f783c4', 'Sam33@test.email'),
	('2b792f1d-5698-4d09-b507-0305831d9c18', 'Nancy21@test.email'),
	('35f03917-dd1c-4a4d-88c4-1cd3b8996d27', 'Karthik20@test.email'),
	('35f8287d-8b9e-47f1-bc9e-afdacad6f32a', 'Anton4@test.email'),
	('38e0c6d3-8996-4073-887b-6fb7e73979b3', 'Sairam18@test.email'),
	('3a1dce05-2678-497f-bd30-584bb3a4c6c0', 'James31@test.email'),
	('4671cf60-ae64-46c0-b3a5-fc934cf1bd8a', 'Akshata29@test.email'),
	('6b4e3fe8-74d2-4ee4-aef9-58c1a05fd2a7', 'KeerthiVarman2@test.email'),
	('cd64f560-306b-4de0-80a3-469eaac6b61e', 'Thyagu24@test.email'),
	('ef21a78e-9e42-47ba-9e22-1707c3ad1e43', 'Ashish1@test.email'),
	('f9132cdb-daf3-4729-a2f4-f2f49bd190cf', 'Kamalakannan35@test.email'),
	('1a40f5c5-3bb2-4808-90ec-cbb10011d3df', 'Michal5@test.email'),
	('8a52cd4e-a250-4dba-b799-f38b6e34c75f', 'Christian27@test.email'),
	('c16e01cb-c802-4fa9-b48a-f91bb787a264', 'William22@test.email'),
	('c647680a-2919-4b36-b167-ed88a612cb99', 'Sreejith28@test.email'),
	('cd331c15-4611-4c70-be54-096af5ccdf78', 'Sreejith19@test.email'),
	('c87226b4-564d-4fce-b8bc-d4f806b4f927', 'Quentin25@test.email'),
	('0f6dd438-ed5e-4d6b-a89a-2c0a08dc3e9d', 'VaraPrasad16@test.email'),
  ('e35c59b6-3e66-4f61-bb03-163f5cea59aa', 'Peter9@test.email'),
  ('9556bc08-b216-4263-b97e-cdcbce35ac16', 'Clay17@test.email'),
  ('341b2c2b-adc2-4ae6-ae71-a473c78b4de7', 'Ricardo15@test.email'),
  ('9151f9ed-1654-4607-9d80-8887f5430556', 'Ricardo14@test.email'),
  ('e0083ca5-6bc7-4e8b-aaf0-ce6381d1d445', 'Alfredo13@test.email'),
  ('343887db-f290-47dd-91b6-05a9d06bff3a', 'Mark12@test.email'),
  ('f3142ed8-c853-43e5-8383-c32ab5b964aa', 'Michael11@test.email'),
  ('9197afc4-322d-4c3c-ac65-4ae98825fa30', 'Matthieu10@test.email'),
  ('9f3bf5d5-f663-4997-bf5e-a3c868292987', 'Maciej6@test.email'),
  ('e1f51a05-8854-444e-915d-b65d66994d05', 'Patrik7@test.email'),
  ('ea1961e7-800e-4ba5-a4b8-bcfcf83b93e1', 'Enrique8@test.email');



--
-- Data for Name: log; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."log" ("id", "created_at", "severity", "message", "user_id") VALUES
	(1, '2022-10-03 10:30:22.723812+00', 'info', 'Attempted to create an existing user, adding data instead (id is attempted user, not signed in user)', '8a52cd4e-a250-4dba-b799-f38b6e34c75f'),
	(6, '2022-10-03 12:50:21+00', 'info', 'Test for timezone processing...', NULL),
	(730, '2024-03-28 04:43:14.533066+00', 'info', 'New Ticket request: {"newTicket":null,"error":{"code":"23505","details":null,"hint":null,"message":"duplicate key value violates unique constraint \\"tickets_pkey\\""}} (v@test.email)', '4ba57988-c4ed-456d-ad2b-c732bf472171'),
	(731, '2024-03-28 04:43:14.545482+00', 'error', 'Failed to create a new ticket: duplicate key value violates unique constraint "tickets_pkey", (null) (23505)', '4ba57988-c4ed-456d-ad2b-c732bf472171'),
	(732, '2024-03-28 04:43:49.932415+00', 'info', 'Attempted to create an existing user, adding data instead (id is attempted user, not signed in user)', '4ba57988-c4ed-456d-ad2b-c732bf472171'),
	(733, '2024-03-28 04:47:49.850362+00', 'info', 'Fetched an existing ticket: 1051 (v@test.email)', '4ba57988-c4ed-456d-ad2b-c732bf472171'),
	(734, '2024-03-28 04:56:44.822897+00', 'info', 'Fetched an existing ticket: 1051 (v@test.email)', '4ba57988-c4ed-456d-ad2b-c732bf472171'),
	(735, '2024-03-28 08:52:01.742882+00', 'info', 'Attempted to create an existing user, adding data instead (id is attempted user, not signed in user)', 'fb5c5577-7080-4f7a-b75a-22c4122ea74e'),
	(736, '2024-03-28 16:15:42.525416+00', 'info', 'Fetched an existing ticket: 955 (m@test.email)', '058d7c61-65fd-40df-9afd-1b8c6c88a47f'),
	(737, '2024-03-29 00:53:16.529+00', 'info', 'New Ticket request: {"newTicket":null,"error":{"code":"23505","details":null,"hint":null,"message":"duplicate key value violates unique constraint \\"tickets_pkey\\""}} (d@test.email)', '6279f29e-2f88-43e9-9166-cbc4b8b046e2'),
	(738, '2024-03-29 00:53:16.540915+00', 'info', 'New Ticket request: {"newTicket":{"user_id":"6279f29e-2f88-43e9-9166-cbc4b8b046e2","ticket_number":1053,"year":"2024","created_at":"2024-03-29T00:53:16.454985+00:00"},"error":null} (d@test.email)', '6279f29e-2f88-43e9-9166-cbc4b8b046e2'),
	(739, '2024-03-29 00:53:30.259424+00', 'info', 'Fetched an existing ticket: 1053 (d@test.email)', '6279f29e-2f88-43e9-9166-cbc4b8b046e2'),
	(740, '2024-03-29 00:53:32.020656+00', 'info', 'Created a new ticket: 1053', '6279f29e-2f88-43e9-9166-cbc4b8b046e2'),
	(766, '2024-05-16 14:04:10.760205+00', 'info', 'Fetched an existing ticket: 457 (s@test.email)', '86e89802-4b35-48db-a160-979136dc4598'),
	(767, '2024-05-29 18:54:41.580839+00', 'info', 'Fetched an existing ticket: 710 (s2@test.email)', '7b53b3a4-b7d8-45a3-98bc-2312fe63fce1'),
	(768, '2024-06-14 13:27:29.491827+00', 'info', 'Fetched an existing ticket: 54 (s3@test.email)', '7e4311a1-0fb1-4d1a-8eef-167f4caefdbd'),
	(769, '2024-06-15 13:39:08.383353+00', 'info', 'New Ticket request: {"newTicket":{"user_id":"689a0884-fc49-48fb-a220-7e5e93bbd6d2","ticket_number":1060,"year":"2024","created_at":"2024-06-15T13:39:08.323392+00:00"},"error":null} (a@test.email)', '689a0884-fc49-48fb-a220-7e5e93bbd6d2'),
	(770, '2024-06-15 13:39:08.416535+00', 'info', 'New Ticket request: {"newTicket":null,"error":{"code":"23505","details":null,"hint":null,"message":"duplicate key value violates unique constraint \\"tickets_pkey\\""}} (a@test.email)', '689a0884-fc49-48fb-a220-7e5e93bbd6d2'),
	(771, '2024-06-15 13:39:08.423501+00', 'error', 'Failed to create a new ticket: duplicate key value violates unique constraint "tickets_pkey", (null) (23505)', '689a0884-fc49-48fb-a220-7e5e93bbd6d2'),
	(772, '2024-06-15 13:39:08.465131+00', 'info', 'Created a new ticket: 1060', '689a0884-fc49-48fb-a220-7e5e93bbd6d2'),
	(776, '2024-08-16 13:42:06.444117+00', 'info', 'Fetched an existing ticket: 1 (c@test.email)', '8a52cd4e-a250-4dba-b799-f38b6e34c75f'),
	(777, '2024-09-13 19:43:08.073081+00', 'info', 'Fetched an existing ticket: 343 (p@test.email)', 'afe926c1-fe0c-42ff-b0ff-a5927d55a16e');


--
-- Data for Name: log_viewers; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."log_viewers" ("user_id") VALUES
	('8a52cd4e-a250-4dba-b799-f38b6e34c75f');


--
-- Data for Name: organizers; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."organizers" ("id") VALUES
	('8a52cd4e-a250-4dba-b799-f38b6e34c75f'),
	('c647680a-2919-4b36-b167-ed88a612cb99'),
	('c87226b4-564d-4fce-b8bc-d4f806b4f927'),
	('1a40f5c5-3bb2-4808-90ec-cbb10011d3df'),
	('cd331c15-4611-4c70-be54-096af5ccdf78'),
	('c16e01cb-c802-4fa9-b48a-f91bb787a264');


--
-- Data for Name: presentation_presenters; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."presentation_presenters" ("presentation_id", "presenter_id") VALUES
	('01bf337a-de97-491a-bd0e-448f83e909ba', 'f9132cdb-daf3-4729-a2f4-f2f49bd190cf'),
	('19bee03e-11bc-4685-97ec-b5839a4147ae', '0aab4c3b-1415-4871-943a-5c377c9158e9'),
	('3c94aaa4-336d-428f-a71f-baabf12d8a1b', '2b298be5-ae99-492e-9edd-1349f1f783c4'),
	('3c94aaa4-336d-428f-a71f-baabf12d8a1b', '06ab35dd-6fcb-49a6-a85f-0b0bf9cbcc62'),
	('53fc93a2-3262-4e17-b9da-b35c03d34d4f', '215a93cc-4901-4338-b8c2-ccfc662f21c1'),
	('557a400b-6e2d-477b-be96-abe40f72a4e9', '35f8287d-8b9e-47f1-bc9e-afdacad6f32a'),
	('56f56493-1ea9-49ef-b819-016cdf2f660f', 'cd64f560-306b-4de0-80a3-469eaac6b61e'),
	('7d0d2aad-1d1e-4608-866e-a4dd0bf62588', '4671cf60-ae64-46c0-b3a5-fc934cf1bd8a'),
	('7d0d2aad-1d1e-4608-866e-a4dd0bf62588', 'ef21a78e-9e42-47ba-9e22-1707c3ad1e43'),
	('80786956-4ecc-455a-91ca-3b6faeb99eb9', '22d95e65-8f2d-4735-87e8-005afc8c3323'),
	('a25fc975-9268-4264-85a9-4d6d4735ad27', '35f03917-dd1c-4a4d-88c4-1cd3b8996d27'),
	('a25fc975-9268-4264-85a9-4d6d4735ad27', '6b4e3fe8-74d2-4ee4-aef9-58c1a05fd2a7'),
	('a25fc975-9268-4264-85a9-4d6d4735ad27', '38e0c6d3-8996-4073-887b-6fb7e73979b3'),
	('c942eeb5-3288-4408-b677-1cf9b8bfd50e', '0eae4c37-4af5-4b92-ae90-615facddad49'),
	('f9967c12-09cb-4de7-a3db-67742d969d22', '28786347-fdc5-4bb3-bbcf-166347523f78'),
	('f9967c12-09cb-4de7-a3db-67742d969d22', '2b792f1d-5698-4d09-b507-0305831d9c18'),
	('faf2e77a-3229-4103-91d5-e48cf151fc8c', '3a1dce05-2678-497f-bd30-584bb3a4c6c0');


--
-- Data for Name: public_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."public_profiles" ("id") VALUES
	('f9132cdb-daf3-4729-a2f4-f2f49bd190cf'),
	('0aab4c3b-1415-4871-943a-5c377c9158e9'),
	('2b298be5-ae99-492e-9edd-1349f1f783c4'),
	('06ab35dd-6fcb-49a6-a85f-0b0bf9cbcc62'),
	('215a93cc-4901-4338-b8c2-ccfc662f21c1'),
	('35f8287d-8b9e-47f1-bc9e-afdacad6f32a'),
	('cd64f560-306b-4de0-80a3-469eaac6b61e'),
	('4671cf60-ae64-46c0-b3a5-fc934cf1bd8a'),
	('ef21a78e-9e42-47ba-9e22-1707c3ad1e43'),
	('22d95e65-8f2d-4735-87e8-005afc8c3323'),
	('35f03917-dd1c-4a4d-88c4-1cd3b8996d27'),
	('6b4e3fe8-74d2-4ee4-aef9-58c1a05fd2a7'),
	('38e0c6d3-8996-4073-887b-6fb7e73979b3'),
	('0eae4c37-4af5-4b92-ae90-615facddad49'),
	('28786347-fdc5-4bb3-bbcf-166347523f78'),
	('2b792f1d-5698-4d09-b507-0305831d9c18'),
	('3a1dce05-2678-497f-bd30-584bb3a4c6c0');


--
-- Data for Name: rejected_presentations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."rejected_presentations" ("id") VALUES
	('f0c76035-29b3-49e2-925e-d0726d6ccee9'),
	('a9860c58-9c66-40a6-8d51-c086fdae2bc1'),
	('00829776-3ddc-4d73-8e07-a0485eb2d092'),
	('ddfb1532-fb5e-4903-b353-8383d306c566');


--
-- Data for Name: ticket_sequences; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."ticket_sequences" ("year", "name") VALUES
	('2024', 'ticket_sequence_2024'),
	('2025', 'ticket_sequence_2025');


--
-- Data for Name: tickets; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."tickets" ("user_id", "ticket_number", "year", "created_at") VALUES
	('8a52cd4e-a250-4dba-b799-f38b6e34c75f', 1, '2024', '2024-03-01 08:00:00.007923+00'),
	('c16e01cb-c802-4fa9-b48a-f91bb787a264', 2, '2024', '2024-03-05 03:25:42.758397+00');


--
-- Data for Name: video_links; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."video_links" ("presentation_id", "url") VALUES
	('a25fc975-9268-4264-85a9-4d6d4735ad27', 'https://www.youtube.com/embed/4JryzEPQexM'),
	('faf2e77a-3229-4103-91d5-e48cf151fc8c', 'https://www.youtube.com/embed/ujgDwFZw_SE'),
	('7d0d2aad-1d1e-4608-866e-a4dd0bf62588', 'https://www.youtube.com/embed/Xswcrtw1qdI'),
	('80786956-4ecc-455a-91ca-3b6faeb99eb9', 'https://www.youtube.com/embed/tl19HHisXOc'),
	('53fc93a2-3262-4e17-b9da-b35c03d34d4f', 'https://www.youtube.com/embed/WQ8EdOZNYnM'),
	('557a400b-6e2d-477b-be96-abe40f72a4e9', 'https://www.youtube.com/embed/Kys_w2RNffw'),
	('c942eeb5-3288-4408-b677-1cf9b8bfd50e', 'https://www.youtube.com/embed/o0uAwWBNFt4'),
	('56f56493-1ea9-49ef-b819-016cdf2f660f', 'https://www.youtube.com/embed/9ALoMP9bjCs'),
	('01bf337a-de97-491a-bd0e-448f83e909ba', 'https://www.youtube.com/embed/UBNqvIMbecQ'),
	('3c94aaa4-336d-428f-a71f-baabf12d8a1b', 'https://www.youtube.com/embed/qeR_4Gq0Ais');


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id") VALUES
	('avatars', 'avatars', NULL, '2022-04-04 05:02:26.067098+00', '2022-04-04 05:02:26.067098+00', true, false, NULL, NULL, NULL),
	('public-images', 'public-images', NULL, '2022-05-20 09:05:20.860275+00', '2022-05-20 09:05:20.860275+00', true, false, NULL, NULL, NULL);


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 19605, true);


--
-- Name: log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."log_id_seq"', 777, true);


--
-- Name: ticket_sequence_2024; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."ticket_sequence_2024"', 1061, true);

--
-- PostgreSQL database dump complete
--

RESET ALL;
