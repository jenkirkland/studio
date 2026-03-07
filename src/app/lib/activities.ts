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
    name: 'Boston Common (Freedom Trail)',
    description: 'Boston’s central historic park and a great starting point for a classic downtown walk. Easy to pair with the Public Garden, Beacon Hill, or the Freedom Trail.',
    type: 'nature',
    durationMinutes: 60,
    address: '139 Tremont St, Boston, MA 02111'
  },
  {
    id: 'mass-state-house',
    name: 'Massachusetts State House (Freedom Trail)',
    description: 'The state capitol building with its iconic golden dome, located across from the Common.',
    type: 'historical',
    durationMinutes: 45,
    address: '24 Beacon St, Boston, MA 02133'
  },
  {
    id: 'park-street-church',
    name: 'Park Street Church (Freedom Trail)',
    description: 'Historic church known for its towering steeple and rich abolitionist history.',
    type: 'historical',
    durationMinutes: 30,
    address: '1 Park St, Boston, MA 02108'
  },
  {
    id: 'granary-burying-ground',
    name: 'Granary Burying Ground (Freedom Trail)',
    description: 'Final resting place of Paul Revere, Samuel Adams, and John Hancock.',
    type: 'historical',
    durationMinutes: 45,
    address: 'Tremont St, Boston, MA 02108'
  },
  {
    id: 'kings-chapel',
    name: 'Kings Chapel (Freedom Trail)',
    description: 'Historic stone church and the oldest English burying ground in Boston proper.',
    type: 'historical',
    durationMinutes: 30,
    address: '58 Tremont St, Boston, MA 02108'
  },
  {
    id: 'old-south-meeting',
    name: 'Old South Meeting House (Freedom Trail)',
    description: 'The organizing site for the Boston Tea Party.',
    type: 'historical',
    durationMinutes: 45,
    address: '310 Washington St, Boston, MA 02108'
  },
  {
    id: 'old-state-house',
    name: 'Old State House (Freedom Trail)',
    description: 'Site of the Boston Massacre and the reading of the Declaration of Independence.',
    type: 'historical',
    durationMinutes: 60,
    address: '206 Washington St, Boston, MA 02109'
  },
  {
    id: 'paul-revere-house',
    name: 'Paul Revere House (Freedom Trail)',
    description: 'The colonial home of Paul Revere, nestled in the North End.',
    type: 'historical',
    durationMinutes: 45,
    address: '19 N Square, Boston, MA 02113'
  },
  {
    id: 'old-north-church',
    name: 'Old North Church (Freedom Trail)',
    description: 'Famous for the "One if by land, two if by sea" lantern signal.',
    type: 'historical',
    durationMinutes: 45,
    address: '193 Salem St, Boston, MA 02113'
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
    description: 'A relaxed Back Bay stretch for shopping, people-watching, and cafés. Great for retail and walking.',
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
    id: 'back-bay',
    name: 'Back Bay',
    description: 'One of the easiest neighborhoods for a polished day of walking, shopping, and dining.',
    type: 'culture',
    durationMinutes: 150,
    address: 'Back Bay, Boston, MA'
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
    description: 'A high-speed catamaran harbor outing. Best in warmer months.',
    type: 'boat tour',
    durationMinutes: 240,
    address: '1 Long Wharf, Boston, MA 02110'
  },
  {
    id: 'tea-party-museum',
    name: 'Tea Party Ships & Museum',
    description: 'A compact, interactive history stop with a tourist-friendly format.',
    type: 'historical',
    durationMinutes: 90,
    address: '306 Congress St, Boston, MA 02210'
  },
  {
    id: 'faneuil-hall',
    name: 'Faneuil Hall Marketplace (Freedom Trail)',
    description: 'Lively gathering area for snacks, shopping, and people-watching.',
    type: 'shopping',
    durationMinutes: 60,
    address: '1 Faneuil Hall Sq, Boston, MA 02109'
  },
  {
    id: 'hong-kong-karaoke',
    name: 'Hong Kong Karaoke',
    description: 'A casual, iconic karaoke bar. Best for a looser night.',
    type: 'nightlife',
    durationMinutes: 120,
    address: '1 Faneuil Hall Square, Boston, MA 02109'
  },
  {
    id: 'paddle-boston',
    name: 'Paddle Boston',
    description: 'Kayak or SUP on the Charles River. Active warm-weather fun.',
    type: 'recreation',
    durationMinutes: 120,
    address: '1071 Soldiers Field Rd, Boston, MA 02134'
  },
  {
    id: 'sunset-sailing',
    name: 'Sunset Sailing Cruise',
    description: 'Atmospheric harbor outing on a tall ship with great skyline views.',
    type: 'boat tour',
    durationMinutes: 120,
    address: '60 Rowes Wharf, Boston, MA 02110'
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
    id: 'museum-of-science',
    name: 'Museum of Science',
    description: 'A reliable all-ages museum with interactive exhibits.',
    type: 'science',
    durationMinutes: 180,
    address: '1 Science Park, Boston, MA 02114'
  },
  {
    id: 'harvard-natural-history',
    name: 'Harvard Museum of Natural History',
    description: 'Famous for the Glass Flowers. A distinctive Cambridge stop.',
    type: 'culture',
    durationMinutes: 120,
    address: '26 Oxford St, Cambridge, MA 02138'
  },
  {
    id: 'mfa',
    name: 'Museum of Fine Arts (MFA)',
    description: 'A major museum for art-focused visitors.',
    type: 'art',
    durationMinutes: 180,
    address: '465 Huntington Ave, Boston, MA 02115'
  },
  {
    id: 'duck-tours',
    name: 'Boston Duck Tours',
    description: 'A classic first-timer overview of the city on land and water.',
    type: 'sightseeing',
    durationMinutes: 80,
    address: '4 Copley Pl, Boston, MA 02116'
  },
  {
    id: 'public-garden',
    name: 'Boston Public Garden',
    description: 'Beautiful, compact park with Swan Boats. Scenic downtown anchor.',
    type: 'nature',
    durationMinutes: 60,
    address: '4 Charles St, Boston, MA 02116'
  },
  {
    id: 'gardner-museum',
    name: 'Isabella Stewart Gardner Museum',
    description: 'Atmospheric museum in a Venetian-style palace.',
    type: 'art',
    durationMinutes: 120,
    address: '25 Evans Way, Boston, MA 02115'
  },
  {
    id: 'uss-constitution',
    name: 'USS Constitution (Freedom Trail)',
    description: 'History and waterfront stop in Charlestown Navy Yard.',
    type: 'historical',
    durationMinutes: 120,
    address: 'Charlestown Navy Yard, Charlestown, MA 02129'
  },
  {
    id: 'ica-boston',
    name: 'ICA Boston',
    description: 'Modern art and waterfront option in the Seaport District.',
    type: 'art',
    durationMinutes: 90,
    address: '25 Harbor Shore Dr, Boston, MA 02210'
  },
  {
    id: 'castle-island',
    name: 'Castle Island & Sullivans',
    description: 'Local waterfront outing with a fort and famous snack bar.',
    type: 'scenic',
    durationMinutes: 120,
    address: '2010 Day Blvd, South Boston, MA 02127'
  },
  {
    id: 'jfk-library',
    name: 'JFK Presidential Library',
    description: 'Substantial history stop with sweeping harbor views.',
    type: 'historical',
    durationMinutes: 150,
    address: 'Columbia Point, Boston, MA 02125'
  },
  {
    id: 'sweet-life',
    name: 'Sweet Life',
    description: 'Straightforward breakfast stop in Lower Mills.',
    type: 'food',
    durationMinutes: 60,
    address: '2243 Dorchester Ave, Boston, MA 02124'
  },
  {
    id: 'blue-hills',
    name: 'Blue Hills Reservation',
    description: 'A nearby hike option with a real nature feel.',
    type: 'nature',
    durationMinutes: 150,
    address: '695 Hillside St, Milton, MA 02186'
  },
  {
    id: 'revere-beach',
    name: 'Revere Beach',
    description: 'The first public beach in America. Easy ocean air.',
    type: 'beach',
    durationMinutes: 120,
    address: 'Revere Beach Blvd, Revere, MA 02151'
  },
  {
    id: 'salem',
    name: 'Salem Day Trip',
    description: 'Walkable history, quirky shops, and atmosphere.',
    type: 'historical',
    durationMinutes: 240,
    address: 'Salem, MA'
  },
  {
    id: 'pem',
    name: 'Peabody Essex Museum',
    description: 'A major museum anchor for a Salem day trip.',
    type: 'art',
    durationMinutes: 150,
    address: '161 Essex St, Salem, MA 01970'
  },
  {
    id: 'hammond-castle',
    name: 'Hammond Castle Museum',
    description: 'A quirky, memorable castle on the coast in Gloucester.',
    type: 'architecture',
    durationMinutes: 90,
    address: '80 Hesperus Ave, Gloucester, MA 01930'
  },
  {
    id: 'castle-hill',
    name: 'Castle Hill on Crane Estate',
    description: 'Visually impressive mansion grounds and coastal views.',
    type: 'scenic',
    durationMinutes: 150,
    address: '290 Argilla Rd, Ipswich, MA 01938'
  },
  {
    id: 'rockport',
    name: 'Rockport / Bearskin Neck',
    description: 'Classic coastal village with shops and scenic views.',
    type: 'shopping',
    durationMinutes: 150,
    address: 'Bearskin Neck, Rockport, MA 01966'
  },
  {
    id: 'newburyport',
    name: 'Newburyport & Plum Island',
    description: 'Relaxed North Shore town and nature reserve.',
    type: 'coastal town',
    durationMinutes: 180,
    address: 'Newburyport, MA'
  },
  {
    id: 'strawbery-banke',
    name: 'Strawbery Banke Museum',
    description: 'Open-air history stop in Portsmouth, NH.',
    type: 'living museum',
    durationMinutes: 150,
    address: '14 Hancock St, Portsmouth, NH 03801'
  },
  {
    id: 'uss-albacore',
    name: 'USS Albacore Museum',
    description: 'A quick and interesting submarine history stop.',
    type: 'military',
    durationMinutes: 60,
    address: '600 Market St, Portsmouth, NH 03801'
  },
  {
    id: 'river-house',
    name: 'River House',
    description: 'Waterfront meal stop in walkable Portsmouth.',
    type: 'food',
    durationMinutes: 90,
    address: '53 Bow St, Portsmouth, NH 03801'
  },
  {
    id: 'nubble-light',
    name: 'Nubble Lighthouse',
    description: 'Iconic scenic lighthouse stop in York, Maine.',
    type: 'scenic',
    durationMinutes: 45,
    address: 'Sohier Park Rd, York, ME 03909'
  },
  {
    id: 'plimoth-patuxet',
    name: 'Plimoth Patuxet Museums',
    description: 'Substantial living-history destination in Plymouth.',
    type: 'living museum',
    durationMinutes: 240,
    address: '137 Warren Ave, Plymouth, MA 02360'
  },
  {
    id: 'mayflower-ii',
    name: 'Mayflower II',
    description: 'Focused historic ship visit in Plymouth harbor.',
    type: 'maritime',
    durationMinutes: 60,
    address: '74 Water St, Plymouth, MA 02360'
  },
  {
    id: 'provincetown',
    name: 'Provincetown',
    description: 'Vibrant beach town at the tip of Cape Cod.',
    type: 'beach',
    durationMinutes: 300,
    address: 'Provincetown, MA'
  },
  {
    id: 'providence',
    name: 'Providence',
    description: 'Flexible city day trip with food and art.',
    type: 'culture',
    durationMinutes: 240,
    address: 'Providence, RI'
  },
  {
    id: 'risd-museum',
    name: 'RISD Museum',
    description: 'World-class art museum in Providence.',
    type: 'art',
    durationMinutes: 120,
    address: '20 N Main St, Providence, RI 02903'
  },
  {
    id: 'waterfire',
    name: 'WaterFire',
    description: 'Public art installation and event in Providence.',
    type: 'art',
    durationMinutes: 180,
    address: 'Providence, RI'
  },
  {
    id: 'julians',
    name: 'Julians',
    description: 'Dependable food stop for brunch or casual meal.',
    type: 'food',
    durationMinutes: 90,
    address: '318 Broadway, Providence, RI 02909'
  },
  {
    id: 'sturbridge-village',
    name: 'Old Sturbridge Village',
    description: 'Immersive 1830s living history museum.',
    type: 'living museum',
    durationMinutes: 240,
    address: '1 Old Sturbridge Village Rd, Sturbridge, MA 01566'
  },
  {
    id: 'tree-house-tewksbury',
    name: 'Tree House Brewing (Tewksbury)',
    description: 'Destination brewery for beer and pizza.',
    type: 'food',
    durationMinutes: 120,
    address: '1880 Main St, Tewksbury, MA 01876'
  },
  {
    id: '99-restaurant',
    name: '99 Restaurant',
    description: 'Practical local food option in Tewksbury.',
    type: 'food',
    durationMinutes: 60,
    address: 'Tewksbury, MA'
  },
  {
    id: 'burlington-mall',
    name: 'Burlington Mall',
    description: 'Convenient retail option for a casual shopping block.',
    type: 'shopping',
    durationMinutes: 120,
    address: '75 Middlesex Turnpike, Burlington, MA 01803'
  },
  {
    id: 'minuteman-park',
    name: 'Minute Man National Park',
    description: 'Revolutionary history with walking paths.',
    type: 'historical',
    durationMinutes: 120,
    address: '250 N Great Rd, Lincoln, MA 01773'
  },
  {
    id: 'walden-pond',
    name: 'Walden Pond',
    description: 'Peaceful nature stop for walking or swimming.',
    type: 'nature',
    durationMinutes: 90,
    address: '915 Walden St, Concord, MA 01742'
  }
];
