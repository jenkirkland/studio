export interface Activity {
  id: string;
  name: string;
  description: string;
  type: 'nature' | 'food' | 'historical' | 'art' | 'entertainment' | 'shopping' | 'sports' | 'culture' | 'science' | 'sightseeing' | 'boat tour' | 'family' | 'nightlife' | 'recreation' | 'beach' | 'coastal town' | 'living museum' | 'maritime' | 'military' | 'architecture' | 'scenic';
  durationMinutes: number;
  address: string;
  typicalHours?: string;
}

export const ACTIVITIES: Activity[] = [
  {
    id: 'boston-common',
    name: 'Boston Common',
    description: 'Boston’s central historic park and a great starting point for a classic downtown walk. Easy to pair with the Public Garden or Freedom Trail.',
    type: 'nature',
    durationMinutes: 60,
    address: '139 Tremont St, Boston, MA 02111'
  },
  {
    id: 'freedom-trail',
    name: 'Freedom Trail',
    description: 'A classic self-guided walk through Boston’s most famous historic sites. High-density history day without needing a car.',
    type: 'historical',
    durationMinutes: 180,
    address: 'Boston, MA'
  },
  {
    id: 'north-end',
    name: 'North End',
    description: 'Boston’s old Italian neighborhood with great food, pastries, and historic streets. Ideal for wandering and dinner.',
    type: 'food',
    durationMinutes: 120,
    address: 'Hanover St, Boston, MA 02113'
  },
  {
    id: 'newbury-street',
    name: 'Newbury Street',
    description: 'A relaxed Back Bay stretch for shopping, people-watching, and cafés. Great for a lighter city day.',
    type: 'shopping',
    durationMinutes: 120,
    address: 'Newbury St, Boston, MA 02116'
  },
  {
    id: 'quincy-market',
    name: 'Quincy Market',
    description: 'Busy, tourist-friendly food hall and shopping stop near the waterfront. A quick anchor stop in downtown.',
    type: 'food',
    durationMinutes: 60,
    address: '4 S Market St, Boston, MA 02109'
  },
  {
    id: 'fenway-park',
    name: 'Fenway Park (Red Sox)',
    description: 'A classic Boston sports outing. Best if you want an event-centered afternoon or evening.',
    type: 'sports',
    durationMinutes: 210,
    address: '4 Jersey St, Boston, MA 02215'
  },
  {
    id: 'south-end',
    name: 'South End',
    description: 'Neighborhood known for restaurants, brownstones, and a more local feel. Great for brunch or dinner.',
    type: 'food',
    durationMinutes: 120,
    address: 'Tremont St, Boston, MA 02118'
  },
  {
    id: 'charles-river-esplanade',
    name: 'Charles River Esplanade',
    description: 'A scenic riverfront path for a casual walk or relaxing outdoor break.',
    type: 'nature',
    durationMinutes: 90,
    address: 'Charles River Esplanade, Boston, MA 02116'
  },
  {
    id: 'whale-watching',
    name: 'Whale Watching Cruise',
    description: 'A high-speed catamaran harbor outing. Best in warmer months and easy to combine with the Aquarium.',
    type: 'boat tour',
    durationMinutes: 240,
    address: '1 Long Wharf, Boston, MA 02110'
  },
  {
    id: 'tea-party-museum',
    name: 'Tea Party Ships & Museum',
    description: 'A compact, interactive history stop with a tourist-friendly format. Experiential history.',
    type: 'historical',
    durationMinutes: 90,
    address: '306 Congress St, Boston, MA 02210'
  },
  {
    id: 'hong-kong-karaoke',
    name: 'Hong Kong Karaoke',
    description: 'A casual, iconic karaoke bar. Best for a looser night with food and bars nearby.',
    type: 'nightlife',
    durationMinutes: 120,
    address: '1 Faneuil Hall Square, Boston, MA 02109'
  },
  {
    id: 'aquarium',
    name: 'New England Aquarium',
    description: 'An easy family-friendly or rainy-day stop right on the waterfront.',
    type: 'family',
    durationMinutes: 150,
    address: '1 Central Wharf, Boston, MA 02110'
  },
  {
    id: 'mfa',
    name: 'Museum of Fine Arts (MFA)',
    description: 'A major museum for art-focused visitors. Can be a quick highlight or a half-day destination.',
    type: 'art',
    durationMinutes: 180,
    address: '465 Huntington Ave, Boston, MA 02115'
  },
  {
    id: 'duck-tours',
    name: 'Boston Duck Tours',
    description: 'A classic first-timer overview of the city with a fun, touristy feel.',
    type: 'sightseeing',
    durationMinutes: 80,
    address: '4 Copley Pl, Boston, MA 02116'
  },
  {
    id: 'gardner-museum',
    name: 'Isabella Stewart Gardner Museum',
    description: 'A highly atmospheric museum that feels more intimate and memorable than a standard gallery.',
    type: 'art',
    durationMinutes: 120,
    address: '25 Evans Way, Boston, MA 02115'
  },
  {
    id: 'ica-boston',
    name: 'ICA Boston',
    description: 'Modern art and waterfront option in the Seaport District. Contemporary and polished.',
    type: 'art',
    durationMinutes: 90,
    address: '25 Harbor Shore Dr, Boston, MA 02210'
  },
  {
    id: 'blue-hills',
    name: 'Blue Hills Reservation',
    description: 'A nearby hike option that feels like a real nature outing. Best for active visitors.',
    type: 'nature',
    durationMinutes: 150,
    address: '695 Hillside St, Milton, MA 02186'
  },
  {
    id: 'salem',
    name: 'Salem Day Trip',
    description: 'Walkable history, quirky shops, and atmosphere. Distinctly New England.',
    type: 'historical',
    durationMinutes: 240,
    address: 'Salem, MA'
  },
  {
    id: 'rockport',
    name: 'Rockport / Bearskin Neck',
    description: 'Classic coastal village day with shops, views, and an easy strolling pace.',
    type: 'shopping',
    durationMinutes: 150,
    address: 'Bearskin Neck, Rockport, MA 01966'
  },
  {
    id: 'tree-house-tewksbury',
    name: 'Tree House Brewing (Tewksbury)',
    description: 'A destination brewery for beer and pizza in a local setting.',
    type: 'food',
    durationMinutes: 120,
    address: '1880 Main St, Tewksbury, MA 01876'
  },
  {
    id: 'minuteman-park',
    name: 'Minute Man National Park',
    description: 'Revolutionary history with walking paths. Great for history buffs and low-key trips.',
    type: 'historical',
    durationMinutes: 120,
    address: '250 N Great Rd, Lincoln, MA 01773'
  },
  {
    id: 'walden-pond',
    name: 'Walden Pond',
    description: 'A peaceful nature stop for walking, swimming, or quiet reflection.',
    type: 'nature',
    durationMinutes: 90,
    address: '915 Walden St, Concord, MA 01742'
  },
  {
    id: 'museum-of-science',
    name: 'Museum of Science',
    description: 'A reliable all-ages museum with enough to fill a few hours without being overwhelming.',
    type: 'science',
    durationMinutes: 180,
    address: '1 Science Park, Boston, MA 02114'
  },
  {
    id: 'hammond-castle',
    name: 'Hammond Castle Museum',
    description: 'A quirky, memorable castle stop that feels different from the usual museum circuit.',
    type: 'architecture',
    durationMinutes: 90,
    address: '80 Hesperus Ave, Gloucester, MA 01930'
  },
  {
    id: 'strawbery-banke',
    name: 'Strawbery Banke Museum',
    description: 'A strong open-air history stop that works especially well in good weather.',
    type: 'living museum',
    durationMinutes: 150,
    address: '14 Hancock St, Portsmouth, NH 03801'
  },
  {
    id: 'plimoth-patuxet',
    name: 'Plimoth Patuxet Museums',
    description: 'A substantial living-history destination that can easily be the main event of the day.',
    type: 'living museum',
    durationMinutes: 240,
    address: '137 Warren Ave, Plymouth, MA 02360'
  }
];
