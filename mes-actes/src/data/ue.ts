/**
 * Maquettes UE/EC des licences professionnelles de l’IFSIO, transposes des
 * classeurs officiels « Classeur_IDE » (soins infirmiers) et « Classeur_SFE »
 * (soins obstétricaux) — feuilles Licence 1 à Licence 3.
 *
 * Les codes absents des classeurs restent absents ici : aucun code inventé.
 */

export type NiveauUE = 'Licence 1' | 'Licence 2' | 'Licence 3'
export type FiliereUE = 'IDE' | 'SFE'

export interface ECItem {
  name: string
  /** Code EC (présent pour SFE Licence 2 et 3). */
  code?: string
}

export interface UEItem {
  name: string
  /** Code UE (présent quand renseigné dans le classeur). */
  code?: string
  credits?: number
  /** Vide lorsque la source indique « EC non listés ». */
  ecs: ECItem[]
  note?: string
}

export const NIVEAUX_UE: NiveauUE[] = ['Licence 1', 'Licence 2', 'Licence 3']

export const FILIERE_LABELS: Record<FiliereUE, string> = {
  IDE: 'Licence Professionnelle en Soins Infirmiers',
  SFE: 'Licence Professionnelle en Soins Obstétricaux',
}

export const UE_CATALOG: Record<FiliereUE, Record<NiveauUE, UEItem[]>> = {
  "IDE": {
    "Licence 1": [
      {
        "name": "Anatomie et physiologie générale du corps humain",
        "ecs": [
          {
            "name": "Anatomie générale"
          },
          {
            "name": "Physiologie générale"
          }
        ]
      },
      {
        "name": "Anatomie et physiologie obstétricale",
        "ecs": [
          {
            "name": "Anatomie obstétricale"
          },
          {
            "name": "Physiologie obstétricale"
          }
        ]
      },
      {
        "name": "Sémiologie générale",
        "ecs": [
          {
            "name": "Sémiologie médicale"
          },
          {
            "name": "Sémiologie chirurgicale"
          }
        ]
      },
      {
        "name": "Discipline infirmière et sage-femme et démarche transversale en SIO",
        "ecs": [
          {
            "name": "Historique des professions infirmière et sage-femme"
          },
          {
            "name": "Savoirs fondamentaux infirmiers et sage-femmes"
          }
        ]
      },
      {
        "name": "Soins infirmiers en chirurgie / secourisme de base",
        "ecs": [
          {
            "name": "Soins infirmiers de base en chirurgie"
          },
          {
            "name": "Secourisme de base"
          }
        ]
      },
      {
        "name": "Soins infirmiers en obstétrique et en pédiatrie de base",
        "ecs": [
          {
            "name": "Soins infirmiers de base en obstétrique"
          },
          {
            "name": "Soins infirmiers de base en pédiatrie"
          }
        ]
      },
      {
        "name": "Hygiène et prévention des infections liées aux soins",
        "ecs": [],
        "note": "EC non listés sur la source"
      },
      {
        "name": "Soins infirmiers de base en médecine",
        "ecs": [],
        "note": "EC non listés sur la source"
      },
      {
        "name": "Méthodes de travail universitaire et TIC",
        "ecs": [
          {
            "name": "Méthodes de travail universitaire"
          },
          {
            "name": "TIC"
          }
        ]
      },
      {
        "name": "Législation, éthique et déontologie en SIO",
        "ecs": [
          {
            "name": "Législation en SIO"
          },
          {
            "name": "Éthique et déontologie en SIO"
          }
        ]
      },
      {
        "name": "Anglais et TEEO",
        "ecs": [
          {
            "name": "Anglais"
          },
          {
            "name": "TEEO"
          }
        ]
      },
      {
        "name": "Pharmacologie – Nutrition – Biochimie",
        "ecs": [
          {
            "name": "Pharmacologie générale"
          },
          {
            "name": "Nutrition"
          },
          {
            "name": "Introduction à la biochimie"
          }
        ]
      },
      {
        "name": "Microbiologie – Hématologie",
        "ecs": [
          {
            "name": "Bactériologie et virologie – Parasitologie et mycologie"
          },
          {
            "name": "Hématologie – Transfusion"
          }
        ]
      },
      {
        "name": "Puériculture et pédiatrie sociale",
        "ecs": [
          {
            "name": "Notions de base en puériculture"
          },
          {
            "name": "Pédiatrie sociale"
          }
        ]
      },
      {
        "name": "Santé publique",
        "ecs": [],
        "note": "EC non listés sur la source"
      },
      {
        "name": "Psychologie – Sociologie – Anthropologie",
        "ecs": [
          {
            "name": "Psychologie générale en santé"
          },
          {
            "name": "Socio-anthropologie africaine"
          }
        ]
      }
    ],
    "Licence 2": [
      {
        "name": "Pharmacologie spéciale, hématologie clinique et transfusion sanguine",
        "credits": 4,
        "ecs": [
          {
            "name": "Pharmacologie spéciale"
          },
          {
            "name": "Introduction à la pharmacopée"
          },
          {
            "name": "Hématologie clinique"
          },
          {
            "name": "Transfusion sanguine"
          }
        ]
      },
      {
        "name": "Gynécologie et obstétrique avancées",
        "credits": 4,
        "ecs": [
          {
            "name": "Sémiologie gynécologique, Introduction à la SSR et droits connexes"
          },
          {
            "name": "Accouchement normal, Gynécologie et Obstétrique avancée et SONU"
          },
          {
            "name": "VIH/SIDA et PTME"
          },
          {
            "name": "Approche « Harm reduction »"
          }
        ]
      },
      {
        "name": "Endocrinologie, nutrition et diététique",
        "credits": 3,
        "ecs": [
          {
            "name": "Endocrinologie"
          },
          {
            "name": "Nutrition et diététique"
          }
        ]
      },
      {
        "name": "Soins infirmiers avancés en chirurgie",
        "credits": 3,
        "ecs": [
          {
            "name": "SIA en chirurgie traumatologie"
          },
          {
            "name": "SIA en chirurgie viscérale"
          },
          {
            "name": "SIA en chirurgie pédiatrique"
          }
        ]
      },
      {
        "name": "Pathologies médicales – Soins infirmiers spécialisés en médecine",
        "credits": 4,
        "ecs": [
          {
            "name": "Gériatrie et rhumatologie"
          },
          {
            "name": "Pneumologie, infections courantes et cardiologie"
          },
          {
            "name": "Anesthésie-réanimation et néphrologie"
          },
          {
            "name": "Gastroentérologie, neurologie et psychiatrie"
          }
        ]
      },
      {
        "name": "Soins infirmiers avancés en pédiatrie et obstétrique",
        "credits": 2,
        "ecs": [
          {
            "name": "SIA en pédiatrie"
          },
          {
            "name": "SIA en obstétrique"
          }
        ]
      },
      {
        "name": "Pathologies chirurgicales",
        "credits": 4,
        "ecs": [
          {
            "name": "Pathologie chirurgicale vasculaire, traumatologie/orthopédie"
          },
          {
            "name": "Chirurgie infantile et neurochirurgie"
          },
          {
            "name": "Kinésithérapie et imagerie médicale"
          },
          {
            "name": "Chirurgie viscérale et urologie"
          }
        ]
      },
      {
        "name": "Anglais professionnel",
        "credits": 1,
        "ecs": [
          {
            "name": "Anglais professionnel"
          }
        ]
      },
      {
        "name": "Soins infirmiers avancés en médecine (1)",
        "credits": 2,
        "ecs": [
          {
            "name": "SIA en gastroentérologie et rhumatologie"
          },
          {
            "name": "SIA en cardiologie et pneumologie"
          }
        ]
      },
      {
        "name": "Soins infirmiers avancés en médecine (2)",
        "credits": 2,
        "ecs": [
          {
            "name": "SIM endocrinologie"
          },
          {
            "name": "SIM réanimation et médecine d'urgence"
          }
        ]
      },
      {
        "name": "Initiation à la recherche scientifique",
        "credits": 1,
        "ecs": [
          {
            "name": "Recherche qualitative et quantitative"
          }
        ]
      },
      {
        "name": "Puériculture-pédiatrie",
        "credits": 4,
        "ecs": [
          {
            "name": "Pédiatrie"
          },
          {
            "name": "Puériculture"
          }
        ]
      },
      {
        "name": "Biostatistique",
        "credits": 2,
        "ecs": [
          {
            "name": "Biostatistique"
          }
        ]
      },
      {
        "name": "Soins infirmiers avancés en chirurgie (SIC)",
        "credits": 2,
        "ecs": [
          {
            "name": "SIC urologie"
          },
          {
            "name": "SIC neurochirurgie et imagerie médicale"
          }
        ]
      },
      {
        "name": "Santé publique et communautaire – Épidémiologie",
        "ecs": [
          {
            "name": "Santé communautaire / Promotion de la santé"
          },
          {
            "name": "Épidémiologie"
          }
        ]
      },
      {
        "name": "Législation – Éthique – Déontologie",
        "credits": 2,
        "ecs": [
          {
            "name": "Droit de la santé"
          },
          {
            "name": "Santé sécurité au travail"
          }
        ]
      },
      {
        "name": "Soins infirmiers approfondis en pédiatrie",
        "credits": 2,
        "ecs": [
          {
            "name": "SIA en pédiatrie"
          },
          {
            "name": "Gestion de stock"
          }
        ]
      }
    ],
    "Licence 3": [
      {
        "name": "Pathologie médicale de spécialités",
        "credits": 2,
        "ecs": [
          {
            "name": "Dermato-vénérologie"
          },
          {
            "name": "Cancérologie"
          }
        ]
      },
      {
        "name": "Pathologie chirurgicale de spécialités",
        "credits": 2,
        "ecs": [
          {
            "name": "Odontostomatologie et ORL"
          },
          {
            "name": "Ophtalmologie"
          }
        ]
      },
      {
        "name": "SIS en médecine",
        "credits": 2,
        "ecs": [
          {
            "name": "SIS en cancérologie"
          },
          {
            "name": "SIS en dermatologie et en psychiatrie"
          }
        ]
      },
      {
        "name": "SIS en chirurgie",
        "credits": 3,
        "ecs": [
          {
            "name": "SIS en odontostomatologie et ORL"
          },
          {
            "name": "SIS en ophtalmologie"
          },
          {
            "name": "SIS au bloc opératoire et en stérilisation / urgence"
          }
        ]
      },
      {
        "name": "Santé mentale et gériatrie",
        "credits": 2,
        "ecs": [
          {
            "name": "Psychiatrie, santé mentale et sexualité"
          },
          {
            "name": "Gériatrie et soins infirmiers"
          }
        ]
      },
      {
        "name": "Gestion des services de santé",
        "credits": 3,
        "ecs": [
          {
            "name": "Gestion des services de santé et méthodologie de la gestion des services ; supervision"
          },
          {
            "name": "Gestion des ressources (humaines, matérielles)"
          },
          {
            "name": "Entretien d'équipements et dispositifs spéciaux"
          },
          {
            "name": "Gestion de stock"
          }
        ]
      },
      {
        "name": "Pratiques cliniques au lit du malade",
        "credits": 6,
        "ecs": [
          {
            "name": "En médecine"
          },
          {
            "name": "En pédiatrie"
          },
          {
            "name": "En chirurgie"
          }
        ]
      },
      {
        "name": "Stage de spécialités chirurgicales",
        "credits": 3,
        "ecs": [
          {
            "name": "Stage en odontostomatologie, ORL"
          },
          {
            "name": "Stage en ophtalmologie, au bloc opératoire"
          }
        ]
      },
      {
        "name": "Stage de spécialités médicales",
        "credits": 3,
        "ecs": [
          {
            "name": "Stage en transfusion sanguine, aux urgences"
          },
          {
            "name": "Stage en psychiatrie, dermatologie"
          }
        ]
      },
      {
        "name": "Droit, législation, éthique et déontologie approfondis",
        "credits": 3,
        "ecs": [
          {
            "name": "Éthique et déontologie approfondies et ordres"
          },
          {
            "name": "Législation du travail et droits humains"
          },
          {
            "name": "Droit de la famille"
          }
        ]
      },
      {
        "name": "SSR",
        "credits": 4,
        "ecs": [
          {
            "name": "Santé sexuelle"
          },
          {
            "name": "Santé de la reproduction"
          }
        ]
      },
      {
        "name": "Leadership entrepreneuriat et leadership infirmiers",
        "credits": 2,
        "ecs": [
          {
            "name": "Leadership entrepreneuriat et leadership infirmiers"
          }
        ]
      },
      {
        "name": "UE libre",
        "credits": 1,
        "ecs": [
          {
            "name": "UE libre"
          }
        ]
      },
      {
        "name": "Synthèse des connaissances ou DSI",
        "credits": 4,
        "ecs": [
          {
            "name": "Synthèse des connaissances ou DSI"
          }
        ]
      },
      {
        "name": "Stage approfondi en zone rurale",
        "credits": 8,
        "ecs": [
          {
            "name": "Stage en zone rurale"
          },
          {
            "name": "Stage au lit du malade"
          }
        ]
      },
      {
        "name": "Protocole de recherche, rédaction de mémoire et soutenance",
        "credits": 12,
        "ecs": [
          {
            "name": "Protocole de recherche, rédaction de mémoire et soutenance"
          }
        ]
      }
    ]
  },
  "SFE": {
    "Licence 1": [
      {
        "name": "Anatomie et physiologie générale du corps humain",
        "ecs": [
          {
            "name": "Anatomie générale"
          },
          {
            "name": "Physiologie générale"
          }
        ]
      },
      {
        "name": "Anatomie et physiologie obstétricale",
        "ecs": [
          {
            "name": "Anatomie obstétricale"
          },
          {
            "name": "Physiologie obstétricale"
          }
        ]
      },
      {
        "name": "Sémiologie générale",
        "ecs": [
          {
            "name": "Sémiologie médicale"
          },
          {
            "name": "Sémiologie chirurgicale"
          }
        ]
      },
      {
        "name": "Discipline infirmière et sage-femme et démarche transversale en SIO",
        "ecs": [
          {
            "name": "Historique des professions infirmière et sage-femme"
          },
          {
            "name": "Savoirs fondamentaux infirmiers et sage-femmes"
          }
        ]
      },
      {
        "name": "Soins infirmiers en chirurgie / secourisme de base",
        "ecs": [
          {
            "name": "Soins infirmiers de base en chirurgie"
          },
          {
            "name": "Secourisme de base"
          }
        ]
      },
      {
        "name": "Soins infirmiers en obstétrique et en pédiatrie de base",
        "ecs": [
          {
            "name": "Soins infirmiers de base en obstétrique"
          },
          {
            "name": "Soins infirmiers de base en pédiatrie"
          }
        ]
      },
      {
        "name": "Hygiène et prévention des infections liées aux soins",
        "ecs": [],
        "note": "EC non listés sur la source"
      },
      {
        "name": "Soins infirmiers de base en médecine",
        "ecs": [],
        "note": "EC non listés sur la source"
      },
      {
        "name": "Méthodes de travail universitaire et TIC",
        "ecs": [
          {
            "name": "Méthodes de travail universitaire"
          },
          {
            "name": "TIC"
          }
        ]
      },
      {
        "name": "Législation, éthique et déontologie en SIO",
        "ecs": [
          {
            "name": "Législation en SIO"
          },
          {
            "name": "Éthique et déontologie en SIO"
          }
        ]
      },
      {
        "name": "Anglais et TEEO",
        "ecs": [
          {
            "name": "Anglais"
          },
          {
            "name": "TEEO"
          }
        ]
      },
      {
        "name": "Pharmacologie – Nutrition – Biochimie",
        "ecs": [
          {
            "name": "Pharmacologie générale"
          },
          {
            "name": "Nutrition"
          },
          {
            "name": "Introduction à la biochimie"
          }
        ]
      },
      {
        "name": "Microbiologie – Hématologie",
        "ecs": [
          {
            "name": "Bactériologie et virologie – Parasitologie et mycologie"
          },
          {
            "name": "Hématologie – Transfusion"
          }
        ]
      },
      {
        "name": "Puériculture et pédiatrie sociale",
        "ecs": [
          {
            "name": "Notions de base en puériculture"
          },
          {
            "name": "Pédiatrie sociale"
          }
        ]
      },
      {
        "name": "Santé publique",
        "ecs": [],
        "note": "EC non listés sur la source"
      },
      {
        "name": "Psychologie – Sociologie – Anthropologie",
        "ecs": [
          {
            "name": "Psychologie générale en santé"
          },
          {
            "name": "Socio-anthropologie africaine"
          }
        ]
      }
    ],
    "Licence 2": [
      {
        "name": "Initiation à la santé de la reproduction",
        "code": "ISR1301",
        "credits": 4,
        "ecs": [
          {
            "name": "Sémiologie gynécologique et obstétricale, Introduction à la SSR et droits connexes",
            "code": "1ISR1301"
          },
          {
            "name": "Obstétrique normale",
            "code": "2ISR1301"
          },
          {
            "name": "VIH/SIDA/PTME/SAA/Harm réduction",
            "code": "3ISR1301"
          },
          {
            "name": "Technique de soins obstétricaux de base",
            "code": "4ISR1301"
          }
        ]
      },
      {
        "name": "Pathologie médicale et grossesse",
        "code": "PMG1302",
        "credits": 4,
        "ecs": [
          {
            "name": "Endocrinologie et Gastroentérologie",
            "code": "1PMG1302"
          },
          {
            "name": "Pneumologie et infections courantes, Dermatologie",
            "code": "2PMG1302"
          },
          {
            "name": "Psychiatrie et Neurologie, Ophtalmologie et ORL",
            "code": "3PMG1302"
          },
          {
            "name": "Anesthésie-Réanimation et Cardiologie et Néphrologie",
            "code": "4PMG1302"
          }
        ]
      },
      {
        "name": "Pédiatrie et néonatologie générale",
        "code": "PNG1303",
        "credits": 6,
        "ecs": [
          {
            "name": "Généralités en pédiatrie et en néonatologie",
            "code": "1PNG1303"
          },
          {
            "name": "Soins de base en pédiatrie et en néonatologie",
            "code": "2PNG1303"
          }
        ]
      },
      {
        "name": "Stage avancé en pédiatrie",
        "code": "SAP1304",
        "credits": 3,
        "ecs": [
          {
            "name": "Néonatologie et pédiatrie",
            "code": "1SAP1304"
          }
        ]
      },
      {
        "name": "Stage avancé en maternité",
        "code": "SAM1305",
        "credits": 3,
        "ecs": [
          {
            "name": "Stage avancé en maternité",
            "code": "1SAM1305"
          }
        ]
      },
      {
        "name": "Pratiques obstétricales",
        "code": "POB1306",
        "credits": 4,
        "ecs": [
          {
            "name": "Soins obstétricaux spécifiques",
            "code": "1POB1306"
          },
          {
            "name": "Manœuvres obstétricales",
            "code": "2POB1306"
          }
        ]
      },
      {
        "name": "Santé communautaire et promotion de la santé",
        "code": "SCP1307",
        "credits": 2,
        "ecs": [
          {
            "name": "Notions de base en santé communautaire ; Introduction et processus pour un changement de comportement en DSSR",
            "code": "1SCP1307"
          },
          {
            "name": "Notions de base en promotion de la santé",
            "code": "2SCP1307"
          }
        ]
      },
      {
        "name": "Biostatistique et épidémiologie",
        "code": "BEP1308",
        "credits": 2,
        "ecs": [
          {
            "name": "Notions de base en biostatistique",
            "code": "1BEP1308"
          },
          {
            "name": "Notions de base en épidémiologie",
            "code": "2BEP1308"
          }
        ]
      },
      {
        "name": "Anglais professionnel",
        "code": "APR1309",
        "credits": 2,
        "ecs": [
          {
            "name": "Anglais professionnel",
            "code": "1APR1309"
          }
        ]
      },
      {
        "name": "Pharmacologie – Pathologie chirurgicale",
        "code": "PPC1401",
        "credits": 5,
        "ecs": [
          {
            "name": "Pathologie chirurgicale",
            "code": "1PPC1401"
          },
          {
            "name": "Pharmacologie spécifique / initiation à la pharmacopée traditionnelle",
            "code": "2PPC1401"
          }
        ]
      },
      {
        "name": "Santé de la reproduction avancée",
        "code": "SRA1402",
        "credits": 4,
        "ecs": [
          {
            "name": "Pathologie gynécologique et obstétricale",
            "code": "1SRA1402"
          },
          {
            "name": "Planification familiale et méthodes contraceptives",
            "code": "2SRA1402"
          },
          {
            "name": "Soins obstétricaux d'urgence",
            "code": "3SRA1402"
          },
          {
            "name": "Kinésithérapie",
            "code": "4SRA1402"
          }
        ]
      },
      {
        "name": "Législation – Éthique et déontologie",
        "code": "LED1403",
        "credits": 4,
        "ecs": [
          {
            "name": "Éthique et déontologie de la profession sage-femme",
            "code": "1LED1403"
          },
          {
            "name": "Droits et législation du travail (introduction aux droits humains)",
            "code": "2LED1403"
          }
        ]
      },
      {
        "name": "Soins infirmiers approfondis en pédiatrie",
        "code": "SIA1404",
        "credits": 2,
        "ecs": [
          {
            "name": "Soins infirmiers approfondis en pédiatrie",
            "code": "1SIA1404"
          }
        ]
      },
      {
        "name": "Stage approfondi en pédiatrie",
        "code": "SAP1405",
        "credits": 2,
        "ecs": [
          {
            "name": "Stage en pédiatrie et néonatologie",
            "code": "1SAP1405"
          }
        ]
      },
      {
        "name": "Pratiques obstétricales avancées",
        "code": "POA1406",
        "credits": 2,
        "ecs": [
          {
            "name": "Soins obstétricaux spécifiques",
            "code": "1POA1406"
          },
          {
            "name": "Manœuvres obstétricales",
            "code": "2POA1406"
          }
        ]
      },
      {
        "name": "Stage approfondi en maternité et présentation des cas cliniques",
        "code": "SAM1407",
        "credits": 3,
        "ecs": [
          {
            "name": "Stage avancé en maternité",
            "code": "1SAM1407"
          },
          {
            "name": "Présentation des cas cliniques",
            "code": "2SAM1407"
          }
        ]
      },
      {
        "name": "Stage d'immersion en zone rurale",
        "code": "SIZ1408",
        "credits": 3,
        "ecs": [
          {
            "name": "Stage d'immersion en zone rurale",
            "code": "1SIZ1408"
          }
        ]
      },
      {
        "name": "Méthodologie de la recherche en SIO",
        "code": "MRS1409",
        "credits": 3,
        "ecs": [
          {
            "name": "Méthodologie de la recherche en SIO",
            "code": "1MRS1409"
          }
        ]
      },
      {
        "name": "Anglais scientifique",
        "code": "ASC1410",
        "credits": 2,
        "ecs": [
          {
            "name": "Anglais scientifique",
            "code": "1ASC1410"
          }
        ]
      }
    ],
    "Licence 3": [
      {
        "name": "Soins obstétricaux néonataux d'urgence",
        "code": "SON1501",
        "credits": 2,
        "ecs": [
          {
            "name": "Soins obstétricaux néonataux d'urgence",
            "code": "1SON1501"
          },
          {
            "name": "Safe delivery (SONU)",
            "code": "2SON1501"
          }
        ]
      },
      {
        "name": "Droits humains, législation et responsabilités",
        "code": "DLR1502",
        "credits": 2,
        "ecs": [
          {
            "name": "Droits humains, droits de la famille et éducation à la citoyenneté",
            "code": "1DLR1502"
          },
          {
            "name": "Approche et violences basées sur le genre ; Droits sexuels et santé de la reproduction",
            "code": "2DLR1502"
          }
        ]
      },
      {
        "name": "Entreprenariat en santé et leadership",
        "code": "ESL1503",
        "credits": 3,
        "ecs": [
          {
            "name": "Entreprenariat",
            "code": "1ESL1503"
          },
          {
            "name": "Leadership et outils de gestion de la clientèle",
            "code": "2ESL1503"
          }
        ]
      },
      {
        "name": "Pédiatrie approfondie",
        "code": "PAP1504",
        "credits": 2,
        "ecs": [
          {
            "name": "Programmes nationaux en pédiatrie (SNNU, PCIME, TETU)",
            "code": "1PAP1504"
          },
          {
            "name": "Pratique de soins approfondis en néonatologie",
            "code": "2PAP1504"
          }
        ]
      },
      {
        "name": "Santé de la reproduction approfondie",
        "code": "SRA1505",
        "credits": 3,
        "ecs": [
          {
            "name": "Pathologie gynécologique approfondie",
            "code": "1SRA1505"
          },
          {
            "name": "Pathologie obstétricale approfondie",
            "code": "2SRA1505"
          }
        ]
      },
      {
        "name": "Pratiques obstétricales approfondies",
        "code": "POA1506",
        "credits": 5,
        "ecs": [
          {
            "name": "Soins obstétricaux spécifiques (pratiques sur mannequin)",
            "code": "1POA1506"
          },
          {
            "name": "Manœuvres obstétricales approfondies",
            "code": "2POA1506"
          },
          {
            "name": "Soins de maternité respectueux et violence obstétricale",
            "code": "3POA1506"
          }
        ]
      },
      {
        "name": "Stage spécialisé en maternité et présentation des cas cliniques",
        "code": "SSM1507",
        "credits": 3,
        "ecs": [
          {
            "name": "Stage spécialisé en maternité",
            "code": "1SSM1507"
          },
          {
            "name": "Présentation des cas cliniques",
            "code": "2SSM1507"
          }
        ]
      },
      {
        "name": "Stage dans les services de planification familiale",
        "code": "SSP1508",
        "credits": 3,
        "ecs": [
          {
            "name": "Stage dans les services de planification familiale",
            "code": "1SSP1508"
          }
        ]
      },
      {
        "name": "Stage spécialisé en néonatologie et pédiatrie",
        "code": "SSN1509",
        "credits": 3,
        "ecs": [
          {
            "name": "Stage en néonatologie",
            "code": "1SSN1509"
          },
          {
            "name": "Stage en pédiatrie",
            "code": "2SSN1509"
          }
        ]
      },
      {
        "name": "Gestion des services de santé",
        "code": "GSS1510",
        "credits": 3,
        "ecs": [
          {
            "name": "Gestion des ressources humaines",
            "code": "1GSS1510"
          },
          {
            "name": "Gestion des projets de santé et méthodologie de supervision-formation ; Planification des interventions de DSSR",
            "code": "2GSS1510"
          },
          {
            "name": "Gestion comptable et financière / Gestion des stocks et des médicaments",
            "code": "3GSS1510"
          }
        ]
      },
      {
        "name": "Unité libre 1",
        "code": "ULI1511",
        "credits": 1,
        "ecs": [
          {
            "name": "Au choix : chants et danse, sport, art et démonstrations culinaires, code de la route, outils de la gestion de la qualité",
            "code": "ULI1511"
          }
        ]
      },
      {
        "name": "Stratégies nationales du système de santé au Bénin",
        "code": "SNS1601",
        "credits": 4,
        "ecs": [
          {
            "name": "Structures et programmes du système de santé au Bénin",
            "code": "1SNS1601"
          },
          {
            "name": "Stratégie de réduction de la mortalité maternelle et néonatale",
            "code": "2SNS1601"
          }
        ]
      },
      {
        "name": "Stage avancé en zone rurale",
        "code": "SAZ1602",
        "credits": 12,
        "ecs": [
          {
            "name": "Stage avancé en zone rurale",
            "code": "1SAZ1602"
          }
        ]
      },
      {
        "name": "Rédaction et soutenance du rapport de fin de formation",
        "code": "RSR1603",
        "credits": 14,
        "ecs": [
          {
            "name": "Rédaction du rapport",
            "code": "1RSR1603"
          },
          {
            "name": "Soutenance du rapport",
            "code": "2RSR1603"
          }
        ]
      }
    ]
  }
}

/** Rattache une filière du compte étudiant à son classeur (IDE ou SFE). */
export function filiereUE(filiere: string): FiliereUE {
  return /obst[ée]tricaux|sage/i.test(filiere) ? 'SFE' : 'IDE'
}

/** Niveau attendu pour un compte étudiant (« Licence 2 »…, sinon Licence 1). */
export function niveauUE(promotion: string): NiveauUE {
  return (NIVEAUX_UE as string[]).includes(promotion) ? (promotion as NiveauUE) : 'Licence 1'
}

/** Libellé complet affiché pour un EC ou une UE. */
export function libelleUE(ue: UEItem, ec?: ECItem): string {
  return ec ? `${ec.name} — ${ue.name}` : ue.name
}
