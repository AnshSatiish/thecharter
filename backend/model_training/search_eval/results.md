# Search evaluation (application settings)

Model `BAAI/bge-small-en-v1.5`, passages of up to 40 words, cut-off 0.575 and relative cut 0.95 (chosen by cross-validation in `compare_models.py`). Corpus: 37 projects (7 partner samples, 30 synthetic). 122 queries, 113 with an answer and 9 off-topic. Produced by `evaluate_search.py`.

| Queries | Mode | Hit@1 | Recall@3 | MRR |
|---|---|---|---|---|
| all (113) | keyword | 0.89 | 0.93 | 0.93 |
| all (113) | semantic | 0.96 | 0.94 | 0.97 |
| all (113) | hybrid | 0.96 | 0.95 | 0.97 |
| exact (38) | keyword | 1.00 | 0.99 | 1.00 |
| exact (38) | semantic | 0.97 | 0.97 | 0.97 |
| exact (38) | hybrid | 0.97 | 0.99 | 0.99 |
| paraphrase (70) | keyword | 0.86 | 0.93 | 0.91 |
| paraphrase (70) | semantic | 0.94 | 0.95 | 0.96 |
| paraphrase (70) | hybrid | 0.94 | 0.95 | 0.96 |
| topic (5) | keyword | 0.60 | 0.50 | 0.70 |
| topic (5) | semantic | 1.00 | 0.63 | 1.00 |
| topic (5) | hybrid | 1.00 | 0.63 | 1.00 |

Off-topic queries correctly returning nothing (out of 9): keyword 4, semantic 9, hybrid 9.

## Every query

| Type | Query | Relevant | Keyword | Semantic | Hybrid |
|---|---|---|---|---|---|
| exact | Lake Kivu | [23] | [23] | [23] | [23] |
| exact | Darién Gap | [27] | [27] | [27] | [27] |
| exact | Finance Bill 2024 | [25] | [25] | [25] | [25] |
| exact | cool burning | [28] | [28] | [28, 1028] | [28, 1028] |
| exact | high-speed train | [18] | [18] | [18] | [18] |
| exact | Day of the Dead | [17] | [17, 1009] | [17] | [17, 1009] |
| exact | Title 42 | [26] | [26] | [26] | [26] |
| exact | asylum seekers | [26, 1021] | [26] | [1019] | [1019, 26] |
| paraphrase | people forced to leave their home country | [26, 27, 1019, 1021] | [1030, 1017, 1001, 1021, 1025] | [1023, 1030, 1019] | [1023, 1030, 1019] |
| paraphrase | honouring ancestors who have passed away | [17, 1009] | [1009, 17, 1007, 1001, 1005] | [1009] | [1009] |
| paraphrase | young people demonstrating against the government | [25, 1030] | [1030, 1012, 25, 1016, 1021] | [25] | [25] |
| paraphrase | fishermen losing their income | [23, 1005] | [1008, 1010, 1016, 1017, 1021] | [23, 1005] | [23, 1005] |
| paraphrase | using fire to stop bigger bushfires | [28] | [28, 1022, 17, 26, 25] | [28, 1028] | [28, 1028] |
| paraphrase | rich and poor travelling differently | [18] | [] | [18, 1024, 1018, 1021] | [18, 1024, 1018, 1021] |
| paraphrase | dangerous journey through the rainforest | [27] | [27, 26, 1014, 1018, 1019] | [27] | [27] |
| paraphrase | families separated at the frontier | [26, 27, 1020, 1024] | [17, 27, 1001, 1002, 1005] | [1024, 1020, 1023] | [1024, 1020, 1023] |
| paraphrase | environmental damage to a lake | [23] | [23, 1008, 28, 1005, 1001] | [23, 1008] | [23, 1008] |
| paraphrase | traditional ecological knowledge of Aboriginal people | [28] | [28, 1030, 1006, 1012, 1021] | [28, 1007] | [28, 1007] |
| exact | Assam tea estates elephants | [1001] | [1001] | [1001] | [1001] |
| paraphrase | large animals trampling rice fields at night | [1001] | [1001, 1021, 1025, 1004, 1002] | [1001, 1002] | [1001, 1002] |
| paraphrase | villagers guarding crops with torches and drums | [1001] | [1001, 1020, 1025, 1027] | [1020, 1001] | [1020, 1001] |
| exact | snow leopard Ladakh | [1002] | [1002] | [1002] | [1002] |
| paraphrase | big cats killing goats in the mountains | [1002] | [1002, 28, 1010, 1029, 1006] | [1002] | [1002] |
| paraphrase | insurance for herders who lose animals to predators | [1002, 1004] | [1002, 1007, 1001, 1006, 1020] | [1006, 1002] | [1006, 1002] |
| exact | Sundarbans mangroves | [1003] | [1003] | [1003] | [1003] |
| paraphrase | trees that shield coastal villages from storm surges | [1003] | [1003, 1020, 1028, 23, 28] | [1003] | [1003] |
| paraphrase | honey gatherers working near tigers | [1003] | [1003, 1006, 1005, 1019, 1023] | [1003] | [1003] |
| exact | wolves in the Alps | [1004] | [1004] | [1004] | [1004] |
| paraphrase | shepherds sleeping beside their flocks with guard dogs | [1004] | [1004, 1006, 1021, 1023, 1025] | [1004] | [1004] |
| paraphrase | return of a predator divides mountain towns | [1004] | [1004] | [1004] | [1004] |
| exact | coral bleaching Wakatobi | [1005] | [1005] | [1005] | [1005] |
| paraphrase | warm sea water turning reefs white | [1005] | [1005, 1029, 1025, 1021, 1006] | [1005] | [1005] |
| paraphrase | growing coral fragments to repair damaged reefs | [1005] | [1005, 23, 1001, 1016, 1027] | [1005] | [1005] |
| exact | Maasai lion guardians | [1006] | [1006] | [1006] | [1006] |
| paraphrase | young warriors protecting big cats instead of hunting them | [1006] | [1006, 1002, 1010, 17, 25] | [1006, 1002] | [1006, 1002] |
| paraphrase | keeping cattle safe from predators on the savanna | [1006] | [17, 1006, 1008, 1019, 1029] | [1006] | [1006] |
| exact | Sami reindeer herders | [1007] | [1007] | [1007] | [1007] |
| paraphrase | ice crust stopping animals from reaching food in winter | [1007] | [1007, 1029, 17, 23, 1002] | [1007] | [1007] |
| paraphrase | wind turbines on Indigenous grazing land | [1007] | [28, 1007, 17, 1024, 1012] | [1007, 28] | [1007, 28] |
| exact | Maya weaving cooperative | [1008] | [1008] | [1008] | [1008] |
| paraphrase | women selling handmade textiles without middlemen | [1008] | [1008, 1022, 23, 17, 28] | [1008] | [1008] |
| paraphrase | protecting traditional designs from being copied by fashion brands | [1008] | [1008, 28, 17, 1006, 1024] | [1008] | [1008] |
| exact | Tana Toraja funeral | [1009] | [1009] | [1009] | [1009] |
| paraphrase | families who keep their dead relatives at home | [1009] | [1009] | [1009] | [1009] |
| paraphrase | cleaning and dressing the remains of ancestors | [1009] | [1009, 17, 1021] | [1009] | [1009] |
| exact | eagle hunters Mongolia | [1010] | [1010] | [1010] | [1010] |
| paraphrase | nomads training birds of prey | [1010] | [1010] | [1010] | [1010] |
| paraphrase | girls taking up a tradition once reserved for men | [1010] | [1010, 17, 28, 1006, 1008] | [1010] | [1010] |
| exact | Kumbh Mela | [1011] | [1011] | [1011, 1003] | [1011, 1003] |
| paraphrase | millions of pilgrims bathing in a holy river | [1011] | [1011, 27, 1016, 1025] | [1011] | [1011] |
| paraphrase | a city of tents built for a religious festival | [1011] | [1011] | [1011] | [1011] |
| exact | Maori language revival | [1012] | [1012] | [1012] | [1012] |
| paraphrase | children learning the language their grandparents were punished for speaking | [1012] | [1012] | [1012] | [1012] |
| paraphrase | immersion schools for an Indigenous language | [1012] | [1012] | [1012] | [1012] |
| exact | Dharavi recycling | [1013] | [1013] | [1013] | [1013] |
| paraphrase | workers melting plastic waste into pellets | [1013] | [1013] | [1013] | [1013] |
| paraphrase | informal jobs threatened by redevelopment | [1013] | [1013, 1014, 1016, 1022] | [1013, 1015] | [1013, 1015] |
| exact | Cairo rooftop heat | [1014] | [1014] | [1014] | [1014] |
| paraphrase | families sleeping on roofs during heatwaves | [1014] | [1005, 1014, 1002, 17, 1009] | [1014] | [1014] |
| paraphrase | cities several degrees hotter than the countryside | [1014] | [1009, 1014, 1016, 23, 27] | [1014] | [1014] |
| exact | Lisbon gentrification | [1015] | [1015] | [1015] | [1015] |
| paraphrase | tourist apartments pushing out long-term tenants | [1015] | [1015, 1027, 1028, 1017, 1005] | [1015] | [1015] |
| paraphrase | elderly tenants fighting eviction | [1015] | [1015] | [1015] | [1015] |
| exact | okada ban Lagos | [1016] | [1016] | [1016] | [1016] |
| paraphrase | motorbike taxis banned from main roads | [1016] | [1016, 17, 1011, 1023, 1025] | [1016] | [1016] |
| paraphrase | commuters stuck without fast transport | [1016] | [1016, 1018, 18, 26, 1022] | [1016] | [1016] |
| exact | Seoul basement flats flooding | [1017] | [1017] | [1017] | [1017] |
| paraphrase | people drowning in their homes during heavy rain | [1017] | [1017, 1030, 1025, 1001, 27] | [1017] | [1017] |
| paraphrase | cheap housing below street level | [1017] | [1017] | [1017] | [1017] |
| exact | La Paz cable cars | [1018] | [1018] | [1018] | [1018] |
| paraphrase | gondolas carrying commuters over rooftops | [1018] | [1018, 1016, 1021, 1014, 1015] | [1018] | [1018] |
| paraphrase | shorter commutes between a valley and a plateau | [1018] | [1018, 28, 1002, 1004] | [1018] | [1018] |
| exact | Rohingya refugee camps | [1019] | [1019] | [1019] | [1019] |
| paraphrase | stateless children growing up without schooling | [1019] | [1019, 1010, 1012, 1029, 1013] | [1029] | [1029] |
| paraphrase | aid cuts for people living in camps | [1019] | [1019, 1030, 1009, 1025, 1010] | [1019, 1025] | [1019, 1025] |
| exact | borderization in Georgia | [1020] | [1020] | [1020] | [1020] |
| paraphrase | fences moving into villagers' fields | [1020] | [1020, 1001, 1004, 1023, 1025] | [1020] | [1020] |
| paraphrase | farmers detained for crossing a line they cannot see | [1020] | [1020] | [1020, 1023] | [1020, 1023] |
| exact | Lampedusa sea rescue | [1021] | [1021] | [1021] | [1021] |
| paraphrase | overcrowded boats crossing to Europe | [1021] | [1021] | [1021] | [1021] |
| paraphrase | fishermen finding bodies in their nets | [1021] | [1021] | [1021] | [1021] |
| exact | Busia border traders | [1022] | [1022] | [1022] | [1022] |
| paraphrase | women carrying goods across a border every day | [1022] | [1022, 17, 23, 26, 27] | [1022] | [1022] |
| paraphrase | customs officials harassing small traders | [1022] | [1022, 1023, 26, 1005, 1013] | [1022] | [1022] |
| exact | Irish border Brexit | [1023] | [1023] | [1023] | [1023] |
| paraphrase | fear that checkpoints will return after leaving the European Union | [1023] | [1023, 17, 28, 1004, 1019] | [1023] | [1023] |
| paraphrase | a farm with fields in two countries | [1023] | [1024, 1023, 1007, 1027, 1020] | [1023, 1007, 1024, 1020] | [1023, 1007, 1024, 1020] |
| exact | Akwesasne Mohawk | [1024] | [1024] | [1024] | [1024] |
| paraphrase | an Indigenous community split by an international border | [1024] | [1024, 28, 1022, 17, 1020] | [1024] | [1024] |
| paraphrase | showing documents at customs to visit relatives nearby | [1024] | [1024, 1022, 1023, 1002, 17] | [1024] | [1024] |
| exact | Pakistan floods Sindh | [1025] | [1025] | [1025] | [1025] |
| paraphrase | families living on embankments after a flood | [1025] | [1025] | [1025, 1017] | [1025, 1017] |
| paraphrase | monsoon rains destroying crops and homes | [1025] | [1025, 1017, 1001, 1002, 1003] | [1025] | [1025] |
| exact | Turkey earthquake Antakya | [1026] | [1026] | [1026] | [1026] |
| paraphrase | rescuers digging survivors out of collapsed buildings | [1026] | [1026, 1021, 1015] | [1026] | [1026] |
| paraphrase | families living in containers after a disaster | [1026] | [1026] | [1026, 1017] | [1026, 1017] |
| exact | Indian farmers' protest | [1027] | [1027, 25, 1023, 1030, 1020] | [1027] | [1027] |
| paraphrase | farmers camping on highways for a year | [1027] | [1027, 1023, 17, 18, 26] | [1027] | [1027] |
| paraphrase | community kitchens feeding a protest camp | [1027, 1030] | [1027] | [1030, 1027] | [1027, 1030] |
| exact | Rhodes wildfires | [1028] | [1028] | [1028] | [1028] |
| paraphrase | tourists evacuated from burning resorts | [1028] | [28, 1028, 17, 1010, 1004] | [1028] | [1028] |
| paraphrase | volunteers fighting forest fires during a heatwave | [1028] | [1028, 1005, 25, 28, 1003] | [1028] | [1028] |
| exact | drought in Marsabit | [1029] | [1029] | [1029] | [1029] |
| paraphrase | herders losing cattle and camels when rains fail | [1029] | [1029, 1002, 1006, 1007, 1017] | [1029] | [1029] |
| paraphrase | children leaving school because of drought | [1029] | [1029, 1012, 17, 1019, 28] | [1029] | [1029] |
| exact | Sri Lanka economic crisis | [1030] | [1030] | [1030] | [1030] |
| paraphrase | queues for fuel and cooking gas | [1030] | [1030] | [1030, 1028] | [1030, 1028] |
| paraphrase | protesters forcing a president to resign | [1030] | [1030, 1027] | [1030] | [1030] |
| topic | climate change hurting coastal communities | [1003, 1005] | [23, 1028, 1029, 28, 1007] | [1003, 1005] | [1003, 1005] |
| topic | Indigenous peoples defending their land and culture | [28, 1007, 1012, 1024] | [28, 17, 1007, 1024, 1012] | [28, 1007] | [28, 1007] |
| topic | protests that forced the government to change course | [25, 1027, 1030] | [25, 1030, 1028, 23, 28] | [1030, 25, 1027] | [1030, 25, 1027] |
| topic | migrants crossing borders on dangerous routes | [26, 27, 1021] | [27, 1021, 26, 1024, 1001] | [27] | [27] |
| topic | people living with predators that kill their livestock | [1002, 1004, 1006] | [1009, 1030, 1002, 1006, 1029] | [1002] | [1002] |
| off-topic | chocolate cake recipe | [] | [] | [] | [] |
| off-topic | quantum computing | [] | [] | [] | [] |
| off-topic | football transfer news | [] | [1018] | [] | [] |
| off-topic | best smartphone deals | [] | [] | [] | [] |
| off-topic | how to bake sourdough bread | [] | [] | [] | [] |
| off-topic | stock market prediction | [] | [1018, 1022] | [] | [] |
| off-topic | video game release dates | [] | [1010] | [] | [] |
| off-topic | wedding dress fashion trends | [] | [1009] | [] | [] |
| off-topic | car engine repair | [] | [28, 1018, 17, 23, 26] | [] | [] |
