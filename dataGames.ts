import { DATA_AIRPORT } from './dataAirport';
import { DATA_HOTEL } from './dataHotel';
import { DATA_RESTAURANT } from './dataRestaurant';
import { DATA_SUPERMARKET } from './dataSupermarket';
import { WorldData, WorldId } from './types';

export const WORLDS_MAP: Record<WorldId, WorldData> = {
  aeropuerto: DATA_AIRPORT,
  hotel: DATA_HOTEL,
  restaurante: DATA_RESTAURANT,
  supermercado: DATA_SUPERMARKET,
};

export const ALL_WORLDS: WorldData[] = [
  DATA_AIRPORT,
  DATA_HOTEL,
  DATA_RESTAURANT,
  DATA_SUPERMARKET,
];

// Juego 3: ¡DIÁLOGO LOCO!
export interface CrazyDialogueSet {
  id: string;
  world: WorldId;
  titleEs: string;
  titleHy: string;
  lines: { speaker: string; es: string; hy: string }[];
}

export const CRAZY_DIALOGUES: CrazyDialogueSet[] = [
  {
    id: 'cd_1',
    world: 'hotel',
    titleEs: 'Llegada a recepción',
    titleHy: 'Ժամանում ընդունարան',
    lines: [
      { speaker: 'Cliente', es: 'Buenas tardes. Tengo una reserva.', hy: 'Բարի երեկո: Ես ամրագրում ունեմ:' },
      { speaker: 'Recepcionista', es: '¿A nombre de quién?', hy: 'Ո՞ւմ անունով է:' },
      { speaker: 'Cliente', es: 'A nombre de Gayane.', hy: 'Գայանեի անունով:' },
      { speaker: 'Recepcionista', es: 'Aquí tiene la llave. Habitación 204.', hy: 'Ահա բանալին: Սենյակ 204:' },
      { speaker: 'Cliente', es: 'Muchas gracias.', hy: 'Շատ շնորհակալություն:' },
    ],
  },
  {
    id: 'cd_2',
    world: 'aeropuerto',
    titleEs: 'En el mostrador del aeropuerto',
    titleHy: 'Օդանավակայանի հաշվառման սեղանին',
    lines: [
      { speaker: 'Agente', es: 'Buenos días. ¿Su pasaporte y su billete, por favor?', hy: 'Բարի լույս: Ձեր անձնագիրն ու տոմսը, խնդրեմ:' },
      { speaker: 'Razmik', es: 'Aquí tiene. ¿Cuánto pesa mi maleta?', hy: 'Ահա, խնդրեմ: Ինչքա՞ն է կշռում ճամպրուկս:' },
      { speaker: 'Agente', es: 'Pesa trece kilos. ¿Ventanilla o pasillo?', hy: 'Տասներեք կիլոգրամ: Լուսամուտ, թե՞ միջանցք:' },
      { speaker: 'Razmik', es: 'Ventanilla, por favor. ¿Dónde está la puerta de embarque?', hy: 'Լուսամուտի մոտ, խնդրում եմ: Որտե՞ղ է նստեցման դարպասը:' },
      { speaker: 'Agente', es: 'Es la puerta B8, después del control de seguridad.', hy: 'B8 դարպասն է՝ անվտանգության ստուգումից հետո:' },
    ],
  },
  {
    id: 'cd_3',
    world: 'restaurante',
    titleEs: 'Pidiendo la comida',
    titleHy: 'Ուտելիք պատվիրելիս',
    lines: [
      { speaker: 'Cliente', es: 'Hola. Una mesa para dos, por favor.', hy: 'Բարև: Երկու հոգու սեղան, խնդրում եմ:' },
      { speaker: 'Camarero', es: 'Claro, pasen por aquí. Aquí tienen la carta.', hy: 'Իհարկե, անցեք այստեղ: Ահա ճաշացանկը:' },
      { speaker: 'Cliente', es: '¿Qué lleva la ensalada especial?', hy: 'Ի՞նչ է պարունակում հատուկ աղցանը:' },
      { speaker: 'Camarero', es: 'Lleva tomate, queso fresco y cebolla.', hy: 'Պարունակում է լոլիկ, թարմ պանիր և սոխ:' },
      { speaker: 'Cliente', es: 'Para mí, la ensalada sin cebolla y agua fría.', hy: 'Ինձ համար՝ աղցանը առանց սոխի և սառը ջուր:' },
    ],
  },
  {
    id: 'cd_4',
    world: 'supermercado',
    titleEs: 'Pagando en la caja',
    titleHy: 'Վճարում դրամարկղում',
    lines: [
      { speaker: 'Cajero', es: 'Hola. ¿Quiere una bolsa para la compra?', hy: 'Բարև: Գնումների համար տոպրակ ուզո՞ւմ եք:' },
      { speaker: 'Cliente', es: 'Sí, por favor. ¿Cuánto es en total?', hy: 'Այո, խնդրում եմ: Ընդամենը ինչքա՞ն է:' },
      { speaker: 'Cajero', es: 'Son quince euros con treinta céntimos.', hy: 'Տասնհինգ եվրո երեսուն ցենտ է:' },
      { speaker: 'Cliente', es: '¿Puedo pagar con tarjeta?', hy: 'Կարո՞ղ եմ վճարել քարտով:' },
      { speaker: 'Cajero', es: 'Sí, claro. Aquí tiene su recibo. ¡Adiós!', hy: 'Այո, իհարկե: Ահա ձեր կտրոնը: Ցտեսություն:' },
    ],
  },
];

// Juego 6: ¡COMPRA MÁS INTELIGENTE!
export interface MarketProduct {
  id: string;
  nameEs: string;
  nameHy: string;
  unitEs: string;
  price: number;
  icon: string;
  offerTextEs?: string;
}

export const MARKET_PRODUCTS: MarketProduct[] = [
  { id: 'mp_leche', nameEs: 'Leche entera (1 L)', nameHy: 'Կաթ (1 լ)', unitEs: 'litro', price: 1.2, icon: '🥛', offerTextEs: 'Oferta' },
  { id: 'mp_leche_bio', nameEs: 'Leche especial (1 L)', nameHy: 'Հատուկ կաթ (1 լ)', unitEs: 'litro', price: 2.1, icon: '🥛' },
  { id: 'mp_manzanas', nameEs: 'Manzanas rojas (1 kg)', nameHy: 'Կարմիր խնձոր (1 կգ)', unitEs: 'kilo', price: 2.4, icon: '🍎', offerTextEs: 'Oferta' },
  { id: 'mp_tomates', nameEs: 'Tomates frescos (1 kg)', nameHy: 'Թարմ լոլիկ (1 կգ)', unitEs: 'kilo', price: 2.6, icon: '🍅' },
  { id: 'mp_arroz', nameEs: 'Paquete de arroz (1 kg)', nameHy: 'Բրինձ (1 փաթեթ)', unitEs: 'paquete', price: 1.5, icon: '🍚' },
  { id: 'mp_queso', nameEs: 'Queso manchego', nameHy: 'Պանիր', unitEs: 'paquete', price: 3.8, icon: '🧀' },
  { id: 'mp_pan', nameEs: 'Pan fresco', nameHy: 'Թարմ հաց', unitEs: 'barra', price: 1.1, icon: '🥖' },
  { id: 'mp_huevos', nameEs: 'Caja de huevos (12 u.)', nameHy: 'Ձու (12 հատ)', unitEs: 'caja', price: 2.5, icon: '🥚' },
  { id: 'mp_naranjas', nameEs: 'Naranjas dulces (1 kg)', nameHy: 'Նարինջ (1 կգ)', unitEs: 'kilo', price: 1.9, icon: '🍊', offerTextEs: '-20%' },
  { id: 'mp_agua', nameEs: 'Botella de agua (1.5 L)', nameHy: 'Ջուր (1.5 լ)', unitEs: 'botella', price: 0.8, icon: '💧' },
  { id: 'mp_yogur', nameEs: 'Pack de yogures (4 u.)', nameHy: 'Յոգուրտ (4 հատ)', unitEs: 'pack', price: 2.0, icon: '🥣' },
  { id: 'mp_aceite', nameEs: 'Aceite de oliva (1 L)', nameHy: 'Ձիթապտղի ձեթ (1 լ)', unitEs: 'botella', price: 5.5, icon: '🫒' },
];

export interface ShoppingListAssignment {
  player: 'razmik' | 'gayane';
  budget: number;
  items: { productId: string; qty: number; labelEs: string; labelHy: string }[];
}

export const SHOPPING_LISTS: Record<'razmik' | 'gayane', ShoppingListAssignment> = {
  razmik: {
    player: 'razmik',
    budget: 20,
    items: [
      { productId: 'mp_leche', qty: 2, labelEs: 'Dos litros de leche (más barata)', labelHy: 'Երկու լիտր էժան կաթ' },
      { productId: 'mp_manzanas', qty: 1, labelEs: 'Un kilo de manzanas rojas', labelHy: 'Մեկ կիլոգրամ կարմիր խնձոր' },
      { productId: 'mp_arroz', qty: 1, labelEs: 'Un paquete de arroz', labelHy: 'Մեկ փաթեթ բրինձ' },
      { productId: 'mp_pan', qty: 2, labelEs: 'Dos barras de pan fresco', labelHy: 'Երկու թարմ հաց' },
    ],
  },
  gayane: {
    player: 'gayane',
    budget: 20,
    items: [
      { productId: 'mp_tomates', qty: 1, labelEs: 'Un kilo de tomates frescos', labelHy: 'Մեկ կիլոգրամ թարմ լոլիկ' },
      { productId: 'mp_queso', qty: 1, labelEs: 'Un paquete de queso manchego', labelHy: 'Մեկ տուփ պանիր' },
      { productId: 'mp_naranjas', qty: 2, labelEs: 'Dos kilos de naranjas en oferta', labelHy: 'Երկու կիլոգրամ նարինջ (ակցիայով)' },
      { productId: 'mp_yogur', qty: 1, labelEs: 'Un pack de yogures', labelHy: 'Մեկ տուփ յոգուրտ' },
    ],
  },
};

// Juego 7: ¡CAMARERO POR UN DÍA!
export const RESTAURANT_MENU = [
  { categoryEs: 'Entrantes y Primeros', items: [
    { es: 'Ensalada de tomate y queso', hy: 'Լոլիկով և պանրով աղցան', price: 6 },
    { es: 'Sopa caliente de verduras', hy: 'Տաք բանջարեղենի ապուր', price: 5 },
  ]},
  { categoryEs: 'Segundos Platos', items: [
    { es: 'Pollo asado con patatas', hy: 'Տապակած հավ կարտոֆիլով', price: 10 },
    { es: 'Pescado fresco con limón', hy: 'Թարմ ձուկ կիտրոնով', price: 12 },
    { es: 'Pizza margarita sin cebolla', hy: 'Մարգարիտա պիցցա առանց սոխի', price: 9 },
    { es: 'Arroz español con verduras', hy: 'Իսպանական բրինձ բանջարեղենով', price: 9 },
  ]},
  { categoryEs: 'Bebidas y Postres', items: [
    { es: 'Zumo de naranja natural', hy: 'Թարմ նարնջի հյութ', price: 3 },
    { es: 'Botella de agua fría', hy: 'Սառը ջրի շիշ', price: 2 },
    { es: 'Helado de chocolate', hy: 'Շոկոլադե պաղպաղակ', price: 4 },
  ]},
];

export const RESTAURANT_6_STEPS = [
  { step: 1, es: 'Saludo y pedir mesa', hy: 'Բարևել և խնդրել սեղան' },
  { step: 2, es: 'Pedir la carta', hy: 'Խնդրել ճաշացանկը' },
  { step: 3, es: 'Elegir la comida', hy: 'Ընտրել ուտեստը' },
  { step: 4, es: 'Pedir la bebida', hy: 'Պատվիրել ըմպելիքը' },
  { step: 5, es: 'Preguntar ingredientes (con/sin)', hy: 'Հարցնել բաղադրիչների մասին' },
  { step: 6, es: 'Pedir la cuenta y pagar', hy: 'Խնդրել հաշիվը և վճարել' },
];

// Juego 8: ¡NO PIERDAS EL AVIÓN!
export interface AirportMissionZone {
  id: number;
  titleEs: string;
  titleHy: string;
  eventEs: string;
  eventHy: string;
  questionEs: string;
  options: string[];
  correctIndex: number;
  oralTaskEs: string;
  oralTaskHy: string;
}

export const AIRPORT_MISSION_ZONES: AirportMissionZone[] = [
  {
    id: 1,
    titleEs: 'Zona 1: Mostrador de facturación',
    titleHy: 'Գոտի 1. Հաշվառման սեղան',
    eventEs: '¡Tu maleta pesa 22 kilos y el máximo es 20! Además necesitas facturar.',
    eventHy: 'Ճամպրուկդ կշռում է 22 կգ, իսկ թույլատրելին 20 կգ է:',
    questionEs: '¿Qué dices para resolverlo y preguntar por tu mochila?',
    options: [
      'Saco dos kilos y los pongo en mi mochila. ¿Puedo llevar esta mochila como equipaje de mano?',
      'Quiero cambiar de habitación con desayuno incluido.',
      'La cuenta, por favor, sin cebolla.',
      '¿Dónde puedo encontrar el queso barato?',
    ],
    correctIndex: 0,
    oralTaskEs: 'Di en voz alta: cuánto pesa tu maleta y pide asiento de ventanilla.',
    oralTaskHy: 'Բարձրաձայն ասա՝ ինչքան է կշռում ճամպրուկդ և խնդրիր լուսամուտի տեղ:',
  },
  {
    id: 2,
    titleEs: 'Zona 2: Tarjeta de embarque',
    titleHy: 'Գոտի 2. Նստեցման կտրոն',
    eventEs: 'Tienes tres tarjetas sobre la mesa. El vuelo a Madrid IB-304 sale a las 11:20 por la puerta C4.',
    eventHy: 'Սեղանին երեք կտրոն կա. գտիր IB-304 Մադրիդ 11:20, դարպաս C4:',
    questionEs: 'Elige la tarjeta de embarque correcta:',
    options: [
      'Madrid · Vuelo IB-304 · 11:20 · Puerta C4 · Asiento 14A',
      'París · Vuelo AF-102 · 11:20 · Puerta A1 · Asiento 02B',
      'Madrid · Vuelo IB-304 · 18:45 · Puerta D9 · Asiento 22C',
      'Roma · Vuelo AZ-511 · 09:00 · Puerta B2 · Asiento 10F',
    ],
    correctIndex: 0,
    oralTaskEs: 'Lee en español tu destino, tu puerta de embarque y tu asiento.',
    oralTaskHy: 'Իսպաներեն կարդա քո նպատակակետը, դարպասը և նստատեղը:',
  },
  {
    id: 3,
    titleEs: 'Zona 3: Control de seguridad',
    titleHy: 'Գոտի 3. Անվտանգության ստուգում',
    eventEs: 'El agente de seguridad te pregunta: «¿Lleva líquidos o portátil en su mochila?»',
    eventHy: 'Անվտանգության աշխատակիցը հարցնում է՝ արդյոք հեղուկ կամ համակարգիչ ունե՞ս:',
    questionEs: '¿Cuál es la respuesta educada y correcta?',
    options: [
      'No llevo líquidos, solo mi portátil y mis libros. ¿Tengo que sacar el portátil?',
      'Sí, quiero un kilo de tomates y dos litros de leche.',
      'El aire acondicionado no funciona en la terminal.',
      'Aquí tiene el recibo del supermercado.',
    ],
    correctIndex: 0,
    oralTaskEs: 'Responde al agente de seguridad y pregunta si tienes que quitarte la chaqueta.',
    oralTaskHy: 'Պատասխանիր աշխատակցին և հարցրու՝ պե՞տք է հանել բաճկոնը:',
  },
  {
    id: 4,
    titleEs: 'Zona 4: Puerta de embarque y pantalla',
    titleHy: 'Գոտի 4. Ցուցատախտակ և դարպաս',
    eventEs: '¡Sorpresa! En la pantalla pone: «Vuelo IB-304 — CAMBIO DE PUERTA: ahora D7 — RETRASO 15 MIN».',
    eventHy: 'Անակնկալ. էկրանին գրված է դարպասի փոփոխություն D7 և 15 րոպե ուշացում:',
    questionEs: '¿Cómo explicas la situación a tu compañero?',
    options: [
      'Nuestro vuelo tiene un retraso de quince minutos y tenemos que ir a la puerta D7.',
      'Nuestro vuelo ya aterrizó en el hotel.',
      'Hemos perdido la cesta de manzanas en el pasillo.',
      'El desayuno está incluido en el avión.',
    ],
    correctIndex: 0,
    oralTaskEs: 'Pregunta a un empleado dónde está la puerta D7 y a qué hora empieza el embarque.',
    oralTaskHy: 'Հարցրու աշխատակցին՝ որտեղ է D7 դարպասը և երբ է սկսվում նստեցումը:',
  },
  {
    id: 5,
    titleEs: 'Zona 5: ¡A bordo del avión!',
    titleHy: 'Գոտի 5. Ինքնաթիռի ներսում',
    eventEs: 'Entras al avión, buscas el asiento 14A y la azafata te da la bienvenida.',
    eventHy: 'Մտնում ես ինքնաթիռ և փնտրում ես 14A նստատեղը:',
    questionEs: '¿Qué le dices a la azafata?',
    options: [
      'Hola, disculpe, ¿dónde está mi asiento 14A? ¿Puedo poner mi mochila arriba?',
      'Hola, ¿cuánto cuesta una habitación para dos noches?',
      'Hola, ¿me trae la cuenta por separado?',
      'Hola, ¿en qué pasillo está el pan?',
    ],
    correctIndex: 0,
    oralTaskEs: 'Despídete antes de despegar diciendo ¡Buen viaje! en español.',
    oralTaskHy: 'Ասա վերջին նախադասությունը թռիչքից առաջ իսպաներենով:',
  },
];

// Juego 9: ¡HOTEL MISTERIOSO! (16 escenarios reales)
export interface HotelMysteryScenario {
  id: number;
  situationEs: string;
  situationHy: string;
  hintWords: string[];
  sampleGuestEs: string;
  sampleReceptionistEs: string;
}

export const HOTEL_MYSTERY_SCENARIOS: HotelMysteryScenario[] = [
  { id: 1, situationEs: 'La llave de tu habitación no funciona y no puedes abrir la puerta.', situationHy: 'Սենյակի բանալին չի աշխատում, և դուռը չի բացվում:', hintWords: ['llave', 'no funciona', 'puerta', 'otra'], sampleGuestEs: 'Disculpe, la llave de mi habitación no funciona. ¿Me da otra?', sampleReceptionistEs: 'Lo siento, ahora mismo le preparo una llave nueva.' },
  { id: 2, situationEs: 'Hace muchísimo calor y no funciona el aire acondicionado.', situationHy: 'Սենյակում շատ շոգ է, իսկ օդորակիչը չի աշխատում:', hintWords: ['aire acondicionado', 'no funciona', 'calor', 'arreglar'], sampleGuestEs: 'Perdón, hace mucho calor y no funciona el aire acondicionado.', sampleReceptionistEs: 'Vamos a arreglarlo hoy o podemos cambiarlos de habitación.' },
  { id: 3, situationEs: 'No hay agua caliente en la ducha.', situationHy: 'Ցնցուղում տաք ջուր չկա:', hintWords: ['no hay', 'agua caliente', 'ducha'], sampleGuestEs: 'Disculpe, no hay agua caliente en la ducha.', sampleReceptionistEs: '¡Qué pena! Enviaré al técnico enseguida.' },
  { id: 4, situationEs: 'En el baño solo hay una toalla y sois dos personas.', situationHy: 'Լոգարանում միայն մեկ սրբիչ կա, իսկ դուք երկուսով եք:', hintWords: ['necesitamos', 'otra toalla', 'baño'], sampleGuestEs: 'Necesitamos otra toalla limpia para el baño, por favor.', sampleReceptionistEs: 'Claro, enseguida subimos dos toallas más.' },
  { id: 5, situationEs: 'No puedes conectarte a internet porque no sabes la clave.', situationHy: 'Չես կարողանում միանալ ինտերնետին, որովհետև չգիտես գաղտնաբառը:', hintWords: ['contraseña', 'wifi', 'cuál es'], sampleGuestEs: '¿Cuál es la contraseña del wifi, por favor?', sampleReceptionistEs: 'La contraseña es «HotelSol2026».' },
  { id: 6, situationEs: 'Hay mucho ruido en la calle y no puedes dormir.', situationHy: 'Փողոցում շատ աղմուկ կա, և չես կարողանում քնել:', hintWords: ['mucho ruido', 'cambiar de habitación', 'tranquila'], sampleGuestEs: 'Hay mucho ruido en la calle. ¿Podemos cambiar a una habitación más tranquila?', sampleReceptionistEs: 'Sí, tenemos una habitación muy tranquila en la quinta planta.' },
  { id: 7, situationEs: 'Hace frío por la noche y te falta una manta y una almohada.', situationHy: 'Գիշերը ցուրտ է, պետք են ծածկոց և բարձ:', hintWords: ['frío', 'manta', 'almohada', 'quisiera'], sampleGuestEs: 'Hace frío en la cama. Quisiera una manta y otra almohada.', sampleReceptionistEs: 'Por supuesto, se las llevo en cinco minutos.' },
  { id: 8, situationEs: 'El ascensor no funciona y tu habitación está en la cuarta planta.', situationHy: 'Վերելակը չի աշխատում, իսկ սենյակդ 4-րդ հարկում է:', hintWords: ['ascensor', 'escalera', 'planta', 'maletas'], sampleGuestEs: 'El ascensor no funciona. ¿Dónde está la escalera? ¿Nos ayudan con las maletas?', sampleReceptionistEs: 'La escalera está a la derecha, yo les ayudo con el equipaje.' },
  { id: 9, situationEs: 'Llegas a las 9:30 y preguntas si todavía sirven desayuno y si está incluido.', situationHy: 'Իջնում ես 9:30 և հարցնում՝ նախաճաշ կա՞ և արդյոք ներառված է:', hintWords: ['desayuno', 'incluido', 'a qué hora'], sampleGuestEs: '¿Todavía hay desayuno? ¿Está incluido en nuestra reserva?', sampleReceptionistEs: 'Sí, está incluido y termina a las diez y media.' },
  { id: 10, situationEs: 'La habitación está sucia cuando entras por primera vez.', situationHy: 'Սենյակ մտնելիս տեսնում ես, որ սենյակը կեղտոտ է:', hintWords: ['sucia', 'limpiar', 'cambiar'], sampleGuestEs: 'Perdón, nuestra habitación está sucia. ¿Pueden limpiarla o darnos otra?', sampleReceptionistEs: 'Mil disculpas, les damos inmediatamente otra habitación limpia.' },
  { id: 11, situationEs: 'Has olvidado tu pasaporte en la caja fuerte del cuarto anterior.', situationHy: 'Մոռացել ես անձնագիրդ նախորդ սենյակում:', hintWords: ['he olvidado', 'pasaporte', 'habitación'], sampleGuestEs: '¡Ayuda! He olvidado mi pasaporte en la habitación 202.', sampleReceptionistEs: 'No te preocupes, vamos a buscarlo ahora mismo.' },
  { id: 12, situationEs: 'Quieres dejar las maletas unas horas después de la hora de salida.', situationHy: 'Դուրս գրվելուց հետո ուզում ես թողնել ճամպրուկները ընդունարանում:', hintWords: ['salida', 'dejar', 'maletas', 'recepción'], sampleGuestEs: '¿A qué hora es la salida? ¿Podemos dejar nuestras maletas aquí hasta la tarde?', sampleReceptionistEs: 'La salida es a las doce, y pueden dejar aquí las maletas gratis.' },
  { id: 13, situationEs: 'La piscina parece cerrada y quieres nadar con tu compañero.', situationHy: 'Լողավազանը փակ է թվում, բայց ուզում եք լողալ:', hintWords: ['piscina', 'abierta', 'a qué hora'], sampleGuestEs: '¿La piscina está abierta hoy? ¿A qué hora cierra?', sampleReceptionistEs: 'Está abierta hasta las nueve de la noche. Aquí tienen toallas.' },
  { id: 14, situationEs: 'La calefacción hace un ruido muy extraño por la noche.', situationHy: 'Ջեռուցումը տարօրինակ ձայն է հանում:', hintWords: ['calefacción', 'ruido', 'funciona mal'], sampleGuestEs: 'La calefacción hace un ruido extraño y no funciona bien.', sampleReceptionistEs: 'La apagamos enseguida y revisamos el cuarto.' },
  { id: 15, situationEs: 'Quieres pagar con tarjeta, pero el datáfono dice error.', situationHy: 'Ուզում ես քարտով վճարել, բայց սարքը սխալ է տալիս:', hintWords: ['pagar', 'tarjeta', 'efectivo', 'precio'], sampleGuestEs: '¿Cuál es el precio total? Mi tarjeta no funciona, ¿puedo pagar en efectivo?', sampleReceptionistEs: 'Sí, claro, son ciento veinte euros en efectivo o con otra tarjeta.' },
  { id: 16, situationEs: 'Tienes una reserva para dos camas, pero la habitación solo tiene una cama.', situationHy: 'Ամրագրել ես երկու մահճակալով սենյակ, բայց միայն մեկը կա:', hintWords: ['reserva', 'dos camas', 'cambiar'], sampleGuestEs: 'Tengo una reserva para dos camas, pero aquí solo hay una cama.', sampleReceptionistEs: 'Perdone la confusión, ahora les cambiamos a una habitación con dos camas.' },
];

// Juego 10: ¡CONTINÚA EL DIÁLOGO!
export interface DialogueStarter {
  id: string;
  world: WorldId;
  titleEs: string;
  titleHy: string;
  firstLineEs: string;
  firstLineHy: string;
  suggestedContinuations: string[];
  targetTurns: number;
}

export const DIALOGUE_STARTERS: DialogueStarter[] = [
  {
    id: 'cd_start_1',
    world: 'hotel',
    titleEs: 'En la recepción del hotel',
    titleHy: 'Հյուրանոցի ընդունարանում',
    firstLineEs: 'Buenas tardes. ¿Tiene una habitación libre para dos personas?',
    firstLineHy: 'Բարի երեկո: Երկու հոգու համար ազատ սենյակ ունե՞ք:',
    suggestedContinuations: [
      'Sí, tenemos una habitación con dos camas. ¿Para cuántas noches?',
      'Para tres noches. ¿Cuánto cuesta y el desayuno está incluido?',
      'Cuesta noventa euros con desayuno incluido.',
      'Perfecto, la queremos. ¿En qué planta está?',
    ],
    targetTurns: 8,
  },
  {
    id: 'cd_start_2',
    world: 'aeropuerto',
    titleEs: 'Antes de embarcar',
    titleHy: 'Թռիչքից առաջ',
    firstLineEs: '¡Hola! Disculpe, ¿a qué hora sale nuestro avión a Madrid?',
    firstLineHy: 'Բարև: Ներեցեք, ժամը քանիսի՞ն է մեկնում Մադրիդի մեր ինքնաթիռը:',
    suggestedContinuations: [
      'Sale a las cuatro y media, pero tiene un pequeño retraso.',
      '¿Desde qué puerta de embarque sale?',
      'Desde la puerta B5. ¿Ya pasó el control de seguridad?',
      'Todavía no. ¿Puedo llevar esta mochila?',
    ],
    targetTurns: 8,
  },
  {
    id: 'cd_start_3',
    world: 'restaurante',
    titleEs: 'Pidamos la cena',
    titleHy: 'Պատվիրենք ընթրիք',
    firstLineEs: '¡Buenas noches! Bienvenidos. ¿Quieren una mesa dentro o en la terraza?',
    firstLineHy: 'Բարի երեկո: Բարի գալուստ: Սեղան ուզո՞ւմ եք ներսում, թե՞ պատշգամբում:',
    suggestedContinuations: [
      'En la terraza, por favor. ¿Nos trae la carta?',
      'Aquí tiene la carta. ¿Qué desean beber?',
      'Para mí un zumo de naranja. ¿Qué nos recomienda comer?',
      'Les recomiendo el pollo con patatas o la pizza sin cebolla.',
    ],
    targetTurns: 8,
  },
  {
    id: 'cd_start_4',
    world: 'supermercado',
    titleEs: 'Buscando ofertas',
    titleHy: 'Ակցիաներ փնտրելիս',
    firstLineEs: 'Perdone, ¿dónde puedo encontrar el queso y el pan fresco?',
    firstLineHy: 'Ներեցեք, որտե՞ղ կարող եմ գտնել պանիրը և թարմ հացը:',
    suggestedContinuations: [
      'El queso está en el pasillo dos y el pan al fondo.',
      'Gracias. ¿Hay alguna oferta hoy?',
      'Sí, los plátanos y la leche tienen descuento.',
      'Genial, también necesito medio kilo de tomates.',
    ],
    targetTurns: 8,
  },
];

// Juego 11: ¡SORPRESA! (Ruleta)
export interface WheelSector {
  id: string;
  labelEs: string;
  color: string;
  tasks: { es: string; hy: string; seconds: number; world: WorldId | 'todos' }[];
}

export const WHEEL_SECTORS: WheelSector[] = [
  {
    id: 'ws_aero',
    labelEs: 'Aeropuerto',
    color: '#0284C7',
    tasks: [
      { es: 'Di que has perdido tu maleta y pregunta dónde buscarla.', hy: 'Ասա, որ կորցրել ես ճամպրուկդ և հարցրու՝ որտեղ փնտրել:', seconds: 30, world: 'aeropuerto' },
      { es: 'Pregunta cuánto pesa tu equipaje y pide asiento de ventanilla.', hy: 'Հարցրու ուղեբեռի քաշը և խնդրիր լուսամուտի տեղ:', seconds: 30, world: 'aeropuerto' },
    ],
  },
  {
    id: 'ws_hotel',
    labelEs: 'Hotel',
    color: '#7C3AED',
    tasks: [
      { es: 'Explica en recepción que no funciona la ducha ni el wifi.', hy: 'Բացատրիր ընդունարանում, որ ցնցուղն ու վայ-ֆայը չեն աշխատում:', seconds: 35, world: 'hotel' },
      { es: 'Pide cambiar de habitación porque hay mucho ruido.', hy: 'Խնդրիր փոխել սենյակը, որովհետև շատ աղմուկ կա:', seconds: 30, world: 'hotel' },
    ],
  },
  {
    id: 'ws_rest',
    labelEs: 'Restaurante',
    color: '#EA580C',
    tasks: [
      { es: 'Pide en el restaurante un plato sin cebolla y pregunta qué lleva.', hy: 'Պատվիրիր ուտեստ առանց սոխի և հարցրու բաղադրիչները:', seconds: 30, world: 'restaurante' },
      { es: 'Pide la cuenta y pregunta si podéis pagar por separado.', hy: 'Խնդրիր հաշիվը և հարցրու՝ կարո՞ղ եք առանձին վճարել:', seconds: 25, world: 'restaurante' },
    ],
  },
  {
    id: 'ws_super',
    labelEs: 'Supermercado',
    color: '#059669',
    tasks: [
      { es: 'Compra medio kilo de queso y pide una bolsa en la caja.', hy: 'Գնիր կես կիլոգրամ պանիր և դրամարկղում տոպրակ խնդրիր:', seconds: 30, world: 'supermercado' },
      { es: 'Pide que te devuelvan el dinero por un producto cobrado por error.', hy: 'Խնդրիր վերադարձնել գումարը սխալմամբ հաշված ապրանքի համար:', seconds: 40, world: 'supermercado' },
    ],
  },
  {
    id: 'ws_sorpresa',
    labelEs: 'Pregunta sorpresa',
    color: '#DB2777',
    tasks: [
      { es: 'Hazle 3 preguntas diferentes en español a tu compañero en 30 segundos.', hy: '30 վայրկյանում 3 տարբեր հարց տուր ընկերոջդ իսպաներենով:', seconds: 30, world: 'todos' },
    ],
  },
  {
    id: 'ws_rapido',
    labelEs: 'Diálogo rápido',
    color: '#D97706',
    tasks: [
      { es: 'Improvisad un mini diálogo de 4 frases sobre perder el pasaporte.', hy: 'Հորինեք 4 նախադասությունից կազմված երկխոսություն անձնագիր կորցնելու մասին:', seconds: 45, world: 'aeropuerto' },
    ],
  },
  {
    id: 'ws_cambia',
    labelEs: 'Cambia de papel',
    color: '#2563EB',
    tasks: [
      { es: 'Razmik es camarero y Gayane es clienta: pedid una pizza y zumo.', hy: 'Ռազմիկը մատուցող է, Գայանեն՝ հաճախորդ. պատվիրեք պիցցա և հյութ:', seconds: 45, world: 'restaurante' },
    ],
  },
  {
    id: 'ws_habla30',
    labelEs: 'Habla 30 seg.',
    color: '#0D9488',
    tasks: [
      { es: 'Habla 30 segundos sobre tu comida favorita y qué compras para prepararla.', hy: 'Խոսիր 30 վայրկյան քո սիրած ուտելիքի և գնումների մասին:', seconds: 30, world: 'todos' },
    ],
  },
];

// Juego 15: ¡MISIÓN SECRETA!
export interface SecretMissionPair {
  id: string;
  titleEs: string;
  titleHy: string;
  goalEs: string;
  goalHy: string;
  razmikCard: {
    titleEs: string;
    factsEs: string[];
    questionsToAskEs: string[];
  };
  gayaneCard: {
    titleEs: string;
    factsEs: string[];
    questionsToAskEs: string[];
  };
  solutionCheckQuestionEs: string;
  solutionOptions: string[];
  correctSolutionIndex: number;
}

export const SECRET_MISSIONS: SecretMissionPair[] = [
  {
    id: 'sm_1',
    titleEs: 'Operación Madrid Express',
    titleHy: 'Օպերացիա «Մադրիդ Էքսպրես»',
    goalEs: 'Combinad vuestra información hablando en español para elegir el vuelo y el hotel sin llegar tarde.',
    goalHy: 'Հարցրեք իրար իսպաներենով՝ թռիչքն ու հյուրանոցը համադրելու համար:',
    razmikCard: {
      titleEs: 'Tarjeta secreta de Razmik (Vuelo)',
      factsEs: [
        'Tu avión sale a las 10:30 desde la puerta B12.',
        'Llevas dos maletas de 18 kilos y una mochila.',
        'Aterrizas en Madrid a las 13:00.',
      ],
      questionsToAskEs: [
        'Pregunta a Gayane en qué hotel tenéis la reserva.',
        'Pregunta si el desayuno está incluido y a qué hora es la entrada.',
      ],
    },
    gayaneCard: {
      titleEs: 'Tarjeta secreta de Gayane (Hotel)',
      factsEs: [
        'Tenéis reserva en el Hotel Solana, habitación 304 (3ª planta).',
        'La entrada al hotel empieza a las 14:00.',
        'El desayuno está incluido y la contraseña del wifi es SOL304.',
      ],
      questionsToAskEs: [
        'Pregunta a Razmik a qué hora aterriza el avión.',
        'Pregunta cuántas maletas lleva y por qué puerta sale.',
      ],
    },
    solutionCheckQuestionEs: 'Según vuestros datos, ¿cuánto tiempo tenéis entre el aterrizaje (13:00) y la entrada al hotel (14:00)?',
    solutionOptions: ['Una hora exacta para llegar e ir a comer', 'Cinco horas', 'El avión aterriza después de medianoche', 'No hay reserva en el hotel'],
    correctSolutionIndex: 0,
  },
  {
    id: 'sm_2',
    titleEs: 'La Cena y las Compras de Cumpleaños',
    titleHy: 'Տոնական ընթրիք և գնումներ',
    goalEs: 'Descubrid qué falta comprar y qué queréis pedir en el restaurante.',
    goalHy: 'Պարզեք՝ ինչ է պետք գնել խանութից և ինչ պատվիրել ռեստորանում:',
    razmikCard: {
      titleEs: 'Tarjeta secreta de Razmik (Supermercado)',
      factsEs: [
        'Tienes 15 euros en efectivo.',
        'En el supermercado el queso cuesta 4€ y los tomates 2€.',
        'Faltan naranjas para hacer zumo.',
      ],
      questionsToAskEs: [
        'Pregunta a Gayane qué quiere pedir de segundo plato en el restaurante.',
        'Pregunta si le gusta la ensalada con cebolla o sin cebolla.',
      ],
    },
    gayaneCard: {
      titleEs: 'Tarjeta secreta de Gayane (Restaurante)',
      factsEs: [
        'En el restaurante quieres pedir pollo con patatas.',
        'No te gusta la cebolla en la ensalada.',
        'De postre prefieres helado de chocolate.',
      ],
      questionsToAskEs: [
        'Pregunta a Razmik cuánto dinero tiene.',
        'Pregunta qué cuesta el queso y qué fruta falta comprar.',
      ],
    },
    solutionCheckQuestionEs: 'Si Razmik compra queso (4€) y tomates (2€) con sus 15€, ¿cuánto dinero le queda?',
    solutionOptions: ['9 euros', '11 euros', '5 euros', '13 euros'],
    correctSolutionIndex: 0,
  },
];

// Juego 12: ¡LA GRAN FINAL! (20 desafíos por España)
export interface GrandFinalStep {
  step: number;
  world: WorldId;
  type: 'choice' | 'error' | 'listening' | 'speaking';
  promptEs: string;
  promptHy: string;
  options?: string[];
  correctIndex?: number;
  audioEs?: string;
  helperWords?: string[];
  explanationHy: string;
}

export const GRAND_FINAL_STEPS: GrandFinalStep[] = [
  // Aeropuerto (1-5)
  { step: 1, world: 'aeropuerto', type: 'choice', promptEs: 'Llegas al mostrador del aeropuerto. ¿Qué entregas primero?', promptHy: 'Հասնում ես հաշվառման սեղանին. ի՞նչ ես տալիս առաջինը:', options: ['Aquí tiene mi pasaporte y mi billete.', 'La cuenta, por favor.', 'Necesito otra toalla.', 'Un kilo de patatas.'], correctIndex: 0, explanationHy: 'Հաշվառման ժամանակ ներկայացնում ենք անձնագիրը և տոմսը:' },
  { step: 2, world: 'aeropuerto', type: 'listening', promptEs: 'Escucha el anuncio del aeropuerto y elige el número de puerta:', promptHy: 'Լսիր հայտարարությունը և ընտրիր դարպասի համարը:', audioEs: 'Pasajeros del vuelo a Sevilla, embarquen por la puerta A9.', options: ['Puerta A9', 'Puerta B9', 'Puerta A6', 'Puerta C4'], correctIndex: 0, explanationHy: 'Հնչեց «puerta A9»:' },
  { step: 3, world: 'aeropuerto', type: 'error', promptEs: 'Corrige la frase: «¿Dónde hay mi asiento 12B?»', promptHy: 'Ընտրիր ճիշտ տարբերակը.', options: ['¿Dónde está mi asiento 12B?', '¿Adónde hay mi asiento 12B?', '¿Dónde están mi asiento 12B?', '¿Cuánto cuesta mi asiento 12B?'], correctIndex: 0, explanationHy: 'Կոնկրետ տեղի համար օգտագործում ենք ESTÁ:' },
  { step: 4, world: 'aeropuerto', type: 'choice', promptEs: 'El reloj muestra que el avión saldrá 30 minutos más tarde.', promptHy: 'Ինքնաթիռը 30 րոպե ուշ է մեկնելու:', options: ['Nuestro vuelo está retrasado.', 'Nuestro vuelo está incluido.', 'Nuestro vuelo está limpio.', 'Nuestro vuelo es barato.'], correctIndex: 0, explanationHy: '«Está retrasado» = ուշանում է:' },
  { step: 5, world: 'aeropuerto', type: 'speaking', promptEs: '¡Reto oral! Explica en voz alta qué haces en el control de seguridad y pregunta por la puerta.', promptHy: 'Բարձրաձայն ասա՝ ինչ ես անում անվտանգության ստուգման ժամանակ:', helperWords: ['control de seguridad', 'mochila', 'pasaporte', '¿dónde está?'], explanationHy: 'Ավարտված բանավոր առաջադրանք՝ ուսուցչի հաստատմամբ:' },

  // Hotel (6-10)
  { step: 6, world: 'hotel', type: 'choice', promptEs: 'Llegas al hotel en España. Ya pagaste por internet.', promptHy: 'Հասել ես հյուրանոց. նախապես ամրագրել ես:', options: ['Buenas tardes, tengo una reserva.', '¿Cuánto pesa mi maleta?', 'Sin cebolla, por favor.', '¿Dónde está el aceite?'], correctIndex: 0, explanationHy: '«Tengo una reserva» = Ամրագրում ունեմ:' },
  { step: 7, world: 'hotel', type: 'listening', promptEs: 'Escucha a la recepcionista:', promptHy: 'Լսիր ընդունարանի աշխատակցին:', audioEs: 'Su habitación está en la tercera planta y el desayuno empieza a las ocho.', options: ['Planta 3 · Desayuno a las 8:00', 'Planta 2 · Desayuno a las 9:00', 'Planta 3 · Sin desayuno', 'Planta 4 · Desayuno a las 7:00'], correctIndex: 0, explanationHy: 'Երրորդ հարկ, նախաճաշը՝ 8:00-ին:' },
  { step: 8, world: 'hotel', type: 'error', promptEs: 'Corrige el error: «En el baño no está agua caliente».', promptHy: 'Ընտրիր քերականորեն ճիշտ նախադասությունը.', options: ['En el baño no hay agua caliente.', 'En el baño no funciona agua caliente.', 'En el baño no tengo agua caliente.', 'En el baño no es agua caliente.'], correctIndex: 0, explanationHy: '«Տաք ջուր չկա»՝ «no hay agua caliente»:' },
  { step: 9, world: 'hotel', type: 'choice', promptEs: 'No puedes conectar tu móvil a internet.', promptHy: 'Ուզում ես ինտերնետին միանալ:', options: ['¿Cuál es la contraseña del wifi?', '¿A qué hora despega el wifi?', '¿Qué lleva el wifi?', '¿Cuántos kilos pesa el wifi?'], correctIndex: 0, explanationHy: '«Contraseña del wifi» = վայ-ֆայի գաղտնաբառ:' },
  { step: 10, world: 'hotel', type: 'speaking', promptEs: '¡Reto oral! Pide cambiar de habitación porque no funciona el aire acondicionado.', promptHy: 'Բարձրաձայն խնդրիր փոխել սենյակը՝ օդորակիչի պատճառով:', helperWords: ['no funciona', 'aire acondicionado', 'cambiar de habitación', 'toalla'], explanationHy: 'Հյուրանոցային իրավիճակի բանավոր լուծում:' },

  // Restaurante (11-15)
  { step: 11, world: 'restaurante', type: 'choice', promptEs: 'Entráis a comer al restaurante. ¿Qué pedís primero?', promptHy: 'Մտնում եք ռեստորան. ի՞նչ եք խնդրում առաջինը:', options: ['Una mesa para dos y la carta, por favor.', 'Un carrito y una bolsa.', 'La contraseña de la puerta.', 'Mi tarjeta de embarque.'], correctIndex: 0, explanationHy: 'Սեղան և ճաշացանկ:' },
  { step: 12, world: 'restaurante', type: 'listening', promptEs: 'Escucha el pedido del cliente:', promptHy: 'Լսիր հաճախորդի պատվերը:', audioEs: 'De segundo plato quiero pescado sin limón y un vaso de agua.', options: ['Pescado sin limón y agua', 'Pollo con patatas y zumo', 'Pizza sin cebolla y leche', 'Ensalada y helado'], correctIndex: 0, explanationHy: 'Ձուկ առանց կիտրոնի և ջուր:' },
  { step: 13, world: 'restaurante', type: 'error', promptEs: 'Corrige: «La pizza es muy rica hoy».', promptHy: 'Ուղղիր ESTAR/SER սխալը.', options: ['La pizza está muy rica hoy.', 'La pizza hay muy rica hoy.', 'La pizza tiene muy rica hoy.', 'La pizza lleva muy rica hoy.'], correctIndex: 0, explanationHy: 'Համի մասին խոսելիս՝ «está muy rica»:' },
  { step: 14, world: 'restaurante', type: 'choice', promptEs: 'Cada uno quiere pagar lo suyo.', promptHy: 'Ամեն մեկը ուզում է վճարել իր բաժինը:', options: ['La cuenta, por favor. ¿Podemos pagar por separado?', '¿Cuánto cuesta cambiar de asiento?', '¿Hay ofertas de cucharas?', '¿En qué planta está el postre?'], correctIndex: 0, explanationHy: '«Pagar por separado» = վճարել առանձին:' },
  { step: 15, world: 'restaurante', type: 'speaking', promptEs: '¡Reto oral! Recomienda un primer plato, un segundo plato y un postre.', promptHy: 'Բարձրաձայն խորհուրդ տուր առաջին ուտեստ, երկրորդ ուտեստ և աղանդեր:', helperWords: ['recomiendo', 'primer plato', 'segundo plato', 'postre', 'rico'], explanationHy: 'Ճաշացանկի բանավոր ներկայացում:' },

  // Supermercado (16-20)
  { step: 16, world: 'supermercado', type: 'choice', promptEs: 'Buscas queso para el desayuno y no ves dónde está.', promptHy: 'Փնտրում ես պանիրը սուպերմարկետում:', options: ['¿Dónde puedo encontrar el queso?', '¿Dónde aterriza el queso?', '¿Qué lleva el queso de postre?', '¿Funciona el queso?'], correctIndex: 0, explanationHy: '«¿Dónde puedo encontrar el queso?»' },
  { step: 17, world: 'supermercado', type: 'listening', promptEs: 'Escucha al cajero:', promptHy: 'Լսիր գանձապահին:', audioEs: 'Son nueve euros con cincuenta. ¿Paga en efectivo o con tarjeta?', options: ['9,50 € · Pregunta cómo paga', '19,50 € · No acepta tarjeta', '5,90 € · Regala una bolsa', '9,00 € · Cierra la caja'], correctIndex: 0, explanationHy: 'Ինը եվրո հիսուն՝ 9,50 €:' },
  { step: 18, world: 'supermercado', type: 'error', promptEs: 'Corrige: «Quiero comprar muchos manzanas».', promptHy: 'Ուղղիր սեռի սխալը.', options: ['Quiero comprar muchas manzanas.', 'Quiero comprar mucho manzanas.', 'Quiero comprar muchas manzana.', 'Quiero comprar cuánta manzanas.'], correctIndex: 0, explanationHy: '«Manzanas» իգական հոգնակի է՝ «muchas manzanas»:' },
  { step: 19, world: 'supermercado', type: 'choice', promptEs: 'Comparas dos botellas de zumo: A vale 1,50€ y B vale 3,00€.', promptHy: 'Համեմատում ես երկու հյութի գները:', options: ['La botella A es más barata que la botella B.', 'La botella A es más retrasada que la B.', 'La botella A está incluida en la B.', 'La botella A lleva menos pasaporte.'], correctIndex: 0, explanationHy: '«Más barata que» = ավելի էժան, քան:' },
  { step: 20, world: 'supermercado', type: 'speaking', promptEs: '¡Misión final! Resume en español todo vuestro viaje: avión, hotel, restaurante y compras.', promptHy: 'Ամփոփիր ձեր ամբողջ ճամփորդությունը իսպաներենով՝ ինքնաթիռ, հյուրանոց, ռեստորան և գնումներ:', helperWords: ['primero', 'aeropuerto', 'hotel', 'restaurante', 'supermercado', 'muy bien'], explanationHy: 'Մեծ եզրափակիչի վերջին բանավոր փորձությունը:' },
];

// Juego 17: 🃏 ¡ROBA LA CARTA! (Calentamiento y Duelo con mazo aleatorio)
export interface DrawCard {
  id: string;
  world: WorldId;
  cardType: 'rapida' | 'oral' | 'duelo';
  bonusTag?: string;
  multiplier: 1 | 2;
  questionEs: string;
  questionHy: string;
  options?: string[];
  correctIndex?: number;
  helperWords?: string[];
  sampleAnswerEs?: string;
  explanationHy: string;
}

export const DRAW_CARDS_DECK: DrawCard[] = [
  // Aeropuerto
  {
    id: 'dc_1',
    world: 'aeropuerto',
    cardType: 'rapida',
    multiplier: 1,
    questionEs: '¿Qué enseñas primero en el mostrador de facturación?',
    questionHy: 'Ի՞նչ ես ցույց տալիս առաջինը հաշվառման սեղանին:',
    options: ['El pasaporte y el billete', 'La cuchara y el tenedor', 'La contraseña del wifi', 'Un kilo de queso'],
    correctIndex: 0,
    explanationHy: 'Հաշվառման ժամանակ անհրաժեշտ են անձնագիրը և տոմսը:',
  },
  {
    id: 'dc_2',
    world: 'aeropuerto',
    cardType: 'oral',
    bonusTag: '🔥 Doble Puntos x2',
    multiplier: 2,
    questionEs: '¡Reto rápido! Pregunta en español a qué hora sale el vuelo y dónde está la puerta B12.',
    questionHy: 'Արագ առաջադրանք. հարցրու իսպաներենով՝ ժամը քանիսին է թռիչքը և որտեղ է B12 դարպասը:',
    helperWords: ['¿a qué hora?', 'sale', '¿dónde está?', 'puerta de embarque'],
    sampleAnswerEs: 'Disculpe, ¿a qué hora sale nuestro vuelo y dónde está la puerta de embarque B12?',
    explanationHy: 'Օգտագործիր «¿A qué hora sale...?» և «¿Dónde está...?»:',
  },
  {
    id: 'dc_3',
    world: 'aeropuerto',
    cardType: 'rapida',
    bonusTag: '⚡ Relámpago',
    multiplier: 1,
    questionEs: 'Tu avión no sale a las 10:00, sino a las 10:40. ¿Qué dices?',
    questionHy: 'Ինքնաթիռը 10:00-ի փոխարեն մեկնում է 10:40: Ի՞նչ ես ասում:',
    options: ['Nuestro vuelo está retrasado.', 'Nuestro vuelo está limpio.', 'Nuestro vuelo está incluido.', 'Nuestro vuelo es barato.'],
    correctIndex: 0,
    explanationHy: '«Está retrasado» նշանակում է ուշանում է:',
  },
  {
    id: 'dc_4',
    world: 'aeropuerto',
    cardType: 'duelo',
    bonusTag: '⚔️ Duelo x2',
    multiplier: 2,
    questionEs: 'Duelo de conversación: Uno es agente y el otro perdió su maleta. ¡Haced 4 frases en español!',
    questionHy: 'Երկխոսության մենամարտ. մեկը կորցրել է ճամպրուկը, մյուսը օգնում է:',
    helperWords: ['he perdido', 'maleta', 'cinta', 'etiqueta', 'ayuda'],
    sampleAnswerEs: '¡Ayuda! He perdido mi maleta. ¿De qué color es? Es azul con una etiqueta roja.',
    explanationHy: 'Երկու խաղացողները միասին կազմում են 4 արագ ռեպլիկ:',
  },
  {
    id: 'dc_5',
    world: 'aeropuerto',
    cardType: 'rapida',
    multiplier: 1,
    questionEs: '¿Dónde te sientas si quieres mirar por la ventana?',
    questionHy: 'Ո՞ր տեղն ես ընտրում, եթե ուզում ես նայել պատուհանից:',
    options: ['En el asiento de ventanilla', 'En el pasillo', 'En la báscula', 'En la aduana'],
    correctIndex: 0,
    explanationHy: '«Ventanilla» = լուսամուտի մոտի տեղ:',
  },
  {
    id: 'dc_6',
    world: 'aeropuerto',
    cardType: 'oral',
    multiplier: 1,
    questionEs: 'Di en voz alta qué tienes que hacer antes de subir al avión (usa «tener que»).',
    questionHy: 'Բարձրաձայն ասա՝ ինչ պետք է անես նախքան ինքնաթիռ բարձրանալը («tener que»):',
    helperWords: ['tenemos que', 'control de seguridad', 'mostrar', 'pasaporte'],
    sampleAnswerEs: 'Tenemos que pasar el control de seguridad y mostrar la tarjeta de embarque.',
    explanationHy: '«Tener que + բայ» = պետք է անել:',
  },

  // Hotel
  {
    id: 'dc_7',
    world: 'hotel',
    cardType: 'rapida',
    multiplier: 1,
    questionEs: 'Llegas al hotel con tu reserva ya hecha. ¿Qué dices en recepción?',
    questionHy: 'Հասնում ես հյուրանոց նախապես ամրագրած: Ի՞նչ ես ասում:',
    options: ['Buenas tardes, tengo una reserva.', '¿Cuánto cuesta un kilo de manzanas?', 'Una mesa para dos, por favor.', '¿Dónde está la cinta de equipaje?'],
    correctIndex: 0,
    explanationHy: '«Tengo una reserva» = Ամրագրում ունեմ:',
  },
  {
    id: 'dc_8',
    world: 'hotel',
    cardType: 'oral',
    bonusTag: '🔥 Doble Puntos x2',
    multiplier: 2,
    questionEs: '¡Problema en el cuarto! Di en español que no funciona el aire acondicionado y necesitas otra toalla.',
    questionHy: 'Խնդիր սենյակում. ասա, որ օդորակիչը չի աշխատում և ևս մեկ սրբիչ է պետք:',
    helperWords: ['no funciona', 'aire acondicionado', 'necesitamos', 'otra toalla'],
    sampleAnswerEs: 'Disculpe, no funciona el aire acondicionado y necesitamos otra toalla limpia.',
    explanationHy: 'Հստակ բացատրություն ընդունարանում:',
  },
  {
    id: 'dc_9',
    world: 'hotel',
    cardType: 'rapida',
    multiplier: 1,
    questionEs: 'No puedes entrar a internet con tu teléfono en la habitación. ¿Qué preguntas?',
    questionHy: 'Չես կարողանում միանալ ինտերնետին. ի՞նչ ես հարցնում:',
    options: ['¿Cuál es la contraseña del wifi?', '¿A qué hora aterriza el wifi?', '¿Qué lleva el wifi?', '¿Puedo pagar con bolsa?'],
    correctIndex: 0,
    explanationHy: '«Contraseña» = գաղտնաբառ:',
  },
  {
    id: 'dc_10',
    world: 'hotel',
    cardType: 'duelo',
    bonusTag: '⚔️ Duelo x2',
    multiplier: 2,
    questionEs: 'Duelo de roles: Uno pide cambiar de habitación por el ruido y el otro responde como recepcionista.',
    questionHy: 'Դերախաղ մենամարտ. մեկը աղմուկի պատճառով սենյակ է փոխում, մյուսը ընդունարանի աշխատակից է:',
    helperWords: ['mucho ruido', 'cambiar de habitación', 'tranquila', 'llave', 'planta'],
    sampleAnswerEs: 'Hay mucho ruido, ¿podemos cambiar de habitación? — Sí, aquí tiene la llave de la cuarta planta.',
    explanationHy: '«¿Podemos cambiar de habitación?»:',
  },
  {
    id: 'dc_11',
    world: 'hotel',
    cardType: 'rapida',
    multiplier: 1,
    questionEs: '¿Qué frase está gramaticalmente CORRECTA?',
    questionHy: 'Ո՞ր նախադասությունն է քերականորեն ճիշտ:',
    options: ['En el baño no hay agua caliente.', 'En el baño no está agua caliente.', '¿Cuánto cuestan una habitación?', 'Necesito otro toalla.'],
    correctIndex: 0,
    explanationHy: 'Անորոշ գոյականի առկայության համար օգտագործվում է HAY / NO HAY:',
  },
  {
    id: 'dc_12',
    world: 'hotel',
    cardType: 'oral',
    multiplier: 1,
    questionEs: 'Pregunta educadamente cuánto cuesta la habitación y si el desayuno está incluido.',
    questionHy: 'Քաղաքավարի հարցրու՝ ինչքան արժե սենյակը և արդյոք նախաճաշը ներառված է:',
    helperWords: ['¿cuánto cuesta?', 'habitación', '¿está incluido?', 'desayuno'],
    sampleAnswerEs: '¿Cuánto cuesta una habitación por noche y el desayuno está incluido?',
    explanationHy: 'Կարևոր հարցեր հյուրանոց ամրագրելիս:',
  },

  // Restaurante
  {
    id: 'dc_13',
    world: 'restaurante',
    cardType: 'rapida',
    multiplier: 1,
    questionEs: 'Acabas de cenar y quieres irte. ¿Qué dices al camarero?',
    questionHy: 'Ավարտեցիր ընթրիքը և ուզում ես վճարել. ի՞նչ ես ասում:',
    options: ['La cuenta, por favor.', 'La maleta, por favor.', 'El ascensor, por favor.', 'La contraseña, por favor.'],
    correctIndex: 0,
    explanationHy: '«La cuenta, por favor» = Հաշիվը, խնդրում եմ:',
  },
  {
    id: 'dc_14',
    world: 'restaurante',
    cardType: 'oral',
    bonusTag: '🔥 Doble Puntos x2',
    multiplier: 2,
    questionEs: 'Pide una pizza y una ensalada sin cebolla, y pregunta qué nos recomienda de postre.',
    questionHy: 'Պատվիրիր պիցցա և աղցան առանց սոխի, և հարցրու՝ ինչ աղանդեր խորհուրդ կտա:',
    helperWords: ['para mí', 'pizza', 'ensalada', 'sin cebolla', '¿qué nos recomienda?'],
    sampleAnswerEs: 'Para mí, una pizza y una ensalada sin cebolla, por favor. ¿Qué nos recomienda de postre?',
    explanationHy: '«Para mí...», «sin cebolla» և «¿qué nos recomienda?»:',
  },
  {
    id: 'dc_15',
    world: 'restaurante',
    cardType: 'rapida',
    bonusTag: '⚡ Relámpago',
    multiplier: 1,
    questionEs: 'Cada amigo paga su propia comida. ¿Cómo lo pides?',
    questionHy: 'Ամեն մեկը վճարում է իր բաժինը. ինչպե՞ս ես հարցնում:',
    options: ['¿Podemos pagar por separado?', '¿Podemos facturar por separado?', '¿Podemos despegar por separado?', '¿Podemos comprar con bolsa?'],
    correctIndex: 0,
    explanationHy: '«Por separado» = առանձին:',
  },
  {
    id: 'dc_16',
    world: 'restaurante',
    cardType: 'duelo',
    bonusTag: '⚔️ Duelo x2',
    multiplier: 2,
    questionEs: 'Duelo de restaurante: Uno recomienda 2 platos y el otro elige comida y bebida preguntando los ingredientes.',
    questionHy: 'Ռեստորանային մենամարտ. մեկը առաջարկում է 2 ուտեստ, մյուսը ընտրում է և հարցնում բաղադրիչները:',
    helperWords: ['recomiendo', '¿qué lleva?', 'prefiero', 'zumo', 'agua'],
    sampleAnswerEs: '¿Qué lleva este plato? — Lleva pollo y arroz. — Perfecto, para mí pollo y zumo.',
    explanationHy: '«¿Qué lleva este plato?» = Ի՞նչ է պարունակում այս ուտեստը:',
  },
  {
    id: 'dc_17',
    world: 'restaurante',
    cardType: 'rapida',
    multiplier: 1,
    questionEs: '¿Cuál de estas frases compara correctamente dos comidas?',
    questionHy: 'Ո՞ր նախադասությունն է ճիշտ համեմատում երկու ուտեստ:',
    options: ['La ensalada es más sana que la pizza.', 'La ensalada es más sano como la pizza.', 'La sopa es muy rica hoy.', 'Me gusta las pizzas.'],
    correctIndex: 0,
    explanationHy: '«Más + ածական + que», իսկ «la ensalada» իգական է («sana»):',
  },
  {
    id: 'dc_18',
    world: 'restaurante',
    cardType: 'oral',
    multiplier: 1,
    questionEs: 'Di qué te falta en la mesa para comer sopa y carne (cuchara, tenedor, cuchillo, servilleta).',
    questionHy: 'Ասա՝ ինչ է պակասում սեղանին ապուր և միս ուտելու համար:',
    helperWords: ['necesito', 'cuchara', 'tenedor', 'cuchillo', 'servilleta'],
    sampleAnswerEs: 'Disculpe, necesito una cuchara para la sopa, un tenedor, un cuchillo y una servilleta.',
    explanationHy: 'Սպասքի անունները իսպաներենով:',
  },

  // Supermercado
  {
    id: 'dc_19',
    world: 'supermercado',
    cardType: 'rapida',
    multiplier: 1,
    questionEs: 'No ves los lácteos en el supermercado. ¿Qué preguntas?',
    questionHy: 'Չես տեսնում պանիրը սուպերմարկետում. ի՞նչ ես հարցնում:',
    options: ['¿Dónde puedo encontrar el queso?', '¿Dónde puedo aterrizar el queso?', '¿El queso está incluido?', '¿Nos trae la cuenta?'],
    correctIndex: 0,
    explanationHy: '«¿Dónde puedo encontrar...?» = Որտե՞ղ կարող եմ գտնել...',
  },
  {
    id: 'dc_20',
    world: 'supermercado',
    cardType: 'oral',
    bonusTag: '🔥 Doble Puntos x2',
    multiplier: 2,
    questionEs: 'Pide medio kilo de tomates, pregunta si hay ofertas y di si pagas con tarjeta.',
    questionHy: 'Խնդրիր կես կիլոգրամ լոլիկ, հարցրու զեղչերի մասին և ասա՝ քարտով ես վճարում:',
    helperWords: ['medio kilo', 'tomates', '¿hay alguna oferta?', 'pagar con tarjeta'],
    sampleAnswerEs: 'Quiero medio kilo de tomates. ¿Hay alguna oferta hoy? ¿Puedo pagar con tarjeta?',
    explanationHy: 'Հիանալի նախադասություն գնումների համար:',
  },
  {
    id: 'dc_21',
    world: 'supermercado',
    cardType: 'rapida',
    multiplier: 1,
    questionEs: 'Elige la pregunta correcta para saber el número de manzanas:',
    questionHy: 'Ընտրիր ճիշտ հարցը՝ խնձորների քանակը հարցնելու համար:',
    options: ['¿Cuántas manzanas quieres?', '¿Cuántos manzanas quieres?', '¿Cuánto manzanas quieres?', '¿Cuál manzanas quieres?'],
    correctIndex: 0,
    explanationHy: '«Manzanas» իգական հոգնակի է, ուստի՝ «¿Cuántas?»:',
  },
  {
    id: 'dc_22',
    world: 'supermercado',
    cardType: 'duelo',
    bonusTag: '⚔️ Duelo x2',
    multiplier: 2,
    questionEs: 'Duelo en la caja: Uno es cajero y cobra 14,50€; el otro pide una bolsa y dice que falta un descuento.',
    questionHy: 'Մենամարտ դրամարկղում. մեկը գանձապահ է (14,50€), մյուսը տոպրակ և զեղչ է հարցնում:',
    helperWords: ['¿cuánto es en total?', 'bolsa', 'oferta', 'descuento', 'recibo'],
    sampleAnswerEs: '¿Cuánto es en total? — Son catorce euros con cincuenta. — Necesito una bolsa, pero este queso tiene descuento.',
    explanationHy: 'Երկուսը միասին վարում են դրամարկղի երկխոսությունը:',
  },
  {
    id: 'dc_23',
    world: 'supermercado',
    cardType: 'rapida',
    bonusTag: '⚡ Relámpago',
    multiplier: 1,
    questionEs: 'El producto A cuesta 1,50€ y el producto B cuesta 3,00€. ¿Qué dices?',
    questionHy: 'Ապրանք A-ն 1,50€ է, B-ն՝ 3,00€: Ի՞նչ ես ասում:',
    options: ['Este producto es más barato.', 'Este producto está retrasado.', 'Este producto es más incluido.', 'Este producto tiene pasaporte.'],
    correctIndex: 0,
    explanationHy: '«Más barato» = ավելի էժան:',
  },
  {
    id: 'dc_24',
    world: 'supermercado',
    cardType: 'oral',
    multiplier: 1,
    questionEs: 'Nombra 5 alimentos de tu lista de la compra en español (ej. leche, pan, queso, huevos, fruta).',
    questionHy: 'Նշիր գնումների ցուցակի 5 սննդամթերք իսպաներենով և ասա քանակը (կիլո, լիտր, տուփ):',
    helperWords: ['dos litros de', 'un kilo de', 'un paquete de', 'huevos', 'pan'],
    sampleAnswerEs: 'Necesito dos litros de leche, un kilo de tomates, un paquete de arroz, pan y doce huevos.',
    explanationHy: 'Չափման միավորներով գնումների ցուցակ:',
  },
  {
    id: 'dc_25',
    world: 'aeropuerto',
    cardType: 'rapida',
    multiplier: 1,
    questionEs: '¿Dónde recoges tus maletas grandes después de aterrizar?',
    questionHy: 'Որտե՞ղ ես վերցնում մեծ ճամպրուկներդ վայրէջքից հետո:',
    options: ['En la cinta de equipaje', 'En la cocina del avión', 'En el ascensor del hotel', 'En la caja del supermercado'],
    correctIndex: 0,
    explanationHy: '«Cinta de equipaje» = ուղեբեռի ժապավեն:',
  },
  {
    id: 'dc_26',
    world: 'aeropuerto',
    cardType: 'rapida',
    bonusTag: '⚡ Relámpago',
    multiplier: 1,
    questionEs: 'El avión va hacia arriba y empieza el viaje. ¿Qué verbo usas?',
    questionHy: 'Ինքնաթիռը բարձրանում է երկինք. ո՞ր բայը կօգտագործես:',
    options: ['Despegar', 'Aterrizar', 'Reservar', 'Pesar'],
    correctIndex: 0,
    explanationHy: '«Despegar» = թռիչք կատարել, օդ բարձրանալ:',
  },
  {
    id: 'dc_27',
    world: 'hotel',
    cardType: 'rapida',
    multiplier: 1,
    questionEs: 'Quieres subir al cuarto piso del hotel sin caminar. ¿Qué buscas?',
    questionHy: 'Ուզում ես բարձրանալ 4-րդ հարկ առանց քայլելու. ի՞նչ ես փնտրում:',
    options: ['El ascensor', 'La aduana', 'El tenedor', 'El carrito'],
    correctIndex: 0,
    explanationHy: '«Ascensor» = վերելակ:',
  },
  {
    id: 'dc_28',
    world: 'hotel',
    cardType: 'rapida',
    bonusTag: '🔥 Doble Puntos x2',
    multiplier: 2,
    questionEs: 'Tu habitación hace mucho frío por la noche. ¿Qué necesitas encender?',
    questionHy: 'Սենյակը գիշերը շատ ցուրտ է. ի՞նչ է պետք միացնել:',
    options: ['La calefacción', 'La piscina', 'La tarjeta de embarque', 'La servilleta'],
    correctIndex: 0,
    explanationHy: '«Calefacción» = ջեռուցում:',
  },
  {
    id: 'dc_29',
    world: 'restaurante',
    cardType: 'rapida',
    multiplier: 1,
    questionEs: 'La sopa está muy salada o fría y quieres hablar con el camarero. ¿Cómo empiezas?',
    questionHy: 'Ապուրը սառն է, և ուզում ես քաղաքավարի կանչել մատուցողին:',
    options: ['Disculpe, por favor...', '¡Aterriza ahora!', '¿Dónde está el pasillo?', 'Quiero facturar la sopa.'],
    correctIndex: 0,
    explanationHy: '«Disculpe, por favor» = Ներեցեք, խնդրում եմ:',
  },
  {
    id: 'dc_30',
    world: 'restaurante',
    cardType: 'rapida',
    bonusTag: '⚡ Relámpago',
    multiplier: 1,
    questionEs: '¿Qué pides para limpiarte las manos y la boca en la mesa?',
    questionHy: 'Ի՞նչ ես խնդրում սեղանին ձեռքերդ սրբելու համար:',
    options: ['Una servilleta', 'Una almohada', 'Una maleta', 'Una planta'],
    correctIndex: 0,
    explanationHy: '«Servilleta» = անձեռոցիկ:',
  },
  {
    id: 'dc_31',
    world: 'supermercado',
    cardType: 'rapida',
    multiplier: 1,
    questionEs: 'Pagas en efectivo con 20€ una compra de 13€. ¿Qué te devuelve el cajero?',
    questionHy: '20€-ով վճարում ես 13€ գնման համար. ի՞նչ է վերադարձնում գանձապահը:',
    options: ['El cambio (7 euros)', 'El vuelo retrasado', 'La llave de la habitación', 'La cuchara'],
    correctIndex: 0,
    explanationHy: '«El cambio» = մանրը / վերադարձվող գումարը:',
  },
  {
    id: 'dc_32',
    world: 'supermercado',
    cardType: 'rapida',
    bonusTag: '🔥 Doble Puntos x2',
    multiplier: 2,
    questionEs: 'Antes de comprar leche o yogur, ¿qué fecha miras en el envase?',
    questionHy: 'Կաթ կամ յոգուրտ գնելուց առաջ ի՞նչ ամսաթիվ ես ստուգում:',
    options: ['La fecha de caducidad', 'La puerta de embarque', 'La hora del desayuno', 'El número de asiento'],
    correctIndex: 0,
    explanationHy: '«Fecha de caducidad» = պիտանելիության ժամկետ:',
  },
];

// ============================================================================
// BANCO DE 30 PREGUNTAS POR TEMA (RETO DE 30 PREGUNTAS - 2 MINUTOS)
// ============================================================================
import { QuickQuestion } from './types';

export const EXTRA_RETO_30_QUESTIONS: Record<WorldId, QuickQuestion[]> = {
  aeropuerto: [
    {
      id: 'r30_ae_1', world: 'aeropuerto', level: 1,
      situationEs: '¿Qué documento obligatorio necesitas para viajar a otro país?',
      situationHy: 'Ո՞ր պարտադիր փաստաթուղթն է անհրաժեշտ այլ երկիր մեկնելու համար:',
      options: ['El pasaporte', 'La carta del restaurante', 'La toalla', 'El recibo del queso'],
      correctIndex: 0, explanationHy: '«Pasaporte» = անձնագիր:',
    },
    {
      id: 'r30_ae_2', world: 'aeropuerto', level: 1,
      situationEs: 'El papel o código en tu móvil que te permite subir al avión es...',
      situationHy: 'Թուղթը կամ կոդը հեռախոսում, որով նստում ես ինքնաթիռ...',
      options: ['La tarjeta de embarque', 'La lista de la compra', 'La llave del hotel', 'La servilleta'],
      correctIndex: 0, explanationHy: '«Tarjeta de embarque» = նստեցման կտրոն:',
    },
    {
      id: 'r30_ae_3', world: 'aeropuerto', level: 1,
      situationEs: 'No te gusta mirar por la ventana; prefieres caminar fácil al baño. Eliges asiento de...',
      situationHy: 'Ուզում ես հեշտ անցնել միջանցքով. ընտրում ես...',
      options: ['Pasillo', 'Ventanilla', 'Mostrador', 'Aduana'],
      correctIndex: 0, explanationHy: '«Pasillo» = միջանցք (միջանցքի մոտի տեղ):',
    },
    {
      id: 'r30_ae_4', world: 'aeropuerto', level: 1,
      situationEs: 'El lugar donde dejas tu maleta grande antes del control de seguridad es...',
      situationHy: 'Այն տեղը, որտեղ հանձնում ես մեծ ճամպրուկդ...',
      options: ['El mostrador de facturación', 'La cocina', 'La piscina', 'La frutería'],
      correctIndex: 0, explanationHy: '«Mostrador de facturación» = հաշվառման սեղան:',
    },
    {
      id: 'r30_ae_5', world: 'aeropuerto', level: 1,
      situationEs: 'El equipaje pequeño que llevas contigo dentro de la cabina del avión es...',
      situationHy: 'Փոքր ուղեբեռը, որը տանում ես քեզ հետ սրահ...',
      options: ['El equipaje de mano', 'La planta baja', 'El primer plato', 'El carro grande'],
      correctIndex: 0, explanationHy: '«Equipaje de mano» = ձեռքի ուղեբեռ:',
    },
    {
      id: 'r30_ae_6', world: 'aeropuerto', level: 1,
      situationEs: '¿Cómo preguntas por el horario de salida del avión?',
      situationHy: 'Ինչպե՞ս ես հարցնում ինքնաթիռի մեկնման ժամը:',
      options: ['¿A qué hora sale nuestro avión?', '¿Cuánto cuesta el avión?', '¿Qué lleva el avión?', '¿Dónde está el tenedor?'],
      correctIndex: 0, explanationHy: '«¿A qué hora sale...?» = Ժամը քանիսի՞ն է մեկնում:',
    },
    {
      id: 'r30_ae_7', world: 'aeropuerto', level: 1,
      situationEs: 'La puerta por donde entras finalmente al avión se llama...',
      situationHy: 'Դուռը, որով մտնում ես ինքնաթիռ...',
      options: ['Puerta de embarque', 'Puerta de desayuno', 'Puerta de panadería', 'Puerta de ducha'],
      correctIndex: 0, explanationHy: '«Puerta de embarque» = նստեցման դարպաս:',
    },
    {
      id: 'r30_ae_8', world: 'aeropuerto', level: 2,
      situationEs: 'Completa la obligación: «Nosotros _____ pasar el control de seguridad».',
      situationHy: 'Լրացրու նախադասությունը. «Մենք պետք է անցնենք անվտանգության ստուգումը»:',
      options: ['tenemos que', 'tengo que', 'queremos que', 'estamos que'],
      correctIndex: 0, explanationHy: '«Nosotros tenemos que + բայ»:',
    },
    {
      id: 'r30_ae_9', world: 'aeropuerto', level: 2,
      situationEs: '¿Cuál es el opuesto de «llegada» en la pantalla del aeropuerto?',
      situationHy: 'Ո՞րն է «llegada» (ժամանում) բառի հականիշը:',
      options: ['Salida', 'Retraso', 'Maleta', 'Asiento'],
      correctIndex: 0, explanationHy: '«Salida» = մեկնում, «llegada» = ժամանում:',
    },
    {
      id: 'r30_ae_10', world: 'aeropuerto', level: 2,
      situationEs: '¿Qué verbo significa tocar tierra al terminar el vuelo?',
      situationHy: 'Ո՞ր բայն է նշանակում վայրէջք կատարել:',
      options: ['Aterrizar', 'Despegar', 'Facturar', 'Llevar'],
      correctIndex: 0, explanationHy: '«Aterrizar» = վայրէջք կատարել:',
    },
    {
      id: 'r30_ae_11', world: 'aeropuerto', level: 2,
      situationEs: '¡Qué problema! No encuentras tu pasaporte en tu mochila. Dices:',
      situationHy: 'Չես գտնում անձնագիրդ. ի՞նչ ես ասում:',
      options: ['He perdido mi pasaporte.', 'He incluido mi pasaporte.', 'He cocinado mi pasaporte.', 'He almorzado mi pasaporte.'],
      correctIndex: 0, explanationHy: '«He perdido...» = Կորցրել եմ...',
    },
    {
      id: 'r30_ae_12', world: 'aeropuerto', level: 1,
      situationEs: 'En la pantalla dice «RETRASO 30 MIN». Eso significa que el vuelo...',
      situationHy: 'Էկրանին գրված է «RETRASO 30 MIN». դա նշանակում է...',
      options: ['Sale 30 minutos más tarde', 'Ya aterrizó ayer', 'Es gratis hoy', 'Tiene 30 asientos'],
      correctIndex: 0, explanationHy: '«Retraso» = ուշացում:',
    },
    {
      id: 'r30_ae_13', world: 'aeropuerto', level: 2,
      situationEs: '¿Cómo preguntas el peso de tu maleta en la báscula?',
      situationHy: 'Ինչպե՞ս հարցնել՝ ինչքան է կշռում ճամպրուկդ:',
      options: ['¿Cuánto pesa mi maleta?', '¿Cuántos años tiene mi maleta?', '¿Dónde duerme mi maleta?', '¿Qué bebe mi maleta?'],
      correctIndex: 0, explanationHy: '«¿Cuánto pesa...?» = Ինչքա՞ն է կշռում:',
    },
    {
      id: 'r30_ae_14', world: 'aeropuerto', level: 2,
      situationEs: 'Elige la pregunta correcta para saber el destino de tu amigo:',
      situationHy: 'Ընտրիր ճիշտ հարցը՝ ուղղությունը հարցնելու համար («Ո՞ւր...»):',
      options: ['¿Adónde viajas hoy?', '¿Dónde viajas ayer?', '¿Cuánto viajas hoy?', '¿Quién viajas hoy?'],
      correctIndex: 0, explanationHy: 'Շարժման ուղղության համար օգտագործվում է «¿Adónde?»:',
    },
    {
      id: 'r30_ae_15', world: 'aeropuerto', level: 1,
      situationEs: 'En el control de seguridad debes sacar de la mochila...',
      situationHy: 'Անվտանգության ստուգման ժամանակ պայուսակից հանում ես...',
      options: ['Los líquidos y el ordenador portátil', 'La cama y la ducha', 'Los tomates y el pan', 'La mesa del restaurante'],
      correctIndex: 0, explanationHy: 'Հեղուկները (líquidos) և համակարգիչը (portátil) ստուգվում են առանձին:',
    },
    {
      id: 'r30_ae_16', world: 'aeropuerto', level: 2,
      situationEs: 'Quieres pedir permiso para subir con tu mochila al avión:',
      situationHy: 'Ուզում ես թույլտվություն հարցնել ուսապարկը քեզ հետ վերցնելու համար:',
      options: ['¿Puedo llevar esta mochila?', '¿Debo aterrizar esta mochila?', '¿Estoy esta mochila?', '¿Soy esta mochila?'],
      correctIndex: 0, explanationHy: '«¿Puedo llevar...?» = Կարո՞ղ եմ վերցնել:',
    },
    {
      id: 'r30_ae_17', world: 'aeropuerto', level: 1,
      situationEs: 'La zona donde revisan las maletas al entrar en otro país se llama...',
      situationHy: 'Այն բաժինը, որտեղ ստուգում են սահմանն անցնելիս...',
      options: ['La aduana', 'La panadería', 'La recepción', 'La cocina'],
      correctIndex: 0, explanationHy: '«La aduana» = մաքսատուն:',
    },
    {
      id: 'r30_ae_18', world: 'aeropuerto', level: 2,
      situationEs: 'El edificio grande del aeropuerto (T1, T2, T4) se llama...',
      situationHy: 'Օդանավակայանի մեծ մասնաշենքը (T1, T4)...',
      options: ['La terminal', 'La toalla', 'La cuchara', 'La estantería'],
      correctIndex: 0, explanationHy: '«Terminal» = տերմինալ:',
    },
    {
      id: 'r30_ae_19', world: 'aeropuerto', level: 2,
      situationEs: '¿Dónde está el error en «¿Dónde hay la puerta B4?»',
      situationHy: 'Ո՞րն է ճիշտ տարբերակը կոնկրետ տեղը («la puerta B4») հարցնելիս:',
      options: ['¿Dónde está la puerta B4?', '¿Dónde son la puerta B4?', '¿Dónde tienen la puerta B4?', '¿Dónde hay unas puerta B4?'],
      correctIndex: 0, explanationHy: 'Կոնկրետ («la puerta B4») տեղի համար միշտ օգտագործվում է ESTÁ:',
    },
    {
      id: 'r30_ae_20', world: 'aeropuerto', level: 1,
      situationEs: 'La persona que vuela en el avión es el...',
      situationHy: 'Անձը, որը ճանապարհորդում է ինքնաթիռով...',
      options: ['Pasajero', 'Camarero', 'Cajero', 'Recepcionista'],
      correctIndex: 0, explanationHy: '«Pasajero» = ուղևոր:',
    },
    {
      id: 'r30_ae_21', world: 'aeropuerto', level: 2,
      situationEs: 'Buscas la fila correcta en la pantalla grande. ¿Cómo se dice «flight»?',
      situationHy: 'Ինչպե՞ս է իսպաներեն «թռիչք / չվերթ»:',
      options: ['El vuelo', 'El precio', 'El cambio', 'El vaso'],
      correctIndex: 0, explanationHy: '«El vuelo» = չվերթ / թռիչք:',
    },
  ],
  hotel: [
    {
      id: 'r30_ho_1', world: 'hotel', level: 1,
      situationEs: 'Llegas al hotel por primera vez. ¿Dónde hablas para entrar a tu cuarto?',
      situationHy: 'Երբ հասնում ես հյուրանոց, ո՞ր սեղանին ես մոտենում:',
      options: ['En la recepción', 'En la carnicería', 'En la puerta de embarque', 'En la cocina'],
      correctIndex: 0, explanationHy: '«Recepción» = ընդունարան:',
    },
    {
      id: 'r30_ho_2', world: 'hotel', level: 1,
      situationEs: 'Reservaste por internet antes de viajar. Dices al recepcionista:',
      situationHy: 'Նախապես ամրագրել ես սենյակը. ի՞նչ ես ասում:',
      options: ['Tengo una reserva.', 'Tengo una cuchara.', 'Tengo un retraso.', 'Tengo un carrito.'],
      correctIndex: 0, explanationHy: '«Tengo una reserva» = Ամրագրում ունեմ:',
    },
    {
      id: 'r30_ho_3', world: 'hotel', level: 1,
      situationEs: 'Necesitas abrir la puerta de tu habitación. ¿Qué pides?',
      situationHy: 'Ի՞նչ ես վերցնում սենյակի դուռը բացելու համար:',
      options: ['La llave (o tarjeta)', 'La almohada', 'La cebolla', 'La báscula'],
      correctIndex: 0, explanationHy: '«La llave» = բանալի:',
    },
    {
      id: 'r30_ho_4', world: 'hotel', level: 1,
      situationEs: 'Hace mucho calor dentro de la habitación. ¿Qué aparato no funciona?',
      situationHy: 'Սենյակում շատ շոգ է. ո՞ր սարքը չի աշխատում:',
      options: ['El aire acondicionado', 'El pasaporte', 'El tenedor', 'El descuento'],
      correctIndex: 0, explanationHy: '«Aire acondicionado» = օդորակիչ:',
    },
    {
      id: 'r30_ho_5', world: 'hotel', level: 1,
      situationEs: 'Después de ducharte quieres secarte, pero falta una...',
      situationHy: 'Լոգանքից հետո չորանալու համար պակասում է...',
      options: ['Toalla', 'Maleta', 'Factura', 'Naranja'],
      correctIndex: 0, explanationHy: '«Toalla» = սրբիչ:',
    },
    {
      id: 'r30_ho_6', world: 'hotel', level: 1,
      situationEs: 'Lo que pones debajo de tu cabeza para dormir cómodo es...',
      situationHy: 'Այն, ինչ դնում ես գլխիդ տակ քնելու համար...',
      options: ['La almohada', 'La escalera', 'La planta', 'La propina'],
      correctIndex: 0, explanationHy: '«Almohada» = բարձ:',
    },
    {
      id: 'r30_ho_7', world: 'hotel', level: 1,
      situationEs: 'Si tienes frío en la cama, pides una _____ extra.',
      situationHy: 'Եթե մահճակալում ցուրտ է, խնդրում ես լրացուցիչ...',
      options: ['Manta', 'Ducha', 'Piscina', 'Cuenta'],
      correctIndex: 0, explanationHy: '«Manta» = ծածկոց:',
    },
    {
      id: 'r30_ho_8', world: 'hotel', level: 1,
      situationEs: 'Quieres saber si debes pagar aparte por comer por la mañana:',
      situationHy: 'Ուզում ես իմանալ՝ նախաճաշը մտնո՞ւմ է գնի մեջ:',
      options: ['¿El desayuno está incluido?', '¿El desayuno está aterrizado?', '¿El desayuno está caducado?', '¿El desayuno es pasillo?'],
      correctIndex: 0, explanationHy: '«¿Está incluido?» = Ներառվա՞ծ է:',
    },
    {
      id: 'r30_ho_9', world: 'hotel', level: 2,
      situationEs: 'Tu móvil no se conecta a internet en el hotel. Preguntas:',
      situationHy: 'Հեռախոսը չի միանում ինտերնետին. հարցնում ես...',
      options: ['¿Cuál es la contraseña del wifi?', '¿Dónde está la cinta del wifi?', '¿Cuánto pesa el wifi?', '¿Qué lleva el wifi?'],
      correctIndex: 0, explanationHy: '«Contraseña» = գաղտնաբառ:',
    },
    {
      id: 'r30_ho_10', world: 'hotel', level: 2,
      situationEs: 'Quieres saber el piso donde está el cuarto 305:',
      situationHy: 'Ուզում ես իմանալ՝ որ հարկում է սենյակը:',
      options: ['¿En qué planta está nuestra habitación?', '¿En qué fruta está nuestra habitación?', '¿En qué plato está?', '¿Cuánto caduca nuestra habitación?'],
      correctIndex: 0, explanationHy: '«Planta» = հարկ (օրինակ՝ tercera planta):',
    },
    {
      id: 'r30_ho_11', world: 'hotel', level: 2,
      situationEs: 'La habitación tiene mucho ruido de la calle. ¿Qué pides con educación?',
      situationHy: 'Սենյակում շատ աղմուկ կա. ի՞նչ ես խնդրում:',
      options: ['¿Podemos cambiar de habitación?', '¿Podemos despegar de habitación?', '¿Podemos pesar la habitación?', '¿Podemos cocinar la habitación?'],
      correctIndex: 0, explanationHy: '«Cambiar de habitación» = փոխել սենյակը:',
    },
    {
      id: 'r30_ho_12', world: 'hotel', level: 1,
      situationEs: 'El adjetivo contrario a «limpio» (մաքուր) es...',
      situationHy: 'Ո՞րն է «limpio» (մաքուր) բառի հականիշը:',
      options: ['Sucio', 'Barato', 'Dulce', 'Fresco'],
      correctIndex: 0, explanationHy: '«Sucio» = կեղտոտ:',
    },
    {
      id: 'r30_ho_13', world: 'hotel', level: 2,
      situationEs: 'Último día del viaje (check-out). ¿Qué preguntas al recepcionista?',
      situationHy: 'Վերջին օրը հարցնում ես՝ ժամը քանիսին պետք է ազատել սենյակը:',
      options: ['¿A qué hora tenemos que salir?', '¿A qué hora tenemos que cocinar?', '¿A qué hora hay tomates?', '¿Dónde está la puerta de embarque?'],
      correctIndex: 0, explanationHy: '«¿A qué hora tenemos que salir?»:',
    },
    {
      id: 'r30_ho_14', world: 'hotel', level: 2,
      situationEs: 'Elige la frase correcta con «hay»:',
      situationHy: 'Ընտրիր ճիշտ նախադասությունը «hay» բառով:',
      options: ['En el hotel hay una piscina grande.', 'En el hotel está una piscina grande.', 'En el hotel hay la piscina grande.', 'En el hotel son piscina.'],
      correctIndex: 0, explanationHy: 'Անորոշ գոյականի համար («una piscina») օգտագործվում է HAY:',
    },
    {
      id: 'r30_ho_15', world: 'hotel', level: 1,
      situationEs: 'Quieres pedir una habitación de forma muy amable:',
      situationHy: 'Շատ քաղաքավարի ձևով ուզում ես խնդրել սենյակ:',
      options: ['Quisiera una habitación doble, por favor.', 'Quisieron una habitación.', 'Hablo una habitación.', 'Salgo una habitación.'],
      correctIndex: 0, explanationHy: '«Quisiera...» = Կցանկանայի... (քաղաքավարի ձև):',
    },
    {
      id: 'r30_ho_16', world: 'hotel', level: 1,
      situationEs: '¿Cómo preguntas el precio por una noche?',
      situationHy: 'Ինչպե՞ս հարցնել մեկ գիշերվա արժեքը:',
      options: ['¿Cuánto cuesta una noche?', '¿Cuántas cuesta una noche?', '¿Quién cuesta una noche?', '¿Dónde cuesta una noche?'],
      correctIndex: 0, explanationHy: 'Գին հարցնելու համար՝ «¿Cuánto cuesta...?»:',
    },
    {
      id: 'r30_ho_17', world: 'hotel', level: 2,
      situationEs: 'El ascensor no sube. ¿Por dónde subes a la segunda planta?',
      situationHy: 'Վերելակը չի աշխատում. ինչո՞վ ես բարձրանում 2-րդ հարկ:',
      options: ['Por la escalera', 'Por la maleta', 'Por la cuchara', 'Por la aduana'],
      correctIndex: 0, explanationHy: '«Escalera» = աստիճաններ:',
    },
    {
      id: 'r30_ho_18', world: 'hotel', level: 1,
      situationEs: '¿Dónde te lavas por la mañana en el baño?',
      situationHy: 'Լոգարանում որտե՞ղ ես լողանում:',
      options: ['En la ducha', 'En la cocina', 'En la aduana', 'En el mostrador'],
      correctIndex: 0, explanationHy: '«La ducha» = ցնցուղ:',
    },
    {
      id: 'r30_ho_19', world: 'hotel', level: 2,
      situationEs: 'La luz del baño está rota. ¿Cómo lo explicas?',
      situationHy: 'Լոգարանի լույսը չի աշխատում. ինչպե՞ս ես ասում:',
      options: ['No funciona la luz del baño.', 'No incluye la luz del baño.', 'No pesa la luz del baño.', 'No caduca la luz del baño.'],
      correctIndex: 0, explanationHy: '«No funciona...» = Չի աշխատում:',
    },
    {
      id: 'r30_ho_20', world: 'hotel', level: 1,
      situationEs: 'El lugar exterior del hotel donde los niños nadan es...',
      situationHy: 'Հյուրանոցի տեղը, որտեղ երեխաները լողում են...',
      options: ['La piscina', 'La frutería', 'La terminal', 'La cuenta'],
      correctIndex: 0, explanationHy: '«Piscina» = լողավազան:',
    },
    {
      id: 'r30_ho_21', world: 'hotel', level: 2,
      situationEs: 'Te faltan dos toallas limpias. ¿Qué verbo usas?',
      situationHy: 'Երկու մաքուր սրբիչ է պետք. ո՞ր նախադասությունն է ճիշտ:',
      options: ['Necesitamos dos toallas más.', 'Necesitamos dos toallas retrasadas.', 'Aterrizamos dos toallas.', 'Facturamos dos toallas.'],
      correctIndex: 0, explanationHy: '«Necesitamos...» = Մեզ պետք է...',
    },
  ],
  restaurante: [
    {
      id: 'r30_re_1', world: 'restaurante', level: 1,
      situationEs: 'Entras al restaurante con tu familia. ¿Qué pides primero?',
      situationHy: 'Մտնում ես ռեստորան. ի՞նչ ես խնդրում առաջինը:',
      options: ['Una mesa para cuatro, por favor.', 'Una maleta para cuatro, por favor.', 'Una llave para cuatro, por favor.', 'Una bolsa para cuatro, por favor.'],
      correctIndex: 0, explanationHy: '«Una mesa para...» = Սեղան ... հոգու համար:',
    },
    {
      id: 'r30_re_2', world: 'restaurante', level: 1,
      situationEs: 'Quieres ver qué platos y precios hay en el restaurante. Pides:',
      situationHy: 'Ուզում ես տեսնել ուտեստների ցուցակը. ի՞նչ ես խնդրում:',
      options: ['La carta / el menú, por favor.', 'La tarjeta de embarque, por favor.', 'La almohada, por favor.', 'El recibo, por favor.'],
      correctIndex: 0, explanationHy: '«La carta» = ճաշացանկ:',
    },
    {
      id: 'r30_re_3', world: 'restaurante', level: 1,
      situationEs: '¿Qué cubierto necesitas para comer la sopa?',
      situationHy: 'Ո՞ր սպասքն է պետք ապուր ուտելու համար:',
      options: ['La cuchara', 'El cuchillo', 'El pasaporte', 'El ascensor'],
      correctIndex: 0, explanationHy: '«La cuchara» = գդալ:',
    },
    {
      id: 'r30_re_4', world: 'restaurante', level: 1,
      situationEs: '¿Qué dos cubiertos usas normalmente para cortar y comer carne o pollo?',
      situationHy: 'Ի՞նչ սպասք ես օգտագործում միս կտրելու և ուտելու համար:',
      options: ['Tenedor y cuchillo', 'Llave y toalla', 'Maleta y billete', 'Queso y pan'],
      correctIndex: 0, explanationHy: '«Tenedor» = պատառաքաղ, «cuchillo» = դանակ:',
    },
    {
      id: 'r30_re_5', world: 'restaurante', level: 1,
      situationEs: 'No sabes qué plato elegir. ¿Qué preguntas al camarero?',
      situationHy: 'Չգիտես՝ ինչ պատվիրել. ի՞նչ ես հարցնում մատուցողին:',
      options: ['¿Qué nos recomienda?', '¿A qué hora despega?', '¿Dónde está la aduana?', '¿Cuál es la contraseña?'],
      correctIndex: 0, explanationHy: '«¿Qué nos recomienda?» = Ի՞նչ խորհուրդ կտաք:',
    },
    {
      id: 'r30_re_6', world: 'restaurante', level: 1,
      situationEs: 'No te gusta la cebolla en la ensalada. ¿Cómo la pides?',
      situationHy: 'Սոխ չես սիրում աղցանի մեջ. ինչպե՞ս ես պատվիրում:',
      options: ['Una ensalada sin cebolla, por favor.', 'Una ensalada con mucha cebolla.', 'Una ensalada retrasada.', 'Una ensalada en ventanilla.'],
      correctIndex: 0, explanationHy: '«Sin cebolla» = առանց սոխի:',
    },
    {
      id: 'r30_re_7', world: 'restaurante', level: 2,
      situationEs: 'Quieres saber los ingredientes de la paella. Preguntas:',
      situationHy: 'Ուզում ես իմանալ պաելյայի բաղադրիչները. հարցնում ես...',
      options: ['¿Qué lleva este plato?', '¿Cuánto pesa este plato?', '¿En qué planta está este plato?', '¿Cómo aterriza este plato?'],
      correctIndex: 0, explanationHy: '«¿Qué lleva este plato?» = Ի՞նչ է պարունակում այս ուտեստը:',
    },
    {
      id: 'r30_re_8', world: 'restaurante', level: 1,
      situationEs: 'Después del segundo plato, quieres algo dulce como helado o fruta. Es el...',
      situationHy: 'Հիմնական ուտեստից հետո քաղցր բան ես ուզում. դա...',
      options: ['Postre', 'Entrante', 'Desayuno', 'Equipaje'],
      correctIndex: 0, explanationHy: '«El postre» = աղանդեր:',
    },
    {
      id: 'r30_re_9', world: 'restaurante', level: 1,
      situationEs: 'El camarero te pregunta: «¿Para beber?» Tú respondes:',
      situationHy: 'Մատուցողը հարցնում է՝ «Ի՞նչ կխմեք». ի՞նչ ես պատասխանում:',
      options: ['Un zumo de naranja y agua fría, por favor.', 'Un tenedor, por favor.', 'Una almohada doble, por favor.', 'Dos kilos de arroz.'],
      correctIndex: 0, explanationHy: '«Zumo de naranja» = նարնջի հյութ, «agua fría» = սառը ջուր:',
    },
    {
      id: 'r30_re_10', world: 'restaurante', level: 1,
      situationEs: 'Terminaste de comer y quieres pagar. ¿Qué pides?',
      situationHy: 'Ավարտեցիր ուտել և ուզում ես վճարել. ի՞նչ ես խնդրում:',
      options: ['La cuenta, por favor.', 'La maleta, por favor.', 'La escalera, por favor.', 'La aduana, por favor.'],
      correctIndex: 0, explanationHy: '«La cuenta» = հաշիվը:',
    },
    {
      id: 'r30_re_11', world: 'restaurante', level: 2,
      situationEs: 'La comida te ha gustado muchísimo. ¿Qué dices al camarero?',
      situationHy: 'Ուտելիքը շատ համեղ էր. ի՞նչ ես ասում մատուցողին:',
      options: ['¡Todo está delicioso, gracias!', '¡Todo está retrasado!', '¡Todo está sucio!', '¡Todo es equipaje!'],
      correctIndex: 0, explanationHy: '«Está delicioso / riquísimo» = շատ համեղ է:',
    },
    {
      id: 'r30_re_12', world: 'restaurante', level: 2,
      situationEs: 'Elige la frase correcta usando «gustar»:',
      situationHy: 'Ընտրիր ճիշտ նախադասությունը «gustar» բայով:',
      options: ['Me gustan las patatas fritas.', 'Me gusta las patatas fritas.', 'Yo gusto las patatas fritas.', 'Me gustan la patata.'],
      correctIndex: 0, explanationHy: 'Հոգնակիի հետ՝ «Me gustan las patatas»:',
    },
    {
      id: 'r30_re_13', world: 'restaurante', level: 2,
      situationEs: 'Elige la frase correcta usando «preferir»:',
      situationHy: 'Ընտրիր ճիշտ նախադասությունը. «Ես նախընտրում եմ ձուկը»:',
      options: ['Prefiero el pescado al pollo.', 'Prefiro el pescado.', 'Preferimos el pasaporte.', 'Prefiero en la planta.'],
      correctIndex: 0, explanationHy: '«Yo prefiero...» = Ես նախընտրում եմ:',
    },
    {
      id: 'r30_re_14', world: 'restaurante', level: 2,
      situationEs: 'Cada amigo paga su propia comida, no todo junto. Preguntas:',
      situationHy: 'Յուրաքանչյուրն իր մասն է վճարում. հարցնում ես...',
      options: ['¿Podemos pagar por separado?', '¿Podemos pagar en la piscina?', '¿Podemos aterrizar juntos?', '¿Podemos pesar el menú?'],
      correctIndex: 0, explanationHy: '«Por separado» = առանձին:',
    },
    {
      id: 'r30_re_15', world: 'restaurante', level: 1,
      situationEs: '¿Dónde se sienta la gente al aire libre frente al restaurante?',
      situationHy: 'Որտե՞ղ են նստում դրսում՝ ռեստորանի դիմաց:',
      options: ['En la terraza', 'En la cabina', 'En el pasillo del supermercado', 'En el ascensor'],
      correctIndex: 0, explanationHy: '«La terraza» = բացօթյա տեռաս:',
    },
    {
      id: 'r30_re_16', world: 'restaurante', level: 2,
      situationEs: '¿Qué significa «Soy alérgico a los frutos secos»?',
      situationHy: 'Ի՞նչ է նշանակում «Soy alérgico a los frutos secos»:',
      options: ['Ես ալերգիա ունեմ ընկուզեղենից:', 'Ես շատ եմ սիրում ընկույզ:', 'Աղանդերը պատրաստ է:', 'Խնդրում եմ մեկ բաժակ ջուր:'],
      correctIndex: 0, explanationHy: '«Alérgico a...» = ալերգիկ ...-ից:',
    },
    {
      id: 'r30_re_17', world: 'restaurante', level: 1,
      situationEs: 'Para pedir tu plato directamente al camarero dices:',
      situationHy: 'Քո ուտեստը պատվիրելու համար ասում ես...',
      options: ['Para mí, una pizza margarita.', 'Para mí, una contraseña.', 'Para mí, una aduana.', 'Para mí, un retraso.'],
      correctIndex: 0, explanationHy: '«Para mí...» = Ինձ համար...',
    },
    {
      id: 'r30_re_18', world: 'restaurante', level: 2,
      situationEs: 'El dinero extra voluntario que dejas por el buen servicio es...',
      situationHy: 'Ավել գումարը, որ թողնում ես լավ սպասարկման համար...',
      options: ['La propina', 'La aduana', 'La báscula', 'La manta'],
      correctIndex: 0, explanationHy: '«La propina» = թեյավճար:',
    },
    {
      id: 'r30_re_19', world: 'restaurante', level: 1,
      situationEs: 'La comida de la noche en España se llama...',
      situationHy: 'Երեկոյան ուտելու ժամը (ընթրիք)...',
      options: ['La cena', 'El desayuno', 'El equipaje', 'La llegada'],
      correctIndex: 0, explanationHy: '«La cena» = ընթրիք:',
    },
    {
      id: 'r30_re_20', world: 'restaurante', level: 2,
      situationEs: 'El plato caliente con caldo y verduras que se toma al principio es...',
      situationHy: 'Տաք հեղուկ ուտեստը բանջարեղենով...',
      options: ['La sopa', 'El helado', 'La barra de pan', 'La llave'],
      correctIndex: 0, explanationHy: '«La sopa» = ապուր:',
    },
    {
      id: 'r30_re_21', world: 'restaurante', level: 2,
      situationEs: 'El vaso está vacío y tienes sed. ¿Qué pides?',
      situationHy: 'Բաժակը դատարկ է և ծարավ ես. ի՞նչ ես խնդրում:',
      options: ['¿Nos trae otra botella de agua, por favor?', '¿Nos trae otra maleta?', '¿Nos trae otro pasaporte?', '¿Nos trae otra escalera?'],
      correctIndex: 0, explanationHy: '«¿Nos trae...?» = Կբերե՞ք մեզ...',
    },
  ],
  supermercado: [
    {
      id: 'r30_su_1', world: 'supermercado', level: 1,
      situationEs: 'Necesitas llevar muchas cosas en el supermercado. ¿Qué tomas a la entrada?',
      situationHy: 'Շատ գնումներ դնելու համար մուտքի մոտ ի՞նչ ես վերցնում:',
      options: ['Un carrito o una cesta', 'Una almohada', 'Un tenedor', 'Un billete de avión'],
      correctIndex: 0, explanationHy: '«Carrito» = սայլակ, «cesta» = զամբյուղ:',
    },
    {
      id: 'r30_su_2', world: 'supermercado', level: 1,
      situationEs: 'No encuentras las manzanas. ¿Qué preguntas a un empleado?',
      situationHy: 'Չես գտնում խնձորները. ի՞նչ ես հարցնում աշխատակցին:',
      options: ['¿Dónde puedo encontrar las manzanas?', '¿A qué hora despegan las manzanas?', '¿El desayuno incluye manzanas?', '¿Funciona el aire de manzanas?'],
      correctIndex: 0, explanationHy: '«¿Dónde puedo encontrar...?» = Որտե՞ղ կարող եմ գտնել...',
    },
    {
      id: 'r30_su_3', world: 'supermercado', level: 1,
      situationEs: 'El lugar donde pagas todos tus productos al salir es...',
      situationHy: 'Այն տեղը, որտեղ վճարում ես գնումների համար...',
      options: ['La caja', 'La aduana', 'La ducha', 'La terraza'],
      correctIndex: 0, explanationHy: '«La caja» = դրամարկղ:',
    },
    {
      id: 'r30_su_4', world: 'supermercado', level: 1,
      situationEs: 'No tienes dónde meter los productos después de pagar. Pides:',
      situationHy: 'Գնումները տեղավորելու համար ի՞նչ ես խնդրում դրամարկղում:',
      options: ['¿Me da una bolsa, por favor?', '¿Me da una cuchara, por favor?', '¿Me da una manta, por favor?', '¿Me da una puerta, por favor?'],
      correctIndex: 0, explanationHy: '«Una bolsa» = տոպրակ:',
    },
    {
      id: 'r30_su_5', world: 'supermercado', level: 1,
      situationEs: 'El papel que demuestra lo que compraste y pagaste es...',
      situationHy: 'Թուղթը, որ տալիս են վճարելուց հետո...',
      options: ['El recibo / ticket', 'El pasaporte', 'La carta', 'La toalla'],
      correctIndex: 0, explanationHy: '«El recibo» = կտրոն:',
    },
    {
      id: 'r30_su_6', world: 'supermercado', level: 1,
      situationEs: 'La sección donde compras manzanas, plátanos y naranjas es la...',
      situationHy: 'Բաժինը, որտեղ վաճառվում են մրգերը...',
      options: ['Frutería', 'Panadería', 'Recepción', 'Terminal'],
      correctIndex: 0, explanationHy: '«Frutería» = մրգի բաժին:',
    },
    {
      id: 'r30_su_7', world: 'supermercado', level: 1,
      situationEs: '¿Dónde compras el pan recién hecho?',
      situationHy: 'Որտե՞ղ ես գնում թարմ հացը:',
      options: ['En la panadería', 'En la carnicería', 'En la piscina', 'En la báscula'],
      correctIndex: 0, explanationHy: '«Panadería» = հացի բաժին / փուռ:',
    },
    {
      id: 'r30_su_8', world: 'supermercado', level: 1,
      situationEs: 'Un producto cuesta 1,50€ en vez de 2,50€ hoy. Tiene un...',
      situationHy: 'Ապրանքի գինն այսօր իջեցված է. դա...',
      options: ['Descuento / oferta', 'Retraso', 'Equipaje', 'Despegue'],
      correctIndex: 0, explanationHy: '«Oferta / descuento» = զեղչ / ակցիա:',
    },
    {
      id: 'r30_su_9', world: 'supermercado', level: 2,
      situationEs: 'Quieres pagar con tu tarjeta bancaria, no con monedas ni billetes:',
      situationHy: 'Ուզում ես վճարել բանկային քարտով:',
      options: ['¿Puedo pagar con tarjeta?', '¿Puedo pagar con maleta?', '¿Puedo aterrizar con tarjeta?', '¿Puedo dormir con tarjeta?'],
      correctIndex: 0, explanationHy: '«Pagar con tarjeta» = վճարել քարտով:',
    },
    {
      id: 'r30_su_10', world: 'supermercado', level: 2,
      situationEs: 'Pagar con billetes y monedas se dice pagar en...',
      situationHy: 'Կանխիկ գումարով վճարելը կոչվում է...',
      options: ['Efectivo', 'Pasillo', 'Separo', 'Descuento'],
      correctIndex: 0, explanationHy: '«En efectivo» = կանխիկ:',
    },
    {
      id: 'r30_su_11', world: 'supermercado', level: 2,
      situationEs: 'Para pesar 500 gramos de tomates pides:',
      situationHy: '500 գրամ լոլիկ խնդրելու համար ասում ես...',
      options: ['Medio kilo de tomates', 'Medio litro de tomates', 'Una barra de tomates', 'Una caja de pan'],
      correctIndex: 0, explanationHy: '«Medio kilo» = կես կիլոգրամ (500 գ):',
    },
    {
      id: 'r30_su_12', world: 'supermercado', level: 1,
      situationEs: '¿Cómo se mide normalmente la leche o el agua?',
      situationHy: 'Ինչո՞վ են չափում կաթը կամ ջուրը:',
      options: ['Por litros (un litro)', 'Por barras', 'Por plantas', 'Por asientos'],
      correctIndex: 0, explanationHy: '«Un litro de leche» = մեկ լիտր կաթ:',
    },
    {
      id: 'r30_su_13', world: 'supermercado', level: 2,
      situationEs: 'Elige la pregunta correcta para saber el precio de los quesos (plural):',
      situationHy: 'Ընտրիր ճիշտ հարցը հոգնակի առարկաների («los quesos») գինը հարցնելու համար:',
      options: ['¿Cuánto cuestan estos quesos?', '¿Cuánto cuesta estos quesos?', '¿Cuántos cuesta este queso?', '¿Cuál cuestan estos quesos?'],
      correctIndex: 0, explanationHy: 'Հոգնակիի համար՝ «¿Cuánto cuestan...?»:',
    },
    {
      id: 'r30_su_14', world: 'supermercado', level: 2,
      situationEs: 'La marca A cuesta 4€ y la marca B cuesta 2€. La marca B es...',
      situationHy: 'B ապրանքն ավելի էժան է A-ից:',
      options: ['Más barata que la marca A', 'Más cara que la marca A', 'Más retrasada', 'Más sucia'],
      correctIndex: 0, explanationHy: '«Más barata que...» = ավելի էժան, քան...',
    },
    {
      id: 'r30_su_15', world: 'supermercado', level: 1,
      situationEs: 'Para preguntar la suma de toda la compra en la caja dices:',
      situationHy: 'Դրամարկղում ընդհանուր գումարը հարցնելու համար ասում ես...',
      options: ['¿Cuánto es en total?', '¿Dónde está el vuelo?', '¿Qué planta es?', '¿Está incluido el postre?'],
      correctIndex: 0, explanationHy: '«¿Cuánto es en total?» = Ընդամենը ինչքա՞ն է:',
    },
    {
      id: 'r30_su_16', world: 'supermercado', level: 1,
      situationEs: 'Leche, yogur y queso pertenecen a la sección de...',
      situationHy: 'Կաթը, յոգուրտը և պանիրը կոչվում են...',
      options: ['Lácteos', 'Verduras', 'Bebidas', 'Carnicería'],
      correctIndex: 0, explanationHy: '«Lácteos» = կաթնամթերք:',
    },
    {
      id: 'r30_su_17', world: 'supermercado', level: 2,
      situationEs: 'El aparato donde pesas las frutas en el supermercado es...',
      situationHy: 'Սարքը, որով կշռում ես միրգը...',
      options: ['La báscula', 'La ducha', 'La cuchara', 'La puerta'],
      correctIndex: 0, explanationHy: '«La báscula» = կշեռք:',
    },
    {
      id: 'r30_su_18', world: 'supermercado', level: 2,
      situationEs: 'Si tienes solo 10 euros y el carrito suma 14 euros, necesitas comprar productos...',
      situationHy: 'Եթե գումարը չի հերիքում, պետք է ընտրել ապրանքներ...',
      options: ['Más baratos', 'Más caros', 'Más lentos', 'Con retraso'],
      correctIndex: 0, explanationHy: '«Más baratos» = ավելի էժան:',
    },
    {
      id: 'r30_su_19', world: 'supermercado', level: 1,
      situationEs: '¿Dónde están ordenados los paquetes de arroz, pasta y galletas?',
      situationHy: 'Որտե՞ղ են դասավորված մթերքները սուպերմարկետում:',
      options: ['En la estantería', 'En la almohada', 'En la piscina', 'En el tenedor'],
      correctIndex: 0, explanationHy: '«Estantería» = դարակաշար:',
    },
    {
      id: 'r30_su_20', world: 'supermercado', level: 2,
      situationEs: 'Completa: «¿_____ litros de agua necesitas para el viaje?»',
      situationHy: 'Լրացրու («litros» արական հոգնակի է):',
      options: ['Cuántos', 'Cuántas', 'Cuánto', 'Cuándo'],
      correctIndex: 0, explanationHy: '«Litros» արական հոգնակի է՝ «¿Cuántos litros?»:',
    },
    {
      id: 'r30_su_21', world: 'supermercado', level: 1,
      situationEs: 'Si una fruta acaba de llegar del campo hoy, está...',
      situationHy: 'Երբ միրգը թարմ է...',
      options: ['Fresca', 'Caducada', 'Retrasada', 'Incluida'],
      correctIndex: 0, explanationHy: '«Fresca / fresco» = թարմ:',
    },
  ],
};

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function get30QuestionsForWorld(world: WorldId | 'todos'): QuickQuestion[] {
  if (world === 'todos') {
    const all: QuickQuestion[] = [
      ...ALL_WORLDS.flatMap((w) => w.quickQuestions),
      ...EXTRA_RETO_30_QUESTIONS.aeropuerto,
      ...EXTRA_RETO_30_QUESTIONS.hotel,
      ...EXTRA_RETO_30_QUESTIONS.restaurante,
      ...EXTRA_RETO_30_QUESTIONS.supermercado,
    ];
    return shuffleArray(all).slice(0, 30);
  }
  const combined = [...WORLDS_MAP[world].quickQuestions, ...EXTRA_RETO_30_QUESTIONS[world]];
  const shuffled = shuffleArray(combined);
  if (shuffled.length >= 30) return shuffled.slice(0, 30);
  const res = [...shuffled];
  let i = 0;
  while (res.length < 30 && shuffled.length > 0) {
    res.push(shuffled[i % shuffled.length]);
    i += 1;
  }
  return res;
}


