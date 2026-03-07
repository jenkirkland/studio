export interface Activity {
  id: string;
  name: string;
  description: string;
  type: 'nature' | 'food' | 'historical' | 'art' | 'entertainment' | 'shopping';
  durationMinutes: number;
  address: string;
  googleMapsUrl?: string;
}

export const ACTIVITIES: Activity[] = [
  {
    id: '1',
    name: 'Wamesit Lanes Family Entertainment Center',
    description: 'Bowling, golf simulators, and arcade fun in Tewksbury.',
    type: 'entertainment',
    durationMinutes: 120,
    address: '434 Main St, Tewksbury, MA 01876',
    googleMapsUrl: 'https://maps.app.goo.gl/qJp4XFvW7fQeQx8Q8'
  },
  {
    id: '2',
    name: 'Krochmal Farms',
    description: 'Beautiful farm with seasonal activities, horse-drawn hayrides.',
    type: 'nature',
    durationMinutes: 90,
    address: '31 Jennies Way, Tewksbury, MA 01876',
  },
  {
    id: '3',
    name: 'Tewksbury Public Library Gardens',
    description: 'Serene outdoor space for a quiet walk and reading.',
    type: 'nature',
    durationMinutes: 45,
    address: '300 Chandler St, Tewksbury, MA 01876',
  },
  {
    id: '4',
    name: 'Addison Gallery of American Art',
    description: 'One of the world\'s most comprehensive collections of American art.',
    type: 'art',
    durationMinutes: 90,
    address: '3 Chapel Ave, Andover, MA 01810',
  },
  {
    id: '5',
    name: 'Lowell National Historical Park',
    description: 'Explore the textile mill history of the Merrimack Valley.',
    type: 'historical',
    durationMinutes: 150,
    address: '67 Kirk St, Lowell, MA 01852',
  },
  {
    id: '6',
    name: 'Smolak Farms',
    description: 'Pick-your-own fruit, farm stand, and legendary cider donuts.',
    type: 'food',
    durationMinutes: 60,
    address: '315 S Bradford St, North Andover, MA 01845',
  },
  {
    id: '7',
    name: 'Boston North End Tour',
    description: 'Italian heritage, Paul Revere House, and amazing pastries.',
    type: 'historical',
    durationMinutes: 180,
    address: 'Hanover St, Boston, MA 02113',
  },
  {
    id: '8',
    name: 'Great Brook Farm State Park',
    description: 'Working dairy farm, ice cream stand, and miles of hiking trails.',
    type: 'nature',
    durationMinutes: 120,
    address: '165 Lowell Rd, Carlisle, MA 01741',
  },
  {
    id: '9',
    name: 'Merrimack Repertory Theatre',
    description: 'Regional theatre producing new and contemporary plays.',
    type: 'art',
    durationMinutes: 150,
    address: '50 E Merrimack St, Lowell, MA 01852',
  },
  {
    id: '10',
    name: 'The Claddagh Pub',
    description: 'Cozy Irish pub with local favorites and live music.',
    type: 'food',
    durationMinutes: 90,
    address: '399 Main St, Lawrence, MA 01841',
  }
];
