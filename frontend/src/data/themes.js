// Preset Narrative Themes for Ju|'hoansi Story Generation
export const PRESET_THEMES = [
  {
    id: 'sharing_honey',
    title: 'Sharing Honey (zo)',
    icon: '🍯',
    description: 'A tale of wild honey discovery, testing communal obligations, and correcting selfish hoarding.',
    motifs: ['Lack', 'Interdiction', 'Violation', 'Consequence', 'Lack Liquidated'],
    defaultPrompt: 'sharing wild honey (zo) found in a hollow baobab tree',
    culturalNote: 'In Ju|\'hoansi tradition, honey is a highly prized gift that must be shared equitably with the camp.',
    image: '/images/baobab-namibia.jpg',
    imageAlt: 'Baobab tree in Namibia, traditional home of wild honeybees'
  },
  {
    id: 'moon_life',
    title: 'The Moon & Eternal Life',
    icon: '🌙',
    description: 'An ancient origin myth explaining why humans die permanently while the Moon perishes and dies only to rise again.',
    motifs: ['Interdiction', 'Violation', 'Consequence', 'Departure', 'Return'],
    defaultPrompt: 'The Moon dies and lives again, sending the Hare with a message of immortality to humans',
    culturalNote: 'Highlights the sacred cosmic order and the role of animal messengers in Kalahari folklore.',
    image: '/images/kalahari-dunes.jpg',
    imageAlt: 'Red sand dunes and savanna bush of the Kalahari'
  },
  {
    id: 'trickster_waterhole',
    title: 'Trickster at the Waterhole',
    icon: '🐾',
    description: 'A comical yet cautionary tale featuring the cunning trickster animal trying to fool camp elders for water rights.',
    motifs: ['Lack', 'Violation', 'Mediation', 'Consequence'],
    defaultPrompt: 'A trickster springhare attempting to hide the secret waterhole from the thirsty community',
    culturalNote: 'Trickster stories teach wisdom, humility, and the importance of ecological harmony.',
    image: '/images/san-rock-art.jpg',
    imageAlt: 'San rock art paintings in ochre and white kaolin at Brandberg, Namibia'
  },
  {
    id: 'fire_origin',
    title: 'Origin of Fire & Campfire',
    icon: '🔥',
    description: 'How a brave woman first discovered fire beneath the bark of a tree and shared its warmth with the n!ore.',
    motifs: ['Lack', 'Mediation', 'Lack Liquidated', 'Return'],
    defaultPrompt: 'A woman first found fire under the armpit of the sacred bird and brought warmth to camp',
    culturalNote: 'The campfire (da) represents the heart of Ju|\'hoansi social gathering and story sharing.',
    image: '/images/tsumkwe-juhoansi.jpg',
    imageAlt: 'Ju|\'hoansi San elders in Tsumkwe, Nyae Nyae, Namibia'
  },
  {
    id: 'elephant_water',
    title: 'The Elephant & The Water',
    icon: '🐘',
    description: 'The giant elephant holds back the desert rain until smaller animals join forces through communal mediation.',
    motifs: ['Lack', 'Interdiction', 'Mediation', 'Lack Liquidated'],
    defaultPrompt: 'The Great Elephant holding the water reservoir until small birds negotiate sharing',
    culturalNote: 'Demonstrates how collective strength overcomes individual domination in desert survival.',
    image: '/images/ostrich-beads.jpg',
    imageAlt: 'Traditional San ostrich eggshell beadwork necklace'
  }
];

export const SAMPLE_STORIES = [
  {
    id: 'sample_honey',
    title: 'The Story of Honey and the Greedy Hunter',
    theme: 'sharing honey',
    image: '/images/baobab-namibia.jpg',
    imageAlt: 'Baobab tree in Namibia, traditional home of wild honeybees',
    text: `Long ago, in the red sand n!ore (territory) near the pans, a hunter named /Gao went into the bush to search for game. Instead of game, he heard the sharp call of the honeyguide bird. Following the bird to a giant baobab tree, he found a hive brimming with golden zo (honey).

Instead of returning to camp to bring his age-mates (!xo) and relatives as customary, /Gao ate until his belly was full and hid the remaining honeycomb under dry leaves. He swore the honeyguide to secrecy.

When /Gao returned to camp empty-handed, his grandmother (!ga) looked at his sticky fingers and asked if he had found sweet zo. /Gao lied and claimed he had seen nothing but dry grass. That night, a swarm of wild bees swarmed into /Gao's shelter, stinging him until he cried out his confession.

The elders brought /Gao to the tree the next morning, retrieved the remaining honey, and shared it among all the families of the camp. /Gao learned that in the Kalahari, sweet things are only sweet when shared.`
  },
  {
    id: 'sample_moon',
    title: 'Why the Moon Dies and Lives Again',
    theme: 'immortality myth',
    image: '/images/kalahari-dunes.jpg',
    imageAlt: 'Red sand dunes and savanna bush of the Kalahari',
    text: `In the old days when animals were people, the Moon looked down upon the humans in the camp and felt deep pity because they feared death. The Moon called the Hare and said: "Go to the humans and tell them: 'As I die and dying live again, so shall you die and dying live again.'"

The Hare ran quickly across the dunes, but on the way he grew distracted by sweet roots. When he arrived at the camp, he mixed up the Moon's message and told the people: "As I die and dying perish forever, so shall you die and dying perish forever."

When the Hare returned, the Moon asked what he had spoken. Upon hearing the Hare's mistake, the Moon grew angry and struck the Hare upon his lip with a stick, cleaving it in two. That is why the hare has a split lip to this day, and why humans do not return after death like the Moon.`
  }
];
